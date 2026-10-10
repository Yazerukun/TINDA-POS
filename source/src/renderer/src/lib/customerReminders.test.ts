import { describe, it, expect } from 'vitest'
import {
  parseCustomerNotes,
  serializeCustomerNotes,
  calculateReminderStatus,
  type CustomerReminder
} from '../../../shared/customerReminders'

describe('Customer Utang Reminders & Notes Engine', () => {
  it('parses legacy plain text notes gracefully without error', () => {
    const raw = 'Suki since 2024. Pays every Friday.'
    const reminder = parseCustomerNotes(raw)

    expect(reminder.due_date).toBeNull()
    expect(reminder.notes).toBeNull()
    expect(reminder.general_notes).toBe('Suki since 2024. Pays every Friday.')
  })

  it('parses null and empty notes gracefully', () => {
    const reminderNull = parseCustomerNotes(null)
    expect(reminderNull.due_date).toBeNull()
    expect(reminderNull.notes).toBeNull()
    expect(reminderNull.general_notes).toBeNull()

    const reminderEmpty = parseCustomerNotes('   ')
    expect(reminderEmpty.due_date).toBeNull()
    expect(reminderEmpty.notes).toBeNull()
    expect(reminderEmpty.general_notes).toBeNull()
  })

  it('parses structured JSON metadata notes accurately', () => {
    const payload = JSON.stringify({
      __tinda_reminder__: true,
      due_date: '2026-10-15',
      notes: 'Promise to pay 50% after payday',
      general_notes: 'Owner of nearby laundry shop'
    })

    const reminder = parseCustomerNotes(payload)
    expect(reminder.due_date).toBe('2026-10-15')
    expect(reminder.notes).toBe('Promise to pay 50% after payday')
    expect(reminder.general_notes).toBe('Owner of nearby laundry shop')
  })

  it('serializes reminder into JSON string and preserves general notes fallback', () => {
    const reminder: CustomerReminder = {
      due_date: '2026-10-20',
      notes: 'Will settle balance upon salary arrival',
      general_notes: 'Regular suki customer',
      updated_at: '2026-10-10T09:00:00.000Z'
    }

    const serialized = serializeCustomerNotes(reminder)
    expect(serialized).toContain('__tinda_reminder__')
    expect(serialized).toContain('2026-10-20')
    expect(serialized).toContain('Will settle balance upon salary arrival')

    // Round-trip verification
    const parsed = parseCustomerNotes(serialized)
    expect(parsed.due_date).toBe('2026-10-20')
    expect(parsed.notes).toBe('Will settle balance upon salary arrival')
    expect(parsed.general_notes).toBe('Regular suki customer')
  })

  it('returns plain text when no due date or reminder note is set', () => {
    const reminder: CustomerReminder = {
      due_date: null,
      notes: null,
      general_notes: 'Just simple notes',
      updated_at: '2026-10-10T09:00:00.000Z'
    }

    const serialized = serializeCustomerNotes(reminder)
    expect(serialized).toBe('Just simple notes')
  })

  describe('calculateReminderStatus()', () => {
    it('returns SETTLED if customer balance is 0 or negative', () => {
      const status = calculateReminderStatus('2026-10-01', 0)
      expect(status.status).toBe('SETTLED')
      expect(status.badgeText).toBe('Settled')
      expect(status.isAttentionRequired).toBe(false)
    })

    it('returns NONE if no due date is provided with balance', () => {
      const status = calculateReminderStatus(null, 50000)
      expect(status.status).toBe('NONE')
      expect(status.badgeText).toBe('No Due Date')
      expect(status.isAttentionRequired).toBe(false)
    })

    it('calculates DUE_TODAY when due date matches current date', () => {
      const today = new Date()
      const yyyy = today.getFullYear()
      const mm = String(today.getMonth() + 1).padStart(2, '0')
      const dd = String(today.getDate()).padStart(2, '0')
      const todayStr = `${yyyy}-${mm}-${dd}`

      const status = calculateReminderStatus(todayStr, 75000)
      expect(status.status).toBe('DUE_TODAY')
      expect(status.badgeText).toBe('Due Today')
      expect(status.daysDiff).toBe(0)
      expect(status.isAttentionRequired).toBe(true)
    })

    it('calculates OVERDUE when due date is in the past', () => {
      const past = new Date()
      past.setDate(past.getDate() - 3)
      const yyyy = past.getFullYear()
      const mm = String(past.getMonth() + 1).padStart(2, '0')
      const dd = String(past.getDate()).padStart(2, '0')
      const pastStr = `${yyyy}-${mm}-${dd}`

      const status = calculateReminderStatus(pastStr, 120000)
      expect(status.status).toBe('OVERDUE')
      expect(status.badgeText).toBe('Overdue (3d ago)')
      expect(status.daysDiff).toBe(-3)
      expect(status.isAttentionRequired).toBe(true)
    })

    it('calculates UPCOMING when due date is in the future', () => {
      const future = new Date()
      future.setDate(future.getDate() + 5)
      const yyyy = future.getFullYear()
      const mm = String(future.getMonth() + 1).padStart(2, '0')
      const dd = String(future.getDate()).padStart(2, '0')
      const futureStr = `${yyyy}-${mm}-${dd}`

      const status = calculateReminderStatus(futureStr, 35000)
      expect(status.status).toBe('UPCOMING')
      expect(status.badgeText).toBe('Due in 5d')
      expect(status.daysDiff).toBe(5)
      expect(status.isAttentionRequired).toBe(false)
    })
  })
})
