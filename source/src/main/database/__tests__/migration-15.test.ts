import Database from 'better-sqlite3'
import { describe, expect, it } from 'vitest'
import { runMigrations, migrations } from '../migrations'
import { CANONICAL_TABLES } from '@shared/tindaBackup/canonical'

describe('Migration 15 - Foreign key and composite indexes', () => {
  it('applies Migration 15 and creates all 10 composite & foreign key indexes', () => {
    const db = new Database(':memory:')
    db.pragma('foreign_keys = ON')
    runMigrations(db)

    const migration15 = migrations.find((m) => m.version === 15)
    expect(migration15).toBeDefined()
    expect(migration15?.name).toBe('foreign_key_composite_indexes')

    const indexRows = db.prepare("SELECT name, tbl_name FROM sqlite_master WHERE type = 'index'").all() as {
      name: string
      tbl_name: string
    }[]
    const indexMap = new Map(indexRows.map((r) => [r.name, r.tbl_name]))

    const expectedIndexes = [
      { name: 'idx_products_supplier', table: 'products', cols: ['supplier_id'] },
      { name: 'idx_purchases_supplier', table: 'purchases', cols: ['supplier_id'] },
      { name: 'idx_purchases_reference', table: 'purchases', cols: ['reference'] },
      { name: 'idx_movements_reference', table: 'inventory_movements', cols: ['reference'] },
      { name: 'idx_credit_reference', table: 'credit_ledger', cols: ['reference_type', 'reference_id'] },
      { name: 'idx_held_items_held', table: 'held_sale_items', cols: ['held_sale_id'] },
      { name: 'idx_batch_movements_batch', table: 'batch_movements', cols: ['batch_id'] },
      { name: 'idx_refund_items_sale_item', table: 'refund_items', cols: ['sale_item_id'] },
      { name: 'idx_shifts_opened', table: 'shifts', cols: ['opened_at'] },
      { name: 'idx_payments_sale_method', table: 'payments', cols: ['sale_id', 'method'] }
    ]

    for (const exp of expectedIndexes) {
      expect(indexMap.has(exp.name), `Index ${exp.name} should exist`).toBe(true)
      expect(indexMap.get(exp.name), `Index ${exp.name} should be on table ${exp.table}`).toBe(exp.table)

      const colInfo = db.prepare(`PRAGMA index_info('${exp.name}')`).all() as { name: string }[]
      const indexedCols = colInfo.map((c) => c.name)
      expect(indexedCols).toEqual(exp.cols)
    }
  })

  it('CANONICAL_TABLES includes product_recipes, ewallet_transactions, and ewallet_audits in safe FK order', () => {
    expect(CANONICAL_TABLES).toContain('product_recipes')
    expect(CANONICAL_TABLES).toContain('ewallet_transactions')
    expect(CANONICAL_TABLES).toContain('ewallet_audits')

    const productIdx = CANONICAL_TABLES.indexOf('products')
    const recipesIdx = CANONICAL_TABLES.indexOf('product_recipes')
    const shiftsIdx = CANONICAL_TABLES.indexOf('shifts')
    const ewalletTxIdx = CANONICAL_TABLES.indexOf('ewallet_transactions')
    const ewalletAuditIdx = CANONICAL_TABLES.indexOf('ewallet_audits')

    expect(recipesIdx).toBeGreaterThan(productIdx)
    expect(ewalletTxIdx).toBeGreaterThan(shiftsIdx)
    expect(ewalletAuditIdx).toBeGreaterThan(shiftsIdx)
  })
})
