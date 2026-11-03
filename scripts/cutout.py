"""Remove flat backdrops, crop sprites, and paint a short blink frame."""

from pathlib import Path

import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / "raw-art"
OUT = ROOT / "public" / "art"
SKIP_BLINK = {"farm-bg", "windmill-tower", "windmill-blades"}


def corner_color(arr: np.ndarray) -> np.ndarray:
    h, w = arr.shape[:2]
    samples = [
        arr[1, 1, :3],
        arr[1, w - 2, :3],
        arr[h - 2, 1, :3],
        arr[h - 2, w - 2, :3],
    ]
    return np.median(np.stack(samples), axis=0)


def flood_clear(arr: np.ndarray, tolerance: int) -> np.ndarray:
    h, w = arr.shape[:2]
    bg = corner_color(arr).astype(np.int16)
    rgb = arr[:, :, :3].astype(np.int16)
    dist = np.abs(rgb - bg).sum(axis=2)
    seen = np.zeros((h, w), dtype=bool)
    stack = [(0, x) for x in range(w)] + [(h - 1, x) for x in range(w)]
    stack += [(y, 0) for y in range(h)] + [(y, w - 1) for y in range(h)]
    while stack:
        y, x = stack.pop()
        if y < 0 or x < 0 or y >= h or x >= w or seen[y, x]:
            continue
        if dist[y, x] > tolerance:
            continue
        seen[y, x] = True
        arr[y, x, 3] = 0
        stack.extend(((y + 1, x), (y - 1, x), (y, x + 1), (y, x - 1)))

    # Fade jpeg fringe that is still the backdrop color and touches transparency.
    alpha = arr[:, :, 3]
    near = alpha == 0
    for _ in range(2):
        padded = np.pad(near, 1, constant_values=False)
        near = (
            padded[1:-1, 1:-1]
            | padded[:-2, 1:-1]
            | padded[2:, 1:-1]
            | padded[1:-1, :-2]
            | padded[1:-1, 2:]
        )
    fringe = near & (alpha > 0) & (dist < tolerance + 55)
    if np.any(fringe):
        fade = np.clip((dist[fringe] - tolerance) / 55, 0, 1)
        arr[fringe, 3] = (alpha[fringe].astype(np.float32) * fade).astype(np.uint8)
    return arr


def crop_content(arr: np.ndarray, pad: int = 6) -> np.ndarray:
    ys, xs = np.where(arr[:, :, 3] > 16)
    if len(xs) == 0:
        return arr
    h, w = arr.shape[:2]
    top = max(int(ys.min()) - pad, 0)
    bottom = min(int(ys.max()) + pad + 1, h)
    left = max(int(xs.min()) - pad, 0)
    right = min(int(xs.max()) + pad + 1, w)
    return arr[top:bottom, left:right]


def center_content(arr: np.ndarray, pad: int = 8) -> np.ndarray:
    """Put the visible centroid on the canvas center so sails spin on their hub."""
    cropped = crop_content(arr, pad=0)
    alpha = cropped[:, :, 3].astype(np.float64)
    total = alpha.sum()
    if total <= 0:
        return cropped
    ch, cw = cropped.shape[:2]
    cy = (alpha * np.arange(ch)[:, None]).sum() / total
    cx = (alpha * np.arange(cw)[None, :]).sum() / total
    side = int(max(cw, ch, abs(cx - cw / 2) * 2, abs(cy - ch / 2) * 2) + pad * 2)
    canvas = np.zeros((side, side, 4), dtype=np.uint8)
    ox = int(round(side / 2 - cx))
    oy = int(round(side / 2 - cy))
    y0, x0 = max(oy, 0), max(ox, 0)
    y1 = min(oy + ch, side)
    x1 = min(ox + cw, side)
    canvas[y0:y1, x0:x1] = cropped[y0 - oy : y1 - oy, x0 - ox : x1 - ox]
    return canvas


def limit(im: Image.Image, max_side: int) -> Image.Image:
    w, h = im.size
    scale = min(1.0, max_side / max(w, h))
    if scale >= 1:
        return im
    size = (max(1, int(w * scale)), max(1, int(h * scale)))
    return im.resize(size, Image.Resampling.LANCZOS)


def components(mask: np.ndarray) -> list[list[tuple[int, int]]]:
    h, w = mask.shape
    seen = np.zeros_like(mask, dtype=bool)
    found = []
    coords = np.argwhere(mask)
    for y0, x0 in coords:
        y0 = int(y0)
        x0 = int(x0)
        if seen[y0, x0]:
            continue
        stack = [(y0, x0)]
        seen[y0, x0] = True
        pixels: list[tuple[int, int]] = []
        while stack:
            y, x = stack.pop()
            pixels.append((y, x))
            for ny, nx in ((y + 1, x), (y - 1, x), (y, x + 1), (y, x - 1)):
                if 0 <= ny < h and 0 <= nx < w and mask[ny, nx] and not seen[ny, nx]:
                    seen[ny, nx] = True
                    stack.append((ny, nx))
        found.append(pixels)
    return found


