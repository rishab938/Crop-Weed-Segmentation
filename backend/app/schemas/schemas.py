"""Pydantic request/response schemas — all entities."""
from __future__ import annotations

import uuid
from datetime import datetime
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, EmailStr, Field, field_validator


# ─── Shared helpers ──────────────────────────────────────────────────────────

class OrmBase(BaseModel):
    model_config = {"from_attributes": True}


# ─── Auth ────────────────────────────────────────────────────────────────────

class RegisterRequest(BaseModel):
    name: str = Field(min_length=1, max_length=200)
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)

    @field_validator("name")
    @classmethod
    def name_not_blank(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("name must not be blank")
        return v.strip()


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class RefreshRequest(BaseModel):
    refresh_token: str


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str = Field(min_length=8)


# ─── User ────────────────────────────────────────────────────────────────────

class UserOut(OrmBase):
    id: uuid.UUID
    name: str
    email: str
    role: str
    organization: Optional[str] = None
    is_active: bool
    created_at: datetime

    @property
    def initials(self) -> str:
        parts = self.name.split()
        return "".join(p[0].upper() for p in parts[:2]) if parts else "?"

    model_config = {"from_attributes": True}


class UserMeResponse(OrmBase):
    id: uuid.UUID
    name: str
    email: str
    role: str
    organization: Optional[str] = None
    initials: str = ""
    plan: str = "Free"

    @classmethod
    def from_user(cls, user: Any) -> "UserMeResponse":
        parts = user.name.split()
        initials = "".join(p[0].upper() for p in parts[:2]) if parts else "?"
        return cls(
            id=user.id,
            name=user.name,
            email=user.email,
            role=user.role,
            organization=user.organization,
            initials=initials,
            plan="Pro",
        )


class PatchUserRequest(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=200)
    email: Optional[EmailStr] = None
    role: Optional[str] = Field(None, max_length=100)
    organization: Optional[str] = Field(None, max_length=200)


# ─── UserSettings ────────────────────────────────────────────────────────────

class NotificationPrefsSchema(BaseModel):
    pipeline_success: bool = True
    pipeline_failure: bool = True
    weekly_digest: bool = False
    treatment_alerts: bool = True


class UserSettingsOut(OrmBase):
    measurement_units: str
    model_sensitivity: float
    notifications: NotificationPrefsSchema

    @classmethod
    def from_orm_obj(cls, obj: Any) -> "UserSettingsOut":
        return cls(
            measurement_units=obj.measurement_units,
            model_sensitivity=obj.model_sensitivity,
            notifications=NotificationPrefsSchema(
                pipeline_success=obj.notify_pipeline_success,
                pipeline_failure=obj.notify_pipeline_failure,
                weekly_digest=obj.notify_weekly_digest,
                treatment_alerts=obj.notify_treatment_alerts,
            ),
        )


class UpdateSettingsRequest(BaseModel):
    measurement_units: Optional[str] = None
    model_sensitivity: Optional[float] = Field(None, ge=0.0, le=1.0)
    notifications: Optional[NotificationPrefsSchema] = None


# ─── Notifications ───────────────────────────────────────────────────────────

class NotificationOut(OrmBase):
    id: uuid.UUID
    text: str
    read: bool
    created_at: datetime


class NotificationsResponse(BaseModel):
    items: List[NotificationOut]


# ─── Project ─────────────────────────────────────────────────────────────────

class CreateProjectRequest(BaseModel):
    name: str = Field(min_length=1, max_length=300)
    field_name: Optional[str] = Field(None, max_length=300)
    crop_type: Optional[str] = Field(None, max_length=100)
    growth_stage: Optional[str] = Field(None, max_length=50)
    flight_date: Optional[datetime] = None
    flight_altitude_m: Optional[float] = Field(None, gt=0)
    field_size_ha: Optional[float] = Field(None, gt=0)
    image_overlap_pct: Optional[float] = Field(None, ge=0, le=100)


class PatchProjectRequest(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=300)
    field_name: Optional[str] = None
    crop_type: Optional[str] = None
    growth_stage: Optional[str] = None
    flight_date: Optional[datetime] = None
    flight_altitude_m: Optional[float] = None
    field_size_ha: Optional[float] = None
    image_overlap_pct: Optional[float] = None


class ProjectSummary(OrmBase):
    id: uuid.UUID
    name: str
    field_name: Optional[str]
    status: str
    flight_date: Optional[datetime]
    image_count: int = 0
    weed_coverage: Optional[float] = None
    field_size_ha: Optional[float]
    analysis_id: Optional[uuid.UUID] = None
    created_at: datetime


class ProjectDetail(OrmBase):
    id: uuid.UUID
    name: str
    field_name: Optional[str]
    crop_type: Optional[str]
    growth_stage: Optional[str]
    flight_date: Optional[datetime]
    flight_altitude_m: Optional[float]
    field_size_ha: Optional[float]
    image_overlap_pct: Optional[float]
    camera_metadata: Optional[Dict[str, Any]]
    status: str
    latest_analysis_id: Optional[uuid.UUID] = None
    image_count: int = 0
    created_at: datetime
    updated_at: datetime


class ProjectListResponse(BaseModel):
    total: int
    items: List[ProjectSummary]


# ─── UploadedImage ───────────────────────────────────────────────────────────

class ImageOut(OrmBase):
    id: uuid.UUID
    original_filename: str
    file_format: Optional[str]
    width_px: Optional[int]
    height_px: Optional[int]
    file_size_bytes: Optional[int]
    has_gps: bool
    gps_latitude: Optional[float]
    gps_longitude: Optional[float]
    processing_status: str
    uploaded_at: datetime


class ImageListResponse(BaseModel):
    items: List[ImageOut]


# ─── Analysis ────────────────────────────────────────────────────────────────

class CreateAnalysisRequest(BaseModel):
    model_version: str = "unet_v1"
    confidence_threshold: float = Field(0.5, ge=0.0, le=1.0)
    image_overlap_pct: Optional[float] = Field(None, ge=0, le=100)


class AnalysisOut(OrmBase):
    id: uuid.UUID
    project_id: uuid.UUID
    project_name: Optional[str] = None
    field_name: Optional[str] = None
    flight_date: Optional[datetime] = None
    images_stitched: Optional[int] = None
    status: str
    weed_coverage_pct: Optional[float]
    crop_coverage_pct: Optional[float]
    background_pct: Optional[float]
    weed_density: Optional[str] = None
    weed_density_per_sqm: Optional[float] = None
    hotspot_count: Optional[int] = None
    largest_hotspot_ha: Optional[float] = None
    model_available: bool = False
    created_at: datetime


# ─── Pipeline / Job ──────────────────────────────────────────────────────────

class StageStatus(BaseModel):
    id: int
    name: str
    status: str   # queued|running|completed|failed|cancelled|skipped
    completed_at: Optional[str] = None
    error: Optional[str] = None


class PipelineStatusResponse(BaseModel):
    analysis_id: uuid.UUID
    overall_status: str
    progress_pct: int
    current_stage: Optional[str]
    stages: List[StageStatus]


class LogEntry(BaseModel):
    time: str
    level: str   # info|warning|error
    message: str


class LogsResponse(BaseModel):
    logs: List[LogEntry]


class RetryResponse(BaseModel):
    message: str
    analysis_id: uuid.UUID


# ─── Statistics / Zones / Hotspots ───────────────────────────────────────────

class DensityItem(BaseModel):
    label: str
    value: float


class StatisticsResponse(BaseModel):
    background_pixels: Optional[int]
    crop_pixels: Optional[int]
    weed_pixels: Optional[int]
    background_pct: float
    crop_pct: float
    weed_pct: float
    density_distribution: List[DensityItem]


class ZoneItem(BaseModel):
    id: str
    coverage_pct: float


class ZonesResponse(BaseModel):
    zones: List[ZoneItem]


class HotspotItem(BaseModel):
    id: int
    x_pct: float
    y_pct: float
    area_ha: Optional[float]
    severity: str   # Low|Medium|High
    weed_type: Optional[str] = None


class HotspotsResponse(BaseModel):
    hotspots: List[HotspotItem]


# ─── FieldMap ────────────────────────────────────────────────────────────────

class FieldMapOut(OrmBase):
    id: uuid.UUID
    analysis_id: uuid.UUID
    stitching_status: str
    gsd_cm_per_px: Optional[float]
    bounds: Optional[Dict[str, Any]]
    error_detail: Optional[str]
    created_at: datetime


# ─── TreatmentPlan ───────────────────────────────────────────────────────────

class WaypointSchema(BaseModel):
    id: int
    x_pct: float
    y_pct: float
    altitude_m: Optional[float]
    speed_kmh: Optional[float]
    action: str


class CreateTreatmentPlanRequest(BaseModel):
    weed_threshold_pct: float = Field(15.0, ge=0.0, le=100.0)
    path_pattern: str = "serpentine"


class TreatmentPlanOut(OrmBase):
    id: uuid.UUID
    analysis_id: uuid.UUID
    target_area_ha: Optional[float]
    total_field_ha: Optional[float]
    weed_threshold_pct: float
    treatment_zone_count: Optional[int]
    route_distance_km: Optional[float]
    estimated_coverage_pct: Optional[float]
    waypoint_count: Optional[int]
    path_pattern: str
    estimated_travel_time: Optional[str]
    chemical_savings_est_pct: Optional[float]
    waypoints: List[WaypointSchema] = []
    is_georeferenced: bool
    validation_status: str
    disclaimer: str = (
        "Image-space demonstration. Not ready for autonomous flight without georeferencing."
    )
    created_at: datetime


# ─── Report ──────────────────────────────────────────────────────────────────

class ReportSummary(OrmBase):
    id: uuid.UUID
    analysis_id: uuid.UUID
    project_name: Optional[str] = None
    field_name: Optional[str] = None
    date: Optional[str] = None
    weed_coverage_pct: Optional[float] = None
    status: str
    created_at: datetime


class ReportListResponse(BaseModel):
    total: int
    items: List[ReportSummary]


class ReportDetail(OrmBase):
    id: uuid.UUID
    analysis_id: uuid.UUID
    status: str
    report_format: str
    created_at: datetime


# ─── Dashboard ───────────────────────────────────────────────────────────────

class WeedTrendPoint(BaseModel):
    month: str
    coverage: float


class DashboardStats(BaseModel):
    total_projects: int
    images_analyzed: int
    fields_processed: int
    avg_weed_coverage_pct: float
    weed_trend: List[WeedTrendPoint]


class ActivityItem(BaseModel):
    id: int
    action: str
    project: str
    time: str
    type: str   # success|info|error|warning


class ActivityResponse(BaseModel):
    activities: List[ActivityItem]


# ─── Health ──────────────────────────────────────────────────────────────────

class HealthResponse(BaseModel):
    status: str
    app: str


class ReadinessResponse(BaseModel):
    status: str
    database: str
    redis: str
    model: str


# ─── Error ───────────────────────────────────────────────────────────────────

class ErrorDetail(BaseModel):
    detail: str
