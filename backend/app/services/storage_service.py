"""Storage service — local filesystem backend with S3 abstraction stub."""
from __future__ import annotations

import os
import uuid
from pathlib import Path
from typing import Optional

import aiofiles

from app.core.config import settings
from app.core.logging import logger


def _safe_filename(original: str) -> str:
    """Return a UUID-prefixed safe filename preserving the extension."""
    ext = Path(original).suffix.lower()
    allowed_exts = {".jpg", ".jpeg", ".png", ".tiff", ".tif"}
    if ext not in allowed_exts:
        raise ValueError(f"Unsupported file extension: {ext}")
    return f"{uuid.uuid4()}{ext}"


class LocalStorage:
    def __init__(self, base_dir: str) -> None:
        self.base = Path(base_dir).resolve()
        self.base.mkdir(parents=True, exist_ok=True)

    async def save(self, data: bytes, subdir: str, original_name: str) -> str:
        """Save bytes to <base>/<subdir>/<uuid><ext>. Returns relative path."""
        dest_dir = self.base / subdir
        dest_dir.mkdir(parents=True, exist_ok=True)
        filename = _safe_filename(original_name)
        dest = dest_dir / filename
        async with aiofiles.open(dest, "wb") as f:
            await f.write(data)
        rel = str(Path(subdir) / filename)
        logger.debug("Stored file: %s", rel)
        return rel

    async def save_bytes(self, data: bytes, relative_path: str) -> str:
        """Save arbitrary bytes to a known relative path (e.g., reports, masks)."""
        dest = self.base / relative_path
        dest.parent.mkdir(parents=True, exist_ok=True)
        async with aiofiles.open(dest, "wb") as f:
            await f.write(data)
        return relative_path

    def full_path(self, relative: str) -> Path:
        return self.base / relative

    def url_path(self, relative: str) -> str:
        return f"/files/{relative.replace(os.sep, '/')}"


def get_storage() -> LocalStorage:
    return LocalStorage(settings.upload_dir)


storage = get_storage()