def find_eyes(arr: np.ndarray) -> list[dict]:
    alpha = arr[:, :, 3]
    ys, xs = np.where(alpha > 140)
    if len(xs) == 0:
        return []
    top, bottom = int(ys.min()), int(ys.max())
    height = max(1, bottom - top)
    band_bottom = top + int(height * 0.52)
    rgb = arr[:, :, :3].astype(np.int16)
    luma = rgb[:, :, 0] * 0.3 + rgb[:, :, 1] * 0.55 + rgb[:, :, 2] * 0.15
    rows = np.arange(arr.shape[0])[:, None]
    dark = (luma < 90) & (alpha > 180) & (rows >= top + 4) & (rows <= band_bottom)
    # Skip comb-red pixels.
    dark &= ~((rgb[:, :, 0] > 150) & (rgb[:, :, 0] > rgb[:, :, 1] + 40) & (rgb[:, :, 2] < 120))

    blobs = []
    for pixels in components(dark):
        if not 40 <= len(pixels) <= 12000:
            continue
        py = [p[0] for p in pixels]
        px = [p[1] for p in pixels]
        blobs.append(
            {
                "cx": sum(px) / len(px),
                "cy": sum(py) / len(py),
                "rx": (max(px) - min(px)) / 2 + 2,
                "ry": (max(py) - min(py)) / 2 + 2,
                "n": len(pixels),
            }
        )
    best = None
    for i, a in enumerate(blobs):
        for b in blobs[i + 1 :]:
            if abs(a["cy"] - b["cy"]) > max(18, a["ry"] + b["ry"]):
                continue
            ratio = a["n"] / b["n"]
            if ratio < 0.35 or ratio > 2.8:
                continue
            if abs(a["cx"] - b["cx"]) < max(a["rx"], b["rx"]):
                continue
            score = abs(a["cx"] - b["cx"]) - abs(a["cy"] - b["cy"]) * 3 - (a["cy"] + b["cy"]) * 0.05
            if best is None or score > best[0]:
                best = (score, a, b)
    if best is None:
        return []
    return [best[1], best[2]]


def sample_lid(arr: np.ndarray, eye: dict) -> tuple[int, int, int]:
    h, w = arr.shape[:2]
    cx, cy = int(eye["cx"]), int(eye["cy"])
    colors = []
    y = max(0, int(cy - eye["ry"] - 8))
    for x in range(max(0, cx - 10), min(w, cx + 11)):
        if arr[y, x, 3] > 180:
            pixel = arr[y, x, :3].astype(int)
            luma = pixel[0] * 0.3 + pixel[1] * 0.55 + pixel[2] * 0.15
            if luma > 110:
                colors.append(pixel)
    if not colors:
        return (236, 214, 186)
    stacked = np.stack(colors)
    med = np.median(stacked, axis=0)
    return tuple(int(v) for v in med)


def paint_blink(arr: np.ndarray, eyes: list[dict]) -> np.ndarray:
    out = arr.copy()
    h, w = out.shape[:2]
    for eye in eyes:
        color = np.array(sample_lid(out, eye), dtype=np.uint8)
        cx, cy = eye["cx"], eye["cy"]
        rx, ry = eye["rx"] * 1.15, eye["ry"] * 1.2
        x0 = max(0, int(cx - rx - 1))
        x1 = min(w, int(cx + rx + 2))
        y0 = max(0, int(cy - ry - 1))
        y1 = min(h, int(cy + ry + 2))
        for y in range(y0, y1):
            for x in range(x0, x1):
                nx = (x - cx) / rx
                ny = (y - cy) / ry
                if nx * nx + ny * ny <= 1 and out[y, x, 3] > 30:
                    out[y, x, :3] = color
    return out


def save_png(arr: np.ndarray, dest: Path, max_side: int) -> None:
    image = limit(Image.fromarray(arr), max_side)
    image.save(dest, "PNG", optimize=True)
    print(f"{dest.name} {image.size}")


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    files = sorted([*SRC.glob("*.jpg"), *SRC.glob("*.png")])
    for src in files:
        name = src.stem
        if name == "farm-bg":
            image = Image.open(src).convert("RGB")
            image.thumbnail((1920, 1080), Image.Resampling.LANCZOS)
            image.save(OUT / "farm-bg.jpg", "JPEG", quality=86, optimize=True)
            print(f"farm-bg.jpg {image.size}")
            continue
        arr = np.array(Image.open(src).convert("RGBA"))
        arr = flood_clear(arr, tolerance=78)
        if name == "windmill-blades":
            arr = center_content(arr)
        else:
            arr = crop_content(arr)
        save_png(arr, OUT / f"{name}.png", 900 if name != "windmill-blades" else 1200)
        if name in SKIP_BLINK:
            continue
        eyes = find_eyes(arr)
        if len(eyes) != 2:
            print(f"  no blink for {name}")
            continue
        save_png(paint_blink(arr, eyes), OUT / f"{name}-blink.png", 900)


if __name__ == "__main__":
    main()
