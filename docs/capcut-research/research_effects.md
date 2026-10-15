# CapCut / 剪映：特效、人脸特效、美颜、人脸检测与关键点、面部重塑：公开资料研究笔记

> 用途：学习与架构研究。只使用公开来源：官方 SDK 文档、官方 GitHub 仓库与 Demo、Effect House 公开文档、职位描述、媒体报道、第三方开源集成代码、公开学术资料。
> 编写日期：2026-10-15

---

## 0. 方法、可信度标记与限制

### 0.1 可信度标记

| 标记 | 含义 |
|---|---|
| **[官方-代码]** | 字节跳动 / 火山引擎 / BytePlus 官方 GitHub 仓库中的头文件、Demo 或资源，作者已直接读取原文 |
| **[官方-文档]** | 火山引擎、BytePlus 或 Effect House 官方文档（多数通过搜索摘要获得，原因见 0.3） |
| **[第三方集成]** | Agora、七牛等厂商公开的 ByteDance SDK 集成代码。这类代码直接调用官方 SDK，可信度高，但不是字节官方发布 |
| **[公开镜像-非官方]** | 第三方在 GitHub 上传的已安装 CapCut 桌面版资源文件。作者只看了文件名和明文配置，没有解密，也没有使用反编译代码 |
| **[媒体]** | 新闻报道、职位描述 |
| **[推断]** | 作者根据上面的证据推理得出，没有官方确认 |
| **[通用知识]** | 业界常用算法背景，**不代表**字节跳动已确认采用 |

### 0.2 核心判断：为什么 BytePlus / 火山引擎的 Effects SDK 可以作为研究 CapCut 的代理

- BytePlus 官方文档写明：VE SDK（Video Editor SDK）是字节跳动自研的媒体处理 SDK，内部用于 TikTok、抖音、CapCut 等产品。它与 BytePlus Effects SDK 搭配，提供人脸、人体、背景分割贴纸和美颜等能力。
  - 来源：[官方-文档] https://docs.byteplus.com/byteplus-video-editor-sdk/docs/product-overview
- 火山引擎宣称向企业开放“抖音同款特效”。特效的人脸关键点检测在本地完成，检测数据不上传。
  - 来源：[媒体] https://www.nbd.com.cn/articles/2021-07-28/1857027.html ，https://tech.ifeng.com/c/88FMOFFWtji
- 量子位 2021 年报道：抖音自研了面向短视频和 AR 的轻量级渲染引擎，没有采用 Unity 或虚幻。内部生产工具与 SDK 底层是同一套引擎。
  - 来源：[媒体] https://www.qbitai.com/2021/08/27072.html ，https://www.qbitai.com/2021/06/25097.html
- TikTok 的职位描述写到：“We own the Effect SDK powering TikTok's camera and creation experience”，“self-developed rendering engine”，链路为 camera → effect → render → encode，要求 C/C++ 以及 OpenGL ES / Metal / Vulkan。
  - 来源：[媒体] https://lifeattiktok.com/search/7628834530694416693 ，https://www.dice.com/job-detail/ea991445-eebc-48e0-9a01-8f1553b6dd92 ，https://www.themuse.com/jobs/tiktok/senior-software-engineer-cc-sdk-performance-optimization
- 本次发现的最强一致性证据有两条：
  - 公开镜像中 CapCut 桌面版的美颜资源包，与 Effect House 导出的公开项目使用**完全相同**的算法图配置 schema（`algorithmConfig.json`，含 `blit`、`face`、`nh_face_align`、`script` 节点）和相同的 `AmazingFeature` 运行时，详见第 9、10 节。
  - Effect House 的 Face Info 节点输出 106 个关键点，与 SDK 中的 `bef_ai_face_106` 一致。

### 0.3 本次研究的工具限制

- 本环境的 WebFetch 无法解析 `docs.byteplus.com`、`www.volcengine.com`、`effecthouse.tiktok.com`、`arxiv.org` 等域名（DNS 失败）。
- 这些文档的内容来自 WebSearch 返回的摘要。凡写“搜索摘要”的条目，都建议回到原页面核对。
- `github.com` 和 `raw.githubusercontent.com` 可以访问，所以头文件、Demo 代码和资源目录都是逐字读取的。

---

## 1. 总体技术栈：已确认部分与推断部分

```
┌───────────────────────────── CapCut / 剪映 App (移动 & 桌面) ─────────────────────────────┐
│  UI / 业务层（美颜美体面板、单人/全局模式、模板“剪同款”、调节 Adjust…）                       │
│        │                                                                                   │
│  NLE 数据模型 (NLEPlatform) ──► VE SDK (TTVideoEditor: 录制/编辑/导出/时间线渲染)            │
│        │                              │  RENDER_MSG_TYPE_GENERAL_AUDIO / VE_AUDIO 互发消息   │
│        ▼                              ▼                                                    │
│  ┌──────────────────── EffectSDK (libeffect-sdk / effect-sdk.framework) ─────────────────┐ │
│  │ C API: bef_effect_ai_*  (create/check_license/init/composer/process_texture …)         │ │
│  │                                                                                        │ │
│  │  渲染/特效运行时 "Amazing"（Amaz 命名空间, AmazingManager, APJS/TS, Lua, JSC/V8）        │ │
│  │   ├─ Scene/ECS: main.scene(Entity) + Systems(Transform/Camera/MeshRenderer/Behavior/Event)│ │
│  │   ├─ Material/xshader → shaderGLES / shaderMetal / shaderVulkan / shaderHLSL5           │ │
│  │   └─ Feature 类型: FaceBeauty / FaceDeformation(FaceDistortionV2, FaceStretch) /        │ │
│  │                   FaceMakeupV2 / Filter / 2DStickerV3 / GeneralEffect / 3D Sticker …    │ │
│  │                                                                                        │ │
│  │  算法框架 "Bach" 图 (algorithmConfig.json: nodes+links) + smash 算法库                  │ │
│  │   ├─ face(106/240/280) / face_align / freid / hand / skeleton / matting / hair / sky …  │ │
│  │   └─ 推理: Espresso / mobilecv (错误码可见) / ByteNN(?) ; 模型变体 _coreml/_ocl/_gpucpu/npu│ │
│  └────────────────────────────────────────────────────────────────────────────────────────┘ │
│  Lens 画质引擎 (CVLensEngine: 超分/插帧/夜景/HDR/去闪烁/防抖/一键增强…)                     │
└────────────────────────────────────────────────────────────────────────────────────────────┘
     ▲ 资源下发（素材包 = 目录 + 加密 config/lua/shader + 模型 + LUT 图）
     │ 创作工具: Effect House (TikTok, 公开) / 像塑(原“特效君”)+Effect Creator (抖音) / AmazingEditor(内部, 名称见配置)
```

各部件的证据：

- **EffectSDK、bef C API、错误码中的 SMASH / ESPRESSO / MOBILECV / BACH**：[官方-代码]，见第 2 节。
- **Amaz、APJS、AmazingManager**：[公开项目]，见第 9 节。
- **Bach 算法图**：错误码 `BEF_RESULT_BACH_E_INVALID_GRAPH`；CapCut 配置中有 `bALG_BACH_CONFIG`。
- **VE ↔ EffectSDK 消息**：`bef_effect_ai_message_define.h`。
- **NLEPlatform 依赖 TTVideoEditor**：[官方-代码] https://github.com/volcengine/volcengine-specs/blob/master/NLEPlatform/0.7.6/NLEPlatform.podspec
- **CVLensEngine**：[官方-代码] https://github.com/volcengine/VolcEngineRTC/blob/main/iOS/script/Depends/BytedEffectSDK/effect-sdk.framework/Headers/CVLensEngine.h
- 图中的整体分层关系属于 **[推断]**，但每个组件名都有上面列出的公开证据。

---

## 2. EffectSDK C API（`bef_effect_ai_*`）：[官方-代码]

### 2.1 主要来源

火山引擎官方 RTC 仓库附带了完整的 Effect SDK 头文件（iOS framework）：

- 目录：https://github.com/volcengine/VolcEngineRTC/tree/main/iOS/script/Depends/BytedEffectSDK/effect-sdk.framework/Headers
- 主头文件：https://github.com/volcengine/VolcEngineRTC/blob/main/iOS/script/Depends/BytedEffectSDK/effect-sdk.framework/Headers/bef_effect_ai_api.h

目录中头文件的完整清单如下。下面每一行就是 SDK 能力范围的一张清单。

| 前缀 | 头文件 |
|---|---|
| Lens | `CVLensEngine.h` |
| 画质增强 `bef_ai_image_quality_enhancement_*` | `adaptive_sharpen`, `cine_move`, `night_scene`, `onekey_enhance`, `photo_night_scene`, `public_define`, `taint_detect`, `vfi`(插帧), `vida`, `video_deflicker`, `video_hdr`, `video_sr`(超分), `video_stab`(防抖) |
| 算法与特效 `bef_effect_ai_*` | `3d_skeleton`, `action_recognition`, `api`, `avaboost`, `avatar_drive`, `bach_skeleton`, `c1`, `c2`(场景/物体分类), `car_detect`, `chroma_keying`, `dynamic_action`, `dynamic_gesture`, `error_code_format`, `face_attribute`, `face_clustering`, `face_detect`, `face_verify`, `facefitting`(3D 人脸网格), `foot`, `gaze_estimation`, `general_object`, `hairparser`, `hal_api`, `hand`, `headseg`, `human_distance`, `license_cake`, `license_wrapper`, `lightcls`, `log`, `message_define`, `object_tracking`, `online_license`, `pet_face`, `pixelformat_cvt`, `portrait_matting`, `public_define`, `qrcode_decode`, `saliency_matting`, `skeleton`, `skin_segmentation`, `skyseg`, `slam`, `student_id_ocr`, `version`, `video_cls`, `yuv_process` |

### 2.2 渲染句柄生命周期与调用顺序

依据为头文件，以及两份第三方集成代码：

- Agora `BEEffectManager.mm`：https://github.com/AgoraIO-Community/BeautyAPI/blob/main/iOS/BeautyAPI/ByteBeauty/BEEffectManager.mm
- BytePlus 官方 Android Demo：https://github.com/byteplus-sdk/effects-sdk-android-camera/blob/main/app/src/main/java/com/bytedance/labcv/demo/CameraFragment.java

