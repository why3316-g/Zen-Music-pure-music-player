import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { TrackInfo } from '../utils/types'

export const usePlaylistStore = defineStore('playlist', () => {
  const tracks = ref<TrackInfo[]>([])
  const currentIndex = ref(-1)

  const currentTrack = computed(() =>
    currentIndex.value >= 0 ? tracks.value[currentIndex.value] : null
  )

  function addTracks(newTracks: TrackInfo[]) {
    const startIdx = tracks.value.length
    tracks.value.push(...newTracks)
    if (currentIndex.value === -1 && newTracks.length > 0) {
      currentIndex.value = startIdx
    }
  }

  function removeTrack(index: number) {
    tracks.value.splice(index, 1)
    if (tracks.value.length === 0) {
      currentIndex.value = -1
    } else if (index < currentIndex.value) {
      currentIndex.value--
    } else if (index === currentIndex.value) {
      currentIndex.value = Math.min(currentIndex.value, tracks.value.length - 1)
    }
  }

  function clear() {
    tracks.value = []
    currentIndex.value = -1
  }

  function setCurrentIndex(index: number) {
    if (index >= 0 && index < tracks.value.length) {
      currentIndex.value = index
    }
  }

  function next(): number {
    if (tracks.value.length === 0) return -1
    currentIndex.value = (currentIndex.value + 1) % tracks.value.length
    return currentIndex.value
  }

  function prev(): number {
    if (tracks.value.length === 0) return -1
    currentIndex.value = (currentIndex.value - 1 + tracks.value.length) % tracks.value.length
    return currentIndex.value
  }

  return {
    tracks,
    currentIndex,
    currentTrack,
    addTracks,
    removeTrack,
    clear,
    setCurrentIndex,
    next,
    prev
  }
})
