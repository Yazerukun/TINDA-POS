import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import type Database from 'better-sqlite3'
import { getDb, closeDb } from '../../database/connection'
import * as products from '../../repositories/products'
import { createPurchase, getPurchase, updatePurchase, listPurchases } from '../../repositories/purchases'
import { verifyManagerPin, completeSetup } from '../auth'
import { createUser } from '../../repositories/users'
import { hashSecret } from '../../security/passwords'
import {
  formatPurchaseOrderSlipLines,
  generatePurchaseOrderDocumentHtml,
  formatDiscountPercent
} from '@shared/receiptHtml'

let dataDir: string
let db: Database.Database
let productAId: number
let productBId: number
let productCId: number

beforeAll(() => {
  dataDir = mkdtempSync(join(tmpdir(), 'tinda-v414-'))
  process.env.TINDA_DATA_DIR = dataDir
  db = getDb()

  // Setup Admin user
  completeSetup({
    store: { store_name: 'VIP Client Hardware Store', address: 'Iloilo City' },
    admin: { username: 'admin', password: 'adminpassword123', pin: '4321', full_name: 'Store Manager' },
    receipt: { footer: 'Thank you for your business!' },
    data_dir: dataDir,
    load_demo: false
  })

  // Create Cashier user
  createUser(db, {
    username: 'cashier1',
    passwordHash: hashSecret('cashierpass'),
    pinHash: hashSecret('1111'),
    full_name: 'Cashier Jane',
    roles: ['CASHIER']
  })

  // Create Suppliers
  db.prepare("INSERT INTO suppliers(name, contact_person, phone, address) VALUES ('Lucky Steel Corporation', 'Mr. Tan', '09171234567', 'Cabugao Sur, Iloilo')").run()
  db.prepare("INSERT INTO suppliers(name, contact_person, phone, address) VALUES ('WILCHAT MARKETING', 'Wilchat Rep', '09189876543', 'Mandurriao, Iloilo')").run()

  // Create Products
  productAId = products.createProduct(
    db,
    {
      category_id: null,
      name: 'Deformed Steel Bar 10mm',
      sku: 'ST-10MM',
      barcode: '4800099881111',
      description: 'Construction Steel',
      base_unit: 'pc',
      purchase_cost_c: 18000,
      default_price_c: 21000,
      low_stock_threshold: 20,
      supplier_id: 1,
      has_expiration: false,
      notes: null,
      units: [{ name: 'pc', conversion_to_base: 1, barcode: '4800099881111', selling_price_c: 21000, is_default: true }],
      initial_stock_base: 100
    },
    1
  ).id

  productBId = products.createProduct(
    db,
    {
      category_id: null,
      name: 'Portland Cement Holcim 40kg',
      sku: 'CEM-40KG',
      barcode: '4800099882222',
      description: 'Standard Portland Cement',
      base_unit: 'sack',
      purchase_cost_c: 24000,
      default_price_c: 27500,
      low_stock_threshold: 15,
      supplier_id: 1,
      has_expiration: false,
      notes: null,
      units: [{ name: 'sack', conversion_to_base: 1, barcode: '4800099882222', selling_price_c: 27500, is_default: true }],
      initial_stock_base: 50
    },
    1
  ).id

  productCId = products.createProduct(
    db,
    {
      category_id: null,
      name: 'PVA White Wood Glue 1L',
      sku: 'GLUE-1L',
      barcode: '4800099883333',
      description: 'Adhesives',
      base_unit: 'bottle',
      purchase_cost_c: 12000,
      default_price_c: 15500,
      low_stock_threshold: 10,
      supplier_id: 2,
      has_expiration: false,
      notes: null,
      units: [{ name: 'bottle', conversion_to_base: 1, barcode: '4800099883333', selling_price_c: 15500, is_default: true }],
      initial_stock_base: 30
    },
    1
  ).id
})

afterAll(() => {
  try { closeDb() } catch { /* ignore */ }
  try { rmSync(dataDir, { recursive: true, force: true }) } catch { /* ignore */ }
})

