import { BrowserWindow } from 'electron'
import type { InventoryChangedEvent } from '@shared/types'
import { broadcastLanEvent } from './lanHubService'

export function emitInventoryChanged(event: InventoryChangedEvent): void {
  for (const window of BrowserWindow.getAllWindows()) {
    if (!window.isDestroyed()) window.webContents.send('inventory:changed', event)
  }
  try {
    broadcastLanEvent({ type: 'inventory:changed', payload: event })
  } catch {
    // Non-fatal
  }
}
