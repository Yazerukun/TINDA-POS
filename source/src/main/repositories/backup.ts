import Database from 'better-sqlite3'
import type { BackupInfo } from '@shared/types'
import { appDirs, closeDb, getDb } from '../database/connection'
import { existsSync, copyFileSync, mkdirSync, openSync, readSync, readdirSync, statSync, closeSync, rmSync, renameSync } from 'node:fs'
import { join, basename, resolve } from 'node:path'
import { getSettings } from './settings'

export const SQLITE_MAGIC = 'SQLite format 3\x00'

export function timestamp(): string {
  const d = new Date()
  const p = (n: number, l = 2) => String(n).padStart(l, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}-${p(d.getMilliseconds(), 3)}`
}

export function backupDir(): string {
  const { backups } = appDirs()
  if (!existsSync(backups)) mkdirSync(backups, { recursive: true })
  return backups
}

const BACKUP_PREFIX = 'tindapos-'

export function cleanupTemporaryDatabase(file: string): void {
  const name = basename(file)
  if (!name.startsWith('.restore-') && !name.startsWith('.rollback-')) throw new Error('Refusing to clean a non-temporary database path.')
  rmSync(file, { force: true })
  rmSync(`${file}-wal`, { force: true })
  rmSync(`${file}-shm`, { force: true })
}

export function isValidBackupFile(file: string | Buffer): boolean {
  const buf = Buffer.isBuffer(file) ? file : Buffer.from(file)
  return buf.length >= 16 && buf.subarray(0, 16).toString('latin1') === SQLITE_MAGIC
}

export function validateBackupDatabase(file: string): void {
  if (!existsSync(file)) throw new Error('Backup file not found.')
  const head = Buffer.alloc(16)
  const fd = openSync(file, 'r')
  try { readSync(fd, head, 0, 16, 0) } finally { closeSync(fd) }
  if (!isValidBackupFile(head)) throw new Error('The selected file is not a valid SQLite database.')

  let candidate: Database.Database | null = null
  try {
    candidate = new Database(file, { readonly: true, fileMustExist: true })
    const result = candidate.pragma('integrity_check') as { integrity_check: string }[]
    if (result.length === 0 || result.some((row) => row.integrity_check !== 'ok')) {
      throw new Error(`SQLite integrity check failed: ${result.map((row) => row.integrity_check).join('; ')}`)
    }
    const required = ['app_migrations', 'settings', 'users', 'products', 'sales']
    const tables = new Set((candidate.prepare("SELECT name FROM sqlite_master WHERE type = 'table'").all() as { name: string }[]).map((row) => row.name))
    const missing = required.filter((table) => !tables.has(table))
    if (missing.length) throw new Error(`Backup is not a TINDA POS database (missing: ${missing.join(', ')}).`)
  } catch (error) {
    if (error instanceof Error && (error.message.startsWith('SQLite integrity') || error.message.startsWith('Backup is not'))) throw error
    throw new Error(`Backup could not be opened: ${error instanceof Error ? error.message : String(error)}`)
  } finally {
    candidate?.close()
  }
}

export async function createBackup(db: Database.Database, kind: 'MANUAL' | 'AUTO' = 'MANUAL'): Promise<BackupInfo> {
  // The SQLite backup API can open the destination with incompatible flags on
  // this platform; the proven, reliable path is a checkpointed file copy.
  return createBackupSync(db, kind)
}

export function createBackupSync(db: Database.Database, kind = 'MANUAL'): BackupInfo {
  const name = `${BACKUP_PREFIX}${timestamp()}.db`
  const dest = join(backupDir(), name)
  db.pragma('wal_checkpoint(TRUNCATE)')
  const { database } = appDirs()
  const src = join(database, 'tindapos.db')
  copyFileSync(src, dest)
  db.prepare(
    `INSERT INTO backup_history (filename, path, size, kind, status) VALUES (?, ?, ?, ?, 'OK')`
  ).run(name, dest, statSync(dest).size, kind)
  mirrorBackup(db, dest, name)
  return { filename: name, path: dest, size: statSync(dest).size, created_at: new Date().toISOString() }
}

/** Mirror into a folder managed by a Windows cloud-sync client. */
export function mirrorBackup(db: Database.Database, source: string, filename: string): void {
  const settings = getSettings(db)
  const configured = settings.backup_location.trim()
  if (!settings.auto_backup_enabled || !configured) return
  const local = resolve(backupDir())
  const remote = resolve(configured)
  if (remote === local) return
  if (!existsSync(remote)) mkdirSync(remote, { recursive: true })
  copyFileSync(source, join(remote, basename(filename)))
}

export function needsDailyBackup(db: Database.Database, now = new Date()): boolean {
  const settings = getSettings(db)
  if (!settings.auto_backup_enabled || !settings.auto_backup_daily) return false
  const day = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
  return !readdirSync(backupDir()).some((file) => file.startsWith(`${BACKUP_PREFIX}${day}-`) && file.endsWith('.db'))
}

export function listBackups(_db: Database.Database): BackupInfo[] {
  const files = readdirSync(backupDir())
    .filter((f) => f.startsWith(BACKUP_PREFIX) && f.endsWith('.db'))
    .map((f) => {
      const path = join(backupDir(), f)
      let size = 0
      let created = ''
      try {
        size = statSync(path).size
        created = statSync(path).mtime.toISOString()
      } catch {
        /* ignore */
      }
      return { filename: f, path, size, created_at: created }
    })
    .sort((a, b) => b.created_at.localeCompare(a.created_at))
  return files
}

export function restoreBackup(db: Database.Database, filename: string, testHooks?: { afterOriginalMoved?: () => void }): string {
  const src = join(backupDir(), basename(filename))
  validateBackupDatabase(src)

  // Safety backup of the current database before overwriting.
  const safety = createBackupSync(db, 'BEFORE_RESTORE')
  validateBackupDatabase(safety.path)

  const { database } = appDirs()
  const dest = join(database, 'tindapos.db')
  const staging = join(database, `.restore-${timestamp()}.db`)
  const rollback = join(database, `.rollback-${timestamp()}.db`)
  copyFileSync(src, staging)
  try {
    validateBackupDatabase(staging)
  } catch (error) {
    cleanupTemporaryDatabase(staging)
    throw error
  }

  // Close and clear the cached connection so the next getDb() reopens the
  // restored file. Using closeDb() (not db.close()) also nulls the module
  // cache; otherwise the reopened handle stays a closed object and every
  // subsequent call fails with "The database connection is not open".
  closeDb()
  try {
    rmSync(`${dest}-wal`, { force: true })
    rmSync(`${dest}-shm`, { force: true })
    if (existsSync(dest)) renameSync(dest, rollback)
    testHooks?.afterOriginalMoved?.()
    renameSync(staging, dest)
    validateBackupDatabase(dest)

    const restored = getDb()
    const integrity = restored.pragma('integrity_check') as { integrity_check: string }[]
    if (integrity.some((row) => row.integrity_check !== 'ok')) throw new Error('Restored database failed verification after reopening.')
    rmSync(rollback, { force: true })
    return dest
  } catch (error) {
    closeDb()
    cleanupTemporaryDatabase(staging)
    rmSync(dest, { force: true })
    try {
      if (existsSync(rollback)) renameSync(rollback, dest)
      else copyFileSync(safety.path, dest)
      validateBackupDatabase(dest)
      getDb()
    } catch (rollbackError) {
      throw new Error(`Restore failed and rollback could not be completed: ${rollbackError instanceof Error ? rollbackError.message : String(rollbackError)}`)
    }
    throw new Error(`Restore failed; the original database was recovered: ${error instanceof Error ? error.message : String(error)}`)
  } finally {
    cleanupTemporaryDatabase(staging)
    cleanupTemporaryDatabase(rollback)
  }
}

/**
 * Archive the live database and remove it so the next launch starts the setup
 * wizard. Backups intentionally remain outside the database directory.
 */
export function resetDatabase(db: Database.Database, confirmation: string): BackupInfo {
  if (confirmation !== 'RESET') throw new Error('Type RESET exactly to confirm.')

  const safetyBackup = createBackupSync(db, 'BEFORE_RESET')
  if (!existsSync(safetyBackup.path) || statSync(safetyBackup.path).size < 16) throw new Error('Safety backup was not created. Reset aborted.')
  validateBackupDatabase(safetyBackup.path)
  const { database } = appDirs()
  const file = join(database, 'tindapos.db')

  closeDb()
  // WAL sidecars normally disappear after close/checkpoint, but remove any
  // leftovers as well so no old pages can be attached to the new database.
  try {
    rmSync(file, { force: true })
    rmSync(`${file}-wal`, { force: true })
    rmSync(`${file}-shm`, { force: true })
  } catch (error) {
    if (!existsSync(file)) copyFileSync(safetyBackup.path, file)
    throw new Error(`Database reset failed; active data was preserved: ${error instanceof Error ? error.message : String(error)}`)
  }
  return safetyBackup
}
