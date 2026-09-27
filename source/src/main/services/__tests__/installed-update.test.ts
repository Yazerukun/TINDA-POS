import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { NsisUpdater } from 'electron-updater'
import { GenericProvider } from 'electron-updater/out/providers/GenericProvider'
import { ElectronHttpExecutor } from 'electron-updater/out/electronHttpExecutor'
import type { DownloadUpdateOptions } from 'electron-updater/out/AppUpdater'
import { downloadInstalledUpdate } from '../installedUpdate'
import type { ReleaseInfo } from '@shared/update'

const dirs: string[] = []
afterEach(() => dirs.splice(0).forEach((dir) => rmSync(dir, { recursive: true, force: true })))
const release = { version: '1.0.6' } as ReleaseInfo

// Keep the real NSIS check/download state machine. Only remote metadata and
// executable transfer are replaced here; packaged live QA covers real bytes.
class TestUpdater extends NsisUpdater {
  transfers = 0
  failTransfer = false
  target = '1.0.6'
  constructor() {
    const dir = mkdtempSync(join(tmpdir(), 'tinda-updater-'))
    dirs.push(dir)
    super(null, {
      version: '1.0.5', name: 'TINDA POS', isPackaged: true,
      appUpdateConfigPath: join(dir, 'app-update.yml'), userDataPath: dir, baseCachePath: dir,
      whenReady: async () => undefined, relaunch: vi.fn(), quit: vi.fn(), onQuit: vi.fn()
    })
    this.logger = null
  }
  protected override async getUpdateInfoAndProvider() {
    const provider = new GenericProvider({ provider: 'generic', url: 'https://example.invalid/' }, this, {
      isUseMultipleRangeRequest: false, platform: 'win32', executor: new ElectronHttpExecutor()
    })
    return { info: { version: this.target, path: `TindaPOS-Setup-${this.target}.exe`, sha512: 'fixture', releaseDate: '2026-09-09', files: [{ url: `TindaPOS-Setup-${this.target}.exe`, sha512: 'fixture' }] }, provider }
  }
  protected override async doDownloadUpdate(_options: DownloadUpdateOptions): Promise<string[]> {
    this.transfers++
    if (this.failTransfer) throw new Error('net::ERR_CONNECTION_RESET')
    return ['downloaded-setup.exe']
  }
}

describe('installed updater integration with the real NSIS state machine', () => {
  it('reproduces the shipped direct-download failure', async () => {
    const updater = new TestUpdater()
    await expect(updater.downloadUpdate()).rejects.toThrow('Please check update first')
    expect(updater.transfers).toBe(0)
  })
  it('initializes metadata before downloading exactly once', async () => {
    const updater = new TestUpdater()
    await downloadInstalledUpdate(updater, release)
    expect(updater.transfers).toBe(1)
    expect(updater.autoDownload).toBe(false)
    expect(updater.autoInstallOnAppQuit).toBe(false)
  })
  it('rejects a changed target before fetching an installer', async () => {
    const updater = new TestUpdater()
    updater.target = '1.0.7'
    await expect(downloadInstalledUpdate(updater, release)).rejects.toThrow('changed')
    expect(updater.transfers).toBe(0)
  })
  it('does not reuse a stale target when no newer update is available', async () => {
    const updater = new TestUpdater()
    updater.target = '1.0.5'
    await expect(downloadInstalledUpdate(updater, release)).rejects.toThrow('no longer available')
    expect(updater.transfers).toBe(0)
  })
  it('can retry after the actual updater rejects a transfer', async () => {
    const updater = new TestUpdater()
    updater.failTransfer = true
    await expect(downloadInstalledUpdate(updater, release)).rejects.toThrow('ERR_CONNECTION_RESET')
    updater.failTransfer = false
    await downloadInstalledUpdate(updater, release)
    expect(updater.transfers).toBe(2)
  })
})
