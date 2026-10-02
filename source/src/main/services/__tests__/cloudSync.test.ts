import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import Database from 'better-sqlite3'
import { ensureSyncCredentials, getSyncCredentials, syncNow, pushSaleToCloud } from '../cloudSync'
import { updateSettings, getSettings } from '../../repositories/settings'

describe('cloudSync Service', () => {
  let db: Database.Database

  beforeEach(() => {
    db = new Database(':memory:')
    db.exec(`
      CREATE TABLE settings (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL
      );
    `)
  })

  afterEach(() => {
    db.close()
    vi.restoreAllMocks()
  })

  it('ensures and auto-generates sync credentials on first access', () => {
    const s = ensureSyncCredentials(db)
    expect(s.cloud_store_id).toBeTruthy()
    expect(s.cloud_sync_key).toBeTruthy()
    expect(s.cloud_sync_key).toMatch(/^tinda_/)
    expect(s.cloud_api_url).toBe('https://tinda-sync.yomikaze-md.workers.dev')

    const dbSettings = getSettings(db)
    expect(dbSettings.cloud_store_id).toBe(s.cloud_store_id)
    expect(dbSettings.cloud_sync_key).toBe(s.cloud_sync_key)
  })

  it('preserves existing credentials if already generated', () => {
    updateSettings(db, {
      cloud_store_id: 'custom-store-uuid-1234',
      cloud_sync_key: 'custom-key-secret-5678'
    })

    const s = ensureSyncCredentials(db)
    expect(s.cloud_store_id).toBe('custom-store-uuid-1234')
    expect(s.cloud_sync_key).toBe('custom-key-secret-5678')
  })

  it('returns null credentials when cloud_sync_enabled is false', () => {
    updateSettings(db, { cloud_sync_enabled: false })
    const creds = getSyncCredentials(db)
    expect(creds).toBeNull()
  })

  it('returns valid credentials when cloud_sync_enabled is true', () => {
    updateSettings(db, {
      cloud_sync_enabled: true,
      store_name: 'Supermarket Central'
    })
    const creds = getSyncCredentials(db)
    expect(creds).not.toBeNull()
    expect(creds?.branchName).toBe('Supermarket Central')
    expect(creds?.storeId).toBeTruthy()
  })

  it('handles pushSaleToCloud gracefully without throwing when offline', async () => {
    updateSettings(db, {
      cloud_sync_enabled: true,
      cloud_api_url: 'http://localhost:99999' // Non-existent port
    })

    await expect(
      pushSaleToCloud(db, {
        local_sale_id: 1,
        transaction_no: 'TRX-1001',
        cashier_name: 'Admin',
        customer_name: null,
        subtotal_c: 10000,
        discount_c: 0,
        total_c: 10000,
        status: 'COMPLETED',
        cash_c: 10000,
        gcash_c: 0,
        maya_c: 0,
        utang_c: 0,
        local_shift_id: 1,
        sold_at: new Date().toISOString(),
        items: []
      })
    ).resolves.not.toThrow()

    // Offline flag set to true
    const updated = getSettings(db)
    expect(updated.cloud_sync_pending).toBe(true)
  })

  it('tests connection via syncNow', async () => {
    updateSettings(db, { cloud_sync_enabled: false })
    const disabledRes = await syncNow(db)
    expect(disabledRes.ok).toBe(false)
    expect(disabledRes.message).toContain('disabled')

    updateSettings(db, {
      cloud_sync_enabled: true,
      cloud_api_url: 'https://httpstat.us/200'
    })
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true }))

    const res = await syncNow(db)
    expect(res.ok).toBe(true)
    expect(res.message).toContain('Connected')
  })
})
