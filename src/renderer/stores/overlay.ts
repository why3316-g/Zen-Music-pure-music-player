import { defineStore } from 'pinia'
import { computed, ref } from 'vue'

/**
 * 记录当前有几个弹出面板开着（设置、定时暂停…）。
 * 禅意模式靠它判断：面板开着的时候不能把界面淡出去，否则用户正在看的设置会消失。
 */
export const useOverlayStore = defineStore('overlay', () => {
  const openCount = ref(0)
  const hasOpen = computed(() => openCount.value > 0)

  function open() {
    openCount.value++
  }

  function close() {
    openCount.value = Math.max(0, openCount.value - 1)
  }

  return { openCount, hasOpen, open, close }
})
