# 人脸检测、关键点、美颜与变形算法深入（通用算法 + 开源实现）

> 本章是 CapCut / 剪映架构学习研究的一部分，只讲人脸类效果背后的**算法与工程实现**。
> 字节跳动 Effect / CV SDK 的 API、资源包和 Effect House 引擎见 `research_effects.md`；草稿数据模型、火山引擎剪辑 SDK 和跨端引擎架构见其他章节。本章遇到这些内容只简单引用。
> 编写日期：2026-10-15

---

## 目录

- [0. 证据等级与本次调研的限制](#0-证据等级与本次调研的限制)
- [1. 整体流水线：从一帧画面到“美颜后的脸”](#1-整体流水线从一帧画面到美颜后的脸)
- [2. 人脸检测：BlazeFace / RetinaFace / SCRFD](#2-人脸检测blazeface--retinaface--scrfd)
- [3. 关键点方案：68 / 98 / 106 / 468(478)，以及字节公开的点位](#3-关键点方案68--98--106--468478以及字节公开的点位)
- [4. 关键点跟踪与去抖](#4-关键点跟踪与去抖)
- [5. 头部姿态：solvePnP 与加权 Procrustes](#5-头部姿态solvepnp-与加权-procrustes)
- [6. 3D 人脸模型（3DMM / FLAME）与 UV 网格](#6-3d-人脸模型3dmm--flame与-uv-网格)
- [7. 脸型变形：局部缩放、局部平移、MLS、三角网格、液化](#7-脸型变形局部缩放局部平移mls三角网格液化)
- [8. 磨皮：双边、导向滤波、表面模糊、高反差保留与皮肤 mask](#8-磨皮双边导向滤波表面模糊高反差保留与皮肤-mask)
- [9. 美白：曲线与 3D LUT](#9-美白曲线与-3d-lut)
- [10. 锐化](#10-锐化)
- [11. 美妆：贴合关键点的纹理与混合模式](#11-美妆贴合关键点的纹理与混合模式)
- [12. 多人脸与移动端 GPU 性能](#12-多人脸与移动端-gpu-性能)
- [13. 与剪映 / CapCut 场景的对应（推断）](#13-与剪映--capcut-场景的对应推断)
- [参考来源](#参考来源)
- [未能确认 / 待补充](#未能确认--待补充)

---

## 0. 证据等级与本次调研的限制

| 标签 | 含义 |
|---|---|
| 【官方/一手】 | 字节跳动 / 火山引擎官方 GitHub 仓库中的原文，例如 `volcengine/VolcEngineRTC` 里随 Demo 发布的 Effect SDK 头文件 |
| 【社区逆向/开源】 | 社区开源项目的源码或 README，例如 GPUPixel、MediaPipe、OpenCV、InsightFace、dlib、FLAME_PyTorch |
| 【推断/业界通用】 | 作者的推理或业界通用做法，**不代表**字节跳动已确认采用 |

**这次调研受到的环境限制，读者需要先知道：**

1. WebSearch 的配额在本章开始前已被同一任务的其他 agent 用完，所以本章**没能做中英文网页搜索**。
2. 当前网络环境下只有 `github.com` 和 `raw.githubusercontent.com` 能解析。arxiv.org、docs.opencv.org、ai.google.dev、volcengine.com、capcut.com、juejin.cn、wikipedia 等域名全部 DNS 失败。所以：
   - 论文的结论和数字都是从**打开过的 GitHub 页面**（官方仓库 README、源码注释）间接核实的。有些论文 PDF 没能直接打开，正文会写明。
   - 火山引擎官网文档、字节技术博客、InfoQ / 掘金 / LiveVideoStack 的演讲稿**都没能访问**。“字节一手”证据只来自火山引擎官方 GitHub 仓库里公开的 SDK 头文件和明文配置。
3. 火山引擎 Demo 中有些资源脚本（如 `FaceAlgorithmModule.lua`、`config.json`）是**加密内容**。按规则本章没有尝试解密。
4. 剪映 / CapCut 客户端的实际实现**没有公开**。本章把火山引擎 Effect SDK 当作字节人脸能力的“公开代理”。剪映是否使用同一套 SDK，见 `research_effects.md` 的论证。本章不重复，只在必要处标【推断】。

---

## 1. 整体流水线：从一帧画面到“美颜后的脸”

【推断/业界通用】下图是移动端实时美颜/美型的典型数据流。各步骤的公开佐证见后续各节。

```
          ┌──────────────────────────── CPU / NPU 侧（异步） ────────────────────────────┐
相机/解码帧 │  降采样 → 人脸检测(每 N 帧或跟踪丢失时) → ROI 裁剪 → 关键点回归(106/280/468)      │
(RGBA/YUV) │        ↑                                           │                        │
  │        │        └──── 上一帧关键点推出的 ROI（跟踪）◄─────────┤                        │
  │        │                                                    ▼                        │
  │        │                       ID 关联 → 去抖(One Euro/Kalman) → 姿态(PnP/Procrustes)  │
  │        │                                                    │  → 3D 拟合(mesh/UV/MVP)  │
  │        └────────────────────────────────────────────────────┼────────────────────────┘
  │                                                             │ landmarks / pose / masks
  ▼                                                             ▼
GPU:  [磨皮: 低分辨率 mean/var → 合成] → [美白 LUT] → [锐化] → [美型: 逆映射 warp]
          → [美妆: 关键点三角网格 + 混合模式] → [贴纸 / 3D 道具 (深度遮挡)] → 输出
```

要点：

- **检测很贵，跟踪便宜。** 检测器不必每帧都跑，大多数帧用上一帧关键点推出的 ROI 直接回归关键点（见 §4.1）。
- **算法输出的是“几何”，GPU 拿来做“像素”。** 关键点 / mesh / mask 以 uniform、顶点缓冲或纹理的形式交给 shader。
- **执行顺序会影响结果。** 例如先美妆后美型，妆容会跟着形变一起走；先美型后美妆，就要把关键点也做一次正向形变。这一点没有找到字节公开的说明。【推断】

---

## 2. 人脸检测：BlazeFace / RetinaFace / SCRFD

### 2.1 BlazeFace（Google, 2019）【社区逆向/开源】

- 论文为 *BlazeFace: Sub-millisecond Neural Face Detection on Mobile GPUs*（arXiv 1907.05047），出处是 MediaPipe 文档的引用（https://raw.githubusercontent.com/google-ai-edge/mediapipe/master/docs/solutions/face_detection.md ）。
- MediaPipe 文档对架构的描述有三点：
  - 特征提取器受 MobileNet 启发；
  - 锚框方案是“GPU 友好”的，改编自 SSD；
  - 用 “improved tie resolution strategy alternative to non-maximum suppression” 代替经典 NMS。
- 输出为人脸框加 **6 个关键点**：右眼、左眼、鼻尖、嘴中心、左右耳屏。
- 有两个模型：short-range（约 2 米内，默认）和 full-range（约 5 米内，使用稀疏模型）。
- 锚框的具体配置来自第三方复现 `yakhyo/uniface` 的注释（https://raw.githubusercontent.com/yakhyo/uniface/main/uniface/detection/blazeface.py ）：
  - 输入为 **128×128 letterbox**；
  - 两组锚框网格合计 `16x16x2 + 8x8x6 = 896` 个锚；
  - strides 为 `(8, 16, 16, 16)`；
  - “weighted NMS” 把重叠候选按分数加权平均到胜出者上，**关键点也一起平均**，不是直接丢弃。

```
BlazeFace 的 “blending” 后处理（伪代码，原创）
---------------------------------------------
cands = sort_by_score(decode(anchors, regress))     # 896 个候选
out = []
while cands not empty:
    best = cands[0]
    group = [c for c in cands if IoU(c, best) > 0.3]   # 阈值为示意
    w = [c.score for c in group]
    best.box = Σ w_i * group_i.box / Σ w_i            # 框加权平均
    best.kps = Σ w_i * group_i.kps / Σ w_i            # 6 个关键点也加权平均
    out.append(best); cands -= group
```

为什么选 blending 而不是硬 NMS：视频里相邻帧胜出的框经常在两个高度重叠的锚之间来回切换，硬 NMS 会让框跳变，加权平均天然更稳。这个动机是作者推断，论文原文未能打开核实。【推断】

### 2.2 RetinaFace（InsightFace, CVPR 2020）【社区逆向/开源】

- 论文为 *RetinaFace: Single-Shot Multi-Level Face Localisation in the Wild*（arXiv 1905.00641 / CVPR 2020）。
- 官方 README 称它是 “a practical single-stage SOTA face detector”。作者为 WIDER FACE 补标了**人脸框加 5 个关键点**。
- 指标：RetinaFace-R50 在 WIDER FACE val 上 Easy / Medium / Hard 为 96.5 / 95.6 / 90.4。
  - 【核查补充】这组数字的测试尺度 README 没有写明。SCRFD README 的对比表规定“全部在 **VGA 分辨率**下评估”，其中 RetinaFace(ResNet50) 只有 94.92 / 91.90 / **64.17**。两组数字测试条件不同，不能直接横向比较（来源：https://raw.githubusercontent.com/deepinsight/insightface/master/detection/scrfd/README.md ）。
- 第三方 MobileNet0.25 版本约 1.68 MB，Hard mAP 82.5。
- 来源：https://raw.githubusercontent.com/deepinsight/insightface/master/detection/retinaface/README.md
- 它的 5 点（双眼、鼻尖、两嘴角）是**人脸对齐**（similarity transform 到标准模板）的事实标准，之后再接更密的关键点模型。

### 2.3 SCRFD（InsightFace, ICLR 2022）【社区逆向/开源】

- README 给的论文链接是 arXiv 2105.04714，接收于 ICLR 2022。论文标题为 *Sample and Computation Redistribution for Efficient Face Detection*，作者 Jia Guo、Jiankang Deng、Alexandros Lattas、Stefanos Zafeiriou。【核查已确认】标题和作者见 InsightFace 主 README 的 BibTeX（https://raw.githubusercontent.com/deepinsight/insightface/master/README.md ）。
- 下表 SCRFD 各行取自 README 的 “Pretrained-Models” 表；TinaFace 对照行取自同一 README 的 “ResNet family” 对比表。两张表都注明在 VGA 分辨率下评估。
- 网络结构是通过两步网络搜索、以 hard 子集 mAP 为指标挑选出来的。带 `_KPS` 后缀的版本同时输出 5 个关键点。
- 来源：https://raw.githubusercontent.com/deepinsight/insightface/master/detection/scrfd/README.md

| 模型 | Easy | Medium | Hard | FLOPs | Params(M) | 推理(ms, VGA) |
|---|---|---|---|---|---|---|
| SCRFD_500M | 90.57 | 88.12 | 68.51 | 500M | 0.57 | 3.6 |
| SCRFD_2.5G | 93.78 | 92.16 | 77.87 | 2.5G | 0.67 | 4.2 |
| SCRFD_10G | 95.16 | 93.87 | 83.05 | 10G | 3.86 | 4.9 |
| SCRFD_34G | 96.06 | 94.92 | 85.29 | 34G | 9.80 | 11.7 |
| TinaFace(R50，对照) | 95.61 | 94.25 | 81.43 | 172.95G | 37.98 | 38.9 |

### 2.4 选型对比【推断/业界通用】

| 维度 | BlazeFace | RetinaFace | SCRFD |
|---|---|---|---|
| 目标场景 | 手机前摄自拍、近距离、GPU 推理 | 通用、小脸、高精度（服务器为主） | 精度/速度可调的模型族，适合端侧到服务端 |
| 输出关键点 | 6 | 5 | 5（`_KPS`） |
| 后处理 | 加权 blending | NMS | NMS |
| 对剪辑类 App 的意义 | 实时预览（相机/拍同款） | 导出时离线高精度、小脸、多人合影 | 一套代码在不同档位机型间切换 |

### 2.5 字节公开资料里的“检测”侧参数【官方/一手】

火山引擎官方 RTC Demo 随附的 Effect SDK 头文件 `bef_effect_ai_face_detect.h`（https://raw.githubusercontent.com/volcengine/VolcEngineRTC/main/iOS/script/Depends/BytedEffectSDK/effect-sdk.framework/Headers/bef_effect_ai_face_detect.h ）里与检测策略直接相关的定义：

- `BEF_FACE_PARAM_FACE_DETECT_INTERVAL = 1, // default 24`
  - 注释原文：“设置每隔多少帧进行一次人脸检测(默认值有人脸时24, 无人脸时24/3=8), 值越大, cpu占用率越低, 但检测出新人脸的时间越长”。
  - 这就是 §4.1 的“检测每 N 帧”策略：**有脸时 N=24，无脸时 N=8**。
- `BEF_FACE_PARAM_MAX_FACE_NUM = 2, // default 5`
  - 注释说明：当跟踪到的人脸数已经大于该值时，不再做新的检测。
  - 同一头文件里有 `#define BEF_MAX_FACE_NUM 10`。
- 模式位：
  - `BEF_DETECT_MODE_VIDEO`：视频检测；
  - `BEF_DETECT_MODE_VIDEO_SLOW`：能检测更小的人脸；
  - `BEF_DETECT_MODE_IMAGE`：注释只有“图片检测”；
  - `BEF_DETECT_MODE_IMAGE_SLOW`：图片检测，“人脸检测模型效果更好，能检测更小的人脸”（【核查更正】这句注释只属于 `IMAGE_SLOW`，原稿把它同时安在了 `IMAGE` 上）；
  - `BEF_DETECT_SMALL_MODEL`：“106模型初始化参数，更快”。同一段还有 `BEF_DETECT_LARGE_MODEL`，注释为“更准, 现已废弃”，以及 `BEF_DETECT_FACE_240_DETECT_FASTMODE`（“240模型初始化参数，更快”）。
- 【核查补充】`BEF_FACE_PARAM_MIN_DETECT_LEVEL = 3` 的注释写明：“视频模式强制是4，图片模式可以通过设置为8，检测更小的人脸”，取值范围 4～10。这是 VIDEO 与 IMAGE 两种模式在小脸检测能力上的另一处一手差异。

【推断】字节同时提供“视频（跟踪 + 间隔检测）”和“图片（每次全量检测、更大模型）”两种模式。剪辑软件里，实时预览可以用前者，导出或单帧精修可以用后者。剪映是否这样切换未经证实。

---

## 3. 关键点方案：68 / 98 / 106 / 468(478)，以及字节公开的点位

### 3.1 68 点（iBUG 300-W）【社区逆向/开源】

- dlib 官方示例注释：“The pose takes the form of 68 landmarks”，模型 “was trained on the iBUG 300-W face landmark dataset”。
- 算法来自 Kazemi & Sullivan, *One Millisecond Face Alignment with an Ensemble of Regression Trees*（CVPR 2014）。
- 注释特别提醒：**iBUG 300-W 数据集的许可不允许商用**，用该数据训练的模型能否用于商业产品需要联系 Imperial College London。
- 来源：https://raw.githubusercontent.com/davisking/dlib/master/python_examples/face_landmark_detection.py
- 68 点的布局：轮廓 17、眉 5+5、鼻 9、眼 6+6、嘴 20（外 12、内 8）。这是业界通行的描述，iBUG 原页面未能打开。【推断/业界通用】

### 3.2 98 点（WFLW）【社区逆向/开源】

- 出自 *Look at Boundary: A Boundary-Aware Face Alignment Algorithm*（CVPR 2018，Wayne Wu 等。README 写明 “Created by Wayne Wu at Tsinghua University”；“商汤”的署名单位在所引 README 中没有出现（未能核实））。
- WFLW 共 10,000 张脸，其中 7,500 训练、2,500 测试。每张脸**手工标注 98 点**。
- 数据集附带 pose / expression / illumination / make-up / occlusion / blur 六类属性子集，适合评估“化妆、遮挡”这类美颜场景的鲁棒性。
- 来源：https://raw.githubusercontent.com/wywu/LAB/master/README.md

### 3.3 106 点（JD-landmark / ICME 2019 Grand Challenge）【社区逆向/开源】

- 论文 *Grand Challenge of 106-Point Facial Landmark Localization*（arXiv 1905.03469，Yinglu Liu 等。作者单位“京东 AI”在所引索引页中没有出现，只能从数据集名 JD-landmark 推断（未能核实））。
- 摘要指出：68 点 “incompetent to depict the structure of facial components”。因此作者构建了 JD-landmark，“Each image is manually annotated with 106-point landmarks”，并在 ICME 2019 举办了挑战赛。
- 来源（论文索引页中的摘要）：https://raw.githubusercontent.com/TTXS123OK/CVPapers/master/cs.CV/2019/05/20190509.md
- 开源实现：
  - **InsightFace `2d106det`**：MobileNet-0.5 主干，约 5MB，输入 192×192（loose crop）。README 说明 “Mainly used for static image inference”。来源：https://raw.githubusercontent.com/deepinsight/insightface/master/alignment/coordinate_reg/README.md
  - **GPUPixel**：人脸检测封装调用 `mars_vision::MarsFaceLandmarker`（`RunningMode::VIDEO`），把像素坐标除以宽高归一化后交给 shader。美型 shader 声明了 `uniform float facePoints[106 * 2]`。来源：https://raw.githubusercontent.com/pixpark/gpupixel/main/src/face_detector/face_detector.cc 、https://raw.githubusercontent.com/pixpark/gpupixel/main/src/filter/face_reshape_filter.cc

### 3.4 MediaPipe 468 / 478 点 3D 网格【社区逆向/开源】

- MediaPipe Face Mesh：“estimates 468 3D face landmarks in real-time even on mobile devices”。
  - 引用论文 *Real-time Facial Surface Geometry from Monocular Video on Mobile GPUs*（arXiv 1907.06724）。
  - 虹膜细化引用 attention mesh（arXiv 2006.10962）。
  - 来源：https://raw.githubusercontent.com/google-ai-edge/mediapipe/master/docs/solutions/face_mesh.md
- Python 常量 `FACEMESH_NUM_LANDMARKS = 468`、`FACEMESH_NUM_LANDMARKS_WITH_IRISES = 478`。
  - `refine_landmarks` 的说明：“refine the landmark coordinates around the eyes and lips, and output additional landmarks around the irises”。
  - 来源：https://raw.githubusercontent.com/google-ai-edge/mediapipe/master/mediapipe/python/solutions/face_mesh.py
- 和 68/98/106 的本质区别：468 点是**有固定拓扑和 UV 的网格顶点**（UV 与三角拓扑继承自 canonical face model，见 §6.3），不只是语义点。所以它可以直接用来贴妆、贴面具。

### 3.5 字节公开的点位方案：106 + 二级关键点（= 280）【官方/一手】

详细字段表见 `research_effects.md`，这里只列和算法相关的部分。来源同 §2.5 的头文件。

- **一级 106 点**：结构体 `bef_ai_face_106` 包含：
  - `points_array[106]`；
  - `visibility_array[106]`：“点未被遮挡1.0, 被遮挡0.0”；
  - `yaw` / `pitch` / `roll`：注释为“真实度量”的角度；
  - `eye_dist`（两眼间距）；
  - `ID`：人脸跟踪丢失后重新检测到，会分配新的 faceID；
  - `action`：动作位，如眨眼、张嘴、摇头、点头、挑眉、嘟嘴。
- **二级关键点** `bef_ai_face_ext_info`，用 `TT_MOBILE_FACE_280_DETECT` 开启（注释：“检测二级关键点: 眉毛, 眼睛, 嘴巴，虹膜”）：
  - `eye_left[22]`、`eye_right[22]`
  - `eyebrow_left[13]`、`eyebrow_right[13]`
  - `lips[64]`
  - `left_iris[20]`、`right_iris[20]`
- 算术核对：106 + 22×2 + 13×2 + 64 + 20×2 = **280**。这就是“280 点”的来源（加法由作者完成）。头文件在 `bef_ai_face_ext_info` 前的注释也写明是“280点结果”。
- 【核查补充】同一头文件还定义了 `TT_MOBILE_FACE_240_DETECT`（“检测二级关键点: 眉毛, 眼睛, 嘴巴”，**不含虹膜**），并注明“现在改了二级策略，眉毛、眼睛、嘴巴关键点会在一个模型中出”；虹膜由 `AI_IRIS_EXTRA_DETECT`（“虹膜 20*2个点”）单独控制。106 + 44 + 26 + 64 = 240，所以“240 点”就是不含虹膜的二级点方案（加法由核查者完成）。
- 设计上的含义【推断/业界通用】：
  - **两级级联**：一级 106 点负责全脸的稳定几何（轮廓、五官定位）；二级在眼、眉、唇、虹膜的小 ROI 上做高密度精修。
  - 这和 MediaPipe 的 “refine_landmarks” 思路一样：嘴唇 64 点是唇妆边缘贴合的关键，虹膜 20 点用于美瞳 / 亮眼。
- 头文件还提供**分割 mask** 输出：枚举 `BEF_FACE_DETECT_MOUTH_MASK` / `BEF_FACE_DETECT_TEETH_MASK` / `BEF_FACE_DETECT_FACE_MASK`，每张脸一张 256×256 的 `mask`（`BEF_MOUTH_MASK_WIDTH 256`）。对应的开关 `AI_MOUTH_MASK_DETECT` 等定义在“Config-280 point”段里。mask 是否“基于关键点”生成，头文件没有说明。【核查更正：原稿“基于关键点”为推断】唇妆避开牙齿、美牙，都依赖这类 mask（见 §11）。

### 3.6 方案对比

| 方案 | 点数 | 维度 | 拓扑 / UV | 典型开源 | 美颜适配性 |
|---|---|---|---|---|---|
| iBUG 300-W | 68 | 2D | 无 | dlib（ERT） | 轮廓、嘴唇偏稀，商用许可受限 |
| WFLW | 98 | 2D | 无 | LAB、PFLD 等 | 轮廓更密，含化妆 / 遮挡子集 |
| JD-106 | 106 | 2D | 无 | InsightFace 2d106det、GPUPixel（mars_vision） | 字节 SDK 一级点为 106（头文件已核实）；“中文美颜 SDK 事实标准、Face++ 也是 106”的说法（未能核实） |
| MediaPipe | 468/478 | 3D（相对 z） | **有**（canonical model） | MediaPipe | 可直接贴图，但点更密、更耗算力 |
| 字节 Effect SDK | 106（+174 = 280） | 2D + 姿态 | 3D 拟合时另给 mesh/UV（§6.4） | —（闭源 SDK，头文件公开） | 一级稳定 + 二级精修 |

---

## 4. 关键点跟踪与去抖

### 4.1 “检测每 N 帧 + 关键点自跟踪”

**MediaPipe 的做法**【社区逆向/开源】，见 `face_landmark_front_gpu.pbtxt`（https://raw.githubusercontent.com/google-ai-edge/mediapipe/master/mediapipe/modules/face_landmark/face_landmark_front_gpu.pbtxt ）：

1. `PreviousLoopbackCalculator` 缓存“由上一帧关键点算出的人脸矩形”，下一帧到来时送出。
2. `NormalizedRectVectorHasMinSizeCalculator` 判断已跟踪的人脸数是否 ≥ `num_faces`。
3. 若数量足够，`GateCalculator` 以 `DISALLOW:prev_has_enough_faces` 丢弃本帧送往检测器的图像，**本帧不跑 BlazeFace**。
4. 若需要检测，`AssociationNormRectCalculator`（`min_similarity_threshold: 0.5`）把“新检测框”和“跟踪框”去重合并，“ensures that the output face_rects vector doesn't contain overlapping regions”。
5. `FaceLandmarkLandmarksToRoi` 用本帧关键点算出下一帧的 ROI，形成闭环。

**字节的做法**【官方/一手】：`BEF_FACE_PARAM_FACE_DETECT_INTERVAL` 有脸时默认 24 帧检测一次，无脸时 8 帧一次（§2.5）。人脸跟踪丢失再检测到时，分配新的 `ID`。

```
帧:     0    1    2   ...   23   24   25  ...
检测:   ■    ·    ·          ·    ■    ·          ■ = 跑检测器（找新脸、纠偏）
关键点: ●    ●    ●          ●    ●    ●          ● = 用上一帧 ROI 回归关键点（跟踪）
                    ↑ 若关键点置信度 < min_tracking_confidence → 立即触发检测
```

### 4.2 One Euro Filter（1€ 滤波）【社区逆向/开源】

- 论文：Casiez, Roussel, Vogel, *1 € Filter: A Simple Speed-Based Low-Pass Filter for Noisy Input in Interactive Systems*，CHI 2012，DOI 10.1145/2207676.2208639。
  - 作者仓库 README 的描述：“uses a first order low-pass filter with an adaptive cutoff frequency”。
  - 来源：https://raw.githubusercontent.com/casiez/OneEuroFilter/main/README.md
- 下面的公式和 MediaPipe 实现 `one_euro_filter.cc` 的源码一一对应（https://raw.githubusercontent.com/google-ai-edge/mediapipe/master/mediapipe/util/filtering/one_euro_filter.cc ）：

```
te    = 1 / freq                       # 采样周期，freq 由时间戳差实时算
α(fc) = 1 / (1 + τ/te),  τ = 1/(2π·fc) # 一阶低通的平滑系数
dx    = (x - x_prev) · freq            # 速度（MediaPipe 还乘 value_scale）
d̂x   = LPF(dx, α(d_cutoff))           # 对速度本身再低通
fc    = min_cutoff + β · |d̂x|          # 自适应截止频率：动得快 → 截止频率高 → 延迟小
x̂    = LPF(x, α(fc))
```

- 调参顺序见 MediaPipe 的 proto 注释（https://raw.githubusercontent.com/google-ai-edge/mediapipe/master/mediapipe/calculators/util/landmarks_smoothing_calculator.proto ）：
  - 先设 `beta = 0`，调 `min_cutoff`（默认 1Hz）直到抖动可以接受；
  - 再逐渐增大 `beta`，减小延迟；
  - `derivate_cutoff` 默认 1Hz。
- 同一个 proto 里还有 `VelocityFilter`（`window_size=5`、`velocity_scale=10`）。两种滤波器都支持**按物体尺寸归一化**：value scale 取人脸包围盒最大边的倒数。这样远处的小脸和近处的大脸，平滑强度在“相对尺度”上一致。

**字节一手参数**【官方/一手】：`BEF_FACE_PARAM_BASE_SMOOTH_LEVEL = 4, // base 关键点去抖参数，[1-30]`，`BEF_FACE_PARAM_EXTRA_SMOOTH_LEVEL = 5, // extra 关键点去抖参数，[1-30]`，`BEF_FACE_PARAM_MASK_SMOOTH_TYPE`（嘴巴 mask 去抖，“平滑效果更好，速度更慢”）。可以看出 106 点和二级 280 点**分别设置去抖强度**。头文件没有说用的是哪种滤波器。

### 4.3 Kalman 滤波【推断/业界通用】

OpenCV 的 `cv::KalmanFilter` 文档说明：类实现的是 “standard Kalman filter”，通过修改转移 / 控制 / 测量矩阵可以扩展到 EKF；接口是 `predict()` / `correct()`。来源：https://raw.githubusercontent.com/opencv/opencv/4.x/modules/video/include/opencv2/video/tracking.hpp

对关键点常用**匀速模型**，每个点（或 PCA 降维后的形状系数）一组状态：

```
状态 s = [x, y, vx, vy]ᵀ
F = [[1,0,Δt,0],[0,1,0,Δt],[0,0,1,0],[0,0,0,1]]     H = [[1,0,0,0],[0,1,0,0]]
predict: s⁻ = F s,      P⁻ = F P Fᵀ + Q
correct: K = P⁻Hᵀ(HP⁻Hᵀ + R)⁻¹,  s = s⁻ + K(z - H s⁻),  P = (I - K H) P⁻
```

和 One Euro 比较：

- Kalman 的 `R / Q` 物理意义清楚，并且能在检测器丢帧时用 `predict` 外推。
- 缺点是参数难调，对快速转头会滞后。
- One Euro 只有两个直观参数，所以实时美颜里更常见。

### 4.4 光流辅助跟踪【推断/业界通用】

OpenCV `calcOpticalFlowPyrLK` 是 “iterative Lucas-Kanade method with pyramids”（引用 Bouguet00）。参数包括：`winSize` 为每层搜索窗口；`maxLevel` 为金字塔层数，0 表示不用金字塔；`status` 为 1 表示找到流。来源同上 `tracking.hpp`。

典型做法：

```
# 原创伪代码：光流先验 + 回归修正 + 双向一致性
for each face f:
    pts_flow, st = LK(prev_gray, cur_gray, f.prev_pts)              # 前向
    pts_back, st2 = LK(cur_gray, prev_gray, pts_flow)              # 反向
    fb_err = |pts_back - f.prev_pts|                               # forward-backward error
    good = st & st2 & (fb_err < 1.0px)
    roi = bbox(pts_flow[good]) expand 1.25x                         # 用光流点更新 ROI
    pts_reg = landmark_net(crop(cur, roi))                          # 回归器给出新点
    # 静止时信光流（低噪声），运动/表情变化时信回归（无漂移）
    w = clamp(motion(pts_reg, f.prev_pts) / k, 0, 1)
    f.pts = one_euro(mix(pts_flow, pts_reg, w))
```

### 4.5 去抖的工程细节【推断/业界通用】

1. **按尺度归一化**：抖动阈值以 `eye_dist` 或人脸框边长为单位。字节的结构体直接给了 `eye_dist`。
2. **分区域强度**：轮廓点允许更强的平滑。眼、唇点要求低延迟，否则眨眼、说话会“拖影”。字节 base / extra 两个独立参数就是这种分区思想。
3. **整体刚体 + 局部非刚体分解**：先用 Procrustes 求整体相似变换并对它平滑，再对残差（表情）单独平滑。这样转头不拖、表情不抖（见 §5.2）。
4. **ID 关联**：多人脸时，先按 IoU / 中心距离做匈牙利或贪心匹配，再按 ID 维护各自的滤波器状态。字节的 `ID` 字段在跟踪丢失后会变化，滤波器状态也要随之重置。
5. **离线导出可以用非因果平滑**：剪辑导出时整段视频都可见，可以用前后向（零相位）平滑或 RTS smoother，没有实时滤波必然带来的延迟。

---

## 5. 头部姿态：solvePnP 与加权 Procrustes

### 5.1 solvePnP【社区逆向/开源】

- OpenCV 文档（https://raw.githubusercontent.com/opencv/opencv/4.x/modules/calib3d/doc/solvePnP.markdown ）给出的投影方程：

```
[u, v, 1]ᵀ ∝ A · Π · cTw · [Xw, Yw, Zw, 1]ᵀ      A = [[fx,0,cx],[0,fy,cy],[0,0,1]],  Π = [I | 0]
```

- 输出 `rvec`（Rodrigues 旋转向量）和 `tvec`。可选方法有：
  - `SOLVEPNP_ITERATIVE`：LM 最小化重投影误差，非平面点至少 6 个；
  - `SOLVEPNP_EPNP`；
  - `SOLVEPNP_SQPNP`：全局最优，至少 3 个点；
  - `SOLVEPNP_IPPE`：平面；
  - 以及 `solvePnPRansac`、`solvePnPRefineLM` 等。

人脸上的典型用法【推断/业界通用】：

```
# 原创伪代码
model3d = canonical_face_points[idx]      # 例如取 6~12 个刚性较强的点：眼角、鼻尖、鼻底、嘴角、下巴
img2d   = landmarks[idx]
K = [[f,0,w/2],[0,f,h/2],[0,0,1]], f ≈ w          # 无标定时的近似
ok, rvec, tvec = solvePnP(model3d, img2d, K, None, flags=SOLVEPNP_SQPNP)
rvec, tvec = solvePnPRefineLM(model3d, img2d, K, None, rvec, tvec)
R = Rodrigues(rvec); yaw, pitch, roll = euler_from(R)    # 注意 OpenCV 相机系 X右 Y下 Z前
if frame>0: ok = solvePnP(..., useExtrinsicGuess=True, rvec=prev_rvec, tvec=prev_tvec)  # 用上一帧做初值更稳
```

**字节一手旁证**【官方/一手】：3D 人脸拟合头文件 `bef_effect_ai_facefitting.h` 的 mesh 输出结构里有：

- `float rvec[3]; // opencv solvepnp输出的旋转向量`
- `float tvec[3]; // opencv solvepnp输出的平移向量`

106 点结构体本身也直接给出 `yaw / pitch / roll`。来源：https://raw.githubusercontent.com/volcengine/VolcEngineRTC/main/iOS/script/Depends/BytedEffectSDK/effect-sdk.framework/Headers/bef_effect_ai_facefitting.h

### 5.2 MediaPipe 的加权 Procrustes【社区逆向/开源】

- MediaPipe Face Transform 把 canonical face model 刚性对齐到运行时关键点，并给出 “face pose transformation matrix”。文档写的是 Procrustes 分析，没有提 PnP。
- 关键设计在 `geometry_pipeline_metadata.proto`（https://raw.githubusercontent.com/google-ai-edge/mediapipe/master/mediapipe/modules/face_geometry/protos/geometry_pipeline_metadata.proto ）：
  - `procrustes_landmark_basis` 是一组 `WeightedLandmarkRef{landmark_id, weight}`；
  - 注释原文：“A good basis sets face landmark weights in way to distinguish a head pose change from a facial expression change and to only respond to the former.”

```
加权正交 Procrustes（原创推导摘要）
min_{s,R,t} Σ w_i ‖ s·R·M_i + t − L_i ‖²
  μ_M = Σw_i M_i / Σw_i,  μ_L 同理
  H = Σ w_i (M_i − μ_M)(L_i − μ_L)ᵀ,  H = UΣVᵀ
  R = V·diag(1,1,det(VUᵀ))·Uᵀ,  s = tr(Σ·D) / Σ w_i‖M_i − μ_M‖²,  t = μ_L − s R μ_M
```

【推断】这里的权重应该给“刚性点”（鼻梁、眼眶外缘、太阳穴附近）高权重，给嘴唇、下颌这类随表情运动的点低权重。这样张嘴不会被误判为点头，贴在头上的道具也不会随说话上下跳动。

---

## 6. 3D 人脸模型（3DMM / FLAME）与 UV 网格

### 6.1 3DMM（Blanz & Vetter 线性形变模型）【推断/业界通用 + 社区开源佐证】

```
S(α, β) = S̄ + A_id·α + A_exp·β          # 形状：均值 + 身份基 + 表情基（PCA 线性组合）
T(γ)    = T̄ + A_tex·γ                   # 纹理（可选）
投影:   x_2d = s · P_orth · R · S + t     # 弱透视；或透视 K[R|t]
拟合:   min_{α,β,R,t,s} Σ_k ‖ proj(S)[lmk_k] − L_k ‖² + λ_α‖α‖² + λ_β‖β‖²
```

开源佐证：

- **Deep3DFaceRecon_pytorch**：使用 Basel Face Model 2009（BFM09）“to represent 3d faces”，表情基来自 Guo et al.，输出为 “257-dimensional coefficients”，配 68 点检测器。来源：https://raw.githubusercontent.com/sicxu/Deep3DFaceRecon_pytorch/master/README.md
- **3DDFA_V2**（ECCV 2020，*Towards Fast, Accurate and Stable 3D Dense Face Alignment*）：
  - 回归 3DMM 参数，默认 backbone 在 CPU 上约 1.35ms/张，MobileNet x0.5 版约 0.5ms（4 线程）；
  - 稠密重建有 38,365 个点；
  - 支持 UV 纹理、姿态、深度；
  - 已知局限：“head pose > 90° or the motion is too fast, the alignment may fail”。
  - 来源：https://raw.githubusercontent.com/cleardusk/3DDFA_V2/master/readme.md

### 6.2 FLAME【社区逆向/开源】

- *Learning a model of facial shape and expression from 4D scans*，SIGGRAPH Asia 2017（Li, Bolkart, Black, Li, Romero）。
- 模型由 33,000+ 扫描学习而来，身份空间来自 3800 人。包含可动的颈、下颌、眼球，以及 pose-dependent corrective blendshapes 和全局表情 blendshapes。
- 来源：https://raw.githubusercontent.com/soubhiksanyal/FLAME_PyTorch/master/README.md
- 从 `flame.py` 读到的前向流程（https://raw.githubusercontent.com/soubhiksanyal/FLAME_PyTorch/master/flame_pytorch/flame.py ）：
  - shape 系数与 expression 系数拼成 `betas`（槽位为 300 shape + 100 expression，未用部分补零）；
  - `full_pose = [global(3), neck(3), jaw(3), eyes(6)]`，即 5 个轴角关节；
  - `lbs()`（线性混合蒙皮，来自 smplx）把模板、blendshape、pose corrective、`J_regressor` 和蒙皮权重组合成顶点；
  - 关键点用 `lmk_faces_idx + lmk_bary_coords`（**三角形索引 + 重心坐标**）嵌在网格上，开启 `use_face_contour` 时，轮廓点按头部旋转角**动态**选择。

【推断】这种“动态轮廓点”机制对瘦脸很重要。2D 关键点的下颌轮廓是“可见轮廓”，侧脸时会在 3D 表面上滑动。如果瘦脸直接锚在 2D 轮廓上，转头时形变会漂。在 3D mesh 上定义“瘦脸位移场”再投影回来，可以避免这个问题。

### 6.3 MediaPipe canonical face model 与 UV【社区逆向/开源】

- `mediapipe/modules/face_geometry/data/` 下有：
  - `canonical_face_model.obj` / `.fbx`
  - `canonical_face_model_uv_visualization.png`
  - `face_model_with_iris.obj`
  - 三份 `geometry_pipeline_metadata_*.pbtxt`
  - 来源：https://github.com/google-ai-edge/mediapipe/tree/master/mediapipe/modules/face_geometry/data
- 文档说明：
  - 运行时 mesh 的 XYZ 来自关键点，“both the vertex texture coordinates (UV) and the triangular topology are inherited from the canonical face model”；
  - Face Effect 示例支持 3D 物体和 face mesh 贴图两种模式，两种模式下 “the face mesh is first rendered as an occluder straight into the depth buffer”；
  - 该示例只支持单脸。
  - 来源：face_mesh.md（见上）

### 6.4 字节的 3D 人脸拟合接口【官方/一手】

`bef_effect_ai_facefitting.h` 的注释写着：“输入人脸id和106点关键点，返回mesh信息”。其中可以看出完整的“landmark → 3D mesh → UV”数据结构：

```
bef_ai_facefitting_mesh_config (静态，模型级)            bef_ai_facefitting_mesh_info (逐脸逐帧)
├─ float* uv            // 标准展开图像的 uv 坐标         ├─ float* vertex     // 3d模型顶点
├─ unsigned short* flist // 顶点索引数组(face)            ├─ float* landmark   // 投影回图像坐标的landmark
├─ unsigned short* landmark_triangle // landmark三角剖分  ├─ float* param      // [scale, rotatex, rotatey, rotatez, tx, ty, alpha0, alpha1 ...]
├─ num_vertex / num_flist / num_param ...                 ├─ float mvp[16]     // vertex → NDC
                                                          ├─ float model[16]   // 正交投影下的模型矩阵
                                                          ├─ normal / tangent / bitangent (模型空间)
                                                          └─ rvec[3] / tvec[3] // opencv solvepnp 输出
输入: bef_ai_facefitting_args{ cameraParams[3] = focal_length, centerx, centery; view_width/height }
      landmark_info{ landmark106 (required); eye_lv2 / eyebrow / lips / iris 二级点 (optional) }
相机: BEF_AI_FACEFITTING_Camera_Orthographic / _Perspective
求解: Solver_Lambda / MaxIter / Eps / Smooth ...;  其他: Eyelash_Flag, Use_Semantic_Lmk, Mouth_BS_Limit
```

【推断】解读如下：

- `param = [scale, rotx, roty, rotz, tx, ty, α0, α1…]` 正好是“弱透视姿态 + 线性形变系数”的 3DMM 参数化。
- 输出 `tangent / bitangent` 说明 mesh 要拿去做**法线贴图光照**（3D 妆容、面具）。
- `Solver_Smooth` 说明拟合器内部带时序平滑。
- `Mouth_BS_Limit` 中的 BS 很可能是 blendshape，用来限制嘴部表情系数的范围。
- 具体顶点数、基的维度和来源，头文件没有给出。

### 6.5 UV 妆容 / 面具渲染流程【推断/业界通用】

```
  设计师在 UV 展开图上画妆 (makeup_uv.png, 与 canonical UV 对齐)
                │
  每帧:  landmarks ──► fitting/face-mesh ──► vertex(x,y,z) + 固定 uv + flist
                │
  GPU:  pass1 深度预渲染 face mesh 作遮挡体（防止道具穿帮）
        pass2 以 vertex 为位置、uv 为纹理坐标绘制 mesh，片元里：
              base = texture(camera, screenUV);  mk = texture(makeup_uv, uv)
              out  = blend(base, mk, mode) * mask(眼/嘴开合, 遮挡 visibility)
```

---

## 7. 脸型变形：局部缩放、局部平移、MLS、三角网格、液化

所有“美型”在 GPU 上的统一形式是**逆映射（backward mapping）**：对输出像素 `p` 求源坐标 `src(p)`，再执行 `texture(src(p))`。这样不会出现空洞。

### 7.1 Gustafsson 局部缩放（大眼）

**公式来源**【社区逆向/开源】：

- 源自 Andreas Gustafsson 的 *Interactive Image Warping*。原文未能打开；“硕士论文”“1993 年”这两点在所引开源代码中都没有出现（未能核实）。
- 仓库 `Rayilam/DIP_ucas`（据仓库名推断为中国科学院大学数字图像处理课程作业）中 `big_eye.py` 的注释写着 “Interactive Image Warping 局部缩放算法”，并写出：

```
f(r) = (1 − (r/r_max − 1)² · a) · r
```

- 代码中 `ratio = 1 - (rnorm-1)^2 * 0.5`（a 写死为 0.5）。眼中心取 68 点里的 38 / 43 号，半径取到鼻梁 27 号点的距离。
- 来源：https://raw.githubusercontent.com/Rayilam/DIP_ucas/master/美颜相机/实验代码/big_eye.py

**几何含义**：

- 在半径 `r_max` 的圆内，源点 = 中心 + (p − 中心)·k，其中 k = 1 − a(r/r_max − 1)²。
- 中心处 k = 1 − a < 1，从更靠近中心的地方取样，所以画面被**放大**。
- 边界处 k = 1，形变连续地衰减为 0，不会出现接缝。
- a < 0 时为缩小（小眼 / 缩鼻翼）。

```
 k(r)
 1.0 ┤                      ●───── 圆外不变
     │                  ●
     │             ●
 1-a ┤●──●──●                     r/rmax
     └──────────────────────┬────►
     0                      1
```

### 7.2 Gustafsson 局部平移（瘦脸 / 推拉）

**公式来源**【社区逆向/开源】：EffectLab 的 `LocalWarpEffect` 注释写明“参考文献: Interactive Image Warping by Andreas Gustafsson”（来源：https://raw.githubusercontent.com/cedricporter/EffectLab/master/EffectLab/Effect.py ）。

【核查更正】原稿把下面的“经典写法”当成了 EffectLab 的实现，两者并不相同：

```
经典写法（常见转述，Gustafsson 原文未能打开核对）:
u = x − ( (r² − |x−c|²) / (r² − |x−c|² + |m−c|²) )² · (m − c)

EffectLab 源码实际写法（变量名叫 dis_m_c，实际算的是 x 到 m 的距离）:
dis_m_c = sqrt((x - mx)**2 + (y - my)**2)
u = x − ( (r² − |x−c|²) / (r² − |x−c|² + |x−m|²) )² · (m − c)
```

- c 为按下点，m 为拖到的位置，r 为半径。
- 两种写法在圆边界（|x−c| = r）处位移都为 0。
- “x = m 时系数为 1、源点为 c（把 c 处内容拖到 m）”只对 **EffectLab 的写法**成立。按经典写法，x = m 时系数为 ((r² − |m−c|²)/r²)²，小于 1，源点并不正好是 c。原稿把这条性质安在经典公式上，是错的。§7.4 的 GLSL 用的是经典写法（`dot(mc, mc)` = |m−c|²）。

### 7.3 GPUPixel 的瘦脸 / 大眼实现剖析【社区逆向/开源】

GPUPixel（Apache-2.0，C++11 + OpenGL/ES，支持 iOS / Android / Mac / Win / Linux）的 `face_reshape_filter.cc`（https://raw.githubusercontent.com/pixpark/gpupixel/main/src/filter/face_reshape_filter.cc ）：

- **输入**：
  - `uniform float facePoints[106*2]`，交错存放的归一化 x / y；
  - `hasFace`、`aspectRatio`、`thinFaceDelta`、`bigEyeDelta`。
- **距离做宽高比校正**：y 除以 `aspectRatio` 后再求距离，保证圆形影响区。
- **瘦脸 `thinFace`**：
  - 对 9 对 (origin → target) 关键点依次调用 `curveWarp`：(3→44)、(29→44)、(7→45)、(25→45)、(10→46)、(22→46)、(14→49)、(18→49)、(16→49)；
  - 数学形式：`D = (T−O)·d`，`R = |T−O|`，`s = clamp(1 − |P−O|/R, 0, 1)`，`P_out = P − D·s`；
  - 这是**线性衰减版的局部平移**，影响半径等于“轮廓点到目标点的距离”。
- **大眼 `enlargeEye`**：
  - 两对 (74→72)、(77→75)，半径 = 两点距离 × 5；
  - `w = |P−O|/r`，`w = clamp(1 − (1 − w²)·d, 0, 1)`，`P_out = O + (P−O)·w`；
  - 这是局部缩放的一个变体（衰减项用 `1−w²`）。
- **参数范围**：【核查更正】头文件 `face_reshape_filter.h` 没有写范围。`.cc` 里 `RegisterProperty("thin_face", …)` 和 `RegisterProperty("big_eye", …)` 的描述**都是**“The smoothing of filter with range between -1 and 1.”，明显是从磨皮滤镜复制过来的文字。另有一行代码注释 `// [0, 0.15]` 紧挨着 `big_eye_delta_` 的初始化。所以 [-1, 1] 并不专属 `SetFaceSlimLevel`，可靠的实际范围未知。
- **执行顺序**：`main` 中先瘦脸再大眼。
- 关键点索引语义取决于 mars_vision 的 106 点布局，本文未能核实每个索引的具体部位。

### 7.4 原创 GLSL：局部缩放 + 局部平移（多控制点、宽高比正确）【推断/业界通用】

```glsl
#version 300 es
precision highp float;

in  vec2 vUV;                       // 输出像素的归一化坐标 [0,1]
out vec4 outColor;

uniform sampler2D uSrc;
uniform vec2  uSize;                // 纹理像素尺寸 (w, h)，用于把 UV 差转成像素距离

// 大眼：两个局部缩放
uniform vec2  uEyeC[2];             // 眼中心 (UV)
uniform float uEyeR[2];             // 影响半径 (像素)，建议 ≈ 0.4~0.6 × eye_dist
uniform float uEyeA;                // a ∈ (-1, 1)，> 0 放大

// 瘦脸：N 组 (控制点 c → 目标点 m)
#define MAX_PUSH 8
uniform int   uPushN;
uniform vec2  uPushC[MAX_PUSH];
uniform vec2  uPushM[MAX_PUSH];     // m = c + strength * (中线方向)
uniform float uPushR[MAX_PUSH];     // 像素

vec2 px(vec2 d) { return d * uSize; }          // UV 差 → 像素差（自动处理宽高比）

// Gustafsson local scaling（逆映射）
vec2 localScale(vec2 p, vec2 c, float rmax, float a) {
    float r = length(px(p - c));
    if (r >= rmax) return p;
    float t = r / rmax - 1.0;                  // ∈ [-1, 0)
    return c + (p - c) * (1.0 - a * t * t);    // 中心 k = 1-a，边界 k = 1
}

// Gustafsson local translation（逆映射）
vec2 localTranslate(vec2 p, vec2 c, vec2 m, float rmax) {
    vec2  d  = px(p - c);
    float r2 = dot(d, d);
    float R2 = rmax * rmax;
    if (r2 >= R2) return p;
    vec2  mc = px(m - c);
    float w  = (R2 - r2) / (R2 - r2 + dot(mc, mc));
    return p - (w * w) * (m - c);
}

void main() {
    vec2 p = vUV;
    // 注意：逆映射的复合顺序与“正向形变”的顺序相反。这里等价于正向先大眼、后瘦脸
    for (int i = 0; i < MAX_PUSH; ++i) {
        if (i >= uPushN) break;
        p = localTranslate(p, uPushC[i], uPushM[i], uPushR[i]);
    }
    p = localScale(p, uEyeC[0], uEyeR[0], uEyeA);
    p = localScale(p, uEyeC[1], uEyeR[1], uEyeA);
    outColor = texture(uSrc, clamp(p, vec2(0.0), vec2(1.0)));
}
```

工程注意【推断/业界通用】：

- **防折叠**：局部平移要保证 `|m−c|` 明显小于 `rmax`（经验上 < 0.5·rmax），否则会出现折叠或撕裂。
- **背景弯曲**：瘦脸会把背景直线（门框、桌沿）一起弯掉。常见的缓解方式：
  - 用人像分割 mask 限制形变；
  - 改成三角网格形变（§7.6）。
- **侧脸自适应**：按 `yaw` 降低远侧脸颊的强度。字节 106 结构体直接给出 yaw。
- **多脸**：每张脸一组 uniform，并对影响圆做包围盒裁剪，避免每个像素都遍历所有控制点（§12）。

### 7.5 Moving Least Squares（MLS）【社区逆向/开源 + 推断】

- 论文 *Image deformation using moving least squares*（Schaefer, McPhail, Warren, SIGGRAPH 2006）。
- 开源实现：
  - `Jarvis73/Moving-Least-Squares`：实现 affine / similarity / rigid 三种；
  - `mpizenberg/rust_mls`：affine。
- 性能参考：NumPy 处理 2000×2000 图像、64 个控制点要几十秒；PyTorch + CUDA 的 rigid 版本在 1000×1000 下约 0.66s。
- 来源：https://raw.githubusercontent.com/Jarvis73/Moving-Least-Squares/master/README.md 、https://raw.githubusercontent.com/mpizenberg/rust_mls/main/README.md

公式按论文的常见表述复述，PDF 未能打开核对：

```
控制点 p_i → q_i，对任意点 v：
w_i  = 1 / |p_i − v|^(2α)
p*   = Σ w_i p_i / Σ w_i,   q* = Σ w_i q_i / Σ w_i,   p̂_i = p_i − p*,  q̂_i = q_i − q*
Affine:  f(v) = (v − p*) · (Σ p̂_iᵀ w_i p̂_i)⁻¹ · Σ w_j p̂_jᵀ q̂_j + q*
Rigid:   f(v) = |v − p*| · f⃗(v)/|f⃗(v)| + q*,  其中 f⃗(v) = Σ q̂_i A_i(v)（A_i 由 p̂_i 与 v−p* 构成）
```

在美颜里的用法【推断】：

- 把 106 点作为控制点 p_i，美型后的目标点作为 q_i。q_i 由“下巴收窄 x%、眼距变化 y%”等参数在关键点空间算出。
- MLS 给出平滑、无折叠（rigid 版）的全局场。
- 逐像素算 MLS 的开销是 O(N) 乘以像素数，GPU 上一般**在粗网格（如 32×32 顶点）上算位移，再由顶点着色器插值**，不逐像素算。

### 7.6 关键点锚定的三角网格形变【社区逆向/开源 + 推断】

- **开源佐证**：LearnOpenCV 的 FaceMorph 对每个三角形用 `getAffineTransform(三点→三点)` 加 `warpAffine` 做仿射变换。三角形用 `fillConvexPoly` 生成抗锯齿 mask 后拼接，三角形列表从 `tri.txt` 读取（Delaunay 剖分）。来源：https://raw.githubusercontent.com/spmallick/learnopencv/master/FaceMorph/faceMorph.py
- **GPU 版本**【推断】更简单：把“关键点 + 图像边界/外圈辅助点”作为顶点：
  - 顶点着色器里位置用形变后的点，纹理坐标用原始点；
  - 光栅化器自动完成每个三角形的仿射插值，一个 draw call 就完成全脸形变。
- **优缺点**：可以精确控制形变区域，外圈辅助点固定，所以背景不弯。缺点是三角形边界处一阶不连续，强度大时能看到折线，可以加密网格或改用 MLS / 薄板样条生成顶点位移。
- **字节旁证**【官方/一手】：facefitting 配置里有 `landmark_triangle`（“landmark做三角剖分后的三角形数组”），说明 SDK 内部存在 landmark 级的三角剖分。它具体被哪个效果使用，未公开。

### 7.7 液化（Liquify）【社区逆向/开源】

GEGL 的 `gegl:warp`（GIMP 的变形工具后端）是公开可读的“液化”实现。来源：https://raw.githubusercontent.com/GNOME/gegl/master/operations/common-cxx/warp.cc

- **数据结构**：一张双通道 float **位移图**（每像素一个 (dx, dy)），最后按位移图重采样原图。
- **笔刷**：沿笔画每隔 `MAX(size*spacing, 0.5)` 盖一个 stamp。
  - 衰减查表为 `exponent = 0.4/(1−hardness)`，`lookup[x] = gauss(pow(x/radius, exponent))`；
  - `influence = strength * stamp_force`。
- **行为**：move（按笔画位移推）、grow / shrink（`nv = influence * (xi, yi)`，即相对中心的向量；grow 取负号）、swirl CW / CCW、erase（位移衰减到 0）、smooth（位移向局部均值靠拢）。

【推断】在美颜产品里，“手动瘦脸 / 液化”与“自动瘦脸”的区别只在位移来源：一个来自用户笔画，一个来自关键点规则。两者最终都可以统一成**位移图（或位移网格）+ 一次重采样**。在剪辑软件中，位移场还要能随人脸跟踪做刚体变换，跟着脸走。

### 7.8 字节的“美型”参数分解【官方/一手 + 推断】

火山引擎 Demo 资源 `ComposeMakeup/reshape_lite/.config_file` 列出了 16 个形变参数键：

- `Internal_Deform_Overall`（Demo 的 `BeautyModel.swift` 标注为“瘦脸”）
- `Internal_Deform_Face`、`Internal_Deform_CutFace`、`Internal_Deform_Zoom_Jawbone`、`Internal_Deform_Zoom_Cheekbone`、`Internal_Deform_Chin`、`Internal_Deform_Forehead`
- `Internal_Deform_Nose`、`Internal_Deform_MovNose`
- `Internal_Deform_ZoomMouth`、`Internal_Deform_MovMouth`、`Internal_Deform_MouthCorner`
- `Internal_Eye_Spacing`、`Internal_Deform_RotateEye`、`Internal_Deform_Eye_Move`
- `BEF_BEAUTY_BODY_SHRINK_HEAD`

`BeautyModel.swift` 另有 `Internal_Deform_Eye`（大眼）。来源：

- https://raw.githubusercontent.com/volcengine/VolcEngineRTC/main/iOS/script/Depends/BytedEffectSDK/Resource/ComposeMakeup.bundle/ComposeMakeup/reshape_lite/.config_file
- https://raw.githubusercontent.com/volcengine/VolcEngineRTC/main/iOS/ApiExample/ApiExample/ImportantComponents/Beauty/VolcBeauty/BeautyModel.swift

【推断】从命名可以把这些参数归为三类几何原语，正好对应本节的算法：

| 命名 | 原语 | 对应算法 |
|---|---|---|
| `Zoom*` / `Nose` / `Eye` | 局部缩放 | §7.1 |
| `Mov*` / `Eye_Move` / `Chin` / `Forehead` / `CutFace` / `Overall` | 局部平移 | §7.2 / §7.3 |
| `RotateEye` / `MouthCorner` | 局部旋转（“Gustafsson 论文中也有 local rotation”（未能核实）） | 本文未展开 |

字节实际使用的形变算法（网格 / MLS / 逐像素）**没有公开**，资源中的 Lua 脚本是加密的。

---

## 8. 磨皮：双边、导向滤波、表面模糊、高反差保留与皮肤 mask

### 8.1 双边滤波【社区逆向/开源】

- OpenCV `bilateralFilter` 的文档（https://raw.githubusercontent.com/opencv/opencv/4.x/modules/imgproc/include/opencv2/imgproc.hpp ）：
  - 引用 Tomasi & Manduchi 的说明页；
  - “can reduce unwanted noise very well while keeping edges fairly sharp. However, it is very slow”；
  - sigma 小于 10 时几乎无效果，大于 150 时会 “cartoonish”；
  - 实时应用建议 `d=5`。
- GPUImage 的 `GPUImageBilateralFilter`（https://raw.githubusercontent.com/BradLarson/GPUImage/master/framework/Source/GPUImageBilateralFilter.m ）：
  - 9 tap，**横竖两 pass**，空间权重写死（中心 0.18，向外递减到 0.05）；
  - 颜色权重为 `(1 − min(distance(c0, ci)·distanceNormalizationFactor, 1))`，默认 factor = 8；
  - 结果除以实际权重和。
- 【推断/业界通用】双边滤波**不可分离**，两 pass 只是近似，会在斜向边缘产生轻微伪影。但它把 81 次采样降到 18 次，是移动端的经典折中。

### 8.2 导向滤波（Guided Filter）【社区逆向/开源 + 推断】

- 论文 *Guided image filtering*（He, Sun, Tang, ECCV 2010）与 *Fast guided filter*（He, Sun, arXiv 1505.00996）。引用信息见 OpenCV contrib 的 bib：https://raw.githubusercontent.com/opencv/opencv_contrib/4.x/modules/ximgproc/doc/ximgproc.bib
- `ximgproc::guidedFilter` 文档（https://raw.githubusercontent.com/opencv/opencv_contrib/4.x/modules/ximgproc/include/opencv2/ximgproc/edge_filter.hpp ）：
  - 【核查更正】原文是 “eps regularization term of Guided Filter. **eps²** is similar to the sigma in the color space into bilateralFilter”，可类比双边滤波值域 sigma 的是 eps²，不是 eps；
  - Fast Guided Filter 的 `scale` < 1 时先降采样再计算。

自引导形式（引导图 I 等于输入 p）的公式，按论文的通行写法复述：

```
mean_I = box_r(I),  corr_I = box_r(I·I),  var_I = corr_I − mean_I²
a = var_I / (var_I + ε),  b = (1 − a)·mean_I
q = box_r(a)·I + box_r(b)       # 简化版可省略对 a、b 的二次平均
```

- **直觉**：
  - 平坦区（皮肤）var 很小，a 趋近 0，q 趋近局部均值，即强平滑；
  - 边缘（眉毛、眼睑、发际）var 很大，a 趋近 1，q 趋近原值，即保边。
- **复杂度**：O(1)，与半径无关，box 可以用积分图或可分离滑窗实现。Fast 版在 1/4 分辨率上算 a、b 后再上采样。所以导向滤波是移动端磨皮的主力。

### 8.3 GPUPixel 磨皮剖析：就是一个“简化自引导滤波 + 肤色门控”【社区逆向/开源】

`beauty_face_filter.cc` 把三个子滤镜组成 FilterGroup（https://raw.githubusercontent.com/pixpark/gpupixel/main/src/filter/beauty_face_filter.cc ）：

```
                ┌─► BoxBlur(radius 4, texelSpacing×4) ────────────────► slot1: mean
 input ─────────┼─► BoxHighPass = BoxBlur + BoxDifference(delta) ─────► slot2: "var"
                └──────────────────────────────────────────────────────► slot0: 原图
                                                    ▼
                                         BeautyFaceUnitFilter（终端）
```

- `BoxDifference`（https://raw.githubusercontent.com/pixpark/gpupixel/main/src/filter/box_difference_filter.cc ）：`d = (I − mean)·delta`，输出 `min(d², 1)`，默认 delta = 7.07。也就是逐像素的“放大平方偏差”，作为方差 / 边缘强度的代理。
- `BeautyFaceUnitFilter`（https://raw.githubusercontent.com/pixpark/gpupixel/main/src/filter/beauty_face_unit_filter.cc ）：
  - 肤色 / 亮度门控：`s = min(I.r, mean.r − 0.1)`，`p = clamp((s − 0.2)·4, 0, 1)`。红通道过暗的区域（头发、眉毛、瞳孔、暗背景）p 为 0，不磨。
  - `meanVar = (var.r + var.g + var.b)/3`，`θ = 0.1`。
  - `kMin = clamp((1 − meanVar/(meanVar + θ)) · p · blurAlpha, 0, 1)`。
  - `result = mix(I, mean, kMin)`。
  - 锐化：3×3 加权（中心 0.25、四邻 0.125、对角 0.0625）求出 `hPass = I − 加权均值`，`color = result + sharpen·hPass·2`。
  - 美白：levels，再经过 `lookUpGray` 曲线、`lookUpOrigin` / `lookUpSkin` 两张 LUT、`lookUpCustom` 64 格 LUT，最后按 `whiten` 混合（§9）。

**解读**【推断】：当 p = blurAlpha = 1 时，

```
result = I·(meanVar/(meanVar+θ)) + mean·(θ/(meanVar+θ)) = a·I + (1−a)·mean,  a = var/(var+θ)
```

这与 §8.2 导向滤波去掉“对 a、b 二次平均”后的形式**完全一致**，θ 就是 ε。GPUPixel 的磨皮本质上是“单 pass 简化导向滤波 + 红通道肤色门控 + 3×3 USM 锐化 + LUT 美白”。

### 8.4 表面模糊（Surface Blur）【推断/业界通用】

- Photoshop 的 Surface Blur 闭源。业界常见的复现是“阈值线性衰减的值域核”：

```
w_i = max(0, 1 − |I_i − I_0| / (k·T))        # T 为阈值；k 的取值众说不一，常见 2.5，未能找到一手出处
out = Σ w_i I_i / Σ w_i                     # 空间核为 box（不是高斯）
```

- 它和双边滤波的区别：空间上是均匀 box，值域上是“三角核”而不是高斯，所以平坦区更“干净”。缺点是半径大时 O(r²)，移动端一般只在低分辨率使用。

### 8.5 高反差保留 / 频率分离与细节回贴【推断/业界通用】

```
low  = smooth(I)              # 磨皮后的低频
high = I − blur_small(I)      # 小半径（1~2px）高通：毛孔、发丝级纹理
out  = low + k·high           # k≈0.2~0.5，把“质感”贴回来，避免塑料脸
```

- 中频（痘印、斑、细纹）被大半径平滑掉。最细的高频（毛孔）按比例保留。
- 修图里的“频率分离”和“高反差保留 + 线性光叠加”都是这个思路。

### 8.6 皮肤 mask【社区逆向/开源 + 官方/一手】

1. **YCbCr 阈值**【社区逆向/开源】：
   - Chai & Ngan（1999, *Face segmentation using skin-color map in videophone applications*）给出经典区间 Cb ∈ [77, 127]、Cr ∈ [133, 173]（8-bit）。标题与年份见 `skin-detection.js` 的注释；期刊卷期页码“IEEE TCSVT 9(4) 551–564”在所引来源中没有出现（未能核实）。另外，同一文件第 63 行又写作 “Chai & Ngan (2004)”，与前文不一致；
   - BT.601 转换为 `Cb = 128 − 0.168736R − 0.331264G + 0.5B`，`Cr = 128 + 0.5R − 0.418688G − 0.081312B`。
   - 两个开源实现都采用这组区间，后者还给区间加了羽化软边：
     - https://raw.githubusercontent.com/jesse-anderson/Tools/main/js/face_blurrer/skin-detection.js
     - https://raw.githubusercontent.com/DhruboRoyPartho/OpenLightRoom/main/core/masking/skin_mask.py
   - 缺点：会把木地板、暖色墙面误判成皮肤，对极端光照和深肤色不稳。
2. **关键点几何 mask**【推断/业界通用】：用 106 / 280 点构造“脸部多边形 − 眼、眉、唇、鼻孔多边形”，再做高斯羽化。这样最可靠，但只覆盖脸，脖子和手不在范围内。
3. **皮肤分割网络**【官方/一手】：字节 SDK 有 `bef_effect_ai_skin_segmentation.h`。输出是 `{width, height, unsigned char* mask}`；参数 `BEF_AI_SKIN_SEG_IS_NEED_FACE` 的注释为“是否加载人脸模型以去除五官皮肤”，即用人脸模型把五官从皮肤 mask 里挖掉。来源：https://raw.githubusercontent.com/volcengine/VolcEngineRTC/main/iOS/script/Depends/BytedEffectSDK/effect-sdk.framework/Headers/bef_effect_ai_skin_segmentation.h

### 8.7 原创 GLSL：低分辨率导向滤波磨皮（三 pass）【推断/业界通用】

```glsl
// ---------- Pass 1（1/4 分辨率）：输出 (Y, Y²)。需要 RG16F 目标，8-bit 存 Y² 精度不足 ----------
#version 300 es
precision highp float;
in vec2 vUV; out vec4 o;
uniform sampler2D uSrc;
const vec3 kY = vec3(0.299, 0.587, 0.114);
void main() {
    float y = dot(texture(uSrc, vUV).rgb, kY);   // 降采样时先双线性再平方，会略微低估方差；美颜场景可接受
    o = vec4(y, y * y, 0.0, 1.0);
}

// ---------- Pass 2/3（1/4 分辨率）：可分离 box，横一次、竖一次 ----------
#version 300 es
precision highp float;
in vec2 vUV; out vec4 o;
uniform sampler2D uIn;
uniform vec2 uStep;                 // (1/w, 0) 或 (0, 1/h)
const int R = 5;                    // 1/4 分辨率下 R=5 ≈ 原图 20px 半径
void main() {
    vec2 acc = vec2(0.0);
    for (int i = -R; i <= R; ++i) acc += texture(uIn, vUV + float(i) * uStep).rg;
    o = vec4(acc / float(2 * R + 1), 0.0, 1.0);   // r = mean(Y), g = mean(Y²)
}

// ---------- Pass 4（全分辨率）：合成 ----------
#version 300 es
precision mediump float;
in vec2 vUV; out vec4 o;
uniform sampler2D uSrc;             // 原图
uniform sampler2D uStats;           // Pass 3 结果，线性过滤自动上采样
uniform sampler2D uSkinSeg;         // 分割 mask（没有就绑一张白纹理）
uniform float uEps;                 // 0.002 ~ 0.01，越大越“糊”
uniform float uStrength;            // 0 ~ 1
uniform float uDetail;              // 0 ~ 0.5，细节回贴
const vec3 kY = vec3(0.299, 0.587, 0.114);

float skinYCbCr(vec3 c) {           // Chai & Ngan 区间 + 软边
    float cb = 0.5 - 0.168736 * c.r - 0.331264 * c.g + 0.5 * c.b;
    float cr = 0.5 + 0.5 * c.r - 0.418688 * c.g - 0.081312 * c.b;
    const float e = 0.02;
    float mb = smoothstep( 77.0/255.0 - e,  77.0/255.0, cb) * (1.0 - smoothstep(127.0/255.0, 127.0/255.0 + e, cb));
    float mr = smoothstep(133.0/255.0 - e, 133.0/255.0, cr) * (1.0 - smoothstep(173.0/255.0, 173.0/255.0 + e, cr));
    return mb * mr;
}

void main() {
    vec3  src = texture(uSrc, vUV).rgb;
    vec2  st  = texture(uStats, vUV).rg;
    float Y   = dot(src, kY);
    float var = max(st.g - st.r * st.r, 0.0);

    float a   = var / (var + uEps);                  // 自引导：平坦→0，边缘→1
    float qY  = a * Y + (1.0 - a) * st.r;            // 平滑后的亮度

    // 小半径高通（四邻域），作为“毛孔级”细节
    vec2  t   = 1.0 / vec2(textureSize(uSrc, 0));
    float nb  = dot(texture(uSrc, vUV + vec2( t.x, 0.0)).rgb, kY)
              + dot(texture(uSrc, vUV + vec2(-t.x, 0.0)).rgb, kY)
              + dot(texture(uSrc, vUV + vec2(0.0,  t.y)).rgb, kY)
              + dot(texture(uSrc, vUV + vec2(0.0, -t.y)).rgb, kY);
    float fine = Y - 0.25 * nb;

    // 只改亮度、保留色度：RGB 整体平移 ΔY
    vec3  smoothRGB = src + (qY - Y) + uDetail * fine;

    float mask = texture(uSkinSeg, vUV).r * skinYCbCr(src);
    o = vec4(mix(src, smoothRGB, clamp(mask * uStrength, 0.0, 1.0)), 1.0);
}
```

设计说明：

- 只对亮度做平滑，可以避免肤色被均值“灰化”；
- 统计量放在 1/4 分辨率，降低带宽；
- 若想更接近论文，可以把 `a` 和 `b` 再做一次 box（多一个 pass）。

---

## 9. 美白：曲线与 3D LUT

### 9.1 GPUPixel 的做法【社区逆向/开源】

`BeautyFaceUnitFilter` 的美白分支（`whiten > 0` 时生效）依次执行：

1. levels（`levelBlack = 0.0258820`，`levelRangeInv = 1.02657`）；
2. 用 `lookUpGray` 做逐通道曲线，按 0.5 混合；
3. `lookUpOrigin`：16×16 tile 的 LUT；
4. `lookUpSkin`：在相邻蓝色切片之间插值；
5. `lookUpCustom`：64 切片、8×8 tile 的 3D LUT。

最后与原色按 `whiten` 混合。可见“美白”= **曲线提亮 + 若干张调色 LUT 叠加**。来源同 §8.3。

### 9.2 曲线【推断/业界通用】

常用的单调提亮曲线：暗部提升多、高光几乎不变，避免过曝。

```
y' = log(y·(β − 1) + 1) / log(β)        # β > 1 越大越亮；y∈[0,1]
```

也可以由设计师在调色软件里画好曲线，烘焙成 256×1 的 1D LUT。

### 9.3 原创 GLSL：512×512（8×8 格 × 64³）3D LUT 采样

```glsl
// 约定：LUT 图 512x512，切成 8x8 个 64x64 的 tile；tile 序号 = 蓝色量化级，tile 内 x=R、y=G
vec3 lut512(sampler2D lut, vec3 c) {
    float b  = c.b * 63.0;
    float s0 = floor(b);
    float s1 = min(s0 + 1.0, 63.0);
    vec2  t0 = vec2(mod(s0, 8.0), floor(s0 / 8.0));        // tile 行列
    vec2  t1 = vec2(mod(s1, 8.0), floor(s1 / 8.0));
    vec2  inTile = (c.rg * 63.0 + 0.5) / 512.0;            // 64px tile 内半像素居中
    vec3  c0 = texture(lut, t0 / 8.0 + inTile).rgb;        // tile 原点 = 序号 × (64/512)
    vec3  c1 = texture(lut, t1 / 8.0 + inTile).rgb;
    return mix(c0, c1, b - s0);                            // 蓝色方向手动线性插值
}
// 美白 = mix(原色, lut512(uWhiteLut, 原色), uWhiten * skinMask)
```

【推断】美白的 LUT 只作用于皮肤 mask 区域（或在全图上弱化使用），否则背景也会“褪色”。

---

## 10. 锐化

【社区逆向/开源】GPUPixel 在磨皮之后紧接一个 3×3 高通锐化（见 §8.3）。字节资源 `beauty_IOS_lite/.config_file` 的参数键为 `whiten`、`clear`、`smooth`、`sharp`，其中 `clear` 的含义见 `research_effects.md`（据其引用的 BytePlus 文档为“清晰”）。来源：https://raw.githubusercontent.com/volcengine/VolcEngineRTC/main/iOS/script/Depends/BytedEffectSDK/Resource/ComposeMakeup.bundle/ComposeMakeup/beauty_IOS_lite/.config_file

【推断/业界通用】USM（Unsharp Mask）的标准形式：

```
out = I + amount · (I − G_σ(I)) · step(threshold, |I − G_σ(I)|)
```

注意事项：

- 锐化要放在磨皮**之后**、并且**避开皮肤**（或在皮肤上降低强度），否则会把磨掉的瑕疵重新拉回来。常见做法是 `sharpMask = 1 − skinMask·0.7`，主要锐化眼睛、眉毛、头发和衣物纹理。
- 只锐化亮度通道，可以避免彩色镶边。

---

## 11. 美妆：贴合关键点的纹理与混合模式

### 11.1 GPUPixel 的 2D 网格贴妆【社区逆向/开源】

`face_makeup_filter.cc`（https://raw.githubusercontent.com/pixpark/gpupixel/main/src/filter/face_makeup_filter.cc ）的做法：

- **顶点位置**：关键点从 [0,1] 映射到 clip space（`2*it−1`），作为 `position` 属性，即每帧把当前关键点直接当顶点。
- **妆容纹理坐标**：`FaceTextureCoordinates()` 是一张**标准脸**上的固定点表。每个点 ×1280，减去 `texture_bounds_` 的 x/y，再除以其 width/height。这相当于把“标准脸 1280 像素坐标系”映射到妆容素材的子矩形。
- **三角形索引**：`GetFaceIndexs()` 按区域分组，包括眉、眼、脸颊、鼻、鼻嘴之间、上唇、下唇、唇间、嘴到下巴。只在 `has_face_` 时执行 `glDrawElements(GL_TRIANGLES)`。
- **具体素材**：口红 `lipstick_filter.cc` 载入 `mouth.png`，`SetTextureBounds(FrameBounds{502.5, 710, 262.5, 167.5})`，即嘴部素材在标准脸上的位置和尺寸。来源：https://raw.githubusercontent.com/pixpark/gpupixel/main/src/filter/lipstick_filter.cc
- **混合**：
  - `fgColor *= intensity`，先反预乘；
  - `blendFunc` 支持 0 = normal、15 = multiply、17 = overlay、22 = hard light，`DoRender` 写死为 15（multiply）；
  - 最终 `bg*(1−fg.a) + blended*fg.a`。

```
标准脸坐标 (1280px 模板)                当前帧
  ┌───────────────┐                     ┌───────────────┐
  │   ▲ 唇部三角   │  uv = (pt·1280 −    │    ▲ 同一组    │  pos = landmark·2 − 1
  │  ╱ ╲ mouth.png│   bounds.xy)/wh     │   ╱ ╲ 三角形   │  (随脸实时变形)
  └───────────────┘ ───────────────────►└───────────────┘
        素材空间                           屏幕空间（光栅化完成逐三角仿射）
```

### 11.2 混合模式公式【社区逆向/开源】

W3C *Compositing and Blending Level 1* 的公式（https://raw.githubusercontent.com/w3c/csswg-drafts/main/compositing-1/Overview.bs ）。Cb 为底色（脸），Cs 为妆容色：

```
Multiply:   B = Cb·Cs                                   # 口红/眼影加深、保留唇纹
Screen:     B = Cb + Cs − Cb·Cs                         # 高光/提亮
HardLight:  Cs≤0.5 ? Multiply(Cb, 2Cs) : Screen(Cb, 2Cs−1)
Overlay:    B = HardLight(Cs, Cb)                        # 以底色为条件，保留明暗
SoftLight:  Cs≤0.5 ? Cb − (1−2Cs)·Cb·(1−Cb) : Cb + (2Cs−1)·(D(Cb) − Cb)
            D(Cb) = Cb≤0.25 ? ((16Cb − 12)Cb + 4)Cb : sqrt(Cb)   # 腮红/修容最自然
带 alpha:   Cs' = (1 − αb)·Cs + αb·B(Cb, Cs)
```

各部位的常见选择【推断/业界通用】：

| 部位 | 常用模式 | 原因 |
|---|---|---|
| 口红 | multiply 或 soft light | 保留唇纹 |
| 腮红 / 修容 | soft light 或 multiply（低 alpha） | 过渡自然 |
| 高光 | screen | 提亮 |
| 眼影 | multiply 加闪片层 screen | 加深底色，同时保留亮片 |
| 美瞳 | 在虹膜圆内 normal / overlay | 结合眼睑遮挡 mask |

### 11.3 遮挡与动态细节【官方/一手 + 推断】

- **张嘴与牙齿**：口红如果贴在整张“嘴部多边形”上，张嘴时会染到牙齿。字节 SDK 提供 `BEF_FACE_DETECT_MOUTH_MASK` / `TEETH_MASK`，可以在片元里乘 `(1 − teethMask)`。来源：§2.5 头文件。
- **唇缘精度**：唇妆边缘依赖 280 点里的 `lips[64]`。106 点的唇部点不够密，“画出唇线”会明显。【推断】
- **遮挡**：`visibility_array[106]` 标出被遮挡的点，例如手挡住嘴。妆容可以按可见性淡出，避免画到手上。【推断】
- **3D 妆**：有大角度侧脸、需要光照一致时，改用 §6.4 / §6.5 的 UV mesh 方案，并用 `normal / tangent` 做简单 Lambert 或法线贴图。

---

## 12. 多人脸与移动端 GPU 性能

### 12.1 多人脸【官方/一手 + 社区逆向/开源 + 推断】

- **上限**：
  - 字节：`BEF_FACE_PARAM_MAX_FACE_NUM` 默认 5，`BEF_MAX_FACE_NUM 10`。注释说明：“该值越大, 但相应耗时越长”，且跟踪数超过上限后不再检测新脸。
  - MediaPipe：用 `num_faces` 控制。只有当跟踪人脸数不足时才跑检测（§4.1）。
- **单脸假设**：
  - GPUPixel 检测封装的注释写着 “only support one face”，但代码会遍历所有结果；
  - 美型 shader 只有一组 `facePoints[212]`；
  - MediaPipe Face Effect 示例也只支持单脸。
- **多脸美型的 shader 组织**【推断】：
  - **方案 A：每张脸一个 pass**，在该脸的包围盒（加影响半径）内画一个 quad，形变只在局部算，其余像素直接拷贝。N 张脸就是 N 个小 quad。
  - **方案 B：位移图法**。CPU 或计算着色器先把所有脸的位移“画”进一张低分辨率 RG16F 位移图，最终一次重采样。成本与人脸数基本无关，也与液化（§7.7）统一。
- **ID 稳定**：每张脸独立维护滤波器（§4.5）。新脸出现时形变强度从 0 渐入（例如 200ms），避免“突然变脸”。

### 12.2 移动端 GPU 性能要点【推断/业界通用，部分有开源佐证】

| 手段 | 说明 | 佐证 |
|---|---|---|
| 降低检测频率 | 有脸 24 帧 / 无脸 8 帧检测一次；平时跑关键点跟踪 | 字节头文件（§2.5）、MediaPipe 图（§4.1） |
| 检测与渲染异步 | CPU / NPU 推理和 GPU 渲染并行，关键点比画面晚 1 帧时可以用 One Euro 预测或对画面延迟 1 帧对齐 | 推断 |
| 低分辨率统计 | 磨皮的 mean / var 在 1/4 分辨率计算，Fast Guided Filter 的 `scale` 参数就是为此设计 | OpenCV ximgproc 文档（§8.2） |
| 可分离与稀疏采样 | 双边 / 高斯拆成两 pass；GPUPixel 的 box blur 用 `texelSpacingMultiplier=4` 稀疏采样扩大半径 | GPUImage、GPUPixel 源码 |
| 合并 pass | 磨皮、锐化、美白放在同一个片元着色器里（GPUPixel 的 BeautyFaceUnit 就是这样），减少带宽和 FBO 切换 | GPUPixel 源码 |
| 局部绘制 | 美型、美妆只画人脸包围盒内的 quad 或三角网格 | 推断 |
| uniform 预算 | 106 点作为 `float[212]` uniform 时，每个数组元素在部分 GLES 实现上可能占一个 vec4 槽。可以改用 `vec2[106]` 或 `vec4[53]` 打包，或者把关键点放进一张 106×1 的 RGBA32F 纹理 | 推断（具体上限因设备而异，未核对规范最小值） |
| 半精度 | 颜色运算用 `mediump`；坐标计算和 Y² 统计用 `highp` 或 16F 纹理，否则会出现色带或方差为负 | 推断 |
| 零拷贝 | 相机或解码输出直接作为 OES / CVPixelBuffer 纹理，推理用降采样的拷贝；避免 `glReadPixels` 回读整帧 | 推断 |
| 模型分档 | 低端机用小模型或 106 点；高端机加二级 280 点或 3D 拟合（字节有 `BEF_DETECT_SMALL_MODEL`、二级模型可选加载） | 字节头文件。核查注：对应的 `BEF_DETECT_LARGE_MODEL` 注释为“现已废弃”，所以“大 / 小两档 106 模型”目前只剩小模型。可分档的是“是否加载 240 / 280 二级点、是否开 `240_DETECT_FASTMODE`”，以及 VIDEO / IMAGE(_SLOW) 模式 |

---

## 13. 与剪映 / CapCut 场景的对应（推断）

以下全部为【推断/业界通用】，没有剪映官方技术资料佐证：

1. **两种运行形态**：
   - “拍摄 / 拍同款”是实时相机流，适用本章的实时策略（间隔检测、因果滤波、低分辨率统计）。
   - “剪辑时间线上的人像美颜 / 美型”是**可回看、可离线导出**的视频。可以每帧都跑 IMAGE 模式的检测，用非因果平滑，导出时用更高分辨率的统计量。字节 SDK 同时提供 VIDEO 和 IMAGE 两种模式，正好匹配这两种形态。
2. **参数可编辑、可关键帧**：剪辑软件需要“强度随时间变化”和“只对某个人脸 ID 生效”。人脸 ID 与时间线片段的绑定应该存在草稿数据里（数据模型见其他章节）。此外，跟踪丢失后字节 SDK 会**换新 ID**（§3.5），所以剪辑场景很可能需要一层“重识别 / 人脸聚类”来维持人物身份。SDK 头文件列表里确实有 `bef_effect_ai_face_clustering.h` 和 `bef_effect_ai_face_verify.h`（https://github.com/volcengine/VolcEngineRTC/tree/main/iOS/script/Depends/BytedEffectSDK/effect-sdk.framework/Headers ），但它们是否用于这个目的未经证实。
3. **预览与导出一致**：预览时可能降分辨率、降模型档位，导出时用全量。美型参数如果以“像素”为单位，两者就会不一致。所以形变半径、模糊半径都应该以 `eye_dist` 或人脸尺寸归一化（§4.5、§7.4）。

---

## 参考来源

### 字节跳动 / 火山引擎官方（GitHub 原文）

- https://raw.githubusercontent.com/volcengine/VolcEngineRTC/main/iOS/script/Depends/BytedEffectSDK/effect-sdk.framework/Headers/bef_effect_ai_face_detect.h
- https://raw.githubusercontent.com/volcengine/VolcEngineRTC/main/iOS/script/Depends/BytedEffectSDK/effect-sdk.framework/Headers/bef_effect_ai_facefitting.h
- https://raw.githubusercontent.com/volcengine/VolcEngineRTC/main/iOS/script/Depends/BytedEffectSDK/effect-sdk.framework/Headers/bef_effect_ai_skin_segmentation.h
- https://github.com/volcengine/VolcEngineRTC/tree/main/iOS/script/Depends/BytedEffectSDK/effect-sdk.framework/Headers
- https://raw.githubusercontent.com/volcengine/VolcEngineRTC/main/iOS/ApiExample/ApiExample/ImportantComponents/Beauty/VolcBeauty/BeautyModel.swift
- https://raw.githubusercontent.com/volcengine/VolcEngineRTC/main/iOS/script/Depends/BytedEffectSDK/Resource/ComposeMakeup.bundle/ComposeMakeup/reshape_lite/.config_file
- https://raw.githubusercontent.com/volcengine/VolcEngineRTC/main/iOS/script/Depends/BytedEffectSDK/Resource/ComposeMakeup.bundle/ComposeMakeup/beauty_IOS_lite/.config_file
- https://github.com/volcengine/VolcEngineRTC/tree/main/iOS/script/Depends/BytedEffectSDK/Resource/ComposeMakeup.bundle/ComposeMakeup
- https://github.com/volcengine/VolcEngineRTC/tree/main/iOS/script/Depends/BytedEffectSDK/Resource/ComposeMakeup.bundle/ComposeMakeup/beauty_IOS_lite

### GPUPixel

- https://github.com/pixpark/gpupixel
- https://raw.githubusercontent.com/pixpark/gpupixel/main/README.md
- https://github.com/pixpark/gpupixel/tree/main/src
- https://github.com/pixpark/gpupixel/tree/main/src/filter
- https://github.com/pixpark/gpupixel/tree/main/src/face_detector
- https://raw.githubusercontent.com/pixpark/gpupixel/main/src/face_detector/face_detector.cc
- https://raw.githubusercontent.com/pixpark/gpupixel/main/src/filter/face_reshape_filter.cc
- https://raw.githubusercontent.com/pixpark/gpupixel/main/src/filter/beauty_face_filter.cc
- https://raw.githubusercontent.com/pixpark/gpupixel/main/src/filter/beauty_face_unit_filter.cc
- https://raw.githubusercontent.com/pixpark/gpupixel/main/src/filter/box_high_pass_filter.cc
- https://raw.githubusercontent.com/pixpark/gpupixel/main/src/filter/box_difference_filter.cc
- https://raw.githubusercontent.com/pixpark/gpupixel/main/src/filter/face_makeup_filter.cc
- https://raw.githubusercontent.com/pixpark/gpupixel/main/src/filter/lipstick_filter.cc

### MediaPipe

- https://raw.githubusercontent.com/google-ai-edge/mediapipe/master/docs/solutions/face_mesh.md
- https://raw.githubusercontent.com/google-ai-edge/mediapipe/master/docs/solutions/face_detection.md
- https://raw.githubusercontent.com/google-ai-edge/mediapipe/master/mediapipe/python/solutions/face_mesh.py
- https://raw.githubusercontent.com/google-ai-edge/mediapipe/master/mediapipe/modules/face_landmark/face_landmark_front_gpu.pbtxt
- https://raw.githubusercontent.com/google-ai-edge/mediapipe/master/mediapipe/calculators/util/landmarks_smoothing_calculator.proto
- https://raw.githubusercontent.com/google-ai-edge/mediapipe/master/mediapipe/util/filtering/one_euro_filter.cc
- https://github.com/google-ai-edge/mediapipe/tree/master/mediapipe/modules/face_geometry/data
- https://raw.githubusercontent.com/google-ai-edge/mediapipe/master/mediapipe/modules/face_geometry/README.md
- https://raw.githubusercontent.com/google-ai-edge/mediapipe/master/mediapipe/modules/face_geometry/protos/geometry_pipeline_metadata.proto

### InsightFace / 检测与关键点

- https://raw.githubusercontent.com/deepinsight/insightface/master/detection/scrfd/README.md
- https://raw.githubusercontent.com/deepinsight/insightface/master/detection/retinaface/README.md
- https://raw.githubusercontent.com/deepinsight/insightface/master/alignment/coordinate_reg/README.md
- https://raw.githubusercontent.com/yakhyo/uniface/main/uniface/detection/blazeface.py
- https://raw.githubusercontent.com/wywu/LAB/master/README.md
- https://raw.githubusercontent.com/TTXS123OK/CVPapers/master/cs.CV/2019/05/20190509.md
- https://raw.githubusercontent.com/davisking/dlib/master/python_examples/face_landmark_detection.py

### OpenCV

- https://raw.githubusercontent.com/opencv/opencv/4.x/modules/calib3d/doc/solvePnP.markdown
- https://raw.githubusercontent.com/opencv/opencv/4.x/modules/video/include/opencv2/video/tracking.hpp
- https://raw.githubusercontent.com/opencv/opencv/4.x/modules/imgproc/include/opencv2/imgproc.hpp
- https://raw.githubusercontent.com/opencv/opencv_contrib/4.x/modules/ximgproc/include/opencv2/ximgproc/edge_filter.hpp
- https://raw.githubusercontent.com/opencv/opencv_contrib/4.x/modules/ximgproc/doc/ximgproc.bib

### 3D 人脸

- https://raw.githubusercontent.com/soubhiksanyal/FLAME_PyTorch/master/README.md
- https://raw.githubusercontent.com/soubhiksanyal/FLAME_PyTorch/master/flame_pytorch/flame.py
- https://raw.githubusercontent.com/cleardusk/3DDFA_V2/master/readme.md
- https://raw.githubusercontent.com/sicxu/Deep3DFaceRecon_pytorch/master/README.md

### 形变 / 液化

- https://raw.githubusercontent.com/cedricporter/EffectLab/master/EffectLab/Effect.py
- https://raw.githubusercontent.com/Rayilam/DIP_ucas/master/美颜相机/实验代码/big_eye.py
- https://raw.githubusercontent.com/Jarvis73/Moving-Least-Squares/master/README.md
- https://raw.githubusercontent.com/mpizenberg/rust_mls/main/README.md
- https://raw.githubusercontent.com/spmallick/learnopencv/master/FaceMorph/faceMorph.py
- https://raw.githubusercontent.com/GNOME/gegl/master/operations/common-cxx/warp.cc

### 滤波 / 肤色 / 混合 / 其他

- https://raw.githubusercontent.com/BradLarson/GPUImage/master/framework/Source/GPUImageBilateralFilter.m
- https://raw.githubusercontent.com/jesse-anderson/Tools/main/js/face_blurrer/skin-detection.js
- https://raw.githubusercontent.com/DhruboRoyPartho/OpenLightRoom/main/core/masking/skin_mask.py
- https://raw.githubusercontent.com/casiez/OneEuroFilter/main/README.md
- https://raw.githubusercontent.com/w3c/csswg-drafts/main/compositing-1/Overview.bs
- https://raw.githubusercontent.com/CainKernel/CainCamera/master/README.md

### 间接引用（论文链接来自上述页面，本次网络环境**未能直接打开**）

- BlazeFace https://arxiv.org/abs/1907.05047
- RetinaFace https://arxiv.org/abs/1905.00641
- SCRFD https://arxiv.org/abs/2105.04714
- JD-106 https://arxiv.org/abs/1905.03469
- Facial Surface Geometry https://arxiv.org/abs/1907.06724
- Attention Mesh https://arxiv.org/abs/2006.10962
- MLS 论文 PDF https://people.engr.tamu.edu/schaefer/research/mls.pdf
- RetinaFace CVPR 版 https://openaccess.thecvf.com/content_CVPR_2020/html/Deng_RetinaFace_Single-Shot_Multi-Level_Face_Localisation_in_the_Wild_CVPR_2020_paper.html
- 1€ filter 主页 https://gery.casiez.net/1euro/ （核查更正：原稿的 cristal.univ-lille.fr 地址未出现在任何所引页面中，已替换为作者仓库 README 给出的主页地址）
- FLAME 主页 http://flame.is.tue.mpg.de/

---

## 未能确认 / 待补充

1. **没有做中英文网页搜索**：WebSearch 配额已被同任务其他 agent 用尽，并且除 GitHub 外的域名全部无法解析。以下来源**完全没有覆盖**，需要补搜：
   - 火山引擎 / BytePlus 官网文档：智能美化特效的算法说明、106 / 240 / 280 点示意图；
   - 字节跳动技术团队、火山引擎开发者社区、掘金、InfoQ、QCon、GMTC、LiveVideoStack 上关于“美颜 / 美型 / 人脸关键点 / 端侧推理”的演讲稿；
   - 字节的招聘 JD（如“美颜算法工程师”的职责描述）。
2. **字节实际使用的算法没有一手证据**，包括：磨皮滤波器类型、美型用的是网格 / MLS 还是逐像素局部形变、关键点去抖用的滤波器类型、280 点的具体点位图、3D 拟合模型的顶点数和基维度。头文件只给了接口和参数范围；资源里的 Lua / config 是加密的，按规则没有尝试解密。
3. **剪映 / CapCut 是否、以及在哪些版本使用火山引擎 Effect SDK 的同一套人脸算法**：本章没有新证据，依赖 `research_effects.md` 的论证。
4. **论文原文没能打开核对**：
   - Gustafsson 1993 硕士论文的局部缩放公式，目前以开源作业代码的引用为准；
   - MLS 的 affine / rigid 公式按通行表述复述；
   - 导向滤波公式按通行表述复述；
   - BlazeFace 的 blending 细节以第三方复现注释为准；
   - ~~SCRFD 的论文标题凭记忆写出~~：核查时已在 InsightFace 主 README 的 BibTeX 中确认标题与作者（见 §2.3）。
5. **Photoshop Surface Blur 的确切公式**（阈值系数 2.5 的说法）没有找到一手出处，正文已标为“众说不一”。
6. **RetinaFace 论文中的自监督 3D mesh 分支**、MediaPipe Face Landmark 的输入尺寸和模型结构、FLAME 的顶点数（常说 5023）：这次没有从打开的页面上核实，所以正文未写或未作断言。
7. **GPUPixel 用的 `mars_vision` 106 点的索引语义**（如 44 / 45 / 46 / 49、72 / 74 / 75 / 77 各是哪个部位），以及它是否与 JD-106 / Face++ 106 的编号一致：未核实。
8. **GLES uniform 上限的规范最小值**（`GL_MAX_FRAGMENT_UNIFORM_VECTORS` 等）没有核对，正文只作为风险提示。
9. **字节 `beauty_IOS_lite` 中 `clear`（清晰）具体对应哪种算法**：未知。
10. **待补充的方向**：
    - 3D 美颜（基于 mesh 的光影重塑，如“立体 / 修容”）；
    - 实时人像重光照；
    - 基于生成模型的“AI 美颜 / AI 修图”。字节有 InfiniteYou、FaceCLIP、DreamID-V 等开源仓库，但它们属于生成式方向，不是本章讨论的实时管线，没有展开。

---

## 核查记录

> 核查日期：2026-10-15。核查方式：逐条用 `curl` 重新下载正文引用的 `raw.githubusercontent.com` 原文并 grep 比对。
> 环境限制：WebSearch 本轮配额已用尽（工具返回 “budget is used up”）；arxiv.org DNS 解析失败；github.com 的 HTML 页面（tree 目录页）经代理返回 403。所以论文信息只能通过 GitHub 上的 README / BibTeX 间接核对，tree 目录链接只能通过其下具体文件可访问（HTTP 200）来间接确认。

### 已核实（原文与正文一致，未改动）

| # | 断言 | 核对来源 | 结果 |
|---|---|---|---|
| 1 | `BEF_FACE_PARAM_FACE_DETECT_INTERVAL = 1, // default 24`，注释“有人脸时24, 无人脸时24/3=8” | `bef_effect_ai_face_detect.h` 第 226–228 行 | 一致 |
| 2 | `BEF_FACE_PARAM_MAX_FACE_NUM = 2, // default 5`，“跟踪到的人脸数大于该值时，不再进行新的检测”“该值越大, 但相应耗时越长”；`#define BEF_MAX_FACE_NUM 10` | 同上 | 一致 |
| 3 | `BEF_DETECT_MODE_VIDEO` / `VIDEO_SLOW` / `BEF_DETECT_SMALL_MODEL` 注释 | 同上 | 一致（`IMAGE` / `IMAGE_SLOW` 见下方更正） |
| 4 | `bef_ai_face_106`：`points_array[106]`、`visibility_array[106]`（“点未被遮挡1.0, 被遮挡0.0”）、yaw/pitch/roll“真实度量”、`eye_dist`、`ID`（跟踪丢失后新 faceID）、`action`；动作位眨眼/张嘴/摇头/点头/挑眉/嘟嘴 | 同上 | 一致 |
| 5 | `bef_ai_face_ext_info`：`eye_left/right[22]`、`eyebrow_left/right[13]`、`lips[64]`、`left/right_iris[20]`；`TT_MOBILE_FACE_280_DETECT` 注释；合计 280 | 同上 | 一致 |
| 6 | `BEF_FACE_PARAM_BASE_SMOOTH_LEVEL = 4`、`EXTRA_SMOOTH_LEVEL = 5`（[1-30]）、`MASK_SMOOTH_TYPE`（“平滑效果更好，速度更慢”） | 同上 | 一致 |
| 7 | facefitting：`rvec[3]` / `tvec[3]`“opencv solvepnp输出”；`uv` / `flist` / `landmark_triangle`；`param = [scale, rotatex, rotatey, rotatez, tx, ty, alpha0…]`；`mvp[16]` / `model[16]`；normal / tangent / bitangent；`cameraParams[3]`；Orthographic / Perspective；Solver_Lambda / MaxIter / Eps / Smooth、Eyelash_Flag、Use_Semantic_Lmk、Mouth_BS_Limit；“输入人脸id和106点关键点，返回mesh信息” | `bef_effect_ai_facefitting.h` | 一致 |
| 8 | `BEF_AI_SKIN_SEG_IS_NEED_FACE`“是否加载人脸模型以去除五官皮肤”，输出 `{width, height, mask}` | `bef_effect_ai_skin_segmentation.h` | 一致 |
| 9 | `reshape_lite/.config_file` 共 16 个键（逐一清点） | 该文件原文 | 一致 |
| 10 | `BeautyModel.swift`：`Internal_Deform_Overall` = “瘦脸”，`Internal_Deform_Eye` = “大眼” | 该文件原文 | 一致 |
| 11 | `beauty_IOS_lite/.config_file` = `["whiten", "clear", "smooth", "sharp"]` | 该文件原文 | 一致 |
| 12 | `bef_effect_ai_face_clustering.h`、`bef_effect_ai_face_verify.h` 存在 | 两个 raw URL 均 HTTP 200 | 存在 |
| 13 | BlazeFace：arXiv 1907.05047、MobileNet 启发、SSD 改编锚框、“improved tie resolution strategy…”、6 关键点、short-range 2m / full-range 5m 稀疏模型、默认 0 | MediaPipe `face_detection.md` | 一致 |
| 14 | uniface：128×128 letterbox、`16x16x2 + 8x8x6 = 896`、strides `(8, 16, 16, 16)`、weighted NMS 对框和关键点一起加权平均 | `uniface/detection/blazeface.py` | 一致 |
| 15 | RetinaFace：“practical single-stage SOTA”、5 点、R50 96.5/95.6/90.4、MobileNet0.25 1.68MB / Hard 82.5、arXiv 1905.00641、CVPR 2020 | InsightFace `retinaface/README.md` | 一致（补充了测试尺度说明） |
| 16 | SCRFD 表格各行数值、ICLR 2022、两步搜索以 hard mAP 选模型、`_KPS` 输出 5 点 | InsightFace `scrfd/README.md` | 一致 |
| 17 | JD-106：arXiv 1905.03469、Yinglu Liu 等、摘要中 “incompetent to depict…” 与 “manually annotated with 106-point” | CVPapers 索引页 | 一致（“京东 AI”单位未核实） |
| 18 | WFLW：10000 张脸、7500/2500、98 点、六类属性 | `wywu/LAB` README | 一致 |
| 19 | dlib：68 点、Kazemi & Sullivan CVPR 2014、iBUG 300-W 许可排除商用、联系 Imperial College London | dlib `face_landmark_detection.py` | 一致 |
| 20 | InsightFace `2d106det`：MobileNet-0.5、5MB、192×192 loose crop、“Mainly used for static image inference” | `coordinate_reg/README.md` | 一致 |
| 21 | MediaPipe Face Mesh：468 点、arXiv 1907.06724 / 2006.10962、`FACEMESH_NUM_LANDMARKS = 468` / `_WITH_IRISES = 478`、UV 与拓扑继承自 canonical model、先渲染为深度遮挡体、Face Effect 示例只支持单脸 | `face_mesh.md`、`face_mesh.py` | 一致 |
| 22 | `face_landmark_front_gpu.pbtxt`：PreviousLoopback、NormalizedRectVectorHasMinSize、`DISALLOW:prev_has_enough_faces`、AssociationNormRect `min_similarity_threshold: 0.5` 及引文 | 该 pbtxt | 一致 |
| 23 | landmarks_smoothing proto：beta 默认 0、min_cutoff 默认 1、derivate_cutoff 默认 1、VelocityFilter window 5 / velocity_scale 10、value scale = 包围盒最大边的倒数 | 该 proto | 一致 |
| 24 | `geometry_pipeline_metadata.proto` 的 `WeightedLandmarkRef` 与 “A good basis…” 引文；face_geometry/data 下 obj/fbx/png 与三份 `geometry_pipeline_metadata_*.pbtxt` | proto 原文；data 目录下各文件 raw URL 均为 200，BUILD 中列出 | 一致 |
| 25 | 1€ 滤波：作者、标题、CHI '12、DOI 10.1145/2207676.2208639、“first order low-pass filter with an adaptive cutoff frequency” | `casiez/OneEuroFilter` README | 一致 |
| 26 | OpenCV：bilateralFilter（very slow、<10 / >150 “cartoonish”、d=5）；KalmanFilter（standard，可改矩阵得 EKF）；calcOpticalFlowPyrLK（Bouguet00、maxLevel=0 不用金字塔）；solvePnP（ITERATIVE 非平面初值至少 6 点、SQPNP 全局最优 ≥3 点、IPPE 共面） | `imgproc.hpp`、`tracking.hpp`、`solvePnP.markdown` | 一致 |
| 27 | 导向滤波论文（He/Sun/Tang ECCV 2010；Fast guided filter arXiv 1505.00996）、`scale` < 1 降采样 | `ximgproc.bib`、`edge_filter.hpp` | 一致（eps 表述见下方更正） |
| 28 | FLAME：33,000+ 扫描、3800 人、颈 / 下颌 / 眼球、SIGGRAPH Asia 2017 作者；`flame.py` 300 shape + 100 expression、lbs、`lmk_faces_idx + lmk_bary_coords`、`use_face_contour` 按 y 轴旋转角动态选轮廓点 | FLAME_PyTorch README 与 `flame.py` | 一致 |
| 29 | 3DDFA_V2：ECCV 2020 标题、1.35ms/张 CPU、MobileNet x0.5 0.5ms（4 线程）、38,365 点、UV / pose / depth、>90° 或运动过快会失败 | 3DDFA_V2 readme | 一致 |
| 30 | Deep3DFaceRecon：BFM09、Guo et al. 表情基、257 维系数、68 点检测器 | 该 README | 一致 |
| 31 | GPUPixel：`MarsFaceLandmarker` + `RunningMode::VIDEO`、像素坐标除宽高、“only support one face”但遍历全部结果；`facePoints[106 * 2]`、9 对瘦脸索引、curveWarp / enlargeEye 公式、半径 ×5、先瘦脸后大眼；BeautyFace 组（BoxBlur radius 4、texelSpacing 4）、BoxDifference delta 7.07、BeautyFaceUnit 门控 / θ=0.1 / 3×3 锐化权重 / levels 常数 / 4 张 LUT；makeup 混合 0/15/17/22、`DoRender` 固定 15；lipstick `FrameBounds{502.5, 710, 262.5, 167.5}`；Apache-2.0、C++11 + OpenGL/ES、五平台 | GPUPixel 各源文件与 README | 一致（参数范围见下方更正） |
| 32 | GEGL warp：`MAX(size*spacing, 0.5)`、`exponent = 0.4/(1−hardness)`、gauss 查表、`influence = strength * stamp_force`、grow 取负号、各行为枚举 | `warp.cc` | 一致 |
| 33 | MLS：Schaefer / McPhail / Warren SIGGRAPH 2006；Jarvis73 支持 affine / similarity / rigid，NumPy 2000×2000 用时 30–69s，PyTorch+CUDA rigid 1000×1000 0.663s | Jarvis73 与 rust_mls README | 一致 |
| 34 | GPUImageBilateralFilter：中心 0.18、外圈 0.05、颜色权重公式、默认 factor 8.0 | `GPUImageBilateralFilter.m` | 一致 |
| 35 | YCbCr 区间 77–127 / 133–173 与 BT.601 系数；OpenLightRoom 有羽化 | `skin-detection.js`、`skin_mask.py` | 一致（卷期页码未核实） |
| 36 | W3C 混合公式：HardLight / Overlay / SoftLight 的 D(Cb)、带 alpha 的 `(1 − αb)·Cs + αb·B` | `compositing-1/Overview.bs` | 一致 |
| 37 | FaceMorph：`getAffineTransform` + `warpAffine`、`fillConvexPoly(…, 16, 0)`、读 `tri.txt` | `faceMorph.py` | 一致 |

### 更正（原稿有误，已改）

1. §2.5：原稿把“人脸检测模型效果更好，能检测更小的人脸”同时归给 `BEF_DETECT_MODE_IMAGE` 和 `IMAGE_SLOW`。头文件中这句注释**只属于** `BEF_DETECT_MODE_IMAGE_SLOW`。已拆开写。
2. §7.2：原稿称“EffectLab 实现如下”并给出分母含 |m−c|² 的公式，同时声称“x = m 时系数为 1、源点为 c”。实际上 EffectLab 源码的 `dis_m_c` 算的是 |x−m|，分母是 r² − |x−c|² + |x−m|²。“x = m → 源点 c”只对这一写法成立，对原稿写出的经典公式不成立。已把两种写法并列给出并说明。
3. §7.3：原稿称“`SetFaceSlimLevel` 文档为 [-1, 1]”。实际上头文件没写范围；`.cc` 中 thin_face 和 big_eye 两个属性的描述都是复制来的 “The smoothing of filter with range between -1 and 1”。已改写。
4. §8.2：OpenCV 原文是 “**eps²** is similar to the sigma in the color space…”，原稿写成了 eps。已更正。
5. §3.5：原稿称 mask 是“基于关键点的分割 mask”，头文件没有这个说法。已改为中性描述，并补充 256×256 的尺寸。
6. 参考来源：1€ filter 主页从未出现在所引页面中的 `cristal.univ-lille.fr/~casiez/1euro/`，替换为作者 README 给出的 `https://gery.casiez.net/1euro/`。

### 补充（核查中顺带确认的一手信息）

- §2.2：SCRFD README 在 VGA 尺度下给出的 RetinaFace-R50 为 94.92 / 91.90 / 64.17，与 RetinaFace README 的 90.4 (Hard) 测试条件不同。
- §2.3：SCRFD 论文标题与作者已由 InsightFace 主 README 的 BibTeX 确认，去掉了“据作者记忆”。
- §2.5：`BEF_DETECT_LARGE_MODEL`“现已废弃”、`BEF_DETECT_FACE_240_DETECT_FASTMODE`、`BEF_FACE_PARAM_MIN_DETECT_LEVEL`（视频强制 4、图片可设 8、范围 4～10）。
- §3.5：`TT_MOBILE_FACE_240_DETECT` = 不含虹膜的二级点（106 + 44 + 26 + 64 = 240）；虹膜由 `AI_IRIS_EXTRA_DETECT` 单独控制。这部分回答了“未能确认”第 1 条里“240 点”的含义（点位示意图仍缺）。
- §12.2：模型分档一行补充 LARGE_MODEL 已废弃的说明。

### 标为（未能核实）

- §3.2 LAB 的“商汤”单位；§3.3 JD-106 的“京东 AI”单位；§3.6 “Face++ 也是 106 / 中文美颜 SDK 事实标准”；§7.1 Gustafsson 的“硕士论文、1993”；§7.8 “Gustafsson 论文中也有 local rotation”；§8.6 Chai & Ngan 的卷期页码 “IEEE TCSVT 9(4) 551–564”。

### 未删除任何断言

被核对的 URL 都返回 HTTP 200，没有发现杜撰的仓库、文件或 API 名。github.com 的 tree 目录页因代理 403 无法直接打开，但其下引用的具体文件均可访问，所以保留。`CainCamera/README.md` 列在参考来源里，正文没有引用（链接本身有效），也保留。

### 本次没有覆盖、仍待后续核查的内容

- 所有 arXiv 论文的 PDF 正文（arxiv.org 无法解析），包括 BlazeFace 的 blending 动机、MLS / 导向滤波公式的原文写法。
- 火山引擎 / BytePlus 官网文档，以及剪映 / CapCut 是否使用同一套 SDK（依赖 `research_effects.md`，本次未核）。
- `research_effects.md` 中关于 `clear` =“清晰”的 BytePlus 文档出处。
