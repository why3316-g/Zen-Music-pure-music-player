# SonicVibe - Windows 桌面音乐播放器

## 项目概况

**SonicVibe** 是一个 Windows 桌面音乐/视频播放器，基于 Electron 33 + Vue 3 + TypeScript + Pinia 构建。

定位：功能克制、界面极致漂亮、多主题 + 多频谱可切换的个人播放器。

---

## 技术栈

| 层 | 技术 | 版本 |
|---|---|---|
| 桌面框架 | Electron | ^33.0 |
| 前端框架 | Vue 3 (Composition API) | ^3.5 |
| 状态管理 | Pinia | ^2.2 |
| 构建工具 | electron-vite | ^3.1 |
| 类型系统 | TypeScript | ^5.6 |
| 音频元数据 | music-metadata | ^10.5 |
| 打包 | electron-builder | ^25.0 |

---

## 项目结构（当前实际文件）

```
SonicVibe/
├── electron/
│   ├── main.ts                 # 主进程：窗口管理、app:// 自定义协议（Range 请求支持）、IPC
│   └── preload.ts              # 预加载：contextBridge 暴露 API（openFiles、窗口控制、getPathForFile）
├── src/renderer/
│   ├── main.ts                 # Vue 入口
│   ├── App.vue                 # 根组件：标题栏 + 自动隐藏侧边栏 + 中心内容 + 底部播放栏
│   ├── env.d.ts                # Window.api 类型声明
│   ├── components/
│   │   ├── Player.vue          # 底部播放栏：播放控制、进度条拖拽、音量、播放模式、列表切换按钮
│   │   ├── Playlist.vue        # 播放列表：下拉列表选择器、曲目列表、拖拽添加
│   │   ├── VinylDisc.vue       # 黑胶唱片：径向渐变纹路、唱臂动画（-25° ↔ 5°）、唱片旋转
│   │   ├── Visualizer.vue      # 频谱可视化：4 种渲染器（经典条/弧形雷达/流动波形/发光点阵）
│   │   ├── VisualizerSwitcher.vue  # 频谱切换器（标题栏）
│   │   ├── ThemeSwitcher.vue   # 主题切换器（标题栏）
│   │   ├── VideoPlayer.vue     # 视频播放：全屏覆盖层，动态挂载/卸载 media 元素
│   │   └── SleepTimer.vue      # 定时暂停：预设 + 自定义时间输入
│   ├── stores/
│   │   ├── player.ts           # 播放状态：currentTrack、isPlaying、currentTime、volume、playMode
│   │   ├── playlist.ts         # 多播放列表：lists[]、addTracks/remove/switchList、toJSON/fromJSON
│   │   ├── theme.ts            # 主题状态：默认 vinyl，持久化 localStorage
│   │   ├── timer.ts            # 定时器：预设 5~120 分钟，dispatch timer:expired
│   │   └── visualizer.ts       # 频谱类型：bars/arc/wave/dots，默认 wave，持久化
│   ├── services/
│   │   ├── audio-engine.ts     # 音频引擎：统一 <video> 元素，Web Audio API 管线，media 始终在 DOM
│   │   └── file-scanner.ts     # 文件扫描：music-metadata 读取元数据和封面
│   ├── themes/
│   │   ├── apple/              # Apple 极简风：深灰 #1c1c1e，红色强调 #fc3c44
│   │   └── vinyl/              # 黑胶复古风：深棕 #1a1410，暗红强调 #c23a3a（默认主题）
│   └── utils/
│       ├── types.ts            # TrackInfo、PlayMode 接口
│       └── format.ts           # formatTime() 工具函数
├── docs/
│   └── design.md               # 本文件
├── scripts/
│   └── dev.js                  # 开发启动脚本（清除 IDE 注入的环境变量）
├── electron.vite.config.ts
├── electron-builder.yml
├── package.json                # type: commonjs
├── tsconfig.json / tsconfig.node.json / tsconfig.web.json
└── .gitignore
```

---

## 已实现功能

### 1. 播放引擎

- **统一媒体元素**：音频和视频共用一个 `<video>` 元素，Web Audio API 管线只创建一次
- **自定义 `app://` 协议**：绕过 CORS，支持 HTTP Range 请求（拖动进度条/跳转）
- **音频管线**：`AudioContext` → `createMediaElementSource()` → `AnalyserNode` → `destination`
- **媒体元素常驻 DOM**：隐藏的 `home` 容器确保 Chromium 不出问题，`returnMedia()` 从 VideoPlayer 容器回收
- **播放控制**：播放/暂停、上一曲/下一曲、进度条拖拽跳转、音量调节
- **播放模式**：列表循环、单曲循环、随机播放
- **AudioContext 管理**：浏览器自动 suspend，用户交互时 `resume()`

### 2. 播放列表

- **多列表管理**：创建/切换/删除自定义列表（下拉菜单选择，非标签页）
- **拖拽添加**：拖拽文件到窗口或列表区域自动添加
- **文件选择器**：点击"添加音乐"按钮选择文件
- **持久化**：列表数据、当前索引、活跃列表 ID 全部保存到 localStorage
- **自动隐藏侧边栏**：5 秒无点击自动隐藏，鼠标移入/点击列表按钮恢复，内容区平滑扩展到全屏

### 3. 主题系统

