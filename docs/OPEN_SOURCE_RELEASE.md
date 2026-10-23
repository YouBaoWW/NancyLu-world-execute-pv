# 发布到 GitHub

这份目录已经按公开源码整理。ZIP 与本地目录不是已发布的远程仓库；创建 GitHub 仓库并上传后才会公开。

## 发布范围

提交源码、人物生成图、四张封面、文档、提示词、节拍/频谱元数据及 npm 清单。不要提交歌曲录音、完整歌词、官方立绘、原参考姿势图、个人路径、凭据、可执行工具或 `node_modules`。根目录 `.gitignore` 已覆盖常见的本地生成文件；网页手动上传文件时也要遵守相同范围。

代码采用 MIT；人物图、头像、第三方角色、歌曲和歌词另见 [素材范围](ASSET_POLICY.md)。原作者与复用范围见 [第三方声明](THIRD_PARTY_NOTICES.md)。分享本片或封面时保留非官方同人与 AI 内容说明。

## 本地验证

```sh
npm install
npm test
npm run doctor
npm run prepare:demo
npm run render -- --times 23.2,67.8,84.32,90.5,137.3,169.4 --out outputs/release-review
```

诊断显示音轨缺失是公开包的预期状态；图片输出与无音频拖动可用，带声音的导出需要本地音频。发布测试应使用演示对话，不把真实歌词生成结果重新复制进公开 ZIP。

## 新建仓库并推送

在 GitHub 新建一个空仓库，名字可以使用 `NancyLu-world-execute-pv`。在解压后的工程目录执行；将最后一行的仓库地址替换成自己的真实地址：

```sh
git init -b main
git add .
git diff --cached --name-only
git commit -m "Release NancyLu PV source and creation prompts"
git remote add origin https://github.com/YOUR_NAME/NancyLu-world-execute-pv.git
git push -u origin main
```

执行 commit 前，检查 `git diff --cached --name-only` 不包含本地音频、LRC、`data/lyrics-user.json`、`.env`、工具或依赖目录。账户认证通过本地 Git/GitHub 流程处理，不把 token 写入源码或仓库 URL。

## 推荐仓库信息

- 描述：`NancyLu fan MV for world.execute(me); — deterministic Canvas/WebGL rendering, lyric conversations, camera motion, assets and prompts.`
- Topics：`music-video`、`canvas`、`webgl2`、`generative-art`、`nancylu`、`world-execute-me`。
- README 封面：`docs/images/cover.png`；需要换封面时从 `docs/covers/` 选择。
- Release 标签：`v1.0.0`。源码 ZIP 可附在 Release；MP4 单独处理，并遵循所用音乐与素材的发布要求。

公开目录不包含制作聊天全文或私人任务记录。`docs/prompts/history/` 是已经留存并去除机器路径的提示词副本，其他阶段文档是根据最终实现整理的可复用模板。
