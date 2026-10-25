import type Database from 'better-sqlite3'
import { CANONICAL_TABLES } from '@shared/tindaBackup/canonical'
import { buildBackupFile, serializeBackupFile } from '@shared/tindaBackup/format'
import type { TindaBackupFile, TindaBackupTable } from '@shared/tindaBackup/types'
import { unsupportedFieldsReport, validateBackupFile, verifyChecksum } from '@shared/tindaBackup/validate'
import { createBackupSync } from '../repositories/backup'

export function snapshotWindows(db: Database.Database, appVersion: string): Promise<TindaBackupFile> {
  const tables: TindaBackupTable[] = []
  for (const name of CANONICAL_TABLES) {
    if (name === 'settings') continue
    const exists = db.prepare(`SELECT name FROM sqlite_master WHERE type='table' AND name=?`).get(name)
    if (!exists) continue
    tables.push({ name, rows: db.prepare(`SELECT * FROM "${name}"`).all() as Record<string, unknown>[] })
  }
  const settings = Object.fromEntries(
    (db.prepare('SELECT * FROM settings').all() as { key: string; value: string }[]).map((r) => [r.key, r.value])
  ) as Record<string, unknown>
  return buildBackupFile(
    { settings, tables },
    { platform: 'windows', appVersion, schemaVersion: 1 }
  )
}

function normalizeRowForTable(
  name: string,
  row: Record<string, unknown>,
  context: { seenBarcodes: Set<string> }
): Record<string, unknown> {
  const r = { ...row }
  if (name === 'users') {
    if (!r.full_name && r.name) r.full_name = r.name
    if (!r.full_name) r.full_name = r.username || 'Admin User'
    if (!r.password_hash) r.password_hash = 'web_imported_placeholder'
    if (!r.pin_hash) r.pin_hash = String(r.pin || '1234')
  } else if (name === 'customers') {
    if (!r.full_name && r.name) r.full_name = r.name
    if (!r.full_name) r.full_name = 'Valued Customer'
  } else if (name === 'products') {
    if (!r.sku || typeof r.sku !== 'string' || !r.sku.trim()) {
      r.sku = `SKU-${String(r.id || Math.random().toString(36).slice(2, 8).toUpperCase())}`
    }
    if (r.barcode === '') {
      r.barcode = null
    } else if (typeof r.barcode === 'string' && r.barcode.trim()) {
      const clean = r.barcode.trim()
      if (context.seenBarcodes.has(clean)) {
        r.barcode = `${clean}-${String(r.id || Math.random().toString(36).slice(2, 6))}`
      } else {
        context.seenBarcodes.add(clean)
        r.barcode = clean
      }
    }
    if (r.purchase_cost_c === undefined && r.cost_c !== undefined) {
      r.purchase_cost_c = r.cost_c
    }
    if (r.low_stock_threshold === undefined || r.low_stock_threshold === null) {
      r.low_stock_threshold = 5
    }
    if (r.has_expiration === undefined || r.has_expiration === null) {
      r.has_expiration = r.expiration_date ? 1 : 0
    }
    if (!r.base_unit) r.base_unit = 'piece'
    if (!r.status) r.status = 'ACTIVE'
  } else if (name === 'sales') {
    if (!r.transaction_no && r.invoice_number) r.transaction_no = String(r.invoice_number)
    if (!r.transaction_no) r.transaction_no = `TX-${String(r.id || Math.random().toString(36).slice(2, 8).toUpperCase())}`
    if (r.subtotal_c === undefined) r.subtotal_c = r.total_c || 0
    if (r.discount_c === undefined) r.discount_c = 0
    if (r.total_c === undefined) r.total_c = 0
    if (!r.status) r.status = 'COMPLETED'
  } else if (name === 'sale_items') {
    if (!r.product_name) r.product_name = (r.name as string) || 'Item'
    if (!r.unit_name) r.unit_name = (r.unit as string) || 'piece'
    if (r.qty === undefined) r.qty = (r.quantity as number) || 1
    if (r.qty_base === undefined) r.qty_base = r.qty || 1
    if (r.unit_price_c === undefined) r.unit_price_c = 0
    if (r.subtotal_c === undefined) r.subtotal_c = (r.total_c as number) || 0
    if (r.cost_base_c === undefined) r.cost_base_c = 0
    if (r.refunded_qty_base === undefined) r.refunded_qty_base = 0
  } else if (name === 'cash_counts') {
    if (!r.shift_id) r.shift_id = 1
    if (!r.user_id) r.user_id = 1
    if (!r.business_date) r.business_date = String(r.created_at || new Date().toISOString()).slice(0, 10)
    if (r.starting_cash_c === undefined) r.starting_cash_c = 0
    if (r.expected_cash_c === undefined) r.expected_cash_c = Number(r.expected_c || 0)
    if (r.actual_cash_c === undefined) r.actual_cash_c = Number(r.total_c || 0)
    if (r.difference_c === undefined) r.difference_c = Number(r.discrepancy_c || 0)
    if (!r.status) {
      const diff = Number(r.difference_c)
      r.status = diff > 0 ? 'OVER' : diff < 0 ? 'SHORT' : 'BALANCED'
    }
    if (!r.denominations_json) {
      r.denominations_json = JSON.stringify(r.denominations || {})
    }
  } else if (name === 'stock_batches') {
    if (!r.label && r.batch_number) r.label = r.batch_number
    if (!r.label) r.label = 'BATCH-01'
    if (r.quantity === undefined) r.quantity = r.current_qty ?? r.initial_qty ?? 0
  } else if (name === 'inventory_movements') {
    if (r.quantity_change === undefined && r.change_qty !== undefined) r.quantity_change = r.change_qty
    if (r.quantity_change === undefined) r.quantity_change = 0
    if (r.quantity_before === undefined) r.quantity_before = 0
    if (r.quantity_after === undefined) {
      r.quantity_after = Number(r.quantity_before || 0) + Number(r.quantity_change || 0)
    }
    if (!r.movement_type) r.movement_type = r.reason || r.type || 'ADJUST'
  }
  return r
}

