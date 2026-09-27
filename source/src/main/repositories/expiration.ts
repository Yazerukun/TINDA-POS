import type Database from 'better-sqlite3'
import type { ExpirationEntry, ExpirationMode, StockBatch } from '@shared/types'
import { localDate, validExpirationDate } from '@shared/expiration'
import { audit } from './audit'

export interface ExpirationStockOptions {
  expiration_date?: string | null
  batch_label?: string
  batch_id?: number
  return_reference?: string
  sale_item_id?: number
}

export function batchesFor(db: Database.Database, productId: number): StockBatch[] {
  return db.prepare('SELECT * FROM stock_batches WHERE product_id=? AND quantity>0 ORDER BY expiration_date IS NULL, expiration_date, id').all(productId) as StockBatch[]
}

export function validateExpiration(mode: unknown, date: unknown): void {
  if (!['NONE', 'ITEM', 'BATCH'].includes(String(mode))) throw new Error('Select a valid expiration tracking mode.')
  if (date != null && date !== '' && !validExpirationDate(date)) throw new Error('Enter a valid expiration date (YYYY-MM-DD).')
  if (mode === 'ITEM' && !validExpirationDate(date)) throw new Error('Expiration date is required for per-item tracking.')
}

export function configureExpiration(db: Database.Database, id: number, mode: ExpirationMode, date: string | null, userId: number): void {
  validateExpiration(mode, date)
  const old = db.prepare('SELECT expiration_mode, expiration_date, stock FROM products WHERE id=?').get(id) as { expiration_mode: ExpirationMode; expiration_date: string | null; stock: number }
  if (old.expiration_mode !== mode && old.expiration_mode !== 'NONE' && old.stock > 0) {
    throw new Error('Finish or withdraw the current stock before changing expiration mode.')
  }
  if (mode === 'BATCH' && old.expiration_mode !== mode && old.stock > 0) {
    if (!validExpirationDate(date)) throw new Error('Enter the expiration date of the existing stock before enabling batch tracking.')
    db.prepare("INSERT INTO stock_batches(product_id,label,expiration_date,quantity) VALUES (?,'Existing stock',?,?)").run(id, date, old.stock)
  }
  const savedDate = mode === 'ITEM' ? date : null
  db.prepare('UPDATE products SET expiration_mode=?, expiration_date=?, has_expiration=? WHERE id=?').run(mode, savedDate, mode === 'NONE' ? 0 : 1, id)
  if (old.expiration_mode !== mode || old.expiration_date !== savedDate) audit(db, {
    action: 'PRODUCT_EXPIRATION', user_id: userId, entity_type: 'PRODUCT', entity_id: id,
    old_value: JSON.stringify(old), new_value: JSON.stringify({ mode, date: savedDate })
  })
}

