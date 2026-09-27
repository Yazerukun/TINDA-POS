import Database from 'better-sqlite3'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { migrations, runMigrations } from '../../database/migrations'
import { adjustStock, createProduct, getProduct, updateProduct } from '../products'
import { batchesFor, listExpiration, updateBatchDate } from '../expiration'
import { createCategory } from '../categories'
import { expirationStatus, localDate, validExpirationDate } from '@shared/expiration'
import type { ProductInput } from '@shared/types'
import { checkout } from '../../services/checkout'
import { processRefund, processVoid } from '../../services/transaction'
import { setSession } from '../../services/session'

vi.mock('../../database/connection', () => ({ getDb: () => db }))

let db: Database.Database
const input: ProductInput = {
  category_id: null, name: 'Milk', sku: 'MILK', barcode: null, description: null,
  base_unit: 'pc', purchase_cost_c: 1000, default_price_c: 1500, supplier_id: null,
  has_expiration: false, notes: null,
  units: [{ name: 'pc', conversion_to_base: 1, barcode: null, selling_price_c: 1500, is_default: true }]
}
const future = '2099-12-31'
const past = '2000-01-01'
beforeEach(() => {
  db = new Database(':memory:'); db.pragma('foreign_keys=ON'); runMigrations(db)
  db.prepare("INSERT INTO users(username,password_hash,pin_hash,full_name) VALUES('qa','x','x','QA')").run()
  setSession({ id: 1, username: 'qa', full_name: 'QA', roles: ['ADMIN'] })
})
afterEach(() => { setSession(null); db.close() })

const create = (patch: Partial<ProductInput> = {}) => createProduct(db, { ...input, ...patch }, 1)
const receive = (id: number, qty: number, date: string) => adjustStock(db, id, qty, 'PURCHASE', 'QA receiving', 1, undefined, { expiration_date: date })
const sell = (id: number, qty: number) => adjustStock(db, id, -qty, 'SALE', 'QA sale', 1, 'TPOS-QA')
const firstBatch = (id: number) => {
  const batch = batchesFor(db, id)[0]
  if (!batch) throw new Error('Expected a batch in the test fixture.')
  return batch
}

