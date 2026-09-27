import Database from 'better-sqlite3'
import { beforeEach, describe, expect, it } from 'vitest'
import { migrations, runMigrations } from '../migrations'
import * as products from '../../repositories/products'
import * as categories from '../../repositories/categories'
import * as suppliers from '../../repositories/suppliers'
import * as shifts from '../../repositories/shifts'
import * as cashCounts from '../../repositories/cashCounts'
import * as customers from '../../repositories/customers'
import * as expenses from '../../repositories/expenses'
import * as settings from '../../repositories/settings'

const COUNT = (db: Database.Database, sql: string) => (db.prepare(sql).get() as { c: number }).c

function insertLegacyShift(db: Database.Database, userId: number, startingCashC = 100000, status = 'OPENED'): number {
  // Simulates a shift opened by a pre-v1.0.8 app: the shift_no COLUMN does not
  // exist yet, so openShift() (current code, queries shift_no) must NOT be used.
  const info = db.prepare('INSERT INTO shifts(user_id,starting_cash_c,expected_cash_c,status) VALUES(?,?,?,?)').run(userId, startingCashC, startingCashC, status)
  return Number(info.lastInsertRowid)
}

// Builds a realistic v1.0.6/v1.0.7 store database (schema through migration 4,
// the cash_counts migration) using the same repository calls the app uses.
function seedStore(db: Database.Database): { shiftId: number; productId: number; customerId: number; expenseId: number } {
  db.prepare("INSERT INTO users(username,password_hash,pin_hash,full_name) VALUES('ana','x','x','Ana')").run()
  db.prepare("INSERT INTO users(username,password_hash,pin_hash,full_name) VALUES('beth','x','x','Beth')").run()
  settings.updateSettings(db, { store_name: 'E2E Store', default_low_stock: 8 })

  const cat = categories.createCategory(db, 'Drinks')
  const supplier = suppliers.createSupplier(db, { name: 'Wholesale Co.', contact_person: null, phone: null, address: null, notes: null })
  const p = products.createProduct(db, {
    category_id: cat.id, name: 'Coke Mismo', sku: 'CM-1', barcode: '480000000001', description: 'Cold drink',
    base_unit: 'bottle', purchase_cost_c: 1500, default_price_c: 2000, low_stock_threshold: 5,
    supplier_id: supplier.id, has_expiration: false, notes: 'suki',
    units: [{ name: 'bottle', conversion_to_base: 1, barcode: null, selling_price_c: 2000, is_default: true }],
    initial_stock_base: 10
  }, 1)
  products.adjustStock(db, p.id, 24, 'PURCHASE', 'Restock: 1 case', 1, undefined, { source: 'RESTOCK', received_unit: 'bottle', received_quantity: 24 })

  const cust = customers.createCustomer(db, { full_name: 'Juan', nickname: 'J', phone: '0917', address: 'Cebu', notes: null, credit_limit_c: 900000 })
  customers.applyCreditEntry(db, { customer_id: cust.id, entry_type: 'CREDIT_SALE', amount_c: 30000, user_id: 1 })
  customers.applyCreditEntry(db, { customer_id: cust.id, entry_type: 'PAYMENT', amount_c: 5000, user_id: 1 })

  const expenseId = expenses.createExpense(db, { category_id: 1, amount_c: 12000, expense_date: '2026-09-01', description: 'Kuryente', reference: 'MECO', notes: null }, 1).id

  const shiftId = insertLegacyShift(db, 2, 500000)
  // A real completed cash sale inside that legacy shift (schema unchanged by v1.0.8).
  db.prepare("INSERT INTO sales(transaction_no,user_id,customer_id,subtotal_c,discount_c,total_c,shift_id) VALUES('TPOS-000001',2,?,1800,0,1800,?)").run(cust.id, shiftId)
  const saleId = (db.prepare('SELECT id FROM sales WHERE transaction_no=?').get('TPOS-000001') as { id: number }).id
  db.prepare("INSERT INTO sale_items(sale_id,product_id,product_name,unit_name,qty,qty_base,unit_price_c,subtotal_c,cost_base_c) VALUES(?,?,?,?,3,3,600,1800,450)").run(saleId, p.id, p.name, 'pc')
  db.prepare("INSERT INTO payments(sale_id,method,amount_c) VALUES(?,?,?)").run(saleId, 'CASH', 2000)
  shifts.updateShiftTotals(db, shiftId)
  cashCounts.save(db, 2, { shift_id: shiftId, quantities: [4, 1, 2, 0, 1, 1, 0, 1, 0, 0, 0], notes: 'cash count' })

  return { shiftId, productId: p.id, customerId: cust.id, expenseId }
}

let db: Database.Database

beforeEach(() => {
  db = new Database(':memory:'); db.pragma('foreign_keys=ON')
  db.exec('CREATE TABLE app_migrations (version INTEGER PRIMARY KEY, name TEXT NOT NULL, applied_at TEXT NOT NULL DEFAULT (datetime(\'now\',\'localtime\')))')
  for (const migration of migrations.filter((m) => m.version < 5)) {
    db.exec(migration.sql)
    db.prepare('INSERT INTO app_migrations(version,name) VALUES(?,?)').run(migration.version, migration.name)
  }
})

