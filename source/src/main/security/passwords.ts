import { randomBytes, randomInt, scryptSync, timingSafeEqual } from 'node:crypto'

// Format: scrypt$N$r$p$salt$hash (hex)
function derive(secret: string, salt: Buffer, N: number, r: number, p: number): Buffer {
  return scryptSync(secret, salt, 64, { N, r, p, maxmem: 128 * 1024 * 1024 })
}

export function hashSecret(secret: string): string {
  const N = 16384
  const r = 8
  const p = 1
  const salt = randomBytes(16)
  const hash = derive(secret, salt, N, r, p)
  return `scrypt$${N}$${r}$${p}$${salt.toString('hex')}$${hash.toString('hex')}`
}

export function verifySecret(secret: string, stored: string): boolean {
  try {
    const parts = stored.split('$')
    if (parts[0] !== 'scrypt' || parts.length !== 6) return false
    const [, Ns, rs, ps, saltHex, hashHex] = parts
    const N = Number(Ns)
    const r = Number(rs)
    const p = Number(ps)
    const salt = Buffer.from(saltHex as string, 'hex')
    const expected = Buffer.from(hashHex as string, 'hex')
    const actual = derive(secret, salt, N, r, p)
    return timingSafeEqual(actual, expected)
  } catch {
    return false
  }
}

export function randomPin(): string {
  return String(randomInt(1000, 9999))
}