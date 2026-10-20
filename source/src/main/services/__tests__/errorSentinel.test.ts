import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import Database from 'better-sqlite3'
import {
  ensureErrorLogsTable,
  recordSystemError,
  recordBreadcrumb,
  getRecentBreadcrumbs,
  getDiagnosticReport,
  autoFixSystem,
  clearErrorLogs,
  generateErrorSignature,
  getPlainSummary
} from '../errorSentinel'

describe('TINDA Sentinel — System Health & Error Tracer Service', () => {
  let db: Database.Database

  beforeEach(() => {
    db = new Database(':memory:')
    db.pragma('journal_mode = WAL')
    ensureErrorLogsTable(db)

    // Seed mock products table to test barcode auto-fix
    db.exec(`
      CREATE TABLE IF NOT EXISTS products (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        barcode TEXT,
        status TEXT NOT NULL DEFAULT 'ACTIVE'
      );
    `)
  })

  afterEach(() => {
    db.close()
  })

  it('generates consistent error signatures for clustering', () => {
    const sig1 = generateErrorSignature('DATABASE', 'UNIQUE constraint failed: products.barcode 12345', 'Error\n    at query (db.ts:42)')
    const sig2 = generateErrorSignature('DATABASE', 'UNIQUE constraint failed: products.barcode 99999', 'Error\n    at query (db.ts:42)')
    expect(sig1).toBe(sig2)
  })

  it('translates technical errors to plain English/Bisaya summaries', () => {
    const summary1 = getPlainSummary('UNIQUE constraint failed: products.barcode', 'DATABASE')
    expect(summary1).toContain('Duplicate Barcode')

    const summary2 = getPlainSummary('database is locked', 'DATABASE')
    expect(summary2).toContain('SQLite Busy')

    const summary3 = getPlainSummary('Thermal printer timeout', 'HARDWARE')
    expect(summary3).toContain('Thermal Printer Alert')
  })

  it('records errors and automatically deduplicates with frequency counter', () => {
    const err1 = recordSystemError(db, {
      severity: 'ERROR',
      subsystem: 'DATABASE',
      message: 'UNIQUE constraint failed: products.barcode',
      stack: 'Error\n    at save (products.ts:280)'
    })
    expect(err1.id).toBeGreaterThan(0)
    expect(err1.count).toBe(1)

    // Second identical error should increment count rather than insert duplicate row
    const err2 = recordSystemError(db, {
      severity: 'ERROR',
      subsystem: 'DATABASE',
      message: 'UNIQUE constraint failed: products.barcode',
      stack: 'Error\n    at save (products.ts:280)'
    })
    expect(err2.id).toBe(err1.id)
    expect(err2.count).toBe(2)

    const row = db.prepare('SELECT count FROM system_error_logs WHERE id = ?').get(err1.id) as { count: number }
    expect(row.count).toBe(2)
  })

  it('maintains rolling action breadcrumbs', () => {
    recordBreadcrumb('action', 'User clicked Checkout')
    recordBreadcrumb('scan', 'Scanned Barcode 123456')

    const crumbs = getRecentBreadcrumbs()
    expect(crumbs.length).toBeGreaterThanOrEqual(2)
    expect(crumbs[crumbs.length - 1]?.message).toBe('Scanned Barcode 123456')
  })

  it('generates a comprehensive diagnostic report and ready-to-paste markdown for Jin', () => {
    recordSystemError(db, {
      severity: 'WARNING',
      subsystem: 'HARDWARE',
      message: 'Thermal printer response timeout'
    })

    const report = getDiagnosticReport(db)
    expect(report.healthScore).toBeGreaterThan(0)
    expect(report.database.quickCheck).toBe('ok')
    expect(report.errorStats.totalErrors).toBe(1)
    expect(report.formattedMarkdownReport).toContain('TINDA POS DIAGNOSTIC REPORT')
    expect(report.formattedMarkdownReport).toContain('Thermal printer response timeout')
  })

  it('executes 1-click auto-fix and self-heals system and database locks', () => {
    // Insert an archived product that collides with an active product barcode
    db.prepare("INSERT INTO products (name, barcode, status) VALUES ('Coke Active', '111', 'ACTIVE')").run()
    db.prepare("INSERT INTO products (name, barcode, status) VALUES ('Coke Old', '111', 'ARCHIVED')").run()

    recordSystemError(db, {
      severity: 'ERROR',
      subsystem: 'DATABASE',
      message: 'Barcode collision'
    })

    const result = autoFixSystem(db)
    expect(result.ok).toBe(true)
    expect(result.actionsTaken.length).toBeGreaterThan(0)

    // Check that archived barcode was auto-freed
    const archived = db.prepare("SELECT barcode FROM products WHERE name = 'Coke Old'").get() as { barcode: string | null }
    expect(archived.barcode).toBeNull()

    // Check that error was resolved
    const unresolved = db.prepare('SELECT COUNT(*) as c FROM system_error_logs WHERE resolved_at IS NULL').get() as { c: number }
    expect(unresolved.c).toBe(0)
  })

  it('clears error logs on request', () => {
    recordSystemError(db, {
      severity: 'INFO',
      subsystem: 'IPC',
      message: 'Test log'
    })
    clearErrorLogs(db)
    const count = db.prepare('SELECT COUNT(*) as c FROM system_error_logs').get() as { c: number }
    expect(count.c).toBe(0)
  })
})
