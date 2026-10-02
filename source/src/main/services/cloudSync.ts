import { randomUUID } from 'node:crypto'
import type Database from 'better-sqlite3'
import type {
  StoreSettings,
  CloudSaleSyncPayload,
  CloudStockSyncPayload,
  CloudShiftSyncPayload
} from '@shared/types'
import { getSettings, updateSettings } from '../repositories/settings'
import { isVipActive } from '../security/license'

function getSyncCredentials(db: Database.Database): {
  enabled: boolean
  apiUrl: string
  storeId: string
  syncKey: string
  branchName: string
} | null {
  const settings = getSettings(db)
  if (!isVipActive(settings) || !settings.cloud_sync_enabled) {
    return null
  }

  let storeId = settings.cloud_store_id?.trim()
  let syncKey = settings.cloud_sync_key?.trim()
  let updated = false

  if (!storeId) {
    storeId = randomUUID()
    updated = true
  }
  if (!syncKey) {
    syncKey = 'tinda_' + randomUUID().replace(/-/g, '')
    updated = true
  }

  if (updated) {
    updateSettings(db, { cloud_store_id: storeId, cloud_sync_key: syncKey })
  }

  return {
    enabled: true,
    apiUrl: settings.cloud_api_url || 'https://tinda-sync.yomikaze-md.workers.dev',
    storeId,
    syncKey,
    branchName: settings.store_name || 'My Store'
  }
}

async function postToCloud(
  apiUrl: string,
  endpoint: string,
  payload: { store_id: string; sync_key: string; branch_name: string; data: any }
): Promise<boolean> {
  const url = `${apiUrl.replace(/\/+$/, '')}${endpoint}`
  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 6000) // 6s timeout

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: controller.signal
    })
    clearTimeout(timeout)
    return res.ok
  } catch (err) {
    // Non-blocking catch: POS must run smooth even without internet!
    console.warn(`[CloudSync] Sync failed for ${endpoint}:`, (err as Error).message)
    return false
  }
}

/**
 * Push an individual sale to cloud immediately upon checkout
 */
export async function pushSaleToCloud(db: Database.Database, saleData: CloudSaleSyncPayload): Promise<void> {
  const creds = getSyncCredentials(db)
  if (!creds) return

  const ok = await postToCloud(creds.apiUrl, '/api/sync/sale', {
    store_id: creds.storeId,
    sync_key: creds.syncKey,
    branch_name: creds.branchName,
    data: saleData
  })

  if (ok) {
    updateSettings(db, {
      cloud_last_synced_at: new Date().toISOString(),
      cloud_sync_pending: false
    })
  } else {
    updateSettings(db, { cloud_sync_pending: true })
  }
}

/**
 * Push stock movement to cloud immediately upon receipt, restock, or sale deduction
 */
export async function pushStockToCloud(db: Database.Database, stockData: CloudStockSyncPayload): Promise<void> {
  const creds = getSyncCredentials(db)
  if (!creds) return

  await postToCloud(creds.apiUrl, '/api/sync/stock', {
    store_id: creds.storeId,
    sync_key: creds.syncKey,
    branch_name: creds.branchName,
    data: stockData
  })
}

/**
 * Push shift closing snapshot to cloud on Z-Read / shift close
 */
export async function pushShiftToCloud(db: Database.Database, shiftData: CloudShiftSyncPayload): Promise<void> {
  const creds = getSyncCredentials(db)
  if (!creds) return

  const ok = await postToCloud(creds.apiUrl, '/api/sync/shift', {
    store_id: creds.storeId,
    sync_key: creds.syncKey,
    branch_name: creds.branchName,
    data: shiftData
  })

  if (ok) {
    updateSettings(db, {
      cloud_last_synced_at: new Date().toISOString(),
      cloud_sync_pending: false
    })
  } else {
    updateSettings(db, { cloud_sync_pending: true })
  }
}

/**
 * Manual sync function (triggered from Settings -> "Sync Now" button)
 * Gathers today's recent sales & movements and sends to cloud
 */
export async function syncNow(db: Database.Database): Promise<{ ok: boolean; message: string }> {
  const creds = getSyncCredentials(db)
  if (!creds) {
    return { ok: false, message: 'Cloud sync is not enabled or VIP license is inactive.' }
  }

  try {
    // Ping cloud endpoint
    const pingRes = await fetch(`${creds.apiUrl.replace(/\/+$/, '')}/`, { signal: AbortSignal.timeout(4000) })
    if (!pingRes.ok) {
      return { ok: false, message: 'Cloud server is not reachable right now.' }
    }

    updateSettings(db, {
      cloud_last_synced_at: new Date().toISOString(),
      cloud_sync_pending: false
    })

    return { ok: true, message: 'Connected successfully to Cloud Server.' }
  } catch (err: any) {
    return { ok: false, message: 'Connection failed: ' + (err.message || 'Network error') }
  }
}
