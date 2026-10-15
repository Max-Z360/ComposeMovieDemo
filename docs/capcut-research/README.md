# CapCut / 剪映 架构调研（学习用途）

> **当前是初版汇总**：只覆盖已完成的两个主题（特效/美颜/人脸、剪辑引擎）。其他主题完成后会更新本文件。
> 进度和未完成事项见 [`STATUS.md`](STATUS.md)。
>
> 全部来自公开资料：火山引擎 / BytePlus 官方 SDK 与官方 GitHub、TikTok Effect House 文档、字节技术文章、社区开源项目（如 pyJianYingDraft、CapCutAPI）。
> 没有反编译 CapCut，没有请求 CapCut 线上服务。后端不在本次范围内。
>
> 可信度标记：**【官方】** 字节/火山/BytePlus 官方代码或文档；**【社区】** 第三方开源项目或第三方观察；**【推断】** 根据以上资料推断或业界通用做法。

## 1. 一句话结论

CapCut/剪映 的剪辑和特效能力，与字节对外售卖的 **火山引擎 / BytePlus 视频剪辑 SDK（VE SDK）+ 智能美化特效 SDK（Effect SDK）** 是同一套技术【官方：BytePlus 文档称 VE SDK 用于 TikTok、抖音、CapCut 等自家产品】。
因此，研究这些 SDK 的公开头文件、Demo 和文档，是了解 CapCut 实现方式的最可靠途径。

## 2. 总体分层（初版）

```
┌──────────────────────────────────────────────────────────────────┐
│ UI 层：Android / iOS 原生；桌面版为 Qt 6 QML【社区：DLL 列表】；     │
│        Web 版为 C++ 引擎编译成 WASM + WebCodecs【官方案例摘要】      │
├──────────────────────────────────────────────────────────────────┤
│ 编辑数据模型 NLE（C++，cut::model，Model→Track→Slot→Segment→      │
│ Resource，时间单位 µs，git 式 commit/done/undo）【官方：SDK 类名】    │
│ 草稿 = 模型序列化成 JSON（draft_content.json / draft_info.json）    │
├──────────────────────────────────────────────────────────────────┤
│ NLE2VEEditor：对模型做 diff，翻译成 VEEditor 调用【官方：SDK 类名】   │
├──────────────────────────────────────────────────────────────────┤
│ 剪辑引擎 VE（libttvesdk）：数据流图                                │
│   TEPreviewGraph / TECompileGraph / TEParallelCompiler /          │
│   TEGetFrameGraph，由解码、混合、转场、显示、编码等单元组成【官方】   │
├───────────────┬──────────────────┬───────────────────────────────┤
│ 特效 Effect SDK│ 编解码             │ 音频                           │
│ (bef_effect_ai │ libttffmpeg(FFmpeg │ libaudioeffect                │
│  + Amazing 引擎)│ 3.3.2 分支)+ByteVC1│ (变调变速、降噪)                │
│               │ + MediaCodec /     │                               │
│               │ VideoToolbox       │                               │
├───────────────┴──────────────────┴───────────────────────────────┤
│ 端上推理：ByteNN / Espresso；模型有 CPU/GPU/OpenCL/CoreML/NPU 版本   │
│ 图形：AGFX（OpenGL / GLES / Vulkan）+ Metal                       │
└──────────────────────────────────────────────────────────────────┘
```

## 3. 剪辑引擎与草稿数据模型 → 详见 [`research_nle.md`](research_nle.md)

- **数据模型**【官方】：NLE SDK 是纯数据模型，本身不渲染。层级是 Model → Track → Slot → Segment → Resource，所有时间以微秒计。
- **撤销/重做**【官方】：
  - `commit()` 把修改推给预览，但不进入历史；
  - `done(msg)` 生成一条可撤销的历史记录；
  - 撤销/重做是在分支上移动 head，类似 git。
- **草稿 JSON**【社区：pyJianYingDraft、CapCutAPI】：
  - `tracks[]` 按类型分为 video / audio / text / effect / filter / sticker / adjust；
  - `segments[]` 用 `target_timerange`（在时间线上的位置）和 `source_timerange`（取素材的哪一段）描述片段，另有 `clip`（变换）、`speed`、`extra_material_refs`（引用的附加素材）、关键帧；
  - `materials{}` 下有 45～54 个分类数组；
  - 特效、转场、蒙版、动画都用 `resource_id` / `effect_id` / md5 引用云端素材库，打开草稿时按需下载。