```
[GL 线程, 有当前 EGL/EAGL context]
bef_effect_ai_create(&h)
bef_effect_ai_check_license(h, ".../LicenseBag.bundle/xxx.licbag")        // 移动端离线
   或 bef_effect_ai_check_online_license(h, path) / *_license_buffer(...)   // PC 在线
bef_effect_ai_set_render_api(h, bef_ai_render_api_gles20|gles30)         // 必须在 init 前
bef_effect_ai_use_builtin_sensor(h, true)
bef_effect_ai_init(h, w, h, ".../ModelResource.bundle", deviceName)       // (Android: *_with_assetmgr)
bef_effect_ai_use_pipeline_processor(h, bool)    // “并行框架”：算法在独立线程检测
bef_effect_ai_use_3buffer(h, bool)               // 并行框架下三缓冲，避免拷贝
bef_effect_ai_composer_set_mode(h, mode, 0)      // 0: A+B 槽区; 1: A+B+C 槽区 (“Composer 下沉”)
bef_effect_ai_composer_set_nodes(h, paths[], n)  // 设置“全部”生效素材（不记忆历史）
bef_effect_ai_composer_update_node(h, nodePath, key, value[0..1])

[每帧]
bef_effect_ai_set_width_height(h, w, h)
bef_effect_ai_set_orientation(h, BEF_AI_CLOCKWISE_ROTATE_x)   // 使人脸“正”所需的顺时针旋转
bef_effect_ai_set_camera_device_position(h, front/back)
bef_effect_ai_algorithm_texture(h, srcTex, ts)                // 跑检测等算法
   (或 *_algorithm_texture_with_buffer / *_algorithm_buffer)
bef_effect_ai_process_texture(h, srcTex, dstTex, ts)          // 渲染特效到 dstTex
   (或 bef_effect_ai_process_buffer(... RGBA/BGRA/NV12/NV21/YUV420P ...))
[可选] bef_effect_ai_get_face_detect_result / _get_face_seg_result / _get_hand_detect_result /
       _get_skeleton_detect_result / _get_face_attr_detect_result
bef_effect_ai_destroy(h)
```

对应的官方文档：

- 火山引擎《C接口快速接入指南》（搜索摘要）：https://www.volcengine.com/docs/6705/101966
  - SDK 只针对单帧做渲染，输入和输出都是纹理；
  - 所有函数都必须在 OpenGL 线程调用；
  - 授权未通过时句柄不可用；
  - 每帧先设宽高与方向，再调算法接口，最后 `process_texture`；
  - 输入与输出纹理宽高一致，且不能是同一张纹理；
  - `composer_set_nodes` 每次都要传入全部生效的素材；
  - 强度默认是 0。
- BytePlus C API 文档（搜索摘要）：https://docs.byteplus.com/en/effects/docs/c-api
  - 旧接口 `bef_effect_ai_set_beauty`、`bef_effect_ai_set_reshape_face` 等只适用于 2.6 及更早版本；
  - 2.7 起统一改用 composer。

### 2.3 完整函数分组（摘自 `bef_effect_ai_api.h`）

- **生命周期**：`bef_effect_ai_create`，`bef_effect_ai_destroy`，`bef_effect_ai_init`，`bef_effect_ai_init_with_assetmgr`，`bef_effect_ai_set_image_mode`，`bef_effect_available_features`，`bef_effect_ai_get_version`
- **环境与几何**：`bef_effect_ai_set_camera_device_position`，`bef_effect_ai_set_device_rotation(quaternion)`，`bef_effect_ai_set_width_height`，`bef_effect_ai_set_orientation`，`bef_effect_ai_set_render_api`，`bef_effect_ai_use_builtin_sensor`，`bef_effect_ai_ar_update_frame`（ARCore）
- **旧版美颜接口（2.6 及以前）**：`bef_effect_ai_set_beauty`，`bef_effect_ai_set_buildin_makeup`，`bef_effect_ai_set_reshape_face`，`bef_effect_ai_update_reshape_face`，`bef_effect_ai_update_reshape_face_intensity(eye, cheek)`，`bef_effect_ai_set_intensity(type, v)`
  - 强度类型：`BEF_INTENSITY_TYPE_BEAUTY_WHITEN=1`，`_BEAUTY_SMOOTH=2`，`_FACE_SHAPE=3`（大眼/瘦脸），`_BEAUTY_SHARP=9`，`_GLOBAL_FILTER_V2=12`，`_BUILDIN_LIP=17`，`_BUILDIN_BLUSHER=18`
- **滤镜**：`bef_effect_ai_set_color_filter_v2(path)`，`bef_effect_ai_switch_color_filter_v2(left, right, position)`（左右滑动切换滤镜）
- **贴纸**：`bef_effect_ai_set_effect(path)`，`bef_effect_ai_reset_sticker`，`bef_effect_ai_send_msg`，`bef_effect_ai_process_touch`，`bef_effect_ai_process_gesture`，`bef_effect_ai_set_render_cache_texture(key, path)`，`*_with_buffer`，`bef_effect_ai_get_captured_image_with_key`，`bef_effect_ai_release_captured_image`，`bef_effect_ai_load_resource_with_timeout`
- **Composer**：`bef_effect_ai_set_composer`，`bef_effect_ai_composer_set_nodes`，`*_set_nodes_with_tags`，`*_append_nodes`，`*_append_nodes_with_tags`，`*_remove_nodes`，`*_update_node(nodePath, nodeTag, value)`，`*_composer_set_mode(mode, orderType)`
  - 注释原文：`0: A槽区+B槽区模式（Composer Feature）, 1: A槽区+B槽区+C槽区模式（Composer下沉）`；`orderType 0: 按照zorder排序`
- **处理**：`bef_effect_ai_algorithm_texture`，`*_algorithm_texture_with_buffer`，`*_algorithm_buffer`，`bef_effect_ai_process_texture`，`bef_effect_ai_process_buffer`，`bef_effect_ai_process_buffer_with_face_info`（外部传入人脸结果）
- **并行**：`bef_effect_ai_use_pipeline_processor`，`bef_effect_ai_clean_pipeline_processor_task`，`bef_effect_ai_use_3buffer`
- **结果读取**：`bef_effect_ai_get_face_detect_result`，`bef_effect_ai_get_face_seg_result(mask_type)`，`bef_effect_ai_get_hand_detect_result`，`bef_effect_ai_get_skeleton_detect_result`，`bef_effect_ai_get_face_attr_detect_result`，`bef_effect_ai_set_algorithm_force_detect`，`bef_effect_ai_set_face_int_param`
- **授权**：`bef_effect_ai_check_license`（Android 上额外需要 `JNIEnv*` 和 `jobject context`），`*_check_license_buffer`，`*_check_online_license`，`*_check_online_license_buffer`，`*_check_license_function(funcType, ...)`，`*_check_license_base`
- **其他**：`bef_effect_ai_set_cache_directory`（模型缓存），`bef_effect_ai_set_log_callback`，`bef_effect_ai_set_log_level`

### 2.4 公共定义里能看出的内部组件名（`bef_effect_ai_public_define.h`）

- **像素格式**：`BEF_AI_PIX_FMT_RGBA8888`, `BGRA8888`, `BGR888`, `RGB888`, `GRAY8`, `YUV420P`, `NV12`, `NV21`
- **旋转**：`BEF_AI_CLOCKWISE_ROTATE_0/90/180/270`。注释原文为“图像需要顺时针旋转 X 度，使图像中的人脸为正”。
- **错误码暴露的内部模块（重要）**：
  - `BEF_RESULT_SMASH_E_*`（-101 至 -113）：算法库代号 **smash**。
  - `BEF_RESULT_SMASH_E_ESPRESSO = -105`（“ESPRESSO错误”）和 `BEF_RESULT_SMASH_E_MOBILECV = -106`：推理框架代号 **Espresso**，图像库代号 **mobilecv**。
  - `BEF_RESULT_BACH_E_INVALID_GRAPH / _INVALID_NODE / _INVALID_RES_FINDER …`（-153 至 -161）：“Bach算法模块”，是一个**基于图（Graph）与节点（Node）的算法编排框架**。
  - `BEF_RESULT_GL_ERROR_OCCUR -150`：注释为“请检查是否在opengl线程调用接口”。
  - `bef_effect_ai_process_texture` 的注释写的是 `return IES_RESULT_SUC ... bef_effect_base_define.h`，带有内部前缀 IES。
  - 授权相关错误码 -114 至 -129：包含 License 过期、包名不匹配、未授权功能等。
- **License 功能枚举 `bef_ai_license_function_type`**：`BEF_EFFECT, BEF_FACE, BEF_C1, BEF_C2, …, BEF_PORTRAIT_MATTING, BEF_VIDEO_SR, BEF_NIGHT_SCENE, BEF_SKIN_SEGMENTATION, BEF_SLAM, BEF_FACEFITTING, BEF_CINE_MOVE, BEF_OBJECT_TRACKING, BEF_VIDEO_HDR_LITE, BEF_VIDEO_STAB …`。由此可见 License 是**按功能逐项授权**的。
- **贴纸与客户端的消息 ID**：`BEF_EFFECT_MESSAGE_TRIGGER_CAPUTURE_IMAGE 2200` 等。
- **常量**：`ALGORITHM_DETECT_MIN_SIZE 720`，`EFFECT_HAND_DETECT_DELAY_FRAME_COUNT 4`。

### 2.5 消息总线（`bef_effect_ai_message_define.h`）

- 包含 `RENDER_MSG_TYPE_RESOURCE / _EFFECT / _ALGORITHM_CHANGE / _FACE_INFO / _STICKER_LOCATION / _ARSCAN* / _VRBRUSH* / _MEMOJI* / _GAME_*` 等消息类型。
- 两条值得注意的注释：`RENDER_MSG_TYPE_GENERAL_AUDIO 0x3A // sdk --> VE` 和 `RENDER_MSG_TYPE_VE_AUDIO 0x3B // VE --> sdk`。
- 这说明 Effect SDK 被设计为嵌入 **VE（Video Editor）SDK** 内运行，两者互发消息。这正是剪映、CapCut 的编辑引擎形态。
- 来源：[官方-代码] 与 2.1 相同的 Headers 目录。

### 2.6 RTC 封装层（`IVideoEffect`）：[官方-代码]

