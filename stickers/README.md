# Sticker 素材库

用于视频 / 图片编辑器的原创贴纸素材。**一个文件 = 一个贴纸**，按类别分文件夹存放。

## 每个贴纸提供两种格式

| 文件 | 说明 |
| --- | --- |
| `<id>.svg` | 矢量母版，可任意放大且不糊。文字已转为路径，不依赖字体；不使用滤镜或外链图片，兼容性好。 |
| `<id>.png` | RGBA 透明底，长边 2048px（全屏叠加素材为 2160×3840，9:16）。已裁到内容边界并留约 4% 透明边距。 |

### 关于“不能有黑边 / 糊边”

- 所有边缘都是矢量抗锯齿直出，没有经过黑底抠图。
- PNG 做了 **alpha bleed**：完全透明像素的 RGB 被填成相邻图案的颜色，而不是默认的黑色 (0,0,0)。因此即使编辑器在未预乘 alpha 的情况下缩放贴图，也不会在边缘混出黑边。
- 发光类贴纸（如 `deco_sparkle_glow`）的柔光是设计的一部分：它渐变到的是**自身颜色的透明**，而不是灰色或黑色。
- 验收表 `_preview/batchNN_qa.png` 把每个贴纸分别放在透明、白、黑、彩色底上，并附一列“最差情况缩放”测试。

## 目录

```
stickers/
  01_text_titles/          文字标题
  02_callouts_shapes/      标注与形状
  03_emotions_reactions/   情绪与反应
  04_time_date/            时间与日期
  05_location_travel/      地点与旅行
  06_food_life/            美食与生活
  07_decorative/           装饰元素
  08_arrows_highlights/    箭头与强调
  09_transitions/          转场元素
  10_social_ui/            社交与界面
  11_backgrounds_overlays/ 背景与叠加（全屏 9:16）
  manifest.json            素材清单：id、中英文名、标签、文件路径、尺寸、所用字体及许可
  _preview/                评审用预览图（不是素材）
```

## 重新生成 / 新增贴纸

素材由 `tools/sticker-gen/` 中的脚本生成：每个类别一个 Python 文件，每个贴纸一个函数。

```bash
pip install -r tools/sticker-gen/requirements.txt
python3 tools/sticker-gen/build.py            # 全部生成
python3 tools/sticker-gen/build.py --batch 1  # 只生成第 1 批
python3 tools/sticker-gen/build.py --only title_good_day
```

## 版权

- 所有图形均为原创绘制，没有使用平台 logo，也没有使用 Apple 或 Google 的 emoji 设计。
- 文字所用字体均来自 Google Fonts，许可为 SIL OFL 1.1 或 Apache 2.0，允许商用。每个贴纸具体用了哪款字体，见 `manifest.json` 的 `fonts` 字段。
