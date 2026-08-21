<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useSettingsStore } from '../stores/settings'
import { useOverlayStore } from '../stores/overlay'
import { useThemeStore } from '../stores/theme'
import { useVisualizerStore, type VisualizerType } from '../stores/visualizer'
import { usePlayerStore } from '../stores/player'
import { audioEngine } from '../services/audio-engine'
import { SEEK_STEPS } from '../utils/settings-schema'
import type { PlayMode } from '../utils/types'

const settings = useSettingsStore()
const theme = useThemeStore()
const viz = useVisualizerStore()
const player = usePlayerStore()
const overlay = useOverlayStore()

const open = ref(false)
const rootRef = ref<HTMLElement>()

const themes = [
  { id: 'zen-ripple', name: '禅·涟漪' },
  { id: 'zen-bloom', name: '禅·绽放' },
  { id: 'vinyl', name: '黑胶' },
  { id: 'apple', name: 'Apple' }
]

const vizTypes: { id: VisualizerType; name: string }[] = [
  { id: 'wave', name: '波形' },
  { id: 'bars', name: '经典' },
  { id: 'arc', name: '弧形' }
]

const playModes: { id: PlayMode | 'remember'; name: string }[] = [
  { id: 'remember', name: '记住上次' },
  { id: 'loop', name: '列表循环' },
  { id: 'single', name: '单曲循环' },
  { id: 'shuffle', name: '随机播放' }
]

const volumePercent = computed(() => Math.round(settings.defaultVolume * 100))

function toggle() {
  open.value = !open.value
}

function close() {
  open.value = false
}

function onDocumentPointerDown(e: MouseEvent) {
  if (!open.value) return
  if (rootRef.value && !rootRef.value.contains(e.target as Node)) close()
}

function onDocumentKeyDown(e: KeyboardEvent) {
  if (open.value && e.key === 'Escape') close()
}

function onDefaultVolumeInput(e: Event) {
  const value = Number((e.target as HTMLInputElement).value)
  settings.defaultVolume = value
  // 调默认音量时实时试听，不用重启才知道多大声
  if (settings.startupVolumeMode === 'fixed') {
    player.setVolume(value)
    audioEngine.setVolume(player.volume)
  }
}

// 面板开着时禁止进入禅意模式，否则看着看着整个面板就淡没了
watch(open, (isOpen) => (isOpen ? overlay.open() : overlay.close()))

onMounted(() => {
  document.addEventListener('mousedown', onDocumentPointerDown)
  document.addEventListener('keydown', onDocumentKeyDown)
})

onBeforeUnmount(() => {
  if (open.value) overlay.close()
  document.removeEventListener('mousedown', onDocumentPointerDown)
  document.removeEventListener('keydown', onDocumentKeyDown)
})
</script>

