<script setup lang="ts">
import { computed, ref, watch, onMounted, onBeforeUnmount } from 'vue'
import { usePlayerStore } from '../stores/player'
import { audioEngine } from '../services/audio-engine'

// 和主进程 MIME_TYPES 里的视频格式保持一致
const VIDEO_EXTENSIONS = [
  'mp4', 'mkv', 'avi', 'webm', 'mov', 'wmv',
  'flv', '3gp', 'ts', 'm4v', 'mpeg', 'mpg'
]

const player = usePlayerStore()

const isVideo = computed(() => {
  const ext = player.currentTrack?.filePath.split('.').pop()?.toLowerCase()
  return VIDEO_EXTENSIONS.includes(ext || '')
})

const containerRef = ref<HTMLDivElement>()

/**
 * 只负责登记"画面该挂在哪"，具体搬动由 audioEngine 负责。
 * 容器用 v-show 常驻，ref 永远有效——重复打开同一个视频也不会漏掉重新挂载。
 */
function syncContainer() {
  audioEngine.setVideoContainer(isVideo.value ? containerRef.value ?? null : null)
}

// sync flush：track 一变就立刻登记，赶在 audioEngine.load() 之前，避免画面闪一下
watch(isVideo, syncContainer, { flush: 'sync' })

onMounted(syncContainer)

onBeforeUnmount(() => {
  audioEngine.setVideoContainer(null)
})
</script>

<template>
  <div
    ref="containerRef"
    class="video-container"
    v-show="isVideo && player.currentTrack"
  ></div>
</template>

<style scoped>
.video-container {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: #000;
  z-index: 10;
}
</style>
