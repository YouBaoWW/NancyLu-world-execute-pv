# 本地音乐与歌词

这里不附原曲录音和完整歌词。

- 将自己有权使用的歌曲放为 `song.mp3`，或导出时用 `--audio` 指定其他本地音频。
- 将自己的 UTF-8 LRC 放为 `lyrics-user.lrc`，运行 `npm run prepare:lyrics -- --input media/lyrics-user.lrc --end 211.96`。
- `npm run prepare:demo` 可生成不含原曲歌词的自写占位对话；不覆盖现有歌词数据。
- `media/` 下的本地素材及生成的 `data/lyrics-user.json` 已在 `.gitignore` 中排除。

音频与歌词不随代码 MIT 许可转移。不要将制作时本地使用的原曲录音或完整歌词重新打包到公开源码。
