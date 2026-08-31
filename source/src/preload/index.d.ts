import type { TindaApi } from '@shared/ipc'

declare global {
  interface Window {
    api: TindaApi
  }
}

export {}