<script setup lang="ts">
import { usePlaylistStore } from '../stores/playlist'
import { usePlayerStore } from '../stores/player'
import { audioEngine } from '../services/audio-engine'
import { formatTime } from '../utils/format'

const playlist = usePlaylistStore()
const player = usePlayerStore()

async function playTrack(index: number) {
  playlist.setCurrentIndex(index)
  const track = playlist.tracks[index]
  if (track) {
    player.setTrack(track)
    await audioEngine.load(track.filePath)
    audioEngine.connectAnalyser()
  }
}

function removeTrack(index: number) {
  playlist.removeTrack(index)
}
</script>

<template>
  <div class="playlist" v-if="playlist.tracks.length > 0">
    <div class="playlist__header">
      <span>播放列表 ({{ playlist.tracks.length }})</span>
    </div>
    <div class="playlist__list">
      <div
        v-for="(track, i) in playlist.tracks"
        :key="track.filePath"
        class="playlist__item"
        :class="{ 'playlist__item--active': i === playlist.currentIndex }"
        @click="playTrack(i)"
      >
        <div class="playlist__item-index">
          <span v-if="i === playlist.currentIndex && player.isPlaying">♪</span>
          <span v-else>{{ i + 1 }}</span>
        </div>
        <div class="playlist__item-meta">
          <div class="playlist__item-title">{{ track.title }}</div>
          <div class="playlist__item-artist">{{ track.artist }}</div>
        </div>
        <span class="playlist__item-duration">{{ formatTime(track.duration) }}</span>
        <button class="playlist__item-remove" @click.stop="removeTrack(i)">✕</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.playlist {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.playlist__header {
  padding: 12px 16px;
  font-size: 12px;
  font-weight: 600;
  opacity: 0.5;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
}

.playlist__list {
  flex: 1;
  overflow-y: auto;
  padding: 4px 0;
}

.playlist__item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 16px;
  cursor: pointer;
  transition: background 0.15s;
}

.playlist__item:hover {
  background: rgba(255, 255, 255, 0.05);
}

.playlist__item--active {
  background: rgba(102, 126, 234, 0.15);
}

.playlist__item--active .playlist__item-title {
  color: #667eea;
}

.playlist__item-index {
  width: 24px;
  text-align: center;
  font-size: 12px;
  opacity: 0.4;
  flex-shrink: 0;
}

.playlist__item--active .playlist__item-index {
  opacity: 1;
  color: #667eea;
}

.playlist__item-meta {
  flex: 1;
  min-width: 0;
}

.playlist__item-title {
  font-size: 13px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.playlist__item-artist {
  font-size: 11px;
  opacity: 0.4;
}

.playlist__item-duration {
  font-size: 11px;
  opacity: 0.4;
  flex-shrink: 0;
}

.playlist__item-remove {
  border: none;
  background: none;
  color: rgba(255, 255, 255, 0.3);
  cursor: pointer;
  font-size: 12px;
  padding: 4px;
  border-radius: 4px;
  opacity: 0;
  transition: opacity 0.15s;
  flex-shrink: 0;
}

.playlist__item:hover .playlist__item-remove {
  opacity: 1;
}

.playlist__item-remove:hover {
  color: #e81123;
}
</style>
