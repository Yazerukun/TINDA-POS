export function localDate(now = new Date()): string {
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
}

export function validExpirationDate(value: unknown): value is string {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
  const parsed = new Date(`${value}T00:00:00Z`)
  return Number.isFinite(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value
}

export function expirationStatus(date: string | null, today = localDate()): 'EXPIRED' | 'SOON' | 'NEAR' | 'OK' | 'UNKNOWN' {
  if (!date || !validExpirationDate(date)) return 'UNKNOWN'
  const days = Math.round((Date.parse(`${date}T00:00:00Z`) - Date.parse(`${today}T00:00:00Z`)) / 86400000)
  if (days < 0) return 'EXPIRED'
  if (days <= 7) return 'SOON'
  if (days <= 30) return 'NEAR'
  return 'OK'
}

export function productExpirationStatus(
  p: {
    expiration_mode?: string
    expiration_date?: string | null
    batches?: Array<{ expiration_date?: string | null; quantity?: number }>
  },
  today = localDate()
): 'EXPIRED' | 'SOON' | 'NEAR' | 'OK' | 'UNKNOWN' {
  if (p.expiration_mode === 'ITEM') {
    return expirationStatus(p.expiration_date ?? null, today)
  }
  if (p.expiration_mode === 'BATCH' && p.batches && p.batches.length > 0) {
    let hasSoon = false
    let hasNear = false
    let hasOk = false
    for (const b of p.batches) {
      if (b.quantity !== undefined && b.quantity <= 0) continue
      const st = expirationStatus(b.expiration_date ?? null, today)
      if (st === 'EXPIRED') return 'EXPIRED'
      if (st === 'SOON') hasSoon = true
      if (st === 'NEAR') hasNear = true
      if (st === 'OK') hasOk = true
    }
    if (hasSoon) return 'SOON'
    if (hasNear) return 'NEAR'
    if (hasOk) return 'OK'
    return 'UNKNOWN'
  }
  return 'OK'
}
