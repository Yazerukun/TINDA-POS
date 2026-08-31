import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

let dataDir: string

beforeAll(() => {
  dataDir = mkdtempSync(join(tmpdir(), 'tinda-int-'))
  process.env.TINDA_DATA_DIR = dataDir
})
afterAll(() => {
  try { closeDb() } catch { /* ignore */ }
  try { rmSync(dataDir, { recursive: true, force: true }) } catch { /* ignore */ }
})

// Import services AFTER setting env so getDb() resolves the right path.
import { completeSetup, login, logout } from '../auth'
import { checkout } from '../checkout'
import { processRefund, processVoid } from '../transaction'
import { createProduct, getProduct } from '../../repositories/products'
import { createCustomer, getCustomer } from '../../repositories/customers'
import { createBackup, listBackups } from '../../repositories/backup'
import { getDb, closeDb, integrityCheck } from '../../database/connection'
import type { ProductInput } from '../../../shared/types'

function miloInput(): ProductInput {
  return {
    category_id: null,
    name: 'Milo (Sachet)',
    sku: 'INT-MILO',
    barcode: '4900001',
    description: null,
    base_unit: 'sachet',
    purchase_cost_c: 600,
    default_price_c: 900,
    low_stock_threshold: 5,
    supplier_id: null,
    has_expiration: false,
    notes: null,
    units: [{ name: 'sachet', conversion_to_base: 1, selling_price_c: 900, barcode: null, is_default: true }],
    initial_stock_base: 50
  }
}

describe('End-to-end integration (real SQLite file)', () => {
  it('setup -> login -> create product -> checkout -> refund -> void -> backup', async () => {
    const db = getDb()

    // 1. First-run setup
    const setup = completeSetup({
      store: { store_name: 'Test Store', address: 'Manila' },
      admin: { username: 'admin', password: 'secret', pin: '1234', full_name: 'Manager' },
      receipt: { footer: 'Salamat!' },
      data_dir: dataDir,
      load_demo: false
    })
    expect(setup.user.username).toBe('admin')
    expect(setup.firstRun).toBe(false)

    // An initial MANUAL backup must be auto-created on first-run setup so there
    // is always a restore point representing a fully-initialized store.
    expect(listBackups(db).length).toBeGreaterThanOrEqual(1)

    // re-setup is idempotent (won't re-create admin)
    const again = completeSetup({ store: { store_name: 'Test Store' }, admin: { username: 'admin', password: 'secret', pin: '1234' }, receipt: {}, data_dir: dataDir, load_demo: false })
    expect(again.user.username).toBe('admin')

    // 2. Create a product and receive stock
    const milo = createProduct(db, miloInput(), 1)
    expect(milo.stock).toBe(50)
    expect(getProduct(db, milo.id).stock).toBe(50)

    // create a customer for utang
    const cust = createCustomer(db, { full_name: 'Juan', credit_limit_c: 100000 })
    expect(cust.balance_c).toBe(0)

    // 3. Cash checkout of 3 sachets
    const cashSale = checkout({
      items: [{ product_id: milo.id, name: milo.name, unit_name: 'sachet', qty: 3, qty_base: 3, unit_price_c: 900, cost_base_c: 600, stock_base: 50, subtotal_c: 2700 }],
      discount_c: 0,
      customer_id: null,
      payments: [{ method: 'CASH', amount_c: 10000 }]
    })
    expect(cashSale.sale.total_c).toBe(2700)
    expect(getProduct(db, milo.id).stock).toBe(47)
    expect(cashSale.receipt.length).toBeGreaterThan(0)

    // 4. Refund 1 sachet -> restores stock
    const saleItem = cashSale.sale.items[0] as NonNullable<(typeof cashSale.sale.items)[0]>
    const refund = processRefund({
      sale_id: cashSale.sale.id,
      reason: 'customer returned 1',
      items: [{ sale_item_id: saleItem.id, product_id: milo.id, qty_base: 1, unit_name: 'sachet' }]
    })
    expect(refund.total_c).toBe(900)
    expect(getProduct(db, milo.id).stock).toBe(48)

    // 5. Utang sale of 2 sachets to Juan
    const utangSale = checkout({
      items: [{ product_id: milo.id, name: milo.name, unit_name: 'sachet', qty: 2, qty_base: 2, unit_price_c: 900, cost_base_c: 600, stock_base: 48, subtotal_c: 1800 }],
      discount_c: 0,
      customer_id: cust.id,
      payments: [{ method: 'UTANG', amount_c: 1800 }]
    })
    expect(utangSale.sale.total_c).toBe(1800)
    expect(getProduct(db, milo.id).stock).toBe(46)
    expect(getCustomer(db, cust.id).balance_c).toBe(1800)

    // 6. Void the utang sale -> restores stock and clears utang
    const voided = processVoid({ sale_id: utangSale.sale.id, reason: 'mistake' })
    expect(voided.status).toBe('VOIDED')
    expect(getProduct(db, milo.id).stock).toBe(48)
    expect(getCustomer(db, cust.id).balance_c).toBe(0)

    // 7. Integrity check + backup
    expect(integrityCheck().ok).toBe(true)
    const b = await createBackup(db, 'MANUAL')
    expect(b.filename).toMatch(/\.db$/)
    expect(listBackups(db).length).toBeGreaterThanOrEqual(1)

    // 8. logout then login
    logout()
    const loggedIn = login('admin', 'secret')
    expect(loggedIn.user.username).toBe('admin')
  })
})