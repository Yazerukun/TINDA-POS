import { beforeEach, describe, expect, it } from 'vitest'
import Database from 'better-sqlite3'
import { runMigrations } from '../../database/migrations'
import * as products from '../products'

let db: Database.Database
beforeEach(() => {
  db = new Database(':memory:'); db.pragma('foreign_keys=ON'); runMigrations(db)
  db.prepare("INSERT INTO users(username,password_hash,pin_hash,full_name) VALUES ('admin','x','x','Admin')").run()
})

const base = {
  category_id: null as number | null, name: 'Coke Mismo', sku: 'CM-1', barcode: null as string | null,
  description: 'Coke Mismo 500ml', base_unit: 'bottle', purchase_cost_c: 1500, default_price_c: 2000,
  low_stock_threshold: 5, supplier_id: null as number | null, has_expiration: false, notes: 'suki order',
  units: [
    { name: 'bottle', conversion_to_base: 1, barcode: null as string | null, selling_price_c: 2000, is_default: true },
    { name: 'case', conversion_to_base: 24, barcode: '480000000024', selling_price_c: 48000, is_default: false }
  ]
}

describe('v1.0.7 update product preserves selling units (repository level)', () => {
  it('updating unrelated fields keeps existing units untouched and no blank unit is written', () => {
    const p = products.createProduct(db, base, 1)
    const updated = products.updateProduct(db, p.id, { name: 'Coke Mismo XL', default_price_c: 2200 }, 1)
    expect(updated.name).toBe('Coke Mismo XL')
    expect(updated.default_price_c).toBe(2200)
    expect(updated.units.map((u) => u.name)).toEqual(['bottle', 'case'])
    expect(updated.units.map((u) => u.conversion_to_base)).toEqual([1, 24])
    expect(updated.units.some((u) => !u.name || !u.name.trim())).toBe(false)
    expect(updated.notes).toBe('suki order')
  })

  it('re-saving existing unit barcodes does not collide with themselves', () => {
    const p = products.createProduct(db, base, 1)
    const updated = products.updateProduct(db, p.id, { name: 'Coke Mismo New', units: [
      { name: 'bottle', conversion_to_base: 1, barcode: null, selling_price_c: 2200, is_default: true },
      { name: 'case', conversion_to_base: 24, barcode: '480000000024', selling_price_c: 52800, is_default: false }
    ] }, 1)
    expect(updated.name).toBe('Coke Mismo New')
    expect(updated.units.find((u) => u.name === 'case')?.selling_price_c).toBe(52800)
  })

  it('a genuinely blank required unit is still rejected with the friendly message', () => {
    const p = products.createProduct(db, base, 1)
    expect(() => products.updateProduct(db, p.id, { units: [{ name: '  ', conversion_to_base: 1, barcode: null, selling_price_c: 0, is_default: true }] }, 1))
      .toThrow('Please enter a name for the selling unit.')
    expect(products.getProduct(db, p.id).units.map((u) => u.name)).toEqual(['bottle', 'case'])
  })

  it('create still requires a non-blank unit name using the friendly message', () => {
    expect(() => products.createProduct(db, { ...base, units: [{ name: '', conversion_to_base: 1, barcode: null, selling_price_c: 0, is_default: true }] }, 1))
      .toThrow('Please enter a name for the selling unit.')
  })
})