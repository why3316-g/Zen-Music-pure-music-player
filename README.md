<div align="center">

# Zen·Music

**安静地听**

一个纯粹的音乐播放器。没有广告，没有推荐，没有社交。

只有你和音乐。

![Zen·Music](build/icon-256.png)

[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

</div>

---

为什么做这个播放器？

打开任何主流音乐 App，你要先看 3 秒广告，再关掉弹窗推荐，最后发现搜索栏下面还有「猜你喜欢」。音乐本来是最简单的事——点开，听。我们把它还原到这个本质。

## 特性

**纯净播放** — 支持mp3、flac、wav、ogg、aac、m4a、wma，拖进来就能听。mp4、mkv、avi、webm 视频也能播。

**音频可视化** — 三种频谱风格：经典柱状、弧形环绕、波形流动。随音乐呼吸。

**主题切换** — 黑胶、Apple、禅。三套视觉风格，一键切换。

**禅模式** — 播放时，鼠标静止5秒后自动隐藏所有界面元素，只留黑胶唱片和频谱。动一下鼠标就回来。

**播放列表** — 自动保存，关闭重开还在。支持拖拽添加文件。

**睡眠定时** — 设个时间，到了自动暂停。睡前听音乐不用操心。

**文件关联** — 设为默认播放器后，双击任何音频文件直接打开。

## 快捷键

| 按键 | 功能 |
|------|------|
| `Space` | 播放 / 暂停 |

## 下载安装

从 [Releases](../../releases) 页面下载：

- **安装版** — 标准 Windows 安装程序
- **便携版** — 免安装，双击运行

## 开发

需要 Node.js 18+ 和 npm。

```bash
# 安装依赖
npm install

# 开发模式
npm run dev

# 打包
npm run build
```

## 技术栈

Electron + Vue 3 + TypeScript + Pinia

## 开源协议

MIT — 随便用。
