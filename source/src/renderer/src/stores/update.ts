import { create } from 'zustand'
import type { UpdateStatusEvent } from '@shared/update'

interface UpdateState {
  event: UpdateStatusEvent | null
  initialized: boolean
  checking: boolean
  modalDismissed: boolean
  dismissedVersion: string | null
  hubOpen: boolean
  init: () => Promise<void>
  check: (manual: boolean) => Promise<void>
  download: (type?: 'PATCH' | 'FULL') => Promise<void>
  install: () => Promise<void>
  dismiss: () => Promise<void>
  showModal: () => void
  openHub: () => void
  closeHub: () => void
  minimize: () => void
}

let unsubscribe: (() => void) | null = null

export const useUpdate = create<UpdateState>((set, get) => ({
  event: null,
  initialized: false,
  checking: false,
  modalDismissed: false,
  dismissedVersion: null,
  hubOpen: false,
  init: async () => {
    if (get().initialized) return
    set({ initialized: true })
    unsubscribe?.()
    if (!window?.api?.update) return
    unsubscribe = window.api.update.onEvent((event) => {
      if (event.status === 'UPDATE_AVAILABLE') {
        const { dismissedVersion } = get()
        const incomingVersion = event.available?.version ?? null
        // Only re-show the modal if this is a NEW version the user hasn't dismissed yet
        const alreadyDismissed = dismissedVersion !== null && dismissedVersion === incomingVersion
        set({ event, ...(alreadyDismissed ? {} : { modalDismissed: false }) })
      } else {
        set({ event })
      }
    })
    const event = await window.api.update.state()
    set({ event })
  },
  check: async (manual) => {
    if (!window?.api?.update || get().checking) return
    set({ checking: true })
    try {
      const event = await window.api.update.check(manual)
      if (event.status === 'UPDATE_AVAILABLE') {
        const { dismissedVersion } = get()
        const incomingVersion = event.available?.version ?? null
        const alreadyDismissed = dismissedVersion !== null && dismissedVersion === incomingVersion
        // Manual checks always re-show the modal
        set({ event, modalDismissed: manual ? false : !!alreadyDismissed })
      } else {
        set({ event })
      }
    } finally {
      set({ checking: false })
    }
  },
  download: async (type) => {
    if (!window?.api?.update) return
    const event = await window.api.update.download(type)
    set({ event })
  },
  install: async () => {
    if (!window?.api?.update) return
    const event = await window.api.update.install()
    set({ event })
  },
  dismiss: async () => {
    if (!window?.api?.update) return
    await window.api.update.dismiss()
    const version = get().event?.available?.version ?? null
    set({ modalDismissed: true, hubOpen: false, dismissedVersion: version })
  },
  showModal: () => {
    set({ modalDismissed: false, hubOpen: true })
  },
  openHub: () => {
    set({ modalDismissed: false, hubOpen: true })
  },
  closeHub: () => {
    set({ hubOpen: false })
  },
  minimize: () => {
    set({ modalDismissed: true, hubOpen: false })
  }
}))