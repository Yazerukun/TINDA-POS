import { BrowserWindow } from 'electron'
import type { InventoryChangedEvent } from '@shared/types'
import { broadcastLanEvent } from './lanHubService'
import { invalidateStoreTelemetryCache } from './storeTelemetry'

export function emitInventoryChanged(event: InventoryChangedEvent): void {
  invalidateStoreTelemetryCache()
  for (const window of BrowserWindow.getAllWindows()) {
    if (!window.isDestroyed()) window.webContents.send('inventory:changed', event)
  }
  try {
    broadcastLanEvent({ type: 'inventory:changed', payload: event })
  } catch {
    // Non-fatal
  }
}

export function emitTransactionsChanged(payload?: unknown): void {
  invalidateStoreTelemetryCache()
  for (const window of BrowserWindow.getAllWindows()) {
    if (!window.isDestroyed()) window.webContents.send('transactions:changed', payload)
  }
  try {
    broadcastLanEvent({ type: 'transactions:changed', payload })
  } catch {
    // Non-fatal
  }
}