- **模板（剪同款）**【官方类名 + 推断】：模板 = 锁定的草稿 + 可替换的占位片段（`is_placeholder` 等字段）。SDK 中由 CutSame / CutSameConsumer 把模板转换成 NLE 模型再渲染。
- **导出**【官方：SDK 参数】：编码可选 H264 / ByteVC1 / MPEG4，码控可选 CRF / QP / ABR / VBR，按分辨率档位设码率系数，可选软/硬编码，支持不重编码的 remux 和边导出边上传。
- **桌面版**【社区】：
  - 有 720p/540p 代理剪辑（`draft_agency_config.json`）和片段预渲染（`performance_opt_info.json`）；
  - 剪映 6.0+ 草稿加密，CapCut 国际版不加密。

## 4. 特效、美颜、人脸 → 详见 [`research_effects.md`](research_effects.md)

### 4.1 Effect SDK 调用流程【官方：volcengine/VolcEngineRTC 仓库内的完整头文件】

```
初始化（GL 线程）:
  bef_effect_ai_create → check_license → set_render_api(gles20/30)
  → init(w, h, modelDir) → composer_set_mode → composer_set_nodes
调参:
  composer_update_node(nodePath, key, 0..1)
每帧（纹理进、纹理出）:
  set_width_height → set_orientation → algorithm_texture（跑人脸等算法）
  → process_texture(src, dst)（渲染特效）
```

错误码里能看到内部模块名：SMASH（算法）、ESPRESSO（推理）、MOBILECV、Bach（图式算法框架）。

### 4.2 资源包【官方：Demo 仓库】

- 资源包按用途分开：
  - `LicenseBag.bundle`（授权）
  - `ModelResource.bundle`（模型，如 `tt_face_v11.1.model`）
  - `ComposeMakeup.bundle`（美颜/美型/美妆组合）
  - `FilterResource.bundle`（滤镜）
  - `StickerResource.bundle`（贴纸）
- 滤镜是 512×512 的 64³ LUT 图。
- 素材里的 config / Lua / shader 是加密的。
- **组合特效（composer）**：一个特效包对应一个节点，节点里的每个 key 是一个可调强度，取值 0～1。双向滑杆（例如可以变大也可以变小）以 0.5 为中性。key 示例：
  - 美颜：`smooth` / `whiten` / `sharp`
  - 美型：`Internal_Deform_Overall` / `Internal_Deform_Eye`
  - 美妆：`Internal_Makeup_Lips`

### 4.3 人脸关键点【官方：头文件】

- 106 点基础模型，再加二级模型补充眼睛、眉毛、嘴唇和虹膜的精细点：一共 280 点，不算虹膜是 240 点。
- 每张脸还输出每个点的可见性、yaw/pitch/roll 姿态角和跟踪 ID。
- 检测与跟踪交替进行：有人脸时每 24 帧做一次全图检测，没有人脸时每 8 帧一次，其余帧只做跟踪。
- 有 3D 人脸拟合接口，输出带 UV 的 3DMM 式网格，可用于贴妆和面具。

### 4.4 美颜与美型

- **磨皮**：shader 文件名为 `boxblur`、`var`、`epm`、`Beauty`。由此【推断】是基于局部均值和方差的引导滤波 / 保边磨皮，再用 `faceMask.png` 人脸模板保护五官。
- **美型**：Effect House 的更新日志说 Face Reshape 改用“V8 形变引擎”以减少背景扭曲，SDK 里对应的包名是 `reshape_v8_lite`【官方】。
- **CapCut 桌面版**【社区，可信度较低】：调节和美颜都是下发的 Amazing 特效包，不是写死在 App 里。其中“匀肤”是按人脸对齐裁剪后运行的神经网络模型。

### 4.5 特效运行时【官方：Effect House 公开资料】

- 与 TikTok 共用 Amazing 引擎（命名空间 `Amaz`）。
- 采用实体-组件（ECS）场景结构，用 TypeScript（APJS）写脚本。
- 同一个特效会带多套 shader：GLES / Metal / Vulkan / HLSL。

## 5. 尚在进行中的主题

见 [`STATUS.md`](STATUS.md)：移动端工程实践、文字/关键帧/转场等渲染实现、AI 功能、开源替代方案、人脸算法深入。
