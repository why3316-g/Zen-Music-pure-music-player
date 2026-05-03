import { contextBridge, ipcRenderer, webUtils } from 'electron'

contextBridge.exposeInMainWorld('api', {
  // File dialog
  openFiles: () => ipcRenderer.invoke('dialog:openFiles'),

  // Window controls
  minimize: () => ipcRenderer.invoke('window:minimize'),
  maximize: () => ipcRenderer.invoke('window:maximize'),
  close: () => ipcRenderer.invoke('window:close'),
  isMaximized: () => ipcRenderer.invoke('window:isMaximized'),

  // File reading
  readBuffer: (filePath: string) => ipcRenderer.invoke('file:readBuffer', filePath),

  // Drag and drop file paths
  onDropFiles: (callback: (paths: string[]) => void) => {
    ipcRenderer.on('drop:files', (_e, paths) => callback(paths))
  },

  // Convert file path to app:// URL
  toAppUrl: (filePath: string) => `app://local/${encodeURIComponent(filePath)}`,

  // Get file path from dropped File object (Electron 33+)
  getPathForFile: (file: File) => webUtils.getPathForFile(file),

  // Receive files opened via file association
  onOpenFiles: (callback: (paths: string[]) => void) => {
    ipcRenderer.on('open-files', (_e, paths) => callback(paths))
  }
})
