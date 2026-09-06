import type { ReleaseInfo, UpdateStatusEvent } from '@shared/update'
import { compareSemver, latestStable, shouldAutoCheck, UPDATE_CHECK_THROTTLE_MS } from '@shared/update'
import { hasCriticalOperation, OperationInProgressError } from './operationGuard'

export type CheckFailureKind = 'OFFLINE' | 'NETWORK' | 'TIMEOUT' | 'HTTP' | 'RATE_LIMIT' | 'INVALID'

export class UpdateCheckError extends Error {
  readonly kind: CheckFailureKind
  constructor(kind: CheckFailureKind, message: string) {
    super(message)
    this.name = 'UpdateCheckError'
    this.kind = kind
  }
}

export interface UpdateStorageState {
  lastCheckedAt: string | null
  dismissedVersion: string | null
}

export interface UpdateStorage {
  load(): UpdateStorageState
  save(state: UpdateStorageState): void
}

export type UpdateProgressHandler = (downloaded: number, total: number) => void

/**
 * Real I/O boundary injected by main. Tests provide fakes: no network, no
 * electron, no disk writes beyond the storage fake.
 */
export interface UpdateTransport {
  isPortable(): boolean
  installedVersion(): string
  isOnline(): Promise<boolean>
  fetchReleases(): Promise<ReleaseInfo[]>
  downloadSetup(release: ReleaseInfo, onProgress: UpdateProgressHandler): Promise<void>
  downloadPortable(release: ReleaseInfo, onProgress: UpdateProgressHandler): Promise<{ filePath: string }>
  safetyBackup(): { path: string } | null
  restartAndInstall(): void
  reveal(path: string): Promise<void>
}

export interface UpdateServiceDeps {
  transport: UpdateTransport
  storage: UpdateStorage
  emit: (event: UpdateStatusEvent) => void
}

const OFFLINE_MESSAGE = 'No internet connection. TINDA POS will continue working offline.'

export class UpdateService {
  private state: UpdateStatusEvent
  private busy = false
  private downloadedPath: string | null = null

  constructor(private readonly deps: UpdateServiceDeps) {
    const saved = deps.storage.load()
    this.state = {
      status: 'IDLE',
      installedVersion: deps.transport.installedVersion(),
      portable: deps.transport.isPortable(),
      available: null,
      progress: null,
      message: null,
      lastCheckedAt: saved.lastCheckedAt ?? null
    }
  }

  getState(): UpdateStatusEvent {
    return { ...this.state }
  }

  private set(next: Partial<UpdateStatusEvent>, recordCheck = false): void {
    this.state = { ...this.state, ...next }
    if (recordCheck) {
      const saved = this.deps.storage.load()
      this.deps.storage.save({ lastCheckedAt: this.state.lastCheckedAt, dismissedVersion: saved.dismissedVersion })
    }
    this.deps.emit({ ...this.state })
  }

  private persistDismissed(dismissedVersion: string | null): void {
    const saved = this.deps.storage.load()
    this.deps.storage.save({ ...saved, dismissedVersion })
  }

  /** Kick off an update check. Manual checks ignore the 24h throttle. */
  async check({ manual }: { manual: boolean }): Promise<UpdateStatusEvent> {
    if (this.busy) return this.getState()
    this.busy = true
    try {
      const saved = this.deps.storage.load()
      if (!manual) {
        const lastTs = saved.lastCheckedAt ? new Date(saved.lastCheckedAt).getTime() : null
        if (!shouldAutoCheck(lastTs, Date.now(), UPDATE_CHECK_THROTTLE_MS)) {
          this.set({ status: 'UP_TO_DATE', message: null })
          return this.getState()
        }
      }

      this.set({ status: 'CHECKING', message: null, available: null, progress: null })

      if (!(await this.deps.transport.isOnline())) {
        const offline = manual ? 'OFFLINE' : 'UNABLE_TO_CHECK'
        this.set({ status: offline, message: OFFLINE_MESSAGE, progress: null })
        return this.getState()
      }

      let releases: ReleaseInfo[]
      try {
        releases = await this.deps.transport.fetchReleases()
      } catch (err) {
        const kind = err instanceof UpdateCheckError ? err.kind : 'NETWORK'
        this.set({ status: 'UNABLE_TO_CHECK', message: this.failureMessage(kind), progress: null })
        return this.getState()
      }

      const available = latestStable(releases)
      const installed = this.deps.transport.installedVersion()

      if (!available || compareSemver(available.version, installed) <= 0) {
        this.set({ status: 'UP_TO_DATE', message: 'You have the latest stable version.', lastCheckedAt: new Date().toISOString() }, true)
        return this.getState()
      }

      if (saved.dismissedVersion === available.version) {
        this.set({ status: 'UP_TO_DATE', message: `Update to version ${available.version} is available.`, lastCheckedAt: new Date().toISOString() }, true)
        return this.getState()
      }

      this.set({ status: 'UPDATE_AVAILABLE', available, message: null, lastCheckedAt: new Date().toISOString() }, true)
      return this.getState()
    } finally {
      this.busy = false
    }
  }

