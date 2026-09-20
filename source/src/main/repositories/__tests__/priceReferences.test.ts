import { beforeEach, describe, expect, it } from 'vitest'
import Database from 'better-sqlite3'
import { runMigrations } from '../../database/migrations'
import {
  comparePrice,
  createPriceReference,
  deletePriceReference,
  getPriceReference,
  getPriceReferenceByBarcode,
  getPriceReferenceByProductId,
  linkProduct,
  matchReferenceForProduct,
  searchPriceReferences,
  unlinkProduct,
  updatePriceReference,
  upsertPriceReference,
  validatePriceReferenceInput
} from '../priceReferences'
import * as products from '../products'

let db: Database.Database

beforeEach(() => {
  db = new Database(':memory:')
  db.pragma('foreign_keys=ON')
  runMigrations(db)
  db.prepare(
    "INSERT INTO users(username,password_hash,pin_hash,full_name) VALUES ('admin','x','x','Admin')"
  ).run()
})

describe('Price Reference Validation Engine', () => {
  it('rejects missing or empty product_name', () => {
    const res = validatePriceReferenceInput({
      product_name: '   ',
      source_name: 'DTI SRP'
    })
    expect(res.valid).toBe(false)
    expect(res.errors).toContain('Product name is required.')
  })

  it('rejects missing or empty source_name', () => {
    const res = validatePriceReferenceInput({
      product_name: 'Lucky Me Pancit Canton',
      source_name: ''
    })
    expect(res.valid).toBe(false)
    expect(res.errors).toContain('Source name is required.')
  })

  it('rejects negative or fractional price centavos', () => {
    const neg = validatePriceReferenceInput({
      product_name: 'Lucky Me Pancit Canton',
      source_name: 'DTI SRP',
      market_price_c: -500
    })
    expect(neg.valid).toBe(false)
    expect(neg.errors.some((e) => e.includes('Market price'))).toBe(true)

    const frac = validatePriceReferenceInput({
      product_name: 'Lucky Me Pancit Canton',
      source_name: 'DTI SRP',
      min_price_c: 10.5
    })
    expect(frac.valid).toBe(false)
    expect(frac.errors.some((e) => e.includes('Minimum price'))).toBe(true)
  })

  it('rejects min_price_c > max_price_c', () => {
    const res = validatePriceReferenceInput({
      product_name: 'Lucky Me Pancit Canton',
      source_name: 'DTI SRP',
      min_price_c: 2000,
      max_price_c: 1500
    })
    expect(res.valid).toBe(false)
    expect(res.errors).toContain('Minimum price cannot exceed maximum price.')
  })

  it('accepts valid input and normalizes fields', () => {
    const res = validatePriceReferenceInput({
      product_name: '  Lucky Me Pancit Canton 60g  ',
      source_name: '  DTI SRP  ',
      barcode: '  4800016644810  ',
      market_price_c: 1050,
      min_price_c: 900,
      max_price_c: 1500,
      brand: '  Lucky Me  '
    })
    expect(res.valid).toBe(true)
    expect(res.sanitized?.product_name).toBe('Lucky Me Pancit Canton 60g')
    expect(res.sanitized?.source_name).toBe('DTI SRP')
    expect(res.sanitized?.barcode).toBe('4800016644810')
    expect(res.sanitized?.brand).toBe('Lucky Me')
    expect(res.sanitized?.currency).toBe('PHP')
    expect(res.sanitized?.source_type).toBe('market')
  })
})

describe('Price Reference CRUD Operations', () => {
  it('creates and retrieves a price reference', () => {
    const created = createPriceReference(db, {
      product_name: 'Lucky Me Pancit Canton 60g',
      brand: 'Lucky Me',
      barcode: '4800016644810',
      market_price_c: 1050,
      min_price_c: 900,
      max_price_c: 1500,
      source_name: 'DTI SRP',
      source_type: 'official'
    })

    expect(created.id).toBeGreaterThan(0)
    expect(created.product_name).toBe('Lucky Me Pancit Canton 60g')
    expect(created.market_price_c).toBe(1050)
    expect(created.source_type).toBe('official')

    const fetched = getPriceReference(db, created.id)
    expect(fetched).toBeDefined()
    expect(fetched?.id).toBe(created.id)
    expect(fetched?.barcode).toBe('4800016644810')
  })

  it('updates an existing price reference', () => {
    const created = createPriceReference(db, {
      product_name: 'Coke Mismo 500ml',
      source_name: 'Supermarket Guide',
      market_price_c: 1800
    })

    const updated = updatePriceReference(db, created.id, {
      market_price_c: 2000,
      min_price_c: 1800,
      max_price_c: 2200
    })

    expect(updated.market_price_c).toBe(2000)
    expect(updated.min_price_c).toBe(1800)
    expect(updated.max_price_c).toBe(2200)
    expect(updated.product_name).toBe('Coke Mismo 500ml')
  })

  it('deletes a price reference', () => {
    const created = createPriceReference(db, {
      product_name: 'Item to Delete',
      source_name: 'Temp Source'
    })

    deletePriceReference(db, created.id)
    expect(getPriceReference(db, created.id)).toBeUndefined()
  })
})

