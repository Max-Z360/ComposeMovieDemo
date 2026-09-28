#!/usr/bin/env python3
"""Build the sticker pack.

    python3 tools/sticker-gen/build.py                # build everything
    python3 tools/sticker-gen/build.py --batch 1      # only batch 1
    python3 tools/sticker-gen/build.py --only title_good_day

For every sticker this writes, into stickers/<category>/:
  <id>.svg  vector master (text converted to outlines, no external fonts)
  <id>.png  high-res RGBA PNG, transparent background, alpha-bled edges
and refreshes stickers/manifest.json plus preview sheets in stickers/_preview/.
"""
from __future__ import annotations

import argparse
import importlib
import json
import pkgutil
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))

from lib import render as R  # noqa: E402
from lib.fonts import license_of  # noqa: E402
from lib.registry import CATEGORIES, REGISTRY, Sticker  # noqa: E402
import categories  # noqa: E402
import preview  # noqa: E402

OUT = HERE.parent.parent / "stickers"
SVG_LONG_EDGE = 1024  # intrinsic size written into the SVG (it scales losslessly anyway)


def load_all():
    for m in pkgutil.iter_modules(categories.__path__):
        importlib.import_module(f"categories.{m.name}")


def build_one(s: Sticker) -> dict:
    inner, vb = s.fn()
    if s.trim:
        vb = R.trimmed_viewbox(inner, vb)
    x, y, w, h = vb
    long_edge = max(w, h)
    svg = R.clean_svg(R.wrap_svg(inner, vb, title=s.name_en, out_w=SVG_LONG_EDGE * w / long_edge))
    img = R.render(svg, *( (s.px, None) if w >= h else (None, s.px) ))
    img = R.alpha_bleed(img)
    folder = OUT / CATEGORIES[s.category][0]
    folder.mkdir(parents=True, exist_ok=True)
    (folder / f"{s.id}.svg").write_text(svg, encoding="utf-8")
    img.save(folder / f"{s.id}.png", optimize=True)
    rel = folder.relative_to(OUT)
    return {
        "id": s.id,
        "category": s.category,
        "name": {"en": s.name_en, "zh": s.name_zh},
        "tags": s.tags,
        "batch": s.batch,
        "svg": f"{rel}/{s.id}.svg",
        "png": f"{rel}/{s.id}.png",
        "png_size": [img.width, img.height],
        "aspect_ratio": round(w / h, 4),
        "fonts": [{"family": f, "license": license_of(f)} for f in s.fonts],
    }


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--batch", type=int)
    ap.add_argument("--only", nargs="*")
    ap.add_argument("--no-preview", action="store_true")
    args = ap.parse_args()
    load_all()
    todo = [s for s in REGISTRY
            if (args.batch is None or s.batch == args.batch) and (not args.only or s.id in args.only)]
    manifest_path = OUT / "manifest.json"
    entries = {}
    if manifest_path.exists():
        entries = {e["id"]: e for e in json.loads(manifest_path.read_text())["stickers"]}
    for s in todo:
        entries[s.id] = build_one(s)
        print(f"built {s.category:22s} {s.id}  {entries[s.id]['png_size']}")
    order = {c: i for i, c in enumerate(CATEGORIES)}
    ids = {s.id for s in REGISTRY}
    stickers = sorted((e for e in entries.values() if e["id"] in ids),
                      key=lambda e: (order[e["category"]], e["batch"], e["id"]))
    manifest = {
        "version": 1,
        "categories": [{"id": c, "folder": f, "name": {"en": en, "zh": zh}} for c, (f, en, zh) in CATEGORIES.items()],
        "stickers": stickers,
    }
    manifest_path.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    if not args.no_preview:
        for b in sorted({s.batch for s in todo}):
            preview.make_sheets(OUT, [e for e in stickers if e["batch"] == b], b)


if __name__ == "__main__":
    main()
