# 提示词使用与记录说明

本目录把**项目实际留存的提示词记录**与**按最终 v3 实现重建的可复制模板**分开。它不是完整聊天导出，也不是每次工具调用的逐字审计日志。

## 文件与使用顺序

| 文件 | 内容 | 性质 |
| --- | --- | --- |
| [MASTER_PROMPT.md](MASTER_PROMPT.md) | 可直接交给开发代理的全项目总指令 | 按最终实现重建的模板 |
| [01_CHARACTER_ASSETS.md](01_CHARACTER_ASSETS.md) | 基准、女性姿势、男性无面剪影、五指修复、白肤紫瞳 | 按最终实现重建的模板 |
| [02_CLIENT_AND_LYRICS.md](02_CLIENT_AND_LYRICS.md) | Codex 风格布局、模型工具栏、完整歌词问答、六种逐字效果 | 按最终实现重建的模板 |
| [03_STORYBOARD_AND_LYRIC_FX.md](03_STORYBOARD_AND_LYRIC_FX.md) | 剧情分段、歌词具象化、分版上色、太阳与年份 | 按最终实现重建的模板 |
| [04_CAMERA_AND_BEAT.md](04_CAMERA_AND_BEAT.md) | 23 处运镜、鼓点响应、共同坐标空间 | 按最终实现重建的模板 |
| [05_REVIEW_AND_EXPORT.md](05_REVIEW_AND_EXPORT.md) | 关键帧审核、短片、完整导出与复现检查 | 按最终实现重建的模板 |
| [06_COVERS.md](06_COVERS.md) | 四个封面方向及局部修订 | 按最终交付方向重建的模板；实际生成词另存 JSON |
| [07_ITERATION_FIXES.md](07_ITERATION_FIXES.md) | 已发生问题对应的最小修复提示词 | 根据审核结果与最终代码重建的模板 |
| [history/character-prompts.json](history/character-prompts.json) | 女性基准和姿势、猫爪五指修正的项目留存 JSON | 历史记录副本，见下文边界 |
| [history/male-prompt.json](history/male-prompt.json) | 男性契约剪影的项目留存 JSON | 历史记录副本，已移除生成机器路径 |
| [history/covers-prompts.json](history/covers-prompts.json) | 四款封面的初始生成词与最终局部修订词 | 实际生成记录，机器路径已改为逻辑占位路径 |

已有源码时，先读总指令，再只复制本轮需要的阶段。重做人物时应先提供获准使用的角色参考图，并按“基准 → 姿势 → 局部修复”顺序生成；不要一次把整个人物库和整部影片都重画。

## 什么是真实历史记录

`history/character-prompts.json` 来自制作工程留存的 `outputs/NancyLu_assets/prompts.json`，保留原有字段与文字。其 `master` 是当时保存的基准摘要；其余字段保存了对应姿势或修复的详细提示词。这个文件本身不包含每次调用的完整参数、全部参考图绑定或完整生成过程，因此不能把它称为所有工具调用的逐字日志。

`history/male-prompt.json` 来自制作工程留存的同名文件。`prompt` 正文保持原样；仅删除 `sourceGeneratedPath` 这个机器路径元数据字段。相对资源名与创建日期保留。

封面实际生成词由 [history/covers-prompts.json](history/covers-prompts.json) 收录，包括四个初始生成词与最后的局部修订词。其 `PROJECT/` 路径是原制作工程的逻辑占位；对应参考素材不一定随公开包提供，不能直接当作本地可访问路径。`06_COVERS.md` 是便于再次制作的模板，不能替代实际调用记录。不要把本目录新写的中文模板反向标成历史原话。

## 封面成图

优先推荐 [A · 参考构图](../covers/01_reference_composition.png) 作为主封面，最接近参考视频的单眼近景与三层标题。其他方向为 [B · 执行权近景](../covers/02_execution.png)、[C · Codex 对话](../covers/03_codex_dialogue.png)、[D · 猫爪 ENJOYMENT](../covers/04_enjoyment.png)。四张最终 PNG 均为原生 **1672×941、RGB**；生成词中的 1920×1080 是请求目标，实际成图尺寸以这些文件为准。

## 初始词与最终效果为何不同

最初女性图像的提示词要求蓝瞳，部分词还明确排除了紫色。后来用户把瞳色改为紫色。最终影片在 `src/nancy/asset-character.js` 内按各姿势的解剖区域，仅将虹膜蓝像素变为紫色 `#b46aef`；耳朵、手套、服装和指定像素头像不一起变色。历史词保留蓝瞳是如实记录；重新生成请用本目录模板中的**白肤、紫瞳**最终约束。

最初“全函数角色”方案后来由用户改为 ImageGen 人物资产。最终影片采用**AI 位图人物 + 程序分版/字符采样 + Canvas 客户端和图形 + WebGL2 后期**，不是整个人物由贝塞尔路径重绘。字符立绘从人物的透明遮罩与墨色采样生成，也不等于重新绘制一张独立矢量立绘。

最终白肤叠色与早期效果也不同：冰白皮肤、暗线与紫瞳从底版开始保留；三个上色阶段只处理源蓝墨的头部、服装、外侧发梢与手套细节。不能将旧版矩形遮罩导致的半身遮挡作为预期效果。

## 时间、歌词与复现边界

- 文档时间默认是歌曲时间；完整 MP4 前有 5 秒视觉片头，成片位置通常是歌曲秒数加 5。
- 句首时间来自用户提供的 129 行 LRC。字母时间按句长加权估计，并非实测逐音素对齐；需要更细时序时，应替换或细化数据，不要只修改描述。
- 130 BPM 网格用于编排；鼓点与起音效果优先读取工程已有音频特征。更换音轨需要重新校准。
- 固定种子、绝对时间可复现同一设备的任意跳转状态；跨浏览器、系统字体与显卡不承诺像素逐字节相同。
- 本目录不内嵌完整歌词或音频；运行资源与来源以项目说明和素材清单为准。

## 参考工程

制作方法参考 [Nyankomintsu/world-execute-me-lyric-mv](https://github.com/Nyankomintsu/world-execute-me-lyric-mv) 的精修分镜、[PROMPT_v4.md](https://github.com/Nyankomintsu/world-execute-me-lyric-mv/blob/main/docs/v4/PROMPT_v4.md)、原始后期管线，以及 [ASCII 工程](https://github.com/yym8224961/world.execute-me-ascii) 的时间驱动图形方法；另参考 [MisakaZentai/world-execute-me-dsh-pv](https://github.com/MisakaZentai/world-execute-me-dsh-pv) 的逐字符显影与消息撤回机制。上游提示词属于参考作者，不能标为本项目的原创历史提示词。上游暖色、原角色和旧字幕规则不覆盖本项目最终的冷色 NancyLu 设定。
