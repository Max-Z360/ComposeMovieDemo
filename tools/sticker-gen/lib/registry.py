from __future__ import annotations

from dataclasses import dataclass, field
from typing import Callable

# folder name, English label, Chinese label
CATEGORIES = {
    "text_titles": ("01_text_titles", "Text Titles", "文字标题"),
    "callouts_shapes": ("02_callouts_shapes", "Callouts & Shapes", "标注与形状"),
    "emotions_reactions": ("03_emotions_reactions", "Emotions & Reactions", "情绪与反应"),
    "time_date": ("04_time_date", "Time & Date", "时间与日期"),
    "location_travel": ("05_location_travel", "Location & Travel", "地点与旅行"),
    "food_life": ("06_food_life", "Food & Life", "美食与生活"),
    "decorative": ("07_decorative", "Decorative Elements", "装饰元素"),
    "arrows_highlights": ("08_arrows_highlights", "Arrows & Highlights", "箭头与强调"),
    "transitions": ("09_transitions", "Transition Elements", "转场元素"),
    "social_ui": ("10_social_ui", "Social & UI", "社交与界面"),
    "backgrounds_overlays": ("11_backgrounds_overlays", "Backgrounds & Overlays", "背景与叠加"),
}


@dataclass
class Sticker:
    id: str
    category: str
    name_en: str
    name_zh: str
    tags: list[str]
    fn: Callable[[], tuple[str, tuple[float, float, float, float]]]
    batch: int = 1
    trim: bool = True          # auto-crop viewBox to the artwork (+ padding)
    px: int = 2048             # PNG long edge in pixels
    fonts: list[str] = field(default_factory=list)


REGISTRY: list[Sticker] = []


def sticker(id: str, category: str, name_en: str, name_zh: str, tags: list[str], **kw):
    assert category in CATEGORIES, category

    def deco(fn):
        REGISTRY.append(Sticker(id, category, name_en, name_zh, tags, fn, **kw))
        return fn
    return deco
