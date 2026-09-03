import type Database from 'better-sqlite3'
import type { BackupInfo } from '@shared/types'
import { appDirs, closeDb } from '../database/connection'
import { existsSync, copyFileSync, mkdirSync, openSync, readSync, readdirSync, statSync, closeSync } from 'node:fs'
import { join, basename, resolve } from 'node:path'
import { getSettings } from './settings'

export const SQLITE_MAGIC = 'SQLite format 3\x00'

export function timestamp(): string {
  const d = new Date()
  const p = (n: number, l = 2) => String(n).padStart(l, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}`
}

export function backupDir(): string {
  const { backups } = appDirs()
  if (!existsSync(backups)) mkdirSync(backups, { recursive: true })
  return backups
}

const BACKUP_PREFIX = 'tindapos-'

export function isValidBackupFile(file: string | Buffer): boolean {
  const buf = Buffer.isBuffer(file) ? file : Buffer.from(file)
  return buf.length >= 16 && buf.subarray(0, 16).toString('latin1') === SQLITE_MAGIC
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

export function restoreBackup(db: Database.Database, filename: string): string {
  const src = join(backupDir(), basename(filename))
  if (!existsSync(src)) throw new Error('Backup file not found.')
  const head = Buffer.alloc(16)
  const fd = openSync(src, 'r')
  readSync(fd, head, 0, 16, 0)
  closeSync(fd)
  if (!isValidBackupFile(head)) throw new Error('Not a valid SQLite backup file.')

  // Safety backup of the current database before overwriting.
  createBackupSync(db, 'BEFORE_RESTORE')

  const { database } = appDirs()
  const dest = join(database, 'tindapos.db')
  // Close and clear the cached connection so the next getDb() reopens the
  // restored file. Using closeDb() (not db.close()) also nulls the module
  // cache; otherwise the reopened handle stays a closed object and every
  // subsequent call fails with "The database connection is not open".
  closeDb()
  copyFileSync(src, dest)
  return dest
}
