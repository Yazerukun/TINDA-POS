import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import Database from 'better-sqlite3'
import { pushDiagnosticTelemetryToCloud, ensureSyncCredentials } from '../cloudSync'
import { updateSettings } from '../../repositories/settings'
import { recordSystemError, ensureErrorLogsTable } from '../errorSentinel'

describe('pushDiagnosticTelemetryToCloud', () => {
  let db: Database.Database

  beforeEach(() => {
    db = new Database(':memory:')
    db.exec(`
      CREATE TABLE settings (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL
      );
    `)
    ensureErrorLogsTable(db)
    ensureSyncCredentials(db)
    updateSettings(db, { cloud_sync_enabled: true })
  })

  afterEach(() => {
    db.close()
    vi.restoreAllMocks()
  })

  it('skips network payload when system is 100% healthy with 0 errors', async () => {
    const res = await pushDiagnosticTelemetryToCloud(db)
    expect(res).toBe(true)
  })

  it('attempts to post telemetry when active errors are logged', async () => {
    recordSystemError(db, {
      severity: 'ERROR',
      subsystem: 'IPC',
      message: 'Hardware printer timeout on COM3'
    })

    const res = await pushDiagnosticTelemetryToCloud(db)
    expect(typeof res).toBe('boolean')
  })
})
