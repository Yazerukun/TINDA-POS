import { app, BrowserWindow, shell, Menu } from 'electron'
import { join } from 'node:path'
import { registerIpcHandlers } from './ipc'
import { getDb, closeDb, appDirs } from './database/connection'
import { getSettings } from './repositories/settings'

let mainWindow: BrowserWindow | null = null

// Single-instance lock: a second launch must not open a second writer against
// the same SQLite file. If we don't hold the lock, quit immediately.
const gotSingleInstanceLock = app.requestSingleInstanceLock()
if (!gotSingleInstanceLock) {
  app.quit()
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore()
      mainWindow.focus()
    }
  })
}

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1366,
    height: 768,
    minWidth: 1024,
    minHeight: 640,
    show: false,
    autoHideMenuBar: true,
    backgroundColor: '#0a0d0f',
    title: 'TINDA POS',
    icon: join(__dirname, '../../../../build/icon.png'),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false
    }
  })

  mainWindow.on('ready-to-show', () => mainWindow?.show())

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // Load renderer (dev server vs built files).
  if (!app.isPackaged && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

app.setName('TINDA POS')

app.whenReady().then(() => {
  // Initialize DB and run migrations up front.
  try {
    getDb()
  } catch (e) {
    // Surface fatal DB errors; dialog box handled by renderer via integrity check.
    console.error('Database init failed:', e)
  }
  registerIpcHandlers()
  // Production menu: standard Edit items only (keeps copy/paste working),
  // no developer entries (no reload/devtools/view-source controls for cashiers).
  Menu.setApplicationMenu(
    Menu.buildFromTemplate([
      {
        label: 'Edit',
        submenu: [
          { role: 'undo' },
          { role: 'redo' },
          { type: 'separator' },
          { role: 'cut' },
          { role: 'copy' },
          { role: 'paste' },
          { role: 'selectAll' }
        ]
      }
    ])
  )
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

app.on('before-quit', () => {
  const settings = getSettings(getDb())
  if (settings.auto_backup_on_exit) {
    try {
      const { createBackupSync } = require('./repositories/backup') as typeof import('./repositories/backup')
      createBackupSync(getDb(), 'AUTO')
    } catch {
      /* backup failure on exit should not block quitting */
    }
  }
  closeDb()
})

if (process.platform === 'win32') {
  app.setAppUserModelId('com.tindapos.desktop')
}

appDirs()