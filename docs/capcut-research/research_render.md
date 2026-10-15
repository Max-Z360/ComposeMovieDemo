# 第 X 章　文字/花字、关键帧、蒙版、抠图、混合模式、转场、变速的实现方案

> 学习型架构研究 · 剪映 / CapCut（字节跳动）
> 本章只讨论剪辑之外的"编辑特效"在 GPU 管线上的实现思路。Effect/CV SDK、资源包和 Effect House 引擎（研究方向 a），以及 draft_content.json 数据模型、火山引擎/BytePlus 视频编辑 SDK API、跨端引擎架构（研究方向 b）由其他章节负责，本章只在需要时简要引用。

## 目录

- [0. 阅读说明：证据等级与本次调研的访问限制](#0-阅读说明证据等级与本次调研的访问限制)
- [1. 功能盘点：剪映/CapCut 在剪辑之外提供了什么](#1-功能盘点剪映capcut-在剪辑之外提供了什么)
- [2. 总体视角：一帧画面是怎么合成出来的](#2-总体视角一帧画面是怎么合成出来的)
- [3. 文字与花字](#3-文字与花字)
- [4. 关键帧与缓动曲线](#4-关键帧与缓动曲线)
- [5. 蒙版（形状蒙版与羽化）](#5-蒙版形状蒙版与羽化)
- [6. 色度抠图（Chroma Key）与去溢色](#6-色度抠图chroma-key与去溢色)
- [7. 混合模式](#7-混合模式)
- [8. 转场](#8-转场)
- [9. 入场/出场/组合动画](#9-入场出场组合动画)
- [10. 变速与曲线变速（时间重映射 + 音频变速不变调）](#10-变速与曲线变速时间重映射--音频变速不变调)
- [11. 滤镜与调节：LUT 与颜色调整](#11-滤镜与调节lut-与颜色调整)
- [12. 画布与背景模糊](#12-画布与背景模糊)
- [13. 画中画（多轨叠加）](#13-画中画多轨叠加)
- [14. 把它们串起来：单片段效果链顺序与工程要点](#14-把它们串起来单片段效果链顺序与工程要点)
- [参考来源](#参考来源)
- [未能确认 / 待补充](#未能确认--待补充)

---

## 0. 阅读说明：证据等级与本次调研的访问限制

**证据等级标签**（每节标题上都会标注）：

| 标签 | 含义 |
|---|---|
| 【官方/一手】 | 字节跳动/剪映/CapCut/BytePlus 官方页面、官方文档或第一方技术分享 |
| 【社区逆向/开源】 | 社区开源项目（如 pyJianYingDraft 对草稿格式的整理），或 FFmpeg、OBS、Skia、HarfBuzz 等通用开源实现 |
| 【推断/业界通用】 | 笔者基于业界通用做法所作的推断；**不代表**剪映的真实实现 |

**本次调研的访问限制（重要，影响可信度）**：在本次调研环境中，WebFetch 无法解析 `capcut.com`、`capcut.cn`、`docs.byteplus.com`、`volcengine.com`、`juejin.cn`、`infoq.cn`、`w3.org`、`wikipedia.org`、`ffmpeg.org`、`arxiv.org` 等域名（报 `getaddrinfo ENOTFOUND`）。能直接打开的只有 `github.com` 与 `raw.githubusercontent.com`。因此：

1. **所有剪映/CapCut/BytePlus 官方页面的内容，都来自搜索引擎（WebSearch）返回的页面摘要**，正文未能逐字核对。正文里这类引用统一标成"（搜索摘要）"。
2. 开源实现（FFmpeg、OBS、Skia、HarfBuzz、Lottie、Media3、MLT、GPUImage、gl-transitions、pyJianYingDraft 等）的源码都通过 GitHub 直接打开并阅读。
3. 本次**没有找到**字节跳动第一方关于剪映文字渲染、关键帧、蒙版、抠图或变速内部实现的公开技术分享（字节跳动技术团队、火山引擎开发者社区、InfoQ、QCon、GMTC、LiveVideoStack 都用中英文搜过）。所以本章的"实现方案"部分，绝大多数是【社区逆向/开源】加【推断/业界通用】。

---

## 1. 功能盘点：剪映/CapCut 在剪辑之外提供了什么

### 1.1 官方能力清单 【官方/一手】（搜索摘要）（未能核实）

> 核查注：本次核查时 capcut.com / capcut.cn 仍无法解析，WebSearch 配额也已用尽，下表各行都没能逐条对照原页面。只有"6 种蒙版（线性/镜面/圆形/矩形/爱心/星形）"和"同一片段只能加一个蒙版"有社区源码佐证（pyJianYingDraft `mask_meta.py`、`add_mask`），其余行均视为未能核实。

| 功能 | 官方描述要点 | 来源 |
|---|---|---|
| 文字 / 文字动画 | 桌面端选中文字后有 In / Out / Loop 三类动画，样式包括 typewriter、flicker 等；Loop 里有 Scrolling 滚动字幕 | capcut.com/create/animated-text-maker、resource/how-to-make-videos-with-scrolling-text |
| 弯曲文字 | 文字面板提供 "Curve"，可调弯曲程度；另有 text-along-path 模板 | capcut.com/resource/create-curved-text、explore/text-along-path-effect |
| 花字 / 文字模板 | 剪映官网的品牌定制页把"花字"列为模板组成元素，与背景音乐、滤镜、贴纸、转场并列 | capcut.cn |
| 关键帧 | 设定起点和终点即可自动生成过渡；PC 端 Basic 面板的 Position/Scale/Rotation/Opacity 旁有菱形关键帧按钮；有 Ease In / Ease Out | capcut.cn、capcut.com/resource/how-to-add-keyframes-in-capcut |
| 蒙版 | 剪映官网：支持"线性、圆形、文字、钢笔等多种形式"；CapCut：horizontal（线性）、mirror、circle、rectangle 以及星形、爱心等形状，有 Feather（羽化）、Invert（反转） | capcut.cn、capcut.com/tools/mask-video-online |
| 色度抠图 | 取色器选背景色，调节 Strength、Shadow、Edge feathering；移动端路径为 Edit > Remove BG > Chroma Key | capcut.com/help/chroma-key-feature |
| 混合模式 | 提供 Screen、Multiply、Overlay、Darken、Lighten 等；桌面端在 Basic > Blend 中选择；移动端画中画素材面板里有 "Blending mode" | capcut.com/create/blend-modes-creative-video-photo-effects |
| 转场 | 只能加在两个相邻片段之间；用滑杆调时长；片段过短时可能加不上 | capcut.com/help/transitions-not-working |
| 入场/出场/组合动画 | 视频片段有 in / out / group（组合）三类动画，文字有 in / out / loop 三类（由社区草稿项目佐证，见 §9） | pyJianYingDraft（社区） |
| 曲线变速 | 预设包括 Montage、Bullet、Jump Cut、Hero，也可选 Custom 自定义；曲线图上半区最多加速到 10x，下半区最慢减到 0.1x；可通过 "Add Point" 加控制点（未能核实） | capcut.com/tools/speed-ramp、resource/how-to-do-velocity-on-capcut |
| 慢动作补帧 | Speed 面板有 "Smooth slow-mo"；桌面端有 Frame blending 与 Optical flow 两种（后者更慢、质量更好） | capcut.com/resource/optical-flow-in-capcut |
| 画布 / 背景模糊 | Canvas 下可选 Blur / Color / Pattern；移动端 Blur 有 4 档样式 | capcut.com/resource/how-to-blur-background-in-capcut |
| 滤镜与调节 | 支持导入 CUBE、3DL 格式的 LUT，并可调强度；有 HSL 与 Curves（luma/R/G/B） | capcut.com/resource/luts-for-color-grading |
| 画中画 | 素材放到主轨上方的新轨道即成为 overlay，可调位置、缩放、透明度和混合模式 | capcut.com/resource/overlay-video-on-video |

### 1.2 BytePlus（火山引擎海外版）VE SDK 中可对照的能力 【官方/一手】（搜索摘要；色度抠图一条已用火山引擎官方 GitHub 头文件核实，其余部分未能核实）

研究方向 b 负责 SDK API，这里只摘录与本章算法相关的事实：

- **蒙版**：product overview 列出 6 种蒙版：linear、mirror、circle、rectangle、heart、star。iOS 开发指南说明"同一轨道上一个视频只能加一个蒙版"。（BytePlus 原文未能核实；"一个片段只能有一个蒙版"与 pyJianYingDraft `add_mask` 的限制"当前片段已有蒙版, 不能再添加新的蒙版"一致）
- **混合模式**："multi-track overlays are available in various blend modes"。（未能核实）
- **变速**：iOS 编辑模块有 `videoSegment.setSpeed()` 和 `videoSegment.setKeepTone()`（保持音调）。`setKeepTone` 有第三方公开集成示例佐证：hifiveai/openmusic-short-video-ios-example 中 VE SDK 的 NLEEditor 代码有 `[videoSegment setKeepTone:shouldKeepTone];`。详细开发指南把 speed 属性描述为 "The DC component of the speed. This variable is also applicable to the curve speed."，即速度的直流分量，同样适用于曲线变速（该原文未能核实）。曲线变速资源包 `curve_speed.bundle` 有第三方集成示例佐证：hifiveai/openmusic-short-video-android-example 的 `ResourceHelper.getCurveSpeedList()` 读取 `curve_speed.bundle` 下的 `curvespeed.json`。`chroma.bundle` 未能核实。
- **色度抠图（Effects SDK）**【官方/一手，已核实】：火山引擎官方 GitHub 仓库 volcengine/VolcEngineRTC 附带的 `bef_effect_ai_chroma_keying.h` 头文件中，`bef_effect_ai_chroma_keying_set_processParam(similar, smoothness, correction, clip_black, clip_white)` 的注释为：similar 是"相似度（最主要影响抠图强度"，smooth 是"平滑度（搭配similar的，影响半透明等过渡状态"，correction 是"去绿强度"，clip_black/clip_white 是"对最后结果mask做个黑白截断的曲线增强"。`BEF_AI_CHROMA_KEYING_METHOD` 取 0 为"移动端实时方案【推荐默认】"，取 1 为"服务端方案"。`BEF_AI_CHROMA_KEYING_SMOOTH` 的含义见 §6.1：推荐值 0 **并不是关闭平滑**。`bef_effect_ai_chroma_keying_detect()` 确有 `bool soft_process` 参数，但"V4.5.0 新增、保留原始屏幕绿色、用于弱去绿"这层说明在头文件中找不到（未能核实）。

> 第 10 节会用到"速度 DC 分量也适用于曲线变速"这个线索：它暗示曲线变速可能被表达为"平均速度 × 归一化曲线形状"。这只是笔者的推断，而且所依据的 BytePlus 原文本身未能核实。

---

## 2. 总体视角：一帧画面是怎么合成出来的

### 2.1 每帧求值流程 【推断/业界通用】

剪辑引擎在时间线时刻 `t` 合成一帧的流程大致如下。跨端架构的细节见研究方向 b，这里只画出本章各功能所在的位置：

```
时间线时刻 t（微秒）
   │
   ├─► 对每条轨道（按 z 序从下到上）找到覆盖 t 的片段 seg
   │      │
   │      ├─ ① 时间映射：src_t = SpeedMap(seg, t - seg.start)          ← §10 变速/曲线变速
   │      ├─ ② 解码：frame = Decoder(seg.material).frameAt(src_t)
   │      ├─ ③ 片段级效果链（离屏 FBO 链，ping-pong）：
   │      │       色度抠图 → 调节/滤镜(LUT) → 蒙版 → 特效            ← §6 §11 §5
   │      ├─ ④ 关键帧/动画求值：transform, alpha = KF(t) ∘ Anim(p)     ← §4 §9
   │      └─ ⑤ 叠加到画布：Composite(canvas, layer, blendMode)       ← §7 §13
   │
   ├─► 相邻片段处于转场区间：TransitionShader(from, to, progress)    ← §8
   ├─► 主轨以下：画布背景（纯色 / 模糊）                              ← §12
   ├─► 文字/贴纸轨：文字排版 → 字形渲染 → 花字多层 → 逐字动画          ← §3
   └─► 全局特效/滤镜轨 → 输出（预览 SurfaceView / 编码器）
```

### 2.2 贯穿全章的三条工程约定 【推断/业界通用】

1. **预乘 Alpha（premultiplied alpha）**。层间合成统一用预乘颜色，`co = cs + cb·(1-αs)` 才能直接成立（W3C Compositing 规范的 source-over 公式，§7 详述）。抠图、蒙版、文字这些会产生 alpha 的步骤，要在"非预乘空间算颜色、在预乘空间做合成"。OBS 的 chroma key 和 alpha mask shader 就是"先反预乘 → 处理 → 再预乘"的写法（见 §5、§6 引用的 `.effect` 源码）。
2. **归一化坐标**。社区逆向表明，剪映草稿里片段位移 `transform.x/y` 以"半个画布宽/高"为单位（见 §13）。这个单位正好等于 OpenGL 的 NDC（-1..1），实现上很顺手。
3. **时间单位是微秒**。pyJianYingDraft 中 `target_timerange`、关键帧 `time_offset`、动画 `start/duration` 都以微秒计（见 §4、§9）。

---

## 3. 文字与花字

### 3.1 官方能力 【官方/一手】（搜索摘要）

- 文字动画分 In / Out / Loop 三类，样式库里有 typewriter、flicker、ink print 等；滚动字幕是 Loop 类里的 "Scrolling"。
- 文字可以 "Curve"（弯曲）；另有路径文字模板（text along path）。
- 剪映官网把"花字"作为品牌模板的组成元素之一。官网也提到蒙版可以是"文字"形式，即文字可以作为蒙版形状。

### 3.2 社区逆向揭示的文字数据结构线索 【社区逆向/开源】

pyJianYingDraft 的 `text_segment.py` 导出的文字素材有以下特点（数据模型本身由研究方向 b 负责，这里只看它对渲染器提出了哪些要求）：

- `content` 是一个 **JSON 字符串**，内含 `"text"` 和 `"styles"` 数组。每个 style 有 `"range"`（字符区间）、`"fill"`、`"size"`、`"bold"`、`"italic"`、`"underline"`、`"strokes"`（**数组**）、`"shadows"`（**数组**）、`"font"`、`"effectStyle"`。
  - 这说明**渲染器必须支持富文本（按字符区间分段设置样式）**，并且描边和阴影可以**多层**叠加。
  - `fill.content.render_type` 社区代码只写了 `"solid"`。这个字段名暗示还有其他填充类型（渐变、纹理等），但本次没有确认。
- 顶层 `"typesetting"` 取 0 或 1，对应横排/**竖排**；另有 `"alignment"`、`"letter_spacing"`、`"line_spacing"`、`"line_max_width"`（自动换行宽度，以屏幕宽度的比例表示）。
- 背景框字段：`background_style`、`background_color`、`background_alpha`、`background_round_radius`、`background_width/height`、`background_horizontal/vertical_offset`。
- **气泡**以独立素材 `"type": "text_shape"` 存放，**花字**以独立素材 `"type": "text_effect"` 存放，两者都通过 `resource_id/effect_id` 引用资源包。也就是说，"花字"在数据上是一个**可下载的效果资源**，不是一组固定参数。这类资源包的格式与引擎属于研究方向 a。
- `check_flag` 是位掩码，基值 7，描边 +8、背景 +16、阴影 +32；代码注释还提到发光 +64。

### 3.3 文字渲染管线 【社区逆向/开源】+【推断/业界通用】

```
UTF-8 文本 + styles[range]
   │
   ├─ 1. 分段（itemize）：按 脚本(Script) / 方向(BiDi) / 字体回退 / 样式区间 切成 run
   ├─ 2. 字体选择与回退：用户字体 → CJK 回退 → Emoji 字体 → 兜底字体
   ├─ 3. 整形（shaping）：HarfBuzz hb_shape() → glyph_id[] + advance/offset[]
   ├─ 4. 断行与排版：line_max_width、对齐、行距、字距；竖排时改为 TTB
   ├─ 5. 字形光栅化：FreeType（轮廓 → 位图 / SDF；彩色 Emoji → BGRA 位图）
   │       └─ 写入字形图集（glyph atlas，按 font+size+glyph_id 缓存）
   ├─ 6. 生成每字形四边形（quad），附带 glyph_index / line_index / word_index
   ├─ 7. 逐字动画：对每个 quad 求 coverage → 修改 transform/alpha/color
   └─ 8. GPU 绘制：多层（阴影 → 外描边 … → 填充 → 发光）shader 合成到文字层纹理
```

**整形（HarfBuzz）** 【社区逆向/开源】
- HarfBuzz README 自称是 "the `ffmpeg` of text shaping"，主要支持 OpenType，也支持 Apple Advanced Typography。使用者包括 Android、Chrome、Firefox、Flutter、Figma、Canva、Adobe 系列等。
- **它不做 hinting**。README 原文："Notable missing feature: font hinting (including autohinting) is not implemented. For hinted rasterization, use FreeType or ..."。所以 HarfBuzz（整形）+ FreeType（光栅化）是常见组合。
- 新版 README 还列出了实验性的 `libharfbuzz-gpu`："Encodes glyph outlines for GPU rasterization (Slug algorithm). Provides shader sources in GLSL, WGSL, MSL, and HLSL." 以及 `libharfbuzz-raster`（可光栅化彩色字体）。这说明"在 GPU 上直接渲染轮廓"已经有了开源方案。

> 剪映实际用的是不是 HarfBuzz/FreeType，本次**没有找到**公开证据（没有官方技术文章，也没有找到招聘 JD 原文）。上面的管线是业界通用组合。

### 3.4 字形渲染方案对比 【社区逆向/开源】+【推断/业界通用】

| 方案 | 原理 | 优点 | 缺点 | 开源参考 |
|---|---|---|---|---|
| 位图图集 | 按字号光栅化成 A8 位图 | 小字号最清晰，可用 hinting | 缩放动画会糊，每个字号都要缓存 | FreeType |
| 单通道 SDF | 存储到轮廓的有符号距离，shader 阈值化 | 一份图集可任意缩放；**描边/发光/阴影只是不同阈值**，很适合花字 | 尖角会被圆化 | mapbox/tiny-sdf（Canvas 绘制 + Felzenszwalb/Huttenlocher 距离变换，示例里画的正是汉字"泽"） |
| MSDF / MTSDF | 用 RGB 三通道编码边信息，取中值恢复距离 | 尖角"almost perfectly"保留；MTSDF 在 alpha 通道再存一份真 SDF | 生成更复杂；仍受距离范围限制 | Chlumsky/msdfgen |
| GPU 轮廓直绘（Slug 等） | 片元 shader 直接对二次贝塞尔轮廓求覆盖率 | 任意缩放都精确，无图集 | shader 开销大，移动端功耗高 | `libharfbuzz-gpu` |
| 路径渲染（CPU/GPU 光栅化） | Skia 等 2D 引擎把轮廓当路径填充或描边 | 支持任意宽度描边、渐变 | 每帧重新光栅化，开销较大 | Skia |

msdfgen README 给出的片元 shader 核心只有三行（为遵守版权，这里只引短句）：`float sd = median(msd.r, msd.g, msd.b);`，`float screenPxDistance = screenPxRange()*(sd - 0.5);`，再 `mix(bgColor, fgColor, opacity)`。README 还特别强调纹理要按**线性值**读取，不能当 sRGB 解码。

**视频编辑器选型的推断** 【推断/业界通用】：视频文字普遍带缩放、旋转、逐字弹跳等动画，而且常常放大到全屏标题字号，所以 **SDF/MSDF 是性价比最高的主路径**。超大字号、超粗描边、特殊路径效果则回退到路径渲染。

### 3.5 花字：多层描边、阴影、发光的 SDF 实现 【推断/业界通用】

花字的视觉通常是：渐变或纹理填充，加 1–3 层不同颜色的描边，再加投影和外发光。用一张 SDF 图集，一个 pass 就能画完所有层（下面是笔者自写的 GLSL）：

```glsl
// SDF 约定：texel 值 0.5 为轮廓，>0.5 在字内（与 msdfgen 约定一致）
uniform sampler2D uSdf;
uniform float uPxRange;           // 当前屏幕上，SDF 编码范围对应多少像素
uniform vec4  uFill;              // 填充色（非预乘）
uniform vec4  uStrokeColor[3];    // 由内到外的多层描边颜色
uniform float uStrokeWidth[3];    // 累计宽度（像素），递增：w0 < w1 < w2
uniform int   uStrokeCount;
uniform vec4  uShadowColor;
uniform vec2  uShadowOffsetUV;    // 阴影偏移（纹理坐标）
uniform float uShadowSoftPx;      // 阴影柔化宽度（像素）
uniform float uShadowExtentPx;    // 阴影外扩（通常 = 最外层描边宽度，无描边时为 0）
varying vec2  vUV;

float sdPx(vec2 uv) {             // 屏幕像素单位的有符号距离，>0 在字内
    return (texture2D(uSdf, uv).a - 0.5) * uPxRange;
}
vec4 over(vec4 top, vec4 bot) {   // 预乘 source-over
    return top + bot * (1.0 - top.a);
}
vec4 premul(vec4 c, float cov) { float a = c.a * cov; return vec4(c.rgb * a, a); }

void main() {
    float d = sdPx(vUV);
    // 1) 阴影：在偏移处取样，用更宽的过渡带模拟模糊
    float ds = sdPx(vUV - uShadowOffsetUV);
    vec4 col = premul(uShadowColor, smoothstep(-uShadowSoftPx, uShadowSoftPx, ds + uShadowExtentPx));
    // 2) 描边：从最外层画到最内层
    for (int i = 2; i >= 0; --i) {
        if (i >= uStrokeCount) continue;
        float cov = clamp(d + uStrokeWidth[i] + 0.5, 0.0, 1.0);   // 向外扩 w 像素
        col = over(premul(uStrokeColor[i], cov), col);
    }
    // 3) 填充
    col = over(premul(uFill, clamp(d + 0.5, 0.0, 1.0)), col);
    gl_FragColor = col;
}
```

工程要点：

- **SDF 的编码范围（spread）必须大于"最大描边宽度 + 阴影柔化宽度"**，否则外层描边会在距离场边界处被截断。tiny-sdf 的 `buffer/radius/cutoff` 参数控制的就是这件事。描边特别粗时，要么按需生成更大 spread 的 SDF，要么回退到路径描边。
- **渐变或纹理填充**：用 quad 在文字包围盒内的局部坐标去采样渐变 LUT 或纹理，再乘以填充覆盖率。
- **背景框/气泡**：`background_*` 是圆角矩形，可用 §5 的 `sdRoundRect` 画。气泡是资源图（通常是九宫格），走贴纸路径。
- 文字整体透明度 `global_alpha` 应作用于**合成后的文字层**，不能分别乘到每一层上，否则描边与填充交叠处会透出底色。

### 3.6 Emoji 与彩色字体 【社区逆向/开源】

- FreeType 的 `FT_LOAD_COLOR` 文档说明：会加载内嵌彩色位图，结果是 `FT_PIXEL_MODE_BGRA` 且**预乘**；2.12 起可以从 `SVG ` 表**取出** SVG 文档，但文档明说 "FreeType itself can't render SVG documents"，只提供挂接外部渲染器的钩子；`COLR` 只支持 v0 层（"works only for glyphs in 'COLR' v0 tables"），并明确写着 "There is no rendering support for 'COLR' v1"（只用到 v0 特性的 v1 表除外），需要 Skia 或 Cairo 这类图形库来解释 v1。
- 推论 【推断/业界通用】：
  1. Emoji 不能走单色 SDF，只能走**彩色位图图集**（独立的 RGBA 图集），缩放时用 mipmap 加双线性采样。
  2. 花字描边作用在 Emoji 上时，需要先从 Emoji 的 alpha 生成距离场（例如用 JFA 或 tiny-sdf 同类的距离变换），或者直接对 alpha 做形态学膨胀。
  3. 想支持 COLR v1 渐变 Emoji，需要 Skia 这类具备 paint 能力的引擎，或 HarfBuzz 的 `hb-paint` / `libharfbuzz-raster`（README 写明它 "including color fonts"）。

### 3.7 竖排文字 【社区逆向/开源】

- HarfBuzz 的 `hb_direction_t` 有 LTR、RTL、TTB、BTT 四种方向，通过 `hb_buffer_set_direction()` 设置。
- 在 `hb-ot-shape.cc` 中，方向为非水平时启用 `vert` 特性：`map->enable_feature (HB_TAG ('v','e','r','t'), F_GLOBAL_SEARCH);`。字距特性也随方向切换：水平方向用 `kern`，垂直方向用 `vkrn`。`calt`、`liga` 等水平特性只在水平方向加入。
- FreeType 的 `FT_LOAD_VERTICAL_LAYOUT` 会让 `advance` 改用 `vertAdvance`；文档提醒在 `FT_HAS_VERTICAL` 为假时不要使用这个标志。原因是此时 FreeType 会自行合成竖排度量，而合成值在不同字体格式之间并不一致（"vertical metrics get synthesized, and those values are not always consistent across various font formats"）。因此字体缺少竖排度量时，应用最好自己定义竖排度量规则。
- 【推断/业界通用】剪映草稿的 `typesetting=1` 很可能对应：CJK 字符按 TTB 整形（标点经 `vert` 替换为竖排字形），拉丁字母和数字 run 整体旋转 90°，或者按字横排（"纵中横"）。具体规则本次未能确认。

### 3.8 弯曲文字 / 路径文字 【推断/业界通用】

弯曲文字的本质是"把基线从直线换成曲线"：

```
输入：已排版好的字形序列 g[i]（基线坐标 x_i、advance a_i），弯曲路径 P(s)（按弧长 s 参数化）
for each glyph i:
    s_mid = x_i + a_i / 2                 // 字形中心在基线上的弧长位置
    pos   = P(s_mid)                      // 路径上的点
    tan   = normalize(P'(s_mid))          // 切线
    angle = atan2(tan.y, tan.x)
    quad_i = Translate(pos) * Rotate(angle) * Translate(-a_i/2, 0) * glyphQuad_i
```

"Curve 程度"滑杆可以映射为圆弧半径 `R = L / θ`（L 为整行宽度，θ 为弧度张角，θ→0 时退化为直线）。

### 3.9 逐字动画：Range Selector 模型 【社区逆向/开源】

剪映的文字入场/出场/循环动画（打字机、逐字弹跳、逐字渐显等）大多是"按字符分配进度"。最成熟的开源参照是 After Effects 的 Text Animator 在 Lottie 中的实现，即 Skia Skottie 的 `RangeSelector.cpp` / `TextAnimator.cpp`：

- **Range Selector** 为每个文本片段（fragment）计算覆盖率 `coverage ∈ [-1, 1]`：
  - 单位可以是 Percentage 或 Index。按百分比时 `domain_size * (s + o) / 100`（s 为 start，o 为 offset）。
  - 作用域（domain）可以是 chars、chars excluding spaces、words、lines。
  - 形状有 square、ramp up、ramp down、triangle、round、smooth 六种，由一个三次曲线表给出。在片段中点采样（`t = (0.5 - r0) / len`，每片段步进 `1/len`）。
  - 有 ease high / low、amount，以及固定种子 42 的随机顺序（`std::mt19937`）。
  - 多个 selector 的结果累加后截断：`dst->coverage = SkTPin<float>(dst->coverage + amount, -1, 1);`。
- **TextAnimator** 用 coverage 去调制属性：
  - 位置、旋转、tracking、模糊等按加法：`modulated_props.position += static_cast<SkV3>(fTextProps.position) * amount;`
  - 缩放按乘法：`scale *= 1 + (target*0.01 - 1) * amount`
  - 颜色和不透明度用插值，coverage 先截到 ≥0：`lerp(props.opacity, fTextProps.opacity*0.01f, clamped_amount)`

把它套到"打字机"和"逐字弹入"上（笔者自写伪代码）：

```text
// p ∈ [0,1]：入场动画的归一化进度；N：字符数；soft：每个字的过渡占比
coverage(i, p) = clamp( (p * (N + soft) - i) / soft , 0, 1 )   // ramp 形状
// 打字机：soft → 0（硬切），只调制 opacity
opacity_i = coverage(i, p)
// 逐字弹入：位置从下方 +Δy 回到 0，带回弹缓动
y_i     = (1 - easeOutBack(coverage(i, p))) * Δy
scale_i = mix(0.6, 1.0, easeOutBack(coverage(i, p)))
```

渲染时，每个字形 quad 带上 `glyph_index`，可以在 vertex shader 里用 uniform 数组或纹理查出各字的 transform 与 alpha。几千字以内也可以直接在 CPU 端算好每个 quad 的顶点。

### 3.10 文字模板 【推断/业界通用】

"文字模板"通常是若干文字层、形状/贴纸层、关键帧动画和特效的**组合资源**，用户只能替换文本内容，换字后版式自适应（自动缩放、换行）。从 §3.2 可以看到花字和气泡都以 `resource_id` 引用资源包，文字模板很可能也是由效果引擎（研究方向 a）解释执行的资源。它的文件格式本次未能确认，所以这里不展开。

---

## 4. 关键帧与缓动曲线

### 4.1 官方能力 【官方/一手】（搜索摘要）（未能核实）

- 剪映官网："只需设置起点和终点，即可自动生成流畅过渡"。
- CapCut PC：在 Basic 面板 Position / Scale / Rotation / Opacity 旁点菱形按钮打关键帧，移动播放头、改参数后再打下一个；有 Ease In / Ease Out 选项。

### 4.2 关键帧数据线索 【社区逆向/开源】

pyJianYingDraft 的 `keyframe.py`：

- **可关键帧化的属性**枚举，`KeyframeProperty` 的字符串值为：`KFTypePositionX`、`KFTypePositionY`、`KFTypeRotation`、`KFTypeScaleX`、`KFTypeScaleY`、`UNIFORM_SCALE`、`KFTypeAlpha`、`KFTypeSaturation`、`KFTypeContrast`、`KFTypeBrightness`、`KFTypeVolume`。
- **单个关键帧导出的 JSON**：`"curveType": "Line"`、`"graphID": ""`、`"left_control": {"x":0,"y":0}`、`"right_control": {"x":0,"y":0}`、`"id"`、`"time_offset"`（相对片段起点）、`"values"`（单个 float 的列表）。社区库注释写明它**只支持线性插值**。
- `KeyframeList` 按属性分组（`"property_type"`），`add_keyframe` 插入后按 `time_offset` 排序。

从这些结构可以推断出几点设计 【推断/业界通用】：

1. **每条属性一条独立轨道**，而且**位置 X、Y 分开**。这意味着剪映的位移关键帧大概率是"各轴分别插值"，不是 AE 那种"空间贝塞尔运动路径"。好处是数据简单、各轴可以用不同曲线；代价是做不出弧线运动路径，只能通过 X、Y 的缓动不同步来近似。
2. 每个关键帧带 `left_control/right_control` 和 `curveType`，与"入切线/出切线 + 曲线类型"的通用模型一致（Lottie 中对应 `i`/`o` 两个控制点）。`curveType` 除了 `"Line"` 之外还有哪些取值，本次未能确认。

### 4.3 求值算法 【社区逆向/开源】+【推断/业界通用】

**通用模型**：对属性 P，已知按时间排序的关键帧 `(t_k, v_k, out_k, in_k, type_k)`。求 `P(t)`：

```text
float evalTrack(KF[] k, int64 t_us):
    if t_us <= k[0].t: return k[0].v                    // 区间外保持端点值
    if t_us >= k[n-1].t: return k[n-1].v
    i = upperBound(k, t_us) - 1                         // 二分查找；或缓存上次的段（见下）
    u = (t_us - k[i].t) / (k[i+1].t - k[i].t)           // 段内线性进度 ∈ [0,1)
    switch k[i].type:
        Hold:   e = 0
        Line:   e = u
        Bezier: e = cubicBezierEase(k[i].out, k[i+1].in, u)   // CSS cubic-bezier 语义
    return mix(k[i].v, k[i+1].v, e)
```

**Lottie 的实现细节**（lottie-android）可以作为工业参考：

- `KeyframeParser` 用 JSON 的 `o`（出切线）和 `i`（入切线）作为 `cp1/cp2`，调用 `PathInterpolatorCompat.create(cp1.x, cp1.y, cp2.x, cp2.y)` 生成三次贝塞尔插值器。
  - 控制点 x 截到 [-1,1]，y 截到 ±`MAX_CP_VALUE`（100），因为 "PathInterpolator fails to create the interpolator in those cases and hangs"。
  - 插值器按控制点哈希缓存在静态 `SparseArrayCompat<WeakReference<Interpolator>>` 中。
  - Hold 关键帧（`h == 1`）直接令 `endValue = startValue`。
  - 多维属性可以有独立的 `xInterpolator/yInterpolator`，正好对应"X、Y 分轴缓动"。
- `BaseKeyframeAnimation` **不是二分查找**，而是缓存当前关键帧：先判断 `currentKeyframe.containsProgress(progress)`，命中就复用；不命中再从尾部向前扫描。播放时进度单调前进，命中率很高。段内线性进度 = `(progress - start)/(end - start)`，再经 `interpolator.getInterpolation()` 得到缓动进度。

**三次贝塞尔缓动求解**：缓动曲线是参数曲线 `(x(s), y(s))`，`P0=(0,0)`、`P3=(1,1)`，P1、P2 为控制点。给定时间进度 u，需要先解 `x(s) = u` 求出 s，再求 `y(s)`。

- gre/bezier-easing 当前源码用的是**代数解三次方程**：把 `x(t)` 写成 `((2a·t + 3b)·t + 3c)·t`，经变量代换得到压缩三次方程 `v³ − 3m·v + 2h = 0`。判别式大于阈值时用 Cardano 公式，否则用三角解取最大根（源码注明算法来自 Dmitry Baranovskiy）。控制点 x 不在 [0,1] 时直接抛异常。
- 笔者自写的通用迭代版（Newton + 二分兜底），便于理解：

```text
float bezierX(s, x1, x2) = (((1-3*x2+3*x1)*s + (3*x2-6*x1))*s + 3*x1)*s  // = 3(1-s)²s·x1 + 3(1-s)s²·x2 + s³
float bezierY(s, y1, y2) = 同上，把 x 换成 y
float cubicBezierEase(x1,y1,x2,y2,u):
    s = u
    repeat 4 times:                           // Newton
        dx = bezierX(s) - u ; d = dX/ds(s)
        if |dx| < 1e-6: return bezierY(s)
        if |d| < 1e-6: break
        s -= dx / d
    lo=0, hi=1, s=u                           // 斜率过小时二分兜底
    while hi-lo > 1e-6:
        if bezierX(s) < u: lo = s else hi = s
        s = (lo+hi)/2
    return bezierY(s)
```

**属性特化** 【推断/业界通用】：

- **旋转**：按"度"做线性或缓动插值，不做最短路径归一。这样 0°→720° 才能表示转两圈，剪映草稿的 rotation 就是以度为单位（见 §13）。
- **缩放**：线性插值即可；如果希望视觉上"匀速缩放"，可以在 log 空间插值，即 `exp(mix(log a, log b, e))`。剪映具体用哪种未能确认。
- **颜色类**（亮度、对比度、饱和度）：插值的是标量参数，再交给 §11 的调节 shader。
- **音量**（`KFTypeVolume`）：在线性增益或 dB 域插值都可能；音频按块（例如每 10 ms）求一次值，块内线性渐变，避免拉链噪声。

### 4.4 关键帧与变速的时间基 【推断/业界通用】

`time_offset` 相对于"片段起点"。片段变速后，关键帧挂在**时间线时间**还是**素材时间**上，会直接影响"改速度后关键帧是否跟着滑动"。社区数据只说明了相对片段起点，基准轴本次未能确认。工程上比较稳妥的做法是：视觉属性关键帧挂在时间线时间（所见即所得），与素材内容绑定的属性（例如跟踪）挂在素材时间，两者用 §10 的时间映射函数相互换算。

---

## 5. 蒙版（形状蒙版与羽化）

### 5.1 官方能力 【官方/一手】（搜索摘要）

- 剪映官网：蒙版有"线性、圆形、文字、钢笔"等形式。（未能核实）
- CapCut：horizontal（线性）、mirror（镜面）、circle、rectangle、heart、star，可羽化、反转；BytePlus product overview 也列出 6 种（linear、mirror、circle、rectangle、heart、star）。（官方原文未能核实；这 6 种与 pyJianYingDraft `mask_meta.py` 一致）
- BytePlus iOS 指南："You can add only one mask to a video on each track"。（原文未能核实）

### 5.2 蒙版参数线索 【社区逆向/开源】

pyJianYingDraft 的 `mask_meta.py` 与 `video_segment.py` 给出了以下信息：

| 中文名 | `resource_type` | 默认宽高比 | 备注 |
|---|---|---|---|
| 线性 | `line` | 1.0 | 默认遮挡下方部分 |
| 镜面 | `mirror` | 1.0 | 默认保留两线之间部分 |
| 圆形 | `circle` | 1.0 | |
| 矩形 | `rectangle` | 1.0 | 有圆角 `roundCorner` 和独立宽度 |
| 爱心 | `geometric_shape` | 1.115 | |
| 星形 | `geometric_shape` | 1.05 | |

- 蒙版 `config` 的字段：`centerX`、`centerY`（**以半个素材宽/高为单位**）、`width`、`height`（相对素材尺寸的比例）、`rotation`、`feather`（0–1，UI 上的 0–100 除以 100）、`roundCorner`（0–1）、`invert`、`aspectRatio`。`expansion` 只出现在新版格式中：社区库注释说新版剪映不再读 `materials.masks`，改读 `materials.common_mask`，而 `expansion=0.0` 只加在这种扩展条目的 `config` 里。
- 每种蒙版都有 `resource_id` 和 md5，说明**连"线性"这种简单蒙版也作为资源包下发**。推测蒙版 shader 和参数面板由效果资源驱动（研究方向 a）。
- 蒙版坐标**相对素材**（material），不相对画布：蒙版跟着素材一起平移、缩放、旋转。

### 5.3 解析形状蒙版：SDF + 羽化 【推断/业界通用】

思路：把片元坐标变换到"蒙版局部坐标系"（以蒙版中心为原点、去掉旋转、以素材像素为单位），计算到形状边界的有符号距离 d（内负外正），再用羽化宽度把 d 映射成 alpha。

```glsl
// —— 蒙版 shader（笔者自写，演示用）——
uniform sampler2D uSrc;          // 片段画面（预乘）
uniform vec2  uTexSize;          // 素材像素尺寸
uniform vec2  uCenter;           // 蒙版中心（素材像素坐标）
uniform float uRot;              // 弧度
uniform vec2  uHalf;             // 半宽、半高（像素）
uniform float uFeather;          // 羽化宽度（像素）
uniform float uCorner;           // 圆角半径（像素），仅矩形
uniform int   uShape;            // 0 线性 1 镜面 2 椭圆 3 圆角矩形
uniform bool  uInvert;
varying vec2 vUV;

float sdRoundRect(vec2 p, vec2 b, float r) {
    vec2 q = abs(p) - b + r;
    return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - r;
}
// 椭圆的一阶近似距离：令 k0=|p/ab|，f=k0-1，|∇k0| = k1/k0，其中 k1=|p/ab²|
// 于是 d ≈ f / |∇f| = k0*(k0-1)/k1。离边界越近越准，羽化范围内足够用。
float sdEllipseApprox(vec2 p, vec2 ab) {
    float k0 = length(p / ab);
    float k1 = length(p / (ab * ab));
    return k0 * (k0 - 1.0) / max(k1, 1e-6);
}

void main() {
    vec2 px = vUV * uTexSize - uCenter;
    float c = cos(uRot), s = sin(uRot);
    vec2 p = vec2(c * px.x + s * px.y, -s * px.x + c * px.y);   // 逆旋转到局部坐标

    float d;
    if      (uShape == 0) d = -p.y;                             // 线性：保留 y>0 一侧
    else if (uShape == 1) d = abs(p.y) - uHalf.y;               // 镜面：两线之间
    else if (uShape == 2) d = sdEllipseApprox(p, uHalf);
    else                  d = sdRoundRect(p, uHalf, uCorner);

    // 羽化：在边界两侧各 feather/2 的范围内平滑过渡（也可以只向外或只向内）
    float a = 1.0 - smoothstep(-0.5 * uFeather, 0.5 * uFeather, d);
    if (uFeather < 1.0) a = clamp(0.5 - d, 0.0, 1.0);          // 无羽化时保留 1px 抗锯齿
    if (uInvert) a = 1.0 - a;

    gl_FragColor = texture2D(uSrc, vUV) * a;                    // 预乘：rgb 和 a 一起乘
}
```

几个参照与要点：

- **frei0r `alphaspot`**（Kdenlive/Shotcut 常用的简单形状蒙版）【社区逆向/开源】：
  - 支持矩形、椭圆、三角、菱形，参数有位置、尺寸、Tilt、Transition width（即羽化带宽 `wb`）、Min/Max alpha、Operation（write on clear/max/min/add/subtract）。
  - 椭圆用 `d = hypotf(d1*is1, d2*is2)` 得到"归一化半径"，在 `[1-wb, 1]` 区间线性过渡。作者在注释中承认**这样的过渡带宽度不均匀**：用归一化半径代替真实距离，长轴方向的羽化会比短轴宽。上面的 `sdEllipseApprox` 就是为了让羽化在像素意义上大致等宽。
- **OBS `mask_alpha_filter.effect`** 【社区逆向/开源】：先反预乘，再 `rgba.a *= targetRGB.a`（只用蒙版的 alpha），最后重新预乘。这是"蒙版 = 一张 alpha 纹理"的通用做法，适用于爱心、星形、文字、钢笔这类不方便写解析式的形状。
- **爱心、星形** 【推断/业界通用】：两种做法都可行：解析 SDF（星形可以写成正多边形折线的 SDF），或者把形状预先烘焙成 SDF 纹理放进资源包，运行时缩放采样后照样可以用 `smoothstep` 羽化。社区数据显示它们共用 `resource_type = geometric_shape`、宽高比各不相同（1.115、1.05），更像后一种"资源驱动的几何形状"。
- **镜面蒙版**的"宽度"由 `uHalf.y` 控制，线性蒙版只有一条边界。两者的旋转都由 `uRot` 实现。

### 5.4 文字蒙版与钢笔蒙版 【推断/业界通用】

- **文字蒙版**：先用 §3 的文字管线把文字渲染成 SDF 或覆盖率纹理，再当作 alpha 纹理蒙版使用。羽化时，SDF 版本可以直接加宽 smoothstep 的过渡带。
- **钢笔蒙版**（任意贝塞尔路径）：路径填充可以用 Skia/CPU 光栅化成覆盖率纹理，或者用 GPU 的 stencil-then-cover 填充。羽化有两种做法：对覆盖率纹理做可分离高斯模糊（σ ≈ feather/2，开销随羽化半径增长）；或用 Jump Flooding 求距离场后 smoothstep（开销与羽化半径无关）。
- **蒙版的关键帧**：BytePlus 文档指出"除关键帧场景外，同一时间段内的素材参数必须一致"（未能核实）。剪映允许对蒙版的位置、大小、羽化打关键帧，只要逐帧更新 uniform 即可，代价很低。这也是解析 SDF 蒙版的一大优势：不需要重新生成纹理。

---

## 6. 色度抠图（Chroma Key）与去溢色

### 6.1 官方能力与参数 【官方/一手】（CapCut 部分为搜索摘要，未能核实；SDK 部分已用火山引擎官方头文件核实）

- CapCut：取色器选背景色，调节 **Strength、Shadow、Edge feathering**。抠不干净时，官方建议重新取色、调 Strength/Shadow，并使用更高分辨率的素材。（未能核实）
- 火山引擎/BytePlus Effects 的 chroma keying SDK（属于研究方向 a 的 SDK，这里只看参数语义）。依据是 volcengine/VolcEngineRTC 仓库附带的 `bef_effect_ai_chroma_keying.h`：
  - `similar`："相似度（最主要影响抠图强度"。"官方建议一般只调它"这句话在头文件中找不到（未能核实）。
  - `smoothness`："平滑度（搭配similar的，影响半透明等过渡状态"。
  - `correction`："去绿强度"，即 SDK 有独立的去溢色参数。
  - `clip_black/clip_white`：对最终 mask 做黑白截断的曲线增强。
  - `BEF_AI_CHROMA_KEYING_SMOOTH`（平滑系数）：**小于 0 时无平滑**；**等于 0 时"仅启用mask时序平滑，估色无时序平滑【推荐0】"**；0～1 时同时启用 mask 时序平滑和背景色估计平滑，数值表示背景色估计的平滑强度。
  - `BEF_AI_CHROMA_KEYING_CAL_COLOR`：键色可以全图自动提取（0）、按绿幕场景精细提取（1，默认）或人工设置（2）。
  - `soft_process`：`detect()` 的 bool 参数，确实存在；"V4.5.0+、保留原始绿色、用于弱去绿"的说明未能核实。
  - `BEF_AI_CHROMA_KEYING_METHOD`：0 为移动端实时方案（推荐默认），1 为服务端方案。

### 6.2 草稿中的抠图参数 【社区逆向/开源】

pyJianYingDraft 的 `add_chroma` 导出 `"type": "chroma"`、`"version": "v2"`，字段为：

| 字段 | 社区库默认值（UI 0–100 → /100） | 推测语义 |
|---|---|---|
| `color` | `#RRGGBBAA` | 取色器选中的键色 |
| `intensity_value` | 0.20 | 强度，对应 similarity 阈值 |
| `shadow_value` | 0 | 阴影保留（见 6.4） |
| `edge_smooth_value` | 0 | 社区库注释的 UI 名为"边缘羽化（剪映会员功能）"；推测对应 smoothness 过渡带 |
| `spill_value` | 0 | 社区库注释的 UI 名为"**边缘清晰**（剪映会员功能）"，不是"去溢色"。它是否对应 SDK 的 `correction`（去绿强度）或边界锐化，未能确认 |
| `should_transfer_color` | true | 未能确认，可能与颜色校正/去溢色有关 |

> `version: "v2"` 说明抠图算法至少迭代过一次。它与 BytePlus 文档中"V4.5.0 新增 soft_process"的版本演进是否相关、是否同源，均未能确认（V4.5.0 一说本身也未能核实）。

### 6.3 三个开源实现的算法对照 【社区逆向/开源】

**① FFmpeg `vf_chromakey.c`**（YUV 色度平面距离 + 3×3 平均）

- 键色经 BT.601 系数转为 (U,V)；也可以直接给 YUV。
- 对输出像素取 3×3 邻域的 9 个色度样本，逐个求归一化距离再平均：
  `diff += sqrt((du * du + dv * dv) / (255.0 * 255.0 * 2));` 然后 `diff /= 9.0;`
- 映射到 alpha：
  - 硬边（`blend` ≈ 0）：`(diff > similarity) ? 255 : 0`
  - 软边：`av_clipd((diff - similarity) / blend, 0.0, 1.0) * 255.0`
- 选项：`color`（默认 black）、`similarity`（默认 0.01）、`blend`（默认 0）、`yuv`。

**② OBS `chroma_key_filter_v2.effect`**（CbCr 距离 + 偏置盒式滤波 + 1.5 次幂 + 去色式去溢色）

- 先把采样值经 sRGB 编码曲线（`GetNonlinearChannel`）转到伽马空间，再用 BT.601 风格仿射矩阵求 Cb、Cr（偏移 0.501961 ≈ 128/255）。
- 中心像素权重 1，四个偏置邻点各权重 2，合计除以 9，得到平滑后的色度距离。
- alpha：`baseMask = chromaDist - similarity`，`fullMask = pow(saturate(baseMask / smoothness), 1.5)`。
- 去溢色：`spillVal = pow(saturate(baseMask / spill), 1.5)`，再 `rgb = lerp(luma, rgb, spillVal)`。也就是说，**离键色越近越去饱和**：绿边变灰，而不是变成品红。
- 整个处理前后分别反预乘、再预乘。

**③ GPUImage `GPUImageChromaKeyFilter`**（最简版）

- `Y = 0.2989R + 0.5866G + 0.1145B`，`Cr = 0.7132(R−Y)`，`Cb = 0.5647(B−Y)`。
- `blendValue = smoothstep(threshold, threshold + smoothing, distance(CrCb, keyCrCb))`，alpha 直接乘以 blendValue。默认 threshold 0.4、smoothing 0.1。

**④ FFmpeg `vf_despill.c`**（基于颜色通道关系的去溢色，RGB 域）

- 绿幕情形：`spillmap = max(G − (R·mix + B·factor), 0)`，其中 `factor = (1 − mix)(1 − expand)`。
- 修正：`R' = max(R + spillmap·redscale + brightness·spillmap, 0)`，G、B 同理。默认 `green = -1`，即只从 G 中扣除溢出量。
- 可选把 `1 − spillmap` 写入 alpha。

| 维度 | FFmpeg chromakey | OBS v2 | GPUImage |
|---|---|---|---|
| 色彩空间 | YUV（U,V） | 伽马空间 CbCr | YCbCr（Cr,Cb） |
| 抗噪 | 3×3 平均距离 | 5 点加权（偏置采样） | 无 |
| alpha 曲线 | 线性 ramp | 线性 ramp 的 1.5 次幂 | smoothstep |
| 去溢色 | 另用 despill（RGB 通道关系） | 去饱和 lerp 到亮度 | 无 |

### 6.4 一个把剪映参数映射到 GPU 的参考 shader 【推断/业界通用】

下面是笔者自写的示意，参数名对应 §6.2 的草稿字段。其中 Shadow 的语义是**推测**：绿幕上常有被摄者投下的阴影，阴影区色度接近键色但亮度更低，"阴影"参数可以把这部分保留为半透明的黑色，而不是完全抠掉。

```glsl
uniform sampler2D uSrc;      // 预乘 RGBA
uniform vec2  uTexel;        // 1/width, 1/height
uniform vec3  uKey;          // 键色（非预乘，0..1）
uniform float uIntensity;    // intensity_value → 相似度阈值
uniform float uEdge;         // edge_smooth_value → 过渡带宽
uniform float uShadow;       // shadow_value → 阴影保留强度（推测语义）
uniform float uSpill;        // spill_value（UI 名"边缘清晰"）→ 此处按去溢色强度实现（推测语义）
varying vec2 vUV;

vec2 toCbCr(vec3 c) {        // BT.601 全范围
    float y = dot(c, vec3(0.299, 0.587, 0.114));
    return vec2((c.b - y) * 0.564, (c.r - y) * 0.713);
}
vec3 unpremul(vec4 c) { return c.a > 0.0 ? c.rgb / c.a : vec3(0.0); }

void main() {
    vec4  src   = texture2D(uSrc, vUV);
    vec3  rgb   = unpremul(src);
    vec2  keyUV = toCbCr(uKey);
    // 1) 抗噪距离：中心 + 4 邻点平均（参考 FFmpeg/OBS 的思路）
    float d = distance(toCbCr(rgb), keyUV);
    d += distance(toCbCr(unpremul(texture2D(uSrc, vUV + vec2( uTexel.x, 0.0)))), keyUV);
    d += distance(toCbCr(unpremul(texture2D(uSrc, vUV + vec2(-uTexel.x, 0.0)))), keyUV);
    d += distance(toCbCr(unpremul(texture2D(uSrc, vUV + vec2(0.0,  uTexel.y)))), keyUV);
    d += distance(toCbCr(unpremul(texture2D(uSrc, vUV + vec2(0.0, -uTexel.y)))), keyUV);
    d /= 5.0;
    // 2) alpha：阈值 + 过渡带
    float sim   = mix(0.02, 0.35, uIntensity);
    float alpha = smoothstep(sim, sim + max(uEdge * 0.25, 1e-3), d);
    // 3) 阴影保留（推测）：键色区域按"比键色暗多少"给出黑色半透明
    float yKey = dot(uKey, vec3(0.299, 0.587, 0.114));
    float yPix = dot(rgb,  vec3(0.299, 0.587, 0.114));
    float shadowA = uShadow * clamp((yKey - yPix) / max(yKey, 1e-3), 0.0, 1.0) * (1.0 - alpha);
    // 4) 去溢色（FFmpeg despill 思路，绿幕）：只在半透明边缘和前景中压绿
    float spill = max(rgb.g - (rgb.r * 0.5 + rgb.b * 0.5), 0.0);
    rgb.g -= spill * uSpill;
    // 5) 输出预乘结果：前景色 + 阴影（黑色）
    float aOut = alpha * src.a + shadowA;
    gl_FragColor = vec4(rgb * alpha * src.a, aOut);
}
```

工程要点：

- **键色不必限定为绿/蓝**：取色器可以选任意颜色，所以要用"色度距离"，不能用"G 通道主导"这类假设。但 despill 公式里的"哪个通道是溢出通道"需要根据键色判断：取键色 RGB 中最大的分量。
- **YUV 直接在解码平面上做**：视频解码输出 NV12/YUV420 时，FFmpeg 的做法（直接取 U、V 平面）可以省掉 RGB↔YUV 转换。色度平面分辨率减半，所以要像 FFmpeg 那样在邻域内取样，抑制块状边缘。
- **时域稳定**：官方 SDK 头文件中，`BEF_AI_CHROMA_KEYING_SMOOTH` 的推荐值 0 **并不表示关闭**，而是"仅启用 mask 时序平滑、背景色估计不做时序平滑"；小于 0 才是完全不平滑。也就是说，官方默认对 **alpha 遮罩做时序平滑**以抑制闪烁，但不对**键色估计**做时序平滑，可能是为了让键色及时跟上光照变化（这一动机是笔者推断）。自研实现可以照此拆分：对 alpha 做轻度时域滤波，键色逐帧估计或固定不变。
- **智能抠像（人像分割）** 不在本章范围。它属于 CV/Effect SDK（研究方向 a），走的是"分割网络输出 alpha → 本节第 3、4 步的边缘与溢色处理"这条路径。

---

## 7. 混合模式

### 7.1 官方能力与模式清单 【官方/一手】（搜索摘要）+【社区逆向/开源】

- 官方：画中画素材可以选择 Screen、Multiply、Overlay、Darken、Lighten 等混合模式；BytePlus 称多轨叠加支持 "various blend modes"。
- 社区 `mix_mode_meta.py` 列出的 **10 种**模式，加上默认的"正常"：

| 剪映名称 | 标准名 | B(Cb, Cs)（Cb=底层，Cs=上层，非预乘，0..1） | 来源 |
|---|---|---|---|
| 变暗 | darken | `min(Cb, Cs)` | W3C |
| 滤色 | screen | `Cb + Cs − Cb·Cs` | W3C |
| 叠加 | overlay | `HardLight(Cs, Cb)`，即以底层为判据的强光 | W3C |
| 正片叠底 | multiply | `Cb·Cs` | W3C |
| 变亮 | lighten | `max(Cb, Cs)` | W3C |
| 强光 | hard-light | `Cs≤0.5 ? Cb·2Cs : Screen(Cb, 2Cs−1)` | W3C |
| 柔光 | soft-light | 见下（**存在多种变体**） | W3C / glsl-blend |
| 线性加深 | linear burn | `max(Cb + Cs − 1, 0)` | glsl-blend |
| 颜色加深 | color-burn | `Cb==1 ? 1 : Cs==0 ? 0 : 1 − min(1, (1−Cb)/Cs)` | W3C |
| 颜色减淡 | color-dodge | `Cb==0 ? 0 : Cs==1 ? 1 : min(1, Cb/(1−Cs))` | W3C |

**柔光的两种公式** 【社区逆向/开源】：

- W3C Compositing Level 1（与 PDF/Photoshop 一致的分段版）：`Cs≤0.5 ? Cb − (1−2Cs)·Cb·(1−Cb) : Cb + (2Cs−1)·(D(Cb) − Cb)`，其中 `D(Cb) = Cb≤0.25 ? ((16Cb−12)·Cb+4)·Cb : sqrt(Cb)`。
- jamieowen/glsl-blend 中的版本：`blend<0.5 ? 2·base·blend + base²·(1−2·blend) : sqrt(base)·(2·blend−1) + 2·base·(1−blend)`。

两者在暗部曲线上不同，剪映采用哪种未能确认。复刻剪映效果时，需要用同一素材做像素级对比来判定。

### 7.2 带 Alpha 的完整合成公式 【社区逆向/开源】

W3C 规范给出混合与合成的两步：

1. **混合**：`Cs' = (1 − αb)·Cs + αb·B(Cb, Cs)`。底层不透明的地方用混合结果，底层透明的地方保持上层原色。
2. **合成（source-over，预乘）**：`co = cs + cb·(1 − αs)`。

把第 1 步代入第 2 步，并记 `cs = αs·Cs`，就得到 GPU 上一次算完的预乘公式（笔者推导）：

```
co = cs·(1 − αb) + cb·(1 − αs) + αs·αb·B(Cb, Cs)
αo = αs + αb·(1 − αs)
```

```glsl
// 笔者自写：预乘输入 b(底层)、s(上层)；opacity 为画中画"不透明度"
vec3 blendFn(vec3 Cb, vec3 Cs, int mode);   // 上表的 B()
vec4 compositeBlend(vec4 b, vec4 s, float opacity, int mode) {
    s *= opacity;                                     // 预乘下直接整体缩放
    vec3 Cb = b.a > 0.0 ? b.rgb / b.a : vec3(0.0);
    vec3 Cs = s.a > 0.0 ? s.rgb / s.a : vec3(0.0);
    vec3 co = s.rgb * (1.0 - b.a) + b.rgb * (1.0 - s.a) + s.a * b.a * blendFn(Cb, Cs, mode);
    return vec4(co, s.a + b.a * (1.0 - s.a));
}
```

### 7.3 GPU 实现要点 【推断/业界通用】

- **固定功能混合（glBlendFunc）只能实现正常、相加、正片叠底等少数模式**。滤色、叠加、柔光、颜色加深/减淡都要在 shader 里读到底层颜色。可选做法：
  1. **Ping-pong**：底层画布渲染到纹理 A；画上层时把 A 作为输入纹理，结果写到纹理 B，再交换。通用、可移植，但每个混合层多一次全屏 pass。
  2. **Framebuffer fetch**（`GL_EXT_shader_framebuffer_fetch` / Metal 的 `[[color(0)]]`）：在 tile-based GPU 上可以直接读当前像素，免去额外拷贝。是否可用要按平台判断。
  3. 只拷贝上层包围盒（画中画通常不满屏）对应的底层区域，减少带宽。
- **颜色空间**：Photoshop 式混合在**伽马编码空间**（sRGB 值）直接运算。若引擎内部用线性光，混合前需要转回 sRGB 值，否则"叠加/柔光"的观感会和 PS 不一致。剪映的内部色彩空间未能确认。
- **opacity 的位置**：W3C 公式中 opacity 作用于上层 alpha。glsl-blend 的 opacity 变体则是 `blend(base, blend)·opacity + base·(1−opacity)`。上层完全不透明时两者等价，上层自身带 alpha 时结果不同。

---

## 8. 转场

### 8.1 官方行为 【官方/一手】（搜索摘要）+【社区逆向/开源】

- 转场只能加在**两个相邻片段**之间；有时长滑杆；片段太短时"Some transitions require enough frames from both clips"，可能加不上。
- 社区 `transition_meta.py` 中，每个转场带 `default_duration`（例如"3D空间"1.5s，"上移/下移"0.5s）和 **`is_overlap`** 标志（例如"中心旋转"为 False）。当前 main 分支共收录 453 个转场，其中"免费特效"130 个、"付费特效"323 个（按 `transition_meta.py` 中 `TransitionMeta(` 条目和 is_vip 字段计数；社区库会持续增补，这个数字会变）。

`is_overlap` 说明剪映的转场至少有两种时间语义，示意如下【推断/业界通用】：

```
重叠型（is_overlap = true）：两段在时间上交叠 D，总时长缩短 D
  A: ███████████████▓▓▓▓
  B:                ▓▓▓▓█████████████
                    └ D ┘  progress 0→1；A 的尾部与 B 的头部同时解码

非重叠型（is_overlap = false）：不改变总时长，在切点两侧各占一部分
  A: ███████████████▓▓|
  B:                  |▓▓████████████
                   └ D ┘  前半段只用 A 的画面做"出"，后半段只用 B 的画面做"入"
                         （或者在切点处冻结一帧当作另一侧输入）
```

非重叠型的具体取帧规则未能确认。上图是两种常见实现之一。

### 8.2 gl-transitions：把转场写成"一个函数" 【社区逆向/开源】

gl-transitions 的规范把转场定义为"在 `from` 与 `to` 两张纹理之间平滑过渡的动画"：

- 入口：`vec4 transition(vec2 uv)`。
- 输入：`progress`（0→1，**0 时必须完全是 from，1 时必须完全是 to**）、`ratio`（宽/高，用于保持形状不变形）。
- 取色必须用 `getFromColor(uv)` 和 `getToColor(uv)`，不能直接用 `texture2D`，这样宿主可以统一处理宽高比适配和越界颜色。
- 参数是 `uniform`，默认值写在行尾注释里（`uniform float foo; // = 42.0`），因为 GLSL 120 不能初始化 uniform。另有 `@range`、`@color` 等 UI 提示。转场还可以带额外的 `sampler2D`（例如亮度图、位移图）。

几个例子：

```glsl
// fade.glsl —— 交叉溶解
vec4 transition (vec2 uv) {
  return mix(getFromColor(uv), getToColor(uv), progress);
}

// luma.glsl —— 按灰度图擦除（剪映里大量"形状擦除"类转场都能用一张 luma 图表达）
uniform sampler2D luma;
vec4 transition(vec2 uv) {
  return mix(getToColor(uv), getFromColor(uv), step(progress, texture2D(luma, uv).r));
}
```

`directionalwipe.glsl` 则用 `m = 1.0 − smoothstep(-smoothness, 0.0, v·uv − (d − 0.5 + progress·(1 + smoothness)))` 实现带软边的方向擦除。源码注释坦承 progress=0 时 m 不严格为 0，于是额外乘了 `(1.0 - step(progress, 0.0))` 做修补。这提醒我们：**实现转场时要显式保证两个端点条件**。

### 8.3 宿主侧调度 【推断/业界通用】

```text
for 输出时刻 t ∈ [T0, T0 + D):
    p      = easing( (t - T0) / D )                // 转场本身也可以有缓动
    fromTx = renderClipChain(clipA, srcTimeA(t))   // A 的完整片段效果链（含关键帧、滤镜、蒙版）
    toTx   = renderClipChain(clipB, srcTimeB(t))
    drawFullscreen(transitionProgram, {from: fromTx, to: toTx, progress: p, ratio: W/H, params...})
```

- **双路解码**：重叠区间内必须同时解出 A、B 两路视频帧。移动端硬解码器实例数量有限，这是转场时长和"相邻片段过短"限制的工程原因之一。官方帮助只说需要两侧都有足够帧，"解码器数量"这层原因是推断。
- **复杂转场是多 pass 的效果图**：例如"模糊推移"需要先对 from/to 做方向模糊，再位移合成；3D 翻页需要透视投影的网格变形，不是单个片元 shader。剪映的转场同样是资源包（有 `resource_id/md5`），由效果引擎解释（研究方向 a）。gl-transitions 适合拿来理解"单 pass 转场"这个核心抽象。

---

## 9. 入场/出场/组合动画

### 9.1 社区逆向揭示的规则 【社区逆向/开源】

pyJianYingDraft 的 `animation.py`：

- 动画条目字段：`type`（`"in"`、`"out"`、`"group"`、`"loop"`）、`resource_id`、`start`、`duration`（微秒，相对片段起点）、`material_type`（视频为 `"video"`，文字为 `"sticker"`）、`anim_adjust_params`（社区库写为 null）。容器类型是 `"sticker_animation"`。
- 约束：
  - 同一 `type` 只能有一个。
  - **组合动画（group）与其他视频动画互斥**：已有任何动画时不能加 group，有 group 后也不能再加别的。
  - 文字：已有 loop 时不能再加任何其他动画。错误提示原文是"当前片段已存在循环动画, 若希望同时使用循环动画和入出场动画, 请先添加出入场动画再添加循环动画"，也就是说，顺序必须是先 in/out、后 loop。

### 9.2 实现模型 【推断/业界通用】

把动画看成作用在"关键帧求值结果"之上的**参数化偏移**：

```text
p_in    = clamp((t - in.start) / in.duration, 0, 1)                 // 入场进度
p_out   = clamp((t - out.start) / out.duration, 0, 1)               // 出场进度
p_group = clamp((t - group.start) / group.duration, 0, 1)           // 组合动画覆盖整段
p_loop  = fract((t - loop.start) / loop.period)                     // 循环动画（文字）

Base     = KeyframeEval(t)                         // §4：用户关键帧给出的 transform/alpha
AnimIn   = PresetIn(p_in)                          // 例如"向左滑入"：Δx = (1 - easeOut(p))·W
AnimOut  = PresetOut(p_out)
Final    = AnimOut ∘ AnimIn ∘ Base                 // 矩阵相乘、alpha 相乘
Effects  = PresetShaderParams(p)                   // 有些动画还带模糊、抖动、RGB 分离等 shader 参数
```

- 动画以**相对量**叠加在用户关键帧之上，所以用户移动或缩放素材后，入场动画仍然有效。
- "组合动画"覆盖全片段，内部通常已经编排好入、中、出的完整节奏，所以与入场/出场互斥。这个规则与 §9.1 的约束相符。
- 文字的 loop 在入场结束后开始循环，可以理解为 `loop.start = in.end`。这与社区库"先加 in/out 再加 loop"的提示一致，但官方规则未能确认。

---

## 10. 变速与曲线变速（时间重映射 + 音频变速不变调）

### 10.1 官方能力 【官方/一手】（搜索摘要）（部分未能核实）

- **曲线变速**：预设有 Montage、Bullet、Jump Cut、Hero，也可选 Custom；在曲线上拖动或添加点；桌面端曲线图上半区最多加速 10x，下半区最慢 0.1x。（未能核实）
- **常规变速 + 声音变调**：BytePlus VE SDK 有 `setSpeed()` 和 `setKeepTone()`，后者就是"变速不变调"开关（`setKeepTone` 有第三方集成示例佐证，见 §1.2）；`curve_speed.bundle` 是曲线变速的资源包（有第三方集成示例佐证，见 §1.2）；speed 属性被描述为速度的 "DC component"，"also applicable to the curve speed"（未能核实）。
- **慢动作补帧**："Smooth slow-mo"，以及桌面端的 Frame blending / Optical flow 选项（未能核实）。另有第三方转载的剪映更新日志称 7.5.1 版本上线【智能补帧】，未能在官方页面核实。

### 10.2 时间重映射的数学 【推断/业界通用】+【社区逆向/开源】

设片段在时间线上的输出时长为 `T`，素材使用区间长度为 `S`，速度曲线为 `v(x)`（`x = τ/T ∈ [0,1]` 是输出时间的归一化坐标，`v` 是相对速度倍率）。

**素材时间 = 速度对输出时间的积分**：

```
src(τ) = ∫₀^τ v(u/T) du = T · V(τ/T)，    其中 V(x) = ∫₀^x v(ξ) dξ
约束：src(T) = S    ⇒    T = S / V(1)      （V(1) 就是曲线的"平均速度"）
```

这正好对应 BytePlus 文档里的 "DC component"：任意曲线都可以分解成 **平均速度（DC）× 归一化形状**。用户拖动整体速度时只改 DC，形状不变，输出时长按 `S / DC` 变化。这是笔者对官方文档措辞的推断性解读。

**分段线性曲线的闭式积分与反函数**（笔者自写伪代码）：

```text
// 控制点 (x_k, v_k)，x_0 = 0 < x_1 < ... < x_n = 1，段内线性
float V(x):                          // 前缀积分，可预计算每段起点的累计面积 A_k
    k = segmentOf(x)
    dx = x - x_k
    slope = (v_{k+1} - v_k) / (x_{k+1} - x_k)
    return A_k + v_k*dx + 0.5*slope*dx*dx        // 梯形面积的闭式

float srcTimeOf(τ):  return S * V(τ/T) / V(1)    // 时间线 → 素材（取帧用）

float outTimeOf(s):                  // 素材 → 时间线（换算关键帧、音频块边界用）
    target = s / S * V(1)
    k = 满足 A_k ≤ target < A_{k+1} 的段
    // 解 0.5*slope*dx² + v_k*dx - (target - A_k) = 0
    dx = slope≈0 ? (target - A_k)/v_k
                 : (-v_k + sqrt(v_k² + 2*slope*(target - A_k))) / slope
    return (x_k + dx) * T
```

如果曲线是贝塞尔或 Catmull-Rom 平滑曲线（UI 上看起来通常是平滑的），可以先按 1–2 ms 的步长采样成分段线性，再走上面的闭式计算。误差远小于一帧。

**开源参照：MLT 的 `link_timeremap.c`** 【社区逆向/开源】

- 提供两种映射：`time_map`（关键帧化的"素材时间"，直接给出时间 → 时间）和 `speed_map`（关键帧化的"速度"，**逐帧积分**得到素材时间：`source_time = integrate_source_time(self, position) + in_time`）。这正是上面两种参数化方式的工程实现。
- 取帧有 `image_mode`：`nearest`（取 `floor(source_time * source_fps)` 那一帧），或 blend（把覆盖当前输出帧时长的多个源帧**等权平均**，最多 `MAX_BLEND_IMAGES` = 10 帧）。blend 对应 CapCut 的 "Frame blending"。
- 音频：速度低于 0.1 或高于 10 时输出静音（与 CapCut 0.1x–10x 的范围恰好一致，但这只是巧合层面的对照）。设置 `pitch` 时音频走 `rbpitch` 滤镜，即 Rubber Band 库（`filter_rbpitch.yml` 原文："Adjust the audio pitch using the Rubberband library."，许可标注为 GPLv2），否则走普通重采样（音调随速度变化）。
- 速度为负时倒放：`mlt_audio_reverse()`。

### 10.3 视频取帧与补帧 【推断/业界通用】+【官方/一手】（搜索摘要）

| 模式 | 做法 | 适用 |
|---|---|---|
| 最近帧 | `frameAt(floor(src·fps))` | 默认；加速时自然丢帧，减速时重复帧（卡顿感） |
| 帧混合 | 输出帧时间窗内的源帧加权平均（MLT 为等权） | 快：加速时出运动模糊；慢动作时出"重影" |
| 光流补帧 | 估计相邻两帧的双向光流，按相位 α 前向/后向 warp 后融合 | 慢动作最流畅；CapCut 官方页面称更慢但质量更好，快速运动时可能变形 |

光流或深度学习插帧模型属于 CV 能力（研究方向 a）。剪映使用的具体模型未能确认；网上有"集成了 RIFE"的说法，但来源不可靠，本章不采信。

**解码侧的工程问题** 【推断/业界通用】：曲线变速在高倍速段每秒要读取 `v × fps` 个源帧，10x 时相当于 300 fps 的解码压力。常见做法：

1. 高倍速时只解码关键帧或跳帧解码。
2. 预览阶段使用低分辨率代理文件（36 氪的报道提到剪映有"轻量化代理文件生成"，但不是技术文档；该报道内容未能核实）。
3. 导出时离线逐帧精确求值。

### 10.4 音频：分块变速 + 时间伸缩 【社区逆向/开源】+【推断/业界通用】

**核心思想**：音频不能逐样本改变速度，而是把速度曲线**离散成分段常数**，每块交给时间伸缩器。

- **Android Media3 的 `SpeedProvider`** 接口正是这个抽象：`getSpeed(timeUs)` 返回当前速度；`getNextSpeedChangeTimeUs(timeUs)` 返回下一个变化点，速度在两个变化点之间保持不变。
- **`SpeedChangingAudioProcessor`** 的实现：
  - 在变化点处截断输入缓冲，单次调用不会跨越速度边界。
  - 每段送入 Sonic 处理。速度改变时更新 Sonic 的 speed；**如果不需要保持音调，就把 pitch 设成与 speed 相同**（`shouldMaintainPitch` 为 false 时）。
  - 时间戳双向换算：`getSpeedAdjustedTimeAsync`（媒体时间 → 播放时间）和 `getMediaDurationUs`（播放时间 → 媒体时间），按段累加各段的期望帧数。
- 用于曲线变速时，可以按 10–20 ms 一块取 `v` 的块平均值作为该块的常数速度（笔者推断）。块越小越平滑，但时间伸缩器的状态会被频繁重置，引入伪影。Media3 在每次变速时 flush Sonic，就是这种权衡的体现。

**三类时间伸缩算法**：

| 库 | 算法类型 | 要点 | 许可 |
|---|---|---|---|
| SoundTouch | 时域 WSOLA 类 | 头文件注释："Changes the sound tempo while maintaining the original pitch by using a time domain WSOLA-like method"；参数为 sequence 长度、seek window、overlap（`DEFAULT_OVERLAP_MS 8`，sequence/seekwindow 默认自动）；变调另用重采样实现 | LGPL（Firefox 内置一份，`media/libsoundtouch`） |
| Sonic | 时域、基音同步 | Media3 内置的 `Sonic.java` 注明 "Based on https://github.com/waywardgeek/sonic"；用 AMDF 找基音周期，加速时 `skipPitchPeriod`、减速时 `insertPitchPeriod`，接缝处 `overlapAdd` 线性交叉淡化；README 称针对 2x 以上语音加速优化 | Apache-2.0 |
| Rubber Band | 频域（相位声码器）| R2 "Faster" 与 R3 "Finer" 两个引擎，R3 质量更高但 CPU 开销大得多；有实时与离线模式 | GPL，商业闭源分发（README 特别提到 App Store）需要购买商业许可 |

**WSOLA 伪代码**（笔者自写，用于理解）：

```text
// 输入 x[]，速度 r（>1 加速），窗长 L（约 20–40ms），合成跳步 Hs = L/2，分析跳步 Ha = r·Hs
// 搜索半径 Δ（约 10–15ms），w[] 为汉宁窗
outPos = 0; inPos = 0; prevTail = x[0 : L]
loop:
    nominal = round(inPos)
    // 在 [nominal-Δ, nominal+Δ] 中找与"上一块自然延续"最相似的位置
    best = argmax_{δ∈[-Δ,Δ]} xcorr( x[nominal+δ : +L], prevTail )
    seg  = x[nominal+best : +L]
    y[outPos : +L] += w[] * seg            // 重叠相加（窗函数满足 COLA）
    prevTail = x[nominal+best+Hs : +L]     // 该段的自然延续，供下一次匹配
    outPos += Hs ; inPos += Ha
```

**选型推断** 【推断/业界通用】：剪映作为闭源商业 App，GPL 的 Rubber Band 需要商业授权才能使用。语音为主的场景用 Sonic/WSOLA 类时域算法足够，成本也低；音乐类素材在大倍率下需要相位声码器类算法才能保证质量。剪映实际用的是哪一种，本次**未能确认**。字节跳动有自研音频技术团队，但没有找到公开资料。

---

## 11. 滤镜与调节：LUT 与颜色调整

### 11.1 官方能力 【官方/一手】（搜索摘要）

- 桌面端 Adjustment > LUT 可导入 **CUBE 或 3DL** 文件并调强度；有 HSL（搜索摘要称 "seven basic color channels"）和 Curves（luma/R/G/B）。（未能核实）
- 滤镜有强度参数。社区库中滤镜可以放在片段上，也可以放在独立的滤镜轨上，以 `FilterType` 加 intensity 的形式出现。调节类关键帧有 `KFTypeSaturation`、`KFTypeContrast`、`KFTypeBrightness`（§4.2）。

### 11.2 `.cube` 与其他 3D LUT 格式 【社区逆向/开源】

FFmpeg `vf_lut3d.c` 是最完整的开源解析参考：

- **.cube**（Iridas/Adobe）：读取 `LUT_3D_SIZE`、`DOMAIN_MIN/MAX`（默认 0/1，据此求每通道缩放 `1/(max−min)`），跳过 `TITLE`。**数据中 R 变化最快**：解析循环为 `for k { for j { for i { lut[i*size2 + j*size + k] } } }`。FFmpeg 内部 LUT 按 `lut[r*size2 + g*size + b]` 索引（见 `interp_nearest`），所以最内层的 **i 是 r**、j 是 g、最外层的 **k 是 b**。
- **.3dl**：固定 17×17×17，整数值除以 4096。
- **.dat**：可选 `3DLUTSIZE`（默认 33），**B 变化最快**。
- 另外支持 .m3d、.csp（CineSpace，可带 1D 预 LUT）。
- 插值方式有 nearest、trilinear、**tetrahedral（默认）**、pyramid、prism。
- **Hald CLUT**：边长必须为 `n³`，内部 LUT 尺寸为 `n²`。例如 512×512 → n=8 → 64³。

### 11.3 2D 平铺 LUT（64³ 放进 512×512 PNG）【社区逆向/开源】

GPUImage 的 `GPUImageLookupFilter` 头文件说明：查找图"organised as 8x8 quads of 64x64 pixels representing all possible RGB colors"。制作方法是在修图软件里对原始 `lookup.png` 套用调色，并且要求"each pixel color must not depend on other pixels"（所以模糊、锐化这类邻域操作不能做成 LUT）。shader 思路：

- 把 B 通道放大到 0–63，取 floor 和 ceil 两个切片，各自定位到 8×8 网格中的一个 64×64 tile。
- 在 tile 内用 R、G 做硬件双线性采样（加半像素偏移）。
- 两次采样结果按 `fract(B)` 混合，等价于三线性插值。最后按 `intensity` 与原色混合。

笔者按同样思路重写的 GLSL：

```glsl
uniform sampler2D uTex;     // 片段画面（预乘）
uniform sampler2D uLut;     // 512x512，8x8 个 64x64 tile；tile 内 x=R、y=G；tile 序号 = B
uniform float uIntensity;   // 滤镜强度
varying vec2 vUV;
vec3 lut512(vec3 c) {
    float b  = c.b * 63.0;
    float b0 = floor(b);
    float b1 = min(b0 + 1.0, 63.0);
    vec2 tile0 = vec2(mod(b0, 8.0), floor(b0 / 8.0));
    vec2 tile1 = vec2(mod(b1, 8.0), floor(b1 / 8.0));
    vec2 inTile = (c.rg * 63.0 + 0.5) / 512.0;            // 采样落在像素中心
    vec3 s0 = texture2D(uLut, tile0 * 0.125 + inTile).rgb; // 0.125 = 64/512
    vec3 s1 = texture2D(uLut, tile1 * 0.125 + inTile).rgb;
    return mix(s0, s1, b - b0);                            // B 方向线性 → 整体三线性
}
void main() {
    vec4 src = texture2D(uTex, vUV);
    vec3 rgb = src.a > 0.0 ? src.rgb / src.a : vec3(0.0);  // LUT 作用于非预乘颜色
    rgb = mix(rgb, lut512(clamp(rgb, 0.0, 1.0)), uIntensity);
    gl_FragColor = vec4(rgb * src.a, src.a);
}
```

### 11.4 3D 纹理与四面体插值 【社区逆向/开源】+【推断/业界通用】

- **GLES 3.0 / Metal / Vulkan 都支持 3D 纹理**。.cube 是 R 最快的顺序，可以直接按 `width=N(R), height=N(G), depth=N(B)` 上传。采样坐标为 `(c·(N−1) + 0.5)/N`，由硬件完成三线性插值，一次采样就够。
- **四面体插值**更准，不容易出现三线性那种"沿对角线发灰"的偏色，FFmpeg 默认采用它。它根据小数部分 `d.r, d.g, d.b` 的大小关系选出 6 个四面体之一。例如 `d.r > d.g > d.b` 时：
  `c = (1−d.r)·c000 + (d.r−d.g)·c100 + (d.g−d.b)·c110 + d.b·c111`
  只需 4 个格点，但硬件不支持，需要在 shader 里手动取 4 次 `texelFetch`。高质量导出可以用四面体，实时预览用硬件三线性。这是一种常见取舍，剪映的选择未能确认。
- **精度**：移动端 `mediump` 只有约 10 位尾数，用 `c.b * 63.0` 计算 tile 序号时可能落错切片，产生色带。LUT 相关计算应使用 `highp`。GPUImage 在 iOS 上就显式使用了 `highp`/`lowp` 精度修饰。

### 11.5 "调节"面板的 GPU 实现 【推断/业界通用】

| 调节项 | 常见实现 |
|---|---|
| 亮度/曝光 | `rgb * 2^ev`（线性光）或 `rgb + k`（伽马空间） |
| 对比度 | `(rgb − 0.5)·k + 0.5`，或基于中灰的 S 曲线 |
| 饱和度 | `mix(vec3(luma), rgb, s)`（与 OBS 去溢色用的是同一种 lerp） |
| 色温/色调 | 在 LMS 或简化的 RGB 增益上做白平衡 |
| HSL | 转到 HSL/HSV，对每个色相通道算权重（相邻通道之间平滑过渡），调 H/S/L 后转回 |
| 曲线 | 把 4 条曲线（luma/R/G/B）烘焙成 256×1（或 1024×1）的 1D LUT 纹理，shader 里 4 次采样 |
| 多个调节合并 | 把所有逐像素、与邻域无关的调节**预烘焙进一张 3D LUT**，每帧一次查表；只在参数变化或关键帧变化时重新烘焙 |

最后一行是性能关键：调节项一多，逐项执行 shader 会让片元开销线性增长，而合并成一张 33³ 或 64³ 的 LUT 后，开销是常数。剪映是否这样做未能确认，但与它支持 LUT 导入的能力在架构上是自洽的。

---

## 12. 画布与背景模糊

### 12.1 官方与社区线索 【官方/一手】（搜索摘要，官方部分未能核实）+【社区逆向/开源】（已核实）

- 官方：Canvas 可选 Blur / Color / Pattern，移动端 Blur 有 4 档。
- 社区 `video_segment.py`：`add_background_filling` 产生 `"type": "canvas_blur"` 或 `"canvas_color"`，模糊值**四档预设**为 0.0625、0.375、0.75、1.0，并且**只对主轨（最底层视频轨）片段生效**。

### 12.2 实现 【推断/业界通用】+【社区逆向/开源】

```
画布 W×H（例如 1080×1920）       素材 w×h（例如 1920×1080，横屏放进竖屏）
┌──────────────┐
│░░░ 背景层 ░░░│  ← 同一帧按 cover 方式铺满画布 → 降采样 → 高斯模糊
│░░┌────────┐░░│
│░░│ 前景层 │░░│  ← 同一帧按 fit 方式居中（再叠加用户的 transform/关键帧）
│░░└────────┘░░│
│░░░░░░░░░░░░░░│
└──────────────┘
```

1. **背景**：按 `scale = max(W/w, H/h)` 铺满画布，先降采样到 1/4–1/8，再做**可分离高斯**（先水平后垂直），最后放大回画布。降采样本身就能等效放大模糊半径，同时大幅降低开销。
2. GPUImage 的 `GPUImageGaussianBlurFilter` 注明使用了 "Interpolated optimization based on Daniel Rákos' work"，即**利用硬件双线性在两个 texel 之间取样，用一次采样得到两个高斯权重的加权和**，采样次数接近减半。参数 `blurRadiusInPixels` 用来调 σ。
3. 四档预设可以映射为不同的降采样倍率与 σ 组合。具体数值未能确认。
4. 更大模糊半径可以用 dual Kawase 一类"降采样金字塔 + 上采样"的方法，开销与半径基本无关（业界通用做法，本次未打开原始资料）。
5. **只对主轨生效**的原因（推断）：画布背景本质上是"最底层的填充"，主轨片段之间切换时背景跟着切换。画中画层在它之上，不需要背景。

---

## 13. 画中画（多轨叠加）

### 13.1 官方与社区线索 【官方/一手】（搜索摘要，官方部分未能核实）+【社区逆向/开源】（已核实）

- 官方：把素材放到上方新轨道即成为 overlay，可调位置、缩放、透明度和混合模式。
- 社区 `segment.py` 的 `ClipSettings` 字段：
  - `alpha`（0–1）
  - `flip.horizontal/vertical`
  - `rotation`（**度，顺时针**）
  - `scale.x/y`
  - `transform.x/y`（**以半个画布宽/高为单位**，0 为居中）。社区注释提到，剪映导入的字幕 `transform_y` 似乎为 −0.8。
- 对照 Android Media3 的 `StaticOverlaySettings` 【社区逆向/开源】：
  - `alphaScale`
  - `backgroundFrameAnchor` 与 `overlayFrameAnchor`（均限制在 −1..1）
  - `scale`
  - `rotationDegrees`（逆时针）
  - 这是同一类"锚点 + 缩放 + 旋转 + 透明度"的叠加模型。

### 13.2 变换矩阵 【推断/业界通用】

`transform` 以半画布为单位，恰好等于 NDC，所以平移可以直接写进 NDC 矩阵。**旋转必须在像素空间做**：NDC 的 x、y 单位长度不同（画布非正方形），直接在 NDC 旋转会把画面拉斜。

```text
// 笔者自写：把素材 quad（单位正方形 [-0.5,0.5]²）变换到画布 NDC
mat3 layerMatrix(Canvas W×H, Material w×h, ClipSettings cs):
    fit   = min(W / w, H / h)                         // 默认 fit 进画布（与 §12 前景层一致）
    S     = Scale(w * fit * cs.scale.x * (cs.flip.h ? -1 : 1),
                  h * fit * cs.scale.y * (cs.flip.v ? -1 : 1))   // 单位方块 → 像素尺寸
    R     = Rotate(-radians(cs.rotation))             // 顺时针为正（y 轴向上时取负）
    T     = Translate(cs.transform.x * W/2, cs.transform.y * H/2)   // 半画布单位 → 像素
    P2N   = Scale(2/W, 2/H)                           // 像素（以画布中心为原点）→ NDC
    return P2N * T * R * S
```

- 合成顺序：按轨道 z 序从下到上，逐层执行 `compositeBlend(canvas, layer, cs.alpha, mixMode)`（§7）。
- 关键帧（§4）每帧更新 `cs` 中的各分量；入场/出场动画（§9）在其上叠加相对变换。
- 素材本身带蒙版（§5）和抠图（§6）时，必须在**素材自身坐标系**里先处理完，再进行这里的变换。原因是蒙版坐标相对素材（§5.2）。

---

## 14. 把它们串起来：单片段效果链顺序与工程要点

### 14.1 推荐的片段内处理顺序 【推断/业界通用】

```
解码帧（YUV） ──► 色彩转换到 RGB（处理 BT.601/709、full/limited range）
   │
   ├─ ① 裁剪（crop）
   ├─ ② 色度抠图（YUV 域最佳，可与①②合并在 YUV→RGB 那一 pass 内）
   ├─ ③ 调节 + 滤镜（合并成一张 3D LUT，强度按 mix 处理）
   ├─ ④ 蒙版（素材坐标系，乘 alpha）
   ├─ ⑤ 片段特效（模糊/故障/光效等，资源包驱动 → 研究方向 a）
   ├─ ⑥ 变换（关键帧 ∘ 入出场动画）+ 混合模式 + 不透明度 → 合成到画布
   └─ （主轨）转场：对 A、B 各自走完 ①–⑤ 之后在画布空间混合
```

调整顺序会改变结果，几个典型例子：

- **先抠图后调色**：调色不会改变抠像的判据。反过来，先调色会让键色漂移，抠图失效。
- **先蒙版后变换**：蒙版跟着素材走（与社区数据"蒙版坐标相对素材"一致）。
- **LUT 作用于非预乘颜色**：不然抠出来的半透明边缘会被染色。

### 14.2 性能与质量清单 【推断/业界通用】

| 问题 | 对策 |
|---|---|
| 多 pass 带宽 | 纹理池复用；能合并的逐像素操作（YUV→RGB、抠图、LUT、蒙版）合并成一个 shader（uber-shader 或运行时拼接 shader） |
| 混合模式需要读底层 | 优先使用 framebuffer fetch；否则只拷贝上层包围盒区域 |
| 模糊类（画布、羽化、阴影） | 降采样 + 可分离 + 线性采样技巧；大半径用 Kawase 金字塔 |
| 文字缩放动画 | SDF/MSDF 图集；超大字号或粗描边回退到路径渲染 |
| 曲线变速的高倍速段 | 跳帧解码、代理文件；导出时精确求值 |
| 音频变速 | 分段常数速度 + 时间伸缩器（Sonic/WSOLA）；需要时可换频域算法（须留意 GPL 许可） |
| 移动端精度 | LUT、SDF 距离计算使用 `highp` |
| 颜色一致性 | 统一工作空间（sRGB 值空间或线性光），混合模式按 Photoshop 习惯在伽马空间计算 |

---

## 参考来源

> 标注说明：**[已打开]** 表示本次通过 WebFetch 直接读取了正文；**[搜索摘要]** 表示正文域名在本环境无法直接访问，内容来自 WebSearch 返回的摘要。

### 剪映 / CapCut / BytePlus 官方（均为 [搜索摘要]）

- https://www.capcut.cn/ （剪映官网：蒙版"线性、圆形、文字、钢笔"；关键帧"设置起点和终点"）
- https://www.capcut.cn/learning
- https://www.capcut.cn/adv_coop （品牌模板含花字）
- https://www.capcut.com/help/chroma-key-feature
- https://www.capcut.com/help/transitions-not-working
- https://www.capcut.com/help/transitions-in-capcut
- https://www.capcut.com/tools/mask-video-online
- https://www.capcut.com/tools/speed-ramp
- https://www.capcut.com/resource/how-to-do-velocity-on-capcut
- https://www.capcut.com/create/blend-modes-creative-video-photo-effects
- https://www.capcut.com/resource/overlay-video-on-video
- https://www.capcut.com/resource/how-to-add-keyframes-in-capcut
- https://www.capcut.com/tools/keyframe-animation
- https://www.capcut.com/create/animated-text-maker
- https://www.capcut.com/resource/how-to-make-videos-with-scrolling-text
- https://www.capcut.com/resource/create-curved-text
- https://www.capcut.com/explore/text-along-path-effect
- https://www.capcut.com/resource/how-to-blur-background-in-capcut
- https://www.capcut.com/resource/how-to-blur-a-video-on-iphone
- https://www.capcut.com/resource/luts-for-color-grading
- https://www.capcut.com/resource/optical-flow-in-capcut
- https://docs.byteplus.com/en/docs/video-editor-sdk/140-product-overview
- https://docs.byteplus.com/en/docs/byteplus-video-editor-sdk/docs-detailed-development-guide-ios-ve-sdk-v.4.0.2
- https://docs.byteplus.com/en/byteplus-video-editor-sdk/docs/video-editing-module-in-ios
- https://docs.byteplus.com/en/docs/byteplus-video-editor-sdk/docs-integration-guide-with-ui-android-v.4.0.2
- https://docs.byteplus.com/docs/video-editor-sdk/150-track-editor-feature
- https://docs.byteplus.com/en/docs/effects/docs-chroma-keying
- https://docs.byteplus.com/en/effects/docs/chroma-keying

### 社区逆向（剪映草稿）[已打开]

- https://github.com/GuanYixuan/pyJianYingDraft
- https://github.com/GuanYixuan/pyJianYingDraft/tree/main/pyJianYingDraft
- https://github.com/GuanYixuan/pyJianYingDraft/tree/main/pyJianYingDraft/metadata
- https://raw.githubusercontent.com/GuanYixuan/pyJianYingDraft/main/pyJianYingDraft/keyframe.py
- https://raw.githubusercontent.com/GuanYixuan/pyJianYingDraft/main/pyJianYingDraft/metadata/mask_meta.py
- https://raw.githubusercontent.com/GuanYixuan/pyJianYingDraft/main/pyJianYingDraft/metadata/mix_mode_meta.py
- https://raw.githubusercontent.com/GuanYixuan/pyJianYingDraft/main/pyJianYingDraft/metadata/transition_meta.py
- https://raw.githubusercontent.com/GuanYixuan/pyJianYingDraft/main/pyJianYingDraft/video_segment.py
- https://raw.githubusercontent.com/GuanYixuan/pyJianYingDraft/main/pyJianYingDraft/segment.py
- https://raw.githubusercontent.com/GuanYixuan/pyJianYingDraft/main/pyJianYingDraft/text_segment.py
- https://raw.githubusercontent.com/GuanYixuan/pyJianYingDraft/main/pyJianYingDraft/animation.py

### 文字渲染 [已打开]

- https://github.com/harfbuzz/harfbuzz
- https://raw.githubusercontent.com/harfbuzz/harfbuzz/main/README.md
- https://raw.githubusercontent.com/harfbuzz/harfbuzz/main/docs/usermanual-buffers-language-script-and-direction.xml
- https://raw.githubusercontent.com/harfbuzz/harfbuzz/main/src/hb-ot-shape.cc
- https://raw.githubusercontent.com/freetype/freetype/master/include/freetype/freetype.h
- https://github.com/Chlumsky/msdfgen
- https://github.com/mapbox/tiny-sdf
- https://github.com/google/skia/tree/main/modules/skottie/src/text
- https://raw.githubusercontent.com/google/skia/main/modules/skottie/src/text/RangeSelector.cpp
- https://raw.githubusercontent.com/google/skia/main/modules/skottie/src/text/TextAnimator.cpp

### 关键帧 / 缓动 [已打开]

- https://raw.githubusercontent.com/gre/bezier-easing/master/src/index.js
- https://raw.githubusercontent.com/airbnb/lottie-android/master/lottie/src/main/java/com/airbnb/lottie/value/Keyframe.java
- https://raw.githubusercontent.com/airbnb/lottie-android/master/lottie/src/main/java/com/airbnb/lottie/animation/keyframe/BaseKeyframeAnimation.java
- https://raw.githubusercontent.com/airbnb/lottie-android/master/lottie/src/main/java/com/airbnb/lottie/parser/KeyframeParser.java

### 蒙版 / 抠图 [已打开]

- https://github.com/dyne/frei0r/tree/master/src/filter/alpha0ps
- https://raw.githubusercontent.com/dyne/frei0r/master/src/filter/alpha0ps/alpha0ps_alphaspot.c
- https://github.com/obsproject/obs-studio/tree/master/plugins/obs-filters/data
- https://raw.githubusercontent.com/obsproject/obs-studio/master/plugins/obs-filters/data/chroma_key_filter_v2.effect
- https://raw.githubusercontent.com/obsproject/obs-studio/master/plugins/obs-filters/data/mask_alpha_filter.effect
- https://raw.githubusercontent.com/FFmpeg/FFmpeg/master/libavfilter/vf_chromakey.c
- https://raw.githubusercontent.com/FFmpeg/FFmpeg/master/libavfilter/vf_despill.c
- https://raw.githubusercontent.com/BradLarson/GPUImage/master/framework/Source/GPUImageChromaKeyFilter.m

### 混合模式 [已打开]

- https://github.com/w3c/fxtf-drafts/tree/main/compositing-1 （说明规范已迁移到 CSSWG 仓库）
- https://raw.githubusercontent.com/w3c/csswg-drafts/main/compositing-1/Overview.bs
- https://github.com/jamieowen/glsl-blend
- https://raw.githubusercontent.com/jamieowen/glsl-blend/master/linear-burn.glsl
- https://raw.githubusercontent.com/jamieowen/glsl-blend/master/soft-light.glsl

### 转场 [已打开]

- https://github.com/gl-transitions/gl-transitions
- https://raw.githubusercontent.com/gl-transitions/gl-transitions/master/transitions/fade.glsl
- https://raw.githubusercontent.com/gl-transitions/gl-transitions/master/transitions/directionalwipe.glsl
- https://raw.githubusercontent.com/gl-transitions/gl-transitions/master/transitions/luma.glsl

### 变速 / 音频时间伸缩 [已打开]

- https://raw.githubusercontent.com/mltframework/mlt/master/src/modules/core/link_timeremap.c
- https://github.com/mltframework/mlt/tree/master/src/modules/rubberband
- https://raw.githubusercontent.com/mltframework/mlt/master/src/modules/rubberband/filter_rbpitch.yml
- https://raw.githubusercontent.com/androidx/media/release/libraries/common/src/main/java/androidx/media3/common/audio/SpeedProvider.java
- https://raw.githubusercontent.com/androidx/media/release/libraries/common/src/main/java/androidx/media3/common/audio/SpeedChangingAudioProcessor.java
- https://raw.githubusercontent.com/androidx/media/release/libraries/common/src/main/java/androidx/media3/common/audio/Sonic.java
- https://github.com/waywardgeek/sonic
- https://github.com/breakfastquay/rubberband
- https://raw.githubusercontent.com/mozilla/gecko-dev/master/media/libsoundtouch/src/TDStretch.h

### LUT / 模糊 / 叠加 [已打开]

- https://raw.githubusercontent.com/FFmpeg/FFmpeg/master/libavfilter/vf_lut3d.c
- https://raw.githubusercontent.com/BradLarson/GPUImage/master/framework/Source/GPUImageLookupFilter.m
- https://raw.githubusercontent.com/BradLarson/GPUImage/master/framework/Source/GPUImageLookupFilter.h
- https://raw.githubusercontent.com/BradLarson/GPUImage/master/framework/Source/GPUImageGaussianBlurFilter.h
- https://raw.githubusercontent.com/androidx/media/release/libraries/effect/src/main/java/androidx/media3/effect/StaticOverlaySettings.java

### 火山引擎官方 SDK 头文件 / 第三方集成示例（核查时新增）[已打开]

- https://raw.githubusercontent.com/volcengine/VolcEngineRTC/30a9b7352a258368238f407052ce656d7b331035/iOS/script/Depends/BytedEffectSDK/effect-sdk.framework/Headers/bef_effect_ai_chroma_keying.h （火山引擎官方 GitHub 组织仓库附带的 Effect SDK 色度抠图头文件；【官方/一手】）
- https://github.com/hifiveai/openmusic-short-video-ios-example （第三方集成示例，内含 VE SDK 的 NLEEditor 代码，`[videoSegment setKeepTone:]`；只用作佐证，不作一手来源）
- https://github.com/hifiveai/openmusic-short-video-android-example （第三方集成示例，`ResourceHelper.getCurveSpeedList()` 读取 `curve_speed.bundle`；只用作佐证）
- https://raw.githubusercontent.com/GuanYixuan/pyJianYingDraft/main/README.md （"目前暂不支持设置曲线变速"）

### 其他（第三方，低可信，仅作背景）[搜索摘要]（未能核实）

- https://eu.36kr.com/zh/p/3973184358855170 （提到剪映"轻量化代理文件生成、多轨资源动态加载"，属于媒体报道；未能核实）
- https://www.18183.com/down/3950443.html （第三方转载的剪映更新日志：【智能补帧】上线；未能核实）

---

## 未能确认 / 待补充

1. **官方页面正文未能直接打开**：capcut.com、capcut.cn、docs.byteplus.com、volcengine.com 在本环境 DNS 解析失败。本章所有【官方/一手】内容都来自搜索摘要，参数名（如 Strength/Shadow/Edge feathering、Montage/Bullet/Jump Cut/Hero、0.1x–10x、HSL "seven" channels）需要人工打开原页面复核。
2. **没有找到第一方技术分享**：字节跳动技术团队、火山引擎开发者社区、InfoQ/QCon/GMTC/LiveVideoStack 都没有搜到剪映在文字渲染、关键帧、蒙版、抠图、混合、转场、变速方面的公开技术文章。juejin.cn、infoq.cn 在本环境无法访问，可能有遗漏，建议有网络条件时再检索一次。
3. **文字引擎选型**：剪映是否使用 HarfBuzz/FreeType/Skia，是否使用 SDF/MSDF，均无公开证据（也没有找到相关招聘 JD 原文）。可以通过 App 内"开源许可/第三方声明"页面核实（查看许可页面不涉及反编译）。
4. **竖排规则**：`typesetting=1` 下拉丁字母、数字、标点的处理方式（旋转还是纵中横）未能确认。
5. **关键帧曲线类型**：草稿中 `curveType` 除 `"Line"` 外有哪些取值，`left_control/right_control` 的坐标语义（是否为归一化的 CSS cubic-bezier 形式），以及关键帧挂在时间线时间还是素材时间上，均未能确认。
6. **蒙版羽化方向与形状实现**：羽化是向内、向外还是双向；爱心/星形是解析 SDF 还是资源纹理；`expansion` 字段含义，均未能确认。
7. **色度抠图的 Shadow、`spill_value`（UI 名"边缘清晰"）与 `should_transfer_color` 语义**：§6.4 中"阴影保留"和"按去溢色实现 spill"都是推测实现；色彩空间（YUV/HSV/CbCr）与距离度量也未能确认。火山引擎 Effect SDK 的 `similar/smoothness/correction` 与草稿字段之间是否一一对应，同样未能确认。
8. **柔光公式变体与混合色彩空间**：剪映采用 W3C/Photoshop 分段版还是其他变体，是在伽马空间还是线性空间混合，未能确认。
9. **非重叠转场（`is_overlap=false`）的取帧规则**未能确认。
10. **曲线变速**：曲线横轴代表输出时间还是素材时间；控制点之间用线性还是样条插值；`curve_speed` 在草稿中的具体结构均未能确认。社区库 README 写明"目前暂不支持设置曲线变速"，`segment.py` 中只导出 `"curve_speed": None`。"新版草稿已加密"一说未能核实：pyJianYingDraft 当前 README 没有提到加密，并且把多数功能标为在新版剪映 10.8 上可用。无论是否加密，本研究按规则都不做解密。"DC 分量 × 归一化形状"只是对 BytePlus 文档措辞的推断。
11. **音频变速不变调算法**：剪映使用 WSOLA、PSOLA/Sonic、相位声码器还是自研算法，未能确认；曲线变速时音频是否保持音调也未能确认。
12. **补帧模型**：Smooth slow-mo / 光流补帧所用的模型未能确认（网上有"RIFE"说法，来源不可靠，未采信）。
13. **画布模糊四档预设与 σ 的对应关系**、HSL 的通道数、调节项是否合并为 3D LUT，均未能确认。
14. **未打开但提及的业界资料**：Valve 的 SDF 论文、Inigo Quilez 的 SDF 函数集、Dual Kawase（ARM SIGGRAPH 2015）、Unicode UAX #50、Adobe Cube LUT 规范、Daniel Rákos 的线性采样高斯文章（仅通过 GPUImage 注释间接引用）。本章用到的相关公式均为笔者自行推导或来自上面已打开的源码。

---

## 核查记录

> 核查日期：2026-10-15。核查方式：直接下载并阅读引用的 GitHub 原始文件，再用 GitHub 公开代码搜索独立找旁证。核查环境中 capcut.com、capcut.cn、docs.byteplus.com 仍然 DNS 解析失败（WebFetch 报 `getaddrinfo ENOTFOUND`，curl 无响应）。WebSearch 在核查开始时配额已经用尽，所以**所有只出自 CapCut/剪映/BytePlus 官方页面搜索摘要的说法都无法独立核实**，一律标为"（未能核实）"。如需继续核实，可在网络条件允许时重新检索。本次没有访问任何 CapCut/字节跳动生产接口，也没有采用反编译代码作为证据（GitHub 搜索命中了若干反编译的 App 源码仓库，均已刻意排除）。

**已核实（与原文一致，未改动）**

1. pyJianYingDraft `keyframe.py`：`KeyframeProperty` 的 11 个取值、关键帧 JSON 字段（`curveType: "Line"`、`left_control/right_control`、`time_offset`、`values`）、"目前只支持线性插值"的注释，均一致。
2. pyJianYingDraft `mask_meta.py`：6 种蒙版、`resource_type`（line/mirror/circle/rectangle/geometric_shape）、宽高比 1.115/1.05，一致。
3. pyJianYingDraft `mix_mode_meta.py`：10 种混合模式，一致。
4. pyJianYingDraft `text_segment.py`：`check_flag` 基值 7，描边 |8、背景 |16、阴影 |32，注释提到发光 +64；`typesetting`、`line_max_width`（默认 0.82，占屏宽比例）、`text_shape`/`text_effect`、`render_type: "solid"`，均一致。
5. pyJianYingDraft `video_segment.py`：画布模糊四档 0.0625/0.375/0.75/1.0，且"仅对底层视频轨道上的片段生效"；抠图 `type: chroma`、`version: v2` 及各字段，一致。
6. pyJianYingDraft `animation.py`：in/out/group/loop、`sticker_animation`、微秒单位、group 互斥规则，一致。
7. HarfBuzz README："the `ffmpeg` of text shaping"、不实现 hinting（"use FreeType or Skrifa"）、实验性 `libharfbuzz-gpu`（Slug 算法；GLSL/WGSL/MSL/HLSL）与 `libharfbuzz-raster`（including color fonts），一致；`hb-ot-shape.cc` 中 `vert`（F_GLOBAL_SEARCH）、kern/vkrn 切换、`calt/liga` 只属于水平特性，一致。
8. FreeType `freetype.h`：BGRA 预乘彩色位图、"There is no rendering support for 'COLR' v1"，一致。
9. gre/bezier-easing `src/index.js`：当前版本确实是 Dmitry Baranovskiy 的代数解法（Cardano + 三角解，`v³ − 3m·v + 2h = 0`），x 越界时抛异常，一致。
10. lottie-android `KeyframeParser`/`BaseKeyframeAnimation`：`MAX_CP_VALUE = 100`、"hangs" 注释、`SparseArrayCompat<WeakReference<Interpolator>>`、`h == 1` 表示 hold、`containsProgress` 缓存加从尾部向前扫描，一致。
11. Skia Skottie `RangeSelector.cpp`/`TextAnimator.cpp`：6 种形状、4 种 domain、`kSeed = 42` + `std::mt19937`、`SkTPin` 截断累加、`(0.5f - r0) / len`、加法/乘法/lerp 的调制方式，一致。
12. FFmpeg `vf_chromakey.c`（默认 similarity 0.01、blend 0、color black，3×3 平均）、`vf_despill.c`（spillmap 公式、green 默认 −1、mix 默认 0.5）、`vf_lut3d.c`（tetrahedral 为默认插值；.3dl 固定 17³、除以 16³=4096；.dat 默认 33、B 最快；Hald 边长 = level³），一致。
13. OBS `chroma_key_filter_v2.effect`（sRGB 编码、偏移 0.501961、4 个偏置邻点 ×2 再加中心、/9、`pow(...,1.5)`、lerp 到亮度去溢色）和 `mask_alpha_filter.effect`（反预乘 → `rgba.a *= targetRGB.a` → 再预乘），一致。
14. GPUImage：ChromaKey 系数 0.2989/0.5866/0.1145、0.7132、0.5647，默认 threshold 0.4、smoothing 0.1；Lookup 头文件 "8x8 quads of 64x64 pixels" 和 "must not depend on other pixels"；GaussianBlur 头文件引用 Daniel Rákos 的线性采样优化，一致。
15. MLT `link_timeremap.c`：`speed_map` 逐帧积分、`time_map`、`MAX_BLEND_IMAGES 10` 等权平均、速度 <0.1 或 >10 输出静音、`pitch` 时调用 `rbpitch`、`mlt_audio_reverse`，一致。
16. Media3：`SpeedProvider.getSpeed/getNextSpeedChangeTimeUs`、`SpeedChangingAudioProcessor` 中 `shouldMaintainPitch` 为 false 时 `setPitch(newSpeed)`、变速时 flush Sonic、`getSpeedAdjustedTimeAsync`/`getMediaDurationUs`；`Sonic.java` 注明 "Based on https://github.com/waywardgeek/sonic"，并使用 AMDF，一致。
17. Sonic README（针对 2X 以上加速优化，Apache 2.0）、SoundTouch `TDStretch.h`（"time domain WSOLA-like method"，`DEFAULT_OVERLAP_MS 8`，sequence/seekwindow 默认自动）、Rubber Band README（R2 Faster / R3 Finer，GPL，App Store 分发需商业许可），一致。
18. W3C Compositing（csswg-drafts `compositing-1/Overview.bs`）：source-over、`Cs = (1 − αb)·Cs + αb·B(Cb,Cs)`、soft-light 及 D(Cb)、color-dodge/burn 公式，一致（规范本身也在 1184–1185 行给出了 §7.2 的展开式）；glsl-blend soft-light/linear-burn 公式一致。
19. msdfgen README（"almost perfectly"、三行 shader、按线性空间读取）、tiny-sdf README（Felzenszwalb/Huttenlocher、buffer/radius/cutoff、示例字"泽"）、frei0r alphaspot（`hypotf(d1*is1,d2*is2)`，注释 `//neenakomeren rob!!!` 即斯洛文尼亚语"不均匀的边缘"），一致。
20. 参考来源中的 raw.githubusercontent.com 链接全部返回 200；github.com 网页链接在本环境返回 403（代理限制），但对应仓库的原始文件都能读取，没有发现不存在的链接。

**已更正**

1. §1.2 / §6.1 / §6.4：`BEF_AI_CHROMA_KEYING_SMOOTH` 推荐值 0 **不是关闭时域平滑**。根据火山引擎官方仓库的头文件，0 表示"仅启用 mask 时序平滑，估色无时序平滑"，<0 才是无平滑。原文"推荐值为 0 → 时域平滑会拖影、默认关闭更稳妥"的推断与官方头文件矛盾，已改写。同时补充了 SDK 的 `correction`（去绿强度）、`clip_black/clip_white`、`CAL_COLOR` 参数。
2. §6.2：`spill_value` 在社区库中的 UI 名是"边缘清晰（会员功能）"，不是"去溢色强度"；`edge_smooth_value` 是"边缘羽化（会员功能）"。表格和 §6.4 shader 注释已相应修改。
3. §8.1：转场数量由"约 420（免费约 130、付费约 290）"更正为当前 main 分支的 453 个（免费 130、付费 323）。
4. §11.2：FFmpeg `.cube` 解析中的循环变量对应关系写反了，已更正为 i=r（最内层）、j=g、k=b。
5. §3.6：FreeType 2.12 起只是能**取出** SVG 文档，自身不渲染 SVG，需要外部渲染器钩子。已补充这一限定。
6. §3.7：`FT_HAS_VERTICAL` 为假时，FreeType 会自行合成竖排度量，只是合成值在不同格式之间不一致，并非"需要自己合成"。已改写。
7. §5.2：`expansion` 只出现在新版 `materials.common_mask` 条目中，不是通用的 `config` 字段。已补充说明。
8. §9.1：文字 loop 的约束改为"已有 loop 后不能再加其他动画，须先加 in/out 再加 loop"，并引用错误提示原文。
9. §8.2：`directionalwipe.glsl` 的公式补上了 `1.0 −`。
10. §10.2：`filter_rbpitch.yml` 的引文改为原文 "Rubberband library"，并注明 GPLv2。
11. 未能确认 #10："新版草稿已加密"改为未能核实（pyJianYingDraft 当前 README 未提及加密，且标注支持剪映 10.8）。

**标为"（未能核实）"或降级**

- §1.1 整表（只有蒙版种类和"一片段一蒙版"有社区佐证）、§4.1、§5.1、§12.1 与 §13.1 的官方部分、§6.1 CapCut 部分、§10.1 曲线变速预设与 0.1x–10x、Optical flow、7.5.1 智能补帧、§11.1 HSL "seven channels"、BytePlus 的 "DC component" 原文、"various blend modes"、`chroma.bundle`、`soft_process` 的 V4.5.0 与"弱去绿"语义、"官方建议一般只调 similarity"、§5.4 BytePlus"同一时间段参数一致"，以及 36 氪、18183 两条第三方来源。
- `setKeepTone` 与 `curve_speed.bundle`：BytePlus 原文仍未核实，但已在公开的第三方集成示例代码中找到旁证（证据等级相当于【社区逆向/开源】的旁证，不算一手）。

**未删除任何条目**：本次没有发现可以判定为捏造、或被一手来源直接否定的条目（被头文件否定的只是 §6.4 的一条推断，已改写）。

**本次未完成**

- 没能用 WebSearch 或直接访问来核实任何 capcut.com / capcut.cn / docs.byteplus.com 页面正文：配额已耗尽，域名也不可达。
- §3.3–§3.5、§5.3、§6.4、§7.2、§10.2 的笔者自写代码与推导，只做了公式层面的通读，没有编译或运行验证。
- Skottie RangeSelector 的 "Percentage 或 Index" 单位、frei0r 是否为 Kdenlive/Shotcut 常用，没有逐行核对。
