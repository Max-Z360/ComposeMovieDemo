# 剪映 / CapCut 剪辑引擎（NLE）公开资料研究笔记

> 用途：学习 / 架构研究。只使用公开来源：官方文档、技术文章、开源项目、公开发布的 SDK 二进制（只列出文件名和类名，没有反编译代码逻辑）、公开的沙箱分析报告。
> 日期：2026-10-15。
> 证据等级标记：
> - **[确认]**：有一手或可核验的公开来源（官方文档、开源代码、公开 SDK 包里的类名/符号）。
> - **[第三方]**：社区逆向资料或博客，可信度中等，可能随版本变化。
> - **[推断]**：作者根据名字或结构推断，没有直接证据。
>
> 网络限制说明：本次环境只能直接访问 GitHub、npm、PyPI。docs.byteplus.com、volcengine.com、web.dev、juejin、zhihu 等页面**无法直接抓取**，相关内容来自搜索引擎摘要，原文需另行核对（文中标注"搜索摘要"）。

---

## 0. 关键结论速览

1. **[确认] 剪映 / CapCut 的剪辑内核和火山引擎 / BytePlus 对外销售的 "VE SDK + NLE SDK" 是同一套技术。** BytePlus 官方文档写明 VE SDK "widely used in ByteDance's own apps (e.g., TikTok, Douyin, CapCut, Xigua Video, FaceU, Ulike)"。公开 Demo 依赖的 VESDK 版本号带 `-lv` 后缀（`9.1.2.75-lv`），`lv` 是剪映的内部代号（包名 `com.lemon.lv`，草稿 `app_source:"lv"`）。NLE 的 C++ 命名空间是 `cut::model`。
2. **[确认] 分层：** `NLE SDK`（C++ 数据模型 + 编辑器，"不负责渲染"）→ `NLE2VEEditor` 桥接 → `VE SDK`（`libttvesdk`，图(Graph)/单元(Unit)式媒体引擎）→ Effect SDK（AmazingEngine + AGFX 图形抽象，支持 GL/GLES/Vulkan/Metal）、`libaudioeffect`（SAMI/MAMMON）、`libttffmpeg`（基于 FFmpeg 3.3.2 的自研分支，内含 ByteVC1 解码）、`libbytenn`（端侧推理）。
3. **[确认] 时间线模型：** Model → Track → Slot(时间段) → Segment(内容) → Resource(素材)。时间单位是**微秒**。编辑器采用类似 git 的 **commit / done / branch / undo / redo** 机制，草稿就是 NLEModel 序列化成的 JSON（`store()` / `restore()`，C++ 端使用 nlohmann::json）。
4. **[第三方，已核验] 剪映桌面草稿格式** `draft_content.json`（或 `draft_info.json`）结构：顶层约 30–36 个 key；`tracks[]`（video/audio/text/effect/filter/sticker/adjust）；`segments[]` 带 `target_timerange` / `source_timerange`（µs）、`clip`、`speed`、`extra_material_refs`；`materials{}` 约 45–54 个分类数组；资源型效果用 `effect_id` / `resource_id` / md5 引用云端素材库。**剪映国内版 6.0+ 对草稿加密**，CapCut 国际版不加密（第三方）。新版改成多时间线目录 `Timelines/<id>/`。
5. **[确认] Web 版 CapCut：** C++ 编辑引擎用 Emscripten 编译成 WASM；WASM SIMD 带来约 300% 的提升；WebCodecs 用于硬件编解码，支持多路 4K；迁移了 100 多万个模板（web.dev 案例，搜索摘要）。
6. **[确认/推断] 桌面 UI：** 公开沙箱报告显示 CapCut.exe 加载了 `qt6core.dll`、`qt6qml.dll`、`qt6quick.dll`、`qt6qmlmodels.dll`、`videoeditor.dll`、`effect.dll`、`audioeffect.dll`，并有 `VECreator.dll`。由此判断桌面 UI 用的是 Qt 6 / Qt Quick（QML），引擎是 C++ DLL。

---

## 1. 产品、包名与代码血缘

| 项 | 值 | 等级 | 来源 |
|---|---|---|---|
| 剪映 Android 包名 | `com.lemon.lv` | [第三方] | viettelstore 文章（https://viettelstore.vn/tin-tuc/capcut-trung-quoc） |
| CapCut Android 包名 | `com.lemon.lvoverseas` | [确认] | APKMirror（https://www.apkmirror.com/?p=13803597） |
| 剪映专业版 mac bundle | `com.lemon.lvpro`（路径 `~/Library/Containers/com.lemon.lvpro/...`） | [第三方] | CapCutAPI `capcut_server.py` L784（https://github.com/sun-guannan/CapCutAPI/blob/main/capcut_server.py） |
| 草稿 `platform.app_source` / `app_id` | 剪映 `"lv"` / `3704`；CapCut `"cc"` / `359289` | [确认-开源样例] | pyJianYingDraft `assets/draft_content_template.json`；CapCutAPI `draft_profiles.py` |
| 草稿根目录 | Win: `%LOCALAPPDATA%\CapCut\User Data\Projects\com.lveditor.draft\<draftId>`；mac: `~/Movies/CapCut/User Data/Projects/com.lveditor.draft`；剪映为 `JianyingPro\User Data\...`。用户可见的草稿目录一般叫 `JianyingPro Drafts` | [第三方] | capcut-cli `docs/version-support.md`；capcut-cli-david `docs/draft-schema/00-overview.md`；pyJianYingDraft README |
| VESDK 构建 flavor | `com.bytedance.ugc.framework.libs:vesdk:9.1.2.75-lv`；本地 aar `vesdk-11.3.0.103-tob.aar`；`nleVersion: 11.6.0.27-alpha.2-ck` | [确认] | hifive `versions.gradle`、`library_core/libs/`（https://github.com/hifiveai/openmusic-short-video-android-example） |
| VE SDK 在字节系 App 中的使用 | "widely used in ByteDance's own apps (e.g., TikTok, Douyin, CapCut, Xigua Video, FaceU, Ulike)" | [确认-官方，搜索摘要] | BytePlus Product Overview / One Pager（https://docs.byteplus.com/en/docs/byteplus-video-editor-sdk/docs-one-pager-overview-v.4.0.2） |
| SDK 别名 | Video Editor SDK = **CKOne / CK**；Magic Template SDK = **cutsame / CutSame** | [确认-官方，搜索摘要] | BytePlus Magic Template / Integration docs |
| 影像中台来源 | 剪映的影像中台源自 2019 年在 FaceU 激萌基础上建立的影像中台；剪映移动端 2019-05 上线 | [第三方-媒体] | 搜索摘要（新浪财经 / nbd 报道） |
| PC 端起步 | "剪映 PC 端是字节跳动在音视频领域第一次开发 PC 端产品"；特效在手机和桌面端的显卡渲染逻辑差异很大；Mac 专业版适配 Apple 芯片，并"借助苹果原生框架完成音视频的硬解码与编码" | [确认-字节招聘号] | 知乎"剪映会出电脑版吗? - 字节跳动招聘的回答"（https://www.zhihu.com/question/394722680/answer/1677687095） |
| 多端草稿互通 | 专业版 2.0（2021-09）发布云草稿三端互通 | [第三方-媒体] | 腾讯新闻（https://view.inews.qq.com/a/20210912A0004U00）；百度百科（https://baike.baidu.com/item/剪映专业版/56755550） |

**[推断]** `lv` 前缀到处出现：`com.lemon.lv`、`app_source: lv`、`vesdk ...-lv`、`com.lveditor.draft`。这说明剪映（LV）是这套编辑 SDK 的"母产品"；火山引擎的 To B 版本（`-tob`、`-ck`）是从同一代码线派生出来的。

---

## 2. 剪映 / CapCut 桌面草稿（工程文件）数据模型

### 2.1 主要开源逆向项目（仓库 + 关键文件）

