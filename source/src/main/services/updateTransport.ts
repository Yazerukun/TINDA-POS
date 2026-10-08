import { app, net, shell } from 'electron'
import { createWriteStream } from 'node:fs'
import { join } from 'node:path'
import { mkdir, unlink } from 'node:fs/promises'
import type { ReleaseInfo } from '@shared/update'
import { compareSemver, githubReleasesApiUrl, isOfficialUpdateUrl, parseGitHubReleases, pickAsset, portableRuntime, UPDATE_OWNER, UPDATE_REPO } from '@shared/update'
import type { UpdateProgressHandler, UpdateTransport } from './updateService'
import { UpdateCheckError } from './updateService'
import { appDirs, getDb } from '../database/connection'
import { createBackupSync, validateBackupDatabase } from '../repositories/backup'
import { consumeWithIdleTimeout, UPDATE_REQUEST_START_TIMEOUT_MS } from './updateDownload'
import { downloadInstalledUpdate } from './installedUpdate'
import { applyPatchArchive } from './patchService'

const GITHUB_ASSET_HOSTS = new Set([
  'github.com',
  'api.github.com',
  'objects.githubusercontent.com',
  'release-assets.githubusercontent.com',
  'github-releases.githubusercontent.com'
])

async function fetchWithStartTimeout(url: string, init: RequestInit = {}): Promise<Response> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), UPDATE_REQUEST_START_TIMEOUT_MS)
  try {
    return await net.fetch(url, { ...init, signal: controller.signal, redirect: 'follow' })
  } finally {
    clearTimeout(timer)
  }
}

export class ElectronUpdateTransport implements UpdateTransport {
  private updater: Promise<import('electron-updater').AppUpdater | null> | null = null
  private progressHandler: UpdateProgressHandler | null = null
  private isPatchApplied = false

  isPortable(): boolean {
    return process.platform === 'linux' || portableRuntime(process.env)
  }

  installedVersion(): string {
    try {
      const { getPatchManifest, getPatchSentinel } = require('./patchService') as typeof import('./patchService')
      const manifest = getPatchManifest()
      const sentinel = getPatchSentinel()
      const baseVersion = app.getVersion() || '0.0.0'
      if (manifest?.version && (sentinel?.status === 'STABLE' || sentinel?.status === 'PENDING')) {
        if (compareSemver(manifest.version, baseVersion) >= 0) {
          return manifest.version
        }
      }
      return baseVersion
    } catch {
      return app.getVersion() || '0.0.0'
    }
  }

  async isOnline(): Promise<boolean> {
    try {
      return net.isOnline()
    } catch {
      return false
    }
  }

  async fetchReleases(): Promise<ReleaseInfo[]> {
    let res: Response
    try {
      res = await fetchWithStartTimeout(githubReleasesApiUrl(), {
        headers: {
          Accept: 'application/vnd.github+json',
          'User-Agent': 'TINDA-POS'
        }
      })
    } catch (err) {
      if (err instanceof Error && (err.name === 'TimeoutError' || err.name === 'AbortError')) {
        throw new UpdateCheckError('TIMEOUT', 'update check timed out')
      }
      throw new UpdateCheckError('NETWORK', err instanceof Error ? err.message : 'network failure')
    }
    if (res.status === 403 || res.status === 429) {
      const fallback = await this.fetchManifestFallback()
      if (fallback) return [fallback]
      throw new UpdateCheckError('RATE_LIMIT', `GitHub ${res.status}`)
    }
    if (!res.ok) throw new UpdateCheckError('HTTP', `GitHub ${res.status}`)
    const finalUrl = res.url || githubReleasesApiUrl()
    if (!officialResponseUrl(finalUrl)) throw new UpdateCheckError('INVALID', 'unexpected update source')
    const body = await res.text()
    let parsed: unknown
    try {
      parsed = JSON.parse(body)
    } catch {
      throw new UpdateCheckError('INVALID', 'invalid update payload')
    }
    const releases = parseGitHubReleases(parsed)
    if (releases.length === 0) throw new UpdateCheckError('INVALID', 'no valid releases')
    return releases
  }

