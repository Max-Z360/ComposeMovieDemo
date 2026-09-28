"""Small SVG authoring helpers (gradients, smooth curves, common shapes)."""
from __future__ import annotations

import math
import random


def n(v: float) -> str:
    return f"{v:.2f}".rstrip("0").rstrip(".")


def stops(pairs) -> str:
    out = []
    for p in pairs:
        off, col = p[0], p[1]
        op = p[2] if len(p) > 2 else 1
        o = f' stop-opacity="{n(op)}"' if op != 1 else ""
        out.append(f'<stop offset="{n(off)}" stop-color="{col}"{o}/>')
    return "".join(out)


def lin(id, x1, y1, x2, y2, st, units="userSpaceOnUse") -> str:
    return (f'<linearGradient id="{id}" gradientUnits="{units}" x1="{n(x1)}" y1="{n(y1)}" '
            f'x2="{n(x2)}" y2="{n(y2)}">{stops(st)}</linearGradient>')


def rad(id, cx, cy, r, st, fx=None, fy=None, units="userSpaceOnUse", transform=None) -> str:
    f = ""
    if fx is not None:
        f = f' fx="{n(fx)}" fy="{n(fy)}"'
    t = f' gradientTransform="{transform}"' if transform else ""
    return (f'<radialGradient id="{id}" gradientUnits="{units}" cx="{n(cx)}" cy="{n(cy)}" r="{n(r)}"{f}{t}>'
            f'{stops(st)}</radialGradient>')


def catmull_rom(points, closed=False, tension=0.5) -> str:
    """Smooth path through points (Catmull-Rom -> cubic Bezier)."""
    pts = list(points)
    if closed:
        P = [pts[-1]] + pts + [pts[0], pts[1]]
    else:
        P = [pts[0]] + pts + [pts[-1]]
    d = [f"M{n(pts[0][0])} {n(pts[0][1])}"]
    k = tension / 3 * 2  # 1/6 * 2 * tension*... (0.5 -> standard CR)
    k = 1 / 6 if tension == 0.5 else tension / 3
    for i in range(1, len(P) - 2):
        p0, p1, p2, p3 = P[i - 1], P[i], P[i + 1], P[i + 2]
        c1 = (p1[0] + (p2[0] - p0[0]) * k, p1[1] + (p2[1] - p0[1]) * k)
        c2 = (p2[0] - (p3[0] - p1[0]) * k, p2[1] - (p3[1] - p1[1]) * k)
        d.append(f"C{n(c1[0])} {n(c1[1])} {n(c2[0])} {n(c2[1])} {n(p2[0])} {n(p2[1])}")
    if closed:
        d.append("Z")
    return "".join(d)


def star4(cx, cy, r, inner=0.18, rot=0.0) -> str:
    """Four-point 'sparkle' star with concave curved sides."""
    d = []
    for i in range(4):
        a = rot + i * math.pi / 2
        tip = (cx + r * math.cos(a), cy + r * math.sin(a))
        a2 = a + math.pi / 2
        nxt = (cx + r * math.cos(a2), cy + r * math.sin(a2))
        # control near centre gives the concave "sparkle" silhouette
        am = a + math.pi / 4
        c = (cx + r * inner * math.cos(am), cy + r * inner * math.sin(am))
        if i == 0:
            d.append(f"M{n(tip[0])} {n(tip[1])}")
        d.append(f"Q{n(c[0])} {n(c[1])} {n(nxt[0])} {n(nxt[1])}")
    d.append("Z")
    return "".join(d)


def rrect(x, y, w, h, r) -> str:
    r = min(r, w / 2, h / 2)
    return (f"M{n(x + r)} {n(y)}H{n(x + w - r)}A{n(r)} {n(r)} 0 0 1 {n(x + w)} {n(y + r)}"
            f"V{n(y + h - r)}A{n(r)} {n(r)} 0 0 1 {n(x + w - r)} {n(y + h)}H{n(x + r)}"
            f"A{n(r)} {n(r)} 0 0 1 {n(x)} {n(y + h - r)}V{n(y + r)}A{n(r)} {n(r)} 0 0 1 {n(x + r)} {n(y)}Z")


def heart(cx, cy, s) -> str:
    """Plump heart centred roughly on (cx, cy); s ~ half-width."""
    def p(x, y):
        return f"{n(cx + x * s)} {n(cy + y * s)}"
    return (f"M{p(0, -0.52)}"
            f"C{p(0.16, -0.92)} {p(0.66, -1.02)} {p(0.9, -0.66)}"
            f"C{p(1.12, -0.32)} {p(0.98, 0.12)} {p(0.62, 0.46)}"
            f"C{p(0.4, 0.66)} {p(0.14, 0.84)} {p(0, 0.96)}"
            f"C{p(-0.14, 0.84)} {p(-0.4, 0.66)} {p(-0.62, 0.46)}"
            f"C{p(-0.98, 0.12)} {p(-1.12, -0.32)} {p(-0.9, -0.66)}"
            f"C{p(-0.66, -1.02)} {p(-0.16, -0.92)} {p(0, -0.52)}Z")


def jitter(points, amt, seed=1):
    rnd = random.Random(seed)
    return [(x + rnd.uniform(-amt, amt), y + rnd.uniform(-amt, amt)) for x, y in points]
