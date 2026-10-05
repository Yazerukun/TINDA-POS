import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import Database from 'better-sqlite3'
import {
  getLiveAnnouncements,
  getCommunityMessages,
  sendCommunityMessage,
  deleteCommunityMessage,
  isVipActive
} from '../communityChat'

describe('communityChat service (Non-Blocking Global Lounge)', () => {
  let db: Database.Database
  const originalFetch = global.fetch

  beforeEach(() => {
    db = new Database(':memory:')
    db.exec(`
      CREATE TABLE settings (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL
      );
    `)
  })

  afterEach(() => {
    global.fetch = originalFetch
    db.close()
    vi.restoreAllMocks()
  })

  it('checks VIP active status safely', () => {
    // In test environment, isVipActive returns true
    expect(isVipActive()).toBe(true)
  })

  it('handles getLiveAnnouncements network failure non-blockingly', async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error('Network offline or DNS error'))

    const res = await getLiveAnnouncements(db)
    expect(res.ok).toBe(false)
    expect(res.announcements).toEqual([])
  })

  it('fetches live announcements successfully when online', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        ok: true,
        announcements: [
          {
            id: 'ann_1',
            title: 'Version 1.0.50 Released',
            message: 'All features working cleanly in English',
            author: 'Ian (Dev / Owner)',
            version_target: 'v1.0.50',
            is_pinned: 1,
            created_at: '2026-10-04T00:00:00Z'
          }
        ]
      })
    } as unknown as Response)

    const res = await getLiveAnnouncements(db)
    expect(res.ok).toBe(true)
    expect(res.announcements.length).toBe(1)
    expect(res.announcements[0]?.title).toBe('Version 1.0.50 Released')
  })

  it('handles getCommunityMessages non-blockingly', async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error('Timeout after 4000ms'))

    const res = await getCommunityMessages(db, 20)
    expect(res.ok).toBe(false)
    expect(res.messages).toEqual([])
  })

  it('rejects sending empty message', async () => {
    const res = await sendCommunityMessage(db, '   ')
    expect(res.ok).toBe(false)
    expect(res.error).toContain('empty')
  })

  it('sends community message with dev key and tags author properly', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        ok: true,
        message: {
          id: 'msg_123',
          store_id: 'test_store',
          store_name: 'TINDA Store',
          sender_name: 'Ian (Dev / Owner)',
          role: 'DEV',
          text: 'Hello merchants!',
          is_dev: 1,
          created_at: '2026-10-04T00:00:00Z'
        }
      })
    } as unknown as Response)

    const res = await sendCommunityMessage(db, 'Hello merchants!', 'tinda_founder_ian_2026')
    expect(res.ok).toBe(true)
    expect(res.message?.is_dev).toBe(1)
    expect(res.message?.sender_name).toBe('Ian (Dev / Owner)')
  })

  it('sends community message with is_vip flag included in request body', async () => {
    let capturedBody = ''
    global.fetch = vi.fn().mockImplementation((_url, init) => {
      capturedBody = init?.body as string
      return Promise.resolve({
        ok: true,
        json: async () => ({
          ok: true,
          message: {
            id: 'msg_vip_456',
            store_id: 'vip_store',
            store_name: 'VIP Store',
            sender_name: 'Store Cashier',
            role: 'MERCHANT',
            text: 'VIP merchant message',
            is_dev: 0,
            is_vip: 1,
            created_at: '2026-10-04T00:00:00Z'
          }
        })
      })
    })

    const res = await sendCommunityMessage(db, 'VIP merchant message')
    expect(res.ok).toBe(true)
    expect(res.message?.is_vip).toBe(1)
    const parsed = JSON.parse(capturedBody)
    expect(parsed.is_vip).toBe(1)
  })

  it('rejects deleting message with empty id', async () => {
    const res = await deleteCommunityMessage(db, '   ')
    expect(res.ok).toBe(false)
    expect(res.error).toContain('required')
  })

  it('deletes community message successfully with DELETE endpoint', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ ok: true })
    } as unknown as Response)

    const res = await deleteCommunityMessage(db, 'msg_123', 'dev_secret')
    expect(res.ok).toBe(true)
  })

  it('falls back to POST delete when DELETE endpoint returns 404', async () => {
    let callCount = 0
    global.fetch = vi.fn().mockImplementation((_url, init) => {
      callCount++
      if (init?.method === 'DELETE') {
        return Promise.resolve({ ok: false, status: 404 })
      }
      return Promise.resolve({
        ok: true,
        json: async () => ({ ok: true })
      })
    })

    const res = await deleteCommunityMessage(db, 'msg_456')
    expect(res.ok).toBe(true)
    expect(callCount).toBe(2)
  })

  it('handles delete network failure safely and non-blockingly', async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error('Network offline'))

    const res = await deleteCommunityMessage(db, 'msg_789')
    expect(res.ok).toBe(false)
    expect(res.error).toContain('Network offline')
  })
})
