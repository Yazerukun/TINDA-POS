import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import type { UpdateStorage, UpdateStorageState } from './updateService'
import { appDirs } from '../database/connection'

/**
 * File-backed update state. Separate from the business DB on purpose: update
 * bookkeeping (last check time, dismissed version) is app-internal metadata,
 * not store data, and must never travel with backups/restores.
 */
export function createUpdateFileStorage(baseDir?: string): UpdateStorage {
  const file = join(baseDir ?? appDirs().root, 'update-state.json')
  return {
    load(): UpdateStorageState {
      try {
        if (!existsSync(file)) return { lastCheckedAt: null, dismissedVersion: null }
        const parsed = JSON.parse(readFileSync(file, 'utf8')) as Partial<UpdateStorageState>
        return {
          lastCheckedAt: typeof parsed.lastCheckedAt === 'string' ? parsed.lastCheckedAt : null,
          dismissedVersion: typeof parsed.dismissedVersion === 'string' ? parsed.dismissedVersion : null
        }
      } catch {
        return { lastCheckedAt: null, dismissedVersion: null }
      }
    },
    save(state: UpdateStorageState): void {
      try {
        mkdirSync(dirname(file), { recursive: true })
        writeFileSync(file, `${JSON.stringify(state, null, 2)}\n`, { encoding: 'utf8', mode: 0o600 })
      } catch {
        /* best-effort persistence */
      }
    }
  }
}