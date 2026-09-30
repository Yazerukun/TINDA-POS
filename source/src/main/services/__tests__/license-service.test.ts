import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import * as fs from 'node:fs'
import * as path from 'node:path'
import * as os from 'node:os'
import { LicenseService } from '../licenseService'

describe('LicenseService — Hardware-Locked Machine ID & VIP Pro Activation', () => {
  let tmpDir: string
  let testLicensePath: string
  let licenseSvc: LicenseService

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'tinda-lic-test-'))
    testLicensePath = path.join(tmpDir, 'tinda_license.json')
    licenseSvc = new LicenseService(testLicensePath)
  })

  afterEach(() => {
    try {
      if (fs.existsSync(tmpDir)) {
        fs.rmSync(tmpDir, { recursive: true, force: true })
      }
    } catch {
      // Ignored
    }
  })

  it('generates a consistent, hardware-anchored Machine ID with TNDA- prefix', () => {
    const machineId1 = licenseSvc.getMachineId()
    const machineId2 = licenseSvc.getMachineId()

    expect(machineId1).toBe(machineId2)
    expect(machineId1).toMatch(/^TNDA-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/)
  })

  it('starts in Community Edition when no license file exists', () => {
    const status = licenseSvc.getStatus()
    expect(status.tier).toBe('COMMUNITY')
    expect(status.isVip).toBe(false)
    expect(status.licenseKey).toBeNull()
    expect(status.machineId).toBe(licenseSvc.getMachineId())
  })

  it('generates and verifies cryptographic VIP keys for a specific machine', () => {
    const machineId = licenseSvc.getMachineId()
    const validKey = licenseSvc.generateKeyForMachine(machineId, 'VIP_PRO')

    expect(validKey).toMatch(/^VIP-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/)
    expect(licenseSvc.verifyKey(validKey, machineId)).toBe(true)

    // Key must fail on any other machine ID
    expect(licenseSvc.verifyKey(validKey, 'TNDA-9999-8888-7777-6666')).toBe(false)
    // Key must fail if tampered
    expect(licenseSvc.verifyKey(validKey.slice(0, -1) + 'X', machineId)).toBe(false)
    // Fake key must fail
    expect(licenseSvc.verifyKey('VIP-0000-0000-0000-0000', machineId)).toBe(false)
  })

  it('activates VIP Pro when given a valid key for the machine', () => {
    const machineId = licenseSvc.getMachineId()
    const validKey = licenseSvc.generateKeyForMachine(machineId, 'VIP_PRO')

    const result = licenseSvc.activate(validKey, 'Aling Nena Grocery')
    expect(result.ok).toBe(true)
    expect(result.status.isVip).toBe(true)
    expect(result.status.tier).toBe('VIP_PRO')
    expect(result.status.customerName).toBe('Aling Nena Grocery')

    // Verify persisted status
    const status = licenseSvc.getStatus()
    expect(status.isVip).toBe(true)
    expect(status.tier).toBe('VIP_PRO')
    expect(status.licenseKey).toBe(validKey)
  })

  it('rejects activation when given an invalid key', () => {
    const result = licenseSvc.activate('VIP-FAKE-KEY1-2345-6789')
    expect(result.ok).toBe(false)
    expect(result.status.isVip).toBe(false)
    expect(result.status.tier).toBe('COMMUNITY')
  })

  it('detects hardware mismatch if license file is copied from another PC', () => {
    const anotherMachineId = 'TNDA-AAAA-BBBB-CCCC-DDDD'
    const anotherKey = licenseSvc.generateKeyForMachine(anotherMachineId, 'VIP_PRO')

    // Simulate attacker copying license payload from another machine
    const payload = {
      version: 1,
      tier: 'VIP_PRO',
      machineId: anotherMachineId,
      licenseKey: anotherKey,
      customerName: 'Hacker',
      activatedAt: new Date().toISOString(),
      tamperProofHash: 'any'
    }
    fs.writeFileSync(testLicensePath, JSON.stringify(payload), 'utf8')

    const status = licenseSvc.getStatus()
    expect(status.isVip).toBe(false)
    expect(status.tier).toBe('COMMUNITY')
    expect(status.statusMessage).toContain('Hardware Mismatch')
  })

  it('detects file tampering if attacker edits the license file', () => {
    const machineId = licenseSvc.getMachineId()
    const validKey = licenseSvc.generateKeyForMachine(machineId, 'VIP_PRO')
    licenseSvc.activate(validKey, 'Legit Store')

    // Attacker modifies the file
    const raw = fs.readFileSync(testLicensePath, 'utf8')
    const json = JSON.parse(raw)
    json.customerName = 'Tampered Store'
    fs.writeFileSync(testLicensePath, JSON.stringify(json), 'utf8')

    const status = licenseSvc.getStatus()
    expect(status.isVip).toBe(false)
    expect(status.tier).toBe('COMMUNITY')
    expect(status.statusMessage).toContain('Integrity Check Failed')
  })

  it('deactivates cleanly back to Community Edition', () => {
    const machineId = licenseSvc.getMachineId()
    const validKey = licenseSvc.generateKeyForMachine(machineId, 'VIP_PRO')
    licenseSvc.activate(validKey)

    expect(licenseSvc.getStatus().isVip).toBe(true)

    const deact = licenseSvc.deactivate()
    expect(deact.ok).toBe(true)
    expect(licenseSvc.getStatus().isVip).toBe(false)
    expect(licenseSvc.getStatus().tier).toBe('COMMUNITY')
  })
})
