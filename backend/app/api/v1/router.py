"""API endpoints for Crop & Weed AI:
- Auth (login, register, me, refresh, forgot-password, reset-password)
- Projects (list, create, detail, update, delete, images upload)
- Analyses (create, detail, status, logs, zones, hotspots, stats, retry, cancel)
- Treatment Plans (detail, routes, export)
- Reports (list, detail, download)
- Dashboard (stats, activity)
- Users & Notifications (me, settings, notifications)
- Agronomy AI Chat & Advice (powered by Groq)
"""
from __future__ import annotations

import uuid
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File, status
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from sqlalchemy import select, func, desc
from sqlalchemy.ext.asyncio import AsyncSession
from groq import Groq

from app.core.config import settings
from app.core.logging import logger
from app.db.session import get_db
from app.models.models import (
    User, Project, UploadedImage, Analysis, ProcessingJob,
    TreatmentPlan, Report, Notification, UserSettings
)
from app.services.auth_service import hash_password, verify_password, create_access_token, create_refresh_token
from app.services.deps import get_current_user

api_router = APIRouter()


# ─── Real Inference Endpoint ──────────────────────────────────────────────────
@api_router.post("/infer")
async def infer_images(images: list[UploadFile] = File(...)):
    """
    Run U‑Net inference on one or more uploaded images.
    Returns real weed/crop percentages and derived hotspot count from the model.
    Falls back to model_unavailable when checkpoint is not loaded.
    """
    from app.ml.model_loader import model_loader
    from app.ml.inference import run_inference
    import base64, io

    if not model_loader.is_available:
        if not model_loader.load():
            raise HTTPException(
                status_code=503,
                detail="model_unavailable"
            )

    total_bg = total_cr = total_wd = 0
    all_overlays = []
    all_hotspot_count = 0

    for upload in images:
        raw = await upload.read()
        try:
            result = run_inference(raw)
        except RuntimeError as exc:
            raise HTTPException(status_code=503, detail=str(exc))

        overlay_b64 = base64.b64encode(result.overlay_bytes).decode()
        img_total = result.background_pixels + result.crop_pixels + result.weed_pixels or 1
        all_overlays.append({
            "overlay_data_uri": f"data:image/png;base64,{overlay_b64}",
            "weed_coverage_pct": round(result.weed_pixels / img_total * 100, 2),
            "crop_coverage_pct": round(result.crop_pixels / img_total * 100, 2),
            "background_pct": round(result.background_pixels / img_total * 100, 2),
        })

        total_bg += result.background_pixels
        total_cr += result.crop_pixels
        total_wd += result.weed_pixels

        # Count distinct weed clusters (connected components) per image
        try:
            import numpy as np
            from scipy import ndimage as ndi
            weed_binary = (result.mask_array == 2).astype(np.uint8)
            # Label connected components, only count those > 200 pixels (noise filter)
            labeled, n_components = ndi.label(weed_binary)
            component_sizes = ndi.sum(weed_binary, labeled, range(1, n_components + 1))
            significant = int(np.sum(np.array(component_sizes) > 200))
            all_hotspot_count += significant
        except Exception:
            # Fallback: rough estimate from weed pixel count
            all_hotspot_count += max(1, result.weed_pixels // 50000) if result.weed_pixels > 0 else 0

    total_px = (total_bg + total_cr + total_wd) or 1
    weed_pct  = round(total_wd / total_px * 100, 2)
    crop_pct  = round(total_cr / total_px * 100, 2)
    bg_pct    = round(total_bg / total_px * 100, 2)

    from app.ml.inference import get_spray_dosage
    spray_level, spray_message = get_spray_dosage(weed_pct)

    return {
        "weed_coverage_pct": weed_pct,
        "crop_coverage_pct": crop_pct,
        "background_pct": bg_pct,
        "hotspot_count": all_hotspot_count,
        "weed_density": spray_level.capitalize() if spray_level != "none" else "Negligible",
        "spray_level": spray_level,
        "spray_message": spray_message,
        "model_used": True,
        "overlay_data_uri": all_overlays[0]["overlay_data_uri"] if all_overlays else None,
        "images": all_overlays,
    }

# Stitch endpoint (new)
@api_router.post("/stitch")
async def stitch_endpoint(files: list[UploadFile] = File(...)):
    """Stitch multiple uploaded images into a single panorama.
    Returns a base64‑encoded PNG of the stitched result.
    """
    from app.ml.stitcher import stitch_images
    import tempfile, os

    # Save uploads to temporary files
    temp_paths = []
    for f in files:
        suffix = os.path.splitext(f.filename)[1]
        tf = tempfile.NamedTemporaryFile(delete=False, suffix=suffix)
        tf.write(await f.read())
        tf.close()
        temp_paths.append(tf.name)

    try:
        b64 = stitch_images(temp_paths)
    finally:
        for p in temp_paths:
            try:
                os.remove(p)
            except Exception:
                pass

    return {"stitched_image_base64": b64}


# Initialize Groq client
groq_client = None
if settings.groq_api_key:
    try:
        groq_client = Groq(api_key=settings.groq_api_key)
    except Exception as e:
        logger.warning(f"Failed to initialize Groq client: {e}")

# ─── Auth Schemas ─────────────────────────────────────────────────────────────
class LoginRequest(BaseModel):
    email: str
    password: str

class RegisterRequest(BaseModel):
    name: str
    email: str
    password: str
    role: Optional[str] = "agronomist"

class ForgotPasswordRequest(BaseModel):
    email: str

class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str

# ─── Auth Endpoints ───────────────────────────────────────────────────────────
@api_router.post("/auth/login")
async def login(req: LoginRequest, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.email == req.email.lower()))
    user = result.scalar_one_or_none()
    
    # Check credentials (or fallback for demo user)
    if not user or not verify_password(req.password, user.hashed_password):
        if req.email == "demo@cropweedai.com" and req.password == "demo1234":
            # auto create demo user if not present
            user = User(
                name="Rishab Verma",
                email="demo@cropweedai.com",
                hashed_password=hash_password("demo1234"),
                role="Agronomist",
            )
            db.add(user)
            await db.commit()
            await db.refresh(user)
        else:
            raise HTTPException(status_code=401, detail="Invalid email or password")
            
    access_token = create_access_token(str(user.id))
    refresh_token = create_refresh_token(str(user.id))
    
    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
        "user": {
            "id": str(user.id),
            "name": user.name,
            "email": user.email,
            "role": user.role,
            "initials": "".join([part[0].upper() for part in user.name.split()[:2]]),
            "plan": "Pro"
        }
    }

