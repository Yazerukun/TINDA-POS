import { create } from 'zustand'
import type { StoreSettings } from '@shared/types'
import {
  reconcilePrinterCustomization,
  saveStoredPrinterCustomization,
  PRINTER_CONFIG_CHANGED_EVENT
} from '../utils/printerCustomization'

interface SettingsState {
  settings: StoreSettings | null
  loaded: boolean
  load: () => Promise<void>
  update: (patch: Partial<StoreSettings>) => Promise<StoreSettings>
}

export const useSettings = create<SettingsState>((set, get) => {
  // Listen for cross-component printer customization broadcasts
  if (typeof window !== 'undefined') {
    window.addEventListener(PRINTER_CONFIG_CHANGED_EVENT, (e: Event) => {
      const customEvent = e as CustomEvent<Record<string, unknown>>
      const current = get().settings
      if (current && customEvent.detail) {
        set({ settings: { ...current, ...customEvent.detail } })
      }
    })
  }

  return {
    settings: null,
    loaded: false,
    load: async () => {
      const s = await window.api.settings.get()
      const custom = reconcilePrinterCustomization(s)
      const merged: StoreSettings = { ...s, ...custom }
      set({ settings: merged, loaded: true })
    },
    update: async (patch) => {
      // If patch contains any printer customization fields, persist to localStorage immediately
      saveStoredPrinterCustomization(patch as any)
      const s = await window.api.settings.update(patch)
      const custom = reconcilePrinterCustomization({ ...s, ...patch })
      const merged: StoreSettings = { ...s, ...patch, ...custom }
      set({ settings: merged })
      return merged
    }
  }
})