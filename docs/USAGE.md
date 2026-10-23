# 使用方法

本页命令均在仓库根目录执行，也就是包含 `nancy-preview.html`、`src/` 和 `tools/` 的目录。输入、输出均使用相对路径；无需原制作机器的目录结构。

## 1. 安装运行环境

需要 Node.js 20+、支持 WebGL2 的 Chromium 浏览器，以及包含 H.264 / AAC 编码器的 FFmpeg。参考成片使用 FFmpeg 7.1。预览与关键帧不调用 FFmpeg，视频导出与验证需要它。

```sh
node --version
npm install
npm run doctor
npm test
ffmpeg -version
```

浏览器可使用已安装的 Chrome / Edge。也可安装与项目 Playwright Core 匹配的 Chromium：

```sh
npx playwright-core install chromium
```

若工具没有找到浏览器，下面的设置使用 Playwright 自己解析的安装位置，不写死用户名。两组命令按终端选择一组执行。

PowerShell：

```powershell
$env:NANCY_CHROME = node -e "process.stdout.write(require('playwright-core').chromium.executablePath())"
```

Bash / zsh：

```sh
export NANCY_CHROME="$(node -e 'process.stdout.write(require("playwright-core").chromium.executablePath())')"
```

浏览器按 `NANCY_CHROME`、系统 Chrome / Edge、Playwright Chromium 的顺序查找。FFmpeg 按 `NANCY_FFMPEG`、项目 `toolchain/`、PATH 的顺序查找；一般无需设置环境变量。`NANCY_FFMPEG` 如需设置，应是实际二进制文件的路径，例如项目内的 `./toolchain/ffmpeg.exe`，而非裸命令名。`NANCY_NODE_MODULES` 仅供复用已有依赖目录；普通安装使用项目自己的 `node_modules/`。

`npm run doctor` 检查 Node、依赖、浏览器、FFmpeg、图像及本地数据。缺少音乐或 FFmpeg 会显示 WARN；前者仍可静态预览，后者仍可预览和输出关键帧。缺浏览器、缺角色图或损坏的歌词 JSON 会导致 FAIL。`npm test` 运行便携工具测试，不替代实际画面验收。

中文文字需要本机有可用的中文字体。原制作环境主要使用 Microsoft YaHei、Segoe UI、Georgia、Consolas；其他系统的回退字体会影响字宽和栅格结果，发布前应检查换行。

## 2. 准备音乐、歌词与角色资产

预览固定读取 `media/song.mp3`，离线导出可用 `--audio` 指定其他音轨。请自行准备需要使用的录音；录音、角色图与代码的许可范围见仓库的来源和许可说明。

公开包不附原曲录音和完整歌词。首次预览或关键帧检查可以不准备音乐：

```sh
npm run prepare:demo
npm start
```

这会生成原创占位对话，不包含原曲歌词。服务器、关键帧和导出工具在歌词 JSON 缺失时也会自动创建占位数据；它们从不覆盖现有文件。没有音轨时可拖动时间轴，播放按钮会提示放入音乐；正式 MP4 导出仍必须有音轨。

运行时使用以下文件：

| 路径 | 用途 |
| --- | --- |
| `data/lyrics-user.json` | 由 LRC 导入，或自动生成原创占位对话；含文字、起止时间、USER / NancyLu 角色及显隐效果 |
| `data/lyric-layout.json` | 不含歌词文字的 129 行审核版时间与展示属性；完整锚点匹配时供导入器复用 |
| `media/lyrics-user.lrc` | 用户的原始 LRC，作为编辑与溯源资料；浏览器不直接解析它 |
| `data/audio_features.json` | 节拍、起音、能量与频谱数值 |
| `config.json` | 音频特征采样使用的响应参数等配置 |
| `assets/nancy/` | 六张实际加载的姿势 PNG：`bust-v1.png`、`profile-v1.png`、`reach-v1.png`、`paws-v2.png`、`eye-v1.png`、`male-v1.png` |

`master-v1.png` 是角色设定参考，不是运行时必须加载的姿势。所有六张姿势在初始化时一起加载，即使只检查一个时间点也应齐全。

将自己的 UTF-8 LRC 放到 `media/lyrics-user.lrc` 后导入：

```sh
npm run prepare:lyrics -- --input media/lyrics-user.lrc --out data/lyrics-user.json --end 211.96
```

