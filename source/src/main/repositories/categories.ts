import type Database from 'better-sqlite3'
import type { Category } from '@shared/types'

export function listCategories(db: Database.Database): Category[] {
  return db
    .prepare('SELECT * FROM categories ORDER BY name COLLATE NOCASE')
    .all() as Category[]
}

export function findCategoryByName(db: Database.Database, name: string): Category | undefined {
  return db.prepare('SELECT * FROM categories WHERE name = ? COLLATE NOCASE').get(name) as Category | undefined
}

export function createCategory(db: Database.Database, name: string): Category {
  const existing = findCategoryByName(db, name)
  if (existing) return existing
  const info = db.prepare('INSERT INTO categories (name) VALUES (?)').run(name.trim())
  return db.prepare('SELECT * FROM categories WHERE id = ?').get(Number(info.lastInsertRowid)) as Category
}

export function removeCategory(db: Database.Database, id: number): void {
  const used = db.prepare('SELECT COUNT(*) AS c FROM products WHERE category_id = ?').get(id) as { c: number }
  if (used.c > 0) throw new Error('Cannot delete: category still has products.')
  db.prepare('DELETE FROM categories WHERE id = ?').run(id)
}