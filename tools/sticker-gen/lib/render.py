"""SVG -> PNG rendering with auto-trim and alpha bleeding.

Why alpha bleeding: fully transparent pixels normally store RGB = black. Editors and
GPU pipelines that filter/scale straight-alpha textures mix that black into the edge
pixels, producing a dark halo ("黑边"). We fill the RGB of every fully transparent
pixel with the colour of the nearest visible artwork (push-pull), so edge sampling
only ever blends with the sticker's own colours. Alpha is untouched.
"""
from __future__ import annotations

import html
import io
import re

import numpy as np
import resvg_py
from PIL import Image

SVG_NS = 'xmlns="http://www.w3.org/2000/svg"'


def wrap_svg(inner: str, vb: tuple[float, float, float, float], title: str = "", out_w: int | None = None) -> str:
    x, y, w, h = vb
    if out_w is None:
        out_w = w
    out_h = out_w * h / w
    t = f"<title>{html.escape(title)}</title>" if title else ""
    return (f'<svg {SVG_NS} viewBox="{_n(x)} {_n(y)} {_n(w)} {_n(h)}" '
            f'width="{_n(out_w)}" height="{_n(out_h)}">{t}{inner}</svg>')


def _n(v: float) -> str:
    return f"{v:.2f}".rstrip("0").rstrip(".")


def render(svg: str, width: int | None, height: int | None = None) -> Image.Image:
    png = resvg_py.svg_to_bytes(svg_string=svg, width=width, height=height, skip_system_fonts=True)
    return Image.open(io.BytesIO(bytes(png))).convert("RGBA")


def content_bbox(inner: str, vb, probe_px: int = 1600, alpha_threshold: int = 2):
    """Visible bounds of the artwork, in viewBox units.

    Probes an area 2x the nominal canvas so artwork that overflows it is kept, not clipped.
    """
    x, y, w, h = vb[0] - vb[2] / 2, vb[1] - vb[3] / 2, vb[2] * 2, vb[3] * 2
    img = render(wrap_svg(inner, (x, y, w, h)), probe_px * 2)
    a = np.asarray(img)[..., 3]
    ys, xs = np.nonzero(a >= alpha_threshold)
    if len(xs) == 0:
        return vb
    s = w / img.width
    return (x + xs.min() * s, y + ys.min() * s, x + (xs.max() + 1) * s, y + (ys.max() + 1) * s)


def trimmed_viewbox(inner: str, vb, pad_ratio: float = 0.04):
    x0, y0, x1, y1 = content_bbox(inner, vb)
    pad = max(x1 - x0, y1 - y0) * pad_ratio
    return (x0 - pad, y0 - pad, (x1 - x0) + 2 * pad, (y1 - y0) + 2 * pad)


def alpha_bleed(img: Image.Image) -> Image.Image:
    arr = np.asarray(img).astype(np.float32)
    rgb, a = arr[..., :3], arr[..., 3] / 255.0
    if (a > 0).all() or not (a > 0).any():
        return img
    H, W = a.shape
    levels = []
    P, Wt = rgb * a[..., None], a.copy()
    while P.shape[0] > 1 or P.shape[1] > 1:
        levels.append((P, Wt))
        ph, pw = P.shape[0] % 2, P.shape[1] % 2
        if ph or pw:
            P = np.pad(P, ((0, ph), (0, pw), (0, 0)))
            Wt = np.pad(Wt, ((0, ph), (0, pw)))
        P = P[0::2, 0::2] + P[1::2, 0::2] + P[0::2, 1::2] + P[1::2, 1::2]
        Wt = Wt[0::2, 0::2] + Wt[1::2, 0::2] + Wt[0::2, 1::2] + Wt[1::2, 1::2]
    color = P / np.maximum(Wt, 1e-8)[..., None]
    for P, Wt in reversed(levels):
        h, w = Wt.shape
        up = np.repeat(np.repeat(color, 2, 0), 2, 1)[:h, :w]
        color = np.where((Wt > 0)[..., None], P / np.maximum(Wt, 1e-8)[..., None], up)
    out = arr.copy()
    transparent = arr[..., 3] == 0
    out[..., :3][transparent] = color[transparent]
    return Image.fromarray(np.clip(out + 0.5, 0, 255).astype(np.uint8), "RGBA")


def clean_svg(svg: str) -> str:
    return re.sub(r">\s+<", "><", svg.strip())
