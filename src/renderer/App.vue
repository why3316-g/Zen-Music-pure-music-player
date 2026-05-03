<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { usePlaylistStore } from './stores/playlist'
import { usePlayerStore } from './stores/player'
import { useThemeStore } from './stores/theme'
import { useVisualizerStore } from './stores/visualizer'
import { scanFiles } from './services/file-scanner'
import { audioEngine } from './services/audio-engine'
import Player from './components/Player.vue'
import Playlist from './components/Playlist.vue'
import Visualizer from './components/Visualizer.vue'
import VinylDisc from './components/VinylDisc.vue'
import ThemeSwitcher from './components/ThemeSwitcher.vue'
import VisualizerSwitcher from './components/VisualizerSwitcher.vue'
import VideoPlayer from './components/VideoPlayer.vue'
import './themes/apple/styles.css'
import './themes/vinyl/styles.css'

const playlist = usePlaylistStore()
const player = usePlayerStore()
const theme = useThemeStore()
const viz = useVisualizerStore()
const isMaximized = ref(false)
const isDraggingOver = ref(false)
const sidebarVisible = ref(true)
const zenMode = ref(false)
let sidebarTimer: ReturnType<typeof setTimeout> | null = null
let zenTimer: ReturnType<typeof setTimeout> | null = null

async function handleMinimize() {
  await window.api.minimize()
}

async function handleMaximize() {
  await window.api.maximize()
  isMaximized.value = await window.api.isMaximized()
}

async function handleClose() {
  await window.api.close()
}

async function openFiles() {
  const paths = await window.api.openFiles()
  if (paths.length === 0) return
  await addAndPlay(paths)
}

async function addAndPlay(filePaths: string[]) {
  const tracks = await scanFiles(filePaths)
  if (tracks.length === 0) return
  const shouldPlay = playlist.tracks.length === 0
  playlist.addTracks(tracks)
  if (shouldPlay) {
    const track = playlist.tracks[0]
    player.setTrack(track)
    audioEngine.connectAnalyser()
    await audioEngine.load(track.filePath)
  }
  resetSidebarTimer()
}

function resetSidebarTimer() {
  sidebarVisible.value = true
  if (sidebarTimer) clearTimeout(sidebarTimer)
  sidebarTimer = setTimeout(() => {
    sidebarVisible.value = false
  }, 5000)
}

function togglePlaylist() {
  if (sidebarVisible.value) {
    sidebarVisible.value = false
  } else {
    resetSidebarTimer()
  }
}

function wakeZen() {
  zenMode.value = false
  if (zenTimer) clearTimeout(zenTimer)
  zenTimer = setTimeout(() => {
    if (player.isPlaying && playlist.tracks.length > 0) {
      zenMode.value = true
    }
  }, 5000)
}

onMounted(() => {
  theme.init()
  viz.init()

  // Restore playlist from localStorage
  const saved = localStorage.getItem('zen-music-playlist')
  if (saved) {
    try { playlist.fromJSON(JSON.parse(saved)) } catch {}
  }

  // Restore current track (without auto-playing) so UI isn't blank
  if (playlist.tracks.length > 0 && playlist.currentIndex >= 0) {
    const track = playlist.tracks[playlist.currentIndex]
    if (track) player.setTrack(track, false)
    resetSidebarTimer()
  }

  const savedTheme = localStorage.getItem('zen-music-theme')
  if (savedTheme) theme.setTheme(savedTheme)

  // Timer: pause playback when timer expires
  window.addEventListener('timer:expired', () => {
    audioEngine.pause()
    player.isPlaying = false
  })

  document.addEventListener('dragover', (e) => {
    e.preventDefault()
    isDraggingOver.value = true
  })
  document.addEventListener('dragleave', () => {
    isDraggingOver.value = false
  })
  document.addEventListener('drop', async (e) => {
    e.preventDefault()
    isDraggingOver.value = false
    const files = e.dataTransfer?.files
    if (!files || files.length === 0) return
    const paths: string[] = []
    for (let i = 0; i < files.length; i++) {
      try {
        const path = window.api.getPathForFile(files[i])
        if (path) paths.push(path)
      } catch {}
    }
    if (paths.length > 0) await addAndPlay(paths)
  })

  // Handle files opened via file association (double-click in Explorer)
  window.api.onOpenFiles(async (paths: string[]) => {
    if (paths.length > 0) await addAndPlay(paths)
  })

  // Zen mode: auto-hide UI after 5s idle
  document.addEventListener('mousemove', wakeZen)
  document.addEventListener('mousedown', wakeZen)
  document.addEventListener('keydown', (e: KeyboardEvent) => {
    if (e.code === 'Space') {
      zenMode.value = false
      wakeZen()
    } else {
      wakeZen()
    }
  })
  wakeZen()
})

