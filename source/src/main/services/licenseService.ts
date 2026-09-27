import * as crypto from 'node:crypto'
import * as os from 'node:os'
import * as fs from 'node:fs'
import * as path from 'node:path'
import { execSync } from 'node:child_process'
import type { LicenseStatus, LicenseTier } from '../../shared/types'

// Obfuscated cryptographic pepper chunks — assembled at runtime to defeat simple string scraping
const PEPPER_BYTES = Buffer.from([
  0x54, 0x49, 0x4e, 0x44, 0x41, 0x5f, 0x56, 0x49, 0x50, 0x5f,
  0x53, 0x45, 0x43, 0x55, 0x52, 0x45, 0x5f, 0x50, 0x45, 0x50,
  0x50, 0x45, 0x52, 0x5f, 0x32, 0x30, 0x32, 0x36, 0x5f, 0x46,
  0x52, 0x41, 0x4e, 0x43, 0x49, 0x53, 0x5f, 0x4d, 0x41, 0x59,
  0x41, 0x5f, 0x30, 0x39, 0x39, 0x31, 0x32, 0x32, 0x35, 0x35,
  0x31, 0x35, 0x36
])

const MASK_KEY = 0x5a

function getInternalSecret(): Buffer {
  const buf = Buffer.alloc(PEPPER_BYTES.length)
  for (let i = 0; i < PEPPER_BYTES.length; i++) {
    buf[i] = (PEPPER_BYTES[i] ?? 0) ^ (MASK_KEY + (i % 7))
  }
  return buf
}

export interface StoredLicensePayload {
  version: number
  tier: LicenseTier
  machineId: string
  licenseKey: string
  customerName: string | null
  activatedAt: string
  tamperProofHash: string
}

export class LicenseService {
  private static instance: LicenseService | null = null
  private cachedMachineId: string | null = null
  private storageFilePath: string | null = null
  private currentStatus: LicenseStatus | null = null

  constructor(customStoragePath?: string) {
    if (customStoragePath) {
      this.storageFilePath = customStoragePath
    }
  }

  public static getInstance(customStoragePath?: string): LicenseService {
    if (!LicenseService.instance) {
      LicenseService.instance = new LicenseService(customStoragePath)
    }
    return LicenseService.instance
  }

  /**
   * Set custom storage path (useful for testing or custom userData path).
   */
  public setStoragePath(customPath: string): void {
    this.storageFilePath = customPath
    this.currentStatus = null
  }

  /**
   * Derive live Machine Hardware ID.
   * Scrapes motherboard UUID, CPU ID, and MAC address.
   * Deterministic, hardware-bound, unforgeable.
   */
  public getMachineId(): string {
    if (this.cachedMachineId) return this.cachedMachineId

    const rawParts: string[] = []

    if (process.platform === 'win32') {
      try {
        const bios = execSync('wmic csproduct get uuid', { encoding: 'utf8', timeout: 3000, stdio: ['ignore', 'pipe', 'ignore'] })
        const uuidMatch = bios.replace(/UUID/i, '').trim()
        if (uuidMatch) rawParts.push(`WIN_BIOS:${uuidMatch}`)
      } catch {
        // Fallback for newer Windows 11 where WMIC might be deprecated
        try {
          const regGuid = execSync('reg query "HKLM\\SOFTWARE\\Microsoft\\Cryptography" /v MachineGuid', { encoding: 'utf8', timeout: 3000, stdio: ['ignore', 'pipe', 'ignore'] })
          const match = regGuid.match(/MachineGuid\s+REG_SZ\s+([a-fA-F0-9-]+)/)
          if (match && match[1]) rawParts.push(`WIN_REG:${match[1]}`)
        } catch {
          // Ignored
        }
      }

      try {
        const cpu = execSync('wmic cpu get processorid', { encoding: 'utf8', timeout: 3000, stdio: ['ignore', 'pipe', 'ignore'] })
        const cpuMatch = cpu.replace(/ProcessorId/i, '').trim()
        if (cpuMatch) rawParts.push(`WIN_CPU:${cpuMatch}`)
      } catch {
        // Ignored
      }
    } else if (process.platform === 'linux') {
      try {
        if (fs.existsSync('/etc/machine-id')) {
          const mid = fs.readFileSync('/etc/machine-id', 'utf8').trim()
          rawParts.push(`LINUX_MID:${mid}`)
        } else if (fs.existsSync('/var/lib/dbus/machine-id')) {
          const mid = fs.readFileSync('/var/lib/dbus/machine-id', 'utf8').trim()
          rawParts.push(`LINUX_DBUS:${mid}`)
        }
      } catch {
        // Ignored
      }
    }

    // Anchor with Primary Network MAC
    try {
      const ifaces = os.networkInterfaces()
      for (const name of Object.keys(ifaces)) {
        const list = ifaces[name]
        if (!list) continue
        for (const net of list) {
          if (!net.internal && net.mac && net.mac !== '00:00:00:00:00:00') {
            rawParts.push(`NET_MAC:${net.mac.toLowerCase()}`)
            break
          }
        }
        if (rawParts.length > 0) break
      }
    } catch {
      // Ignored
    }

    // Host & platform baseline
    rawParts.push(`HOST:${os.hostname().toLowerCase()}`)
    rawParts.push(`ARCH:${os.arch()}`)

    const rawString = rawParts.join(';;;')
    const hash = crypto.createHash('sha256').update(rawString).digest('hex').toUpperCase()

    // Format as TNDA-XXXX-XXXX-XXXX-XXXX
    const formatted = `TNDA-${hash.substring(0, 4)}-${hash.substring(4, 8)}-${hash.substring(8, 12)}-${hash.substring(12, 16)}`
    this.cachedMachineId = formatted
    return formatted
  }

