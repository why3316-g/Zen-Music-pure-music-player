/// <reference types="vite/client" />

declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<{}, {}, any>
  export default component
}

interface Window {
  api: {
    openFiles: () => Promise<string[]>
    minimize: () => Promise<void>
    maximize: () => Promise<void>
    close: () => Promise<void>
    isMaximized: () => Promise<boolean>
    readBuffer: (filePath: string) => Promise<ArrayBuffer | null>
    onDropFiles: (callback: (paths: string[]) => void) => void
    toAppUrl: (filePath: string) => string
    getPathForFile: (file: File) => string
    onOpenFiles: (callback: (paths: string[]) => void) => void
  }
}
