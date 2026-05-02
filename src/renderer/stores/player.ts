import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { TrackInfo, PlayMode } from '../utils/types'

export const usePlayerStore = defineStore('player', () => {
  const currentTrack = ref<TrackInfo | null>(null)
  const isPlaying = ref(false)
  const currentTime = ref(0)
  const duration = ref(0)
  const volume = ref(0.8)
  const playMode = ref<PlayMode>('loop')

  const progress = computed(() =>
    duration.value > 0 ? currentTime.value / duration.value : 0
  )

  function setTrack(track: TrackInfo, autoPlay = true) {
    currentTrack.value = track
    duration.value = track.duration || 0
    currentTime.value = 0
    isPlaying.value = autoPlay
  }

  function togglePlay() {
    isPlaying.value = !isPlaying.value
  }

  function seek(time: number) {
    currentTime.value = time
  }

  function setVolume(v: number) {
    volume.value = Math.max(0, Math.min(1, v))
  }

  function setPlayMode(mode: PlayMode) {
    playMode.value = mode
  }

  return {
    currentTrack,
    isPlaying,
    currentTime,
    duration,
    volume,
    playMode,
    progress,
    setTrack,
    togglePlay,
    seek,
    setVolume,
    setPlayMode
  }
})
