import type Database from 'better-sqlite3'
import type { Purchase, PurchaseItem } from '@shared/types'
import { adjustStock } from './products'

export function ensurePurchasesTables(db: Database.Database): void {
  // 1. Create tables if they do not exist
  db.exec(`
    CREATE TABLE IF NOT EXISTS suppliers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      contact_person TEXT,
      phone TEXT,
      address TEXT,
      notes TEXT,
      status TEXT NOT NULL DEFAULT 'ACTIVE',
      created_at TEXT NOT NULL DEFAULT (datetime('now','localtime')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now','localtime'))
    );

    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL DEFAULT '',
      pin_hash TEXT NOT NULL DEFAULT '',
      full_name TEXT NOT NULL DEFAULT '',
      is_active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT (datetime('now','localtime')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now','localtime'))
    );

    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      category_id INTEGER,
      supplier_id INTEGER,
      name TEXT NOT NULL,
      sku TEXT NOT NULL UNIQUE,
      barcode TEXT UNIQUE,
      description TEXT,
      base_unit TEXT NOT NULL DEFAULT 'piece',
      purchase_cost_c INTEGER NOT NULL DEFAULT 0,
      default_price_c INTEGER NOT NULL DEFAULT 0,
      stock INTEGER NOT NULL DEFAULT 0,
      low_stock_threshold INTEGER NOT NULL DEFAULT 5,
      has_expiration INTEGER NOT NULL DEFAULT 0,
      image_path TEXT,
      notes TEXT,
      status TEXT NOT NULL DEFAULT 'ACTIVE',
      created_at TEXT NOT NULL DEFAULT (datetime('now','localtime')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now','localtime'))
    );

    CREATE TABLE IF NOT EXISTS purchases (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      purchase_no TEXT NOT NULL UNIQUE,
      supplier_id INTEGER REFERENCES suppliers(id) ON DELETE SET NULL,
      purchase_date TEXT NOT NULL DEFAULT (date('now','localtime')),
      reference TEXT,
      total_c INTEGER NOT NULL DEFAULT 0,
      notes TEXT,
      user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
      invoice_no TEXT,
      receipt_no TEXT,
      is_paid INTEGER NOT NULL DEFAULT 1,
      terms_days INTEGER NOT NULL DEFAULT 0,
      discount_c INTEGER NOT NULL DEFAULT 0,
      net_total_c INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now','localtime'))
    );

    CREATE TABLE IF NOT EXISTS purchase_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      purchase_id INTEGER NOT NULL REFERENCES purchases(id) ON DELETE CASCADE,
      product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
      unit_name TEXT NOT NULL,
      qty REAL NOT NULL,
      qty_base REAL NOT NULL,
      unit_cost_c INTEGER NOT NULL,
      subtotal_c INTEGER NOT NULL
    );
  `)

  // 2. Ensure all columns exist in older databases BEFORE creating indexes on them
  try {
    const purchCols = new Set(
      (db.prepare("PRAGMA table_info('purchases')").all() as { name: string }[]).map((c) => c.name)
    )
    if (!purchCols.has('invoice_no')) {
      db.exec('ALTER TABLE purchases ADD COLUMN invoice_no TEXT')
    }
    if (!purchCols.has('receipt_no')) {
      db.exec('ALTER TABLE purchases ADD COLUMN receipt_no TEXT')
    }
    if (!purchCols.has('is_paid')) {
      db.exec('ALTER TABLE purchases ADD COLUMN is_paid INTEGER NOT NULL DEFAULT 1')
    }
    if (!purchCols.has('terms_days')) {
      db.exec('ALTER TABLE purchases ADD COLUMN terms_days INTEGER NOT NULL DEFAULT 0')
    }
    if (!purchCols.has('discount_c')) {
      db.exec('ALTER TABLE purchases ADD COLUMN discount_c INTEGER NOT NULL DEFAULT 0')
    }
    if (!purchCols.has('net_total_c')) {
      db.exec('ALTER TABLE purchases ADD COLUMN net_total_c INTEGER NOT NULL DEFAULT 0')
    }
  } catch (err) {
    console.error('ensurePurchasesTables column upgrade failed:', err)
  }

  // 3. Now that columns are guaranteed to exist, create indexes safely
  try {
    db.exec(`
      CREATE INDEX IF NOT EXISTS idx_purchases_date ON purchases(purchase_date);
      CREATE INDEX IF NOT EXISTS idx_purchases_invoice_no ON purchases(invoice_no);
      CREATE INDEX IF NOT EXISTS idx_purchases_receipt_no ON purchases(receipt_no);
      CREATE INDEX IF NOT EXISTS idx_purchase_items_purchase ON purchase_items(purchase_id);
      CREATE INDEX IF NOT EXISTS idx_purchase_items_product ON purchase_items(product_id);
    `)
  } catch (err) {
    console.error('ensurePurchasesTables index creation failed:', err)
  }
}

