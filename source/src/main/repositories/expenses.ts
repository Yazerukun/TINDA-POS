import type Database from 'better-sqlite3'
import type { Expense, ExpenseCategory } from '@shared/types'
import type { ExpenseInput } from '@shared/ipc'

export function listExpenseCategories(db: Database.Database): ExpenseCategory[] {
  return db.prepare('SELECT * FROM expense_categories ORDER BY is_system DESC, name').all() as ExpenseCategory[]
}

export function createExpenseCategory(db: Database.Database, name: string): ExpenseCategory {
  const trimmed = name.trim()
  if (!trimmed) throw new Error('Category name is required.')
  const existing = db
    .prepare('SELECT * FROM expense_categories WHERE name = ? COLLATE NOCASE')
    .get(trimmed) as ExpenseCategory | undefined
  if (existing) return existing
  const info = db.prepare('INSERT INTO expense_categories (name) VALUES (?)').run(trimmed)
  return db.prepare('SELECT * FROM expense_categories WHERE id = ?').get(Number(info.lastInsertRowid)) as ExpenseCategory
}

export function listExpenses(
  db: Database.Database,
  opts: { from?: string; to?: string; category_id?: number; limit?: number; offset?: number } = {}
): { rows: Expense[]; total: number } {
  const where: string[] = []
  const params: unknown[] = []
  if (opts.from) {
    where.push('e.expense_date >= ?')
    params.push(opts.from)
  }
  if (opts.to) {
    where.push('e.expense_date <= ?')
    params.push(opts.to)
  }
  if (opts.category_id) {
    where.push('e.category_id = ?')
    params.push(opts.category_id)
  }
  const whereSql = where.length ? 'WHERE ' + where.join(' AND ') : ''
  const total = (
    db.prepare(`SELECT COUNT(*) AS c FROM expenses e ${whereSql}`).get(...params) as { c: number }
  ).c
  const limit = opts.limit ?? 100
  const offset = opts.offset ?? 0
  const rows = db
    .prepare(
      `SELECT e.*, ec.name AS category_name, COALESCE(u.full_name, u.username, '') AS user_name
       FROM expenses e
       JOIN expense_categories ec ON ec.id = e.category_id
       LEFT JOIN users u ON u.id = e.user_id
       ${whereSql}
       ORDER BY e.expense_date DESC, e.id DESC LIMIT ? OFFSET ?`
    )
    .all(...params, limit, offset) as Expense[]
  return { rows, total }
}

export function createExpense(db: Database.Database, input: ExpenseInput, userId: number): Expense {
  if (!input.category_id) throw new Error('Expense category is required.')
  if (input.amount_c <= 0) throw new Error('Expense amount must be greater than zero.')
  const info = db
    .prepare(
      `INSERT INTO expenses (category_id, amount_c, expense_date, description, reference, notes, user_id)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    )
    .run(
      input.category_id,
      input.amount_c,
      input.expense_date,
      input.description?.trim() || null,
      input.reference?.trim() || null,
      input.notes?.trim() || null,
      userId
    )
  return getExpense(db, Number(info.lastInsertRowid))
}

export function getExpense(db: Database.Database, id: number): Expense {
  const row = db
    .prepare(
      `SELECT e.*, ec.name AS category_name, COALESCE(u.full_name, u.username, '') AS user_name
       FROM expenses e
       JOIN expense_categories ec ON ec.id = e.category_id
       LEFT JOIN users u ON u.id = e.user_id
       WHERE e.id = ?`
    )
    .get(id) as Expense | undefined
  if (!row) throw new Error('Expense not found.')
  return row
}

export function updateExpense(db: Database.Database, id: number, input: Partial<ExpenseInput>): Expense {
  const cur = getExpense(db, id)
  if ((input.amount_c ?? cur.amount_c) <= 0) throw new Error('Expense amount must be greater than zero.')
  db.prepare(
    `UPDATE expenses SET category_id = ?, amount_c = ?, expense_date = ?, description = ?, reference = ?, notes = ?
     WHERE id = ?`
  ).run(
    input.category_id ?? cur.category_id,
    input.amount_c ?? cur.amount_c,
    input.expense_date ?? cur.expense_date,
    input.description !== undefined ? input.description?.trim() || null : cur.description,
    input.reference !== undefined ? input.reference?.trim() || null : cur.reference,
    input.notes !== undefined ? input.notes?.trim() || null : cur.notes,
    id
  )
  return getExpense(db, id)
}

export function deleteExpense(db: Database.Database, id: number): void {
  db.prepare('DELETE FROM expenses WHERE id = ?').run(id)
}

export function sumExpenses(db: Database.Database, from?: string, to?: string): number {
  const where: string[] = []
  const params: unknown[] = []
  if (from) {
    where.push('expense_date >= ?')
    params.push(from)
  }
  if (to) {
    where.push('expense_date <= ?')
    params.push(to)
  }
  const sql = `SELECT COALESCE(SUM(amount_c),0) AS s FROM expenses ${where.length ? 'WHERE ' + where.join(' AND ') : ''}`
  return (db.prepare(sql).get(...params) as { s: number }).s
}