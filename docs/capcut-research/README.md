# CapCut / 剪映 架构调研（学习用途）

> 汇总 7 章调研笔记。每章都经过一轮独立核查。未完成事项见 [`STATUS.md`](STATUS.md)。
>
> **来源与边界**
> - 只用公开资料：火山引擎 / BytePlus 官方 SDK 与官方 GitHub、TikTok Effect House、字节技术文章、论文、社区开源项目（pyJianYingDraft、CapCutAPI 等）。
> - 没有反编译 CapCut，没有抓包，没有请求 CapCut 线上服务，后端不在范围内。
> - 本环境只能直连 GitHub。capcut.com、volcengine.com、byteplus.com、掘金、arXiv 等站点的内容只来自搜索摘要，各章标为“未能核实”或“搜索摘要”。
>
> **可信度标记**
> - **【官方】**：字节、火山引擎或 BytePlus 的官方代码或文档。
> - **【社区】**：第三方开源项目或第三方观察。
> - **【推断】**：根据资料推断，或业界通用做法。

## 0. 先看这一条：整份调研的地基有多牢

全文的核心前提是：**CapCut/剪映 = 字节对外售卖的 VE SDK（剪辑）+ NLE SDK（数据模型）+ Effect SDK（特效）同一套技术**。依据有两条：

1. BytePlus 产品概览页说 VE SDK 用于 TikTok、抖音、CapCut 等自家产品。这条只读到搜索摘要。
2. 一个第三方 Demo 依赖的 SDK 版本号带有 `-lv` 后缀（`vesdk:9.1.2.75-lv`），而 `com.lemon.lv` 是剪映的包名。“lv 是剪映的内部代号”是推断。

所以：

- 从 **对外 SDK（tob 版 aar、头文件）** 看到的类名和结构，最多算“同源 SDK”的证据。
- **不能当作剪映 App 本体的实现细节。** 下文凡是“剪映内部如何如何”，都应理解为“同源 SDK 推断”。

## 1. 总体分层

```
┌──────────────────────────────────────────────────────────────────────┐
│ UI 层                                                                  │
│  移动端：Android / iOS 原生（iOS 一手资料几乎没有）                     │
│  桌面端：疑为 Qt 6 QML【社区，未能核实】                                │
│  Web 端：C++ 引擎编译成 WASM，加 WebCodecs【官方案例，搜索摘要】         │
├──────────────────────────────────────────────────────────────────────┤
│ 编辑数据模型 NLE【官方 SDK 类名】                                       │
│  C++ 实现，命名空间 cut::model                                          │
│  层级：Model → Track → Slot → Segment → Resource，时间单位 µs           │
│  撤销/重做类似 git：commit() 只推预览；done(msg) 生成历史；undo 移动 head │
│  草稿 = 模型序列化成 JSON（draft_content.json / draft_info.json）       │
├──────────────────────────────────────────────────────────────────────┤
│ NLE2VEEditor：对模型改动做 diff（ADD/UPDATE/DELETE），翻译成 VEEditor 调用│
├──────────────────────────────────────────────────────────────────────┤
│ 剪辑引擎 VE（libttvesdk）：数据流图                                    │
│  TEPreviewGraph / TECompileGraph / TEParallelCompiler / TEGetFrameGraph│
│  图由解码、混合、转场、显示、编码等处理单元组成                        │
├───────────────────┬──────────────────────┬───────────────────────────┤
│ 特效 Effect SDK    │ 编解码                │ 音频 libaudioeffect        │
│  bef_effect_ai_*   │  libttffmpeg          │  变调变速、降噪、变声       │
│  Amazing 引擎      │  （FFmpeg 3.3.2 分支） │  SAMI / MAMMON             │
│  内部模块：         │  ByteVC1              │                           │
│  SMASH（算法）      │  MediaCodec /         │                           │
│  ESPRESSO（推理）   │  VideoToolbox         │                           │
│  MOBILECV（图像库） │                       │                           │
├───────────────────┴──────────────────────┴───────────────────────────┤
│ 端上推理：ByteNN 与 Espresso 的关系无一手资料                           │
│ 模型有 CPU / GPU / OpenCL / CoreML / NPU 等版本                        │
│ 图形：AGFX（OpenGL / GLES / Vulkan）+ Metal                            │
└──────────────────────────────────────────────────────────────────────┘
```

## 2. 剪辑引擎、草稿、模板、导出 → [`research_nle.md`](research_nle.md)

### 2.1 草稿 JSON【社区：pyJianYingDraft、CapCutAPI】

