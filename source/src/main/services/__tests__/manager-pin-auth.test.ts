import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

let dataDir: string

beforeAll(() => {
  dataDir = mkdtempSync(join(tmpdir(), 'tinda-mgr-pin-'))
  process.env.TINDA_DATA_DIR = dataDir
})
afterAll(() => {
  try { closeDb() } catch { /* ignore */ }
  try { rmSync(dataDir, { recursive: true, force: true }) } catch { /* ignore */ }
})

import { completeSetup, verifyManagerPin, loginPin } from '../auth'
import { getSession } from '../session'
import { getDb, closeDb } from '../../database/connection'
import { createUser } from '../../repositories/users'
import { hashSecret } from '../../security/passwords'

describe('Manager PIN verification for custom cart pricing & discounts', () => {
  it('authorizes admin/manager PINs and rejects cashier PINs without mutating session', () => {
    const db = getDb()

    // 1. Initial setup with Admin (PIN 1234)
    completeSetup({
      store: { store_name: 'Hardware Store Test', address: 'Cebu' },
      admin: { username: 'admin', password: 'password123', pin: '1234', full_name: 'Boss Manager' },
      receipt: { footer: 'Thank you' },
      data_dir: dataDir,
      load_demo: false
    })

    // 2. Create a Cashier user (PIN 9999)
    createUser(db, {
      username: 'cashier1',
      passwordHash: hashSecret('cashierpass'),
      pinHash: hashSecret('9999'),
      full_name: 'Cashier Staff',
      roles: ['CASHIER']
    })

    // 3. Create another Manager user (PIN 5555)
    createUser(db, {
      username: 'manager2',
      passwordHash: hashSecret('managerpass'),
      pinHash: hashSecret('5555'),
      full_name: 'Floor Manager',
      roles: ['MANAGER']
    })

    // Cashier logs in
    loginPin('9999')
    const activeSessionBefore = getSession()
    expect(activeSessionBefore?.username).toBe('cashier1')

    // Test: Invalid PIN
    const invalidResult = verifyManagerPin('0000')
    expect(invalidResult.valid).toBe(false)

    // Test: Cashier PIN entered for authorization (should fail because role is CASHIER)
    const cashierResult = verifyManagerPin('9999')
    expect(cashierResult.valid).toBe(false)

    // Test: Admin PIN (1234) entered for authorization (should succeed)
    const adminResult = verifyManagerPin('1234')
    expect(adminResult.valid).toBe(true)
    expect(adminResult.name).toBe('Boss Manager')

    // Test: Floor Manager PIN (5555) entered for authorization (should succeed)
    const managerResult = verifyManagerPin('5555')
    expect(managerResult.valid).toBe(true)
    expect(managerResult.name).toBe('Floor Manager')

    // Invariant: Session is NOT changed to the manager, cashier remains logged in!
    const activeSessionAfter = getSession()
    expect(activeSessionAfter?.username).toBe('cashier1')
  })
})
