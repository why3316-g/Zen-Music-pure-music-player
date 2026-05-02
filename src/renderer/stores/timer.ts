import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useTimerStore = defineStore('timer', () => {
  const totalSeconds = ref(0)
  const remainingSeconds = ref(0)
  const isRunning = ref(false)
  let intervalId: ReturnType<typeof setInterval> | null = null

  const isActive = computed(() => isRunning.value)
  const displayTime = computed(() => {
    const m = Math.floor(remainingSeconds.value / 60)
    const s = remainingSeconds.value % 60
    return `${m}:${s.toString().padStart(2, '0')}`
  })

  const presets = [5, 10, 15, 30, 45, 60, 90, 120]

  function start(minutes: number) {
    stop()
    totalSeconds.value = minutes * 60
    remainingSeconds.value = minutes * 60
    isRunning.value = true

    intervalId = setInterval(() => {
      remainingSeconds.value--
      if (remainingSeconds.value <= 0) {
        stop()
        // Dispatch custom event that App.vue listens to
        window.dispatchEvent(new CustomEvent('timer:expired'))
      }
    }, 1000)
  }

  function stop() {
    if (intervalId) {
      clearInterval(intervalId)
      intervalId = null
    }
    isRunning.value = false
    remainingSeconds.value = 0
  }

  return { totalSeconds, remainingSeconds, isRunning, isActive, displayTime, presets, start, stop }
})