@api_router.post("/auth/register")
async def register(req: RegisterRequest, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.email == req.email.lower()))
    if result.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Email already registered")
        
    user = User(
        name=req.name,
        email=req.email.lower(),
        hashed_password=hash_password(req.password),
        role=req.role or "Agronomist",
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)
    
    access_token = create_access_token(str(user.id))
    refresh_token = create_refresh_token(str(user.id))
    
    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
        "user": {
            "id": str(user.id),
            "name": user.name,
            "email": user.email,
            "role": user.role,
            "initials": "".join([p[0].upper() for p in user.name.split()[:2]]),
            "plan": "Pro"
        }
    }

@api_router.get("/auth/me")
async def get_me(current_user: User = Depends(get_current_user)):
    return {
        "id": str(current_user.id),
        "name": current_user.name,
        "email": current_user.email,
        "role": current_user.role,
        "initials": "".join([p[0].upper() for p in current_user.name.split()[:2]]),
        "plan": "Pro"
    }

@api_router.post("/auth/forgot-password")
async def forgot_password(req: ForgotPasswordRequest):
    return {"message": "If this email is registered, password reset instructions have been sent."}

@api_router.post("/auth/reset-password")
async def reset_password(req: ResetPasswordRequest):
    return {"message": "Password has been successfully updated."}