- **顶层 key**：28～32 个。
- **轨道**：`tracks[]` 分 video / audio / text / effect / filter / sticker / adjust 七类。
- **片段**：`segments[]` 的主要字段：
  - `target_timerange`：片段在时间线上的位置（µs）；
  - `source_timerange`：取素材的哪一段（µs）；
  - `clip`：透明度、翻转、旋转、缩放、位移；
  - `speed`：变速；
  - `extra_material_refs`：引用的附加素材（特效、动画、转场等）；
  - `common_keyframes`：关键帧。
- **素材**：`materials{}` 下有 45～54 个分类数组。
- **资源引用**：特效、转场、蒙版、动画都通过 `resource_id` / `effect_id` / md5 引用云端素材库，打开草稿时按需下载。
- **多时间线**：新版改为多时间线目录 `Timelines/<id>/`。
- **加密**：剪映 6.0+ 的草稿加密，CapCut 国际版不加密。本调研不涉及加密细节。

### 2.2 模板（剪同款）【官方类名 + 推断】

- 模板 = 锁定的草稿 + 可替换的占位片段（`is_placeholder`、`template_id` 等字段）。
- SDK 中由 CutSame / CutSameConsumer 把模板转换成 NLE 模型。

### 2.3 导出【官方 SDK 参数】

- 编码：H264 / ByteVC1 / MPEG4。
- 码控：CRF / QP / ABR / VBR，按分辨率档位设码率系数。
- 可选软编或硬编；支持不重编码的 remux。
- 支持边导出边上传。

### 2.4 桌面端优化【社区】

- 720p / 540p 代理剪辑（`draft_agency_config.json`）。
- 片段预渲染（`performance_opt_info.json`）。

### 2.5 Web 端【官方案例，搜索摘要】

- WASM SIMD 带来约 300% 的提升。
- WebCodecs 负责硬件编解码。

## 3. 特效 SDK、资源包、人脸关键点 → [`research_effects.md`](research_effects.md)

### 3.1 调用流程【官方：`volcengine/VolcEngineRTC` 仓库中的完整头文件】

```
初始化（必须在 GL 线程）:
  bef_effect_ai_create → check_license → set_render_api(gles20/30)
  → init(w, h, modelDir) → composer_set_mode → composer_set_nodes
调参:
  composer_update_node(nodePath, key, 0..1)
每帧（纹理进、纹理出）:
  set_width_height → set_orientation
  → algorithm_texture（跑人脸等算法） → process_texture(src, dst)（渲染特效）
```

### 3.2 资源包【官方：Demo 仓库】

- `LicenseBag`：授权文件。
- `ModelResource`：模型，如 `tt_face_v11.1.model`。
- `ComposeMakeup`：美颜、美型、美妆的组合特效包。
- `FilterResource`：滤镜，格式是 512×512 的 64³ LUT 图。
- `StickerResource`：贴纸。
- 包内的 config、Lua、shader 都是加密的。

### 3.3 组合特效节点（composer）

- 一个特效包对应一个节点，节点里的每个 key 是一个可调强度，取值 0～1。
- 双向滑杆（可以变大也可以变小）以 0.5 为中性。
- key 示例：
  - 美颜：`smooth`、`whiten`、`sharp`、`clear`；
  - 美型：`Internal_Deform_Overall`、`Internal_Deform_Eye` 等十余个；
  - 美妆：`Internal_Makeup_Lips` 等。

### 3.4 人脸关键点【官方：头文件】

- **点位**：106 点基础模型，再加二级精细点：眼 22×2、眉 13×2、唇 64、虹膜 20×2，合计 280 点。
- **每张脸的输出**：每个点的可见性、yaw/pitch/roll 姿态角、跟踪 ID，以及嘴、牙齿、面部 mask。
- **检测与跟踪交替**：有人脸时每 24 帧做一次全图检测，没有人脸时每 8 帧一次，其余帧只做跟踪。
- **去抖**：base 和 extra 两级分开设参数，范围都是 1～30。
- **人脸数**：默认 5 张，上限 10 张。
- **3D 拟合**：输出带 UV 的网格，以及 solvePnP 风格的旋转/平移向量（rvec/tvec）。

### 3.5 特效运行时【官方：Effect House】

- 与 TikTok 共用 Amazing 引擎。
- 场景采用实体-组件（ECS）结构，用 TypeScript（APJS）写脚本。
- 同一个特效会带多套 shader：GLES / Metal / Vulkan / HLSL。
- Face Reshape 改用“V8 形变引擎”，以减少背景扭曲；SDK 中对应的包名是 `reshape_v8_lite`。

## 4. 人脸、美颜、美型算法 → [`research_face.md`](research_face.md)

### 4.1 字节一手资料能给到的程度

- 只有接口和参数，见上面 3.4。
- 字节实际用的磨皮滤波器、美型的形变方式（网格 / MLS / 逐像素），**都没有一手证据**。

### 4.2 开源对照：GPUPixel 源码逐行分析【社区】