describe('Price Reference Search & Filtering', () => {
  beforeEach(() => {
    createPriceReference(db, {
      product_name: 'Lucky Me Pancit Canton Original',
      brand: 'Lucky Me',
      barcode: '4800016644810',
      source_name: 'DTI SRP',
      source_type: 'official'
    })
    createPriceReference(db, {
      product_name: 'Lucky Me Pancit Canton Chili Mansi',
      brand: 'Lucky Me',
      barcode: '4800016644827',
      source_name: 'Market Price Guide',
      source_type: 'market'
    })
    createPriceReference(db, {
      product_name: 'San Miguel Pale Pilsen 330ml',
      brand: 'San Miguel',
      barcode: '4800012345678',
      source_name: 'Beverage Index',
      source_type: 'reference'
    })
  })

  it('searches by keyword across name, brand, barcode', () => {
    const res = searchPriceReferences(db, { query: 'Chili' })
    expect(res.total).toBe(1)
    expect(res.references[0]!.product_name).toContain('Chili Mansi')

    const resBrand = searchPriceReferences(db, { query: 'Lucky Me' })
    expect(resBrand.total).toBe(2)

    const resBarcode = searchPriceReferences(db, { query: '4800012345678' })
    expect(resBarcode.total).toBe(1)
    expect(resBarcode.references[0]!.product_name).toContain('San Miguel')
  })

  it('filters by source_type', () => {
    const official = searchPriceReferences(db, { sourceType: 'official' })
    expect(official.total).toBe(1)
    expect(official.references[0]!.source_name).toBe('DTI SRP')

    const market = searchPriceReferences(db, { sourceType: 'market' })
    expect(market.total).toBe(1)
  })

  it('paginates results', () => {
    const page1 = searchPriceReferences(db, { limit: 2, offset: 0 })
    expect(page1.references.length).toBe(2)
    expect(page1.total).toBe(3)

    const page2 = searchPriceReferences(db, { limit: 2, offset: 2 })
    expect(page2.references.length).toBe(1)
    expect(page2.total).toBe(3)
  })
})

describe('Product Linking and Matching Engine', () => {
  let prodId: number

  beforeEach(() => {
    const prod = products.createProduct(
      db,
      {
        category_id: null,
        name: 'Lucky Me Pancit Canton 60g',
        sku: 'LMPC-60',
        barcode: '4800016644810',
        description: 'Instant noodles',
        base_unit: 'pack',
        purchase_cost_c: 850,
        default_price_c: 1200,
        supplier_id: null,
        has_expiration: false,
        notes: null,
        units: [
          {
            name: 'pack',
            conversion_to_base: 1,
            barcode: '4800016644810',
            selling_price_c: 1200,
            is_default: true
          }
        ]
      },
      1
    )
    prodId = prod.id
  })

  it('links and unlinks a product to a price reference', () => {
    const ref = createPriceReference(db, {
      product_name: 'Lucky Me Pancit Canton 60g',
      source_name: 'DTI SRP'
    })

    const linked = linkProduct(db, ref.id, prodId)
    expect(linked.product_id).toBe(prodId)

    const byProd = getPriceReferenceByProductId(db, prodId)
    expect(byProd?.id).toBe(ref.id)

    const unlinked = unlinkProduct(db, ref.id)
    expect(unlinked.product_id).toBeNull()
    expect(getPriceReferenceByProductId(db, prodId)).toBeUndefined()
  })

  it('matches reference for product by explicit link first', () => {
    const ref1 = createPriceReference(db, {
      product_name: 'Completely Different Name',
      source_name: 'Manual Override'
    })
    linkProduct(db, ref1.id, prodId)

    const matched = matchReferenceForProduct(db, {
      id: prodId,
      name: 'Lucky Me Pancit Canton 60g',
      barcode: '4800016644810'
    })
    expect(matched?.id).toBe(ref1.id)
  })

  it('matches reference for product by exact barcode second', () => {
    const ref = createPriceReference(db, {
      product_name: 'Lucky Me Pancit Canton Kalamansi',
      barcode: '4800016644810',
      source_name: 'DTI SRP'
    })

    const matched = matchReferenceForProduct(db, {
      id: prodId,
      name: 'Different Name But Same Barcode',
      barcode: '4800016644810'
    })
    expect(matched?.id).toBe(ref.id)
  })

  it('matches reference for product by exact name third', () => {
    const ref = createPriceReference(db, {
      product_name: 'Lucky Me Pancit Canton 60g',
      source_name: 'DTI SRP'
    })

    const matched = matchReferenceForProduct(db, {
      id: 999,
      name: 'lucky me PANCIT canton 60g',
      barcode: '999999999999'
    })
    expect(matched?.id).toBe(ref.id)
  })

  it('does not match ambiguous or non-matching products', () => {
    createPriceReference(db, {
      product_name: 'Lucky Me Beef Mami',
      source_name: 'DTI SRP'
    })

    const matched = matchReferenceForProduct(db, {
      id: prodId,
      name: 'Lucky Me Chicken Mami',
      barcode: null
    })
    expect(matched).toBeNull()
  })
})

