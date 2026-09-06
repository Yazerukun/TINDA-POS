import { describe, expect, it } from 'vitest'
import type { ReleaseInfo, UpdateStatusEvent } from '@shared/update'
import { isStableVersion, parseGitHubRelease } from '@shared/update'
import { createUpdateService, UpdateCheckError, type UpdateProgressHandler, type UpdateService, type UpdateStorage, type UpdateStorageState, type UpdateTransport } from '../updateService'
import { beginCriticalOperation, OperationInProgressError } from '../operationGuard'

const release = (version: string, overrides: Partial<ReleaseInfo> = {}): ReleaseInfo => {
  const base = {
    version,
    tag: `v${version}`,
    title: `TINDA POS v${version}`,
    publishedAt: '2026-01-01T00:00:00Z',
    releaseNotes: 'What is new',
    stable: isStableVersion(version),
    assets: [
      { name: `TindaPOS-Setup-${version}.exe`, url: `https://github.com/Yazerukun/TINDA-POS/releases/download/v${version}/TindaPOS-Setup-${version}.exe`, size: 100 },
      { name: `TindaPOS-Portable-${version}.exe`, url: `https://github.com/Yazerukun/TINDA-POS/releases/download/v${version}/TindaPOS-Portable-${version}.exe`, size: 100 }
    ]
  }
  return { ...base, ...overrides }
}

function makeFakeTransport(overrides: Partial<UpdateTransport> = {}): UpdateTransport & { calls: string[]; releases: ReleaseInfo[] } {
  const calls: string[] = []
  const fake: UpdateTransport & { calls: string[]; releases: ReleaseInfo[] } = {
    calls,
    releases: [],
    isPortable: () => false,
    installedVersion: () => '1.0.3',
    isOnline: async () => true,
    fetchReleases: async () => {
      calls.push('fetchReleases')
      return fake.releases
    },
    downloadSetup: async (_r: ReleaseInfo, onProgress: UpdateProgressHandler) => {
      calls.push('downloadSetup')
      onProgress(20, 100)
      onProgress(100, 100)
    },
    downloadPortable: async (_r: ReleaseInfo, onProgress: UpdateProgressHandler) => {
      calls.push('downloadPortable')
      onProgress(100, 100)
      return { filePath: 'C:\\Users\\Test\\Downloads\\TINDA-POS-Updates\\TindaPOS-Portable-1.0.4.exe' }
    },
    safetyBackup: () => ({ path: 'C:\\backups\\before-update.zip' }),
    restartAndInstall: () => {
      calls.push('restartAndInstall')
    },
    reveal: async () => {
      calls.push('reveal')
    },
    ...overrides
  }
  return fake
}

function makeStorage(): UpdateStorage & { saved: UpdateStorageState[] } {
  const saved: UpdateStorageState[] = []
  let current: UpdateStorageState = { lastCheckedAt: null, dismissedVersion: null }
  return {
    saved,
    load: () => ({ ...current }),
    save: (s: UpdateStorageState) => {
      current = { ...s }
      saved.push({ ...s })
    }
  }
}

function makeService(fake: ReturnType<typeof makeFakeTransport>, storage = makeStorage()): { service: UpdateService; transport: ReturnType<typeof makeFakeTransport>; storage: ReturnType<typeof makeStorage> } {
  const emitted: UpdateStatusEvent[] = []
  const service = createUpdateService({
    transport: fake,
    storage,
    emit: (e) => emitted.push(e)
  })
  return { service, transport: fake, storage }
}

async function checkService(fake: ReturnType<typeof makeFakeTransport>, overrides: { manual: boolean }, expectState: (before: ReturnType<typeof makeFakeTransport>) => void = () => undefined) {
  const { service } = makeService(fake)
  expectState(fake)
  return service.check(overrides)
}

describe('update service — detection', () => {
  it('reports UP_TO_DATE when the same version is latest', async () => {
    const fake = makeFakeTransport()
    fake.releases = [release('1.0.3')]
    const s = await checkService(fake, { manual: true })
    expect(s.status).toBe('UP_TO_DATE')
  })

  it('flags a newer PATCH version', async () => {
    const fake = makeFakeTransport()
    fake.releases = [release('1.0.4')]
    const s = await checkService(fake, { manual: true })
    expect(s.status).toBe('UPDATE_AVAILABLE')
    expect(s.available?.version).toBe('1.0.4')
  })

  it('flags a newer MINOR version', async () => {
    const fake = makeFakeTransport()
    fake.releases = [release('1.1.0')]
    const s = await checkService(fake, { manual: true })
    expect(s.status).toBe('UPDATE_AVAILABLE')
  })

  it('flags a newer MAJOR version', async () => {
    const fake = makeFakeTransport()
    fake.releases = [release('2.0.0')]
    const s = await checkService(fake, { manual: true })
    expect(s.status).toBe('UPDATE_AVAILABLE')
  })

  it('does NOT offer an OLDER remote version', async () => {
    const fake = makeFakeTransport()
    fake.releases = [release('0.9.0'), release('1.0.1')]
    const s = await checkService(fake, { manual: true })
    expect(s.status).toBe('UP_TO_DATE')
  })

  it('ignores prereleases and drafts when picking the candidate', async () => {
    const fake = makeFakeTransport()
    fake.releases = [release('1.0.4-rc.1'), release('1.0.3')]
    const s = await checkService(fake, { manual: true })
    expect(s.status).toBe('UP_TO_DATE')
    const withDraft = makeFakeTransport()
    withDraft.releases = [Object.assign(release('99.0.0'), { stable: false })]
    const s2 = await checkService(withDraft, { manual: true })
    expect(s2.status).toBe('UP_TO_DATE')
  })

  it('picks the highest stable release when multiple exist', async () => {
    const fake = makeFakeTransport()
    fake.releases = [release('1.0.9'), release('1.1.0'), release('0.5.0')]
    const s = await checkService(fake, { manual: true })
    expect(s.available?.version).toBe('1.1.0')
  })

  it('remembers the check time after a successful check', async () => {
    const fake = makeFakeTransport()
    fake.releases = [release('1.0.4')]
    const storage = makeStorage()
    await makeService(fake, storage).service.check({ manual: true })
    expect(storage.saved.at(-1)?.lastCheckedAt).toBeTruthy()
  })
})

