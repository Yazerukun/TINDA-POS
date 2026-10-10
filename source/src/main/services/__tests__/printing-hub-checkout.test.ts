import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

let dataDir: string

beforeAll(() => {
  dataDir = mkdtempSync(join(tmpdir(), 'tinda-printing-checkout-'))
  process.env.TINDA_DATA_DIR = dataDir
})
afterAll(() => {
  try { closeDb() } catch { /* ignore */ }
  try { rmSync(dataDir, { recursive: true, force: true }) } catch { /* ignore */ }
})

import { completeSetup } from '../auth'
import { checkout } from '../checkout'
import { validateCheckout } from '../../validation/schemas'
import { getDb, closeDb } from '../../database/connection'

describe('Printing Hub & Non-Catalog Custom Item Checkout Immunity', () => {
  it('successfully checks out a job from Printing Hub with negative custom ID or null product_id without throwing Product not found', () => {
    const db = getDb()

    completeSetup({
      store: { store_name: 'Print & Copy Express', address: 'Davao City' },
      admin: { username: 'admin', password: 'password123', pin: '1234', full_name: 'Store Owner' },
      receipt: { footer: 'Thank you for your business!' },
      data_dir: dataDir,
      load_demo: false
    })

    // Simulate item sent from Printing Hub (which uses negative customId like -45293412)
    const rawPayload = {
      items: [
        {
          product_id: -45293412,
          name: 'Rush ID Package (4x 1x1 + 2x 2x2 + 2x Passport)',
          unit_name: 'job',
          qty: 1,
          qty_base: 1,
          unit_price_c: 7500,
          cost_base_c: 500,
          stock_base: 999999,
          subtotal_c: 7500
        },
        {
          product_id: null,
          name: 'Color Document Print (A4)',
          unit_name: 'sets',
          qty: 2,
          qty_base: 2,
          unit_price_c: 1200,
          cost_base_c: 200,
          stock_base: 999999,
          subtotal_c: 2400
        }
      ],
      discount_c: 0,
      customer_id: null,
      payments: [{ method: 'CASH', amount_c: 9900 }]
    }

    // 1. Schema validation must convert negative product_id to null
    const validated = validateCheckout(rawPayload)
    expect(validated.items[0]!.product_id).toBeNull()
    expect(validated.items[1]!.product_id).toBeNull()

    // 2. Checkout must succeed with zero crashes
    const { sale, receipt } = checkout(validated)
    expect(sale).toBeDefined()
    expect(sale.total_c).toBe(9900)
    expect(sale.items).toHaveLength(2)
    expect(sale.items[0]!.product_name).toBe('Rush ID Package (4x 1x1 + 2x 2x2 + 2x Passport)')
    expect(sale.items[0]!.product_id).toBeNull()
    expect(sale.items[0]!.unit_price_c).toBe(7500)
    expect(sale.items[1]!.product_name).toBe('Color Document Print (A4)')
    expect(sale.items[1]!.subtotal_c).toBe(2400)

    // 3. Receipt verification
    const receiptText = receipt.join('\n')
    expect(receiptText).toContain('Rush ID Package (4x 1x1 + 2x 2x2 + 2x Passport)')
    expect(receiptText).toContain('Color Document Print (A4)')
    expect(receiptText).toContain('99.00')

    // 4. Verify SQLite sale_items table has product_id = NULL
    const rows = db.prepare('SELECT product_id, product_name, subtotal_c FROM sale_items WHERE sale_id = ?').all(sale.id) as {
      product_id: number | null
      product_name: string
      subtotal_c: number
    }[]
    expect(rows).toHaveLength(2)
    expect(rows[0]!.product_id).toBeNull()
    expect(rows[1]!.product_id).toBeNull()
  })
})
