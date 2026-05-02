<script setup lang="ts">
import { computed, ref, watch, onMounted, nextTick } from 'vue'
import { usePlayerStore } from '../stores/player'
import { audioEngine } from '../services/audio-engine'

const player = usePlayerStore()

const isVideo = computed(() => {
  const ext = player.currentTrack?.filePath.split('.').pop()?.toLowerCase()
  return ['mp4', 'mkv', 'avi', 'webm'].includes(ext || '')
})

const containerRef = ref<HTMLDivElement>()

async function attachMedia() {
  await nextTick()
  if (!containerRef.value) return
  const media = audioEngine.getMediaElement()
  media.style.width = '100%'
  media.style.height = '100%'
  media.style.objectFit = 'contain'
  media.style.display = 'block'
  media.style.background = '#000'
  containerRef.value.appendChild(media)
}

function detachMedia() {
  audioEngine.returnMedia()
}

watch(isVideo, async (show) => {
  if (show) {
    await attachMedia()
  } else {
    detachMedia()
  }
})

watch(() => player.currentTrack?.filePath, async () => {
  if (isVideo.value) {
    // Small delay to let the new src load, then re-attach
    setTimeout(async () => {
      await attachMedia()
    }, 100)
  }
})

onMounted(async () => {
  if (isVideo.value) {
    await attachMedia()
  }
})
</script>

<template>
  <div
    ref="containerRef"
    class="video-container"
    v-if="isVideo && player.currentTrack"
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
