# 用开源组件搭建类剪映架构的 Android 参考方案（Kotlin / Jetpack Compose）

> 编写日期：2026-10-15。用途：学习型架构研究。
> 本章回答一个问题：**如果今天要在 Android 上用 Kotlin + Jetpack Compose 做一个"像剪映一样"的编辑器，每个子系统该拿哪块开源积木、API 到底长什么样、积木之间怎么拼。**
> 只用公开来源。没有下载或反编译剪映/CapCut 安装包，没有请求字节线上接口。签名、反爬、DRM、草稿解密、后端架构都不在范围内。
> 姊妹章节：ByteDance Effect/CV SDK、资源包、Effect House 见 `research_effects.md`；`draft_content.json`、火山引擎剪辑 SDK、多端引擎见 `research_nle.md`；移动端工程实践见 `research_mobile.md`。本章只在必要处引用它们。

---

## 目录

- [0. 阅读说明：证据等级、版本基线、本次调研的限制](#0-阅读说明证据等级版本基线本次调研的限制)
- [1. 一页结论](#1-一页结论)
- [2. 剪映子系统 → 开源积木映射总表](#2-剪映子系统--开源积木映射总表)
- [3. 参考架构：模块图、数据流、线程模型](#3-参考架构模块图数据流线程模型)
- [4. 时间线数据模型：轨道 / 片段 / 素材、微秒时基、撤销重做、序列化](#4-时间线数据模型轨道--片段--素材微秒时基撤销重做序列化)
- [5. 预览与导出：Media3 Transformer + CompositionPlayer](#5-预览与导出media3-transformer--compositionplayer)
- [6. 下沉一层：MediaCodec / MediaExtractor / MediaMuxer](#6-下沉一层mediacodec--mediaextractor--mediamuxer)
- [7. FFmpeg 在 Android 上的现状（ffmpeg-kit 退役之后）](#7-ffmpeg-在-android-上的现状ffmpeg-kit-退役之后)
- [8. 渲染图：OpenGL ES 还是 Vulkan](#8-渲染图opengl-es-还是-vulkan)
- [9. 美颜、人脸关键点与人像分割](#9-美颜人脸关键点与人像分割)
- [10. 值得研读的开源 NLE 引擎](#10-值得研读的开源-nle-引擎)
- [11. 资源 / 特效包管理：下载、缓存、版本、LRU、完整性](#11-资源--特效包管理下载缓存版本lru完整性)
- [12. Compose 时间线 UI 技术](#12-compose-时间线-ui-技术)
- [13. 落地路线图与风险清单](#13-落地路线图与风险清单)
- [参考来源](#参考来源)
- [未能确认 / 待补充](#未能确认--待补充)

---

## 0. 阅读说明：证据等级、版本基线、本次调研的限制

**证据等级（每节标题后都会标注）**

| 标签 | 含义 |
|---|---|
| 【官方/一手】 | 字节跳动 / 剪映 / CapCut 官方文档、官方技术文章、官方演讲 |
| 【社区逆向/开源】 | 开源项目的源码和文档。**本章把 Google/AOSP 的官方文档与开源源码（Media3、MediaPipe、Android 平台文档）也归入此类**，因为它们相对剪映是第三方。凡写"已核验"的 API 名，都是我打开源码或文档逐字看到的 |
| 【推断/业界通用】 | 我的设计推断或行业通行做法，没有一手证据 |

**版本基线**

- AndroidX Media3：最新稳定版 **1.11.1（2026-09-10）**。源码 `MediaLibraryInfo.VERSION = "1.11.1"`（`release` 分支）。release notes 还列出 1.11.0（2026-08-05）、1.10.1（2026-05-12）、1.10.0（2026-03-26）、1.9.4（2026-05-16）。
- 本章引用的 Media3 源码全部来自 GitHub `androidx/media` 的 `release` 分支，即 1.11.1。

**本次调研的限制（请先读）**

1. 调研中途 WebSearch 额度用完（共享额度），之后只能打开已知 URL，不能再搜索。
2. 代理拒绝了这些域名：`ai.google.dev`、`developers.google.com/.cn`（MediaPipe、ML Kit 官方指南）、`juejin.cn`、`docs.byteplus.com`、`mltframework.org`、`gstreamer.freedesktop.org`、`android-developers.googleblog.com`。我改用 **GitHub 上的源码和仓库内文档**作为主要证据。对 API 名来说，源码比指南更可靠；但官方指南里的性能数字、模型卡数据，本章没有拿到。
3. 因此，**本章没有打开过任何字节跳动关于"剪映 Android 架构"的一手资料**。剪映一侧的信息只在第 2 节以"功能面"的形式出现，标为【推断/业界通用】，细节请看姊妹章节。

---

## 1. 一页结论

1. **主干选 AndroidX Media3。** 导出用 `Transformer`，预览用 `CompositionPlayer`，两者吃同一个 `Composition` 对象。官方博客原话："It uses the same Composition object that you would pass to Transformer for exporting"（1.9.0）。这是开源世界里离"剪映式预览 = 导出"最近的一套 Android 方案。【社区逆向/开源】
2. **`CompositionPlayer` 仍然是 `@ExperimentalApi`**（1.11.1 源码第 164 行：`@ExperimentalApi // TODO: b/470355043 - Publish CompositionPlayer.`）。官方指南把多路视频预览（画中画、分屏、宫格）列为 "In Active Development"。所以 MVP 阶段可以依赖它，但多层画中画的实时预览需要准备兜底方案。【社区逆向/开源】
3. **时间线模型自己写，用纯 Kotlin、不可变数据、微秒 `Long`。** 再写一个"编译器"把它翻译成 Media3 `Composition`。不要让 Media3 的类型进入领域模型。可以参考 OpenTimelineIO、GES、MLT、libopenshot、Olive 这五个开源模型。【推断/业界通用】
4. **ffmpeg-kit 已退役。** 官方 README（2026 年 7 月更新）说后续是 **FFmpegKitNext**，只提供源码、不发 Maven 包，默认（推荐）用 Nix 自己编，README 也说明支持不用 Nix 的构建流程。再加上 Google Play 的 16 KB 页大小要求（2027-02-01 起不合规的更新会被拒），FFmpeg 只适合做可选的兜底模块。【社区逆向/开源】
5. **渲染层先用 OpenGL ES，也就是 Media3 的 `GlEffect` 体系，但要给 Vulkan 留出抽象层。** Android 官方说 "Vulkan is the primary low-level graphics API on Android, replacing OpenGL ES"，OpenGL ES "no longer under active feature development"，以后 GL 可能只通过 ANGLE 提供。【社区逆向/开源】
6. **AI 能力用 MediaPipe Tasks。** Face Landmarker 输出 478 个关键点、52 个 blendshape 和面部变换矩阵（源码可证）。Image Segmenter 有 `selfie_segmenter`、`selfie_multiclass_256x256`、`hair_segmenter`、`deeplab_v3` 四个现成模型。美颜 shader 可以参考 GPUPixel（Apache-2.0）的"盒式模糊 + 高反差"磨皮和"106 点液化"瘦脸大眼。【社区逆向/开源】
7. **时间线 UI 用 Compose 自定义 `Layout` + `drawWithCache` + 自己算可见窗口。** 缩略图用 Media3 的 `FrameExtractor`（1.9 在 `media3-inspector` 中引入；1.10 起拆到 `media3-inspector-frame` 模块，包名改为 `androidx.media3.inspector.frame`，见 1.10.0 release notes）。波形用自己做的"峰值金字塔"。【推断/业界通用】，所用 Compose API 都已核验。

---

## 2. 剪映子系统 → 开源积木映射总表

> 左列是剪映可见的功能面（产品观察），标【推断/业界通用】；剪映内部的实现见姊妹章节。右侧各列是本章核验过的开源积木，标【社区逆向/开源】。

| 剪映子系统（功能面） | 推荐开源积木 | 关键 API（已核验） | 成熟度 / 注意 |
|---|---|---|---|
| 草稿 / 时间线模型 | 自研 Kotlin 模型，概念借鉴 OTIO / GES / MLT | `kotlinx.serialization`（`Json { ignoreUnknownKeys; classDiscriminator }`），`kotlinx.collections.immutable`（`PersistentList`） | 火山引擎 / BytePlus 剪辑 SDK（NLE）的模型是 Model→Track→Slot→Segment→Resource（见 `research_nle.md`；剪映 App 内部是否同构，本章未见一手证据，未能核实）；剪映草稿用微秒时基（pyJianYingDraft README："剪映（和本项目）内部均采用微秒为单位保存时间"，社区逆向） |
| 实时预览 | Media3 `CompositionPlayer` | `CompositionPlayer.Builder(context).build()`，`setComposition()`，`setVideoGraphFactory()` | `@ExperimentalApi`；多路视频预览仍在开发 |
| 单素材特效预览 | Media3 ExoPlayer | `ExoPlayer.setVideoEffects(...)` | 稳定，适合素材详情页、滤镜试看 |
| 导出 / 合成 | Media3 `Transformer` | `Transformer.start(Composition, path)`，`Transformer.Listener`，`getProgress(ProgressHolder)`，`cancel()`，`resume(...)` | 输出最多一路视频 + 一路音频 |
| 剪辑结构 | Media3 `Composition` / `EditedMediaItemSequence` / `EditedMediaItem` | `EditedMediaItemSequence.Builder(Set<trackType>)`，`addItem`，`addGap(durationUs)`，`setIsLooping` | 还不支持交叉淡化（crossfade） |
| 裁剪 / 变速 | `MediaItem.ClippingConfiguration`，`EditedMediaItem.setSpeed` | `setStartPositionUs/EndPositionUs`，`setSpeed(SpeedProvider)`，`setFrameRate()` 作为最大帧率上限 | 曲线变速要离散成分段常速 |
| 滤镜 / 调节 | Media3 effect 库 | `Contrast`，`Brightness`，`HslAdjustment`，`RgbMatrix`，`RgbFilter`，`SingleColorLut.createFromCube/FromBitmap`，`GaussianBlur` | GL 实现 |
| 自定义特效 | `GlEffect` + `BaseGlShaderProgram` | `toGlShaderProgram(context, useHdr)`，`configure(w,h)`，`drawFrame(texId, presentationTimeUs)`，`TimestampWrapper` | 已有官方 demo 可照抄结构 |
| 文字 / 贴纸 / Lottie | `OverlayEffect` | `TextureOverlay`，`BitmapOverlay`，`TextOverlay`，`StaticOverlaySettings`，`media3-effect-lottie` 的 `LottieOverlay` | 叠加物的时间窗口要自己控制 |
| 画中画 / 多轨合成 | 多个 sequence + `VideoCompositorSettings` | `getOutputSize(List<Size>)`，`getOverlaySettings(inputId, ptsUs)`，`MultipleInputVideoGraph` | 默认合成器把**第一个源画在最上层**（见 5.8） |
| 音量 / 淡入淡出 / 混音 | Media3 audio | `GainProcessor`，`DefaultGainProvider.Builder.addFadeAt(...)`，`FADE_IN_LINEAR`，`FADE_OUT_EQUAL_POWER`，纯音频 sequence | 各素材 PCM 格式必须一致 |
| 缩略图 | `media3-inspector-frame`（1.10 起；1.9 时在 `media3-inspector`） | `FrameExtractor.Builder(context, mediaItem).build()`，`getFrame(ms)`，`getThumbnail()` | 1.9 引入；1.10 起为 `androidx.media3.inspector.frame.FrameExtractor`（breaking change） |
| 底层编解码 | Android 平台 | `MediaCodec`（异步 `setCallback`），`MediaExtractor.seekTo(..., SEEK_TO_PREVIOUS_SYNC)`，`MediaMuxer` | 倒放、帧精确取帧、波形 PCM 时用到 |
| 格式兜底 | FFmpegKitNext（自编） / 社区 fork | 编 FFmpeg v6.1.x+，Android 端为 Kotlin API | 许可证 LGPL/GPL；要满足 16 KB 页 |
| 美颜（磨皮 / 美白 / 瘦脸 / 大眼） | GPUPixel、GPUImage 的 shader 思路，移植成 `GlEffect` | GPUPixel 的 `BeautyFaceFilter`、`FaceReshapeFilter`（106 点） | GPUPixel 用自己的人脸库 Mars-Face |
| 人脸关键点 | MediaPipe Face Landmarker；ML Kit Face Mesh | `FaceLandmarker.detectForVideo / detectAsync`，`faceLandmarks()`，`faceBlendshapes()`，`facialTransformationMatrixes()` | 478 点 / 52 blendshape |
| 智能抠像 | MediaPipe Image Segmenter | `segmentForVideo`，`confidenceMasks()`，`categoryMask()` | `selfie_multiclass_256x256` 有 6 类 |
| 资源 / 特效包 | WorkManager + 自研磁盘 LRU + SHA-256 | `enqueueUniqueWork`，`Constraints.Builder().setRequiredNetworkType(UNMETERED)`，`LruCache.sizeOf`，Media3 `SimpleCache` + `LeastRecentlyUsedCacheEvictor` | 需要"打开中的草稿引用计数"来钉住资源 |
| 时间线 UI | Jetpack Compose | `Layout`，`Modifier.drawWithCache`，`pointerInput` + `detectDragGestures`，`transformable`，`LazyLayout`，`derivedStateOf`，lambda 版 `offset {}` | 自己做虚拟化 |

---

## 3. 参考架构：模块图、数据流、线程模型

【推断/业界通用】（架构是推断；图里的 API 已核验）

### 3.1 模块图

```
┌──────────────────────────────── :app ────────────────────────────────────┐
│  :feature:editor   EditorScreen = PreviewPane + Timeline + ToolPanels      │
│  :ui:timeline      TimelineViewport / TrackRow(Layout) / ThumbnailStrip /  │
│                    WaveformCanvas / TrimHandles / Snapping                 │
│  :ui:player        ContentFrame(media3-ui-compose) 承载预览表面             │
└───────────────┬───────────────────────────────▲───────────────────────────┘
                │ Intent(EditCommand)            │ StateFlow<EditorState>
┌───────────────▼───────────────────────────────┴───────────────────────────┐
│  :editor:core      EditorStore（单线程 actor）+ History(undo/redo, 合并)    │
│  :model:timeline   Project / Track / Segment / Material / Keyframes       │
│                    纯 Kotlin，无 Android 依赖，可在 JVM 上单测              │
│  :model:io         JSON(schemaVersion + migrations) / 自动保存 / 原子写     │
└────┬──────────────────┬─────────────────┬─────────────────┬──────────────┘
     │ compile()        │ analyze()       │ resolve()       │ inspect()
┌────▼────────────┐ ┌───▼───────────┐ ┌───▼────────────┐ ┌──▼──────────────┐
│ :engine:media3  │ │ :engine:ai    │ │ :resource      │ │ :media:inspect  │
│ CompositionCom- │ │ MediaPipe     │ │ manifest/版本   │ │ FrameExtractor  │
│ piler           │ │ FaceLandmarker│ │ 下载(WorkMgr)   │ │ 缩略图 LRU      │
│ PreviewController│ │ ImageSegmenter│ │ sha256 校验     │ │ 波形峰值金字塔   │
│ (CompositionPla-│ │ 结果按素材时间  │ │ 磁盘 LRU + pin  │ │ MediaExtractor/ │
│  yer)           │ │ 戳缓存         │ │ 引用计数        │ │ MediaCodec      │
│ Media3Exporter  │ └──────┬────────┘ └───────┬────────┘ └─────────────────┘
│ (Transformer)   │        │ landmarks/masks   │ 本地包路径
│ :engine:fx      │◄───────┴───────────────────┘
│ GlEffect 库：美颜/LUT/转场/抠像合成/文字贴纸 Overlay                       │
└────┬────────────┘
     │ 可选（Dynamic Feature / NDK）
┌────▼──────────────────────────────────────────────────────────────────────┐
│ :engine:native   GPUPixel(.aar) / FFmpegKitNext(自编) / Vulkan 实验渲染     │
└───────────────────────────────────────────────────────────────────────────┘
```

依赖方向是单向的：`ui → editor:core → model ← engine:*`。`engine` 依赖 `model`，`model` 不依赖任何引擎。以后要把 Media3 换成别的引擎（比如自研的 Vulkan 管线），只需要换掉 `:engine:media3`。

### 3.2 Gradle 依赖（artifact 名取自 Media3 release notes 页面）

```kotlin
// libs: media3 = "1.11.1"
implementation("androidx.media3:media3-transformer:$media3")   // Transformer, Composition, CompositionPlayer
implementation("androidx.media3:media3-effect:$media3")        // GlEffect, OverlayEffect, Presentation...
implementation("androidx.media3:media3-effect-lottie:$media3") // LottieOverlay（1.10 拆出）
implementation("androidx.media3:media3-inspector:$media3")     // MetadataRetriever, MediaExtractorCompat
implementation("androidx.media3:media3-inspector-frame:$media3") // FrameExtractor（1.10 起从 media3-inspector 拆出）
implementation("androidx.media3:media3-common:$media3")
implementation("androidx.media3:media3-ui-compose:$media3")    // Compose 播放 UI 组件
implementation("androidx.media3:media3-muxer:$media3")         // 可选：直接用 Mp4Muxer
implementation("com.google.mediapipe:tasks-vision:1.0.0")      // 官方 samples 当前写的版本
implementation("androidx.work:work-runtime-ktx:<ver>")         // 版本自行确认
```

### 3.3 一次编辑的数据流

```
手势/按钮 ──► EditCommand ──► EditorStore(串行)
                                 │ 1. newProject = cmd.apply(old)   （不可变、结构共享）
                                 │ 2. history.push(old,new, 可合并)
                                 │ 3. state.emit(newProject)        ──► Compose 重组（只重组变化的轨道）
                                 │ 4. debounce(80–150ms) ─► compile(newProject) ─► Composition
                                 ▼
                     PreviewController（主线程）
                       pos = player.currentPosition
                       player.setComposition(composition)  ;  prepare()
                       player.seekTo(pos)  ;  按需 play()
```

要点：

- 拖动过程中（手指还没抬起）**不要每帧都重编译 `Composition`**。UI 层先用乐观的视觉位移，`onDragEnd` 时再提交命令。也可以在拖动中低频编译一次，只用于预览。
- 只改了不影响时间结构的参数（滤镜强度、文字颜色）时，最理想的做法是让 effect 从共享的参数表里按时间戳读取，不重建 `Composition`。Media3 的 `TextureOverlay.getOverlaySettings(presentationTimeUs)`、`BaseGlShaderProgram.drawFrame(texId, presentationTimeUs)` 都是**按帧回调**的，可以把参数源设计成线程安全的快照引用。注意 `OverlayEffect` 的注释说过，要修改 overlay 列表就得新建 `OverlayEffect`。

### 3.4 线程模型

| 线程 | 职责 | 依据 |
|---|---|---|
| Main（应用 Looper） | Compose；`CompositionPlayer` 和 `Transformer` 的全部调用 | `CompositionPlayer` 源码注释："must be accessed from a single application thread"；`Transformer.start` 会做 `verifyApplicationThread()` |
| Media3 内部 GL 线程 | `GlShaderProgram` 的所有回调 | `GlShaderProgram` 注释：方法必须在拥有父 GL 上下文的线程上调用 |
| `Dispatchers.Default`（限并发） | MediaPipe 推理、波形峰值计算 | 【推断】 |
| `Dispatchers.IO` | 草稿读写、资源下载、解压、SHA-256 | 【推断】 |
| 缩略图解码池（并发 1–2） | `FrameExtractor` 实例；硬件解码器实例数有限 | 【推断】`FrameExtractor` 也要求单线程访问 |

---

## 4. 时间线数据模型：轨道 / 片段 / 素材、微秒时基、撤销重做、序列化

【推断/业界通用】为主。开源模型对比为【社区逆向/开源】。

### 4.1 设计目标

1. **一个时间单位**：全工程用 `Long` 微秒。Media3 的编辑类接口以 `...Us` 为主（`Player` 接口的位置仍是毫秒，见 12.8）；剪映草稿也是微秒（pyJianYingDraft README："剪映（和本项目）内部均采用微秒为单位保存时间"，社区逆向；另见 `research_nle.md`）。
2. **不可变 + 结构共享**：撤销/重做直接存快照，比维护逆操作简单。Compose 也能靠引用相等跳过重组。
3. **"在哪"和"放什么"分开**：`Segment` 只描述"时间线上的哪一段 ← 素材里的哪一段"，素材本身放在 `materials` 表里。OTIO、GES、剪映都这样分。
4. **关键帧时间用片段内的相对时间**：移动片段时不用改关键帧。
5. **领域模型不认识 Media3**：编译器负责翻译。

### 4.2 时基：微秒 + 有理数帧率

只用浮点秒（libopenshot 的 `ClipBase` 就是 `float position/start/end` 秒）在长工程里会累积误差。只用整数帧又处理不了混合帧率素材和 44.1 kHz 音频。折中做法：

- **存储**：一律用 `Long` 微秒。
- **对齐**：帧率用有理数 `num/den` 表示（例如 29.97 = 30000/1001）。吸附到帧边界时用整数运算：

```
frameIndex(t) = floor( t · num / (10^6 · den) )
t(frame k)    = round( k · 10^6 · den / num )          // 29.97fps 时一帧 = 33366.67µs，不能用固定步长累加
```

溢出检查：k ≤ 10^7（30 fps 下约 92 小时），den ≤ 1001，所以 k·10^6·den ≤ 10^16，远小于 `Long.MAX ≈ 9.2·10^18`。

- 同类做法：OTIO 用 `RationalTime(value, rate)`，含义是"A point in time at rt.value*(1/rt.rate) seconds"；Olive 的 `Block` 用 `rational` 表示 in/out/length。【社区逆向/开源】

### 4.3 实体与不变量

```
Project
 ├─ canvas(w,h,bg) , fps(num/den) , schemaVersion
 ├─ materials: Map<id, Material>        Video | Audio | Image | Text | Effect(包引用) | Sticker(包引用)
 └─ tracks: List<Track>                 MAIN_VIDEO | OVERLAY_VIDEO | AUDIO | TEXT | STICKER | EFFECT | FILTER
      └─ segments: List<Segment>        按 target.start 升序
           ├─ target: TimeRange         时间线上的区间
           ├─ source: TimeRange?        素材内的区间（文字/特效为 null）
           ├─ speed: Constant | Curve
           ├─ volume / transform(x,y,scale,rot,alpha): AnimatedFloat（关键帧）
           ├─ effectIds -> materials[Effect]
           └─ transitionOut?
```

不变量（每次 `apply` 之后在 debug 构建里断言）：

| 编号 | 不变量 | 说明 |
|---|---|---|
| I1 | 同一轨道内片段不重叠：`a.end ≤ b.start` | 与 GES 的 overlap 定义相同（`startA < endB && startB < endA` 才算重叠） |
| I2 | 主轨"磁吸"：`b.start == a.end`，没有空隙 | 剪映主轨行为（产品观察）；副轨允许空隙 |
| I3 | 常速片段：`target.duration == round(source.duration / speed)` | 曲线变速见 4.4 |
| I4 | `source ⊆ [0, material.duration)` | 修剪时要夹紧 |
| I5 | 关键帧时间 ∈ `[0, target.duration]`（相对时间） | 分割时右半段的关键帧整体平移 |

### 4.4 曲线变速的数学

设素材截取时长为 `D`，归一化素材进度 `p∈[0,1]`，速度曲线是 `v(p)`（用控制点做分段线性）。输出时长：

```
T = D · ∫₀¹ dp / v(p)
```

离散成 N 段做梯形积分，同时得到累积表 `t(p_i)`。预览时要"给定时间线时间求素材时间"，在表上二分查找即可。

Media3 的 `SpeedProvider` 是**按素材时间分段常速**的："Returns the media speed from the provided timestamp. The media speed will stay the same until the next specified speed change"，接口是 `getSpeed(timeUs)` 和 `getNextSpeedChangeTimeUs(timeUs)`。所以曲线要先离散成阶梯：

```
step = 40ms（素材时间）
getSpeed(t)                = v( (t - srcStart) / D )  在 step 左端采样
getNextSpeedChangeTimeUs(t)= srcStart + (floor((t - srcStart)/step)+1)·step ，越过末尾返回 C.TIME_UNSET
```

另外，用 `EditedMediaItem.Builder.setFrameRate(maxFps)` 限制加速后的输出帧率。1.10 起这个方法对有固有帧率的输入表示"最大帧率"，源码注释专门提到它对 `setSpeed` 加速的场景有用。【社区逆向/开源】

### 4.5 五个开源模型对照

【社区逆向/开源】

| 概念 | OpenTimelineIO | GES (GStreamer Editing Services) | MLT | libopenshot | Olive | 本方案 |
|---|---|---|---|---|---|---|
| 根 | `Timeline`（`tracks` 是 `Stack`） | `GESTimeline` | `tractor`（管理 multitrack + field） | `Timeline` | `Sequence` 节点 | `Project` |
| 轨/层 | `Track` | `GESLayer`（有优先级）+ `GESTrack`（输出类型） | `playlist`（"sequential container of producers and blank spaces"） | `layer` 整数（"Lower clips are covered up by higher clips"） | `Track`（"time traversal Node"） | `Track(kind)` |
| 片段 | `Clip`（`source_range` / `available_range`） | `GESClip` → `GESTrackElement` | producer 条目 | `Clip`（position/start/end 秒，float） | `Block`（in/out，rational） | `Segment(target, source)` |
| 空隙 | `Gap` | 无内容时间 | blank | 无 | gap 块 | 不存（由 I2 约束主轨） |
| 转场 | `Transition` | `GESTransitionClip`（可 auto-transition） | `transition`（`a_track`/`b_track`） | 无内置转场对象 | 节点 | `transitionOut` |
| 动画 | metadata | `GstControlBinding` | 属性动画 | `Keyframe` 曲线（BEZIER/LINEAR/CONSTANT） | 节点参数关键帧 | `AnimatedFloat` |
| 变速 | `LinearTimeWarp` 效果 | `GESEffect` / rate | 生产者速度 | `time` 关键帧（"frames over time to play"） | 节点 | `Speed` |
| 时间 | `RationalTime(value, rate)` | `GstClockTime`（纳秒） | 帧位置 | `float` 秒 | `rational` | µs + 有理数帧率 |

**取舍建议**：

- 模型骨架和 OTIO 的 `source_range` / `available_range` 两层裁剪语义对齐。将来要导入导出 OTIO（OTIO 有 FCP XML、AAF 等适配器）会很方便。
- 编辑语义照抄 GES。它把 `NORMAL / RIPPLE / ROLL / TRIM / SLIDE` 五种编辑模式写成了枚举（`GESEditMode`），重叠规则也写得非常清楚，见 10.4。注意：`ges-enums.h` 注释写明 SLIDE 模式"not yet implemented"，只能参考其语义定义。
- 动画曲线参考 libopenshot 的三种插值，`Point` 带左右手柄。

### 4.6 Kotlin 骨架：时间线模型（原创）

```kotlin
// :model:timeline —— 纯 Kotlin，无 Android 依赖
package demo.timeline

import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable

typealias Us = Long // 全工程唯一的时间单位：微秒

@Serializable
data class TimeRange(val startUs: Us, val durationUs: Us) {
    init { require(startUs >= 0 && durationUs > 0) { "bad range $startUs/$durationUs" } }
    val endUs: Us get() = startUs + durationUs
    operator fun contains(t: Us) = t >= startUs && t < endUs
    fun overlaps(o: TimeRange) = startUs < o.endUs && o.startUs < endUs   // "相切"不算重叠
    fun shift(d: Us) = copy(startUs = startUs + d)
}

@Serializable
data class FrameRate(val num: Int, val den: Int = 1) {
    fun usToFrame(t: Us): Long = Math.floorDiv(t * num, 1_000_000L * den)
    fun frameToUs(k: Long): Us = (k * 1_000_000L * den + num / 2) / num   // 四舍五入
    fun snap(t: Us): Us = frameToUs(usToFrame(t))
}

// ---------- 关键帧 ----------
@Serializable enum class Interp { HOLD, LINEAR, CUBIC_BEZIER }

@Serializable
data class Key(
    val tUs: Us,            // 片段内相对时间
    val v: Float,
    val interp: Interp = Interp.LINEAR,
    val c: FloatArray? = null, // CUBIC_BEZIER 的 (x1,y1,x2,y2)
)

@Serializable
data class AnimatedFloat(val base: Float, val keys: List<Key> = emptyList()) {
    fun at(tUs: Us): Float {
        if (keys.isEmpty()) return base
        if (tUs <= keys.first().tUs) return keys.first().v
        if (tUs >= keys.last().tUs) return keys.last().v
        var lo = 0; var hi = keys.lastIndex
        while (hi - lo > 1) { val m = (lo + hi) ushr 1; if (keys[m].tUs <= tUs) lo = m else hi = m }
        val a = keys[lo]; val b = keys[hi]
        val u = (tUs - a.tUs).toFloat() / (b.tUs - a.tUs)
        val w = when (a.interp) {
            Interp.HOLD -> 0f
            Interp.LINEAR -> u
            Interp.CUBIC_BEZIER -> cubicBezierEase(u, a.c ?: floatArrayOf(.42f, 0f, .58f, 1f))
        }
        return a.v + (b.v - a.v) * w
    }
    fun shifted(d: Us) = copy(keys = keys.map { it.copy(tUs = it.tUs + d) }.filter { it.tUs >= 0 })
}

@Serializable
data class Transform(
    val x: AnimatedFloat = AnimatedFloat(0f),      // NDC -1..1，和 Media3 OverlaySettings 锚点同一坐标系
    val y: AnimatedFloat = AnimatedFloat(0f),
    val scale: AnimatedFloat = AnimatedFloat(1f),
    val rotationDeg: AnimatedFloat = AnimatedFloat(0f),
    val alpha: AnimatedFloat = AnimatedFloat(1f),
) { fun shifted(d: Us) = Transform(x.shifted(d), y.shifted(d), scale.shifted(d), rotationDeg.shifted(d), alpha.shifted(d)) }

// ---------- 变速 ----------
@Serializable
sealed interface Speed {
    @Serializable @SerialName("const") data class Constant(val factor: Float) : Speed
    @Serializable @SerialName("curve") data class Curve(val points: List<SpeedPoint>) : Speed
}
@Serializable data class SpeedPoint(val progress: Float, val factor: Float) // progress: 素材进度 0..1

// ---------- 素材 ----------
@Serializable
sealed interface Material { val id: String }

@Serializable @SerialName("video")
data class VideoMaterial(override val id: String, val uri: String, val durationUs: Us,
                         val width: Int, val height: Int, val hasAudio: Boolean = true) : Material
@Serializable @SerialName("audio")
data class AudioMaterial(override val id: String, val uri: String, val durationUs: Us) : Material
@Serializable @SerialName("image")
data class ImageMaterial(override val id: String, val uri: String, val width: Int, val height: Int) : Material
@Serializable @SerialName("text")
data class TextMaterial(override val id: String, val text: String, val fontPackage: String?, val sizeSp: Float) : Material
@Serializable @SerialName("effect")
data class EffectMaterial(override val id: String, val packageId: String, val packageVersion: Int,
                          val params: Map<String, Float> = emptyMap()) : Material

// ---------- 片段 / 轨道 / 工程 ----------
@Serializable
data class Segment(
    val id: String,
    val materialId: String,
    val target: TimeRange,
    val source: TimeRange?,                   // 文字/特效/贴纸 = null
    val speed: Speed = Speed.Constant(1f),
    val volume: AnimatedFloat = AnimatedFloat(1f),
    val transform: Transform = Transform(),
    val effectIds: List<String> = emptyList(),
    val transitionOut: TransitionSpec? = null,
)
@Serializable data class TransitionSpec(val packageId: String, val durationUs: Us)

@Serializable enum class TrackKind { MAIN_VIDEO, OVERLAY_VIDEO, AUDIO, TEXT, STICKER, EFFECT, FILTER }

@Serializable
data class Track(val id: String, val kind: TrackKind, val segments: List<Segment>,
                 val muted: Boolean = false, val hidden: Boolean = false, val locked: Boolean = false)

@Serializable
data class Project(
    val schemaVersion: Int = CURRENT_SCHEMA,
    val id: String,
    val canvasW: Int, val canvasH: Int,
    val fps: FrameRate = FrameRate(30),
    val tracks: List<Track>,
    val materials: Map<String, Material>,
) {
    val durationUs: Us get() = tracks.maxOfOrNull { t -> t.segments.lastOrNull()?.target?.endUs ?: 0L } ?: 0L
    companion object { const val CURRENT_SCHEMA = 3 }
}

fun Project.updateTrack(id: String, f: (Track) -> Track) =
    copy(tracks = tracks.map { if (it.id == id) f(it) else it })   // 未改的 Track 引用不变 → 结构共享

fun Track.checkInvariants() {
    segments.zipWithNext { a, b ->
        require(a.target.endUs <= b.target.startUs) { "I1 overlap ${a.id}/${b.id}" }
        if (kind == TrackKind.MAIN_VIDEO) require(a.target.endUs == b.target.startUs) { "I2 gap ${a.id}/${b.id}" }
    }
}
```

> `cubicBezierEase` 是 CSS `cubic-bezier(x1,y1,x2,y2)` 那种求解，这里省略（牛顿迭代解 x(s)=u 再求 y(s)）。
> 内存里可以把 `List` 换成 `kotlinx.collections.immutable` 的 `PersistentList` 以获得廉价修改（README："`persistentListOf`…`mutate`"）。序列化时再转回普通 `List`，或者自己写 serializer。

### 4.7 编辑操作：分割与修剪（原创示例）

```kotlin
interface EditCommand {
    val label: String
    fun apply(p: Project): Project
    /** 连续拖动/滑杆时把同类命令合并成一条历史 */
    fun mergeWith(next: EditCommand): EditCommand? = null
}

data class SplitSegment(val trackId: String, val segId: String, val atUs: Us, val newId: String) : EditCommand {
    override val label = "分割"
    override fun apply(p: Project) = p.updateTrack(trackId) { t ->
        val i = t.segments.indexOfFirst { it.id == segId }
        val s = t.segments[i]
        require(atUs in s.target && atUs > s.target.startUs)
        val k = (s.speed as? Speed.Constant)?.factor ?: error("曲线变速需先烘焙成常速段再分割")
        val leftT = atUs - s.target.startUs
        val leftS = (leftT * k).toLong()                       // 时间线时长 × 速度 = 素材时长
        val left = s.copy(target = TimeRange(s.target.startUs, leftT),
                          source = s.source?.let { TimeRange(it.startUs, leftS) })
        val right = s.copy(id = newId,
                           target = TimeRange(atUs, s.target.durationUs - leftT),
                           source = s.source?.let { TimeRange(it.startUs + leftS, it.durationUs - leftS) },
                           transform = s.transform.shifted(-leftT),
                           volume = s.volume.shifted(-leftT),
                           transitionOut = s.transitionOut)
        t.copy(segments = t.segments.toMutableList().apply { set(i, left.copy(transitionOut = null)); add(i + 1, right) })
    }
}

/** 拖右边缘修剪；主轨要 ripple（后续片段跟着移动），副轨不动 */
data class TrimEnd(val trackId: String, val segId: String, val newDurUs: Us) : EditCommand {
    override val label = "修剪"
    override fun apply(p: Project) = p.updateTrack(trackId) { t ->
        val i = t.segments.indexOfFirst { it.id == segId }
        val s = t.segments[i]
        val k = (s.speed as Speed.Constant).factor
        val mat = p.materials.getValue(s.materialId)
        val maxSrc = when (mat) { is VideoMaterial -> mat.durationUs; is AudioMaterial -> mat.durationUs; else -> Long.MAX_VALUE }
        val src = s.source!!
        val dur = newDurUs.coerceIn(1, ((maxSrc - src.startUs) / k).toLong())          // I4 夹紧
        val delta = dur - s.target.durationUs
        val ns = s.copy(target = s.target.copy(durationUs = dur), source = src.copy(durationUs = (dur * k).toLong()))
        val ripple = t.kind == TrackKind.MAIN_VIDEO
        t.copy(segments = t.segments.mapIndexed { j, x ->
            when { j == i -> ns; ripple && j > i -> x.copy(target = x.target.shift(delta)); else -> x }
        })
    }
    override fun mergeWith(next: EditCommand) =
        (next as? TrimEnd)?.takeIf { it.trackId == trackId && it.segId == segId }   // 只保留最新目标值
}
```

### 4.8 撤销 / 重做：快照式命令栈（原创）

```kotlin
class History(private val limit: Int = 200) {
    private data class Entry(val cmd: EditCommand, val before: Project, val after: Project)
    private val undoStack = ArrayDeque<Entry>()
    private val redoStack = ArrayDeque<Entry>()

    fun execute(cur: Project, cmd: EditCommand, coalesce: Boolean = false): Project {
        val after = cmd.apply(cur)
        if (after === cur) return cur                       // 无变化不入栈
        val last = undoStack.lastOrNull()
        val merged = if (coalesce && last != null) last.cmd.mergeWith(cmd) else null
        if (merged != null) {
            undoStack.removeLast(); undoStack.addLast(Entry(merged, last!!.before, after))
        } else {
            undoStack.addLast(Entry(cmd, cur, after))
            if (undoStack.size > limit) undoStack.removeFirst()
        }
        redoStack.clear()
        return after
    }
    fun undo(): Project? = undoStack.removeLastOrNull()?.also { redoStack.addLast(it) }?.before
    fun redo(): Project? = redoStack.removeLastOrNull()?.also { undoStack.addLast(it) }?.after
    val canUndo get() = undoStack.isNotEmpty()
    val canRedo get() = redoStack.isNotEmpty()
}
```

设计说明：

- **为什么存快照而不是写逆操作**：模型是不可变的，每次修改只复制被改的路径（Project → 某个 Track → 某几个 Segment），其余对象共享引用。200 步历史的额外内存通常只有几 MB。逆操作写起来容易出错，比如 ripple 修剪的逆操作要恢复所有后续片段的位置。
- **什么时候需要可逆 diff**：多人协作、云端草稿增量同步、超大工程。可以参考 libopenshot 的 `Timeline::ApplyJsonDiff(std::string)`。它的注释说，这个接口用来让时间线和外部应用保持同步，diff 是"a key, value, and type of change"。火山引擎 / BytePlus 剪辑 SDK（NLE）的 commit/done 事务机制见 `research_nle.md`（它是否就是剪映 App 内部的实现，本章未能核实）。【社区逆向/开源】
- **事务**：一次"添加转场"会同时改两个片段和素材表。用 `CompositeCommand(list)` 包起来，历史里只记一条。
- **合并**：滑杆、拖动这类操作在 `onDragStart` 打开一个合并窗口，`onDragEnd` 关闭。窗口内 `coalesce = true`。

### 4.9 序列化与版本迁移

- 用 `kotlinx.serialization`。密封接口的多态序列化要求"base class has to be sealed and `@Serializable`"，子类也都要标 `@Serializable`。类型判别字段可以用 `Json { classDiscriminator = "type" }` 改名。【社区逆向/开源】
- `Json { ignoreUnknownKeys = true }`：旧版 App 读新草稿时不会因为新增字段崩溃（前向兼容）。默认值字段要不要写出，由 `encodeDefaults` 控制。【社区逆向/开源】
- 版本迁移是一条函数链，在 JSON 树上改结构，改完再解码：`migrations: Map<Int, (JsonObject) -> JsonObject>`，从文件里的 `schemaVersion` 依次升到 `CURRENT_SCHEMA`。【推断/业界通用】
- 原子写：先写 `draft.json.tmp`，`FileOutputStream.fd.sync()`，再 `renameTo(draft.json)`；保留最近 N 份 `.bak`。自动保存在 IO 线程做 debounce（例如 2 秒）。【推断/业界通用】

---

## 5. 预览与导出：Media3 Transformer + CompositionPlayer

【社区逆向/开源】（Google 官方开源库；API 名都在 1.11.1 源码中核验过）

### 5.1 现状与稳定性

| 项 | 事实 | 来源 |
|---|---|---|
| 最新稳定版 | 1.11.1（2026-09-10） | release notes、`MediaLibraryInfo.VERSION` |
| `CompositionPlayer` 首次公开 | 1.9.0："Publish CompositionPlayer under a new @ExperimentalApi annotation … Some APIs are likely to change significantly in future releases, and there are known issues and limitations with some use-cases (some undocumented)." | release notes 1.9.0 |
| 1.11.1 时的状态 | 仍是 `@ExperimentalApi // TODO: b/470355043 - Publish CompositionPlayer.` | 源码 |
| `@ExperimentalApi` 的含义 | "still under development … likely to undergo incompatible changes or removal"；定义为 `@RequiresOptIn(level = ERROR)`。Kotlin 调用方要写 `@OptIn(ExperimentalApi::class)` | 源码 |
| 1.9 的其他变化 | `InAppMp4Muxer` 成为默认 muxer；新增 `EditedMediaItem.Builder#setSpeed()`，废弃 `Effects#createExperimentalSpeedChangingEffects()`；`EditedMediaItemSequence` 用 `trackTypes` 取代 `forceAudioTrack/forceVideoTrack`；新增 `media3-inspector` 模块（当时含 `FrameExtractor`、`MetadataRetriever`、`MediaExtractorCompat`）；新增 `ContentFrame`（在 `media3-ui-compose`）并新建 `media3-ui-compose-material3` 模块 | release notes、1.9 博客 |
| 1.10 | `setFrameRate()` 可作最大输出帧率；`LottieOverlay` 移到 `:media3-effect-lottie`，包名改为 `androidx.media3.effect.lottie.LottieOverlay`；`CompositionPlayer` 支持 `EditedMediaItem.removeVideo`；**Breaking change：`FrameExtractor` 移到新模块 `:media3-inspector-frame`，import 改为 `androidx.media3.inspector.frame.FrameExtractor`**；`media3-ui-compose-material3` 新增 `Player` Composable | release notes、1.10 博客 |
| 1.11.0 | `CompositionPlayer` 修复 `TrackSelector` 未释放；`Transformer` 修复 `ExportResult.fileSizeBytes` 多报；Effect 修复 seek 时 flush 导致预览冻结 | release notes |

官方指南列出的 `CompositionPlayer` 能力边界：

- **支持**：单素材预览；单序列（顺序拼接）；一路视频序列 + 一路音频序列（例如背景音乐）。
- **仍在开发**：多路视频（画中画、并排、宫格）；用其他图形引擎定制管线。
- **要求**：所有素材都要显式时长。图片用 `MediaItem.Builder.setImageDurationMs()`，音视频用 `EditedMediaItem.Builder.setDurationUs()`。源码注释说这个值是"duration of the source media before applying any clipping or speed-changing effects"，即素材原始时长。
- **视频图**：默认是 `SingleInputVideoGraph.Factory`。如果有多个序列都含图像或视频，要通过 `setVideoGraphFactory()` 换成 `MultipleInputVideoGraph.Factory`。
- **循环**：只支持 `REPEAT_MODE_OFF` 和 `REPEAT_MODE_ALL`。

### 5.2 Media3 对象模型

```
Composition                                   ── Composition.Builder(seq0, seq1, ...)
 ├─ effects: Effects(audioProcessors, videoEffects)   ← 全局（比如 Presentation 输出尺寸、全局 OverlayEffect）
 ├─ videoCompositorSettings                           ← 多路视频怎么叠
 ├─ hdrMode: HDR_MODE_KEEP_HDR | TONE_MAP_HDR_TO_SDR_USING_MEDIACODEC | ..._USING_OPEN_GL | EXPERIMENTAL_FORCE_INTERPRET_HDR_AS_SDR
 ├─ transmuxAudio / transmuxVideo
 └─ sequences[i]: EditedMediaItemSequence     ── Builder(setOf(C.TRACK_TYPE_AUDIO, C.TRACK_TYPE_VIDEO))
       ├─ trackTypes, isLooping
       └─ items: EditedMediaItem | gap（addGap 生成的特殊 item）
              ├─ MediaItem (+ ClippingConfiguration)
              ├─ Effects(audioProcessors: List<AudioProcessor>, videoEffects: List<Effect>)
              ├─ setSpeed(SpeedProvider) / setFrameRate(maxFps) / setDurationUs(srcDur)
              └─ setRemoveAudio / setRemoveVideo / setFlattenForSlowMotion
```

源码里值得注意的细节：

- `EditedMediaItemSequence.Builder(EditedMediaItem...)` 和 `Builder(List)` 已经 `@Deprecated`（`TODO: b/445884217 - Remove deprecated builders`）。新代码请用 `Builder(Set<@C.TrackType Integer>)`，或者静态方法 `withAudioFrom / withVideoFrom / withAudioAndVideoFrom`。
- `addGap(long durationUs)` 的 Javadoc 写的是"The duration of the gap, in **milliseconds**"，但参数名是 `durationUs`，实现里调用的是 `setDurationUs(durationUs)`。**按实现理解为微秒**，这是文档笔误。
- `Transformer.start(Composition, path)` 注释列出的限制：
  - sequence 输出哪些轨道由 `trackTypes` 决定；缺失的轨道会生成静音音频或空白视频；
  - 如果序列以 HDR 素材开头，后面也必须都是 HDR；
  - 所有含音频的素材都要输出相同声道数的 16-bit PCM（必要时加 `ToInt16PcmAudioProcessor`、`ChannelMixingAudioProcessor`）；
  - 输出最多一路视频、一路音频；
  - 需要转码时，"the output frames' dimensions will be swapped if the output video's height is larger than the width"，Builder 上有 `setPortraitEncodingEnabled(boolean)`；
  - 同一个 Transformer 不能并发导出。
- 当有多路输入时，导出端会自动选择 `MultipleInputVideoGraph.Factory`（`VideoSampleExporter` 里是 `hasMultipleInputs ? new MultipleInputVideoGraph.Factory(...) : new SingleInputVideoGraph.Factory(...)`）。预览端要自己设置。
- 官方 Composition 指南的 "Current limitations" 一节写着 "the following operations are not yet supported when working with Compositions:"，列表项是 "Crossfading video or audio tracks"（原文是这两句，不是一句连写）。

### 5.3 编译器：Project → Composition 的映射规则

【推断/业界通用】（映射是设计；所用 API 已核验）

| Project 元素 | Composition 元素 | 说明 |
|---|---|---|
| MAIN_VIDEO 轨 | 第 0 个 sequence，`trackTypes = {AUDIO, VIDEO}` | 主轨决定总时长 |
| 片段之间的空隙 | `addGap(gapUs)` | 主轨按 I2 不该有空隙；副轨需要 |
| 片段截取 | `ClippingConfiguration.Builder().setStartPositionUs().setEndPositionUs()` | 有 Us 版本，不用丢精度到 ms |
| 素材原始时长 | `EditedMediaItem.Builder.setDurationUs(material.durationUs)` | `CompositionPlayer` 必须设 |
| 常速 / 曲线变速 | `setSpeed(SpeedProvider)` + `setFrameRate(maxFps)` | 曲线按 4.4 离散 |
| 片段音量关键帧、淡入淡出 | `Effects.audioProcessors += GainProcessor(provider)` | 见 5.9 |
| 片段滤镜、美颜、调节 | `Effects.videoEffects += [GlEffect...]` | 顺序就是执行顺序 |
| 片段内某一段时间的特效（特效轨） | `TimestampWrapper(glEffect, startUs, endUs)` | 只能包"不改变输出尺寸"的 effect；时间戳语义见下方"注意" |
| 文字 / 贴纸轨 | 全局 `OverlayEffect(List<TextureOverlay>)` | 每个 overlay 自己按时间返回透明度、变换 |
| AUDIO 轨（BGM、配音） | 纯音频 sequence：`Builder(setOf(C.TRACK_TYPE_AUDIO))` + `addGap` 定位 | 多条音频 sequence 由 `AudioMixer` 混合 |
| OVERLAY_VIDEO 轨（画中画） | 额外的视频 sequence + `setVideoCompositorSettings` | 见 5.8 的绘制顺序问题 |
| 画布尺寸、比例 | 全局 `Presentation.createForWidthAndHeight(w, h, LAYOUT_SCALE_TO_FIT)` | 另有 `LAYOUT_SCALE_TO_FIT_WITH_CROP`、`LAYOUT_STRETCH_TO_FIT` |
| 转场 | **暂无官方支持** | 方案：把交界处做成独立的"转场片段"（两段素材预合成），或者用 `MultipleInputVideoGraph` 的 overlap |

> **注意（需实测）**：片段级 effect 收到的 `presentationTimeUs` 是"片段内时间"还是"整个 Composition 的时间"，源码注释里没有直接说明。`TimestampWrapper` 和自定义 `drawFrame` 都依赖这一点。上线前请用一个"把 presentationTimeUs 画到画面上"的调试 effect 实测，并写进单元测试。

### 5.4 Kotlin 骨架：编译器 + 导出（原创）

```kotlin
@OptIn(UnstableApi::class)
class CompositionCompiler(private val fx: EffectFactory) {

    fun compile(p: Project): Composition {
        val main = p.tracks.first { it.kind == TrackKind.MAIN_VIDEO }
        val mainSeq = EditedMediaItemSequence.Builder(setOf(C.TRACK_TYPE_AUDIO, C.TRACK_TYPE_VIDEO))
            .appendSegments(p, main)
            .build()

        val audioSeqs = p.tracks
            .filter { it.kind == TrackKind.AUDIO && !it.muted && it.segments.isNotEmpty() }
            .map { EditedMediaItemSequence.Builder(setOf(C.TRACK_TYPE_AUDIO)).appendSegments(p, it).build() }

        val globalVideo = buildList<Effect> {
            fx.textAndStickerOverlays(p).takeIf { it.isNotEmpty() }?.let { add(OverlayEffect(it)) }
            add(Presentation.createForWidthAndHeight(p.canvasW, p.canvasH, Presentation.LAYOUT_SCALE_TO_FIT))
        }
        return Composition.Builder(listOf(mainSeq) + audioSeqs)
            .setEffects(Effects(/* audioProcessors= */ emptyList(), /* videoEffects= */ globalVideo))
            .build()
    }

    private fun EditedMediaItemSequence.Builder.appendSegments(p: Project, t: Track) = apply {
        var cursor = 0L
        for (s in t.segments) {
            if (s.target.startUs > cursor) addGap(s.target.startUs - cursor)   // 单位：微秒（见 5.2）
            addItem(toEdited(p, s))
            cursor = s.target.endUs
        }
    }

    private fun toEdited(p: Project, s: Segment): EditedMediaItem {
        val src = requireNotNull(s.source)
        val (uri, srcDur) = when (val m = p.materials.getValue(s.materialId)) {
            is VideoMaterial -> m.uri to m.durationUs
            is AudioMaterial -> m.uri to m.durationUs
            else -> error("unsupported ${m::class.simpleName}")
        }
        val item = MediaItem.Builder()
            .setUri(uri)
            .setClippingConfiguration(
                MediaItem.ClippingConfiguration.Builder()
                    .setStartPositionUs(src.startUs)
                    .setEndPositionUs(src.endUs)
                    .build())
            .build()
        return EditedMediaItem.Builder(item)
            .setDurationUs(srcDur)                                   // 裁剪/变速前的素材时长
            .setEffects(Effects(fx.audioFor(s), fx.videoFor(p, s)))
            .apply { speedProviderOf(s)?.let { setSpeed(it); setFrameRate(p.fps.num / p.fps.den) } }
            .build()
    }
}

/** 导出：必须在创建 Transformer 的线程（这里是主线程）上调用 */
@OptIn(UnstableApi::class)
class Media3Exporter(private val context: Context) {

    @MainThread
    suspend fun export(composition: Composition, out: File, onProgress: (Int) -> Unit): ExportResult =
        suspendCancellableCoroutine { cont ->
            val main = Handler(Looper.getMainLooper())
            val encoders = DefaultEncoderFactory.Builder(context)
                .setRequestedVideoEncoderSettings(
                    VideoEncoderSettings.Builder()
                        .setBitrate(12_000_000)
                        .setiFrameIntervalSeconds(1f)
                        .build())
                .setEnableFallback(true)              // 设备不支持时自动降级
                .build()
            lateinit var poll: Runnable
            val transformer = Transformer.Builder(context)
                .setVideoMimeType(MimeTypes.VIDEO_H264)
                .setAudioMimeType(MimeTypes.AUDIO_AAC)
                .setEncoderFactory(encoders)
                .addListener(object : Transformer.Listener {
                    override fun onCompleted(c: Composition, r: ExportResult) {
                        main.removeCallbacks(poll); if (cont.isActive) cont.resume(r)
                    }
                    override fun onError(c: Composition, r: ExportResult, e: ExportException) {
                        main.removeCallbacks(poll); if (cont.isActive) cont.resumeWithException(e)
                    }
                })
                .build()
            val holder = ProgressHolder()
            poll = Runnable {
                if (transformer.getProgress(holder) == Transformer.PROGRESS_STATE_AVAILABLE) onProgress(holder.progress)
                main.postDelayed(poll, 200)
            }
            transformer.start(composition, out.absolutePath)
            main.post(poll)
            cont.invokeOnCancellation { main.post { main.removeCallbacks(poll); transformer.cancel() } }
        }
}
```

补充：

- 导出出错时，Listener 注释说"The export output file (if any) is not deleted in this case"，要自己清理。
- `Transformer.resume(composition, newPath, oldPath)` 可以续导。条件是：单个 sequence 且音视频连续、输出 MP4、没有变速。剪映式工程大多不满足，所以后台导出被杀之后，通常只能整段重导，或者自己分段导出再拼接。
- 单素材、无特效、只裁剪的场景，可以开 `experimentalSetTrimOptimizationEnabled(true)`。官方 Transformations 指南说它用于"reduce the latency of trimming the beginning of a video"，做法是"decoding and re-encoding as little of the video as possible, then stitching the re-encoded data with the rest of the original video"；限制原文是"only works with single-asset MP4 input with no effects except no op video effects and rotations divisible by 90 degrees"，还要求编码器的 profile/level 和输入兼容；失败时"automatically falls back to normal export"，结果在 `ExportResult.OptimizationResult` 里。（原稿写的"只重编首尾 GOP"不是指南原话，指南只说优化"开头裁剪"。）
- 1.9 起默认 muxer 是 `InAppMp4Muxer`。需要平台 `MediaMuxer` 时，传 `setMuxerFactory(FrameworkMuxer.Factory)`（类名来自 1.9 博客）。

### 5.5 预览：CompositionPlayer + Compose

```kotlin
@OptIn(ExperimentalApi::class, UnstableApi::class)
class PreviewController(context: Context) {
    val player: CompositionPlayer = CompositionPlayer.Builder(context)
        .setVideoGraphFactory(MultipleInputVideoGraph.Factory())   // 有多路视频时才需要；无参构造 = DefaultVideoFrameProcessor（源码已核验）
        .build()

    fun update(composition: Composition, keepPlaying: Boolean) {
        val pos = player.currentPosition
        player.setComposition(composition)
        player.prepare()
        player.seekTo(pos)
        if (keepPlaying) player.play()
    }
    fun release() = player.release()
}
```

- `CompositionPlayer` 实现了 `Player` 接口，所以可以直接交给 Media3 的 Compose UI 组件。1.9 起 `media3-ui-compose` 提供 `ContentFrame`（同一版本新建了 `media3-ui-compose-material3`，放 Material3 风格的按钮等组件）；1.10 在 `media3-ui-compose-material3` 里加了开箱即用的 `Player` Composable（"combines a `ContentFrame` with customizable controls"）。错误统一走 `Player.Listener.onPlayerError()`，官方说明它也会报告 `Composition`、`VideoGraph.Factory` 的问题。
- **画中画预览的兜底方案**（因为多路视频预览仍在开发中）【推断/业界通用】：
  1. 主轨交给 `CompositionPlayer`，画中画片段在 Compose 层用另一个 `ExoPlayer` + `setVideoEffects` 做"近似预览"（叠在上面并同步时钟），导出时再走真正的多路合成；
  2. 或者把画中画素材做成 `TextureOverlay`：自定义 overlay 在 `getTextureId(presentationTimeUs)` 里返回自己解码出来的纹理。实现成本高，但预览和导出完全一致。
- **seek 体验**：拖动时间线时，seek 很频繁。建议节流到 30–60 ms 一次，拖动结束再做一次精确 seek。Media3 1.11 修过"seek 时 flush 导致冻结"的问题，所以 1.11 以下版本建议升级。

### 5.6 自定义 GL 特效：GlEffect / BaseGlShaderProgram

已核验的接口：

```java
public interface GlEffect extends Effect {
  GlShaderProgram toGlShaderProgram(Context context, boolean useHdr) throws VideoFrameProcessingException;
  default boolean isNoOp(int inputWidth, int inputHeight) { return false; }   // 可作为跳过的提示
}
public abstract class BaseGlShaderProgram implements GlShaderProgram {
  public BaseGlShaderProgram(boolean useHighPrecisionColorComponents, int texturePoolCapacity);
  public abstract Size configure(int inputWidth, int inputHeight);            // 返回输出尺寸
  public abstract void drawFrame(int inputTexId, long presentationTimeUs);    // 输入是 2D GL 纹理
}
```

- `useHdr` 的含义（源码注释）：`true` 表示输入颜色是 linear RGB BT.2020，`false` 表示 linear RGB BT.709。但 `OverlayEffect` 的注释又说，SDR 输入假设工作色彩空间"非线性"。所以**颜色相关的 shader（LUT、美白）一定要对照 `DefaultVideoFrameProcessor` 的工作色彩空间配置来实测**。
- 官方 demo `PeriodicVignetteShaderProgram` 是很好的模板：构造里创建 `GlProgram`，设置 `aFramePosition` = `GlUtil.getNormalizedCoordinateBounds()`；`drawFrame` 里 `use()` → `setSamplerTexIdUniform("uTexSampler", inputTexId, 0)` → 按 `presentationTimeUs` 算 uniform → `bindAttributesAndUniforms()` → `glDrawArrays(GL_TRIANGLE_STRIP, 0, 4)`。`GlProgram` 也有 `GlProgram(String vertexGlsl, String fragmentGlsl)` 构造器，可以直接内联 shader 字符串。
- 官方 Transformations 指南原文："Internally, Transformer's effects framework converts the list of video effects into a sequence of GL shader programs that are applied in order"；"one shader program can apply multiple consecutive matrix transformations, which improves efficiency and quality"。所以平移、缩放、旋转尽量用 `MatrixTransformation` / `ScaleAndRotateTransformation`，可以合并 pass。
- 内置 effect（类文件已核验存在）：`Contrast(float -1..1)`、`Brightness(float -1..1)`、`HslAdjustment.Builder().adjustHue/adjustSaturation/adjustLightness`、`RgbMatrix`、`RgbFilter`、`SingleColorLut.createFromCube(int[][][])` / `createFromBitmap(Bitmap)`、`GaussianBlur(sigma)`、`Crop`、`ScaleAndRotateTransformation`、`AlphaScale`、`LanczosResample`、`FrameDropEffect`、`TimestampWrapper`。

一个带时间窗口的美颜 effect 骨架：

```kotlin
@OptIn(UnstableApi::class)
class BigEyeEffect(private val faces: FaceTrack, private val strength: () -> Float) : GlEffect {
    override fun toGlShaderProgram(context: Context, useHdr: Boolean) = BigEyeProgram(faces, strength, useHdr)
}

@OptIn(UnstableApi::class)
class BigEyeProgram(
    private val faces: FaceTrack, private val strength: () -> Float, useHdr: Boolean,
) : BaseGlShaderProgram(/* useHighPrecisionColorComponents= */ useHdr, /* texturePoolCapacity= */ 1) {
    private val program = GlProgram(VERT, FRAG_BIG_EYE).apply {
        setBufferAttribute("aFramePosition", GlUtil.getNormalizedCoordinateBounds(), GlUtil.HOMOGENEOUS_COORDINATE_VECTOR_SIZE)
    }
    private var aspect = 1f
    override fun configure(inputWidth: Int, inputHeight: Int): Size {
        aspect = inputWidth.toFloat() / inputHeight; return Size(inputWidth, inputHeight)
    }
    override fun drawFrame(inputTexId: Int, presentationTimeUs: Long) {
        val f = faces.at(presentationTimeUs)            // 预分析结果，按时间插值；没有人脸则强度为 0
        program.use()
        program.setSamplerTexIdUniform("uTex", inputTexId, 0)
        program.setFloatsUniform("uEyeL", f?.leftEyeUv ?: floatArrayOf(-9f, -9f))
        program.setFloatsUniform("uEyeR", f?.rightEyeUv ?: floatArrayOf(-9f, -9f))
        program.setFloatUniform("uRadius", f?.eyeRadius ?: 0f)
        program.setFloatUniform("uStrength", if (f == null) 0f else strength())
        program.setFloatUniform("uAspect", aspect)
        program.bindAttributesAndUniforms()
        GLES20.glDrawArrays(GLES20.GL_TRIANGLE_STRIP, 0, 4)
    }
    override fun release() { super.release(); program.delete() }
}
```

（`VERT` 和 `FRAG_BIG_EYE` 见 9.6。）

### 5.7 文字、贴纸、Lottie：OverlayEffect

- `OverlayEffect(List<TextureOverlay>)`："Applies a list of TextureOverlays to a frame in FIFO order (the last overlay in the list is displayed on top)"。要修改列表，必须新建一个 `OverlayEffect`。
- `TextureOverlay` 的可覆写方法：`getTextureId(ptsUs)`、`getTextureSize(ptsUs)`、`getVertexTransformation(ptsUs)`、`configure(videoSize)`、`getOverlaySettings(ptsUs)`、`release()`。
- `BitmapOverlay`：实现 `getBitmap(ptsUs)` 即可；也有静态工厂 `createStaticBitmapOverlay(...)`。
- `TextOverlay`：实现 `getText(ptsUs): SpannableString`；默认 `TEXT_SIZE_PIXELS = 100`。
- `StaticOverlaySettings.Builder`：`setAlphaScale`、`setBackgroundFrameAnchor(x,y)`、`setOverlayFrameAnchor(x,y)`、`setScale(x,y)`、`setRotationDegrees`、`setHdrLuminanceMultiplier`。锚点坐标是 **NDC [-1,1]**。注释举例：背景锚点 `(1,1)` 加上 overlay 锚点 `(1,1)` 表示右上角对齐。
- 剪映式"文字在 3–5 秒出现并带入场动画"，可以写一个 `BitmapOverlay` 子类：`getOverlaySettings(t)` 在时间窗外返回 `alphaScale = 0`，窗内按关键帧返回位置、缩放、透明度；`getBitmap(t)` 只在文字内容变化时重绘并缓存。【推断/业界通用】
- Lottie 贴纸：1.10 起用 `media3-effect-lottie` 里的 `androidx.media3.effect.lottie.LottieOverlay`。

### 5.8 画中画 / 多轨合成：一个必须知道的绘制顺序问题

- `VideoCompositorSettings` 只有两个方法：`getOutputSize(List<Size> inputSizes)` 和 `getOverlaySettings(int inputId, long presentationTimeUs)`。默认实现是"输出尺寸 = 第 0 路的尺寸"。
- `DefaultVideoCompositor` 的注释（逐字）："The first registered source will be the primary stream, which is used to determine the output textures' timestamps and dimensions … textures are overlaid over one another in the reverse order of their registration order, so that **the first registered source is on the very top** … Only SDR input with the same ColorInfo are supported."
- `VideoCompositorSettings` 源码里有一条 TODO：`consider adding … a custom order for drawing (instead of primary stream on top)`。

**含义**：剪映的语义是"主轨在最底，画中画在上"，而 Media3 默认是"主序列（primary）在最上"。【推断】可能的解决办法：

1. 把画中画序列放在第 0 位当 primary，`getOutputSize` 返回主轨的尺寸。但 primary 还决定了输出时间戳，所以画中画序列必须铺满整个时长（用 gap 补）。gap 生成的"空白视频"会不会是不透明黑帧，需要实测；如果是，这个办法不可行。
2. 不依赖合成器的层序，自己写"合成 GlEffect"：主轨作为输入纹理，画中画帧作为 `TextureOverlay` 的纹理源。
3. 等官方支持自定义绘制顺序。

另外，"inputId 对应第几个 sequence"是我根据注册顺序做的推断，需要实测。

### 5.9 音频：音量曲线、淡入淡出、变速

- `GainProcessor(GainProvider)`："Applies gain automation over an audio stream"。`GainProvider` 有两个方法：`getGainFactorAtSamplePosition(samplePosition, sampleRate)`，返回 [0,1]；`isUnityUntil(...)`，用于快速跳过增益为 1 的区间。
- `DefaultGainProvider.Builder(defaultGain).addFadeAt(positionUs, durationUs, shape)`，内置形状有 `FADE_IN_LINEAR`、`FADE_OUT_LINEAR`、`FADE_IN_EQUAL_POWER`、`FADE_OUT_EQUAL_POWER`。等功率曲线配对使用时总功率保持 1，适合做音频交叉淡化。
- 剪映的"音量关键帧"可以写一个自定义 `GainProvider`：把 `AnimatedFloat` 在采样位置上求值。注意接口只允许返回 [0,1]，所以 >100% 的增益要另外实现（例如在 `AudioProcessor` 里乘系数并做限幅）。【推断】
- 变速时"保持音调"：`EditedMediaItem.Builder.setSpeed(SpeedParameters)`（`@ExperimentalApi`）带一个 `shouldMaintainPitch` 参数；`setSpeed(SpeedProvider)` 等价于 `shouldMaintainPitch = false`（源码注释）。

### 5.10 编码参数

`VideoEncoderSettings.Builder` 已核验的方法：`setBitrate`、`setBitrateMode`、`setEncodingProfileLevel`、`setiFrameIntervalSeconds`、`setEncoderPerformanceParameters(operatingRate, priority)`、`setRepeatPreviousFrameIntervalUs`、`setMaxBFrames`、`setTemporalLayers`。`DefaultEncoderFactory.Builder` 有 `setVideoEncoderSelector`、`setEnableFallback`、`setCodecPriority`、`setEnableCodecDbLite` 等。

建议的"导出档位"（剪映式的 720p/1080p/2K/4K 加帧率选择）：分辨率交给全局 `Presentation`，码率按 `bitrate ≈ w·h·fps·bpp` 估算（bpp 取 0.08–0.12，H.264），再按设备能力夹紧。【推断/业界通用】

---

## 6. 下沉一层：MediaCodec / MediaExtractor / MediaMuxer

【社区逆向/开源】（Android 官方平台文档）+【推断】

### 6.1 什么时候需要绕过 Media3

| 需求 | 原因 |
|---|---|
| 帧精确的大量缩略图（例如逐帧选封面） | `FrameExtractor` 足够；但如果要逐帧扫描，自己控制解码器更快 |
| 倒放 | 解码器只能按 GOP 前向解码，要自己做"按 GOP 倒序 + GOP 内缓存反转" |
| 音频波形 | 要拿到原始 PCM |
| 自定义容器、元数据轨 | `MediaMuxer` 从 MP4 起支持 metadata 轨（MIME 前缀有要求） |

### 6.2 平台文档里的硬规则

- **状态机**：Executing 状态下有三个子状态："Flushed, Running and End-of-Stream"。调用 `start()` 之后进入 Flushed。"Going back to Flushed state is only supported for decoders"。
- **异步模式**：配置前调用 `setCallback`，之后通过 `onInputBufferAvailable` / `onOutputBufferAvailable` 收到缓冲区。
- **Surface 输入**：编码器在 configure 之后调用 `createInputSurface()`，或者用持久化 Surface `setInputSurface(Surface)`。
- **关键帧**："the input data after start() or flush() starts at a suitable stream boundary: the first frame must be a key frame"。H.264 要 IDR；HEVC 要 IDR 或 CRA。
- **seek**：不支持 adaptive playback 的解码器（包括不解码到 Surface 的情况）在不连续输入前 "MUST flush"；支持 adaptive playback 并配置了的解码器可以不 flush，但输入仍要从关键帧开始。"flush() does not support format discontinuities"，格式变化需要完整的 stop–configure–start。
- **MediaExtractor**：典型循环是 `readSampleData → getSampleTime → advance`；seek 模式有 `SEEK_TO_PREVIOUS_SYNC / NEXT_SYNC / CLOSEST_SYNC`；`SAMPLE_FLAG_SYNC` 标记关键帧。1.9 起 Media3 提供了 `MediaExtractorCompat` 作为"direct replacement"（1.9 博客）。
- **MediaMuxer**："Currently MediaMuxer supports MP4, Webm and 3GP file as the output. It also supports muxing B-frames in MP4 since Android Nougat MR1."

### 6.3 帧精确 seek（原创伪代码）

```kotlin
/** 解码到 Surface；返回 PTS ≥ targetUs 的第一帧 */
fun seekExact(ex: MediaExtractor, dec: MediaCodec, targetUs: Long) {
    ex.seekTo(targetUs, MediaExtractor.SEEK_TO_PREVIOUS_SYNC)     // 1. 退到前一个关键帧
    dec.flush()                                                   // 2. 不连续输入 → flush（非 adaptive 时必须）
    // 3. 继续喂数据；对 PTS < targetUs 的输出帧 releaseOutputBuffer(idx, /*render=*/false) 丢掉
    // 4. 第一帧 PTS ≥ targetUs 时 releaseOutputBuffer(idx, true) 渲染，然后停止
}
```

代价：最坏情况要解码一整个 GOP。手机拍摄素材的 GOP 常见 1–2 秒，所以拖动预览时用"关键帧 seek"（快），松手后再做"精确 seek"（准）。这和 5.5 的节流策略一致。【推断/业界通用】

### 6.4 倒放（原创思路）

```
GOP 列表 = 扫描 sync sample 的 PTS（MediaExtractor + SAMPLE_FLAG_SYNC）
for gop in GOP 列表.reversed():
    seekTo(gop.start, PREVIOUS_SYNC); 解码到 gop.end，把帧存进环形缓冲（GPU 纹理或 YUV）
    逆序送进编码器（Surface 输入），PTS 改写为 outT += frameDur
内存上界 = 最大 GOP 帧数 × 单帧大小；4K GOP 太长时要先转码成短 GOP 的中间文件
```

剪映的"倒放"有一个预处理进度条，这符合"先生成倒放中间文件"的做法。这是产品观察加推断。【推断/业界通用】

---

## 7. FFmpeg 在 Android 上的现状（ffmpeg-kit 退役之后）

【社区逆向/开源】

| 事实 | 来源 |
|---|---|
| `FFmpegKit` 已正式退役，历史版本和文档保留在仓库里 | ffmpeg-kit README（"Update (July 2026)"） |
| 官方后继是 **FFmpegKitNext**，"maintained by its original author"，"distributed as source only" | 同上 |
| FFmpegKitNext 不再发布到 Maven Central / CocoaPods / pub.dev / npm，默认且推荐用 **Nix** 本地构建（Windows 用 MSYS2 / MinGW-w64），README 也写明"Building `FFmpegKitNext` without Nix is also supported"；基于 FFmpeg v6.1.x 或更高；Android 端是 **Kotlin API**；默认 LGPL 3.0，启用 GPL 库时为 GPL v3.0 | FFmpegKitNext README |
| 官方 README 指向"community-maintained forks"（Maven Central 搜索页）。例如 `com.moizhassan.ffmpeg:ffmpeg-kit-16kb:6.1.1`，这个 fork 的 README 说它只是为了"make ffmpeg-kit compatible with new android versions (API 35)"、支持 16 KB 页 | ffmpeg-kit README；该 fork 的 README |
| Google Play："all apps targeting Android 15 (API level 35) and higher must support 16 KB memory page sizes on 64-bit devices"；"Starting February 1, 2027, if your app updates don't support 16 KB memory page sizes, you won't be able to release these updates"；用 NDK r27 及更低版本构建、又没有开相关 flag 的 .so，会因 RELRO 段不对齐而 segfault | Android 16 KB 页文档 |

**架构建议**【推断/业界通用】：

1. 主路径（解码、特效、编码、封装）用 Media3 + MediaCodec，这是硬件加速、省电、包体小的路线。
2. FFmpeg 只做兜底，放进 Dynamic Feature Module 按需下载：
   - 探测和转封装少见格式（硬解不支持的编码，例如部分 ProRes、某些 MKV 音轨）→ 先转成中间文件再进入主路径；
   - 复杂音频滤镜（`loudnorm` 响度归一）、字幕烧录等离线任务。
3. 自己用 FFmpegKitNext 编译，只开需要的 decoder/demuxer，体积可以小一个数量级。用 `llvm-readelf -Wl xxx.so | grep 'RELRO\|Type'` 检查 16 KB 对齐（命令来自官方文档）。
4. 许可证：LGPL 下要动态链接，并提供替换方式；启用 x264 等 GPL 组件后整个 App 受 GPL 约束。商用 App 一般只用 LGPL 配置。

---

## 8. 渲染图：OpenGL ES 还是 Vulkan

### 8.1 平台方向

【社区逆向/开源】（Android 官方文档）

- "Vulkan is the primary low-level graphics API on Android, replacing OpenGL ES. OpenGL ES is still supported on Android, but is no longer under active feature development."
- Vulkan 从 Android 7（API 24）开始可用；"All 64-bit Android devices from Android 10 (API level 29) and higher support Vulkan 1.1"；"Eighty-five percent of active Android devices support Vulkan"；Android UI 渲染框架在兼容设备上也用 Vulkan。
- ANGLE 在 Vulkan 之上实现了符合标准的 OpenGL ES。Android 15 把 ANGLE 作为可选层，开发者选项里有 "Experimental: Enable ANGLE"。路线图是 "shipping ANGLE as the GL system driver on more new devices, with the future expectation that OpenGL/ES will be only available through ANGLE"，同时 "continue support for OpenGL ES on all devices"。
- 单个包测试 ANGLE 的命令：`adb shell settings put global angle_gl_driver_selection_pkgs <pkg>` 和 `adb shell settings put global angle_gl_driver_selection_values angle`。

### 8.2 Media3 的现状

【社区逆向/开源】

- Media3 effect 管线基于 GL：`GlShaderProgram`、`GlTextureInfo`、`GlProgram`。`CompositionPlayer.Builder` 上有 `setGlObjectsProvider` 和 `setGlThreadExecutorService`。
- 1.11.1 的 `Transformer.Builder` 和 `CompositionPlayer.Builder` 都有 `setFrameProcessorFactory(FrameProcessor.Factory)`（`@ExperimentalApi`，注释："TODO: b/449956776 - Remove once FrameConsumer API is finalized"；`CompositionPlayer.Builder` 上的版本另标 `@RequiresApi(28)`），用来处理 `HardwareBufferFrame`。release notes 里没有找到它是哪一版新增的，"1.11.1 新增"的说法未能核实。旧的 `setHardwareBufferEffectsPipeline` 在 `CompositionPlayer.Builder` 上已 `@Deprecated`（"Use setFrameProcessorFactory instead"），在 `Transformer.Builder` 上是 `@RestrictTo(LIBRARY_GROUP)`（不对外）。官方 `CompositionPlayer` 指南把"Customizing the editing pipeline with a different graphics engine"列为开发中。
- 【推断】这说明 Media3 在为"帧以 `AHardwareBuffer` 流转、由任意图形 API 处理"做准备。那正是接入 Vulkan 的通道。

### 8.3 建议

【推断/业界通用】

| 阶段 | 做法 |
|---|---|
| 现在 | 所有特效写成 GLSL ES（2.0 或 3.0）的 `GlEffect`，跟随 Media3。在 ANGLE 设备上做兼容性回归 |
| 抽象 | 自己定义 `RenderNode { inputs; params; fun render(ctx, inTex[], outTex, ptsUs) }`。GL 实现和未来的 Vulkan 实现共用"参数 + 时间 → 输出"的语义。shader 源码用 GLSL 维护，必要时通过 SPIR-V 交叉编译给 Vulkan |
| 将来 | 当 `FrameProcessor` / HardwareBuffer 管线稳定后，在 API 28+ 设备上试验 Vulkan 后端：导入 `AHardwareBuffer` 做纹理，零拷贝 |

渲染图的结构（单个片段内是链，多轨之间是 DAG）：

```
[解码 OES 纹理] → 外部纹理转 2D → [片段 effects 链: LUT → 调节 → 美颜(读 FaceTrack) → 抠像合成(读 Mask)]
                                                     │
主轨帧 ───────────────────────────────────────────────┤
画中画帧 ──[变换矩阵]────────────────────────────────►│ Compositor (按层 alpha 混合)
文字/贴纸 ─[OverlayEffect]──────────────────────────►│
                                                     ▼
                                       [全局: 特效轨 TimestampWrapper(...) → Presentation]
                                                     ▼
                                     预览 Surface / 编码器 InputSurface
```

混合公式（预乘 alpha，`C` 为预乘后的颜色）：

```
C_out = C_src + C_dst · (1 − α_src)
α_out = α_src + α_dst · (1 − α_src)
```

正片叠底、滤色等"混合模式"，按 W3C Compositing 规范的 `B(Cb, Cs)` 先算混合色，再代入上式。【推断/业界通用】

---

## 9. 美颜、人脸关键点与人像分割

【社区逆向/开源】为主（源码可证）；集成方式是【推断】。

### 9.1 GPUImage for Android（cats-oss/android-gpuimage）

- README："Goal is to have something as similar to GPUImage as possible. Vertex and fragment shaders are exactly the same"。好处是可以把 iOS GPUImage 的滤镜直接移植过来。要求 OpenGL ES 2.0；依赖坐标 `jp.co.cyberagent.android:gpuimage:2.x.x`；API 是 `GPUImage.setGLSurfaceView`、`setFilter(GPUImageSepiaFilter())`、`GPUImageView`。
- **定位**：它是一个"滤镜 shader 宝库"，可以抄 shader 逻辑（色调、锐化、双边模糊等），**但不建议把它的渲染循环引入编辑器**。它有自己的 `GLSurfaceView` 和渲染线程，会和 Media3 的 GL 上下文冲突。README 顶部的徽章还指向已经关闭的 Bintray，项目活跃度要自行评估。

### 9.2 GPUPixel（pixpark/gpupixel）

- "high-performance, cross-platform image and video filter library … Built with C++11 and OpenGL/ES, it provides beauty filters"，支持 iOS、Android、Mac、Windows、Linux，**Apache-2.0** 许可证。Android 产物用 `./script/build_android.sh` 构建成 AAR。
- 文档提示："VNN face detection library has been replaced with Mars-Face from v1.3.0-beta"。
- `BeautyFaceFilter` 是一个滤镜组：`BoxBlurFilter` → `BoxHighPassFilter` → 合成。可调属性有 `whiteness`、blur alpha、sharpen、radius；构造时 `SetTexelSpacingMultiplier(4)`、`SetRadius(4)`。也就是"盒式模糊得到低频，原图减低频得到高反差，按 mask 混合"的经典磨皮。
- `FaceReshapeFilter` 的 fragment shader 声明了 `uniform float facePoints[106 * 2]`，以及 `thinFaceDelta`、`bigEyeDelta`。瘦脸是对 9 对"轮廓点 → 目标点"做局部平移扭曲（`curveWarp`），大眼是对两只眼睛做径向放大（`enlargeEye`）。**它用的是 106 点拓扑，和 MediaPipe 的 478 点不兼容**，要自己建索引映射表。
- **集成建议**【推断】：不要直接嵌入 GPUPixel 的管线。把它的数学（见 9.6）移植成 Media3 `GlEffect`，关键点来自 MediaPipe。

### 9.3 MediaPipe Face Landmarker

源码可证的事实：

- 关键点数量：`face_blendshapes_graph.cc` 的注释写着 "478 2.5D face landmarks predicted by an Attention Mesh model"；blendshape 模型的输入是其中的 **146 个点**（`std::array<int, 146> kLandmarksSubsetIdxs`，注释 "Subset of 478 landmarks required for the HUND model"）。
- Blendshape：`std::array<absl::string_view, 52> kBlendshapeNames`，第 0 个是 `_neutral`（注释 "ignore it"），例如第 9 个是 `eyeBlinkLeft`，第 25 个是 `jawOpen`。
- Java 结果类 `FaceLandmarkerResult`：`faceLandmarks(): List<List<NormalizedLandmark>>`、`faceBlendshapes(): Optional<List<List<Category>>>`、`facialTransformationMatrixes(): Optional<List<float[]>>`、`timestampMs()`。
- 选项：`setBaseOptions`、`setRunningMode`、`setNumFaces`、`setMinFaceDetectionConfidence`、`setMinFacePresenceConfidence`、`setMinTrackingConfidence`、`setOutputFaceBlendshapes`、`setOutputFacialTransformationMatrixes`、`setResultListener`、`setErrorListener`。
- 调用：`detect(MPImage)`（IMAGE 模式）；`detectForVideo(MPImage, timestampMs)`（VIDEO 模式，适合编辑器离线分析）；`detectAsync(MPImage, timestampMs)`（LIVE_STREAM 模式，适合相机）。
- 官方 sample 的依赖是 `com.google.mediapipe:tasks-vision:1.0.0`；模型 `face_landmarker.task` 从 `https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task` 下载；GPU 用 `BaseOptions.builder().setDelegate(Delegate.GPU)`；输入用 `BitmapImageBuilder(bitmap).build()` 构造 `MPImage`。
- **变换矩阵的含义**（来自旧版 Face Mesh 文档的 Face Transform 模块）：它建立一个右手正交的"Metric 3D space"，以 **Canonical Face Model** 为静态参照，每帧"Face pose transformation matrix is estimated as a rigid linear mapping from the canonical face metric landmark set into the runtime face metric landmark set"。所以 3D 贴纸（眼镜、帽子）只要在规范脸坐标系里建模，乘以这个矩阵就能跟随人脸。旧版文档还说 attention mesh 模型"predicting landmarks more accurately around lips, eyes and irises"，适合 AR 美妆。

### 9.4 MediaPipe Image Segmenter（抠像）

- 官方 sample `download_models.gradle` 列出的四个模型（URL 已核验）：
  - `image_segmenter/selfie_segmenter/float16/1/selfie_segmenter.tflite`
  - `image_segmenter/selfie_multiclass_256x256/float32/1/selfie_multiclass_256x256.tflite`
  - `image_segmenter/hair_segmenter/float32/1/hair_segmenter.tflite`
  - `image_segmenter/deeplab_v3/float32/1/deeplab_v3.tflite`
- 旧版 Selfie Segmentation 文档：general 模型输入 256×256×3，输出 256×256×1 的 mask；landscape 模型输入 144×256×3，FLOPs 更少。
- Java API：`segment / segmentForVideo / segmentAsync`（以及带 `...WithResultListener` 的变体）；选项 `setOutputConfidenceMasks`、`setOutputCategoryMask`；结果 `confidenceMasks(): Optional<List<MPImage>>`、`categoryMask(): Optional<MPImage>`、`qualityScores()`。
- 多类模型的 6 个类别（背景、头发、身体皮肤、脸部皮肤、衣服、其他/配饰）来自搜索摘要，我**没有打开官方页面核实**。这对"只磨皮肤、不磨头发衣服"的美颜 mask 很有用。

### 9.5 ML Kit Face Mesh

- 官方 vision-quickstart sample 的依赖是 `com.google.mlkit:face-mesh-detection:16.0.0-beta3`；API 是 `FaceMeshDetection.getClient(FaceMeshDetectorOptions.Builder()...build())`，可选 `setUseCase(FaceMeshDetectorOptions.BOUNDING_BOX_ONLY)`；结果是 `List<FaceMesh>`。
- 搜索摘要显示官方页面写着"468 3D points"、仍是 beta、人脸需要在约 2 米内；**页面本身因为网络限制没能打开**。
- **选型**：编辑器场景（离线、要 blendshape、要变换矩阵）选 MediaPipe。ML Kit 适合"只要人脸网格、想要 Play 服务托管模型"的轻量场景。

### 9.6 原创 GLSL：大眼 + 磨皮（ES 2.0，可直接给 `GlProgram(String, String)`）

```glsl
// ---- VERT：全屏四边形；aFramePosition 由 GlUtil.getNormalizedCoordinateBounds() 提供 ----
attribute vec4 aFramePosition;
varying vec2 vUv;
void main() {
  gl_Position = aFramePosition;
  vUv = aFramePosition.xy * 0.5 + 0.5;
}
```

```glsl
// ---- FRAG_BIG_EYE：径向"凸透镜"——采样点向中心收缩 ⇒ 画面放大 ----
precision mediump float;
uniform sampler2D uTex;
uniform vec2  uEyeL, uEyeR;   // 纹理坐标 0..1（注意：MediaPipe 归一化坐标 y 向下，需 1-y）
uniform float uRadius;        // 以图像高度归一化的影响半径
uniform float uStrength;      // 0..1
uniform float uAspect;        // width / height
varying vec2 vUv;

vec2 bulge(vec2 uv, vec2 c, float r, float k) {
  vec2 d = uv - c;
  d.x *= uAspect;                          // 在等比空间里量距离，保证圆形影响区
  float q = length(d) / max(r, 1e-5);
  if (q >= 1.0) return uv;
  float s = 1.0 - k * (1.0 - q * q);       // q=0 时 s=1-k（收缩最多），q→1 时 s→1（无形变，边界连续）
  return c + (uv - c) * s;
}
void main() {
  vec2 uv = bulge(vUv, uEyeL, uRadius, uStrength * 0.35);
  uv      = bulge(uv,  uEyeR, uRadius, uStrength * 0.35);
  gl_FragColor = texture2D(uTex, uv);
}
```

数学说明：采样坐标映射 `p' = c + (p − c)·s(q)`，其中 `s(q) = 1 − k(1 − q²)`。在 q=1 处 s=1，所以影响区边界和外部连续，不会出现接缝。GPUPixel 的 `enlargeEye` 用的是同一类映射。

```glsl
// ---- FRAG_SMOOTH：高反差保留式磨皮 + 对数曲线美白（单 pass 近似） ----
precision mediump float;
uniform sampler2D uTex;
uniform sampler2D uSkin;      // 皮肤 mask：来自 selfie_multiclass 的脸部/身体皮肤类，或由关键点多边形光栅化
uniform vec2  uTexel;         // 1/width, 1/height
uniform float uSmooth;        // 0..1
uniform float uWhiten;        // 0..1
varying vec2 vUv;

vec3 tap(vec2 o) { return texture2D(uTex, vUv + o * uTexel).rgb; }

void main() {
  vec3 c = texture2D(uTex, vUv).rgb;
  // 低通：十字 + 对角的 13 点稀疏核（真实产品常用两遍可分离高斯或导向滤波）
  vec3 lo = c * 0.20;
  for (int i = 1; i <= 3; i++) {
    float s = float(i) * 2.5;
    float w = 0.10 / float(i);
    lo += (tap(vec2( s, 0.)) + tap(vec2(-s, 0.)) + tap(vec2(0.,  s)) + tap(vec2(0., -s))) * w * 0.5;
  }
  lo /= (0.20 + 0.10 * 2.0 * (1.0 + 0.5 + 0.3333));
  // 高反差：细节幅度大的地方（眉毛、睫毛、轮廓）少磨，幅度小（毛孔、痘印）多磨
  float detail = clamp(length(c - lo) * 6.0, 0.0, 1.0);
  float m = texture2D(uSkin, vUv).r * uSmooth * (1.0 - detail);
  vec3 r = mix(c, lo, m);
  // 美白：y = log(x·(β−1)+1)/log(β)，β∈(1, 6]
  float beta = 1.0 + 5.0 * uWhiten;
  r = log(r * (beta - 1.0) + 1.0) / log(beta);
  gl_FragColor = vec4(r, 1.0);
}
```

（核的归一化分母按实际权重和计算；为了可读性这里写成了展开式。）

### 9.7 编辑器里的集成方式：离线分析轨

```
导入素材 ──► AnalysisWorker(VIDEO 模式, 每 1/15s 抽一帧, FrameExtractor/MediaCodec→Bitmap)
            ├─ FaceLandmarker.detectForVideo(img, tMs) → 478 点 + 矩阵 + blendshapes
            └─ ImageSegmenter.segmentForVideo(img, tMs) → 低分辨率 mask（可存成小视频或 PNG 序列）
                    │ 结果按"素材时间"存盘：analysis/<materialId>/<model-version>/faces.bin
                    ▼
GlEffect.drawFrame(tex, ptsUs) ──► FaceTrack.at(素材时间)：在相邻两次结果间线性插值 + 低通去抖
```

- **为什么按素材时间缓存**：同一个素材被分割、复制、变速后，分析结果都能复用。时间映射是 `srcT = source.start + (ptsUs_in_segment)·speed`（常速）。
- 去抖可以用一阶低通或速度自适应滤波，抑制关键点在静止画面上的抖动。【推断/业界通用】
- 导出时 Transformer 的速度通常比实时快，所以必须用预先分析好的结果，不能在 `drawFrame` 里同步推理。同步推理会阻塞 GL 线程。

---

## 10. 值得研读的开源 NLE 引擎

【社区逆向/开源】

### 10.1 MLT（LGPL，Kdenlive / Shotcut 的引擎）

- 核心是"服务网络"（`mlt_service.h` 注释）："A service can have multiple inputs connections to other services called its 'producers' but only a single output to another service called its 'consumer.' A service that has both producer and consumer connections is called a filter … similar to what DirectShow calls a filter graph or what gstreamer calls an element pipeline."
- `mlt_playlist`："a sequential container of producers and blank spaces … A playlist is also a producer"。有 `hide` 属性（1 隐藏视频、2 静音、3 都隐藏），以及 `mix_in` / `mix_out`。
- `mlt_tractor`："works with the field class to manage a multitrack, track filters, and transitions"。
- `mlt_transition`："may modify the output of a producer based on the output of a second producer"。用 `a_track` / `b_track` 指定作用于哪两条轨；`_transition_type` 取 1 视频、2 音频、3 两者。
- `mlt_frame`："the primary data object that gets passed around"。可以通过 `_need_previous_next` 拿到前后帧（时域滤镜要用）。
- **可借鉴**：由 consumer 驱动的**拉模型**（播放器按需拉帧，图像计算延迟到真正取图时），以及"转场是挂在轨道对之间的服务"这种抽象。

### 10.2 libopenshot（LGPL-3.0-or-later，OpenShot 的引擎）

- 功能清单："Multi-Layer Compositing"、"Animation Curves (Bézier, Linear, Constant)"、"Time Mapping (Curve-based Slow Down, Speed Up, Reverse)"、"Audio Mixing & Resampling (Curve-based)"。
- `ClipBase`：`position`（时间线位置，秒）、`layer`（"Lower clips are covered up by higher clips"）、`start` / `end`（裁剪，秒）。
- `Clip` 上几乎每个属性都是 `Keyframe` 曲线：`scale_x/y`、`location_x/y`、`alpha`、`rotation`、`shear_x/y`、`origin_x/y`、`volume`，以及 `time`（"Curve representing the frames over time to play (used for speed and direction of video)"）。也就是说，**变速和倒放就是一条时间映射曲线**。这个思路非常适合实现剪映的"曲线变速"。
- `Timeline::ApplyJsonDiff` 用 JSON diff 和 UI 应用同步（见 4.8）；`Timeline` 持有 `final_cache`（最终帧缓存）。

### 10.3 Olive（GPL，alpha）

- README："Olive is alpha software and is considered highly unstable"；0.2 是开发版。
- 架构亮点是**整个渲染流程就是一张节点图**（`node.h`）："To render a frame, Olive will work through a node graph that can be infinitely customized by the user"。`Block` 是"A Node that represents a block of time"，`Track` 是"A time traversal Node for sorting through one channel/track of Blocks"，时间用 `rational`。
- **可借鉴**：时间线（Track/Block）和特效（节点）统一成一张图，查询"t 时刻的帧"就是对图求值。剪映的"调节层、特效轨作用于下方所有轨"在这种模型里很自然。

### 10.4 GStreamer Editing Services（GES，LGPL，Pitivi 的引擎）

- `GESTimeline` 由 `GESTrack`（定义输出类型，各提供一个 source pad）和 `GESLayer`（有优先级）组成；layer 里的 `GESClip` 负责创建 `GESTrackElement` 并加入各条 track。
- **延迟提交**："changes will not actually be taken into account in the output of the timeline's tracks until the ges_timeline_commit() method is called. This allows you to move its elements around, say, in response to an end user's mouse dragging, with little expense"。这和 3.3 里"拖动中不重编译、松手再编译"是同一个思想。
- **重叠规则**（逐字）："1. One source cannot fully overlap another source. 2. A source can only overlap the end of up to one other source at its start. 3. A source can only overlap the start of up to one other source at its end."。也就是说，同一位置最多有两个源重叠。打开 `auto-transition` 后，重叠区会自动生成 `GESTransitionClip`。
- 编辑模式枚举：`GES_EDIT_MODE_NORMAL / RIPPLE / ROLL / TRIM / SLIDE`。RIPPLE 的定义是后面的元素"will also be MOVED by the same shift"。SLIDE 在注释里标为"(not yet implemented)"。
- **可借鉴**：编辑语义（五种模式）、重叠约束、"转场 = 重叠区"的建模方式，以及 commit 节流。

### 10.5 OpenTimelineIO（Apache-2.0，交换格式）

- 层级是 `Timeline.tracks: Stack` → `Track` → `Clip | Gap | Stack | Track | Transition`；`Clip.media_reference` 可以是 `ExternalReference` 或 `MissingReference`；所有对象都带 `metadata` 字典。
- 裁剪有两层：`media_reference.available_range`（素材可用范围）和 `source_range`（剪进序列的部分），推荐用 `trimmed_range()` 取片段范围。
- **可借鉴**：把它当导入导出格式和测试夹具。本方案的 `Segment.source` 对应 `source_range`，`Material.durationUs` 对应 `available_range`。

### 10.6 对照与结论

| 维度 | 最值得抄的对象 |
|---|---|
| 数据模型和交换 | OTIO |
| 编辑语义和约束 | GES（五种编辑模式、重叠规则、commit） |
| 渲染执行模型 | MLT（拉模型、服务网络）、Olive（节点图） |
| 动画和时间映射 | libopenshot（Keyframe 三插值、`time` 曲线） |
| Android 落地 | Media3（实际运行时） |

---

## 11. 资源 / 特效包管理：下载、缓存、版本、LRU、完整性

【推断/业界通用】为主，所用 Android / Media3 API 已核验（【社区逆向/开源】）。剪映自己的资源包体系见 `research_effects.md`。

### 11.1 清单（manifest）设计

```json
{
  "id": "fx.glitch.rgbsplit",
  "version": 7,
  "minEngineVersion": 12,
  "type": "video_effect",
  "url": "https://cdn.example.com/fx/glitch_rgbsplit_v7.zip",
  "sizeBytes": 183245,
  "sha256": "9f2c…",
  "entry": "effect.json",
  "params": [{"key": "intensity", "min": 0, "max": 1, "default": 0.6}]
}
```

- `minEngineVersion`：旧 App 拿到依赖新 shader 特性的包时，直接显示"需要升级"，不要下载后再崩溃。
- 草稿里只存 `packageId + packageVersion + params`（见 4.6 的 `EffectMaterial`）。打开草稿时由资源层解析出本地路径。

### 11.2 状态机

```
            ensure()                 sha256/size OK           原子 rename
NOT_PRESENT ───────► DOWNLOADING ───────────────► VERIFIED ────────────► INSTALLED ◄── touch(lastAccess)
     ▲                   │ 网络失败/校验失败            │ zip-slip/解压失败            │
     │                   ▼                              ▼                              │ 引用计数=0 且超水位
     └──────────────── FAILED(backoff) ◄────────────────┘                              ▼
                                                                                    EVICTED
```

### 11.3 关键机制

| 机制 | 做法 | API 依据 |
|---|---|---|
| 预取 / 后台下载 | `WorkManager.enqueueUniqueWork(name = "res-$id-$ver", KEEP, request)` 防止重复入队；`Constraints.Builder().setRequiredNetworkType(NetworkType.UNMETERED).setRequiresStorageNotLow(true)`；用户点了"使用"的包走前台协程立即下载 | WorkManager 文档：`enqueueUniqueWork`，冲突策略有 REPLACE / KEEP / APPEND / APPEND_OR_REPLACE；约束有 NetworkType、BatteryNotLow、RequiresCharging、DeviceIdle、StorageNotLow |
| 断点续传 | HTTP `Range` + 临时文件 `.part` | 业界通用 |
| 完整性 | 下载完先比对 `sizeBytes`，再流式计算 SHA-256（`MessageDigest`）和 manifest 比对；**校验失败的包永远不会进入安装目录** | 业界通用 |
| 安全解压 | 每个条目 `File(staging, name).canonicalPath.startsWith(staging.canonicalPath + File.separator)`，防 zip-slip | 业界通用 |
| 原子安装 | 解压到 `.staging/<id>-<ver>`，同一分区内 `renameTo(<root>/<id>/<ver>)`，最后写索引（Room / SQLite） | 业界通用 |
| 多版本共存 | 目录按版本分开；老草稿钉住旧版本，新草稿用新版本 | 业界通用 |
| 磁盘 LRU | 索引表有 `last_access`、`bytes`、`pinned`、`ref_count`；超过上限时按 `last_access` 升序淘汰，跳过 pinned 或 ref_count>0 的包；**淘汰到上限的 80% 才停**（水位回落，避免抖动） | 业界通用 |
| 内存缓存 | 已编译的 shader、解码后的贴纸 Bitmap 用 `android.util.LruCache`，覆写 `sizeOf(K,V)` 按字节计；需要在淘汰时释放 GL 资源就覆写 `entryRemoved` | `LruCache` 文档 |
| 网络素材缓存 | 在线音乐、模板视频直接用 Media3 `SimpleCache(cacheDir, LeastRecentlyUsedCacheEvictor(maxBytes))`；注意"Only one instance of SimpleCache is allowed for a given directory at a given time" | Media3 源码 |

### 11.4 Kotlin 骨架（原创）

```kotlin
@Serializable
data class PackageManifest(val id: String, val version: Int, val minEngineVersion: Int,
                           val url: String, val sizeBytes: Long, val sha256: String, val entry: String)

class ResourceRepository(
    private val root: File,
    private val maxBytes: Long,
    private val index: PackageIndexDao,          // Room：id, version, dir, bytes, lastAccess, pinned, refCount
    private val http: Downloader,
    private val engineVersion: Int,
) {
    private val locks = ConcurrentHashMap<String, Mutex>()

    suspend fun ensure(m: PackageManifest): File = locks.getOrPut(m.id) { Mutex() }.withLock {
        require(m.minEngineVersion <= engineVersion) { "need app upgrade for ${m.id}@${m.version}" }
        index.find(m.id, m.version)?.let { e ->
            val dir = File(root, e.dir)
            if (dir.isDirectory) { index.touch(m.id, m.version, now()); return dir }
        }
        withContext(Dispatchers.IO) {
            val part = File(root, ".dl/${m.id}-${m.version}.part")
            http.download(m.url, part, resume = true)
            check(part.length() == m.sizeBytes) { "size mismatch" }
            check(sha256Hex(part).equals(m.sha256, ignoreCase = true)) { part.delete(); "sha256 mismatch" }
            val staging = File(root, ".staging/${m.id}-${m.version}").apply { deleteRecursively(); mkdirs() }
            unzipSafely(part, staging)                                  // 内含 zip-slip 检查
            val dest = File(root, "${m.id}/${m.version}").apply { parentFile?.mkdirs() }
            check(staging.renameTo(dest)) { "atomic install failed" }
            part.delete()
            index.upsert(m.id, m.version, dest.relativeTo(root).path, dirSize(dest), now())
            evictIfNeeded()
            dest
        }
    }

    /** 打开草稿时对其引用的全部包 +1，关闭时 -1；被引用的包不会被淘汰 */
    suspend fun retain(refs: List<Pair<String, Int>>) = index.addRef(refs, +1)
    suspend fun release(refs: List<Pair<String, Int>>) = index.addRef(refs, -1)

    private suspend fun evictIfNeeded() {
        var total = index.totalBytes()
        if (total <= maxBytes) return
        val lowWater = maxBytes * 8 / 10
        for (e in index.lruOrder()) {                        // ORDER BY lastAccess ASC
            if (e.pinned || e.refCount > 0) continue
            File(root, e.dir).deleteRecursively()
            index.remove(e.id, e.version)
            total -= e.bytes
            if (total <= lowWater) break
        }
    }
}
```

---

## 12. Compose 时间线 UI 技术

【推断/业界通用】（交互和结构设计）；所用 Compose API 都来自官方文档。【社区逆向/开源】

### 12.1 坐标系与缩放公式

```
x(t)   = (t − scrollUs) · pxPerUs                 时间 → 屏幕像素
t(x)   = scrollUs + x / pxPerUs                   屏幕像素 → 时间
以焦点 xf 为锚缩放（焦点下的时间不动）：
   tf = t(xf);  pxPerUs' = clamp(pxPerUs · zoom);  scrollUs' = tf − xf / pxPerUs'
剪映式"播放头固定在屏幕中线"：
   scrollUs = playheadUs − (viewportWidth/2) / pxPerUs
```

缩放范围建议从"整段视频占满一屏"到"1 帧 ≈ 40 dp"。

### 12.2 结构（从上到下）

```
┌ TimeRuler（Canvas 画刻度，刻度间隔按 pxPerUs 选 1f/5f/1s/5s/…）──────────────┐
├ Track: MAIN_VIDEO   [SegmentCell: ThumbnailStrip + 选中描边 + TrimHandles]    │
├ Track: OVERLAY ...  [SegmentCell]                                             │
├ Track: TEXT/STICKER [彩色胶囊 + 标题]                                         │
├ Track: AUDIO        [WaveformCanvas]                                          │
└ Playhead（中线，独立图层；不随内容重组）────────────────────────────────────┘
外层：垂直方向 LazyColumn（轨道多时）；水平方向自己管理 scrollUs（不用 horizontalScroll）
```

为什么水平方向不用 `LazyRow`：片段宽度随缩放连续变化，而且多条轨道要共享同一个水平滚动和缩放状态。用一个 `TimelineViewport` 状态加每条轨道的自定义 `Layout` 更直接。`LazyRow` / `LazyColumn` 适合"轨道列表"和底部的素材库。

### 12.3 关键 API 与官方性能建议

| 需求 | API | 官方文档要点 |
|---|---|---|
| 按时间摆放片段 | `Layout { measurables, constraints -> ... }` | "Compose UI does not permit multi-pass measurement"，每个子元素只能测量一次 |
| 画缩略图、波形 | `Modifier.drawWithCache { onDrawBehind { } }` | "keeps the objects that are created inside of it cached … as long as the size … or any state objects read inside are not changed" |
| 滚动、缩放引起的高频位移 | lambda 版 `Modifier.offset { IntOffset(...) }`、`drawBehind {}` | "Defer reads as long as possible"：在布局或绘制阶段读状态，可以跳过组合阶段 |
| 可见片段集合 | `derivedStateOf` | 用来限制重组次数 |
| 拖动修剪手柄 | `Modifier.pointerInput { detectDragGestures { change, dragAmount -> } }`，或 `Modifier.draggable` | 官方拖拽指南 |
| 双指缩放 | `Modifier.transformable(rememberTransformableState { zoomChange, offsetChange, rotationChange -> })` | "This modifier does not transform elements by itself, it only detects the gestures" |
| 轨道列表、素材库 | `LazyColumn` / `LazyRow` 加 `key = { it.id }`、`contentType` | 稳定的 key 能避免错位重组 |
| 自定义惰性布局 | `LazyLayout`（"A layout that only composes and lays out currently needed items"）；`LazyLayoutCacheWindow(ahead, behind)` | `LazyLayoutCacheWindow` 接口在 foundation **1.9.0** 加入（API 参考页标注 "Added in 1.9.0"）；1.13.0-alpha01 release notes 写 "Make `LazyLayoutCacheWindow` stable"；1.13.0-beta01 新增的只是它的 `isNonScrollCachingEnabled` 属性 |

### 12.4 Kotlin 骨架：视口 + 轨道行（原创）

```kotlin
@Stable
class TimelineViewport(initialPxPerUs: Float) {
    var pxPerUs by mutableFloatStateOf(initialPxPerUs)
    var scrollUs by mutableStateOf(0L)
    var viewportWidthPx by mutableStateOf(0)

    fun xOf(tUs: Long): Float = (tUs - scrollUs) * pxPerUs
    fun tOf(x: Float): Long = scrollUs + (x / pxPerUs).toLong()
    fun zoomAround(focusX: Float, factor: Float) {
        val tf = tOf(focusX)
        pxPerUs = (pxPerUs * factor).coerceIn(MIN_PX_PER_US, MAX_PX_PER_US)
        scrollUs = (tf - focusX / pxPerUs).toLong().coerceAtLeast(0L)
    }
    companion object { const val MIN_PX_PER_US = 1e-6f; const val MAX_PX_PER_US = 1e-3f }
}

/** 只组合"视口 ± 1 屏"内的片段；滚动时只触发重新布局，不重组（除非可见集合变化） */
@Composable
fun TrackRow(
    track: Track,
    vp: TimelineViewport,
    modifier: Modifier = Modifier,
    cell: @Composable (Segment) -> Unit,
) {
    val visible by remember(track) {
        derivedStateOf {
            val screenUs = (vp.viewportWidthPx / vp.pxPerUs).toLong()
            val from = vp.scrollUs - screenUs
            val to = vp.scrollUs + 2 * screenUs
            track.segments.filter { it.target.endUs > from && it.target.startUs < to } // 段多时改二分
        }
    }
    Layout(
        modifier = modifier.clipToBounds(),
        content = { visible.forEach { s -> key(s.id) { cell(s) } } },
    ) { measurables, constraints ->
        val h = constraints.maxHeight
        val placed = measurables.mapIndexed { i, m ->
            val s = visible[i]
            val w = (s.target.durationUs * vp.pxPerUs).roundToInt().coerceAtLeast(1)   // 布局阶段读状态
            s to m.measure(Constraints.fixed(w, h))
        }
        layout(constraints.maxWidth, h) {
            placed.forEach { (s, p) -> p.place(vp.xOf(s.target.startUs).roundToInt(), 0) }
        }
    }
}
```

> 说明：`derivedStateOf` 只有在计算结果"不相等"时才通知读者。这里的结果是新建的 `List`，依赖 `List.equals` 的结构比较。如果实测发现每帧都在重组，可以改成比较 id 列表，或者显式传入相等策略。

### 12.5 缩略图条：时间分桶 + LRU

**分桶公式**（让不同缩放级别命中同一批缓存）：

```
tileW      = rowHeight × (素材宽/高)                      // 每个瓦片的像素宽
tileUs     = tileW / pxPerUs × speed                       // 一个瓦片覆盖的素材时长
bucketUs   = 2^ceil(log2(tileUs))                          // 量化到 2 的幂（单位：µs）
key        = (materialId, floor(srcUs / bucketUs) × bucketUs, thumbHeightPx)
```

缩放时只有 `bucketUs` 跨越 2 的幂才会请求新缩略图；同一级别内的平移全部命中缓存。

**取帧**：用 `FrameExtractor`。注意 1.10 起它在 `media3-inspector-frame` 模块，类名是 `androidx.media3.inspector.frame.FrameExtractor`（1.9 博客示例里的 `media3-inspector` 位置已过时）。官方示例是 `FrameExtractor.Builder(context, mediaItem).build().use { it.getFrame(5000L).await(); it.thumbnail.await() }`：它实现了 `AutoCloseable`，结果是 `ListenableFuture`，要求单线程访问。建议每个素材保持一个 extractor（顺序请求时解码器可以复用），整体并发限制在 1–2 个。指南提到抽帧时可以缩放、裁剪、旋转，具体 Builder 方法和 `Frame` 的字段**我没有核验**，请查 API 参考。

**绘制**：

```kotlin
@Composable
fun ThumbnailStrip(seg: Segment, vp: TimelineViewport, cache: ThumbCache, modifier: Modifier = Modifier) {
    Spacer(modifier.fillMaxSize().drawWithCache {
        val tileW = size.height * cache.aspectOf(seg.materialId)
        onDrawBehind {
            val version = cache.version            // 新缩略图到达时 version++ → 只触发重绘
            val n = ceil(size.width / tileW).toInt()
            for (i in 0 until n) {
                val tTimelineInSeg = ((i * tileW) / vp.pxPerUs).toLong()
                val bmp = cache.peekOrRequest(seg, tTimelineInSeg, vp.pxPerUs) ?: continue  // 未命中时先画占位色
                drawImage(bmp, dstOffset = IntOffset((i * tileW).toInt(), 0),
                          dstSize = IntSize(ceil(tileW).toInt(), size.height.toInt()))
            }
        }
    })
}
```

### 12.6 波形：峰值金字塔

```
解码 PCM（MediaExtractor + MediaCodec，或 Media3 的音频管线）→ 单声道混合
L0: 每 256 个采样取 (min, max)，存成 ShortArray，写入 cache/<materialId>.peaks
Lk: 由 L(k−1) 两两合并：min=min(a.min,b.min), max=max(a.max,b.max)
绘制时：samplesPerPx = sampleRate / (pxPerUs · 10^6)
        level = clamp(floor(log2(samplesPerPx / 256)), 0, maxLevel)
        每个像素列 x 取对应区间的 min/max，画一条竖线（或拼成一条 Path，在 drawWithCache 里按缩放级别缓存）
```

存储量：1 小时、44.1 kHz 的音频，L0 约 62 万对 `Short`，约 2.5 MB；整个金字塔约为 L0 的 2 倍。音量关键帧可以在绘制时乘上 `volume.at(t)`，做到"所见即所听"。【推断/业界通用】

### 12.7 手势与吸附

- **修剪**：片段两端放 16–24 dp 的手柄，用 `pointerInput { detectDragGestures { change, drag -> ... } }`。拖动中只更新一个"临时预览状态"（UI 层），`onDragEnd` 时提交 `TrimEnd` 命令；如果要支持中途撤销，就在拖动中以 `coalesce = true` 持续提交。
- **吸附**（"磁铁"）：候选点 = {播放头, 所有片段的起止点, 节拍点, 0}。拖动边缘时求 `argmin |x − x(c)|`，小于阈值（8 dp）就吸附，并触发一次触觉反馈。候选集合可以预先排好序，用二分查找。
- **缩放**：`transformable` 的回调只给出 `zoomChange`。焦点（两指中点）需要在更底层的 `pointerInput` 里自己算，然后调用 `vp.zoomAround(focusX, zoomChange)`。
- **滚动惯性**：水平拖动时 `scrollUs -= dragPx / pxPerUs`；松手后用衰减动画（`animateDecay` 一类）继续滚动。滚动时同步调用 `player.seekTo`（节流）。
- **主轨排序**（剪映的长按拖动重排）：长按后把所有片段收缩成等宽小方块，用列表重排交互完成后，再提交 `ReorderSegments` 命令。

### 12.8 播放头同步

```kotlin
LaunchedEffect(isPlaying) {
    while (isPlaying) {
        playheadUs = player.currentPosition * 1000      // Player 接口单位是 ms
        delay(16)
    }
}
```

播放头作为独立图层，用 `Modifier.offset { }` 在布局阶段读取 `playheadUs`；时间线内容用 `scrollUs` 跟随。这样播放过程中，轨道里的片段不需要重组。

---

## 13. 落地路线图与风险清单

【推断/业界通用】

### 13.1 里程碑

| 阶段 | 目标 | 关键积木 |
|---|---|---|
| M1（2–3 周） | 单主轨：导入、分割、修剪、删除、撤销重做；`CompositionPlayer` 预览；1080p 导出 | 4.6–4.8、5.3–5.5 |
| M2 | 背景音乐和配音轨、音量关键帧、淡入淡出；缩略图和波形；吸附 | 5.9、12.5–12.7 |
| M3 | 滤镜（LUT）、调节、文字和贴纸（`OverlayEffect`、Lottie）；资源包下载和缓存 | 5.6–5.7、11 |
| M4 | 美颜（磨皮、大眼、瘦脸）、智能抠像；离线分析轨 | 9 |
| M5 | 画中画多轨（处理 5.8 的层序问题）、转场、曲线变速、倒放 | 5.8、4.4、6.4 |
| M6 | 草稿迁移、崩溃恢复、后台导出（前台服务）、机型分级（见 `research_mobile.md`） | 4.9 |

### 13.2 风险

| 风险 | 影响 | 缓解 |
|---|---|---|
| `CompositionPlayer` 是 `@ExperimentalApi`，API 可能大改 | 升级成本 | 只在 `:engine:media3` 内使用；锁定版本；写适配层和截图回归测试 |
| 官方暂不支持 crossfade 转场 | 转场功能 | 转场片段预合成，或用多序列重叠自己合成 |
| 默认合成器把 primary 画在最上 | 画中画层序 | 见 5.8；自研合成 effect |
| 片段级 effect 的时间戳语义未明确 | 特效、美颜时间错位 | 先用调试 effect 实测，并写进单测 |
| GL 色彩空间（线性还是非线性）不一致 | LUT、美白偏色 | 按工作色彩空间分支处理，做色卡回归 |
| FFmpeg 许可证、16 KB 页、维护状态 | 合规、上架 | 只做可选模块，自己编译，用 readelf 检查对齐 |
| 硬件编解码器实例数、能力碎片化 | 多轨预览卡顿或失败 | 预览降分辨率、代理文件；导出开启 `setEnableFallback(true)` |
| MediaPipe 推理阻塞 GL 线程 | 卡顿 | 离线分析轨，`drawFrame` 只查表 |

---

## 参考来源

> 下面所有 URL 都是本次调研中我实际打开过的（WebFetch 或 curl）。GitHub 源码使用的是 `raw.githubusercontent.com` 地址；Media3 源码来自 `release` 分支（1.11.1）。

**AndroidX Media3（官方文档、博客、源码）**

- https://developer.android.com/jetpack/androidx/releases/media3
- https://developer.android.com/media/media3/transformer/compositionplayer
- https://developer.android.com/media/media3/transformer/composition
- https://developer.android.com/media/media3/transformer/multi-asset
- https://developer.android.com/media/media3/transformer/transformations
- https://developer.android.com/media/media3/inspector/extract-frames
- https://developer.android.com/blog/posts/media3-whats-new
- https://developer.android.com/blog/posts/media3-1-10-is-out
- https://raw.githubusercontent.com/androidx/media/release/libraries/common/src/main/java/androidx/media3/common/MediaLibraryInfo.java
- https://raw.githubusercontent.com/androidx/media/release/libraries/common/src/main/java/androidx/media3/common/util/ExperimentalApi.java
- https://raw.githubusercontent.com/androidx/media/release/libraries/common/src/main/java/androidx/media3/common/util/GlProgram.java
- https://raw.githubusercontent.com/androidx/media/release/libraries/common/src/main/java/androidx/media3/common/MediaItem.java
- https://raw.githubusercontent.com/androidx/media/release/libraries/common/src/main/java/androidx/media3/common/VideoCompositorSettings.java
- https://raw.githubusercontent.com/androidx/media/release/libraries/common/src/main/java/androidx/media3/common/OverlaySettings.java
- https://raw.githubusercontent.com/androidx/media/release/libraries/common/src/main/java/androidx/media3/common/Effect.java
- https://raw.githubusercontent.com/androidx/media/release/libraries/common/src/main/java/androidx/media3/common/audio/SpeedProvider.java
- https://raw.githubusercontent.com/androidx/media/release/libraries/common/src/main/java/androidx/media3/common/audio/GainProcessor.java
- https://raw.githubusercontent.com/androidx/media/release/libraries/common/src/main/java/androidx/media3/common/audio/DefaultGainProvider.java
- https://raw.githubusercontent.com/androidx/media/release/libraries/common/src/main/java/androidx/media3/common/audio/ChannelMixingAudioProcessor.java
- https://raw.githubusercontent.com/androidx/media/release/libraries/common/src/main/java/androidx/media3/common/audio/ToInt16PcmAudioProcessor.java
- https://raw.githubusercontent.com/androidx/media/release/libraries/transformer/src/main/java/androidx/media3/transformer/EditedMediaItemSequence.java
- https://raw.githubusercontent.com/androidx/media/release/libraries/transformer/src/main/java/androidx/media3/transformer/EditedMediaItem.java
- https://raw.githubusercontent.com/androidx/media/release/libraries/transformer/src/main/java/androidx/media3/transformer/Composition.java
- https://raw.githubusercontent.com/androidx/media/release/libraries/transformer/src/main/java/androidx/media3/transformer/Effects.java
- https://raw.githubusercontent.com/androidx/media/release/libraries/transformer/src/main/java/androidx/media3/transformer/CompositionPlayer.java
- https://raw.githubusercontent.com/androidx/media/release/libraries/transformer/src/main/java/androidx/media3/transformer/Transformer.java
- https://raw.githubusercontent.com/androidx/media/release/libraries/transformer/src/main/java/androidx/media3/transformer/DefaultEncoderFactory.java
- https://raw.githubusercontent.com/androidx/media/release/libraries/transformer/src/main/java/androidx/media3/transformer/VideoEncoderSettings.java
- https://raw.githubusercontent.com/androidx/media/release/libraries/transformer/src/main/java/androidx/media3/transformer/ProgressHolder.java
- https://raw.githubusercontent.com/androidx/media/release/libraries/transformer/src/main/java/androidx/media3/transformer/VideoSampleExporter.java
- https://raw.githubusercontent.com/androidx/media/release/libraries/effect/src/main/java/androidx/media3/effect/GlEffect.java
- https://raw.githubusercontent.com/androidx/media/release/libraries/effect/src/main/java/androidx/media3/effect/GlShaderProgram.java
- https://raw.githubusercontent.com/androidx/media/release/libraries/effect/src/main/java/androidx/media3/effect/BaseGlShaderProgram.java
- https://raw.githubusercontent.com/androidx/media/release/libraries/effect/src/main/java/androidx/media3/effect/OverlayEffect.java
- https://raw.githubusercontent.com/androidx/media/release/libraries/effect/src/main/java/androidx/media3/effect/TextureOverlay.java
- https://raw.githubusercontent.com/androidx/media/release/libraries/effect/src/main/java/androidx/media3/effect/BitmapOverlay.java
- https://raw.githubusercontent.com/androidx/media/release/libraries/effect/src/main/java/androidx/media3/effect/TextOverlay.java
- https://raw.githubusercontent.com/androidx/media/release/libraries/effect/src/main/java/androidx/media3/effect/StaticOverlaySettings.java
- https://raw.githubusercontent.com/androidx/media/release/libraries/effect/src/main/java/androidx/media3/effect/Presentation.java
- https://raw.githubusercontent.com/androidx/media/release/libraries/effect/src/main/java/androidx/media3/effect/MatrixTransformation.java
- https://raw.githubusercontent.com/androidx/media/release/libraries/effect/src/main/java/androidx/media3/effect/GlMatrixTransformation.java
- https://raw.githubusercontent.com/androidx/media/release/libraries/effect/src/main/java/androidx/media3/effect/DefaultVideoCompositor.java
- https://raw.githubusercontent.com/androidx/media/release/libraries/effect/src/main/java/androidx/media3/effect/MultipleInputVideoGraph.java
- https://raw.githubusercontent.com/androidx/media/release/libraries/effect/src/main/java/androidx/media3/effect/TimestampWrapper.java
- https://raw.githubusercontent.com/androidx/media/release/libraries/effect/src/main/java/androidx/media3/effect/SingleColorLut.java
- https://raw.githubusercontent.com/androidx/media/release/libraries/effect/src/main/java/androidx/media3/effect/Contrast.java
- https://raw.githubusercontent.com/androidx/media/release/libraries/effect/src/main/java/androidx/media3/effect/Brightness.java
- https://raw.githubusercontent.com/androidx/media/release/libraries/effect/src/main/java/androidx/media3/effect/HslAdjustment.java
- https://raw.githubusercontent.com/androidx/media/release/libraries/effect/src/main/java/androidx/media3/effect/GaussianBlur.java
- https://raw.githubusercontent.com/androidx/media/release/libraries/datasource/src/main/java/androidx/media3/datasource/cache/LeastRecentlyUsedCacheEvictor.java
- https://raw.githubusercontent.com/androidx/media/release/libraries/datasource/src/main/java/androidx/media3/datasource/cache/SimpleCache.java
- https://raw.githubusercontent.com/androidx/media/release/demos/transformer/README.md
- https://raw.githubusercontent.com/androidx/media/release/demos/transformer/src/main/java/androidx/media3/demo/transformer/PeriodicVignetteShaderProgram.java
- https://raw.githubusercontent.com/androidx/media/release/demos/transformer/src/main/java/androidx/media3/demo/transformer/TransformerActivity.java

**Android 平台文档**

- https://developer.android.com/reference/android/media/MediaCodec
- https://developer.android.com/reference/android/media/MediaExtractor
- https://developer.android.com/reference/android/media/MediaMuxer
- https://developer.android.com/guide/practices/page-sizes
- https://developer.android.com/games/develop/vulkan/overview
- https://developer.android.com/about/versions/15/features
- https://developer.android.com/develop/background-work/background-tasks/persistent/getting-started/define-work
- https://developer.android.com/develop/background-work/background-tasks/persistent/how-to/manage-work
- https://developer.android.com/reference/android/util/LruCache

**Jetpack Compose 文档**

- https://developer.android.com/develop/ui/compose/layouts/custom
- https://developer.android.com/develop/ui/compose/graphics/draw/overview
- https://developer.android.com/develop/ui/compose/graphics/draw/modifiers
- https://developer.android.com/develop/ui/compose/touch-input/pointer-input/drag-swipe-fling
- https://developer.android.com/develop/ui/compose/touch-input/pointer-input/multi-touch
- https://developer.android.com/develop/ui/compose/lists
- https://developer.android.com/develop/ui/compose/performance/bestpractices
- https://developer.android.com/reference/kotlin/androidx/compose/foundation/lazy/layout/package-summary

**Kotlin 库**

- https://raw.githubusercontent.com/Kotlin/kotlinx.serialization/master/docs/json.md
- https://raw.githubusercontent.com/Kotlin/kotlinx.serialization/master/docs/polymorphism.md
- https://raw.githubusercontent.com/Kotlin/kotlinx.collections.immutable/master/README.md

**FFmpeg**

- https://raw.githubusercontent.com/arthenica/ffmpeg-kit/main/README.md
- https://raw.githubusercontent.com/arthenica/ffmpeg-kit-next/main/README.md
- https://raw.githubusercontent.com/moizhassankh/ffmpeg-kit-android-16KB/main/README.md

**美颜 / 滤镜**

- https://raw.githubusercontent.com/cats-oss/android-gpuimage/master/README.md
- https://raw.githubusercontent.com/pixpark/gpupixel/main/README.md
- https://raw.githubusercontent.com/pixpark/gpupixel/main/README_CN.md
- https://raw.githubusercontent.com/pixpark/gpupixel/main/docs/docs/en/index.md
- https://raw.githubusercontent.com/pixpark/gpupixel/main/docs/docs/en/guide/intro.md
- https://raw.githubusercontent.com/pixpark/gpupixel/main/docs/docs/en/guide/build.md
- https://raw.githubusercontent.com/pixpark/gpupixel/main/src/filter/beauty_face_filter.cc
- https://raw.githubusercontent.com/pixpark/gpupixel/main/src/filter/face_reshape_filter.cc

**MediaPipe / ML Kit**

- https://raw.githubusercontent.com/google-ai-edge/mediapipe/master/mediapipe/tasks/cc/vision/face_landmarker/face_blendshapes_graph.cc
- https://raw.githubusercontent.com/google-ai-edge/mediapipe/master/mediapipe/tasks/cc/vision/face_landmarker/face_landmarks_detector_graph.cc
- https://raw.githubusercontent.com/google-ai-edge/mediapipe/master/mediapipe/tasks/java/com/google/mediapipe/tasks/vision/facelandmarker/FaceLandmarker.java
- https://raw.githubusercontent.com/google-ai-edge/mediapipe/master/mediapipe/tasks/java/com/google/mediapipe/tasks/vision/facelandmarker/FaceLandmarkerResult.java
- https://raw.githubusercontent.com/google-ai-edge/mediapipe/master/mediapipe/tasks/java/com/google/mediapipe/tasks/vision/imagesegmenter/ImageSegmenter.java
- https://raw.githubusercontent.com/google-ai-edge/mediapipe/master/mediapipe/tasks/java/com/google/mediapipe/tasks/vision/imagesegmenter/ImageSegmenterResult.java
- https://raw.githubusercontent.com/google-ai-edge/mediapipe/master/docs/solutions/face_mesh.md
- https://raw.githubusercontent.com/google-ai-edge/mediapipe/master/docs/solutions/selfie_segmentation.md
- https://raw.githubusercontent.com/google-ai-edge/mediapipe-samples/main/examples/face_landmarker/android/app/src/main/java/com/google/mediapipe/examples/facelandmarker/FaceLandmarkerHelper.kt
- https://raw.githubusercontent.com/google-ai-edge/mediapipe-samples/main/examples/face_landmarker/android/app/build.gradle
- https://raw.githubusercontent.com/google-ai-edge/mediapipe-samples/main/examples/face_landmarker/android/app/download_tasks.gradle
- https://raw.githubusercontent.com/google-ai-edge/mediapipe-samples/main/examples/image_segmentation/android/category_mask/app/build.gradle
- https://raw.githubusercontent.com/google-ai-edge/mediapipe-samples/main/examples/image_segmentation/android/category_mask/app/download_models.gradle
- https://raw.githubusercontent.com/googlesamples/mlkit/master/android/vision-quickstart/app/src/main/java/com/google/mlkit/vision/demo/kotlin/facemeshdetector/FaceMeshDetectorProcessor.kt
- https://raw.githubusercontent.com/googlesamples/mlkit/master/android/vision-quickstart/app/build.gradle

**开源 NLE 引擎与交换格式**

- https://raw.githubusercontent.com/mltframework/mlt/master/README.md
- https://raw.githubusercontent.com/mltframework/mlt/master/src/framework/mlt_service.h
- https://raw.githubusercontent.com/mltframework/mlt/master/src/framework/mlt_playlist.h
- https://raw.githubusercontent.com/mltframework/mlt/master/src/framework/mlt_tractor.h
- https://raw.githubusercontent.com/mltframework/mlt/master/src/framework/mlt_transition.h
- https://raw.githubusercontent.com/mltframework/mlt/master/src/framework/mlt_frame.h
- https://raw.githubusercontent.com/OpenShot/libopenshot/develop/README.md
- https://raw.githubusercontent.com/OpenShot/libopenshot/develop/src/Clip.h
- https://raw.githubusercontent.com/OpenShot/libopenshot/develop/src/ClipBase.h
- https://raw.githubusercontent.com/OpenShot/libopenshot/develop/src/Point.h
- https://raw.githubusercontent.com/OpenShot/libopenshot/develop/src/Timeline.h
- https://raw.githubusercontent.com/olive-editor/olive/master/README.md
- https://raw.githubusercontent.com/olive-editor/olive/master/app/node/node.h
- https://raw.githubusercontent.com/olive-editor/olive/master/app/node/block/block.h
- https://raw.githubusercontent.com/olive-editor/olive/master/app/node/output/track/track.h
- https://raw.githubusercontent.com/GStreamer/gstreamer/main/subprojects/gst-editing-services/ges/ges-timeline.c
- https://raw.githubusercontent.com/GStreamer/gstreamer/main/subprojects/gst-editing-services/ges/ges-timeline-element.c
- https://raw.githubusercontent.com/GStreamer/gstreamer/main/subprojects/gst-editing-services/ges/ges-enums.h
- https://raw.githubusercontent.com/AcademySoftwareFoundation/OpenTimelineIO/main/docs/tutorials/architecture.md

---

## 未能确认 / 待补充

**本次没完成的事（因为额度和网络限制）**

1. **没有任何字节跳动一手资料**：WebSearch 额度用完前，没有搜到字节技术团队、火山引擎、掘金、InfoQ、LiveVideoStack 关于"剪映 Android 客户端架构、时间线 UI、Compose 使用情况"的文章；`juejin.cn` 和 `docs.byteplus.com` 被代理拒绝。所以第 2 节"剪映子系统"一列只是产品功能面的观察，剪映实际用了哪些开源组件、是否用 Compose，**都没有证实**。请参考姊妹章节 `research_mobile.md` 和 `research_nle.md`。
2. **MediaPipe 和 ML Kit 官方指南没能打开**（`ai.google.dev`、`developers.google.com` 被拒）：
   - Face Landmarker 指南里的模型包组成（FaceDetector 192×192、FaceMesh-V2 256×256、Blendshape 输入 1×146×2）、各模型尺寸和延迟基准，只看到了搜索摘要；
   - `selfie_multiclass_256x256` 的 6 个类别名只看到了搜索摘要；
   - ML Kit Face Mesh 的"468 点、beta、约 2 米内、约 14 ms（Pixel 3）、约 6.4 MB"只看到了搜索摘要。
   - 本章用源码代替：478 点、146 点子集、52 个 blendshape 名、Java API、模型 URL，这些都已核实。
3. **ffmpeg-kit 二进制下架的时间表**（搜索摘要说"6.0 以下到 2025-02-01、6.0 到 2025-04-01"）没有在原始页面上核实；当前 README 已经改成 2026 年 7 月版本，不再包含这张表。
4. **MLT、GES 官方网站文档没能打开**，改用源码头文件里的注释。

**需要实测才能确认的技术点**

5. 片段级 `Effects` 中 `GlEffect.drawFrame(..., presentationTimeUs)` 和 `TimestampWrapper` 用的时间戳，是片段内时间还是 Composition 时间。
6. `VideoCompositorSettings.getOverlaySettings(inputId, …)` 里的 `inputId` 是否等于 sequence 的序号；`addGap` 在视频 sequence 里生成的空白帧是透明还是黑色（决定 5.8 的方案一能否成立）。
7. `GlEffect` 输入的色彩空间：`GlEffect` 注释说是线性，`OverlayEffect` 注释说 SDR 是非线性，需要按 `DefaultVideoFrameProcessor` 的工作色彩空间实测。
8. `CompositionPlayer` 在 1.11.1 下的多视频序列预览实际表现（官方说仍在开发）。`MultipleInputVideoGraph.Factory` 有无参构造（内部用 `DefaultVideoFrameProcessor.Factory.Builder().build()`）和 `Factory(VideoFrameProcessor.Factory)` 两种，已核验；但多序列预览是否稳定未验证。
9. `FrameExtractor.Builder` 的缩放、裁剪方法名和 `FrameExtractor.Frame` 的字段名（本章没有使用这些字段名）。
10. Compose `derivedStateOf` 默认的相等策略对 `List` 结果是否按结构比较（12.4 的说明）。
11. `Transformer.setPortraitEncodingEnabled` 的确切语义（本章只确认了方法存在）。
12. 曲线变速离散成 `SpeedProvider` 阶梯后的音画同步误差，以及 40 ms 步长是否足够平滑。

**本章没有覆盖、可以作为下一轮调研的题目**

13. 草稿模型和 OTIO 的双向转换实现。
14. Vulkan 后端的具体原型（AHardwareBuffer 导入、和 Media3 `FrameProcessor` 的对接）。
15. 机型分级下的预览降级策略（代理文件、半分辨率预览），需要和 `research_mobile.md` 合并。
16. 剪映式模板（剪同款）在这套架构上怎么表达（参数化 Project + 槽位替换）。

---

## 核查记录

> 核查日期：2026-10-15。方式：逐条打开原文引用的 URL（GitHub raw 源码 / README、developer.android.com 指南和 release notes），默认怀疑，原文不支持的就降级。只用公开来源，没有访问字节 / CapCut 线上接口。本轮 WebSearch 共享额度已用完，`docs.byteplus.com` 无法解析，所以涉及 BytePlus 文档的说法没能独立复核。

**核实无误（共 22 项，按原文保留）**

1. Media3 最新稳定版 1.11.1（2026-09-10）；`MediaLibraryInfo.VERSION = "1.11.1"`；release notes 页面上 1.11.0（2026-08-05）、1.10.1（2026-05-12）、1.10.0（2026-03-26）、1.9.4（2026-05-16）的日期都对。附注：GitHub 仓库里的 `RELEASENOTES.md` 把 1.10.0 记为 2026-03-25，且没有 1.9.4 条目，和网页版有一天差异，以网页版为准。
2. `CompositionPlayer.java` 第 164 行确为 `@ExperimentalApi // TODO: b/470355043 - Publish CompositionPlayer.`；源码注释 "must be accessed from a single application thread" 也在。
3. 1.9 博客原话 "It uses the same `Composition` object that you would pass to `Transformer` for exporting"；`FrameworkMuxer.Factory`、`MediaExtractorCompat` 是 "direct replacement" 的说法也来自这篇博客。
4. 1.9.0 release notes："Publish `CompositionPlayer` under a new `@ExperimentalApi` annotation … (some undocumented)"、"Use `InAppMp4Muxer` as default muxer"、新增 `setSpeed()` 并废弃 `createExperimentalSpeedChangingEffects()`。
5. `CompositionPlayer` 指南的能力边界（三种支持场景、两项 "in active development"、显式时长要求、`SingleInputVideoGraph` / `MultipleInputVideoGraph`、只支持 `REPEAT_MODE_OFF/ALL`、`onPlayerError()`）逐条吻合。
6. 1.10.0：`LottieOverlay` 移到 `:media3-effect-lottie`，包名 `androidx.media3.effect.lottie.LottieOverlay`；`setFrameRate()` 可作最大输出帧率。
7. 1.11.0：`CompositionPlayer` 修复 `TrackSelector` 未释放；`Transformer` 修复 `ExportResult.fileSizeBytes` 多报；Effect 修复 seek 时冻结。
8. `EditedMediaItemSequence.addGap(long durationUs)` 的 Javadoc 写 "in milliseconds"，实现调用 `setDurationUs(durationUs)`；废弃构造器的 `TODO: b/445884217`；`withAudioFrom/withVideoFrom/withAudioAndVideoFrom` 存在。
9. `DefaultVideoCompositor` 注释 "the first registered source is on the very top"、"Only SDR input with the same ColorInfo are supported"；`VideoCompositorSettings` 的 TODO "custom order for drawing (instead of primary stream on top)"。
10. `Transformer.resume()` 的三个前提（单 sequence 且音视频连续、MP4 输出、无变速）；`setPortraitEncodingEnabled` 存在，"swapped if the output video's height is larger than the width" 在 start 注释里。
11. `OverlayEffect` "FIFO order (the last overlay in the list …)"；`TextOverlay.TEXT_SIZE_PIXELS = 100`；`GainProvider` 返回 "[0f; 1f]"、`isUnityUntil`；`SpeedProvider` 的 "media speed will stay the same until the next …"；`MultipleInputVideoGraph.Factory()` 无参构造和 `Factory(VideoFrameProcessor.Factory)` 都存在。
12. ffmpeg-kit README "Update (July 2026)"：已正式退役，后继 FFmpegKitNext "maintained by its original author"、"distributed as source only"；FFmpegKitNext 基于 FFmpeg v6.1.x+、Android 端 Kotlin API、默认 LGPL 3.0。
13. 社区 fork `com.moizhassan.ffmpeg:ffmpeg-kit-16kb:6.1.1`，README 原话 "only aims to make ffmpeg-kit compatible with new android versions (API 35)"。
14. 16 KB 页文档："all apps targeting Android 15 (API level 35) and higher must support 16 KB …"、"Starting February 1, 2027 …"；NDK r27 及更低版本的 RELRO 段错误说明；`llvm-readelf -Wl … | grep 'RELRO\|Type'`。
15. Vulkan 概览页："Vulkan is the primary low-level graphics API on Android, replacing OpenGL ES"、"no longer under active feature development"、"All 64-bit Android devices from Android 10 … support Vulkan 1.1"、"Eighty-five percent …"；两条 `angle_gl_driver_selection_*` adb 命令。
16. Android 15 特性页："Experimental: Enable ANGLE"，以及 "shipping ANGLE as the GL system driver on more new devices, with the future expectation that OpenGL/ES will be only available through ANGLE"、"continue support for OpenGL ES on all devices"（这两句出自 Android 15 特性页，不是 Vulkan 概览页；后者措辞是 "ultimately OpenGL ES will be available only through ANGLE"）。
17. MediaPipe `face_blendshapes_graph.cc`："478 2.5D face landmarks predicted by an Attention Mesh model"、`std::array<int, 146> kLandmarksSubsetIdxs`（"Subset of 478 landmarks required for the HUND model"）、`std::array<absl::string_view, 52> kBlendshapeNames`，第 0 / 9 / 25 个分别是 `_neutral` / `eyeBlinkLeft` / `jawOpen`。
18. mediapipe-samples 的 face_landmarker 和 image_segmentation 示例都写 `com.google.mediapipe:tasks-vision:1.0.0`；`face_landmarker.task` 和四个分割模型的 URL 和原文一致。
19. GPUPixel：Apache-2.0（LICENSE 文件）；"VNN face detection library has been replaced with Mars-Face from v1.3.0-beta"（docs/guide/intro.md）；`./script/build_android.sh` 产出 AAR；`BeautyFaceFilter` 用 `BoxBlurFilter` + `BoxHighPassFilter`、`SetTexelSpacingMultiplier(4)`、`SetRadius(4)`、`whiteness`；`FaceReshapeFilter` 有 `uniform float facePoints[106 * 2]`、`thinFaceDelta`、`bigEyeDelta`、`curveWarp`（9 对点）、`enlargeEye`。
20. android-gpuimage README："Vertex and fragment shaders are exactly the same"、`jp.co.cyberagent.android:gpuimage:2.x.x`、`setGLSurfaceView`、Bintray 徽章。ML Kit 示例依赖 `com.google.mlkit:face-mesh-detection:16.0.0-beta3`。
21. GES：`ges-timeline.c` 的三条重叠规则和 `ges_timeline_commit()` 延迟提交原文；`GES_EDIT_MODE_*` 五个枚举；RIPPLE "will also be MOVED by the same shift"。
22. 其他开源引擎原文：OTIO "A point in time at `rt.value*(1/rt.rate)` seconds"；libopenshot `ClipBase` 的 `float position/start/end` 和 "Lower clips are covered up by higher clips"；Olive "alpha software and is considered highly unstable"；MLT playlist "sequential container of producers and blank spaces"；kotlinx.serialization "has to be sealed and '@Serializable'"。

**已更正（原文与来源不符）**

- **FrameExtractor 的模块**：原稿第 1、2、3.2、12.5 节都写 `media3-inspector`。1.10.0 release notes 写着 "Breaking change: remove `FrameExtractor`. Users should now depend on the new `:media3-inspector-frame` module and update imports to `androidx.media3.inspector.frame.FrameExtractor`"，官方 extract-frames 指南的链接也指向 `inspector/frame/FrameExtractor`。基线是 1.11.1，所以已全部改成 `media3-inspector-frame`，Gradle 片段补了一行依赖。
- **`ContentFrame` 的模块**：原稿说在 `media3-ui-compose-material3`。1.9.0 release notes 写的是 "Add `ContentFrame` Composable to `media3-ui-compose`"；`media3-ui-compose-material3` 是同版本新建的 Material3 按钮模块，1.10 才在里面加 `Player` Composable。模块图和 5.5 节都已改。
- **`LazyLayoutCacheWindow` 加入版本**：原稿写 "foundation 1.13.0-beta01 加入"。API 参考页标注接口 "Added in 1.9.0"，1.13.0-alpha01 才变成稳定 API，1.13.0-beta01 新增的只是 `isNonScrollCachingEnabled` 属性。已改。
- **Trim 优化**：原稿引文 "only works for single-asset MP4 input with no effects" 被截断，又加了指南里没有的"只重编首尾 GOP"。已换成指南原文（"no effects except no op video effects and rotations divisible by 90 degrees"，优化的是"trimming the beginning"），并补上回退和 `OptimizationResult`。
- **Transformations 指南引文**：原稿的英文引号内容不是原话，已换成原句（"converts the list of video effects into a sequence of GL shader programs that are applied in order"；"one shader program can apply multiple consecutive matrix transformations"）。
- **Composition 指南 crossfade 引文**：原文是 "the following operations are not yet supported …" 加列表项 "Crossfading video or audio tracks"，原稿拼成了一句引文。已改为如实引用。
- **FFmpegKitNext 构建方式**：原稿说"要用 Nix 本地构建"。README 写 Nix 是"default and recommended"，也写了 "Building `FFmpegKitNext` without Nix is also supported"。第 1、7 节已改。
- **`setHardwareBufferEffectsPipeline` "已废弃"**：只有 `CompositionPlayer.Builder` 上是 `@Deprecated`，`Transformer.Builder` 上是 `@RestrictTo(LIBRARY_GROUP)`。`@RequiresApi(28)` 只在 `CompositionPlayer.Builder.setFrameProcessorFactory` 上看到。"1.11.1 新增"在 release notes 中找不到，已改为"都有"，并标注未能核实。
- **GES SLIDE 模式**：枚举存在，但 `ges-enums.h` 注释写着 "(not yet implemented)"。已在 4.5 和 10.4 节补注。
- **"Media3 全部接口都是 `...Us`"**：说得太绝对（`Player.currentPosition` 是毫秒，12.8 节自己也这样用）。已改为"编辑类接口以 `...Us` 为主"。

**已降级 / 标注未能核实（涉及字节跳动 / 剪映的说法）**

- 第 2 节表格原来写"剪映本身是 Model→Track→Slot→Segment→Resource"。姊妹章节的依据是 BytePlus Video Editor SDK 文档和火山引擎 Demo 里的 NLE AAR（`NLETrackSlot` 等类），这是 ToB 剪辑 SDK，不能直接等同于剪映 App 内部模型，而且本轮 `docs.byteplus.com` 无法访问，没能独立复核。已改写为"火山引擎 / BytePlus 剪辑 SDK（NLE）的模型"，并标"剪映 App 是否同构未能核实"。
- 4.8 节"剪映 NLE 的 commit/done 事务机制"同样改为"火山引擎 / BytePlus 剪辑 SDK（NLE）"，并标注未能核实它是否就是剪映 App 内部实现。
- "剪映草稿用微秒"：用 pyJianYingDraft README 和 `time_util.py`（`SEC = 1000000`）复核，属于社区逆向证据。已补上出处，等级仍是【社区逆向/开源】，没有升为【官方/一手】。
- 全文没有用到【官方/一手】标签，不需要降级标签。

**未删除任何内容**：抽查的 URL 都能打开（HTTP 200），没有发现编造的仓库、类名或链接。

**本轮没核查到的（留给下一轮）**

- `docs.byteplus.com` 上的 NLE 原文（DNS 无法解析）。
- dl.google.com Maven 元数据（代理 403），所以 `media3-inspector-frame:1.11.1` 是否已发布到 Google Maven，只有 release notes 作为依据，没有直接看到 pom。
- WorkManager、LruCache、Compose 性能指南、MediaCodec / MediaMuxer 平台文档的逐字引文：这些是通用 API，本轮没有复核。
- `selfie_multiclass_256x256` 的 6 个类别名、ML Kit "468 点"：原稿已标为"只看到搜索摘要"，本轮也没能打开官方页面。

**本轮额外打开的来源**

- https://raw.githubusercontent.com/androidx/media/release/RELEASENOTES.md
- https://developer.android.com/reference/kotlin/androidx/compose/foundation/lazy/layout/LazyLayoutCacheWindow
- https://developer.android.com/jetpack/androidx/releases/compose-foundation
- https://raw.githubusercontent.com/GuanYixuan/pyJianYingDraft/main/README.md
- https://raw.githubusercontent.com/GuanYixuan/pyJianYingDraft/main/pyJianYingDraft/time_util.py
- https://raw.githubusercontent.com/pixpark/gpupixel/main/LICENSE
