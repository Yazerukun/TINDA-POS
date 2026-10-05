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

// Windows Registry helpers for indestructible persistence across updates and re-installs
function readWinRegistry(subKey: string, valueName: string): string | null {
  if (process.platform !== 'win32') return null
  try {
    const out = execSync(`reg query "${subKey}" /v "${valueName}"`, {
      encoding: 'utf8',
      timeout: 1500,
      stdio: ['ignore', 'pipe', 'ignore']
    })
    const match = out.match(new RegExp(`${valueName}\\s+REG_SZ\\s+(\\S+)`, 'i'))
    return match && match[1] ? match[1].trim() : null
  } catch {
    return null
  }
}

function writeWinRegistry(subKey: string, valueName: string, valueData: string): boolean {
  if (process.platform !== 'win32') return false
  try {
    const cleanData = valueData.replace(/"/g, '\\"')
    execSync(`reg add "${subKey}" /v "${valueName}" /t REG_SZ /d "${cleanData}" /f`, {
      timeout: 1500,
      stdio: ['ignore', 'ignore', 'ignore']
    })
    return true
  } catch {
    return false
  }
}

function deleteWinRegistry(subKey: string, valueName: string): boolean {
  if (process.platform !== 'win32') return false
  try {
    execSync(`reg delete "${subKey}" /v "${valueName}" /f`, {
      timeout: 1500,
      stdio: ['ignore', 'ignore', 'ignore']
    })
    return true
  } catch {
    return false
  }
}

function getElectronUserDataPath(): string | null {
  try {
    const { app } = require('electron')
    if (app && typeof app.getPath === 'function') {
      return app.getPath('userData')
    }
  } catch {}
  return null
}

function getDatabaseConnection(): any {
  try {
    const { getDb } = require('../database/connection')
    return getDb()
  } catch {
    return null
  }
}

const REG_KEY_ROOT = 'HKCU\\Software\\TindaPOS'
const REG_VAL_MACHINE_ID = 'MachineId'
const REG_VAL_LICENSE_B64 = 'LicensePayload'

export class LicenseService {
  private static instance: LicenseService | null = null
  private cachedMachineId: string | null = null
  private storageFilePath: string | null = null
  private currentStatus: LicenseStatus | null = null
  private isCustomOrTestMode: boolean = false

  // Cached hardware identifiers to avoid repeatedly executing child processes
  private cachedRawParts: string[] | null = null
  private cachedLegacyBaseParts: string[] | null = null

  constructor(customStoragePath?: string) {
    if (customStoragePath) {
      this.storageFilePath = customStoragePath
      this.isCustomOrTestMode = true
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
    this.isCustomOrTestMode = true
    this.currentStatus = null
    this.cachedMachineId = null
  }

  /**
   * Tamper-proofing HMAC signature calculation
   */
  public computeTamperHash(machineId: string, key: string, activatedAt: string, customerName?: string | null): string {
    const secret = getInternalSecret()
    return crypto.createHmac('sha256', secret)
      .update(`FILE_TAMPER_GUARD::${machineId}::${key}::${activatedAt}::${customerName ?? ''}`)
      .digest('hex')
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
  public verifyKey(key: string, machineId: string): boolean {
    if (!key || typeof key !== 'string') return false
    const cleanKey = key.trim().toUpperCase()
    const expected = this.generateKeyForMachine(machineId, 'VIP_PRO')

    if (cleanKey.length !== expected.length) return false

    // Timing-safe comparison to prevent side-channel timing attacks
    return crypto.timingSafeEqual(Buffer.from(cleanKey), Buffer.from(expected))
  }

  /**
   * Read primary file payload directly.
   */
  public readPrimaryPayload(): StoredLicensePayload | null {
    const p = this.getPrimaryStoragePath()
    if (fs.existsSync(p)) {
      try {
        const raw = fs.readFileSync(p, 'utf8')
        return JSON.parse(raw) as StoredLicensePayload
      } catch {}
    }
    return null
  }

  /**
   * Read stored license payloads from all available vaults (User Home, UserData, Registry, SQLite).
   */
  public readAllVaults(): StoredLicensePayload[] {
    const results: StoredLicensePayload[] = []
    const seenHashes = new Set<string>()

    const tryAdd = (payload: StoredLicensePayload | null) => {
      if (!payload || !payload.licenseKey || !payload.machineId) return
      const key = `${payload.machineId}::${payload.licenseKey}`
      if (!seenHashes.has(key)) {
        seenHashes.add(key)
        results.push(payload)
      }
    }

    // Vault 1: Primary custom path or user home .tindapos
    tryAdd(this.readPrimaryPayload())

    // If running in isolated test mode with custom path, do not touch external system vaults
    if (this.isCustomOrTestMode) {
      return results
    }

    // Vault 2: UserData file (e.g., %APPDATA%/TINDA POS/tinda_license.json)
    const userData = getElectronUserDataPath()
    if (userData) {
      const p2 = path.join(userData, 'tinda_license.json')
      if (p2 !== this.getPrimaryStoragePath() && fs.existsSync(p2)) {
        try {
          const raw = fs.readFileSync(p2, 'utf8')
          tryAdd(JSON.parse(raw) as StoredLicensePayload)
        } catch {}
      }
    }

    // Vault 3: Windows Registry HKCU\Software\TindaPOS\LicensePayload (Base64)
    if (process.platform === 'win32') {
      const b64 = readWinRegistry(REG_KEY_ROOT, REG_VAL_LICENSE_B64)
      if (b64) {
        try {
          const jsonStr = Buffer.from(b64, 'base64').toString('utf8')
          tryAdd(JSON.parse(jsonStr) as StoredLicensePayload)
        } catch {}
      }
    }

    // Vault 4: SQLite DB system_license_vault
    try {
      const db = getDatabaseConnection()
      if (db) {
        this.ensureDbTable(db)
        const row = db.prepare('SELECT machine_id, license_key, customer_name, tier, is_vip, activated_at, tamper_proof_hash FROM system_license_vault WHERE id = 1').get() as any
        if (row && row.license_key && row.is_vip) {
          tryAdd({
            version: 1,
            tier: row.tier || 'VIP_PRO',
            machineId: row.machine_id,
            licenseKey: row.license_key,
            customerName: row.customer_name || null,
            activatedAt: row.activated_at || new Date().toISOString(),
            tamperProofHash: row.tamper_proof_hash || ''
          })
        }
      }
    } catch {}

    return results
  }

  /**
   * Synchronize / heal a valid VIP license payload across all 4 vaults.
   */
  public syncToAllVaults(payload: StoredLicensePayload): void {
    const raw = JSON.stringify(payload, null, 2)

    // Vault 1: Primary file path
    const p1 = this.getPrimaryStoragePath()
    try {
      const dir1 = path.dirname(p1)
      if (!fs.existsSync(dir1)) fs.mkdirSync(dir1, { recursive: true })
      fs.writeFileSync(p1, raw, 'utf8')
    } catch {}

    // In isolated test mode, stop here
    if (this.isCustomOrTestMode) return

    // Vault 2: Electron UserData path
    const userData = getElectronUserDataPath()
    if (userData) {
      const p2 = path.join(userData, 'tinda_license.json')
      if (p2 !== p1) {
        try {
          if (!fs.existsSync(userData)) fs.mkdirSync(userData, { recursive: true })
          fs.writeFileSync(p2, raw, 'utf8')
        } catch {}
      }
    }

    // Vault 3: Windows Registry Base64
    if (process.platform === 'win32') {
      try {
        const b64 = Buffer.from(raw).toString('base64')
        writeWinRegistry(REG_KEY_ROOT, REG_VAL_LICENSE_B64, b64)
      } catch {}
    }

    // Vault 4: SQLite DB system_license_vault
    try {
      const db = getDatabaseConnection()
      if (db) {
        this.ensureDbTable(db)
        db.prepare(`
          INSERT INTO system_license_vault (id, machine_id, license_key, customer_name, tier, is_vip, activated_at, tamper_proof_hash, updated_at)
          VALUES (1, ?, ?, ?, ?, 1, ?, ?, datetime('now','localtime'))
          ON CONFLICT(id) DO UPDATE SET
            machine_id = excluded.machine_id,
            license_key = excluded.license_key,
            customer_name = excluded.customer_name,
            tier = excluded.tier,
            is_vip = 1,
            activated_at = excluded.activated_at,
            tamper_proof_hash = excluded.tamper_proof_hash,
            updated_at = excluded.updated_at
        `).run(payload.machineId, payload.licenseKey, payload.customerName, payload.tier, payload.activatedAt, payload.tamperProofHash)
      }
    } catch {}
  }

  /**
   * Read permanently anchored Machine ID from persistent files, registry, or DB.
   */
  public readAnchoredMachineId(): string | null {
    const isValid = (id: string | null | undefined): id is string => {
      return typeof id === 'string' && /^TNDA-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/.test(id.trim().toUpperCase())
    }

    // Anchor 1: Custom or primary file anchor
    const p1 = this.getPrimaryAnchorPath()
    if (fs.existsSync(p1)) {
      try {
        const id = fs.readFileSync(p1, 'utf8').trim().toUpperCase()
        if (isValid(id)) return id
      } catch {}
    }

    if (this.isCustomOrTestMode) return null

    // Anchor 2: UserData file anchor
    const userData = getElectronUserDataPath()
    if (userData) {
      const p2 = path.join(userData, 'machine.id')
      if (p2 !== p1 && fs.existsSync(p2)) {
        try {
          const id = fs.readFileSync(p2, 'utf8').trim().toUpperCase()
          if (isValid(id)) return id
        } catch {}
      }
    }

    // Anchor 3: Windows Registry HKCU\Software\TindaPOS\MachineId
    if (process.platform === 'win32') {
      const regId = readWinRegistry(REG_KEY_ROOT, REG_VAL_MACHINE_ID)
      if (isValid(regId)) return regId.toUpperCase()
    }

    // Anchor 4: SQLite DB
    try {
      const db = getDatabaseConnection()
      if (db) {
        this.ensureDbTable(db)
        const row = db.prepare('SELECT machine_id FROM system_license_vault WHERE id = 1').get() as any
        if (row && isValid(row.machine_id)) return row.machine_id.toUpperCase()
      }
    } catch {}

    return null
  }

  /**
   * Save anchored Machine ID to all persistent anchors.
   */
  public syncAnchoredMachineId(machineId: string): void {
    const cleanId = machineId.trim().toUpperCase()

    // Anchor 1: Primary path
    const p1 = this.getPrimaryAnchorPath()
    try {
      const dir1 = path.dirname(p1)
      if (!fs.existsSync(dir1)) fs.mkdirSync(dir1, { recursive: true })
      fs.writeFileSync(p1, cleanId, 'utf8')
    } catch {}

    if (this.isCustomOrTestMode) return

    // Anchor 2: UserData path
    const userData = getElectronUserDataPath()
    if (userData) {
      const p2 = path.join(userData, 'machine.id')
      if (p2 !== p1) {
        try {
          if (!fs.existsSync(userData)) fs.mkdirSync(userData, { recursive: true })
          fs.writeFileSync(p2, cleanId, 'utf8')
        } catch {}
      }
    }

    // Anchor 3: Windows Registry
    if (process.platform === 'win32') {
      try {
        writeWinRegistry(REG_KEY_ROOT, REG_VAL_MACHINE_ID, cleanId)
      } catch {}
    }

    // Anchor 4: SQLite DB
    try {
      const db = getDatabaseConnection()
      if (db) {
        this.ensureDbTable(db)
        db.prepare(`
          INSERT INTO system_license_vault (id, machine_id, updated_at)
          VALUES (1, ?, datetime('now','localtime'))
          ON CONFLICT(id) DO UPDATE SET
            machine_id = excluded.machine_id,
            updated_at = excluded.updated_at
        `).run(cleanId)
      }
    } catch {}
  }

  /**
   * Computes an immutable hardware fingerprint that NEVER changes:
   * Uses Motherboard UUID / Serial and Windows MachineGuid.
   * Does NOT rely on volatile network interfaces or user-editable hostnames.
   */
  public computeHardwareFingerprint(): string {
    if (this.cachedRawParts) {
      const rawString = this.cachedRawParts.join(';;;')
      const hash = crypto.createHash('sha256').update(rawString).digest('hex').toUpperCase()
      return `TNDA-${hash.substring(0, 4)}-${hash.substring(4, 8)}-${hash.substring(8, 12)}-${hash.substring(12, 16)}`
    }

    const rawParts: string[] = []

    if (process.platform === 'win32') {
      // 1. Windows Cryptography MachineGuid — 100% stable across OS lifetime
      try {
        const regGuid = execSync('reg query HKLM\\SOFTWARE\\Microsoft\\Cryptography /v MachineGuid', {
          encoding: 'utf8',
          timeout: 1000,
          stdio: ['ignore', 'pipe', 'ignore']
        })
        const match = regGuid.match(/MachineGuid\s+REG_SZ\s+([a-fA-F0-9-]+)/)
        if (match && match[1]) rawParts.push(`WIN_REG:${match[1].trim()}`)
      } catch {}

      // 2. Motherboard BIOS info via fast Registry query
      try {
        const biosReg = execSync('reg query HKLM\\HARDWARE\\DESCRIPTION\\System\\BIOS', {
          encoding: 'utf8',
          timeout: 1000,
          stdio: ['ignore', 'pipe', 'ignore']
        })
        const mb = biosReg.match(/BaseBoardProduct\s+REG_SZ\s+([^\r\n]+)/)
        if (mb && mb[1]) rawParts.push(`WIN_MB:${mb[1].trim()}`)
      } catch {}

      // Fallback: WMIC csproduct uuid
      try {
        const bios = execSync('wmic csproduct get uuid', { encoding: 'utf8', timeout: 1000, stdio: ['ignore', 'pipe', 'ignore'] })
        const uuidMatch = bios.replace(/UUID/i, '').trim()
        if (uuidMatch) rawParts.push(`WIN_BIOS:${uuidMatch}`)
      } catch {}

      // 3. CPU Processor ID via WMIC or Registry
      try {
        const cpu = execSync('wmic cpu get processorid', { encoding: 'utf8', timeout: 1000, stdio: ['ignore', 'pipe', 'ignore'] })
        const cpuMatch = cpu.replace(/ProcessorId/i, '').trim()
        if (cpuMatch) rawParts.push(`WIN_CPU:${cpuMatch}`)
      } catch {
        try {
          const cpuReg = execSync('reg query HKLM\\HARDWARE\\DESCRIPTION\\System\\CentralProcessor\\0 /v ProcessorNameString', {
            encoding: 'utf8',
            timeout: 1000,
            stdio: ['ignore', 'pipe', 'ignore']
          })
          const c = cpuReg.match(/ProcessorNameString\s+REG_SZ\s+([^\r\n]+)/)
          if (c && c[1]) rawParts.push(`WIN_CPU_NAME:${c[1].trim()}`)
        } catch {}
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
      } catch {}
    } else if (process.platform === 'darwin') {
      try {
        const out = execSync('ioreg -rd1 -c IOPlatformExpertDevice', { encoding: 'utf8', timeout: 1000, stdio: ['ignore', 'pipe', 'ignore'] })
        const match = out.match(/"IOPlatformUUID"\s*=\s*"([^"]+)"/)
        if (match && match[1]) rawParts.push(`MAC_UUID:${match[1]}`)
      } catch {}
    }

    // Architecture baseline
    rawParts.push(`ARCH:${os.arch()}`)

    if (rawParts.length <= 1) {
      rawParts.push(`DEV_FALLBACK:${os.platform()}:${os.cpus()?.[0]?.model || 'UNKNOWN_CPU'}`)
    }

    this.cachedRawParts = rawParts
    const rawString = rawParts.join(';;;')
    const hash = crypto.createHash('sha256').update(rawString).digest('hex').toUpperCase()
    return `TNDA-${hash.substring(0, 4)}-${hash.substring(4, 8)}-${hash.substring(8, 12)}-${hash.substring(12, 16)}`
  }

  /**
   * Computes legacy candidate Machine IDs (with network MAC and WMIC)
   * used to seamlessly recognize and rescue existing VIP users whose keys were created under v1.0.54.
   */
  public computeLegacyCandidateMachineIds(): string[] {
    const candidateIds = new Set<string>()

    if (!this.cachedLegacyBaseParts) {
      const baseParts: string[] = []
      if (process.platform === 'win32') {
        try {
          const bios = execSync('wmic csproduct get uuid', { encoding: 'utf8', timeout: 1000, stdio: ['ignore', 'pipe', 'ignore'] })
          const uuidMatch = bios.replace(/UUID/i, '').trim()
          if (uuidMatch) baseParts.push(`WIN_BIOS:${uuidMatch}`)
        } catch {
          try {
            const regGuid = execSync('reg query HKLM\\SOFTWARE\\Microsoft\\Cryptography /v MachineGuid', { encoding: 'utf8', timeout: 1000, stdio: ['ignore', 'pipe', 'ignore'] })
            const match = regGuid.match(/MachineGuid\s+REG_SZ\s+([a-fA-F0-9-]+)/)
            if (match && match[1]) baseParts.push(`WIN_REG:${match[1]}`)
          } catch {}
        }

        try {
          const cpu = execSync('wmic cpu get processorid', { encoding: 'utf8', timeout: 1000, stdio: ['ignore', 'pipe', 'ignore'] })
          const cpuMatch = cpu.replace(/ProcessorId/i, '').trim()
          if (cpuMatch) baseParts.push(`WIN_CPU:${cpuMatch}`)
        } catch {}
      } else if (process.platform === 'linux') {
        try {
          if (fs.existsSync('/etc/machine-id')) {
            baseParts.push(`LINUX_MID:${fs.readFileSync('/etc/machine-id', 'utf8').trim()}`)
          }
        } catch {}
      }
      this.cachedLegacyBaseParts = baseParts
    }

    const macs: string[] = []
    try {
      const ifaces = os.networkInterfaces()
      for (const name of Object.keys(ifaces)) {
        const list = ifaces[name]
        if (!list) continue
        for (const net of list) {
          if (!net.internal && net.mac && net.mac !== '00:00:00:00:00:00') {
            macs.push(net.mac.toLowerCase())
          }
        }
      }
    } catch {}

    const macOptions = [...new Set(macs), '']

    for (const mac of macOptions) {
      const rawParts = [...this.cachedLegacyBaseParts]
      if (mac) {
        rawParts.push(`NET_MAC:${mac}`)
      }

      rawParts.push(`HOST:${os.hostname().toLowerCase()}`)
      rawParts.push(`ARCH:${os.arch()}`)

      const rawString = rawParts.join(';;;')
      const hash = crypto.createHash('sha256').update(rawString).digest('hex').toUpperCase()
      candidateIds.add(`TNDA-${hash.substring(0, 4)}-${hash.substring(4, 8)}-${hash.substring(8, 12)}-${hash.substring(12, 16)}`)
    }

    return Array.from(candidateIds)
  }

  /**
   * Derive live Machine Hardware ID.
   * Priority:
   * 1. If an existing valid VIP license exists on this machine, lock and adopt its Machine ID immediately (rescuing existing VIPs).
   * 2. If a permanent Machine ID anchor exists on disk/registry/DB, use it (zero drift).
   * 3. Compute immutable hardware fingerprint, anchor it permanently across all vaults, and return it.
   */
  public getMachineId(): string {
    if (this.cachedMachineId) return this.cachedMachineId

    // Priority 1: Check if an existing valid VIP license already exists on this machine
    const vaults = this.readAllVaults()
    const legacyCandidates = this.computeLegacyCandidateMachineIds()
    const liveHardwareId = this.computeHardwareFingerprint()

    for (const v of vaults) {
      if (v.licenseKey && v.machineId) {
        const expectedHash = this.computeTamperHash(v.machineId, v.licenseKey, v.activatedAt, v.customerName)
        if (v.tamperProofHash === expectedHash && this.verifyKey(v.licenseKey, v.machineId)) {
          // Verify that this license actually matches THIS physical device (or legacy candidate on this device)
          if (
            v.machineId === liveHardwareId ||
            legacyCandidates.includes(v.machineId) ||
            v.machineId === this.readAnchoredMachineId()
          ) {
            this.cachedMachineId = v.machineId
            this.syncAnchoredMachineId(v.machineId)
            this.syncToAllVaults(v) // Self-heal all vaults
            return v.machineId
          }
        }
      }
    }

    // Priority 2: Check for permanently anchored Machine ID
    const anchored = this.readAnchoredMachineId()
    if (anchored) {
      this.cachedMachineId = anchored
      this.syncAnchoredMachineId(anchored)
      return anchored
    }

    // Priority 3: First-time generation — compute stable hardware identity and anchor permanently
    const freshId = liveHardwareId
    this.cachedMachineId = freshId
    this.syncAnchoredMachineId(freshId)
    return freshId
  }

  /**
   * Load and verify active license status across all vaults.
   */
  public getStatus(): LicenseStatus {
    const canonicalMachineId = this.getMachineId()
    const vaults = this.readAllVaults()

    // 1. Look for any valid VIP license across all vaults
    for (const stored of vaults) {
      if (!stored.licenseKey || !stored.machineId) continue

      // Tamper-Proof Signature Check
      const expectedTamperHash = this.computeTamperHash(stored.machineId, stored.licenseKey, stored.activatedAt, stored.customerName)
      if (stored.tamperProofHash !== expectedTamperHash) {
        continue // Tampered payload, check next vault
      }

      // Cryptographic Mathematical Key Verification
      const isValid = this.verifyKey(stored.licenseKey, stored.machineId)
      if (!isValid) {
        continue // Invalid mathematical key, check next vault
      }

      // Hardware match check
      if (stored.machineId === canonicalMachineId) {
        this.syncToAllVaults(stored)
        this.currentStatus = {
          tier: 'VIP_PRO',
          isVip: true,
          machineId: canonicalMachineId,
          activatedAt: stored.activatedAt,
          customerName: stored.customerName,
          licenseKey: stored.licenseKey,
          statusMessage: 'VIP Pro Lifetime Activated (Hardware Locked & Multi-Vault Protected)'
        }
        return this.currentStatus
      }

      // Legacy candidate reconciliation
      const legacyCandidates = this.computeLegacyCandidateMachineIds()
      if (legacyCandidates.includes(stored.machineId)) {
        this.cachedMachineId = stored.machineId
        this.syncAnchoredMachineId(stored.machineId)
        this.syncToAllVaults(stored)
        this.currentStatus = {
          tier: 'VIP_PRO',
          isVip: true,
          machineId: stored.machineId,
          activatedAt: stored.activatedAt,
          customerName: stored.customerName,
          licenseKey: stored.licenseKey,
          statusMessage: 'VIP Pro Lifetime Activated (Hardware Locked & Multi-Vault Protected)'
        }
        return this.currentStatus
      }
    }

    // 2. If no valid license found, inspect primary storage for explicit feedback
    const primary = this.readPrimaryPayload()
    if (primary && primary.licenseKey) {
      const legacyCandidates = this.computeLegacyCandidateMachineIds()
      if (primary.machineId !== canonicalMachineId && !legacyCandidates.includes(primary.machineId)) {
        this.currentStatus = {
          tier: 'COMMUNITY',
          isVip: false,
          machineId: canonicalMachineId,
          activatedAt: null,
          customerName: null,
          licenseKey: null,
          statusMessage: 'Hardware Mismatch: License is locked to a different computer'
        }
        return this.currentStatus
      }

      const expectedTamperHash = this.computeTamperHash(primary.machineId, primary.licenseKey, primary.activatedAt, primary.customerName)
      if (primary.tamperProofHash !== expectedTamperHash) {
        this.currentStatus = {
          tier: 'COMMUNITY',
          isVip: false,
          machineId: canonicalMachineId,
          activatedAt: null,
          customerName: null,
          licenseKey: null,
          statusMessage: 'Integrity Check Failed: License file was modified'
        }
        return this.currentStatus
      }

      const isValid = this.verifyKey(primary.licenseKey, primary.machineId)
      if (!isValid) {
        this.currentStatus = {
          tier: 'COMMUNITY',
          isVip: false,
          machineId: canonicalMachineId,
          activatedAt: null,
          customerName: null,
          licenseKey: null,
          statusMessage: 'Invalid License Key'
        }
        return this.currentStatus
      }
    }

    // Default: Community Edition
    this.currentStatus = {
      tier: 'COMMUNITY',
      isVip: false,
      machineId: canonicalMachineId,
      activatedAt: null,
      customerName: null,
      licenseKey: null,
      statusMessage: 'Community Edition (Active & Free)'
    }
    return this.currentStatus
  }

  /**
   * Activate VIP Pro using a key provided by Dev Francis.
   * Seamlessly checks both canonical Machine ID and legacy candidate IDs.
   */
  public activate(key: string, customerName?: string): { ok: boolean; message: string; status: LicenseStatus } {
    const cleanKey = (key || '').trim().toUpperCase()

    if (!cleanKey) {
      return {
        ok: false,
        message: 'Please enter a valid VIP License Key.',
        status: this.getStatus()
      }
    }

    const currentMid = this.getMachineId()
    const candidates = [currentMid, ...this.computeLegacyCandidateMachineIds()]

    // Find which candidate ID this key was generated for
    let matchedMid: string | null = null
    for (const cand of candidates) {
      if (this.verifyKey(cleanKey, cand)) {
        matchedMid = cand
        break
      }
    }

    if (!matchedMid) {
      return {
        ok: false,
        message: 'Invalid VIP License Key. The key does not match this computer\'s Machine ID. Send ₱500 to Maya 09912255156 and message Dev Francis on Facebook with your Machine ID.',
        status: this.getStatus()
      }
    }

    // Permanently anchor matched Machine ID as canonical
    this.cachedMachineId = matchedMid
    this.syncAnchoredMachineId(matchedMid)

    const activatedAt = new Date().toISOString()
    const normCustomerName = customerName?.trim() || null
    const tamperProofHash = this.computeTamperHash(matchedMid, cleanKey, activatedAt, normCustomerName)

    const payload: StoredLicensePayload = {
      version: 1,
      tier: 'VIP_PRO',
      machineId: matchedMid,
      licenseKey: cleanKey,
      customerName: normCustomerName,
      activatedAt,
      tamperProofHash
    }

    this.syncToAllVaults(payload)
    const newStatus = this.getStatus()

    return {
      ok: true,
      message: 'TINDA POS VIP Pro has been successfully activated. All VIP features are now permanently unlocked across all updates and restarts for your store.',
      status: newStatus
    }
  }

  /**
   * Deactivate license back to Community across all vaults.
   */
  public deactivate(): { ok: boolean; message: string } {
    const p1 = this.getPrimaryStoragePath()
    if (fs.existsSync(p1)) {
      try { fs.unlinkSync(p1) } catch {}
    }

    if (!this.isCustomOrTestMode) {
      const userData = getElectronUserDataPath()
      if (userData) {
        const p2 = path.join(userData, 'tinda_license.json')
        if (fs.existsSync(p2)) {
          try { fs.unlinkSync(p2) } catch {}
        }
      }

      if (process.platform === 'win32') {
        deleteWinRegistry(REG_KEY_ROOT, REG_VAL_LICENSE_B64)
      }

      try {
        const db = getDatabaseConnection()
        if (db) {
          this.ensureDbTable(db)
          db.prepare('DELETE FROM system_license_vault WHERE id = 1').run()
        }
      } catch {}
    }

    this.currentStatus = null
    return { ok: true, message: 'License deactivated. System is now running Community Edition.' }
  }

  private ensureDbTable(db: any): void {
    try {
      db.exec(`
        CREATE TABLE IF NOT EXISTS system_license_vault (
          id INTEGER PRIMARY KEY CHECK (id = 1),
          machine_id TEXT NOT NULL,
          license_key TEXT,
          customer_name TEXT,
          tier TEXT NOT NULL DEFAULT 'COMMUNITY',
          is_vip INTEGER NOT NULL DEFAULT 0,
          activated_at TEXT,
          tamper_proof_hash TEXT,
          updated_at TEXT NOT NULL DEFAULT (datetime('now','localtime'))
        );
      `)
    } catch {}
  }

  private getPrimaryStoragePath(): string {
    if (this.storageFilePath) return this.storageFilePath
    const fallbackDir = path.join(os.homedir(), '.tindapos')
    return path.join(fallbackDir, 'tinda_license.json')
  }

  private getPrimaryAnchorPath(): string {
    if (this.storageFilePath) {
      return path.join(path.dirname(this.storageFilePath), 'machine.id')
    }
    const fallbackDir = path.join(os.homedir(), '.tindapos')
    return path.join(fallbackDir, 'machine.id')
  }
}

export const licenseService = LicenseService.getInstance()
