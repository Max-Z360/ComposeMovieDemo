"""Font registry + text-to-outline conversion.

All fonts are open-licensed (SIL OFL / Apache 2.0) from github.com/google/fonts.
Text in every sticker is converted to plain SVG paths, so the delivered SVGs never
depend on installed fonts and scale losslessly.
"""
from __future__ import annotations

import os
import urllib.request
from dataclasses import dataclass
from functools import lru_cache
from pathlib import Path

import uharfbuzz as hb
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.boundsPen import BoundsPen
from fontTools.pens.transformPen import TransformPen
from fontTools.ttLib import TTFont

_GF = "https://raw.githubusercontent.com/google/fonts/main/"
CACHE = Path(os.environ.get("STICKER_FONT_CACHE", Path(__file__).resolve().parent.parent / ".fontcache"))

# name -> (repo path, license)
FONTS: dict[str, tuple[str, str]] = {
    "Caveat": ("ofl/caveat/Caveat[wght].ttf", "OFL-1.1"),
    "CaveatBrush": ("ofl/caveatbrush/CaveatBrush-Regular.ttf", "OFL-1.1"),
    "KaushanScript": ("ofl/kaushanscript/KaushanScript-Regular.ttf", "OFL-1.1"),
    "Satisfy": ("apache/satisfy/Satisfy-Regular.ttf", "Apache-2.0"),
    "Pacifico": ("ofl/pacifico/Pacifico-Regular.ttf", "OFL-1.1"),
    "Yellowtail": ("apache/yellowtail/Yellowtail-Regular.ttf", "Apache-2.0"),
    "Sacramento": ("ofl/sacramento/Sacramento-Regular.ttf", "OFL-1.1"),
    "DancingScript": ("ofl/dancingscript/DancingScript[wght].ttf", "OFL-1.1"),
    "Mansalva": ("ofl/mansalva/Mansalva-Regular.ttf", "OFL-1.1"),
    "PermanentMarker": ("apache/permanentmarker/PermanentMarker-Regular.ttf", "Apache-2.0"),
    "GochiHand": ("ofl/gochihand/GochiHand-Regular.ttf", "OFL-1.1"),
    "PatrickHand": ("ofl/patrickhand/PatrickHand-Regular.ttf", "OFL-1.1"),
    "Fredoka": ("ofl/fredoka/Fredoka[wdth,wght].ttf", "OFL-1.1"),
    "Nunito": ("ofl/nunito/Nunito[wght].ttf", "OFL-1.1"),
    "PoppinsSemiBold": ("ofl/poppins/Poppins-SemiBold.ttf", "OFL-1.1"),
    "PoppinsBold": ("ofl/poppins/Poppins-Bold.ttf", "OFL-1.1"),
    "PoppinsExtraBold": ("ofl/poppins/Poppins-ExtraBold.ttf", "OFL-1.1"),
    "Oswald": ("ofl/oswald/Oswald[wght].ttf", "OFL-1.1"),
    "Anton": ("ofl/anton/Anton-Regular.ttf", "OFL-1.1"),
    "SpaceMono": ("ofl/spacemono/SpaceMono-Regular.ttf", "OFL-1.1"),
    "SpaceMonoBold": ("ofl/spacemono/SpaceMono-Bold.ttf", "OFL-1.1"),
    "DMMono": ("ofl/dmmono/DMMono-Medium.ttf", "OFL-1.1"),
    "ShareTechMono": ("ofl/sharetechmono/ShareTechMono-Regular.ttf", "OFL-1.1"),
    "VT323": ("ofl/vt323/VT323-Regular.ttf", "OFL-1.1"),
}


def font_path(name: str) -> Path:
    repo_path, _ = FONTS[name]
    dst = CACHE / Path(repo_path).name
    if not dst.exists():
        CACHE.mkdir(parents=True, exist_ok=True)
        url = _GF + urllib.request.quote(repo_path)
        with urllib.request.urlopen(url) as r:
            dst.write_bytes(r.read())
    return dst


@lru_cache(maxsize=None)
def _hb_face(name: str):
    data = font_path(name).read_bytes()
    return hb.Face(data)


@lru_cache(maxsize=None)
def _upem(name: str) -> int:
    return TTFont(font_path(name), lazy=True)["head"].unitsPerEm


@dataclass
class TextOutline:
    d: str
    bbox: tuple[float, float, float, float]  # x0, y0, x1, y1 in SVG coords
    advance: float

    @property
    def width(self):
        return self.bbox[2] - self.bbox[0]

    @property
    def height(self):
        return self.bbox[3] - self.bbox[1]


def text_outline(text: str, font: str, size: float, x: float = 0, y: float = 0, *,
                 anchor: str = "start", tracking: float = 0.0,
                 variations: dict[str, float] | None = None,
                 features: dict[str, bool] | None = None) -> TextOutline:
    """Shape `text` with HarfBuzz and return its outline as an SVG path.

    (x, y) is the baseline origin. `tracking` is extra letter spacing in em units.
    `anchor`: start | middle | end  (horizontal alignment on the advance box).
    """
    face = _hb_face(font)
    hbfont = hb.Font(face)
    upem = _upem(font)
    if variations:
        hbfont.set_variations(variations)
    buf = hb.Buffer()
    buf.add_str(text)
    buf.guess_segment_properties()
    hb.shape(hbfont, buf, features or {})

    scale = size / upem
    total = sum(p.x_advance for p in buf.glyph_positions) + tracking * upem * max(len(buf.glyph_infos) - 1, 0)
    ox = {"start": 0, "middle": -total / 2, "end": -total}[anchor]

    svg_pen = SVGPathPen(None, ntos=lambda v: f"{v:.2f}".rstrip("0").rstrip("."))
    bounds = BoundsPen(None)
    cx = 0.0
    for info, pos in zip(buf.glyph_infos, buf.glyph_positions):
        gx = cx + pos.x_offset
        gy = pos.y_offset
        # font units (y up) -> svg (y down)
        t = (scale, 0, 0, -scale, x + (ox + gx) * scale, y - gy * scale)
        hbfont.draw_glyph_with_pen(info.codepoint, TransformPen(svg_pen, t))
        hbfont.draw_glyph_with_pen(info.codepoint, TransformPen(bounds, t))
        cx += pos.x_advance + tracking * upem
    b = bounds.bounds or (x, y, x, y)
    return TextOutline(svg_pen.getCommands(), b, total * scale)


def license_of(name: str) -> str:
    return FONTS[name][1]
