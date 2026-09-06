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
  // Fire-and-forget: the check runs async after startup and never blocks the UI.
  setTimeout(() => {
    getUpdateService()
      .check({ manual: false })
      .catch(() => undefined)
  }, 4000)
}