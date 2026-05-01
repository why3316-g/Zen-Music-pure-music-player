<script setup lang="ts">
import { useThemeStore } from '../stores/theme'

const theme = useThemeStore()

const themes = [
  { id: 'apple', name: 'Apple', icon: '🍎' },
  { id: 'arc', name: 'Arc', icon: '🌐' },
  { id: 'vinyl', name: 'Vinyl', icon: '💿' }
]
</script>

<template>
  <div class="theme-switcher">
    <button
      v-for="t in themes"
      :key="t.id"
      class="theme-btn"
      :class="{ 'theme-btn--active': theme.currentTheme === t.id }"
      @click="theme.setTheme(t.id)"
      :title="t.name"
    >
      {{ t.icon }}
    </button>
  </div>
</template>

<style scoped>
.theme-switcher {
  display: flex;
  gap: 4px;
  -webkit-app-region: no-drag;
}

.theme-btn {
  width: 28px;
  height: 28px;
  border: none;
  background: transparent;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.15s;
}

.theme-btn:hover {
  background: rgba(255, 255, 255, 0.1);
}

.theme-btn--active {
  background: var(--accent-soft, rgba(255, 255, 255, 0.15));
  box-shadow: 0 0 0 1.5px var(--accent, #667eea);
}
</style>