export function getPurchase(db: Database.Database, id: number): Purchase {
  ensurePurchasesTables(db)
  const row = db
    .prepare(
      `SELECT p.*, s.name AS supplier_name, COALESCE(u.full_name, u.username, '') AS user_name
       FROM purchases p
       LEFT JOIN suppliers s ON s.id = p.supplier_id
       LEFT JOIN users u ON u.id = p.user_id
       WHERE p.id = ?`
    )
    .get(id) as Record<string, unknown> | undefined
  if (!row) throw new Error('Purchase not found.')
  const items = db
    .prepare(
      `SELECT pi.*, COALESCE(pr.name, 'Unknown') AS product_name, COALESCE(pr.barcode, '') AS product_barcode, COALESCE(pr.sku, '') AS product_sku
       FROM purchase_items pi
       LEFT JOIN products pr ON pr.id = pi.product_id
       WHERE pi.purchase_id = ?
       ORDER BY pi.id`
    )
    .all(id) as PurchaseItem[]
  return {
    id: row.id as number,
    purchase_no: (row.purchase_no as string) || `PPO-${String(row.id).padStart(6, '0')}`,
    supplier_id: (row.supplier_id as number) ?? 0,
    supplier_name: (row.supplier_name as string) || '—',
    purchase_date: (row.purchase_date as string) || new Date().toISOString().slice(0, 10),
    reference: (row.reference as string | null) ?? null,
    invoice_no: (row.invoice_no as string | null) ?? null,
    receipt_no: (row.receipt_no as string | null) ?? null,
    is_paid: row.is_paid != null ? Boolean(row.is_paid) : true,
    terms_days: (row.terms_days as number) ?? 0,
    discount_c: (row.discount_c as number) ?? 0,
    net_total_c: (row.net_total_c as number) ?? (row.total_c as number) ?? 0,
    total_c: (row.total_c as number) ?? 0,
    notes: (row.notes as string | null) ?? null,
    user_id: (row.user_id as number) ?? 0,
    user_name: (row.user_name as string) || '—',
    created_at: (row.created_at as string) || new Date().toISOString(),
    items: Array.isArray(items) ? items : []
  }
}

export function nextPurchaseNo(db: Database.Database): string {
  ensurePurchasesTables(db)
  const row = db.prepare(`SELECT purchase_no FROM purchases ORDER BY id DESC LIMIT 1`).get() as
    | { purchase_no: string }
    | undefined
  let seq = 1
  if (row) {
    const m = /PPO-(\d+)/.exec(row.purchase_no)
    if (m) seq = Number(m[1]) + 1
  }
  return `PPO-${String(seq).padStart(6, '0')}`
}

export function createPurchase(
  db: Database.Database,
  input: {
    supplier_id: number
    purchase_date: string
    reference?: string | null
    invoice_no?: string | null
    receipt_no?: string | null
    is_paid?: boolean
    terms_days?: number
    discount_c?: number
    notes?: string | null
    user_id: number
    update_product_costs?: boolean
    items: { product_id: number; unit_name: string; qty: number; qty_base: number; unit_cost_c: number; subtotal_c: number }[]
  }
): Purchase {
  ensurePurchasesTables(db)
  if (!input.supplier_id) throw new Error('Supplier is required.')
  if (!input.items || input.items.length === 0) throw new Error('Purchase must have at least one item.')
  for (const it of input.items) {
    if (it.qty <= 0) throw new Error('Quantity must be greater than zero.')
    if (it.unit_cost_c < 0) throw new Error('Unit cost cannot be negative.')
  }
  const grossTotal = input.items.reduce((s, i) => s + i.subtotal_c, 0)
  const discount = Math.max(0, input.discount_c || 0)
  const netTotal = Math.max(0, grossTotal - discount)
  const ref = input.invoice_no || input.receipt_no || input.reference || null
  const txn = db.transaction(() => {
    const no = nextPurchaseNo(db)
    const info = db
      .prepare(
        `INSERT INTO purchases (
           purchase_no, supplier_id, purchase_date, reference, invoice_no, receipt_no,
           is_paid, terms_days, discount_c, total_c, net_total_c, notes, user_id
         ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .run(
        no,
        input.supplier_id,
        input.purchase_date,
        ref,
        input.invoice_no ?? null,
        input.receipt_no ?? null,
        input.is_paid !== false ? 1 : 0,
        input.terms_days ?? 0,
        discount,
        grossTotal,
        netTotal,
        input.notes ?? null,
        input.user_id
      )
    const purchaseId = Number(info.lastInsertRowid)
    const stmt = db.prepare(
      `INSERT INTO purchase_items (purchase_id, product_id, unit_name, qty, qty_base, unit_cost_c, subtotal_c)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    )
    for (const it of input.items) {
      stmt.run(purchaseId, it.product_id, it.unit_name, it.qty, it.qty_base, it.unit_cost_c, it.subtotal_c)

      // Effective net unit cost per base unit after trade discount
      const netBaseCostC = it.qty_base > 0
        ? Math.round(it.subtotal_c / it.qty_base)
        : Math.round(it.unit_cost_c / (it.qty > 0 ? it.qty_base / it.qty : 1))

      // Atomic stock increment and receiving movement record
      adjustStock(
        db,
        it.product_id,
        it.qty_base,
        'PURCHASE',
        `Purchase Invoice ${input.invoice_no || input.receipt_no || no}`.trim(),
        input.user_id,
        input.invoice_no || input.receipt_no || no,
        {
          source: 'PURCHASE',
          supplier_id: input.supplier_id,
          received_unit: it.unit_name,
          received_quantity: it.qty,
          unit_cost_c: netBaseCostC,
          notes: input.notes ?? null
        }
      )

      // Optionally update catalog product purchase cost with true net acquisition cost
      if (input.update_product_costs) {
        db.prepare(`UPDATE products SET purchase_cost_c = ?, updated_at = datetime('now','localtime') WHERE id = ?`).run(
          netBaseCostC,
          it.product_id
        )
      }
    }
    return purchaseId
  })
  const id = txn()
  return getPurchase(db, id)
}

