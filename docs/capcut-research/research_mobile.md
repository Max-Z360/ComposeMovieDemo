# 剪映 / CapCut 移动端客户端工程实践（公开资料研究笔记）

> 用途：学习型架构研究。编写日期：2026-10-15。
> 只用公开来源：官方帮助页、BytePlus/火山引擎文档、字节官方 GitHub、字节技术文章、论文、招聘信息、开源项目。
> 没有下载或反编译剪映/CapCut 安装包，没有请求剪映/字节线上接口。签名、反爬、DRM、草稿解密、后端架构都不在本文范围。
> 姊妹章节：特效/CV SDK 见 `research_effects.md`；草稿模型、VE/NLE SDK、跨端引擎见 `research_nle.md`。本章只在必要处简要引用它们。

---

## 目录

- [0. 阅读说明：证据等级与本次调研的限制](#0-阅读说明证据等级与本次调研的限制)
- [1. 公开资料全景：关于剪映移动端，我们确切知道什么](#1-公开资料全景关于剪映移动端我们确切知道什么)
- [2. 整体 App 架构与模块化](#2-整体-app-架构与模块化)
- [3. 编辑页架构：时间轴、缩略图、波形、手势、预览](#3-编辑页架构时间轴缩略图波形手势预览)
- [4. 性能工程：启动、内存/OOM、预览卡顿、包体积](#4-性能工程启动内存oom预览卡顿包体积)
- [5. 动态下发：so、AI 模型、特效资源](#5-动态下发soai-模型特效资源)
- [6. Android 碎片化与机型分级](#6-android-碎片化与机型分级)
- [7. 导出可靠性：后台导出与编码器回退](#7-导出可靠性后台导出与编码器回退)
- [8. 稳定性与监控](#8-稳定性与监控)
- [9. 字节开源移动基础设施核验表](#9-字节开源移动基础设施核验表)
- [10. 招聘信息里的技术栈线索](#10-招聘信息里的技术栈线索)
- [11. 给学习者：在自己的 Demo 中复刻的优先级](#11-给学习者在自己的-demo-中复刻的优先级)
- [参考来源](#参考来源)
- [未能确认 / 待补充](#未能确认--待补充)

---

## 0. 阅读说明：证据等级与本次调研的限制

### 0.1 证据等级标记

| 标记 | 含义 |
|---|---|
| 【官方/一手】 | 字节、剪映、CapCut、BytePlus/火山引擎的官方文档、帮助页、官方 GitHub、团队署名文章、官方招聘信息，以及字节员工署名论文 |
| 【社区逆向/开源】 | 第三方开源项目、第三方技术文章、第三方对剪映的观察或推测 |
| 【推断/业界通用】 | 作者根据平台文档和行业通行做法推理得出，**没有**公开资料证明剪映这样做 |

### 0.2 两种取证方式（务必区分）

- **[已打开]**：作者直接读到了原文，包括 GitHub 仓库、developer.android.com、developer.apple.com。
- **[检索摘要]**：本次环境的网络策略屏蔽了大部分中文站点和部分官网，包括 juejin.cn、csdn.net、capcut.com、docs.byteplus.com、volcengine.com、arxiv.org、v2ex.com、nowcoder.com。这些来源只能通过搜索引擎返回的摘要获取内容，**作者没有打开原文**。凡是标了 [检索摘要] 的结论，都建议在可以访问这些站点的环境中复核原文。

### 0.3 本章最重要的一句话

剪映/CapCut 团队**很少**公开发表移动端工程文章。本次能找到的一手材料只有四类：

1. 一篇约 2020 年底的剪映技术团队招聘软文；
2. CapCut 官方帮助页；
3. BytePlus VE SDK 文档；
4. 字节开源仓库的 README。

所以本章很大比例是【推断/业界通用】。每节开头都标明了证据等级，请按等级取用。

---

## 1. 公开资料全景：关于剪映移动端，我们确切知道什么

F1–F12 为【官方/一手】，但除 F12 外均为 [检索摘要]。F13、F14 来自第三方论坛帖（牛客、V2EX 内推帖），不是官方招聘页，证据等级降为【社区逆向/开源】。

> 2026-10-15 核查：S1（CSDN）、S2（docs.byteplus.com）、S3（capcut.com）、S8（v2ex.com）、S9（nowcoder.com）在核查环境中同样无法访问，下表标"（未能核实）"的行均未能对照原文。

| # | 事实 | 来源 | 取证 |
|---|---|---|---|
| F1 | 早期视频导出失败率约 4%。团队按错误原因统计并快速迭代，两个版本后降到 1% | 剪映技术团队招聘文章（CSDN 转载）[S1] | 检索摘要（未能核实） |
| F2 | 团队做了代码分析，采用**内存复用 + 编码与渲染并行**的框架，大幅缩短导出耗时 | 同上 [S1] | 检索摘要（未能核实） |
| F3 | 为控制包体增量并保证性能，团队**没有引入软编解码器**，用 Android/iOS 平台编解码 API 做硬编/硬解（这是约 2020 年的说法，见 §4.4 的矛盾说明） | 同上 [S1] | 检索摘要（未能核实） |
| F4 | 有一套**机型评估组件**，分析机型的性能、帧率、内存等指标并制定调优策略。**机型打分平台**积累了数万款机型的数据 | 同上 [S1] | 检索摘要（未能核实） |
| F5 | 4K 对编解码速度、内存、特效渲染压力很大。底层做了大量调优，约一年内把 4K 导出耗时做到行业较优 | 同上 [S1] | 检索摘要（未能核实） |
| F6 | 有一套自动化基础设施：用模板用例生成视频，再用 **CV 技术检测**渲染错误、兼容性问题、黑屏和花屏，用于回归 | 同上 [S1] | 检索摘要（未能核实） |
| F7 | 项目早期对编辑场景做了**非编架构重构**，为画中画、贴纸等功能预留架构空间 | 同上 [S1] | 检索摘要（只在一次检索摘要中出现，后续检索未复现）（未能核实） |
| F8 | 手机上锁屏或切换应用会暂停渲染；过热会降频；可把导出从 4K 降到 1080p | CapCut 帮助页 [S3] | 检索摘要（未能核实） |
| F9 | 手机导出受阻的原因包括可用 RAM 有限、存储空间不足；Android 上建议降低分辨率或帧率 | CapCut 帮助页 [S3] | 检索摘要（未能核实） |
| F10 | 2K/4K 导出选项取决于设备硬件、操作系统、App 版本和平台 | CapCut 帮助页 [S3] | 检索摘要（未能核实） |
| F11 | VE SDK Android 导出参数里，`useHWEncoder` 和 `isSupportHWEncoder` 由业务方指定，**也可以由云端白名单/黑名单控制**。另有 `softwareDecode` 开关，默认 `DEFAULT_HW_SUPPORT = true` | BytePlus VE SDK 文档 [S2] | 检索摘要。`useHWEncoder`、`isSupportHWEncoder` 两个字段名可由姊妹章节 `research_nle.md` §3.5 对公开 NLE aar（`NLEVideoCompileEncodeSettings`）的分析佐证；"云端白名单/黑名单控制"、`softwareDecode`、`DEFAULT_HW_SUPPORT` 三点（未能核实） |
| F12 | 字节开源的 native 内存泄漏检测工具 Raphael（memory-leak-detector）README 的 "Apps using" 列表里有**剪映**图标（`docs/jianying.png`） | GitHub [R1] | **已打开**（2026-10-15 复核 README.md 与 README_cn.md，均含 `docs/jianying.png`） |
| F13 | 剪映研发团队同时支持剪映、CapCut、即梦、醒图等产品。校招方向包括前端、后端、**C++ 客户端、多媒体客户端、图形图像算法** | 牛客 2025 校招帖 [S9]【社区逆向/开源】 | 检索摘要（未能核实） |
| F14 | 剪映/CapCut 社区方向的 Android 岗位要求 Java/Kotlin，并负责**统一 Lynx 容器建设**。另一位招聘者描述其团队"负责剪映与 CC 两个 App 的移动端迭代"（广州/深圳） | V2EX 内推帖 [S8]【社区逆向/开源】 | 检索摘要（未能核实） |

**没有找到的**（详见文末）：

- 剪映署名的启动优化、包体积、ANR、OOM、预览卡顿专项文章；
- 剪映在 QCon、GMTC、LiveVideoStackCon 的移动端演讲；
- 剪映使用 bhook、btrace、ByteX 的公开声明。

---

## 2. 整体 App 架构与模块化

### 2.1 产品形态

【官方/一手】[检索摘要]

- **起源与更名**：CapCut 2019 年在中国以"剪映"上线。2020 年英文名从 ViaMaker 改为 CapCut 并全球发布 [S15]（未能核实：核查环境无法访问 Wikipedia）。
- **包名**：Google Play 上 CapCut Android 包名为 `com.lemon.lvoverseas`，CapCut Pad 为 `com.lemon.ccpadpro`（来自 Play 链接 [S15]）（未能核实：核查环境无法访问 play.google.com，包名仅来自链接中的 `id=` 参数）。
  - 包名前缀 `lemon`、`lv` 与发行主体有关；`lv` 的含义没有公开资料，不做推测。
- **多端**：2021 年报道称剪映适配 Pad、Mac、Windows，并计划三端草稿互通 [S16]。跨端引擎细节见 `research_nle.md` §5–8。
- **系统要求**：
  - 剪映 iOS 版在 App Store 显示需 iOS 13.0+，CapCut iOS 显示 iOS 15.0+。两条都是检索摘要，快照时间未知 [S17]（未能核实）。
  - APKMirror 上 2021–2022 年的 CapCut 安装包显示最低 Android 5.0（API 21），并且是 `arm64-v8a + armeabi-v7a` 合包。较新版本未能确认 [S13]（未能核实）。

### 2.2 分层架构（推断）

【推断/业界通用】，各层的证据另行标注。

```
┌──────────────────────────────────────────────────────────────────────┐
│ 壳层 / 业务层（Android: Kotlin/Java；iOS: ObjC/Swift）              │
│  ├─ 首页/素材导入/相册  ├─ 编辑页(Editor)  ├─ 剪同款/模板          │
│  ├─ 社区/创作者中心 ← Lynx 容器【招聘帖 S8，检索摘要】              │
│  └─ AI 功能入口（字幕、抠像、配音……）                               │
├──────────────────────────────────────────────────────────────────────┤
│ 编辑领域层：草稿模型 + 命令/事务 + Undo/Redo                         │
│  NLE（C++，Model→Track→Slot→Segment）【官方类名，见 research_nle】   │
├──────────────────────────────────────────────────────────────────────┤
│ 媒体引擎：VE SDK（预览图/导出图、解码、合成、编码）【见 research_nle】│
│ 特效引擎：Effect SDK / Amazing【见 research_effects】                │
├──────────────────────────────────────────────────────────────────────┤
│ 基础设施（推断，均为字节系通用能力，未证实剪映具体接入方式）         │
│  资源/模型下发 · 机型评估【F4】 · APM/崩溃 · native hook · 网络 · 存储 │
│  Raphael（native 泄漏）【F12，已打开】                                │
└──────────────────────────────────────────────────────────────────────┘
```

**分层要点（推断）**

1. **编辑领域层和 UI 解耦。**
   - UI 只发"意图"，例如移动片段或裁剪；领域层生成事务。
   - 事务提交后通知两个消费者：时间轴 UI 重绘，预览引擎增量更新。
   - `research_nle.md` §3.3 记录了 NLE 的 `commit()` / `done()` 区分：前者只推给预览，后者进入撤销历史。这正适合拖动手势：拖动过程中只 `commit`，抬手后 `done`。
2. **业务模块化。**
   - 编辑器、模板、社区、AI 功能更可能作为独立模块，或独立容器（Lynx）。
   - 招聘帖提到"统一 Lynx 容器建设"[S8]，说明至少社区类页面使用了跨平台动态化容器。**编辑页是否用 Lynx 没有证据**；按常理，编辑页是重交互、重原生渲染的页面，大概率仍是原生实现。
3. **C++ 内核共享**：多端共享 C++ 内核是 `research_nle.md` 的结论。招聘方向里的"C++ 客户端 / 多媒体客户端 / 图形图像算法"[S9] 与之吻合。

### 2.3 "非编架构重构"的含义（推断）

F7 提到早期为画中画、贴纸做了非编架构重构。【推断】它很可能对应从"单轨线性拼接"到"多轨叠加"的模型转变：

```
早期（单轨）：  [clip1][clip2][clip3]   → 只需顺序解码 + 转场
非编（多轨）：  主轨   [clip1][clip2][clip3]
               画中画     [pip1]  [pip2]
               贴纸    [s1][s2]
               文字         [t1]
               音频   [bgm.............]
               → 每一帧要求出"此刻有哪些轨道片段可见"，再按 z 序合成
```

多轨合成的核心查询是"给定时刻 t，哪些片段处于激活状态"。数据结构通常是"每轨有序数组 + 二分查找"，或者区间树（见 §3.3）。

---

## 3. 编辑页架构：时间轴、缩略图、波形、手势、预览

> 证据等级：本节以【推断/业界通用】为主。
> 剪映没有公开编辑页的实现文章。可引用的一手线索是 VE SDK 的类名和方法名：`VERTAudioWaveformMgr`、`HwFrameExtractor`、`enableOptPlayBackDropFrame`、`setDropFrameParam`、`enableSeekAndPreloadOpt`。这些名字由 `research_nle.md` 从公开 aar 整理：`VERTAudioWaveformMgr` 与 `HwFrameExtractor` 在其 §4.1（`HwFrameExtractor` 另见 §4.3），`enableOptPlayBackDropFrame` / `setDropFrameParam` / `enableSeekAndPreloadOpt` 在其 §4.2。该 aar 是第三方 Demo 仓库里的火山引擎对外版（tob）VE SDK，不是剪映 App 本体。本章没有重复核验。
> 平台 API 部分为【官方/一手】，已在 developer.android.com / developer.apple.com 打开核对。

### 3.1 编辑页的组成与数据流

```
            ┌────────────────────── 编辑页 ──────────────────────┐
            │  ┌────────────── 预览区 PreviewSurface ─────────┐   │
            │  │ SurfaceView / TextureView（Android）          │   │
            │  │ CAMetalLayer / MTKView（iOS）                 │   │
            │  └──────────────▲───────────────────────────────┘   │
            │                 │ 渲染帧                              │
  手势 ───► │  ┌──────────────┴─────────── 时间轴 Timeline ───┐   │
            │  │ 标尺 | 主轨(缩略图条) | 音频(波形) | 文字/贴纸 │   │
            │  │        ▲ 居中播放头（固定）                    │   │
            │  └────────┼─────────────────────────────────────┘   │
            │  底部面板：分割/变速/音量/动画/滤镜……               │
            └────────────────────────────────────────────────────┘

  Intent(拖动/裁剪/分割) ─► EditController ─► 草稿模型(事务)
                                    │commit(拖动中)        │done(抬手)
                                    ▼                      ▼
                         PreviewEngine.update()      UndoStack.push()
                                    │
                         TimelineState(派生) ─► 时间轴重绘
```

【推断】设计原则：

- 时间轴 UI 状态是草稿模型的**派生**（单一数据源）。
- 时间轴只负责"时间 ↔ 像素"映射和命中测试，不持有业务真值。

### 3.2 时间轴坐标系

【推断/业界通用】

剪映类 App 的常见交互是**播放头固定在屏幕中线，内容在底下滚动**（这是可以直接观察到的 UI 行为）。设：

- `s`：缩放比例，单位 px/µs（或 px/s）；
- `t_p`：播放头对应的时间线时刻；
- `W`：时间轴可视宽度。

时间线时刻 `t` 对应的屏幕横坐标是：

```
x(t) = W/2 + (t − t_p) · s
t(x) = t_p + (x − W/2) / s
```

**捏合缩放**时要保持焦点下方的时刻不动。播放头居中时，焦点通常取播放头；一般情况下取双指中点 `f`：

```
t_f   = t(f)                         // 缩放前焦点时刻
s'    = clamp(s · k, s_min, s_max)   // k 为本帧捏合比例
t_p'  = t_f − (f − W/2) / s'         // 解出新的播放头时刻，使 t_f 仍在 f 处
```

`s_min` 和 `s_max` 的取值：

- `s_min` 让整条时间线能在约一屏内显示；
- `s_max` 让单帧宽度达到若干 dp，便于逐帧对齐（例如 30fps 时一帧约 33.3ms）。

**标尺刻度**：选择"人类友好"的步长。给定期望的最小刻度间距 `g`（像素），从 `{1帧, 0.1s, 0.5s, 1s, 2s, 5s, 10s, 30s, 60s …}` 中挑第一个满足 `step · s ≥ g` 的步长。

**吸附**：拖动片段边缘时，把候选吸附点放进一个有序数组，二分查找最近点：

- 候选点包括播放头、其他片段起止点、节拍点（卡点功能）、关键帧；
- 若 `|x_edge − x_snap| < δ`（例如 8dp），就吸附到该点，并触发一次触觉反馈；
- 阈值按**像素**定义，不按时间定义，这样在任何缩放级别下手感一致。

### 3.3 多轨布局：片段放在哪一"行"

【推断/业界通用】

画中画、文字、贴纸、特效这类叠加轨，在剪映中表现为"新加入的元素若与已有元素重叠，就放到新的一行"。这是**区间划分（interval partitioning）**问题，用贪心法即可：

```kotlin
// 原创伪代码：把叠加元素分配到最少的行（lane），重叠的放不同行
data class Item(val id: String, val start: Long, val end: Long)

fun assignLanes(items: List<Item>): Map<String, Int> {
    val sorted = items.sortedBy { it.start }
    // laneEnd[i] = 第 i 行当前最后一个元素的结束时间
    val laneEnd = java.util.PriorityQueue<Pair<Long, Int>>(compareBy { it.first })
    val result = HashMap<String, Int>()
    var laneCount = 0
    for (it in sorted) {
        val top = laneEnd.peek()
        val lane = if (top != null && top.first <= it.start) {
            laneEnd.poll().second          // 复用最早空出的那一行
        } else laneCount++                 // 开新行
        result[it.id] = lane
        laneEnd.add(it.end to lane)
    }
    return result
}
```

注意：真实产品通常**保留用户手动选择的行**，不会每次全量重排，否则用户拖过的元素会"跳行"。所以贪心只在"新增元素"时用于选初始行。

渲染时只绘制可见区间。可见时间窗 `[t(0), t(W)]` 内的片段，用"每行一个按 start 排序的数组 + 二分"即可在 O(log n + k) 内取出。

### 3.4 缩略图条（Thumbnail Strip）

#### 3.4.1 平台 API

【官方/一手】[已打开]

| 平台 | API | 要点 |
|---|---|---|
| Android | `MediaMetadataRetriever.getFrameAtTime(long timeUs, int option)` | `OPTION_CLOSEST_SYNC`（值 2）取离目标最近的**关键帧**；`OPTION_CLOSEST`（值 3）取最近的任意帧，但可能要从前一个关键帧开始解码，较慢。两者均为 API 10 [R16] |
| Android | `getScaledFrameAtTime(long, int, int dstWidth, int dstHeight)` | API 27 新增，直接按目标尺寸取帧；带 `BitmapParams` 的重载为 API 30 [R16] |
| Android | `getFramesAtIndex(int frameIndex, int numFrames)` | API 28 新增，按帧序号批量取连续帧 [R16] |
| iOS | `AVAssetImageGenerator` | iOS 4.0+，"从视频资源的时间线上指定时刻提取图像" [R31] |
| 双端（引擎内） | MediaCodec / VideoToolbox 自解码 + GPU 缩放 | VE SDK 有 `HwFrameExtractor` 类名（见 research_nle §4.3），说明引擎内有专门的硬解抽帧器【官方类名，未核验其行为】 |

**为什么自研抽帧器往往比 `MediaMetadataRetriever` 好（推断）**

- `MediaMetadataRetriever` 每次调用都是独立的 seek + 解码，没有跨调用的解码器复用。
- 时间轴缩略图是按时间**单调递增**的批量请求。用一个常驻 MediaCodec 顺序解码，只在需要的时间点输出，吞吐会高很多。

#### 3.4.2 采样算法：让缓存跨缩放级别复用

【推断/业界通用】

设缩略图在时间轴上的宽度是 `w_t`（px），片段在时间线上从 `T0` 开始，变速倍率为 `v`（常速）。第 `i` 个格子对应的**源时间**是：

```
timeline_i = T0 + (i + 0.5) · w_t / s          // 取格子中心
source_i   = srcIn + (timeline_i − T0) · v      // 常速；曲线变速需对速度曲线积分
```

如果直接按 `source_i` 抽帧，每次缩放都会产生一批全新的时间点，缓存全部失效。

**常用解法是量化到 LOD 网格**：

```
Δ_tile = w_t / s · v                       // 一个格子覆盖的源时长
L      = max(0, ceil(log2(Δ_tile / Δ_base)))   // LOD 级别，Δ_base 例如 1/30 s
grid   = Δ_base · 2^L
key_i  = round(source_i / grid) · grid     // 量化后的抽帧时刻
cacheKey = (assetId, key_i, thumbW, thumbH)
```

效果：

- 缩放比例变化不足 2 倍时，`grid` 不变，缓存键不变，可以直接复用；
- 放大一级时，一半的格子能命中上一级的缓存。

**内存预算**（推断，按常见尺寸估算）：

- 一张 96×96 ARGB_8888 缩略图 = 96×96×4 = 36,864 B ≈ 36 KB；用 RGB_565 减半，约 18 KB。
- 屏幕可见约 15 格 × 若干轨，加上左右各一屏的预取，约 100 张，ARGB 约 3.6 MB。
- 再配一个更大的磁盘缓存（JPEG/WebP），跨会话复用。

**优先级调度（推断）**：

- 解码队列按"是否可见 > 距离播放头的距离 > 请求时间"排序；
- 快速滑动时丢弃已经滑出视窗的请求；
- 先返回关键帧级别的近似图（`OPTION_CLOSEST_SYNC` 语义），空闲时再补精确帧。

【未确认】检索到一件美国专利 US 12,573,428（"Video processing method, apparatus, and electronic device"）（未能核实：USPTO 与 Google Patents 在核查环境中均不可访问，专利号、标题和权利要求都没有对照原文）。检索摘要称其权利要求是：按"轨道是否位于显示区域""帧是否在时间轴范围内"确定多轨片段帧图像的**缓存优先级**。这与上述做法一致，但**未能确认其受让人是否为字节/Lemon**，所以只作旁证 [S21]。

### 3.5 音频波形

【推断/业界通用】

VE SDK 公开类名里有 `VERTAudioWaveformMgr`（见 research_nle §4.1），说明波形由引擎侧提供数据，UI 侧负责绘制。下面是通用做法。

**① 预计算峰值金字塔**

把 PCM（例如 44.1kHz）按块大小 `B0`（例如 256 个样本）求每块的 `(min, max)`，得到第 0 级。之后每级合并相邻两块：

```
level0[k] = (min, max) over samples [k·B0, (k+1)·B0)
levelL[k] = (min(levelL-1[2k].min, levelL-1[2k+1].min),
             max(levelL-1[2k].max, levelL-1[2k+1].max))
```

**② 绘制时选级别**

每个像素覆盖 `spp = sampleRate / s_sec` 个样本（`s_sec` 为 px/s）。选 `L = floor(log2(spp / B0))`，每像素取 1 个或少量几个块再合并。

**③ 存储量估算**

- 44.1kHz 下，`B0 = 256` 时第 0 级每秒约 172 个峰值。
- 10 分钟音频共约 103k 个峰值；用 int16 存 `(min, max)`，约 413 KB。
- 整个金字塔不超过第 0 级的 2 倍，约 0.8 MB。可以落盘缓存，避免重复解码。

**④ 视觉映射**

- 线性幅度在人声场景下显得很"扁"，常用 dB 映射：`y = clamp((20·log10(|a|) + 60)/60, 0, 1)`，即 −60dB 到 0dB 映射到 0 到 1。
- 也可以用平方根这类压缩曲线。
- 波形有 `(min, max)` 时画对称竖线；只有 RMS 时画包络。

```kotlin
// 原创伪代码：Android Canvas 绘制可见区间的波形
fun drawWaveform(c: Canvas, peaks: PeakPyramid, tStartUs: Long, pxPerSec: Float, h: Float) {
    val spp = peaks.sampleRate / pxPerSec            // 每像素样本数
    val level = peaks.levelFor(spp)                  // 选 LOD
    val mid = h / 2
    for (x in 0 until width) {
        val t0 = tStartUs + (x / pxPerSec * 1e6).toLong()
        val t1 = tStartUs + ((x + 1) / pxPerSec * 1e6).toLong()
        val (mn, mx) = level.range(t0, t1)           // 合并该像素覆盖的块
        c.drawLine(x.toFloat(), mid - mx * mid, x.toFloat(), mid - mn * mid, paint)
    }
}
```

【推断】更省电的做法是：把波形预渲染成**按 LOD 分块的位图瓦片**，滚动时只平移瓦片。也可以把峰值数组作为 1D 纹理，交给 GPU 用一个片元着色器画出来。

### 3.6 手势体系

【推断/业界通用】

时间轴上的手势冲突非常多。常见的状态机如下：

```
            ACTION_DOWN
                │
     ┌──────────┼───────────────┬───────────────────┐
     ▼          ▼               ▼                   ▼
 命中裁剪手柄  命中片段        命中空白/片段        第二指按下
     │       (长按 300ms)      (水平移动>touchSlop)    │
     ▼          ▼               ▼                   ▼
   TRIM       DRAG           SCROLL(+fling)        PINCH
  (改 in/out) (改位置/换轨)   (移动 t_p，预览跟随)   (改 s，§3.2)
     │          │ 靠近边缘时自动滚动                  │
     └────► 抬手: done() 生成撤销记录 ◄──────────────┘
```

命中测试的优先级通常是：**选中片段的手柄 > 选中片段本体 > 其他片段 > 空白**。手柄的触摸热区应大于视觉尺寸，例如视觉 12dp，热区 32dp。

**拖拽到边缘自动滚动**：

- 当手指在左右边缘 `e` dp 以内时，按深入程度给出滚动速度：`v = v_max · ((e − d)/e)^2`；
- 每帧（Choreographer / CADisplayLink）推进 `t_p`；
- 同时把被拖元素的时间位置加上同样的增量，使它"粘"在手指下。

**滚动和预览联动**：

- 滚动时间轴本质上是连续 seek。必须做 seek 合并（见 §3.7），否则解码器会被大量请求淹没。

### 3.7 预览 Surface 与 seek 合并

#### 3.7.1 平台与渲染线程

【推断/业界通用】

- **Android**
  - SurfaceView 拥有独立的 Surface，由合成器直接合成，开销较低，适合全屏视频预览。
  - TextureView 走 View 层级合成，便于做动画和变换，但多一次 GPU 拷贝。
  - 平台文档说明 SurfaceView 的 Surface 生命周期绑定窗口可见性，需要在 `surfaceCreated` / `surfaceDestroyed` 中管理 [R36]。
- **iOS**：常见做法是 Metal（CAMetalLayer / MTKView）自绘。另一条路是 AVFoundation 的自定义合成器（`AVVideoCompositing`）。苹果文档说明：当 `AVVideoComposition` 设置了 `customVideoCompositorClass` 时，`AVPlayerItem`、`AVAssetExportSession`、`AVAssetImageGenerator` 都会用该合成器处理指令 [R32]。也就是说，预览、导出、抽帧三者可以共享同一套合成代码。
- **社区观点**：第三方文章称"通过逆向分析，剪映主要是 AVFoundation + GPUImage"【社区逆向/开源】[S12]（未能核实：核查环境无法访问 cloud.tencent.cn；VideoLab 仓库 README 本身只写"基于 AVFoundation 和 Metal"，没有这句话）。这一观点年代较早（约 2021 年），且与 research_nle 中"自研 VE 引擎 + AGFX/Metal"的结论不一致，**不宜采信为现状**。

#### 3.7.2 seek 合并与两段式 seek

```kotlin
// 原创伪代码：拖动时间轴时，只处理"最新"的 seek，并先快后准
class SeekCoalescer(private val engine: PreviewEngine) {
    private val latest = java.util.concurrent.atomic.AtomicLong(-1)
    @Volatile private var busy = false

    fun onScrub(tUs: Long) {             // UI 线程高频调用
        latest.set(tUs)
        if (!busy) schedule()
    }
    private fun schedule() = renderThread.post {
        busy = true
        val t = latest.getAndSet(-1)
        if (t >= 0) {
            engine.seek(t, mode = SeekMode.NEAREST_KEYFRAME) // 快：关键帧
            engine.renderOnce()
        }
        busy = false
        if (latest.get() >= 0) schedule()                    // 期间又来了新请求
        else idleHandler.postDelayed({                       // 停手 120ms 后补精确帧
            engine.seek(engine.lastTarget, mode = SeekMode.EXACT); engine.renderOnce()
        }, 120)
    }
}
```

#### 3.7.3 掉帧策略（推断）

- 预览以**音频时钟**为主时钟，视频帧按 PTS 对齐。
- 如果某帧的渲染完成时间晚于 `PTS + 1 个 vsync`，就丢弃它，不显示过期帧。
- VE SDK 的 `enableOptPlayBackDropFrame` / `setDropFrameParam`（见 research_nle §4.2）说明引擎内有可配置的丢帧策略【官方类名，未核验其语义】。

#### 3.7.4 预览降分辨率（代理）

- **官方帮助页**：CapCut 帮助页说明代理模式用低分辨率媒体换流畅播放，可能导致缩放、模糊的显示与导出不一致。这条描述针对桌面端 [S3]（未能核实）。
- **媒体报道**：36氪报道剪映为 4K/高帧率素材提供智能代理，可在后台生成代理 [S19]（未能核实）。
- 【推断】移动端更常见的形式是"预览分辨率上限随机型档位变化"（见 §6），而不是显式代理文件。

---

## 4. 性能工程：启动、内存/OOM、预览卡顿、包体积

### 4.1 启动

【推断/业界通用】，字节系旁证为【官方/一手】。

- **没有**找到剪映启动优化的公开数据。
- 字节系旁证：Android 官方案例称，TikTok 基于 Jetpack App Startup 重构启动框架，启动时间缩短 45% [R14，已打开]。这是 TikTok 的数据，**不是剪映的**。

编辑类 App 的启动优化重点（推断）：

1. **首页不加载编辑引擎**：VE/Effect 的 native 库体积大、初始化重。它们应在用户点击"开始创作"前后再加载。可以在首页空闲时预热，但不要阻塞首帧。
2. **so 加载拆分**：`System.loadLibrary` 是同步的，大库加载可能耗时数十到数百毫秒。可以放到后台线程先 `dlopen`，用 future 或锁保证业务第一次调用前完成。
3. **Baseline Profile / 预编译**：降低冷启动解释执行的开销。这是 Android 平台的通用建议【推断/业界通用】。（更正：R14 TikTok 案例页**没有**提到 Baseline Profile，它列出的工具是 Systrace、Simpleperf、Jetpack App Startup 和 Layout Inspector [R14，2026-10-15 复核]。）

### 4.2 内存与 OOM

#### 4.2.1 一手线索

【官方/一手】

- F2：内存复用 + 编码渲染并行 [S1，检索摘要]。
- F12：Raphael README 列出剪映，说明剪映用过（或至少接入评估过）这个 native 内存泄漏检测工具 [R1，已打开]。
- 字节系旁证【官方/一手】[检索摘要]：
  - 抖音 Java OOM 治理文章称，归因阶段 `pthread_create` 问题约占 50%，Java 堆超限占 40% 多。经过工具建设和一个双月的专项，Java OOM 整体下降 80% [S6]。这是抖音的数据（未能核实：juejin.cn 在核查环境中仍不可访问）。
  - iOS 方面，第三方文章分析了字节的"在线 Memory Graph"方案：在内存达到阈值时，通过 mach VM region 接口遍历进程内存并采集快照 [S7，社区分析]（未能核实）。

#### 4.2.2 视频编辑的内存预算模型

【推断/业界通用】

视频编辑内存的大头是**帧缓冲**，包括解码输出、纹理和 FBO。单帧大小：

| 格式 | 1080p（1920×1080） | 4K（3840×2160） |
|---|---|---|
| NV12/YUV420（1.5 B/px） | 3,110,400 B ≈ 2.97 MiB | 12,441,600 B ≈ 11.87 MiB |
| RGBA8（4 B/px） | 8,294,400 B ≈ 7.91 MiB | 33,177,600 B ≈ 31.64 MiB |
| RGBA16F（8 B/px，HDR/高精度中间结果） | ≈ 15.8 MiB | ≈ 63.3 MiB |

**估算公式**（原创，便于做机型分级预算）：

```
M_preview ≈ Σ_tracks( Q_dec · F_dec(res_src) )        // 每路解码输出队列
          + N_fbo · F_rgba(res_preview)               // 合成/特效中间缓冲（ping-pong）
          + M_effect_models + M_thumbs + M_waveform
```

例子：主轨加 2 路画中画，素材都是 4K；每路解码队列深度 `Q_dec = 4`；合成在 4K 下进行，需 4 个 RGBA8 FBO。

- 解码：3 × 4 × 11.87 ≈ 142 MiB
- FBO：4 × 31.64 ≈ 127 MiB
- 合计约 270 MiB，**还没算**特效模型和纹理

如果把**预览合成分辨率降到 1080p**，同时让解码器直接输出缩小后的纹理（硬解后先缩放再进合成）：

- FBO：4 × 7.91 ≈ 32 MiB
- 解码队列可以降到 2

这就是为什么"预览分辨率随机型档位降级"是最有效的内存手段。

#### 4.2.3 平台信号

【官方/一手】[已打开]

| 平台 | API / 信号 | 用法要点 |
|---|---|---|
| Android | `ActivityManager.isLowRamDevice()`（API 19） | 文档称低内存设备"目前通常指 1GB 或更少 RAM"[R22] |
| Android | `ActivityManager.getMemoryClass()`（API 5） | 单 App 堆的近似上限 [R22] |
| Android | `ComponentCallbacks2.onTrimMemory` | `TRIM_MEMORY_UI_HIDDEN`（API 14）是 UI 不可见时释放大块 UI 内存的信号。`TRIM_MEMORY_RUNNING_CRITICAL` 在 API 35 已弃用，且**自 API 34 起 App 不再收到该级别**[R23]。不能再依赖"运行中内存告急"回调，要自己监控 |
| iOS | `os_proc_available_memory()`（iOS 13+） | 返回"当前内存上限减去当前 footprint"。文档要求只作参考、不要缓存，并强调上限会变化 [R28] |
| iOS/Metal | `MTLDevice.recommendedMaxWorkingSetSize`（iOS 16+） | GPU 在不影响性能的前提下可分配的内存估计值，建议资源总 footprint 低于它 [R30] |

#### 4.2.4 GPU 纹理与"内存复用"

【推断】

F2 的"内存复用"在视频编辑里最典型的实现，是**按规格池化的帧缓冲 / 纹理池**：

```cpp
// 原创伪代码：按 (w, h, format) 复用纹理/FBO，避免每帧 glTexImage2D 分配
struct Key { int w, h; GLenum fmt; bool operator==(const Key&) const = default; };
class TexturePool {
    std::unordered_map<Key, std::vector<GLuint>, KeyHash> free_;
    size_t bytesInUse_ = 0, budget_;
public:
    GLuint acquire(Key k) {
        auto& v = free_[k];
        if (!v.empty()) { auto t = v.back(); v.pop_back(); return t; }
        evictIfOver(budget_ - bytesOf(k));   // LRU 淘汰空闲纹理
        return allocate(k);                   // 真正分配
    }
    void release(Key k, GLuint t) { free_[k].push_back(t); }  // 归还而非删除
};
```

配套做法（推断）：

- 预览和导出**共用**同一套解码/合成单元，但导出时预览暂停，以释放解码器和 FBO。这与 F2"编码渲染并行"的含义相关：导出时渲染第 n 帧与编码第 n−1 帧流水线并行。
- 32 位进程的虚拟地址空间只有 4GB 量级，大 mmap 和线程栈都会争抢它。字节系文章把线程收敛、虚拟内存监控、64 位专项列为 native OOM 治理手段 [S6，检索摘要]。CapCut 安装包至少到 2022 年仍包含 armeabi-v7a [S13]，所以 32 位设备的虚拟内存问题对它是现实存在的。

#### 4.2.5 Raphael 的工作原理（剪映出现在其使用者列表中）

【官方/一手】[已打开源码 R1]

1. **拦截的函数**：通过 PLT/GOT hook 替换 `malloc`、`calloc`、`realloc`、`memalign`、`free`、`mmap`、`mmap64`、`munmap` 为代理函数（见 `HookProxy.h`、`PltGotHookProxy.h`）。
2. **配置字的位域**（`Raphael.h`）：

   ```
   MAP64_MODE = 0x00800000   // 监控 mmap 类分配（虚拟内存）
   ALLOC_MODE = 0x00400000   // 监控 malloc 类分配
   DEPTH_MASK = 0x001F0000   // 回溯深度（右移 16 位）
   LIMIT_MASK = 0x0000FFFF   // 只记录 ≥ limit 字节的分配
   ```

   README 示例 `MAP64_MODE|ALLOC_MODE|0x0F0000|1024` 的含义是：两类分配都监控，回溯 15 层，只记录 ≥1024B 的分配。
3. **只记录大分配**：代理函数中 `size >= limit` 时才抓栈（`unwind_backtrace`）。地址、大小、调用栈存入哈希缓存：`Cache.h` 中 `MAX_TRACE_DEPTH 16`，`ALLOC_INDEX_SIZE 1<<16`。`free`/`munmap` 时从缓存移除。
4. **防重入**：用 `pthread_getspecific(guard)` 防止代理函数内部再次分配导致的递归。
5. **按 so 过滤**：可以用正则只 hook 指定 so，例如 `.*libxxx\.so$`。
6. **分析**：`Raphael.print()` 输出报告，再用 `raphael.py` 符号化、聚合出"疑似泄漏栈"。

这套思路很适合视频编辑：解码器、滤镜、AI 推理的大块 native 分配都在 so 里，按 so 过滤能把开销控制在可接受范围。

### 4.3 预览卡顿与掉帧

【推断/业界通用】，工具部分为【官方/一手】。

**预览管线的并行化（推断）**

```
 [Demux 线程] ─► [解码线程×N（每路素材/硬解实例）] ─► [GL/Metal 合成线程] ─► [显示]
                                                         ▲
                                              [音频线程：主时钟]
```

调优点：

1. **控制硬解实例数**：硬件解码器的并发实例数有限，见 §6.3 的 `PerformancePoint`。画中画路数超过上限时，要么降到软解，要么只解码可见的几路。
2. **预读**：在播放头前方预解码 `k` 帧（VE SDK 有 `enableSeekAndPreloadOpt`，见 research_nle）。到片段边界前提前启动下一个片段的解码器，避免转场处卡顿。
3. **热降频**：
   - Android 的 `PowerManager.getThermalHeadroom(int forecastSeconds)`（API 30）可以估计"距离严重降频还有多少余量"；`THERMAL_STATUS_SEVERE`（API 29）表示"UX 受到很大影响"[R21]。
   - iOS 有 `ProcessInfo.thermalState`（iOS 11+），文档要求在高热状态下降低资源使用 [R29]。
   - 预览和导出都应订阅这些信号并动态降档，见 §6.2 的"动态修正"。

**定位工具**：btrace 3.0 的原理【官方/一手】[已打开 R5]。没有证据表明剪映使用 btrace，这里只介绍原理。

- 2.0 用编译期字节码插桩，问题是接入维护成本高、看不到系统方法。
- 3.0 改为**"动态插桩 + 同步抓栈"**：
  - 用 ShadowHook 在高频"叶子"操作上插桩，在目标线程**同步**抓栈，省去挂起和恢复线程的开销。插桩点包括 Java 对象分配（ART `AllocationListener`）、JNI 调用、`MonitorEnter` 锁、`Object.wait`、`Unsafe.park`。
  - 按时间间隔控频：两次抓栈的间隔大于阈值才抓。
  - 对阻塞类插桩点，额外记录开始和结束时间，得到"阻塞耗时 + 栈"。
  - iOS 在同步抓栈之外叠加异步抓栈：线程长时间没被采样时，由采样线程挂起它再抓栈。
  - 产物是 Perfetto 格式。
  - 限制（2026-10-15 复核 btrace README）：Android 需 8.0 及以上；**Java 对象分配监控尚未适配 Android 15 及以上**，在这些系统上上面的"对象分配"插桩点不可用 [R5]。
- Android 快速抓栈的关键技巧：构造 ART 的 `StackVisitor` 时不假设其内存布局，预留 `char mSpaceHolder[2048]` 交给 ART 的构造函数初始化，再替换虚表，把回调导向自己的 `VisitFrame`。栈里只存 `ArtMethod*`，不即时符号化。

### 4.4 包体积

【官方/一手】线索 + 【推断】

- **F3 [检索摘要]**：为控制包体增量，约 2020 年的剪映没有引入软编解码器，而依赖平台硬编/硬解。
- **矛盾说明**：research_nle 在 `vesdk-11.3.0.103-tob.aar` 中看到了 `libbytevc0.so`、`libByteVC1_dec.so`、`libttffmpeg.so` 等软编解码相关库（tob = 对外 SDK 版本）。
  - 两种可能：较新版本已经引入自研软编解码；或者对外 SDK 与剪映 App 的打包不同。
  - **以剪映当前安装包为准，本文未能确认**（也不做安装包分析）。
- **ABI 策略**：至少到 2022 年，CapCut 在 APKMirror 上是 `arm64-v8a + armeabi-v7a` 合包 [S13]。在 Google Play 上，App Bundle 会按设备 ABI 拆分下发，用户实际下载只有一种 ABI；国内安卓渠道通常仍分发整包。【推断】
- **字节系包体积工具**【官方/一手】[已打开]。均**未证实**用于剪映：
  - ByteX（抖音 Android 团队出品）：基于 Gradle Transform + ASM 的字节码插件平台，含 `shrink-r-plugin`（R 文件瘦身）、`const-inline-plugin`、`getter-setter-inline-plugin`、`SourceFileKiller` 等。README 列出的用户是抖音、TikTok、头条、火山、飞书、多闪、FaceU、轻颜、飞聊，**没有剪映**。仓库已于 **2026-02-02 归档** [R6]。
  - AabResGuard（抖音 Android 团队出品）：AAB 资源混淆，README 称 2018 年 7 月底起用于 TikTok、Musically、Vigo 等。仓库已于 **2025-04-08 归档** [R7]。
- **通用做法（推断）**：大头是 native 库和模型。核心手段是把"非首次使用即需要"的 so、模型、特效包**移出安装包**，按需下发（见 §5）。

---

## 5. 动态下发：so、AI 模型、特效资源

> 证据等级：剪映具体机制【未找到公开资料】。
> 特效资源包的格式与下载见 `research_effects.md`；草稿打开时按 `resource_id` 按需下载素材，见 `research_nle.md` §2.8。本节讨论通用的客户端下发框架。

### 5.1 字节系一手线索

【官方/一手】[检索摘要]

- **Pitaya**：字节的端智能工程链路。云端 MLX 负责训练、转换、发布和 A/B；客户端 Pitaya SDK 负责特征工程、推理引擎、**算法包管理**、任务管理和监控 [S11]。报道列出的接入方是抖音、头条、西瓜、番茄小说等，**未提剪映**（未能核实：CSDN、掘金在核查环境中不可访问）。
- **BytePlus VE SDK**：硬编开关可由"云端白名单/黑名单"控制 [S2]（未能核实）。如属实，说明字节的媒体 SDK 本身就有**云端下发配置**的设计。

### 5.2 平台约束

【官方/一手】[已打开]

- **iOS**：App Store 审核指南 2.5.2 规定 App 不得"下载、安装或执行会引入或改变 App 特性或功能的代码"[R35]。因此 iOS 端只能下发**数据**，例如模型权重、特效资源、LUT、字体、配置，不能下发可执行代码。苹果提供 Background Assets 框架做系统托管的资源下载，可选 Apple 托管 [R34]。
- **Android 官方路线**：
  - Play Feature Delivery 支持按需模块。官方文档建议用 ReLinker 加载按需模块中的 native 库，以规避安装后加载失败的问题 [R25]。
  - Play for On-device AI 支持 AI pack，并可按**设备分组（device targeting）**下发不同变体 [R24]。
  - 国内安卓没有 Play，所以厂商普遍自建下发系统。

### 5.3 通用下发框架设计

【推断/业界通用】

```
           ┌──────────── 配置中心（按 App 版本/ABI/机型档位/AB 实验 下发）───────────┐
           │ manifest: [{name, version, abi, minTier, url, sha256, size, deps[]}]  │
           └──────────────────────────────┬─────────────────────────────────────┘
                                          ▼
 触发：首次使用功能 / Wi-Fi 空闲预取 / 草稿打开缺资源
                                          ▼
  下载(断点续传) ─► 校验(sha256/签名) ─► 解压到 tmp ─► 原子 rename 到 versions/<v>/
                                          ▼
  加载：so → System.load(绝对路径)，依赖顺序按 deps 拓扑排序
        模型 → 推理引擎按档位选择变体（fp16/int8、分辨率）
        特效 → 资源管理器登记 resource_id → 本地路径
                                          ▼
  失败兜底：校验失败删除重下；加载失败回退旧版本；连续失败熔断并上报
```

**so 动态加载的几个工程要点（推断/业界通用）**

1. **依赖顺序**：`System.load` 只加载指定的 so。它依赖的其他下发 so 不在 linker 的搜索路径里，在高版本 Android 的 linker namespace 下很常见会失败。常见做法有两种：按依赖拓扑序**先手动 load 被依赖的 so**；或者把下发目录注入 ClassLoader 的 native 库搜索路径。
2. **JNI 注册时机**：Java 侧调用 native 方法前必须确保 so 已加载。通常用一个"能力门面"统一封装：`ensureLoaded()` 返回 Future，未就绪时 UI 显示"正在准备"。
3. **版本绑定**：下发的 so 必须与宿主 App 的 JNI 接口版本匹配。manifest 中带 `hostVersionRange`，不匹配的不下发。
4. **原子切换**：新版本先解压到临时目录，校验通过后再 `rename`。进程内已加载的 so 不能卸载，新版本下次启动才生效。

```kotlin
// 原创伪代码：按需能力（例如某 AI 功能）的就绪检查
object FeatureGate {
    suspend fun ensure(feature: String): Result<Path> {
        val spec = Manifest.pick(feature, abi = Abi.current(), tier = DeviceTier.current())
            ?: return Result.failure(Unsupported(feature))      // 档位不支持→隐藏入口
        val local = Store.find(spec) ?: Downloader.fetch(spec)  // 断点续传
        if (!Verifier.sha256(local, spec.sha256)) { Store.delete(local); return retry(feature) }
        spec.nativeLibs.topoSorted().forEach { System.load(local.resolve(it).toString()) }
        return Result.success(local)
    }
}
```

### 5.4 AI 模型按档位出不同变体

【推断】，以开源案例做类比。

字节员工开源的 RobustVideoMatting（README 写明 "developed at ByteDance Inc."）在发布页给出了同一模型的多个变体 [R12，已打开]：

- 精度：`fp32`、`fp16`、`int8`；
- 输入分辨率与下采样比：例如 `1280x720_s0.375`、`1920x1080_s0.25` 的 CoreML 模型；
- 框架：ONNX、TorchScript、TF、TFJS 等。

README 还建议"在移动端推理时考虑自行导出 int8 量化模型"。

**这不代表剪映使用 RVM。**但它很好地说明了"模型变体 × 设备档位"的矩阵为何存在：同一功能在高端机用 fp16 + 高分辨率，在低端机用 int8 + 低分辨率。下发系统按档位选择变体，从而控制内存和耗时。

---

## 6. Android 碎片化与机型分级

### 6.1 一手线索

【官方/一手】

- **F4 [检索摘要]**：剪映有**机型评估组件**（指标包括性能、帧率、内存）和**机型打分平台**（数万款机型数据），并据此制定调优策略（未能核实）。
- **字节论文 [S4，检索摘要]**：arXiv 2409.03218《Application Research On Real-Time Perception Of Device Performance Status》，10 位作者均署名字节跳动（未能核实：arxiv.org 及二手摘要站在核查环境中无法解析，标题、作者数和单位都没有对照原文）。
  - 方法：PCA 降维后，用 **TOPSIS + 熵权法 + 时间序列模型**评估设备实时性能，给出实时、短期、长期三种灵敏度的性能状态感知结果，并用动态 A/B 实验（细粒度降功耗策略）验证。
  - 二手摘要称：数据来自 3000 多款 Android 机型、1200 万数据点；抖音大规模 A/B 中整体资源占用降低 6%。**这一数字未能在原文核对**，且对象是抖音，不是剪映。
- **行业先例 [S5，检索摘要]**：Facebook 的 Year Class 按内存、CPU 核数和主频把设备归到"相当于哪一年的旗舰"，用于决定是否推视频、动画强度等（未能核实）。

### 6.2 机型分级的计算方法

【推断/业界通用】，公式为标准方法。

分级一般分两层：**静态档位**（按机型）和**动态修正**（按实时状态）。

**① 静态评分（离线，按机型聚合线上数据）**

对机型 `i`、指标 `j` 构造矩阵 `x_ij`。指标例如：

- 预览平均帧率；
- 4K/1080p 导出速度（实时倍数）；
- 解码器最大并发数；
- 可用内存 P50；
- OOM 率、导出失败率（负向指标）；
- GPU 合成单帧耗时。

正向指标做 min-max 标准化，负向指标取反后再标准化。之后计算熵权：

```
p_ij = x_ij / Σ_i x_ij
e_j  = −(1/ln n) · Σ_i p_ij · ln p_ij          // 指标 j 的信息熵
w_j  = (1 − e_j) / Σ_k (1 − e_k)                // 熵越小，区分度越高，权重越大
```

再用 TOPSIS 求每台机型与理想解、负理想解的接近度：

```
v_ij = w_j · x_ij
D_i+ = sqrt( Σ_j (v_ij − max_i v_ij)^2 )
D_i− = sqrt( Σ_j (v_ij − min_i v_ij)^2 )
C_i  = D_i− / (D_i+ + D_i−)                     // ∈[0,1]，越大越好
```

按 `C_i` 的分位数切成 T0 到 T3 等档位。没有线上数据的新机型，用 SoC 型号、RAM、Android 版本做最近邻回填；也可以参考 `Build.VERSION.MEDIA_PERFORMANCE_CLASS`（API 31+）[R17]。

**② 动态修正（在线）**

- 输入：热余量（`getThermalHeadroom` / `thermalState`）、当前可用内存、最近 N 秒的预览掉帧率。
- 用指数滑动平均做平滑，在静态档位基础上**只降不升**，或设置迟滞阈值，避免来回抖动。
- 这对应论文中"实时 / 短期 / 长期"三种灵敏度的思想。

**③ 档位 → 能力矩阵**（示例，原创。数值是为说明结构而虚构，不是剪映的配置）

| 能力 | T0 旗舰 | T1 中高 | T2 中低 | T3 低端 |
|---|---|---|---|---|
| 预览合成分辨率上限 | 1080p | 1080p | 720p | 540p |
| 最大导出 | 4K60 | 4K30 | 1080p60 | 1080p30 |
| 同时硬解路数 | 4 | 3 | 2 | 1（其余软解或冻结帧） |
| 重型 AI（视频抠像、超分） | 端上 fp16 | 端上 int8 | 端上低分辨率/云端 | 隐藏或走云端 |
| 实时美颜/特效 | 全量 | 全量 | 降级 shader | 部分关闭 |
| 缩略图/波形缓存 | 大 | 中 | 小 | 最小 |

**④ 平台官方的"分级"信号**【官方/一手】[已打开]

- `Build.VERSION.MEDIA_PERFORMANCE_CLASS`（API 31）：表示设备符合哪一版媒体性能等级定义，0 表示没有。设备开机后该值不变，但 OTA 可能提升 [R17]。
- Jetpack `androidx.core:core-performance` 可读取 MPC。`PlayServicesDevicePerformance` 还能结合 Google Play 服务的数据给出等级。性能等级向前兼容：设备升级系统后可以继续报告旧等级 [R18]。
- 局限（推断）：MPC 只覆盖较新的高端机，国内大量机型不声明，所以厂商仍需自建机型库。

```kotlin
// 原创伪代码：档位计算（静态 + 动态修正）
object DeviceTier {
    fun current(): Tier {
        val static = RemoteTierTable.lookup(Build.MANUFACTURER, Build.MODEL, Build.SOC_MODEL)
            ?: estimateFromSpecs(ramGb(), cpuMaxFreq(), Build.VERSION.MEDIA_PERFORMANCE_CLASS)
        val headroom = powerManager.getThermalHeadroom(10)          // API 30+
        val dyn = when {
            headroom >= 1.0f          -> 2   // 已接近/超过严重降频
            headroom >= 0.85f         -> 1
            recentDropRate() > 0.15   -> 1
            else                      -> 0
        }
        return static.downgrade(dyn)       // 只降不升，带迟滞
    }
}
```

### 6.3 MediaCodec 兼容性

【官方/一手】平台 API [已打开]；问题案例为【社区逆向/开源】[检索摘要]。

**能力探测 API**

- `MediaCodecInfo.isHardwareAccelerated()` / `isSoftwareOnly()`（API 29）。文档特别说明 `isHardwareAccelerated` "由设备厂商提供，**无法验证其正确性**" [R19]。
- `VideoCapabilities.areSizeAndRateSupported(w, h, fps)`（API 21）用于判断尺寸和帧率组合 [R20]。
- `getSupportedPerformancePoints()`（API 29）返回编解码器声明的性能点，可能为 null [R20]。

**已知的现场问题（第三方，说明为什么不能只信能力声明）[S14]**（未能核实：Chromium codereview 与 FFmpeg trac 在核查环境中不可访问）

- Chromium 修复记录：旧设备上硬件编解码器分配失败、回落到软件编解码器时，`MediaCodec` 创建可能**永不返回**。mediaserver 进入坏状态后，后续硬件编解码器的创建也会挂住。
- FFmpeg trac：Pixel 8 Pro（Android 15）上 MediaCodec 编解码持续 "No output buffer available"，同一工具在 Pixel 4a 上正常。
- 不同机型解码输出的像素格式各不相同（各种 YUV 变体）。

**防御策略（推断/业界通用）**

1. **所有 MediaCodec 调用都加超时与看门狗**：`createByCodecName`、`configure`、`start`、`dequeue*`。超时后标记该机型和配置组合"不可信"，后续直接走备用路径。
2. **云端机型名单**：这正是 F11 "由云端白名单/黑名单控制"的用途。同类产品（阿里云短视频 SDK）也公开了按 `Build.MODEL + SDK_INT` 配置硬编黑名单、硬解白名单的接口 [S18]（未能核实）。可见这很可能是行业惯例。
3. **优先输出到 Surface**：解码输出到 `SurfaceTexture`，再以 `samplerExternalOES` 采样，绕开 `ByteBuffer` 像素格式的碎片化，见 §6.4 着色器。
4. **编码端回退梯度**见 §7.2。

### 6.4 GPU 驱动问题

【推断/业界通用】，官方旁证 [检索摘要]。

- CapCut 桌面帮助页把"过旧的 GPU 驱动导致 OpenGL/Vulkan 渲染错误"列为预览异常原因 [S3]。这是桌面端的说法。移动端驱动无法由用户更新，问题更难处理。
- **常见坑（推断）**：
  - `mediump` 精度在部分 GPU 上只有约 10 位尾数，大纹理坐标或时间累加会产生抖动或条纹；
  - 扩展可用性不一致，例如 `EXT_color_buffer_half_float`；
  - 首次编译 shader 卡顿；
  - EGL 上下文丢失。
- **对策（推断）**：
  - 启动后在后台**预编译 / 预热**常用 shader，有条件时缓存二进制；
  - 按 `GL_RENDERER` / `GL_VERSION` 字符串配置"驱动黑名单 → 降级 shader 路径"；
  - 关键着色器在支持时显式使用 `highp`。

外部纹理采样的通用写法（原创示例，OpenGL ES 2.0）：

```glsl
// vertex shader
attribute vec4 aPos;
attribute vec4 aTex;
uniform mat4 uSTMatrix;          // 来自 SurfaceTexture.getTransformMatrix()
varying vec2 vUV;
void main() {
    gl_Position = aPos;
    vUV = (uSTMatrix * aTex).xy; // 修正解码器输出的裁剪/旋转
}
```

```glsl
// fragment shader
#extension GL_OES_EGL_image_external : require
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;           // 支持则用 highp，避免大分辨率下坐标量化
#else
precision mediump float;
#endif
uniform samplerExternalOES uTex; // MediaCodec → Surface → 外部纹理，绕开 YUV 格式碎片化
uniform float uOpacity;          // 画中画透明度
varying vec2 vUV;
void main() {
    vec4 c = texture2D(uTex, vUV);
    gl_FragColor = vec4(c.rgb, c.a * uOpacity);
}
```

---

## 7. 导出可靠性：后台导出与编码器回退

### 7.1 一手线索

【官方/一手】[检索摘要]

| 来源 | 内容 |
|---|---|
| F1 / F2 [S1] | 导出失败率从 4% 降到 1%。方法是错误统计 + 快速迭代，以及"内存复用 + 编码与渲染并行" |
| F5 [S1] | 4K 导出耗时约一年内做到行业较优 |
| F6 [S1] | 用模板用例生成视频，再用 CV 检测黑屏/花屏/渲染错误，做回归 |
| CapCut 帮助页 [S3] | 锁屏或切到别的 App 会**暂停**渲染；过热会降频，旧设备更常见；导出卡住时把 4K 降到 1080p；手机上受限于 RAM 和存储（未能核实） |
| CapCut 帮助页 [S3] | 桌面端 Settings → Performance 中可关闭硬件编码，以排除"硬件编码与 GPU 驱动冲突"。**移动端没有检索到同等的手动开关**（未能核实） |
| BytePlus VE SDK [S2] | 导出参数中 `useHWEncoder` / `isSupportHWEncoder` 由业务指定或云端名单控制；编码标准有 `H264` / `ByteVC1`(HEVC) / `MPEG4`。字段名与这三个编码标准可由 `research_nle.md` §3.5、§4.4 对公开 NLE aar（`NLE_ENCODE_STANDARD{H264, ByteVC1, MPEG4}`）的分析佐证；原文还列出的 `AUTO` 在该 aar 枚举中没有出现，"云端名单控制"也只来自检索摘要（未能核实） |

**从"锁屏会暂停渲染"可以推断**：CapCut 移动端（至少帮助页描述的版本）**没有把导出设计为可在后台持续进行的任务**，而是前台任务，切走后暂停或中断，回到前台再继续或重试。这是根据帮助页措辞的推断，具体行为可能因版本和平台而异。

### 7.2 导出状态机与回退梯度

【推断/业界通用】

```
          ┌────────┐ 预检失败(空间/档位)    ┌──────────┐
 用户点导出 ─►│ PRECHECK├──────────────────────►│ FAIL_UI  │
          └───┬────┘                        └──────────┘
              ▼
          ┌────────┐  编码器创建/配置失败  ┌───────────────┐
          │ PREPARE├─────────────────────►│ FALLBACK(next)│──┐
          └───┬────┘                      └───────────────┘  │
              ▼                                   ▲           │ 梯度用尽
          ┌────────┐  中途错误/超时/OOM            │           ▼
          │ RUNNING├──────────────────────────────┘     ┌──────────┐
          └───┬────┘  进入后台 → PAUSED(或 FGS 续跑)     │ FAIL_UI  │
              ▼                                         └──────────┘
          ┌────────┐
          │ MUXING │ → 校验(时长/首尾帧/可解码) → DONE
          └────────┘
```

**空间预检**（原创公式）：

```
size_est ≈ (vbps + abps) · duration / 8 · 1.1      // 10% 余量（容器开销、码率波动）
need     = size_est · (1 + k_tmp)                   // 若先写临时文件再移动，k_tmp≈1
```

可用空间小于 `need` 时直接提示，不要跑到 99% 才失败。

**回退梯度（推断）**。每一级都只在上一级明确失败时触发，并记录错误码用于统计（呼应 F1 的"错误数据统计"）。

```
L0: 硬编 HEVC(ByteVC1/H.265)  目标分辨率/帧率/码率
L1: 硬编 H.264                同参数
L2: 硬编 H.264                降低 profile/level（如 High→Main）、关闭 B 帧
L3: 硬编 H.264                降分辨率一档（4K→1080p）或降帧率（60→30）
L4: 软编（若包内有软编库）      慢但兼容；F3 显示早期剪映未内置软编，此级可能不存在
```

```kotlin
// 原创伪代码：带看门狗的编码器创建 + 梯度回退
suspend fun openEncoder(cfg: EncCfg): Encoder {
    for (level in Ladder.from(cfg)) {
        if (DeviceBlacklist.denies(level)) continue                 // 云端名单
        val enc = withTimeoutOrNull(1500) { tryCreate(level) }      // 防 create() 挂死
        if (enc != null) { Metrics.encoderLevel(level); return enc }
        Metrics.encoderFail(level, lastError())
    }
    throw ExportException(ErrorCode.NO_ENCODER)
}
```

**编码与渲染并行（推断，对应 F2）**

```
 时间 → 
 渲染: [F0][F1][F2][F3] ...
 编码:     [F0][F1][F2][F3] ...      ← 生产者-消费者，2~3 帧的有界队列
 复用: 渲染目标 FBO/Surface 按环形缓冲轮转（"内存复用"）
```

iOS 上可以用 VideoToolbox 的 `kVTVideoEncoderSpecification_RequireHardwareAcceleratedVideoEncoder` 强制要求硬编。该键在 iOS 上标注为 17.4+，macOS 上为 10.9+。无法硬编时 `VTCompressionSessionCreate` 会失败，由调用方自行回退。文档说明这个键适用于"有自己的软件编码实现"的客户端 [R33]。

### 7.3 后台导出：平台能力

【官方/一手】平台 [已打开]。**未证实**剪映采用。

| 平台 | 能力 | 要点 |
|---|---|---|
| Android 15+（API 35） | 前台服务类型 `mediaProcessing`（常量 `FOREGROUND_SERVICE_TYPE_MEDIA_PROCESSING` 在 API 35 加入，文档注明用于"视频或照片编辑与处理"[R37]；权限 `FOREGROUND_SERVICE_MEDIA_PROCESSING`） | 用于"耗时的媒体处理，例如格式转换"。系统允许的时长"通常为每 24 小时 6 小时"，同一 App 所有 mediaProcessing 服务共享这个额度。超时后系统调用 `Service.onTimeout(int,int)`，服务需在几秒内 `stopSelf()`，否则 ANR。文档另注明 Android 14 及以下没有 `onTimeout`，到时 App 会被直接缓存（cached）[R15]。另外，Android 14（API 34）起每个前台服务都必须声明类型 [R15] |
| Android | `dataSync` 类型 | 文档列出"导入/导出、本地文件处理"等用途；目标 Android 15 的 App 不能在 `BOOT_COMPLETED` 中启动它 [R15] |
| iOS | `UIApplication.beginBackgroundTask(withName:expirationHandler:)` | 申请"额外的后台执行时间"，时长有限，可通过 `backgroundTimeRemaining` 查询；必须配对调用 `endBackgroundTask`，否则 App 被杀 [R27] |
| iOS 26+ | `BGContinuedProcessingTask` | "在前台开始、需要时可在后台继续"的任务。系统用 Live Activity 显示进度，用户可取消。资源紧张时系统可能突然终止任务，并**优先终止进度少的任务**，所以必须通过 `ProgressReporting` 上报进度 [R26] |

**分段导出与断点续导（推断）**

- 把时间线切成 N 段（例如在关键帧对齐处），每段独立编码为片段文件，最后无损拼接（remux）。
- 进程被杀后，从最后一个完成的段继续。
- research_nle 记录了 VE SDK 有 `TEParallelCompiler` 类名，可能与分段并行导出有关【官方类名，语义未核验】。

---

## 8. 稳定性与监控

### 8.1 剪映具体接入了什么

【官方/一手】

- 唯一能直接证实的是 F12：Raphael 的使用者列表中有剪映 [R1，已打开]。
- 字节内部 APM（外部产品叫 APMPlus）是否覆盖剪映，**没有找到公开说明**。

### 8.2 Native hook 基础设施

【官方/一手】[已打开 R3、R4]。剪映未在用户列表中。

- **ByteHook（bhook）**
  - 定位：Android PLT hook 库。支持 Android 4.1 到 17（API 16 到 37），支持 armeabi-v7a、arm64-v8a、x86、x86_64，MIT 许可。
  - 旧版 README（v1.0.9）写明用于 **TikTok、抖音、头条、西瓜、飞书**。
  - 关键设计（来自 `doc/overview.zh-CN.md`）：
    1. **DL monitor**：hook `dlopen`、`android_dlopen_ext`、`dlclose`，新 so 一加载就立即执行预定的 hook。用读写锁保证"正在被 hook 的 so 不会同时被卸载"。
    2. **绕过系统库 `dlopen` 限制**：Android 7.0 上调用 linker 内部符号，例如 `__dl__Z9do_dlopenPKciPK17android_dlextinfoPv`；8.0 起 hook libdl 的 `__loader_dlopen`。文档称这一做法参考了 Raphael。
    3. **trampoline**：GOT 中写入"管理入口"，维护 proxy 链表。多个 SDK hook 同一调用点时可以独立 unhook，并能检测环形调用。
    4. **native 崩溃兜底**：注册 SIGSEGV/SIGBUS 处理函数，`sigsetjmp`/`siglongjmp` 实现 try-catch，只保护"读内存 / 单次写内存"操作。文档提醒这是高危操作，纯业务 so 不应使用。
- **ShadowHook**：inline hook 库，支持 armeabi-v7a 和 arm64-v8a，Android 4.1 到 17。旧版 README 同样写"用于 TikTok、抖音、头条、西瓜、飞书"。btrace 3.0 用它做动态插桩 [R4][R5]。

【推断】视频编辑 App 用到 hook 的典型场景有：

- 监控 `pthread_create` 以治理线程数；
- 监控 `malloc`/`mmap` 以发现大块泄漏（Raphael）；
- 监控 `open` 以排查 fd 泄漏；
- 在厂商 GPU 驱动 / codec 库的已知崩溃点做规避（高风险，需谨慎）。

### 8.3 GUI 自动化与回归

- **F6**【官方/一手】[检索摘要]：模板用例 + CV 检测黑屏、花屏。
- **Fastbot**【官方/一手】[已打开 R8]：字节开源的基于模型的 GUI 测试工具。它结合机器学习和强化学习寻找稳定性问题，Java 和 C++ 代码已全部开源。README 未列出使用方，不能确认剪映使用。

**CV 检测"黑屏/花屏"的最小实现（推断/业界通用）**

```
黑屏:  mean(Y) < 16 且 var(Y) < ε               // 全帧接近纯黑
冻结:  连续 N 帧 SSIM(F_t, F_t−1) > 0.995 且时间线上该段应有运动
花屏:  8×8 块边界处的梯度能量 / 块内梯度能量 ≫ 基线   // 宏块错误的典型特征
       或与"黄金参考帧"（基准机导出）的 PSNR < 阈值
```

做法：对每个模板用例，在基准机导出一份"黄金视频"，其他机型导出后逐帧比较。阈值按模板类型分别校准，因为有些模板本身就有闪白、黑场等效果。

### 8.4 编辑类 App 的监控指标

【推断】

| 维度 | 指标 | 说明 |
|---|---|---|
| 导出 | 成功率、各级回退占比、P50/P90 实时倍数、失败错误码分布（按机型/档位/编码器） | F1 的"错误数据统计"是这类指标的直接体现 |
| 预览 | 预览帧率、掉帧率、seek 首帧耗时、拖动时间轴的卡顿 | 需要区分"空闲播放"和"滚动/拖动"两种场景 |
| 资源 | OOM 率（Java/native/虚拟内存/线程数）、GPU 内存峰值、热降频触发率 | 32 位设备单独看 |
| 下发 | 资源下载成功率、校验失败率、按需功能"首次可用耗时" | §5 |
| 崩溃 | Java/Native/ANR，按 so 归因（编解码器、GPU 驱动、引擎） | 驱动和 codec 崩溃要进机型名单 |

---

## 9. 字节开源移动基础设施核验表

【官方/一手】[已打开]。数据来自 GitHub 页面与 README，2026-10-15 读取。星标数为页面显示的近似值。

| 仓库 | 存在/状态 | 做什么 | README 声明的使用方 | 与剪映的关系 |
|---|---|---|---|---|
| [bytedance/bhook](https://github.com/bytedance/bhook) | 存在，活跃，约 2.6k★，MIT | Android PLT hook（ByteHook）；Android 4.1 到 17；4 种 ABI | v1.0.9 README：TikTok、抖音、头条、西瓜、飞书 | **未见剪映** |
| [bytedance/android-inline-hook](https://github.com/bytedance/android-inline-hook) | 存在，活跃，约 2.4k★，MIT | ShadowHook，inline hook；armeabi-v7a、arm64-v8a | 旧 README：TikTok、抖音、头条、西瓜、飞书 | 未见剪映 |
| [bytedance/btrace](https://github.com/bytedance/btrace) | 存在，活跃，约 2.5k★，Apache-2.0 | 基于 Perfetto 的 Android/iOS/HarmonyOS trace；3.0 为"动态插桩 + 同步抓栈"；Android 需 8.0+ | 未列出 | 未见剪映 |
| [bytedance/memory-leak-detector](https://github.com/bytedance/memory-leak-detector)（Raphael） | 存在，Apache-2.0，API 14+ | native 内存泄漏检测；西瓜 Android 团队出品 | **西瓜、抖音、头条、火山、剪映、开眼** | **README 列出剪映**（F12） |
| [bytedance/tailor](https://github.com/bytedance/tailor) | 存在，Apache-2.0 | 西瓜团队出品，hprof 裁剪压缩，异常时 dump 迷你快照用于离线分析 OOM | 西瓜、抖音、火山、开眼 | 未见剪映 |
| [bytedance/ByteX](https://github.com/bytedance/ByteX) | **2026-02-02 已归档**，约 3.2k★ | 抖音团队出品，Gradle Transform + ASM 字节码插件平台（R 瘦身、常量内联、getter/setter 内联等） | 抖音、TikTok、头条、火山、飞书、多闪、FaceU、轻颜、飞聊 | 未见剪映 |
| [bytedance/AabResGuard](https://github.com/bytedance/AabResGuard) | **2025-04-08 已归档**，约 1.4k★ | 抖音团队出品，AAB 资源混淆 | TikTok、Musically、Vigo 等 | 未见剪映 |
| [bytedance/BoostMultiDex](https://github.com/bytedance/BoostMultiDex) | **2025-04-08 已归档**，约 1.2k★ | 加速低版本 Android 多 dex 加载 | （未细读） | 未见剪映 |
| [bytedance/Fastbot_Android](https://github.com/bytedance/Fastbot_Android) / Fastbot_iOS | Android 未归档；iOS **2025-04-08 已归档** | 基于模型 + 强化学习的 GUI 稳定性测试 | 未列出 | 未见剪映 |
| [bytedance/scene](https://github.com/bytedance/scene) | 存在，约 2.5k★ | 单 Activity 页面框架 | TikTok、抖音、西瓜、头条、可颂 | 未见剪映 |
| [lynx-family/lynx](https://github.com/lynx-family/lynx) | 存在 | 跨平台 UI 框架 | README 未列使用方 | 招聘帖称剪映/CapCut 社区方向建设 Lynx 容器 [S8，检索摘要，论坛内推帖]（未能核实） |
| GitHub `org:bytedance capcut` 仓库搜索 | 0 个结果 | — | — | 字节没有以 CapCut 命名的开源仓库 |

**结论**：在核验过的仓库中，只有 Raphael 明确列出了剪映。其余工具只能说"字节系 App 在用"，不能说"剪映在用"。

---

## 10. 招聘信息里的技术栈线索

均为 [检索摘要]，具体岗位可能已下线。证据等级分两类：V2EX、牛客是第三方论坛上的个人内推帖，**降为【社区逆向/开源】**；LifeAtTikTok 是官方招聘站，保留【官方/一手】。核查环境无法访问 v2ex.com、nowcoder.com、lifeattiktok.com，下表各行均未能核对原文。

| 来源 | 时间 | 内容 |
|---|---|---|
| V2EX 内推帖 t/992392 [S8]【社区逆向/开源】 | 2023-11 | 剪映/CapCut "全球日活突破 1 亿、覆盖 170 多个国家"；团队"负责剪映与 CC 两个 App 的移动端迭代"，广州、深圳都有 Android/iOS 客户端部门；社区方向 Android 岗要求 1 年以上经验、Java/Kotlin，职责含"统一 Lynx 容器建设"（未能核实） |
| 牛客 2025 校招帖 [S9]【社区逆向/开源】 | 约 2024 | 剪映研发团队支持剪映、CapCut、即梦、醒图；方向为前端、后端、**C++ 客户端、多媒体客户端、图形图像算法**；城市为北京、上海、广州、深圳、杭州（未能核实） |
| LifeAtTikTok（CapCut ML 推荐岗）[S10]【官方/一手】 | — | 覆盖 "Jianying, CapCut, Hypic" 等 CapCut 系 App（服务端/ML 岗，仅用于确认产品线）（未能核实） |
| 其他 CapCut 岗位 [检索摘要] | — | Seattle Full Stack（隐私方向）、San Jose SRE / 后端，均非客户端岗（未能核实） |

**没有检索到**明确写有 "OpenGL / Metal / MediaCodec / Vulkan" 的剪映客户端 JD 原文。【推断】"多媒体客户端""图形图像算法"两类岗位大概率覆盖这些技术，但这是推断。

---

## 11. 给学习者：在自己的 Demo 中复刻的优先级

【推断/业界通用】，按投入产出排序。

1. **先建"时间 ↔ 像素"坐标系和单一数据源**（§3.1、§3.2）。时间轴、缩略图、波形、吸附都依赖它。
2. **抽帧走 LOD 量化缓存**（§3.4.2），再加可见性优先的解码队列。这是编辑页流畅度的关键。
3. **峰值金字塔波形**（§3.5），落盘缓存。
4. **seek 合并 + 两段式 seek**（§3.7.2）。拖动时间轴不卡的关键。
5. **纹理池 + 预览分辨率档位**（§4.2.4、§6.2）。解决 OOM 最有效。
6. **导出状态机 + 回退梯度 + 空间预检 + 错误码统计**（§7.2）。把"导出失败率"做成一个可观测指标。
7. **最后再做**动态下发和机型库（§5、§6），它们需要线上数据支撑。

---

## 参考来源

**取证说明**：

- [已打开] 表示作者直接读到原文。
- [检索摘要] 表示原站在本环境被网络策略屏蔽，内容来自搜索引擎摘要，需要复核。

### 已打开（GitHub / 平台官方文档）

- R1 [已打开] https://github.com/bytedance/memory-leak-detector
  - README：https://raw.githubusercontent.com/bytedance/memory-leak-detector/master/README.md 、README_cn.md
  - 源码：`library/src/main/cpp/Raphael.h`、`HookProxy.h`、`Cache.h`
- R2 [已打开] https://github.com/bytedance/tailor
  - README_cn：https://raw.githubusercontent.com/bytedance/tailor/master/README_cn.md
- R3 [已打开] https://github.com/bytedance/bhook
  - 原理文档：https://raw.githubusercontent.com/bytedance/bhook/main/doc/overview.zh-CN.md
  - 旧版 README：https://raw.githubusercontent.com/bytedance/bhook/v1.0.9/README.md
- R4 [已打开] https://github.com/bytedance/android-inline-hook
  - 旧版 README：https://raw.githubusercontent.com/bytedance/android-inline-hook/v1.0.9/README.md
- R5 [已打开] https://github.com/bytedance/btrace
  - 原理文档：https://raw.githubusercontent.com/bytedance/btrace/master/INTRODUCTION.zh-CN.MD
- R6 [已打开] https://github.com/bytedance/ByteX
  - README_zh：https://raw.githubusercontent.com/bytedance/ByteX/master/README_zh.md
- R7 [已打开] https://github.com/bytedance/AabResGuard
- R8 [已打开] https://github.com/bytedance/Fastbot_Android
- R9 [已打开] https://github.com/bytedance/scene
- R10 [已打开] 字节 GitHub 组织仓库列表：
  - https://github.com/orgs/bytedance/repositories?q=android&type=all&sort=stargazers
  - https://github.com/orgs/bytedance/repositories?q=ios&type=all&sort=stargazers
  - https://github.com/orgs/bytedance/repositories?q=video&type=all&sort=stargazers
  - https://github.com/search?q=org%3Abytedance+capcut&type=repositories
- R11 [已打开] https://raw.githubusercontent.com/lynx-family/lynx/develop/README.md
- R12 [已打开] https://github.com/PeterL1n/RobustVideoMatting
- R13 [已打开] https://github.com/ruanjx/VideoLab
- R14 [已打开] https://developer.android.com/stories/apps/tiktok
- R15 [已打开] https://developer.android.com/develop/background-work/services/fgs/service-types
- R16 [已打开] https://developer.android.com/reference/android/media/MediaMetadataRetriever
- R17 [已打开] https://developer.android.com/reference/android/os/Build.VERSION
- R18 [已打开] https://developer.android.com/topic/performance/performance-class
- R19 [已打开] https://developer.android.com/reference/android/media/MediaCodecInfo
- R20 [已打开] https://developer.android.com/reference/android/media/MediaCodecInfo.VideoCapabilities
- R21 [已打开] https://developer.android.com/reference/android/os/PowerManager
- R22 [已打开] https://developer.android.com/reference/android/app/ActivityManager
- R23 [已打开] https://developer.android.com/reference/android/content/ComponentCallbacks2
- R24 [已打开] https://developer.android.com/google/play/on-device-ai
- R25 [已打开] https://developer.android.com/guide/playcore/feature-delivery/on-demand
- R26 [已打开] https://developer.apple.com/documentation/backgroundtasks/bgcontinuedprocessingtask
- R27 [已打开] https://developer.apple.com/documentation/uikit/uiapplication/beginbackgroundtask(withname:expirationhandler:)
- R28 [已打开] https://developer.apple.com/documentation/os/os_proc_available_memory
- R29 [已打开] https://developer.apple.com/documentation/foundation/processinfo/thermalstate-swift.property
- R30 [已打开] https://developer.apple.com/documentation/metal/mtldevice/recommendedmaxworkingsetsize
- R31 [已打开] https://developer.apple.com/documentation/avfoundation/avassetimagegenerator
- R32 [已打开] https://developer.apple.com/documentation/avfoundation/avvideocompositing
- R33 [已打开] https://developer.apple.com/documentation/videotoolbox/kvtvideoencoderspecification_requirehardwareacceleratedvideoencoder
- R34 [已打开] https://developer.apple.com/documentation/backgroundassets
- R35 [已打开] https://developer.apple.com/app-store/review/guidelines/ （第 2.5.2 条）
- R36 [已打开] https://developer.android.com/reference/android/view/SurfaceView
- R37 [已打开] https://developer.android.com/reference/android/content/pm/ServiceInfo （`FOREGROUND_SERVICE_TYPE_MEDIA_PROCESSING`，API 35）

### 检索摘要（未能直接打开原文）

- S1 剪映技术团队招聘文章《技术社招！揭秘「剪映」技术团队如何从0到1打造爆款APP？》（CSDN 转载）：
  - https://blog.csdn.net/weixin_47098359/article/details/113611128
  - https://blog.csdn.net/weixin_42525569/article/details/112165210
- S2 BytePlus VE SDK 文档：
  - https://docs.byteplus.com/en/docs/video-editor-sdk/140-android-encoding-and-composition-parameters
  - https://docs.byteplus.com/en/docs/byteplus-video-editor-sdk/docs-exporting-in-android
  - https://docs.byteplus.com/byteplus-video-editor-sdk/docs/product-overview
- S3 CapCut 官方帮助页：
  - https://www.capcut.com/help/export-stuck-at-the-begin
  - https://www.capcut.com/help/video-export-block
  - https://www.capcut.com/help/how-to-fix-capcut-export-not-working-issue
  - https://www.capcut.com/help/export-video-on-capcut
  - https://www.capcut.com/help/no-2k-or-4k-option-for-export
  - https://www.capcut.com/help/export-videos-in-capcut
  - https://www.capcut.com/help/editing-not-match-displayed
  - https://www.capcut.com/help/why-template-lag-during-preview
  - https://www.capcut.com/help/transitions-lagging
- S4 arXiv 论文 2409.03218：
  - https://arxiv.org/abs/2409.03218
  - https://arxiv.org/html/2409.03218v1
  - 二手摘要：https://lacuna.tiptreesystems.com/work/application-research-on-real-time-perception-of-device-performance-status/wrk_4cf6b4b9da70e252ab39c638b69d05b3
- S5 Facebook Year Class：https://engineering.fb.com/2014/11/06/android/year-class-a-classification-system-for-android/
- S6 抖音 Android 性能优化系列：Java 内存优化篇：https://juejin.cn/post/6908517174667804680
- S7 分析字节跳动解决OOM的在线Memory Graph技术实现（第三方分析）：
  - https://juejin.cn/post/6895583288451465230
  - https://www.cnblogs.com/iOSer1122/p/14243344.html
- S8 V2EX 内推帖：
  - https://v2ex.com/t/992392
  - https://v2ex.com/t/963632
  - https://www.v2ex.com/t/871509
- S9 牛客 剪映研发团队 2025 校招：https://www.nowcoder.com/discuss/652842761242038272
- S10 LifeAtTikTok CapCut ML 岗：https://lifeattiktok.com/search/7398293890061469979
- S11 Pitaya：
  - https://bbs.csdn.net/topics/615048310
  - https://juejin.cn/post/6959376529327554591
- S12 VideoLab 介绍文章（含"剪映主要是 AVFoundation + GPUImage"的第三方说法）：https://cloud.tencent.cn/developer/article/1917650
- S13 APKMirror CapCut 页面：
  - https://www.apkmirror.com/apk/bytedance-pte-ltd/capcut/
  - https://www.apkmirror.com/?p=3483991
  - https://apkmirror.com/apk/bytedance-pte-ltd/capcut/capcut-5-1-0-release/capcut-video-editor-5-1-0-android-apk-download
- S14 MediaCodec 现场问题：
  - https://codereview.chromium.org/2084143002
  - https://trac.ffmpeg.org/ticket/11363
  - https://news.ycombinator.com/item?id=7608997
- S15 CapCut 维基与 Play 页面：
  - https://en.wikipedia.org/wiki/CapCut
  - https://play.google.com/store/apps/details?id=com.lemon.lvoverseas&hl=en_US
  - https://play.google.com/store/apps/details?id=com.lemon.ccpadpro&hl=en_IN
- S16 中国日报 2021 剪映多端报道：https://cn.chinadaily.com.cn/a/202104/01/WS606584cca3101e7ce97471f7.html
- S17 App Store 页面：
  - https://apps.apple.com/cn/app/%E5%89%AA%E6%98%A0-%E8%A7%86%E9%A2%91%E5%89%AA%E8%BE%91-live%E5%AE%9E%E5%86%B5%E5%9B%BE%E7%BC%96%E8%BE%91/id1458072671
  - https://apps.apple.com/us/app/capcut-photo-video-editor/id1500855883
- S18 阿里云短视频 SDK NativeAdaptiveUtil（行业对照）：https://alivc-demo-cms.alicdn.com/versionProduct/doc/shortVideo/android_cn/com/duanqu/qupai/adaptive/NativeAdaptiveUtil.html
- S19 36氪 剪映智能代理报道：https://eu.36kr.com/zh/p/3973184358855170
- S20 Android 官方 TikTok 案例的中文页（与 R14 同内容）：https://developer.android.com/stories/apps/tiktok?hl=zh-cn
- S21 USPTO 专利 US 12,573,428（受让人未确认）：https://image-ppubs.uspto.gov/dirsearch-public/print/downloadPdf/12573428

### 本仓库内的姊妹章节（交叉引用，非本章核验）

- `docs/capcut-research/research_nle.md`：VE/NLE SDK 类名，如 `VERTAudioWaveformMgr`、`HwFrameExtractor`、`enableOptPlayBackDropFrame`、`TEParallelCompiler`，以及 native 库清单
- `docs/capcut-research/research_effects.md`：特效 SDK 与资源包

---

## 未能确认 / 待补充

1. **剪映署名的移动端工程文章**：没有找到启动、包体积、ANR、OOM、预览卡顿、编辑页实现、时间轴组件的署名文章或会议演讲（QCon、GMTC、LiveVideoStackCon、InfoQ）。juejin、mp.weixin、InfoQ 在本环境不可访问，**可能存在但未检索到**。
2. **S1 招聘文章的原文**：F1–F7 都来自 CSDN 转载的检索摘要，没有核对原文，也没有确认原始发布渠道（推测是"字节跳动技术团队"公众号）。F7"非编架构重构"只在一次摘要中出现。
3. **剪映当前是否内置软编解码器**：F3（约 2020 年，"未引入软编"）与 research_nle 中对外 VE SDK 含 `libbytevc0.so` 等软编解码库的发现存在出入。需要以当前版本的官方说明为准。
4. **剪映是否使用 bhook、ShadowHook、btrace、ByteX、Tailor、Fastbot、Scene、Lynx（编辑页）**：均无公开声明。只有 Raphael 的 README 列出剪映。
5. **机型分级的具体档位、指标权重、能力矩阵**：§6.2 的公式和表格是原创示意，**不是剪映的配置**。arXiv 2409.03218 的 "3000+ 机型 / 1200 万数据点 / 抖音资源占用降低 6%" 来自二手摘要，未核对原文。
6. **动态下发**：剪映的 so、模型、特效下发机制（协议、灰度、校验、回滚）没有公开资料。Pitaya 是否服务剪映未确认。
7. **后台导出行为**：帮助页称锁屏或切出会暂停渲染。当前 Android 版是否使用前台服务、iOS 是否采用 `BGContinuedProcessingTask`，均未确认。
8. **移动端硬编开关**：只确认桌面端有"关闭硬件编码"的设置。移动端是否有用户可见的开关未确认。
9. **招聘 JD 原文**：没有检索到写明 OpenGL / Metal / MediaCodec / Vulkan 的剪映客户端 JD 原文。
10. **系统与 ABI 要求**：剪映 iOS 13+、CapCut iOS 15+、Android 5.0+ / 双 ABI 均来自检索摘要或旧版本页面，当前版本可能不同。
11. **专利 US 12,573,428**：受让人未确认，不能作为字节/剪映的证据。
12. **iOS 端**：除平台 API 外，几乎没有找到剪映 iOS 的一手工程资料。"AVFoundation + GPUImage"是第三方早期逆向说法，可能已过时。
13. **待补充方向**（在可以访问中文站点的环境中）：
    - 检索"字节跳动技术团队"公众号或掘金中的"剪映""CapCut"文章全文；
    - 检索 LiveVideoStackCon、QCon 历年议程中剪映讲师的议题；
    - 打开 BytePlus VE SDK 的"机型适配 / 性能"章节；
    - 打开 S1 原文核对 F1–F7。

---

## 核查记录

核查日期：2026-10-15。方法：逐条打开原文（GitHub raw 文件、developer.android.com 参考页 HTML、developer.apple.com 文档 JSON、GitHub 仓库页），并与姊妹章节 `research_nle.md` 交叉对照。核查环境同样屏蔽了 arxiv.org、capcut.com、docs.byteplus.com、CSDN、掘金、V2EX、牛客、Wikipedia、Google Play、App Store 页面、USPTO / Google Patents、36氪、腾讯云、engineering.fb.com、Chromium codereview、FFmpeg trac；本轮 WebSearch 额度也已用完，无法独立检索。所以凡是只依赖这些站点的说法，本次都标为"（未能核实）"，没有改动其内容。

### 已核实（原文支持，未改动内容）

| 说法 | 核对结果 |
|---|---|
| F12：Raphael README "Apps using" 列出剪映 | README.md、README_cn.md 均有 `docs/jianying.png`，列表为西瓜、抖音、头条、火山、剪映、开眼；Apache-2.0；API 14+；"developed by Xigua video android team" |
| Raphael 位域与实现细节（§4.2.5） | `Raphael.h`：`MAP64_MODE 0x00800000`、`ALLOC_MODE 0x00400000`、`DEPTH_MASK 0x001F0000`、`LIMIT_MASK 0x0000FFFF`；`Cache.h`：`MAX_TRACE_DEPTH 16`、`ALLOC_INDEX_SIZE 1 << 16`；`HookProxy.h` 代理 malloc/calloc/realloc/memalign/free/mmap/mmap64/munmap，`size >= limit` 且 `pthread_getspecific(guard)` 为假时才抓栈；README 示例 `MAP64_MODE\|ALLOC_MODE\|0x0F0000\|1024` |
| ByteHook（§8.2、§9） | 当前 README：Android 4.1–17（API 16–37），四种 ABI，MIT；v1.0.9 README："used in TikTok, Douyin, Toutiao, Xigua Video, Lark"；约 2.6k★，未归档 |
| ByteHook 设计文档 | `overview.zh-CN.md` 确有 DL monitor（dlopen / android_dlopen_ext / dlclose + 读写锁）、Android 7.0 用 `__dl__Z9do_dlopenPKciPK17android_dlextinfoPv`、8.0 起 hook libdl 的 `__loader_dlopen`、明确写"参考了 ByteDance Raphael 的做法"、SIGSEGV/SIGBUS + sigsetjmp/siglongjmp 兜底 |
| ShadowHook | 当前 README：Android 4.1–17（API 16–37），armeabi-v7a / arm64-v8a，MIT；v1.0.9 README 同样列出 TikTok、Douyin、Toutiao、Xigua Video、Lark；约 2.4k★ |
| btrace 3.0（§4.3） | `INTRODUCTION.zh-CN.MD` 支持"动态插桩 + 同步抓栈"、ShadowHook、AllocationListener、JNI / 锁 / Object.wait / Unsafe.park、iOS 叠加异步抓栈、`char mSpaceHolder[2048]` + 替换虚表；README：Apache、Perfetto、Android 8.0+、支持 HarmonyOS；约 2.5k★ |
| ByteX | README_zh："抖音 Android 团队提供"、gradle transform + ASM，含 shrink-r-plugin、const-inline-plugin、getter-setter-inline-plugin、SourceFileKiller；用户表为抖音、TikTok、今日头条、火山小视频、飞书、多闪、FaceU、轻颜、飞聊；GitHub 页："archived by the owner on Feb 2, 2026"，3.2k★ |
| AabResGuard | README："douyin Android team"，"end of July 2018"起用于 Tiktok、Musically、Vigo；1.4k★ |
| Tailor、Scene | Tailor README_cn：西瓜 Android 团队出品，用户为西瓜、抖音、火山、开眼；Scene README 用户表为 TikTok、Douyin、Xigua Video、Toutiao、KeSong，约 2.5k★ |
| Fastbot_Android、Lynx | Fastbot README："combines machine learning and reinforcement learning"，"Java & Cpp code are fully open-sourced"；Lynx README 未列使用方 |
| `org:bytedance capcut` 仓库搜索 | 0 个结果 |
| RobustVideoMatting（§5.4） | README："developed at ByteDance Inc."；有 `1280x720_s0.375`、`1920x1080_s0.25` 的 fp16 / int8 CoreML 模型；"If inference on mobile, consider export int8 quantized models yourself" |
| TikTok 启动 45%（§4.1） | R14："refactored the startup framework based on Android Jetpack's App Startup library"，"startup time was reduced by 45%" |
| Android API（§3.4.1、§4.2.3、§4.3、§6.2–6.3、§7.3） | `OPTION_CLOSEST_SYNC`=2、`OPTION_CLOSEST`=3，均 API 10；`getScaledFrameAtTime` API 27，BitmapParams 重载 API 30；`getFramesAtIndex` API 28；`TRIM_MEMORY_RUNNING_CRITICAL` API 35 弃用，"Apps are not notified of this level since API level 34"；`TRIM_MEMORY_UI_HIDDEN` API 14；`isLowRamDevice` API 19、"1GB or less"；`getMemoryClass` API 5；`getThermalHeadroom` API 30；`THERMAL_STATUS_SEVERE` API 29；`MEDIA_PERFORMANCE_CLASS` API 31，可经 OTA 提升；`isHardwareAccelerated` API 29，"cannot be tested for correctness"；`FOREGROUND_SERVICE_TYPE_MEDIA_PROCESSING` API 35，"video or photo editing and processing"；FGS 文档"6 hours out of every 24"、onTimeout、Android 14 及以下"immediately caches the app"、Android 14 起必须声明类型、dataSync 的 BOOT_COMPLETED 限制；On-demand 文档推荐 ReLinker；AI pack 支持 device targeting；Performance class 向前兼容、`PlayServicesDevicePerformance` |
| Apple API（§3.4.1、§3.7.1、§4.2.3、§4.3、§5.2、§7.2、§7.3） | `kVTVideoEncoderSpecification_RequireHardwareAcceleratedVideoEncoder`：iOS 17.4、macOS 10.9，"useful for clients that have their own software encoding implementation"；`BGContinuedProcessingTask`：iOS 26.0，Live Activity、"prioritizes the termination of tasks that reflect minimal or no progress"；`recommendedMaxWorkingSetSize` iOS 16.0；`os_proc_available_memory` iOS 13.0；`AVAssetImageGenerator` iOS 4.0；`thermalState` iOS 11.0；`AVVideoCompositing` 文档确认 AVPlayerItem / AVAssetExportSession / AVAssetImageGenerator（另有 AVAssetReaderVideoCompositionOutput）会使用自定义合成器；App Store 审核指南 2.5.2 原文一致 |

### 已修改

1. **§4.1 第 3 点（更正）**：原文称 Baseline Profile 见"R14 案例的工具列表"。R14 实际只列了 Systrace、Simpleperf、App Startup、Layout Inspector，没有 Baseline Profile。已改为【推断/业界通用】，并注明更正。
2. **§3 开头、§3.5（更正交叉引用）**：`VERTAudioWaveformMgr` 在 `research_nle.md` §4.1，不在 §4.2；`HwFrameExtractor` 在 §4.1 / §4.3。已改正，并注明该 aar 是第三方 Demo 里的火山引擎 tob 版 SDK。
3. **§7.1 BytePlus VE SDK 行（更正）**：删除了没有依据的编码标准 `AUTO`。姊妹章节对 aar 的分析只有 `NLE_ENCODE_STANDARD{H264, ByteVC1, MPEG4}`。字段名 `useHWEncoder` / `isSupportHWEncoder` 有 aar 佐证，"云端名单控制"仍未能核实。F11 行同步加注。
4. **§1、§10 证据等级降级**：F13（牛客）、F14 / S8（V2EX）是第三方论坛内推帖，不是官方招聘页，从【官方/一手】降为【社区逆向/开源】。LifeAtTikTok 保留【官方/一手】。
5. **§4.4、§9 归档日期（补全）**：AabResGuard、BoostMultiDex、Fastbot_iOS 均为"archived by the owner on Apr 8, 2025"，已写入具体日期。
6. **§4.3 btrace（补充限制）**：README 注明 Java 对象分配监控尚未适配 Android 15 及以上，已补入。
7. **加注"（未能核实）"**：F1–F11、F13、F14；§2.1 的 ViaMaker 更名、包名、iOS / Android 最低版本；§3.4.2 专利 US 12,573,428；§3.7.1 "AVFoundation + GPUImage"（另注明 VideoLab README 本身没有这句话）；§3.7.4 代理模式与 36氪报道；§4.2.1 抖音 OOM 数据（S6）与 Memory Graph（S7）；§5.1 Pitaya 与云端名单；§6.1 F4、arXiv 2409.03218 的标题、作者数和单位，以及 Year Class；§6.3 S14 现场问题与阿里云 S18；§7.1 帮助页各行；§9 Lynx 行；§10 全部招聘行。

### 删除

无。本次没有发现可证实为编造或被原文否定的说法，也没有发现不存在的 URL（被屏蔽的站点只能判为"无法访问"，不能判为"不存在"）。

### 未完成（留待可访问中文站点、arXiv、BytePlus 的环境）

- 打开 S1 原文，核对 F1–F7；
- 打开 arXiv 2409.03218，核对标题、作者、"3000+ 机型 / 1200 万数据点 / 资源占用降低 6%"；
- 打开 BytePlus VE SDK 导出文档，核对"云端白名单/黑名单"、`softwareDecode`、`DEFAULT_HW_SUPPORT`、`AUTO`；
- 打开 CapCut 帮助页，核对 F8–F10 和桌面端硬编开关；
- 在 Google Play / Wikipedia 核对包名和 ViaMaker 更名；在 USPTO 核对专利 US 12,573,428 的受让人。