describe('expiration stock tracking', () => {
  it('keeps untracked products unchanged', () => {
    const p = create({ initial_stock_base: 5 })
    sell(p.id, 2)
    expect(getProduct(db, p.id)).toMatchObject({ stock: 3, sellable_stock: 3, expiration_mode: 'NONE', batches: [] })
    expect(listExpiration(db)).toEqual([])
  })

  it('validates dates, including impossible calendar dates', () => {
    expect(validExpirationDate('2026-02-29')).toBe(false)
    expect(validExpirationDate('2028-02-29')).toBe(true)
    expect(validExpirationDate('2026-13-01')).toBe(false)
    expect(() => create({ expiration_mode: 'ITEM' })).toThrow(/required/)
    expect(() => create({ expiration_mode: 'ITEM', expiration_date: '2026-02-30' })).toThrow(/valid/)
  })

  it('uses local calendar boundaries and includes the expiry day in the 7-day warning', () => {
    expect(localDate(new Date(2026, 8, 14, 23, 59))).toBe('2026-09-14')
    expect(expirationStatus('2026-09-13', '2026-09-14')).toBe('EXPIRED')
    expect(expirationStatus('2026-09-14', '2026-09-14')).toBe('SOON')
    expect(expirationStatus('2026-09-21', '2026-09-14')).toBe('SOON')
    expect(expirationStatus('2026-09-22', '2026-09-14')).toBe('NEAR')
    expect(expirationStatus('2026-10-14', '2026-09-14')).toBe('NEAR')
    expect(expirationStatus('2026-10-15', '2026-09-14')).toBe('OK')
    expect(expirationStatus(null)).toBe('UNKNOWN')
  })

  it('blocks expired item stock atomically while allowing withdrawal', () => {
    const p = create({ expiration_mode: 'ITEM', expiration_date: past, initial_stock_base: 5 })
    expect(() => sell(p.id, 1)).toThrow(/expired/)
    expect(getProduct(db, p.id)).toMatchObject({ stock: 5, sellable_stock: 0 })
    expect(db.prepare("SELECT id FROM inventory_movements WHERE movement_type='SALE'").all()).toEqual([])
    adjustStock(db, p.id, -5, 'WITHDRAWAL', 'Expired', 1)
    expect(listExpiration(db)).toEqual([])
  })

  it('sells non-expired per-item stock and preserves date on unrelated edits', () => {
    const p = create({ expiration_mode: 'ITEM', expiration_date: future, initial_stock_base: 4 })
    sell(p.id, 2)
    expect(updateProduct(db, p.id, { name: 'Fresh Milk' }, 1)).toMatchObject({ expiration_date: future, stock: 2, expiration_mode: 'ITEM' })
    expect(() => receive(p.id, 1, '2099-12-30')).toThrow(/same expiry/)
  })

  it('creates opening batch inside the product transaction and rolls back invalid opening stock', () => {
    expect(() => create({ expiration_mode: 'BATCH', initial_stock_base: 5 })).toThrow(/date is required/)
    expect(db.prepare('SELECT id FROM products').all()).toEqual([])
    const p = create({ expiration_mode: 'BATCH', initial_stock_base: 5, expiration_date: future })
    expect(p.batches).toHaveLength(1)
    expect(p.batches?.[0]).toMatchObject({ quantity: 5, expiration_date: future })
  })

  it('allocates earliest eligible expiry first, ignoring expired stock', () => {
    const p = create({ expiration_mode: 'BATCH' })
    receive(p.id, 10, future)
    receive(p.id, 3, '2099-01-01')
    receive(p.id, 4, past)
    sell(p.id, 5)
    expect(batchesFor(db, p.id).map((b) => [b.expiration_date, b.quantity])).toEqual([[past, 4], [future, 8]])
    expect(getProduct(db, p.id)).toMatchObject({ stock: 12, sellable_stock: 8 })
    expect(() => sell(p.id, 9)).toThrow(/eligible/)
    expect(getProduct(db, p.id).stock).toBe(12)
  })

  it('restores original allocations on partial refunds and keeps batch totals equal to product stock', () => {
    const p = create({ expiration_mode: 'BATCH' })
    receive(p.id, 2, '2099-01-01'); receive(p.id, 8, future); sell(p.id, 5)
    adjustStock(db, p.id, 1, 'REFUND', 'Partial refund', 1, 'REF-1', { return_reference: 'TPOS-QA' })
    adjustStock(db, p.id, 4, 'REFUND', 'Remaining refund', 1, 'REF-2', { return_reference: 'TPOS-QA' })
    expect(batchesFor(db, p.id).map((b) => b.quantity)).toEqual([2, 8])
    expect(getProduct(db, p.id).stock).toBe(10)
  })

  it('keeps original expired batch dates when a sale is voided later', () => {
    const p = create({ expiration_mode: 'BATCH' })
    receive(p.id, 2, future); sell(p.id, 2)
    db.prepare('UPDATE stock_batches SET expiration_date=?').run(past)
    adjustStock(db, p.id, 2, 'RETURN', 'Void', 1, 'TPOS-QA', { return_reference: 'TPOS-QA' })
    expect(getProduct(db, p.id)).toMatchObject({ stock: 2, sellable_stock: 0 })
    expect(firstBatch(p.id).expiration_date).toBe(past)
  })

  it('quarantines undated old returns until a date is verified and records the correction', () => {
    const p = create({ expiration_mode: 'BATCH' })
    adjustStock(db, p.id, 2, 'REFUND', 'Legacy refund', 1, 'REF-1', { return_reference: 'OLD-SALE' })
    expect(getProduct(db, p.id)).toMatchObject({ stock: 2, sellable_stock: 0 })
    const b = firstBatch(p.id)
    expect(() => updateBatchDate(db, b.id, 'bad', 1)).toThrow(/valid/)
    updateBatchDate(db, b.id, future, 1)
    expect(getProduct(db, p.id).sellable_stock).toBe(2)
    expect(db.prepare("SELECT id FROM audit_logs WHERE action='BATCH_EXPIRATION'").all()).toHaveLength(1)
  })

  it('requires an explicit owned batch for withdrawal and never removes another batch', () => {
    const p = create({ expiration_mode: 'BATCH' })
    receive(p.id, 2, past); receive(p.id, 10, future)
    const expired = firstBatch(p.id)
    expect(() => adjustStock(db, p.id, -1, 'WITHDRAWAL', 'Expired', 1)).toThrow(/Select the batch/)
    expect(() => adjustStock(db, p.id, -3, 'WITHDRAWAL', 'Expired', 1, undefined, { batch_id: expired.id })).toThrow(/eligible/)
    adjustStock(db, p.id, -2, 'WITHDRAWAL', 'Expired', 1, undefined, { batch_id: expired.id })
    expect(batchesFor(db, p.id)).toHaveLength(1)
    expect(getProduct(db, p.id).stock).toBe(10)
  })

  it('requires existing-stock expiry on conversion and disallows destructive mode changes while stocked', () => {
    const p = create({ initial_stock_base: 5 })
    expect(() => updateProduct(db, p.id, { expiration_mode: 'BATCH' }, 1)).toThrow(/existing stock/)
    const tracked = updateProduct(db, p.id, { expiration_mode: 'BATCH', expiration_date: future }, 1)
    expect(tracked.batches?.[0]?.quantity).toBe(5)
    expect(() => updateProduct(db, p.id, { expiration_mode: 'NONE' }, 1)).toThrow(/current stock/)
    expect(getProduct(db, p.id).expiration_mode).toBe('BATCH')
  })

  it('retains a single category for case-insensitive duplicate names', () => {
    expect(createCategory(db, ' Drinks ').id).toBe(createCategory(db, 'drinks').id)
  })

  it('excludes archived and depleted entries from alerts', () => {
    const p = create({ expiration_mode: 'ITEM', expiration_date: past, initial_stock_base: 2 })
    expect(listExpiration(db)).toHaveLength(1)
    db.prepare("UPDATE products SET status='ARCHIVED' WHERE id=?").run(p.id)
    expect(listExpiration(db)).toHaveLength(0)
  })

  it('upgrades the v1.0.11 schema without changing old records and is idempotent', () => {
    const old = new Database(':memory:')
    try {
      old.exec('CREATE TABLE app_migrations(version INTEGER PRIMARY KEY, name TEXT NOT NULL)')
      for (const m of migrations.filter((m) => m.version <= 5)) { old.exec(m.sql); old.prepare('INSERT INTO app_migrations VALUES(?,?)').run(m.version, m.name) }
      old.prepare("INSERT INTO products(name,sku,base_unit,stock,has_expiration) VALUES('Legacy','LEG','pc',12,1)").run()
      const before = old.prepare('SELECT * FROM products').get() as Record<string, unknown>
      runMigrations(old); runMigrations(old)
      const after = old.prepare('SELECT * FROM products').get() as Record<string, unknown>
      expect(after).toMatchObject(before)
      expect(after).toMatchObject({ expiration_mode: 'NONE', expiration_date: null, stock: 12 })
      expect(old.prepare('SELECT * FROM stock_batches').all()).toEqual([])
      expect(old.pragma('integrity_check', { simple: true })).toBe('ok')
      expect(old.pragma('foreign_key_check')).toEqual([])
    } finally { old.close() }
  })

  it('runs real checkout, partial refund, and full refund with exact batch stock', () => {
    const p = create({ expiration_mode: 'BATCH' })
    receive(p.id, 5, future)
    const sale = checkout({ items: [{ product_id: p.id, name: p.name, unit_name: 'pc', qty: 3, qty_base: 3, unit_price_c: 1500, cost_base_c: 1000, stock_base: 5, subtotal_c: 4500 }], customer_id: null, discount_c: 0, payments: [{ method: 'CASH', amount_c: 4500 }] }).sale
    const item = { sale_item_id: sale.items[0]!.id, product_id: p.id, qty_base: 1, unit_name: 'pc' }
    processRefund({ sale_id: sale.id, reason: 'QA partial', items: [item] })
    expect(getProduct(db, p.id).stock).toBe(3)
    processRefund({ sale_id: sale.id, reason: 'QA remaining', items: [{ ...item, qty_base: 2 }] })
    expect(getProduct(db, p.id).stock).toBe(5)
    expect(firstBatch(p.id).quantity).toBe(5)
    expect(() => processRefund({ sale_id: sale.id, reason: 'Again', items: [item] })).toThrow(/already/)
    expect(db.pragma('foreign_key_check')).toEqual([])
  })

  it('runs real void and blocks expired checkout without recording a sale', () => {
    const p = create({ expiration_mode: 'BATCH' })
    receive(p.id, 2, future)
    const payload = { items: [{ product_id: p.id, name: p.name, unit_name: 'pc', qty: 2, qty_base: 2, unit_price_c: 1500, cost_base_c: 1000, stock_base: 2, subtotal_c: 3000 }], customer_id: null, discount_c: 0, payments: [{ method: 'CASH' as const, amount_c: 3000 }] }
    const sale = checkout(payload).sale
    processVoid({ sale_id: sale.id, reason: 'QA void' })
    expect(firstBatch(p.id).quantity).toBe(2)
    updateBatchDate(db, firstBatch(p.id).id, past, 1)
    expect(() => checkout(payload)).toThrow(/blocked/)
    expect(db.prepare('SELECT id FROM sales').all()).toHaveLength(1)
    expect(getProduct(db, p.id).stock).toBe(2)
  })

  it('rejects duplicated and mismatched refund items without inflating stock', () => {
    const p = create({ expiration_mode: 'BATCH', initial_stock_base: 2, expiration_date: future })
    const other = create({ sku: 'OTHER' })
    const sale = checkout({ items: [{ product_id: p.id, name: p.name, unit_name: 'pc', qty: 1, qty_base: 1, unit_price_c: 1500, cost_base_c: 1000, stock_base: 2, subtotal_c: 1500 }], customer_id: null, discount_c: 0, payments: [{ method: 'CASH', amount_c: 1500 }] }).sale
    const item = { sale_item_id: sale.items[0]!.id, product_id: p.id, qty_base: 1, unit_name: 'pc' }
    expect(() => processRefund({ sale_id: sale.id, reason: 'QA', items: [item, item] })).toThrow(/once/)
    expect(() => processRefund({ sale_id: sale.id, reason: 'QA', items: [{ ...item, product_id: other.id }] })).toThrow(/match/)
    expect(getProduct(db, p.id).stock).toBe(1)
    expect(getProduct(db, other.id).stock).toBe(0)
  })

  it('restores the exact sale-line batch when one product appears on two lines', () => {
    const p = create({ expiration_mode: 'BATCH' })
    receive(p.id, 1, '2099-01-01'); receive(p.id, 1, future)
    const line = { product_id: p.id, name: p.name, unit_name: 'pc', qty: 1, qty_base: 1, unit_price_c: 1500, cost_base_c: 1000, stock_base: 2, subtotal_c: 1500 }
    const sale = checkout({ items: [line, line], customer_id: null, discount_c: 0, payments: [{ method: 'CASH', amount_c: 3000 }] }).sale
    processRefund({ sale_id: sale.id, reason: 'Second line only', items: [{ sale_item_id: sale.items[1]!.id, product_id: p.id, qty_base: 1, unit_name: 'pc' }] })
    expect(firstBatch(p.id)).toMatchObject({ expiration_date: future, quantity: 1 })
    expect(batchesFor(db, p.id)).toHaveLength(1)
    expect(db.pragma('foreign_key_check')).toEqual([])
  })
})
