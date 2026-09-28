from lib.fonts import text_outline
from lib.registry import sticker
from lib.svg import n

INK = "#2B2A2E"
PINK = "#FF5C93"


@sticker("callout_important", "callouts_shapes", "Important! label", "重点标签",
         ["important", "label", "note", "paper", "callout", "重要", "标签", "便签"], fonts=["Caveat"])
def callout_important():
    # slightly irregular hand-cut paper label
    pts = [(60, 92), (606, 80), (614, 250), (66, 262)]
    d = "M" + "L".join(f"{n(x)} {n(y)}" for x, y in pts) + "Z"
    edge = "M" + "L".join(f"{n(x + 7)} {n(y + 10)}" for x, y in pts) + "Z"
    t = text_outline("Important!", "Caveat", 132, 336, 212, anchor="middle", variations={"wght": 700})
    ax, ay = 648, 58
    arms = "".join(f'<path d="M{n(ax)} {n(ay - 30)}V{n(ay + 30)}" transform="rotate({a} {ax} {ay})"/>'
                   for a in (0, 60, 120))
    inner = (
        f'<g transform="rotate(-4 336 170)">'
        f'<path d="{edge}" fill="#E9E1D6" stroke="#E9E1D6" stroke-width="10" stroke-linejoin="round"/>'
        f'<path d="{d}" fill="#FFFFFF" stroke="#E4DCD0" stroke-width="10" stroke-linejoin="round"/>'
        f'<path d="{d}" fill="#FFFFFF" stroke="#FFFFFF" stroke-width="5" stroke-linejoin="round"/>'
        f'<path d="{t.d}" fill="{INK}"/>'
        f'</g>'
        f'<g stroke="{PINK}" stroke-width="11" stroke-linecap="round">{arms}</g>'
    )
    return inner, (0, 0, 700, 340)