describe('v4.1.4 Purchase Invoices Search, Edit Authorization & Stock Reconciliation', () => {
  it('creates purchase invoice with discount chain inputs and initial inventory stock increment', () => {
    const purchase = createPurchase(db, {
      supplier_id: 1,
      purchase_date: '2026-10-23',
      invoice_no: 'SI-000002966',
      receipt_no: 'BS-2024-017',
      is_paid: true,
      terms_days: 0,
      discount_c: 50000, // ₱500 trade discount
      notes: 'Initial delivery via truck #4',
      user_id: 1,
      update_product_costs: true,
      items: [
        {
          product_id: productAId,
          unit_name: 'pc',
          qty: 50,
          qty_base: 50,
          unit_cost_c: 18000,
          discount_input: '5+5',
          discount_c: 87750,
          subtotal_c: 812250
        },
        {
          product_id: productBId,
          unit_name: 'sack',
          qty: 20,
          qty_base: 20,
          unit_cost_c: 24000,
          discount_input: '',
          discount_c: 0,
          subtotal_c: 480000
        }
      ]
    })

    expect(purchase.purchase_no).toBe('PPO-000001')
    expect(purchase.supplier_name).toBe('Lucky Steel Corporation')
    expect(purchase.total_c).toBe(1292250) // 812250 + 480000
    expect(purchase.net_total_c).toBe(1242250) // 1292250 - 50000
    expect(purchase.items).toHaveLength(2)

    // Verify inventory stock incremented:
    // Product A: initial 100 + 50 = 150
    const pA = products.getProduct(db, productAId)
    expect(pA?.stock).toBe(150)

    // Product B: initial 50 + 20 = 70
    const pB = products.getProduct(db, productBId)
    expect(pB?.stock).toBe(70)
  })

  it('updates purchase invoice with stock delta adjustments when quantities change, items added, or items removed', () => {
    // Current stock: Product A = 150, Product B = 70, Product C = 30
    // We update PPO-000001:
    // - Product A quantity reduced from 50 to 30 (delta = -20)
    // - Product B quantity increased from 20 to 25 (delta = +5)
    // - Product C newly added with quantity 10 (delta = +10)
    const updated = updatePurchase(db, 1, {
      supplier_id: 1,
      purchase_date: '2026-10-23',
      invoice_no: 'SI-000002966-REV',
      receipt_no: 'BS-2024-017-REV',
      is_paid: false,
      terms_days: 30,
      discount_c: 25000,
      notes: 'Adjusted quantity after unboxing inspection',
      user_id: 1,
      update_product_costs: true,
      items: [
        {
          product_id: productAId,
          unit_name: 'pc',
          qty: 30,
          qty_base: 30,
          unit_cost_c: 18000,
          discount_input: '5+5',
          discount_c: 52650,
          subtotal_c: 487350
        },
        {
          product_id: productBId,
          unit_name: 'sack',
          qty: 25,
          qty_base: 25,
          unit_cost_c: 24000,
          discount_input: '',
          discount_c: 0,
          subtotal_c: 600000
        },
        {
          product_id: productCId,
          unit_name: 'bottle',
          qty: 10,
          qty_base: 10,
          unit_cost_c: 12000,
          discount_input: '10',
          discount_c: 12000,
          subtotal_c: 108000
        }
      ]
    })

    expect(updated.purchase_no).toBe('PPO-000001')
    expect(updated.invoice_no).toBe('SI-000002966-REV')
    expect(updated.is_paid).toBe(false)
    expect(updated.terms_days).toBe(30)
    expect(updated.items).toHaveLength(3)

    // Stock verification:
    // Product A: 150 - 20 = 130
    const pA = products.getProduct(db, productAId)
    expect(pA?.stock).toBe(130)

    // Product B: 70 + 5 = 75
    const pB = products.getProduct(db, productBId)
    expect(pB?.stock).toBe(75)

    // Product C: 30 + 10 = 40
    const pC = products.getProduct(db, productCId)
    expect(pC?.stock).toBe(40)
  })

  it('searches purchase invoices history across P.O. number, invoice number, supplier name, and encoder', () => {
    // Create second invoice for testing multi-record search
    createPurchase(db, {
      supplier_id: 2,
      purchase_date: '2026-10-22',
      invoice_no: 'WIL-99881',
      receipt_no: 'OR-4411',
      is_paid: true,
      terms_days: 0,
      discount_c: 0,
      notes: 'Wilchat adhesives batch',
      user_id: 1,
      items: [
        {
          product_id: productCId,
          unit_name: 'bottle',
          qty: 15,
          qty_base: 15,
          unit_cost_c: 12000,
          subtotal_c: 180000
        }
      ]
    })

    // Search by P.O. Number
    const poSearch = listPurchases(db, { search: 'PPO-000001' })
    expect(poSearch.rows).toHaveLength(1)
    expect(poSearch.rows[0]?.purchase_no).toBe('PPO-000001')

    // Search by Supplier Name
    const supSearch = listPurchases(db, { search: 'WILCHAT' })
    expect(supSearch.rows).toHaveLength(1)
    expect(supSearch.rows[0]?.supplier_name).toBe('WILCHAT MARKETING')

    // Search by Invoice #
    const invSearch = listPurchases(db, { search: 'SI-000002966' })
    expect(invSearch.rows).toHaveLength(1)
    expect(invSearch.rows[0]?.invoice_no).toBe('SI-000002966-REV')

    // Search by non-existent term
    const emptySearch = listPurchases(db, { search: 'NONEXISTENT_KEY' })
    expect(emptySearch.rows).toHaveLength(0)
  })

  it('verifies manager PIN and password authorization for unlocking edit mode', () => {
    // Valid Admin PIN (4321)
    const pinRes = verifyManagerPin('4321')
    expect(pinRes.valid).toBe(true)
    expect(pinRes.name).toBe('Store Manager')

    // Valid Admin Password
    const passRes = verifyManagerPin('adminpassword123')
    expect(passRes.valid).toBe(true)
    expect(passRes.name).toBe('Store Manager')

    // Invalid PIN
    const invalidRes = verifyManagerPin('9999')
    expect(invalidRes.valid).toBe(false)

    // Cashier PIN (Cashier cannot authorize edits)
    const cashierRes = verifyManagerPin('1111')
    expect(cashierRes.valid).toBe(false)
  })

    it('formats trade discounts strictly as clean percentage strings (-20%, -10%-10%, etc.)', () => {
    // Single percentages
    expect(formatDiscountPercent('20%')).toBe('-20%')
    expect(formatDiscountPercent('-20%')).toBe('-20%')
    expect(formatDiscountPercent('20')).toBe('-20%')

    // Compounded / cascading chained percentages
    expect(formatDiscountPercent('10+10')).toBe('-10%-10%')
    expect(formatDiscountPercent('-10%-10%')).toBe('-10%-10%')
    expect(formatDiscountPercent('10/10')).toBe('-10%-10%')
    expect(formatDiscountPercent('5+5+5')).toBe('-5%-5%-5%')
    expect(formatDiscountPercent('-5%-5%-5%')).toBe('-5%-5%-5%')
    expect(formatDiscountPercent('10-10')).toBe('-10%-10%')

    // Fallback calculation from integer centavos
    expect(formatDiscountPercent('', 2000, 10000)).toBe('-20%')
    expect(formatDiscountPercent('₱50', 5000, 50000)).toBe('-10%')

    // Zero / no discount
    expect(formatDiscountPercent('', 0, 10000)).toBe('—')
    expect(formatDiscountPercent('0', 0, 10000)).toBe('—')
    expect(formatDiscountPercent(null, 0, 10000)).toBe('—')
  })

  it('generates thermal slip and A4 document HTML matching VIP client hardware voucher format', () => {
    const p = getPurchase(db, 1)
    const payload = {
      storeName: 'VIP Client Hardware Store',
      storeAddress: 'Iloilo City, Philippines',
      storePhone: '0917-123-4567',
      purchase: p
    }

    // 1. Thermal Slip Lines
    const lines = formatPurchaseOrderSlipLines(payload)
    expect(lines.length).toBeGreaterThan(10)
    expect(lines[0]).toBe('VIP Client Hardware Store')
    expect(lines).toContain('PURCHASE ORDER / RECEIVING SLIP')
    expect(lines.some((l) => l.includes('PPO-000001'))).toBe(true)
    expect(lines.some((l) => l.includes('Memo:'))).toBe(true)
    expect(lines.some((l) => l.includes('Salesman:'))).toBe(true)
    expect(lines.some((l) => l.includes('NET PAYABLE:'))).toBe(true)

    // 2. A4 Document HTML
    const doc = generatePurchaseOrderDocumentHtml(payload)
    expect(doc.title).toBe('Purchase Order - PPO-000001')
    expect(doc.html).toContain('VIP Client Hardware Store')
    expect(doc.html).toContain('OFFICIAL P.O. NUMBER')
    expect(doc.html).toContain('PPO-000001')
    expect(doc.html).toContain('Memo:')
    expect(doc.html).toContain('Salesman:')
    expect(doc.html).toContain('QUANTITY')
    expect(doc.html).toContain('UNIT')
    expect(doc.html).toContain('DESCRIPTION')
    expect(doc.html).toContain('UNIT PRICE')
    expect(doc.html).toContain('DISCOUNT')
    expect(doc.html).toContain('AMOUNT')
    expect(doc.html).toContain('-5%-5%') // Item A with 5+5 discount input
    expect(doc.html).toContain('Prepared / Encoded By')
    expect(doc.html).toContain('Approved By')
  })
})
