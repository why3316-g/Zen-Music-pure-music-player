<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { usePlayerStore } from '../stores/player'
import { useThemeStore } from '../stores/theme'

const player = usePlayerStore()
const theme = useThemeStore()

const isVinyl = computed(() => theme.currentTheme === 'vinyl')
const coverUrl = computed(() => player.currentTrack?.coverUrl)

// Tonearm swings from rest to playing on each track change
const tonearmActive = ref(false)
let tonearmTimer: ReturnType<typeof setTimeout> | null = null

function activateTonearm() {
  tonearmActive.value = false
  if (tonearmTimer) clearTimeout(tonearmTimer)
  tonearmTimer = setTimeout(() => {
    tonearmActive.value = true
  }, 800)
}

function deactivateTonearm() {
  if (tonearmTimer) clearTimeout(tonearmTimer)
  tonearmActive.value = false
}

// Animate on track change
watch(() => player.currentTrack?.filePath, () => {
  if (player.isPlaying) activateTonearm()
  else deactivateTonearm()
})

// Animate on play/pause
watch(() => player.isPlaying, (playing) => {
  if (playing) activateTonearm()
  else deactivateTonearm()
})
</script>

<template>
  <div class="vinyl-player" v-if="isVinyl && player.currentTrack">
    <!-- Tonearm: swings from rest to playing on each track -->
    <div class="tonearm" :class="{ 'tonearm--playing': tonearmActive }">
      <div class="tonearm__arm">
        <div class="tonearm__head">
          <div class="tonearm__needle"></div>
        </div>
      </div>
      <div class="tonearm__base">
        <div class="tonearm__pivot"></div>
      </div>
    </div>

    <!-- Vinyl disc -->
    <div class="disc" :class="{ 'disc--playing': player.isPlaying }">
      <div class="disc__label">
        <img v-if="coverUrl" :src="coverUrl" alt="cover" class="disc__cover" />
        <span v-else class="disc__note">♪</span>
      </div>
      <div class="disc__center-hole"></div>
      <div class="disc__shine"></div>
    </div>
  </div>
</template>

<style scoped>
.vinyl-player {
  position: relative;
  width: 340px;
  height: 340px;
  margin: 0 auto;
}

/* Tonearm */
.tonearm {
  position: absolute;
  top: 0;
  right: 40px;
  z-index: 2;
  transform-origin: 50% 12px;
  transform: rotate(-25deg);
  transition: transform 0.8s cubic-bezier(0.4, 0, 0.2, 1);
}

.tonearm--playing {
  transform: rotate(5deg);
}

.tonearm__base {
  position: relative;
  z-index: 2;
}

.tonearm__pivot {
  width: 14px;
  height: 14px;
  background: radial-gradient(circle, #ccc 0%, #999 50%, #666 100%);
  border-radius: 50%;
  margin: 0 auto;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.5);
}

.tonearm__arm {
  width: 2px;
  height: 105px;
  background: linear-gradient(90deg, #b0b0b0, #909090, #b0b0b0);
  margin: 0 auto;
  position: relative;
  border-radius: 1px;
  box-shadow: 1px 0 2px rgba(0, 0, 0, 0.3);
}

.tonearm__head {
  position: absolute;
  bottom: 0;
  left: -4px;
  width: 10px;
  height: 22px;
  background: linear-gradient(180deg, #aaa 0%, #888 50%, #777 100%);
  border-radius: 2px 2px 1px 1px;
}

.tonearm__needle {
  position: absolute;
  bottom: -3px;
  left: 50%;
  transform: translateX(-50%);
  width: 2px;
  height: 5px;
  background: #ddd;
  border-radius: 0 0 1px 1px;
}

/* Disc */
.disc {
  width: 310px;
  height: 310px;
  border-radius: 50%;
  background: radial-gradient(
    circle,
    #333 0%,
    #2a2a2a 3%,
    #1a1a1a 6%,
    #111 7%,
    #0e0e0e 14%,
    #111 16%,
    #0b0b0b 22%,
    #0e0e0e 24%,
    #090909 30%,
    #0b0b0b 32%,
    #070707 38%,
    #090909 40%,
    #050505 46%,
    #070707 48%,
    #040404 54%,
    #060606 56%,
    #030303 62%,
    #050505 64%,
    #020202 70%,
    #040404 72%,
    #020202 78%,
    #030303 80%,
    #010101 88%,
    #020202 90%,
    #010101 96%,
    #000 100%
  );
  position: absolute;
  bottom: 0;
  left: 15px;
  box-shadow:
    0 0 0 3px #1a1a1a,
    0 0 0 4px #333,
    0 8px 30px rgba(0, 0, 0, 0.7);
}

.disc--playing {
  animation: spin 3s linear infinite;
}

.disc__label {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 36%;
  height: 36%;
  border-radius: 50%;
  background: linear-gradient(135deg, #c23a3a, #8b2020);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow:
    inset 0 1px 6px rgba(0, 0, 0, 0.5),
    0 0 0 1px rgba(255, 255, 255, 0.05);
  overflow: hidden;
}

.disc__cover {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 50%;
}

.disc__note {
  font-size: 28px;
  opacity: 0.5;
  color: rgba(255, 255, 255, 0.7);
}

.disc__center-hole {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #1a1410;
  box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.8);
  z-index: 1;
}

.disc__shine {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  border-radius: 50%;
  background: linear-gradient(
    135deg,
    transparent 30%,
    rgba(255, 255, 255, 0.04) 45%,
    transparent 55%
  );
  pointer-events: none;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
</style>
