import { resolve } from 'path'
import vue from '@vitejs/plugin-vue'
import { defineConfig, externalizeDepsPlugin } from 'electron-vite'

export default defineConfig({
  main: {
    plugins: [externalizeDepsPlugin({ include: ['electron'] })],
    build: {
      lib: { entry: resolve('electron/main.ts') }
    }
  },
  preload: {
    plugins: [externalizeDepsPlugin({ include: ['electron'] })],
    build: {
      lib: { entry: resolve('electron/preload.ts') }
    }
  },
  renderer: {
    resolve: {
      alias: {
        '@': resolve('src')
      }
    },
    plugins: [vue()]
  }
})
