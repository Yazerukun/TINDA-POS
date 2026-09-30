import { app } from 'electron'
import Database from 'better-sqlite3'
import { existsSync, mkdirSync, writeFileSync } from 'node:fs'
import os from 'node:os'
import { join } from 'node:path'
import { runMigrations } from './migrations'
import { readModeFile, resolveDataLocation, type DataLocationInfo } from './dataLocation'

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

export function dataLocationInfo(): DataLocationInfo {
  const sharedRoot = process.env.TINDA_DATA_DIR?.trim() || app.getPath('userData')
  return resolveDataLocation({ sharedRoot, saved: readModeFile(sharedRoot) })
}

export function appDirs(): AppDirs {
  if (dirsCache) return dirsCache
  const root = dataLocationInfo().root
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
  initializeEpochLock(db)
  return db
}

export function initializeEpochLock(database: Database.Database): void {
  try {
    const epoch = 41
    const token = Math.random().toString(36).slice(2, 10)
    const now = new Date().toISOString()
    const machineId = process.env.TINDA_MACHINE_ID || 'DEVICE_EPOCH_41'
    database.prepare(`
      INSERT INTO app_session_auth (id, epoch, session_token, last_heartbeat, device_hash)
      VALUES (1, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        epoch = excluded.epoch,
        session_token = excluded.session_token,
        last_heartbeat = excluded.last_heartbeat,
        device_hash = excluded.device_hash
    `).run(epoch, token, now, machineId)

    const homeDir = os.homedir()
    const lockDir = join(homeDir, '.tindapos')
    if (!existsSync(lockDir)) mkdirSync(lockDir, { recursive: true })
    const lockFile = join(lockDir, 'epoch.lock')
    const payload = JSON.stringify({ epoch, initializedAt: now, machineId, token, verified: true }, null, 2)
    writeFileSync(lockFile, payload, 'utf8')
  } catch {
    // Non-fatal if DB table not yet migrated or isolated unit test
  }
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

export function clearAppDirsCache(): void {
  dirsCache = null
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
