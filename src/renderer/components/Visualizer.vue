<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue'
import { usePlayerStore } from '../stores/player'
import { audioEngine } from '../services/audio-engine'

const player = usePlayerStore()
const canvasRef = ref<HTMLCanvasElement>()
let animId = 0
let dataArray: Uint8Array | null = null

function draw() {
  const canvas = canvasRef.value
  const analyser = audioEngine.getAnalyser()
  if (!canvas || !analyser) return

  const ctx = canvas.getContext('2d')
  if (!ctx) return

  if (!dataArray || dataArray.length !== analyser.frequencyBinCount) {
    dataArray = new Uint8Array(analyser.frequencyBinCount)
  }

  analyser.getByteFrequencyData(dataArray)

  const { width, height } = canvas
  ctx.clearRect(0, 0, width, height)

  const barCount = Math.min(dataArray.length, 64)
  const gap = 2
  const barWidth = (width - gap * (barCount - 1)) / barCount

  for (let i = 0; i < barCount; i++) {
    const value = dataArray[i] / 255
    const barHeight = value * height * 0.9

    const x = i * (barWidth + gap)
    const y = height - barHeight

    const gradient = ctx.createLinearGradient(x, y, x, height)
    gradient.addColorStop(0, 'rgba(102, 126, 234, 0.9)')
    gradient.addColorStop(1, 'rgba(118, 75, 162, 0.4)')

    ctx.fillStyle = gradient
    ctx.beginPath()
    const radius = Math.min(barWidth / 2, 3)
    ctx.moveTo(x + radius, y)
    ctx.lineTo(x + barWidth - radius, y)
    ctx.quadraticCurveTo(x + barWidth, y, x + barWidth, y + radius)
    ctx.lineTo(x + barWidth, height)
    ctx.lineTo(x, height)
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
  canvas.width = rect.width * window.devicePixelRatio
  canvas.height = rect.height * window.devicePixelRatio
  const ctx = canvas.getContext('2d')
  if (ctx) ctx.scale(window.devicePixelRatio, window.devicePixelRatio)
}

watch(() => player.isPlaying, (playing) => {
  if (playing) {
    resizeCanvas()
    startDraw()
  } else {
    stopDraw()
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
  <div class="visualizer" v-if="player.currentTrack">
    <canvas ref="canvasRef" class="visualizer__canvas" />
  </div>
</template>

<style scoped>
.visualizer {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 80px;
  pointer-events: none;
  opacity: 0.6;
}

.visualizer__canvas {
  width: 100%;
  height: 100%;
  display: block;
}
</style>
