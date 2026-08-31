import type Database from 'better-sqlite3'
import type { Supplier } from '@shared/types'
import type { SupplierInput } from '@shared/ipc'

export function listSuppliers(db: Database.Database, opts: { status?: string; search?: string } = {}): Supplier[] {
  const where: string[] = []
  const params: unknown[] = []
  if (opts.status) {
    where.push('status = ?')
    params.push(opts.status)
  }
  if (opts.search?.trim()) {
    where.push('(name LIKE ? OR contact_person LIKE ? OR phone LIKE ?)')
    const like = `%${opts.search.trim()}%`
    params.push(like, like, like)
  }
  const sql = `SELECT * FROM suppliers ${where.length ? 'WHERE ' + where.join(' AND ') : ''} ORDER BY name COLLATE NOCASE`
  return db.prepare(sql).all(...params) as Supplier[]
}

export function getSupplier(db: Database.Database, id: number): Supplier {
  const row = db.prepare('SELECT * FROM suppliers WHERE id = ?').get(id) as Supplier | undefined
  if (!row) throw new Error('Supplier not found.')
  return row
}

export function createSupplier(db: Database.Database, input: SupplierInput): Supplier {
  if (!input.name?.trim()) throw new Error('Supplier name is required.')
  const info = db
    .prepare(
      `INSERT INTO suppliers (name, contact_person, phone, address, notes, status)
       VALUES (?, ?, ?, ?, ?, ?)`
    )
    .run(
      input.name.trim(),
      input.contact_person?.trim() || null,
      input.phone?.trim() || null,
      input.address?.trim() || null,
      input.notes?.trim() || null,
      input.status ?? 'ACTIVE'
    )
  return getSupplier(db, Number(info.lastInsertRowid))
}

export function updateSupplier(db: Database.Database, id: number, input: Partial<SupplierInput>): Supplier {
  const cur = getSupplier(db, id)
  if (input.name !== undefined && !input.name.trim()) throw new Error('Supplier name is required.')
  db.prepare(
    `UPDATE suppliers SET name = ?, contact_person = ?, phone = ?, address = ?, notes = ?, status = ?,
     updated_at = datetime('now','localtime') WHERE id = ?`
  ).run(
    input.name !== undefined ? input.name.trim() : cur.name,
    input.contact_person !== undefined ? input.contact_person?.trim() || null : cur.contact_person,
    input.phone !== undefined ? input.phone?.trim() || null : cur.phone,
    input.address !== undefined ? input.address?.trim() || null : cur.address,
    input.notes !== undefined ? input.notes?.trim() || null : cur.notes,
    input.status ?? cur.status,
    id
  )
  return getSupplier(db, id)
}