- 头文件：https://github.com/volcengine/VolcEngineRTC/blob/main/Windows/3rd/Windows/VolcEngineRTC/include/rtc/bytertc_video_effect_interface.h
- 接口：`initCVResource(license_file_path, algo_model_dir)`，`enableVideoEffect()`，`setEffectNodes(paths, n)`，`appendEffectNodes`，`removeEffectNodes`，`updateEffectNode(path, key, value[0,1])`，`setColorFilter(res_path)`，`setColorFilterIntensity`，`enableVirtualBackground(sticker_path, source)`，`setVideoEffectExpressionDetect`，`IFaceDetectionObserver::onFaceDetectResult / onExpressionDetectResult`，`getAuthMessage`（PC 在线授权）。
- 注释写明：鉴权会比对 CV 服务端时间与本地时间。
- Android Demo（`ByteBeautyActivity.java`）：https://github.com/volcengine/VolcEngineRTC/blob/main/Android/APIExample/app/src/main/java/rtc/volcengine/apiexample/examples/ThirdBeauty/byteBeauty/ByteBeautyActivity.java
  - 初始化时执行 `setEffectNodes([beautyPath, reshapePath])`；
  - 滑杆回调到 `updateEffectNode(beautyPath|reshapePath, key, value)`；
  - 选择贴纸时**重新 set 全量列表**，即 beauty、reshape、sticker 三项一起传入。

### 2.7 其他子 API（[官方-代码]，同一 Headers 目录）

**人脸检测 `bef_effect_ai_face_detect.h`**（详见第 5 节）
- `bef_effect_ai_face_detect_create(config, modelPath, &h)`，`bef_effect_ai_face_detect(...)`，`bef_effect_ai_face_detect_setparam`，`bef_effect_ai_face_detect_add_extra_model(h, TT_MOBILE_FACE_280_DETECT, path)`，`bef_effect_ai_face_mask_detect`

**3D 人脸 `bef_effect_ai_facefitting.h`**
- `bef_effect_ai_facefitting_create/init/set_param`，`bef_effect_ai_do_fitting_3dmesh`

**人像抠图 `bef_effect_ai_portrait_matting.h`**
- 有 `BEF_MP_LARGE_MODEL` 和 `BEF_MP_SMALL_MODEL` 两档模型。
- `BEF_MP_OutputMinSideLen` 默认值为 **128**，并且必须是 16 的倍数。也就是说 alpha 是低分辨率掩码，由调用方上采样。
- 参数还有 `BEF_MP_EdgeMode` 和 `BEF_MP_FrashEvery`。

**手部 `bef_effect_ai_hand.h`**
- `BEF_HAND_KEY_POINT_NUM 22`，另有 `_EXTENSION 2`。
- 48 类静态手势（`BEF_TT_HAND_GESTURE_*`，包含火影结印），另有序列动作，如 PUNCHING、CLAPPING。
- 模型分层：`DETECT | BOX_REG | GESTURE_CLS …`，对应 `tt_hand_det`、`tt_hand_box_reg`、`tt_hand_gesture`、`tt_hand_kp`、`tt_hand_seg`、`tt_hand_kp3d`、`tt_hand_lr`、`tt_hand_ring`。
- 参数含 `BEF_HAND_ALGO_LOW_POWER_MODE`、`BEF_HAND_ALGO_AUTO_MODE`、`BEF_HAND_ALGO_TIME_ELAPSED_THRESHOLD`（默认 20ms）。SDK 会运行时测速，并据此自动降级。

**其他算法**
- 骨骼 `bef_effect_ai_skeleton.h`：`BEF_AI_MAX_SKELETON_POINT_NUM 18`，最多 2 人。
- 皮肤分割 `bef_effect_ai_skin_segmentation.h`：默认模型 key 为 `tt_skin_seg`；`BEF_AI_SKIN_SEG_IS_NEED_FACE` 表示加载人脸模型来排除五官。
- 头部分割 `bef_effect_ai_headseg.h`：基于 106 点。
- 头发 `hairparser`，天空 `skyseg`。

**License 包装 `bef_effect_ai_license_wrapper.h`**
- `EffectsSDK::LicenseProvider` 支持三种模式：`OFFLINE`、`ONLINE`、`ACCOUNT`。
- 可注入 `HttpRequestProvider`。参数包括 `url`、`key`、`secret`、`ticket`、`deviceId`、`licensePath`。

**在线授权 `bef_effect_ai_online_license.h`**
- `bef_effect_ai_get_online_license_auth_msg`，`bef_effect_ai_get_device_id`

**HAL `bef_effect_ai_hal_api.h`**
- `bef_effect_ai_hal_init(model_path, license_path, type, …)`，`bef_effect_ai_hal_process(...)`，以及 `hal_composer_*`。
- 这是面向硬件或厂商的 buffer 接口版本。[推断] 可能用于手机 OEM 或摄像头 HAL 集成。

---

## 3. 资源包（素材 Bundle）结构

### 3.1 顶层布局

| Bundle | 内容 | 来源 |
|---|---|---|
| `LicenseBag.bundle/*.licbag` | 授权文件，绑定包名（ApplicationID/BundleID）和有效期 | [第三方集成] https://github.com/AgoraIO-Community/BeautyAPI/blob/main/Android/README.zh.md ；[官方-文档] https://www.volcengine.com/docs/6705/101956 |
| `ModelResource.bundle/` | 算法模型 | [官方-代码] https://github.com/volcengine/VolcEngineRTC/tree/main/Android/APIExample/app/src/main/assets/cvlab/ModelResource.bundle |
| `ComposeMakeup.bundle/ComposeMakeup/` | 美颜、微整形、美体、美妆（composer 节点） | [官方-代码] 同一仓库的 `cvlab/ComposeMakeup.bundle` |
| `FilterResource.bundle/Filter/Filter_xx_yy/` | 滤镜 | 同上 |
| `StickerResource.bundle/stickers/<name>/` | 贴纸 / 道具 | 同上 |

七牛的集成文档给出了较完整的目录树（[第三方集成]）：https://github.com/pili-engineering/PLShortVideoKit-ByteDance/blob/master/Document/PLShortVideoKit-ByteDance.md

```
ComposeMakeup.bundle/ComposeMakeup/
  beauty_4Items  beauty_Android_live  beauty_IOS_live  blush  body  composer
  eyebrow  eyeshadow  facial  hair  lip  pupil  reshape_live
FilterResource.bundle/Filter/***
LicenseBag.bundle/***.licbag
ModelResource.bundle/
  animoji ar_scan catmodel hairparser handmodel mattingmodel skeleton_model
  ttfaceattrmodel ttfacemodel ttfaceverify ttpetface
StickerResource.bundle/stickers/***
```

火山引擎《素材包结构说明(v4.2.1及以上)》（搜索摘要）：https://volcengine.com/docs/6705/102039

- 大部分素材都放在 `ComposeMakeup.bundle` 中，包括美颜、微整形、美体、美妆。
- `beauty_Android_lite` 和 `beauty_IOS_lite` 提供美白、磨皮、锐化；“清晰”是后来加入的。
- `reshape_v8_lite` 包含脸、眼、鼻、嘴的大部分小项。4.7.0 起又加入了瘦脸、小脸、窄脸、小头、V 脸。
- 4.7.0 还新增了 `beauty_Android_rosy_lite`（红润）、`reshape_forehead`（发际线）、`body/allslim_prev`。
- 路径**必须指到** `.../ComposeMakeup.bundle/ComposeMakeup/beauty_Android_lite` 这一层。
- 4.7.2 的“分级素材包”共 9 个：https://www.volcengine.com/docs/6705/1719096

### 3.2 已读取的 ModelResource 模型文件名

来源：[官方-代码] 在 GitHub 上逐目录浏览，根目录为 https://github.com/volcengine/VolcEngineRTC/tree/main/Android/APIExample/app/src/main/assets/cvlab/ModelResource.bundle/

| 目录 | 文件 |
|---|---|
| `ttfacemodel/` | `tt_face_v11.1.model`（106 点主模型），`tt_face_extra_v14.0.model`（240/280 二级关键点） |
| `ttfaceattrmodel/` | `tt_face_attribute_v8.0.model`，`tt_face_attribute_tob_v7.0.model`，`tt_face_attribute_age_v2.0.model`，`tt_face_attribute_exp_v1.0.model`，`tt_face_attribute_extra_v3.0.model`，`tt_face_beauty_v5.0.model`，`tt_beauty_attr6_v2.0.model` |
| `handmodel/` | `tt_hand_det_v11.0`，`tt_hand_box_reg_v12.0`，`tt_hand_gesture_v11.0`，`tt_hand_gesture_tob_v11.2`，`tt_hand_kp_v6.0`，`tt_hand_kp3d_v2.0`，`tt_hand_lr_v3.1`，`tt_hand_ring_v1.1`，`tt_hand_seg_v2.0`（均为 `.model`） |
| `mattingmodel/` | `tt_matting_v15.0.model`，`tt_matting_large_v3.0.model`，`tt_matting_oproj_v1.0_nomal.model`，**`tt_matting_oproj_v1.0_coreml.model`** |
| `mangamodel/` | `ap_manga_v1.0.model`，`ap_hmangakone_v1.5.model`，`ap_pixmangarDouble_v1.1.model`（漫画脸，基于 GAN 的道具） |
| `avatar_drive/` | `tt_avatar_drive_v1.0.model` |

模型命名有三个规律：

- 统一使用 `tt_<任务>_<变体>_v<主.次>.model`。
- 存在**同一个模型的多后端变体**，例如 `_coreml` 和 `_nomal`。这说明 iOS 上有 CoreML 后端。
- 有 `_tob` 版本，即面向 B 端客户的版本。

### 3.3 美颜素材包内部结构

示例为 `ComposeMakeup/beauty_Android_lite/`。来源：[官方-代码] https://github.com/volcengine/VolcEngineRTC/tree/main/Android/APIExample/app/src/main/assets/cvlab/ComposeMakeup.bundle/ComposeMakeup/beauty_Android_lite

