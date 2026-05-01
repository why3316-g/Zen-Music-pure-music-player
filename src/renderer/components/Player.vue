<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import { usePlayerStore } from '../stores/player'
import { usePlaylistStore } from '../stores/playlist'
import { audioEngine } from '../services/audio-engine'
import { formatTime } from '../utils/format'
import type { PlayMode } from '../utils/types'

const player = usePlayerStore()
const playlist = usePlaylistStore()

const progressRef = ref<HTMLDivElement>()
const isDragging = ref(false)

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

async function togglePlay() {
  if (!player.currentTrack) return
  if (audioEngine.playing) {
    audioEngine.pause()
    player.isPlaying = false
  } else {
    await audioEngine.play()
    player.isPlaying = true
    audioEngine.connectAnalyser()
  }
}

function seekFromEvent(e: MouseEvent) {
  if (!progressRef.value) return
  const rect = progressRef.value.getBoundingClientRect()
  const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width))
  const time = ratio * player.duration
  audioEngine.seek(time)
  player.seek(time)
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
  isDragging.value = false
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
})

watch(() => player.volume, (v) => audioEngine.setVolume(v))
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

    <!-- Controls -->
    <div class="player__controls">
      <button class="ctrl-btn" @click="playPrev" title="上一曲">⏮</button>
      <button class="ctrl-btn ctrl-btn--play" @click="togglePlay">
        {{ player.isPlaying ? '⏸' : '▶' }}
      </button>
      <button class="ctrl-btn" @click="playNext" title="下一曲">⏭</button>
    </div>

    <!-- Progress -->
    <div class="player__progress">
      <span class="time-label">{{ formatTime(player.currentTime) }}</span>
      <div
        class="progress-bar"
        ref="progressRef"
        @mousedown="onProgressDown"
      >
        <div class="progress-bar__fill" :style="{ width: (player.progress * 100) + '%' }" />
        <div class="progress-bar__thumb" :style="{ left: (player.progress * 100) + '%' }" />
      </div>
      <span class="time-label">{{ formatTime(player.duration) }}</span>
    </div>

    <!-- Volume & mode -->
    <div class="player__extra">
      <button class="ctrl-btn ctrl-btn--small" @click="cyclePlayMode" :title="playModeLabels[player.playMode]">
        {{ playModeIcons[player.playMode] }}
      </button>
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
</template>

<style scoped>
.player {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 12px 20px;
  background: var(--bg-player, rgba(0, 0, 0, 0.4));
  backdrop-filter: blur(20px);
  border-top: 1px solid var(--border, rgba(255, 255, 255, 0.06));
  min-height: var(--player-height, 72px);
}

.player__track {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 220px;
  flex-shrink: 0;
}

.player__cover {
  width: 44px;
  height: 44px;
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
  font-size: 20px;
}

.player__meta {
  min-width: 0;
}

.player__title {
  font-size: 13px;
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 160px;
}

.player__artist {
  font-size: 11px;
  opacity: 0.5;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 160px;
}

.player__controls {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.ctrl-btn {
  border: none;
  background: none;
  color: #e0e0e0;
  cursor: pointer;
  font-size: 18px;
  width: 36px;
  height: 36px;
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
  font-size: 22px;
  background: rgba(255, 255, 255, 0.1);
}

.ctrl-btn--play:hover {
  background: rgba(255, 255, 255, 0.2);
}

.ctrl-btn--small {
  font-size: 14px;
  width: 28px;
  height: 28px;
}

.player__progress {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}

.time-label {
  font-size: 11px;
  opacity: 0.5;
  flex-shrink: 0;
  width: 36px;
  text-align: center;
}

.progress-bar {
  flex: 1;
  height: 4px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 2px;
  position: relative;
  cursor: pointer;
}

.progress-bar:hover {
  height: 6px;
}

.progress-bar__fill {
  height: 100%;
  background: linear-gradient(90deg, var(--accent, #667eea), #764ba2);
  border-radius: 2px;
  transition: width 0.1s linear;
}

.progress-bar__thumb {
  position: absolute;
  top: 50%;
  width: 12px;
  height: 12px;
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
  align-items: center;
  gap: 6px;
  width: 160px;
  flex-shrink: 0;
  justify-content: flex-end;
}

.vol-icon {
  font-size: 14px;
  opacity: 0.6;
}

.vol-slider {
  width: 80px;
  height: 4px;
  -webkit-appearance: none;
  appearance: none;
  background: rgba(255, 255, 255, 0.15);
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
}
</style>