导入不联网。`--input` 相对当前工作目录，`--out` 相对包根；本页均从包根执行。工具读取 LRC 行首时间并合并重复时间点，然后自动检查 `data/lyric-layout.json`。只有合并后的全部行数及每一个未经偏移的原始时间锚点都匹配，才整套复用审核版 v3 的起止时间、角色、效果与关键词标记；布局文件不含歌词文字。相同版本的 LRC 可据此恢复审核版布局，不依靠交替发言规则猜测原片。

不匹配时，整份文件改用通用估计：大写短关键词最多 0.55 秒，普通句最多 3.8 秒，并尽量在下一行前留 0.025 秒间隔；极短间隔会保留正时长。角色和效果也采用通用规则，终端与输出 JSON 会提示需要人工检查。它不自动把任意新歌曲剪成同一套镜头。

参数 `--offset 0.2` 表示歌词整体延后 0.2 秒；它会与 LRC `[offset:毫秒]` 相加。布局匹配发生在偏移和裁边之前，之后统一平移并裁至 `0..--end`，丢弃没有正时长的行。该参数和音频的 `--audio-offset` 是不同参数。

已有占位 JSON 可直接被本地歌词替换；已有用户数据默认保留并报提示。只有明确需要替换时才加 `--force`，例如：

```sh
npm run prepare:lyrics -- --input media/lyrics-user.lrc --out data/lyrics-user.json --end 211.96 --offset 0.2 --force
```

`npm run prepare:demo` 同样不会默认覆盖已有用户 JSON。修改 LRC 后需重新导入，不会由播放器自动重建。歌词 JSON 的最小结构如下；示例文字仅说明字段，不是原曲歌词：

```json
{
  "version": 1,
  "source": "User-supplied LRC",
  "lines": [
    {
      "start": 0.1,
      "end": 1.7,
      "text": "Example request.",
      "role": "USER",
      "effect": "type",
      "keyword": false
    }
  ]
}
```

时间使用歌曲秒数，每行需有有限的 `start` / `end`，且 `end > start`。`role` 使用 `USER` 或 `NancyLu`；`effect` 可用 `type`、`decode`、`scan`、`rise`、`packet`、`glitch`。实际逐字进度由行内时长及字符权重计算，是插值估计，不是逐音素实测对齐。只改 LRC 原件不会自动更新运行时 JSON。

本片镜头按约 211.96 秒的参考版本制作。默认 `--audio-offset 0.0250566893424` 是该制作音轨相对参考分析网格的编码延迟补偿，不是任意录音通用值。若使用时间零点已经与参考网格一致的音频，可设 `--audio-offset 0`，并人工检查拍点；不同剪辑或不同速度的录音还需要调整歌词与镜头时间。

## 3. 预览与任意时间跳转

```sh
npm start
```

打开终端打印的 `nancy-preview.html` 地址，通常为 `http://localhost:5191/nancy-preview.html`。端口占用时服务器会尝试后续端口，以实际输出为准。请通过服务器打开，不使用 `file://`。

页面支持播放、暂停、时间滑条、六个标准关键帧按钮以及“减弱运镜”。URL 也可指定初始时间：

- `http://localhost:5191/nancy-preview.html?t=84.32`：猫爪镜头。
- `http://localhost:5191/nancy-preview.html?t=19&motion=reduce`：减弱运镜的标题预览。
- `http://localhost:5191/nancy-preview.html?t=84.32&audio-offset=0`：以零音轨补偿检查预览。

预览时间为歌曲秒数，负数是五秒片头。完整 MP4 中，歌曲 84.32 秒位于文件 89.32 秒。页面播放以音频时钟驱动画面，拖动滑条会暂停并跳到指定时间；离线导出按固定帧号取样。

“减弱运镜”是显式的预览设置，不读取系统动画偏好。`?export=1` 固定完整运镜；正式关键帧和视频工具都会使用这个模式。预览音轨补偿优先取 URL 的 `audio-offset`，其次为 `config.json` 的 `timing.audioSourcePadding`，最后为制作默认值；离线导出另用 `--audio-offset`。更换音轨时应让两者一致。

## 4. 输出关键帧与全镜头分镜

跨平台兼容示例使用软件 WebGL：