```
beauty_Android_lite/
├── .config_file                  ← 明文: ["sharp", "clear", "smooth", "whiten"]   (该包可调 key 列表)
├── config.json                   ← 加密 (文件头 "&^#.enc")
├── event.lua                     ← 加密, Lua 事件脚本
├── FaceAlgorithmModule.lua       ← 加密, Lua: 声明/驱动所需人脸算法
└── GeneralEffect_smooth_whiten/
    ├── content.json              ← 加密
    └── generalEffect/
        ├── generalEffect.json    ← 加密 (渲染 pass 图)
        ├── shader/               ← 全部加密
        │   ├── Beauty.vert / Beauty.frag
        │   ├── vshader_boxblur.vs / fshader_boxblur.fs
        │   ├── fshader_alpha_boxblur.fs
        │   ├── fshader_var.fs                      ← "var" = 方差?
        │   ├── vshader_epm.vs / fshader_epm.fs     ← "epm" = edge-preserving ?
        │   └── contrast_enhance.vert / .frag
        └── resource/
            ├── faceMask.png          (350×550 RGB, 已查看: 标准正脸模板, R=皮肤/脸区域(含颈, 软边),
            │                          B=眼/眉/鼻孔/唇区域 → 磨皮保护区)
            ├── foundation_filter.png (512×512 RGBA, 已查看: 8×8 拼块的 64³ 3D LUT → “粉底/美白”调色)
            ├── contrast_max.png      (289×17 = 17 个 17×17 拼块 → 17³ LUT)
            └── contrast_min.png      (同上)
```

- 作者没有尝试解密任何 `&^#.enc` 文件。上面的分析只依据文件名、图像尺寸和图像目视。
- `reshape_lite/` 的结构如下：
  - `.config_file`（明文 key 列表，见第 4 节）；
  - `config.json`、`event.lua`、`FaceAlgorithmModule.lua`（加密）；
  - 子目录 `GE_Mesh_SmallHead/`（`generalEffect/` + `content.json`）；
  - 子目录 `distortionFaceu_test/`（`content.json`、`represent_Plasticine.txt`、`represent_Plasticine_organs.txt`）。
  - 来源：https://github.com/volcengine/VolcEngineRTC/tree/main/Android/APIExample/app/src/main/assets/cvlab/ComposeMakeup.bundle/ComposeMakeup/reshape_lite

### 3.4 滤镜素材

- 目录为 `FilterResource.bundle/Filter/Filter_06_03/`，内含 `config.json`（加密）和 `filter/filter.png`。
- 作者解码了 `filter.png`：512×512 的 RGB 图，按 8×8 拼块排列，每块 64×64，即**标准的 GPUImage 式 64³ 3D LUT**。
  - 像素 (63,0) 为 R=255，(0,63) 为 G=255，(448,448) 为 B=255；
  - 黑位被抬高到 (1,1,4)，这正是“蜜桃”滤镜的调色。
- 来源：[官方-代码] https://github.com/volcengine/VolcEngineRTC/tree/main/Android/APIExample/app/src/main/assets/cvlab/FilterResource.bundle/Filter/Filter_06_03/filter
- 滤镜 ID 示例：`Filter_02_14`（奶油），`Filter_06_03`（蜜桃），`Filter_37_L5`（清透），`Filter_35_L3`（夜色），`Filter_30_Po8`（冷氧），`Filter_38_F1`（自然）……
  - 来源：[官方-代码] BytePlus VideoOne 的 https://github.com/byteplus-sdk/VideoOneSolutions/blob/main/Client/Android/component/effectkit/src/main/kotlin/com/vertcdemo/effect/utils/EffectDataConfig.kt

### 3.5 贴纸 / 道具素材（“Feature 组合”格式）

这是 [官方-代码] 的目录浏览结果，根目录为 https://github.com/volcengine/VolcEngineRTC/tree/main/Android/APIExample/app/src/main/assets/cvlab/StickerResource.bundle/stickers

```
stickers/manhualian/            (漫画脸)
├── config.json   (加密)  ← 特效清单/层级
├── event.lua     (加密)  ← 逻辑脚本
├── trigger.json  (加密)  ← 触发器 (张嘴/眨眼/手势…)
├── 2DStickerV3_2995/  2DStickerV3_5098/
├── FaceDistortionV2_5099/        ← 人脸变形
├── FaceMakeupV2_2994/  FaceMakeupV2_2999/   ← 人脸妆容贴图
├── FaceStretch_5100/             ← 关键点拉伸
├── Filter_2993/  Filter_2998/
└── GeneralEffect_2996/           ← 通用多 pass shader 效果
stickers/meihouwang/  → 2DStickerV3_*, FaceMakeupV2_*, Filter_*, config/event/trigger
stickers/animoji_keaizhu/ → ESScene3DStickerModel/ + config.json   (3D 场景贴纸)
stickers/matting_bg/  → GE/ + config.json + event.lua               (抠图背景)
```

由此可得：

- 一个“道具”由若干**带类型和编号的 Feature** 组合而成，例如 `FaceMakeupV2`、`FaceDistortionV2`、`FaceStretch`、`2DStickerV3`、`GeneralEffect`、`Filter`、`ESScene3DStickerModel`。
- 道具由 Lua 脚本和 trigger 驱动。
- 第 10 节中 CapCut 配置里的 `exclusiveScene` 键 `FaceMakeup*`、`Filter*`、`FaceDeformation*`、`FaceBeauty*`，与这些 Feature 类型名一一对应。（对应关系为 [推断]，命名一致性为事实。）

---

## 4. Composer 节点与 key：美颜、微整形、美妆、美体

### 4.1 用法

- C 层：`bef_effect_ai_composer_update_node(handle, "<节点路径>", "<key>", value)`
- Java / OC 封装：`updateComposerNodeIntensity(path, key, value)`

示例代码：

- BytePlus 官方 Android Demo：
  ```java
  mEffectManager.setComposeNodes(new String[]{"lip/lite/fuguhong"});
  mEffectManager.updateComposerNodeIntensity("lip/lite/fuguhong", "Internal_Makeup_Lips", 0.8f);
  mEffectManager.setSticker("stickers/ar/glasses_0");
  mEffectManager.setFilter("Filter_02_14"); mEffectManager.updateFilterIntensity(0.8f);
  ```
  来源：[官方-代码] https://github.com/byteplus-sdk/effects-sdk-android-camera/blob/main/app/src/main/java/com/bytedance/labcv/demo/CameraFragment.java
- Agora iOS：
  ```objc
  [effectManager updateComposerNodeIntensity:@"/beauty_IOS_lite" key:@"smooth" intensity:..];
  [effectManager updateComposerNodeIntensity:@"/reshape_lite" key:@"Internal_Deform_Overall" intensity:..];
  ```
  来源：[第三方集成] https://github.com/AgoraIO-Community/BeautyAPI/blob/main/iOS/BeautyAPI/BeautyAPI/Render/BytesRender/BytesBeautyRender.m

### 4.2 key 对照表

依据为官方仓库的 `.config_file` 和七牛 `ResourceTool.py` 中的 `key_name_dict`。

| 节点 / 素材 | key | 中文 | 来源 |
|---|---|---|---|
| `beauty_*_lite` | `smooth` | 磨皮 | [官方-代码] `.config_file` |
| | `whiten` | 美白 | 同上 |
| | `sharp` | 锐化 | 同上 |
| | `clear` | 清晰 | 同上 |
| `beauty_*_rosy_lite` | `rosy` | 美白-红润 | [官方] https://github.com/byteplus-sdk/BPLive_SPM（strings 文件） |
| `beauty_4Items` | `BEF_BEAUTY_BRIGHTEN_EYE` | 亮眼 | [第三方集成] https://github.com/pili-engineering/PLMediaStreamingKit-ByteDance/blob/master/Document/ResourceTools/ResourceTool.py |
| | `BEF_BEAUTY_WHITEN_TEETH` | 白牙 | 同上 |
| | `BEF_BEAUTY_REMOVE_POUCH` | 黑眼圈 | 同上 |
| | `BEF_BEAUTY_SMILES_FOLDS` | 法令纹 | 同上 |
| `reshape_lite` / `reshape_live` / `reshape_v8_lite` | `Internal_Deform_Overall` | 瘦脸（v4.2.1 文档称“下脸宽度”） | `.config_file` + ResourceTool.py |
| | `Internal_Deform_CutFace` | 窄脸 | 同上 |
| | `Internal_Deform_Face` | 小脸 | 同上 |
| | `Internal_Deform_Eye` | 大眼 | 同上 |
| | `Internal_Deform_RotateEye` | 眼角度 | 同上 |
| | `Internal_Eye_Spacing` | 眼距 | 同上 |
| | `Internal_Deform_Eye_Move` | 眼移动 | 同上 |
| | `Internal_Deform_Zoom_Cheekbone` | 瘦颧骨 | 同上 |
| | `Internal_Deform_Zoom_Jawbone` | 下颌骨 | 同上 |
| | `Internal_Deform_Nose` | 瘦鼻 | 同上 |
| | `Internal_Deform_MovNose` | 长鼻 | 同上 |
| | `Internal_Deform_Chin` | 下巴（双向） | 同上 |
| | `Internal_Deform_Forehead` | 额头 / 发际线（双向） | 同上 |
| | `Internal_Deform_ZoomMouth` | 嘴型 | 同上 |
| | `Internal_Deform_MouthCorner` | 微笑 | 同上 |
| | `Internal_Deform_MovMouth` | 缩人中 | 同上 |
| | `BEF_BEAUTY_BODY_SHRINK_HEAD` | 小头 | 同上 |
| `reshape_v8_lite`（4.7.1 起） | `Face_ALL_boy`、`Face_ALL_girl`、`Face_ALL_nature` | 帅气 / 美丽 / 自然瘦脸预设 | [官方-文档] https://docs.byteplus.com/docs/effects/Beauty-and-Face-Shaping-Mapping-v471-and-later ；https://www.volcengine.com/docs/6705/1521678 |
| `lip/…` | `Internal_Makeup_Lips` | 口红 | ResourceTool.py；BytePlus Demo |
| `blush/…` | `Internal_Makeup_Blusher` | 腮红 | ResourceTool.py |
| `eyebrow/…` | `Internal_Makeup_Brow` | 眉毛 | 同上 |
| `eyeshadow/…` | `Internal_Makeup_Eye` | 眼影 | 同上 |
| `facial/…` | `Internal_Makeup_Facial` | 修容 | 同上 |
| `pupil/…` | `Internal_Makeup_Pupil` | 美瞳 | 同上 |
| `body/…` | `BEF_BEAUTY_BODY_THIN`、`BEF_BEAUTY_BODY_LONG_LEG` | 瘦身、长腿 | 同上 |

强度语义来自 [官方-文档] 的搜索摘要，见 https://www.volcengine.com/docs/6705/1521678 和 BytePlus v4.7.1 映射页：

