import { BrowserWindow } from 'electron'
import { join } from 'node:path'
import type { UpdateStatusEvent } from '@shared/update'
import { createUpdateService, type UpdateService } from './updateService'
import { ElectronUpdateTransport } from './updateTransport'
import { createUpdateFileStorage } from './updateStore'
import { appDirs } from '../database/connection'

let service: UpdateService | null = null

function broadcast(event: UpdateStatusEvent): void {
  for (const win of BrowserWindow.getAllWindows()) {
    if (!win.isDestroyed()) win.webContents.send('update:event', event)
  }
}

export function getUpdateService(): UpdateService {
  if (!service) {
    service = createUpdateService({
      transport: new ElectronUpdateTransport(),
      storage: createUpdateFileStorage(join(appDirs().root, 'updates')),
      emit: broadcast
    })
  }
  return service
}

export function startAutoUpdateCheck(): void {
  // Initial check at 1.5s after startup
  setTimeout(() => {
    getUpdateService()
      .check({ manual: true })
      .catch(() => undefined)
  }, 1500)

  // Real-time background check every 10 seconds
  setInterval(() => {
    getUpdateService()
      .check({ manual: false })
      .catch(() => undefined)
  }, 10000)
}