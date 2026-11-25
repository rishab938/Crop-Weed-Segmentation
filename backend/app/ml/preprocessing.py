"""Preprocessing utilities for U-Net input.

These values MUST match what was used during training.
Update MEAN, STD, and INPUT_SIZE once the training config is confirmed.
"""
from __future__ import annotations

import io
from typing import Tuple

import cv2
import numpy as np
from PIL import Image

from app.core.config import settings

# ─── Normalization — UPDATE to match training ────────────────────────────────
# ImageNet defaults used as placeholder; replace with your dataset stats.
MEAN = [0.485, 0.456, 0.406]
STD  = [0.229, 0.224, 0.225]
INPUT_SIZE = settings.unet_input_size  # square side, e.g. 512


def load_image(data: bytes) -> Image.Image:
    return Image.open(io.BytesIO(data)).convert("RGB")


def apply_vegetation_mask(img: Image.Image) -> Image.Image:
    """Remove non-vegetation pixels (soil, shadows, paths) before U-Net inference."""
    img_rgb = np.array(img.convert("RGB"))
    img_hsv = cv2.cvtColor(img_rgb, cv2.COLOR_RGB2HSV)

    lower_green = np.array([25, 40, 40])
    upper_green = np.array([90, 255, 255])
    veg_mask = cv2.inRange(img_hsv, lower_green, upper_green)

    # Fill small gaps in the mask
    kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (5, 5))
    veg_mask = cv2.morphologyEx(veg_mask, cv2.MORPH_CLOSE, kernel)

    # Set non-vegetation pixels to black
    img_rgb[veg_mask == 0] = 0

    return Image.fromarray(img_rgb)


def preprocess(img: Image.Image) -> np.ndarray:
    """
    Returns a float32 numpy array of shape (1, 3, H, W) normalised to training stats.
    Pure NumPy implementation for onnxruntime (no torch dependency needed).
    """
    img = img.convert("RGB")
    img = apply_vegetation_mask(img)  # zero out soil/shadows before model sees the image

    img_resized = img.resize((512, 512), Image.LANCZOS)
    arr = np.array(img_resized, dtype=np.float32) / 255.0
    mean = np.array(MEAN, dtype=np.float32)
    std = np.array(STD, dtype=np.float32)
    arr = (arr - mean) / std

    # Transpose from (H, W, C) to (C, H, W) and add batch dimension -> (1, 3, 512, 512)
    tensor_arr = np.transpose(arr, (2, 0, 1))
    tensor_arr = np.expand_dims(tensor_arr, axis=0).astype(np.float32)
    return tensor_arr
