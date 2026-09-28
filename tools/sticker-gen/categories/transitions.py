import math

from lib.fonts import text_outline
from lib.registry import sticker
from lib.svg import n, rad, rrect

P = "transition_countdown_3"


@sticker(P, "transitions", "Film countdown 3", "胶片倒计时 3",
         ["countdown", "film", "leader", "intro", "retro", "cinema", "倒计时", "胶片", "片头", "复古"],
         fonts=["Oswald"])
def transition_countdown_3():
    W, H, cx, cy, R = 640, 480, 320, 240, 188
    sweep = 130  # degrees of the lighter "clock hand" sector
    a0, a1 = -90, -90 + sweep
    p0 = (cx + R * math.cos(math.radians(a0)), cy + R * math.sin(math.radians(a0)))
    p1 = (cx + R * math.cos(math.radians(a1)), cy + R * math.sin(math.radians(a1)))
    sector = f"M{cx} {cy}L{n(p0[0])} {n(p0[1])}A{R} {R} 0 0 1 {n(p1[0])} {n(p1[1])}Z"
    three = text_outline("3", "Oswald", 290, cx, 0, anchor="middle", variations={"wght": 700})
    ty = cy - (three.bbox[1] + three.bbox[3]) / 2  # optically centre the numeral
    three = text_outline("3", "Oswald", 290, cx, ty, anchor="middle", variations={"wght": 700})
    defs = ("<defs>"
            + rad(f"{P}-bg", cx, cy, 420, [(0, "#4B4B4E"), (0.55, "#2A2A2D"), (1, "#111113")])
            + f'<clipPath id="{P}-c"><path d="{rrect(0, 0, W, H, 20)}"/></clipPath>'
            + "</defs>")
    body = (
        f'<path d="{rrect(0, 0, W, H, 20)}" fill="url(#{P}-bg)"/>'
        f'<g clip-path="url(#{P}-c)">'
        f'<path d="{sector}" fill="#8A8A8E" fill-opacity="0.45"/>'
        f'<g stroke="#E6E6E6" stroke-opacity="0.75" stroke-width="4">'
        f'<path d="M0 {cy}H{W}M{cx} 0V{H}"/></g>'
        f'<circle cx="{cx}" cy="{cy}" r="{R}" fill="none" stroke="#F2F2F2" stroke-width="7"/>'
        f'<circle cx="{cx}" cy="{cy}" r="{R - 28}" fill="none" stroke="#F2F2F2" stroke-opacity="0.8" stroke-width="4"/>'
        f'</g>'
        f'<path d="{three.d}" fill="#FFFFFF"/>'
    )
    return defs + body, (0, 0, W, H)
