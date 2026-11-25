"""SQLAlchemy ORM models — complete schema for all entities."""
from __future__ import annotations

import uuid
from datetime import datetime, timezone
from typing import Optional

from sqlalchemy import (
    Boolean, DateTime, Enum, Float, ForeignKey, Integer,
    JSON, String, Text, UniqueConstraint,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


def _now() -> datetime:
    return datetime.now(timezone.utc)


def _uuid() -> uuid.UUID:
    return uuid.uuid4()


# ─── User ────────────────────────────────────────────────────────────────────

class User(Base):
    __tablename__ = "users"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=_uuid)
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    email: Mapped[str] = mapped_column(String(320), nullable=False, unique=True, index=True)
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[str] = mapped_column(String(100), default="agronomist")
    organization: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now, onupdate=_now)

    projects: Mapped[list["Project"]] = relationship(back_populates="owner", cascade="all, delete-orphan")
    settings: Mapped[Optional["UserSettings"]] = relationship(back_populates="user", uselist=False, cascade="all, delete-orphan")
    refresh_tokens: Mapped[list["RefreshToken"]] = relationship(back_populates="user", cascade="all, delete-orphan")
    notifications: Mapped[list["Notification"]] = relationship(back_populates="user", cascade="all, delete-orphan")
    password_reset_tokens: Mapped[list["PasswordResetToken"]] = relationship(back_populates="user", cascade="all, delete-orphan")


class RefreshToken(Base):
    __tablename__ = "refresh_tokens"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=_uuid)
    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    token_hash: Mapped[str] = mapped_column(String(255), nullable=False, unique=True)
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    revoked: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now)

    user: Mapped["User"] = relationship(back_populates="refresh_tokens")


class PasswordResetToken(Base):
    __tablename__ = "password_reset_tokens"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=_uuid)
    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    token_hash: Mapped[str] = mapped_column(String(255), nullable=False, unique=True)
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    used: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now)

    user: Mapped["User"] = relationship(back_populates="password_reset_tokens")


class UserSettings(Base):
    __tablename__ = "user_settings"

    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), primary_key=True)
    measurement_units: Mapped[str] = mapped_column(String(20), default="metric")
    model_sensitivity: Mapped[float] = mapped_column(Float, default=0.5)
    notify_pipeline_success: Mapped[bool] = mapped_column(Boolean, default=True)
    notify_pipeline_failure: Mapped[bool] = mapped_column(Boolean, default=True)
    notify_weekly_digest: Mapped[bool] = mapped_column(Boolean, default=False)
    notify_treatment_alerts: Mapped[bool] = mapped_column(Boolean, default=True)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now, onupdate=_now)

    user: Mapped["User"] = relationship(back_populates="settings")


class Notification(Base):
    __tablename__ = "notifications"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=_uuid)
    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    text: Mapped[str] = mapped_column(Text, nullable=False)
    read: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now)

    user: Mapped["User"] = relationship(back_populates="notifications")


# ─── Project ─────────────────────────────────────────────────────────────────

class Project(Base):
    __tablename__ = "projects"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=_uuid)
    owner_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    name: Mapped[str] = mapped_column(String(300), nullable=False)
    field_name: Mapped[Optional[str]] = mapped_column(String(300), nullable=True)
    crop_type: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    growth_stage: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    flight_date: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    flight_altitude_m: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    field_size_ha: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    image_overlap_pct: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    camera_metadata: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)
    # draft | processing | completed | failed
    status: Mapped[str] = mapped_column(String(30), default="draft")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now, onupdate=_now)

    owner: Mapped["User"] = relationship(back_populates="projects")
    images: Mapped[list["UploadedImage"]] = relationship(back_populates="project", cascade="all, delete-orphan")
    analyses: Mapped[list["Analysis"]] = relationship(back_populates="project", cascade="all, delete-orphan")


# ─── UploadedImage ───────────────────────────────────────────────────────────

class UploadedImage(Base):
    __tablename__ = "uploaded_images"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=_uuid)
    project_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    original_filename: Mapped[str] = mapped_column(String(500), nullable=False)
    storage_path: Mapped[str] = mapped_column(String(1000), nullable=False)
    file_format: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    width_px: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    height_px: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    file_size_bytes: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    has_gps: Mapped[bool] = mapped_column(Boolean, default=False)
    gps_latitude: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    gps_longitude: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    gps_altitude_m: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    image_metadata: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)
    # pending | validated | invalid
    processing_status: Mapped[str] = mapped_column(String(30), default="pending")
    uploaded_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now)

    project: Mapped["Project"] = relationship(back_populates="images")
    segmentation_results: Mapped[list["SegmentationResult"]] = relationship(back_populates="source_image", cascade="all, delete-orphan")


# ─── Analysis ────────────────────────────────────────────────────────────────

