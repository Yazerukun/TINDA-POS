import { describe, it, expect } from 'vitest'
import Database from 'better-sqlite3'
import { runMigrations } from '../../database/migrations'
import { listCategories } from '../../repositories/categories'
import { searchProducts } from '../../repositories/products'
import { hashSecret } from '../../security/passwords'
import * as users from '../../repositories/users'
import { loadDemoData } from '../demoData'

describe('POS category dropdown data', () => {
  it('populates options and filters by category (mirrors POS dropdown)', () => {
    const db = new Database(':memory:')
    db.pragma('foreign_keys = ON')
    runMigrations(db)
    users.createUser(db, {
      username: 'admin',
      passwordHash: hashSecret('secret'),
      pinHash: hashSecret('1234'),
      full_name: 'Admin',
      roles: ['ADMIN']
    })
    loadDemoData(db)

    const cats = listCategories(db)
    expect(cats.length).toBeGreaterThan(0)

    const drinks = cats.find((c) => c.name === 'Drinks')
    expect(drinks).toBeDefined()

    const res = searchProducts(db, { status: 'ACTIVE', category_id: drinks?.id, limit: 100 })
    expect(res.rows.length).toBeGreaterThan(0)
    for (const p of res.rows) expect(p.category_id).toBe(drinks?.id)

    const all = searchProducts(db, { status: 'ACTIVE', limit: 100 })
    expect(all.total).toBeGreaterThan(0)
  })
})
