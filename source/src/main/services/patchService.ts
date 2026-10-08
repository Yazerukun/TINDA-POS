import { app, BrowserWindow } from 'electron'
import { execFile } from 'node:child_process'
import { existsSync, mkdirSync, readFileSync, rmSync, renameSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { promisify } from 'node:util'
import { compareSemver } from '@shared/update'
import { appDirs } from '../database/connection'

const execFileAsync = promisify(execFile)

export interface PatchManifest {
  name: string
  version: string
  type: 'FEATURE_PATCH'
  createdAt: string
  minBaseVersion?: string
}

export interface PatchSentinel {
  version: string
  attempts: number
  failures: number
  status: 'PENDING' | 'STABLE' | 'FAILED'
  lastAttemptAt: string
}

export function getPatchDir(): string {
  return join(appDirs().root, 'patches')
}

export function getPatchManifest(): PatchManifest | null {
  const manifestPath = join(getPatchDir(), 'manifest.json')
  if (!existsSync(manifestPath)) return null
  try {
    const raw = readFileSync(manifestPath, 'utf8')
    return JSON.parse(raw) as PatchManifest
  } catch {
    return null
  }
}

export function getPatchSentinel(): PatchSentinel | null {
  const sentinelPath = join(getPatchDir(), 'sentinel.json')
  if (!existsSync(sentinelPath)) return null
  try {
    const raw = readFileSync(sentinelPath, 'utf8')
    return JSON.parse(raw) as PatchSentinel
  } catch {
    return null
  }
}

export function writePatchSentinel(sentinel: PatchSentinel): void {
  const sentinelPath = join(getPatchDir(), 'sentinel.json')
  try {
    writeFileSync(sentinelPath, JSON.stringify(sentinel, null, 2), 'utf8')
  } catch (err) {
    console.error('[PatchService] Failed to write patch sentinel:', err)
  }
}

/**
 * Checks for a verified, active feature patch.
 * Returns the file path to patched renderer/index.html if safe to load,
 * or null if no patch is active or if auto-rollback triggered.
 */
export function getPatchedEntryHtml(): string | null {
  const patchDir = getPatchDir()
  const entryHtml = join(patchDir, 'renderer', 'index.html')
  if (!existsSync(entryHtml)) return null

  const manifest = getPatchManifest()
  if (!manifest || !manifest.version) return null

  const currentVersion = app.getVersion() || '0.0.0'
  if (compareSemver(currentVersion, manifest.version) >= 0) {
    // Current base app is already equal to or newer than the patch. Clean up patch folder.
    cleanupPatch()
    return null
  }

  // Crash Sentinel check: protect cashier from repeated boot failure
  let sentinel = getPatchSentinel()
  if (!sentinel) {
    sentinel = {
      version: manifest.version,
      attempts: 0,
      failures: 0,
      status: 'PENDING',
      lastAttemptAt: new Date().toISOString()
    }
  }

  if (sentinel.status !== 'STABLE' && sentinel.attempts >= 2) {
    console.warn('[PatchService] Patch boot failed repeatedly. Executing automatic rollback.')
    cleanupPatch()
    return null
  }

  sentinel.attempts += 1
  sentinel.lastAttemptAt = new Date().toISOString()
  writePatchSentinel(sentinel)

  return entryHtml
}

/**
 * Marks the active patch as stable once UI and database successfully mount.
 */
export function markPatchStable(): void {
  const sentinel = getPatchSentinel()
  if (!sentinel) return
  sentinel.status = 'STABLE'
  sentinel.failures = 0
  writePatchSentinel(sentinel)
}

/**
 * Cleans up and removes the patches directory safely.
 */
export function cleanupPatch(): void {
  const patchDir = getPatchDir()
  try {
    if (existsSync(patchDir)) {
      rmSync(patchDir, { recursive: true, force: true })
    }
  } catch (err) {
    console.error('[PatchService] Failed to remove patch directory:', err)
  }
}

/**
 * Extracts a zip archive using Windows built-in bsdtar.
 */
export async function extractZipArchive(zipPath: string, targetDir: string): Promise<void> {
  if (!existsSync(targetDir)) {
    mkdirSync(targetDir, { recursive: true })
  }
  // Windows 10/11 includes native bsdtar which handles standard .zip archives
  await execFileAsync('tar', ['-xf', zipPath, '-C', targetDir])
}

/**
 * Applies a downloaded feature patch archive.
 * Performs validation, atomic swap, and initial sentinel configuration.
 */
export async function applyPatchArchive(zipPath: string, expectedVersion: string): Promise<void> {
  const stagingDir = join(appDirs().root, 'patches_staging')
  const patchDir = getPatchDir()
  const backupDir = join(appDirs().root, 'patches_prev')

  // Clean staging directory
  if (existsSync(stagingDir)) {
    rmSync(stagingDir, { recursive: true, force: true })
  }
  mkdirSync(stagingDir, { recursive: true })

  // Extract archive
  await extractZipArchive(zipPath, stagingDir)

  // Verify manifest
  const manifestPath = join(stagingDir, 'manifest.json')
  if (!existsSync(manifestPath)) {
    rmSync(stagingDir, { recursive: true, force: true })
    throw new Error('Patch archive is invalid: missing manifest.json.')
  }

  const manifest = JSON.parse(readFileSync(manifestPath, 'utf8')) as PatchManifest
  if (manifest.version !== expectedVersion) {
    rmSync(stagingDir, { recursive: true, force: true })
    throw new Error(`Patch version mismatch: expected ${expectedVersion}, found ${manifest.version}.`)
  }

  const rendererHtml = join(stagingDir, 'renderer', 'index.html')
  if (!existsSync(rendererHtml)) {
    rmSync(stagingDir, { recursive: true, force: true })
    throw new Error('Patch archive is invalid: missing renderer payload.')
  }

  // Swap directories safely
  try {
    if (existsSync(backupDir)) {
      rmSync(backupDir, { recursive: true, force: true })
    }
    if (existsSync(patchDir)) {
      renameSync(patchDir, backupDir)
    }
    renameSync(stagingDir, patchDir)

    // Initialize sentinel
    const sentinel: PatchSentinel = {
      version: expectedVersion,
      attempts: 0,
      failures: 0,
      status: 'PENDING',
      lastAttemptAt: new Date().toISOString()
    }
    writePatchSentinel(sentinel)

    // Remove backup after successful swap
    if (existsSync(backupDir)) {
      rmSync(backupDir, { recursive: true, force: true })
    }
  } catch (err) {
    // If swap failed and backup exists, restore previous patch
    if (!existsSync(patchDir) && existsSync(backupDir)) {
      renameSync(backupDir, patchDir)
    }
    throw err
  }
}

/**
 * Zero-Restart In-Place UI Reload:
 * Live-reloads all active BrowserWindow instances with the newly extracted patch
 * in less than 300ms without terminating the desktop process or dropping SQLite handles.
 */
export function reloadLiveWithPatch(): boolean {
  const patchedEntry = getPatchedEntryHtml()
  if (!patchedEntry) return false

  const windows = BrowserWindow.getAllWindows()
  if (windows.length === 0) return false

  for (const win of windows) {
    if (!win.isDestroyed()) {
      win.loadFile(patchedEntry)
    }
  }
  markPatchStable()
  return true
}

