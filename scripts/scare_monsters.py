"""Give the pillow monsters a slightly sterner face."""

from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[1]
ART = ROOT / "public" / "art"
NAMES = ["monster-lilac", "monster-mint", "monster-butter"]


def eye_centers(image):
    pixels = np.array(image)
    height, width = pixels.shape[:2]
    alpha = pixels[:, :, 3]
    luminance = pixels[:, :, :3].mean(axis=2)
    rows, cols = np.where(alpha > 80)
    top, bottom = rows.min(), rows.max()
    left, right = cols.min(), cols.max()
    band = (np.arange(height)[:, None] > top + (bottom - top) * 0.18) & (
        np.arange(height)[:, None] < top + (bottom - top) * 0.5
    )
    dark = (luminance < 70) & (alpha > 180) & band
    yy, xx = np.where(dark)
    center = (left + right) / 2
    left_eye = xx < center
    return (
        (int(np.median(xx[left_eye])), int(np.median(yy[left_eye]))),
        (int(np.median(xx[~left_eye])), int(np.median(yy[~left_eye]))),
    )


def darken(image):
    pixels = np.array(image)
    rgb = pixels[:, :, :3].astype(np.float32)
    rgb *= 0.86
    pixels[:, :, :3] = np.clip(rgb, 0, 255).astype(np.uint8)
    return Image.fromarray(pixels)


def cover_old_brows(image, eyes):
    pixels = np.array(image)
    height, width = pixels.shape[:2]
    for eye_x, eye_y in eyes:
        sample_y = max(0, eye_y - 95)
        sample = pixels[sample_y, eye_x]
        if sample[3] < 200:
            sample = pixels[max(0, eye_y - 80), eye_x]
        y0 = max(0, eye_y - 125)
        y1 = max(0, eye_y - 42)
        x0 = max(0, eye_x - 70)
        x1 = min(width, eye_x + 70)
        patch = pixels[y0:y1, x0:x1]
        luminance = patch[:, :, :3].mean(axis=2)
        skin = sample[:3].astype(np.float32).mean()
        old = (patch[:, :, 3] > 180) & (luminance + 28 < skin)
        patch[old, :3] = sample[:3]
        pixels[y0:y1, x0:x1] = patch
    return Image.fromarray(pixels)


def add_brows(image, eyes):
    image = cover_old_brows(image, eyes)
    draw = ImageDraw.Draw(image)
    (lx, ly), (rx, ry) = eyes
    ink = (58, 32, 44, 235)
    draw.line([(lx - 42, ly - 78), (lx + 26, ly - 56)], fill=ink, width=9)
    draw.line([(rx + 42, ry - 78), (rx - 26, ry - 56)], fill=ink, width=9)
    return image


def main():
    for name in NAMES:
        source = Image.open(ART / f"{name}.png").convert("RGBA")
        eyes = eye_centers(source)
        for suffix in ("", "-blink"):
            image = Image.open(ART / f"{name}{suffix}.png").convert("RGBA")
            image = add_brows(darken(image), eyes)
            image.save(ART / f"{name}{suffix}.png")
        print(name, eyes)


if __name__ == "__main__":
    main()
