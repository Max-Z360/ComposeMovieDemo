from lib.fonts import text_outline
from lib.registry import sticker
from lib.svg import lin, n, rrect

P = "social_subscribe_button"


@sticker(P, "social_ui", "Subscribe button", "订阅按钮",
         ["subscribe", "button", "bell", "cta", "follow", "订阅", "关注", "按钮", "小铃铛"], fonts=["PoppinsExtraBold"])
def social_subscribe_button():
    x, y, w, h = 20, 40, 540, 136
    bell = ("M-27 17C-27 -8 -22 -31 0 -31C22 -31 27 -8 27 17L33 25C35 29 33 31 29 31H-29C-33 31 -35 29 -33 25Z"
            "M-11 37A11 11 0 0 0 11 37Z")
    t = text_outline("SUBSCRIBE", "PoppinsExtraBold", 54, 0, 0, tracking=0.03)
    bx = x + 58
    tx = bx + 50
    ty = y + h / 2 - (t.bbox[1] + t.bbox[3]) / 2 - 4
    t = text_outline("SUBSCRIBE", "PoppinsExtraBold", 54, tx, ty, tracking=0.03)
    w = (t.bbox[2] - x) + 48
    cursor = "M0 0L0 80L20 62L34 93L49 86L35 56L61 56Z"
    defs = ("<defs>"
            + lin(f"{P}-bg", 0, y, 0, y + h, [(0, "#FF5A5F"), (1, "#EE2D45")])
            + lin(f"{P}-gloss", 0, y, 0, y + h / 2, [(0, "#FFFFFF", 0.28), (1, "#FFFFFF", 0)])
            + "</defs>")
    body = (
        f'<path d="{rrect(x, y + 10, w, h, 38)}" fill="#C21B33"/>'
        f'<path d="{rrect(x, y, w, h, 38)}" fill="url(#{P}-bg)"/>'
        f'<path d="{rrect(x + 10, y + 6, w - 20, h / 2 - 6, 30)}" fill="url(#{P}-gloss)"/>'
        f'<g transform="translate({n(bx)} {n(y + h / 2 - 4)}) rotate(-12)"><path d="{bell}" fill="#FFFFFF"/>'
        f'<circle cx="0" cy="-35" r="6" fill="#FFFFFF"/></g>'
        f'<path d="{t.d}" fill="#FFFFFF"/>'
        f'<g transform="translate({n(x + w - 70)} {n(y + h - 40)}) rotate(-14) scale(1.05)">'
        f'<path d="{cursor}" fill="#FFFFFF" stroke="#1B1B1F" stroke-width="7" stroke-linejoin="round"/></g>'
    )
    return defs + body, (0, 0, w + 80, 300)
