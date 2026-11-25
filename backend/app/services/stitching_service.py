"""OpenCV-based orthomosaic stitching service."""
from __future__ import annotations

import io
from typing import Optional

from app.core.logging import logger


async def stitch_images(images) -> Optional[bytes]:
    """
    Stitch uploaded images using OpenCV Stitcher.
    Returns JPEG bytes on success, None on failure.

    Handles: insufficient images, low-overlap failures, memory errors.
    Does NOT fabricate a result if stitching fails.
    """
    import aiofiles
    from app.services.storage_service import storage

    try:
        import cv2
        import numpy as np
    except ImportError:
        logger.warning("OpenCV not available. Stitching skipped.")
        return None

    if len(images) < 2:
        logger.info("Single image — stitching not needed")
        return None

    mats = []
    for img in images:
        try:
            fpath = storage.full_path(img.storage_path)
            async with aiofiles.open(fpath, "rb") as f:
                data = await f.read()
            arr = np.frombuffer(data, dtype=np.uint8)
            mat = cv2.imdecode(arr, cv2.IMREAD_COLOR)
            if mat is not None:
                mats.append(mat)
        except Exception as exc:
            logger.warning("Could not load image for stitching %s: %s", img.id, exc)

    if len(mats) < 2:
        logger.warning("Not enough valid images for stitching")
        return None

    stitcher = cv2.Stitcher_create(cv2.Stitcher_SCANS)
    status, panorama = stitcher.stitch(mats)

    if status != cv2.Stitcher_OK:
        error_map = {
            cv2.Stitcher_ERR_NEED_MORE_IMGS: "insufficient images",
            cv2.Stitcher_ERR_HOMOGRAPHY_EST_FAIL: "homography estimation failed",
            cv2.Stitcher_ERR_CAMERA_PARAMS_ADJUST_FAIL: "camera params adjustment failed",
        }
        msg = error_map.get(status, f"status code {status}")
        logger.warning("OpenCV stitching failed: %s", msg)
        return None

    _, buf = cv2.imencode(".jpg", panorama, [cv2.IMWRITE_JPEG_QUALITY, 90])
    logger.info("Stitching succeeded: output %dx%d", panorama.shape[1], panorama.shape[0])
    return bytes(buf)
