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

function insertTableRows(db: Database.Database, name: string, rows: Record<string, unknown>[]): number {
  if (rows.length === 0) return 0
  const columns = Array.from(new Set(rows.flatMap((r) => Object.keys(r))))
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
  const counts: Record<string, number> = {}
  return db.transaction(() => {
    for (let i = CANONICAL_TABLES.length - 1; i >= 0; i--) {
      const name = CANONICAL_TABLES[i]!
      if (name === 'settings') continue
      if (byName.has(name)) db.prepare(`DELETE FROM "${name}"`).run()
    }
    for (const name of CANONICAL_TABLES) {
      if (name === 'settings') continue
      const table = byName.get(name)
      if (!table) continue
      counts[name] = insertTableRows(db, name, table.rows)
    }
    return counts
  })()
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

  const counts = db.transaction(() => {
    const c = applyCanonicalTables(db, file.data.tables)
    if (file.data.settings) {
      db.prepare('DELETE FROM settings').run()
      const rows = Object.entries(file.data.settings).map(([key, value]) => ({
        key,
        value: typeof value === 'string' ? value : JSON.stringify(value)
      }))
      insertTableRows(db, 'settings', rows)
    }
    const integrity = db.pragma('integrity_check') as unknown as { integrity_check: string }[]
    const status = integrity[0]?.integrity_check
    if (status !== 'ok') {
      throw new Error(`Database integrity check failed after restore: ${String(status)}`)
    }
    return c
  })()
  return { counts, unsupported }
}