- 取值范围 0 到 1。
- 单向项：0 表示无效果。
- 双向项：0.5 表示不变，0 到 0.5 为负向，0.5 到 1 为正向。例如下巴、额头。
- 部分素材自带默认强度。

素材在 Ebox（AI 特效平台）中的配置方式：https://www.volcengine.com/docs/6705/2137755

---

## 5. 人脸检测与关键点：[官方-代码] `bef_effect_ai_face_detect.h`

### 5.1 点位体系

**106 点 `bef_ai_face_106`**，字段如下：

| 字段 | 含义 |
|---|---|
| `rect` | 人脸框 |
| `score` | 置信度 |
| `points_array[106]` | 106 个关键点 |
| `visibility_array[106]` | 每个点的可见性；被遮挡为 0.0，未遮挡为 1.0 |
| `yaw` / `pitch` / `roll` | 头部姿态角 |
| `eye_dist` | 两眼间距 |
| `ID` | 跟踪 ID；人脸丢失后重新检测到会分配新 ID |
| `action` | 动作位标志 |
| `tracking_cnt` | 跟踪计数 |

**二级关键点 `bef_ai_face_ext_info`**，即 280 点模式：

| 部位 | 点数 |
|---|---|
| `eye_left` / `eye_right` | 各 22 |
| `eyebrow_left` / `eyebrow_right` | 各 13 |
| `lips` | 64 |
| `left_iris` / `right_iris` | 各 20 |

- 106 + 44 + 26 + 64 + 40 = **280**。去掉虹膜的 40 点即为 **240**。这与火山引擎的说法一致：280 点不含虹膜时为 240 点。
  - 来源：[官方-文档] https://docs.volcengine.com/docs/Intelligentbeautificationeffects/iOS?lang=zh
- 头文件注释写到：“现在改了二级策略，眉毛、眼睛、嘴巴关键点会在一个模型中出”。
- 由此可见这是**两级级联**：
  1. 一级 106 点模型（`tt_face_v*.model`）；
  2. 二级局部精细化模型（`tt_face_extra_v*.model`），通过 `bef_effect_ai_face_detect_add_extra_model(h, TT_MOBILE_FACE_280_DETECT, path)` 加载。

### 5.2 配置位

- **模型档位**：`BEF_DETECT_SMALL_MODEL`（106，更快）、`BEF_DETECT_LARGE_MODEL`（已废弃）、`BEF_DETECT_FACE_240_DETECT_FASTMODE`。
- **检测模式**：`BEF_DETECT_MODE_VIDEO`、`_VIDEO_SLOW`（能检测更小的脸）、`_IMAGE`、`_IMAGE_SLOW`。
- **动作检测**：`BEF_EYE_BLINK`、`BEF_MOUTH_AH`、`BEF_HEAD_YAW`、`BEF_HEAD_PITCH`、`BEF_BROW_JUMP`、`BEF_MOUTH_POUT`，以及 `BEF_DETECT_FULL=0x7F`；另有左右眼分别闭眼、`BEF_INDIAN_HEAD_ROLL` 等。
- **掩码**：`AI_MOUTH_MASK_DETECT`、`AI_TEETH_MASK_DETECT`、`AI_FACE_MASK_DETECT`。掩码结构 `bef_ai_face_mask_base` 包含：
  - `mask[256*256]`；
  - `warp_mat[6]`，即 2×3 仿射矩阵。

  这说明**掩码在对齐后的人脸裁剪空间中计算，再用仿射矩阵映射回原图**。这一点由结构体直接看出。嘴唇、牙齿、面部分割都依赖 280 点。
- **强制检测**：`TT_MOBILE_FORCE_DETECT`。

### 5.3 运行参数 `bef_face_detect_type`

| 参数 | 含义 |
|---|---|
| `BEF_FACE_PARAM_FACE_DETECT_INTERVAL` | 检测间隔。默认有脸时每 **24** 帧检测一次，无脸时每 8 帧检测一次。检测帧之间做**跟踪**，以节省 CPU |
| `BEF_FACE_PARAM_MAX_FACE_NUM` | 默认 5，上限 `BEF_MAX_FACE_NUM = 10` |
| `BEF_FACE_PARAM_MIN_DETECT_LEVEL` | 取值 4 到 10，值越大能检测越小的脸；视频模式固定为 4 |
| `BEF_FACE_PARAM_BASE_SMOOTH_LEVEL` / `_EXTRA_SMOOTH_LEVEL` | 取值 1 到 30，为关键点**去抖**强度 |
| `BEF_FACE_PARAM_MASK_SMOOTH_TYPE` | 嘴巴掩码去抖 |

### 5.4 性能与限制

来源：[官方-文档] 搜索摘要。

- 人脸检测耗时不到 2 ms（iPhone 7），内存不到 4 MB（OPPO R11）。
- 支持 yaw 和 pitch 在 ±90° 内；最多 10 张脸；输入短边至少 128 px。
- 页面：https://docs.byteplus.com/en/docs/effects/docs-portrait-sdk ，https://docs.volcengine.com/docs/Intelligentbeautificationeffects/Technicalspecifications?lang=zh
- 其他算法的耗时（均为 iPhone 7 或 OPPO R11）：
  - 人体分割不到 11 ms；
  - 骨骼不到 6 ms；
  - 手势不到 6 ms；
  - 3D face mesh 不到 5 ms、内存不到 42 MB。
  - 页面：https://www.volcengine.com/docs/6705/102020 ，https://docs.byteplus.com/en/docs/effects/docs-3d-face-mesh-algorithm
- 官方说明耗时主要取决于输入分辨率和开启功能的数量：https://www.volcengine.com/docs/6705/101955

### 5.5 3D 人脸拟合 `bef_effect_ai_facefitting.h`：[官方-代码]

**输入**
- 106 点（必选），可选 lv2 的眼、眉、唇、虹膜点；
- 视口尺寸；
- `cameraParams[3]`：焦距、cx、cy。

**输出 `bef_ai_facefitting_mesh_info`**

| 字段 | 含义 |
|---|---|
| `vertex` | 3D 顶点 |
| `landmark` | 投影回图像的点 |
| `param` | 注释为 `[scale, rotatex, rotatey, rotatez, tx, ty, alpha0, alpha1 ...]` |
| `mvp[16]`、`model[16]` | 变换矩阵 |
| `normal`、`tangent`、`bitangent` | 法线、切线、副切线 |
| `rvec[3]`、`tvec[3]` | 注释原文为“opencv solvepnp 输出” |

`param` 中的 alpha 系数，正是**参数化 3D 人脸形状模型（3DMM 类）系数**的典型形态。

**模型配置 `bef_ai_facefitting_mesh_config`**

| 字段 | 含义 |
|---|---|
| `uv` | 标准展开 UV |
| `flist` | 三角面索引 |
| `landmark_triangle` | landmark 三角剖分 |

`landmark_triangle` 直接说明 SDK 内部存在**基于关键点的三角网格**，可用于妆容贴图和变形。

**求解参数**：`Solver_Lambda / MaxIter / Eps / Smooth / Camera_Type(正交/透视) / Eyelash_Flag / Use_Semantic_Lmk / Mouth_BS_Limit`。其中 BS 即 blendshape。

### 5.6 人脸属性 `bef_effect_ai_face_attribute.h`

- 输出：`age`、`boy_prob`、`attractive`、`happy_score`、7 类表情、`real_face_prob`、`quality`、`arousal`、`valence`、口罩、帽子、胡子、口红、眼镜、墨镜、`blur_score`、`illumination`、`confused_prob`。
- 身份相关属性默认每 12 帧计算一次，并做累积。

### 5.7 与 Effect House 的对应

来源：[官方-文档] 搜索摘要。

- **Face Info** 节点输出“An array of 106 facial keypoints”，即 2D Keypoints；同时输出 Rotation（Vec3）、Rect、Center Position，坐标为归一化值。
  - https://effecthouse.tiktok.com/learn/guides/visual-scripting/nodes/head-and-face/face-info
- 3D Face 使用 `adjustedGeo_quads_01.fbx` 网格加 `face_uv.png`。修改时**不能改变顶点 ID**，最多 5 张脸。
  - https://effecthouse.tiktok.com/learn/guides/workspace/assets/downloadable-assets/3d-face

---

## 6. 美颜（磨皮、美白、锐化、清晰、红润、匀肤）

### 6.1 已确认的事实

1. 美颜是 composer 节点 `beauty_*_lite`，key 为 `smooth`、`whiten`、`sharp`、`clear`，红润在独立的 `rosy` 包里。（第 4 节）
2. 磨皮和美白放在**同一个** `GeneralEffect_smooth_whiten` 多 pass 着色器效果中。shader 文件为：
   - `vshader_boxblur.vs` / `fshader_boxblur.fs`
   - `fshader_alpha_boxblur.fs`
   - `fshader_var.fs`
   - `vshader_epm.vs` / `fshader_epm.fs`
   - `Beauty.vert` / `Beauty.frag`
   - `contrast_enhance.*`
3. 资源图有三类：
   - `faceMask.png`：标准正脸模板。R 通道为脸部皮肤加颈部，边缘柔和；B 通道为眼、眉、鼻孔、唇。
   - `foundation_filter.png`：64³ LUT。
   - `contrast_min.png` / `contrast_max.png`：17³ LUT。
   - 以上来源：[官方-代码]，见 3.3。
4. 皮肤分割模型 `tt_skin_seg` 支持“加载人脸模型以去除五官皮肤”。（[官方-代码] `bef_effect_ai_skin_segmentation.h`）
5. Effect House 的 **Face Retouch**（前身为 Skin Smoothing）属性有：
   - Skin Texture，用于平滑不均匀的皮肤，同时保留面部边缘和轮廓；
   - Eye Brilliance；
   - Dark Circles；
   - Smile Lines。

   这与 SDK 的 `beauty_4Items` 中 `BRIGHTEN_EYE`、`REMOVE_POUCH`、`SMILES_FOLDS` 一一对应。
   - [官方-文档] https://effecthouse.tiktok.com/learn/guides/workspace/objects/face-effects/face-retouch ；https://effecthouse.tiktok.com/latest/release-notes-latest
6. CapCut 桌面版资源中有 `DefaultAdjustBundle/yunfu_npu`（匀肤）。其中的模型为：
   - `jypc_yunfuhua_gpucpu`（jy = 剪映，pc = 桌面端）
   - `jypc_yunfuhua_ocl`（OpenCL 变体）
   - `tt_fsnew_base_jianying`（剪映专用人脸基础模型）
   - `tt_freid`（人脸重识别）

   场景中有名为 `face_gan` 的实体。也就是说，**匀肤是一个按人脸对齐裁剪后运行的神经网络（GAN 类）模型**，不是纯 shader。详见第 10 节。来源：[公开镜像-非官方]