// Called inside the same transaction as the product balance and stock movement.
export function applyExpirationStock(db: Database.Database, productId: number, change: number, type: string, movementId: number, options: ExpirationStockOptions = {}): void {
  const product = db.prepare('SELECT * FROM products WHERE id=?').get(productId) as { name: string; expiration_mode: ExpirationMode; expiration_date: string | null }
  const today = localDate()
  if (!product.expiration_mode || product.expiration_mode === 'NONE' || change === 0) return
  if (product.expiration_mode === 'ITEM') {
    if (type === 'SALE' && (!product.expiration_date || product.expiration_date < today)) throw new Error(`${product.name}: expired or missing expiration date. Sale blocked.`)
    if (change > 0 && options.expiration_date && options.expiration_date !== product.expiration_date) throw new Error('Per-item stock must share the same expiry. Use batch tracking for different delivery dates.')
    return
  }
  const record = (batchId: number, quantity: number) => {
    db.prepare('UPDATE stock_batches SET quantity=quantity+? WHERE id=?').run(quantity, batchId)
    db.prepare('INSERT INTO batch_movements(batch_id,movement_id,sale_item_id,quantity_change) VALUES (?,?,?,?)').run(batchId, movementId, options.sale_item_id ?? null, quantity)
  }
  if (change > 0) {
    let remaining = change
    // Recover original expiry on returns; old untracked sales go into date-review stock.
    if (options.return_reference) {
      const allocations = db.prepare(`SELECT bm.id, bm.batch_id, -bm.quantity_change-bm.restored_quantity AS available
        FROM batch_movements bm JOIN inventory_movements im ON im.id=bm.movement_id
        WHERE im.product_id=? AND im.movement_type='SALE' AND im.reference=? AND bm.quantity_change<0
          AND (? IS NULL OR bm.sale_item_id=?)
        ORDER BY bm.id`).all(productId, options.return_reference, options.sale_item_id ?? null, options.sale_item_id ?? null) as { id: number; batch_id: number; available: number }[]
      for (const allocation of allocations) {
        const qty = Math.min(remaining, allocation.available)
        if (qty <= 0) continue
        record(allocation.batch_id, qty)
        db.prepare('UPDATE batch_movements SET restored_quantity=restored_quantity+? WHERE id=?').run(qty, allocation.id)
        remaining -= qty
      }
    }
    if (remaining > 0) {
      const date = options.expiration_date || null
      if (date && !validExpirationDate(date)) throw new Error('Enter a valid batch expiration date.')
      if (['PURCHASE', 'INITIAL_STOCK'].includes(type) && !date) throw new Error('Batch expiration date is required. Receive this stock through Restock.')
      const label = options.batch_label?.trim() || (date ? `Delivery ${today}` : 'Date review required')
      const inserted = db.prepare('INSERT INTO stock_batches(product_id,label,expiration_date,quantity) VALUES (?,?,?,0)').run(productId, label, date)
      record(Number(inserted.lastInsertRowid), remaining)
    }
    return
  }
  const batches = batchesFor(db, productId)
  const eligible = type === 'SALE'
    ? batches.filter((b) => b.expiration_date && b.expiration_date >= today)
    : batches.filter((b) => b.id === options.batch_id)
  if (type !== 'SALE' && !options.batch_id) throw new Error('Select the batch to withdraw or adjust.')
  if (eligible.reduce((n, b) => n + b.quantity, 0) < -change) throw new Error(`${product.name}: insufficient eligible stock. Expired or undated batches cannot be sold.`)
  let remaining = -change
  for (const batch of eligible) {
    const qty = Math.min(batch.quantity, remaining)
    if (qty > 0) record(batch.id, -qty)
    remaining -= qty
  }
}

export function listExpiration(db: Database.Database): ExpirationEntry[] {
  return db.prepare(`SELECT p.id AS product_id,p.name AS product_name,p.base_unit,NULL AS batch_id,
    'Per item' AS label,p.expiration_date,p.stock AS quantity FROM products p
    WHERE p.status='ACTIVE' AND p.expiration_mode='ITEM' AND p.stock>0
    UNION ALL SELECT p.id,p.name,p.base_unit,b.id,b.label,b.expiration_date,b.quantity
    FROM products p JOIN stock_batches b ON b.product_id=p.id
    WHERE p.status='ACTIVE' AND p.expiration_mode='BATCH' AND b.quantity>0
    ORDER BY expiration_date,product_name`).all() as ExpirationEntry[]
}

export function updateBatchDate(db: Database.Database, batchId: number, date: string, userId: number): number {
  if (!validExpirationDate(date)) throw new Error('Enter a valid expiration date.')
  const batch = db.prepare('SELECT * FROM stock_batches WHERE id=?').get(batchId) as StockBatch | undefined
  if (!batch || batch.quantity <= 0) throw new Error('Active batch not found.')
  db.prepare('UPDATE stock_batches SET expiration_date=? WHERE id=?').run(date, batchId)
  audit(db, { action: 'BATCH_EXPIRATION', user_id: userId, entity_type: 'PRODUCT', entity_id: batch.product_id, old_value: JSON.stringify(batch), new_value: date })
  return batch.product_id
}
