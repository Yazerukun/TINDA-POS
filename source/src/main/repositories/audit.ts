import type Database from 'better-sqlite3'
import type { AuditLog } from '@shared/types'

export function audit(
  db: Database.Database,
  input: {
    action: string
    user_id: number | null
    entity_type?: string | null
    entity_id?: number | null
    old_value?: string | null
    new_value?: string | null
    reason?: string | null
  }
): void {
  db.prepare(
    `INSERT INTO audit_logs (action, user_id, entity_type, entity_id, old_value, new_value, reason)
     VALUES (?, ?, ?, ?, ?, ?, ?)`
  ).run(
    input.action,
    input.user_id,
    input.entity_type ?? null,
    input.entity_id ?? null,
    input.old_value ?? null,
    input.new_value ?? null,
    input.reason ?? null
  )
}

export function listAudit(
  db: Database.Database,
  opts: { limit?: number; offset?: number; action?: string } = {}
): { rows: AuditLog[]; total: number } {
  const where = []
  const params: unknown[] = []
  if (opts.action) {
    where.push('action = ?')
    params.push(opts.action)
  }
  const whereSql = where.length ? 'WHERE ' + where.join(' AND ') : ''
  const total = (db.prepare(`SELECT COUNT(*) AS c FROM audit_logs ${whereSql}`).get(...params) as { c: number }).c
  const limit = opts.limit ?? 100
  const offset = opts.offset ?? 0
  const rows = db
    .prepare(
      `SELECT a.*, COALESCE(u.full_name, u.username, '') AS user_name
       FROM audit_logs a LEFT JOIN users u ON u.id = a.user_id
       ${whereSql} ORDER BY a.id DESC LIMIT ? OFFSET ?`
    )
    .all(...params, limit, offset) as AuditLog[]
  return { rows, total }
}