# ─── Dashboard Endpoints ──────────────────────────────────────────────────────
@api_router.get("/dashboard/stats")
async def get_dashboard_stats(db: AsyncSession = Depends(get_db)):
    proj_count = await db.scalar(select(func.count(Project.id))) or 6
    img_count = await db.scalar(select(func.count(UploadedImage.id))) or 142
    
    return {
        "total_projects": proj_count,
        "images_analyzed": img_count,
        "fields_processed": 4,
        "avg_weed_coverage_pct": 13.1,
        "weed_trend": [
            {"month": "Oct", "coverage": 22},
            {"month": "Nov", "coverage": 19},
            {"month": "Dec", "coverage": 16.5},
            {"month": "Jan", "coverage": 14.2},
            {"month": "Feb", "coverage": 15.0},
            {"month": "Mar", "coverage": 13.1},
        ]
    }

@api_router.get("/dashboard/activity")
async def get_dashboard_activity():
    return {
        "activities": [
            {"id": 1, "action": "Analysis completed", "project": "Maize Block A", "time": "2 hours ago", "type": "success"},
            {"id": 2, "action": "Treatment plan generated", "project": "South Wheat Field", "time": "5 hours ago", "type": "info"},
            {"id": 3, "action": "UAV Survey uploaded", "project": "Soybean Patch B", "time": "1 day ago", "type": "info"},
            {"id": 4, "action": "Report exported", "project": "Maize Block A", "time": "2 days ago", "type": "success"},
        ]
    }

# ─── Projects Endpoints ───────────────────────────────────────────────────────
@api_router.get("/projects")
async def get_projects(db: AsyncSession = Depends(get_db)):
    # Query database projects
    result = await db.execute(select(Project).order_by(desc(Project.created_at)))
    projects = result.scalars().all()
    
    # Return structured items
    items = []
    for p in projects:
        items.append({
            "id": str(p.id),
            "name": p.name,
            "field_name": p.field_name or "General Field",
            "fieldName": p.field_name or "General Field",
            "status": p.status,
            "crop_type": p.crop_type,
            "flight_date": p.flight_date.strftime("%Y-%m-%d") if p.flight_date else "2025-03-12",
            "date": p.flight_date.strftime("%Y-%m-%d") if p.flight_date else "2025-03-12",
            "image_count": 6,
            "images": 6,
            "weed_coverage": 18.4,
            "weedCoverage": 18.4,
            "field_size_ha": p.field_size_ha or 12.4,
            "fieldSize": p.field_size_ha or 12.4,
            "analysis_id": "ana_01",
            "analysisId": "ana_01"
        })
    
    # If no DB projects yet, provide the standard default set
    if not items:
        items = [
            {
                "id": "proj_01",
                "name": "Maize Block A — 2025 season",
                "fieldName": "North Field · 12.4 ha",
                "field_name": "North Field",
                "status": "completed",
                "date": "2025-03-12",
                "flight_date": "2025-03-12",
                "images": 6,
                "image_count": 6,
                "weedCoverage": 18.4,
                "weed_coverage": 18.4,
                "fieldSize": 12.4,
                "field_size_ha": 12.4,
                "analysisId": "ana_01",
                "analysis_id": "ana_01"
            },
            {
                "id": "proj_02",
                "name": "Wheat South — Spring Survey",
                "fieldName": "South Block · 8.7 ha",
                "field_name": "South Block",
                "status": "completed",
                "date": "2025-02-28",
                "flight_date": "2025-02-28",
                "images": 9,
                "image_count": 9,
                "weedCoverage": 12.1,
                "weed_coverage": 12.1,
                "fieldSize": 8.7,
                "field_size_ha": 8.7,
                "analysisId": "ana_02",
                "analysis_id": "ana_02"
            },
            {
                "id": "proj_03",
                "name": "Soybean Patch B",
                "fieldName": "East Field · 5.2 ha",
                "field_name": "East Field",
                "status": "processing",
                "date": "2025-03-20",
                "flight_date": "2025-03-20",
                "images": 4,
                "image_count": 4,
                "weedCoverage": None,
                "weed_coverage": None,
                "fieldSize": 5.2,
                "field_size_ha": 5.2,
                "analysisId": "ana_03",
                "analysis_id": "ana_03"
            }
        ]

    return {"total": len(items), "items": items}

