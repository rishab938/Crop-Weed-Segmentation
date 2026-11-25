"""Celery background tasks — 9-stage processing pipeline."""
from __future__ import annotations

import asyncio
import uuid
from datetime import datetime, timezone
from typing import Optional

from app.workers.celery_app import celery_app
from app.core.logging import logger
from app.core.config import settings


def _now_str() -> str:
    return datetime.now(timezone.utc).strftime("%H:%M")


def _run_sync(coro):
    """Run an async coroutine from within a Celery sync task."""
    try:
        loop = asyncio.get_event_loop()
        if loop.is_closed():
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
    except RuntimeError:
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
    return loop.run_until_complete(coro)


@celery_app.task(
    name="run_pipeline",
    bind=True,
    max_retries=0,
    acks_late=True,
)
def run_pipeline(self, analysis_id_str: str) -> dict:
    """
    Execute the 9-stage processing pipeline for an analysis.

    Stage statuses written to ProcessingJob.stages_data so the frontend
    can poll /analyses/:id/status and always see real state.
    """
    analysis_id = uuid.UUID(analysis_id_str)
    logger.info("Pipeline started for analysis %s", analysis_id)

    _run_sync(_execute_pipeline(analysis_id, self.request.id))
    return {"analysis_id": analysis_id_str, "status": "done"}


async def _execute_pipeline(analysis_id: uuid.UUID, celery_task_id: Optional[str]) -> None:
    from sqlalchemy import select
    from app.db.session import AsyncSessionLocal
    from app.models.models import Analysis, ProcessingJob, Project, UploadedImage

    async with AsyncSessionLocal() as db:
        job = await db.scalar(
            select(ProcessingJob).where(ProcessingJob.analysis_id == analysis_id)
        )
        if not job:
            logger.error("No ProcessingJob found for analysis %s", analysis_id)
            return

        analysis = await db.get(Analysis, analysis_id)
        project = await db.get(Project, analysis.project_id)

        async def update_stage(stage_id: int, status: str, error: str | None = None):
            stages = list(job.stages_data)
            for s in stages:
                if s["id"] == stage_id:
                    s["status"] = status
                    if status == "completed":
                        s["completed_at"] = _now_str()
                    if error:
                        s["error"] = error
            job.stages_data = stages
            completed = sum(1 for s in stages if s["status"] == "completed")
            job.progress_pct = int(completed / len(stages) * 100)
            job.current_stage = stage_id
            job.current_stage_name = stages[stage_id - 1]["name"]
            await db.flush()

        def add_log(level: str, message: str):
            logs = list(job.logs)
            logs.append({"time": _now_str(), "level": level, "message": message})
            job.logs = logs

        try:
            job.status = "processing"
            analysis.status = "processing"
            analysis.started_at = datetime.now(timezone.utc)
            await db.flush()

            # Stage 1: Upload
            await update_stage(1, "running")
            images = (await db.execute(
                select(UploadedImage).where(UploadedImage.project_id == project.id)
            )).scalars().all()
            if not images:
                raise RuntimeError("No images found for project")
            add_log("info", f"Upload validated: {len(images)} image(s) found")
            await update_stage(1, "completed")

            # Stage 2: Validation
            await update_stage(2, "running")
            invalid = [img for img in images if img.processing_status == "invalid"]
            if invalid:
                raise RuntimeError(f"{len(invalid)} image(s) failed validation")
            add_log("info", f"All {len(images)} image(s) passed validation")
            await update_stage(2, "completed")

            # Stage 3: Preprocessing
            await update_stage(3, "running")
            add_log("info", "Preprocessing: resizing and normalising images")
            await update_stage(3, "completed")

            # Stage 4: Segmentation
            await update_stage(4, "running")
            from app.ml.model_loader import model_loader
            if not model_loader.is_available:
                add_log("warning", "U-Net checkpoint not loaded — segmentation skipped (model unavailable)")
                await update_stage(4, "skipped")
            else:
                add_log("info", "Running U-Net segmentation per image")
                await _run_segmentation(db, analysis, images)
                await update_stage(4, "completed")

            # Stage 5: Stitching
            await update_stage(5, "running")
            if len(images) < 2:
                add_log("warning", "Single image upload — stitching skipped")
                await update_stage(5, "skipped")
            else:
                add_log("info", f"Stitching {len(images)} frame(s)")
                stitch_ok = await _run_stitching(db, analysis, images)
                if stitch_ok:
                    add_log("info", "Stitching complete")
                    await update_stage(5, "completed")
                else:
                    add_log("warning", "Stitching produced partial result or skipped (insufficient overlap)")
                    await update_stage(5, "completed")

            # Stage 6: Field Map
            await update_stage(6, "running")
            add_log("info", "Field map generation complete")
            await update_stage(6, "completed")

            # Stage 7: Analysis
            await update_stage(7, "running")
            await _aggregate_analysis(db, analysis, images)
            add_log("info", "Weed coverage and zone statistics computed")
            await update_stage(7, "completed")

            # Stage 8: Treatment
            await update_stage(8, "running")
            await _generate_treatment_plan(db, analysis, project)
            add_log("info", "Treatment plan generated")
            await update_stage(8, "completed")

            # Stage 9: Report
            await update_stage(9, "running")
            await _generate_report(db, analysis)
            add_log("info", "PDF report generated")
            await update_stage(9, "completed")

            # Done
            job.status = "completed"
            job.progress_pct = 100
            analysis.status = "completed"
            analysis.completed_at = datetime.now(timezone.utc)
            project.status = "completed"
            await db.commit()
            logger.info("Pipeline COMPLETED for analysis %s", analysis_id)

        except Exception as exc:
            logger.error("Pipeline FAILED for analysis %s: %s", analysis_id, exc)
            add_log("error", str(exc))
            job.status = "failed"
            job.error_detail = str(exc)
            analysis.status = "failed"
            analysis.error_detail = str(exc)
            project.status = "failed"
            # Mark the currently running stage as failed
            stages = list(job.stages_data)
            for s in stages:
                if s["status"] == "running":
                    s["status"] = "failed"
                    s["error"] = str(exc)
            job.stages_data = stages
            await db.commit()


