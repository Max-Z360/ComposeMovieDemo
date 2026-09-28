import random

from lib.registry import sticker
from lib.svg import lin, n, rad, rrect

P = "food_bubble_tea"


@sticker(P, "food_life", "Bubble tea", "珍珠奶茶",
         ["bubble tea", "boba", "milk tea", "drink", "cafe", "奶茶", "珍珠奶茶", "饮品", "下午茶"])
def food_bubble_tea():
    # cup: trapezoid with rounded bottom corners
    tl, tr, bl, br, top, bot = 92, 308, 120, 280, 196, 580
    cup = (f"M{tl} {top}H{tr}L{br + 4} {bot - 22}Q{br} {bot} {br - 22} {bot}"
           f"H{bl + 22}Q{bl} {bot} {bl - 4} {bot - 22}Z")
    foam = (f"M{tl} {top}H{tr}L{tr - 3} 262"
            f"Q280 250 262 266Q240 282 218 264Q196 248 176 266Q154 284 134 264Q116 248 {tl + 3} 262Z")
    rnd = random.Random(7)
    pearls = []
    for row, (y, xs) in enumerate([(548, range(142, 270, 34)), (516, range(126, 290, 34)), (486, range(144, 272, 36))]):
        for x in xs:
            px, py = x + rnd.uniform(-5, 5), y + rnd.uniform(-5, 5)
            pearls.append(f'<circle cx="{n(px)}" cy="{n(py)}" r="17" fill="url(#{P}-pearl)"/>'
                          f'<circle cx="{n(px - 6)}" cy="{n(py - 7)}" r="4.5" fill="#FFFFFF" fill-opacity="0.55"/>')
    straw_d = rrect(-19, -226, 38, 376, 19)
    defs = (
        f'<defs><clipPath id="{P}-cup"><path d="{cup}"/></clipPath>'
        + lin(f"{P}-tea", 0, top, 0, bot, [(0, "#EBCDA8"), (1, "#C9966B")])
        + rad(f"{P}-pearl", 0.38, 0.32, 0.75, [(0, "#7A4A36"), (0.55, "#43261A"), (1, "#26140D")], units="objectBoundingBox")
        + lin(f"{P}-dome", 0, 60, 0, 200, [(0, "#FFFFFF", 0.92), (1, "#F4EEE8", 0.92)])
        + lin(f"{P}-straw", -19, 0, 19, 0, [(0, "#FF86B3"), (0.55, "#FF9CC2"), (1, "#F06C9E")])
        + "</defs>")
    straw = f'<g transform="translate(236 176) rotate(12)"><path d="{straw_d}" fill="url(#{P}-straw)"/></g>'
    body = (
        straw
        + f'<path d="{cup}" fill="url(#{P}-tea)"/>'
        + f'<g clip-path="url(#{P}-cup)">'
        + f'<path d="{foam}" fill="#FBF1E4"/>'
        + "".join(pearls)
        # plastic cup glare
        + f'<path d="{rrect(112, 250, 18, 240, 9)}" fill="#FFFFFF" fill-opacity="0.45" transform="rotate(-4 121 370)"/>'
        + f'<path d="{rrect(270, 270, 9, 120, 4.5)}" fill="#FFFFFF" fill-opacity="0.3" transform="rotate(4 274 330)"/>'
        + "</g>"
        # heart label on the cup
        + f'<circle cx="200" cy="360" r="46" fill="#FFFFFF" fill-opacity="0.92"/>'
        + f'<path d="M200 352C204 340 222 338 224 352C226 364 212 374 200 384C188 374 174 364 176 352C178 338 196 340 200 352Z" fill="#FF7AA8"/>'
        # rim + dome lid
        + f'<path d="{rrect(78, 180, 244, 30, 15)}" fill="#F1EAE2"/>'
        + f'<path d="M92 184C92 118 140 84 200 84C260 84 308 118 308 184Z" fill="url(#{P}-dome)"/>'
        + f'<path d="M120 160C124 128 146 108 170 100" fill="none" stroke="#FFFFFF" stroke-width="9" stroke-linecap="round"/>'
        # straw part above the lid (drawn again so it sits on top of the dome)
        + f'<g transform="translate(236 176) rotate(12)"><path d="{rrect(-19, -226, 38, 156, 19)}" fill="url(#{P}-straw)"/>'
        + f'<path d="{rrect(-11, -214, 7, 124, 3.5)}" fill="#FFFFFF" fill-opacity="0.4"/></g>'
    )
    return defs + body, (0, 0, 420, 620)
