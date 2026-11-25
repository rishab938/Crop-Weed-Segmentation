import os
import cv2
import base64
from fastapi import HTTPException

def stitch_images(image_paths: list[str]) -> str:
    """Stitch a list of image file paths using OpenCV and return a base64 PNG.

    Args:
        image_paths: List of absolute file paths to the uploaded images.

    Returns:
        A base64‑encoded PNG string (no data‑uri prefix).
    """
    # Load the images; OpenCV returns None if a file cannot be read.
    images = []
    for p in image_paths:
        img = cv2.imread(p)
        if img is None:
            raise HTTPException(status_code=400, detail=f"Could not read image: {p}")
        images.append(img)

    # Create a panoramic stitcher.
    stitcher = cv2.Stitcher_create(cv2.Stitcher_PANORAMA)
    status, stitched = stitcher.stitch(images)
    if status != cv2.Stitcher_OK:
        raise HTTPException(status_code=400, detail="Stitch failed – ensure images overlap")

    # Encode the stitched result to PNG and then to base64.
    success, buf = cv2.imencode('.png', stitched)
    if not success:
        raise HTTPException(status_code=500, detail="Failed to encode stitched image")
    return base64.b64encode(buf).decode()
