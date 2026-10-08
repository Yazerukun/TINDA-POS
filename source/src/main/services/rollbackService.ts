import { app, shell } from 'electron'
import { spawn } from 'node:child_process'
import { join } from 'node:path'
import { mkdir, chmod } from 'node:fs/promises'
import { createWriteStream, existsSync, statSync } from 'node:fs'
import type { ReleaseInfo } from '@shared/update'
import { compareSemver, parseGitHubReleases, portableRuntime } from '@shared/update'
import { createBackupSync, validateBackupDatabase } from '../repositories/backup'
import { getDb } from '../database/connection'
import { consumeWithIdleTimeout } from './updateDownload'

import pkg from '../../../package.json'

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
    let currentVersion = pkg.version || '1.0.59'
    try {
      if (app && typeof app.getVersion === 'function') {
        const v = app.getVersion()
        if (v) currentVersion = v
      }
    } catch {}

    const url = 'https://api.github.com/repos/Yazerukun/TINDA-POS/releases'
    let releases: ReleaseInfo[] = []
    try {
      const headers: Record<string, string> = {
        Accept: 'application/vnd.github+json',
        'User-Agent': 'TINDA-POS'
      }
      const token = process.env.GITHUB_TOKEN || process.env.GH_TOKEN
      if (token) headers['Authorization'] = `Bearer ${token}`
      const res = await fetch(url, { headers })
      if (res.ok) {
        const data = await res.json()
        releases = parseGitHubReleases(data)
      } else {
        throw new Error(`GitHub API error ${res.status}`)
      }
      if (releases.length === 0) {
        throw new Error('No releases returned')
      }
    } catch {
      // Offline fallback: provide documented stable fallback releases
      releases = [
        {
          version: '1.0.59',
          tag: 'v1.0.59',
          title: 'TINDA POS v1.0.59 — High-Density Enterprise POS Cashier Listing Engine',
          publishedAt: '2026-10-06T00:30:00Z',
          releaseNotes: 'Supermarket-grade high-density listing table, 1-click dual-mode switcher, and high-speed keyboard navigation.',
          stable: true,
          assets: [
            {
              name: 'TindaPOS-Setup-1.0.59.exe',
              url: 'https://github.com/Yazerukun/TINDA-POS/releases/download/v1.0.59/TindaPOS-Setup-1.0.59.exe',
              size: 112520000
            },
            {
              name: 'TindaPOS-Portable-1.0.59.exe',
              url: 'https://github.com/Yazerukun/TINDA-POS/releases/download/v1.0.59/TindaPOS-Portable-1.0.59.exe',
              size: 112290000
            },
            {
              name: 'TindaPOS-1.0.59.AppImage',
              url: 'https://github.com/Yazerukun/TINDA-POS/releases/download/v1.0.59/TindaPOS-1.0.59.AppImage',
              size: 137000000
            }
          ]
        },
        {
          version: '1.0.58',
          tag: 'v1.0.58',
          title: 'TINDA POS v1.0.58 — Profit Margins Restoration & Automated VIP Rollback Engine',
          publishedAt: '2026-10-05T12:50:00Z',
          releaseNotes: 'Restored Gross Profit accounting, hardened VIP downgrade protection, direct auto-restart, and live download progress.',
          stable: true,
          assets: [
            {
              name: 'TindaPOS-Setup-1.0.58.exe',
              url: 'https://github.com/Yazerukun/TINDA-POS/releases/download/v1.0.58/TindaPOS-Setup-1.0.58.exe',
              size: 112504411
            },
            {
              name: 'TindaPOS-Portable-1.0.58.exe',
              url: 'https://github.com/Yazerukun/TINDA-POS/releases/download/v1.0.58/TindaPOS-Portable-1.0.58.exe',
              size: 112274440
            },
            {
              name: 'TindaPOS-1.0.58.AppImage',
              url: 'https://github.com/Yazerukun/TINDA-POS/releases/download/v1.0.58/TindaPOS-1.0.58.AppImage',
              size: 137000000
            }
          ]
        },
        {
          version: '1.0.57',
          tag: 'v1.0.57',
          title: 'TINDA POS v1.0.57 — Realized Revenue, Zero-Flicker VIP Store & Multi-Theme Engine',
          publishedAt: '2026-10-05T08:35:00Z',
          releaseNotes: 'Financial realized revenue model, zero-flicker VIP store hydration, multi-theme eye-care engine, and quad-vault licensing.',
          stable: true,
          assets: [
            {
              name: 'TindaPOS-Setup-1.0.57.exe',
              url: 'https://github.com/Yazerukun/TINDA-POS/releases/download/v1.0.57/TindaPOS-Setup-1.0.57.exe',
              size: 112300000
            },
            {
              name: 'TindaPOS-Portable-1.0.57.exe',
              url: 'https://github.com/Yazerukun/TINDA-POS/releases/download/v1.0.57/TindaPOS-Portable-1.0.57.exe',
              size: 112080000
            },
            {
              name: 'TindaPOS-1.0.57.AppImage',
              url: 'https://github.com/Yazerukun/TINDA-POS/releases/download/v1.0.57/TindaPOS-1.0.57.AppImage',
              size: 137000000
            }
          ]
        },
        {
          version: '1.0.56',
          tag: 'v1.0.56',
          title: 'TINDA POS v1.0.56 — Permanent Hardware-Anchored VIP Licensing & Version Rollback Recovery',
          publishedAt: '2026-10-05T04:55:00Z',
          releaseNotes: 'Quad-vault redundant VIP license persistence, canonical hardware-anchoring, and pre-rollback DB snapshot.',
          stable: true,
          assets: [
            {
              name: 'TindaPOS-Setup-1.0.56.exe',
              url: 'https://github.com/Yazerukun/TINDA-POS/releases/download/v1.0.56/TindaPOS-Setup-1.0.56.exe',
              size: 112280000
            },
            {
              name: 'TindaPOS-Portable-1.0.56.exe',
              url: 'https://github.com/Yazerukun/TINDA-POS/releases/download/v1.0.56/TindaPOS-Portable-1.0.56.exe',
              size: 112070000
            },
            {
              name: 'TindaPOS-1.0.56.AppImage',
              url: 'https://github.com/Yazerukun/TINDA-POS/releases/download/v1.0.56/TindaPOS-1.0.56.AppImage',
              size: 137000000
            }
          ]
        },
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
    const isPortable = isLinux || portableRuntime(process.env)
    const targets: RollbackTarget[] = []

    for (const r of releases) {
      if (compareSemver(r.version, currentVersion) < 0) {
        let asset = r.assets.find((a) => {
          if (isLinux) {
            return /\.AppImage$/i.test(a.name) || /-linux-x64\.tar\.gz$/i.test(a.name)
          }
          if (isWindows) {
            if (isPortable) {
              return /^TindaPOS-Portable-.*\.exe$/i.test(a.name)
            }
            return /^TindaPOS-Setup-.*\.exe$/i.test(a.name)
          }
          return false
        })

        // If preferred flavor is missing, try any valid Windows or Linux binary
        if (!asset) {
          asset = r.assets.find((a) => /^TindaPOS-.*\.(exe|AppImage)$/i.test(a.name))
        }

        if (!asset && r.assets.length > 0) {
          asset = r.assets.find((a) => !/\.(yml|txt|blockmap)$/i.test(a.name)) || r.assets[0]
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
        if (target.assetSize > 0 && Math.abs(stats.size - target.assetSize) < 1024 * 1024) {
          needsDownload = false
        } else if (stats.size > 80 * 1024 * 1024) {
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

    // Step 4: Direct execution & automatic system restart
    try {
      if (process.platform === 'win32' && installerPath.endsWith('.exe')) {
        const isSetup = installerPath.toLowerCase().includes('setup')
        const args = isSetup ? ['--updated'] : []
        const child = spawn(installerPath, args, {
          detached: true,
          stdio: 'ignore'
        })
        child.unref()

        // Cleanly exit current application so installer can replace binaries without file locks
        setTimeout(() => {
          try {
            app.quit()
          } catch {
            try {
              process.exit(0)
            } catch {}
          }
        }, 1500)
      } else if (process.platform === 'linux') {
        const child = spawn(installerPath, [], {
          detached: true,
          stdio: 'ignore'
        })
        child.unref()
        setTimeout(() => {
          try {
            app.quit()
          } catch {
            try {
              process.exit(0)
            } catch {}
          }
        }, 1500)
      } else {
        void shell.openPath(installerPath)
      }
    } catch {
      try {
        await shell.openPath(installerPath)
      } catch {}
    }

    return {
      ok: true,
      message: `Safety backup secured at ${backupPath}. System is restarting to install v${targetVersion}...`,
      backupPath,
      installerPath
    }
  }
}

export const rollbackService = RollbackService.getInstance()
