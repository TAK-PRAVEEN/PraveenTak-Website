"""
Bake the binary particle portrait (DESIGN.md §6A, decisions D1/D2/D4).

  portrait PNG ──► depth (Depth-Anything-V2-Small, ONNX) ──► subject mask
               ──► importance sampling (darkness + edges) ──► public/media/portrait.bin
                                                         └──► public/media/portrait-still.webp

Run once, offline. Requires: numpy, pillow, onnxruntime (no torch).

  python scripts/bake-portrait.py --model path/to/depth-anything-v2-small.onnx

Model: https://huggingface.co/onnx-community/depth-anything-v2-small (Apache-2.0).
The model file is NOT committed — download it anywhere and pass --model.

Binary format (little-endian):
  0   char[4]  magic "BPT1"
  4   uint32   point count N
  8   float32  scale x, scale y, scale z   (multiply int16/32767 by these)
  20  N × { int16 x, int16 y, int16 z, uint16 tone }   tone 0 = darkest ink, 65535 = lightest
Points are in random importance order, so any prefix is a valid lower-density portrait
(mobile uses the first ~8k).
"""

from __future__ import annotations

import argparse
import struct
from pathlib import Path

import numpy as np
import onnxruntime as ort
from PIL import Image, ImageDraw, ImageFilter, ImageFont

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "reference" / "images" / "portrait-source.png"
OUT_DIR = ROOT / "public" / "media"

MEAN = np.array([0.485, 0.456, 0.406], dtype=np.float32)
STD = np.array([0.229, 0.224, 0.225], dtype=np.float32)


def estimate_depth(img: Image.Image, model: Path) -> np.ndarray:
    """Relative inverse depth (larger = closer), resized to the image, normalised 0..1."""
    w, h = img.size
    tw = 518
    th = int(round(h * tw / w / 14)) * 14
    x = np.asarray(img.convert("RGB").resize((tw, th), Image.BICUBIC), dtype=np.float32) / 255.0
    x = ((x - MEAN) / STD).transpose(2, 0, 1)[None]
    sess = ort.InferenceSession(str(model), providers=["CPUExecutionProvider"])
    d = sess.run(None, {sess.get_inputs()[0].name: x.astype(np.float32)})[0][0]
    d = np.asarray(Image.fromarray(d).resize((w, h), Image.BICUBIC), dtype=np.float32)
    return (d - d.min()) / (d.max() - d.min() + 1e-6)


