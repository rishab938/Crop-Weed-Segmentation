"""Label mapping for U-Net output classes.

Training label mapping (verify against your actual training labels):
  Class 0 = Background  → RGB (0,   0,   0)
  Class 1 = Crop        → RGB (0,   255, 0)
  Class 2 = Weed        → RGB (255, 0,   0)

If PhenoBench or another dataset was used with partial-crop / partial-weed classes,
document the mapping here and apply it to the raw model output before
using these helpers.
"""
from __future__ import annotations

NUM_CLASSES = 3

CLASS_NAMES = {
    0: "Background",
    1: "Crop",
    2: "Weed",
}

# Visualization colours (BGR for OpenCV)
CLASS_COLORS_BGR = {
    0: (0,   0,   0),     # Background — black
    1: (0,   255, 0),     # Crop       — green
    2: (0,   0,   255),   # Weed       — red
}

# Visualization colours (RGBA for PIL)
CLASS_COLORS_RGBA = {
    0: (0,   0,   0,   0),       # Background — transparent
    1: (132, 204, 22,  160),     # Crop       — lime
    2: (239, 68,  68,  180),     # Weed       — red
}
