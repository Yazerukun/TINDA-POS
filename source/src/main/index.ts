import { app, BrowserWindow, shell, Menu, protocol, net } from 'electron'
import { join, basename } from 'node:path'
import { pathToFileURL } from 'node:url'
import { registerIpcHandlers } from './ipc'
import { getDb, closeDb, appDirs } from './database/connection'
import { getSettings } from './repositories/settings'
import { startAutoUpdateCheck } from './services/updateRuntime'
import { applyDefaultStartup } from './services/startup'
import { getPatchedEntryHtml, markPatchStable } from './services/patchService'

// Register custom protocol for local product images before app is ready
protocol.registerSchemesAsPrivileged([
  {
    scheme: 'tinda-image',
    privileges: {
      standard: true,
      secure: true,
      supportFetchAPI: true,
      corsEnabled: true,
      bypassCSP: true
    }
  }
])

let mainWindow: BrowserWindow | null = null

// Gracefully catch unexpected main process errors to prevent modal crash dialogs
process.on('uncaughtException', (err) => {
  console.error('[TINDA POS] Uncaught Exception in main process:', err)
})
process.on('unhandledRejection', (reason) => {
  console.error('[TINDA POS] Unhandled Rejection in main process:', reason)
})

// Single-instance lock: a second launch must not open a second writer against
// the same SQLite file. If we don't hold the lock, quit immediately.
const gotSingleInstanceLock = app.requestSingleInstanceLock()
if (!gotSingleInstanceLock) {
  app.quit()
  process.exit(0)
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

  mainWindow.on('ready-to-show', () => {
    mainWindow?.show()
    setTimeout(() => {
      try { markPatchStable() } catch {}
    }, 4000)
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // Load renderer (dev server vs built files vs verified feature patch).
  if (!app.isPackaged && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    const patchedEntry = getPatchedEntryHtml()
    if (patchedEntry) {
      mainWindow.loadURL(pathToFileURL(patchedEntry).href)
      mainWindow.webContents.once('did-finish-load', () => {
        markPatchStable()
      })
    } else {
      mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
    }
  }
}

app.setName('TINDA POS')

app.whenReady().then(() => {
  // Protocol handler for serving product images from appDirs().images
  protocol.handle('tinda-image', (request) => {
    try {
      const parsed = new URL(request.url)
      const rawPath = decodeURIComponent(parsed.pathname.replace(/^\/+/, '')) || parsed.host
      const filename = basename(rawPath)
      const filePath = join(appDirs().images, filename)
      return net.fetch(pathToFileURL(filePath).toString())
    } catch {
      return new Response('Image not found', { status: 404 })
    }
  })

  // Initialize DB and run migrations up front.
  try {
    const database = getDb()
    const settings = getSettings(database)
    if (settings.auto_backup_enabled && settings.auto_backup_daily) {
      const { createBackupSync, needsDailyBackup } = require('./repositories/backup') as typeof import('./repositories/backup')
      if (needsDailyBackup(database)) createBackupSync(database, 'AUTO')
    }
  } catch (e) {
    // Surface fatal DB errors; dialog box handled by renderer via integrity check.
    console.error('Database init failed:', e)
  }
  registerIpcHandlers()
  // First launch of an installed Setup registers start-at-sign-in so a fresh
  // install boots straight into TINDA POS; owners can switch it off in Settings.
  applyDefaultStartup()
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
  startAutoUpdateCheck()
  const { startPhoneScannerService, stopPhoneScannerService } = require('./services/phoneScannerService')
  void startPhoneScannerService()
  const { initializeLanHub, stopMasterServer } = require('./services/lanHubService')
  initializeLanHub()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

app.on('before-quit', () => {
  try {
    const { stopPhoneScannerService } = require('./services/phoneScannerService')
    stopPhoneScannerService()
  } catch {
    // Non-fatal
  }
  try {
    const { stopMasterServer } = require('./services/lanHubService')
    stopMasterServer()
  } catch {
    // Non-fatal
  }
  const settings = getSettings(getDb())
  if (settings.auto_backup_enabled && settings.auto_backup_on_exit) {
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

let salesMonitorWindow: BrowserWindow | null = null

export function toggleSalesMonitorWindow(): boolean {
  if (salesMonitorWindow && !salesMonitorWindow.isDestroyed()) {
    if (salesMonitorWindow.isVisible()) {
      salesMonitorWindow.hide()
      return false
    } else {
      salesMonitorWindow.show()
      salesMonitorWindow.focus()
      return true
    }
  }

  salesMonitorWindow = new BrowserWindow({
    width: 1100,
    height: 720,
    minWidth: 800,
    minHeight: 500,
    show: true,
    title: 'TINDA POS — Real-time Sales Monitor',
    backgroundColor: '#050708',
    autoHideMenuBar: true,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false
    }
  })

  salesMonitorWindow.on('closed', () => {
    salesMonitorWindow = null
  })

  const hash = '#sales-monitor'
  if (!app.isPackaged && process.env['ELECTRON_RENDERER_URL']) {
    salesMonitorWindow.loadURL(`${process.env['ELECTRON_RENDERER_URL']}${hash}`)
  } else {
    salesMonitorWindow.loadFile(join(__dirname, '../renderer/index.html'), { hash: 'sales-monitor' })
  }

  return true
}

export function broadcastSaleCompleted(sale: unknown): void {
  for (const win of BrowserWindow.getAllWindows()) {
    if (!win.isDestroyed()) {
      win.webContents.send('sales:completed', sale)
    }
  }
}

