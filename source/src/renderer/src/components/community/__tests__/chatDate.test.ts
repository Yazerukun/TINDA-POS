import { describe, it, expect } from 'vitest'
import {
  parseMessageDate,
  formatChatTimestamp,
  formatFullChatTooltip
} from '../TindaCommunityChat'

describe('Chat Time & Date Formatting', () => {
  it('parses ISO UTC string with Z correctly', () => {
    const d = parseMessageDate('2026-10-25T12:40:37.034Z')
    expect(d.getTime()).toBe(new Date('2026-10-25T12:40:37.034Z').getTime())
  })

  it('normalizes SQLite datetime string without Z to UTC', () => {
    const d = parseMessageDate('2026-10-25 12:40:37')
    expect(d.getTime()).toBe(new Date('2026-10-25T12:40:37Z').getTime())
  })

  it('formats Today timestamp properly with time and relative day label', () => {
    const now = new Date().toISOString()
    const formatted = formatChatTimestamp(now)
    expect(formatted).toMatch(/^Today · \d{1,2}:\d{2} (AM|PM)$/)
  })

  it('formats Yesterday timestamp properly', () => {
    const yest = new Date()
    yest.setDate(yest.getDate() - 1)
    const formatted = formatChatTimestamp(yest.toISOString())
    expect(formatted).toMatch(/^Yesterday · \d{1,2}:\d{2} (AM|PM)$/)
  })

  it('formats older date with month, day and time', () => {
    const formatted = formatChatTimestamp('2026-10-10T02:19:20.852Z')
    expect(formatted).toContain('Oct 10 · ')
    expect(formatted).toMatch(/(AM|PM)$/)
  })

  it('generates full tooltip string', () => {
    const tooltip = formatFullChatTooltip('2026-10-25T12:40:37.034Z')
    expect(tooltip).toBeTruthy()
    expect(tooltip).toContain('2026')
  })
})