### 6.2 推断的磨皮管线

依据：上面的 shader 和资源文件名，加上 [通用知识]。

```
输入纹理 I (RGBA)
  │  (人脸 106/280 点 → 将 faceMask.png 模板三角网格/仿射 warp 到当前人脸 → 皮肤权重 M_skin,
  │   五官保护 M_organ(B 通道) ; 可叠加 skin_seg 掩码)
  ├─► boxblur(I) → μ        boxblur(I²) → E[I²]   →  fshader_var: σ² = E[I²] − μ²
  │                                                   (下采样+分离 box 滤波, O(1)/像素)
  ├─► fshader_epm: 边缘保持权重 a = σ²/(σ²+ε) (guided-filter / Lee 滤波式)
  │                q = μ + a·(I − μ)   ← 平坦区趋向 μ(磨平), 边缘区保留 I
  ├─► alpha_boxblur: 对掩码/权重做羽化
  ├─► Beauty.frag: out = mix(I, q, smoothStrength · M_skin · (1−M_organ))
  │                + 高频细节回加 / 锐化(sharp)  + 清晰(clear: 局部对比)
  ├─► 美白: LUT(foundation_filter 64³) 按 whiten 强度插值 (亮度/肤色曲线)
  └─► contrast_enhance: 在 contrast_min/max (17³ LUT) 之间按强度插值
输出纹理 O
```

- “box 均值加方差，再算边缘保持权重”是 He 等人 Guided Filter 的标准做法，复杂度为 O(1)，见 [通用知识] https://people.csail.mit.edu/kaiming/publications/pami12guidedfilter.pdf 。文件名 `boxblur`、`var`、`epm` 与这一结构高度吻合，但**字节没有公开确认**。`epm` 的确切含义未知。
- 用 LUT 美白和调色是行业常见做法，例如 GPUImage 的 lookup filter，64³ 打包进 512×512 图，见 [通用知识] https://github.com/theomission/glsl-lut 。SDK 资源中的 512×512 LUT 是事实，用途属于推断。

---

## 7. 面部重塑（瘦脸、大眼、小头等微整形）与人脸变形

### 7.1 已确认的事实

- **微整形 key 很细**，共 16 项以上，见第 4 节。v8 版素材叫 `reshape_v8_lite`。
- Effect House 发布说明：“Upgraded the Face Reshape object with the V8 deformation engine to correct background distortion and minimize its visibility”。
  - [官方-文档] https://effecthouse.tiktok.com/latest/release-notes-latest
  - 这里的“**V8 deformation engine**”与 SDK 素材名 `reshape_v8_lite` 同代号。由此可确认 TikTok 和 SDK 共用变形引擎。
- 素材内部结构（[官方-代码]，见 3.3）：
  - `reshape_lite/GE_Mesh_SmallHead/generalEffect`：以 Mesh 实现的 GeneralEffect，即小头效果；
  - `distortionFaceu_test/represent_Plasticine*.txt`：一种“橡皮泥”式变形表示，名字中的 Faceu 指 FaceU 激萌 App；
  - 贴纸中有 `FaceDistortionV2_*` 和 `FaceStretch_*` 两种 Feature。
- **Effect House Face Stretch**：
  - 在场景面板中拖动 2D 关键点；参数有 Intensity（默认 50）、Symmetric（默认开启）、Lock。
  - 可视化脚本节点 **Set Face Stretch** 接收 **96 个**“归一化 sample space”关键点（`Stretch Sample Key Points`），以及 `Intensity`、`Is Symmetric`、`Locked Indices`。
  - 页面：https://effecthouse.tiktok.com/learn/guides/technical-guides/objects/face-effects/face-stretch ，https://effecthouse.tiktok.com/learn/guides/visual-scripting/nodes/head-and-face/set-face-stretch
- **Effect House Face Liquify / Liquify 组件**：参数有 Symmetry、Radius、Intensity X/Y、Liquify Area，可用于脸部和身体。
  - https://effecthouse.tiktok.com/learn/guides/workspace/components/utility/liquify
- **3D Face Warp**：7 类共 66 个参数，覆盖头脸比例、眉、眼、鼻、嘴、下颌、脸型。
  - https://effecthouse.tiktok.com/learn/guides/face-effects/3d-face/
- 剪映的“美型”有**单人模式和全局模式**（[媒体] 用户教程摘要）。CapCut 美颜包的算法图中有 `freid`（人脸重识别）节点。因此**单人模式**依赖跨帧、跨片段的人脸身份追踪，这一点为 [推断]。

### 7.2 推断的变形管线

依据：上面的事实，加上 [通用知识]。

```
关键点 P (106/280, 已去抖) ──► 控制点集 {p_i}（脸轮廓/下颌/眼/鼻/嘴 + 远离人脸的固定锚点）
        │
        ├─ 每个 key (e.g. Internal_Deform_Eye, value v) 定义一组位移 {Δp_i(v)}
        │   (由“素材”中的变形描述决定: represent_*.txt / FaceStretch 96 点 sample / Liquify 半径+强度)
        │   多个 key 的位移线性叠加 → 目标控制点 q_i = p_i + Σ_k w_k·Δp_i^k
        │
        ├─ 稠密化: 在屏幕上铺规则网格 (或关键点三角网格 + 外圈包围点),
        │   以 MLS(similarity/rigid) / RBF / 局部径向“液化”函数 计算每个网格顶点位移
        │   (V8: 增加背景约束/外圈固定点 → 抑制背景直线弯曲)
        │
        └─ GPU: 顶点着色器移动网格顶点, 片元着色器按原 UV 采样输入纹理 (“逆向映射”避免空洞)
             大眼: 以眼中心为圆心的径向缩放 r' = r·(1 − α·(1 − (r/R)²)) 之类的局部放大
```

- MLS 图像变形可参考 Schaefer、McPhail、Warren 在 SIGGRAPH 2006 发表的 *Image Deformation Using Moving Least Squares*，见 [通用知识] https://people.engr.tamu.edu/schaefer/research/mls.pdf 。它有闭式解，可以实时运行。
- 学术界也指出，大幅变形时人脸附近的背景容易出现畸变，见 Tang 等人在 ACM MM 2021 发表的 *Parametric Reshaping of Portraits in Videos*（浙江大学与巴斯大学，**不是字节跳动**）：https://arxiv.org/pdf/2205.02538 。这正是“V8 deformation engine”要解决的问题。
- SDK 中 `facefitting` 的 3DMM 参数和 `landmark_triangle` 说明存在 **3D 网格变形路径**，例如 3D Face Warp 的 66 个参数。2D 美型具体使用 MLS、三角网格还是 RBF，**没有公开确认**。

---

## 8. 美妆（口红、腮红、眼影、眉毛、修容、美瞳、染发）

### 8.1 已确认的事实

- Composer 美妆节点和 key 见第 4 节，例如 `lip/lite/fuguhong` 加 `Internal_Makeup_Lips`。
- 道具中的妆容 Feature 名为 `FaceMakeupV2`。
- Effect House **Face Mask** 把 2D 纹理贴到脸上，形成妆容或面绘。
  - Face Region 可选 Whole face、Eyes、Eyelashes、Lips，支持 Blend Mode 和 Opacity。
  - 纹理为 PNG 或 JPG，最大 1024×1024。
  - v2.1 起提供 `face_mask_2.1+.zip` 模板，包含 Whole face、Eyes、Eyelashes、Lips、Teeth。
  - 页面：https://effecthouse.tiktok.com/learn/guides/workspace/objects/face-effects/face-mask ，https://effecthouse.tiktok.com/learn/guides/workspace/assets/downloadable-assets/2d-face-mask
- Effect House 的 Segmentation Texture 新增了 **Face** 类型，用于在手指遮挡时不把妆画到手上。其他类型还有 Portrait、Hair、Head、Hand、Clothing、Skin、Eye、Ear、Lip、Teeth、Pet、Sky、Ground、Building 等。
  - https://effecthouse.tiktok.com/learn/guides/technical-guides/assets/texture/segmentation-texture
- SDK 头文件提供嘴唇、牙齿和面部掩码，均为 256² 加仿射矩阵；还有 `visibility_array`（点级遮挡）和 `skin_segmentation`。
- Makeup Palette 模板使用 PBR 参数 Metallic（光泽）和 Roughness（哑光）。
  - https://effecthouse.tiktok.com/learn/guides/tutorials/template-tutorials/makeup-palette
- 性能提示：美瞳颜色开销最高，其次是睫毛、Face Mask、Eye Effect；建议同时使用的脸部效果不超过 5 个。
  - https://effecthouse.tiktok.com/learn/guides/getting-started/technical-guidelines/technical-optimization

### 8.2 推断的妆容管线

依据：上述事实，加上 [通用知识]。

- 美妆贴图在**标准人脸 UV 或模板空间**中绘制，模板就是 `face_mask_*.psd`。
- 运行时用关键点三角网格（`landmark_triangle`）或 3D face mesh，把模板顶点映射到当前人脸，再在 GPU 上光栅化。
- 混合方式按图层分为 multiply、soft light 或 normal。透明度由区域掩码控制，例如唇掩码和遮挡掩码。
- 口红一类需要精确边缘的区域，用 280 点的 64 个唇部点和 `AI_MOUTH_MASK` 约束。
- 美瞳使用 2×20 个虹膜点。

---

## 9. 特效运行时（Amazing）与 Effect House：[公开项目] + [官方-文档]

### 9.1 引擎命名证据

**Effect House 导出的公开项目**（创作者自己上传到 GitHub）中出现：

- `const Amaz = effect.Amaz;`
  - https://github.com/ArmandoPalermo/EffectHouse-Projects
- `Amaz.AmazingManager.getSingleton('BuiltinObject').getInputTextureWidth()`，以及 `getSingleton('Algorithm')`、`'Input'`、`'ARPlatform'`
  - https://github.com/lafiosca/effect-house-screen-tap-test
  - https://github.com/ciiindyxuu/ARFilters
- `APJS.AmazingManager.getSingleton('Algorithm').getAEAlgorithmResult().getFaceBaseInfo(i)`
  - https://github.com/shidec/Boucing-Ball-TikTok