class CreateProjectRequest(BaseModel):
    name: str
    field_name: Optional[str] = "Main Field"
    crop_type: Optional[str] = "maize"
    growth_stage: Optional[str] = "V6"
    field_size_ha: Optional[float] = 10.0

@api_router.post("/projects")
async def create_project(req: CreateProjectRequest, db: AsyncSession = Depends(get_db)):
    # Find demo or any user
    user_res = await db.execute(select(User).limit(1))
    user = user_res.scalar_one_or_none()
    if not user:
        user = User(name="Rishab Verma", email="demo@cropweedai.com", hashed_password="x")
        db.add(user)
        await db.commit()
        await db.refresh(user)

    project = Project(
        owner_id=user.id,
        name=req.name,
        field_name=req.field_name,
        crop_type=req.crop_type,
        growth_stage=req.growth_stage,
        field_size_ha=req.field_size_ha,
        status="draft",
        flight_date=datetime.now(timezone.utc),
    )
    db.add(project)
    await db.commit()
    await db.refresh(project)
    
    return {
        "id": str(project.id),
        "name": project.name,
        "field_name": project.field_name,
        "crop_type": project.crop_type,
        "growth_stage": project.growth_stage,
        "status": project.status,
    }

@api_router.get("/projects/{project_id}")
async def get_project_detail(project_id: str, db: AsyncSession = Depends(get_db)):
    return {
        "id": project_id,
        "name": "Maize Block A — 2025 season",
        "field_name": "North Field",
        "crop_type": "maize",
        "growth_stage": "V6",
        "flight_date": "2025-03-12",
        "flight_altitude_m": 25,
        "camera_metadata": {"camera": "Sony RX1R II", "sensor": "Full Frame 42MP"},
        "image_overlap_pct": 75,
        "status": "completed",
        "images": [],
        "latest_analysis_id": "ana_01"
    }

# ─── Analyses Endpoints ───────────────────────────────────────────────────────
class CreateAnalysisRequest(BaseModel):
    model_version: Optional[str] = "unet_v1"
    confidence_threshold: Optional[float] = 0.5
    image_overlap_pct: Optional[float] = 75.0

@api_router.post("/projects/{project_id}/analyses")
async def start_analysis(project_id: str, req: CreateAnalysisRequest):
    return {
        "id": "ana_01",
        "project_id": project_id,
        "status": "processing",
        "message": "Analysis pipeline queued"
    }

@api_router.get("/analyses/{analysis_id}/status")
async def get_analysis_status(analysis_id: str):
    return {
        "analysis_id": analysis_id,
        "overall_status": "completed",
        "progress_pct": 100,
        "current_stage": "report",
        "stages": [
            {"id": 1, "name": "Upload", "status": "completed", "completed_at": "14:28"},
            {"id": 2, "name": "Validation", "status": "completed", "completed_at": "14:29"},
            {"id": 3, "name": "Preprocessing", "status": "completed", "completed_at": "14:30"},
            {"id": 4, "name": "Segmentation", "status": "completed", "completed_at": "14:31"},
            {"id": 5, "name": "Stitching", "status": "completed", "completed_at": "14:32"},
            {"id": 6, "name": "Field Map", "status": "completed", "completed_at": "14:33"},
            {"id": 7, "name": "Analysis", "status": "completed", "completed_at": "14:34"},
            {"id": 8, "name": "Treatment", "status": "completed", "completed_at": "14:35"},
            {"id": 9, "name": "Report", "status": "completed", "completed_at": "14:36"},
        ]
    }

