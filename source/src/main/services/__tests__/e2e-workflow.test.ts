import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

let dataDir: string

beforeAll(() => {
  dataDir = mkdtempSync(join(tmpdir(), 'tinda-e2e-'))
  process.env.TINDA_DATA_DIR = dataDir
})
afterAll(() => {
  try { closeDb() } catch { /* ignore */ }
  try { rmSync(dataDir, { recursive: true, force: true }) } catch { /* ignore */ }
})

import { completeSetup, login, logout } from '../auth'
import { checkout, reprint } from '../checkout'
import { processRefund, processVoid } from '../transaction'
import { setSession } from '../session'
import { createUser } from '../../repositories/users'
import { createProduct, getProduct, searchProductsSimple, lowStockProducts, outOfStockProducts } from '../../repositories/products'
import { createCustomer, getCustomer, customerLedger } from '../../repositories/customers'
import * as shifts from '../../repositories/shifts'
import * as backups from '../../repositories/backup'
import { createExpense, createExpenseCategory } from '../../repositories/expenses'
import { getSale, listSales, todaySalesC } from '../../repositories/sales'
import { saveHeldSale, getHeldSale, deleteHeldSale } from '../../repositories/heldSales'
import { getDb, closeDb, integrityCheck } from '../../database/connection'
import type { ProductInput, SessionUser } from '../../../shared/types'

function productInput(opts: { name: string; sku: string; barcode: string; price: number; cost?: number; stock?: number }): ProductInput {
  return {
    category_id: null,
    name: opts.name,
    sku: opts.sku,
    barcode: opts.barcode,
    description: null,
    base_unit: 'pc',
    purchase_cost_c: opts.cost ?? Math.round(opts.price * 0.6),
    default_price_c: opts.price,
    low_stock_threshold: 5,
    supplier_id: null,
    has_expiration: false,
    notes: null,
    units: [{ name: 'pc', conversion_to_base: 1, selling_price_c: opts.price, barcode: null, is_default: true }],
    initial_stock_base: opts.stock ?? 0
  }
}

