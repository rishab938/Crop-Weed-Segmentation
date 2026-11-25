"""Processing service — creates Analysis + ProcessingJob, dispatches Celery task."""
from __future__ import annotations

import uuid
from datetime import datetime, timezone
from typing import Optional

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.logging import logger
from app.models.models import Analysis, ProcessingJob, Project

STAGE_NAMES = [
    "Upload", "Validation", "Preprocessing", "Segmentation",
    "Stitching", "Field Map", "Analysis", "Treatment", "Report",
]


def _initial_stages() -> list:
    return [
        {
            "id": i + 1,
            "name": name,
            "status": "queued",
            "completed_at": None,
            "error": None,
        }
        for i, name in enumerate(STAGE_NAMES)
    ]


class ProcessingService:

    async def create_analysis(
        self,
        db: AsyncSession,
        project: Project,
        model_version: str,
        confidence_threshold: float,
    ) -> Analysis:
        analysis = Analysis(
            project_id=project.id,
            model_version=model_version,
            confidence_threshold=confidence_threshold,
            status="queued",
        )
        db.add(analysis)
        await db.flush()

        job = ProcessingJob(
            analysis_id=analysis.id,
            status="queued",
            stages_data=_initial_stages(),
            logs=[],
        )
        db.add(job)
        await db.flush()

        # Update project status
        project.status = "processing"
        await db.flush()

        # Dispatch Celery task (import here to avoid circular at module load)
        try:
            from app.workers.tasks import run_pipeline
            task = run_pipeline.delay(str(analysis.id))
            job.celery_task_id = task.id
            await db.flush()
        except Exception as exc:
            logger.warning("Celery dispatch failed (is worker running?): %s", exc)

        logger.info("Analysis %s queued, job %s", analysis.id, job.id)
        return analysis

    async def get_status(self, db: AsyncSession, analysis_id: uuid.UUID, owner_id: uuid.UUID) -> ProcessingJob:
        job = await db.scalar(
            select(ProcessingJob)
            .join(Analysis)
            .join(Project)
            .where(
                ProcessingJob.analysis_id == analysis_id,
                Project.owner_id == owner_id,
            )
        )
        if not job:
            raise ValueError("not_found")
        return job

    async def get_logs(self, db: AsyncSession, analysis_id: uuid.UUID, owner_id: uuid.UUID) -> list:
        job = await self.get_status(db, analysis_id, owner_id)
        return job.logs or []

    async def retry(self, db: AsyncSession, analysis_id: uuid.UUID, owner_id: uuid.UUID) -> Analysis:
        analysis = await self._get_analysis(db, analysis_id, owner_id)
        job = analysis.processing_job
        if not job:
            raise ValueError("no_job")
        if job.status not in ("failed", "cancelled"):
            raise ValueError("not_retryable")

        # Reset failed stage back to queued
        stages = list(job.stages_data)
        for stage in stages:
            if stage["status"] == "failed":
                stage["status"] = "queued"
                stage["error"] = None
                break

        job.stages_data = stages
        job.status = "queued"
        job.retry_count += 1
        analysis.status = "queued"
        await db.flush()

        try:
            from app.workers.tasks import run_pipeline
            task = run_pipeline.delay(str(analysis.id))
            job.celery_task_id = task.id
        except Exception as exc:
            logger.warning("Celery retry dispatch failed: %s", exc)

        return analysis

    async def cancel(self, db: AsyncSession, analysis_id: uuid.UUID, owner_id: uuid.UUID) -> None:
        analysis = await self._get_analysis(db, analysis_id, owner_id)
        if analysis.status in ("completed",):
            raise ValueError("cannot_cancel_completed")

        analysis.status = "cancelled"
        job = analysis.processing_job
        if job:
            job.status = "cancelled"
            if job.celery_task_id:
                try:
                    from app.workers.celery_app import celery_app
                    celery_app.control.revoke(job.celery_task_id, terminate=True)
                except Exception:
                    pass

    async def _get_analysis(self, db: AsyncSession, analysis_id: uuid.UUID, owner_id: uuid.UUID) -> Analysis:
        analysis = await db.scalar(
            select(Analysis)
            .join(Project)
            .where(Analysis.id == analysis_id, Project.owner_id == owner_id)
        )
        if not analysis:
            raise ValueError("not_found")
        return analysis


processing_service = ProcessingService()
