import { app, shell } from 'electron'
import { join } from 'node:path'
import { mkdir, chmod } from 'node:fs/promises'
import { createWriteStream, existsSync, statSync } from 'node:fs'
import type { ReleaseInfo } from '@shared/update'
import { compareSemver, parseGitHubReleases } from '@shared/update'
import { createBackupSync, validateBackupDatabase } from '../repositories/backup'
import { getDb } from '../database/connection'
import { consumeWithIdleTimeout } from './updateDownload'

export interface RollbackTarget {
  version: string
  tag: string
  title: string
  publishedAt: string
  releaseNotes: string
  assetName: string
  assetUrl: string
  assetSize: number
}

export class RollbackService {
  private static instance: RollbackService | null = null

  public static getInstance(): RollbackService {
    if (!RollbackService.instance) {
      RollbackService.instance = new RollbackService()
    }
    return RollbackService.instance
  }

  /**
   * Fetch previous stable releases that are strictly older than the currently installed version.
   */
  async getRollbackTargets(): Promise<RollbackTarget[]> {
    let currentVersion = '1.0.56'
    try {
      if (app && typeof app.getVersion === 'function') {
        currentVersion = app.getVersion()
      }
    } catch {}

    const url = 'https://api.github.com/repos/Yazerukun/TINDA-POS/releases'
    let releases: ReleaseInfo[] = []
    try {
      const res = await fetch(url, {
        headers: {
          Accept: 'application/vnd.github+json',
          'User-Agent': 'TINDA-POS'
        }
      })
      if (res.ok) {
        const data = await res.json()
        releases = parseGitHubReleases(data)
      }
    } catch {
      // Offline fallback: provide documented stable fallback releases
      releases = [
        {
          version: '1.0.55',
          tag: 'v1.0.55',
          title: 'TINDA POS v1.0.55 — VIP E-Wallet Reconciliation Hub Polish & Enhanced Lounge',
          publishedAt: '2026-10-05T04:15:56Z',
          releaseNotes: 'Physical cash drawer zero float override, transactions ledger, and 1-tap void modal.',
          stable: true,
          assets: [
            {
              name: 'TindaPOS-Setup-1.0.55.exe',
              url: 'https://github.com/Yazerukun/TINDA-POS/releases/download/v1.0.55/TindaPOS-Setup-1.0.55.exe',
              size: 112280000
            },
            {
              name: 'TindaPOS-Portable-1.0.55.exe',
              url: 'https://github.com/Yazerukun/TINDA-POS/releases/download/v1.0.55/TindaPOS-Portable-1.0.55.exe',
              size: 112070000
            }
          ]
        },
        {
          version: '1.0.54',
          tag: 'v1.0.54',
          title: 'TINDA POS v1.0.54 — Enhanced Global Lounge & Real-time Chime',
          publishedAt: '2026-10-04T12:00:00Z',
          releaseNotes: 'Web Audio chime, draggable chat window, and minimizable capsule pill.',
          stable: true,
          assets: [
            {
              name: 'TindaPOS-Setup-1.0.54.exe',
              url: 'https://github.com/Yazerukun/TINDA-POS/releases/download/v1.0.54/TindaPOS-Setup-1.0.54.exe',
              size: 111000000
            },
            {
              name: 'TindaPOS-Portable-1.0.54.exe',
              url: 'https://github.com/Yazerukun/TINDA-POS/releases/download/v1.0.54/TindaPOS-Portable-1.0.54.exe',
              size: 111000000
            }
          ]
        }
      ]
    }

    const isWindows = process.platform === 'win32'
    const isLinux = process.platform === 'linux'
    const targets: RollbackTarget[] = []

    for (const r of releases) {
      if (compareSemver(r.version, currentVersion) < 0) {
        let asset = r.assets.find((a) => {
          if (isLinux) {
            return /\.AppImage$/i.test(a.name) || /-linux-x64\.tar\.gz$/i.test(a.name)
          }
          if (isWindows) {
            return /^TindaPOS-Setup-.*\.exe$/i.test(a.name) || /^TindaPOS-Portable-.*\.exe$/i.test(a.name)
          }
          return false
        })

        if (!asset && r.assets.length > 0) {
          asset = r.assets[0]
        }

        if (asset) {
          targets.push({
            version: r.version,
            tag: r.tag,
            title: r.title,
            publishedAt: r.publishedAt,
            releaseNotes: r.releaseNotes,
            assetName: asset.name,
            assetUrl: asset.url,
            assetSize: asset.size
          })
        }
      }
    }

    return targets
  }

