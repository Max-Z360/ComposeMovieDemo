from lib.registry import sticker
from lib.svg import rad, star4

P = "deco_sparkle_glow"


@sticker(P, "decorative", "Glowing sparkle", "闪光星芒",
         ["sparkle", "star", "glow", "shine", "bling", "magic", "闪光", "星星", "发光", "氛围"])
def deco_sparkle_glow():
    # glow is a radial gradient that fades to transparent *in its own colour* -> no grey/black halo
    defs = (
        "<defs>"
        + rad(f"{P}-glow", 300, 300, 290, [(0, "#FFE9A6", 0.75), (0.25, "#FFDF8A", 0.38), (0.6, "#FFD27A", 0.1), (1, "#FFD27A", 0)])
        + rad(f"{P}-star", 300, 300, 230, [(0, "#FFFFFF"), (0.22, "#FFF6D8"), (0.6, "#FFD778"), (1, "#F2B54A")])
        + rad(f"{P}-core", 300, 300, 70, [(0, "#FFFFFF"), (0.5, "#FFFFFF", 0.7), (1, "#FFFFFF", 0)])
        + rad(f"{P}-s2", 470, 150, 70, [(0, "#FFFFFF"), (0.4, "#FFF3C9"), (1, "#FFCF66")])
        + "</defs>"
    )
    body = (
        f'<circle cx="300" cy="300" r="290" fill="url(#{P}-glow)"/>'
        f'<path d="{star4(300, 300, 225, inner=0.13, rot=-1.5708)}" fill="url(#{P}-star)"/>'
        f'<circle cx="300" cy="300" r="70" fill="url(#{P}-core)"/>'
        f'<path d="{star4(470, 150, 58, inner=0.16, rot=-1.5708)}" fill="url(#{P}-s2)"/>'
        f'<circle cx="150" cy="455" r="11" fill="#FFE39A"/>'
        f'<circle cx="485" cy="420" r="7" fill="#FFE39A"/>'
    )
    return defs + body, (0, 0, 600, 600)