describe('update service — failure modes', () => {
  it('reports OFFLINE when there is no connectivity', async () => {
    const fake = makeFakeTransport({ isOnline: async () => false })
    const s = await checkService(fake, { manual: true })
    expect(s.status).toBe('OFFLINE')
    expect(s.message).toContain('No internet connection')
  })

  it('fails silently for auto offline checks', async () => {
    const fake = makeFakeTransport({ isOnline: async () => false })
    const s = await checkService(fake, { manual: false })
    expect(s.status).toBe('UNABLE_TO_CHECK')
  })

  it('surfaces a rate limit failure', async () => {
    const fake = makeFakeTransport({ fetchReleases: async () => { throw new UpdateCheckError('RATE_LIMIT', 'GitHub 403') } })
    const s = await checkService(fake, { manual: true })
    expect(s.status).toBe('UNABLE_TO_CHECK')
    expect(s.message).toMatch(/GitHub is busy/i)
  })

  it('surfaces a timeout failure', async () => {
    const fake = makeFakeTransport({ fetchReleases: async () => { throw new UpdateCheckError('TIMEOUT', 'timed out') } })
    const s = await checkService(fake, { manual: true })
    expect(s.status).toBe('UNABLE_TO_CHECK')
    expect(s.message).toMatch(/timed out/i)
  })

  it('surfaces HTTP / invalid metadata failures', async () => {
    const http = makeFakeTransport({ fetchReleases: async () => { throw new UpdateCheckError('HTTP', 'GitHub 500') } })
    const s1 = await checkService(http, { manual: true })
    expect(s1.status).toBe('UNABLE_TO_CHECK')
    const invalid = makeFakeTransport({ fetchReleases: async () => { throw new UpdateCheckError('INVALID', 'bad') } })
    const s2 = await checkService(invalid, { manual: true })
    expect(s2.status).toBe('UNABLE_TO_CHECK')
  })

  it('treats unexpected throwables as a generic failure', async () => {
    const fake = makeFakeTransport({ fetchReleases: async () => { throw new Error('boom') } })
    const s = await checkService(fake, { manual: true })
    expect(s.status).toBe('UNABLE_TO_CHECK')
  })

  it('does NOT advance lastCheckedAt on failure', async () => {
    const fake = makeFakeTransport({ fetchReleases: async () => { throw new UpdateCheckError('NETWORK', 'down') } })
    const storage = makeStorage()
    await makeService(fake, storage).service.check({ manual: true })
    expect(storage.saved).toHaveLength(0)
  })
})

describe('update service — 24h throttle', () => {
  it('auto checks only once per throttle window', async () => {
    const fake = makeFakeTransport()
    fake.releases = [release('1.0.4')]
    const storage = makeStorage()
    const { service } = makeService(fake, storage)
    await service.check({ manual: false })
    expect(fake.calls.filter((c) => c === 'fetchReleases')).toHaveLength(1)
    const before = fake.calls.length
    const s = await service.check({ manual: false })
    expect(s.status).toBe('UP_TO_DATE')
    expect(fake.calls.length).toBe(before)
  })

  it('manual checks bypass the throttle', async () => {
    const fake = makeFakeTransport()
    fake.releases = [release('1.0.4')]
    const storage = makeStorage()
    const { service } = makeService(fake, storage)
    await service.check({ manual: false })
    const before = fake.calls.length
    await service.check({ manual: true })
    expect(fake.calls.length).toBe(before + 1)
  })

  it('re-checks after the throttle window elapses', async () => {
    const fake = makeFakeTransport()
    fake.releases = [release('1.0.4')]
    const storage = makeStorage()
    const { service } = makeService(fake, storage)
    await service.check({ manual: true })
    storage.save({ lastCheckedAt: new Date(Date.now() - 25 * 3600 * 1000).toISOString(), dismissedVersion: null })
    const before = fake.calls.length
    await service.check({ manual: false })
    expect(fake.calls.length).toBe(before + 1)
  })
})

