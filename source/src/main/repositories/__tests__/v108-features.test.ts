import { beforeEach, describe, expect, it } from 'vitest'
import Database from 'better-sqlite3'
import { runMigrations } from '../../database/migrations'
import * as products from '../products'
import * as shifts from '../shifts'
import * as settings from '../settings'
import { importCsv } from '../../services/productImport'

let db: Database.Database
beforeEach(() => {
  db = new Database(':memory:'); db.pragma('foreign_keys=ON'); runMigrations(db)
  db.prepare("INSERT INTO users(username,password_hash,pin_hash,full_name) VALUES ('ana','x','x','Ana')").run()
  db.prepare("INSERT INTO users(username,password_hash,pin_hash,full_name) VALUES ('beth','x','x','Beth')").run()
})

const base = {
  category_id: null as number | null, name: 'Coke Mismo', sku: 'CM-1', barcode: null as string | null,
  description: 'Coke Mismo 500ml', base_unit: 'bottle', purchase_cost_c: 1500, default_price_c: 2000,
  low_stock_threshold: undefined as number | undefined, supplier_id: null as number | null,
  has_expiration: false, notes: null as string | null,
  units: [
    { name: 'bottle', conversion_to_base: 1, barcode: null as string | null, selling_price_c: 2000, is_default: true },
    { name: 'case', conversion_to_base: 24, barcode: '480000000024', selling_price_c: 48000, is_default: false }
  ]
}

describe('v1.0.8 low stock threshold default', () => {
  it('new product without a threshold uses the store Default Low Stock Alert', () => {
    settings.updateSettings(db, { default_low_stock: 8 })
    const p = products.createProduct(db, base, 1)
    expect(p.low_stock_threshold).toBe(8)
  })

  it('new product with an explicit threshold keeps it', () => {
    settings.updateSettings(db, { default_low_stock: 8 })
    const p = products.createProduct(db, { ...base, low_stock_threshold: 3 }, 1)
    expect(p.low_stock_threshold).toBe(3)
  })

  it('CSV import without low_stock_level column applies the store default', () => {
    settings.updateSettings(db, { default_low_stock: 6 })
    const result = importCsv(db, 'product_name,sku,selling_price,stock\nSardines,SAR-1,15,20\n', 'SKIP', 1)
    expect(result.created).toBe(1)
    const p = products.findBySku(db, 'sar-1')
    expect(p?.low_stock_threshold).toBe(6)
  })

  it('CSV import with low_stock_level uses the row value', () => {
    settings.updateSettings(db, { default_low_stock: 6 })
    const result = importCsv(db, 'product_name,sku,selling_price,stock,low_stock_level\nSardines,SAR-1,15,20,4\n', 'SKIP', 1)
    expect(result.created).toBe(1)
    expect(products.findBySku(db, 'sar-1')?.low_stock_threshold).toBe(4)
  })

  it('CSV update without low_stock_level never overwrites the existing threshold', () => {
    const p = products.createProduct(db, { ...base, low_stock_threshold: 7 }, 1)
    const result = importCsv(db, 'product_name,sku,selling_price,stock\nCoke Mismo,cm-1,22,30\n', 'UPDATE', 1)
    expect(result.updated).toBe(1)
    expect(products.getProduct(db, p.id).low_stock_threshold).toBe(7)
  })

  it('backend still rejects a negative threshold', () => {
    expect(() => products.createProduct(db, { ...base, low_stock_threshold: -1 }, 1)).toThrow('Low stock threshold cannot be negative.')
  })
})

