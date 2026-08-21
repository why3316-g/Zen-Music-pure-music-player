<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { usePlayerStore } from '../stores/player'
import { useSettingsStore } from '../stores/settings'
import { audioEngine } from '../services/audio-engine'
import { playbackMemory } from '../services/playback-memory'
import { playNext, playPrev } from '../services/playback-controller'
import { formatTime } from '../utils/format'
import { handlePlaybackShortcut } from '../utils/playback-shortcuts'
import type { PlayMode } from '../utils/types'
import SleepTimer from './SleepTimer.vue'

const player = usePlayerStore()
const settings = useSettingsStore()

const emit = defineEmits<{
  (e: 'toggle-playlist'): void
}>()

const progressRef = ref<HTMLDivElement>()
const isDragging = ref(false)
const dragTime = ref(0)

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

const progressSeconds = computed(() => Math.round(displayTime.value))
const durationSeconds = computed(() => Math.round(player.duration))

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

/** 相对当前位置快进/后退，同步更新进度条 */
function seekBy(deltaSeconds: number) {
  if (!player.currentTrack) return
  const target = audioEngine.seekBy(deltaSeconds)
  player.seek(target)
}

function onPlaybackKeyDown(e: KeyboardEvent) {
  handlePlaybackShortcut(
    e,
    { togglePlay, playPrev, playNext, seekBy },
    { arrowKeyAction: settings.arrowKeyAction, seekStep: settings.seekStep }
  )
}

