"""Inference pipeline — runs U-Net on a single image.

When the model checkpoint is unavailable, raises RuntimeError("model_unavailable").
Never returns fabricated predictions.
"""
from __future__ import annotations

import gc
import io
import time
from dataclasses import dataclass
from typing import Optional

import numpy as np
from PIL import Image

from app.ml.label_mapping import CLASS_COLORS_RGBA, NUM_CLASSES
from app.ml.model_loader import model_loader
from app.ml.preprocessing import load_image, preprocess


@dataclass
class InferenceResult:
    mask_array: np.ndarray   # H×W int array of class indices (0=soil, 1=crop, 2=weed)
    overlay_bytes: bytes      # PNG bytes of blended image (0.35*original + 0.65*color)
    background_pixels: int
    crop_pixels: int
    weed_pixels: int
    background_pct: float
    crop_pct: float
    weed_pct: float
    spray_level: str
    spray_message: str
    inference_time_ms: float


def get_spray_dosage(weed_pct: float) -> tuple[str, str]:
    """Kaggle notebook Cell 11 spray prescription rule."""
    if weed_pct < 1.0:
        return "none", "No spray needed — weed density negligible."
    elif weed_pct < 5.0:
        return "low", f"Low-dose spot spray recommended ({weed_pct:.1f}% weed)."
    elif weed_pct < 15.0:
        return "medium", f"Medium-dose targeted spray recommended ({weed_pct:.1f}% weed)."
    else:
        return "high", f"High-dose full-area spray required ({weed_pct:.1f}% weed)."


def run_inference(image_data: bytes) -> InferenceResult:
    """
    Run U-Net segmentation on raw image bytes.
    Matches Kaggle Cell 11 pipeline.
    """
    if not model_loader.is_available:
        raise RuntimeError("model_unavailable")

    try:
        import torch
    except ImportError:
        raise RuntimeError("model_unavailable")

    model, device = model_loader.get_model()
    img = load_image(image_data)
    original_size = img.size  # (W, H)

    # Resize input image to max 512x512 before inference to reduce memory
    img = img.resize((512, 512), Image.LANCZOS)

    tensor = preprocess(img).to(device)

    t0 = time.perf_counter()
    with torch.no_grad():
        output = model(tensor)  # (1, 3, 512, 512)
        # argmax across class dimension
        pred = output[0].argmax(dim=0).cpu().numpy().astype(np.uint8)  # 512x512
        # Free GPU/CPU tensors immediately after extracting prediction
        del output
        del tensor
        torch.cuda.empty_cache()  # no-op on CPU but harmless
        gc.collect()
    t1 = time.perf_counter()

    # ── Keep mask and overlay at model resolution (512×512) to stay well under 512MB RAM ──
    # Inflating 512×512 predictions back to 4000×3000 takes >350MB of float32 RAM,
    # causing Render to kill the process. At 512×512, the entire overlay takes <5MB.
    mask_array = pred  # uint8 shape (512, 512)

    # ── Vegetation mask: zero out predictions on non-plant pixels ─────────
    try:
        import cv2
        img_rgb = np.array(img.convert("RGB"))
        img_hsv = cv2.cvtColor(img_rgb, cv2.COLOR_RGB2HSV)
        lower_green = np.array([25, 40, 40])
        upper_green = np.array([90, 255, 255])
        veg_mask = cv2.inRange(img_hsv, lower_green, upper_green)   # 255 = plant
        mask_array[veg_mask == 0] = 0  # force non-vegetation → background
    except ImportError:
        pass  # cv2 not installed — skip vegetation masking gracefully

    # Pixel counts
    total = mask_array.size
    bg_px  = int((mask_array == 0).sum())
    cr_px  = int((mask_array == 1).sum())
    wd_px  = int((mask_array == 2).sum())

    bg_pct = round(100.0 * bg_px / total, 2)
    cr_pct = round(100.0 * cr_px / total, 1)
    wd_pct = round(100.0 * wd_px / total, 1)

    spray_level, spray_msg = get_spray_dosage(wd_pct)

    # Fast vectorized overlay matching Kaggle notebook:
    # overlay[mask == 1] = img*0.35 + [0, 200, 0]*0.65
    # overlay[mask == 2] = img*0.35 + [220, 0, 0]*0.65
    overlay = _build_overlay(img, mask_array)

    return InferenceResult(
        mask_array=mask_array,
        overlay_bytes=overlay,
        background_pixels=bg_px,
        crop_pixels=cr_px,
        weed_pixels=wd_px,
        background_pct=bg_pct,
        crop_pct=cr_pct,
        weed_pct=wd_pct,
        spray_level=spray_level,
        spray_message=spray_msg,
        inference_time_ms=round((t1 - t0) * 1000, 1),
    )


def _build_overlay(original: Image.Image, mask: np.ndarray) -> bytes:
    """
    Vectorized NumPy blend matching Kaggle Cell 11:
      Crop (1) -> [0, 200, 0] green
      Weed (2) -> [220, 0, 0] red
    """
    if original.size != (mask.shape[1], mask.shape[0]):
        original = original.resize((mask.shape[1], mask.shape[0]), Image.LANCZOS)
    img_np = np.array(original.convert("RGB"), dtype=np.float32)
    overlay_np = img_np.copy()

    # Crop mask: 35% original + 65% green
    crop_mask = (mask == 1)
    if crop_mask.any():
        green_color = np.array([0, 200, 0], dtype=np.float32)
        overlay_np[crop_mask] = (img_np[crop_mask] * 0.35 + green_color * 0.65)

    # Weed mask: 35% original + 65% red
    weed_mask = (mask == 2)
    if weed_mask.any():
        red_color = np.array([220, 0, 0], dtype=np.float32)
        overlay_np[weed_mask] = (img_np[weed_mask] * 0.35 + red_color * 0.65)

    overlay_img = Image.fromarray(np.clip(overlay_np, 0, 255).astype(np.uint8))
    buf = io.BytesIO()
    overlay_img.save(buf, format="PNG")
    return buf.getvalue()
