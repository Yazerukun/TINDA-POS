import type { BackupInfo } from '@shared/types'
import Database from 'better-sqlite3'
import { copyFileSync, existsSync, mkdirSync, rmSync } from 'node:fs'
import { dirname } from 'node:path'
import { app } from 'electron'
import { clearAppDirsCache, closeDb, dataLocationInfo, getDb } from '../database/connection'
import { createBackupSync, resetDatabase, validateBackupDatabase } from '../repositories/backup'
import { requirePermission } from './session'
import { runMigrations } from '../database/migrations'
import { writeModeFile } from '../database/dataLocation'

/** Security boundary for destructive database administration. */
export function resetActiveDatabase(confirmation: string): BackupInfo {
  requirePermission('settings:manage')
  return resetDatabase(getDb(), confirmation)
}

export function startNewStore(confirmation: string): BackupInfo {
  requirePermission('settings:manage')
  if (confirmation !== 'NEW STORE') throw new Error('Type NEW STORE exactly to confirm.')
  return replaceActiveDatabaseWithFresh('BEFORE_NEW_STORE')
}

function replaceActiveDatabaseWithFresh(kind: string): BackupInfo {
  const active = getDb()
  const safety = createBackupSync(active, kind)
  validateBackupDatabase(safety.path)
  const file = dataLocationInfo().databaseFile
  closeDb()
  try {
    rmSync(`${file}-wal`, { force: true })
    rmSync(`${file}-shm`, { force: true })
    rmSync(file, { force: true })
  } catch (error) {
    if (!existsSync(file)) copyFileSync(safety.path, file)
    throw new Error(`New store creation failed; active data was recovered: ${error instanceof Error ? error.message : String(error)}`)
  }
  return safety
}

export function getDataLocationStatus(): ReturnType<typeof dataLocationInfo> & { sharedHasData: boolean; portableHasData: boolean } {
  const info = dataLocationInfo()
  return {
    ...info,
    sharedHasData: existsSync(`${info.sharedRoot}/database/tindapos.db`),
    portableHasData: Boolean(info.portableRoot && existsSync(`${info.portableRoot}/database/tindapos.db`))
  }
}

function initializeFreshDatabase(file: string): void {
  mkdirSync(dirname(file), { recursive: true })
  const fresh = new Database(file)
  try {
    fresh.pragma('foreign_keys = ON')
    runMigrations(fresh)
    const integrity = fresh.pragma('integrity_check') as { integrity_check: string }[]
    if (integrity.some((row) => row.integrity_check !== 'ok')) throw new Error('Fresh database integrity check failed.')
  } finally {
    fresh.close()
  }
}

export function usePortableData(choice: 'FRESH' | 'COPY'): void {
  requirePermission('settings:manage')
  const info = dataLocationInfo()
  if (!info.portableRoot || !info.portableAvailable) throw new Error('Portable Data is available only from the Portable TINDA POS executable.')
  const target = `${info.portableRoot}/database/tindapos.db`
  if (existsSync(target)) throw new Error('Portable Data already contains a store. Switch to it without overwriting, or move it to a safe location first.')

  const safety = createBackupSync(getDb(), choice === 'COPY' ? 'BEFORE_PORTABLE_COPY' : 'BEFORE_PORTABLE_FRESH')
  validateBackupDatabase(safety.path)
  closeDb()
  try {
    mkdirSync(dirname(target), { recursive: true })
    mkdirSync(`${info.portableRoot}/backups`, { recursive: true })
    if (choice === 'COPY') {
      copyFileSync(safety.path, target)
      validateBackupDatabase(target)
    } else {
      initializeFreshDatabase(target)
    }
    writeModeFile(info.sharedRoot, 'PORTABLE', info.portableRoot)
  } catch (error) {
    rmSync(target, { force: true })
    writeModeFile(info.sharedRoot, 'SHARED')
    clearAppDirsCache()
    getDb()
    throw new Error(`Portable Data activation failed; Shared AppData remains active: ${error instanceof Error ? error.message : String(error)}`)
  }
}

export function useSharedAppData(): void {
  requirePermission('settings:manage')
  const info = dataLocationInfo()
  const sharedFile = `${info.sharedRoot}/database/tindapos.db`
  if (!existsSync(sharedFile)) throw new Error('The Shared AppData database is missing. No data mode change was made.')
  closeDb()
  writeModeFile(info.sharedRoot, 'SHARED')
}

export function relaunchAfterDataChange(): void {
  setTimeout(() => {
    if (process.env.PORTABLE_EXECUTABLE_FILE) {
      app.relaunch({ execPath: process.env.PORTABLE_EXECUTABLE_FILE })
    } else {
      app.relaunch()
    }
    app.exit(0)
  }, 500)
}
