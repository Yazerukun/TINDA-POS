import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import type Database from 'better-sqlite3'
import { getDb, closeDb } from '../../database/connection'
import * as products from '../../repositories/products'
import { createPurchase, getPurchase, updatePurchase } from '../../repositories/purchases'
import { completeSetup } from '../auth'
import {
  generatePurchaseOrderDocumentHtml,
  formatPurchaseOrderSlipLines,
  type PurchaseOrderPrintPayload
} from '../../../shared/receiptHtml'

let dataDir: string
let db: Database.Database
let testProdAId: number
let testProdBId: number
let supplierId: number

beforeAll(() => {
  dataDir = mkdtempSync(join(tmpdir(), 'tinda-purch-price-'))
  process.env.TINDA_DATA_DIR = dataDir
  db = getDb()

  completeSetup({
    store: { store_name: 'Price Sync Test Hardware', address: 'Bacolod City' },
    admin: { username: 'admin', password: 'password123', pin: '9999', full_name: 'Test Owner' },
    receipt: { footer: 'Salamat!' },
    data_dir: dataDir,
    load_demo: false
  })

  // Create Supplier
  const supInfo = db
    .prepare("INSERT INTO suppliers(name, contact_person, phone) VALUES ('Evergreen Hardware Supply', 'Mr. Lim', '09170001111')")
    .run()
  supplierId = Number(supInfo.lastInsertRowid)

  // Create Base Product A (Single piece)
  testProdAId = products.createProduct(
    db,
    {
      category_id: null,
      name: 'Pioneer Epoxy All Purpose 500g',
      sku: 'EPOXY-500G',
      barcode: '4801122334455',
      description: 'Adhesives',
      base_unit: 'can',
      purchase_cost_c: 12000, // ₱120.00
      default_price_c: 15000, // ₱150.00
      low_stock_threshold: 5,
      supplier_id: supplierId,
      has_expiration: false,
      notes: null,
      units: [{ name: 'can', conversion_to_base: 1, barcode: '4801122334455', selling_price_c: 15000, is_default: true }],
      initial_stock_base: 20
    },
    1
  ).id

  // Create Product B with multi-unit packaging (Box of 12)
  testProdBId = products.createProduct(
    db,
    {
      category_id: null,
      name: 'Stanley Screwdriver Set 6pc',
      sku: 'STANLEY-SD-6',
      barcode: '4809988776655',
      description: 'Hand Tools',
      base_unit: 'set',
      purchase_cost_c: 25000, // ₱250.00
      default_price_c: 32000, // ₱320.00
      low_stock_threshold: 3,
      supplier_id: supplierId,
      has_expiration: false,
      notes: null,
      units: [
        { name: 'set', conversion_to_base: 1, barcode: '4809988776655', selling_price_c: 32000, is_default: true },
        { name: 'box', conversion_to_base: 10, barcode: '4809988776699', selling_price_c: 300000, is_default: false }
      ],
      initial_stock_base: 10
    },
    1
  ).id
})

afterAll(() => {
  try { closeDb() } catch { /* ignore */ }
  try { rmSync(dataDir, { recursive: true, force: true }) } catch { /* ignore */ }
})