function insertTableRows(db: Database.Database, name: string, rawRows: Record<string, unknown>[]): number {
  if (rawRows.length === 0) return 0
  const context = { seenBarcodes: new Set<string>() }
  const rows = rawRows.map((r) => normalizeRowForTable(name, r, context))
  const allColumns = Array.from(new Set(rows.flatMap((r) => Object.keys(r))))
  const existingCols = new Set(
    (db.prepare(`PRAGMA table_info("${name}")`).all() as { name: string }[]).map((c) => c.name)
  )
  const columns = allColumns.filter((c) => existingCols.has(c))
  if (columns.length === 0) return 0

  const stmt = db.prepare(
    `INSERT INTO "${name}" (${columns.map((c) => `"${c}"`).join(', ')}) VALUES (${columns.map(() => '?').join(', ')})`
  )
  const insert = db.transaction((batch: Record<string, unknown>[]) =>
    batch.forEach((r) => stmt.run(...columns.map((c) => (c in r ? (r[c] ?? null) : null))))
  )
  insert(rows)
  if (columns.includes('id')) {
    const row = db.prepare(`SELECT MAX(id) AS m FROM "${name}"`).get() as { m: number }
    db.prepare(`UPDATE sqlite_sequence SET seq=? WHERE name=?`).run(row.m ?? 0, name)
  }
  return rows.length
}

function applyCanonicalTables(db: Database.Database, tables: TindaBackupTable[]): Record<string, number> {
  const byName = new Map(tables.map((t) => [t.name, t]))

  // Automatically decompose embedded transaction items into sale_items if missing
  if (!byName.has('sale_items')) {
    const salesTable = byName.get('sales')
    if (salesTable && Array.isArray(salesTable.rows)) {
      const generatedItems: Record<string, unknown>[] = []
      let itemId = 1
      for (const sale of salesTable.rows) {
        if (Array.isArray(sale.items)) {
          for (const it of sale.items as Record<string, unknown>[]) {
            generatedItems.push({
              id: itemId++,
              sale_id: sale.id,
              product_id: it.product_id ?? null,
              product_name: it.name || it.product_name || 'Item',
              unit_name: it.unit_name || it.unit || 'piece',
              qty: it.quantity ?? it.qty ?? 1,
              qty_base: it.quantity ?? it.qty ?? 1,
              unit_price_c: it.unit_price_c ?? 0,
              subtotal_c: it.total_c ?? it.subtotal_c ?? 0,
              cost_base_c: 0,
              refunded_qty_base: 0
            })
          }
        }
      }
      if (generatedItems.length > 0) {
        tables.push({ name: 'sale_items', rows: generatedItems })
        byName.set('sale_items', { name: 'sale_items', rows: generatedItems })
      }
    }
  }

  // Ensure users table has at least user 1 for foreign key safety
  const usersTable = byName.get('users')
  if (!usersTable || !Array.isArray(usersTable.rows) || usersTable.rows.length === 0) {
    const defaultUser = [{
      id: 1,
      username: 'admin',
      password_hash: 'web_imported_placeholder',
      pin_hash: '1234',
      full_name: 'Store Administrator'
    }]
    tables.push({ name: 'users', rows: defaultUser })
    byName.set('users', { name: 'users', rows: defaultUser })
  }

  // Ensure shifts table exists with at least an initial shift row for orphan resilience
  const shiftsTable = byName.get('shifts')
  if (!shiftsTable || !Array.isArray(shiftsTable.rows) || shiftsTable.rows.length === 0) {
    const defaultShift = [{ id: 1, user_id: 1, status: 'CLOSED', opened_at: new Date().toISOString() }]
    tables.push({ name: 'shifts', rows: defaultShift })
    byName.set('shifts', { name: 'shifts', rows: defaultShift })
  }

  const counts: Record<string, number> = {}

  // 1. DELETE PASS: Children first (reverse of CANONICAL_TABLES)
  for (let i = CANONICAL_TABLES.length - 1; i >= 0; i--) {
    const name = CANONICAL_TABLES[i]!
    if (name === 'settings') continue
    const tableExists = db.prepare(`SELECT name FROM sqlite_master WHERE type='table' AND name=?`).get(name)
    if (tableExists && byName.has(name)) {
      db.prepare(`DELETE FROM "${name}"`).run()
    }
  }

  // 2. INSERT PASS: Parents first (forward order of CANONICAL_TABLES)
  for (const name of CANONICAL_TABLES) {
    if (name === 'settings') continue
    const table = byName.get(name)
    if (!table) continue
    const tableExists = db.prepare(`SELECT name FROM sqlite_master WHERE type='table' AND name=?`).get(name)
    if (!tableExists) continue
    counts[name] = insertTableRows(db, name, table.rows)
  }
  return counts
}

