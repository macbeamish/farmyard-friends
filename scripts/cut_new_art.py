"""Cut the new fruit and animal pictures out of their magenta backgrounds."""

import sys
from pathlib import Path

import numpy as np
from PIL import Image

sys.path.insert(0, str(Path(__file__).resolve().parent))
from cutout import corner_color, crop_content, flood_clear, save_png

SRC = Path(r"C:\Users\1\.cursor\projects\c-Users-1-Projects-farmyard-friends\assets")
OUT = Path(__file__).resolve().parents[1] / "public" / "art"
NAMES = [
    "mouse",
    "goat",
    "rooster",
    "goose",
    "apple",
    "banana",
    "orange",
    "grapes",
    "strawberry",
    "pear",
    "kiwi",
    "watermelon",
    "pineapple",
    "lemon",
    "mango",
    "avocado",
    "cherries",
]


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    for name in NAMES:
        src = SRC / f"{name}.jpg"
        if not src.exists():
            src = SRC / f"{name}.png"
        arr = np.array(Image.open(src).convert("RGBA"))
        background = corner_color(arr).astype(np.int16)
        arr = flood_clear(arr, tolerance=78)
        distance = np.abs(arr[:, :, :3].astype(np.int16) - background).sum(axis=2)
        holes = (arr[:, :, 3] > 0) & (distance < 90)
        arr[holes, 3] = 0
        rim = (arr[:, :, 3] > 0) & (distance < 130)
        fade = np.clip((distance[rim] - 90) / 40, 0, 1)
        arr[rim, 3] = (arr[rim, 3].astype(np.float32) * fade).astype(np.uint8)
        arr = crop_content(arr)
        save_png(arr, OUT / f"{name}.png", 700)


if __name__ == "__main__":
    main()
