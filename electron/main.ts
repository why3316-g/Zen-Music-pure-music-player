import { app, BrowserWindow, ipcMain, dialog, protocol, net, shell } from 'electron'
import { readFile, stat } from 'fs/promises'
import { createReadStream } from 'fs'
import { join } from 'path'
import { Readable } from 'stream'

const MIME_TYPES: Record<string, string> = {
  '.mp3': 'audio/mpeg', '.flac': 'audio/flac', '.wav': 'audio/wav',
  '.ogg': 'audio/ogg', '.aac': 'audio/aac', '.m4a': 'audio/mp4',
  '.wma': 'audio/x-ms-wma', '.mp4': 'video/mp4', '.mkv': 'video/x-matroska',
  '.avi': 'video/x-msvideo', '.webm': 'video/webm'
}

function getMimeType(filePath: string): string {
  const ext = '.' + filePath.split('.').pop()?.toLowerCase()
  return MIME_TYPES[ext] || 'application/octet-stream'
}

let mainWindow: BrowserWindow | null = null
let pendingFiles: string[] = []

function sendFilesToRenderer(files: string[]) {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('open-files', files)
  } else {
    pendingFiles.push(...files)
  }
}

// Handle file open from command line (e.g., double-click a file)
const fileArg = process.argv.find(arg => {
  const ext = '.' + arg.split('.').pop()?.toLowerCase()
  return MIME_TYPES[ext]
})
if (fileArg) {
  pendingFiles.push(fileArg)
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    title: 'Zen·Music',
    icon: join(__dirname, '../../build/icon.ico'),
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
  protocol.handle('app', async (request) => {
    const url = new URL(request.url)
    const filePath = decodeURIComponent(url.pathname).replace(/^\/local/, '').replace(/^\//, '')

    try {
      const fileStat = await stat(filePath)
      const fileSize = fileStat.size

      // Handle Range requests for media seeking
      const rangeHeader = request.headers.get('range')
      if (rangeHeader) {
        const matches = /bytes=(\d+)-(\d*)/.exec(rangeHeader)
        if (matches) {
          const start = parseInt(matches[1], 10)
          const end = matches[2] ? parseInt(matches[2], 10) : fileSize - 1
          const chunkSize = end - start + 1

          const stream = createReadStream(filePath, { start, end })
          const body = Readable.toWeb(stream) as ReadableStream

          return new Response(body, {
            status: 206,
            headers: {
              'Content-Range': `bytes ${start}-${end}/${fileSize}`,
              'Accept-Ranges': 'bytes',
              'Content-Length': String(chunkSize),
              'Content-Type': getMimeType(filePath)
            }
          })
        }
      }

      // Full file request
      const stream = createReadStream(filePath)
      const body = Readable.toWeb(stream) as ReadableStream

      return new Response(body, {
        status: 200,
        headers: {
          'Accept-Ranges': 'bytes',
          'Content-Length': String(fileSize),
          'Content-Type': getMimeType(filePath)
        }
      })
    } catch {
      return new Response('File not found', { status: 404 })
    }
  })

  createWindow()

  // Send any pending files that arrived before window was ready
  if (pendingFiles.length > 0) {
    mainWindow!.webContents.on('did-finish-load', () => {
      sendFilesToRenderer(pendingFiles)
      pendingFiles = []
    })
  }

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

// macOS: open file when app is already running
app.on('open-file', (e, filePath) => {
  e.preventDefault()
  sendFilesToRenderer([filePath])
})

// Windows: second instance launched with a file argument
const gotLock = app.requestSingleInstanceLock()
if (!gotLock) {
  app.quit()
} else {
  app.on('second-instance', (_e, argv) => {
    const file = argv.find(arg => {
      const ext = '.' + arg.split('.').pop()?.toLowerCase()
      return MIME_TYPES[ext]
    })
    if (file) {
      if (mainWindow) {
        if (mainWindow.isMinimized()) mainWindow.restore()
        mainWindow.focus()
      }
      sendFilesToRenderer([file])
    }
  })
}

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

// IPC: show file in system explorer
ipcMain.handle('shell:showInFolder', async (_e, filePath: string) => {
  await shell.showItemInFolder(filePath)
})
