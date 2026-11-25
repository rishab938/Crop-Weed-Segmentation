"""FastAPI application entrypoint for Crop & Weed AI.

Supports both SQLite (local out-of-the-box) and PostgreSQL.
Includes healthcheck, auth, project management, analysis endpoints,
and agronomic intelligence with Groq LLM integration.

In production (Render), also serves the built React frontend as static files.
"""
from __future__ import annotations

import os
from contextlib import asynccontextmanager
from pathlib import Path
from typing import AsyncGenerator

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

from app.api.v1.router import api_router
from app.core.config import settings
from app.core.logging import logger
from app.db.base import Base
from app.db.session import engine, init_db

# Path to the Vite build output — sits at repo_root/dist
DIST_DIR = Path(__file__).resolve().parent.parent.parent / "dist"


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    logger.info("Initializing Crop & Weed AI Backend...")
    # Initialize DB tables and demo seed
    await init_db()
    os.makedirs(settings.upload_dir, exist_ok=True)
    # Load U-Net segmentation model
    from app.ml.model_loader import model_loader
    loaded = model_loader.load()
    if loaded:
        logger.info("U-Net model loaded and ready for inference.")
    else:
        logger.warning("U-Net model NOT loaded — inference endpoint will return 503.")
    yield
    logger.info("Shutting down Crop & Weed AI Backend...")


app = FastAPI(
    title=settings.app_name,
    description="Backend for Crop & Weed AI UAV Precision Spraying Platform",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API v1 router
app.include_router(api_router, prefix="/api/v1")


@app.get("/health", tags=["system"])
async def health_check():
    return {
        "status": "healthy",
        "app": settings.app_name,
        "environment": settings.app_env,
        "model_available": settings.model_available,
    }


# ─── Serve React frontend build in production ────────────────────────────────
# Mount /assets so Vite's hashed JS/CSS bundles are served directly.
# The catch-all route below returns index.html for all other paths so that
# React Router's client-side routing works.
if DIST_DIR.is_dir():
    assets_dir = DIST_DIR / "assets"
    if assets_dir.is_dir():
        app.mount("/assets", StaticFiles(directory=str(assets_dir)), name="assets")

    @app.get("/{full_path:path}")
    async def serve_react(full_path: str):
        # Try to serve a real file first (favicon, images, etc.)
        file_path = DIST_DIR / full_path
        if full_path and file_path.is_file():
            return FileResponse(str(file_path))
        # Fallback to index.html for client-side routing
        return FileResponse(str(DIST_DIR / "index.html"))