```sh
node tools/render-nancy.mjs --out out/keyframes --gpu swiftshader
node tools/render-nancy.mjs --times "19,59.9,90.5" --out out/pose-check --gpu swiftshader
node tools/render-nancy.mjs --timeline --out out/storyboard --gpu swiftshader
node tools/render-nancy.mjs --timeline --only v2-cat --out out/cat-frame --gpu swiftshader
```

Windows 且 D3D11 可用时可将 `swiftshader` 换为 `d3d11`。不带 `--times` / `--timeline` 时输出六张标准关键帧；`--timeline` 对每个镜头取 `start + 0.58 × duration`。`--only` 按镜头 ID 子串过滤。`--timeline` 会覆盖 `--times` 的选择，因此两者分开使用。

输出为 1920×1080 PNG 及 `manifest.json`。工具也检查浏览器错误和任意跳转复现：Canvas 层应完全一致；GPU 后期允许极小的单级通道舍入差异，具体数值写入 manifest。

## 5. 分段导出与全片导出

先导出三秒猫爪段，检查环境与音画：

```sh
node tools/export-nancy.mjs --start 82.04 --end 85.04 --width 1280 --height 720 --fps 30 --gpu swiftshader --codec libx264 --cq 20 --out out/cat-check.mp4
node tools/verify-nancy.mjs out/cat-check.mp4
```

该示例为 90 帧；导出器的旁车 `.render.json` 会告诉验证器预期尺寸、帧率和帧数。高质量 1080p60 段落：

```sh
node tools/export-nancy.mjs --start 92.3 --end 95.7 --gpu swiftshader --codec libx264 --cq 17 --out out/sun_1080p60.mp4
node tools/export-nancy.mjs --start 148.04 --end 177.57 --gpu swiftshader --codec libx264 --cq 17 --out out/climax_1080p60.mp4
```

完整歌曲，保留五秒片头：

```sh
node tools/export-nancy.mjs --start -5 --end 211.96 --width 1920 --height 1080 --fps 60 --gpu swiftshader --codec libx264 --cq 17 --out out/NancyLu_world_execute_1080p60.mp4
node tools/verify-nancy.mjs out/NancyLu_world_execute_1080p60.mp4
```

完整输出为 13,018 帧、216.9667 秒。内部画布固定 1920×1080；`--width` / `--height` 在 FFmpeg 端缩放，不增加原生绘制细节。`--start` / `--end` 是歌曲时间，帧数为 `ceil((end - start) × fps)`，实际文件时长按整数帧向上取整。

Windows 的硬件加速示例：

```sh
node tools/export-nancy.mjs --start 82.04 --end 85.04 --gpu d3d11 --codec auto --cq 17 --out out/cat-gpu.mp4
node tools/export-nancy.mjs --benchmark --samples 18 --gpu auto
```

`auto` 编码先实际测试 NVENC，失败时回退 libx264。D3D11 与 NVENC 是两个独立选择：前者决定浏览器渲染，后者决定视频编码。跨平台示例采用软件路径；原制作环境的 D3D11 / NVENC 已实测，其他系统仍需检查本机结果。

## 6. 参数与产物

### `export-nancy.mjs`

| 参数 | 当前默认值 | 含义 |
| --- | --- | --- |
| `--start` / `--end` | `-5` / `211.96` | 歌曲时间区间，秒 |
| `--width` / `--height` | `1920` / `1080` | 偶数输出尺寸 |
| `--fps` | `60` | 恒定输出帧率 |
| `--out` | `outputs/NancyLu_world_execute_1080p60.mp4` | 相对包根；可显式指定项目内其他路径 |
| `--audio` | `media/song.mp3` | 离线导出的音轨，路径相对项目根 |
| `--audio-offset` | `1105 / 44100` | 源音轨相对参考视觉网格的偏移，秒 |
| `--codec` | `auto` | `auto` / `h264_nvenc` / `libx264` |
| `--cq` | `17` | NVENC 的 CQ 或 libx264 的 CRF；数值越小质量越高、体积通常越大 |
| `--gpu` | `auto` | Windows 为 D3D11，其他平台为浏览器 default；基准测试额外比较 SwiftShader。可显式用 `d3d11`、`default`、`swiftshader` |
| `--chunk` | `120` | 单次浏览器调用中的帧数，不是并行 worker 数 |
| `--benchmark` / `--samples` | 关闭 / `18` | 测量渲染、读取和传输耗时，样本数至少 6 |
| `--headed` | 关闭 | 让导出浏览器显示窗口，供定位问题 |