describe('Price Comparison Engine', () => {
  it('returns NO_REFERENCE when reference is null or missing prices', () => {
    expect(comparePrice(1500, null)).toBe('NO_REFERENCE')
    expect(comparePrice(1500, undefined)).toBe('NO_REFERENCE')

    const emptyRef = {
      id: 1,
      product_id: null,
      barcode: null,
      product_name: 'Test',
      brand: null,
      variant: null,
      unit: null,
      image_path: null,
      image_url: null,
      market_price_c: null,
      min_price_c: null,
      max_price_c: null,
      currency: 'PHP',
      source_name: 'Test',
      source_type: 'market' as const,
      source_url: null,
      location: null,
      effective_date: null,
      retrieved_at: '',
      last_synced_at: '',
      created_at: '',
      updated_at: ''
    }
    expect(comparePrice(1500, emptyRef)).toBe('NO_REFERENCE')
  })

  it('evaluates price range correctly', () => {
    const ref = {
      id: 1,
      product_id: null,
      barcode: null,
      product_name: 'Test',
      brand: null,
      variant: null,
      unit: null,
      image_path: null,
      image_url: null,
      market_price_c: 1200,
      min_price_c: 1000,
      max_price_c: 1400,
      currency: 'PHP',
      source_name: 'Test',
      source_type: 'market' as const,
      source_url: null,
      location: null,
      effective_date: null,
      retrieved_at: '',
      last_synced_at: '',
      created_at: '',
      updated_at: ''
    }

    expect(comparePrice(900, ref)).toBe('BELOW_RANGE')
    expect(comparePrice(1000, ref)).toBe('WITHIN_RANGE')
    expect(comparePrice(1200, ref)).toBe('WITHIN_RANGE')
    expect(comparePrice(1400, ref)).toBe('WITHIN_RANGE')
    expect(comparePrice(1500, ref)).toBe('ABOVE_RANGE')
  })

  it('evaluates single market price if range is not provided', () => {
    const ref = {
      id: 1,
      product_id: null,
      barcode: null,
      product_name: 'Test',
      brand: null,
      variant: null,
      unit: null,
      image_path: null,
      image_url: null,
      market_price_c: 1200,
      min_price_c: null,
      max_price_c: null,
      currency: 'PHP',
      source_name: 'Test',
      source_type: 'market' as const,
      source_url: null,
      location: null,
      effective_date: null,
      retrieved_at: '',
      last_synced_at: '',
      created_at: '',
      updated_at: ''
    }

    expect(comparePrice(1100, ref)).toBe('BELOW_RANGE')
    expect(comparePrice(1200, ref)).toBe('WITHIN_RANGE')
    expect(comparePrice(1300, ref)).toBe('ABOVE_RANGE')
  })
})

describe('Upsert Engine for Sync', () => {
  it('creates new when reference does not exist', () => {
    const res = upsertPriceReference(db, {
      product_name: 'New Product',
      barcode: '1234567890123',
      market_price_c: 5000,
      source_name: 'Online Catalog'
    })
    expect(res.created).toBe(true)
    expect(res.reference.id).toBeGreaterThan(0)
    expect(res.reference.product_name).toBe('New Product')
  })

  it('updates existing record matching barcode and preserves linked product', () => {
    const first = upsertPriceReference(db, {
      product_name: 'Coke 1.5L',
      barcode: '4801234567890',
      market_price_c: 6500,
      source_name: 'Beverage Guide'
    })

    const prod = products.createProduct(
      db,
      {
        category_id: null,
        name: 'Coca-Cola 1.5L',
        sku: 'CC-15L',
        barcode: '4801234567890',
        description: null,
        base_unit: 'bottle',
        purchase_cost_c: 5000,
        default_price_c: 6500,
        supplier_id: null,
        has_expiration: false,
        notes: null,
        units: [
          {
            name: 'bottle',
            conversion_to_base: 1,
            barcode: '4801234567890',
            selling_price_c: 6500,
            is_default: true
          }
        ]
      },
      1
    )

    // Suppose product was linked
    linkProduct(db, first.reference.id, prod.id)

    // Sync arrives with updated price
    const second = upsertPriceReference(db, {
      product_name: 'Coca-Cola 1.5L PET',
      barcode: '4801234567890',
      market_price_c: 7000,
      source_name: 'Beverage Guide'
    })

    expect(second.created).toBe(false)
    expect(second.reference.id).toBe(first.reference.id)
    expect(second.reference.market_price_c).toBe(7000)
    expect(second.reference.product_name).toBe('Coca-Cola 1.5L PET')
    expect(second.reference.product_id).toBe(prod.id) // preserved!
  })
})