| 项目 | URL | 关键文件 |
|---|---|---|
| pyJianYingDraft (GuanYixuan) | https://github.com/GuanYixuan/pyJianYingDraft （commit 1e22847，2026-10-14） | `pyJianYingDraft/segment.py`（BaseSegment / Speed / AudioFade / ClipSettings）、`track.py`（TrackType）、`video_segment.py`（Mask / Chroma / VideoEffect / Filter / Transition / BackgroundFilling / MixMode）、`keyframe.py`、`animation.py`、`text_segment.py`、`local_materials.py`（VideoMaterial / AudioMaterial / CropSettings）、`script_material.py`（materials 导出）、`script_file.py`（dumps / render_index）、`template_mode.py`（模板替换策略）、`draft_content_loader.py`（明文/非明文判断）、`assets/draft_content_template.json`、`assets/draft_meta_info.json`、`metadata/*.py`（effect_id / resource_id / md5 目录） |
| CapCutAPI / VectCutAPI (sun-guannan) | https://github.com/sun-guannan/CapCutAPI （commit 269a404，2026-10-12） | `draft_profiles.py`（capcut_legacy / jianying_legacy / jianying_pro_10 三种目录布局）、`template_jianying_10_2/`（剪映 10.2 空草稿全目录）、`template_jianying/`（旧版 `draft_info.json`）、`save_draft_impl.py`（远程素材下载、`replace_path`）、`capcut_server.py`（草稿目录路径） |
| capcut-cli-david | https://github.com/Davidb-2107/capcut-cli-david ；npm 包 `capcut-cli-david@2.5.0` | `docs/draft-schema/00-overview.md` … `05-version-differences.md`（目前最完整的字段说明，以 CapCut 8.x 为主） |
| capcut-cli (renezander030) | https://github.com/renezander030/capcut-cli | `docs/version-support.md`（版本/加密/多时间线证据矩阵） |
| 其他 | JianyingDraft.PY (https://github.com/notinmood/JianyingDraft.PY)、jianying-mcp、duo-video、capcut-mate 等 | 未逐一核验 |

### 2.2 草稿目录结构

**旧版（剪映 ≤5.9 / CapCut 早期）[第三方]**
```
<draftId>/
├── draft_content.json        ← 时间线主文档（CapCut 早期/剪映旧版也叫 draft_info.json）
├── draft_meta_info.json      ← 草稿列表元数据 + 左侧素材库(draft_materials)
├── draft_cover.jpg
├── draft_settings            ← INI 格式 "[General] draft_create_time=..."
├── draft_agency_config.json  ← 代理(proxy)设置
├── draft_biz_config.json / draft_virtual_store.json / key_value.json
├── attachment_pc_common.json / attachment_editing.json
├── performance_opt_info.json ← 预合成 precombine 相关
├── template.tmp / template-2.tmp / *.bak / .backup/
├── Resources/                ← 导入草稿的媒体（路径用占位符引用）
└── adjust_mask/ matting/ smart_crop/ subdraft/ qr_upload/ common_attachment/
```
- `draft_meta_info.json` 里的素材出现在左侧素材库；`draft_content.json` 里的素材出现在时间线上（JianyingDraft.PY 的说法，搜索摘要）。
- 媒体路径可以写成 `##_draftpath_placeholder_<UUID>_##\Resources\<asset>`，打开时由 `draft.extra` 解析。[第三方：capcut-cli-david 00-overview]

**新版（剪映 10.x / CapCut 8.7+）多时间线布局 [确认-开源样例]**（CapCutAPI `template_jianying_10_2/`）
```
<draftId>/
├── draft_content.json (+ .bak, template-2.tmp)      ← 根镜像
├── Timelines/
│   ├── project.json   {"main_timeline_id": "...", "timelines":[{"id","name":"Timeline 1",...}],
│   │                   "config":{"color_space":-1,"render_index_track_mode_on":false,"use_float_render":false}}
│   └── <timelineId>/draft_content.json, template.tmp, attachment_editing.json{"draft_operation_log":[]},
│                    common_attachment/attachment_script_video.json, attachment_pc_timeline.json
├── timeline_layout.json  {"dockItems":[{"timelineIds":[...],"timelineNames":[...]}],"layoutOrientation":1}
├── draft_agency_config.json {"is_auto_agency_enabled":false,"is_single_agency_mode":false,"use_converter":false,"video_resolution":720}
└── performance_opt_info.json {"manual_cancle_precombine_segs":null,"need_auto_precombine_segs":null}
```
- CapCut 9.2.8 beta (mac) 读取的是 `Timelines/<main_timeline_id>/draft_info.json`，根目录文件只是旧版镜像；CapCut 8.4 打开时会根据根文件自动生成 `Timelines/`。[第三方：capcut-cli version-support.md]
- 剪映 11.4 (mac)：主文件是 `draft_info.json`，引擎逐个文件探测明文/密文（符号 `DraftIO::getUriCipherTypeStatically`），打开后原地升级成加密格式并补出 `Timelines/`。[第三方：pyJianYingDraft PR #198 https://github.com/GuanYixuan/pyJianYingDraft/pull/198]
- 剪映 9.0 (Windows)：工具写出的明文 `draft_info.json` 能被接受，关闭时 App 把其余镜像改写成加密 blob。[第三方：capcut-cli version-support.md]

### 2.3 顶层字段 [确认-开源样例]
`pyJianYingDraft/assets/draft_content_template.json`（剪映 5.9）的顶层 key：
```
canvas_config{width,height,ratio}, color_space, config{...}, cover, create_time, duration(µs), extra_info,
fps(30.0), free_render_index_mode_on, group_container, id(UUID), keyframe_graph_list[], keyframes{8 桶},
last_modified_platform{}, platform{app_id:3704, app_source:"lv", app_version:"5.9.0", os:"windows"},
materials{}, mutable_config, name, new_version("110.0.0"), relationships[], render_index_track_mode_on,
retouch_cover, source:"default", static_cover_image_path, time_marks, tracks[], update_time, version(360000)
```
CapCut 8.x 还多出 `draft_type`、`is_drop_frame_timecode`、`function_assistant_info`、`lyrics_effects`、`uneven_animation_template_info`、`smart_ads_info`、`path`；`platform` 里还有 `device_id`、`hard_disk_id`、`mac_address`、`os_version`。[第三方 capcut-cli-david]

`config` 里有：`maintrack_adsorb`（主轨磁吸）、`subtitle_recognition_id` / `subtitle_taskinfo` / `lyrics_recognition_id`（云端识别任务）、`multi_language_*`、`export_range`、`combination_max_index`、`sticker_max_index`、`adjust_max_index`、`material_save_mode`、`video_mute`。

`version: 360000` 是加载门槛整数；`new_version` 是可读版本号（剪映 5.9 是 `"110.0.0"`，剪映 10.2 是 `"103000"`，CapCut 8.2/8.4 是 `"167.0.0"` / `"169.0.0"`）。

### 2.4 tracks / segments
- 轨道类型 `TrackType`：`video`, `audio`, `effect`, `filter`, `sticker`, `text`, `adjust`（调节轨，只在导入时出现）。[确认：pyJianYingDraft `track.py`]
- 轨道 JSON：`{"attribute": int(mute), "flag": 0, "id", "is_default_name", "name", "segments": [], "type"}`。flag 0 表示主轨/普通轨，3 表示副轨（第三方观察）。
- **时间单位全部是微秒**（`SEC = 1000000`，`time_util.py`）。
- 片段公共字段（`BaseSegment.export_json`）：`id`, `material_id`, `target_timerange{start,duration}`, `common_keyframes[]`, `keyframe_refs[]`, `enable_adjust`, `enable_color_curves`, `enable_color_wheels`, `enable_lut`, `last_nonzero_volume`, `reverse`, `track_attribute`, `track_render_index`, `visible`, `render_index`。
- 媒体片段再加：`source_timerange`（素材内截取区间，贴纸/文本/特效为 null）、`speed`、`volume`、`extra_material_refs[]`、`is_tone_modify`（变速是否变调）。
- 可视片段再加：`clip{alpha, flip{horizontal,vertical}, rotation(度), scale{x,y}, transform{x,y}}`，坐标以画布中心为原点、以半个画布宽/高为单位，Y 轴向上；`uniform_scale{on,value}`；视频还有 `hdr_settings{intensity,mode,nits}`。
- 层级：`script_file.dumps()` 把 `render_index` 设成轨道序号；Z 序 = 轨道顺序 + `render_index` / `track_render_index`。
- CapCut 8.x 的片段一共有 49 个字段，额外包括 `render_timerange`、`is_loop`、`intensifies_audio`、`lyric_keyframes`、`template_id`、`template_scene`、`is_placeholder`、`raw_segment_id`、`group_id`、`responsive_layout`、`caption_info`、`enable_hsl`、`enable_video_mask`、`enable_mask_stroke/shadow` 等。[第三方 capcut-cli-david 01]

### 2.5 materials 分类 [确认-开源样例]
剪映 5.9 / 10.2 模板中的 45 个数组 key：
```
ai_translates, audio_balances, audio_effects, audio_fades, audio_track_indexes, audios, beats, canvases, chromas,
color_curves, digital_humans, drafts, effects, flowers, green_screens, handwrites, hsl, images, log_color_wheels,
loudnesses, manual_deformations, masks, material_animations, material_colors, multi_language_refs, placeholders,
plugin_effects, primary_color_wheels, realtime_denoises, shapes, smart_crops, smart_relights, sound_channel_mappings,
speeds, stickers, tail_leaders, text_templates, texts, time_marks, transitions, video_effects, video_trackings,
videos, vocal_beautifys, vocal_separations
```
CapCut 8.x 共 54 个，新增 `common_mask`、`placeholder_infos`、`audio_pannings`、`audio_pitch_shifts`、`hsl_curves`、`manual_beautys`、`video_radius`、`video_shadows`、`video_strokes`、`digital_human_model_dressing`。[第三方]

各类说明：
- `videos[]`：`type: "video" | "photo"`，`path`，`duration`，`width`/`height`，`crop`（四角归一化坐标）、`crop_ratio`、`crop_scale`，`material_name`，`local_material_id`，`check_flag`。CapCut 8.x 还缓存了大量算法产物路径：`reverse_path`（倒放预生成）、`intensifies_path`、`cartoon_path`、`stable{stable_level, matrix_path}`（防抖矩阵）、`matting{path, strokes,...}`（AI 抠像）、`video_algorithm{}`、`smart_motion`、`surface_trackings`、`corner_pin`。[确认 pyJianYingDraft / 第三方 capcut-cli-david 02]
- `audios[]`：`type: "extract_music"`，`music_id`，`wave_points[]`（预计算的波形峰值），`path`，`duration`，`copyright_limit_type`。
- `texts[]`：`content` 字段是**内嵌 JSON 字符串** `{"text":..., "styles":[{"range":[a,b], "fill":..., "font":{"id","path"}, "strokes":[], "shadows":[], "effectStyle":{"id","path"}, "size", "bold", ...}]}`。`range` 以 UTF-16 code unit 计数（第三方实测）。外层还有约 90 个旧版镜像字段，以及识别相关的 `recognize_task_id`、`words{start_time[],end_time[],text[]}`（ASR 逐字时间）、`text_to_audio_ids`（TTS）。`type: "subtitle" | "text"`。
- 外围素材（每个片段一份，1:1 对应）：`speeds{curve_speed, mode, speed}`、`canvases{type: canvas_color | canvas_blur, blur, color}`、`sound_channel_mappings`、`material_colors`、`loudnesses`、`vocal_separations`、`placeholder_infos`、`audio_fades{fade_in_duration, fade_out_duration}`、`material_animations{type: "sticker_animation", animations:[{type: in/out/group/loop, start, duration, resource_id, id(=effect_id)}]}`。
- 资源型素材：`effects`（滤镜，`type: "filter"`，也装文字气泡/花字）、`video_effects`（`type: "video_effect" | "face_effect"`，`apply_target_type` 0=片段、2=全局，`render_index: 11000`，`adjust_params[]`）、`transitions{duration, is_overlap}`、`masks` / `common_mask`（新版只读 `common_mask`；第三方称引擎类名为 `MaterialCommonMask`）、`chromas`（色度抠图 v2）、`stickers{resource_id, sticker_id}`、`audio_effects`（场景音 / 音色 / 声音成曲）。

### 2.6 extra_material_refs（片段→外围素材）
- pyJianYingDraft 的做法：创建片段时先放入 `speed.global_id`，之后每加一个动画、特效、滤镜、蒙版、转场、背景、色度抠图、淡入淡出，就把对应 id **追加**进去。剪映能接受这种顺序。[确认-开源代码]
- capcut-cli-david 声称 CapCut 8.x UI 输出的顺序是**按位置固定**的：video `[speeds, placeholder_infos, (transition | mask), canvases, sound_channel_mappings, material_colors, (loudnesses), vocal_separations]`；audio `[speeds, placeholder_infos, sound_channel_mappings, vocal_separations]`；text / sticker `[material_animations]`；effect / filter `[]`。[第三方，与上一条矛盾，说明引擎多半是按 id 查 materials 再按类型归类，"按位置"只是 UI 输出的习惯——推断]

### 2.7 关键帧
- `segment.common_keyframes[] = {id, material_id:"", property_type, keyframe_list:[{id, curveType:"Line"|"EaseIn"|"EaseOut"|"FreeCurveInOut", graphID, left_control{x,y}, right_control{x,y}, time_offset(µs，相对片段起点), values:[v], string_value}]}`。
- `property_type` 取值：`KFTypePositionX/Y`、`KFTypeRotation`、`KFTypeScaleX/Y`、`UNIFORM_SCALE`、`KFTypeAlpha`、`KFTypeSaturation`、`KFTypeContrast`、`KFTypeBrightness`、`KFTypeVolume`。[确认 pyJianYingDraft keyframe.py]
- 贝塞尔缓动：`graphID` 指向顶层 `keyframe_graph_list[]{id, resource_id, resource_name:"Cubic Out", graph_points[]}`，曲线预设本身也是云端资源。[第三方]
- 顶层 `keyframes{videos,audios,texts,stickers,filters,adjusts,handwrites,effects}` 是旧版分桶结构，现在一般都为空。

### 2.8 效果资源引用与缓存
- 每个目录资源都有三元组 `(resource_id, effect_id, md5)`，例如滤镜 `EffectMeta("1980", False, "7127828208690433311", "7127828208690433311", "d3595847ee...")`，蒙版 `MaskMeta("线性","line","6791652175668843016","636071","1f467b8b...")`，动画 `AnimationMeta("上下抖动", False, 0.5, "6739418390030455300", "431652", "bff95de5...")`。[确认 pyJianYingDraft `metadata/*.py`]
- 写入草稿时**不导出 `path` / `request_id`**；剪映打开草稿时会自动下载没有缓存的动画、特效、转场，超时就显示"xx 加载失败"。[确认 pyJianYingDraft video_segment.py 注释 + README]
- 字体 / 花字在 text content 里以 `font{id,path}` / `effectStyle{id,path}` 引用。
- NLE SDK 里对应的是 `NLEResourceNode{resourceId, resourceFile, resourceTag: NORMAL | AMAZING, resourceType}`，外加 `NLELokiResourceProtocol` / `NLEUrlResourceProtocol` / `NLEResourceSynchronizer{fetch, push}`。[确认 NLEMediaJava aar]。**[推断]** "Loki" 是字节的特效资源下发平台；本地缓存目录用 resource_id + md5 做键。

### 2.9 加密
- [第三方] 剪映 6.0+ 把 `draft_content.json` 存成加密的二进制，CapCut 国际版不加密。本笔记不讨论加密细节。
- [确认-开源代码] pyJianYingDraft `draft_content_loader.py` 先尝试 UTF-8 JSON，失败后交给用户提供的 `fallback_loader`。README 写明"新版剪映中的 draft_content.json 往往不是可直接读取的明文 JSON"，剪映 7+ 隐藏了 UI 控件，所以自动导出只支持到 6.x。
- **[推断]** 加密的目的是保护模板和付费素材，阻止第三方批量生产；这种做法把可写和可读分开：写入明文仍能被接受，读取被阻止。

### 2.10 draft_meta_info.json [确认-开源样例]
`draft_id, draft_name, draft_fold_path, draft_root_path, draft_cover, draft_materials:[{type:0..8, value:[]}], draft_cloud_template_id, draft_cloud_purchase_info, draft_enterprise_info{...}, draft_is_ai_shorts, draft_is_from_deeplink, tm_duration, tm_draft_cloud_modified, draft_timeline_materials_size(10.x)` 等，即"草稿列表、素材库、云草稿 / 模板 / 购买"信息。

### 2.11 JSON 骨架（综合 pyJianYingDraft、CapCutAPI、capcut-cli-david 整理；字段已裁剪）
```jsonc
{
  "id": "91E08AC5-22FB-47e2-9AA0-7DC300FAEA2B",
  "version": 360000, "new_version": "110.0.0",
  "platform": {"app_id": 3704, "app_source": "lv", "app_version": "5.9.0", "os": "windows"},
  "last_modified_platform": {"app_id": 3704, "app_source": "lv", "app_version": "5.9.0", "os": "windows"},
  "canvas_config": {"width": 1920, "height": 1080, "ratio": "original"},
  "fps": 30.0, "duration": 10000000,              // µs = max(segment.target_timerange.end)
  "color_space": 0, "render_index_track_mode_on": false, "free_render_index_mode_on": false,
  "config": {"maintrack_adsorb": true, "subtitle_recognition_id": "", "subtitle_taskinfo": [],
             "lyrics_recognition_id": "", "export_range": null, "combination_max_index": 1, "video_mute": false},
  "keyframe_graph_list": [],
  "keyframes": {"videos": [], "audios": [], "texts": [], "stickers": [], "filters": [], "adjusts": [], "handwrites": [], "effects": []},
  "relationships": [], "time_marks": null, "group_container": null,
  "materials": {
    "videos": [{"id": "M_V1", "type": "video", "path": "D:/a.mp4", "duration": 30000000, "width": 1920, "height": 1080,
                "material_name": "a.mp4", "crop": {"upper_left_x": 0, "upper_left_y": 0, "upper_right_x": 1, "upper_right_y": 0,
                "lower_left_x": 0, "lower_left_y": 1, "lower_right_x": 1, "lower_right_y": 1}, "crop_ratio": "free", "crop_scale": 1.0,
                "check_flag": 63487, "category_name": "local", "local_material_id": "",
                /* CapCut 8.x: reverse_path, stable{}, matting{}, video_algorithm{} ... */}],
    "audios": [{"id": "M_A1", "type": "extract_music", "path": "D:/bgm.mp3", "duration": 60000000, "music_id": "M_A1",
                "wave_points": [], "check_flag": 3}],
    "texts": [{"id": "M_T1", "type": "text",
               "content": "{\"text\":\"Hello\",\"styles\":[{\"range\":[0,5],\"size\":8,\"fill\":{\"content\":{\"render_type\":\"solid\",\"solid\":{\"color\":[1,1,1]}}},\"font\":{\"id\":\"<resource_id>\",\"path\":\"...\"}}]}",
               "alignment": 1, "typesetting": 0, "line_max_width": 0.82, "check_flag": 7, "global_alpha": 1.0}],
    "speeds": [{"id": "S1", "type": "speed", "mode": 0, "speed": 1.0, "curve_speed": null}],
    "canvases": [{"id": "C1", "type": "canvas_color", "color": "#00000000", "blur": 0.0}],
    "sound_channel_mappings": [], "material_colors": [], "loudnesses": [], "vocal_separations": [], "placeholders": [],
    "audio_fades": [{"id": "F1", "type": "audio_fade", "fade_in_duration": 500000, "fade_out_duration": 500000, "fade_type": 0}],
    "material_animations": [{"id": "AN1", "type": "sticker_animation",
        "animations": [{"type": "in", "id": "431652", "resource_id": "6739418390030455300", "start": 0, "duration": 500000,
                        "material_type": "video", "panel": "video", "platform": "all"}]}],
    "transitions": [{"id": "TR1", "type": "transition", "effect_id": "...", "resource_id": "...", "duration": 466666, "is_overlap": true}],
    "video_effects": [{"id": "VE1", "type": "video_effect", "effect_id": "...", "resource_id": "...", "apply_target_type": 2,
                       "render_index": 11000, "adjust_params": [{"name": "effects_adjust_speed", "value": 0.5, "default_value": 0.33,
                       "min_value": 0, "max_value": 1, "parameterIndex": 0, "portIndex": 0}]}],
    "effects": [{"id": "FL1", "type": "filter", "effect_id": "7127828208690433311", "resource_id": "7127828208690433311",
                 "value": 1.0, "apply_target_type": 0, "source_platform": 1}],
    "masks": [], "common_mask": [{"id": "MK1", "type": "mask", "resource_type": "line", "resource_id": "6791652175668843016",
                 "config": {"centerX": 0, "centerY": 0, "width": 1, "height": 1, "rotation": 0, "feather": 0, "invert": false,
                            "roundCorner": 0, "aspectRatio": 1, "expansion": 0}}],
    "stickers": [], "chromas": [], "drafts": [], "beats": [], "text_templates": [], "smart_crops": [], "video_trackings": []
  },
  "tracks": [
    {"id": "TK_V", "type": "video", "flag": 0, "attribute": 0, "name": "", "is_default_name": true,
     "segments": [{
        "id": "SEG1", "material_id": "M_V1",
        "target_timerange": {"start": 0, "duration": 5000000},     // 时间线上
        "source_timerange": {"start": 2000000, "duration": 5000000}, // 素材内（受 speed 影响）
        "speed": 1.0, "volume": 1.0, "is_tone_modify": false, "reverse": false, "visible": true,
        "clip": {"alpha": 1.0, "flip": {"horizontal": false, "vertical": false}, "rotation": 0.0,
                 "scale": {"x": 1.0, "y": 1.0}, "transform": {"x": 0.0, "y": 0.0}},
        "uniform_scale": {"on": true, "value": 1.0},
        "hdr_settings": {"intensity": 1.0, "mode": 1, "nits": 1000},
        "extra_material_refs": ["S1", "C1", "AN1", "FL1", "TR1", "MK1", "F1"],
        "common_keyframes": [{"id": "KL1", "material_id": "", "property_type": "KFTypeScaleX",
            "keyframe_list": [{"id": "K1", "curveType": "Line", "graphID": "", "time_offset": 0, "values": [1.0],
                               "left_control": {"x": 0, "y": 0}, "right_control": {"x": 0, "y": 0}}]}],
        "keyframe_refs": [], "render_index": 0, "track_render_index": 0,
        "enable_adjust": true, "enable_lut": true, "enable_color_curves": true, "enable_color_wheels": true
     }]},
    {"id": "TK_A", "type": "audio", "segments": [{"material_id": "M_A1", "clip": null, "uniform_scale": null, "...": "..."}]},
    {"id": "TK_T", "type": "text", "segments": [{"material_id": "M_T1", "source_timerange": null, "...": "..."}]},
    {"id": "TK_E", "type": "effect", "segments": [{"material_id": "VE1", "extra_material_refs": [], "...": "..."}]},
    {"id": "TK_F", "type": "filter", "segments": [{"material_id": "FL_global", "...": "..."}]},
    {"id": "TK_S", "type": "sticker", "segments": []}
  ]
}
```

### 2.12 模板相关字段（剪同款在数据层的痕迹）
- 片段级：`is_placeholder`、`template_id`、`template_scene: "default"`、`raw_segment_id`；素材级：`placeholders[]`、`placeholder_infos[]`、`text_templates[]`、`texts[].caption_template_info / combo_info / sub_template_id`；元数据：`draft_cloud_template_id`、`draft_cloud_purchase_info`。[第三方/确认-样例]
- pyJianYingDraft 的"模板模式"（`template_mode.py`）：导入现有草稿作为模板，按名称或按片段替换素材，素材长度变化时的处理策略有 `ShrinkMode{cut_head, cut_tail, cut_tail_align, shrink}` 和 `ExtendMode{cut_material_tail, extend_head, extend_tail, push_tail}`，还能替换文本并重算 style range。这正好对应"剪同款 = 固定结构 + 替换槽位素材"。

---

## 3. 火山引擎 / BytePlus 剪辑 SDK（NLE SDK + VE SDK）

### 3.1 产品组成（官方文档，搜索摘要）[确认]
- **Video Editor SDK (CKOne/CK)** = `VESDK`（媒体渲染 / 编辑引擎）+ `NLE SDK`（"a non-linear editing middleware… provides a set of media editing APIs… **does not render or draw on screen**"）。Android 上先初始化 VESDK，再初始化 NLE。
- **Magic Template SDK (cutsame)** = `VESDK` + `NLE SDK` + `CutSame SDK`（模板重演 / 合成）+ `CutSameConsumer`（协议转换）。模板 SDK"只提供模板编辑所需的操作对象和 API，不含 UI"。
- 官方类比："NLEModel is a data class where all audio and video clip data is stored… understanding this class is enough to rebuild the entire video"；"NLEEditor can be understood as a project… commit, done, store, undo, redo"；"An NLETrack is a track, and an NLETrackSlot is a segment within the track… slots within one track cannot overlap"；`NLEMediaSessionPublic`（iOS 叫 `NLEInterface`）负责预览播放和合成导出；"edits don't show in preview until you commit"；"At least one track is required in a NLEModel, which is the main track"。
- 草稿："A draft is essentially a JSON string that encapsulates comprehensive information about the entire NLEModel"，用 `nle.editor.store()` / `nle.editor.restore()` 保存和恢复；设置 `nle.draftFolder` 之后资源路径可以写相对路径（资源需要拷进草稿目录）。
- 来源：https://docs.byteplus.com/en/docs/byteplus-video-editor-sdk/docs-nlesdk-overview ；…/docs-importing-in-android ；…/docs-exporting-in-android ；https://docs.byteplus.com/api/docs/byteplus-video-editor-sdk/docs-draft-module-in-ios ；…/docs-common-nletrack-and-nletrackslot-operations-ios ；…/docs-integration-guide-with-ui-android ；…/docs-quickstart-guide-android-magic-template
- 火山引擎中文站"智能视频创作 SDK（EffectOne）"：基础编辑 SDK 提供拍摄、预览编辑、轨道编辑、合成导出、草稿箱；变速 0.1x–10x；V1.4.0 支持"边导出边上传"和切后台导出；剪同款定义为"模板是可复用结构、转场、特效的单元，槽位是模板中不同时间段的组成单元"；iOS 用 `CSIFCutSameSource` 从模板路径创建、管理资源，流程是解析模板→获取槽位→填充素材→创建播放对象。来源：https://www.volcengine.com/docs/6839/129953 ；https://www.volcengine.com/docs/6839/2174979 ；https://docs.volcengine.com/docs/6839/1545016 ；https://www.volcengine.com/docs/6839/2175034

### 3.2 NLE 类层次（从公开 aar 的类名和签名整理）[确认]
来源：`library_core/libs/NLEMediaJava-release.aar`（hifive 开源 Demo，衍生自火山引擎 Demo），包 `com.bytedance.ies.nle.editor_jni`（SWIG 生成，`*JNI`、`SWIGTYPE_p_std__shared_ptr...`），native 库 `libNLEEditorJni.so` / `libNLEMediaJni.so`；C++ RTTI 显示命名空间是 **`cut::model`**（如 `N3cut5model12NLETrackSlotE`），另有 `nle::resource`、`nle::monitor`、`nle::utils`；JSON 库是 **nlohmann::json**。

```
NLENode                       getUUID/getId/getName/setEnable, extra{} & transientExtra{},
│                             toJsonString(), hash(), deepClone(), addToStage()/addToWorking()/isWorkingDirty()/
│                             getWorkingDirty():ChangeBits{NONE,PROPERTY,CHILD,EXTRA}, addListener(NLEChangeListener),
│                             collectResources()
├─ NLETimeSpaceNode           startTime/endTime/duration (µs), speed/absSpeed/rewind, layer, transformX/Y/Z,
│  │                          rotation, scale, mirror_X/Y, relativeWidth/Height(MATCH_PARENT/WRAP_CONTENT),
│  │                          measuredStart/EndTime, processor[]
│  ├─ NLEModel                tracks[], cover(NLEVideoFrameModel), canvasRatio, thousandFps, alignMode,
│  │                          getMainTrack(), getSortedTracks(), getMaxTargetEnd(), getLayerMax(), getAllResources()
│  ├─ NLETrack                mainTrack, volume, slots[], filters[](轨道级), videoEffects[](slot), timeEffect,
│  │                          cherEffect, keyframeSlots[], trackType, split(t)/splitInSpecificSlot,
│  │                          moveSlotToIndex, addSlotAtIndex/AfterSlot, getSlotByTime, timeSort, setAudioEnable
│  └─ NLETrackSlot            mainSegment(NLESegment), endTransition(NLESegmentTransition), videoAnims[],
│                             filters[], masks[], chromaChannels[], videoEffects[], noiseReductions[], audioFilter,
│                             keyframes[] (关键帧本身就是 NLETrackSlot 快照!), keyframeGraphType{LINEAR,BEZIER},
│                             addOrUpdateKeyframe(), keyframeAtTime(), pinAlgorithmFile(跟踪)
├─ NLESegment                 getResource(), getType(), getDuration()
│  ├─ NLESegmentAudio         timeClipStart/End(源区间), speed, curveSpeedPoints[] / segCurveSpeedPoints[](曲线变速),
│  │  │                       fadeIn/OutLength, volume, keepTone, changer(变声), repeatCount, avFile, reversedAVFile
│  │  └─ NLESegmentVideo      alpha, crop(NLEStyCrop), clip(NLEStyClip), canvasStyle(NLEStyCanvas), blendFile(混合模式), enableAudio
│  ├─ NLESegmentImage / GIF / Sticker(Info/Image/Text/Emoji/Subtitle/Effect) / TextTemplate / Transition /
│  │  Effect / Filter / ComposerFilter / HSLFilter / HDRFilter / AudioFadeFilter / AudioVolumeFilter /
│  │  AudioLoudnessBalanceFilter / Mask / ChromaChannel / TimeEffect / CherEffect / BrickEffect / VideoAnimation /
│  │  ImageVideoAnimation / MV / Play
├─ NLEResourceNode            resourceId, resourceFile, resourceTag{NORMAL, AMAZING}, resourceType, name, duration, w/h, isLocal()
│  ├─ NLEResourceAV           hasAudio, fileInfo, reverseResourceFile
│  └─ NLEResourceGIF
└─ NLECommit                  model 快照 + description + timeStamp + version
NLEBranch                     commits[], head, MAX_COMMIT_COUNT, resetToPrev/Next(n), goTo(id), trim, collectResources
NLEEditor                     setModel/getModel/getStageModel, commit(), done([msg]), undo(n)/redo(n), canUndo/Redo,
                              getBranch(), goTo(commitId), trim(maxRedo,maxUndo), store()/restore(json),
                              exportEditor/importEditor, addConsumer(NLEEditorListener.onChanged), setSynchronizer
```
枚举（[确认]）：
- `NLETrackType`: NONE, AUDIO, VIDEO, STICKER, EFFECT, FILTER, IMAGE, MV, EFFECT_STICKER
- `NLEResType`: VIDEO, AUDIO, IMAGE, TRANSITION, EFFECT, FILTER, STICKER, FLOWER, FONT, SRT, ADJUST, ANIMATION_STICKER, ANIMATION_VIDEO, MASK, PIN, INFO_STICKER, IMAGE_STICKER, TEXT_STICKER, SUBTITLE_STICKER, EMOJI_STICKER, TIME_EFFECT, CHER_EFFECT, CHROMA, ANIMATION_TEXT, LYRIC_STICKER, COMPOSER, AUTOSUBTITLE_STICKER, TEXT_TEMPLATE, MIX_MODE, BUBBLE, TEXT_SHAPE, BEAUTY, SOUND, RECORD, *_MV_AUDIO, VOICE_CHANGER_FILTER, KARAOKE_USER_AUDIO, AUDIO_DSP_FILTER, DRAFT, ...
  - 和剪映草稿 `materials` 分类几乎一一对应（flower=花字、text_template、mix_mode、chroma、mask、font 等），这是同源的旁证。[推断]

### 3.3 编辑事务模型（commit / done）[确认 + 推断]
- Demo 封装（hifive `editor-core/.../NLEEditorHelper.kt`）：
  ```kotlin
  fun NLEEditor?.commitDoneWithMsg(isDone: Boolean = true, msg: String? = null) {
      this?.commit()                       // 把 working 改动提交到 stage → 触发预览刷新
      if (isDone) { if (msg == null) this?.done() else this?.done(msg)   // 生成一条历史 NLECommit（类似 git commit -m）
                    this?.trim(MAX_REDO=500, MAX_UNDO=500) }
  }
  ```
  拖动、手势这类连续操作只调 `commit()`（实时预览，不进历史）；松手时调 `done(msg)`，生成一个 undo 点。`transientDone()` = commitDone + `trim(0,0)`。
- **[推断]** NLENode 有 `addToStage` / `addToWorking` / `isWorkingDirty` / `ChangeBits`，NLEEditor 有 `getStageModel`，说明采用"working 树 → stage 树 → commit 快照"的三层：UI 改 working；commit 时按脏位把变化同步到 stage 并通知 consumer；done 时把 stage 的深拷贝作为 NLECommit 压进 NLEBranch。undo/redo 就是在 branch 上移动 head，然后把模型整体换掉（`goTo(id)`）。

### 3.4 NLE → VE 的桥接（预览）[确认类名 / 推断流程]
- `com.bytedance.ies.nlemediajava.NLE2VEEditor(String, SurfaceView)`：持有 `com.ss.android.vesdk.VEEditor`；方法有 `setDataSource(NLEModel)`、`prepare()`、`update(NLEModel, boolean)`、`refreshCurrentFrame()`、`createVE()`。
- `NLEDiffUtils.diffNodes(old, new) → List<NodeChangeInfo{CHANGE_TYPE_ADD | UPDATE | DELETE, oriNode, newNode}>`：**增量 diff 后只把变化翻译成 VE 调用**。
- `NLEIdVEIndexMapper`：维护 NLE 节点 UUID 和 VE 内部"track index / clip index / filter index"之间的映射（`addMainVideoClipIndex`、`setAudioTrackIndex`、`setVideoFilterIndex`、`setEffectTrackIndex` …）。可见 VEEditor 本身是**命令式、按索引寻址**的 API，NLE 在它之上提供声明式模型。
- `INLEPlayer`：`setDataSource / prepare / play / pause / seek(ms, SeekMode) / seekDone / refreshCurrentFrame / getImages(int[] times, w, h, listener)`（抽帧缩略图）/ `startStickerAnimationPreview`。
- 官方 Android 流程（BytePlus 文档摘要）：创建 session 时传入 SurfaceView → editor 监听器在每次变更时重新 setDataSource → 第一次设置 model 后调用 prepare。

### 3.5 导出（compile）参数 [确认 aar 签名]
`NLEVideoEncodeSettings`：`compileType{MP4, GIF, HIGH_GIF}`、`outputSize`、`fps`、`gopSize`、`bps`、`bitrateMode{ABR, CRF, QP, VBR}`、`swCRF` / `swQP` / `swPreset` / `swMaxrate`、`encodeStandard{H264, **ByteVC1**, MPEG4}`、`encodeProfile{BASELINE, MAIN, HIGH}`、`hasBFrame`、`resizeMode` / `resizeX` / `resizeY`、`rotate`、水印（`NLEWatermarkParam`，可以单独设水印版本的编码参数）、**remux 优化**（`enableRemuxVideo`、`enableByteVCRemuxVideo`、`mOptRemuxWithCopy`、`enableRemuxVideoForRotation/Shoot`，即没有编辑时直接拷贝码流不重编码）、`mReEncodeOpt`、`mKeyFramePoints`、`enableUploadingWhileCompile`（边导出边上传）、`startTime` / `endTime`、`enableInterLeave`。
`NLEVideoCompileEncodeSettings`：`useHWEncoder`、`enableHwBufferEncode`、`isSupportHWEncoder`、`NLEVideoHWEncodeSettings{bitrate, profile, gop, codecType{TE_CODEC_TYPE_H264, TE_CODEC_TYPE_BYTE_VC1}, sd/hp/fullHd/2K/4K/高帧率/转场 bitrate_ratio}`、`NLEVideoSWEncodeSettings`。
→ 码率按分辨率档位和场景（含转场的片段）乘系数，是自适应码率策略。[推断]
Demo 导出：`player.compile(outFilePath, outWav=null, VideoCompileParam(fps, width, height, resizeMode=4, waterMask, mCodec), ICompileListener{onCompileProgress, onCompileDone, onCompileError})`（hifive `editor-core/.../manager/MediaManager.kt`）。

### 3.6 剪同款（Magic Template / CutSame）[确认-官方摘要 + 推断]
- Android：`CutSameSolution.init(context, authorityConfig, templateFetcherConfig, effectFetcherConfig)` → `getCutSameSource(sourceUrl)` → `CutSameSolution.createCutSamePlayer(videoSurfaceView, sourceUrl)` → 替换槽位 → `compileNLEModel(outputVideoPath, param, listener)`。模板资源可以是 zip 或解压后的目录（两者都给时优先用 zipPath）。模板物料包里有 `type.json`（分类）、`id.json`（单模板描述）和每个模板一个目录。
- **[推断]** `CutSameConsumer` 的"协议转换"是把剪映模板协议（就是剪映草稿 / 模板 JSON：tracks/segments/materials + `is_placeholder` 槽位）转换成 NLEModel，再交给 NLE/VE 重演和合成。模板本质上是"锁定了结构的草稿 + 可替换槽位"，客户端替换 `material.path` 和文本，然后按 ShrinkMode/ExtendMode 一类规则对齐时长，最后在本地渲染。

---

## 4. VE SDK 引擎内部（基于公开 aar 的库名和符号）[确认-名字 / 推断-连线]

### 4.1 native 库（`vesdk-11.3.0.103-tob.aar`，arm64 大小）
| 库 | 大小 | 角色 |
|---|---|---|
| `libttvesdk.so` | 8.3 MB | VE 剪辑/录制引擎主体（构建路径 `.../ve/CaptainVESDKAndroidModulefy/ttvebase/...`、`vefoundation`） |
| `libeffect.so` | 28.6 MB | Effect SDK（构建路径 `.../tob/cvlab_effect_sdk/runtime/.../AmazingEngine/...`），里面有 `AmazingGLES31Filter`、`AmazingMetalFilter` |
| `libAGFX.so` | 0.55 MB | 图形抽象层，字符串 `AGFX_Device`、`OpenGL`、`OpenGLES2/30/31/32`、`Vulkan`，命名空间 `AmazingEngine` |
| `libgaia_lib.so` | 0.97 MB | 基础库（AmazingEngine 的 RefBase、FileReader、Timer） |
| `libttffmpeg.so` | 4.0 MB | 字节 FFmpeg 分支：字符串 `FFmpeg version 3.3.2`、`ByteVC1SPS`（HEVC 族解码集成在 libavcodec 中）、`libmp3lame` |
| `libByteVC1_dec.so` | 0.4 MB | ByteVC1（字节自研 H.265/HEVC 编码实现）解码器 |
| `libbytevc0.so` | 0.58 MB | [推断] ByteVC0 = 字节 H.264 软编/解码器 |
| `libbytenn.so` | 1.36 MB | ByteNN 端侧推理引擎 |
| `libaudioeffect.so` | 4.8 MB | 音频效果：字符串 `SAMI`、`MAMMON`、`DenoiseModel`、`PitchTempoAdjuster::Impl::formantShiftChunk`（变速不变调 / 共振峰） |
| `libyuv.so`, `libc++_shared.so` | | 色彩空间转换 / STL |

Java 层主要包：`com.ss.android.vesdk`（`VEEditor`、`VEEditorModel`、`VETimelineParams`、`VECurveSpeedUtils`、`VERTAudioWaveformMgr`、`VECompileProbeResult`、`VEVideoEncodeSettings`、`VEOptBitrate` …）、`com.ss.android.ttve.mediacodec`（`TEMediaCodecDecoder`、`TEAvcEncoder`、`TEAudioHwDecoder/Encoder`、`HwFrameExtractor*`、`AJMediaCodecRank`）、`com.ss.android.ttvecamera`、`com.bytedance.labcv.effectsdk` / `com.bef.effectsdk`（Effect SDK 的 Java 层）。
同一个 Demo 的 `app/build.gradle` 有 `pickFirst 'lib/*/libttffmpeg.so'`，说明 ttffmpeg 被播放器和 VE 等多个 SDK 共享。

### 4.2 引擎是"图 + 单元"的数据流架构 [确认-符号名 / 推断-连线]
`libttvesdk.so` 中的类名：
- 引擎/模型：`TEMediaEngine`、`TEMediaTimeline`、`TEMediaClip`、`TEThreadPool`
- 图：`TEEditorGraph`、`TEPreviewGraph`、`TECompileGraph`、`TEParallelCompiler`、`TEGetFrameGraph`、`TEAudioGraph`、`TEBingoGraph`（Bingo = 卡点/MV 算法？推断）、`TERecorderGraph`
- 视频单元：`TEDecodeDriveUnit`、`TEImageReaderUnit`、`TEMattingReaderUnit`、`TEEffectInputFilterUnit`、`TEAmazingFilterProcessUnit`、`TEFilterProcessWithCacheUnit`、`TEStickerEffectFilterUnit`、`TEBlendUnit`、`TETransformUnit`、`TEGPUCropWithNodeUnit`、`TESmartTransitionUnit`、`TEMattingProcessUnit`、`TEEffectAlgorithmUnit`、`TEFaceDetectUnit`、`TEBorderDetectUnit`、`TEAdjustPtsUnit`、`TEFrameSyncUnit`、`TEVideoDisplayUnit`、`TEReadPixelsUnit`、`TEExtractFrameUnit`/`Sink`、`TECompileSinkUnit`、`TEEncodeWriteUnit`、`TEAsyncRunUnit`
- 音频单元：`TEAudioDecodeDriveUnit`、`TEAudioDecodeReaderUnit`、`TEAudioSpeedUnit`、`TEAudioSpeedWithSmoothPtsUnit`、`TEAudioSpeedAdjustableUnit`、`TEAudioAECUnit`、`TEAudioEncodeUnit`、`TEAudioSLESPlayUnit`（OpenSL ES 输出）、`TEOpenSLAudioEngine`
- 缓存/IO：`TEDemuxCachePool`、`TECoreFrameBufferCache`、`TEOpenGLImageFrameAllocator`、`TEFFAudioReader`、`TEMediaWriter`、`TEInterleaveMediaWriter`、`TESepMediaWriter`、`TEOnlyAudioWriter`、`TEAACHwEncoder`、`TEMediaCodecDecLib`、`TEMediaCodecDecAsyncJni`、`TEFFmpegMediaCodecVideoGenerator`、`TEMediacodecVideoImageGenerator`

`VEEditor`（Java）方法中能反映工程优化的：`enableMultiThreadDecode`、`enableSeekAndPreloadOpt`、`enableOptPlayBackDropFrame`、`setDropFrameParam`、`enableFirstFrameOpt`、`setMaxVideoReaderLimits` / `setMaxSoftWareReaderCount` / `setMaxAudioReaderLimits`（限制并发解码器数量）、`setTexturePoolLimit`、`setImageBufferLimit`、`compileProbe` + `PROBE_MODE_{HW,SW,SW_HW}`（导出前探测硬编能力）、`isEnableRemuxVideo` / `getRemuxErrorCode`、`genReverseVideo`（倒放预生成）、`getImages` / `beginGenVideoFrames` / `cancelGetVideoFrames`（缩略图）、`excAICutOutTask` / `getClipMattingProgress` / `setUseLargeMattingModel`（AI 抠像）、`genSmartCutting`、`setMVAudioBeatAlgorithmResult`（节拍 / 卡点）、`detectAudioLoudness` / `addLoudnessFilter` / `addAudioDRCFilter` / `addAudioCleanFilter`、`addFFmpegPitchTempo` / `addPitchTempo`、`enableHDRSetting` / `enableDisplayP3Render`、`enableEffectAmazing`、`seekIFrame`、`seekWithSpeed`、`setTrackDurationType{Fixed, FollowMax, FollowMin}`、`addTimeEffect`（时间特效：重复 / 慢动作 / 倒放）。

### 4.3 硬件编解码
- Android：MediaCodec（`TEMediaCodecDecoder`、`TEMediaCodecDecAsyncJni`、`HwFrameExtractor`），FFmpeg 负责解封装和软解兜底（`TEFFmpegMediaCodecVideoGenerator`）。[确认-类名]
- iOS / mac：官方只说"借助苹果原生框架完成音视频的硬解码与编码"（字节招聘知乎回答）。**[推断]** 就是 VideoToolbox / AVFoundation。
- Windows：沙箱报告里有 `ffmpeg.exe` 和 `videoeditor.dll`；在 Wine 下需要 DXVK（D3D→Vulkan）才能运行（capcut-linux）。**[推断]** Windows 端渲染或 UI 使用 Direct3D 11（Qt 6 Quick 在 Windows 上默认的 RHI 后端也是 D3D11，所以 DXVK 的需求可能来自 UI 而不是引擎）；硬解可能走 D3D11VA / DXVA / NVDEC，没有找到公开证据。
- 播放器侧（点播 SDK `TTVideoEngine`，与抖音、西瓜"同样的播放内核"）：硬解失败回落到软解，并按机型下发策略；硬解初始化和解封装并行，首帧减少 80–120ms；`TTVideoEngineCodecStrategyUtil` 用来判断设备是否在 H.265 硬解白名单中。来源：https://developer.volcengine.com/articles/7240373081837928486 ；https://docs.volcengine.com/docs/4/67627 ；https://github.com/volcengine/VEVodDemo-android （`ttsdk-player_{premium,standard,lite}`、扩展 `super_resolution` → `ttsdk-ttbmf_lite`、`abr`、`pcdn`）。

### 4.4 编码器 / 自研 codec
- `NLE_ENCODE_STANDARD = {H264, ByteVC1, MPEG4}`，HW 设置里有 `TE_CODEC_TYPE_BYTE_VC1`。[确认] 导出可以选 H.265（字节品牌名叫 ByteVC1）。
- BVC 系列：BVC1 在 MSU 2020 获多项第一；BVC（H.266/VVC 软编）；BVC1S 屏幕内容编码。来源：https://zhuanlan.zhihu.com/p/365065745 ；https://www.163.com/tech/article/GM9H3TPQ00097U7R.html 。**[推断]** 剪映导出 HEVC 时可能使用自研 ByteVC1 软编，或者优先硬编。
- ttffmpeg：Maven 上有 `com.bytedanceapi:ttsdk-ttffmpeg`（TTSDK）和 `com.ss.ttm.gsdk.transplanted:ttffmpeg`。来源：https://mvnrepository.com/artifact/com.ss.ttm.gsdk.transplanted/ttffmpeg ；https://mvnrepository.com/artifact/com.bytedanceapi/ttsdk-ttplayer/1.46.2.13 。

---

## 5. 桌面端（剪映专业版 / CapCut PC）

| 观察 | 等级 | 来源 |
|---|---|---|
| CapCut.exe（3.2.0.1106）从 `AppData\Local\CapCut\Apps\<ver>\` 运行，加载 `qt6core.dll`、`qt6qml.dll`、`qt6quick.dll`、`qt6qmlmodels.dll`、`videoeditor.dll`、`effect.dll`、`audioeffect.dll`；目录里有 `ffmpeg.exe` 和 `JYPacket` 子目录 | [确认-公开沙箱报告，搜索摘要] | https://www.joesandbox.com/analysis/1383636/0/html |
| CapCut 7.1 二进制中有 `VECreator` / `VECreator.dll` 字符串；论坛提到依赖 `ttvideoeditor.dll` | [第三方] | https://hybrid-analysis.com/sample/dccca226e13bfaf833b7df6c0abc7cf81f3d039318cee56014027a3343e73ad4/69019fcfcb70141db30f2f42 ；capeditcut 论坛 |
| Linux/Wine 运行方案需要 DXVK（D3D），并设置 Qt Quick 环境变量 `QSG_RENDER_LOOP=basic`、`QML_DISABLE_DISK_CACHE=1`；业务逻辑在 `VECreator.dll` | [第三方] | https://github.com/ios7jbpro/capcut-linux |
| `draft_settings` 是 `[General]` INI 格式 | [确认-样例] → **[推断]** 由 Qt `QSettings(IniFormat)` 写出 | CapCutAPI `template_jianying_10_2/draft_settings` |
| 代理剪辑：草稿 / 全局"代理模式"，720p / 540p，不影响导出；对应 `draft_agency_config.json{is_auto_agency_enabled, video_resolution:720}` | [确认-用户文档 + 样例] | https://zhuanlan.zhihu.com/p/717793154 ；https://jingyan.baidu.com/article/0964eca21f7aa3c385f536ba.html |
| 预合成：`performance_opt_info.json{need_auto_precombine_segs, manual_cancle_precombine_segs}` | [确认-样例] → [推断] 对复杂片段做后台预渲染缓存 | CapCutAPI 模板 |
| 多时间线、Dock 布局（`timeline_layout.json`） | [确认-样例] | 同上 |
| 自动导出在剪映 7+ 失效（UI 控件被隐藏，uiautomation 抓不到） | [确认-README] | pyJianYingDraft README |

**[推断] 桌面架构：** Qt 6（QML / Qt Quick）做 UI 壳 → `VECreator.dll`（桌面业务和编辑逻辑，大概率包含 NLE / 草稿 `DraftIO`）→ `videoeditor.dll` / `ttvideoeditor.dll`（VE 引擎，对应 Android 的 libttvesdk）→ `effect.dll`（Effect SDK / AmazingEngine）+ `audioeffect.dll`。也就是"核心 C++ 多端共享，UI 按平台各写一套"。另外，CSDN 上流传的"剪映用 Uni-App UTS 做跨平台"一类说法没有依据，不采信。

---

## 6. Web 端（CapCut Web / 剪映网页版）

- [确认-官方案例，搜索摘要] web.dev《CapCut boosts organic traffic by 83%…》（约 2024-02）：
  - "Most of CapCut's editing engine is written in C++… use Emscripten to port the application to a desktop web version"，与原生代码共享；
  - 迁移了 100 多万个视频和图文模板；
  - WebAssembly SIMD 比非 SIMD 方案快近 300%；
  - WebCodecs 用于硬件加速编解码，音视频处理速度提升近 300%，支持多路 4K 同时播放；格式包括 H264 / HEVC / VP8 / VP9 / AV1；"即使是 SIMD 优化的软件解码器，同时解码多轨也很耗电"。
  - 来源：https://web.dev/case-studies/capcut
- [第三方] 面试者对剪映 Web 编辑页做性能分析，发现首屏在 WASM 资源上耗时较长（https://juejin.cn/post/7208451786964598841）。
- **[推断，未找到公开证据]** Emscripten 的 pthread 依赖 SharedArrayBuffer，因此需要 COOP/COEP 跨源隔离；渲染大概率是 WebGL（Emscripten GL 映射到 AGFX 的 GLES 后端），WebGPU 不确定；素材缓存可能用 OPFS 或 IndexedDB。都需要实测核实（DevTools 的 Network、Application 面板）。
- 火山引擎"视频剪辑 Web SDK"（2025-10 发布，VOD 产品线）：前端只负责 UI（时间轴、素材库、预览），后端用 `CreateProject` / `UpdateProject` 保存云端工程草稿，`SubmitDirectEditTask(Sync/Async)` 在云端渲染。素材必须放在 VOD（Vid 模式）。这是云剪辑方案，**不能等同于 CapCut Web 的端侧 WASM 方案**。来源：https://www.volcengine.com/docs/4/1903027 ；https://docs.volcengine.com/docs/4/1449692

---

## 7. 智能功能的线索

| 功能 | 线索 | 等级 |
|---|---|---|
| 智能补帧 | 字节智能创作团队的插帧方案已在抖音、剪映、西瓜落地；剪映专业版在有独显时用深度学习方案，否则复用移动端核心算法；做了模型剪枝、共享特征、在小分辨率上算光流、多尺度光流引导块搜索；端上 CPU+GPU（OpenCL / Metal 算子），约 5 倍加速 | [确认-字节技术号] https://blog.csdn.net/ByteDanceTech/article/details/126357576 ；https://developer.volcengine.com/articles/7599493643887771686 |
| 端侧推理 | ByteNN：字节自研异构推理引擎，针对 ARM、Adreno/Mali、Apple GPU 调优；VE aar 自带 `libbytenn.so` | [确认] https://developer.volcengine.com/articles/7599493604221911049 |
| AI 抠像 | VEEditor `excAICutOutTask` / `setUseLargeMattingModel`；单元 `TEMattingProcessUnit`；草稿 `videos[].matting{path,strokes}`、目录 `matting/` | [确认-类名/样例] |
| 防抖 | `videos[].stable{stable_level, matrix_path}` | [第三方] |
| 自动字幕 / 歌词 | `config.subtitle_recognition_id/taskinfo`、`texts[].recognize_task_id/words{}` → [推断] 云端 ASR 任务，返回逐字时间戳；NLE 有 `AUTOSUBTITLE_STICKER`、`LYRIC_STICKER` | [确认-字段] |
| 卡点 / 节拍 | `materials.beats[]`、`TEBingoGraph` / `TEBingoAlgorithmUnit`、`setMVAudioBeatAlgorithmResult`、`TERecordAudioBeatUnit` | [确认-名字] / [推断-用途] |
| 人声分离 / 降噪 / 响度 | `vocal_separations`、`realtime_denoises`、`loudnesses`；`DenoiseModel`、`addAudioCleanFilter`、`detectAudioLoudness`；SAMI 实时变声（CPU 单核实时，延迟约 250ms） | [确认-名字] https://zhuanlan.zhihu.com/p/549801042 |
| 曲线变速 | `NLESegmentAudio.curveSpeedPoints`、`NLECurveSpeedCalculator`、`VECurveSpeedUtils`；草稿 `speeds[].curve_speed` | [确认] |
| 画质增强 / 超分 | 火山引擎画质增强（超分、插帧、色彩增强）；播放器扩展 `super_resolution`（ttbmf_lite，BMF 端侧版） | [确认] https://github.com/BabitMF/bmf |
| 波形 / 缩略图 | `VERTAudioWaveformMgr`、`audios[].wave_points`；`getImages`、`HwFrameExtractor`、`TEGetFrameGraph` | [确认-名字] |

---

## 8. ASCII 架构图

### 8.1 分层（多端共享 C++ 内核）[确认 + 推断]
```
┌──────────────────────────── 平台 UI 层（各端独立）────────────────────────────┐
│ Android: Kotlin/Java      iOS: ObjC/Swift      PC: Qt6 QML(推断)    Web: JS/TS │
│ 时间轴控件(trackpanel)、素材面板、预览 Surface/Layer/QQuickItem/Canvas             │
└───────────────┬───────────────────────────────────────────────┬──────────────┘
                │ JNI(SWIG) / OC 绑定 / C++ 直连 / Emscripten(WASM) │
┌───────────────▼───────────────── NLE 层（C++ cut::model）───────▼──────────────┐
│ NLEModel ─ NLETrack ─ NLETrackSlot ─ NLESegment* ─ NLEResource*                 │
│ NLEEditor: working → stage(commit) → NLECommit/NLEBranch(done/undo/redo)         │
│ 序列化: nlohmann::json → 草稿 JSON (store/restore; 剪映桌面: draft_*.json + DraftIO 加解密) │
│ 资源: NLEResourceSynchronizer / Loki(特效平台) / URL 协议 → 本地缓存                  │
└───────────────┬─────────────────────────────────────────────────────────────────┘
                │ NLE2VEEditor: diff(ADD/UPDATE/DELETE) → 命令式 VE API；UUID↔VE index 映射
┌───────────────▼────────────── VE 引擎（libttvesdk / videoeditor.dll）──────────────┐
│ TEMediaEngine / TEMediaTimeline / TEMediaClip / TEThreadPool                        │
│ Graphs: TEPreviewGraph | TECompileGraph(+TEParallelCompiler) | TEGetFrameGraph | TEAudioGraph │
└──────┬────────────────┬───────────────────┬──────────────────────┬──────────────────┘
       │                │                   │                      │
┌──────▼──────┐  ┌──────▼───────┐  ┌────────▼──────────┐  ┌────────▼────────┐
│ Effect SDK  │  │ AudioEffect  │  │ Codec/IO          │  │ ByteNN          │
│ AmazingEngine│ │ SAMI/MAMMON  │  │ ttffmpeg(3.3.2分支)│  │ 端侧推理         │
│ AGFX: GL/GLES│ │ PitchTempo   │  │ ByteVC1 dec/bytevc0│  │ (抠像/人脸/节拍…) │
│ /Vulkan/Metal│ │ Denoise/DRC  │  │ MediaCodec/VT/(D3D?)│ └─────────────────┘
└─────────────┘  └──────────────┘  └───────────────────┘
```

### 8.2 预览管线（单元名来自符号，连接顺序为推断）
```
            ┌──────────── TEPreviewGraph (按播放时钟拉取) ─────────────┐
seek/play → │ TEDemuxCachePool → TEDecodeDriveUnit ──(HW MediaCodec | SW ttffmpeg/ByteVC1)
            │        │                └→ TECoreFrameBufferCache / TEOpenGLImageFrameAllocator(纹理池)
            │        ▼
            │ 每轨: TEEffectInputFilterUnit → TEAmazingFilterProcessUnit(滤镜/特效/调节/动画, Effect SDK)
            │        → TEMattingProcessUnit/TEGPUCropWithNodeUnit/TETransformUnit(clip 变换、关键帧插值)
            │        ▼
            │ TEBlendUnit(多轨按 layer/render_index 合成 + mix_mode) → TESmartTransitionUnit(转场)
            │        → 全局特效/滤镜轨 → TEAdjustPtsUnit → TEFrameSyncUnit(音画同步/丢帧)
            │        → TEVideoDisplayUnit → Surface/CAMetalLayer/Qt/Canvas
            │ 音频: TEAudioDecodeDriveUnit → TEAudioSpeedUnit(变速变调) → 音效/响度 → 混音
            │        → TEAudioSLESPlayUnit(OpenSL ES)
            └──────────────────────────────────────────────────────────┘
```

### 8.3 导出管线
```
NLEModel ──NLE2VEEditor──▶ VEEditor.compileProbe(HW/SW 能力探测)
   ▼
TECompileGraph (+TEParallelCompiler 分段并行?) : 与预览相同的解码/特效/合成单元(非实时，逐帧)
   ▼
TECompileSinkUnit → TEEncodeWriteUnit:
     视频 TEAvcEncoder(MediaCodec HW, H264/ByteVC1) | SW(x264-like/bytevc0?; CRF/QP/ABR/VBR, preset)
     音频 TEAudioEncodeUnit / TEAACHwEncoder
   ▼
TEMediaWriter / TEInterleaveMediaWriter → mp4 (可 remux 直拷：enableRemuxVideo/OptRemuxWithCopy)
   └→ enableUploadingWhileCompile(边导出边上传)；水印版本单独编码参数
```

### 8.4 编辑事务（commit / done）
```
UI 手势 ──修改──▶ working 树 (NLENode.addToWorking, ChangeBits: PROPERTY|CHILD|EXTRA)
        commit() ─▶ stage 树(getStageModel) ─▶ NLEEditorListener.onChanged ─▶ NLE2VEEditor.update(diff) ─▶ 预览刷新
        done(msg) ─▶ NLECommit{model 快照, description, timestamp, version} ─▶ NLEBranch.addCommit (head 前移)
        undo()/redo() ─▶ NLEBranch.resetToPrev/Next ─▶ setModel(快照) ─▶ 全量/增量刷新
        store() ─▶ JSON 草稿；restore(json) ─▶ NLEModel
```

---

## 9. 没找到 / 待核实

- 字节官方关于"剪映整体架构 / 跨端 C++ 内核 / 桌面 UI 框架"的公开技术文章或演讲（QCon、GMTC、LiveVideoStack）：**没有找到**。桌面 Qt 6 的结论来自沙箱报告的 DLL 列表，属于间接证据。
- 剪映 / CapCut 移动端是否使用 Lynx 或 Flutter：**没有证据**（Lynx 公开说明只提到 TikTok 的搜索面板和 TikTok Studio）。https://www.infoq.com/news/2025/03/tiktok-lynx-cross-platform-apps
- CapCut Web 是否使用 WebGPU、OPFS、SharedArrayBuffer：**没有一手证据**。
- 剪映 6.0+ 草稿加密的具体算法：只有第三方"AES"的说法，本笔记有意不深入。
- Windows 端硬解 API（D3D11VA / NVDEC / QSV）：**没有证据**。
- "Timelines/ = 缩略图缓存"（capcut-cli-david 的说法）和"Timelines/ = 多时间线文档"（CapCutAPI 样例、capcut-cli 实测）相互矛盾，后者证据更强。
- `extra_material_refs` 是否"按位置"：两个来源矛盾，见 2.6。
- 无法直接访问的官方页面（docs.byteplus.com、volcengine.com、web.dev）的内容来自搜索摘要，建议人工打开核对。

---

## 10. 参考来源

**开源仓库（已 clone / 已读源码）**
- pyJianYingDraft — https://github.com/GuanYixuan/pyJianYingDraft （PR #198：https://github.com/GuanYixuan/pyJianYingDraft/pull/198）
- CapCutAPI / VectCutAPI — https://github.com/sun-guannan/CapCutAPI
- capcut-cli-david（schema 文档）— https://github.com/Davidb-2107/capcut-cli-david ；npm tarball https://registry.npmjs.org/capcut-cli-david/-/capcut-cli-david-2.5.0.tgz （`package/docs/draft-schema/*.md`）
- capcut-cli — https://github.com/renezander030/capcut-cli （`docs/version-support.md`）
- HIFIVE × 火山引擎剪辑 Demo — https://github.com/hifiveai/openmusic-short-video-android-example （`library_core/libs/vesdk-11.3.0.103-tob.aar`、`library_core/libs/NLEMediaJava-release.aar`、`versions.gradle`、`app/build.gradle`、`editor-core/src/main/java/com/ss/ugc/android/editor/core/NLEEditorContext.kt`、`.../NLEEditorHelper.kt`、`.../manager/MediaManager.kt`）
- 火山引擎点播 Demo — https://github.com/volcengine/VEVodDemo-android ；https://github.com/volcengine/VEVodDemo-iOS
- capcut-linux — https://github.com/ios7jbpro/capcut-linux
- BMF — https://github.com/BabitMF/bmf
- JianyingDraft.PY — https://github.com/notinmood/JianyingDraft.PY

**官方文档（搜索摘要）**
- BytePlus VE/NLE：https://docs.byteplus.com/en/docs/byteplus-video-editor-sdk/docs-nlesdk-overview ；https://docs.byteplus.com/en/docs/byteplus-video-editor-sdk/docs-importing-in-android ；https://docs.byteplus.com/en/docs/byteplus-video-editor-sdk/docs-exporting-in-android ；https://docs.byteplus.com/api/docs/byteplus-video-editor-sdk/docs-draft-module-in-ios ；https://docs.byteplus.com/id/docs/byteplus-video-editor-sdk/docs-common-nletrack-and-nletrackslot-operations-ios ；https://docs.byteplus.com/en/docs/byteplus-video-editor-sdk/docs-integration-guide-with-ui-android ；https://docs.byteplus.com/en/docs/byteplus-video-editor-sdk/docs-one-pager-overview-v.4.0.2 ；https://docs.byteplus.com/en/docs/byteplus-video-editor-sdk/docs-product-overview ；https://www.byteplus.com/en/product/video-editor
- BytePlus Magic Template：https://docs.byteplus.com/en/docs/byteplus-video-editor-sdk/docs-quickstart-guide-android-magic-template ；https://docs.byteplus.com/en/docs/byteplus-video-editor-sdk/docs-detailed-development-guide-android-magic-template-v.4.0.2 ；https://docs.byteplus.com/en/docs/byteplus-video-editor-sdk/docs-magic-template-materials-service-guide ；https://docs.byteplus.com/en/docs/video-editor-sdk/130-exporting-magic-template-videos-in-android
- 火山引擎：https://www.volcengine.com/docs/6839/129953 ；https://www.volcengine.com/docs/6839/2174979 ；https://docs.volcengine.com/docs/6839/1545016 ；https://www.volcengine.com/docs/6839/2175034 ；https://www.volcengine.com/docs/4/1903027 ；https://docs.volcengine.com/docs/4/1449692 ；https://www.volcengine.com/docs/4/145474 ；https://docs.volcengine.com/docs/4/67627
- web.dev CapCut 案例：https://web.dev/case-studies/capcut

**技术文章 / 其他**
- 智能插帧（字节技术团队）：https://blog.csdn.net/ByteDanceTech/article/details/126357576 ；https://developer.volcengine.com/articles/7599493643887771686
- ByteNN：https://developer.volcengine.com/articles/7599493604221911049
- 点播首帧优化：https://developer.volcengine.com/articles/7240373081837928486
- SAMI 实时变声：https://zhuanlan.zhihu.com/p/549801042
- 字节跳动招聘（知乎）剪映 PC：https://www.zhihu.com/question/394722680/answer/1677687095
- 剪映 2.0 多端草稿：https://view.inews.qq.com/a/20210912A0004U00
- 剪映 Web 性能分析（第三方）：https://juejin.cn/post/7208451786964598841
- 沙箱报告：https://www.joesandbox.com/analysis/1383636/0/html ；https://hybrid-analysis.com/sample/dccca226e13bfaf833b7df6c0abc7cf81f3d039318cee56014027a3343e73ad4/69019fcfcb70141db30f2f42
- ttffmpeg Maven：https://mvnrepository.com/artifact/com.ss.ttm.gsdk.transplanted/ttffmpeg ；https://mvnrepository.com/artifact/com.bytedanceapi/ttsdk-ttplayer/1.46.2.13
- BVC：https://zhuanlan.zhihu.com/p/365065745 ；https://www.163.com/tech/article/GM9H3TPQ00097U7R.html
- Lynx：https://www.infoq.com/news/2025/03/tiktok-lynx-cross-platform-apps
- 代理模式：https://zhuanlan.zhihu.com/p/717793154 ；https://jingyan.baidu.com/article/0964eca21f7aa3c385f536ba.html
- 招聘（剪映工具方向：剪辑、导出、素材管理）：https://www.v2ex.com/t/999439