describe('Purchase Invoice Instant Selling Price Update Engine', () => {
  it('automatically updates catalog product selling price when receiving items with a new selling price', () => {
    // Supplier increased cost from ₱120.00 to ₱135.00
    // Store owner adjusts selling price from ₱150.00 to ₱175.00
    const purchase = createPurchase(db, {
      supplier_id: supplierId,
      purchase_date: '2026-10-28',
      invoice_no: 'INV-2026-8801',
      user_id: 1,
      update_product_costs: true,
      items: [
        {
          product_id: testProdAId,
          unit_name: 'can',
          qty: 10,
          qty_base: 10,
          unit_cost_c: 13500, // ₱135.00
          subtotal_c: 135000,
          selling_price_c: 17500 // ₱175.00
        }
      ]
    })

    expect(purchase.id).toBeGreaterThan(0)
    expect(purchase.items[0]?.selling_price_c).toBe(17500)

    // Verify catalog product in database immediately reflects the new selling price!
    const updatedProdA = products.getProduct(db, testProdAId)
    expect(updatedProdA).toBeDefined()
    expect(updatedProdA?.default_price_c).toBe(17500) // ₱175.00
    expect(updatedProdA?.purchase_cost_c).toBe(13500) // ₱135.00
  })

  it('updates multi-unit packaging selling price in product_units when receiving a box unit', () => {
    // Receiving 5 boxes (10 sets per box = 50 sets)
    // New box selling price: ₱3,150.00 (was ₱3,000.00)
    const purchase = createPurchase(db, {
      supplier_id: supplierId,
      purchase_date: '2026-10-28',
      invoice_no: 'INV-2026-8802',
      user_id: 1,
      update_product_costs: true,
      items: [
        {
          product_id: testProdBId,
          unit_name: 'box',
          qty: 5,
          qty_base: 50,
          unit_cost_c: 240000, // ₱2,400 per box
          subtotal_c: 1200000,
          selling_price_c: 315000 // ₱3,150 per box
        }
      ]
    })

    expect(purchase.id).toBeGreaterThan(0)
    const fetched = getPurchase(db, purchase.id)
    expect(fetched.items[0]?.selling_price_c).toBe(315000)

    // Verify product_units in database has updated selling price for 'box'
    const updatedProdB = products.getProduct(db, testProdBId)
    const boxUnit = updatedProdB?.units.find((u) => u.name === 'box')
    expect(boxUnit).toBeDefined()
    expect(boxUnit?.selling_price_c).toBe(315000) // ₱3,150.00
  })

  it('updates catalog selling price when editing an existing purchase invoice in History', () => {
    // Create initial invoice
    const initial = createPurchase(db, {
      supplier_id: supplierId,
      purchase_date: '2026-10-28',
      invoice_no: 'INV-EDIT-01',
      user_id: 1,
      update_product_costs: true,
      items: [
        {
          product_id: testProdAId,
          unit_name: 'can',
          qty: 5,
          qty_base: 5,
          unit_cost_c: 13500,
          subtotal_c: 67500,
          selling_price_c: 17500
        }
      ]
    })

    // Edit invoice: manager adjusts selling price to ₱180.00
    const updated = updatePurchase(db, initial.id, {
      supplier_id: supplierId,
      purchase_date: '2026-10-28',
      invoice_no: 'INV-EDIT-01',
      user_id: 1,
      update_product_costs: true,
      items: [
        {
          product_id: testProdAId,
          unit_name: 'can',
          qty: 5,
          qty_base: 5,
          unit_cost_c: 13500,
          subtotal_c: 67500,
          selling_price_c: 18000 // ₱180.00
        }
      ]
    })

    expect(updated.items[0]?.selling_price_c).toBe(18000)

    // Check catalog
    const prodA = products.getProduct(db, testProdAId)
    expect(prodA?.default_price_c).toBe(18000)
  })

  it('leaves current catalog price unchanged if selling_price_c is omitted or 0', () => {
    const currentPrice = products.getProduct(db, testProdAId)?.default_price_c

    createPurchase(db, {
      supplier_id: supplierId,
      purchase_date: '2026-10-28',
      invoice_no: 'INV-NO-CHANGE',
      user_id: 1,
      update_product_costs: false,
      items: [
        {
          product_id: testProdAId,
          unit_name: 'can',
          qty: 2,
          qty_base: 2,
          unit_cost_c: 13500,
          subtotal_c: 27000
          // selling_price_c omitted
        }
      ]
    })

    const prodAAfter = products.getProduct(db, testProdAId)
    expect(prodAAfter?.default_price_c).toBe(currentPrice)
  })

  it('renders Selling Price (SRP) in Printed PO A4 document and thermal slip', () => {
    const printPayload: PurchaseOrderPrintPayload = {
      purchase: {
        id: 99,
        purchase_no: 'PO-2026-PRINT-01',
        invoice_no: 'PO-2026-PRINT-01',
        purchase_date: '2026-10-28',
        supplier_name: 'Evergreen Hardware Supply',
        total_c: 135000,
        notes: 'Urgent restocking',
        created_at: '2026-10-28 10:00:00',
        items: [
          {
            id: 1,
            product_id: testProdAId,
            product_name: 'Pioneer Epoxy All Purpose 500g',
            product_sku: 'EPOXY-500G',
            unit_name: 'can',
            qty: 10,
            qty_base: 10,
            unit_cost_c: 13500,
            discount_c: 0,
            subtotal_c: 135000,
            selling_price_c: 17500
          }
        ]
      },
      storeName: 'Price Sync Test Hardware',
      storeAddress: 'Bacolod City'
    }

    // 1. A4 Document with Selling Price enabled (default)
    const docHtml = generatePurchaseOrderDocumentHtml(printPayload, { showSellingPrice: true })
    expect(docHtml.html).toContain('SELLING PRICE')
    expect(docHtml.html).toContain('₱175.00')

    // 2. A4 Document with Selling Price disabled via customizer toggle
    const docHtmlWithout = generatePurchaseOrderDocumentHtml(printPayload, { showSellingPrice: false })
    expect(docHtmlWithout.html).not.toContain('SELLING PRICE')

    // 3. Thermal Slip output contains SRP / Retail Price sub-line
    const slipLines = formatPurchaseOrderSlipLines(printPayload)
    const srpLine = slipLines.find((l) => l.includes('>> SRP / Retail Price: P175.00'))
    expect(srpLine).toBeDefined()
  })
})
