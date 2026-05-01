<script setup lang="ts">
import { computed } from 'vue'
import { usePlayerStore } from '../stores/player'
import { useThemeStore } from '../stores/theme'

const player = usePlayerStore()
const theme = useThemeStore()

const isVinyl = computed(() => theme.currentTheme === 'vinyl')
const coverUrl = computed(() => player.currentTrack?.coverUrl)
</script>

<template>
  <div class="vinyl-player" v-if="isVinyl && player.currentTrack">
    <!-- Tonearm -->
    <div class="tonearm" :class="{ 'tonearm--playing': player.isPlaying }">
      <div class="tonearm__base">
        <div class="tonearm__pivot"></div>
      </div>
      <div class="tonearm__arm">
        <div class="tonearm__head"></div>
      </div>
    </div>

    <!-- Vinyl disc -->
    <div class="disc" :class="{ 'disc--playing': player.isPlaying }">
      <div class="disc__grooves">
        <div class="disc__groove" v-for="i in 6" :key="i" :style="{ width: (40 + i * 10) + '%', height: (40 + i * 10) + '%' }"></div>
      </div>
      <div class="disc__label">
        <img v-if="coverUrl" :src="coverUrl" alt="cover" class="disc__cover" />
        <span v-else class="disc__note">♪</span>
      </div>
      <div class="disc__center-hole"></div>
    </div>
  </div>
</template>

<style scoped>
.vinyl-player {
  position: relative;
  width: 320px;
  height: 320px;
  margin: 0 auto;
}

/* Tonearm */
.tonearm {
  position: absolute;
  top: -10px;
  right: 30px;
  z-index: 2;
  transform-origin: top center;
  transform: rotate(-25deg);
  transition: transform 0.8s cubic-bezier(0.4, 0, 0.2, 1);
}

.tonearm--playing {
  transform: rotate(-5deg);
}

.tonearm__base {
  width: 20px;
  height: 20px;
  margin: 0 auto;
}

.tonearm__pivot {
  width: 16px;
  height: 16px;
  background: #888;
  border-radius: 50%;
  margin: 0 auto;
  box-shadow: 0 2px 4px rgba(0,0,0,0.5);
}

.tonearm__arm {
  width: 4px;
  height: 140px;
  background: linear-gradient(180deg, #aaa, #888);
  margin: 0 auto;
  border-radius: 2px;
  position: relative;
}

.tonearm__head {
  position: absolute;
  bottom: -2px;
  left: -4px;
  width: 12px;
  height: 20px;
  background: #777;
  border-radius: 2px 2px 4px 4px;
}

/* Disc */
.disc {
  width: 300px;
  height: 300px;
  border-radius: 50%;
  background: radial-gradient(
    circle,
    #333 0%,
    #111 20%,
    #1a1a1a 21%,
    #0d0d0d 40%,
    #111 41%,
    #0a0a0a 60%,
    #0d0d0d 61%,
    #080808 80%,
    #0a0a0a 81%,
    #050505 100%
  );
  position: absolute;
  bottom: 0;
  left: 10px;
  box-shadow:
    0 0 0 3px #222,
    0 8px 32px rgba(0, 0, 0, 0.7),
    inset 0 0 60px rgba(0, 0, 0, 0.3);
  animation: none;
}

.disc--playing {
  animation: spin 3s linear infinite;
}

.disc__grooves {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.disc__groove {
  position: absolute;
  border-radius: 50%;
  border: 1px solid rgba(255, 255, 255, 0.03);
}

.disc__label {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 35%;
  height: 35%;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--accent, #c23a3a), #8b2020);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: inset 0 2px 8px rgba(0, 0, 0, 0.4);
  overflow: hidden;
}

.disc__cover {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 50%;
}

.disc__note {
  font-size: 32px;
  opacity: 0.6;
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
  box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.5);
  z-index: 1;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
</style>
