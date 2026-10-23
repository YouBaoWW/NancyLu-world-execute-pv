# 实际留存记录

这些文件来自制作工程保存的 JSON，不是从新模板反推的“历史”。

| 文件 | 留存内容 | 发布整理 |
| --- | --- | --- |
| [character-prompts.json](character-prompts.json) | 基准摘要、正面/侧面/猫爪/伸手/眼部提示词与五指局部修复词 | 原文件原样复制；`master` 字段是项目当时记录的摘要，不是完整调用正文 |
| [male-prompt.json](male-prompt.json) | 成年男性契约无面胸像生成词、相对资源名与日期 | `prompt` 正文未改；删除 `sourceGeneratedPath` 机器绝对路径字段，其余元数据保留 |
| [covers-prompts.json](covers-prompts.json) | 四款封面初始生成词与最终局部修订词 | 机器路径改为 `PROJECT/` 逻辑占位，实际参考素材不一定随公开包提供 |

这些记录没有穷尽完整对话、失败调用、全部参考图参数和工具返回值。女性早期词要求蓝瞳；最终紫瞳白肤与程序分版修订请读 [提示词指南](../PROMPT_GUIDE.md) 和 [人物阶段模板](../01_CHARACTER_ASSETS.md)。封面成图与原生尺寸见 [封面说明](../06_COVERS.md)；模板与实际记录分别保存。