  /** Download the pending update. For installed builds this also creates the pre-update safety backup. */
  async download(): Promise<UpdateStatusEvent> {
    const available = this.state.available
    if (!available || this.state.status !== 'UPDATE_AVAILABLE') return this.getState()
    if (this.busy) return this.getState()
    this.busy = true
    try {
      if (!this.deps.transport.isPortable()) {
        let backup: { path: string } | null = null
        try {
          backup = this.deps.transport.safetyBackup()
        } catch {
          backup = null
        }
        if (!backup) {
          this.set({ status: 'ERROR', message: 'Update installation paused because a safety backup could not be created.' })
          return this.getState()
        }
      }

      this.set({ status: 'DOWNLOADING', message: null, progress: { downloaded: 0, total: 0, percent: 0 } })
      const onProgress: UpdateProgressHandler = (downloaded, total) => {
        const percent = total > 0 ? Math.round((downloaded / total) * 100) : 0
        this.set({ progress: { downloaded, total, percent } })
      }
      try {
        if (this.deps.transport.isPortable()) {
          const { filePath } = await this.deps.transport.downloadPortable(available, onProgress)
          this.downloadedPath = filePath
          this.set({
            status: 'DOWNLOADED',
            message: `Update downloaded: ${filePath}. Open the downloaded file and run it to finish the update.`,
            progress: null
          })
        } else {
          await this.deps.transport.downloadSetup(available, onProgress)
          this.set({ status: 'READY_TO_INSTALL', message: 'Update downloaded. Restart & Install to finish.', progress: null })
        }
      } catch (err) {
        const message = err instanceof Error && err.message ? err.message : 'The update download failed. Please try again.'
        this.set({ status: 'ERROR', message, progress: null })
      }
      return this.getState()
    } finally {
      this.busy = false
    }
  }

  /** User action: restart the app to install (installed) or reveal the downloaded file (portable). */
  async install(): Promise<UpdateStatusEvent> {
    if (this.state.status !== 'READY_TO_INSTALL' && this.state.status !== 'DOWNLOADED') return this.getState()
    if (hasCriticalOperation()) throw new OperationInProgressError()
    if (this.deps.transport.isPortable()) {
      const path = this.downloadedPath ?? ''
      if (path) this.deps.transport.reveal(path).catch(() => undefined)
      return this.getState()
    }
    try {
      this.deps.transport.restartAndInstall()
    } catch (err) {
      const message = err instanceof Error && err.message ? err.message : 'The update could not be installed right now.'
      this.set({ status: 'ERROR', message })
    }
    return this.getState()
  }

  dismiss(): void {
    this.persistDismissed(this.state.available?.version ?? null)
    this.set({ status: 'DISMISSED', available: null, message: null })
  }

  private failureMessage(kind: CheckFailureKind): string {
    switch (kind) {
      case 'RATE_LIMIT':
        return 'GitHub is busy right now. Please try again later.'
      case 'TIMEOUT':
        return 'The update check timed out. Please try again.'
      case 'HTTP':
      case 'INVALID':
        return 'The update service returned an unexpected response.'
      default:
        return 'Unable to check for updates. Please try again later.'
    }
  }
}

export function createUpdateService(deps: UpdateServiceDeps): UpdateService {
  return new UpdateService(deps)
}