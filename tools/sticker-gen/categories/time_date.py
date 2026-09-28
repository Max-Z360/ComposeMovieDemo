from lib.fonts import text_outline
from lib.registry import sticker
from lib.svg import rrect


@sticker("time_camcorder_stamp", "time_date", "Camcorder timestamp", "摄像机时间戳",
         ["time", "date", "timestamp", "camcorder", "retro", "vlog", "时间", "日期", "复古"], fonts=["DMMono"])
def time_camcorder_stamp():
    l1 = text_outline("PM  3:27", "DMMono", 54, 44, 82)
    l2 = text_outline("Apr 26, 2026", "DMMono", 54, 44, 150)
    w = max(l1.bbox[2], l2.bbox[2]) + 44
    inner = (
        f'<path d="{rrect(0, 0, w, 190, 36)}" fill="#1D1D22"/>'
        f'<path d="{rrect(2, 2, w - 4, 186, 34)}" fill="none" stroke="#FFFFFF" stroke-opacity="0.08" stroke-width="2"/>'
        f'<path d="{l1.d}" fill="#FFFFFF"/>'
        f'<path d="{l2.d}" fill="#FFFFFF"/>'
    )
    return inner, (-20, -20, w + 40, 230)
