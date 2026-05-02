<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { usePlayerStore } from '../stores/player'
import { audioEngine } from '../services/audio-engine'

const player = usePlayerStore()
const canvasRef = ref<HTMLCanvasElement>()
let animId = 0
let dataArray: Uint8Array | null = null

const isVideo = computed(() => {
  const ext = player.currentTrack?.filePath.split('.').pop()?.toLowerCase()
  return ['mp4', 'mkv', 'avi', 'webm'].includes(ext || '')
})

function draw() {
  const canvas = canvasRef.value
  const analyser = audioEngine.getAnalyser()

  if (!canvas) {
    animId = requestAnimationFrame(draw)
    return
  }

  if (!analyser) {
    animId = requestAnimationFrame(draw)
    return
  }

  const ctx = canvas.getContext('2d')
  if (!ctx) return

  if (!dataArray || dataArray.length !== analyser.frequencyBinCount) {
    dataArray = new Uint8Array(analyser.frequencyBinCount)
  }

  analyser.getByteFrequencyData(dataArray)

  const w = canvas.width
  const h = canvas.height
  ctx.clearRect(0, 0, w, h)

  const barCount = Math.min(dataArray.length, 48)
  const gap = 3
  const barWidth = (w - gap * (barCount - 1)) / barCount

  for (let i = 0; i < barCount; i++) {
    const value = dataArray[i] / 255
    const barHeight = value * h * 0.95

    const x = i * (barWidth + gap)
    const y = h - barHeight

    const gradient = ctx.createLinearGradient(x, y, x, h)
    gradient.addColorStop(0, 'rgba(102, 126, 234, 0.95)')
    gradient.addColorStop(0.5, 'rgba(118, 75, 162, 0.6)')
    gradient.addColorStop(1, 'rgba(118, 75, 162, 0.1)')

    ctx.fillStyle = gradient
    ctx.beginPath()
    const radius = Math.min(barWidth / 2, 3)
    ctx.moveTo(x + radius, y)
    ctx.lineTo(x + barWidth - radius, y)
    ctx.quadraticCurveTo(x + barWidth, y, x + barWidth, y + radius)
    ctx.lineTo(x + barWidth, h)
    ctx.lineTo(x, h)
    ctx.lineTo(x, y + radius)
    ctx.quadraticCurveTo(x, y, x + radius, y)
    ctx.fill()
  }

  animId = requestAnimationFrame(draw)
}

function startDraw() {
  cancelAnimationFrame(animId)
  draw()
}

function stopDraw() {
  cancelAnimationFrame(animId)
  if (canvasRef.value) {
    const ctx = canvasRef.value.getContext('2d')
    ctx?.clearRect(0, 0, canvasRef.value.width, canvasRef.value.height)
  }
}

function resizeCanvas() {
  const canvas = canvasRef.value
  if (!canvas) return
  const rect = canvas.getBoundingClientRect()
  canvas.width = rect.width
  canvas.height = rect.height
}

async function restartDraw() {
  await nextTick()
  resizeCanvas()
  stopDraw()
  startDraw()
}

watch(() => player.isPlaying, async (playing) => {
  if (playing) {
    await restartDraw()
  } else {
    stopDraw()
  }
}, { immediate: true })

watch(() => player.currentTrack?.filePath, async () => {
  if (player.isPlaying) {
    await restartDraw()
  }
})

onMounted(() => {
  resizeCanvas()
  window.addEventListener('resize', resizeCanvas)
})

onUnmounted(() => {
  stopDraw()
  window.removeEventListener('resize', resizeCanvas)
})
</script>

<template>
  <div class="visualizer" v-if="player.currentTrack && !isVideo">
    <canvas ref="canvasRef" class="visualizer__canvas" />
  </div>
</template>

<style scoped>
.visualizer {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 100px;
  pointer-events: none;
  opacity: 0.7;
  z-index: 1;
}

.visualizer__canvas {
  width: 100%;
  height: 100%;
  display: block;
}
</style>
