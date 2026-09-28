import math
import random

from lib.registry import sticker
from lib.svg import catmull_rom, n


def _blob(rnd, cx, cy, r, k=7):
    pts = []
    for i in range(k):
        a = 2 * math.pi * i / k + rnd.uniform(-0.2, 0.2)
        rr = r * rnd.uniform(0.6, 1.25)
        pts.append((cx + rr * math.cos(a), cy + rr * math.sin(a)))
    return catmull_rom(pts, closed=True)


@sticker("overlay_film_dust", "backgrounds_overlays", "Film dust & scratches (9:16)", "胶片灰尘划痕 (竖屏)",
         ["overlay", "film", "dust", "scratches", "vintage", "grain", "胶片", "灰尘", "划痕", "复古", "叠加"],
         trim=False, px=3840)
def overlay_film_dust():
    W, H = 1080, 1920
    rnd = random.Random(2026)
    specks, hairs, scratches = [], [], []
    for _ in range(170):
        r = rnd.choice([0.9, 1.1, 1.4, 1.8, 2.2, 2.8, 3.4])
        specks.append(f'<path d="{_blob(rnd, rnd.uniform(0, W), rnd.uniform(0, H), r, 6)}" '
                      f'fill-opacity="{n(rnd.uniform(0.45, 0.95))}"/>')
    for _ in range(22):
        specks.append(f'<path d="{_blob(rnd, rnd.uniform(0, W), rnd.uniform(0, H), rnd.uniform(3.5, 7), 8)}" '
                      f'fill-opacity="{n(rnd.uniform(0.5, 0.85))}"/>')
    for _ in range(12):
        x, y = rnd.uniform(40, W - 40), rnd.uniform(40, H - 40)
        L = rnd.uniform(25, 90)
        a = rnd.uniform(0, 2 * math.pi)
        pts = []
        for i in range(5):
            a += rnd.uniform(-0.9, 0.9)
            x += L / 4 * math.cos(a)
            y += L / 4 * math.sin(a)
            pts.append((x, y))
        hairs.append(f'<path d="{catmull_rom(pts)}" stroke-width="{n(rnd.uniform(1.1, 2.0))}" '
                     f'stroke-opacity="{n(rnd.uniform(0.5, 0.8))}"/>')
    for _ in range(7):
        x = rnd.uniform(60, W - 60)
        y0 = rnd.uniform(-100, H * 0.6)
        L = rnd.uniform(250, 1300)
        pts = [(x + rnd.uniform(-4, 4), y0 + L * i / 4) for i in range(5)]
        scratches.append(f'<path d="{catmull_rom(pts)}" stroke-width="{n(rnd.uniform(0.9, 1.8))}" '
                         f'stroke-opacity="{n(rnd.uniform(0.2, 0.42))}"/>')
    inner = (f'<g fill="#FFFDF6">{"".join(specks)}</g>'
             f'<g fill="none" stroke="#FFFDF6" stroke-linecap="round">{"".join(hairs)}{"".join(scratches)}</g>')
    return inner, (0, 0, W, H)