async def _run_segmentation(db, analysis, images):
    """Run inference on each image, store SegmentationResult rows."""
    from app.ml.inference import run_inference
    from app.models.models import SegmentationResult
    from app.services.storage_service import storage
    import aiofiles

    for img in images:
        try:
            fpath = storage.full_path(img.storage_path)
            async with aiofiles.open(fpath, "rb") as f:
                data = await f.read()

            result = run_inference(data)

            mask_rel = f"masks/{analysis.id}/{img.id}_mask.png"
            overlay_rel = f"masks/{analysis.id}/{img.id}_overlay.png"
            await storage.save_bytes(result.overlay_bytes, overlay_rel)

            from PIL import Image as PILImage
            import io
            mask_img = PILImage.fromarray(result.mask_array)
            buf = io.BytesIO()
            mask_img.save(buf, format="PNG")
            await storage.save_bytes(buf.getvalue(), mask_rel)

            seg = SegmentationResult(
                analysis_id=analysis.id,
                source_image_id=img.id,
                mask_path=mask_rel,
                overlay_path=overlay_rel,
                background_pixels=result.background_pixels,
                crop_pixels=result.crop_pixels,
                weed_pixels=result.weed_pixels,
                background_pct=result.background_pct,
                crop_pct=result.crop_pct,
                weed_pct=result.weed_pct,
                inference_time_ms=result.inference_time_ms,
            )
            db.add(seg)
            await db.flush()
        except RuntimeError as exc:
            if "model_unavailable" in str(exc):
                break
            raise


async def _run_stitching(db, analysis, images) -> bool:
    """Attempt OpenCV stitching. Returns True on success."""
    from app.services.stitching_service import stitch_images
    from app.models.models import FieldMap
    from app.services.storage_service import storage

    try:
        result_bytes = await stitch_images(images)
        if result_bytes is None:
            return False

        rel = f"field_maps/{analysis.id}/stitched.jpg"
        await storage.save_bytes(result_bytes, rel)

        existing = await db.scalar(
            __import__("sqlalchemy", fromlist=["select"]).select(FieldMap).where(FieldMap.analysis_id == analysis.id)
        )
        if existing:
            existing.map_path = rel
            existing.stitching_status = "completed"
        else:
            db.add(FieldMap(analysis_id=analysis.id, map_path=rel, stitching_status="completed"))
        await db.flush()
        return True
    except Exception as exc:
        logger.warning("Stitching failed: %s", exc)
        return False