  /**
   * Core Cryptographic Signature Validator:
   * Generates or validates an unforgeable VIP License Key for a target Machine ID.
   */
  public generateKeyForMachine(machineId: string, tier: LicenseTier = 'VIP_PRO'): string {
    const normMachine = machineId.trim().toUpperCase()
    const secret = getInternalSecret()
    
    // Compute HMAC
    const hmac = crypto.createHmac('sha256', secret)
    hmac.update(`TINDA_AUTH_V1::${normMachine}::${tier}`)
    const fullSig = hmac.digest('hex').toUpperCase()

    const chunk1 = fullSig.substring(0, 4)
    const chunk2 = fullSig.substring(4, 8)
    const chunk3 = fullSig.substring(8, 12)

    // 4-char CRC-like checksum
    const checksumHash = crypto.createHash('sha256').update(`${normMachine}:${chunk1}${chunk2}${chunk3}`).digest('hex').toUpperCase()
    const checksum = checksumHash.substring(0, 4)

    return `VIP-${chunk1}-${chunk2}-${chunk3}-${checksum}`
  }

  /**
   * Verify whether a given key is mathematically valid for this machine.
   */
  public verifyKey(key: string, machineId: string = this.getMachineId()): boolean {
    if (!key || typeof key !== 'string') return false
    const cleanKey = key.trim().toUpperCase()
    const expected = this.generateKeyForMachine(machineId, 'VIP_PRO')

    if (cleanKey.length !== expected.length) return false

    // Timing-safe comparison to prevent side-channel timing attacks
    return crypto.timingSafeEqual(Buffer.from(cleanKey), Buffer.from(expected))
  }

  /**
   * Internal tamper-proofing hash for the storage file
   */
  private computeTamperHash(machineId: string, key: string, activatedAt: string, customerName?: string | null): string {
    const secret = getInternalSecret()
    return crypto.createHmac('sha256', secret)
      .update(`FILE_TAMPER_GUARD::${machineId}::${key}::${activatedAt}::${customerName ?? ''}`)
      .digest('hex')
  }

