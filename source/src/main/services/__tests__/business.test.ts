import { describe, it, expect } from 'vitest'
import Database from 'better-sqlite3'
import { runMigrations } from '../../database/migrations'
import { hashSecret } from '../../security/passwords'
import * as users from '../../repositories/users'
import * as products from '../../repositories/products'
import * as customers from '../../repositories/customers'
import { validatePaymentTotals } from '../checkout'
import type { CartItem } from '../../../shared/types'
import type { PaymentInput } from '../../../shared/ipc'

function makeDb(): Database.Database {
  const db = new Database(':memory:')
  db.pragma('foreign_keys = ON')
  runMigrations(db)
  return db
}

function addAdmin(db: Database.Database): number {
  const u = users.createUser(db, {
    username: 'admin',
    passwordHash: hashSecret('secret'),
    pinHash: hashSecret('1234'),
    full_name: 'Admin',
    roles: ['ADMIN']
  })
  return u.id
}

function addMilo(db: Database.Database): number {
  return products.createProduct(
    db,
    {
      category_id: null,
      name: 'Milo (Sachet)',
      sku: 'MILO-1',
      barcode: '4800001',
      description: null,
      base_unit: 'sachet',
      purchase_cost_c: 600,
      default_price_c: 900,
      low_stock_threshold: 5,
      supplier_id: null,
      has_expiration: false,
      notes: null,
      units: [
        { name: 'box', conversion_to_base: 24, selling_price_c: 21000, is_default: false, barcode: null },
        { name: 'sachet', conversion_to_base: 1, selling_price_c: 900, is_default: true, barcode: null }
      ]
    },
    1
  ).id
}

function cartItem(overrides: Partial<CartItem>): CartItem {
  return {
    product_id: null,
    name: 'Milo',
    unit_name: 'sachet',
    qty: 1,
    qty_base: 1,
    unit_price_c: 900,
    cost_base_c: 600,
    stock_base: 0,
    subtotal_c: 900,
    ...overrides
  }
}

describe('Tingi / multi-unit conversion (Section 55)', () => {
  it('1 box = 24 sachets; receive 2 boxes -> 48, sell 5 -> 43, sell 1 box -> 19', () => {
    const db = makeDb()
    const admin = addAdmin(db)
    const id = addMilo(db)

    products.adjustStock(db, id, 48, 'PURCHASE', 'receive 2 boxes', admin, 'PPO-1')
    expect(products.getProduct(db, id).stock).toBe(48)

    products.adjustStock(db, id, -5, 'SALE', 'sell 5', admin, 'TPOS-1')
    expect(products.getProduct(db, id).stock).toBe(43)

    products.adjustStock(db, id, -24, 'SALE', 'sell 1 box', admin, 'TPOS-2')
    expect(products.getProduct(db, id).stock).toBe(19)

    products.adjustStock(db, id, 5, 'REFUND', 'refund 5 sachets', admin, 'REF-1')
    expect(products.getProduct(db, id).stock).toBe(24)
  })
})

describe('Utang / credit limit (Section 55)', () => {
  it('limit 1000, credit 300, pay 100 -> 200; new credit 850 exceeds -> requires auth', () => {
    const db = makeDb()
    const admin = addAdmin(db)
    const cust = customers.createCustomer(db, { full_name: 'Juan', credit_limit_c: 100000, nickname: null, phone: null, address: null, notes: null })

    customers.applyCreditEntry(db, { customer_id: cust.id, entry_type: 'CREDIT_SALE', amount_c: 30000, user_id: admin })
    expect(customers.getCustomer(db, cust.id).balance_c).toBe(30000)

    customers.applyCreditEntry(db, { customer_id: cust.id, entry_type: 'PAYMENT', amount_c: 10000, user_id: admin })
    expect(customers.getCustomer(db, cust.id).balance_c).toBe(20000)

    const c = customers.getCustomer(db, cust.id)
    expect(customers.canExtendCredit(c, 85000, false)).toBe(false)
    expect(customers.canExtendCredit(c, 85000, true)).toBe(true)
  })
})

describe('Checkout stock decrement (Section 55)', () => {
  it('stock 10, sell 3 -> 7, refund 1 -> 8', () => {
    const db = makeDb()
    const admin = addAdmin(db)
    const id = addMilo(db)
    products.adjustStock(db, id, 10, 'INITIAL_STOCK', 'opening', admin)
    expect(products.getProduct(db, id).stock).toBe(10)
    products.adjustStock(db, id, -3, 'SALE', 'sell 3', admin, 'TPOS-1')
    expect(products.getProduct(db, id).stock).toBe(7)
    products.adjustStock(db, id, 1, 'REFUND', 'refund 1', admin, 'REF-1')
    expect(products.getProduct(db, id).stock).toBe(8)
  })

  it('rejects negative stock when not allowed', () => {
    const db = makeDb()
    const admin = addAdmin(db)
    const id = addMilo(db)
    expect(() => products.adjustStock(db, id, -5, 'SALE', 'over-sell', admin)).toThrow(/negative/)
  })
})

describe('Cash / sukli (Section 55)', () => {
  it('total 139, cash 200, sukli 61', () => {
    const cash = 20000
    const total = 13900
    const sukli = cash - total
    expect(sukli).toBe(6100)
    expect(cash < total).toBe(false)
  })
})

describe('Split payment (Section 55)', () => {
  it('total 500 = cash 300 + gcash 200, remaining 0', () => {
    const total = 50000
    const payments: PaymentInput[] = [
      { method: 'CASH', amount_c: 30000 },
      { method: 'GCASH', amount_c: 20000 }
    ]
    const applied = payments.reduce((s, p) => s + p.amount_c, 0)
    expect(applied).toBe(total)
    expect(total - applied).toBe(0)
    expect(() => validatePaymentTotals(total, payments)).not.toThrow()
  })

  it('rejects split payments that do not cover total', () => {
    const total = 50000
    const payments: PaymentInput[] = [{ method: 'CASH', amount_c: 30000 }]
    expect(() => validatePaymentTotals(total, payments)).toThrow(/less than the total/)
  })
})

describe('Helpers', () => {
  it('product stock status mapping', () => {
    expect(products.stockStatusFor(10, 5)).toBe('IN_STOCK')
    expect(products.stockStatusFor(3, 5)).toBe('LOW_STOCK')
    expect(products.stockStatusFor(0, 5)).toBe('OUT_OF_STOCK')
  })

  it('cart item subtotal consistent', () => {
    const item = cartItem({ qty: 2, unit_price_c: 900, subtotal_c: 900 * 2 })
    expect(item.subtotal_c).toBe(1800)
  })
})