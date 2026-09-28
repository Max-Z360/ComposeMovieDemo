from lib.registry import sticker
from lib.svg import heart, lin, rad

P = "reaction_heart_glossy"


@sticker(P, "emotions_reactions", "Glossy heart", "3D爱心",
         ["heart", "love", "like", "3d", "glossy", "reaction", "爱心", "喜欢", "点赞"])
def reaction_heart_glossy():
    h = heart(300, 300, 250)
    defs = (
        f'<defs>'
        f'<clipPath id="{P}-c"><path d="{h}"/></clipPath>'
        + rad(f"{P}-base", 225, 185, 420, [(0, "#FFC2E2"), (0.3, "#FF7CC6"), (0.68, "#F2439F"), (1, "#C2177A")])
        + lin(f"{P}-shade", 0, 250, 0, 560, [(0, "#B0105F", 0), (1, "#9E0B55", 0.45)])
        + rad(f"{P}-hl", 0, 0, 1, [(0, "#FFFFFF", 0.95), (0.6, "#FFFFFF", 0.55), (1, "#FFFFFF", 0)],
              units="objectBoundingBox", fx=0.45, fy=0.4)
        + f'</defs>'
    )
    body = (
        f'<path d="{h}" fill="url(#{P}-base)"/>'
        f'<g clip-path="url(#{P}-c)">'
        f'<rect x="0" y="0" width="600" height="600" fill="url(#{P}-shade)"/>'
        f'</g>'
        # main specular highlight on the left lobe + small glint on the right lobe
        f'<ellipse cx="178" cy="168" rx="78" ry="40" fill="url(#{P}-hl)" transform="rotate(-38 178 168)"/>'
        f'<ellipse cx="398" cy="130" rx="30" ry="15" fill="#FFFFFF" fill-opacity="0.75" transform="rotate(28 398 130)"/>'
        f'<circle cx="236" cy="128" r="9" fill="#FFFFFF" fill-opacity="0.9"/>'
    )
    return defs + body, (0, 0, 600, 600)
