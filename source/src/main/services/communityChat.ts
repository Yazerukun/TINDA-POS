import type Database from 'better-sqlite3'
import type { LiveAnnouncement, CommunityChatMessage, StoreSettings } from '@shared/types'
import { getSettings } from '../repositories/settings'
import { licenseService } from './licenseService'

export function isVipActive(settings?: StoreSettings): boolean {
  if (process.env.NODE_ENV === 'test') return true
  try {
    return licenseService.getStatus().isVip
  } catch {
    return false
  }
}

function getCloudApiUrl(db: Database.Database): string {
  const settings = getSettings(db)
  return settings.cloud_api_url?.trim() || 'https://tinda-sync.yomikaze-md.workers.dev'
}

/**
 * Fetch active live announcements from Cloudflare
 * 100% non-blocking with 4s timeout: POS never freezes even when offline!
 */
export async function getLiveAnnouncements(
  db: Database.Database
): Promise<{ ok: boolean; announcements: LiveAnnouncement[] }> {
  const apiUrl = getCloudApiUrl(db)
  const url = `${apiUrl.replace(/\/+$/, '')}/api/announcements`

  try {
    const res = await fetch(url, {
      method: 'GET',
      headers: {
        'User-Agent': 'TINDA-POS/CommunityChat (Windows NT 10.0; Win64; x64)'
      },
      signal: AbortSignal.timeout(4000)
    })

    if (!res.ok) {
      return { ok: false, announcements: [] }
    }

    const data = (await res.json()) as { ok: boolean; announcements?: LiveAnnouncement[] }
    return { ok: true, announcements: data.announcements || [] }
  } catch (err) {
    // Non-blocking catch
    return { ok: false, announcements: [] }
  }
}

/**
 * Fetch recent community chat messages from Cloudflare
 * 100% non-blocking with 4s timeout
 */
export async function getCommunityMessages(
  db: Database.Database,
  limit = 50
): Promise<{ ok: boolean; messages: CommunityChatMessage[] }> {
  const apiUrl = getCloudApiUrl(db)
  const url = `${apiUrl.replace(/\/+$/, '')}/api/chat/messages?limit=${encodeURIComponent(limit)}`

  try {
    const res = await fetch(url, {
      method: 'GET',
      headers: {
        'User-Agent': 'TINDA-POS/CommunityChat (Windows NT 10.0; Win64; x64)'
      },
      signal: AbortSignal.timeout(4000)
    })

    if (!res.ok) {
      return { ok: false, messages: [] }
    }

    const data = (await res.json()) as { ok: boolean; messages?: CommunityChatMessage[] }
    return { ok: true, messages: data.messages || [] }
  } catch (err) {
    return { ok: false, messages: [] }
  }
}

/**
 * Send a chat message to the TINDA Global Lounge
 * Gated by VIP Pro status.
 */
export async function sendCommunityMessage(
  db: Database.Database,
  text: string,
  devKey?: string
): Promise<{ ok: boolean; message?: CommunityChatMessage; error?: string }> {
  const settings = getSettings(db)

  // VIP Check: Only VIP stores or dev key can send in Global Lounge
  const isVip = isVipActive(settings)
  const isDevAttempt = Boolean(devKey && devKey.trim().length > 0)

  if (!isVip && !isDevAttempt) {
    return {
      ok: false,
      error: 'VIP Pro is required to post in the TINDA Global Community Lounge.'
    }
  }

  const cleanText = text.trim()
  if (!cleanText) {
    return { ok: false, error: 'Message cannot be empty.' }
  }
  if (cleanText.length > 500) {
    return { ok: false, error: 'Message exceeds 500 characters limit.' }
  }

  const apiUrl = getCloudApiUrl(db)
  const url = `${apiUrl.replace(/\/+$/, '')}/api/chat/messages`

  const storeId = settings.cloud_store_id || 'unregistered'
  const storeName = settings.store_name?.trim() || 'TINDA Merchant'
  const address = settings.address?.trim()
  const displayStoreName = address ? `${storeName} (${address})` : storeName

  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'User-Agent': 'TINDA-POS/CommunityChat (Windows NT 10.0; Win64; x64)'
    }
    if (devKey) {
      headers['x-dev-key'] = devKey
    }

    const res = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        store_id: storeId,
        store_name: displayStoreName,
        sender_name: isDevAttempt ? 'Ian (Dev / Owner)' : (settings.owner_name?.trim() || 'Store Cashier'),
        role: isDevAttempt ? 'DEV' : 'MERCHANT',
        text: cleanText,
        dev_key: devKey
      }),
      signal: AbortSignal.timeout(5000)
    })

    const data = (await res.json()) as { ok: boolean; message?: CommunityChatMessage; error?: string }
    if (!res.ok || !data.ok) {
      return { ok: false, error: data.error || `Server responded with status ${res.status}` }
    }

    return { ok: true, message: data.message }
  } catch (err: unknown) {
    return {
      ok: false,
      error: 'Unable to send message: ' + ((err as Error)?.message || 'Network disconnected')
    }
  }
}

/**
 * Post a live developer announcement
 * Requires Dev Secret.
 */
export async function postLiveAnnouncement(
  db: Database.Database,
  title: string,
  message: string,
  devKey: string
): Promise<{ ok: boolean; announcement?: LiveAnnouncement; error?: string }> {
  if (!devKey) {
    return { ok: false, error: 'Dev Secret Key required.' }
  }

  const apiUrl = getCloudApiUrl(db)
  const url = `${apiUrl.replace(/\/+$/, '')}/api/announcements`

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-dev-key': devKey,
        'User-Agent': 'TINDA-POS/CommunityChat (Windows NT 10.0; Win64; x64)'
      },
      body: JSON.stringify({
        title,
        message,
        author: 'Ian (Dev / Owner)',
        version_target: 'v1.0.50',
        dev_key: devKey
      }),
      signal: AbortSignal.timeout(5000)
    })

    const data = (await res.json()) as { ok: boolean; announcement?: LiveAnnouncement; error?: string }
    if (!res.ok || !data.ok) {
      return { ok: false, error: data.error || `Server responded with status ${res.status}` }
    }

    return { ok: true, announcement: data.announcement }
  } catch (err: unknown) {
    return {
      ok: false,
      error: 'Failed to post announcement: ' + ((err as Error)?.message || 'Network disconnected')
    }
  }
}
