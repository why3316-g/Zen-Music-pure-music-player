<script setup lang="ts">
import { ref, watch, nextTick } from 'vue'
import { usePlayerStore } from '../stores/player'
import { parseLRC, findCurrentLine } from '../utils/lrc-parser'
import type { LyricLine } from '../utils/lrc-parser'

const player = usePlayerStore()

const lines = ref<LyricLine[]>([])
const activeLine = ref(-1)
const containerRef = ref<HTMLElement | null>(null)

// 用 watch 显式追踪 player.currentTime，确保每次更新都触发
watch(() => player.currentTime, (time) => {
  if (lines.value.length === 0) return
  const idx = findCurrentLine(lines.value, time)
  if (idx !== activeLine.value) {
    activeLine.value = idx
    scrollTo(idx)
  }
})

// 歌词加载后也要算一次
watch(lines, () => {
  if (lines.value.length > 0) {
    activeLine.value = findCurrentLine(lines.value, player.currentTime)
    nextTick(() => scrollTo(activeLine.value))
  } else {
    activeLine.value = -1
  }
})

async function scrollTo(idx: number) {
  if (idx < 0 || !containerRef.value) return
  await nextTick()
  const el = containerRef.value.children[idx] as HTMLElement | undefined
  if (!el) return
  const container = containerRef.value
  container.scrollTo({
    top: el.offsetTop - container.clientHeight / 2 + el.clientHeight / 2,
    behavior: 'smooth'
  })
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

watch(() => player.currentTrack, (track) => {
  if (track?.filePath) loadLyrics(track.filePath)
  else lines.value = []
}, { immediate: true })
</script>

<template>
  <div class="lyrics" v-if="lines.length > 0 && activeLine >= 0">
    <div class="lyrics__scroll" ref="containerRef">
      <div
        v-for="(line, i) in lines"
        :key="i"
        class="lyrics__line"
        :class="{
          'lyrics__line--active': i === activeLine,
          'lyrics__line--near': Math.abs(i - activeLine) === 1,
          'lyrics__line--dim': Math.abs(i - activeLine) === 2,
          'lyrics__line--far': Math.abs(i - activeLine) >= 3
        }"
      >{{ line.text }}</div>
    </div>
  </div>
</template>

<style scoped>
.lyrics {
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

.lyrics__line {
  text-align: center;
  padding: 8px 0;
  font-size: 15px;
  line-height: 1.6;
  color: var(--text-tertiary, #888);
  transition: color 0.35s ease, font-size 0.35s ease, opacity 0.35s ease, font-weight 0.35s ease;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.lyrics__line--active {
  font-size: 22px;
  font-weight: 700;
  color: var(--accent, #667eea);
}

.lyrics__line--near {
  font-size: 15px;
  color: var(--text-secondary, #ccc);
  opacity: 0.7;
}

.lyrics__line--dim {
  opacity: 0.35;
}

.lyrics__line--far {
  opacity: 0.15;
}
</style>
