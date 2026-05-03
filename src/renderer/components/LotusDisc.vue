<script setup lang="ts">
import { computed } from 'vue'
import { usePlayerStore } from '../stores/player'
import { useThemeStore } from '../stores/theme'
import lotusImg from '../assets/lotus.png'

const player = usePlayerStore()
const theme = useThemeStore()

const props = defineProps<{
  zenMode: boolean
}>()

const zenFade = computed(() => props.zenMode)

const isZenRipple = computed(() => theme.currentTheme === 'zen-ripple')
const isZenBloom = computed(() => theme.currentTheme === 'zen-bloom')
const isZen = computed(() => isZenRipple.value || isZenBloom.value)

const lotusClass = computed(() => {
  const base: string[] = []
  if (player.isPlaying) base.push('lotus--playing')
  if (isZenRipple.value) base.push('lotus--ripple')
  if (isZenBloom.value) base.push('lotus--bloom')
  return base
})
</script>

<template>
  <div class="lotus-disc" v-if="isZen && player.currentTrack">
    <!-- Fog / mist layers for 禅·涟漪 -->
    <div class="fog" v-if="isZenRipple && player.isPlaying">
      <div class="fog__layer fog__layer--1" />
      <div class="fog__layer fog__layer--2" />
      <div class="fog__layer fog__layer--3" />
    </div>

    <!-- Ripples for 禅·涟漪 -->
    <div class="ripples" v-if="isZenRipple && player.isPlaying">
      <div class="ripple" />
      <div class="ripple" />
      <div class="ripple" />
    </div>

    <!-- Main lotus -->
    <div class="lotus" :class="lotusClass">
      <img :src="lotusImg" alt="lotus" class="lotus__img" />
    </div>

    <!-- Track info below lotus (fades with zen mode) -->
    <div class="track-info" :class="{ 'zen-fade': zenFade }">
      <div class="track-info__title">{{ player.currentTrack.title }}</div>
      <div class="track-info__artist" v-if="player.currentTrack.artist">{{ player.currentTrack.artist }}</div>
    </div>
  </div>
</template>

<style scoped>
.lotus-disc {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 20px;
}

/* ─── Main lotus ─── */
.lotus {
  position: relative;
  width: 280px;
  height: 280px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 1.2s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.8s ease, filter 0.8s ease;
}

.lotus__img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  pointer-events: none;
}

/* ─── Ripple mode: gentle breathing ─── */
.lotus--ripple.lotus--playing {
  animation: breathe-gentle 5s ease-in-out infinite;
}

/* ─── Bloom mode: expand + glow on play ─── */
.lotus--bloom {
  transform: scale(0.88);
  opacity: 0.7;
}

.lotus--bloom.lotus--playing {
  transform: scale(1.05);
  opacity: 1;
  animation: bloom-pulse 3.5s ease-in-out infinite;
}

@keyframes breathe-gentle {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.03); }
}

@keyframes bloom-pulse {
  0%, 100% {
    transform: scale(1.05);
    filter: drop-shadow(0 0 6px rgba(138, 155, 131, 0.15));
  }
  50% {
    transform: scale(1.1);
    filter: drop-shadow(0 0 24px rgba(138, 155, 131, 0.35));
  }
}

/* ─── Ripples ─── */
.ripples {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -60%);
  width: 280px;
  height: 280px;
  pointer-events: none;
}

.ripple {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  border-radius: 50%;
  border: 1px solid rgba(138, 155, 131, 0.3);
  opacity: 0;
  animation: ripple-expand 4.5s ease-out infinite;
}

.ripple:nth-child(1) { animation-delay: 0s; }
.ripple:nth-child(2) { animation-delay: 1.5s; }
.ripple:nth-child(3) { animation-delay: 3s; }

@keyframes ripple-expand {
  0% {
    width: 120px;
    height: 120px;
    opacity: 0.45;
  }
  100% {
    width: 380px;
    height: 380px;
    opacity: 0;
  }
}

/* ─── Fog / Mist ─── */
.fog {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -55%);
  width: 320px;
  height: 300px;
  pointer-events: none;
  overflow: visible;
}

.fog__layer {
  position: absolute;
  border-radius: 50%;
  background: radial-gradient(ellipse at center, rgba(255, 249, 225, 0.5) 0%, rgba(255, 249, 225, 0) 70%);
  filter: blur(20px);
  opacity: 0;
}

.fog__layer--1 {
  width: 260px;
  height: 80px;
  left: 30px;
  bottom: -20px;
  animation: fog-drift-1 7s ease-in-out infinite;
}

.fog__layer--2 {
  width: 200px;
  height: 60px;
  left: 60px;
  bottom: 10px;
  animation: fog-drift-2 9s ease-in-out infinite;
}

.fog__layer--3 {
  width: 180px;
  height: 50px;
  left: 70px;
  bottom: 40px;
  animation: fog-drift-3 11s ease-in-out infinite;
}

@keyframes fog-drift-1 {
  0% {
    opacity: 0;
    transform: translateX(-30px) translateY(10px);
  }
  30% {
    opacity: 0.7;
  }
  70% {
    opacity: 0.5;
  }
  100% {
    opacity: 0;
    transform: translateX(30px) translateY(-60px);
  }
}

@keyframes fog-drift-2 {
  0% {
    opacity: 0;
    transform: translateX(20px) translateY(5px);
  }
  40% {
    opacity: 0.6;
  }
  100% {
    opacity: 0;
    transform: translateX(-25px) translateY(-70px);
  }
}

@keyframes fog-drift-3 {
  0% {
    opacity: 0;
    transform: translateX(10px) translateY(8px);
  }
  35% {
    opacity: 0.5;
  }
  100% {
    opacity: 0;
    transform: translateX(-15px) translateY(-80px);
  }
}

/* ─── Track info ─── */
.track-info {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  transition: opacity 0.8s ease;
}

.track-info.zen-fade {
  opacity: 0;
  pointer-events: none;
}

.track-info__title {
  font-size: 18px;
  font-weight: 600;
  color: var(--text-primary, #3d3d2e);
}

.track-info__artist {
  font-size: 13px;
  color: var(--text-secondary, #8a8770);
}
</style>