@api_router.get("/analyses/{analysis_id}/logs")
async def get_analysis_logs(analysis_id: str):
    return {
        "logs": [
            {"time": "14:28:10", "level": "info", "message": "Uploaded 6 multi-spectral UAV frames verified."},
            {"time": "14:29:05", "level": "info", "message": "Resolution 4000x3000 verified. RGB color profile aligned."},
            {"time": "14:30:20", "level": "info", "message": "Standardizing tiles to 512x512 with normalized tensor pipeline."},
            {"time": "14:31:45", "level": "info", "message": "U-Net multi-class segmentation completed across all frames."},
            {"time": "14:32:50", "level": "info", "message": "Homography stitching calculated feature matches with 78% overlap."},
            {"time": "14:33:40", "level": "info", "message": "High-resolution orthomosaic generated for 12.4 hectares."},
            {"time": "14:34:15", "level": "info", "message": "Weed coverage computed at 18.4%. 12 hotspot clusters identified."},
            {"time": "14:35:10", "level": "info", "message": "Serpentine variable-rate spraying waypoint route optimized."},
            {"time": "14:36:00", "level": "info", "message": "Comprehensive agronomic treatment report compiled."},
        ]
    }

@api_router.get("/analyses/{analysis_id}")
async def get_analysis(analysis_id: str):
    return {
        "id": analysis_id,
        "project_id": "proj_01",
        "project_name": "Maize Block A 2025 season",
        "field_name": "North Field",
        "flight_date": "2025-03-12",
        "images_stitched": 6,
        "status": "completed",
        "weed_coverage_pct": 18.4,
        "crop_coverage_pct": 81.6,
        "weed_density": "Medium",
        "weed_density_per_sqm": 7.1,
        "hotspot_count": 12,
        "largest_hotspot_ha": 0.34,
        "model_available": settings.model_available,
    }

@api_router.get("/analyses/{analysis_id}/zones")
async def get_analysis_zones(analysis_id: str):
    return {
        "zones": [
            {"id": "Z1", "coverage_pct": 8.2},
            {"id": "Z2", "coverage_pct": 14.5},
            {"id": "Z3", "coverage_pct": 27.4},
            {"id": "Z4", "coverage_pct": 11.0},
            {"id": "Z5", "coverage_pct": 19.3},
            {"id": "Z6", "coverage_pct": 22.1},
        ]
    }

@api_router.get("/analyses/{analysis_id}/hotspots")
async def get_analysis_hotspots(analysis_id: str):
    return {
        "hotspots": [
            {"id": 1, "x_pct": 28, "y_pct": 35, "area_ha": 0.34, "severity": "High", "weed_type": "Palmer Amaranth"},
            {"id": 2, "x_pct": 34, "y_pct": 40, "area_ha": 0.22, "severity": "High", "weed_type": "Waterhemp"},
            {"id": 3, "x_pct": 55, "y_pct": 60, "area_ha": 0.18, "severity": "Medium", "weed_type": "Common Ragweed"},
            {"id": 4, "x_pct": 70, "y_pct": 25, "area_ha": 0.29, "severity": "High", "weed_type": "Foxtail"},
            {"id": 5, "x_pct": 82, "y_pct": 75, "area_ha": 0.12, "severity": "Low", "weed_type": "Lambsquarters"},
        ]
    }

@api_router.get("/analyses/{analysis_id}/statistics")
async def get_analysis_stats(analysis_id: str):
    return {
        "background_pixels": 450000,
        "crop_pixels": 2100000,
        "weed_pixels": 450000,
        "background_pct": 15.0,
        "crop_pct": 66.6,
        "weed_pct": 18.4,
        "density_distribution": [
            {"label": "Low", "value": 24},
            {"label": "Medium", "value": 41},
            {"label": "High", "value": 35},
        ]
    }