<template>
  <div class="settings" ref="rootRef">
    <button
      class="settings__trigger"
      :class="{ 'settings__trigger--open': open }"
      @click="toggle"
      :aria-expanded="open"
      aria-haspopup="dialog"
      title="设置"
    >
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="12" r="3.1" />
        <path d="M19.2 14.6a1.5 1.5 0 0 0 .3 1.65l.05.06a1.85 1.85 0 1 1-2.62 2.62l-.05-.06a1.5 1.5 0 0 0-1.65-.3 1.5 1.5 0 0 0-.91 1.37v.16a1.85 1.85 0 0 1-3.7 0v-.08a1.5 1.5 0 0 0-.98-1.37 1.5 1.5 0 0 0-1.65.3l-.06.06a1.85 1.85 0 1 1-2.62-2.62l.06-.06a1.5 1.5 0 0 0 .3-1.65 1.5 1.5 0 0 0-1.37-.91h-.16a1.85 1.85 0 0 1 0-3.7h.08a1.5 1.5 0 0 0 1.37-.98 1.5 1.5 0 0 0-.3-1.65l-.06-.06a1.85 1.85 0 1 1 2.62-2.62l.06.06a1.5 1.5 0 0 0 1.65.3h.07a1.5 1.5 0 0 0 .91-1.37v-.16a1.85 1.85 0 0 1 3.7 0v.08a1.5 1.5 0 0 0 .91 1.37 1.5 1.5 0 0 0 1.65-.3l.06-.06a1.85 1.85 0 1 1 2.62 2.62l-.06.06a1.5 1.5 0 0 0-.3 1.65v.07a1.5 1.5 0 0 0 1.37.91h.16a1.85 1.85 0 0 1 0 3.7h-.08a1.5 1.5 0 0 0-1.37.91z" />
      </svg>
    </button>

    <div class="panel" v-if="open" role="dialog" aria-label="设置">
      <header class="panel__head">
        <h2 class="panel__title">设置</h2>
        <button class="panel__close" @click="close" aria-label="关闭设置">✕</button>
      </header>

      <div class="panel__body">
        <!-- 外观 -->
        <section class="group">
          <h3 class="group__title">外观</h3>

          <div class="field">
            <span class="field__label">主题</span>
            <div class="chips chips--wrap">
              <button
                v-for="t in themes"
                :key="t.id"
                class="chip"
                :class="{ 'chip--on': theme.currentTheme === t.id }"
                @click="theme.setTheme(t.id)"
              >{{ t.name }}</button>
            </div>
          </div>

          <div class="field">
            <span class="field__label">频谱样式</span>
            <div class="chips">
              <button
                v-for="t in vizTypes"
                :key="t.id"
                class="chip"
                :class="{ 'chip--on': viz.type === t.id }"
                @click="viz.setType(t.id)"
              >{{ t.name }}</button>
            </div>
          </div>
        </section>

        <!-- 键盘 -->
        <section class="group">
          <h3 class="group__title">键盘</h3>

          <div class="field">
            <span class="field__label">左右方向键</span>
            <div class="chips">
              <button
                class="chip"
                :class="{ 'chip--on': settings.arrowKeyAction === 'seek' }"
                @click="settings.arrowKeyAction = 'seek'"
              >快进 / 后退</button>
              <button
                class="chip"
                :class="{ 'chip--on': settings.arrowKeyAction === 'track' }"
                @click="settings.arrowKeyAction = 'track'"
              >上一首 / 下一首</button>
            </div>
          </div>

          <div class="field" v-if="settings.arrowKeyAction === 'seek'">
            <span class="field__label">每次快进</span>
            <div class="chips">
              <button
                v-for="step in SEEK_STEPS"
                :key="step"
                class="chip chip--narrow"
                :class="{ 'chip--on': settings.seekStep === step }"
                @click="settings.seekStep = step"
              >{{ step }}秒</button>
            </div>
          </div>

          <p class="hint">空格键始终是播放 / 暂停</p>
        </section>

        <!-- 播放 -->
        <section class="group">
          <h3 class="group__title">播放</h3>

          <div class="field">
            <span class="field__label">打开时的循环方式</span>
            <div class="chips chips--wrap">
              <button
                v-for="m in playModes"
                :key="m.id"
                class="chip"
                :class="{ 'chip--on': settings.startupPlayMode === m.id }"
                @click="settings.startupPlayMode = m.id"
              >{{ m.name }}</button>
            </div>
          </div>

          <div class="field">
            <span class="field__label">打开时的音量</span>
            <div class="chips">
              <button
                class="chip"
                :class="{ 'chip--on': settings.startupVolumeMode === 'remember' }"
                @click="settings.startupVolumeMode = 'remember'"
              >记住上次</button>
              <button
                class="chip"
                :class="{ 'chip--on': settings.startupVolumeMode === 'fixed' }"
                @click="settings.startupVolumeMode = 'fixed'"
              >固定音量</button>
            </div>
          </div>

          <div class="field field--inline" v-if="settings.startupVolumeMode === 'fixed'">
            <input
              type="range"
              class="slider"
              min="0"
              max="1"
              step="0.01"
              :value="settings.defaultVolume"
              :style="{ '--fill': volumePercent + '%' }"
              @input="onDefaultVolumeInput"
              aria-label="默认音量"
            />
            <span class="slider__value">{{ volumePercent }}%</span>
          </div>

          <div class="field">
            <span class="field__label">重新打开已在列表里的文件</span>
            <div class="chips">
              <button
                class="chip"
                :class="{ 'chip--on': settings.reopenBehavior === 'restart' }"
                @click="settings.reopenBehavior = 'restart'"
              >从头播放</button>
              <button
                class="chip"
                :class="{ 'chip--on': settings.reopenBehavior === 'resume' }"
                @click="settings.reopenBehavior = 'resume'"
              >接着上次</button>
            </div>
          </div>
          <p class="hint">同一个文件在播放列表里只会出现一条</p>
        </section>

        <!-- 播放列表 -->
        <section class="group group--last">
          <h3 class="group__title">播放列表</h3>

          <div class="switch-row">
            <div class="switch-row__text">
              <span class="field__label">自动隐藏</span>
              <p class="hint hint--tight">鼠标移开 5 秒后收起，移回左侧再展开</p>
            </div>
            <button
              class="switch"
              :class="{ 'switch--on': settings.playlistAutoHide }"
              role="switch"
              :aria-checked="settings.playlistAutoHide"
              aria-label="播放列表自动隐藏"
              @click="settings.playlistAutoHide = !settings.playlistAutoHide"
            >
              <span class="switch__knob" />
            </button>
          </div>
        </section>
      </div>

      <footer class="panel__foot">
        <button class="reset-btn" @click="settings.reset()">恢复默认设置</button>
      </footer>
    </div>
  </div>