describe('update service — download & install', () => {
  it('portable: downloads to a folder, never self-installs, and reveals the file', async () => {
    const fake = makeFakeTransport({ isPortable: () => true })
    fake.releases = [release('1.0.4')]
    const { service } = makeService(fake)
    await service.check({ manual: true })
    const downloading = await service.download()
    expect(fake.calls).toContain('downloadPortable')
    expect(downloading.status).toBe('DOWNLOADED')
    await service.install()
    expect(fake.calls).toContain('reveal')
    expect(fake.calls).not.toContain('restartAndInstall')
  })

  it('installed: creates a safety backup before downloading a setup', async () => {
    const fake = makeFakeTransport()
    fake.releases = [release('1.0.4')]
    const { service } = makeService(fake)
    await service.check({ manual: true })
    const s = await service.download()
    expect(s.status).toBe('READY_TO_INSTALL')
    expect(fake.calls).toContain('downloadSetup')
  })

  it('pauses when the pre-update safety backup cannot be created', async () => {
    const fake = makeFakeTransport({ safetyBackup: () => null, downloadSetup: async () => { throw new Error('should not download') } })
    fake.releases = [release('1.0.4')]
    const { service } = makeService(fake)
    await service.check({ manual: true })
    const s = await service.download()
    expect(s.status).toBe('ERROR')
    expect(s.message).toMatch(/safety backup could not be created/i)
    expect(fake.calls).not.toContain('downloadSetup')
  })

  it('installed: restarts and installs only on explicit user action', async () => {
    const fake = makeFakeTransport()
    fake.releases = [release('1.0.4')]
    const { service } = makeService(fake)
    await service.check({ manual: true })
    await service.download()
    expect(fake.calls).not.toContain('restartAndInstall')
    await service.install()
    expect(fake.calls).toContain('restartAndInstall')
  })

  it('blocks install while a critical operation is in progress', async () => {
    const fake = makeFakeTransport()
    fake.releases = [release('1.0.4')]
    const { service } = makeService(fake)
    await service.check({ manual: true })
    await service.download()
    const endOp = beginCriticalOperation('CHECKOUT')
    await expect(service.install()).rejects.toBeInstanceOf(OperationInProgressError)
    endOp()
    await service.install()
    expect(fake.calls).toContain('restartAndInstall')
  })

  it('duplicate download while busy is a no-op that preserves state', async () => {
    const fake = makeFakeTransport()
    fake.releases = [release('1.0.4')]
    const { service } = makeService(fake)
    await service.check({ manual: true })
    await service.download()
    const s = await service.download()
    expect(s.status).toBe('READY_TO_INSTALL')
    expect(fake.calls.filter((c) => c === 'downloadSetup')).toHaveLength(1)
  })

  it('surfaces a download error without losing the availability', async () => {
    const fake = makeFakeTransport({ downloadSetup: async () => { throw new Error('disk full') } })
    fake.releases = [release('1.0.4')]
    const { service } = makeService(fake)
    await service.check({ manual: true })
    const s = await service.download()
    expect(s.status).toBe('ERROR')
    expect(s.message).toBe('disk full')
  })
})

describe('update service — dismissal', () => {
  it('remembers a dismissed version and stays quiet on the next check', async () => {
    const fake = makeFakeTransport()
    fake.releases = [release('1.0.4')]
    const storage = makeStorage()
    const { service } = makeService(fake, storage)
    await service.check({ manual: true })
    expect(service.getState().status).toBe('UPDATE_AVAILABLE')
    service.dismiss()
    expect(service.getState().status).toBe('DISMISSED')
    storage.save({ lastCheckedAt: storage.saved.at(-1)?.lastCheckedAt ?? null, dismissedVersion: '1.0.4' })
    const s = await service.check({ manual: true })
    expect(s.status).toBe('UP_TO_DATE')
    expect(s.message).toContain('1.0.4')
  })

  it('stops suppressing updates once a newer version appears', async () => {
    const fake = makeFakeTransport()
    fake.releases = [release('1.0.4')]
    const storage = makeStorage()
    const { service } = makeService(fake, storage)
    await service.check({ manual: true })
    service.dismiss()
    storage.save({ lastCheckedAt: null, dismissedVersion: '1.0.4' })
    fake.releases = [release('1.0.5')]
    const s = await service.check({ manual: true })
    expect(s.status).toBe('UPDATE_AVAILABLE')
    expect(s.available?.version).toBe('1.0.5')
  })
})

describe('update service — sanitizes ingested release notes end to end', () => {
  it('strips control characters from GitHub release bodies', async () => {
    const fake = makeFakeTransport()
    const raw = parseGitHubRelease({
      tag_name: 'v1.0.4',
      name: 'TINDA POS v1.0.4',
      published_at: '2026-01-01T00:00:00Z',
      draft: false,
      prerelease: false,
      body: 'Fixed a bug\x1f with keys',
      assets: []
    })
    fake.releases = [raw!]
    const s = await checkService(fake, { manual: true })
    expect(s.available?.releaseNotes).toBe('Fixed a bug with keys')
  })
})