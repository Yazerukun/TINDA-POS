import { app, net, shell } from 'electron'
import { createWriteStream } from 'node:fs'
import { join } from 'node:path'
import { mkdir } from 'node:fs/promises'
import type { ReleaseInfo } from '@shared/update'
import { githubReleasesApiUrl, isOfficialUpdateUrl, parseGitHubReleases, portableRuntime, UPDATE_OWNER, UPDATE_REPO } from '@shared/update'
import type { UpdateProgressHandler, UpdateTransport } from './updateService'
import { UpdateCheckError } from './updateService'
import { getDb } from '../database/connection'
import { createBackupSync, validateBackupDatabase } from '../repositories/backup'

const REQUEST_TIMEOUT_MS = 15000
const GITHUB_ASSET_HOSTS = new Set([
  'github.com',
  'api.github.com',
  'objects.githubusercontent.com',
  'release-assets.githubusercontent.com',
  'github-releases.githubusercontent.com'
])

async function fetchWithTimeout(url: string, init: RequestInit = {}): Promise<Response> {
  return net.fetch(url, { ...init, signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS), redirect: 'follow' })
}

export class ElectronUpdateTransport implements UpdateTransport {
  private updater: Promise<import('electron-updater').AppUpdater | null> | null = null
  private progressHandler: UpdateProgressHandler | null = null

  isPortable(): boolean {
    return portableRuntime(process.env)
  }

  installedVersion(): string {
    try {
      return app.getVersion() || '0.0.0'
    } catch {
      return '0.0.0'
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
      res = await fetchWithTimeout(githubReleasesApiUrl(), {
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
    if (res.status === 403 || res.status === 429) throw new UpdateCheckError('RATE_LIMIT', `GitHub ${res.status}`)
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

  /**
   * Attempt a restart-and-install via electron-updater's NSIS integration.
   * Only usable when actually packaged on Windows; otherwise we reject rather
   * than faking success.
   */
  async downloadSetup(_release: ReleaseInfo, onProgress: UpdateProgressHandler): Promise<void> {
    if (process.platform !== 'win32' || !app.isPackaged) {
      throw new Error('The installed updater is only available in a packaged Windows build.')
    }
    const updater = await this.getUpdater()
    if (!updater) throw new Error('The installed updater is not available.')
    updater.autoDownload = true
    updater.forceDevUpdateConfig = false
    this.setDownloadProgress(onProgress)
    const result = await updater.downloadUpdate()
    if (!result) throw new Error('The update download failed.')
    this.setDownloadProgress(null)
  }

  async downloadPortable(release: ReleaseInfo, onProgress: UpdateProgressHandler): Promise<{ filePath: string }> {
    const asset = release.assets.find((a) => /^TindaPOS-Portable-\d+\.\d+\.\d+[^.]*\.exe$/i.test(a.name))
    if (!asset) throw new Error('The portable update file was not found for this release.')
    if (!isOfficialUpdateUrl(asset.url)) throw new Error('The portable update file has an unexpected source.')

    let res: Response
    try {
      res = await fetchWithTimeout(asset.url, { headers: { 'User-Agent': 'TINDA-POS' } })
    } catch (err) {
      throw new Error(err instanceof Error && err.message ? `Download failed: ${err.message}` : 'Download failed')
    }
    if (!res.ok) throw new Error(`Download failed (HTTP ${res.status}).`)
    if (!officialResponseUrl(res.url)) throw new Error('The download redirected to an unexpected source.')

    const dir = join(app.getPath('downloads'), 'TINDA-POS-Updates')
    await mkdir(dir, { recursive: true })
    const filePath = join(dir, asset.name)
    const total = Number(res.headers.get('content-length')) || 0

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
      const pump = (): void => {
        void reader
          .read()
          .then(({ done, value }: { done: boolean; value?: Uint8Array }) => {
            if (done) {
              out.end(() => resolve())
              return
            }
            received += value?.byteLength ?? 0
            if (value) out.write(Buffer.from(value))
            if (total > 0) onProgress(received, total)
            pump()
          })
          .catch((err: unknown) => {
            out.destroy()
            reject(err instanceof Error && err.message ? err : new Error('Download failed'))
          })
      }
      pump()
    })
    return { filePath }
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
    const updater = require('electron-updater') as typeof import('electron-updater')
    updater.autoUpdater.quitAndInstall(true, true)
  }

  async reveal(path: string): Promise<void> {
    await shell.showItemInFolder(path)
  }

  private async getUpdater(): Promise<import('electron-updater').AppUpdater | null> {
    if (this.updater) return this.updater
    this.updater = import('electron-updater')
      .then((mod) => {
        const updater = mod.autoUpdater
        updater.autoDownload = false
        updater.autoInstallOnAppQuit = true
        updater.removeAllListeners('download-progress')
        updater.on('download-progress', (p) => {
          if (this.progressHandler) {
            this.progressHandler(toBytes(p.transferred), toBytes(p.total))
          }
        })
        return updater
      })
      .catch(() => null)
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
  if (!url || typeof url !== 'string') return false
  try {
    const parsed = new URL(url)
    if (parsed.protocol !== 'https:') return false
    if (!GITHUB_ASSET_HOSTS.has(parsed.host)) return false
    if (parsed.host === 'github.com') return parsed.pathname.startsWith(`/${UPDATE_OWNER}/${UPDATE_REPO}/`)
    return true
  } catch {
    return false
  }
}

export const realUpdateTransport = (): ElectronUpdateTransport => new ElectronUpdateTransport()