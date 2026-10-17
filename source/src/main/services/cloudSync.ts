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

  let portalPin = settings.cloud_portal_pin?.trim()
  let portalSlug = settings.cloud_portal_slug?.trim().toLowerCase()

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
  if (!portalPin) {
    // Generate a default 4-digit PIN (e.g. 1234 or random)
    portalPin = '1234'
    updated = true
  }
  if (!portalSlug) {
    // Clean slug from store_name or fallback to store prefix
    const baseName = (settings.store_name || 'store')
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '')
      .slice(0, 16) || 'store'
    portalSlug = baseName
    updated = true
  }

  if (updated || settings.cloud_store_id !== storeId) {
    return updateSettings(db, {
      cloud_store_id: storeId,
      cloud_sync_key: syncKey,
      cloud_api_url: apiUrl,
      cloud_portal_pin: portalPin,
      cloud_portal_slug: portalSlug
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

/**
 * Resilient Chromium HTTP transport helper:
 * Uses Electron's native `net.fetch` if available (running inside Chromium network service),
 * falling back gracefully to Node `fetch` in test or standard environment.
 * The Chromium network stack bypasses third-party firewall/antivirus heuristics by matching
 * standard browser TLS fingerprinting and HTTP/2 characteristics.
 */
async function cloudFetch(
  url: string,
  init: RequestInit & { signal?: AbortSignal }
): Promise<Response> {
  // Use Electron's net.fetch when running in Electron Main process
  try {
    const electron = await import('electron')
    if (electron?.net?.fetch) {
      return await electron.net.fetch(url, init)
    }
  } catch {
    // Graceful fallback to global fetch in non-Electron/test runner
  }
  return await fetch(url, init)
}

async function postToCloud(
  apiUrl: string,
  endpoint: string,
  payload: { store_id: string; sync_key: string; branch_name: string; data: unknown }
): Promise<boolean> {
  const url = `${apiUrl.replace(/\/+$/, '')}${endpoint}`
  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 8000) // 8s timeout for high reliability

    const normalizedPayload = {
      ...payload,
      store_id: payload.store_id.trim().toLowerCase(),
      sync_key: payload.sync_key.trim()
    }

    const res = await cloudFetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36 TINDA-POS/2.2.15'
      },
      body: JSON.stringify(normalizedPayload),
      signal: controller.signal
    })
    clearTimeout(timeout)
    return res.ok
  } catch (err) {
    // Non-blocking catch: POS must run smooth even without internet or if offline!
    console.warn(`[CloudSync] Sync failed for ${endpoint}:`, (err as Error).message)
    return false
  }
}

export function ensureSyncSchema(db: Database.Database): void {
  try {
    const cols = db.prepare("PRAGMA table_info(sales)").all() as Array<{ name: string }>
    if (cols && cols.length > 0 && !cols.some((c) => c.name === 'cloud_synced_at')) {
      db.exec('ALTER TABLE sales ADD COLUMN cloud_synced_at TEXT;')
    }
  } catch (err) {
    console.warn('[CloudSync] ensureSyncSchema notice:', (err as Error).message)
  }
}

/**
 * Push an individual sale to cloud immediately upon checkout
 */
export async function pushSaleToCloud(db: Database.Database, saleData: CloudSaleSyncPayload): Promise<void> {
  const creds = getSyncCredentials(db)
  if (!creds) return
  ensureSyncSchema(db)

  const ok = await postToCloud(creds.apiUrl, '/api/sync/sale', {
    store_id: creds.storeId,
    sync_key: creds.syncKey,
    branch_name: creds.branchName,
    data: saleData
  })

  if (ok) {
    try {
      db.prepare("UPDATE sales SET cloud_synced_at = datetime('now','localtime') WHERE id = ?").run(saleData.local_sale_id)
    } catch {}
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
    const pingRes = await cloudFetch(`${apiUrl.replace(/\/+$/, '')}/`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36 TINDA-POS/2.2.15'
      },
      signal: AbortSignal.timeout(8000)
    })
    if (!pingRes.ok) {
      return { ok: false, message: `Cloud server responded with status: ${pingRes.status}` }
    }

    // Auto-register and verify store on Cloudflare D1
    const syncPingRes = await cloudFetch(`${apiUrl.replace(/\/+$/, '')}/api/sync/ping`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36 TINDA-POS/2.2.15'
      },
      body: JSON.stringify({
        store_id: storeId,
        sync_key: syncKey,
        branch_name: branchName,
        portal_pin: settings.cloud_portal_pin || '1234',
        portal_slug: settings.cloud_portal_slug || ''
      }),
      signal: AbortSignal.timeout(8000)
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

    // Push pending/recent sales so cloud dashboard displays live data immediately
    let pushedCount = 0
    try {
      ensureSyncSchema(db)
      const hasSalesTable = Boolean(db.prepare("SELECT 1 FROM sqlite_master WHERE type='table' AND name='sales'").get())
      if (hasSalesTable) {
        let candidateSales: any[] = []
        try {
          const pending = listSales(db, { limit: 100 }).rows.filter((s: any) => !s.cloud_synced_at && s.status !== 'VOIDED')
          candidateSales = pending.length > 0 ? pending : listSales(db, { limit: 50 }).rows.filter((s: any) => s.status !== 'VOIDED')
        } catch {
          candidateSales = listSales(db, { limit: 50 }).rows.filter((s: any) => s.status !== 'VOIDED')
        }

        const toPush = candidateSales.slice(0, 100)
        const payloadList = toPush.map((s: any) => {
          const payments = (s as any).payments || []
          const getAmt = (m: string): number =>
            payments.filter((p: any) => p.method === m).reduce((sum: number, p: any) => sum + (p.amount_c || 0), 0)
          const nonCash = getAmt('GCASH') + getAmt('MAYA') + getAmt('MARIBANK') + getAmt('UTANG')
          const actualCash = Math.max(0, s.total_c - nonCash)
          return {
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

        if (payloadList.length > 1) {
          // Attempt batch sync for multi-sale payloads
          const batchOk = await postToCloud(apiUrl, '/api/sync/batch', {
            store_id: storeId,
            sync_key: syncKey,
            branch_name: branchName,
            sales: payloadList
          } as any)

          if (batchOk) {
            pushedCount = payloadList.length
            try {
              const markStmt = db.prepare("UPDATE sales SET cloud_synced_at = datetime('now','localtime') WHERE id = ?")
              for (const item of payloadList) {
                markStmt.run(item.local_sale_id)
              }
            } catch {}
          } else {
            // Fallback to sequential /api/sync/sale
            for (const sPayload of payloadList) {
              const success = await postToCloud(apiUrl, '/api/sync/sale', {
                store_id: storeId,
                sync_key: syncKey,
                branch_name: branchName,
                data: sPayload
              })
              if (success) {
                pushedCount++
                try {
                  db.prepare("UPDATE sales SET cloud_synced_at = datetime('now','localtime') WHERE id = ?").run(sPayload.local_sale_id)
                } catch {}
              }
            }
          }
        } else if (payloadList.length === 1) {
          const sPayload = payloadList[0]
          const success = await postToCloud(apiUrl, '/api/sync/sale', {
            store_id: storeId,
            sync_key: syncKey,
            branch_name: branchName,
            data: sPayload
          })
          if (success) {
            pushedCount++
            try {
              db.prepare("UPDATE sales SET cloud_synced_at = datetime('now','localtime') WHERE id = ?").run(sPayload.local_sale_id)
            } catch {}
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