onMounted(() => {
  audioEngine.onTimeUpdate((time) => {
    if (!isDragging.value) player.seek(time)

    // 元数据里的时长对视频常常是 0，用真实时长兜底，否则进度条没法用
    const realDuration = audioEngine.duration
    if (realDuration > 0 && Math.abs(realDuration - player.duration) > 1) {
      player.duration = realDuration
    }

    playbackMemory.remember(player.currentTrack?.filePath, time, player.duration)
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

  window.addEventListener('keydown', onPlaybackKeyDown)
})

onUnmounted(() => {
  window.removeEventListener('mouseup', onProgressUp)
  window.removeEventListener('mousemove', onProgressMove)
  window.removeEventListener('keydown', onPlaybackKeyDown)
})
</script>

<template>
  <div class="player" v-if="player.currentTrack">
    <!-- Progress bar: sits at top as a divider line -->
    <div class="player__progress-wrap">
      <span class="time-label time-label--left">{{ formatTime(displayTime) }}</span>
      <div
        class="progress-bar"
        :class="{ 'progress-bar--active': isDragging }"
        ref="progressRef"
        @mousedown="onProgressDown"
        role="slider"
        aria-label="播放进度"
        aria-valuemin="0"
        :aria-valuemax="durationSeconds"
        :aria-valuenow="progressSeconds"
        :aria-valuetext="formatTime(displayTime)"
      >
        <div class="progress-bar__track">
          <div class="progress-bar__fill" :style="{ width: (displayProgress * 100) + '%' }">
            <span class="progress-bar__knob" />
          </div>
        </div>
      </div>
      <span class="time-label time-label--right">{{ formatTime(player.duration) }}</span>
    </div>

    <!-- Controls row -->
    <div class="player__row">
      <!-- Left: playlist toggle -->
      <button class="player__playlist-btn" @click="emit('toggle-playlist')" title="播放列表">
        <svg width="24" height="24" viewBox="0 0 22 22" fill="currentColor">
          <rect x="2" y="3" width="14" height="1.8" rx="0.9" />
          <rect x="2" y="7.5" width="14" height="1.8" rx="0.9" />
          <rect x="2" y="12" width="10" height="1.8" rx="0.9" />
          <circle cx="16" cy="13.5" r="3" fill="none" stroke="currentColor" stroke-width="1.5" />
          <line x1="19" y1="16.5" x2="21" y2="18.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
        </svg>
      </button>

      <!-- Center: transport controls -->
      <div class="player__transport">
        <button class="ctrl-btn" @click="playPrev" title="上一曲">
          <svg width="18" height="18" viewBox="0 0 16 16" fill="currentColor">
            <rect x="2" y="3" width="2.5" height="10" />
            <path d="M14 3L6 8L14 13Z" />
          </svg>
        </button>
        <button class="ctrl-btn ctrl-btn--play" @click="togglePlay">
          <svg v-if="player.isPlaying" width="22" height="22" viewBox="0 0 18 18" fill="currentColor">
            <rect x="3" y="2" width="4" height="14" rx="1" />
            <rect x="11" y="2" width="4" height="14" rx="1" />
          </svg>
          <svg v-else width="22" height="22" viewBox="0 0 18 18" fill="currentColor">
            <path d="M4 2L15 9L4 16Z" />
          </svg>
        </button>
        <button class="ctrl-btn" @click="playNext" title="下一曲">
          <svg width="18" height="18" viewBox="0 0 16 16" fill="currentColor">
            <rect x="12" y="3" width="2.5" height="10" />
            <path d="M2 3L10 8L2 13Z" />
          </svg>
        </button>
      </div>

      <!-- Right: play mode + timer + volume -->
      <div class="player__extra">
        <button class="ctrl-btn ctrl-btn--small ctrl-btn--accent" @click="cyclePlayMode" :title="playModeLabels[player.playMode]">
          <!-- Loop -->
          <svg v-if="player.playMode === 'loop'" width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
            <path d="M3 10c0-3 2.5-5.5 5.5-5.5h4" />
            <polyline points="11 2 14 4.5 11 7" />
            <path d="M17 10c0 3-2.5 5.5-5.5 5.5h-4" />
            <polyline points="9 18 6 15.5 9 13" />
          </svg>
          <!-- Single repeat -->
          <svg v-else-if="player.playMode === 'single'" width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
            <path d="M3 10c0-3 2.5-5.5 5.5-5.5h4" />
            <polyline points="11 2 14 4.5 11 7" />
            <path d="M17 10c0 3-2.5 5.5-5.5 5.5h-4" />
            <polyline points="9 18 6 15.5 9 13" />
            <text x="10" y="12.5" text-anchor="middle" font-size="7" font-weight="700" fill="currentColor" stroke="none">1</text>
          </svg>
          <!-- Shuffle -->
          <svg v-else width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
            <path d="M3 5h3l3 5-3 5H3" />
            <path d="M17 5h-3l-3 5 3 5h3" />
            <polyline points="15 2 17.5 5 15 8" />
            <polyline points="15 12 17.5 15 15 18" />
          </svg>
        </button>
        <SleepTimer />
        <div class="vol-group">
          <svg class="vol-icon" width="18" height="18" viewBox="0 0 18 18" fill="currentColor">
            <path d="M2 6h3L9 2v14L5 12H2V6z" />
            <path v-if="player.volume > 0.5" d="M11.5 5c1.4 1.1 2.2 2.4 2.2 4s-.8 2.9-2.2 4" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" />
            <path v-if="player.volume > 0" d="M13.5 3c2 1.7 3.3 3.6 3.3 6s-1.3 4.3-3.3 6" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" />
          </svg>
          <input
            type="range"
            class="vol-slider"
            min="0"
            max="1"
            step="0.01"
            :value="player.volume"
            :style="{ '--vol-fill': (player.volume * 100) + '%' }"
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
  /* backdrop-filter 会造出层叠上下文；不抬 z-index 的话，
     定时暂停等向上弹出的面板会被视频画面（z-index:10）盖住 */
  position: relative;
  z-index: 20;
}

/* Progress bar as top divider */
.player__progress-wrap {
  display: flex;
  align-items: center;
  height: 28px;
  padding: 0 20px;
  gap: 10px;
}

/* 外层只当点击热区：细线本身太难点中 */
.progress-bar {
  flex: 1;
  height: 18px;
  display: flex;
  align-items: center;
  cursor: pointer;
}

/* 未播放段落也要有颜色，否则在米黄背景上完全看不见 */
.progress-bar__track {
  position: relative;
  width: 100%;
  height: 5px;
  border-radius: 3px;
  background: var(--track-bg, rgba(128, 128, 128, 0.28));
  transition: height 0.15s ease, background 0.15s ease;
}

.progress-bar:hover .progress-bar__track,
.progress-bar--active .progress-bar__track {
  height: 7px;
  background: var(--track-bg-hover, rgba(128, 128, 128, 0.42));
}

.progress-bar__fill {
  position: relative;
  height: 100%;
  background: var(--accent, #667eea);
  border-radius: 3px;
  transition: width 0.1s linear;
}

/* 常驻圆点：既标出播放位置，也提示这条可以拖 */
.progress-bar__knob {
  position: absolute;
  right: 0;
  top: 50%;
  width: 11px;
  height: 11px;
  border-radius: 50%;
  background: var(--accent, #667eea);
  transform: translate(50%, -50%);
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.32);
  transition: width 0.15s ease, height 0.15s ease;
}

.progress-bar:hover .progress-bar__knob,
.progress-bar--active .progress-bar__knob {
  width: 14px;
  height: 14px;
}

.time-label {
  font-size: 12px;
  opacity: 0.4;
  font-variant-numeric: tabular-nums;
  flex-shrink: 0;
  width: 40px;
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
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  padding: 6px 24px 16px;
}

/* Playlist button: left side, larger */
.player__playlist-btn {
  width: 48px;
  height: 48px;
  justify-self: start;
  border: none;
  background: none;
  color: var(--text-secondary, #999);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 10px;
  transition: background 0.15s, color 0.15s;
  flex-shrink: 0;
}

.player__playlist-btn:hover {
  background: var(--control-bg-hover, rgba(128, 128, 128, 0.14));
  color: var(--text-primary, #fff);
}

.player__playlist-btn:active {
  transform: scale(0.94);
}

.player__playlist-btn:focus-visible {
  outline: 2px solid var(--accent, #667eea);
  outline-offset: 2px;
}

/* Transport controls: center — grid auto column */
.player__transport {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
}

.ctrl-btn {
  border: none;
  background: none;
  color: var(--text-primary, #e0e0e0);
  cursor: pointer;
  width: 42px;
  height: 42px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: background 0.15s;
}

.ctrl-btn:hover {
  background: var(--control-bg-hover, rgba(128, 128, 128, 0.14));
}

.ctrl-btn:active {
  transform: scale(0.94);
}

.ctrl-btn:focus-visible {
  outline: 2px solid var(--accent, #667eea);
  outline-offset: 2px;
}

.ctrl-btn--play {
  width: 52px;
  height: 52px;
  background: var(--accent, #667eea);
  color: white;
}

.ctrl-btn--play:hover {
  background: var(--accent-hover, #5a6fd6);
  opacity: 0.9;
}

.ctrl-btn--small {
  width: 38px;
  height: 38px;
}

/* Accent-colored icon buttons (play mode, timer) */
.ctrl-btn--accent {
  color: var(--accent, #667eea);
}

.ctrl-btn--accent:hover {
  background: var(--accent-soft, rgba(102, 126, 234, 0.12));
}

/* Extra controls: right side */
.player__extra {
  display: flex;
  align-items: center;
  gap: 6px;
  justify-self: end;
}

.vol-group {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-left: 6px;
}

.vol-icon {
  opacity: 0.5;
  flex-shrink: 0;
}

.vol-slider {
  width: 80px;
  height: 4px;
  -webkit-appearance: none;
  appearance: none;
  background: transparent;
  outline: none;
}

.vol-slider::-webkit-slider-runnable-track {
  height: 4px;
  border-radius: 2px;
  background: linear-gradient(to right, var(--accent, #667eea) var(--vol-fill, 100%), var(--track-bg, rgba(128, 128, 128, 0.28)) var(--vol-fill, 100%));
}

.vol-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: var(--accent, #667eea);
  cursor: pointer;
  margin-top: -5px;
  box-shadow: 0 0 3px rgba(0, 0, 0, 0.3);
}
</style>