describe('v1.0.8 shift numbering', () => {
  it('assigns sequential shift numbers per cashier', () => {
    const a1 = shifts.openShift(db, 1, 1000)
    const b1 = shifts.openShift(db, 2, 1000) // different cashier, own sequence
    shifts.closeShift(db, a1.id, { actual_cash_c: 1000 })
    const a2 = shifts.openShift(db, 1, 1000)
    shifts.closeShift(db, a2.id, { actual_cash_c: 1000 })
    shifts.closeShift(db, b1.id, { actual_cash_c: 1000 })
    const a3 = shifts.openShift(db, 1, 1000)
    expect(a1.shift_no).toBe(1)
    expect(a2.shift_no).toBe(2)
    expect(a3.shift_no).toBe(3)
    expect(b1.shift_no).toBe(1)
  })

  it('numbering stays sequential after closing shifts and reopening later', () => {
    const a1 = shifts.openShift(db, 1, 1000)
    shifts.closeShift(db, a1.id, { actual_cash_c: 1000 })
    const a2 = shifts.openShift(db, 1, 1000)
    expect(a2.shift_no).toBe(2)
    const s = shifts.currentShiftFor(db, 1)
    expect(s?.shift_no).toBe(2)
    expect(s?.status).toBe('OPENED')
  })

  it('reports surface the per-user shift number', async () => {
    const { calculateRead } = await import('../../services/readReports')
    shifts.openShift(db, 1, 500000)
    const shift = shifts.currentShiftFor(db, 1)!
    const report = calculateRead(db, shift.id, 'X')
    expect(report.shift_no).toBe(1)
    expect(report.shift_id).toBe(shift.id)
  })
})

describe('v1.0.8 withdrawal (taken / damaged / expired / forward)', () => {
  const seeded = () => {
    const p = products.createProduct(db, { ...base, name: 'Coke Mismo', sku: 'CM-2', low_stock_threshold: 5, units: [{ name: 'bottle', conversion_to_base: 1, barcode: null, selling_price_c: 2000, is_default: true }] }, 1)
    products.adjustStock(db, p.id, 24, 'PURCHASE', 'Restock: 1 case', 1, undefined, { source: 'RESTOCK', received_unit: 'bottle', received_quantity: 24 })
    return products.getProduct(db, p.id)
  }

  it('records a WITHDRAWAL movement and reduces stock but never touches finances', () => {
    const p = seeded()
    products.adjustStock(db, p.id, -6, 'WITHDRAWAL', 'Withdrawal: TAKEN | 6 bottle x 1 = 6 bottle | tos-i', 1)
    const after = products.getProduct(db, p.id)
    expect(after.stock).toBe(18)
    const move = db.prepare(`SELECT * FROM inventory_movements WHERE movement_type='WITHDRAWAL' ORDER BY id DESC LIMIT 1`).get() as { quantity_change: number; reason: string }
    expect(move.quantity_change).toBe(-6)
    expect(move.reason).toContain('TAKEN')
    expect(move.reason).toContain('tos-i')
    // Financial isolation: a withdrawal writes stock + a movement, nothing else.
    expect((db.prepare('SELECT COUNT(*) c FROM sales').get() as { c: number }).c).toBe(0)
    expect((db.prepare('SELECT COUNT(*) c FROM payments').get() as { c: number }).c).toBe(0)
    expect((db.prepare('SELECT COUNT(*) c FROM cash_movements').get() as { c: number }).c).toBe(0)
    expect((db.prepare('SELECT COUNT(*) c FROM expenses').get() as { c: number }).c).toBe(0)
    const shift = shifts.openShift(db, 1, 1000)
    expect(shift.cash_sales_c).toBe(0)
  })

  it('rejects a withdrawal larger than available stock', () => {
    const p = seeded()
    expect(() => products.adjustStock(db, p.id, -999, 'WITHDRAWAL', 'Withdrawal: DAMAGED', 1)).toThrow('Insufficient stock')
    expect(products.getProduct(db, p.id).stock).toBe(24)
  })

  it('any withdrawable reason (TAKEN/DAMAGED/EXPIRED/FORWARD) is a plain stock movement', () => {
    const p = seeded()
    for (const reason of ['TAKEN', 'DAMAGED', 'EXPIRED', 'FORWARD']) {
      products.adjustStock(db, p.id, -1, 'WITHDRAWAL', `Withdrawal: ${reason}`, 1)
    }
    expect(products.getProduct(db, p.id).stock).toBe(20)
    const types = (db.prepare(`SELECT DISTINCT movement_type FROM inventory_movements WHERE reason LIKE 'Withdrawal:%'`).all() as { movement_type: string }[]).map((r) => r.movement_type)
    expect(types).toEqual(['WITHDRAWAL'])
  })
})