describe('v1.0.8 DB upgrade chain (v1.0.6 -> v1.0.7 -> v1.0.8)', () => {
  it('a v1.0.6/v1.0.7 database (schema v4) upgrades to v1.0.8, preserves every dataset, and stays idempotent', () => {
    const seeded = seedStore(db)
    // Pre-boot: this is exactly the v1.0.6 and v1.0.7 schema level (migration 4
    // max) — v1.0.6 introduced cash_counts and v1.0.7 added nothing.
    expect(COUNT(db, 'SELECT COUNT(*) c FROM app_migrations')).toBe(4)
    expect(db.pragma('integrity_check', { simple: true })).toBe('ok')

    const before = {
      products: COUNT(db, 'SELECT COUNT(*) c FROM products'),
      units: COUNT(db, 'SELECT COUNT(*) c FROM product_units'),
      movements: COUNT(db, 'SELECT COUNT(*) c FROM inventory_movements'),
      customers: COUNT(db, 'SELECT COUNT(*) c FROM customers'),
      ledger: COUNT(db, 'SELECT COUNT(*) c FROM credit_ledger'),
      shifts: COUNT(db, 'SELECT COUNT(*) c FROM shifts'),
      sales: COUNT(db, 'SELECT COUNT(*) c FROM sales'),
      saleItems: COUNT(db, 'SELECT COUNT(*) c FROM sale_items'),
      payments: COUNT(db, 'SELECT COUNT(*) c FROM payments'),
      cashCounts: COUNT(db, 'SELECT COUNT(*) c FROM cash_counts'),
      expenses: COUNT(db, 'SELECT COUNT(*) c FROM expenses'),
      settings: COUNT(db, 'SELECT COUNT(*) c FROM settings')
    }

    // Current app boot applies shift numbering, the additive expiration schema, product srp, and price references.
    runMigrations(db)
    expect(db.pragma('integrity_check', { simple: true })).toBe('ok')
    expect(COUNT(db, 'SELECT COUNT(*) c FROM app_migrations')).toBe(8)

    // A re-boot of the same build is a safe no-op (idempotent migration engine).
    runMigrations(db)
    expect(COUNT(db, 'SELECT COUNT(*) c FROM app_migrations')).toBe(8)
    expect(db.pragma('integrity_check', { simple: true })).toBe('ok')

    // No data lost, added, or altered in ANY other table.
    expect({
      products: COUNT(db, 'SELECT COUNT(*) c FROM products'),
      units: COUNT(db, 'SELECT COUNT(*) c FROM product_units'),
      movements: COUNT(db, 'SELECT COUNT(*) c FROM inventory_movements'),
      customers: COUNT(db, 'SELECT COUNT(*) c FROM customers'),
      ledger: COUNT(db, 'SELECT COUNT(*) c FROM credit_ledger'),
      shifts: COUNT(db, 'SELECT COUNT(*) c FROM shifts'),
      sales: COUNT(db, 'SELECT COUNT(*) c FROM sales'),
      saleItems: COUNT(db, 'SELECT COUNT(*) c FROM sale_items'),
      payments: COUNT(db, 'SELECT COUNT(*) c FROM payments'),
      cashCounts: COUNT(db, 'SELECT COUNT(*) c FROM cash_counts'),
      expenses: COUNT(db, 'SELECT COUNT(*) c FROM expenses'),
      settings: COUNT(db, 'SELECT COUNT(*) c FROM settings')
    }).toEqual(before)

    // Spot-check values survive.
    const product = products.getProduct(db, seeded.productId)
    expect(product.stock).toBe(34) // 10 initial + 24 restock
    expect(product.low_stock_threshold).toBe(5)
    expect(product.units.map((u) => u.name)).toEqual(['bottle'])
    expect(customers.getCustomer(db, seeded.customerId).balance_c).toBe(25000) // 30000 - 5000
    expect(settings.getSettings(db).default_low_stock).toBe(8)
    expect(expenses.getExpense(db, seeded.expenseId).amount_c).toBe(12000)
    expect(cashCounts.list(db).length).toBe(1)
    const shift = shifts.getShift(db, seeded.shiftId)
    expect(shift.shift_no).toBe(1)
    expect(shift.cash_sales_c).toBe(1800)
  })

  it('legacy shifts are numbered in open order and the next shift continues the sequence', () => {
    db.prepare("INSERT INTO users(username,password_hash,pin_hash,full_name) VALUES('ana','x','x','Ana')").run()
    db.prepare("INSERT INTO users(username,password_hash,pin_hash,full_name) VALUES('beth','x','x','Beth')").run()
    // Two cashiers with a realistic v1.0.7 history: closed shifts plus the
    // current OPENED shift (one open per cashier, as the app enforces).
    const s1 = insertLegacyShift(db, 1, 100000, 'CLOSED')
    const s2 = insertLegacyShift(db, 2, 100000, 'CLOSED')
    const s3 = insertLegacyShift(db, 1, 100000, 'OPENED')
    const s4 = insertLegacyShift(db, 2, 100000, 'OPENED')

    runMigrations(db)

    const numbered = (id: number) => (db.prepare('SELECT shift_no FROM shifts WHERE id=?').get(id) as { shift_no: number }).shift_no
    expect(numbered(s1)).toBe(1)
    expect(numbered(s3)).toBe(2)
    expect(numbered(s2)).toBe(1)
    expect(numbered(s4)).toBe(2)

    // The v1.0.8 app continues the sequence after today's shift is closed.
    shifts.closeShift(db, s3, { actual_cash_c: 100000, closing_note: 'end day' })
    shifts.closeShift(db, s4, { actual_cash_c: 100000, closing_note: 'end day' })
    const next = shifts.openShift(db, 1, 100000)
    expect(next.shift_no).toBe(3)
    const beth = shifts.openShift(db, 2, 100000)
    expect(beth.shift_no).toBe(3)
    expect(db.pragma('integrity_check', { simple: true })).toBe('ok')
  })
})
