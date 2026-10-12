import { randomUUID } from 'node:crypto'
import type Database from 'better-sqlite3'
import type {
  StoreSettings,
  CloudSaleSyncPayload,
  CloudStockSyncPayload,
  CloudShiftSyncPayload
} from '@shared/types'
import { getSettings, updateSettings } from '../repositories/settings'
import { listSales } from '../repositories/sales'
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
  let storeId = settings.cloud_store_id?.trim().toLowerCase()
  let syncKey = settings.cloud_sync_key?.trim()
  let apiUrl = settings.cloud_api_url?.trim()
  let updated = false

  if (!storeId) {
    storeId = randomUUID().toLowerCase()
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

  if (updated || settings.cloud_store_id !== storeId) {
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
    storeId: (s.cloud_store_id || '').trim().toLowerCase(),
    syncKey: (s.cloud_sync_key || '').trim(),
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

    const normalizedPayload = {
      ...payload,
      store_id: payload.store_id.trim().toLowerCase(),
      sync_key: payload.sync_key.trim()
    }

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36 TINDA-POS/1.0.48'
      },
      body: JSON.stringify(normalizedPayload),
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
  const storeId = (settings.cloud_store_id || '').trim().toLowerCase()
  const syncKey = (settings.cloud_sync_key || '').trim()
  const branchName = settings.store_name || 'My Store'

  if (!storeId || !syncKey) {
    return { ok: false, message: 'Store ID and Sync Key must be configured in Settings.' }
  }

  try {
    // Ping cloud endpoint
    const pingRes = await fetch(`${apiUrl.replace(/\/+$/, '')}/`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36 TINDA-POS/1.0.48'
      },
      signal: AbortSignal.timeout(6000)
    })
    if (!pingRes.ok) {
      return { ok: false, message: `Cloud server responded with status: ${pingRes.status}` }
    }

    // Auto-register and verify store on Cloudflare D1
    const syncPingRes = await fetch(`${apiUrl.replace(/\/+$/, '')}/api/sync/ping`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36 TINDA-POS/1.0.48'
      },
      body: JSON.stringify({
        store_id: storeId,
        sync_key: syncKey,
        branch_name: branchName
      }),
      signal: AbortSignal.timeout(6000)
    })

    if (!syncPingRes.ok) {
      if (syncPingRes.status === 401) {
        return { ok: false, message: 'Invalid Sync Credentials. Please verify Store ID and Sync Key in Settings.' }
      }
      let errDetail = ''
      try {
        const errJson = (await syncPingRes.json()) as any
        if (errJson?.error) errDetail = `: ${errJson.error}`
      } catch {}
      return { ok: false, message: `Cloud authentication failed (${syncPingRes.status})${errDetail}` }
    }

    // Push recent sales so cloud dashboard displays live data immediately
    let pushedCount = 0
    try {
      const hasSalesTable = Boolean(db.prepare("SELECT 1 FROM sqlite_master WHERE type='table' AND name='sales'").get())
      if (hasSalesTable) {
        const recent = listSales(db, { limit: 50 }).rows.filter((s: any) => s.status !== 'VOIDED')
        for (const s of recent) {
          const payments = (s as any).payments || []
          const getAmt = (m: string): number =>
            payments.filter((p: any) => p.method === m).reduce((sum: number, p: any) => sum + (p.amount_c || 0), 0)
          const nonCash = getAmt('GCASH') + getAmt('MAYA') + getAmt('MARIBANK') + getAmt('UTANG')
          const actualCash = Math.max(0, s.total_c - nonCash)
          const success = await postToCloud(apiUrl, '/api/sync/sale', {
            store_id: storeId,
            sync_key: syncKey,
            branch_name: branchName,
            data: {
              local_sale_id: s.id,
              transaction_no: s.transaction_no,
              cashier_name: null,
              customer_name: (s as any).customer_name || null,
              subtotal_c: s.subtotal_c,
              discount_c: s.discount_c,
              total_c: s.total_c,
              status: s.status,
              cash_c: actualCash,
              gcash_c: getAmt('GCASH'),
              maya_c: getAmt('MAYA'),
              utang_c: getAmt('UTANG'),
              net_sales_c: Math.max(0, s.total_c - getAmt('UTANG')),
              local_shift_id: s.shift_id,
              sold_at: s.created_at,
              items: ((s as any).items || []).map((it: any) => ({
                product_name: it.product_name || it.name || 'Item',
                unit_name: it.unit_name || 'pc',
                qty: it.qty,
                unit_price_c: it.unit_price_c,
                subtotal_c: it.subtotal_c
              }))
            }
          })
          if (success) {
            pushedCount++
          }
        }
      }
    } catch {}

    updateSettings(db, {
      cloud_last_synced_at: new Date().toISOString(),
      cloud_sync_pending: false
    })

    return {
      ok: true,
      message: pushedCount > 0
        ? `Connected to Cloud Server. Synced ${pushedCount} sale(s) to dashboard!`
        : 'Connected successfully to Cloud Server.'
    }
  } catch (err: unknown) {
    return { ok: false, message: 'Connection failed: ' + ((err as Error)?.message || 'Network error') }
  }
}

let syncIntervalTimer: NodeJS.Timeout | null = null

/**
 * Starts continuous background auto-sync loop (every 3 minutes)
 * and performs an automatic startup backfill after 4 seconds.
 */
export function startCloudSyncLoop(db: Database.Database): () => void {
  if (syncIntervalTimer) {
    clearInterval(syncIntervalTimer)
    syncIntervalTimer = null
  }

  // Initial startup backfill after 4s grace period
  const startupTimeout = setTimeout(() => {
    try {
      const creds = getSyncCredentials(db)
      if (creds?.enabled) {
        void syncNow(db).catch(() => {})
      }
    } catch {}
  }, 4000)

  // Continuous auto-sync every 3 minutes (180,000ms)
  syncIntervalTimer = setInterval(() => {
    try {
      const creds = getSyncCredentials(db)
      if (creds?.enabled) {
        void syncNow(db).catch(() => {})
      }
    } catch {}
  }, 180000)

  return () => {
    clearTimeout(startupTimeout)
    if (syncIntervalTimer) {
      clearInterval(syncIntervalTimer)
      syncIntervalTimer = null
    }
  }
}

