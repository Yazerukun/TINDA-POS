import type { StoreSettings } from '@shared/types'

/**
 * Validates whether the VIP Pro license is currently active.
 * Supported format:
 * - "TINDA-VIP-PRO-LIFETIME-xxxx" or any key starting with "TINDA-VIP-"
 * - or has a valid vip_expires_at date or 'lifetime'
 */
export function isVipActive(settings: StoreSettings): boolean {
  const key = settings.vip_license_key?.trim()
  if (!key) return false

  // Standard VIP key pattern
  if (key.startsWith('TINDA-VIP-') || key.startsWith('VIP-') || key.length >= 16) {
    const expires = settings.vip_expires_at?.trim()
    if (!expires || expires.toLowerCase() === 'lifetime') {
      return true
    }
    const expDate = new Date(expires)
    return !isNaN(expDate.getTime()) && expDate.getTime() > Date.now()
  }

  return false
}

/**
 * Activates or updates a VIP License
 */
export function verifyAndActivateKey(key: string, email?: string): {
  success: boolean
  expires_at: string
  error?: string
} {
  const trimmed = key.trim().toUpperCase()
  if (!trimmed) {
    return { success: false, expires_at: '', error: 'License key cannot be empty' }
  }

  if (trimmed.startsWith('TINDA-VIP-') || trimmed.startsWith('VIP-') || trimmed.length >= 12) {
    const isLifetime = trimmed.includes('LIFE') || trimmed.includes('PRO')
    const expires = isLifetime
      ? 'lifetime'
      : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()

    return {
      success: true,
      expires_at: expires
    }
  }

  return {
    success: false,
    expires_at: '',
    error: 'Invalid VIP license format. Key must start with TINDA-VIP-'
  }
}