- **磨皮**：本质是“简化自引导滤波”：`a = var/(var+θ)`，再乘红通道肤色门控，最后 `mix(I, mean, a)`，后接 3×3 锐化。
  - 这不是“把高反差叠加回去”的经典高反差磨皮。research_oss.md 的写法不准确，以本章为准。
- **瘦脸**：基于 106 点，做线性衰减的局部平移。
- **大眼**：局部缩放。
- **美白**：曲线加 LUT。
- **美妆**：关键点三角网格，把标准脸坐标映射到素材纹理，再用 multiply / overlay / hardlight 混合。

### 4.3 通用算法【推断】

- **检测与跟踪**：BlazeFace / RetinaFace / SCRFD 做检测；MediaPipe 的闭环是跟踪人脸不足时才重新检测。
- **点位方案**：对比了 68 / 98 / 106 / 478 点。
- **去抖**：One Euro 滤波、Kalman 滤波。
- **姿态**：加权 Procrustes 区分头部姿态和表情。
- **3D 人脸**：3DMM / FLAME。
- **形变**：Gustafsson 局部缩放和平移、MLS、三角网格形变、液化。
- **磨皮**：双边滤波、导向滤波，加 YCbCr 肤色区间。
- 附原创 GLSL：大眼/瘦脸形变、低分辨率导向滤波磨皮、LUT 采样。

## 5. 文字、关键帧、蒙版、抠图、混合、转场、变速 → [`research_render.md`](research_render.md)

### 5.1 草稿里能看到什么【社区：pyJianYingDraft】

- **关键帧**：按属性分轨，位置 X、Y 分开存。每个关键帧带 `curveType` 和左右控制点；目前只能确认 `"Line"` 一种取值。
- **蒙版**：坐标以素材半尺寸为单位，羽化取 0～1。
- **色度抠图**：存 intensity / shadow / edge_smooth / spill 四个参数。
- **混合模式**：10 种。
- **转场**：约 420 个，每个带 `is_overlap` 标志（两段是否重叠播放）。
- **动画**：组合动画与入场/出场动画互斥。
- **文字**：按区间设样式的富文本，描边和阴影都可以多层；花字和气泡是独立的资源素材。

### 5.2 实现方案【开源实现 + 推断】

| 功能 | 方案 |
|---|---|
| 文字 | HarfBuzz 整形（竖排启用 `vert` / `vkrn`）+ FreeType 彩色 Emoji；多层花字用 SDF / MSDF |
| 逐字动画 | 参照 Skottie 的 RangeSelector |
| 关键帧缓动 | 参照 Lottie / bezier-easing |
| 蒙版 | 解析距离场 + 羽化 |
| 色度抠图 | 对比 FFmpeg chromakey / despill、OBS、GPUImage 三种实现 |
| 混合模式 | W3C 公式，以及预乘 alpha 的一步式 |
| 转场 | gl-transitions 的单函数模型 |
| 曲线变速 | 速度曲线积分得到时间映射，再求反函数；音频变速不变调用 Sonic / SoundTouch（Rubber Band 是 GPL） |
| LUT | `.cube` 解析、512 平铺 LUT 着色器、3D 纹理与四面体插值 |

## 6. 智能剪辑与 AI → [`research_ai.md`](research_ai.md)

### 6.1 官方明确说在云端运行的【搜索摘要】

- 自动字幕：移动端和 Web 端为云端识别；桌面端在部分地区可本地识别（需下载语言包）。
- 文本朗读（TTS）。
- Auto reframe（智能裁剪）。

### 6.2 有字节公开来源的

- **抠像**：Robust Video Matting（RVM）确实是字节的研究（WACV 2022，GPL-3.0），但没有证据表明 CapCut 线上在用。
- **语音**：火山语音的 TTS 服务剪映，这一点只有媒体报道。
- **智能补帧**：有字节技术文章（搜索摘要）称已在抖音、剪映落地：端上 CPU + GPU（OpenCL / Metal），约 5 倍加速。research_ai.md 漏掉了这条，以 research_nle.md 第 7 节为准。
- **生成式**：
  - 模型：Seedance 1.0 / 2.0、Seedream 4.0 有论文或官方说明；
  - CapCut：2026 年起接入；
  - 剪映：接入 Seedance 2.0 mini，并通过剪映 Hub 调用即梦等产品。

### 6.3 只有对外 SDK 接口、算法未知的

- 变声、降噪、节拍检测、防抖：对外 SDK 和草稿里有对应接口或字段，例如 `VOICE_CHANGER_FILTER`、`addAudioCleanFilter`、草稿里的 `beats[]` 和防抖矩阵 `stable{matrix_path}`。
- 但具体算法没有公开资料，各节以 librosa、vid.stab、RNNoise 等作业界参照。

