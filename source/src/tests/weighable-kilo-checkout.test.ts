import { describe, it, expect } from 'vitest'
import Database from 'better-sqlite3'
import { runMigrations } from '../main/database/migrations'
import { hashSecret } from '../main/security/passwords'
import * as users from '../main/repositories/users'
import * as products from '../main/repositories/products'
import * as customers from '../main/repositories/customers'
import * as sales from '../main/repositories/sales'
import { validateCheckout } from '../main/validation/schemas'
import { isWeighableUnit } from '../shared/format'

function makeDb(): Database.Database {
  const db = new Database(':memory:')
  db.pragma('foreign_keys = ON')
  runMigrations(db)
  return db
}

describe('Weighable Kilo & Decimal Quantity Checkout', () => {
  it('identifies weighable units correctly', () => {
    expect(isWeighableUnit('kilo')).toBe(true)
    expect(isWeighableUnit('kg')).toBe(true)
    expect(isWeighableUnit('KLS')).toBe(true)
    expect(isWeighableUnit('g')).toBe(true)
    expect(isWeighableUnit('liter')).toBe(true)
    expect(isWeighableUnit('pc')).toBe(false)
    expect(isWeighableUnit('can')).toBe(false)
    expect(isWeighableUnit('bottle')).toBe(false)
  })

  it('allows adjustStock with fractional / decimal weights', () => {
    const db = makeDb()
    const u = users.createUser(db, {
      username: 'cashier1',
      passwordHash: hashSecret('secret'),
      pinHash: hashSecret('1234'),
      full_name: 'Cashier One',
      roles: ['CASHIER']
    })

    // Create a weighable test product with initial stock 10.5 kg
    const prod = products.createProduct(
      db,
      {
        name: 'Fresh Pork Liempo',
        sku: 'LIEMPO-01',
        barcode: null,
        description: null,
        category_id: null,
        low_stock_threshold: 5,
        base_unit: 'kilo',
        initial_stock_base: 10.5,
        purchase_cost_c: 18000,
        default_price_c: 24000,
        units: [{ name: 'kilo', conversion_to_base: 1, selling_price_c: 24000 }]
      },
      u.id
    )

    expect(prod.stock).toBe(10.5)

    // Sell 2.25 kilos
    products.adjustStock(db, prod.id, -2.25, 'SALE', 'Test Sale 2.25kg', u.id, 'TXN-KILO-001')
    const updated = products.getProduct(db, prod.id)
    expect(updated.stock).toBe(8.25)

    // Restock 1.5 kilos
    products.adjustStock(db, prod.id, 1.5, 'PURCHASE', 'Test Restock 1.5kg', u.id, 'TXN-KILO-002')
    const restocked = products.getProduct(db, prod.id)
    expect(restocked.stock).toBe(9.75)
  })

  it('validates checkout payload with decimal / fractional quantities', () => {
    const validDecimalPayload = {
      items: [
        {
          product_id: 1,
          name: 'Fresh Pork Liempo',
          unit_name: 'kilo',
          qty: 1.75,
          qty_base: 1.75,
          unit_price_c: 24000,
          subtotal_c: 42000
        }
      ],
      discount_c: 0,
      payments: [{ method: 'CASH', amount_c: 50000 }]
    }

    const result = validateCheckout(validDecimalPayload)
    expect(result.items[0].qty).toBe(1.75)
    expect(result.items[0].qty_base).toBe(1.75)

    // Negative or 0 should throw
    expect(() =>
      validateCheckout({
        ...validDecimalPayload,
        items: [{ ...validDecimalPayload.items[0], qty: -0.5 }]
      })
    ).toThrow(/positive number/)
  })

  it('records utang charges and updates customer credit ledger correctly', () => {
    const db = makeDb()

    const u = users.createUser(db, {
      username: 'admin1',
      passwordHash: hashSecret('secret'),
      pinHash: hashSecret('1234'),
      full_name: 'Admin User',
      roles: ['ADMIN']
    })

    const customer = customers.createCustomer(db, {
      full_name: 'Juan Dela Cruz',
      phone: '09123456789',
      credit_limit_c: 500000 // ₱5,000.00
    })

    expect(customer.balance_c).toBe(0)

    // Create sale with UTANG payment
    const saleId = sales.createSaleRecord(db, {
      transaction_no: 'TPOS-000001',
      user_id: u.id,
      customer_id: customer.id,
      subtotal_c: 35000,
      discount_c: 0,
      total_c: 35000,
      shift_id: null,
      notes: 'Utang purchase'
    })

    sales.insertPayment(db, saleId, 'UTANG', 35000, null)

    const entry = customers.applyCreditEntry(db, {
      customer_id: customer.id,
      entry_type: 'CREDIT_SALE',
      amount_c: 35000,
      reference_type: 'SALE',
      reference_id: saleId,
      notes: 'Sale TPOS-000001',
      user_id: u.id
    })

    const updatedCustomer = customers.getCustomer(db, customer.id)
    expect(updatedCustomer.balance_c).toBe(35000)

    const ledger = customers.customerLedger(db, customer.id)
    expect(ledger.length).toBe(1)
    expect(ledger[0].entry_type).toBe('CREDIT_SALE')
    expect(ledger[0].amount_c).toBe(35000)
    expect(ledger[0].balance_after_c).toBe(35000)
    expect(entry.balance_after_c).toBe(35000)
  })
})
