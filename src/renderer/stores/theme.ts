import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useThemeStore = defineStore('theme', () => {
  const currentTheme = ref('vinyl')

  function setTheme(theme: string) {
    currentTheme.value = theme
    document.documentElement.setAttribute('data-theme', theme)
  }

  // Initialize theme on load
  function init() {
    document.documentElement.setAttribute('data-theme', currentTheme.value)
  }

  return { currentTheme, setTheme, init }
})
