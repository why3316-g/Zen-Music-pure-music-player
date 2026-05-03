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
    <!-- Progress bar: sits at top as a divider line -->
    <div class="player__progress-wrap">
      <span class="time-label time-label--left">{{ formatTime(displayTime) }}</span>
      <div
        class="progress-bar"
        ref="progressRef"
        @mousedown="onProgressDown"
      >
        <div class="progress-bar__fill" :style="{ width: (displayProgress * 100) + '%' }" />
      </div>
      <span class="time-label time-label--right">{{ formatTime(player.duration) }}</span>
    </div>

    <!-- Controls row -->
    <div class="player__row">
      <!-- Left: playlist toggle -->
      <button class="player__playlist-btn" @click="emit('toggle-playlist')" title="播放列表">
        <svg width="22" height="22" viewBox="0 0 22 22" fill="currentColor">
          <rect x="2" y="3" width="14" height="1.6" rx="0.8" />
          <rect x="2" y="7.5" width="14" height="1.6" rx="0.8" />
          <rect x="2" y="12" width="10" height="1.6" rx="0.8" />
          <circle cx="16" cy="13.5" r="3" fill="none" stroke="currentColor" stroke-width="1.4" />
          <line x1="19" y1="16.5" x2="21" y2="18.5" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" />
        </svg>
      </button>

      <!-- Center: transport controls -->
      <div class="player__transport">
        <button class="ctrl-btn" @click="playPrev" title="上一曲">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <rect x="2" y="3" width="2" height="10" />
            <path d="M14 3L6 8L14 13Z" />
          </svg>
        </button>
        <button class="ctrl-btn ctrl-btn--play" @click="togglePlay">
          <svg v-if="player.isPlaying" width="18" height="18" viewBox="0 0 18 18" fill="currentColor">
            <rect x="3" y="2" width="4" height="14" rx="1" />
            <rect x="11" y="2" width="4" height="14" rx="1" />
          </svg>
          <svg v-else width="18" height="18" viewBox="0 0 18 18" fill="currentColor">
            <path d="M4 2L15 9L4 16Z" />
          </svg>
        </button>
        <button class="ctrl-btn" @click="playNext" title="下一曲">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <rect x="12" y="3" width="2" height="10" />
            <path d="M2 3L10 8L2 13Z" />
          </svg>
        </button>
      </div>

      <!-- Right: play mode + timer + volume -->
      <div class="player__extra">
        <button class="ctrl-btn ctrl-btn--small" @click="cyclePlayMode" :title="playModeLabels[player.playMode]">
          {{ playModeIcons[player.playMode] }}
        </button>
        <SleepTimer />
        <div class="vol-group">
          <svg class="vol-icon" width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <path d="M2 5.5h2.5L8 2v12L4.5 10.5H2V5.5z" />
            <path v-if="player.volume > 0.5" d="M10.5 4.5c1.2 1 2 2.2 2 3.5s-.8 2.5-2 3.5" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" />
            <path v-if="player.volume > 0" d="M12 2.5c1.8 1.5 3 3.3 3 5.5s-1.2 4-3 5.5" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" />
          </svg>
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
  </div>
</template>

<style scoped>
.player {
  display: flex;
  flex-direction: column;
  background: var(--bg-player, rgba(0, 0, 0, 0.4));
  backdrop-filter: blur(20px);
}

/* Progress bar as top divider */
.player__progress-wrap {
  display: flex;
  align-items: center;
  height: 24px;
  padding: 0 16px;
  gap: 8px;
}

.progress-bar {
  flex: 1;
  height: 3px;
  background: rgba(255, 255, 255, 0.08);
  border-radius: 2px;
  position: relative;
  cursor: pointer;
  transition: height 0.15s;
}

.progress-bar:hover {
  height: 5px;
}

.progress-bar__fill {
  height: 100%;
  background: var(--accent, #667eea);
  border-radius: 2px;
  transition: width 0.1s linear;
  position: relative;
}

.progress-bar:hover .progress-bar__fill::after {
  content: '';
  position: absolute;
  right: -5px;
  top: 50%;
  transform: translateY(-50%);
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: white;
  box-shadow: 0 0 4px rgba(0, 0, 0, 0.3);
}

.time-label {
  font-size: 11px;
  opacity: 0.4;
  font-variant-numeric: tabular-nums;
  flex-shrink: 0;
  width: 36px;
  user-select: none;
}

.time-label--left {
  text-align: right;
}

.time-label--right {
  text-align: left;
}

/* Controls row */
.player__row {
  display: flex;
  align-items: center;
  padding: 4px 20px 12px;
  gap: 0;
}

/* Playlist button: left side, larger */
.player__playlist-btn {
  width: 40px;
  height: 40px;
  border: none;
  background: none;
  color: var(--text-secondary, #999);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  transition: background 0.15s, color 0.15s;
  flex-shrink: 0;
}

.player__playlist-btn:hover {
  background: rgba(255, 255, 255, 0.08);
  color: var(--text-primary, #fff);
}

/* Transport controls: center */
.player__transport {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.ctrl-btn {
  border: none;
  background: none;
  color: var(--text-primary, #e0e0e0);
  cursor: pointer;
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: background 0.15s;
}

.ctrl-btn:hover {
  background: rgba(255, 255, 255, 0.08);
}

.ctrl-btn--play {
  width: 44px;
  height: 44px;
  background: var(--accent, #667eea);
  color: white;
}

.ctrl-btn--play:hover {
  background: var(--accent-hover, #5a6fd6);
  opacity: 0.9;
}

.ctrl-btn--small {
  width: 32px;
  height: 32px;
  font-size: 14px;
}

/* Extra controls: right side */
.player__extra {
  display: flex;
  align-items: center;
  gap: 4px;
  flex-shrink: 0;
}

.vol-group {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-left: 4px;
}

.vol-icon {
  opacity: 0.5;
  flex-shrink: 0;
}

.vol-slider {
  width: 70px;
  height: 3px;
  -webkit-appearance: none;
  appearance: none;
  background: rgba(255, 255, 255, 0.12);
  border-radius: 2px;
  outline: none;
}

.vol-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: white;
  cursor: pointer;
  box-shadow: 0 0 3px rgba(0, 0, 0, 0.3);
}
</style>
