"""Image upload service — validates, extracts metadata, persists UploadedImage rows."""
from __future__ import annotations

import io
from typing import List

from fastapi import UploadFile
from PIL import Image as PILImage
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.logging import logger
from app.models.models import UploadedImage
from app.services.storage_service import storage

ALLOWED_CONTENT_TYPES = {
    "image/jpeg", "image/jpg", "image/png", "image/tiff",
    "image/x-tiff", "image/x-canon-cr2",
}
ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".tiff", ".tif"}
MAX_BYTES = settings.max_upload_size_bytes


async def validate_and_save_image(
    db: AsyncSession,
    project_id,
    upload: UploadFile,
) -> UploadedImage:
    """Validate a single UploadFile, save to storage, and return a persisted UploadedImage."""
    original_name = upload.filename or "unknown"
    import pathlib
    ext = pathlib.Path(original_name).suffix.lower()

    if ext not in ALLOWED_EXTENSIONS:
        raise ValueError(f"Unsupported file type: {ext}")

    data = await upload.read()
    if len(data) > MAX_BYTES:
        raise ValueError(
            f"File '{original_name}' exceeds the {settings.max_upload_size_mb} MB limit"
        )

    # Validate it's actually an image
    try:
        img = PILImage.open(io.BytesIO(data))
        img.verify()
        img = PILImage.open(io.BytesIO(data))  # re-open after verify
        width, height = img.size
        fmt = img.format or ext.lstrip(".")
    except Exception as exc:
        raise ValueError(f"File '{original_name}' is not a valid image: {exc}")

    # Try GPS extraction (basic EXIF — no fabrication)
    gps_lat = gps_lon = gps_alt = None
    has_gps = False
    try:
        exif = img._getexif() if hasattr(img, "_getexif") else None
        if exif:
            from PIL.ExifTags import TAGS, GPSTAGS
            exif_data = {TAGS.get(k, k): v for k, v in exif.items()}
            gps_info = exif_data.get("GPSInfo")
            if gps_info:
                gps_d = {GPSTAGS.get(k, k): v for k, v in gps_info.items()}
                lat_d = gps_d.get("GPSLatitude")
                lon_d = gps_d.get("GPSLongitude")
                if lat_d and lon_d:
                    def dms_to_dd(dms, ref):
                        d, m, s = [float(x) for x in dms]
                        dd = d + m / 60 + s / 3600
                        return -dd if ref in ("S", "W") else dd
                    gps_lat = dms_to_dd(lat_d, gps_d.get("GPSLatitudeRef", "N"))
                    gps_lon = dms_to_dd(lon_d, gps_d.get("GPSLongitudeRef", "E"))
                    has_gps = True
    except Exception:
        pass  # GPS extraction is best-effort

    rel_path = await storage.save(data, f"images/{str(project_id)}", original_name)

    img_row = UploadedImage(
        project_id=project_id,
        original_filename=original_name,
        storage_path=rel_path,
        file_format=fmt.upper() if fmt else None,
        width_px=width,
        height_px=height,
        file_size_bytes=len(data),
        has_gps=has_gps,
        gps_latitude=gps_lat,
        gps_longitude=gps_lon,
        processing_status="validated",
    )
    db.add(img_row)
    await db.flush()
    logger.info("Image saved: %s -> %s", original_name, rel_path)
    return img_row
