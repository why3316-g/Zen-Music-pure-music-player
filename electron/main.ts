import { app, BrowserWindow, ipcMain, dialog, protocol, net } from 'electron'
import { readFile } from 'fs/promises'
import { join } from 'path'

let mainWindow: BrowserWindow | null = null

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    title: 'SonicVibe',
    frame: false,
    titleBarStyle: 'hidden',
    webPreferences: {
      preload: join(__dirname, '../preload/preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  })

  if (process.env.ELECTRON_RENDERER_URL) {
    mainWindow.loadURL(process.env.ELECTRON_RENDERER_URL)
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }

  // Forward dropped files to renderer
  mainWindow.webContents.on('will-navigate', (e) => e.preventDefault())
}

protocol.registerSchemesAsPrivileged([
  {
    scheme: 'app',
    privileges: {
      bypassCSP: true,
      stream: true,
      supportFetchAPI: true
    }
  }
])

app.whenReady().then(() => {
  protocol.handle('app', (request) => {
    const url = new URL(request.url)
    const filePath = decodeURIComponent(url.pathname).replace(/^\/local/, '').replace(/^\//, '')
    return net.fetch(`file:///${filePath}`)
  })

  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

// IPC: open file dialog
ipcMain.handle('dialog:openFiles', async () => {
  const result = await dialog.showOpenDialog({
    properties: ['openFile', 'multiSelections'],
    filters: [
      { name: 'Audio & Video', extensions: ['mp3', 'flac', 'wav', 'ogg', 'aac', 'm4a', 'wma', 'mp4', 'mkv', 'avi', 'webm'] },
      { name: 'All Files', extensions: ['*'] }
    ]
  })
  if (result.canceled) return []
  return result.filePaths
})

// IPC: window controls
ipcMain.handle('window:minimize', () => mainWindow?.minimize())
ipcMain.handle('window:maximize', () => {
  if (mainWindow?.isMaximized()) {
    mainWindow.unmaximize()
  } else {
    mainWindow?.maximize()
  }
})
ipcMain.handle('window:close', () => mainWindow?.close())
ipcMain.handle('window:isMaximized', () => mainWindow?.isMaximized())

// IPC: read file for metadata
ipcMain.handle('file:readBuffer', async (_e, filePath: string) => {
  try {
    const buffer = await readFile(filePath)
    return buffer.buffer
  } catch {
    return null
  }
})

// IPC: drop files from renderer
ipcMain.on('drop:files', (_e, paths: string[]) => {
  mainWindow?.webContents.send('drop:files', paths)
})