// Persist playlist
watch(() => [playlist.tracks, playlist.currentIndex, playlist.activeListId], () => {
  localStorage.setItem('zen-music-playlist', JSON.stringify(playlist.toJSON()))
}, { deep: true })

// Persist theme
watch(() => theme.currentTheme, (t) => {
  localStorage.setItem('zen-music-theme', t)
})

// Exit zen mode when paused
watch(() => player.isPlaying, (playing) => {
  if (!playing) {
    zenMode.value = false
    wakeZen()
  }
})
</script>

<template>
  <div class="app" :class="{ 'app--zen': zenMode }" @mousemove="wakeZen">
    <!-- Title bar -->
    <div class="title-bar" :class="{ 'zen-fade': zenMode }">
      <div class="title-bar__drag">
        <span class="title-bar__title">Zen·Music</span>
      </div>
      <ThemeSwitcher />
      <VisualizerSwitcher />
      <div class="title-bar__controls">
        <button class="title-bar__btn" @click="handleMinimize">
          <svg width="12" height="12" viewBox="0 0 12 12">
            <rect y="5" width="12" height="1.5" fill="currentColor" />
          </svg>
        </button>
        <button class="title-bar__btn" @click="handleMaximize">
          <svg width="12" height="12" viewBox="0 0 12 12">
            <rect x="1" y="1" width="10" height="10" stroke="currentColor" stroke-width="1.5" fill="none" />
          </svg>
        </button>
        <button class="title-bar__btn title-bar__btn--close" @click="handleClose">
          <svg width="12" height="12" viewBox="0 0 12 12">
            <path d="M1 1L11 11M11 1L1 11" stroke="currentColor" stroke-width="1.5" />
          </svg>
        </button>
      </div>
    </div>

    <!-- Main content -->
    <div class="main-content">
      <!-- Sidebar: playlist with auto-hide -->
      <aside
        class="sidebar"
        v-if="playlist.tracks.length > 0"
        :class="{ 'sidebar--hidden': !sidebarVisible }"
        @click="resetSidebarTimer"
        @mouseenter="resetSidebarTimer"
      >
        <div class="sidebar__inner">
          <Playlist />
        </div>
      </aside>

      <!-- Center -->
      <div class="center">
        <div v-if="playlist.tracks.length === 0" class="empty-state">
          <div class="empty-state__icon">♪</div>
          <h1>Zen·Music</h1>
          <p>拖拽音乐文件到窗口，或点击下方按钮添加</p>
          <button class="add-btn" @click="openFiles">添加音乐</button>
        </div>
        <div v-else class="center__content">
          <VinylDisc />
          <div class="now-playing" :class="{ 'zen-fade': zenMode }" v-if="player.currentTrack && theme.currentTheme !== 'vinyl'">
            <div class="now-playing__cover" v-if="player.currentTrack.coverUrl">
              <img :src="player.currentTrack.coverUrl" alt="cover" />
            </div>
            <div class="now-playing__cover now-playing__cover--empty" v-else>
              <span>♪</span>
            </div>
            <div class="now-playing__title">{{ player.currentTrack.title }}</div>
            <div class="now-playing__artist">{{ player.currentTrack.artist }}</div>
          </div>
          <div class="vinyl-info" :class="{ 'zen-fade': zenMode }" v-if="theme.currentTheme === 'vinyl' && player.currentTrack">
            <div class="vinyl-info__title">{{ player.currentTrack.title }}</div>
            <div class="vinyl-info__artist">{{ player.currentTrack.artist }}</div>
          </div>
          <Visualizer />
          <VideoPlayer />
        </div>
      </div>
    </div>

    <!-- Drag overlay -->
    <div class="drag-overlay" v-if="isDraggingOver">
      <div class="drag-overlay__content">
        <span>松开添加音乐</span>
      </div>
    </div>

    <!-- Bottom player bar -->
    <div :class="{ 'zen-fade': zenMode }">
      <Player @toggle-playlist="togglePlaylist" />
    </div>
  </div>