class Analysis(Base):
    __tablename__ = "analyses"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=_uuid)
    project_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    model_version: Mapped[str] = mapped_column(String(100), default="unet_v1")
    confidence_threshold: Mapped[float] = mapped_column(Float, default=0.5)
    # queued | processing | completed | failed | cancelled
    status: Mapped[str] = mapped_column(String(30), default="queued")
    error_detail: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    started_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    completed_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now, onupdate=_now)

    project: Mapped["Project"] = relationship(back_populates="analyses")
    processing_job: Mapped[Optional["ProcessingJob"]] = relationship(back_populates="analysis", uselist=False, cascade="all, delete-orphan")
    segmentation_results: Mapped[list["SegmentationResult"]] = relationship(back_populates="analysis", cascade="all, delete-orphan")
    field_map: Mapped[Optional["FieldMap"]] = relationship(back_populates="analysis", uselist=False, cascade="all, delete-orphan")
    treatment_plans: Mapped[list["TreatmentPlan"]] = relationship(back_populates="analysis", cascade="all, delete-orphan")
    reports: Mapped[list["Report"]] = relationship(back_populates="analysis", cascade="all, delete-orphan")
    # Aggregated results (populated after Analysis stage)
    weed_coverage_pct: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    crop_coverage_pct: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    background_pct: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    weed_density_label: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    weed_density_per_sqm: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    hotspot_count: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    largest_hotspot_ha: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    zones_data: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)
    hotspots_data: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)
    density_distribution: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)
    images_stitched: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)


# ─── ProcessingJob ───────────────────────────────────────────────────────────

class ProcessingJob(Base):
    __tablename__ = "processing_jobs"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=_uuid)
    analysis_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("analyses.id", ondelete="CASCADE"), nullable=False, unique=True)
    celery_task_id: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    current_stage: Mapped[int] = mapped_column(Integer, default=1)  # 1-9
    current_stage_name: Mapped[str] = mapped_column(String(100), default="Upload")
    # queued | processing | completed | failed | cancelled
    status: Mapped[str] = mapped_column(String(30), default="queued")
    progress_pct: Mapped[int] = mapped_column(Integer, default=0)
    stages_data: Mapped[dict] = mapped_column(JSON, default=list)   # list of stage state dicts
    logs: Mapped[list] = mapped_column(JSON, default=list)
    retry_count: Mapped[int] = mapped_column(Integer, default=0)
    error_detail: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    started_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    completed_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now)

    analysis: Mapped["Analysis"] = relationship(back_populates="processing_job")


# ─── SegmentationResult ──────────────────────────────────────────────────────

class SegmentationResult(Base):
    __tablename__ = "segmentation_results"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=_uuid)
    analysis_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("analyses.id", ondelete="CASCADE"), nullable=False)
    source_image_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("uploaded_images.id", ondelete="CASCADE"), nullable=False)
    mask_path: Mapped[Optional[str]] = mapped_column(String(1000), nullable=True)
    overlay_path: Mapped[Optional[str]] = mapped_column(String(1000), nullable=True)
    background_pixels: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    crop_pixels: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    weed_pixels: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    background_pct: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    crop_pct: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    weed_pct: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    inference_time_ms: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    inference_meta: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now)

    analysis: Mapped["Analysis"] = relationship(back_populates="segmentation_results")
    source_image: Mapped["UploadedImage"] = relationship(back_populates="segmentation_results")


# ─── FieldMap ────────────────────────────────────────────────────────────────

class FieldMap(Base):
    __tablename__ = "field_maps"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=_uuid)
    analysis_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("analyses.id", ondelete="CASCADE"), nullable=False, unique=True)
    map_path: Mapped[Optional[str]] = mapped_column(String(1000), nullable=True)
    srs: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)
    bounds: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)
    gsd_cm_per_px: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    alignment_quality: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)
    # pending | completed | failed
    stitching_status: Mapped[str] = mapped_column(String(30), default="pending")
    error_detail: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now)

    analysis: Mapped["Analysis"] = relationship(back_populates="field_map")


# ─── TreatmentPlan ───────────────────────────────────────────────────────────

class TreatmentPlan(Base):
    __tablename__ = "treatment_plans"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=_uuid)
    analysis_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("analyses.id", ondelete="CASCADE"), nullable=False)
    weed_threshold_pct: Mapped[float] = mapped_column(Float, default=15.0)
    path_pattern: Mapped[str] = mapped_column(String(50), default="serpentine")
    target_area_ha: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    total_field_ha: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    treatment_zone_count: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    route_distance_km: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    estimated_coverage_pct: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    waypoint_count: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    estimated_travel_time: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    chemical_savings_est_pct: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    waypoints_data: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)
    hotspot_refs: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)
    is_georeferenced: Mapped[bool] = mapped_column(Boolean, default=False)
    # draft | validated | exported
    validation_status: Mapped[str] = mapped_column(String(30), default="draft")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now)

    analysis: Mapped["Analysis"] = relationship(back_populates="treatment_plans")


# ─── Report ──────────────────────────────────────────────────────────────────

class Report(Base):
    __tablename__ = "reports"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=_uuid)
    analysis_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("analyses.id", ondelete="CASCADE"), nullable=False)
    report_format: Mapped[str] = mapped_column(String(20), default="pdf")
    storage_path: Mapped[Optional[str]] = mapped_column(String(1000), nullable=True)
    # generating | ready | failed
    status: Mapped[str] = mapped_column(String(30), default="generating")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now)

    analysis: Mapped["Analysis"] = relationship(back_populates="reports")
