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
    """Singleton that holds the loaded U-Net model (ONNX session or PyTorch model)."""

    def __init__(self) -> None:
        self._session = None
        self._input_name = None
        self._output_name = None
        self._is_onnx = False
        self._model = None
        self._device = None
        self._loaded = False

    @property
    def is_available(self) -> bool:
        return self._loaded and (self._session is not None or self._model is not None)

    @property
    def is_onnx(self) -> bool:
        return self._is_onnx and self._session is not None

    def load(self) -> bool:
        """Attempt to load the checkpoint. Prioritizes ONNX for ultra-low memory usage."""
        # 1. Try ONNX runtime first (uses ~80MB RAM vs PyTorch's 400MB)
        onnx_path = os.path.join(os.path.dirname(__file__), "unet_best.onnx")
        if os.path.isfile(onnx_path):
            try:
                import onnxruntime as ort
                options = ort.SessionOptions()
                options.intra_op_num_threads = 1
                options.inter_op_num_threads = 1
                self._session = ort.InferenceSession(onnx_path, sess_options=options, providers=["CPUExecutionProvider"])
                self._input_name = self._session.get_inputs()[0].name
                self._output_name = self._session.get_outputs()[0].name
                self._is_onnx = True
                self._loaded = True
                logger.info("U-Net ONNX session loaded successfully from '%s' (low-RAM mode).", onnx_path)
                return True
            except Exception as exc:
                logger.warning("Failed to load ONNX model (%s), attempting PyTorch fallback...", exc)

        # 2. Fallback to PyTorch checkpoint (.pt)
        if not settings.model_available:
            logger.info(
                "U-Net checkpoint not configured (UNET_CHECKPOINT_PATH is empty or file missing). "
                "Model-dependent features will report unavailable."
            )
            return False

        try:
            import torch
        except ImportError:
            logger.warning("Neither onnxruntime nor PyTorch could load the model. Segmentation disabled.")
            return False

        try:
            checkpoint_path = settings.unet_checkpoint_path
            if not os.path.isfile(checkpoint_path):
                checkpoint_path = os.path.join(os.path.dirname(__file__), "unet_best.pt")
            device = torch.device("cpu")  # always CPU; change UNET_DEVICE=cuda if GPU available

            from app.ml.architecture import UNet
            model = UNet(n_classes=settings.unet_num_classes)

            raw = torch.load(checkpoint_path, map_location=device, weights_only=False)
            if isinstance(raw, dict):
                state_dict = (
                    raw.get("model_state_dict")
                    or raw.get("state_dict")
                    or raw.get("model")
                    or None
                )
                if state_dict is None:
                    first_key = next(iter(raw))
                    if any(first_key.startswith(p) for p in ("enc.", "dec.", "bott.", "head.", "up.")):
                        state_dict = raw
                    else:
                        raise ValueError(f"Cannot locate state dict in checkpoint. Keys: {list(raw.keys())[:8]}")
            else:
                state_dict = raw

            missing, unexpected = model.load_state_dict(state_dict, strict=False)
            if missing:
                logger.warning("Missing keys in checkpoint: %s", missing[:5])
            if unexpected:
                logger.warning("Unexpected keys in checkpoint: %s", unexpected[:5])

            model.to(device).eval()
            self._model = model
            self._device = device
            self._is_onnx = False
            self._loaded = True
            logger.info("U-Net loaded successfully from '%s' on device '%s'", checkpoint_path, device)
            return True

        except Exception as exc:
            logger.error("Failed to load U-Net checkpoint: %s", exc)
            return False

    def get_session(self):
        """Returns (session, input_name, output_name) for ONNX inference."""
        if not self.is_onnx:
            raise RuntimeError("onnx_session_unavailable")
        return self._session, self._input_name, self._output_name

    def get_model(self):
        """Returns (model, device) for PyTorch inference fallback."""
        if not self.is_available or self._model is None:
            raise RuntimeError("model_unavailable")
        return self._model, self._device


model_loader = ModelLoader()