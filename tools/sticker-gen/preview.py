"""Contact sheets for reviewing a batch (not part of the deliverable assets)."""
from __future__ import annotations

from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFont

from lib.fonts import font_path
from lib.registry import CATEGORIES


def _font(size, name="PoppinsSemiBold"):
    return ImageFont.truetype(str(font_path(name)), size)


def _fit(img: Image.Image, bw: int, bh: int) -> Image.Image:
    s = min(bw / img.width, bh / img.height)
    return img.resize((max(1, round(img.width * s)), max(1, round(img.height * s))), Image.LANCZOS)


def _checker(w, h, c=16):
    y, x = np.mgrid[0:h, 0:w]
    m = ((x // c + y // c) % 2).astype(bool)
    a = np.where(m[..., None], [226, 226, 226], [250, 250, 250]).astype(np.uint8)
    return Image.fromarray(a, "RGB").convert("RGBA")


def _photo_bg(w, h):
    y, x = np.mgrid[0:h, 0:w] / max(w, h)
    r = 70 + 150 * x
    g = 110 + 60 * np.sin(6 * y) + 40 * x
    b = 190 - 120 * y
    a = np.clip(np.stack([r, g, b], -1), 0, 255).astype(np.uint8)
    return Image.fromarray(a, "RGB").convert("RGBA")


def _solid(w, h, c):
    return Image.new("RGBA", (w, h), c)


def _naive_scale(img: Image.Image, s: float) -> Image.Image:
    """Worst-case editor: bilinear scaling of straight (non-premultiplied) alpha."""
    a = np.asarray(img).astype(np.float32)
    h, w = a.shape[:2]
    nh, nw = max(1, int(h * s)), max(1, int(w * s))
    ys = np.linspace(0, h - 1, nh)
    xs = np.linspace(0, w - 1, nw)
    y0, x0 = np.floor(ys).astype(int), np.floor(xs).astype(int)
    y1, x1 = np.minimum(y0 + 1, h - 1), np.minimum(x0 + 1, w - 1)
    fy, fx = (ys - y0)[:, None, None], (xs - x0)[None, :, None]
    out = (a[y0][:, x0] * (1 - fy) * (1 - fx) + a[y0][:, x1] * (1 - fy) * fx
           + a[y1][:, x0] * fy * (1 - fx) + a[y1][:, x1] * fy * fx)
    return Image.fromarray(np.clip(out + 0.5, 0, 255).astype(np.uint8), "RGBA")


def make_sheets(out_root: Path, entries: list[dict], batch: int):
    if not entries:
        return
    pdir = out_root / "_preview"
    pdir.mkdir(exist_ok=True)
    imgs = [Image.open(out_root / e["png"]).convert("RGBA") for e in entries]

    # 1) overview gallery
    cols, cw, ch = 4, 420, 470
    rows = (len(entries) + cols - 1) // cols
    W, H = cols * cw + 60, rows * ch + 150
    sheet = Image.new("RGBA", (W, H), (247, 245, 242, 255))
    d = ImageDraw.Draw(sheet)
    d.text((40, 40), f"Sticker pack — batch {batch:02d}", font=_font(40, "PoppinsBold"), fill=(40, 40, 46))
    d.text((40, 96), "PNG previews (transparent assets shown on light cards; overlays on dark)",
           font=_font(20), fill=(130, 128, 125))
    for i, (e, img) in enumerate(zip(entries, imgs)):
        cx, cy = 30 + (i % cols) * cw, 140 + (i // cols) * ch
        dark = e["category"] == "backgrounds_overlays"
        card = _solid(cw - 30, ch - 30, (38, 38, 44, 255) if dark else (255, 255, 255, 255))
        mask = Image.new("L", card.size, 0)
        ImageDraw.Draw(mask).rounded_rectangle([0, 0, card.width - 1, card.height - 1], 28, fill=255)
        sheet.paste(card, (cx, cy), mask)
        th = _fit(img, cw - 90, ch - 150)
        sheet.alpha_composite(th, (cx + (cw - 30 - th.width) // 2, cy + 30 + (ch - 160 - th.height) // 2))
        folder, en, zh = CATEGORIES[e["category"]]
        tc = (235, 235, 240) if dark else (60, 60, 66)
        d.text((cx + 24, cy + ch - 104), en.upper(), font=_font(17), fill=(150, 148, 145))
        d.text((cx + 24, cy + ch - 80), e["id"], font=_font(21), fill=tc)
    sheet.convert("RGB").save(pdir / f"batch{batch:02d}_overview.png", optimize=True)

    # 2) QA sheet: each sticker on checker / white / black / photo + worst-case scaling
    cell, lab = 300, 260
    heads = ["transparent", "on white", "on black", "on photo", "naive scale 25% (on white)"]
    W = lab + cell * len(heads) + 20
    H = 90 + cell * len(entries)
    qa = Image.new("RGBA", (W, H), (255, 255, 255, 255))
    d = ImageDraw.Draw(qa)
    for j, t in enumerate(heads):
        d.text((lab + j * cell + 12, 40), t, font=_font(18), fill=(90, 90, 96))
    for i, (e, img) in enumerate(zip(entries, imgs)):
        y = 80 + i * cell
        d.text((16, y + cell // 2 - 30), CATEGORIES[e["category"]][1], font=_font(15), fill=(150, 148, 145))
        d.text((16, y + cell // 2 - 8), e["id"], font=_font(16), fill=(50, 50, 56))
        bgs = [_checker(cell - 10, cell - 10), _solid(cell - 10, cell - 10, (255, 255, 255, 255)),
               _solid(cell - 10, cell - 10, (12, 12, 14, 255)), _photo_bg(cell - 10, cell - 10),
               _solid(cell - 10, cell - 10, (255, 255, 255, 255))]
        th = _fit(img, cell - 40, cell - 40)
        naive = _naive_scale(img, 0.25)
        naive = naive.resize(_fit(naive, cell - 40, cell - 40).size, Image.NEAREST)
        for j, bg in enumerate(bgs):
            t = naive if j == 4 else th
            bg.alpha_composite(t, ((bg.width - t.width) // 2, (bg.height - t.height) // 2))
            if j != 0:
                ImageDraw.Draw(bg).rectangle([0, 0, bg.width - 1, bg.height - 1], outline=(225, 225, 225))
            qa.alpha_composite(bg, (lab + j * cell, y))
    qa.convert("RGB").save(pdir / f"batch{batch:02d}_qa.png", optimize=True)
