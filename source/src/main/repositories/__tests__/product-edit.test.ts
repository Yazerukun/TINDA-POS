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

  it('allows re-using barcode from an archived product without duplicate barcode error', () => {
    // 1. Create product A with barcode '4801111111111'
    const formA = newProductForm(5)
    formA.name = 'Old Archived Soda'
    formA.barcode = '4801111111111'
    formA.default_price_c = 2000
    formA.units = [{ name: 'can', conversion_to_base: 1, barcode: '4801111111111', selling_price_c: 2000, is_default: true }]
    const prodA = products.createProduct(db, createProductInput(formA), 1)
    expect(prodA.id).toBeGreaterThan(0)

    // 2. Archive product A (simulating deleting/archiving an item)
    products.setProductStatus(db, prodA.id, 'ARCHIVED', 1)

    // 3. User tries to re-enter / re-use the barcode on a new product B ("i-balik ang barcode")
    const formB = newProductForm(5)
    formB.name = 'New Fresh Soda'
    formB.barcode = '4801111111111'
    formB.default_price_c = 2200
    formB.units = [{ name: 'can', conversion_to_base: 1, barcode: '4801111111111', selling_price_c: 2200, is_default: true }]

    let createError: Error | null = null
    let prodB: any = null
    try {
      prodB = products.createProduct(db, createProductInput(formB), 1)
    } catch (e) {
      createError = e as Error
    }

    expect(createError).toBeNull()
    expect(prodB).not.toBeNull()
    expect(prodB?.barcode).toBe('4801111111111')
  })

  it('supports transferring/reassigning barcode when reassign_barcode is true', () => {
    const form1 = newProductForm(5)
    form1.name = 'Item One'
    form1.barcode = '4805555555555'
    form1.default_price_c = 1000
    const p1 = products.createProduct(db, createProductInput(form1), 1)

    const form2 = newProductForm(5)
    form2.name = 'Item Two'
    form2.barcode = '4807777777777'
    form2.default_price_c = 2000
    const p2 = products.createProduct(db, createProductInput(form2), 1)

    // Now reassign barcode '4805555555555' to Item Two
    const editForm2 = editProductForm(p2)
    editForm2.barcode = '4805555555555'
    const updatePayload = {
      ...updateProductInput(editForm2),
      reassign_barcode: true
    }

    const updatedP2 = products.updateProduct(db, p2.id, updatePayload, 1)
    expect(updatedP2.barcode).toBe('4805555555555')

    // p1 should have its barcode freed (null)
    const freshP1 = products.getProduct(db, p1.id)
    expect(freshP1.barcode).toBeNull()
  })

  it('lookupBarcodeDetails identifies active vs archived items', () => {
    const form = newProductForm(5)
    form.name = 'Juice Pack'
    form.barcode = '4808888888888'
    form.default_price_c = 1500
    const p = products.createProduct(db, createProductInput(form), 1)

    const activeLookup = (products as any).lookupBarcodeDetails(db, '4808888888888')
    expect(activeLookup.exists).toBe(true)
    expect(activeLookup.isArchived).toBe(false)
    expect(activeLookup.product?.id).toBe(p.id)

    // Archive product
    products.setProductStatus(db, p.id, 'ARCHIVED', 1)

    const archivedLookup = (products as any).lookupBarcodeDetails(db, '4808888888888')
    expect(archivedLookup.exists).toBe(true)
    expect(archivedLookup.isArchived).toBe(true)
    expect(archivedLookup.product?.id).toBe(p.id)
  })
})
