<script setup lang="ts">
import { ref, watch, computed, nextTick } from 'vue'
import { storeToRefs } from 'pinia'
import { usePlayerStore } from '../stores/player'
import { parseLRC, findCurrentLine } from '../utils/lrc-parser'
import type { LyricLine } from '../utils/lrc-parser'

const store = usePlayerStore()
const { currentTime } = storeToRefs(store)

const lines = ref<LyricLine[]>([])
const containerRef = ref<HTMLElement | null>(null)

const activeLine = computed(() =>
  lines.value.length > 0 ? findCurrentLine(lines.value, currentTime.value) : -1
)

function getLineStyle(i: number) {
  const idx = activeLine.value
  if (idx < 0) return undefined
  const d = Math.abs(i - idx)
  if (d === 0) return {
    fontSize: '22px',
    fontWeight: '700',
    color: 'var(--accent, #667eea)',
    opacity: '1'
  }
  if (d === 1) return {
    fontSize: '15px',
    fontWeight: '400',
    color: 'var(--text-secondary, #ccc)',
    opacity: '0.7'
  }
  if (d === 2) return {
    fontSize: '15px',
    fontWeight: '400',
    color: 'var(--text-tertiary, #888)',
    opacity: '0.35'
  }
  return {
    fontSize: '15px',
    fontWeight: '400',
    color: 'var(--text-tertiary, #888)',
    opacity: '0.15'
  }
}

async function loadLyrics(filePath: string) {
  const lrcPath = filePath.replace(/\.\w+$/, '.lrc')
  try {
    const buf = await window.api.readBuffer(lrcPath)
    if (!buf) { lines.value = []; return }
    const utf8 = new TextDecoder('utf-8').decode(buf)
    const text = utf8.includes('�') ? new TextDecoder('gbk').decode(buf) : utf8
    lines.value = parseLRC(text)
  } catch {
    lines.value = []
  }
}

watch(() => store.currentTrack, (track) => {
  if (track?.filePath) loadLyrics(track.filePath)
  else lines.value = []
}, { immediate: true })

watch(activeLine, (idx) => {
  if (idx >= 0) {
    nextTick(() => {
      const container = containerRef.value
      if (!container) return
      const el = container.children[idx] as HTMLElement | undefined
      if (el) {
        container.scrollTo({
          top: el.offsetTop - container.clientHeight / 2 + el.clientHeight / 2,
          behavior: 'smooth'
        })
      }
    })
  }
})
</script>

<template>
  <div class="lyrics" v-if="lines.length > 0 && activeLine >= 0">
    <div class="lyrics__scroll" ref="containerRef">
      <div
        v-for="(line, i) in lines"
        :key="i"
        class="lyrics__item"
        :style="getLineStyle(i)"
      >{{ line.text }}</div>
    </div>
  </div>
</template>

<style scoped>
.lyrics {
  position: relative;
  z-index: 2;
  width: 100%;
  max-width: 480px;
  padding: 0 24px;
}

.lyrics__scroll {
  height: 200px;
  overflow-y: auto;
  scroll-behavior: smooth;
  padding: 80px 0;
  mask-image: linear-gradient(
    to bottom,
    transparent 0%,
    black 15%,
    black 85%,
    transparent 100%
  );
  -webkit-mask-image: linear-gradient(
    to bottom,
    transparent 0%,
    black 15%,
    black 85%,
    transparent 100%
  );
}

.lyrics__scroll::-webkit-scrollbar {
  display: none;
}

.lyrics__item {
  text-align: center;
  padding: 8px 0;
  font-size: 15px;
  line-height: 1.6;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  transition: all 0.35s ease;
}
</style>
