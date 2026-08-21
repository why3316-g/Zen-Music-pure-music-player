import { defineStore } from 'pinia'
import { reactive, toRefs, watch } from 'vue'
import {
  DEFAULT_SETTINGS,
  SETTINGS_KEY,
  readSettings,
  type AppSettings
} from '../utils/settings-schema'
import { SIDEBAR_PINNED_KEY } from '../utils/sidebar-visibility'

export const useSettingsStore = defineStore('settings', () => {
  const state = reactive<AppSettings>({ ...DEFAULT_SETTINGS })

  function reset() {
    Object.assign(state, DEFAULT_SETTINGS)
  }

  function init() {
    const stored = localStorage.getItem(SETTINGS_KEY)
    Object.assign(state, readSettings(localStorage))

    // 迁移旧的"固定播放列表"开关：钉住 == 不自动隐藏
    if (!stored) {
      const legacyPinned = localStorage.getItem(SIDEBAR_PINNED_KEY)
      if (legacyPinned !== null) state.playlistAutoHide = legacyPinned !== 'true'
    }

    watch(state, (value) => {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(value))
    }, { deep: true })
  }

  return { ...toRefs(state), init, reset }
})