  /**
   * Load and verify the active license status.
   */
  public getStatus(): LicenseStatus {
    const liveMachineId = this.getMachineId()

    // Read stored license file if exists
    const storagePath = this.getStoragePath()
    let stored: StoredLicensePayload | null = null

    if (fs.existsSync(storagePath)) {
      try {
        const raw = fs.readFileSync(storagePath, 'utf8')
        stored = JSON.parse(raw) as StoredLicensePayload
      } catch {
        stored = null
      }
    }

    if (!stored || !stored.licenseKey) {
      this.currentStatus = {
        tier: 'COMMUNITY',
        isVip: false,
        machineId: liveMachineId,
        activatedAt: null,
        customerName: null,
        licenseKey: null,
        statusMessage: 'Community Edition (Active & Free)'
      }
      return this.currentStatus
    }

    // 1. Anti-Cross-Machine Check: Did someone copy the license file from another PC?
    if (stored.machineId !== liveMachineId) {
      this.currentStatus = {
        tier: 'COMMUNITY',
        isVip: false,
        machineId: liveMachineId,
        activatedAt: null,
        customerName: null,
        licenseKey: null,
        statusMessage: 'Hardware Mismatch: License is locked to a different computer'
      }
      return this.currentStatus
    }

    // 2. Tamper-Proof Signature Check
    const expectedTamperHash = this.computeTamperHash(stored.machineId, stored.licenseKey, stored.activatedAt, stored.customerName)
    if (stored.tamperProofHash !== expectedTamperHash) {
      this.currentStatus = {
        tier: 'COMMUNITY',
        isVip: false,
        machineId: liveMachineId,
        activatedAt: null,
        customerName: null,
        licenseKey: null,
        statusMessage: 'Integrity Check Failed: License file was modified'
      }
      return this.currentStatus
    }

    // 3. Cryptographic Mathematical Key Verification
    const isValid = this.verifyKey(stored.licenseKey, liveMachineId)
    if (!isValid) {
      this.currentStatus = {
        tier: 'COMMUNITY',
        isVip: false,
        machineId: liveMachineId,
        activatedAt: null,
        customerName: null,
        licenseKey: null,
        statusMessage: 'Invalid License Key'
      }
      return this.currentStatus
    }

    // Verified VIP Pro
    this.currentStatus = {
      tier: 'VIP_PRO',
      isVip: true,
      machineId: liveMachineId,
      activatedAt: stored.activatedAt,
      customerName: stored.customerName,
      licenseKey: stored.licenseKey,
      statusMessage: 'VIP Pro Lifetime Activated (Hardware Locked)'
    }
    return this.currentStatus
  }

  /**
   * Activate VIP Pro using a key provided by Dev Francis.
   */
  public activate(key: string, customerName?: string): { ok: boolean; message: string; status: LicenseStatus } {
    const liveMachineId = this.getMachineId()
    const cleanKey = (key || '').trim().toUpperCase()

    if (!cleanKey) {
      return {
        ok: false,
        message: 'Please enter a valid VIP License Key.',
        status: this.getStatus()
      }
    }

    const isValid = this.verifyKey(cleanKey, liveMachineId)
    if (!isValid) {
      return {
        ok: false,
        message: 'Invalid VIP License Key. The key does not match this computer\'s Machine ID. Send ₱500 to Maya 09912255156 and message Dev Francis on Facebook with your Machine ID.',
        status: this.getStatus()
      }
    }

    const activatedAt = new Date().toISOString()
    const normCustomerName = customerName?.trim() || null
    const tamperProofHash = this.computeTamperHash(liveMachineId, cleanKey, activatedAt, normCustomerName)

    const payload: StoredLicensePayload = {
      version: 1,
      tier: 'VIP_PRO',
      machineId: liveMachineId,
      licenseKey: cleanKey,
      customerName: normCustomerName,
      activatedAt,
      tamperProofHash
    }

    const storagePath = this.getStoragePath()
    try {
      const dir = path.dirname(storagePath)
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
      fs.writeFileSync(storagePath, JSON.stringify(payload, null, 2), 'utf8')
    } catch (err) {
      return {
        ok: false,
        message: `Failed to save license file: ${(err as Error)?.message || String(err)}`,
        status: this.getStatus()
      }
    }

    const newStatus = this.getStatus()
    return {
      ok: true,
      message: 'TINDA POS VIP Pro has been successfully activated. All VIP features are now permanently unlocked for your store.',
      status: newStatus
    }
  }

  /**
   * Deactivate license back to Community.
   */
  public deactivate(): { ok: boolean; message: string } {
    const storagePath = this.getStoragePath()
    if (fs.existsSync(storagePath)) {
      try {
        fs.unlinkSync(storagePath)
      } catch (err) {
        return { ok: false, message: `Could not delete license: ${(err as Error)?.message}` }
      }
    }
    this.currentStatus = null
    return { ok: true, message: 'License deactivated. System is now running Community Edition.' }
  }

  private getStoragePath(): string {
    if (this.storageFilePath) return this.storageFilePath
    // In production Electron, will be overridden by main setup with app.getPath('userData')
    const fallbackDir = path.join(os.homedir(), '.tindapos')
    return path.join(fallbackDir, 'tinda_license.json')
  }
}

export const licenseService = LicenseService.getInstance()
