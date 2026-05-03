<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { usePlayerStore } from '../stores/player'
import { usePlaylistStore } from '../stores/playlist'
import { audioEngine } from '../services/audio-engine'
import { formatTime } from '../utils/format'
import type { PlayMode } from '../utils/types'
import SleepTimer from './SleepTimer.vue'

const player = usePlayerStore()
const playlist = usePlaylistStore()

const emit = defineEmits<{
  (e: 'toggle-playlist'): void
}>()

const progressRef = ref<HTMLDivElement>()
const isDragging = ref(false)
const dragTime = ref(0)

const playModeIcons: Record<PlayMode, string> = {
  single: '🔂',
  loop: '🔁',
  shuffle: '🔀'
}
const playModeLabels: Record<PlayMode, string> = {
  single: '单曲循环',
  loop: '列表循环',
  shuffle: '随机播放'
}

const displayTime = computed(() =>
  isDragging.value ? dragTime.value : player.currentTime
)

const displayProgress = computed(() =>
  player.duration > 0 ? displayTime.value / player.duration : 0
)

async function togglePlay() {
  if (!player.currentTrack) return
  if (audioEngine.playing) {
    audioEngine.pause()
    player.isPlaying = false
  } else {
    // If no source loaded (e.g., restored from localStorage), load first
    if (!audioEngine.currentSrc) {
      await audioEngine.load(player.currentTrack.filePath)
    } else {
      await audioEngine.play()
    }
    player.isPlaying = true
    audioEngine.connectAnalyser()
  }
}

function seekFromEvent(e: MouseEvent) {
  if (!progressRef.value) return
  const rect = progressRef.value.getBoundingClientRect()
  const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width))
  dragTime.value = ratio * player.duration
}

function onProgressDown(e: MouseEvent) {
  isDragging.value = true
  seekFromEvent(e)
}

function onProgressMove(e: MouseEvent) {
  if (!isDragging.value) return
  seekFromEvent(e)
}

function onProgressUp() {
  if (!isDragging.value) return
  const targetTime = dragTime.value
  audioEngine.seek(targetTime)
  player.seek(targetTime)
  // Keep isDragging true briefly to prevent timeupdate from overwriting
  setTimeout(() => { isDragging.value = false }, 200)
}

function handleVolumeChange(e: Event) {
  const val = (e.target as HTMLInputElement).value
  player.setVolume(Number(val))
  audioEngine.setVolume(player.volume)
}

function cyclePlayMode() {
  const modes: PlayMode[] = ['loop', 'single', 'shuffle']
  const idx = modes.indexOf(player.playMode)
  player.setPlayMode(modes[(idx + 1) % modes.length])
}

async function playNext() {
  const idx = playlist.next()
  if (idx >= 0 && playlist.tracks[idx]) {
    player.setTrack(playlist.tracks[idx])
    await audioEngine.load(playlist.tracks[idx].filePath)
    audioEngine.connectAnalyser()
  }
}

async function playPrev() {
  const idx = playlist.prev()
  if (idx >= 0 && playlist.tracks[idx]) {
    player.setTrack(playlist.tracks[idx])
    await audioEngine.load(playlist.tracks[idx].filePath)
    audioEngine.connectAnalyser()
  }
}

onMounted(() => {
  audioEngine.onTimeUpdate((time) => {
    if (!isDragging.value) player.seek(time)
  })

  audioEngine.onEnded(() => {
    if (player.playMode === 'single') {
      audioEngine.seek(0)
      audioEngine.play()
    } else {
      playNext()
    }
  })

  window.addEventListener('mouseup', onProgressUp)
  window.addEventListener('mousemove', onProgressMove)

  window.addEventListener('keydown', (e: KeyboardEvent) => {
    if (e.code === 'Space' && e.target === document.body) {
      e.preventDefault()
      togglePlay()
    }
  })
})

onUnmounted(() => {
  window.removeEventListener('mouseup', onProgressUp)
  window.removeEventListener('mousemove', onProgressMove)
})
</script>