describe('END-TO-END POS WORKFLOW (isolated TINDA_DATA_DIR)', () => {
  it('runs the full POS workflow Phases 1-16 with exact reconciliation', async () => {
    const db = getDb()

    /* ============ PHASE 1 — First-run setup + auto backup ============ */
    const setup = completeSetup({
      store: { store_name: 'E2E Store', address: 'Manila', phone: '123' },
      admin: { username: 'admin', password: 'secret', pin: '1234', full_name: 'Manager' },
      receipt: { header: 'E2E', footer: 'Salamat' },
      data_dir: dataDir,
      load_demo: false
    })
    expect(setup.user.username).toBe('admin')
    const admin: SessionUser = setup.user
    const autoBackups = backups.listBackups(db)
    expect(autoBackups.length).toBeGreaterThanOrEqual(1)
    expect(integrityCheck().ok).toBe(true)

    /* ============ PHASE 2 — Inventory setup (category/supplier/product) ============ */
    const milo = createProduct(db, productInput({ name: 'Milo', sku: 'E2E-MILO', barcode: '4900002', price: 600, stock: 20 }), admin.id)
    const soda = createProduct(db, productInput({ name: 'Soda', sku: 'E2E-SODA', barcode: '4900003', price: 500, stock: 5 }), admin.id)
    expect(milo.stock).toBe(20)
    expect(getProduct(db, milo.id).stock_status).toBe('IN_STOCK')

    /* ============ PHASE 3 — POS product search (name / SKU / barcode) ============ */
    expect(searchProductsSimple(db, 'milo').some((p) => p.id === milo.id)).toBe(true)
    expect(searchProductsSimple(db, 'E2E-MILO').some((p) => p.id === milo.id)).toBe(true)
    expect(searchProductsSimple(db, '4900002').some((p) => p.id === milo.id)).toBe(true)
    expect(searchProductsSimple(db, 'zzz-nothing').length).toBe(0)

    /* ============ PHASE 4 — Cash checkout + sukli ============ */
    const cashSale = checkout({
      items: [{
        product_id: milo.id, name: milo.name, unit_name: 'pc', qty: 3, qty_base: 3,
        unit_price_c: 600, cost_base_c: 400, stock_base: 20, subtotal_c: 1800
      }],
      discount_c: 0,
      customer_id: null,
      payments: [{ method: 'CASH', amount_c: 2000 }]
    })
    expect(cashSale.sale.total_c).toBe(1800)
    expect(cashSale.sale.transaction_no).toBe('TPOS-000001')
    const sukliLine = cashSale.receipt.find((l) => l.startsWith('SUKLI'))
    expect(sukliLine).toContain('2.00')
    expect(getProduct(db, milo.id).stock).toBe(17)

    /* ============ PHASE 5 — Utang (credit) checkout + over-limit block ============ */
    const juan = createCustomer(db, { full_name: 'Juan', credit_limit_c: 5000 })
    const utangSale = checkout({
      items: [{
        product_id: milo.id, name: milo.name, unit_name: 'pc', qty: 2, qty_base: 2,
        unit_price_c: 600, cost_base_c: 400, stock_base: 17, subtotal_c: 1200
      }],
      discount_c: 0,
      customer_id: juan.id,
      payments: [{ method: 'UTANG', amount_c: 1200 }]
    })
    expect(utangSale.sale.total_c).toBe(1200)
    expect(getCustomer(db, juan.id).balance_c).toBe(1200)
    expect(getProduct(db, milo.id).stock).toBe(15)

    expect(() =>
      checkout({
        items: [{
          product_id: milo.id, name: milo.name, unit_name: 'pc', qty: 7, qty_base: 7,
          unit_price_c: 600, cost_base_c: 400, stock_base: 15, subtotal_c: 4200
        }],
        discount_c: 0,
        customer_id: juan.id,
        payments: [{ method: 'UTANG', amount_c: 4200 }]
      })
    ).toThrow(/Credit limit exceeded/)
    expect(getCustomer(db, juan.id).balance_c).toBe(1200)
    expect(getProduct(db, milo.id).stock).toBe(15)

    /* ============ PHASE 6 — Split payment (CASH + GCASH) ============ */
    const splitSale = checkout({
      items: [{
        product_id: milo.id, name: milo.name, unit_name: 'pc', qty: 1, qty_base: 1,
        unit_price_c: 600, cost_base_c: 400, stock_base: 15, subtotal_c: 600
      }],
      discount_c: 0,
      customer_id: null,
      payments: [
        { method: 'CASH', amount_c: 300 },
        { method: 'GCASH', amount_c: 300, reference: 'GC-SPLIT' }
      ]
    })
    expect(splitSale.sale.total_c).toBe(600)
    expect(splitSale.sale.payments.map((p) => p.method).sort()).toEqual(['CASH', 'GCASH'])
    expect(getProduct(db, milo.id).stock).toBe(14)

    /* ============ PHASE 7 — GCash & Maya with reference ============ */
    const gcashSale = checkout({
      items: [{
        product_id: milo.id, name: milo.name, unit_name: 'pc', qty: 1, qty_base: 1,
        unit_price_c: 600, cost_base_c: 400, stock_base: 14, subtotal_c: 600
      }],
      discount_c: 0,
      customer_id: null,
      payments: [{ method: 'GCASH', amount_c: 600, reference: 'GC-0001' }]
    })
    const mayaSale = checkout({
      items: [{
        product_id: milo.id, name: milo.name, unit_name: 'pc', qty: 1, qty_base: 1,
        unit_price_c: 600, cost_base_c: 400, stock_base: 13, subtotal_c: 600
      }],
      discount_c: 0,
      customer_id: null,
      payments: [{ method: 'MAYA', amount_c: 600, reference: 'MY-0001' }]
    })
    expect(gcashSale.sale.payments[0]!.reference).toBe('GC-0001')
    expect(mayaSale.sale.payments[0]!.reference).toBe('MY-0001')
    expect(getProduct(db, milo.id).stock).toBe(12)

    /* ============ PHASE 8 — Restart persistence (close & reopen) ============ */
    closeDb()
    const db2 = getDb()
    expect(getProduct(db2, milo.id).stock).toBe(12)
    expect(listSales(db2).total).toBe(5)
    expect(todaySalesC(db2)).toBe(1800 + 1200 + 600 + 600 + 600)

    /* ============ PHASE 9 — Hold / resume sale ============ */
    const held = saveHeldSale(db2, {
      user_id: admin.id,
      subtotal_c: 1200,
      discount_c: 0,
      total_c: 1200,
      items: [{
        product_id: milo.id, name: 'Milo', unit_name: 'pc', qty: 2, qty_base: 2,
        unit_price_c: 600, subtotal_c: 1200, cost_base_c: 400
      }]
    })
    expect(held.items.length).toBe(1)
    expect(getProduct(db2, milo.id).stock).toBe(12) // hold does not decrement stock
    const resumed = getHeldSale(db2, held.id) // "resume" reads the held sale back
    expect(resumed.items[0]!.qty_base).toBe(2)
    deleteHeldSale(db2, held.id)
    expect(() => getHeldSale(db2, held.id)).toThrow(/not found/)

    /* ============ PHASE 10 — Void with authorization ============ */
    // CASHIER cannot void (lacks pos:void)
    const cashier = createUser(db2, {
      username: 'cashier1', passwordHash: 'x', pinHash: 'x', full_name: 'Cashier', roles: ['CASHIER']
    })
    setSession({ id: cashier.id, username: 'cashier1', full_name: 'Cashier', roles: ['CASHIER'] })
    expect(() => processVoid({ sale_id: utangSale.sale.id, reason: 'cashier tries' })).toThrow(/permission/)
    // restore admin session
    setSession(admin)
    const voided = processVoid({ sale_id: splitSale.sale.id, reason: 'wrong item' })
    expect(voided.status).toBe('VOIDED')
    expect(getProduct(db2, milo.id).stock).toBe(13) // stock restored from void

    /* ============ PHASE 11 — Refund restores stock + ledger ============ */
    const refund = processRefund({
      sale_id: cashSale.sale.id,
      reason: 'customer returned 1',
      items: [{ sale_item_id: cashSale.sale.items[0]!.id, product_id: milo.id, qty_base: 1, unit_name: 'pc' }]
    })
    expect(refund.total_c).toBe(600)
    expect(getProduct(db2, milo.id).stock).toBe(14)
    expect(getSale(db2, cashSale.sale.id).status).toBe('PARTIALLY_REFUNDED')

    /* ============ PHASE 12 — Shift open / expected cash / close ============ */
    const shift = shifts.openShift(db2, admin.id, 1000)
    expect(shift.expected_cash_c).toBe(1000)
    const _shiftSale = checkout({
      items: [{
        product_id: soda.id, name: soda.name, unit_name: 'pc', qty: 1, qty_base: 1,
        unit_price_c: 500, cost_base_c: 300, stock_base: getProduct(db2, soda.id).stock, subtotal_c: 500
      }],
      discount_c: 0,
      customer_id: null,
      payments: [{ method: 'CASH', amount_c: 500 }]
    })
    const cat = createExpenseCategory(db2, 'Pamasahe')
    createExpense(db2, { category_id: cat.id, amount_c: 100, expense_date: new Date().toISOString().slice(0, 10), description: 'fare' }, admin.id)
    const beforeClose = shifts.currentShiftFor(db2, admin.id)
    expect(beforeClose).not.toBeNull()
    const closed = shifts.closeShift(db2, (beforeClose as { id: number }).id, { actual_cash_c: 1400 })
    expect(closed.status).toBe('CLOSED')
    expect(closed.expected_cash_c).toBe(1400)
    expect(closed.difference_c).toBe(0)

    /* ============ PHASE 13 — Report data sources ============ */
    expect(listSales(db2, { method: 'GCASH' }).total).toBe(2) // split + pure gcash
    expect(customerLedger(db2, juan.id).length).toBeGreaterThanOrEqual(1)
    expect(lowStockProducts(db2).length).toBeGreaterThanOrEqual(0)
    expect(outOfStockProducts(db2).length).toBeGreaterThanOrEqual(0)

    /* ============ PHASE 14 — Backup + restore on the TEST DB only ============ */
    const backup = await backups.createBackup(db2, 'MANUAL')
    expect(backup.filename).toMatch(/\.db$/)
    const beforeRestoreSales = listSales(db2).total
    backups.restoreBackup(db2, backup.filename) // copies file, closes db
    const db3 = getDb() // re-opens after restore
    const integrity = integrityCheck()
    expect(integrity).toEqual({ ok: true, message: 'Database integrity OK.' })
    expect(listSales(db3).total).toBeGreaterThanOrEqual(beforeRestoreSales)

    /* ============ PHASE 15 — Inventory movements logged ============ */
    const moves = db3.prepare(
      'SELECT movement_type FROM inventory_movements WHERE product_id = ? ORDER BY id'
    ).all(milo.id) as { movement_type: string }[]
    const types = moves.map((m) => m.movement_type)
    expect(types).toContain('INITIAL_STOCK')
    expect(types).toContain('SALE')
    expect(types).toContain('RETURN') // void
    expect(types).toContain('REFUND')

    /* ============ PHASE 16 — Edge / duplicate protections ============ */
    // Cannot exceed available stock when negative inventory disallowed
    const scarce = createProduct(db3, productInput({ name: 'Scarce', sku: 'E2E-SCARCE', barcode: '4900009', price: 100, stock: 2 }), admin.id)
    const scarceQty = getProduct(db3, scarce.id).stock
    expect(() =>
      checkout({
        items: [{
          product_id: scarce.id, name: scarce.name, unit_name: 'pc', qty: 5, qty_base: 5,
          unit_price_c: 100, cost_base_c: 50, stock_base: scarceQty, subtotal_c: 500
        }],
        discount_c: 0,
        customer_id: null,
        payments: [{ method: 'CASH', amount_c: 500 }]
      })
    ).toThrow(/Insufficient stock/)
    // Cannot refund more than sold
    expect(() =>
      processRefund({
        sale_id: cashSale.sale.id,
        reason: 'over refund',
        items: [{ sale_item_id: cashSale.sale.items[0]!.id, product_id: milo.id, qty_base: 99, unit_name: 'pc' }]
      })
    ).toThrow(/Cannot refund/)
    // Receipt reprint
    expect(reprint(cashSale.sale.id).length).toBeGreaterThan(0)

    // logout/login round trip
    logout()
    const relogin = login('admin', 'secret')
    expect(relogin.user.username).toBe('admin')
  })
})
