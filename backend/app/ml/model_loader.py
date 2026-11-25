"""ML model loader — loads U-Net checkpoint when available, else exposes unavailable state.

Label mapping (must match training):
  Class 0 = Background
  Class 1 = Crop  (green overlay)
  Class 2 = Weed  (red overlay)

Architecture confirmed from Kaggle training code:
  UNet(n_classes=3, base=32) — same as app.ml.architecture.UNet
  Saved as a bare state dict with keys: enc.*, bott.*, up.*, dec.*, head.*

IMPORTANT: Do NOT change num_classes, input_size, or normalization without
verifying against the actual training configuration.
"""
from __future__ import annotations

import os

from app.core.config import settings
from app.core.logging import logger


class ModelLoader:
    """Singleton that holds the loaded U-Net model (or None when unavailable)."""

    def __init__(self) -> None:
        self._model = None
        self._device = None
        self._loaded = False

    @property
    def is_available(self) -> bool:
        return self._loaded and self._model is not None

    def load(self) -> bool:
        """Attempt to load the checkpoint. Returns True on success."""
        if not settings.model_available:
            logger.info(
                "U-Net checkpoint not configured (UNET_CHECKPOINT_PATH is empty or file missing). "
                "Model-dependent features will report unavailable."
            )
            return False

        try:
            import torch
        except ImportError:
            logger.warning("PyTorch not installed. Segmentation disabled.")
            return False

        try:
            checkpoint_path = settings.unet_checkpoint_path
            if not os.path.isfile(checkpoint_path):
                checkpoint_path = os.path.join(os.path.dirname(__file__), "unet_best.pt")
            device = torch.device("cpu")  # always CPU; change UNET_DEVICE=cuda if GPU available

            from app.ml.architecture import UNet
            model = UNet(n_classes=settings.unet_num_classes)

            # Load checkpoint — supports both bare state dicts and wrapped dicts
            # (e.g. {'model_state_dict': ..., 'epoch': ...})
            raw = torch.load(checkpoint_path, map_location=device, weights_only=False)
            if isinstance(raw, dict):
                # Wrapped checkpoint: look for common keys
                state_dict = (
                    raw.get("model_state_dict")
                    or raw.get("state_dict")
                    or raw.get("model")
                    or None
                )
                if state_dict is None:
                    # Assume the dict itself IS the state dict if its keys
                    # match model parameter names (enc.*, dec.*, bott.*, head.*, up.*)
                    first_key = next(iter(raw))
                    if any(first_key.startswith(p) for p in ("enc.", "dec.", "bott.", "head.", "up.")):
                        state_dict = raw
                    else:
                        raise ValueError(
                            f"Cannot locate state dict in checkpoint. "
                            f"Top-level keys: {list(raw.keys())[:8]}"
                        )
            else:
                state_dict = raw  # e.g. raw OrderedDict

            missing, unexpected = model.load_state_dict(state_dict, strict=False)
            if missing:
                logger.warning("Missing keys in checkpoint: %s", missing[:5])
            if unexpected:
                logger.warning("Unexpected keys in checkpoint: %s", unexpected[:5])

            model.to(device).eval()
            self._model = model
            self._device = device
            self._loaded = True
            logger.info(
                "U-Net loaded successfully from '%s' on device '%s'",
                checkpoint_path, device,
            )
            return True

        except Exception as exc:
            logger.error("Failed to load U-Net checkpoint: %s", exc)
            return False

    def get_model(self):
        if not self.is_available:
            raise RuntimeError("model_unavailable")
        return self._model, self._device


model_loader = ModelLoader()