def subject_mask(rgb: np.ndarray, depth: np.ndarray) -> np.ndarray:
    """Person = near AND not blue sky. Returns float mask 0..1 (feathered)."""
    r, g, b = [rgb[..., i].astype(np.float32) / 255 for i in range(3)]
    mx, mn = np.maximum(np.maximum(r, g), b), np.minimum(np.minimum(r, g), b)
    sat = (mx - mn) / (mx + 1e-6)
    sky = (b > r + 0.08) & (b > g - 0.02) & (sat > 0.12) & (mx > 0.35)
    near = depth > np.quantile(depth, 0.42)
    m = (near & ~sky).astype(np.uint8) * 255
    im = Image.fromarray(m).filter(ImageFilter.MedianFilter(9))
    im = im.filter(ImageFilter.MaxFilter(5)).filter(ImageFilter.MinFilter(7))
    m = np.asarray(im, dtype=np.float32) / 255
    # Keep only the largest blob: drop sky sparkles / watermark fragments.
    m = largest_component(m > 0.5).astype(np.float32)
    return np.asarray(Image.fromarray((m * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(2)), dtype=np.float32) / 255


def largest_component(binary: np.ndarray) -> np.ndarray:
    """4-connected flood fill labelling (pure numpy/python, fine at working res)."""
    h, w = binary.shape
    labels = np.zeros((h, w), dtype=np.int32)
    best, best_size, cur = 0, 0, 0
    for y0, x0 in zip(*np.nonzero(binary)):
        if labels[y0, x0]:
            continue
        cur += 1
        stack, size = [(y0, x0)], 0
        labels[y0, x0] = cur
        while stack:
            y, x = stack.pop()
            size += 1
            for ny, nx in ((y + 1, x), (y - 1, x), (y, x + 1), (y, x - 1)):
                if 0 <= ny < h and 0 <= nx < w and binary[ny, nx] and not labels[ny, nx]:
                    labels[ny, nx] = cur
                    stack.append((ny, nx))
        if size > best_size:
            best, best_size = cur, size
    return labels == best


def sobel(gray: np.ndarray) -> np.ndarray:
    p = np.pad(gray, 1, mode="edge")
    gx = (p[1:-1, 2:] - p[1:-1, :-2]) * 2 + (p[:-2, 2:] - p[:-2, :-2]) + (p[2:, 2:] - p[2:, :-2])
    gy = (p[2:, 1:-1] - p[:-2, 1:-1]) * 2 + (p[2:, :-2] - p[:-2, :-2]) + (p[2:, 2:] - p[:-2, 2:])
    e = np.hypot(gx, gy)
    return e / (np.quantile(e, 0.995) + 1e-6)


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--model", type=Path, required=True)
    ap.add_argument("--points", type=int, default=24000)
    ap.add_argument("--work-width", type=int, default=640)
    ap.add_argument("--depth-scale", type=float, default=0.55)
    ap.add_argument("--seed", type=int, default=2026)
    ap.add_argument("--debug-dir", type=Path)
    a = ap.parse_args()

    src = Image.open(SRC).convert("RGB")
    depth_full = estimate_depth(src, a.model)

    ww = a.work_width
    wh = int(round(src.height * ww / src.width))
    img = src.resize((ww, wh), Image.LANCZOS)
    rgb = np.asarray(img)
    depth = np.asarray(Image.fromarray(depth_full).resize((ww, wh), Image.BILINEAR), dtype=np.float32)
    mask = subject_mask(rgb, depth)

    gray = np.asarray(img.convert("L"), dtype=np.float32) / 255
    inside = mask > 0.5
    lo, hi = np.quantile(gray[inside], [0.02, 0.98])
    tone = np.clip((gray - lo) / (hi - lo + 1e-6), 0, 1)  # stretched within the subject
    edge = np.clip(sobel(gray), 0, 1)

    # Importance: ink where it's dark, structure where it changes, a floor so lit skin still reads.
    weight = mask * (0.10 + 0.95 * (1 - tone) ** 1.3 + 1.1 * edge**0.8)
    # The face carries identity: spend fewer points on the sweater below the neck.
    rows = np.nonzero(inside.any(axis=1))[0]
    top, bottom = rows.min(), rows.max()
    yfrac = (np.arange(wh) - top) / max(bottom - top, 1)
    body = np.clip((yfrac - 0.55) / 0.15, 0, 1)[:, None]
    weight = weight * (1 - 0.6 * body)
    p = (weight / weight.sum()).ravel()
    rng = np.random.default_rng(a.seed)
    idx = rng.choice(p.size, size=a.points, replace=False, p=p)
    ys, xs = np.divmod(idx, ww)
    xs = xs + rng.random(a.points) - 0.5
    ys = ys + rng.random(a.points) - 0.5

    # Normalise to the subject's bounding box: height spans [-1, 1], x keeps aspect.
    half = (bottom - top) / 2
    cy = (top + bottom) / 2
    cx = xs.mean()
    X = (xs - cx) / half
    Y = -(ys - cy) / half
    d_in = depth[inside]
    dn = np.clip((depth[np.clip(ys.astype(int), 0, wh - 1), np.clip(xs.astype(int), 0, ww - 1)] - d_in.min()) / (np.ptp(d_in) + 1e-6), 0, 1)
    Z = (dn - 0.5) * 2 * a.depth_scale
    T = tone[np.clip(ys.astype(int), 0, wh - 1), np.clip(xs.astype(int), 0, ww - 1)]

    sx, sy, sz = (float(np.abs(v).max()) or 1.0 for v in (X, Y, Z))
    q = lambda v, s: np.clip(np.round(v / s * 32767), -32767, 32767).astype("<i2")
    rec = np.empty(a.points, dtype=[("x", "<i2"), ("y", "<i2"), ("z", "<i2"), ("t", "<u2")])
    rec["x"], rec["y"], rec["z"] = q(X, sx), q(Y, sy), q(Z, sz)
    rec["t"] = np.round(np.clip(T, 0, 1) * 65535).astype("<u2")

    OUT_DIR.mkdir(parents=True, exist_ok=True)
    with open(OUT_DIR / "portrait.bin", "wb") as f:
        f.write(b"BPT1" + struct.pack("<I3f", a.points, sx, sy, sz) + rec.tobytes())

    render_still(X, Y, T, rng, OUT_DIR / "portrait-still.webp")

    if a.debug_dir:
        a.debug_dir.mkdir(parents=True, exist_ok=True)
        Image.fromarray((mask * 255).astype(np.uint8)).save(a.debug_dir / "mask.png")
        Image.fromarray((depth * 255).astype(np.uint8)).save(a.debug_dir / "depth.png")
        Image.fromarray((weight / weight.max() * 255).astype(np.uint8)).save(a.debug_dir / "weight.png")

    size = (OUT_DIR / "portrait.bin").stat().st_size
    print(f"points={a.points} bin={size / 1024:.0f} KB scale=({sx:.3f},{sy:.3f},{sz:.3f})")


def render_still(X, Y, T, rng, out: Path, w: int = 960, h: int = 1200) -> None:
    """Static binary portrait for reduced motion / no WebGL. Charcoal glyphs on paper."""
    paper, ink = (240, 240, 238), (23, 23, 25)
    im = Image.new("RGB", (w, h), paper)
    dr = ImageDraw.Draw(im)
    fonts = {}
    font_path = "C:/Windows/Fonts/consola.ttf"
    scale = h / 2 * 0.92
    order = np.argsort(-T)  # light first, dark glyphs drawn on top
    for i in order[: min(len(order), 14000)]:
        darkness = 1 - T[i]
        size = int(6 + 9 * darkness)
        if size not in fonts:
            try:
                fonts[size] = ImageFont.truetype(font_path, size)
            except OSError:
                fonts[size] = ImageFont.load_default()
        a = 0.25 + 0.75 * darkness
        col = tuple(int(paper[c] + (ink[c] - paper[c]) * a) for c in range(3))
        x = w / 2 + X[i] * scale
        y = h / 2 - Y[i] * scale
        dr.text((x, y), "1" if rng.random() < 0.5 else "0", fill=col, font=fonts[size], anchor="mm")
    im.save(out, "WEBP", quality=72, method=6)


if __name__ == "__main__":
    main()