  private async fetchManifestFallback(): Promise<ReleaseInfo | null> {
    try {
      const manifestUrl = `https://raw.githubusercontent.com/${UPDATE_OWNER}/${UPDATE_REPO}/master/latest.yml`
      const res = await fetchWithStartTimeout(manifestUrl, { headers: { 'User-Agent': 'TINDA-POS' } })
      if (!res.ok) return null
      const text = await res.text()
      const match = text.match(/^version:\s*([^\s]+)/m)
      if (!match || !match[1]) return null
      const v = match[1]
      return {
        version: v,
        tag: `v${v}`,
        title: `TINDA POS v${v}`,
        publishedAt: new Date().toISOString(),
        releaseNotes: `Fast Feature Update v${v}`,
        stable: true,
        assets: [
          {
            name: `TindaPOS-Feature-Patch-${v}.zip`,
            url: `https://github.com/${UPDATE_OWNER}/${UPDATE_REPO}/releases/download/v${v}/TindaPOS-Feature-Patch-${v}.zip`,
            size: 850000
          },
          {
            name: `TindaPOS-Setup-${v}.exe`,
            url: `https://github.com/${UPDATE_OWNER}/${UPDATE_REPO}/releases/download/v${v}/TindaPOS-Setup-${v}.exe`,
            size: 112000000
          }
        ],
        hasPatch: true,
        patchAsset: {
          name: `TindaPOS-Feature-Patch-${v}.zip`,
          url: `https://github.com/${UPDATE_OWNER}/${UPDATE_REPO}/releases/download/v${v}/TindaPOS-Feature-Patch-${v}.zip`,
          size: 850000
        }
      }
    } catch {
      return null
    }
  }

  /**
   * Attempt a restart-and-install via electron-updater's NSIS integration.
   * Only usable when actually packaged on Windows; otherwise we reject rather
   * than faking success.
   */
  async downloadSetup(release: ReleaseInfo, onProgress: UpdateProgressHandler): Promise<void> {
    if (process.platform !== 'win32' || !app.isPackaged) {
      throw new Error('The installed updater is only available in a packaged Windows build.')
    }
    const updater = await this.getUpdater()
    if (!updater) throw new Error('The installed updater is not available.')
    updater.forceDevUpdateConfig = false
    this.setDownloadProgress(onProgress)
    try {
      await downloadInstalledUpdate(updater, release)
    } finally {
      this.setDownloadProgress(null)
    }
  }

  async downloadPortable(release: ReleaseInfo, onProgress: UpdateProgressHandler): Promise<{ filePath: string }> {
    const isLinux = process.platform === 'linux'
    const asset = release.assets.find((a) =>
      isLinux
        ? /^TindaPOS-.*\.AppImage$/i.test(a.name) || /^TindaPOS-.*-linux-.*\.tar\.gz$/i.test(a.name)
        : /^TindaPOS-Portable-\d+\.\d+\.\d+[^.]*\.exe$/i.test(a.name) || /^TindaPOS-Setup-\d+\.\d+\.\d+[^.]*\.exe$/i.test(a.name)
    ) ?? release.fullAsset ?? null
    if (!asset) {
      throw new Error(
        isLinux
          ? 'The Linux update package (AppImage/tar.gz) was not found for this release.'
          : 'The complete installer package was not found for this release.'
      )
    }
    if (!isOfficialUpdateUrl(asset.url)) throw new Error('The update file has an unexpected source.')

    let res: Response
    try {
      res = await fetchWithStartTimeout(asset.url, { headers: { 'User-Agent': 'TINDA-POS' } })
    } catch (err) {
      throw new Error(err instanceof Error && err.message ? `Download failed: ${err.message}` : 'Download failed')
    }
    if (!res.ok) throw new Error(`Download failed (HTTP ${res.status}).`)
    if (res.url && !officialResponseUrl(res.url)) throw new Error('The download redirected to an unexpected source.')

    const dir = join(app.getPath('downloads'), 'TINDA-POS-Updates')
    await mkdir(dir, { recursive: true })
    const filePath = join(dir, asset.name)
    const total = Number(res.headers.get('content-length')) || 0

    try {
      await new Promise<void>((resolve, reject) => {
        const out = createWriteStream(filePath)
        const reader = res.body?.getReader()
        let received = 0
        if (!reader) {
          out.end()
          reject(new Error('The server did not provide a downloadable file.'))
          return
        }
        out.on('error', (err) => reject(err))
        void consumeWithIdleTimeout(reader, (value) => {
            received += value?.byteLength ?? 0
            out.write(Buffer.from(value))
            if (total > 0) onProgress(received, total)
          })
          .then(() => out.end(() => resolve()))
          .catch((err: unknown) => {
            out.destroy()
            reject(err instanceof Error && err.message ? err : new Error('Download failed'))
          })
        })

      if (isLinux) {
        const { chmod, copyFile, rename } = await import('node:fs/promises')
        await chmod(filePath, 0o755).catch(() => undefined)

        const runningAppImage = process.env.APPIMAGE
        if (runningAppImage) {
          try {
            const tempTarget = `${runningAppImage}.update-tmp`
            await copyFile(filePath, tempTarget)
            await chmod(tempTarget, 0o755)
            await rename(tempTarget, runningAppImage)
          } catch {
            // Non-fatal
          }
        }
      }
    } catch (error) {
      await unlink(filePath).catch(() => undefined)
      throw error
    }
    return { filePath }
  }