</template>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html, body, #app {
  width: 100%;
  height: 100%;
  overflow: hidden;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  background: var(--bg-primary, #1a1a2e);
  color: var(--text-primary, #e0e0e0);
}

::-webkit-scrollbar {
  width: 6px;
}

::-webkit-scrollbar-track {
  background: transparent;
}

::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 3px;
}

::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.2);
}
</style>

<style scoped>
.app {
  display: flex;
  flex-direction: column;
  height: 100%;
  user-select: none;
}

.title-bar {
  display: flex;
  align-items: center;
  height: var(--titlebar-height, 38px);
  -webkit-app-region: drag;
  background: var(--titlebar-bg, rgba(0, 0, 0, 0.3));
  flex-shrink: 0;
  transition: opacity 0.8s ease;
}

.title-bar__drag {
  flex: 1;
  padding-left: 14px;
}

.title-bar__title {
  font-size: 13px;
  font-weight: 600;
  opacity: 0.8;
}

.title-bar__controls {
  display: flex;
  -webkit-app-region: no-drag;
}

.title-bar__btn {
  width: 46px;
  height: 38px;
  border: none;
  background: transparent;
  color: #ccc;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.15s;
}

.title-bar__btn:hover {
  background: rgba(255, 255, 255, 0.1);
}

.title-bar__btn--close:hover {
  background: #e81123;
  color: white;
}

.main-content {
  flex: 1;
  display: flex;
  min-height: 0;
}

/* Sidebar with auto-hide */
.sidebar {
  width: var(--sidebar-width, 280px);
  flex-shrink: 0;
  overflow: hidden;
  border-right: 1px solid var(--border, rgba(255, 255, 255, 0.06));
  background: var(--bg-secondary, rgba(0, 0, 0, 0.15));
  transition: width 0.3s ease, opacity 0.3s ease;
}

.sidebar--hidden {
  width: 0;
  border-right-width: 0;
  opacity: 0;
  pointer-events: none;
}

.sidebar__inner {
  width: var(--sidebar-width, 280px);
  min-width: var(--sidebar-width, 280px);
  height: 100%;
}

.center {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

.empty-state__icon {
  font-size: 56px;
  opacity: 0.3;
  margin-bottom: 8px;
}

.empty-state h1 {
  font-size: 42px;
  font-weight: 700;
  background: linear-gradient(135deg, var(--accent, #667eea), #764ba2);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.empty-state p {
  font-size: 14px;
  opacity: 0.5;
}

.add-btn {
  margin-top: 8px;
  padding: 10px 28px;
  border: none;
  border-radius: var(--radius-md, 8px);
  background: linear-gradient(135deg, var(--accent, #667eea), #764ba2);
  color: white;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: opacity 0.2s;
}

.add-btn:hover {
  opacity: 0.85;
}

.center__content {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  overflow: hidden;
}

.now-playing {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  transition: opacity 0.8s ease;
}

.now-playing__cover {
  width: 200px;
  height: 200px;
  border-radius: var(--radius-lg, 16px);
  overflow: hidden;
  box-shadow: var(--shadow-lg, 0 8px 32px rgba(0, 0, 0, 0.4));
}

.now-playing__cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.now-playing__cover--empty {
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, var(--accent, #667eea), #764ba2);
  font-size: 80px;
}

.now-playing__title {
  font-size: 20px;
  font-weight: 700;
}

.now-playing__artist {
  font-size: 14px;
  opacity: 0.5;
}

.vinyl-info {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  margin-top: 16px;
  transition: opacity 0.8s ease;
}

.vinyl-info__title {
  font-size: 20px;
  font-weight: 700;
  color: var(--text-primary, #f5e6d3);
}

.vinyl-info__artist {
  font-size: 14px;
  opacity: 0.5;
  color: var(--text-secondary, #c4a882);
}

/* Zen mode: smooth fade for title bar, player bar, track info */
.zen-fade {
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.8s ease;
}

.app--zen {
  cursor: none;
}

.app--zen .zen-fade {
  cursor: none;
}

.drag-overlay {
  position: fixed;
  inset: 0;
  background: rgba(26, 26, 46, 0.9);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
  pointer-events: none;
}

.drag-overlay__content {
  padding: 40px 60px;
  border: 2px dashed var(--accent, rgba(102, 126, 234, 0.6));
  border-radius: var(--radius-lg, 16px);
  font-size: 20px;
  color: var(--accent, #667eea);
}
</style>
