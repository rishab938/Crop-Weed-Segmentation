"""Export U-Net PyTorch model (.pt) to ONNX (.onnx) format.

Uses torch.onnx.export with fixed input shape (1, 3, 512, 512)
and dynamic batch axis for ultra-low memory inference with onnxruntime.
"""
from __future__ import annotations

import os
import sys
from pathlib import Path

# Add backend directory to sys.path
backend_dir = Path(__file__).resolve().parent
sys.path.insert(0, str(backend_dir))

import torch
from app.ml.model_loader import model_loader


def convert():
    print("Loading U-Net PyTorch checkpoint via model_loader...")
    if not model_loader.load():
        print("ERROR: Could not load U-Net checkpoint!")
        sys.exit(1)

    model, device = model_loader.get_model()
    model.eval()

    output_path = backend_dir / "app" / "ml" / "unet_best.onnx"
    print(f"Exporting model to ONNX: {output_path}...")

    dummy_input = torch.randn(1, 3, 512, 512, device=device)

    torch.onnx.export(
        model,
        dummy_input,
        str(output_path),
        export_params=True,
        opset_version=17,
        do_constant_folding=True,
        input_names=["input"],
        output_names=["output"],
        dynamo=False,
    )

    print("ONNX export complete!")
    print(f"File: {output_path} ({output_path.stat().st_size / (1024 * 1024):.2f} MB)")


if __name__ == "__main__":
    convert()
