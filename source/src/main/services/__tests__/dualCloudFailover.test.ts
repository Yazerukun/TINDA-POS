import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import Database from 'better-sqlite3'
import { pushSaleToCloud, SUPABASE_SYNC_CONFIG } from '../cloudSync'
import { updateSettings } from '../../repositories/settings'

describe('Dual-Cloud Autonomous Failover to Supabase', () => {
  let db: Database.Database

  beforeEach(() => {
    db = new Database(':memory:')
    db.exec(`
      CREATE TABLE settings (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL
      );
      CREATE TABLE sales (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        total_c INTEGER NOT NULL,
        cloud_synced_at TEXT
      );
    `)
  })

  afterEach(() => {
    db.close()
    vi.restoreAllMocks()
  })

  it('exposes valid Supabase cloud configuration credentials', () => {
    expect(SUPABASE_SYNC_CONFIG.url).toBe('https://qeruenpmscoxwycniklr.supabase.co')
    expect(SUPABASE_SYNC_CONFIG.anonKey).toBeTruthy()
    expect(SUPABASE_SYNC_CONFIG.anonKey.length).toBeGreaterThan(50)
  })

  it('safely handles pushSaleToCloud without throwing when primary gateway encounters network error', async () => {
    updateSettings(db, {
      cloud_sync_enabled: true,
      cloud_api_url: 'http://localhost:99999' // Non-existent primary port triggers failover
    })

    db.exec("INSERT INTO sales (id, total_c) VALUES (1, 15000);")

    await expect(
      pushSaleToCloud(db, {
        local_sale_id: 1,
        local_shift_id: 1,
        transaction_no: 'TRX-FAILOVER-001',
        cashier_name: 'Cashier 1',
        customer_name: 'Customer A',
        subtotal_c: 15000,
        discount_c: 0,
        total_c: 15000,
        status: 'COMPLETED',
        cash_c: 15000,
        gcash_c: 0,
        maya_c: 0,
        utang_c: 0,
        sold_at: new Date().toISOString(),
        items: [
          {
            product_name: 'Zest-O Orange',
            unit_name: 'piece',
            qty: 1,
            unit_price_c: 15000,
            subtotal_c: 15000
          }
        ]
      })
    ).resolves.not.toThrow()
  })
})
