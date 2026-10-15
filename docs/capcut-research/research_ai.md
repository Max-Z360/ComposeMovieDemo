# 剪映/CapCut 智能剪辑与 AI 功能的公开技术来源

> 本章的研究对象是剪映/CapCut 的"智能"和"AI"类功能。对每个功能整理四件事：它做什么（以官方帮助页为准）；有没有公开的字节跳动、火山引擎/BytePlus 产品或论文与它对应；公开资料是否说明它在端侧还是云端运行（没有资料说明的就写"未说明"）；以及一个学习用的机制拆解，包括公式、原创伪代码、GLSL 和 ASCII 图。
>
> 相邻章节已经覆盖、本章只简单引用的内容：(a) Effect/CV SDK、资源包、Effect House；(b) `draft_content.json` 数据模型、火山引擎视频编辑 SDK API、跨端引擎架构。

---

## 目录

0. [方法、证据等级与访问限制说明](#0-方法证据等级与访问限制说明)
1. [总览：功能 × 公开证据 × 端/云](#1-总览功能--公开证据--端云)
2. [智能抠像 / 视频抠像（Robust Video Matting 核查）](#2-智能抠像--视频抠像robust-video-matting-核查)
3. [自动字幕（ASR）](#3-自动字幕asr)
4. [文本朗读（TTS）与克隆音色](#4-文本朗读tts与克隆音色)
5. [变声 / Voice changer](#5-变声--voice-changer)
6. [降噪 / 人声分离](#6-降噪--人声分离)
7. [自动卡点 / 踩节拍 / Beat Sync](#7-自动卡点--踩节拍--beat-sync)
8. [画质增强 / 超分（Enhance quality / AI 超清）](#8-画质增强--超分enhance-quality--ai-超清)
9. [智能补帧 / 光流慢动作（Optical flow）](#9-智能补帧--光流慢动作optical-flow)
10. [防抖（Stabilize）](#10-防抖stabilize)
11. [智能裁剪（Auto reframe）](#11-智能裁剪auto-reframe)
12. [智能调色（AI color correction / Color match）](#12-智能调色ai-color-correction--color-match)
13. [一键成片 / 图文成片 / Script to video / Auto Cut](#13-一键成片--图文成片--script-to-video--auto-cut)
14. [生成式 AI：Seedream / Seedance / Dreamina / 即梦](#14-生成式-aiseedream--seedance--dreamina--即梦)
15. [端侧 vs 云端：综合判断与架构推演](#15-端侧-vs-云端综合判断与架构推演)
16. [学习者可动手复现的开源积木](#16-学习者可动手复现的开源积木)
- [参考来源](#参考来源)
- [未能确认 / 待补充](#未能确认--待补充)

---

## 0. 方法、证据等级与访问限制说明

**证据等级标签**（每节都会标注）：

| 标签 | 含义 |
|---|---|
| 【官方/一手】 | 字节跳动、CapCut、剪映、火山引擎、BytePlus、ByteDance Seed 的官方页面、帮助中心、官方 GitHub、论文（作者单位含 ByteDance），以及官方新闻稿 |
| 【社区逆向/开源】 | 第三方开源项目或社区资料，包括本章用作"业界通用实现参照"的开源库（RIFE、librosa、vid.stab、AutoFlip 等） |
| 【推断/业界通用】 | 作者推断或行业通行做法，**不代表剪映的真实实现** |

**访问限制（必须说明）**：本次研究所在的沙箱网络只能直接打开 `github.com` 和 `raw.githubusercontent.com`。直接抓取 `arxiv.org`、`capcut.com`、`volcengine.com`、`seed.bytedance.com`、`openaccess.thecvf.com`、`huggingface.co` 时都返回 DNS 失败（`getaddrinfo ENOTFOUND`），或被代理拒绝（`CONNECT tunnel failed, 403`）。因此：

- 标 **(G)** 的来源：本人直接打开过页面或源码，内容逐条核对过。
- 标 **(S)** 的来源：通过 WebSearch 工具检索到，阅读的是检索工具对该页面内容的摘要和引用，没有在浏览器里逐字打开原页面。这些结论的措辞以摘要为准，个别细节可能与原文有出入，所以第 [未能确认 / 待补充](#未能确认--待补充) 节列出了需要回到原文复核的条目。

**范围约束**：本章没有下载或反编译任何 CapCut/剪映二进制文件，也没有请求任何 CapCut/字节生产 API。请求签名、反爬、DRM、草稿加密等内容一律不涉及，服务端架构也不在范围内。

---

## 1. 总览：功能 × 公开证据 × 端/云

【官方/一手】+【推断/业界通用】（"端/云"一列只在有来源时写结论，其余写"未说明"）

| 功能 | 官方帮助页能确认的行为 | 可公开对应的字节/火山技术 | 公开来源对端/云的说法 |
|---|---|---|---|
| 智能抠像 Remove BG | Auto removal + Custom removal（Smart brush/eraser）；另有 Chroma key | RVM（ByteDance 开发，WACV 2022）；火山 MediaKit "人像抠图/绿幕抠图"（云） | **CapCut 未说明**；MediaKit 的对应能力是云端 |
| 自动字幕 Auto captions | 依赖语音识别；可能卡在 99% | Seed-ASR（ByteDance Seed）；火山"音视频字幕生成" | **官方：移动端和 Web 为云端识别；Web 不支持离线；桌面端"部分地区"支持本地识别（需下载语言包）** |
| 文本朗读 TTS | 选音色、语言后生成；200+ 音色（营销口径） | 火山语音 TTS（报道称服务剪映/CapCut）；Seed-TTS；Seed 官方博客称其 TTS 模型用于剪映 | **官方：TTS 依赖云端处理** |
| 变声 Voice changer | Robot/Chipmunk 等预设，可调音高和语速；非实时 | 未找到对应的公开产品或论文 | 未说明 |
| 降噪 Noise reduction | 强度滑杆；过强会出现"机器人/水下"音 | ByteDance 开源 `music_source_separation`（ISMIR 2021）；MediaKit 人声/背景分离（云） | 未说明 |
| 自动卡点 Beat Sync | 桌面/移动端 Auto Cut → Beat Sync；剪映有"踩节拍 I/II" | 未找到对应论文 | 未说明 |
| 画质增强 Enhance quality | HD / UHD / 4K 档位；另有 Reduce image noise | BytePlus VOD 增强模板（超分、插帧、HDR、降噪）；SeedVR/SeedVR2（研究） | 仅 CapCut 营销资源页称"cloud-based AI processing"（弱证据） |
| 智能补帧 Optical flow | 只在变慢的片段上生效；30/50/60fps | BytePlus VOD 插帧（云）；未找到剪映的对应论文 | 未说明 |
| 防抖 Stabilize | Recommended / Minimum cut / Most stable | 未找到对应论文 | 未说明 |
| 智能裁剪 Auto reframe | 选比例、Image stabilization、Camera moving speed；已转为 Pro 功能 | 未找到对应论文 | **官方：使用"real-time AI object tracking"，消耗云端处理资源** |
| 智能调色 | AI color correction（白平衡、对比度、饱和度）、Color match | AceTone（CVPR 2026，UCAS+ByteDance，研究，待复核）（未能核实） | 未说明 |
| 一键成片 / Script to video | Smart generation（自动选素材）/ Local materials；TTS 旁白 | 剪映图文成片（2021）、AI 文字成片、剪映 Hub / 剪映助手（2026） | 未说明（依赖云端 TTS 和素材库，推断主要在云端） |
| 生成式 Seedance/Seedream | CapCut 分阶段向付费用户开放 Seedance 2.0；Video Studio；Web 端可用 Seedream 4.0 生图 | Seedance 1.0/2.0、Seedream 4.0 技术报告（ByteDance Seed） | 未直接说明；论文给出的推理耗时以服务器 GPU 计，产品采用积分计费，推断为云端 |

```
                    ┌──────────────────────── CapCut / 剪映 客户端 ─────────────────────────┐
                    │  时间线/草稿(见相邻章节)   渲染引擎(见相邻章节)   Effect/CV SDK(见相邻章节) │
                    │        │                      ▲                         ▲              │
                    │        ▼                      │ 结果回填为新素材/字幕/关键帧               │
                    │  ┌─────────────┐   本地可行(推断)：抠像? 卡点? 防抖? 补帧? 调色?        │
                    │  │ AI 功能调度 │───────────────────────────────────────────────┐    │
                    │  └─────┬───────┘                                                 │    │
                    └────────┼─────────────────────────────────────────────────────────┼────┘
                             │ 官方明确云端：自动字幕(移动/Web)、TTS、Auto reframe        │
                             ▼                                                          │
     ┌──────────────────────── 云端（产品后端，超出本章范围，仅示意）────────────────────┐ │
     │  ASR(Seed-ASR 系?)  TTS(火山语音/Seed-TTS 系?)  跟踪/裁剪  增强/超分  生成式(Seedance/Seedream) │
     └──────────────────────────────────────────────────────────────────────────────────┘ │
                     "系?" 表示公开资料只到"同源/服务过剪映"的程度，具体版本无从确认 ◄─────┘
```

---

## 2. 智能抠像 / 视频抠像（Robust Video Matting 核查）

### 2.1 功能（官方帮助/资源页）【官方/一手】(S)

- CapCut 有两条抠像路线：**Auto removal**（AI 识别主体，一键去背景）和 **Custom removal**（桌面端有 "Smart brush" 涂抹保留区域、"Smart eraser" 擦除多余区域；移动端为 Brush/Erase）。纯色背景另用 **Chroma key**。各平台入口不同：桌面端在 Video → Remove BG，Web 端在 Smart tools → Remove background，移动端在 Edit → Remove BG。来源：CapCut 资源页 *How to Remove Background in Capcut Using Advanced Features*，以及工具页 *Remove Video Background*。
- 剪映（中文）侧没有检索到官方帮助中心页面，只有第三方教程，因此本章不引用剪映的具体菜单。

### 2.2 Robust Video Matting 是不是 ByteDance 的论文？【官方/一手】(G)(S)

**结论：是 ByteDance 参与的研究成果，但没有任何公开资料证明 CapCut/剪映的线上抠像使用了 RVM。**

- 论文：*Robust High-Resolution Video Matting with Temporal Guidance*，WACV 2022。作者为 Shanchuan Lin、Linjie Yang、Imran Saleemi、Soumyadip Sengupta，单位为 University of Washington 和 ByteDance Inc.（arXiv 2108.11515，检索摘要 (S)）。核查补充：仓库 README 的 Contributors 列表与上述四位作者一致，README 更新记录写明 "[Jul 27 2021] Paper is accepted by WACV 2022"（(G)）；arXiv 编号与作者单位本次无法打开 arXiv 核对。
- 官方仓库 `PeterL1n/RobustVideoMatting` 的 README 原文写着 "The project was developed at ByteDance Inc."，许可证为 **GPL-3.0**（(G)，直接打开）。
- 骨干网络有 MobileNetV3（推荐）和 ResNet50 两种；导出格式包括 PyTorch、TorchScript（FP32/FP16，README 建议移动端自行做 int8 量化）、ONNX（opset 12）、TF SavedModel、TF.js（int8）、CoreML（固定分辨率，iOS 13+）。(G)
- README 中的速度表（只计张量吞吐，不含视频编解码）：GTX 1080 Ti FP32 跑 HD 为 104 FPS、4K 为 74 FPS（引言写 "4K 76FPS"，与表格略有出入）；RTX 3090 FP16 跑 HD 为 172 FPS、4K 为 154 FPS。`downsample_ratio` 推荐值：HD 用 0.25，4K 用 0.125。(G)

### 2.3 RVM 机制拆解（基于源码核对）【社区逆向/开源】(G)

本节依据直接阅读的 `model/model.py` 与 `model/decoder.py`：

```
 src (B,T,3,H,W) ──► 下采样 downsample_ratio ──► src_sm
                                         │
                       backbone(MobileNetV3/ResNet50) → f1,f2,f3,f4
                                         │                 f4 → ASPP
                                         ▼
       ┌──────── RecurrentDecoder(src_sm, f1..f4, r1..r4) ────────┐
       │ BottleneckBlock: 通道一分为二，后一半过 ConvGRU(r4)       │
       │ UpsamplingBlock×3: 上采样+concat(skip, src_sm)→Conv-BN-ReLU│
       │                   →通道一分为二，后一半过 ConvGRU(r3,r2,r1)│
       └──────────────────────────┬──────────────────────────────┘
                                  ▼ hid
            project_mat(hid) ─split→ fgr_residual(3) + pha(1)
                                  │
       if downsample_ratio != 1: refiner(src, src_sm, fgr_residual, pha, hid)
             refiner ∈ {DeepGuidedFilterRefiner, FastGuidedFilterRefiner}
                                  ▼
            fgr = clamp(fgr_residual + src, 0, 1);  pha = clamp(pha, 0, 1)
            return fgr, pha, r1', r2', r3', r4'        (segmentation_pass 时走 project_seg)
```

ConvGRU 的更新式（按 `decoder.py` 核对，⊙ 为逐元素乘，Conv 为 3×3 卷积）：

$$
\begin{aligned}
[r_t, z_t] &= \sigma\big(\mathrm{Conv}_{ih}([x_t, h_{t-1}])\big) \\
c_t &= \tanh\big(\mathrm{Conv}_{hh}([x_t,\; r_t \odot h_{t-1}])\big) \\
h_t &= (1 - z_t)\odot h_{t-1} + z_t \odot c_t
\end{aligned}
$$

设计要点（学习视角）：

1. **只让一半通道进入 GRU**。这样循环状态的显存开销减半，另一半通道保留逐帧的细节。
2. **在低分辨率上推理，再用 guided filter 上采样 alpha**。这是"4K 实时"的关键：主干网络的计算量只与 `H·W·ratio²` 成正比。
3. **输出前景残差**（`fgr = src + residual`），不直接输出前景，从而减轻 color spill（溢色）。
4. **循环状态 r1–r4 跨帧传递**。调用方要把上一帧返回的状态原样喂回下一帧；切镜头时应把状态清零（推断）。

原创伪代码（逐帧流式推理，说明调用约束）：

```python
# 原创示意：与 RVM 的调用方式等价，非仓库代码
state = [None] * 4                       # r1..r4
for frame in decoder.frames():           # frame: float32 [1,3,H,W], 0..1
    if shot_changed(frame):              # 推断：镜头切换时重置时间记忆
        state = [None] * 4
    fgr, pha, *state = model(frame, *state, downsample_ratio=pick_ratio(H, W))
    out = pha * fgr + (1 - pha) * background   # 合成到新背景
    encoder.write(out)

def pick_ratio(h, w):                    # 依 README：HD→0.25，4K→0.125，目标让短边≈256~512
    return min(1.0, 512 / max(h, w)) if max(h, w) > 512 else 1.0
```

把 alpha 交给渲染引擎合成的 GLSL 片元着色器（原创，适用于 OpenGL ES 3.0；前景纹理按非预乘存储）：

```glsl
#version 300 es
precision mediump float;
uniform sampler2D uFgr;   // RGB 前景（模型输出 fgr）
uniform sampler2D uPha;   // R 通道 = alpha
uniform sampler2D uBg;    // 新背景
uniform float uFeather;   // 边缘羽化，0~0.1
in vec2 vUV; out vec4 oColor;
void main() {
    float a = texture(uPha, vUV).r;
    a = smoothstep(0.0 + uFeather, 1.0 - uFeather, a);   // 模拟"羽化/收边"
    vec3 f = texture(uFgr, vUV).rgb;
    vec3 b = texture(uBg,  vUV).rgb;
    oColor = vec4(mix(b, f, a), 1.0);                       // C = αF + (1-α)B
}
```

### 2.4 火山引擎侧的公开对应物【官方/一手】(G)

- `volcengine/mediakit-cli` 是火山引擎 GitHub 组织下的 MIT 开源仓库，README 自称"Mediakit 官方 CLI"，npm 包名为 `@volcengine/mediakit-cli`。它的"智能视频（30 个能力，云端）"中包括**绿幕抠图、人像抠图**，"图片 AI（云端）"中包括背景移除。命令支持 `--cloud`/`--local` 模式；云端能力通过 MediaKit API 调用，需要 API key（`MEDIAKIT_API_KEY`）。README **没有提到剪映/CapCut**。核查补充：README 同时写明本地模式基于 `ffmpeg`/`ffprobe`，也覆盖"绿幕抠图"等常用能力，所以"绿幕抠图"并非只在云端提供；"人像抠图""图像背景移除"只列在云端能力中。
- 端侧 CV SDK（人像分割等）由相邻章节 (a) 负责，这里不展开。

### 2.5 端/云

- **CapCut 官方没有说明 Remove BG 在端侧还是云端运行。**
- 一条间接线索：CapCut 帮助页 *Why Is It Showing "Couldn't Apply AI Background"?* (S) 提到移动端每日 50 次上限，并建议桌面端用户**更新 GPU 驱动**、Web 端用户刷新并检查网络。"更新 GPU 驱动"暗示桌面端在本地 GPU 上做了部分推理。但要注意，该页讨论的 "AI Background" **可能是生成式换背景**，不一定是抠像本身。【推断】
- RVM 提供 CoreML/TF.js/int8 导出，说明"端侧实时视频抠像"在工程上可行，但这不能证明 CapCut 就是这么做的。【推断/业界通用】

---

## 3. 自动字幕（ASR）

### 3.1 功能与端/云（官方帮助页）【官方/一手】(S)

- *Why Aren't Auto Captions Working in CapCut?*：功能依赖**语音识别和云端处理**，"caption generation usually runs in the cloud"；网络慢或不稳定时会中断。（未能核实：capcut.com 在核查环境中无法访问，原句只来自检索摘要）
- *What If the Recognition of Subtitles Is Stuck at 99%?*：
  - 卡在 99% 通常意味着识别引擎已经完成，**卡在最终化、渲染或同步阶段**；
  - **Web**：识别在远端服务器上进行，刷新页面会取消任务；"CapCut Web does not support offline recognition"；
  - **Mobile**：使用云端语音识别，"even for projects that look offline"；
  - **Desktop**：**"部分地区"支持本地识别**，建议到 Settings 确认语言包已完整下载（未能核实）；
  - 建议把移动端视频拆成 ≤10 分钟的片段、Web 端上传控制在约 15 分钟以内。
- *How Do I Fix Inaccurate Auto-Captions in CapCut?*：错误来源包括背景噪声、口音、语速、音质；可以在字幕编辑器中修改、拆分后重新识别。
- 剪映：中国日报 2021-09-17 报道剪映专业版 2.0 支持"通过语音识别自动形成字幕"，以及"将文稿粘贴到软件中，一键完成内容匹配"（即文稿对齐）(S)。

### 3.2 公开的字节/火山技术【官方/一手】(S)

- **Seed-ASR**（arXiv 2407.04675，ByteDance Seed）：基于 **AcLLM（audio-conditioned LLM）** 框架，把连续语音表征和上下文信息一起输入 LLM。论文称在中英文公开测试集上相对近期大型 ASR 模型降低 10%–40% 的 WER/CER（未能核实）。论文脚注（据检索摘要）称能力已用于多个字节产品，并支撑国内豆包语音识别服务（未能核实）。**没有检索到"剪映使用 Seed-ASR"的公开表述。**
- 豆包团队博客（2024-08-22）称 Seed-ASR 已集成到**豆包 App 和火山引擎相关服务模块**（未能核实：team.doubao.com 在核查环境中无法访问）。
- **火山引擎"音视频字幕生成 / 自动字幕打轴"**（豆包语音文档目录 `docs/6561`）：官方说明的处理流程分三段，即**客户端抽取音轨并转成音频文件 → 提交音频得到任务 ID → 用任务 ID 查询结果**；提交时可以设置每行字数、每屏行数、数字转换等参数（参数名以官方文档为准，此处不臆造）。**文档未提及剪映。**

### 3.3 机制拆解：ASR 结果 → 时间线字幕【推断/业界通用】

```
音轨 ──► 解码/重采样(16k mono) ──► VAD 切段 ──► ASR(云 or 本地语言包)
                                                   │  词级时间戳 [(w, t0, t1, conf)]
                                                   ▼
                       断句/分行(每行字数, 每屏行数, 标点, 停顿) ──► 字幕段 [(text, start, end)]
                                                   ▼
                       写入草稿的文本轨（数据结构见相邻章节 draft_content.json）
```

原创的分行伪代码，实现"每行 N 字、每屏 M 行"规则：

```python
def segment(words, max_chars=16, max_lines=1, pause_split=0.45):
    """words: [(text, t0, t1)]，返回 [(text, start, end)]"""
    out, buf, lines, start = [], "", 0, None
    for i, (w, t0, t1) in enumerate(words):
        if start is None: start = t0
        gap = (words[i+1][1] - t1) if i + 1 < len(words) else 9e9
        buf += w
        line_full = len(buf) >= max_chars * (lines + 1)
        if line_full: lines += 1
        if lines >= max_lines or gap > pause_split or w in "。！？!?":
            out.append((buf, start, t1)); buf, lines, start = "", 0, None
    if buf: out.append((buf, start, words[-1][2]))
    return out
```

"文稿匹配"属于**强制对齐（forced alignment）**：已知文本，只求每个字的时间戳。它通常比自由识别更稳定，适合口播类内容。这里说的是业界通用做法，剪映的具体实现没有公开。

---

## 4. 文本朗读（TTS）与克隆音色

### 4.1 功能与端/云（官方帮助页）【官方/一手】(S)

- *Why Is the Text-to-Speech Feature Not Working in CapCut?*：失败原因包括网络问题、不支持的语言/音色、没有选中文本层等；**"Text-to-Speech relies on cloud processing"**（未能核实：原句只来自检索摘要）。
- *Why are some voice options in Text to Speech and AI Video Maker on CapCut missing or unavailable?*：把音色缺失归因于**服务端更新/维护、灰度发布、版本过旧**，建议使用公司/受限网络的用户换一个网络。这说明音色列表由服务端下发。
- 音色数量："200+ AI voices"（工具/营销页口径）；Script to video 相关页面又写"1,000+"。两处口径不一致，以 App 内实际列表为准。

### 4.2 公开的字节/火山技术【官方/一手】+ 媒体报道 (S)

> 核查降级说明：本表前两行来源是量子位的媒体报道，不属于 §0 定义的【官方/一手】，只能作为媒体口径引用。

| 来源 | 内容 | 与剪映/CapCut 的关系 |
|---|---|---|
| 量子位 2022-05（qbitai.com/2022/05/34433） | 字节跳动 AI Lab 智能语音与音频团队（SA 团队）把多语言、跨语言合成技术用于**剪映和 CapCut**；企业可通过火山引擎使用"同款"能力；报道称支持 17+ 语言、13+ 方言、100+ 风格音色（未能核实） | **明确提到剪映/CapCut**（媒体报道） |
| 量子位 2022-10（qbitai.com/2022/10/38916） | 火山语音 TTS 获 AI 国检中心增强级证书，音色 MOS "最高可达 4.64"（未能核实）；架构分**前端文本分析（文本正则化、多音字、分词、韵律预测）+ 声学模型 + 声码器**；服务抖音、**剪映**、飞书、番茄小说、Pico | **明确提到剪映** |
| ByteDance Seed 官方博客《校招生在豆包大模型团队如何快速成长？3位同学有话说》 | 受访者称其主导的自研 TTS 模型"已用在…**剪映**等平台"（未能核实） | 一手（访谈口径，无量化数据） |
| Seed-TTS（arXiv 2406.02430） | 大规模**自回归** TTS，强调语音 in-context learning；摘要提到 self-distillation 做 speech factorization、RL 提升说话人相似度与可控性；另有非自回归的 **Seed-TTS_DiT**（全扩散，不依赖预估音素时长，可做语音编辑）（模型细节未能核实） | 论文未直接写剪映；豆包语音合成即基于此系列（报道口径，未能核实）。核查补充 (G)：官方评测仓库 `BytedanceSpeech/seed-tts-eval` 的 README 指向 arXiv 2406.02430，确认编号；README 只说可在"ByteDance products"中体验，未点名剪映，并声明不开源 Seed-TTS 代码和权重 |
| 火山引擎豆包语音文档 | 目录中有"声音复刻大模型 / 声音复刻 API-V3 / 音色设计 API / 音色管理 API" | 文档未提剪映 |

### 4.3 机制拆解【推断/业界通用】

```
 文本 ─► 前端：正则化(数字/单位/符号) → 分词 → 多音字消歧 → 韵律层级(#1/#2/#3) → 音素序列
                                                          │
         ┌────────────── 传统(2022 报道) ───────────────┐  │  ┌──── 大模型(Seed-TTS 类) ────┐
         │ 声学模型(音素→梅尔谱) → 神经声码器(梅尔→波形)  │◄─┴─►│ 参考音频 prompt + 文本 →     │
         └──────────────────────────────────────────────┘     │ AR 语言模型出 speech tokens │
                                                               │ → 扩散/声码器还原波形       │
                                                               └─────────────────────────────┘
 输出 wav ─► 作为音频素材落到时间线（与对应文本段保持关联，以便"文本改了重新朗读"）
```

工程上的关键点：TTS 结果是**由文本派生的素材**。草稿里需要记录"文本、音色 ID、语速"与生成音频之间的绑定，才能做到"改字后重新生成"。这里是推断，数据结构由相邻章节负责。

---

## 5. 变声 / Voice changer

### 5.1 功能【官方/一手】(S)

- CapCut 的预设包括 Robot、Chipmunk、Elf、Deep、High 以及性别转换等，可以手动调 pitch 和 speed；移动端路径为 Audio → Voice effects，Web 端可"Preview 5s"试听。页面明确写着**不是实时变声**："does not change voices live but allows pre-recording and transformation"。来源：CapCut 工具页 *Voice Changer* 和资源页 *How to Change Your Voice with CapCut*。
- 剪映：没有检索到官方说明（变声、音色、声音效果之间的区别只有第三方教程）。

### 5.2 公开技术对应

- **没有找到**字节跳动公开的、与 CapCut 变声对应的产品文档或论文。【未确认】
- Seed-TTS 论文摘要中的 "speech factorization（self-distillation）" 属于音色解耦，在原理上可以用于声音转换，但本次没有打开原文核实它是否以 voice conversion 作为应用示例。【待补充】

### 5.3 机制拆解【推断/业界通用】

一类是 **DSP 预设**（Chipmunk/Deep）：本质上是变调不变速。半音数 n 对应的频率比为

$$ r = 2^{n/12} $$

做法通常是先用相位声码器或 WSOLA 把时长拉伸到 r 倍，再重采样回原时长。原创伪代码：

```python
def pitch_shift(x, sr, semitones):
    r = 2 ** (semitones / 12)
    y = time_stretch(x, rate=1/r)          # 相位声码器/WSOLA：时长×r，音高不变
    return resample(y, sr * r, sr)         # 重采样：时长回到原值，音高×r
# Robot: 环形调制 y = x * sin(2π·f_mod·t)，或把基频量化成常数后重合成
# 性别转换: 同时移动基频(F0)与共振峰(formant)，只移 F0 会出现"花栗鼠"感
```

另一类是 **AI 音色（神经声音转换）**：先提取内容表征（如 ASR 瓶颈特征或自监督特征），再用目标音色重新合成。它的计算量远大于 DSP，放在云端更常见。但 CapCut 没有说明哪些效果属于哪一类。

---

## 6. 降噪 / 人声分离

### 6.1 功能【官方/一手】(S)

- CapCut 桌面/Web 端在 Audio 面板里有 **Noise reduction**（开关或强度滑杆）。官方资源页建议从 30–40% 强度起步；如果人声听起来"robotic or underwater"，就把强度调小。导出时码率过低会让噪声"回来"。Video 面板里的 "Reduce image noise" 是**画面降噪**，与音频降噪是两回事。
- 第三方教程提到剪映有"音频降噪 / 人声美化 / 人声增强"等选项（低权重，不作为结论）。

### 6.2 公开的字节/火山技术

- 【官方/一手】(G)(S) **`bytedance/music_source_separation`**：论文 *Decoupling Magnitude and Phase Estimation with Deep ResUNet for Music Source Separation*（ISMIR 2021；作者 Qiuqiang Kong、Yin Cao、Haohe Liu、Keunwoo Choi、Yuxuan Wang，单位为 ByteDance，Cao 另属 University of Surrey；arXiv 2109.05418）。要点如下：
  - 把复数理想比值掩码（cIRM）**拆成幅度和相位两部分分别估计**；
  - 允许掩码幅度 **>1**，理由是 MUSDB18 中约 22% 的时频点 IRM > 1；
  - 使用最深 143 层的 ResUNet，MUSDB18 人声 SDR 为 8.98 dB（此前最佳为 7.24 dB）（论文摘要中的 8.98/7.24 dB 与上面"22% 的时频点"均未能核实；仓库 README 结果表中 ResUNet143 vocals 为 **8.9 dB**，MobileNet Subband 为 7.2 dB，与论文数字大致吻合 (G)）；
  - 仓库提供 ResUNet143（约 1.02 亿参数）、ResUNet143 Subband、**MobileNet Subband（约 0.306M 参数）**；README 称代码也可用于 speech enhancement；仓库已于 2026-02-03 归档（GitHub 页面显示 "archived by the owner on Feb 3, 2026"，(G) 已核实）；许可证为 **Apache-2.0**（仓库 LICENSE："Copyright 2021 ByteDance"，(G)）。
  - 作者顺序已由 README 的引用条目核实 (G)；Cao 另属 University of Surrey 的单位信息未能核实。
  - **该仓库与 CapCut 降噪之间没有公开关联。**
- 【官方/一手】(G) 火山 MediaKit 的"音频（云端）"能力中有**人声/背景分离**，"智能视频"中有**视频画质增强**。

### 6.3 机制拆解【推断/业界通用】

STFT 域掩码降噪的通式。设带噪信号为 $X(t,f)$，网络输出幅度掩码 $|M|$ 和相位旋转 $\angle M$，则

$$
\hat S(t,f) = |M(t,f)|\cdot|X(t,f)|\cdot e^{\,j(\angle X(t,f) + \angle M(t,f))}
$$

其中只估幅度、令 $\angle M=0$ 的做法最常见，上面那篇 ByteDance 论文就是在此基础上额外估计相位。UI 上的"强度滑杆"可以理解为在原信号和降噪结果之间插值，并在频谱上限制最小增益（推断）：

```python
def denoise(x, strength):              # strength ∈ [0,1]
    X = stft(x)
    M = model(abs(X))                  # 0..1(或允许>1) 的掩码
    floor = 1.0 - 0.9 * strength       # 最小增益：强度越大，压得越狠
    G = max(M, floor)                  # 增益下限，避免"水下音"(musical noise)
    return istft(G * X)
```

业界常用的轻量端侧参照是 **RNNoise**（Xiph，BSD-3-Clause），论文为 J.-M. Valin 的 *A Hybrid DSP/Deep Learning Approach to Real-Time Full-Band Speech Enhancement*（arXiv 1709.08243），示例工具处理 48 kHz 单声道 PCM。(G)【社区逆向/开源】

---

## 7. 自动卡点 / 踩节拍 / Beat Sync

### 7.1 功能【官方/一手】(S) + 第三方 (S)

- CapCut 帮助页 *What Is Auto Cut in CapCut?* / *How to Use Auto Cut?*：桌面端在顶部 "AI" 按钮或 Edit → AI Tools → Auto Cut 中选择 **Beat Sync**；移动端的 Auto Cut 也可能叫 "Beat Cut" 或 "Rhythm Edit"，选好歌曲后会按节拍切分片段；**截至 2026 年初 Web 端没有 Auto Cut**。
- 剪映（第三方教程 pconline，低权重）：桌面端分两档，"**踩节拍 I**（稀疏）/ **踩节拍 II**（稠密）"；手动标记按 M 键；带原声的视频需要先"分离音频"再踩点。

### 7.2 公开技术对应

**没有检索到**字节跳动关于节拍跟踪、与卡点功能对应的论文或产品文档。【未确认】

### 7.3 机制拆解：Ellis 动态规划节拍跟踪【社区逆向/开源】(G)

librosa 的 `beat_track` 直接引用了 Ellis, D. P. W. *Beat tracking by dynamic programming*, JNMR 36(1), 2007。流程为：先算 onset strength 包络（`onset_strength`，median 聚合），再估计 tempo（`start_bpm` 作初值），然后做动态规划，用 `tightness` 惩罚偏离节拍周期的间隔，最后回溯得到节拍序列（`trim` 去掉首尾的弱拍）。目标函数：

$$
C^*(t) = O(t) + \max_{\tau}\Big\{ -\alpha\Big(\log\tfrac{t-\tau}{\tau_p}\Big)^2 + C^*(\tau) \Big\}
$$

其中 $O(t)$ 是 onset 强度，$\tau_p$ 是节拍周期，$\alpha$ 对应 `tightness`。

"踩节拍 I/II"在实现上可以理解为对同一组节拍取"强拍/全部拍"（推断）。下面是原创伪代码：把素材切点吸附到节拍上，实现一键卡点。

```python
def auto_cut(clips, beats, density="I", min_len=0.4):
    """clips: 素材列表(按顺序)；beats: 节拍时间(秒)；返回 [(clip, in, out, timeline_start)]"""
    grid = beats[::2] if density == "I" else beats      # I: 稀疏(隔拍)  II: 稠密(每拍)
    grid = [b for i, b in enumerate(grid) if i == 0 or b - grid[i-1] >= min_len]
    plan, k = [], 0
    for a, b in zip(grid, grid[1:]):
        c = clips[k % len(clips)]; dur = b - a
        src_in = best_segment(c, dur)                     # 推断：用运动/人脸/清晰度挑高光段
        plan.append((c, src_in, src_in + dur, a)); k += 1
    return plan
```

---

## 8. 画质增强 / 超分（Enhance quality / AI 超清）

### 8.1 功能【官方/一手】(S)

- CapCut 桌面端：Video → Basic → **Enhance quality**，档位为 **HD / UHD / 4K**（部分页面只列 HD/UHD，因版本而异），旁边另有 "Reduce image noise"；移动端在 Adjust → Video quality。
- CapCut 营销资源页称 "cloud-based AI processing offloads heavy computation from your device"。**这只是营销资源页，不是帮助中心说明，只能算弱证据。**
- 剪映：科技日报 2026-09-20 报道，过去一年剪映专业版陆续上线了"多时间线、素材混排、草稿本地备份、素材变形、平面跟踪、**AI 超清**和**二级调色**等功能"。(S)

### 8.2 公开的字节/火山技术【官方/一手】

- (S) **BytePlus VOD 视频增强模板（legacy）**：包括超分、**插帧**、SDR 色彩增强、**SDR→HDR**、降噪，适用于 1080p 以下的输入，输出分辨率取决于源质量。
- (S) **BytePlus VOD 增强 Skill**（`byted-byteplus-vod-video-enhancement`）：集成 30+ 算法（超分、插帧、锐化、色彩增强等），由**决策引擎**分析输入后自动选择组合；主要场景是把低分辨率 AIGC 视频提升到 2K/4K。（未能核实：docs.byteplus.com 在核查环境中无法访问，Skill 名称与"30+ 算法"均只来自检索摘要）
- (G) **火山 MediaKit**：`video enhance-video --resolution 1080p` 等命令，提供视频画质增强（含快速版和生成式版本）。
- (G) **SeedVR / SeedVR2**（ByteDance-Seed GitHub，Apache-2.0）：
  - SeedVR：*Seeding Infinity in Diffusion Transformer Towards Generic Video Restoration*，CVPR 2025 Highlight，基于扩散 Transformer，支持任意分辨率复原，不依赖预训练扩散先验；
  - SeedVR2：*One-Step Video Restoration via Diffusion Adversarial Post-Training*，ICLR 2026，**单步扩散**，使用自适应窗口注意力（窗口随输出分辨率调整）和 feature matching loss；
  - README 自述局限：对重度退化和大幅运动不够鲁棒，可能把轻度退化的 720p AIGC 视频**过度锐化**；
  - **README 没有提到 CapCut/Dreamina 或任何产品部署。**

### 8.3 机制拆解【推断/业界通用】

```
          ┌─────────────── 决策 (BytePlus 文档称"决策引擎") ───────────────┐
 输入视频 ─► 质量分析(分辨率/码率/噪声/压缩块效应/是否AIGC) ──► 选算法链
          └───────────────────────────────────────────────────────────────┘
                         │
     ┌───────────┬───────┴──────┬──────────────┬──────────────┐
     ▼           ▼              ▼              ▼              ▼
  去块/去噪    超分(×2/×4)    锐化/细节     色彩增强/HDR     插帧(可选)
  (轻量CNN)   (CNN 或 扩散)                 (曲线/LUT)
     └───────────┴──────────────┴──────────────┴──────────────┘
                         ▼
                 编码输出 (HD/UHD/4K 档位 ≈ 目标短边 1080/2160...)
```

切块推理（tile）是端侧和云端都常用的显存控制手段。原创伪代码：

```python
def upscale_frame(img, model, scale=2, tile=256, pad=16):
    H, W = img.shape[:2]; out = zeros((H*scale, W*scale, 3))
    for y in range(0, H, tile):
        for x in range(0, W, tile):
            y0, x0 = max(0, y-pad), max(0, x-pad)
            y1, x1 = min(H, y+tile+pad), min(W, x+tile+pad)
            sr = model(img[y0:y1, x0:x1])                       # 带重叠边，避免拼缝
            oy, ox = (y-y0)*scale, (x-x0)*scale
            th, tw = min(tile, H-y)*scale, min(tile, W-x)*scale
            out[y*scale:y*scale+th, x*scale:x*scale+tw] = sr[oy:oy+th, ox:ox+tw]
    return out
```

时域一致性（逐帧超分会闪烁）是视频超分的核心难点。SeedVR 这类视频扩散模型直接在时空 token 上建模，以此缓解闪烁。

---

## 9. 智能补帧 / 光流慢动作（Optical flow）

### 9.1 功能【官方/一手】(S)

- CapCut：选中片段 → Video → Basic → 打开 **Optical flow** → 选帧率（多数页面写 30/50/60 fps，另有页面写 24–120 fps，口径不一）。**只有片段被放慢时才生效**（"If the speed remains unchanged, the feature won't activate"）。
- 官方资源页把 Optical flow（分析像素运动，生成中间帧）和 frame blending（相邻帧交叉淡化，会有鬼影）区分开，并提醒快速运动会产生扭曲，建议先防抖再补帧。
- 剪映：第三方博客称有"AI 光流 / 帧融合"等选项，且"光流"耗时约为 3 倍（**未核实**）。

### 9.2 公开技术对应

- 【官方/一手】(S) BytePlus VOD 增强模板和 Skill 中都有**插帧**（云端媒体处理）。
- **没有找到**与剪映补帧对应的字节论文。【未确认】
- 业界参照【社区逆向/开源】(G)：RIFE（ECCV 2022，*Real-Time Intermediate Flow Estimation for Video Frame Interpolation*，MIT 许可，仓库安装命令指向 `megvii-research`），README 称 2080Ti 上 2× 720p 可达 30+ FPS，并支持任意时间步插值。

### 9.3 机制拆解【推断/业界通用】

中间帧合成的通式（反向光流 warp + 融合掩码）：

$$
\hat I_t = m \odot \mathcal{W}(I_0, F_{t\to 0}) + (1-m)\odot \mathcal{W}(I_1, F_{t\to 1}),\quad
F_{t\to0}\approx -t\,F_{0\to1},\; F_{t\to1}\approx (1-t)\,F_{0\to1}
$$

"变速后需要多少新帧"由变速曲线决定：输出第 k 帧对应源时间 $s(k/\text{fps}_{out})$，取 $t = \mathrm{frac}(s\cdot \text{fps}_{src})$。

原创 GLSL（假设光流已由模型算好并以 RG16F 纹理传入，单位为像素）：

```glsl
#version 300 es
precision highp float;
uniform sampler2D uI0, uI1;     // 相邻两帧
uniform sampler2D uFlow01;      // F_{0→1}，像素单位
uniform sampler2D uMask;        // 融合/遮挡掩码 m（可选，由模型给出）
uniform vec2  uTexel;           // 1/width, 1/height
uniform float uT;               // 0<t<1
in vec2 vUV; out vec4 o;
void main() {
    vec2 f = texture(uFlow01, vUV).xy;              // 近似：用 0→1 光流线性缩放
    vec2 uv0 = vUV + (-uT)       * f * uTexel;      // 反向采样 I0
    vec2 uv1 = vUV + (1.0 - uT)  * f * uTexel;      // 反向采样 I1
    vec3 c0 = texture(uI0, uv0).rgb, c1 = texture(uI1, uv1).rgb;
    float m = texture(uMask, vUV).r;                // 无掩码时取 1.0-uT
    o = vec4(mix(c1, c0, m), 1.0);
}
// frame blending 退化版：o = mix(I0(vUV), I1(vUV), uT) —— 即官方页说的"鬼影"来源
```

---

## 10. 防抖（Stabilize）

### 10.1 功能【官方/一手】(S)

- CapCut：Video → Basic → **Stabilize**，三档为 **Recommended / Minimum cut / Most stable**。档位越"稳"，裁切越多；Minimum cut 保留的画幅最多。官方资源页提醒数字防抖会带来一定画质损失。Web 端还可以在 Magic tools → Video stabilization 中使用。
- CapCut 的 "Seedance 2.0: AI Video Stabilization" 页面（ideas 栏目）说的是**生成式视频本身抖动更少**，真正的防抖步骤仍然是编辑器里的 Stabilize。这是营销页面。

### 10.2 公开技术对应

**没有找到**字节跳动公开的防抖论文或产品文档。【未确认】

### 10.3 机制拆解：两遍式路径平滑【社区逆向/开源】(G) +【推断】

业界参照 vid.stab（LGPL-2.1+；核查补充：仓库 LICENSE 注明 v1.1.2 及以前的版本为 GPL，之后才改为 LGPL，(G)）：第一遍 `vidstabdetect` 估计帧间平移和旋转，写入 `transforms.trf`；第二遍 `vidstabtransform` 对相机路径做低通平滑（`smoothing`=n 表示窗口 2n+1 帧，`optalgo=gauss`），再用 `optzoom`/`zoom`/`crop` 处理黑边。

```
 帧间运动 T_i (dx,dy,dθ) ──累积──► 原始路径 C_t = Σ T_i
                                     │ 高斯/卡尔曼/L1 平滑
                                     ▼
                              平滑路径 P_t
 校正变换 B_t = P_t − C_t ──► warp 每帧 ──► 统一裁切/缩放 s 以去黑边
```

$$
P_t=\sum_{k=-n}^{n} w_k\,C_{t+k},\qquad w_k\propto e^{-k^2/2\sigma^2},\qquad
s \ge 1+\frac{2\max_t\|B_t^{xy}\|}{\min(W,H)}
$$

把三档映射到参数（推断）：Minimum cut 对应小 σ 加位移上限（类似 `maxshift`），Most stable 对应大 σ 或固定机位（`smoothing=0` 时相当于三脚架效果）。原创伪代码：

```python
def stabilize(frames, level):
    sigma, max_shift = {"min_cut": (4, 0.04), "recommended": (10, 0.08), "most": (30, 0.15)}[level]
    T = [estimate_rigid(a, b) for a, b in pairwise(frames)]   # 特征点+RANSAC 或 光流
    C = cumsum(T); P = gaussian_smooth(C, sigma)
    B = clip(P - C, -max_shift, max_shift)                     # 限制校正幅度→限制裁切
    s = 1 + 2 * max_abs_xy(B)                                  # 统一缩放去黑边
    return [warp(f, B[i], scale=s) for i, f in enumerate(frames)]
```

---

## 11. 智能裁剪（Auto reframe）

### 11.1 功能与端/云【官方/一手】(S)

- 桌面端：Video → **Auto reframe** → 选 Aspect ratio（16:9 / 9:16 / 1:1 等），调节 **Image stabilization** 和 **Camera moving speed** → Apply。
- 帮助页 *Why Do I Have to Pay Now for the Auto Reframe?*：Auto Reframe 起初是免费预览或限时试用，现已移入 **CapCut Pro**。理由的原文要点是它使用 **"real-time AI object tracking, which consumes cloud-based processing resources"**；基础的裁剪和缩放仍然免费。**这是本章少数能找到的官方"云端"表述之一。**（未能核实：核查时 capcut.com 无法访问，这句引文只来自检索摘要，引用前必须回原页面逐字确认）

### 11.2 公开技术对应

**没有找到**字节跳动公开的 reframe 论文。【未确认】

### 11.3 机制拆解：参照 Google AutoFlip【社区逆向/开源】(G) +【推断】

AutoFlip（MediaPipe）的流程：先按 480 宽缩放提特征，`ShotBoundaryCalculator` 切镜头，再做人脸、物体、显著性检测，由 `SignalFusingCalculator` 按优先级加权（人脸核心关键点 0.85–0.9 > 人脸 0.8–0.85 > 人体 0.75–0.8 > 宠物/车 0.7–0.75 > 一般物体 0.1–0.2），最后由 `SceneCroppingCalculator` **按镜头决定"固定机位"还是"跟拍"**（`motion_stabilization_threshold_percent`），必要时加模糊填充。

CapCut 的两个滑杆可以分别映射为：**Image stabilization** 对应裁剪窗口轨迹的平滑强度，**Camera moving speed** 对应窗口最大速度或加速度（推断）。原创伪代码：

```python
def auto_reframe(frames, target_ar, stab=0.7, speed=0.5):
    shots = split_shots(frames)
    path = []
    for shot in shots:
        cx = [weighted_centroid(detect(f)) for f in shot]        # 人脸>人体>物体 加权
        if spread(cx) < 0.5 * crop_width(target_ar):             # 主体活动范围小 → 固定机位
            path += [median(cx)] * len(shot); continue
        x = cx[0]; v_max = lerp(0.002, 0.03, speed)               # 归一化宽度/帧
        for c in cx:                                              # 一阶跟随 + 限速
            x += clamp((c - x) * (1 - stab), -v_max, v_max)
            path.append(x)
    return [crop(f, center_x=path[i], ar=target_ar) for i, f in enumerate(frames)]
```

"按镜头重置"非常重要：跨切点继续平滑，会让裁剪框在新镜头开头"滑"过去。

---

## 12. 智能调色（AI color correction / Color match）

### 12.1 功能【官方/一手】(S)

- **AI color correction**：自动调整白平衡、对比度、饱和度，部分版本带强度滑杆。
- **Color match**：选一个参考帧或参考片段，把它的色彩迁移到当前素材，强度可调；移动端可以 "Apply all"。
- 剪映：2026-09 的报道提到专业版新增"**二级调色**"（局部/限定色域调色），见 §8.1 来源。

### 12.2 公开技术对应

- (S) **AceTone**（CVPR 2026；Tianren Ma、Mingxiang Liao、Xijin Zhang、Qixiang Ye；单位标注为 UCAS 与 ByteDance）：把调色视为**生成式颜色变换**，以文本或参考图为条件，**直接生成 3D LUT**。来源是第三方论文聚合页，页眉信息不一致，**需复核**，也**没有与 CapCut 关联的证据**。【证据等级：第三方聚合页，不属于【官方/一手】】（未能核实：会议、作者、单位均未找到一手来源）
- 业界参照【社区逆向/开源】(G)：*Learning Image-adaptive 3D Lookup Tables for High Performance Photo Enhancement in Real-time*（TPAMI 2022，Apache-2.0）。做法是用若干**基 LUT**，加一个在下采样图上预测融合权重的小 CNN（<600K 参数），4K 图像耗时 <2 ms（Titan RTX）。

### 12.3 机制拆解【推断/业界通用】

"AI 自动调色"有一种很适合端侧的形态：**小网络只负责出参数（LUT 权重或曲线），全分辨率的像素运算交给 GPU 查表**。

```
 缩略图(256²) ─► 小 CNN ─► w_1..w_K ──► LUT = Σ w_k·LUT_k ──► 上传为 3D 纹理/2D 图集
                                                         │
 全分辨率帧 ───────────────────────────────────────────► GLSL 查表(三线性) ─► 输出
```

原创 GLSL：把 33³ 的 LUT 以 2D 图集形式（33 个切片横排，宽 33×33、高 33）采样，用手工三线性插值，兼容不支持 3D 纹理的 ES 2.0 环境（下面写成 ES 3.0 语法）：

```glsl
#version 300 es
precision highp float;
uniform sampler2D uSrc;
uniform sampler2D uLutAtlas;     // 尺寸 (N*N) x N，N=33
uniform float uN;                // 33.0
uniform float uStrength;         // 0..1，对应"强度"滑杆
in vec2 vUV; out vec4 o;

vec3 lutSample(vec3 c) {
    float n = uN - 1.0;
    float b = c.b * n;
    float b0 = floor(b), b1 = min(b0 + 1.0, n);
    vec2 rg = (c.rg * n + 0.5) / vec2(uN * uN, uN);           // 切片内坐标(半像素居中)
    vec2 uv0 = rg + vec2(b0 / uN, 0.0);
    vec2 uv1 = rg + vec2(b1 / uN, 0.0);
    // 切片内的 r/g 由硬件双线性完成，切片间的 b 手动线性 → 三线性
    return mix(texture(uLutAtlas, uv0).rgb, texture(uLutAtlas, uv1).rgb, b - b0);
}
void main() {
    vec3 c = texture(uSrc, vUV).rgb;
    o = vec4(mix(c, lutSample(clamp(c, 0.0, 1.0)), uStrength), 1.0);
}
```

**Color match** 最经典的可解释基线是 Reinhard 色彩迁移：在 $l\alpha\beta$（或 Lab）空间逐通道匹配均值和方差，

$$ x' = \frac{\sigma_{ref}}{\sigma_{src}}\,(x-\mu_{src}) + \mu_{ref} $$

再把这个映射"烘焙"成 3D LUT，交给上面的着色器执行。这样逐帧只剩查表，开销极低（推断）。

---

## 13. 一键成片 / 图文成片 / Script to video / Auto Cut

### 13.1 演进时间线（公开报道与官方页）媒体报道 (S)

> 核查降级说明：原标【官方/一手】。下表所有来源都是中国日报、爱范儿、科技日报、新华网等媒体报道，不是字节/剪映官方页面或新闻稿，按 §0 的定义不属于【官方/一手】，表中内容本次也都未能逐字核实。

| 时间 | 事件 | 来源 |
|---|---|---|
| 2021-04 | 剪映在新榜大会公开"**图文成片**"：输入文字后智能匹配图片素材，自动加字幕、旁白、音乐，用户可再手动精修 | 中国日报中文网 2021-04-01 |
| 2021-09 | 剪映专业版 2.0：语音识别自动生成字幕；粘贴文稿后"一键完成内容匹配" | 中国日报中文网 2021-09-17 |
| 2025 | 剪映提出 "All in AI, All in One"，推出"**AI 文字成片**""**AI 配音 3.0**" | 爱范儿 ifanr.com/1639648 |
| 2026-09-20 | 剪映"AI 新创作发布会"：推出**剪映 Hub**（无限画布 + 多轨编辑器，可从一句话、参考视频或文档出发，调用**即梦、小云雀**生成图片、视频、音频素材）、移动端智能创作 Agent "**小映**"；专业版的"**剪映助手**"负责素材整理、口播删减、字幕纠错、视频包装 | 科技日报 2026-09-20、新华网 2026-09-21 |

CapCut 侧：**Script to video**（输入脚本或让 AI 写脚本，选择 "Smart generation" 自动选素材，或 "Local materials" 用自己的素材；旁白由 TTS 生成；之后进入多轨编辑器替换素材；**有地区限制**）；**Auto Cut**（见 §7）。

### 13.2 机制拆解：一个"文稿 → 时间线"的编排器【推断/业界通用】

```
 文稿/主题 ─► (LLM) 脚本化：分镜段落 [seg_i: 文本, 情绪, 关键词, 目标时长]
                 │
                 ├─► TTS(云)：每段旁白 wav + 精确时长 d_i   ← 时长由 TTS 决定，反推画面时长
                 ├─► 素材检索：关键词/向量 → 素材库(云) 或 本地相册(Local materials)
                 │              或 生成式(Seedream 出图 / Seedance 出视频，见 §14)
                 ├─► BGM 选择 + 节拍(§7) ─► 切点吸附到节拍
                 └─► 字幕 = 文本 + TTS 对齐时间戳(§3)
                                    ▼
                模板/样式(字幕花字、转场、滤镜) ──► 生成草稿(结构见相邻章节) ──► 用户精修
```

原创伪代码（核心是"以旁白时长驱动画面时长"）：

```python
def script_to_timeline(script, voice, use_local=False):
    t, tracks = 0.0, {"video": [], "audio": [], "text": []}
    for seg in llm_split(script):                       # 分段：文本+关键词
        wav, dur, word_ts = tts(seg.text, voice)        # 云端 TTS，返回词级时间戳
        clip = pick_local(seg) if use_local else search_stock(seg.keywords, dur)
        tracks["video"].append(place(clip, start=t, dur=max(dur, 1.5)))
        tracks["audio"].append(place(wav, start=t))
        tracks["text"] += [(w, t + a, t + b) for (w, a, b) in group_words(word_ts)]
        t += dur
    tracks["bgm"] = fit_bgm(total=t, snap_cuts_to_beats=True)
    return tracks                                        # 写入草稿，交给用户精修
```

模板（"剪同款"）属于参数化草稿替换，数据结构由相邻章节 (b) 负责，本章不展开。

---

## 14. 生成式 AI：Seedream / Seedance / Dreamina / 即梦

### 14.1 产品关系【官方/一手】+ 报道 (G)(S)

```
                     ByteDance Seed（模型研发）
          GitHub 组织页自述：模型支撑 Doubao、Coze、Jimeng(即梦) 等产品  (G)
                 │ Seedream(图)   Seedance(视频/音视频)
     ┌───────────┼─────────────────────┬─────────────────────────┐
     ▼           ▼                     ▼                         ▼
  即梦(国内)    Dreamina(海外)       剪映(国内)                CapCut(海外)
  原名 Dreamina, dreamina.capcut.com 2026-06 接入 Seedance       2026-03 Video Studio(Web, Seedance 2.0)
  2024-05 改名   (Seedream 4.0 页面)  2.0 mini，纳入会员/积分;  2026-04 newsroom：分阶段向付费用户开放
  剪映旗下                            2026-09 剪映 Hub 调用即梦  Seedance 2.0；Web 图像编辑器可用 Seedream 4.0
                                      /小云雀
                 火山引擎/BytePlus：对外 API（如 2026-06-15 上线 Seedance 2.0 mini）
```

- **即梦与 Dreamina**：第三方报道称即梦是剪映旗下的 AI 创作平台，2024-05 由 Dreamina 更名为即梦，海外版仍叫 Dreamina（(S)，掘金/第三方，中等权重）。Dreamina 的资源页挂在 `dreamina.capcut.com` 域名下（(S)，官方站点）。
- **CapCut 集成 Seedance 2.0**：
  - CapCut Newsroom《Unlocking New Creative Possibilities with Dreamina Seedance 2.0》（英文版日期为 2026-04-10，部分译文版标为 04-01）：**分阶段向付费用户开放**，首批为印尼、菲律宾、泰国、越南、马来西亚、巴西、墨西哥；强调对违反安全政策、**未经授权使用他人肖像或知识产权**有防护；同一模型也将上线 Dreamina 和 Pippit；单段最长 15 秒，支持 6 种画幅（罗马尼亚语版本口径）。(S)（未能核实：首批市场名单、日期与 15 秒/6 种画幅均未能打开 newsroom 原文核对）
  - TechCrunch 和 DeepLearning.AI *The Batch* 报道了同一批市场，并提到此前因好莱坞 IP 争议，全球发布一度暂停。(S)
  - **Video Studio**：2026-03 下旬在 CapCut Web 上线的**无时间线画布式工作区**，由 Dreamina Seedance 2.0 驱动（NoFilmSchool、Gigazine 等第三方报道）。(S)
- **剪映集成 Seedance**：2026-02-12 字节正式发布 Seedance 2.0，先在即梦和豆包灰度上线（科技日报）（未能核实）；2026-06-15 火山引擎上线 **Seedance 2.0 mini**，剪映、即梦、小云雀都宣传"首发"（未能核实）。剪映把模型纳入**原有会员和积分体系**，报道估算单秒成本约 0.16–0.25 元（虎嗅/人人都是产品经理转载，(S)）。
- **Seedream 4.0 in CapCut**：CapCut 资源页称 Web 端 Image editor 中的图像生成器可用 Seedream 4.0，生成的图片可以直接拿去做动画、加字幕或风格化（"instant video-ready integration"）。(S)

### 14.2 模型技术要点（论文/官方页）【官方/一手】(S)

| 模型 | 公开文献 | 关键技术点（只记录检索摘要能确认的部分） |
|---|---|---|
| **Seedance 1.0** | arXiv 2506.09113，*Seedance 1.0: Exploring the Boundaries of Video Generation Models*（Seed Vision Team） | **MMDiT**，空间层和时间层**解耦**（空间层对视觉+文本 token 做联合自注意力，模态分权重；时间层只看视觉 token），配合窗口注意力；**Multishot MM-RoPE**（视觉 token 3D 位置编码，文本 1D）支持多镜头；把 T2I/T2V/I2V 统一为"噪声输入 + 条件帧 + 二值 mask"的混合训练；级联**扩散 refiner** 负责高分辨率；SFT 之后做视频专用 **RLHF**（基础、运动、美学三类奖励模型）；多阶段蒸馏加系统优化，号称 **~10× 推理加速**；论文给出 5 秒 1080p 在 NVIDIA L20 上约 41.4 秒（TSCD、RayFlow、精简 VAE decoder 等细节来自第三方综述，待复核）（未能核实：arXiv 与 seed.bytedance.com 在核查环境中均无法访问；~10× 与 41.4 秒与核查者印象中的摘要一致，但没有打开原文） |
| **Seedance 2.0** | arXiv 2604.14148，*Seedance 2.0: Advancing Video Generation for World Complexity*（2026-04-15）（论文编号、标题、日期均未能核实）；Seed 官方页、发布博客 | "**统一的多模态音视频联合生成架构**"，输入为文本、图像、音频、视频四种模态；最多 **9 图 + 3 视频 + 3 音频** + 文本指令；输出 **4–15 秒、480p/720p**，原生带音频；可以参考素材的构图、运动、运镜、特效、音频；支持局部区域或音频编辑、前后延展（The Batch 报道） |
| **Seedream 4.0** | arXiv 2509.20427，*Seedream 4.0: Toward Next-generation Multimodal Image Generation* | **DiT + 高压缩 VAE**（减少图像 token 数），把文生图、图像编辑、多图组合合并到一个模型；原生 1K–4K；不计提示词增强时，2K 图约 1.4 秒（未能核实，且存疑：核查者印象中该论文摘要写的是 2K 图"最快约 1.8 秒"，与此处数字不一致；无法打开 arXiv 原文，引用前必须回原文确认） |

### 14.3 机制拆解：剪辑器如何"消费"生成式模型【推断/业界通用】

```
 时间线选区/画布节点 ──► 组装请求：prompt + 参考(≤9图/≤3视频/≤3音频) + 时长(4–15s) + 画幅
          │                         │ 积分预扣 / 会员额度（剪映：会员+积分体系）
          ▼                         ▼
     异步任务(task_id) ──轮询/推送──► 结果 mp4(含音轨) ──► 下载为普通素材 ──► 入轨/入画布
          │                                                       │
          └── 安全审核/肖像与IP防护(CapCut newsroom 所述) ─────────┘   AIGC 标识(元数据/水印, 推断)
```

**为什么几乎可以肯定在云端**（推断）：论文报告的推理耗时以 L20 级服务器 GPU 计（5 秒 1080p 需要几十秒），产品采用积分和按秒计费，Web 端（Video Studio）也能使用。这些都与端侧推理不符。但**官方页面没有出现"cloud"字样的直接表述**，所以总表里仍记作"未直接说明"。

---

## 15. 端侧 vs 云端：综合判断与架构推演

### 15.1 有官方表述的（可以引用）【官方/一手】(S)

> 核查提示：下表三条"官方云端表述"的原句都只来自检索摘要，本次核查无法访问 capcut.com，均未能核实（见 §3.1、§4.1、§11.1 的标注）。引用前需回原页面逐字确认。

| 功能 | 官方表述 | 出处 |
|---|---|---|
| 自动字幕 | 移动端为云端识别；Web 端在远端服务器识别，不支持离线；桌面端"部分地区"可本地识别，需语言包 | *Stuck at 99%*、*Auto captions* 帮助页 |
| TTS | relies on cloud processing；音色缺失与服务端维护、灰度有关 | *Text-to-Speech Not Working*、*voice options missing* 帮助页 |
| Auto reframe | real-time AI object tracking consumes cloud-based processing resources → 移入 Pro | *Why Do I Have to Pay Now for the Auto Reframe?* 帮助页 |

### 15.2 没有官方表述、只能推断的【推断/业界通用】

| 功能 | 倾向 | 理由 |
|---|---|---|
| 卡点、防抖、调色（LUT）、frame blending | 端侧 | 计算量小，或可以拆成"小网络出参数 + GPU 逐像素"；离线可用对体验很重要 |
| 抠像 | 两者都可能 | RVM 一类模型能在端侧实时运行；桌面端"AI Background"排障建议更新 GPU 驱动（不一定是同一功能） |
| 光流补帧、画质增强 | 两者都可能，依档位而定 | 高档位（4K、生成式增强）倾向云端；BytePlus 和火山都有对应的云端产品；CapCut 营销页称有云端处理 |
| 变声 | DSP 预设在端侧；"AI voice" 可能在云端 | 计算量差异大 |
| 一键成片、Script to video | 云端为主 | 依赖云端 TTS、素材库、LLM |
| 生成式（Seedance/Seedream） | 云端 | 见 §14.3 |

### 15.3 一个合理的客户端"AI 能力调度层"抽象（原创，学习用）【推断/业界通用】

```python
class AICapability:
    name: str
    local_impl: Optional[Callable]   # 端侧模型（随资源包下发，见相邻章节 a）
    cloud_impl: Optional[Callable]   # 云端任务（上传→task_id→轮询）
    needs_network: bool
    entitlement: str                 # free / pro / credits

def run(cap, media, params, ctx):
    if not ctx.has_entitlement(cap.entitlement):
        raise Paywall(cap.name)                         # 例：Auto reframe → Pro
    if cap.local_impl and ctx.device.can_run(cap) and (not cap.needs_network or ctx.prefer_local):
        return cap.local_impl(media, params)            # 例：桌面端本地 ASR(需语言包)
    if not ctx.online:
        raise NeedNetwork(cap.name)                     # 例：Web/移动端字幕"不支持离线"
    tid = cloud_submit(cap, upload(media), params)      # 例：字幕/TTS/生成式
    return poll_until_done(tid, on_99=finalize_and_sync)  # "卡在 99%"＝最终化/同步阶段
```

---

## 16. 学习者可动手复现的开源积木

【社区逆向/开源】(G)。下面全是公开开源项目，**不代表 CapCut 的实现**，只用来理解机制：

| 功能 | 开源积木 | 许可证 | 备注 |
|---|---|---|---|
| 视频抠像 | `PeterL1n/RobustVideoMatting` | GPL-3.0 | ByteDance 开发，可导出 ONNX/CoreML/TF.js |
| 音源分离/降噪 | `bytedance/music_source_separation` | Apache-2.0 | ByteDance，ISMIR 2021，已归档 |
| 实时语音降噪 | `xiph/rnnoise` | BSD-3-Clause | 混合 DSP+RNN |
| 节拍跟踪 | `librosa` 的 `beat_track` | ISC（librosa 主仓库） | Ellis 2007 动态规划 |
| 补帧 | `hzwer/ECCV2022-RIFE` | MIT | 任意时间步 |
| 防抖 | `georgmartius/vid.stab` | LGPL-2.1+（v1.1.2 及以前为 GPL） | FFmpeg `vidstabdetect/vidstabtransform` |
| 智能裁剪 | MediaPipe AutoFlip | Apache-2.0（MediaPipe） | 镜头级固定/跟拍决策 |
| 自动调色 | `HuiZeng/Image-Adaptive-3DLUT` | Apache-2.0 | 基 LUT + 权重 CNN |
| 视频复原/超分 | `ByteDance-Seed/SeedVR` | Apache-2.0 | 扩散 Transformer，SeedVR2 为单步 |
| 云端媒体处理 CLI | `volcengine/mediakit-cli` | MIT | 抠像、ASR 字幕、画质增强等（云） |

注：表中许可证已在核查中逐一打开仓库 LICENSE 文件核对 (G)：librosa 为 ISC，MediaPipe 为 Apache-2.0，`music_source_separation` 为 Apache-2.0，RIFE 为 MIT（版权方 Megvii Inc.），Image-Adaptive-3DLUT 为 Apache-2.0，rnnoise 为 BSD 三条款，SeedVR 为 Apache-2.0，mediakit-cli 为 MIT，RVM README 写明 GPL-3.0。

---

## 参考来源

> (G) = 直接打开；(S) = 通过 WebSearch 检索并阅读检索摘要（沙箱无法直连该域名）。

**ByteDance / 火山引擎 / BytePlus / Seed（一手）**
1. (G) https://github.com/PeterL1n/RobustVideoMatting
2. (G) https://raw.githubusercontent.com/PeterL1n/RobustVideoMatting/master/model/model.py
3. (G) https://raw.githubusercontent.com/PeterL1n/RobustVideoMatting/master/model/decoder.py
4. (S) https://arxiv.org/pdf/2108.11515 （RVM 论文）
5. (S) https://openaccess.thecvf.com/content/WACV2022/papers/Lin_Robust_High-Resolution_Video_Matting_With_Temporal_Guidance_WACV_2022_paper.pdf
6. (G) https://github.com/ByteDance-Seed
7. (G) https://github.com/ByteDance-Seed/SeedVR
8. (G) https://github.com/bytedance/music_source_separation
9. (S) https://arxiv.org/pdf/2109.05418 （ResUNet 分离论文）
10. (G) https://github.com/volcengine/mediakit-cli
11. (S) https://arxiv.org/html/2407.04675v2 （Seed-ASR）
12. (S) https://team.doubao.com/blog/doubao-s-listening-skills-unboxing-live-see-how-seed-asr-overcomes-the-speech-recognition-bottleneck
13. (S) https://arxiv.org/html/2406.02430v1 （Seed-TTS）
14. (S) https://team.doubao.com/publication/seed-tts-a-family-of-high-quality-versatile-speech-generation-models
15. (S) https://seed.bytedance.com/zh/blog/%E6%A0%A1%E6%8B%9B%E7%94%9F%E5%9C%A8%E8%B1%86%E5%8C%85%E5%A4%A7%E6%A8%A1%E5%9E%8B%E5%9B%A2%E9%98%9F%E5%A6%82%E4%BD%95%E5%BF%AB%E9%80%9F%E6%88%90%E9%95%BF-3%E4%BD%8D%E5%90%8C%E5%AD%A6%E6%9C%89%E8%AF%9D%E8%AF%B4
16. (S) https://www.volcengine.com/docs/6561/80909?lang=zh （音视频字幕生成）
17. (S) https://www.volcengine.com/docs/6561 （豆包语音文档目录）
18. (S) https://www.volcengine.com/docs/6561/133349 （声音复刻相关）
19. (S) https://docs.byteplus.com/en/docs/byteplus-vod/enhancing_video_quality_via_skill
20. (S) https://docs.byteplus.com/api/docs/byteplus-vod/docs-video-enhancement-template-legacy
21. (S) https://arxiv.org/html/2506.09113v2 （Seedance 1.0）
22. (S) https://seed.bytedance.com/zh/public_papers/seedance-1-0-exploring-the-boundaries-of-video-generation-models
23. (S) https://arxiv.org/abs/2604.14148 （Seedance 2.0）
24. (S) https://seed.bytedance.com/en/blog/official-launch-of-seedance-2-0
25. (S) https://seed.bytedance.com/seedance2_0
26. (S) https://arxiv.org/html/2509.20427v2 （Seedream 4.0）

**CapCut 官方帮助、资源与新闻页**
27. (S) https://www.capcut.com/help/auto-captions
28. (S) https://www.capcut.com/help/recognition-of-subtitles-lagging
29. (S) https://www.capcut.com/help/auto-captions-in-capcut
30. (S) https://www.capcut.com/help/text-to-speech-feature
31. (S) https://www.capcut.com/help/voice-options-missing
32. (S) https://www.capcut.com/help/why-do-i-have-to-pay-for-auto-reframe
33. (S) https://www.capcut.com/help/ai-background-not-working
34. (S) https://www.capcut.com/help/auto-cut-in-capcut
35. (S) https://www.capcut.com/help/how-to-use-auto-cut
36. (S) https://www.capcut.com/resource/how-to-remove-background-in-capcut
37. (S) https://www.capcut.com/tools/video-background-remover
38. (S) https://www.capcut.com/tools/text-to-speech
39. (S) https://www.capcut.com/tools/voice-changer
40. (S) https://www.capcut.com/resource/how-to-change-your-voice
41. (S) https://www.capcut.com/resource/noise-reduction-guidance
42. (S) https://www.capcut.com/tools/remove-background-noise-from-audio
43. (S) https://www.capcut.com/tools/ai-video-upscaler
44. (S) https://www.capcut.com/resource/ai-enhance-video
45. (S) https://www.capcut.com/resource/optical-flow-in-capcut
46. (S) https://www.capcut.com/tools/optical-flow
47. (S) https://www.capcut.com/resource/capcut-stabilizer
48. (S) https://www.capcut.com/ideas/seedance-2-0-for-video-stabilization
49. (S) https://www.capcut.com/tools/auto-reframe
50. (S) https://www.capcut.com/tools/ai-color-correction
51. (S) https://www.capcut.com/tools/match-color-with-ai
52. (S) https://www.capcut.com/tools/script-to-video-maker
53. (S) https://www.capcut.com/resource/script-to-video-ai
54. (S) https://www.capcut.com/newsroom/dreamina-seedance-2
55. (S) https://www.capcut.com/resource/bytedance-seedream-4 （含 th-th/el-gr 等语言版本）
56. (S) https://dreamina.capcut.com/resource/dreamina-seedream-4

**媒体报道（中/英）**
57. (S) https://www.qbitai.com/2022/05/34433.html （SA 团队多语种 TTS 用于剪映/CapCut）
58. (S) https://www.itbear.com.cn/html/2022-05/431490.html
59. (S) https://www.qbitai.com/2022/10/38916.html （火山语音 TTS，MOS 4.64，服务剪映）
60. (S) https://cn.chinadaily.com.cn/a/202104/01/WS606584cca3101e7ce97471f7.html （图文成片）
61. (S) https://cn.chinadaily.com.cn/a/202109/17/WS61445c1da310f4935fbee5c9.html （剪映专业版 2.0）
62. (S) https://www.ifanr.com/1639648 （AI 文字成片 / AI 配音 3.0）
63. (S) https://www.stdaily.com/web/gdxw/2026-09/20/content_584720.html （剪映 AI 新创作发布会）
64. (S) https://www.news.cn/tech/20260921/6742f6c1f32f41d4918105bc686fe907/c.html
65. (S) https://www.stdaily.com/web/gdxw/2026-02/12/content_473735.html （Seedance 2.0 发布）
66. (S) https://www.huxiu.com/article/4868698.html （剪映和即梦争抢 Seedance）
67. (S) https://www.woshipm.com/ai/6417956.html
68. (S) https://techcrunch.com/?p=3106467
69. (S) https://www.deeplearning.ai/the-batch/bytedance-adds-state-of-the-art-seedance-2-0-video-to-capcut-while-openai-retreats
70. (S) https://nofilmschool.com/capcut-vido-studio-seedance-2-0
71. (S) https://gigazine.net/gsc_news/en/20260327-dreamina-seedance-2-bytedances-capcut
72. (S) https://juejin.cn/post/7369089321411969035 （即梦/Dreamina 更名，第三方）
73. (S) https://www.pconline.com.cn/ask/34939.html （剪映踩节拍 I/II，第三方，低权重）
74. (S) https://chatpaper.com/chatpaper/paper/291996 （AceTone，第三方聚合，待复核）

**业界通用开源参照**
75. (G) https://raw.githubusercontent.com/librosa/librosa/main/librosa/beat.py
76. (G) https://github.com/hzwer/ECCV2022-RIFE
77. (G) https://github.com/google-ai-edge/mediapipe/blob/master/docs/solutions/autoflip.md
78. (G) https://github.com/georgmartius/vid.stab
79. (G) https://github.com/HuiZeng/Image-Adaptive-3DLUT
80. (G) https://github.com/xiph/rnnoise

---

## 未能确认 / 待补充

1. **网络限制导致的复核项**：所有标 (S) 的 capcut.com、volcengine.com、arxiv.org、seed.bytedance.com 页面都没有逐字打开。尤其是以下几处应回原文核对措辞：*Stuck at 99%* 页中"桌面端部分地区本地识别、语言包、10/15 分钟建议"；*Auto Reframe* 页中"cloud-based processing resources"的原句；Seed-ASR 脚注里关于产品落地的原句。
2. **RVM 是否用于 CapCut/剪映**：只能确认它是"developed at ByteDance Inc."的论文和开源项目，**没有任何公开证据**表明线上抠像使用了 RVM 或其衍生模型。
3. **CapCut 抠像端/云**：官方没有说明。"Couldn't Apply AI Background"页面中的 GPU 驱动建议可能针对生成式换背景，不能直接推到抠像上。
4. **Seed-ASR 与剪映/CapCut 自动字幕的对应关系**：没有找到公开表述。
5. **剪映 TTS 的具体引擎和版本**（传统三段式、Seed-TTS、豆包语音 2.0 中哪一个）：只有"服务剪映""用于剪映"一类的泛化表述（量子位 2022、Seed 博客访谈），版本无法确认。Seed 博客访谈原文中"已用在…剪映"的完整措辞也有待复核。
6. **Seed-TTS 是否以 voice conversion 为应用**：摘要只提到 speech factorization（self-distillation），没有打开正文核实。
7. **变声、降噪、卡点、防抖、补帧、画质增强、调色**：都**没有找到**与 CapCut/剪映功能明确对应的字节论文或产品文档，本章相关机制均为【推断/业界通用】。
8. **剪映"AI 光流 / 帧融合"选项和耗时倍数**、**"踩节拍 I/II"的定义**：来自第三方博客，未经官方核实。
9. **AceTone（CVPR 2026, UCAS+ByteDance）**：只来自第三方聚合页，页眉信息矛盾，需要到 CVF Open Access 或 arXiv 复核作者单位与会议信息。
10. **Seedance 1.0 加速细节**（TSCD、RayFlow、精简 VAE decoder 2× 等）：来自第三方综述，需要对照 arXiv 2506.09113 原文核实。
11. **CapCut newsroom Seedance 2.0 文章的日期**（英文版 04-10 与译文版 04-01 不一致）以及美国上线日期：未确认。
12. **剪映在 2026-02 是否已接入 Seedance 2.0 正式版**：检索结果只支持"2 月即梦、豆包先上，6 月剪映接入 2.0 mini"，剪映 2 月的情况未确认。
13. **监管事件**：有第三方新闻称网信办在某年 4 月 28 日因 AI 生成内容未显著标识查处"剪映""即梦 AI"等。年份与细节未核实，正文没有采用。
14. **剪映中文官方帮助中心**：本次没有检索到可引用的官方帮助页（结果都是第三方教程），所以剪映侧的功能描述大量依赖媒体报道。建议后续直接查阅剪映 App 内的帮助入口或官网更新日志。
15. **火山引擎视觉智能（人像分割/视频抠像）官方 API 文档**：检索没有命中（只命中阿里云、腾讯云的同类文档），MediaKit README 是目前唯一核实过的火山侧抠像能力来源。
16. **招聘信息**：没有检索到与"剪映端侧 AI / 抠图 / 视频增强"直接相关、可引用的 JD，只找到 CapCut 推荐算法和后端岗位，因此端侧部署架构无法从招聘侧佐证。
17. ~~**librosa、MediaPipe 的许可证**：表格中按常识填写，未打开 LICENSE 文件核对。~~ 已在核查中解决：librosa 为 ISC，MediaPipe 为 Apache-2.0（见 §16 注与"核查记录"）。

---

## 核查记录

> 核查日期：2026-10-15。核查方式：只用公开来源，没有请求任何 CapCut/字节生产 API。核查环境与原作者相同，只能直接访问 `github.com` 和 `raw.githubusercontent.com`；`arxiv.org`、`capcut.com`、`seed.bytedance.com`、`volcengine.com`、`docs.byteplus.com`、`team.doubao.com`、`qbitai.com`、`*.github.io` 都返回 DNS 失败或代理 403。另外，本轮的 WebSearch 配额在核查开始时就已经用完，**一次检索也没能执行**。因此，凡是只靠 (S) 检索摘要支撑的说法，本次都无法独立复核，只能标"（未能核实）"。

### 已核实（打开了一手源文件，结论与正文一致）

| # | 说法 | 核查依据 (G) | 结果 |
|---|---|---|---|
| 1 | RVM README 写明 "developed at ByteDance Inc."，许可证为 GPL-3.0，WACV 2022 | RVM README（"Code is re-released under GPL-3.0 license"；"Paper is accepted by WACV 2022"） | 属实 |
| 2 | RVM 作者为 Lin / Yang / Saleemi / Sengupta | RVM README 的 Contributors 列表 | 属实 |
| 3 | RVM 速度表：1080 Ti FP32 104/74 FPS，3090 FP16 172/154 FPS；引言写"4K 76FPS"；HD 用 0.25、4K 用 0.125 | RVM README 速度表与注释 | 属实（包括 74 与 76 的出入） |
| 4 | RVM 导出格式：ONNX opset 12、TF.js int8、CoreML iOS 13+、移动端建议自行做 int8 | RVM README 下载表 | 属实 |
| 5 | ConvGRU 更新式 | `model/decoder.py` 中的 `ConvGRU.forward_single_frame` | 与代码一致 |
| 6 | `bytedance/music_source_separation`：作者、ISMIR 2021、0.306M 参数、可用于 speech enhancement、2026-02-03 归档 | 仓库 README，GitHub 仓库页 | 属实；许可证由"见仓库 LICENSE"**更正为 Apache-2.0** |
| 7 | `volcengine/mediakit-cli`：MIT、npm 包名、`MEDIAKIT_API_KEY`、`--cloud/--local`、智能视频 30 项含绿幕/人像抠图、图像背景移除、人声背景音分离、`enhance-video --resolution 1080p`、未提剪映 | 仓库 README | 属实；**补充**本地 FFmpeg 模式也提供绿幕抠图 |
| 8 | SeedVR 为 CVPR 2025 Highlight，SeedVR2 为 ICLR 2026，Apache-2.0；自适应窗口注意力、feature matching loss；局限性（720p AIGC 过度锐化）；未提 CapCut/Dreamina | SeedVR GitHub 仓库页与 LICENSE | 属实 |
| 9 | ByteDance-Seed 组织页称模型支撑 Doubao、Coze、Jimeng | GitHub 组织页（"over 50 real-world applications — including Doubao, Coze, and Jimeng"） | 属实 |
| 10 | Seed-TTS 的 arXiv 编号为 2406.02430 | 官方评测仓库 `BytedanceSpeech/seed-tts-eval` 的 README | 编号属实；模型细节未能核实 |
| 11 | RIFE：ECCV 2022、MIT、安装命令指向 `megvii-research`、2080Ti 上 2× 720p 达 30+ FPS、任意时间步 | RIFE README 与 LICENSE | 属实 |
| 12 | Image-Adaptive-3DLUT：TPAMI 2022、Apache-2.0、<600K 参数、4K <2 ms（Titan RTX） | 仓库 README 与 LICENSE | 属实 |
| 13 | vid.stab 为 LGPL-2.1+；`smoothing` 对应 2n+1 帧、`optalgo=gauss`、`smoothing=0` 模拟固定机位、`maxshift`/`optzoom` | 仓库 LICENSE 与 README | 属实；**补充** v1.1.2 及以前为 GPL |
| 14 | librosa `beat_track` 引用 Ellis 2007（JNMR 36.1）、`tightness`/`trim`/`start_bpm`、median 聚合 | `librosa/beat.py` | 属实；许可证 ISC 属实 |
| 15 | AutoFlip：480 宽、`ShotBoundaryCalculator`、`SignalFusingCalculator` 各类信号的权重区间、`motion_stabilization_threshold_percent`、模糊填充 | `docs/solutions/autoflip.md` | 属实；MediaPipe 的 Apache-2.0 属实 |
| 16 | RNNoise：BSD-3、Valin 论文 arXiv 1709.08243、48 kHz PCM | rnnoise README 与 COPYING | 属实 |

### 改动清单

- **更正**：§16 中 `music_source_separation` 的许可证从"见仓库 LICENSE"改为 **Apache-2.0**；§16 原注"librosa/MediaPipe 许可证按常识填写"改为逐一核对后的结果；待补充第 17 条标为已解决。
- **补充**：§2.2 RVM 作者与 WACV 来源；§2.4 mediakit-cli 本地模式也提供绿幕抠图；§6.2 README 中 SDR 实测值为 8.9 dB、仓库归档与许可证已核实；§10.3 与 §16 补充 vid.stab 早期版本为 GPL；§4.2 Seed-TTS 编号由官方仓库确认。
- **降级证据等级**：§13.1 由【官方/一手】降为"媒体报道 (S)"，因为来源全是媒体；§4.2 标题改为"【官方/一手】+ 媒体报道"，并注明量子位两行属于媒体口径；§12.2 AceTone 注明来源是第三方聚合页，不属于【官方/一手】。
- **标注"（未能核实）"**：CapCut 帮助页中关于自动字幕、TTS、Auto reframe 的云端原句（§3.1、§4.1、§11.1，并在 §15.1 加总提示）；桌面端"部分地区本地识别"；Seed-ASR 的 10–40% 降幅、脚注中的产品落地说法、豆包博客日期；量子位报道中的 17+ 语言 / MOS 4.64；Seed 博客访谈原句；Seed-TTS_DiT 细节与"豆包语音合成基于此系列"；MSS 论文摘要中的 8.98/7.24 dB、22%，以及 Cao 的 Surrey 单位；BytePlus 增强 Skill 名称与"30+ 算法"；AceTone（§1 与 §12.2）；CapCut Newsroom 中 Seedance 2.0 的首批市场、日期和规格；Seedance 2.0 发布日期（2026-02-12）与 2.0 mini 日期（2026-06-15）；Seedance 1.0 的 ~10× 和 41.4 秒；Seedance 2.0 的 arXiv 编号、标题和日期；Seedream 4.0 的"2K 约 1.4 秒"。
- **存疑**：Seedream 4.0 的"2K 图约 1.4 秒"与核查者印象中的论文摘要（约 1.8 秒）不一致。因为无法打开原文，只标为存疑，没有直接改数字。
- **删除**：无。能访问的 GitHub URL 全部存在；其他域名无法访问，既不能证实也不能证伪，所以没有删除任何 URL 或说法。

### 未完成 / 交接给后续核查

1. 所有 (S) 来源（capcut.com 帮助页和资源页、arXiv 论文摘要、volcengine/BytePlus 文档、seed.bytedance.com、各媒体报道）本次**都没能打开**，WebSearch 配额也已用完。建议在能访问这些域名、或检索配额恢复后，优先复核以下几项：Auto reframe 的 "cloud-based processing resources" 原句、*Stuck at 99%* 页、Seedream 4.0 的推理耗时、Seedance 2.0 的 arXiv 编号与日期、AceTone 的出处。
2. 本次没有核查的 (S) 说法还包括：§2.5 移动端每日 50 次上限、§7.1 Auto Cut 的 Web 端情况、§8.1 Enhance quality 档位、§9.1 Optical flow 帧率口径、§14.1 即梦/Dreamina 更名时间，以及 Video Studio 上线时间。这些保持原样，没有加标注，但它们同样只有检索摘要支撑。