export function listPurchases(
  db: Database.Database,
  opts: { supplier_id?: number; from?: string; to?: string; limit?: number; offset?: number } = {}
): { rows: Purchase[]; total: number } {
  ensurePurchasesTables(db)

  const where: string[] = []
  const params: unknown[] = []
  if (opts.supplier_id) {
    where.push('p.supplier_id = ?')
    params.push(opts.supplier_id)
  }
  if (opts.from) {
    where.push('p.purchase_date >= ?')
    params.push(opts.from)
  }
  if (opts.to) {
    where.push('p.purchase_date <= ?')
    params.push(opts.to)
  }
  const whereSql = where.length ? 'WHERE ' + where.join(' AND ') : ''
  const totalRow = db.prepare(`SELECT COUNT(*) AS c FROM purchases p ${whereSql}`).get(...params) as
    | { c: number }
    | undefined
  const total = totalRow?.c ?? 0
  const limit = Math.max(1, Math.min(200, opts.limit ?? 50))
  const offset = Math.max(0, opts.offset ?? 0)

  const rows =
    (db
      .prepare(
        `SELECT p.*, s.name AS supplier_name, COALESCE(u.full_name, u.username, '') AS user_name
         FROM purchases p
         LEFT JOIN suppliers s ON s.id = p.supplier_id
         LEFT JOIN users u ON u.id = p.user_id
         ${whereSql} ORDER BY p.id DESC LIMIT ? OFFSET ?`
      )
      .all(...params, limit, offset) as Record<string, unknown>[]) || []

  const itemsStmt = db.prepare(
    `SELECT pi.*, COALESCE(pr.name, 'Unknown') AS product_name, COALESCE(pr.barcode, '') AS product_barcode, COALESCE(pr.sku, '') AS product_sku
     FROM purchase_items pi
     LEFT JOIN products pr ON pr.id = pi.product_id
     WHERE pi.purchase_id = ?
     ORDER BY pi.id`
  )

  return {
    rows: rows.map((r) => {
      let items: PurchaseItem[] = []
      try {
        items = (itemsStmt.all(r.id as number) as PurchaseItem[]) || []
      } catch {
        items = []
      }
      return {
        id: r.id as number,
        purchase_no: (r.purchase_no as string) || `PPO-${String(r.id).padStart(6, '0')}`,
        supplier_id: (r.supplier_id as number) ?? 0,
        supplier_name: (r.supplier_name as string) || '—',
        purchase_date: (r.purchase_date as string) || new Date().toISOString().slice(0, 10),
        reference: (r.reference as string | null) ?? null,
        invoice_no: (r.invoice_no as string | null) ?? null,
        receipt_no: (r.receipt_no as string | null) ?? null,
        is_paid: r.is_paid != null ? Boolean(r.is_paid) : true,
        terms_days: (r.terms_days as number) ?? 0,
        discount_c: (r.discount_c as number) ?? 0,
        net_total_c: (r.net_total_c as number) ?? (r.total_c as number) ?? 0,
        total_c: (r.total_c as number) ?? 0,
        notes: (r.notes as string | null) ?? null,
        user_id: (r.user_id as number) ?? 0,
        user_name: (r.user_name as string) || '—',
        created_at: (r.created_at as string) || new Date().toISOString(),
        items
      }
    }),
    total
  }
}