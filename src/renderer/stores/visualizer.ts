import { defineStore } from 'pinia'
import { ref } from 'vue'

export type VisualizerType = 'bars' | 'arc' | 'wave'

export const useVisualizerStore = defineStore('visualizer', () => {
  const type = ref<VisualizerType>('wave')

  function setType(t: VisualizerType) {
    type.value = t
    localStorage.setItem('zen-music-visualizer', t)
  }

  function init() {
    const saved = localStorage.getItem('zen-music-visualizer')
    if (saved) type.value = saved as VisualizerType
  }

  return { type, setType, init }
})
