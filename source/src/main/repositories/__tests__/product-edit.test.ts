import { beforeEach, describe, expect, it } from 'vitest'
import Database from 'better-sqlite3'
import { runMigrations } from '../../database/migrations'
import * as products from '../products'
import { newProductForm, createProductInput, editProductForm, updateProductInput } from '../../../renderer/src/lib/productForm'

describe('Product creation and editing flow', () => {
  let db: Database.Database

  beforeEach(() => {
    db = new Database(':memory:')
    db.pragma('foreign_keys=ON')
    runMigrations(db)
    db.prepare("INSERT INTO users(username,password_hash,pin_hash,full_name) VALUES ('admin','x','x','Admin')").run()
  })

  it('can create a product from newProductForm and immediately edit it', () => {
    // 1. Simulating UI New Product
    const form = newProductForm(5)
    form.name = 'New Test Item'
    form.default_price_c = 1500
    form.purchase_cost_c = 1000
    form.base_unit = 'piece'
    form.barcode = '4800016644800'
    form.initial_stock_base = 10
    // User row in UI
    form.units = [
      { name: 'piece', conversion_to_base: 1, barcode: null, selling_price_c: 1500, is_default: true }
    ]

    const createPayload = createProductInput(form)
    const created = products.createProduct(db, createPayload, 1)
    expect(created.id).toBeGreaterThan(0)
    expect(created.name).toBe('New Test Item')

    // 2. Simulating UI Edit Product
    const editForm = editProductForm(created)
    editForm.name = 'Updated Test Item'
    editForm.default_price_c = 1800
    // In UI, rows is editForm.units
    const updatePayload = updateProductInput({ ...editForm, units: editForm.units })
    const updated = products.updateProduct(db, created.id, updatePayload, 1)
    expect(updated.name).toBe('Updated Test Item')
    expect(updated.default_price_c).toBe(1800)
  })

  it('editing product when barcode was placed on both product and unit', () => {
    const form = newProductForm(5)
    form.name = 'Item With Unit Barcode'
    form.default_price_c = 2500
    form.base_unit = 'can'
    form.barcode = '4801234567890'
    form.units = [
      { name: 'can', conversion_to_base: 1, barcode: '4801234567890', selling_price_c: 2500, is_default: true }
    ]

    const created = products.createProduct(db, createProductInput(form), 1)

    // Now edit that product!
    const editForm = editProductForm(created)
    editForm.name = 'Item With Unit Barcode Edited'
    let editError: Error | null = null
    try {
      products.updateProduct(db, created.id, updateProductInput(editForm), 1)
    } catch (e) {
      editError = e as Error
    }
    expect(editError).toBeNull()
  })

  it('editing product when unit has barcode and product barcode is updated', () => {
    const form = newProductForm(5)
    form.name = 'Item With Unit Barcode 2'
    form.default_price_c = 2500
    form.base_unit = 'can'
    form.barcode = ''
    form.units = [
      { name: 'can', conversion_to_base: 1, barcode: '4809999999999', selling_price_c: 2500, is_default: true }
    ]
    const created = products.createProduct(db, createProductInput(form), 1)

    // Now edit and set product barcode to the same barcode
    const editForm = editProductForm(created)
    editForm.barcode = '4809999999999'
    let editError: Error | null = null
    try {
      products.updateProduct(db, created.id, updateProductInput(editForm), 1)
    } catch (e) {
      editError = e as Error
    }
    expect(editError).toBeNull()
  })

  it('creating products when user leaves SKU blank', () => {
    const form1 = newProductForm(5)
    form1.name = 'Item No SKU 1'
    form1.sku = ''
    form1.default_price_c = 1000

    const p1 = products.createProduct(db, createProductInput(form1), 1)
    expect(p1.id).toBeGreaterThan(0)

    const form2 = newProductForm(5)
    form2.name = 'Item No SKU 2'
    form2.sku = ''
    form2.default_price_c = 2000

    let p2Error: Error | null = null
    try {
      products.createProduct(db, createProductInput(form2), 1)
    } catch (e) {
      p2Error = e as Error
    }
    expect(p2Error).toBeNull()
  })
})
