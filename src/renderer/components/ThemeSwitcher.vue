<script setup lang="ts">
import { ref } from 'vue'
import { useThemeStore } from '../stores/theme'

const theme = useThemeStore()
const open = ref(false)

const themes = [
  { id: 'zen', name: '禅' },
  { id: 'vinyl', name: '黑胶' },
  { id: 'apple', name: 'Apple' },
]

const currentName = () => themes.find(t => t.id === theme.currentTheme)?.name ?? '禅'

function select(id: string) {
  theme.setTheme(id)
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
  <div class="theme-switcher" v-click-outside="close">
    <button class="theme-trigger" @click="toggle" :title="'主题: ' + currentName()">
      <span class="theme-trigger__label">{{ currentName() }}</span>
      <svg class="theme-trigger__arrow" :class="{ 'theme-trigger__arrow--open': open }" width="10" height="6" viewBox="0 0 10 6">
        <path d="M1 1L5 5L9 1" stroke="currentColor" stroke-width="1.5" fill="none" stroke-linecap="round" stroke-linejoin="round" />
      </svg>
    </button>
    <div class="theme-dropdown" v-if="open">
      <button
        v-for="t in themes"
        :key="t.id"
        class="theme-option"
        :class="{ 'theme-option--active': theme.currentTheme === t.id }"
        @click="select(t.id)"
      >
        {{ t.name }}
      </button>
    </div>
  </div>
</template>

<style scoped>
.theme-switcher {
  position: relative;
  -webkit-app-region: no-drag;
}

.theme-trigger {
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

.theme-trigger:hover {
  background: rgba(255, 255, 255, 0.1);
  color: var(--text-primary, #fff);
}

.theme-trigger__arrow {
  transition: transform 0.2s;
}

.theme-trigger__arrow--open {
  transform: rotate(180deg);
}

.theme-dropdown {
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

.theme-option {
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

.theme-option:hover {
  background: rgba(255, 255, 255, 0.08);
  color: var(--text-primary, #fff);
}

.theme-option--active {
  color: var(--accent, #667eea);
}
</style>
