import { describe, expect, it, beforeEach, afterEach, vi } from 'vitest'
import { mkdirSync, rmSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import {
  getPatchedEntryHtml,
  markPatchStable,
  getPatchManifest,
  getPatchSentinel,
  writePatchSentinel,
  cleanupPatch,
  type PatchManifest
} from '../patchService'

const testDir = join(tmpdir(), 'tinda-patch-test-' + Date.now())

vi.mock('../../database/connection', () => ({
  appDirs: () => ({
    root: testDir,
    database: join(testDir, 'database'),
    backups: join(testDir, 'backups'),
    receipts: join(testDir, 'receipts'),
    logs: join(testDir, 'logs'),
    exports: join(testDir, 'exports'),
    images: join(testDir, 'images')
  })
}))

vi.mock('electron', () => ({
  app: {
    getVersion: () => '1.0.74'
  }
}))

describe('patchService tests', () => {
  beforeEach(() => {
    mkdirSync(join(testDir, 'patches', 'renderer'), { recursive: true })
  })

  afterEach(() => {
    try {
      rmSync(testDir, { recursive: true, force: true })
    } catch {
      // non-fatal
    }
  })

  it('returns null if no manifest or renderer index.html exists', () => {
    cleanupPatch()
    expect(getPatchedEntryHtml()).toBeNull()
  })

  it('loads patched index.html when valid newer patch manifest exists', () => {
    const manifest: PatchManifest = {
      name: 'TINDA POS',
      version: '1.0.75',
      type: 'FEATURE_PATCH',
      createdAt: new Date().toISOString()
    }
    writeFileSync(join(testDir, 'patches', 'manifest.json'), JSON.stringify(manifest), 'utf8')
    writeFileSync(join(testDir, 'patches', 'renderer', 'index.html'), '<html><body>Patched</body></html>', 'utf8')

    const entry = getPatchedEntryHtml()
    expect(entry).not.toBeNull()
    expect(entry).toContain('index.html')

    const sentinel = getPatchSentinel()
    expect(sentinel?.version).toBe('1.0.75')
    expect(sentinel?.attempts).toBe(1)
  })

  it('marks patch as stable and resets failures', () => {
    const manifest: PatchManifest = {
      name: 'TINDA POS',
      version: '1.0.75',
      type: 'FEATURE_PATCH',
      createdAt: new Date().toISOString()
    }
    writeFileSync(join(testDir, 'patches', 'manifest.json'), JSON.stringify(manifest), 'utf8')
    writeFileSync(join(testDir, 'patches', 'renderer', 'index.html'), '<html><body>Patched</body></html>', 'utf8')

    writePatchSentinel({
      version: '1.0.75',
      attempts: 1,
      failures: 1,
      status: 'PENDING',
      lastAttemptAt: new Date().toISOString()
    })

    markPatchStable()
    const updated = getPatchSentinel()
    expect(updated?.status).toBe('STABLE')
    expect(updated?.failures).toBe(0)
  })

  it('triggers auto-rollback when sentinel detects repeated boot crashes', () => {
    const manifest: PatchManifest = {
      name: 'TINDA POS',
      version: '1.0.75',
      type: 'FEATURE_PATCH',
      createdAt: new Date().toISOString()
    }
    writeFileSync(join(testDir, 'patches', 'manifest.json'), JSON.stringify(manifest), 'utf8')
    writeFileSync(join(testDir, 'patches', 'renderer', 'index.html'), '<html><body>Patched</body></html>', 'utf8')

    // Simulate 2 previous failed boot attempts without reaching stable
    writePatchSentinel({
      version: '1.0.75',
      attempts: 2,
      failures: 2,
      status: 'PENDING',
      lastAttemptAt: new Date().toISOString()
    })

    // Third attempt should trigger auto-rollback and return null
    const entry = getPatchedEntryHtml()
    expect(entry).toBeNull()
    expect(getPatchManifest()).toBeNull()
  })

  it('automatically cleans up patch when base app is already equal to or newer', () => {
    // Current base is mocked as 1.0.74, so a 1.0.74 or older patch should be cleaned up
    const manifest: PatchManifest = {
      name: 'TINDA POS',
      version: '1.0.74',
      type: 'FEATURE_PATCH',
      createdAt: new Date().toISOString()
    }
    writeFileSync(join(testDir, 'patches', 'manifest.json'), JSON.stringify(manifest), 'utf8')
    writeFileSync(join(testDir, 'patches', 'renderer', 'index.html'), '<html><body>Old Patch</body></html>', 'utf8')

    const entry = getPatchedEntryHtml()
    expect(entry).toBeNull()
    expect(getPatchManifest()).toBeNull()
  })

  it('extractZipArchive extracts zip archives cross-platform successfully', async () => {
    const { execSync } = await import('node:child_process')
    const { readFileSync } = await import('node:fs')
    const testZipSource = join(testDir, 'zip_src')
    mkdirSync(testZipSource, { recursive: true })
    writeFileSync(join(testZipSource, 'hello.txt'), 'TINDA POS ZIP TEST', 'utf8')

    const zipFile = join(testDir, 'test.zip')
    if (process.platform === 'win32') {
      execSync(`tar -a -cf "${zipFile}" hello.txt`, { cwd: testZipSource })
    } else {
      try {
        execSync(`zip -q "${zipFile}" hello.txt`, { cwd: testZipSource })
      } catch {
        execSync(`python3 -m zipfile -c "${zipFile}" hello.txt`, { cwd: testZipSource })
      }
    }

    const destDir = join(testDir, 'extracted')
    const { extractZipArchive } = await import('../patchService')
    await extractZipArchive(zipFile, destDir)

    // Verify extraction succeeded
    const found = readFileSync(join(destDir, 'hello.txt'), 'utf8').trim()
    expect(found).toBe('TINDA POS ZIP TEST')
  })
})