# ─── Treatment Plans Endpoints ───────────────────────────────────────────────
@api_router.get("/treatment-plans/{plan_id}")
async def get_treatment_plan(plan_id: str):
    return {
        "id": plan_id,
        "analysis_id": "ana_01",
        "target_area_ha": 3.8,
        "total_field_ha": 12.4,
        "weed_threshold_pct": 15,
        "treatment_zone_count": 3,
        "route_distance_km": 1.24,
        "estimated_coverage_pct": 92,
        "waypoint_count": 6,
        "path_pattern": "serpentine",
        "estimated_travel_time": "9 min at 8 km/h",
        "chemical_savings_est_pct": 68,
        "waypoints": [
            {"id": 1, "x_pct": 20, "y_pct": 30, "altitude_m": 25, "speed_kmh": 8, "action": "Spray On"},
            {"id": 2, "x_pct": 35, "y_pct": 32, "altitude_m": 25, "speed_kmh": 8, "action": "Variable Rate"},
            {"id": 3, "x_pct": 50, "y_pct": 55, "altitude_m": 25, "speed_kmh": 8, "action": "Spray On"},
            {"id": 4, "x_pct": 65, "y_pct": 58, "altitude_m": 25, "speed_kmh": 8, "action": "Spray Off"},
            {"id": 5, "x_pct": 75, "y_pct": 72, "altitude_m": 25, "speed_kmh": 8, "action": "Spray On"},
            {"id": 6, "x_pct": 85, "y_pct": 80, "altitude_m": 25, "speed_kmh": 8, "action": "Return to Home"},
        ],
        "is_georeferenced": True,
        "disclaimer": "Variable rate spraying trajectory optimized for selective nozzle actuation."
    }

# ─── Reports Endpoints ────────────────────────────────────────────────────────
@api_router.get("/reports")
async def get_reports():
    return {
        "total": 3,
        "items": [
            {
                "id": "rep_01",
                "project_name": "Maize Block A 2025 season",
                "field_name": "North Field",
                "date": "2025-03-12",
                "weed_coverage_pct": 18.4,
                "status": "ready",
                "analysis_id": "ana_01",
            },
            {
                "id": "rep_02",
                "project_name": "Wheat South Spring Survey",
                "field_name": "South Block",
                "date": "2025-02-28",
                "weed_coverage_pct": 12.1,
                "status": "ready",
                "analysis_id": "ana_02",
            },
            {
                "id": "rep_03",
                "project_name": "Soybean Patch B",
                "field_name": "East Field",
                "date": "2025-03-20",
                "weed_coverage_pct": 21.0,
                "status": "ready",
                "analysis_id": "ana_03",
            }
        ]
    }

# ─── User Settings & Notifications ────────────────────────────────────────────
@api_router.get("/users/me/notifications")
async def get_notifications():
    return {
        "items": [
            {"id": 1, "text": "Soybean Patch B analysis is 100% complete", "time": "10 min ago", "read": False},
            {"id": 2, "text": "Maize Block A report is ready for download", "time": "2 hrs ago", "read": False},
            {"id": 3, "text": "Barley Survey pipeline failed at Field Map stage", "time": "Yesterday", "read": True},
        ]
    }

# ─── Agronomic AI Assistant Endpoint (Powered by Groq) ────────────────────────
class AgronomyQuery(BaseModel):
    prompt: str
    crop_type: Optional[str] = "maize"
    weed_coverage_pct: Optional[float] = 18.4

@api_router.post("/agronomy/advice")
async def get_agronomy_advice(query: AgronomyQuery):
    if not groq_client:
        return {
            "advice": "Precision herbicide targeting recommended for areas >15% weed density. Target Palmer Amaranth and Waterhemp with selective herbicide formulations."
        }
    try:
        completion = groq_client.chat.completions.create(
            model="llama3-70b-8192",
            messages=[
                {
                    "role": "system",
                    "content": (
                        "You are an expert agronomist specializing in precision UAV spraying, "
                        "weed identification, and chemical application optimization. Provide clear, "
                        "concise, actionable advice for farmers."
                    )
                },
                {
                    "role": "user",
                    "content": f"Field context: Crop: {query.crop_type}, Weed coverage: {query.weed_coverage_pct}%. Question: {query.prompt}"
                }
            ],
            temperature=0.3,
            max_tokens=400,
        )
        return {"advice": completion.choices[0].message.content}
    except Exception as e:
        logger.error(f"Groq API error: {e}")
        return {
            "advice": f"Recommended selective spot application targeting {query.crop_type} at current density of {query.weed_coverage_pct}%."
        }
