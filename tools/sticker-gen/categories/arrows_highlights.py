import math

from lib.registry import sticker
from lib.svg import catmull_rom, n

PINK = "#FF7AAE"


@sticker("arrow_loop_pink", "arrows_highlights", "Loopy doodle arrow", "手绘绕圈箭头",
         ["arrow", "doodle", "hand drawn", "loop", "pointer", "箭头", "手绘", "指向"])
def arrow_loop_pink():
    pts = [(60, 262), (140, 288), (228, 276), (296, 222), (306, 166), (272, 140), (236, 168),
           (250, 232), (320, 272), (420, 268), (520, 224), (604, 156)]
    d = catmull_rom(pts)
    tip = pts[-1]
    prev = (560, 196)
    ang = math.atan2(tip[1] - prev[1], tip[0] - prev[0])
    L = 64
    wing = [(tip[0] + L * math.cos(a), tip[1] + L * math.sin(a))
            for a in (ang + math.pi + math.radians(38), ang + math.pi - math.radians(38))]
    head = f"M{n(wing[0][0])} {n(wing[0][1])}L{n(tip[0])} {n(tip[1])}L{n(wing[1][0])} {n(wing[1][1])}"
    inner = (f'<g fill="none" stroke="{PINK}" stroke-width="17" stroke-linecap="round" stroke-linejoin="round">'
             f'<path d="{d}"/><path d="{head}"/></g>')
    return inner, (0, 0, 680, 360)
