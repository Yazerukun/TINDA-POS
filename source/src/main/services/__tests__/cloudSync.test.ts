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

  it('returns accurate error message when /api/sync/ping returns 401 unauthorized', async () => {
    updateSettings(db, {
      cloud_sync_enabled: true,
      cloud_api_url: 'https://cloud.example.com',
      cloud_store_id: 'MY-STORE-UUID',
      cloud_sync_key: 'tinda_invalid'
    })

    const fetchMock = vi.fn().mockImplementation((url: string) => {
      if (url.endsWith('/api/sync/ping')) {
        return Promise.resolve({ ok: false, status: 401, json: async () => ({ error: 'Invalid sync credentials.' }) })
      }
      return Promise.resolve({ ok: true, status: 200 })
    })
    vi.stubGlobal('fetch', fetchMock)

    const res = await syncNow(db)
    expect(res.ok).toBe(false)
    expect(res.message).toContain('Invalid Sync Credentials')
  })

  it('only increments pushedCount when sales post succeeds and normalizes storeId', async () => {
    db.exec(`
      CREATE TABLE users (id INTEGER PRIMARY KEY, username TEXT, full_name TEXT);
      CREATE TABLE customers (id INTEGER PRIMARY KEY, full_name TEXT);
      CREATE TABLE sale_items (id INTEGER PRIMARY KEY, sale_id INTEGER, product_name TEXT, unit_name TEXT, qty REAL, unit_price_c INTEGER, subtotal_c INTEGER);
      CREATE TABLE payments (id INTEGER PRIMARY KEY, sale_id INTEGER, method TEXT, amount_c INTEGER);
      CREATE TABLE sales (
        id INTEGER PRIMARY KEY,
        transaction_no TEXT,
        user_id INTEGER,
        customer_id INTEGER,
        subtotal_c INTEGER,
        discount_c INTEGER,
        total_c INTEGER,
        status TEXT,
        shift_id INTEGER,
        notes TEXT,
        created_at TEXT,
        voided_at TEXT,
        voided_by INTEGER,
        void_reason TEXT
      );
    `)
    db.prepare(`
      INSERT INTO sales (id, transaction_no, user_id, customer_id, subtotal_c, discount_c, total_c, status, shift_id, created_at)
      VALUES (1, 'TPOS-000001', 1, NULL, 5000, 0, 5000, 'COMPLETED', NULL, '2026-10-12 12:00:00')
    `).run()

    updateSettings(db, {
      cloud_sync_enabled: true,
      cloud_api_url: 'https://cloud.example.com',
      cloud_store_id: 'UPPER-STORE-UUID-1234',
      cloud_sync_key: 'tinda_validkey'
    })

    let salePayloadSent: any = null
    const fetchMock = vi.fn().mockImplementation((url: string, init?: any) => {
      if (url.endsWith('/api/sync/sale')) {
        salePayloadSent = JSON.parse(init.body)
        return Promise.resolve({ ok: true, status: 200 })
      }
      return Promise.resolve({ ok: true, status: 200 })
    })
    vi.stubGlobal('fetch', fetchMock)

    const res = await syncNow(db)
    expect(res.ok).toBe(true)
    expect(res.message).toContain('Synced 1 sale(s)')
    expect(salePayloadSent.store_id).toBe('upper-store-uuid-1234')
  })
})