  /**
   * Execute safe rollback to target version:
   * 1. Creates verified pre-rollback SQLite backup
   * 2. Downloads previous installer
   * 3. Launches installer / reveals folder
   */
  async executeRollback(
    targetVersion: string,
    onProgress?: (downloaded: number, total: number) => void
  ): Promise<{ ok: boolean; message: string; backupPath: string; installerPath: string }> {
    // Step 1: Pre-rollback safety backup
    let backupPath = ''
    try {
      const backup = createBackupSync(getDb(), 'BEFORE_UPDATE')
      validateBackupDatabase(backup.path)
      backupPath = backup.path
    } catch (err) {
      throw new Error(`Safety backup failed: ${(err as Error)?.message || String(err)}. Rollback aborted to protect your data.`)
    }

    // Step 2: Find target release
    const targets = await this.getRollbackTargets()
    const target = targets.find((t) => t.version === targetVersion)
    if (!target) {
      throw new Error(`Release v${targetVersion} is not available for rollback.`)
    }

    // Step 3: Download target installer
    let downloadsDir: string
    try {
      downloadsDir = app.getPath('downloads')
    } catch {
      downloadsDir = join(process.env.USERPROFILE || process.cwd(), 'Downloads')
    }

    const dir = join(downloadsDir, 'TINDA-POS-Rollback')
    await mkdir(dir, { recursive: true })
    const installerPath = join(dir, target.assetName)

    // Check if already downloaded and size matches
    let needsDownload = true
    if (existsSync(installerPath)) {
      try {
        const stats = statSync(installerPath)
        if (target.assetSize <= 0 || stats.size === target.assetSize) {
          needsDownload = false
        }
      } catch {}
    }

    if (needsDownload) {
      const res = await fetch(target.assetUrl, { headers: { 'User-Agent': 'TINDA-POS' } })
      if (!res.ok) throw new Error(`Download failed with status ${res.status}`)

      const total = Number(res.headers.get('content-length')) || target.assetSize || 0
      await new Promise<void>((resolve, reject) => {
        const out = createWriteStream(installerPath)
        const reader = res.body?.getReader()
        let received = 0
        if (!reader) {
          out.end()
          reject(new Error('No response body'))
          return
        }
        out.on('error', (e) => reject(e))
        void consumeWithIdleTimeout(reader, (chunk) => {
          received += chunk?.byteLength ?? 0
          out.write(Buffer.from(chunk))
          if (total > 0 && onProgress) onProgress(received, total)
        })
          .then(() => out.end(() => resolve()))
          .catch((err) => {
            out.destroy()
            reject(err)
          })
      })
    }

    if (process.platform === 'linux') {
      await chmod(installerPath, 0o755).catch(() => undefined)
    }

    // Step 4: Launch installer or reveal file
    try {
      if (process.platform === 'win32' && installerPath.endsWith('.exe')) {
        void shell.openPath(installerPath)
      } else {
        void shell.showItemInFolder(installerPath)
      }
    } catch {}

    return {
      ok: true,
      message: `Verified safety backup saved to ${backupPath}. Version ${targetVersion} installer is ready at ${installerPath}. Launching installer...`,
      backupPath,
      installerPath
    }
  }
}

export const rollbackService = RollbackService.getInstance()
