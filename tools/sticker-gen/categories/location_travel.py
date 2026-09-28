from lib.fonts import text_outline
from lib.registry import sticker
from lib.svg import n, rrect

MINT = "#9FE3BA"
MINT_EDGE = "#74C797"
POST = "#6FA58B"
POST_DARK = "#557F6B"
INK = "#1E5A3E"


def _board(x, y, w, h, tip, pointing="right"):
    """Arrow-shaped sign board with softly rounded corners."""
    r = 12
    if pointing == "right":
        return (f"M{n(x + r)} {n(y)}H{n(x + w - tip)}L{n(x + w)} {n(y + h / 2)}L{n(x + w - tip)} {n(y + h)}"
                f"H{n(x + r)}Q{n(x)} {n(y + h)} {n(x)} {n(y + h - r)}V{n(y + r)}Q{n(x)} {n(y)} {n(x + r)} {n(y)}Z")
    return (f"M{n(x + w - r)} {n(y)}H{n(x + tip)}L{n(x)} {n(y + h / 2)}L{n(x + tip)} {n(y + h)}"
            f"H{n(x + w - r)}Q{n(x + w)} {n(y + h)} {n(x + w)} {n(y + h - r)}V{n(y + r)}Q{n(x + w)} {n(y)} {n(x + w - r)} {n(y)}Z")


def _sign(word, x, y, w, h, rot, cx, pointing="right"):
    body = _board(x, y, w, h, 40, pointing)
    edge = _board(x, y + 9, w, h, 40, pointing)
    tx = x + (w - 40) / 2 + (0 if pointing == "right" else 40)
    t = text_outline(word, "Fredoka", 50, tx, y + h / 2 + 18, anchor="middle", tracking=0.06,
                     variations={"wght": 600, "wdth": 100})
    return (f'<g transform="rotate({rot} {n(cx)} {n(y + h / 2)})">'
            f'<path d="{edge}" fill="{MINT_EDGE}" stroke="{MINT_EDGE}" stroke-width="6" stroke-linejoin="round"/>'
            f'<path d="{body}" fill="{MINT}" stroke="{MINT}" stroke-width="6" stroke-linejoin="round"/>'
            f'<path d="{t.d}" fill="{INK}"/>'
            f'<circle cx="{n(cx)}" cy="{n(y + h / 2)}" r="6" fill="{POST_DARK}"/>'
            f'</g>')


@sticker("travel_signpost", "location_travel", "Travel signpost", "旅行路牌",
         ["travel", "signpost", "trip", "direction", "vacation", "旅行", "路牌", "出发"], fonts=["Fredoka"])
def travel_signpost():
    cx = 250
    post = (f'<path d="{rrect(cx - 16, 70, 32, 520, 12)}" fill="{POST}"/>'
            f'<path d="{rrect(cx + 4, 70, 12, 520, 6)}" fill="{POST_DARK}" fill-opacity="0.45"/>'
            f'<ellipse cx="{cx}" cy="70" rx="16" ry="7" fill="{POST_DARK}"/>')
    grass = (f'<g fill="none" stroke="#7CCB8F" stroke-width="10" stroke-linecap="round">'
             f'<path d="M{cx - 42} 592Q{cx - 36} 560 {cx - 52} 538"/>'
             f'<path d="M{cx - 26} 592Q{cx - 24} 552 {cx - 12} 528"/>'
             f'<path d="M{cx + 30} 592Q{cx + 34} 562 {cx + 50} 546"/>'
             f'</g>')
    inner = (post + grass
             + _sign("TRAVEL", 92, 120, 330, 92, -6, cx)
             + _sign("MORE", 128, 260, 260, 92, 5, cx))
    return inner, (0, 0, 520, 640)