<template>
  <div class="player" v-if="player.currentTrack">
    <!-- Track info -->
    <div class="player__track">
      <div class="player__cover" v-if="player.currentTrack.coverUrl">
        <img :src="player.currentTrack.coverUrl" alt="cover" />
      </div>
      <div class="player__cover player__cover--empty" v-else>♪</div>
      <div class="player__meta">
        <div class="player__title">{{ player.currentTrack.title }}</div>
        <div class="player__artist">{{ player.currentTrack.artist }}</div>
      </div>
    </div>

    <!-- Controls + Progress stacked -->
    <div class="player__center">
      <div class="player__controls">
        <button class="ctrl-btn" @click="playPrev" title="上一曲">⏮</button>
        <button class="ctrl-btn ctrl-btn--play" @click="togglePlay">
          {{ player.isPlaying ? '⏸' : '▶' }}
        </button>
        <button class="ctrl-btn" @click="playNext" title="下一曲">⏭</button>
      </div>
      <div class="player__progress">
        <span class="time-label">{{ formatTime(displayTime) }}</span>
        <div
          class="progress-bar"
          ref="progressRef"
          @mousedown="onProgressDown"
        >
          <div class="progress-bar__fill" :style="{ width: (displayProgress * 100) + '%' }" />
          <div class="progress-bar__thumb" :style="{ left: (displayProgress * 100) + '%' }" />
        </div>
        <span class="time-label">{{ formatTime(player.duration) }}</span>
      </div>
    </div>

    <!-- Volume & mode -->
    <div class="player__extra">
      <div class="player__extra-top">
        <button class="ctrl-btn ctrl-btn--small" @click="cyclePlayMode" :title="playModeLabels[player.playMode]">
          {{ playModeIcons[player.playMode] }}
        </button>
        <SleepTimer />
        <button class="ctrl-btn ctrl-btn--small playlist-toggle" @click="emit('toggle-playlist')" title="播放列表">
          <svg width="18" height="18" viewBox="0 0 18 18" fill="currentColor">
            <rect x="1" y="2" width="12" height="1.5" rx="0.75" />
            <rect x="1" y="6" width="12" height="1.5" rx="0.75" />
            <rect x="1" y="10" width="8" height="1.5" rx="0.75" />
            <circle cx="14" cy="11" r="2.5" fill="none" stroke="currentColor" stroke-width="1.3" />
            <line x1="16.5" y1="13.5" x2="18" y2="15" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" />
          </svg>
        </button>
      </div>
      <div class="player__extra-bottom">
        <span class="vol-icon">🔊</span>
        <input
          type="range"
          class="vol-slider"
          min="0"
          max="1"
          step="0.01"
          :value="player.volume"
          @input="handleVolumeChange"
        />
      </div>
    </div>
  </div>
</template>

<style scoped>
.player {
  display: flex;
  align-items: center;
  gap: 20px;
  padding: 16px 24px;
  background: var(--bg-player, rgba(0, 0, 0, 0.4));
  backdrop-filter: blur(20px);
  border-top: 1px solid var(--border, rgba(255, 255, 255, 0.06));
  min-height: 100px;
}

.player__track {
  display: flex;
  align-items: center;
  gap: 14px;
  width: 240px;
  flex-shrink: 0;
}

.player__cover {
  width: 60px;
  height: 60px;
  border-radius: var(--radius-sm, 8px);
  overflow: hidden;
  flex-shrink: 0;
}

.player__cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.player__cover--empty {
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.08);
  font-size: 24px;
}

.player__meta {
  min-width: 0;
}

.player__title {
  font-size: 14px;
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 160px;
}

.player__artist {
  font-size: 12px;
  opacity: 0.5;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 160px;
  margin-top: 2px;
}

.player__center {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  min-width: 0;
}

.player__controls {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-shrink: 0;
}

.ctrl-btn {
  border: none;
  background: none;
  color: #e0e0e0;
  cursor: pointer;
  font-size: 20px;
  width: 42px;
  height: 42px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: background 0.15s;
}

.ctrl-btn:hover {
  background: rgba(255, 255, 255, 0.1);
}

.ctrl-btn--play {
  font-size: 26px;
  background: rgba(255, 255, 255, 0.1);
  width: 48px;
  height: 48px;
}

.ctrl-btn--play:hover {
  background: rgba(255, 255, 255, 0.2);
}

.ctrl-btn--small {
  font-size: 16px;
  width: 32px;
  height: 32px;
}

.player__progress {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}

.time-label {
  font-size: 12px;
  opacity: 0.5;
  flex-shrink: 0;
  width: 40px;
  text-align: center;
  font-variant-numeric: tabular-nums;
}

.progress-bar {
  flex: 1;
  height: 5px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 3px;
  position: relative;
  cursor: pointer;
}

.progress-bar:hover {
  height: 7px;
}

.progress-bar__fill {
  height: 100%;
  background: linear-gradient(90deg, var(--accent, #667eea), #764ba2);
  border-radius: 3px;
  transition: width 0.1s linear;
}

.progress-bar__thumb {
  position: absolute;
  top: 50%;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: white;
  transform: translate(-50%, -50%);
  opacity: 0;
  transition: opacity 0.15s;
  pointer-events: none;
}

.progress-bar:hover .progress-bar__thumb {
  opacity: 1;
}

.player__extra {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 6px;
  width: 200px;
  flex-shrink: 0;
}

.player__extra-top {
  display: flex;
  align-items: center;
  gap: 4px;
  justify-content: flex-end;
}

.player__extra-bottom {
  display: flex;
  align-items: center;
  gap: 8px;
  justify-content: flex-end;
}

.vol-icon {
  font-size: 16px;
  opacity: 0.6;
}

.vol-slider {
  width: 90px;
  height: 5px;
  -webkit-appearance: none;
  appearance: none;
  background: rgba(255, 255, 255, 0.15);
  border-radius: 3px;
  outline: none;
}

.vol-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: white;
  cursor: pointer;
}
</style>
