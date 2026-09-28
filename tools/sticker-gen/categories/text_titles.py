from lib.fonts import text_outline
from lib.registry import sticker
from lib.svg import catmull_rom, heart, n

PINK = "#FF6B9D"
PINK_LIGHT = "#FFC4D8"
BUTTER = "#FFD66B"


@sticker("title_good_day", "text_titles", "Good Day ♡", "美好的一天",
         ["good day", "title", "handwritten", "pink", "vlog", "美好", "标题", "手写"], fonts=["Satisfy"])
def title_good_day():
    t = text_outline("Good Day", "Satisfy", 200, 390, 255, anchor="middle")
    x0, y0, x1, y1 = t.bbox
    # yellow marker swoosh behind the baseline
    sw = catmull_rom([(x0 + 40, y1 - 38), (x0 + 200, y1 - 52), (x0 + 420, y1 - 58), (x1 - 10, y1 - 70)])
    # offset "misprint" echo layer in light pink, then the main pink letters
    echo = text_outline("Good Day", "Satisfy", 200, 396, 261, anchor="middle")
    hx, hy = x1 + 58, y0 + 14
    sparks = "".join(
        f'<path d="M{n(hx + a)} {n(hy + b)}L{n(hx + c)} {n(hy + d)}" />'
        for a, b, c, d in [(-18, -62, -12, -44), (2, -66, 4, -48), (22, -58, 14, -42)])
    inner = (
        f'<path d="{sw}" fill="none" stroke="{BUTTER}" stroke-width="30" stroke-linecap="round"/>'
        f'<path d="{echo.d}" fill="{PINK_LIGHT}"/>'
        f'<path d="{t.d}" fill="{PINK}"/>'
        f'<path d="{heart(hx, hy + 6, 30)}" fill="{PINK}" transform="rotate(14 {n(hx)} {n(hy)})"/>'
        f'<g stroke="{PINK}" stroke-width="7" stroke-linecap="round" fill="none"'
        f' transform="rotate(14 {n(hx)} {n(hy)})">{sparks}</g>'
    )
    return inner, (0, 0, 820, 400)
