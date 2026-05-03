<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { usePlayerStore } from '../stores/player'
import { useVisualizerStore } from '../stores/visualizer'
import { useThemeStore } from '../stores/theme'
import { audioEngine } from '../services/audio-engine'

const player = usePlayerStore()
const viz = useVisualizerStore()
const theme = useThemeStore()
const canvasRef = ref<HTMLCanvasElement>()
let animId = 0
let dataArray: Uint8Array | null = null

const isVideo = computed(() => {
  const ext = player.currentTrack?.filePath.split('.').pop()?.toLowerCase()
  return ['mp4', 'mkv', 'avi', 'webm'].includes(ext || '')
})

const isZen = computed(() => theme.currentTheme === 'zen-ripple' || theme.currentTheme === 'zen-bloom')

/* ── Renderer: Classic Bars ── */
function drawBars(ctx: CanvasRenderingContext2D, w: number, h: number, data: Uint8Array) {
  const barCount = Math.min(data.length, 48)
  const gap = 3
  const barWidth = (w - gap * (barCount - 1)) / barCount

  // Theme colors
  const topColor = isZen.value ? 'rgba(138, 155, 131, 0.95)' : 'rgba(102, 126, 234, 0.95)'
  const midColor = isZen.value ? 'rgba(110, 135, 108, 0.6)' : 'rgba(118, 75, 162, 0.6)'
  const endColor = isZen.value ? 'rgba(110, 135, 108, 0.1)' : 'rgba(118, 75, 162, 0.1)'

  for (let i = 0; i < barCount; i++) {
    const value = data[i] / 255
    const barHeight = value * h * 0.95
    const x = i * (barWidth + gap)
    const y = h - barHeight

    const gradient = ctx.createLinearGradient(x, y, x, h)
    gradient.addColorStop(0, topColor)
    gradient.addColorStop(0.5, midColor)
    gradient.addColorStop(1, endColor)

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
}

/* ── Renderer: Arc around disc (full 360°, zen palette) ── */
function drawArc(ctx: CanvasRenderingContext2D, w: number, h: number, data: Uint8Array) {
  const barCount = 72
  const cx = w / 2
  const cy = h / 2
  // Match the vinyl disc: 310px diameter → 155px radius + 12px gap
  const innerR = Math.min(167, Math.min(w, h) * 0.22)
  const maxLen = Math.min(w, h) * 0.13

  ctx.save()
  ctx.lineCap = 'round'

  // Theme-aware arc colors
  const glowColor = isZen.value ? 'rgba(138, 155, 131, 0.08)' : 'rgba(210, 190, 150, 0.08)'
  const glowRing = isZen.value ? 'rgba(138, 155, 131, 0.015)' : 'rgba(200, 180, 140, 0.015)'
  const shadowBase = isZen.value ? [138, 155, 131] : [218, 195, 145]
  const gradStart = isZen.value ? [138, 160, 131] : [215, 195, 155]
  const gradMid = isZen.value ? [120, 145, 115] : [200, 175, 130]
  const gradEnd = isZen.value ? [105, 130, 100] : [180, 155, 110]

  // Outer soft glow ring
  ctx.shadowBlur = 25
  ctx.shadowColor = glowColor
  ctx.beginPath()
  ctx.arc(cx, cy, innerR + maxLen * 0.5, 0, Math.PI * 2)
  ctx.lineWidth = maxLen
  ctx.strokeStyle = glowRing
  ctx.stroke()
  ctx.shadowBlur = 0

  for (let i = 0; i < barCount; i++) {
    const angle = (i / barCount) * Math.PI * 2 - Math.PI / 2
    const dataIdx = Math.floor(i * Math.min(data.length, 64) / barCount)
    const value = data[dataIdx] / 255
    const len = Math.max(1, value * maxLen)

    const x1 = cx + Math.cos(angle) * innerR
    const y1 = cy + Math.sin(angle) * innerR
    const x2 = cx + Math.cos(angle) * (innerR + len)
    const y2 = cy + Math.sin(angle) * (innerR + len)

    const alpha = 0.15 + value * 0.85

    ctx.shadowBlur = value * 10
    ctx.shadowColor = `rgba(${shadowBase[0]}, ${shadowBase[1]}, ${shadowBase[2]}, ${alpha * 0.35})`

    const gradient = ctx.createLinearGradient(x1, y1, x2, y2)
    gradient.addColorStop(0, `rgba(${gradStart[0]}, ${gradStart[1]}, ${gradStart[2]}, ${alpha * 0.7})`)
    gradient.addColorStop(0.6, `rgba(${gradMid[0]}, ${gradMid[1]}, ${gradMid[2]}, ${alpha * 0.35})`)
    gradient.addColorStop(1, `rgba(${gradEnd[0]}, ${gradEnd[1]}, ${gradEnd[2]}, ${alpha * 0.05})`)

    ctx.beginPath()
    ctx.moveTo(x1, y1)
    ctx.lineTo(x2, y2)
    ctx.lineWidth = 2.5
    ctx.strokeStyle = gradient
    ctx.stroke()
  }

  // Inner ring: subtle warm glow around the disc edge
  ctx.shadowBlur = 12
  ctx.shadowColor = 'rgba(210, 190, 150, 0.15)'
  ctx.beginPath()
  ctx.arc(cx, cy, innerR, 0, Math.PI * 2)
  ctx.lineWidth = 1.2
  ctx.strokeStyle = 'rgba(210, 190, 150, 0.18)'
  ctx.stroke()

  ctx.restore()
}

/* ── Renderer: Smooth Wave ── */
function drawWave(ctx: CanvasRenderingContext2D, w: number, h: number, data: Uint8Array) {
  const points = 48

  const layers = isZen.value
    ? [
        { dataOffset: 0, yShift: 0, alpha: 0.65, r: 138, g: 155, b: 131 },
        { dataOffset: 3, yShift: 6, alpha: 0.35, r: 120, g: 140, b: 115 },
        { dataOffset: 6, yShift: 12, alpha: 0.18, r: 100, g: 125, b: 105 },
      ]
    : [
        { dataOffset: 0, yShift: 0, alpha: 0.65, r: 102, g: 126, b: 234 },
        { dataOffset: 3, yShift: 6, alpha: 0.35, r: 130, g: 100, b: 220 },
        { dataOffset: 6, yShift: 12, alpha: 0.18, r: 118, g: 75, b: 162 },
      ]

  for (const layer of layers) {
    const pts: { x: number; y: number }[] = []
    for (let i = 0; i < points; i++) {
      const idx = Math.min(i + layer.dataOffset, data.length - 1)
      const value = data[idx] / 255
      const x = (i / (points - 1)) * w
      const y = h - value * h * 0.75 + layer.yShift
      pts.push({ x, y })
    }

    ctx.beginPath()
    ctx.moveTo(pts[0].x, pts[0].y)
    for (let i = 1; i < pts.length - 1; i++) {
      const cpx = (pts[i].x + pts[i + 1].x) / 2
      const cpy = (pts[i].y + pts[i + 1].y) / 2
      ctx.quadraticCurveTo(pts[i].x, pts[i].y, cpx, cpy)
    }
    ctx.lineTo(pts[pts.length - 1].x, pts[pts.length - 1].y)

    ctx.lineTo(w, h)
    ctx.lineTo(0, h)
    ctx.closePath()

    const gradient = ctx.createLinearGradient(0, h * 0.15, 0, h)
    gradient.addColorStop(0, `rgba(${layer.r}, ${layer.g}, ${layer.b}, ${layer.alpha})`)
    gradient.addColorStop(1, `rgba(${layer.r}, ${layer.g}, ${layer.b}, 0)`)
    ctx.fillStyle = gradient
    ctx.fill()
  }
}

/* ── Animation Loop ── */
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

  switch (viz.type) {
    case 'bars': drawBars(ctx, w, h, dataArray); break
    case 'arc':  drawArc(ctx, w, h, dataArray);  break
    case 'wave': drawWave(ctx, w, h, dataArray); break
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

watch(() => viz.type, async () => {
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
  <div
    class="visualizer"
    :class="{ 'visualizer--full': viz.type === 'arc' }"
    v-if="player.currentTrack && !isVideo"
  >
    <canvas ref="canvasRef" class="visualizer__canvas" />
  </div>
</template>

<style scoped>
.visualizer {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 120px;
  pointer-events: none;
  opacity: 0.8;
  z-index: 1;
}

.visualizer--full {
  position: absolute;
  inset: 0;
  height: auto;
  opacity: 0.9;
}

.visualizer__canvas {
  width: 100%;
  height: 100%;
  display: block;
}
</style>