</template>

<style scoped>
.settings {
  position: relative;
  -webkit-app-region: no-drag;
}

/* Trigger */
.settings__trigger {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  border: none;
  border-radius: 8px;
  background: transparent;
  color: var(--text-secondary, #999);
  cursor: pointer;
  transition: background 0.15s, color 0.15s, transform 0.2s;
}

.settings__trigger:hover {
  background: var(--control-bg-hover, rgba(128, 128, 128, 0.15));
  color: var(--text-primary, #fff);
}

.settings__trigger:active {
  transform: scale(0.94);
}

.settings__trigger:focus-visible {
  outline: 2px solid var(--accent, #667eea);
  outline-offset: 2px;
}

.settings__trigger--open {
  background: var(--accent-soft, rgba(102, 126, 234, 0.14));
  color: var(--accent, #667eea);
}

/* Panel */
.panel {
  position: absolute;
  top: calc(100% + 6px);
  right: 0;
  width: 330px;
  max-height: 74vh;
  display: flex;
  flex-direction: column;
  background: var(--bg-panel, #2c2c2e);
  border: 1px solid var(--border-active, rgba(128, 128, 128, 0.24));
  border-radius: var(--radius-lg, 14px);
  box-shadow: var(--shadow-lg, 0 12px 40px rgba(0, 0, 0, 0.45));
  z-index: 60;
  overflow: hidden;
}

.panel__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 16px 10px;
}

.panel__title {
  font-size: 15px;
  font-weight: 700;
  letter-spacing: 0.02em;
  color: var(--text-primary, #fff);
}

.panel__close {
  width: 24px;
  height: 24px;
  border: none;
  border-radius: 6px;
  background: transparent;
  color: var(--text-tertiary, #777);
  font-size: 12px;
  cursor: pointer;
  transition: background 0.15s, color 0.15s;
}

.panel__close:hover {
  background: var(--control-bg-hover, rgba(128, 128, 128, 0.15));
  color: var(--text-primary, #fff);
}

.panel__body {
  padding: 0 16px;
  overflow-y: auto;
  overscroll-behavior: contain;
}

/* 全局滚动条是浅色的，在米黄主题上等于没有——面板里单独给一条看得见的 */
.panel__body::-webkit-scrollbar {
  width: 10px;
}

.panel__body::-webkit-scrollbar-thumb {
  background: var(--track-bg, rgba(128, 128, 128, 0.3));
  background-clip: padding-box;
  border: 3px solid transparent;
  border-radius: 6px;
}

.panel__body::-webkit-scrollbar-thumb:hover {
  background: var(--track-bg-hover, rgba(128, 128, 128, 0.45));
  background-clip: padding-box;
}

/* Section grouping: heading + hairline, generous break between groups */
.group {
  padding-bottom: 18px;
  margin-bottom: 18px;
  border-bottom: 1px solid var(--border, rgba(128, 128, 128, 0.12));
}

.group--last {
  border-bottom: none;
  margin-bottom: 0;
  padding-bottom: 4px;
}

.group__title {
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.12em;
  color: var(--text-secondary, #999);
  margin-bottom: 12px;
}

/* Field: label sits tight above its control */
.field + .field {
  margin-top: 14px;
}

.field__label {
  display: block;
  font-size: 13px;
  color: var(--text-primary, #eee);
  margin-bottom: 7px;
}

.field--inline {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 10px;
}

.chips {
  display: flex;
  gap: 6px;
}

.chips--wrap {
  flex-wrap: wrap;
}

.chip {
  flex: 1;
  min-width: 0;
  padding: 7px 10px;
  border: 1px solid var(--border, rgba(128, 128, 128, 0.18));
  border-radius: var(--radius-md, 8px);
  background: var(--control-bg, rgba(128, 128, 128, 0.06));
  color: var(--text-secondary, #999);
  font-size: 12px;
  line-height: 1.2;
  white-space: nowrap;
  cursor: pointer;
  transition: background 0.15s, color 0.15s, border-color 0.15s, transform 0.15s;
}

.chips--wrap .chip {
  flex: 1 1 calc(50% - 3px);
}

.chip--narrow {
  padding: 7px 4px;
}

.chip:hover {
  background: var(--control-bg-hover, rgba(128, 128, 128, 0.14));
  color: var(--text-primary, #fff);
}

.chip:active {
  transform: scale(0.97);
}

.chip:focus-visible {
  outline: 2px solid var(--accent, #667eea);
  outline-offset: 1px;
}

.chip--on {
  background: var(--accent-soft, rgba(102, 126, 234, 0.16));
  border-color: var(--accent, #667eea);
  /* 内描边让选中项在浅色主题下也一眼可辨，文字保持正文色才读得清 */
  box-shadow: inset 0 0 0 1px var(--accent, #667eea);
  color: var(--text-primary, #fff);
  font-weight: 600;
}

.chip--on:hover {
  background: var(--accent-soft, rgba(102, 126, 234, 0.22));
  color: var(--text-primary, #fff);
}

.hint {
  margin-top: 8px;
  font-size: 11px;
  line-height: 1.5;
  color: var(--text-secondary, #999);
}

.hint--tight {
  margin-top: 3px;
}

/* Slider */
.slider {
  flex: 1;
  height: 4px;
  -webkit-appearance: none;
  appearance: none;
  background: transparent;
  outline: none;
  cursor: pointer;
}

.slider::-webkit-slider-runnable-track {
  height: 4px;
  border-radius: 2px;
  background: linear-gradient(
    to right,
    var(--accent, #667eea) var(--fill, 80%),
    var(--track-bg, rgba(128, 128, 128, 0.28)) var(--fill, 80%)
  );
}

.slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 13px;
  height: 13px;
  border-radius: 50%;
  background: var(--accent, #667eea);
  margin-top: -4.5px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.35);
}

.slider__value {
  width: 38px;
  text-align: right;
  font-size: 12px;
  font-variant-numeric: tabular-nums;
  color: var(--text-secondary, #999);
}

/* Switch row */
.switch-row {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
}

.switch-row__text {
  min-width: 0;
}

.switch-row__text .field__label {
  margin-bottom: 0;
}

.switch {
  flex-shrink: 0;
  position: relative;
  width: 40px;
  height: 23px;
  margin-top: 1px;
  border: none;
  border-radius: 999px;
  background: var(--track-bg, rgba(128, 128, 128, 0.3));
  cursor: pointer;
  transition: background 0.2s;
}

.switch:hover {
  background: var(--track-bg-hover, rgba(128, 128, 128, 0.4));
}

.switch:focus-visible {
  outline: 2px solid var(--accent, #667eea);
  outline-offset: 2px;
}

.switch--on,
.switch--on:hover {
  background: var(--accent, #667eea);
}

.switch__knob {
  position: absolute;
  top: 3px;
  left: 3px;
  width: 17px;
  height: 17px;
  border-radius: 50%;
  background: #fff;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
  transition: transform 0.2s cubic-bezier(0.3, 1.4, 0.6, 1);
}

.switch--on .switch__knob {
  transform: translateX(17px);
}

/* Footer */
.panel__foot {
  padding: 12px 16px 14px;
  border-top: 1px solid var(--border, rgba(128, 128, 128, 0.12));
}

.reset-btn {
  width: 100%;
  padding: 8px;
  border: 1px solid var(--border, rgba(128, 128, 128, 0.18));
  border-radius: var(--radius-md, 8px);
  background: transparent;
  color: var(--text-secondary, #999);
  font-size: 12px;
  cursor: pointer;
  transition: background 0.15s, color 0.15s, border-color 0.15s;
}

.reset-btn:hover {
  background: var(--control-bg-hover, rgba(128, 128, 128, 0.12));
  color: var(--text-primary, #fff);
  border-color: var(--border-active, rgba(128, 128, 128, 0.3));
}

.reset-btn:active {
  transform: scale(0.99);
}
</style>