- `const APJS = require('./amazingpro')`
  - https://github.com/CalMatters/tiktok-effects-props-2024

**Effect House 官方脚本文档**：

- APJS 是 TypeScript 组件，类上用 `@component()` 装饰并继承 `APJS.BasicScriptComponent`。
- 生命周期为 `onStart`、`onUpdate`、`onDestroy`。
- 字段用 `@serializeProperty()` 暴露到 Inspector。
- https://effecthouse.tiktok.com/learn/guides/api-reference/scripting-capability-usage-guide

**结论**：运行时的命名空间是 **Amaz**，即 “Amazing” 引擎。脚本层历史上用 Lua 和 JS，现在是 APJS，可理解为“Amazing Pro JS”，这一展开为 **[推断]**。

- `EffectSDK_iOS_TOB.podspec` 链接了 **JavaScriptCore**，并弱链接 **Metal**、**MetalPerformanceShaders**、**CoreML**。
  - 描述原文：“A cross platform render effect library for livestream and short vedio.”
  - 来源：[官方-代码] https://github.com/volcengine/volcengine-specs/blob/master/EffectSDK_iOS_TOB/11.6.0-VE/EffectSDK_iOS_TOB.podspec
  - 另有 `11.6.0-VE-LENS` 变体：https://github.com/volcengine/volcengine-specs/tree/master/EffectSDK_iOS_TOB

### 9.2 包格式（AmazingFeature / Effect House 导出）

**Effect House 生成式（GAN）效果目录**：[公开项目] https://github.com/jonathantcallahan/paper_route/tree/main/paper_route/Assets/Shocked/Generative%20Effects/Shocked.algo.folder

```
Shocked.algo.folder/
  algorithmConfig.json      ← 算法图
  *.xshader                 ← 跨平台着色器源
  shaderGLES/ shaderMetal/ shaderVulkan/ shaderHLSL5/   (+ *.extra)  ← 多后端预编译
  gan.material  ganmask.png  shockeyes.js
```

**`algorithmConfig.json`**（作者已读取）：

```json
{"version":"1.0","mode":2,
 "model_names":["tt_face","tt_face_extra","face_simo","repeat_zhenjing_shocked_gather_eh"],
 "nodes":[
  {"name":"blit_0","type":"blit","config":{"size":{"width":360,"height":640}}},
  {"name":"face_0","type":"face", ...},
  {"name":"FaceAlign","type":"nh_face_align","config":{"keyMaps":{"intParam":{"num_faces":1,"affine_mode":2},
        "stringParam":{"model_name":"repeat_zhenjing_shocked_gather_eh","packed_model_group_key":"face_align"}}}},
  {"name":"script_0","type":"script", ... "model_name":"face_simo"}],
 "links":[ blit_0→face_0, blit_0→FaceAlign, face_0→FaceAlign(2), blit_0→script_0, FaceAlign(1)→script_0(1) ]}
```

`shockeyes.js` 中有 `dynamicSetAlgorithmEnable`，算法列表为 `["blit_0","face_0","FaceAlign","script_0"]`。

**Effect House `project.info`**：包含 `"overwriteBuiltinFilter": true` 和 `"overwriteBuiltinMakeup": false`。也就是说，效果可以选择是否覆盖宿主 App 的内置滤镜和内置美妆。这与 composer 的 A/B/C 槽区、CapCut 的 `exclusiveScene` 是同一类机制（[推断]）。

- https://github.com/lafiosca/effect-house-screen-tap-test

### 9.3 场景与 ECS

**`sticker.config`**：[公开镜像-非官方]，取自 CapCut 的 yunfu_npu 包

```json
{"dev_version":"12.0.0","min_version":"10.62.0","type":"amazing",
 "systemList":["BehaviorSystem","CameraSystem","EventSystem","MeshRendererSystem","TransformSystem"]}
```

- 这是**实体-组件-系统（ECS）** 结构的直接证据。
- `main.scene` 是二进制序列化格式，文件头为 `%SerializedFormat%`。可读字符串中有：
  - 实体：`Camera_entity`、`face_gan`
  - 资源：`rt/outputTex.rt`（render target）、`material/noface.material`、`mesh/Quad.mesh`、`lua/global.lua`
- 包目录为 `alg/ image/ lua/ material/ mesh/ rt/ xshader/ main.scene content.json js-meta.json lua-meta.json LuaRTTI.MarkGen.lua sticker.config`。
- 来源：第三方未经授权上传的 CapCut 桌面版资源目录（不在本报告中转引链接）

**Effect House 文档中的渲染概念**（[官方-文档] 搜索摘要）：

- Camera 输出到 Render Texture，默认为 “Final Render Output”。
- Render Order 和 Layers（Render Groups）决定绘制顺序。
- 支持 Depth Render Texture；材质提供 Standard PBR，以及 Depth Test、Blend Mode、Cull Mode 等渲染状态。
- 页面：https://effecthouse.tiktok.com/learn/guides/workspace/assets/texture/render-texture ，https://effecthouse.tiktok.com/learn/guides/workspace/objects/scene/camera ，https://effecthouse.tiktok.com/learn/guides/technical-guides/assets/material/material-overview ，https://effecthouse.tiktok.com/learn/guides/crash-course/effect-house-101/what-are-render-groups

### 9.4 旧版抖音特效创作工具

- **像塑**（原名“特效君”）是抖音特效的创作与发布 App。
- 特效师通常先用 PS 或 AE 出图，再用 **Effect Creator** 合成并导出，最后上传。
- 来源：[媒体] https://apps.apple.com/cn/app/%E7%89%B9%E6%95%88%E5%90%9B-%E5%8F%91%E7%8E%B0%E4%BD%A0%E7%9A%84%E5%88%9B%E6%84%8F/id1441942700 ，https://www.digitaling.com/articles/215823.html
- 第 3.5 节的 Feature 式贴纸目录（`2DStickerV3`、`FaceMakeupV2` 等，加上 `event.lua` 和 `trigger.json`）属于这一代格式（[推断]）。
- CapCut 配置中的 `"ae_tool":"AmazingEditor"` 说明内部还有一个名为 **AmazingEditor** 的编辑器，与 Effect House 的关系未知。

---

## 10. CapCut 特有的公开证据：[公开镜像-非官方]

> 来源说明：GitHub 上有第三方未经授权上传了 Windows 上 `AppData/Local/CapCut/User Data/Resources/` 目录的内容（CapCut 桌面版本地下发的资源）。因为是对专有文件的再分发，本报告不转引其链接，相关结论的可信度也低于官方资料。
> 作者**只读取了目录名和明文 JSON**，没有解密任何文件，也没有使用任何反编译代码。
> GitHub 上另有反编译的 TikTok 源码仓库，作者刻意**没有使用**。

### 10.1 目录结构

- `Resources/` 下有 `DefaultAdjustBundle/`、`Font/`、`MixMode/`、`Qinyan/amazingfeature/`。“轻颜”是字节旗下的相机 App。
- `DefaultAdjustBundle/` 是**调节（Adjust）面板**的资源，按效果分版本存放：
  - `temperature`、`temperature_tone_v2`、`temperature_tone_v3`、`tone`、`tone_v1`、`saturation`、`saturation_v1`
  - `shadow`、`shadow_highlight_v2_gles2`、`shadow_highlight_v2_gles3`、`shadow_highlight_v3_gles3`
  - `sharpen`、`sharpen_v1`、`vignetting`、`vignetting_v1`
  - `particle`、`particle_v1`、`particle_v2`
  - `merge_all_adjust_color`（其 `Feature.js` 中有 `colorMigration`，即色彩迁移）
  - `yunfu_npu`
- 由此可见：
  - **调节和美颜同样是 Amazing 特效包**，不是写死在 App 里的；
  - 包会按 GLES2 和 GLES3 分版本。
- 来源：第三方未经授权上传的 CapCut 桌面版资源目录（不在本报告中转引链接）

### 10.2 `yunfu_npu/config.json`

```json
{"ae_tool":"AmazingEditor","bALG_BACH_CONFIG":true,
 "effect":{"Link":[{"path":"AmazingFeature/","rtShare":true,"type":"AmazingFeature","zorder":8011}],
   "exclusiveScene":[{"priority":9999,"sceneKey":"FaceMakeup*"},{"priority":9999,"sceneKey":"Filter*"},
                     {"priority":9999,"sceneKey":"FaceDeformation*"},{"priority":9999,"sceneKey":"FaceBeauty*"}],
   "model_names":{"script":["tt_fsnew_base_jianying","tt_freid","jypc_yunfuhua_gpucpu","jypc_yunfuhua_ocl"]}},
 "version":"13.9.0"}
```

### 10.3 `yunfu_npu/algorithmConfig.json`（Bach 图）

```
blit_0 (缩放到 360×640) ─┬─► face_0 (type "face", face_base_model_key = tt_fsnew_base_jianying,
                         │            face_max_num 10)
                         ├─► freid_0 (人脸重识别/跟踪 ID, 输入: 图 + face_0)
                         ├─► FaceAlign_jybeauty (type nh_face_align, model jypc_yunfuhua_gpucpu;
                         │                       输入: 图 + face_0) ──(对齐裁剪+变换)──┐
                         └──────────────────────────────────────────────────────────┤
                                                                                     ▼
                       script_0 (type "script", script_path AmazingFeature/alg/MainSystem.js,
                                 model_key jypc_yunfuhua_gpucpu, u8_model_key jypc_yunfuhua_ocl,
                                 gpu_mode/u8_mode, face_count 10)
                                 输入: 对齐裁剪(0), 原图(1), 人脸(2), freid(3), 对齐矩阵(4)
```

### 10.4 解读

以下各条为 [推断]，但都有强证据支持。

