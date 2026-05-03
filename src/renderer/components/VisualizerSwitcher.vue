<script setup lang="ts">
import { ref } from 'vue'
import { useVisualizerStore } from '../stores/visualizer'
import type { VisualizerType } from '../stores/visualizer'

const viz = useVisualizerStore()
const open = ref(false)

const types: { id: VisualizerType; name: string }[] = [
  { id: 'bars', name: '经典' },
  { id: 'arc', name: '弧形' },
  { id: 'wave', name: '波形' },
]

const currentName = () => types.find(t => t.id === viz.type)?.name ?? '波形'

function select(id: VisualizerType) {
  viz.setType(id)
  open.value = false
}

function toggle() {
  open.value = !open.value
}

function close() {
  open.value = false
}
</script>

<template>
  <div class="viz-switcher" v-click-outside="close">
    <button class="viz-trigger" @click="toggle" :title="'频谱: ' + currentName()">
      <span class="viz-trigger__label">{{ currentName() }}</span>
      <svg class="viz-trigger__arrow" :class="{ 'viz-trigger__arrow--open': open }" width="10" height="6" viewBox="0 0 10 6">
        <path d="M1 1L5 5L9 1" stroke="currentColor" stroke-width="1.5" fill="none" stroke-linecap="round" stroke-linejoin="round" />
      </svg>
    </button>
    <div class="viz-dropdown" v-if="open">
      <button
        v-for="t in types"
        :key="t.id"
        class="viz-option"
        :class="{ 'viz-option--active': viz.type === t.id }"
        @click="select(t.id)"
      >
        {{ t.name }}
      </button>
    </div>
  </div>
</template>

<style scoped>
.viz-switcher {
  position: relative;
  -webkit-app-region: no-drag;
}

.viz-trigger {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 10px;
  border: none;
  background: transparent;
  border-radius: 6px;
  cursor: pointer;
  color: var(--text-secondary, #999);
  font-size: 12px;
  transition: background 0.15s, color 0.15s;
}

.viz-trigger:hover {
  background: rgba(255, 255, 255, 0.1);
  color: var(--text-primary, #fff);
}

.viz-trigger__arrow {
  transition: transform 0.2s;
}

.viz-trigger__arrow--open {
  transform: rotate(180deg);
}

.viz-dropdown {
  position: absolute;
  top: 100%;
  right: 0;
  margin-top: 4px;
  background: var(--bg-secondary, rgba(30, 30, 40, 0.95));
  border: 1px solid var(--border, rgba(255, 255, 255, 0.08));
  border-radius: 8px;
  padding: 4px;
  min-width: 80px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
  z-index: 50;
}

.viz-option {
  display: block;
  width: 100%;
  padding: 6px 12px;
  border: none;
  background: transparent;
  color: var(--text-secondary, #999);
  font-size: 12px;
  text-align: left;
  border-radius: 4px;
  cursor: pointer;
  transition: background 0.15s, color 0.15s;
}

.viz-option:hover {
  background: rgba(255, 255, 255, 0.08);
  color: var(--text-primary, #fff);
}

.viz-option--active {
  color: var(--accent, #667eea);
}
</style>
