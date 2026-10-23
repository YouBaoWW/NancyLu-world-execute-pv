# 第三方来源与许可

本文件记录已经存在的第三方许可与署名，不替本改编的新增代码或素材创设授权。新增代码按项目根目录的明确许可处理；音乐、歌词、角色与图像的范围见 [ASSET_POLICY.md](ASSET_POLICY.md)。

## 实际复用与参考

| 来源 | 本项目中的范围 | 许可与署名 |
| --- | --- | --- |
| [Nyankomintsu/world-execute-me-lyric-mv](https://github.com/Nyankomintsu/world-execute-me-lyric-mv)，制作基座提交 `93ac63775ee58b33ff102167514f2603a48940cc` | 实际继承 `src/engine/` 的 WebGL2 后期、转场、音频特征采样和工具函数，以及 `export/server.mjs`、`export/wsframes.mjs`；本改编增加冷蓝参数、南希露镜头与导出适配。 | MIT，`Copyright (c) 2026 Nyankomint`。分发这些代码或其重要部分时保留版权声明、许可正文和免责条款。 |
| [MisakaZentai/world-execute-me-dsh-pv](https://github.com/MisakaZentai/world-execute-me-dsh-pv)，查阅提交 `a598092a1b1db91fa43961a81269353d13419f6f` | 制作工作区查阅过 `s_userleft.py`、`s_exec.py` 的逐字符显影、断连撤回与上下文抹除机制；本片在 JavaScript/Canvas 中实现相应运动。上游 Python 参考文件不作为运行依赖。 | 上游代码为 MIT，`Copyright (c) 2026 MisakaZentai`。若另行分发其参考代码或实质复制部分，保留该 MIT 声明；其美术与前端有独立条款。 |
| [yym8224961/world.execute-me-ascii](https://github.com/yym8224961/world.execute-me-ascii) | 字符构图与函数驱动的创作方法参考；[创作提示词原址](https://github.com/yym8224961/world.execute-me-ascii/blob/main/docs/prompts/creation-prompts.md)。 | 核对时未发现明确的仓库级软件许可证，不能将其源码或提示词全文标成 MIT。本公开包只保留来源链接，不分发其原文件或内嵌音乐发行包。 |

参考视频为 [BV186pc65E68](https://www.bilibili.com/video/BV186pc65E68)。对应的四版提示词见上游 [PROMPT_v4.md](https://github.com/Nyankomintsu/world-execute-me-lyric-mv/blob/main/docs/v4/PROMPT_v4.md) 与 [修订稿](https://github.com/Nyankomintsu/world-execute-me-lyric-mv/blob/main/docs/v4/PROMPT_v4_fix.md)。这些文件是创作过程资料，不是原曲或角色的授权证明。

## 不随代码许可转移的权利

- Nyankomint 的原角色剪影与包含它们的画面，在上游 [CREDITS.md](https://github.com/Nyankomintsu/world-execute-me-lyric-mv/blob/main/CREDITS.md) 中单列为 [CC BY-NC-SA 4.0](https://creativecommons.org/licenses/by-nc-sa/4.0/)：署名 Nyankomint、非商业、相同方式分享。本包不分发这些参考图；该条款不被擅自套用于本片新生成的南希露图像。
- MisakaZentai 的 [NOTICE.md](https://github.com/MisakaZentai/world-execute-me-dsh-pv/blob/main/NOTICE.md) 将鲸鱼娘美术、DeepSeek 前端与字体分别列明。本包未采用这些素材；该仓库代码的 MIT 许可不能代替素材署名链或素材许可。
- 南希露角色及契约皮设计、官方立绘、用户提供头像、音乐、歌词与商标分别保留各自权利。来源可访问、AI 生成、像素化或轮廓化均不意味着这些内容成为 MIT 素材。
- 本工程使用本地系统字体，不打包字体文件；通过 npm 安装的依赖和单独安装的编码器、浏览器按各自许可提供。本包不把它们当作项目自有代码再许可。

## MIT 许可正文

以下正文分别保留上述两项上游代码的现有许可。版权声明的并列不表示二者共同创作了所有文件，也不扩大到图像、音乐或歌词。

```text
MIT License

Copyright (c) 2026 Nyankomint
Copyright (c) 2026 MisakaZentai

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

许可原文：[Nyankomint LICENSE](https://github.com/Nyankomintsu/world-execute-me-lyric-mv/blob/main/LICENSE)、[MisakaZentai LICENSE](https://github.com/MisakaZentai/world-execute-me-dsh-pv/blob/main/LICENSE)。

核对依据：制作工程的 `LICENSE`、`CREDITS.md`、`SOURCES_NANCY.md`、代码标头，以及上述上游官方仓库与 Mili 官方指引。核对日期：2026-10-23。
