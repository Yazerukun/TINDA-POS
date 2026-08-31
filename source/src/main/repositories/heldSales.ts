import type Database from 'better-sqlite3'
import type { HeldSale, HeldSaleItem } from '@shared/types'
import { randomBytes } from 'node:crypto'

export function heldSalesFor(db: Database.Database, userId: number): HeldSale[] {
  return db
    .prepare(
      `SELECT * FROM held_sales WHERE user_id = ? ORDER BY id DESC LIMIT 50`
    )
    .all(userId) as HeldSale[]
}

function hydrate(db: Database.Database, row: HeldSale): HeldSale {
  const items = db
    .prepare('SELECT * FROM held_sale_items WHERE held_sale_id = ? ORDER BY id')
    .all(row.id) as HeldSaleItem[]
  return { ...row, items }
}

export function getHeldSale(db: Database.Database, id: number): HeldSale {
  const row = db.prepare('SELECT * FROM held_sales WHERE id = ?').get(id) as HeldSale | undefined
  if (!row) throw new Error('Held sale not found.')
  return hydrate(db, row)
}

export function saveHeldSale(
  db: Database.Database,
  input: { user_id: number; subtotal_c: number; discount_c: number; total_c: number; items: HeldSaleItem[] }
): HeldSale {
  if (input.items.length === 0) throw new Error('Cart is empty.')
  const token = randomBytes(4).toString('hex').toUpperCase()
  const txn = db.transaction(() => {
    const info = db
      .prepare(
        `INSERT INTO held_sales (token, subtotal_c, discount_c, total_c, user_id) VALUES (?, ?, ?, ?, ?)`
      )
      .run(token, input.subtotal_c, input.discount_c, input.total_c, input.user_id)
    const id = Number(info.lastInsertRowid)
    const stmt = db.prepare(
      `INSERT INTO held_sale_items (held_sale_id, product_id, name, unit_name, qty, qty_base, unit_price_c, subtotal_c, cost_base_c)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    for (const it of input.items) {
      stmt.run(id, it.product_id, it.name, it.unit_name, it.qty, it.qty_base, it.unit_price_c, it.subtotal_c, it.cost_base_c ?? 0)
    }
    return id
  })
  return getHeldSale(db, txn())
}

export function deleteHeldSale(db: Database.Database, id: number): void {
  db.prepare('DELETE FROM held_sales WHERE id = ?').run(id)
}