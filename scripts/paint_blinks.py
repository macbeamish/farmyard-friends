"""Paint closed eyes on the animals the automatic pass missed."""

from pathlib import Path

import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
ART = ROOT / "public" / "art"

# cx, cy, rx, ry as fractions of the sprite.
EYES = {
    "cow": [(0.60, 0.292, 0.046, 0.04), (0.785, 0.288, 0.046, 0.04)],
    "horse": [(0.715, 0.252, 0.034, 0.03), (0.91, 0.245, 0.032, 0.028)],
    "turkey": [(0.74, 0.20, 0.04, 0.034), (0.85, 0.20, 0.038, 0.032)],
    "sheep": [(0.26, 0.32, 0.07, 0.065), (0.47, 0.32, 0.07, 0.065)],
    "monster-mint": [(0.35, 0.37, 0.1, 0.08), (0.65, 0.37, 0.1, 0.08)],
    "monster-butter": [(0.37, 0.355, 0.09, 0.075), (0.63, 0.355, 0.09, 0.075)],
}


def lid_color(arr: np.ndarray, cx: int, cy: int) -> np.ndarray:
    h, w = arr.shape[:2]
    colors = []
    for y in range(max(0, cy - 28), max(0, cy - 8)):
        for x in range(max(0, cx - 12), min(w, cx + 13)):
            if arr[y, x, 3] < 180:
                continue
            pixel = arr[y, x, :3].astype(int)
            luma = pixel[0] * 0.3 + pixel[1] * 0.55 + pixel[2] * 0.15
            if 90 < luma < 210:
                colors.append(pixel)
    if not colors:
        return np.array([236, 214, 186], dtype=np.uint8)
    return np.median(np.stack(colors), axis=0).astype(np.uint8)


def paint(name: str, eyes: list[tuple[float, float, float, float]]) -> None:
    path = ART / f"{name}.png"
    arr = np.array(Image.open(path).convert("RGBA"))
    h, w = arr.shape[:2]
    for fx, fy, frx, fry in eyes:
        cx, cy = fx * w, fy * h
        rx, ry = max(frx * w, 4), max(fry * h, 4)
        color = lid_color(arr, int(cx), int(cy))
        x0, x1 = max(0, int(cx - rx)), min(w, int(cx + rx + 1))
        y0, y1 = max(0, int(cy - ry)), min(h, int(cy + ry + 1))
        for y in range(y0, y1):
            for x in range(x0, x1):
                nx = (x - cx) / rx
                ny = (y - cy) / ry
                if nx * nx + ny * ny <= 1 and arr[y, x, 3] > 40:
                    arr[y, x, :3] = color
    Image.fromarray(arr).save(ART / f"{name}-blink.png", "PNG", optimize=True)
    print(name)


if __name__ == "__main__":
    for animal, eyes in EYES.items():
        paint(animal, eyes)
