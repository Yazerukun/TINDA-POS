import { describe, expect, it } from 'vitest'
import { buildBackupFile, computeChecksum, parseBackupFile, serializeBackupFile } from '../tindaBackup/format'
import { supportedCanonicalTables, unsupportedFieldsReport, validateBackupFile, verifyChecksum } from '../tindaBackup/validate'
import type { TindaBackupData } from '../tindaBackup/types'

function sampleData(): TindaBackupData {
  return {
    settings: { store_name: 'Ian Store' },
    tables: [
      { name: 'products', rows: [{ id: 1, name: 'Coke', base_unit: 'bottle', default_price_c: 2000 }] },
      { name: 'users', rows: [{ id: 1, username: 'admin', full_name: 'Admin' }] }
    ]
  }
}

describe('tinda-backup format', () => {
  it('round-trips serialize/parse', async () => {
    const file = await buildBackupFile(sampleData(), { platform: 'windows', appVersion: '1.0.18', schemaVersion: 1 })
    expect(parseBackupFile(serializeBackupFile(file)).manifest.format).toBe('tinda-pos-backup')
  })

  it('checksum is deterministic and detects tampering', async () => {
    const a = await buildBackupFile(sampleData(), { platform: 'windows', appVersion: '1.0.18', schemaVersion: 1 })
    const b = await buildBackupFile(sampleData(), { platform: 'windows', appVersion: '1.0.18', schemaVersion: 1 })
    expect(a.checksum).toBe(b.checksum)
    const tampered = structuredClone(a)
    tampered.data.tables[0]!.rows = [{ id: 1, name: 'Pepsi' }]
    tampered.data.tables[0]!.name = 'products'
    expect(await verifyChecksum(tampered)).toBe(false)
  })

  it('validate flags unknown tables, bad rows, and future schema', async () => {
    const good = await buildBackupFile(sampleData(), { platform: 'windows', appVersion: '1.0.18', schemaVersion: 1 })
    expect(validateBackupFile(good).ok).toBe(true)

    const bad = await buildBackupFile(
      {
        settings: null,
        tables: [
          { name: 'nope', rows: [{ id: 1 }] },
          { name: 'users', rows: [{ id: 'abc' }] }
        ]
      },
      { platform: 'android', appVersion: '1.0.22', schemaVersion: 99 }
    )
    const result = validateBackupFile(bad)
    expect(result.ok).toBe(false)
    expect(result.issues.some((i) => i.code === 'unknown-table')).toBe(true)
    expect(result.issues.some((i) => i.code === 'bad-id')).toBe(true)
    expect(result.issues.some((i) => i.code === 'future-schema')).toBe(true)
  })

  it('unsupportedFieldsReport lists android-missing canonical tables', async () => {
    const file = await buildBackupFile(
      {
        settings: null,
        tables: [
          { name: 'products', rows: [{ id: 1, name: 'Coke' }] },
          { name: 'product_units', rows: [{ id: 1, product_id: 1, name: 'case' }] }
        ]
      },
      { platform: 'windows', appVersion: '1.0.18', schemaVersion: 1 }
    )
    const report = unsupportedFieldsReport(file, 'android')
    expect(report.unsupportedTables.some((u) => u.name === 'product_units')).toBe(true)
    expect(report.unsupportedTables.some((u) => u.name === 'products')).toBe(false)
  })

  it('supportedCanonicalTables covers both platforms', () => {
    expect(supportedCanonicalTables('windows').has('product_units')).toBe(true)
    expect(supportedCanonicalTables('android').has('stock_batches')).toBe(true)
    expect(supportedCanonicalTables('android').has('product_units')).toBe(false)
  })

  it('computeChecksum is stable regardless of key order', async () => {
    const a = await buildBackupFile(sampleData(), { platform: 'windows', appVersion: '1.0.18', schemaVersion: 1 })
    const reordered = parseBackupFile(serializeBackupFile(a))
    expect(await computeChecksum(reordered.data)).toBe(a.checksum)
  })
})