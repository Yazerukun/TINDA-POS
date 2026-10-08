import { describe, it, expect } from 'vitest'
import { join } from 'node:path'
import { existsSync, readFileSync } from 'node:fs'
import {
  extractZipArchive,
  applyPatchArchive,
  getPatchedEntryHtml,
  markPatchStable,
  cleanupPatch,
  getPatchSentinel,
  getPatchManifest
} from '../patchService'

import { vi } from 'vitest'

process.env.TINDA_DATA_DIR = '/tmp/tinda-test-data'

vi.mock('electron', () => ({
  app: {
    getVersion: () => '1.0.79'
  }
}))

describe('Linux Real-Time In-App Patch & Update Verification', () => {
  it('successfully unzips and applies the production TindaPOS-Feature-Patch-1.0.80.zip on Linux', async () => {
    const patchZip = join(process.cwd(), 'builds/TindaPOS-Feature-Patch-1.0.80.zip')
    expect(existsSync(patchZip)).toBe(true)

    // 1. Clean previous state
    cleanupPatch()

    // 2. Apply the production archive
    await applyPatchArchive(patchZip, '1.0.80')

    // 3. Verify manifest
    const manifest = getPatchManifest()
    expect(manifest).not.toBeNull()
    expect(manifest?.version).toBe('1.0.80')
    expect(manifest?.type).toBe('FEATURE_PATCH')

    // 4. Verify sentinel status before boot
    const sentinelBefore = getPatchSentinel()
    expect(sentinelBefore).not.toBeNull()
    expect(sentinelBefore?.version).toBe('1.0.80')
    expect(sentinelBefore?.status).toBe('PENDING')

    // 5. Verify patched entry HTML exists and is valid
    const entryHtml = getPatchedEntryHtml()
    expect(entryHtml).not.toBeNull()
    expect(entryHtml).toContain('index.html')
    expect(existsSync(entryHtml!)).toBe(true)

    const htmlContent = readFileSync(entryHtml!, 'utf8')
    expect(htmlContent).toContain('<html')
    expect(htmlContent).toContain('/assets/index-')

    // 6. Verify markPatchStable marks sentinel as STABLE
    markPatchStable()
    const sentinelAfter = getPatchSentinel()
    expect(sentinelAfter?.status).toBe('STABLE')
    expect(sentinelAfter?.failures).toBe(0)
  })

  it('verifies real GitHub releases API payload parses correctly into ReleaseInfo with patch asset', async () => {
    const { parseGitHubReleases, latestStable, compareSemver } = await import('@shared/update')
    const res = await fetch('https://api.github.com/repos/Yazerukun/TINDA-POS/releases', {
      headers: {
        Accept: 'application/vnd.github+json',
        'User-Agent': 'TINDA-POS-Tester'
      }
    })
    expect(res.ok).toBe(true)
    const json = await res.json()
    const releases = parseGitHubReleases(json)
    expect(releases.length).toBeGreaterThan(0)

    const latest = latestStable(releases)
    expect(latest).not.toBeNull()
    expect(compareSemver(latest?.version || '0.0.0', '1.0.81')).toBeGreaterThanOrEqual(0)
    expect(latest?.hasPatch).toBe(true)
    expect(latest?.patchAsset?.name).toMatch(/^TindaPOS-Feature-Patch-\d+\.\d+\.\d+\.zip$/)
  })

  it('runs full UpdateService state machine on Linux from check to READY_TO_INSTALL', async () => {
    const { createUpdateService } = await import('../updateService')
    const patchZip = join(process.cwd(), 'builds/TindaPOS-Feature-Patch-1.0.80.zip')
    const emitted: any[] = []

    const mockStorage = {
      state: { lastCheckedAt: null, dismissedVersion: null },
      load() { return this.state },
      save(s: any) { this.state = s }
    }

    const mockTransport = {
      isPortable: () => true, // Linux behaves as portable / zero-admin
      installedVersion: () => '1.0.79',
      isOnline: async () => true,
      fetchReleases: async () => [
        {
          version: '1.0.80',
          tag: 'v1.0.80',
          title: 'TINDA POS v1.0.80',
          publishedAt: new Date().toISOString(),
          releaseNotes: 'Linux patch fix test',
          stable: true,
          assets: [
            {
              name: 'TindaPOS-Feature-Patch-1.0.80.zip',
              url: 'https://github.com/Yazerukun/TINDA-POS/releases/download/v1.0.80/TindaPOS-Feature-Patch-1.0.80.zip',
              size: 850000
            }
          ],
          hasPatch: true,
          patchAsset: {
            name: 'TindaPOS-Feature-Patch-1.0.80.zip',
            url: 'https://github.com/Yazerukun/TINDA-POS/releases/download/v1.0.80/TindaPOS-Feature-Patch-1.0.80.zip',
            size: 850000
          }
        }
      ],
      downloadSetup: vi.fn(),
      downloadPortable: vi.fn(),
      downloadPatch: async (_release: any, onProgress: any) => {
        onProgress(850000, 850000)
        return { filePath: patchZip }
      },
      applyPatch: async (filePath: string, version: string) => {
        await applyPatchArchive(filePath, version)
      },
      safetyBackup: () => ({ path: '/tmp/test-backup.db' }),
      restartAndInstall: vi.fn(),
      reveal: vi.fn()
    }

    const service = createUpdateService({
      transport: mockTransport as any,
      storage: mockStorage as any,
      emit: (e) => emitted.push(e)
    })

    // Step 1: Check update
    const checkResult = await service.check({ manual: true })
    expect(checkResult.status).toBe('UPDATE_AVAILABLE')
    expect(checkResult.updateType).toBe('PATCH')
    expect(checkResult.available?.version).toBe('1.0.80')

    // Step 2: Download & Apply patch
    const downloadResult = await service.download()
    expect(downloadResult.status).toBe('READY_TO_INSTALL')
    expect(downloadResult.updateType).toBe('PATCH')
    expect(downloadResult.message).toContain('Zero system restart required')

    // Step 3: Verify patch was extracted and ready on Linux
    const entryHtml = getPatchedEntryHtml()
    expect(entryHtml).not.toBeNull()
    expect(existsSync(entryHtml!)).toBe(true)
  })
})