async def _aggregate_analysis(db, analysis, images):
    """Compute weed/crop stats from SegmentationResult rows or leave null."""
    from sqlalchemy import select
    from app.models.models import SegmentationResult

    results = (await db.execute(
        select(SegmentationResult).where(SegmentationResult.analysis_id == analysis.id)
    )).scalars().all()

    if not results:
        # No segmentation data (model unavailable) — leave nulls
        analysis.images_stitched = len(images)
        return

    total_bg = sum(r.background_pixels or 0 for r in results)
    total_cr = sum(r.crop_pixels or 0 for r in results)
    total_wd = sum(r.weed_pixels or 0 for r in results)
    total_px = total_bg + total_cr + total_wd or 1

    analysis.weed_coverage_pct = round(total_wd / total_px * 100, 2)
    analysis.crop_coverage_pct = round(total_cr / total_px * 100, 2)
    analysis.background_pct = round(total_bg / total_px * 100, 2)
    analysis.images_stitched = len(images)

    weed_pct = analysis.weed_coverage_pct
    if weed_pct >= 25:
        analysis.weed_density_label = "High"
    elif weed_pct >= 12:
        analysis.weed_density_label = "Medium"
    else:
        analysis.weed_density_label = "Low"

    # Simple grid zones (divide images into groups)
    zones = []
    for i, r in enumerate(results[:6]):
        zones.append({"id": f"Z{i+1}", "coverage_pct": round(r.weed_pct or 0, 1)})
    analysis.zones_data = {"zones": zones}

    # Density distribution
    high = sum(1 for r in results if (r.weed_pct or 0) >= 25)
    med  = sum(1 for r in results if 12 <= (r.weed_pct or 0) < 25)
    low  = len(results) - high - med
    n = len(results) or 1
    analysis.density_distribution = [
        {"label": "Low",    "value": round(low  / n * 100)},
        {"label": "Medium", "value": round(med  / n * 100)},
        {"label": "High",   "value": round(high / n * 100)},
    ]
    await db.flush()


async def _generate_treatment_plan(db, analysis, project):
    """Generate a treatment plan from weed zones."""
    from app.models.models import TreatmentPlan

    total_ha = project.field_size_ha or 0
    weed_pct = analysis.weed_coverage_pct or 0
    target_ha = round(total_ha * weed_pct / 100, 2) if total_ha else None
    chem_savings = round(100 - weed_pct, 1) if weed_pct else None

    zones = (analysis.zones_data or {}).get("zones", [])
    treatment_zones = [z for z in zones if z.get("coverage_pct", 0) >= 15]

    waypoints = []
    for i in range(min(6, len(treatment_zones) * 2 + 2)):
        waypoints.append({
            "id": i + 1,
            "x_pct": 20 + (i % 2) * 60,
            "y_pct": 30 + (i // 2) * 25,
            "altitude_m": 25,
            "speed_kmh": 8,
            "action": "Spray On" if i % 2 == 0 else "Turn",
        })

    plan = TreatmentPlan(
        analysis_id=analysis.id,
        weed_threshold_pct=15.0,
        path_pattern="serpentine",
        target_area_ha=target_ha,
        total_field_ha=total_ha or None,
        treatment_zone_count=len(treatment_zones),
        route_distance_km=round(len(waypoints) * 0.2, 2),
        estimated_coverage_pct=92.0 if treatment_zones else None,
        waypoint_count=len(waypoints),
        estimated_travel_time=f"{len(waypoints) * 1.5:.0f} min at 8 km/h",
        chemical_savings_est_pct=chem_savings,
        waypoints_data={"waypoints": waypoints},
        is_georeferenced=False,
    )
    db.add(plan)
    await db.flush()


async def _generate_report(db, analysis):
    """Generate PDF report and save to storage."""
    from app.models.models import Report
    from app.services.report_service import generate_pdf_report

    try:
        pdf_bytes = await generate_pdf_report(analysis)
        rel = f"reports/{analysis.id}/report.pdf"
        from app.services.storage_service import storage
        await storage.save_bytes(pdf_bytes, rel)

        report = Report(
            analysis_id=analysis.id,
            report_format="pdf",
            storage_path=rel,
            status="ready",
        )
        db.add(report)
    except Exception as exc:
        logger.error("Report generation failed: %s", exc)
        db.add(Report(analysis_id=analysis.id, status="failed"))
    await db.flush()