export function exportWindowsBackup(db: Database.Database, appVersion: string): Promise<string> {
  return snapshotWindows(db, appVersion).then(serializeBackupFile)
}

export async function importWindowsBackup(
  db: Database.Database,
  text: string,
  opts: { safetyBackup?: boolean } = {}
): Promise<{ counts: Record<string, number>; unsupported: ReturnType<typeof unsupportedFieldsReport> }> {
  const file = JSON.parse(text) as TindaBackupFile
  const validated = validateBackupFile(file)
  if (!validated.ok) {
    throw new Error(`Invalid backup: ${validated.issues.map((i) => i.message).join('; ')}`)
  }
  if (!(await verifyChecksum(file))) {
    throw new Error('Backup checksum mismatch: file is corrupted or was tampered with.')
  }
  const unsupported = unsupportedFieldsReport(file, 'windows')
  if (unsupported.unsupportedTables.length > 0) {
    throw new Error(`Backup from ${file.manifest.source.platform} has tables Windows cannot restore: ${unsupported.summary}`)
  }
  if (opts.safetyBackup !== false) createBackupSync(db, 'BEFORE_TINDA_RESTORE')

  // Disable foreign keys outside transaction to allow safe bulk wipe & bulk repopulation
  db.pragma('foreign_keys = OFF')
  try {
    const counts = db.transaction(() => {
      db.pragma('defer_foreign_keys = ON')
      const c = applyCanonicalTables(db, file.data.tables)
      if (file.data.settings) {
        db.prepare('DELETE FROM settings').run()
        const rows = Object.entries(file.data.settings).map(([key, value]) => ({
          key,
          value: typeof value === 'string' ? value : JSON.stringify(value)
        }))
        insertTableRows(db, 'settings', rows)
      }
      return c
    })()

    // 1. Database structural integrity check
    const integrity = db.pragma('integrity_check') as unknown as { integrity_check: string }[]
    const status = integrity[0]?.integrity_check
    if (status !== 'ok') {
      throw new Error(`Database integrity check failed after restore: ${String(status)}`)
    }

    // 2. Foreign key verification & graceful auto-healing of orphaned optional keys
    const fkErrors = db.pragma('foreign_key_check') as unknown as { table: string; rowid: number; parent: string; fkid: number }[]
    if (fkErrors && fkErrors.length > 0) {
      console.warn(`[TINDA Restore] Foreign key anomalies detected post-restore (${fkErrors.length} rows), healing...`)
      for (const err of fkErrors) {
        try {
          if (err.table === 'sales' && err.parent === 'shifts') {
            db.prepare('UPDATE sales SET shift_id = NULL WHERE rowid = ?').run(err.rowid)
          } else if (err.table === 'sales' && err.parent === 'customers') {
            db.prepare('UPDATE sales SET customer_id = NULL WHERE rowid = ?').run(err.rowid)
          } else if (err.table === 'products' && err.parent === 'categories') {
            db.prepare('UPDATE products SET category_id = NULL WHERE rowid = ?').run(err.rowid)
          } else if (err.table === 'products' && err.parent === 'suppliers') {
            db.prepare('UPDATE products SET supplier_id = NULL WHERE rowid = ?').run(err.rowid)
          }
        } catch {
          // Non-fatal if healing cannot be performed
        }
      }
    }

    return { counts, unsupported }
  } finally {
    db.pragma('foreign_keys = ON')
  }
}