1. CapCut 美颜和 Effect House 的 GAN 效果使用**同一套**算法图 schema，即 `blit`、`face`、`nh_face_align`、`script`。检测都在 **360×640 的缩小图**上运行，再对齐裁剪人脸，每张脸跑一次网络，最后回贴。
2. `exclusiveScene` 加 `priority` 是**场景互斥与优先级规则**：同一时刻只能有一个“FaceBeauty*”类效果生效。这对应 SDK composer 的槽区（A/B/C）概念。
3. `zorder 8011` 说明特效在合成栈中有固定层级；`rtShare` 表示共享 render target。
4. 一个模型提供 `_gpucpu` 和 `_ocl`（OpenCL）两个变体，脚本节点上有 `gpu_mode` 和 `u8_mode` 开关，目录名又是 `yunfu_npu`。由此推断**同一个网络有 CPU/GPU、OpenCL 量化（u8）、NPU 等多后端实现，运行时按设备选择**。
5. `freid` 用于跨帧稳定地识别“同一个人”，从而支持剪映“单人模式”的美颜和美型参数。
6. `version 13.9.0`、`min_version 10.62.0` 与 ToB 的 `EffectSDK_iOS_TOB 11.6.0` 版本号属于同一序列。说明 **CapCut 内嵌的就是同一条 EffectSDK 主线的更新版本**（[推断]）。

---

## 11. 推理引擎与画质（Lens）

### 11.1 推理

- **错误码中的推理与图像库**：`ESPRESSO`（推理框架）、`MOBILECV`（图像库）、`SMASH`（算法 SDK）。[官方-代码]
- **ByteNN**：字节跳动的端侧推理框架。
  - 有一个公开演讲：QCon 上海 2021《字节跳动ByteNN端智能业务落地背后的技术挑战》。作者只找到第三方整理的引用：https://github.com/gatieme/LDD-LinuxDeviceDrivers/blob/master/study/ai/TRANSFORMER.MD
  - 火山引擎 Maven 仓库中有 `VolcEngineRTC-bytenn` 组件：https://artifact.bytedance.com/repository/Volcengine/com/volcengine/VolcEngineRTC-bytenn/3.56.1.508200/VolcEngineRTC-bytenn-3.56.1.508200.pom
  - ByteDance gsdk 下有 `com.bytedance.gsdk.transplanted:bytenn`：https://mvnrepository.com/artifact/com.bytedance.gsdk.transplanted/bytenn/2.10.26-f6f9804f
  - **ByteNN 的具体架构、后端和算子没有找到官方公开文档。**
- **多后端证据**：
  - 模型文件有 `_coreml` 后缀（[官方-代码]）；
  - CapCut 模型有 `_ocl` 和 `_gpucpu`、目录名 `_npu`（[公开镜像]）；
  - podspec 弱链接 CoreML 和 MPS（[官方-代码]）；
  - shader 有 GLES、Metal、Vulkan、HLSL5 四种（[公开项目]）。

### 11.2 Lens：`CVLensEngine.h`，[官方-代码]

- 命名空间：`LENS::FRAMEWORK`
- 入口：`CVLensEngineFactory::CreateLensEngine(licensePath|buffer)`
- `ILensEngineInterface` 的方法：`SetLicenseInfo`、`CreateFlowGraphAlgorithm(LensAlgorithmType)`、`CreateOneKeyGraphAlgorithm(OneKeySceneStrategyMode)`、`CreateCvOperator`、`CreateVendorAlgorithm`（注释为 “oem manufacturer capability”，例如 `AntiShake`）
- `ILensFlowGraphInterface` 的方法：`Init(LensBackendType, …)`、`ExecuteTexture(int tex)`、`ExecuteStream(void* buf)`、`GetTextureOutput`、`SetAsyncOutputListener`、`SetPiplineCallBack`（可插入自定义算子）
- `LensUtils` 提供 `LoadEGLLibrary`、`LoadGLESLibrary`、`LoadEGL(proc)`、`LoadGLES(proc)`，即**动态加载 GL**。
- 对应的画质算法头文件：`video_sr`（超分）、`vfi`（插帧）、`night_scene`、`photo_night_scene`、`video_hdr`、`video_deflicker`、`video_stab`、`adaptive_sharpen`、`onekey_enhance`、`vida`、`cine_move`（运镜）、`taint_detect`（脏污检测）。
- 画质增强相关错误码为 -64 至 -73。

---

## 12. 授权（License）机制

来源：[官方-代码] 与 [官方-文档]。

- **移动端为离线授权**：`.licbag` 文件**同时校验包名（ApplicationID/BundleID）和有效期**。测试阶段可使用预设包名。
  - https://www.volcengine.com/docs/6705/101956
  - 官方 Demo 的 README 也要求“把 bundle ID 发给 BytePlus 申请资源”：https://github.com/byteplus-sdk/effects-sdk-android-camera
- **PC 端为在线授权**：
  1. SDK 生成 `authMsg`（`bef_effect_ai_get_online_license_auth_msg`）；
  2. 用 key 和 secret 对请求做 **HMAC-SHA256 签名**并 POST 到授权服务；
  3. 服务返回 base64 编码的证书；
  4. SDK 调用 `bef_effect_ai_check_online_license` 校验。
  - 页面：https://www.volcengine.com/docs/6705/102012
  - V4.4.1 增加了设备 ID 加包名的双重校验，V4.6.0 支持设备 SN：https://docs.volcengine.com/docs/Intelligentbeautificationeffects/Updatelog
- **授权粒度**：可按功能授权（`bef_ai_license_function_type`），并提供 `bef_effect_ai_check_license_function`。每个算法句柄都有自己的 `*_check_license`。
- **版本一致性**：License 和素材必须与 SDK 版本一致。证书目录中的包名必须与工程包名一致。
  - https://www.volcengine.com/docs/6348/114717
- 素材文件采用 `&^#.enc` 头的加密格式（[官方-代码] 观察所得），用于保护素材知识产权。

---

## 13. 官方及半官方仓库与 Demo 清单

| 仓库 | 性质 | 内容 |
|---|---|---|
| https://github.com/volcengine/VolcEngineRTC | 官方 | 含 Effect SDK 全量头文件（`iOS/script/Depends/BytedEffectSDK/effect-sdk.framework/Headers`）、`cvlab` 素材（ComposeMakeup / Filter / Sticker / Model）、Android / iOS / Windows 的美颜示例（`ByteBeautyActivity.java`、`VolcBeautyViewController.swift`、`ByteBeautyWidget.cpp`）、`IVideoEffect` 头文件 |
| https://github.com/byteplus-sdk/effects-sdk-android-camera | 官方（已归档） | Camera2 + GLSurfaceView + EffectManager 最小示例：OES 转 2D 纹理，再 `process`，再上屏 |
| https://github.com/byteplus-sdk/VideoOneSolutions | 官方 | effectkit：节点 `beauty_Android_lite`、`whiten_clear_Android_lite`、`sharpen_Android_lite`、`reshape_v8_lite`，以及滤镜和贴纸 ID |
| https://github.com/volcengine/volcengine-specs | 官方 CocoaPods 源 | `EffectSDK_iOS_TOB`、`TTVideoEditor`、`NLEPlatform`、`DVETrackKit`、`EffectOneKit`、`veVOS` 等的 podspec（可看依赖关系） |
| https://github.com/AgoraIO-Community/BeautyAPI | 第三方 | ByteDance 美颜接入代码（`BEEffectManager.mm` 等），完整展示 init 和 process 序列 |
| https://github.com/pili-engineering/PLShortVideoKit-ByteDance | 第三方 | 资源目录树文档；`ResourceTool.py` 中有 key 对照表 |
| Effect House 文档 https://effecthouse.tiktok.com/learn/ | 官方 | Face Stretch、Face Retouch、Face Mask、Face Liquify、3D Face、Segmentation、APJS 脚本、Render Texture |

---

## 14. 通用算法背景：[通用知识]，非字节确认

1. **磨皮（保边平滑）**
   - 常用双边滤波、Guided Filter（O(1)，基于局部均值和方差，详见 https://people.csail.mit.edu/kaiming/publications/pami12guidedfilter.pdf ）、表面模糊，或“高反差保留”式的高低频分离。
   - 移动端一般在下采样图上做分离 box 滤波，再与原图按皮肤掩码混合，并回加部分高频，以保留毛孔，避免“塑料感”。
   - 近年也有用小型 CNN 或 GAN 做去瑕疵与匀肤的做法。CapCut 的 `face_gan` 和 `yunfuhua` 模型即属此类（见第 10 节）。
2. **美白、调色**
   - 1D 曲线或 3D LUT（64³ 打包成 512²，或 17³、33³）。在片元着色器中用三线性或双块插值查表。
   - 参考：https://github.com/theomission/glsl-lut ，https://developer.nvidia.com/gpugems/GPUGems2/gpugems2_chapter24.html
3. **关键点驱动变形（瘦脸、大眼）**
   - 方法有 MLS（affine / similarity / rigid，参考 https://people.engr.tamu.edu/schaefer/research/mls.pdf ）、关键点 Delaunay 三角网格的分段仿射、RBF/TPS，以及局部径向“液化”函数。
   - GPU 实现一般是网格顶点位移加逆向采样。为抑制背景畸变，会在外圈加入固定锚点或刚性约束。
4. **妆容**
   - 在标准脸 UV 模板上绘制，按关键点三角化映射到实时人脸，再按图层做 multiply、soft light 等混合。
   - 结合唇、眼的分割掩码和遮挡掩码。唇彩可再加高光和光泽层（PBR 的 metallic / roughness）。
5. **时序稳定**
   - 关键点做去抖（指数平滑、One-Euro filter、卡尔曼滤波），对应 SDK 的 `*_SMOOTH_LEVEL`。
   - 检测加跟踪交替执行，对应检测间隔 24/8 帧。
   - 人脸 ID 跟踪，对应 `ID` 字段和 `freid`。

---

## 15. 未能验证或资料缺口

- 磨皮、美白、变形 shader 和 Lua 的**真实内容**无法查看，因为全部加密。第 6、7 节的管线是依据文件名和资源图做出的推断。
- 当前 CapCut 是否依然只用 OpenGL ES，还是已在 iOS 和 macOS 上切到 Metal，没有官方说明。
  - 已知证据：EffectSDK 弱链接 Metal；Effect House 导出包含 Metal、Vulkan、HLSL5 的 shader；CapCut 调节包按 gles2 和 gles3 分版本。
- ByteNN 和 Espresso 的关系、各自负责的模型、NPU 适配方式，均无一手公开资料。
- “V8 deformation engine”的算法细节，以及 `represent_Plasticine` 表示的含义，均未公开。
- `docs.byteplus.com` 和 `volcengine.com` 的文档正文是通过搜索摘要获得的，引用前建议人工打开原页面核对版本，因为 v4.2.1、v4.7.x、v4.8.0 之间差异较大。
- 没有找到明确署名字节跳动、且可直接对应产品功能的人脸关键点、美型或磨皮论文。检索到的相关论文均来自其他机构。
