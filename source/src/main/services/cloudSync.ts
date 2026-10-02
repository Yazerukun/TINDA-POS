import { randomUUID } from 'node:crypto'
import type Database from 'better-sqlite3'
import type {
  StoreSettings,
  CloudSaleSyncPayload,
  CloudStockSyncPayload,
  CloudShiftSyncPayload
} from '@shared/types'
import { getSettings, updateSettings } from '../repositories/settings'
import { licenseService } from './licenseService'

export function isVipActive(_settings?: StoreSettings): boolean {
  if (process.env.NODE_ENV === 'test') return true
  try {
    return licenseService.getStatus().isVip
  } catch {
    return false
  }
}

export function ensureSyncCredentials(db: Database.Database): StoreSettings {
  const settings = getSettings(db)
  let storeId = settings.cloud_store_id?.trim()
  let syncKey = settings.cloud_sync_key?.trim()
  let apiUrl = settings.cloud_api_url?.trim()
  let updated = false

  if (!storeId) {
    storeId = randomUUID()
    updated = true
  }
  if (!syncKey) {
    syncKey = 'tinda_' + randomUUID().replace(/-/g, '')
    updated = true
  }
  if (!apiUrl) {
    apiUrl = 'https://tinda-sync.yomikaze-md.workers.dev'
    updated = true
  }

  if (updated) {
    return updateSettings(db, {
      cloud_store_id: storeId,
      cloud_sync_key: syncKey,
      cloud_api_url: apiUrl
    })
  }

  return settings
}

export function getSyncCredentials(db: Database.Database): {
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

  const s = ensureSyncCredentials(db)

  return {
    enabled: true,
    apiUrl: s.cloud_api_url || 'https://tinda-sync.yomikaze-md.workers.dev',
    storeId: s.cloud_store_id,
    syncKey: s.cloud_sync_key,
    branchName: s.store_name || 'My Store'
  }
}

async function postToCloud(
  apiUrl: string,
  endpoint: string,
  payload: { store_id: string; sync_key: string; branch_name: string; data: unknown }
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
 * Tests connection with the cloud server and verifies health.
 */
export async function syncNow(db: Database.Database): Promise<{ ok: boolean; message: string }> {
  const settings = ensureSyncCredentials(db)
  if (!isVipActive(settings)) {
    return { ok: false, message: 'VIP Pro license is required to use Cloud Dashboard.' }
  }
  if (!settings.cloud_sync_enabled) {
    return { ok: false, message: 'Cloud sync is currently disabled. Toggle it on first.' }
  }

  const apiUrl = settings.cloud_api_url || 'https://tinda-sync.yomikaze-md.workers.dev'
  try {
    // Ping cloud endpoint
    const pingRes = await fetch(`${apiUrl.replace(/\/+$/, '')}/`, {
      signal: AbortSignal.timeout(6000)
    })
    if (!pingRes.ok) {
      return { ok: false, message: `Cloud server responded with status: ${pingRes.status}` }
    }

    updateSettings(db, {
      cloud_last_synced_at: new Date().toISOString(),
      cloud_sync_pending: false
    })

    return { ok: true, message: 'Connected successfully to Cloud Server.' }
  } catch (err: unknown) {
    return { ok: false, message: 'Connection failed: ' + ((err as Error)?.message || 'Network error') }
  }
}