## 7. 移动端工程实践 → [`research_mobile.md`](research_mobile.md)

### 7.1 剪映一手资料很少

这些都来自一篇约 2020 年的招聘文章，只读到搜索摘要，未核实：

- 导出失败率从 4% 降到 1%，做法是内存复用、编码与渲染并行；
- 为控制包体，只用平台硬编解码；
- 有机型打分平台；
- 用模板生成视频，再用 CV 检测黑屏、花屏，做回归测试。

### 7.2 能直接证实的

- 字节开源的 Raphael（native 内存泄漏检测）的 README 列出了剪映。
- 其他字节开源工具（bhook、btrace、ByteX 等）都没有声明用在剪映。

### 7.3 本章的工程方案【推断】

- 时间轴：坐标和缩放公式、多轨分行。
- 缩略图：采样可跨缩放级别复用。
- 波形：峰值金字塔。
- 交互：手势状态机、seek 请求合并。
- 内存：帧缓冲预算和纹理池。
- 机型分级：熵权法 + TOPSIS 打分。
- 编码稳定性：MediaCodec 看门狗、导出失败时逐级回退。
- 后台导出的平台能力：Android 15 的 mediaProcessing 前台服务、iOS 26 的 BGContinuedProcessingTask。

## 8. 用开源组件搭类剪映的 Android 架构 → [`research_oss.md`](research_oss.md)

这一章最能直接落地到本仓库（Kotlin + Compose）。

### 8.1 主干：AndroidX Media3 1.11.1

- 导出用 Transformer，预览用 CompositionPlayer，两者共用同一个 `Composition` 对象。CompositionPlayer 仍标注 `@ExperimentalApi`。
- **已知限制**：
  - 不支持交叉淡化（crossfade）；
  - 导出最多一路视频、一路音频；
  - 画中画时默认第一个序列在最上层，与剪映“主轨在底”的语义相反。
- **特效**：自定义 `GlEffect` / `BaseGlShaderProgram`，叠加用 `OverlayEffect`。

### 8.2 其他组件

- **FFmpeg**：ffmpeg-kit 已退役，加上 Google Play 的 16KB 页要求，建议只做可选兜底模块。
- **人脸**：MediaPipe Face Landmarker 输出 478 点和 52 个 blendshape；GPUPixel 是 106 点体系，与 MediaPipe 不兼容。
- **渲染层**：Android 官方称 Vulkan 将成为主力。建议现阶段用 Media3 的 GL 特效体系，同时留一层抽象。

### 8.3 本章附带的原创代码与方案

- 模块图；
- 时间线数据模型和撤销/重做命令栈；
- Project → Composition 编译器；
- 导出调用的 Kotlin 骨架；
- Compose 时间线：自定义 Layout、`drawWithCache`、只绘制可见窗口、缩略图按 2 的幂分桶、波形峰值金字塔、吸附；
- 资源包管理方案。

## 9. 各章之间的矛盾与仲裁

| # | 矛盾 | 结论 |
|---|---|---|
| 1 | pyJianYingDraft README 是否提到草稿加密 | **已核对**：当前 README 没有提到加密，并把关键帧、蒙版、抠图等功能标为在剪映 10.8 上可用。nle 章已更正。 |
| 2 | 关键帧 `curveType` 的取值 | **已核对**：`keyframe.py` 只出现 `"Line"`，其他取值未能核实。nle 章已更正。 |
| 3 | GPUPixel 磨皮的原理 | 以 face 章的逐行分析为准：简化自引导滤波，不是经典高反差磨皮。 |
| 4 | 智能补帧有没有字节来源 | 有：以 nle 第 7 节为准（字节技术文章，搜索摘要）。 |
| 5 | 剪映是否内置软编解码器 | **未解决**。2020 年的招聘文说只用硬编解码，但对外 SDK 里有软编解码库；App 可能已经变化。 |
| 6 | 曲线变速的横轴 | **未解决**。render 章按“输出时间”建模，oss 章按“素材进度”建模；两者可以互相换算，剪映草稿实际用哪种未知。自己实现时选一种并保持一致即可。 |
| 7 | 花字和气泡在草稿里的位置 | **未解决**。可能都在 `effects[]` 里，只是 `type` 不同。 |
| 8 | `reshape_lite` 是否包含 `Internal_Deform_Eye` | **未解决**。可能是 Android 与 iOS 资源包不同。 |
| 9 | 人脸、抠像是否走 ByteNN | nle 章架构图里的这种分配**没有来源**，不要采信。 |
| 10 | `lv` 的含义 | 只是推断。 |
| 11 | 后台导出 | 对外 SDK 支持切后台导出（未核实），但 CapCut App 的帮助页说锁屏或切走会暂停导出。两者是不同对象。 |
