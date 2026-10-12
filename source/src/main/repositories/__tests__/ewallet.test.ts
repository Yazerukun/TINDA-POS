import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import Database from 'better-sqlite3'
import { runMigrations } from '../../database/migrations'
import {
  recordEwalletTransaction,
  deleteEwalletTransaction,
  listEwalletTransactions,
  getEwalletShiftSummary,
  saveEwalletAudit,
  listEwalletAudits,
  deleteEwalletAudit,
  clearAllEwalletAudits
} from '../ewallet'

describe('ewallet repository (GCash, Maya & 3-Way Audit)', () => {
  let db: Database.Database
  const userId = 1

  beforeEach(() => {
    db = new Database(':memory:')
    runMigrations(db)
    // Seed initial user and open shift
    db.prepare("INSERT INTO users (id, username, password_hash, pin_hash, full_name, is_active) VALUES (1, 'admin', 'hash', 'pin', 'Admin Owner', 1)").run()
    db.prepare("INSERT INTO shifts (id, user_id, starting_cash_c, status, opened_at) VALUES (1, 1, 500000, 'OPENED', datetime('now'))").run()
  })

  afterEach(() => {
    db.close()
  })

  it('records a GCash Cash In transaction and updates drawer delta correctly', () => {
    const tx = recordEwalletTransaction(db, userId, {
      channel: 'GCASH',
      type: 'CASH_IN',
      amount_c: 100000, // ₱1,000.00
      fee_c: 1500,      // ₱15.00
      reference_no: 'REF-GCASH-001',
      customer_name: 'Juan Dela Cruz',
      customer_phone: '09171234567',
      fee_collected_via: 'CASH',
      notes: 'Load cash in'
    })

    expect(tx.id).toBeGreaterThan(0)
    expect(tx.channel).toBe('GCASH')
    expect(tx.type).toBe('CASH_IN')
    expect(tx.amount_c).toBe(100000)
    expect(tx.fee_c).toBe(1500)
    expect(tx.reference_no).toBe('REF-GCASH-001')
    expect(tx.customer_name).toBe('Juan Dela Cruz')

    const summary = getEwalletShiftSummary(db, 1)
    expect(summary.gcash_in_count).toBe(1)
    expect(summary.gcash_in_amount_c).toBe(100000)
    expect(summary.gcash_in_fees_c).toBe(1500)
    expect(summary.total_fees_c).toBe(1500)
    // Physical cash drawer gained: ₱1,000 + ₱15 fee = ₱1,015 (101500 cents)
    expect(summary.net_cash_drawer_delta_c).toBe(101500)
  })

  it('records a Maya Cash Out transaction with custom fee and updates drawer delta', () => {
    const tx = recordEwalletTransaction(db, userId, {
      channel: 'MAYA',
      type: 'CASH_OUT',
      amount_c: 50000, // ₱500.00
      fee_c: 1000,     // ₱10.00
      reference_no: 'REF-MAYA-002',
      customer_name: 'Maria Clara',
      fee_collected_via: 'CASH'
    })

    expect(tx.channel).toBe('MAYA')
    expect(tx.type).toBe('CASH_OUT')

    const summary = getEwalletShiftSummary(db, 1)
    expect(summary.maya_out_count).toBe(1)
    expect(summary.maya_out_amount_c).toBe(50000)
    expect(summary.maya_out_fees_c).toBe(1000)
    expect(summary.total_fees_c).toBe(1000)
    // Physical cash released: ₱500 - ₱10 fee kept = -₱490 (-49000 cents)
    expect(summary.net_cash_drawer_delta_c).toBe(-49000)
  })

  it('computes 3-Way Audit accurately (Physical Cash, GCash wallet & Maya wallet)', () => {
    // 1. Customer Cash In: ₱1,000 via GCash (fee ₱15)
    recordEwalletTransaction(db, userId, {
      channel: 'GCASH',
      type: 'CASH_IN',
      amount_c: 100000,
      fee_c: 1500,
      fee_collected_via: 'CASH'
    })

    // 2. Customer Cash Out: ₱500 via Maya (fee ₱10)
    recordEwalletTransaction(db, userId, {
      channel: 'MAYA',
      type: 'CASH_OUT',
      amount_c: 50000,
      fee_c: 1000,
      fee_collected_via: 'CASH'
    })

    const summary = getEwalletShiftSummary(db, 1)
    expect(summary.total_fees_c).toBe(2500) // ₱25.00 total tubo

    // Perform End of Day Audit
    // Starting balances:
    // Physical cash drawer: Expected ₱5,000, counted ₱5,000 (BALANCED)
    // GCash: Starting ₱5,000. Sent ₱1,000 to customer. Expected: ₱4,000. Actual on app: ₱4,000 (Diff: 0)
    // Maya: Starting ₱2,000. Received ₱500 from customer. Expected: ₱2,500. Actual on app: ₱2,500 (Diff: 0)
    const audit = saveEwalletAudit(db, userId, {
      shift_id: 1,
      expected_cash_c: 500000,
      actual_cash_c: 500000,
      denominations: [5, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      starting_gcash_c: 500000,
      actual_gcash_c: 400000,
      starting_maya_c: 200000,
      actual_maya_c: 250000,
      notes: 'End of shift audit'
    })

    expect(audit.cash_status).toBe('BALANCED')
    expect(audit.cash_difference_c).toBe(0)
    expect(audit.expected_gcash_c).toBe(400000)
    expect(audit.gcash_difference_c).toBe(0)
    expect(audit.expected_maya_c).toBe(250000)
    expect(audit.maya_difference_c).toBe(0)
    expect(audit.total_fees_c).toBe(2500)

    const audits = listEwalletAudits(db)
    expect(audits.length).toBe(1)
  })

  it('deletes an ewallet transaction cleanly', () => {
    const tx = recordEwalletTransaction(db, userId, {
      channel: 'GCASH',
      type: 'CASH_IN',
      amount_c: 20000,
      fee_c: 500
    })

    const deleted = deleteEwalletTransaction(db, tx.id)
    expect(deleted).toBe(true)

    const list = listEwalletTransactions(db, { shift_id: 1 })
    expect(list.length).toBe(0)
  })

  it('records MariBank Cash In & Cash Out transactions and reconciles in 4-way audit', () => {
    // 1. MariBank Cash In: customer gives ₱2,000 physical cash, store sends ₱2,000 MariBank load, fee ₱20 cash
    const txIn = recordEwalletTransaction(db, userId, {
      channel: 'MARIBANK',
      type: 'CASH_IN',
      amount_c: 200000,
      fee_c: 2000,
      reference_no: 'REF-MB-001',
      customer_name: 'Carlos Yulo',
      fee_collected_via: 'CASH'
    })
    expect(txIn.id).toBeGreaterThan(0)
    expect(txIn.channel).toBe('MARIBANK')

    // 2. MariBank Cash Out: customer sends ₱1,000 MariBank load, cashier releases ₱1,000 physical cash, fee ₱15 cash
    const txOut = recordEwalletTransaction(db, userId, {
      channel: 'MARIBANK',
      type: 'CASH_OUT',
      amount_c: 100000,
      fee_c: 1500,
      reference_no: 'REF-MB-002',
      customer_name: 'EJ Obiena',
      fee_collected_via: 'CASH'
    })
    expect(txOut.id).toBeGreaterThan(0)
    expect(txOut.channel).toBe('MARIBANK')

    const summary = getEwalletShiftSummary(db, 1)
    expect(summary.maribank_in_count).toBe(1)
    expect(summary.maribank_in_amount_c).toBe(200000)
    expect(summary.maribank_in_fees_c).toBe(2000)
    expect(summary.maribank_out_count).toBe(1)
    expect(summary.maribank_out_amount_c).toBe(100000)
    expect(summary.maribank_out_fees_c).toBe(1500)
    expect(summary.total_fees_c).toBe(3500)

    // Drawer gained from in (+2,000 + 20) = +2,020. Drawer lost from out (-1,000 + 15) = -985. Net = +1,035 (103500 cents)
    expect(summary.net_cash_drawer_delta_c).toBe(103500)

    // Multi-wallet audit snapshot with MariBank
    // Starting MariBank: ₱10,000 (1000000 cents). Sent: ₱2,000. Received: ₱1,000. Expected: ₱9,000 (900000 cents). Actual on app: ₱9,000.
    const audit = saveEwalletAudit(db, userId, {
      shift_id: 1,
      expected_cash_c: 500000,
      actual_cash_c: 500000,
      denominations: [5, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      starting_gcash_c: 100000,
      actual_gcash_c: 100000,
      starting_maya_c: 100000,
      actual_maya_c: 100000,
      starting_maribank_c: 1000000,
      actual_maribank_c: 900000,
      notes: 'MariBank balanced shift'
    })

    expect(audit.starting_maribank_c).toBe(1000000)
    expect(audit.maribank_in_c).toBe(200000)
    expect(audit.maribank_out_c).toBe(100000)
    expect(audit.expected_maribank_c).toBe(900000)
    expect(audit.actual_maribank_c).toBe(900000)
    expect(audit.maribank_difference_c).toBe(0)
  })

  it('deletes an individual audit record and clears all audits correctly', () => {
    const audit1 = saveEwalletAudit(db, userId, {
      expected_cash_c: 10000,
      actual_cash_c: 10000,
      denominations: [],
      starting_gcash_c: 0,
      actual_gcash_c: 0,
      starting_maya_c: 0,
      actual_maya_c: 0
    })

    const audit2 = saveEwalletAudit(db, userId, {
      expected_cash_c: 20000,
      actual_cash_c: 20000,
      denominations: [],
      starting_gcash_c: 0,
      actual_gcash_c: 0,
      starting_maya_c: 0,
      actual_maya_c: 0
    })

    let audits = listEwalletAudits(db)
    expect(audits).toHaveLength(2)

    // Delete audit1
    const deleted = deleteEwalletAudit(db, audit1.id)
    expect(deleted).toBe(true)

    audits = listEwalletAudits(db)
    expect(audits).toHaveLength(1)
    expect(audits[0]?.id).toBe(audit2.id)

    // Clear all audits
    const cleared = clearAllEwalletAudits(db)
    expect(cleared).toBe(1)
    expect(listEwalletAudits(db)).toHaveLength(0)
  })

  it('isolates summary to today only, excluding transactions from previous days', () => {
    // 1. Transaction from yesterday
    db.prepare(`
      INSERT INTO ewallet_transactions (
        shift_id, user_id, channel, type, amount_c, fee_c, fee_collected_via, created_at
      ) VALUES (
        1, 1, 'GCASH', 'CASH_IN', 50000, 1000, 'CASH', datetime('now', '-1 day')
      )
    `).run()

    // 2. Transaction from today
    db.prepare(`
      INSERT INTO ewallet_transactions (
        shift_id, user_id, channel, type, amount_c, fee_c, fee_collected_via, created_at
      ) VALUES (
        1, 1, 'GCASH', 'CASH_IN', 100000, 1500, 'CASH', datetime('now')
      )
    `).run()

    const summary = getEwalletShiftSummary(db, 1)
    // Only today's ₱1,000 + ₱15 fee should be counted; yesterday's ₱500 is excluded
    expect(summary.gcash_in_count).toBe(1)
    expect(summary.gcash_in_amount_c).toBe(100000)
    expect(summary.gcash_in_fees_c).toBe(1500)
    expect(summary.total_fees_c).toBe(1500)
  })
})

