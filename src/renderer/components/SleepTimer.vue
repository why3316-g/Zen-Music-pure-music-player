<script setup lang="ts">
import { onBeforeUnmount, ref, watch } from 'vue'
import { useTimerStore } from '../stores/timer'
import { useOverlayStore } from '../stores/overlay'

const timer = useTimerStore()
const overlay = useOverlayStore()
const showPanel = ref(false)
const customMinutes = ref<number | ''>('')
const showCustomInput = ref(false)

function setTimer(minutes: number) {
  timer.start(minutes)
  showPanel.value = false
}

// 面板开着时禁止进入禅意模式
watch(showPanel, (isOpen) => (isOpen ? overlay.open() : overlay.close()))

onBeforeUnmount(() => {
  if (showPanel.value) overlay.close()
})

function startCustomTimer() {
  const m = Number(customMinutes.value)
  if (m > 0 && m <= 999) {
    timer.start(m)
    showPanel.value = false
    customMinutes.value = ''
    showCustomInput.value = false
  }
}
</script>

<template>
  <div class="sleep-timer">
    <button
      class="timer-btn"
      :class="{ 'timer-btn--active': timer.isActive }"
      @click="showPanel = !showPanel"
      title="定时暂停"
    >
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round">
        <circle cx="9" cy="10" r="6.5" />
        <path d="M9 7v3.5l2 2" />
        <path d="M6 1h6" />
      </svg>
      <span v-if="timer.isActive" class="timer-badge">{{ timer.displayTime }}</span>
    </button>

    <div class="timer-panel" v-if="showPanel">
      <div class="timer-panel__title">
        <span>定时暂停</span>
        <button class="timer-panel__close" @click="showPanel = false">✕</button>
      </div>
      <div class="timer-presets">
        <button
          v-for="m in timer.presets"
          :key="m"
          class="preset-btn"
          @click="setTimer(m)"
        >
          {{ m }}分钟
        </button>
      </div>
      <div class="timer-custom">
        <button
          class="preset-btn preset-btn--custom"
          :class="{ 'preset-btn--custom-active': showCustomInput }"
          @click="showCustomInput = !showCustomInput"
        >
          自定义
        </button>
      </div>
      <div class="timer-custom-input" v-if="showCustomInput">
        <input
          type="number"
          v-model="customMinutes"
          class="custom-input"
          placeholder="输入分钟数"
          min="1"
          max="999"
          @keyup.enter="startCustomTimer"
        />
        <button class="custom-start-btn" @click="startCustomTimer">开始</button>
      </div>
      <button v-if="timer.isActive" class="cancel-btn" @click="timer.stop()">
        取消定时 (剩余 {{ timer.displayTime }})
      </button>
    </div>
  </div>
</template>

<style scoped>
.sleep-timer {
  position: relative;
  -webkit-app-region: no-drag;
}

.timer-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  border: none;
  background: transparent;
  color: var(--accent, #667eea);
  cursor: pointer;
  padding: 6px;
  border-radius: 8px;
  transition: background 0.15s;
}

.timer-btn:hover {
  background: var(--accent-soft, rgba(102, 126, 234, 0.12));
}

.timer-btn--active {
  color: var(--accent, #667eea);
}

.timer-badge {
  font-size: 11px;
  font-variant-numeric: tabular-nums;
}

.timer-panel {
  position: absolute;
  bottom: 100%;
  right: 0;
  margin-bottom: 4px;
  background: var(--bg-panel, #2c2c2e);
  border: 1px solid var(--border-active, rgba(128, 128, 128, 0.24));
  border-radius: 10px;
  padding: 12px;
  min-width: 220px;
  box-shadow: 0 -4px 24px rgba(0, 0, 0, 0.5);
  z-index: 50;
}

.timer-panel__title {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 13px;
  font-weight: 600;
  margin-bottom: 10px;
}

.timer-panel__close {
  border: none;
  background: none;
  color: var(--text-secondary, rgba(255, 255, 255, 0.4));
  cursor: pointer;
  font-size: 14px;
}

.timer-presets {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 6px;
}

.preset-btn {
  padding: 8px;
  border: 1px solid var(--border, rgba(255, 255, 255, 0.1));
  border-radius: 8px;
  background: transparent;
  color: var(--text-primary, #fff);
  font-size: 12px;
  cursor: pointer;
  transition: background 0.15s;
}

.preset-btn:hover {
  background: var(--accent-soft, rgba(102, 126, 234, 0.15));
  border-color: var(--accent, #667eea);
}

.timer-custom {
  margin-top: 6px;
}

.preset-btn--custom {
  width: 100%;
}

.preset-btn--custom-active {
  background: var(--accent-soft, rgba(102, 126, 234, 0.15));
  border-color: var(--accent, #667eea);
}

.timer-custom-input {
  display: flex;
  gap: 6px;
  margin-top: 8px;
}

.custom-input {
  flex: 1;
  padding: 6px 10px;
  border: 1px solid var(--border, rgba(255, 255, 255, 0.1));
  border-radius: 6px;
  background: rgba(0, 0, 0, 0.2);
  color: var(--text-primary, #fff);
  font-size: 13px;
  outline: none;
  width: 60px;
}

.custom-input:focus {
  border-color: var(--accent, #667eea);
}

.custom-start-btn {
  padding: 6px 14px;
  border: none;
  border-radius: 6px;
  background: var(--accent, #667eea);
  color: white;
  font-size: 12px;
  cursor: pointer;
  transition: opacity 0.15s;
}

.custom-start-btn:hover {
  opacity: 0.85;
}

.cancel-btn {
  margin-top: 10px;
  width: 100%;
  padding: 8px;
  border: none;
  border-radius: 8px;
  background: rgba(232, 17, 35, 0.15);
  color: #e81123;
  font-size: 12px;
  cursor: pointer;
}

.cancel-btn:hover {
  background: rgba(232, 17, 35, 0.25);
}
</style>