  async downloadPatch(release: ReleaseInfo, onProgress: UpdateProgressHandler): Promise<{ filePath: string }> {
    const asset = pickAsset(release, 'patch')
    if (!asset) {
      throw new Error('The feature patch file was not found for this release.')
    }
    if (!isOfficialUpdateUrl(asset.url)) throw new Error('The patch file has an unexpected source.')

    let res: Response
    try {
      res = await fetchWithStartTimeout(asset.url, { headers: { 'User-Agent': 'TINDA-POS' } })
    } catch (err) {
      throw new Error(err instanceof Error && err.message ? `Download failed: ${err.message}` : 'Download failed')
    }
    if (!res.ok) throw new Error(`Download failed (HTTP ${res.status}).`)
    if (res.url && !officialResponseUrl(res.url)) throw new Error('The patch download redirected to an unexpected source.')

    const dir = join(appDirs().root, 'updates')
    await mkdir(dir, { recursive: true })
    const filePath = join(dir, asset.name)
    const total = Number(res.headers.get('content-length')) || 0

    try {
      await new Promise<void>((resolve, reject) => {
        const out = createWriteStream(filePath)
        const reader = res.body?.getReader()
        let received = 0
        if (!reader) {
          out.end()
          reject(new Error('The server did not provide a downloadable patch file.'))
          return
        }
        out.on('error', (err) => reject(err))
        void consumeWithIdleTimeout(reader, (value) => {
            received += value?.byteLength ?? 0
            out.write(Buffer.from(value))
            if (total > 0) onProgress(received, total)
          })
          .then(() => out.end(() => resolve()))
          .catch((err: unknown) => {
            out.destroy()
            reject(err instanceof Error && err.message ? err : new Error('Download failed'))
          })
      })
      return { filePath }
    } catch (err) {
      await unlink(filePath).catch(() => undefined)
      throw err
    }
  }

  async applyPatch(filePath: string, version: string): Promise<void> {
    await applyPatchArchive(filePath, version)
    this.isPatchApplied = true
  }

  safetyBackup(): { path: string } | null {
    try {
      const backup = createBackupSync(getDb(), 'BEFORE_UPDATE')
      validateBackupDatabase(backup.path)
      return { path: backup.path }
    } catch {
      return null
    }
  }

  restartAndInstall(): void {
    if (this.isPatchApplied) {
      try {
        const { reloadLiveWithPatch } = require('./patchService') as typeof import('./patchService')
        if (reloadLiveWithPatch()) return
      } catch {
        // Fall back to relaunch
      }
      app.relaunch()
      app.exit(0)
      return
    }
    const updater = require('electron-updater') as typeof import('electron-updater')
    updater.autoUpdater.quitAndInstall(true, true)
  }

  async reveal(path: string): Promise<void> {
    if (process.platform === 'linux' && process.env.APPIMAGE) {
      try {
        app.relaunch({ execPath: process.env.APPIMAGE })
        app.exit(0)
        return
      } catch {
        // Fallback to showItemInFolder
      }
    }
    await shell.showItemInFolder(path)
  }

  private async getUpdater(): Promise<import('electron-updater').AppUpdater | null> {
    if (this.updater) return this.updater
    this.updater = Promise.resolve().then(() => {
        const updater = (require('electron-updater') as typeof import('electron-updater')).autoUpdater
        updater.autoDownload = false
        updater.autoInstallOnAppQuit = false
        updater.on('download-progress', (p) => {
          if (this.progressHandler) {
            this.progressHandler(toBytes(p.transferred), toBytes(p.total))
          }
        })
        return updater
      })
      .catch((error: unknown) => {
        console.error('[updater] initialization failed', error)
        this.updater = null
        return null
      })
    return this.updater
  }

  private setDownloadProgress(handler: UpdateProgressHandler | null): void {
    this.progressHandler = handler
  }
}

function toBytes(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : 0
}

function officialResponseUrl(url: string): boolean {
  if (!url || typeof url !== 'string') return true
  try {
    const parsed = new URL(url)
    if (parsed.protocol !== 'https:') return false
    if (GITHUB_ASSET_HOSTS.has(parsed.host)) return true
    if (parsed.host.endsWith('.githubusercontent.com') || parsed.host.endsWith('.github.com')) return true
    if (parsed.host.endsWith('.amazonaws.com') && parsed.host.includes('github')) return true
    if (parsed.host === 'github.com') return parsed.pathname.startsWith(`/${UPDATE_OWNER}/${UPDATE_REPO}/`)
    return false
  } catch {
    return false
  }
}

export const realUpdateTransport = (): ElectronUpdateTransport => new ElectronUpdateTransport()
