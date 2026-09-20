import { beforeEach, describe, expect, it, vi } from 'vitest'
import Database from 'better-sqlite3'
import { runMigrations } from '../../database/migrations'
import {
  getPriceReferenceStatus,
  syncPriceReferences
} from '../priceReferenceService'
import { searchPriceReferences } from '../../repositories/priceReferences'

let db: Database.Database

beforeEach(() => {
  db = new Database(':memory:')
  db.pragma('foreign_keys=ON')
  runMigrations(db)
  db.prepare(
    "INSERT INTO users(username,password_hash,pin_hash,full_name) VALUES ('admin','x','x','Admin')"
  ).run()
})

describe('Price Reference Service', () => {
  it('syncs price references from provided catalog data', async () => {
    const result = await syncPriceReferences(db, {
      catalogData: [
        {
          product_name: 'Lucky Me Pancit Canton Original 60g',
          brand: 'Lucky Me',
          barcode: '4800016644810',
          market_price_c: 1050,
          min_price_c: 900,
          max_price_c: 1500,
          source_name: 'DTI SRP',
          source_type: 'official'
        },
        {
          product_name: 'Mega Sardines in Tomato Sauce 155g',
          brand: 'Mega',
          barcode: '4800049720017',
          market_price_c: 2400,
          min_price_c: 2200,
          max_price_c: 2800,
          source_name: 'DTI SRP',
          source_type: 'official'
        }
      ]
    })

    expect(result.success).toBe(true)
    expect(result.synced_count).toBe(2)
    expect(result.rejected_count).toBe(0)
    expect(result.errors).toHaveLength(0)
    expect(result.is_offline).toBe(false)

    const list = searchPriceReferences(db)
    expect(list.total).toBe(2)
  })

  it('rejects invalid records while keeping valid records', async () => {
    const result = await syncPriceReferences(db, {
      catalogData: [
        {
          product_name: 'Valid Product',
          source_name: 'Valid Source',
          market_price_c: 1500
        },
        {
          product_name: '', // Invalid: missing name
          source_name: 'Valid Source',
          market_price_c: 1500
        },
        {
          product_name: 'Invalid Price Product',
          source_name: 'Valid Source',
          min_price_c: 5000,
          max_price_c: 3000 // Invalid: min > max
        }
      ]
    })

    expect(result.success).toBe(true)
    expect(result.synced_count).toBe(1)
    expect(result.rejected_count).toBe(2)
    expect(result.errors).toHaveLength(2)

    const list = searchPriceReferences(db)
    expect(list.total).toBe(1)
    expect(list.references[0]!.product_name).toBe('Valid Product')
  })

  it('calculates status and freshness correctly', async () => {
    let status = getPriceReferenceStatus(db)
    expect(status.total).toBe(0)
    expect(status.last_synced_at).toBeNull()
    expect(status.is_stale).toBe(true)

    await syncPriceReferences(db, {
      catalogData: [
        {
          product_name: 'Test Product 1',
          source_name: 'DTI SRP',
          market_price_c: 1000
        },
        {
          product_name: 'Test Product 2',
          source_name: 'Market Guide',
          market_price_c: 2000
        }
      ]
    })

    status = getPriceReferenceStatus(db)
    expect(status.total).toBe(2)
    expect(status.last_synced_at).not.toBeNull()
    expect(status.is_stale).toBe(false)
    expect(status.sources).toHaveLength(2)
  })
})