- **CSS Variables + `data-theme`**：所有视觉通过变量控制，切换主题只改 `<html>` 属性
- **默认主题：vinyl**（黑胶复古风）
- **已实现主题**：

| 主题 | 背景色 | 强调色 | 风格 |
|------|--------|--------|------|
| Apple | #1c1c1e 深灰 | #fc3c44 红 | 极简、毛玻璃 |
| Vinyl | #1a1410 深棕 | #c23a3a 暗红 | 复古、黑胶唱片 |

- 主题选择持久化到 localStorage

### 4. 黑胶唱片动画（VinylDisc.vue）

- **唱片外观**：CSS `radial-gradient` 制造细腻黑胶纹路（网易风格），36% 面积封面标签
- **光泽效果**：`linear-gradient` 叠加层模拟光线反射
- **唱臂动画**：
  - 静止位：-25°（远离唱片）
  - 播放位：5°（落在唱机上）
  - 过渡：0.8s cubic-bezier，与手动暂停/播放效果一致
  - 切歌时：先回到静止位，等 800ms（完整过渡时间），再摆到播放位
- **唱片旋转**：3s/圈 `linear infinite`，暂停时停止

### 5. 频谱可视化（4 种）

Visualizer.vue 支持 4 种渲染器，通过 VisualizerSwitcher.vue 在标题栏切换，所有主题通用：

| 类型 | 名称 | 视觉效果 |
|------|------|---------|
| `bars` | 经典 | 48 根蓝紫渐变圆角条，从底部向上 |
| `arc` | 弧形雷达 | 48 根发光线从底部中心沿 180° 弧线辐射，带内弧光晕 |
| `wave` | 流动波形 | 3 层贝塞尔曲线，不同时间偏移产生流动感，渐变填充（默认） |
| `dots` | 发光点阵 | 32×6 LED 网格，底→顶按频率亮起，低频蓝→高频紫渐变发光 |

- Canvas 2D 渲染，120px 高度，`requestAnimationFrame` 循环
- 切歌时自动重启动画循环
- 视频文件播放时自动隐藏频谱
- 频谱类型持久化到 localStorage

### 6. 视频播放（VideoPlayer.vue）

- 自动检测文件扩展名（mp4/mkv/avi/webm）
- 视频模式：media 元素挂载到全屏覆盖层（z-index: 10）
- 音频模式：media 元素回收到隐藏容器，显示频谱
- 切换时自动挂载/卸载

### 7. 定时暂停（SleepTimer.vue）

- 预设时间：5/10/15/30/45/60/90/120 分钟
- 自定义时间输入（数字 + "开始"按钮）
- 运行中显示倒计时徽章
- 到期后 dispatch `timer:expired` 事件 → 暂停播放

### 8. 窗口与交互

- **自定义标题栏**：最小化/最大化/关闭按钮，可拖拽移动
- **拖拽添加文件**：文件拖到窗口任意位置自动添加到列表
- **启动恢复**：重启后自动恢复播放列表和最后播放的曲目信息（不自动播放）
- **播放栏列表按钮**：手动显示/隐藏侧边栏

---

## 关键设计决策

| 决策 | 原因 |
|------|------|
| 统一 `<video>` 元素处理音频+视频 | 一条 Web Audio API 管线，`createMediaElementSource()` 只能调一次 |
| 自定义 `app://` 协议 | 绕过 CORS，支持 Range 请求用于进度跳转 |
| CSS Variables + `data-theme` | 纯 CSS 层切换主题，组件无需感知主题逻辑 |
| localStorage 持久化 | 简单够用，个人项目不需要 electron-store |
| media 元素常驻 DOM | Chromium 在 media 被移除 DOM 后可能拒绝播放，`home` 容器解决此问题 |
| 侧边栏自动隐藏 | 最大化视觉区域，5 秒无交互自动收起 |
| 4 种频谱共享 AnalyserNode | 同一个 Canvas，同一份频率数据，只换渲染函数 |

---

## 已知限制 / 待实现

| 功能 | 状态 |
|------|------|
| Arc 主题 CSS | ThemeSwitcher 中有选项但无独立 CSS 文件，选中后使用默认变量 |
| 歌词显示 (LRC) | 设计中，未实现 |
| 在线音乐搜索 | 设计中，未实现 |
| 系统托盘 | 设计中，未实现 |
| 全局快捷键 | 设计中，未实现 |
| 迷你模式 | 设计中，未实现 |
| 打包为 EXE | electron-builder 已配置，待最终版本发布 |

---

## 开发命令

```bash
npm run dev      # 启动开发模式（通过 scripts/dev.js）
npm run build    # 构建生产版本
npm run pack     # 打包（不生成安装程序）
npm run dist     # 打包并生成安装程序
```

---

## 历史记录

- **2026-05-01**：项目立项，完成设计文档和技术审查
- **2026-05-02**：完成项目搭建，实现核心播放、播放列表、主题系统、频谱可视化
- **2026-05-03**：修复 7 轮 bug（进度条跳转、拖拽添加、多列表、视频播放等），完成雏形
- **2026-05-03（下午）**：黑胶唱片重设计（网易风格）、4 种频谱可视化、播放列表自动隐藏侧边栏

---

*Original design generated by /office-hours on 2026-05-01. Status: APPROVED.*
*This document updated on 2026-05-03 to reflect all implemented features.*