目前每次导出只有一个渲染器，`--workers` 大于 1 会报错。`--audio` 只改变离线导出的音轨，不会改变预览页面固定的音频地址。

### `render-nancy.mjs` 与 `verify-nancy.mjs`

关键帧工具支持 `--out`、`--gpu`、`--times`、`--timeline`、`--only`；默认输出 `outputs/keyframes/`，GPU 默认 `auto`。验证器使用第一个位置参数接收 MP4，可用 `--frames`、`--fps`、`--width`、`--height` 覆盖旁车元数据。应保留 `.render.json`；短片缺少它时，需自行传入准确帧数等预期值。

对应 npm 入口为 `npm run render -- 参数`、`npm run export -- 参数`、`npm run verify -- 文件及参数`；直接调用本页的 Node 脚本与这些入口等价。所有工具的相对 `--out` 均按包根解析。

视频导出完成后生成 MP4 和 `.render.json`，验证通过后生成 `.verify.json`。编码格式为 H.264 High、yuv420p、有限范围 BT.709，音频为 48kHz / 320kbps AAC，MP4 使用 faststart。验证包含样本表、完整解码、帧数、CFR、色彩标记与音视频时长；旁车记录的源音轨仍可读时，还会比对四个 PCM 窗口和片头静音。它检验输出相对所选源音轨及偏移参数是否一致，不能替代对歌词拍点与构图的检查。

## 7. 常见问题

| 现象 | 检查与处理 |
| --- | --- |
| 页面只有底色或初始化失败 | 先运行 `npm run doctor`，检查六张姿势、现有歌词 JSON 格式及控制台中的失败 URL。缺失 JSON 会自动生成原创占位；损坏的现有 JSON 不会被自动覆盖。 |
| 浏览器找不到 / `playwright-core` 找不到 | 在仓库根运行 `npm install`；安装匹配 Chromium 并设置本页给出的 `NANCY_CHROME`。 |
| `WebGL2` 或 D3D11 不可用 | 使用 `--gpu swiftshader`；预览可换支持 WebGL2 的 Chromium。 |
| NVENC 不可用 | 使用 `--codec libx264`，或让 `--codec auto` 自动回退。 |
| FFmpeg 找不到 | 确认 `ffmpeg -version` 和 PATH；也可放入 `toolchain/`。若设置 `NANCY_FFMPEG`，须指向实际二进制文件；失效的显式路径会报错。 |
| 文字变方框、换行不同 | 安装可用的中文字体并重新检查关键帧；不同字体不能保证相同字宽。 |
| 有图但没声音 | 占位模式本来不含音乐。放入 `media/song.mp3` 后刷新，再点播放；浏览器播放需要用户手势。离线导出另检查 `--audio`。 |
| 节拍或歌词偏移 | 确认录音版本、LRC 行首时间和 `--audio-offset`；不要把五秒片头加进 LRC。 |
| 软件导出很慢 | 先短片或 `--benchmark`；有合适环境时使用 D3D11 / NVENC。降低输出分辨率主要节省传输后的编码，内部渲染仍是 1080p。 |
| 中断后留下 `.rendering.mp4` | 该文件不是完成产物；重新导出该段，结束后才会更名并写入 `.render.json`。 |
| 验证时 `audioAlignment` 为空 | 查看 `.render.json` 中源音轨是否仍可读；结构/解码检查与源音轨比对是两部分。 |

模块与时间坐标的实现说明见 [ARCHITECTURE.md](ARCHITECTURE.md)。

## 8. 本次便携层验证范围

已在制作环境执行 10 项 Node 工具测试，包含无歌词文字的 129 行布局还原测试；另使用 Chrome 渲染两张关键帧并检查跳转后完全一致；无音乐时的页面、播放提示、重播提示和时间滑条也已检查。另以非原曲的合成音轨输出 0.5 秒、320×180、60fps / 30 帧短片，完整解码、CFR、BT.709、faststart 及四个音频窗口比对通过。这些结果不代表每种操作系统均已实机验证，也不等于使用你的音轨重新完成了全片验收。
