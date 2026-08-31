import { app } from 'electron'
import Database from 'better-sqlite3'
import { existsSync, mkdirSync } from 'node:fs'
import { join } from 'node:path'
import { runMigrations } from './migrations'

export interface AppDirs {
  root: string
  database: string
  backups: string
  receipts: string
  logs: string
  exports: string
  images: string
}

let dirsCache: AppDirs | null = null

export function appDirs(): AppDirs {
  if (dirsCache) return dirsCache
  const env = process.env.TINDA_DATA_DIR
  const root = env && env.trim().length > 0 ? env : app.getPath('userData')
  const dirs: AppDirs = {
    root,
    database: join(root, 'database'),
    backups: join(root, 'backups'),
    receipts: join(root, 'receipts'),
    logs: join(root, 'logs'),
    exports: join(root, 'exports'),
    images: join(root, 'images')
  }
  for (const d of Object.values(dirs)) if (!existsSync(d)) mkdirSync(d, { recursive: true })
  dirsCache = dirs
  return dirs
}

let db: Database.Database | null = null

export function getDb(): Database.Database {
  if (db) return db
  const { database } = appDirs()
  const file = join(database, 'tindapos.db')
  db = new Database(file)
  db.pragma('journal_mode = WAL')
  db.pragma('foreign_keys = ON')
  db.pragma('busy_timeout = 5000')
  db.pragma('synchronous = NORMAL') // fast commits, safe under WAL
  db.pragma('cache_size = -20000') // ~20 MB page cache for reporting scans
  db.pragma('temp_store = MEMORY') // faster temp sorts in reports
  runMigrations(db)
  return db
}

export function getDbFile(): string {
  return join(appDirs().database, 'tindapos.db')
}

export function closeDb(): void {
  if (db) {
    db.pragma('wal_checkpoint(TRUNCATE)')
    db.close()
    db = null
  }
}

export function reopenDb(): Database.Database {
  closeDb()
  return getDb()
}

export function migrate(database: Database.Database): void {
  runMigrations(database)
}

export function integrityCheck(): { ok: boolean; message: string } {
  try {
    const row = getDb().pragma('integrity_check') as unknown as { integrity_check: string }[]
    const ok = row.every((r) => r.integrity_check === 'ok')
    return ok ? { ok: true, message: 'Database integrity OK.' } : { ok: false, message: JSON.stringify(row) }
  } catch (e) {
    return { ok: false, message: String(e) }
  }
}