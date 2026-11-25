from __future__ import annotations
import os
from typing import List
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # Application
    app_name: str = "CropWeedAI"
    app_env: str = "development"
    secret_key: str = "change-me-in-production-key-secret-cropweed"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 1440
    refresh_token_expire_days: int = 30

    # Database: fallback to local SQLite for single-command run
    database_url: str = "sqlite+aiosqlite:///./cropweedai.db"

    # Groq API for Agronomic AI analysis / intelligence
    groq_api_key: str = ""

    # Redis / Celery (Optional for full queue, local fallback for in-process async)
    redis_url: str = "redis://localhost:6379/0"
    celery_broker_url: str = "redis://localhost:6379/0"
    celery_result_backend: str = "redis://localhost:6379/1"

    # CORS
    cors_origins: str = "http://localhost:5173,http://localhost:5174,http://localhost:3000,http://127.0.0.1:5173"

    @property
    def cors_origins_list(self) -> List[str]:
        return [o.strip() for o in self.cors_origins.split(",")]

    # File Storage
    storage_backend: str = "local"
    upload_dir: str = "./uploads"
    max_upload_size_mb: int = 50

    @property
    def max_upload_size_bytes(self) -> int:
        return self.max_upload_size_mb * 1024 * 1024

    # ML Model
    unet_checkpoint_path: str = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "ml", "unet_best.pt")
    unet_num_classes: int = 3
    unet_input_size: int = 512
    unet_device: str = "cpu"

    @property
    def model_available(self) -> bool:
        if self.unet_checkpoint_path and os.path.isfile(self.unet_checkpoint_path):
            return True
        # Fallback to direct absolute path
        default_p = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "ml", "unet_best.pt")
        return os.path.isfile(default_p)

    # Email
    smtp_host: str = "smtp.gmail.com"
    smtp_port: int = 587
    smtp_user: str = ""
    smtp_password: str = ""
    email_from: str = "noreply@cropweedai.com"


settings = Settings()
