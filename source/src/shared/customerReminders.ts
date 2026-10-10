export interface CustomerReminder {
  due_date: string | null
  notes: string | null
  general_notes: string | null
  updated_at: string
}

export type ReminderStatus = 'OVERDUE' | 'DUE_TODAY' | 'UPCOMING' | 'SETTLED' | 'NONE'

export interface ReminderStatusInfo {
  status: ReminderStatus
  daysDiff: number
  badgeText: string
  colorClass: string
  badgeBg: string
  isAttentionRequired: boolean
}

export const REMINDERS_STORAGE_KEY = 'tinda_customer_reminders_v1'

/**
 * Safely parse customer notes field.
 * Supports backward-compatible plain strings as well as structured JSON metadata.
 */
export function parseCustomerNotes(rawNotes: string | null | undefined): CustomerReminder {
  const fallback: CustomerReminder = {
    due_date: null,
    notes: null,
    general_notes: rawNotes?.trim() || null,
    updated_at: new Date().toISOString()
  }

  if (!rawNotes || typeof rawNotes !== 'string') {
    return fallback
  }

  const trimmed = rawNotes.trim()
  if (!trimmed.startsWith('{') || !trimmed.endsWith('}')) {
    return fallback
  }

  try {
    const parsed = JSON.parse(trimmed) as Record<string, unknown>
    if (parsed && typeof parsed === 'object' && parsed.__tinda_reminder__ === true) {
      return {
        due_date: typeof parsed.due_date === 'string' && parsed.due_date ? parsed.due_date : null,
        notes: typeof parsed.notes === 'string' && parsed.notes ? parsed.notes : null,
        general_notes: typeof parsed.general_notes === 'string' && parsed.general_notes ? parsed.general_notes : null,
        updated_at: typeof parsed.updated_at === 'string' && parsed.updated_at ? parsed.updated_at : new Date().toISOString()
      }
    }
  } catch {
    // If JSON parsing fails, retain as raw plain notes
  }

  return fallback
}

/**
 * Serialize a customer reminder and notes into a persistent string suitable for SQLite.
 */
export function serializeCustomerNotes(reminder: CustomerReminder): string {
  if (!reminder.due_date && !reminder.notes) {
    return reminder.general_notes || ''
  }

  return JSON.stringify({
    __tinda_reminder__: true,
    due_date: reminder.due_date || null,
    notes: reminder.notes || null,
    general_notes: reminder.general_notes || null,
    updated_at: reminder.updated_at || new Date().toISOString()
  })
}

/**
 * Compute real-time status and days remaining for customer credit balance.
 */
export function calculateReminderStatus(
  dueDateStr: string | null | undefined,
  balanceC: number
): ReminderStatusInfo {
  if (balanceC <= 0) {
    return {
      status: 'SETTLED',
      daysDiff: 0,
      badgeText: 'Settled',
      colorClass: 'text-emerald-400',
      badgeBg: 'bg-emerald-500/10 border-emerald-500/20',
      isAttentionRequired: false
    }
  }

  if (!dueDateStr) {
    return {
      status: 'NONE',
      daysDiff: 0,
      badgeText: 'No Due Date',
      colorClass: 'text-slate-400',
      badgeBg: 'bg-slate-500/10 border-slate-500/20',
      isAttentionRequired: false
    }
  }

  const parts = dueDateStr.split('-').map(Number)
  if (parts.length < 3 || isNaN(parts[0]!) || isNaN(parts[1]!) || isNaN(parts[2]!)) {
    return {
      status: 'NONE',
      daysDiff: 0,
      badgeText: 'No Due Date',
      colorClass: 'text-slate-400',
      badgeBg: 'bg-slate-500/10 border-slate-500/20',
      isAttentionRequired: false
    }
  }

  const [y, m, d] = parts
  const dueDate = new Date(y!, m! - 1, d!)
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())

  const diffMs = dueDate.getTime() - today.getTime()
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24))

  if (diffDays < 0) {
    const overdueDays = Math.abs(diffDays)
    return {
      status: 'OVERDUE',
      daysDiff: diffDays,
      badgeText: `Overdue (${overdueDays}d ago)`,
      colorClass: 'text-rose-400',
      badgeBg: 'bg-rose-500/15 border-rose-500/30 font-semibold',
      isAttentionRequired: true
    }
  } else if (diffDays === 0) {
    return {
      status: 'DUE_TODAY',
      daysDiff: 0,
      badgeText: 'Due Today',
      colorClass: 'text-amber-300',
      badgeBg: 'bg-amber-500/20 border-amber-500/40 font-bold',
      isAttentionRequired: true
    }
  } else {
    return {
      status: 'UPCOMING',
      daysDiff: diffDays,
      badgeText: diffDays === 1 ? 'Due Tomorrow' : `Due in ${diffDays}d`,
      colorClass: 'text-sky-300',
      badgeBg: 'bg-sky-500/15 border-sky-500/30',
      isAttentionRequired: false
    }
  }
}

/**
 * Retrieve all client-side cached customer reminders.
 */
export function getLocalCustomerReminders(): Record<number, CustomerReminder> {
  if (typeof globalThis === 'undefined') return {}
  const g = globalThis as unknown as { localStorage?: { getItem: (k: string) => string | null } }
  if (!g.localStorage) return {}
  try {
    const raw = g.localStorage.getItem(REMINDERS_STORAGE_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

/**
 * Persist client-side customer reminder with immediate broadcast.
 */
export function saveLocalCustomerReminder(customerId: number, reminder: CustomerReminder): void {
  if (typeof globalThis === 'undefined') return
  const g = globalThis as unknown as {
    localStorage?: { setItem: (k: string, v: string) => void }
    dispatchEvent?: (e: unknown) => boolean
    CustomEvent?: new (type: string, eventInitDict?: { detail?: unknown }) => unknown
  }
  if (!g.localStorage) return
  try {
    const all = getLocalCustomerReminders()
    all[customerId] = reminder
    g.localStorage.setItem(REMINDERS_STORAGE_KEY, JSON.stringify(all))
    if (typeof g.dispatchEvent === 'function' && typeof g.CustomEvent === 'function') {
      g.dispatchEvent(new g.CustomEvent('tinda-utang-reminder-updated', { detail: { customerId, reminder } }))
    }
  } catch {}
}

/**
 * Merge customer notes from database with local storage (dual-store resilience).
 */
export function getMergedCustomerReminder(customer: {
  id: number
  notes?: string | null
  balance_c: number
}): { reminder: CustomerReminder; statusInfo: ReminderStatusInfo } {
  const fromDb = parseCustomerNotes(customer.notes)
  const localMap = getLocalCustomerReminders()
  const fromLocal = localMap[customer.id]

  // Prefer more recently updated source
  let reminder = fromDb
  if (fromLocal) {
    if (!fromDb.due_date && fromLocal.due_date) {
      reminder = { ...fromDb, due_date: fromLocal.due_date, notes: fromLocal.notes || fromDb.notes }
    } else if (new Date(fromLocal.updated_at).getTime() > new Date(fromDb.updated_at).getTime()) {
      reminder = fromLocal
    }
  }

  const statusInfo = calculateReminderStatus(reminder.due_date, customer.balance_c)
  return { reminder, statusInfo }
}
