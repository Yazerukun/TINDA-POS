import { create } from 'zustand'
import type { StoreTelemetrySummary } from '@shared/types'
import type { AdvisorLanguage } from '../services/aiStoreAdvisor'

export type DrawerTab = 'advisor' | 'financials' | 'alerts'

interface NotificationDrawerState {
  isOpen: boolean
  activeTab: DrawerTab
  language: AdvisorLanguage
  telemetry: StoreTelemetrySummary | null
  isLoading: boolean
  lastFetchedAt: number | null
  openDrawer: (tab?: DrawerTab) => void
  closeDrawer: () => void
  toggleDrawer: () => void
  setActiveTab: (tab: DrawerTab) => void
  setLanguage: (lang: AdvisorLanguage) => void
  fetchTelemetry: () => Promise<void>
}

function getStoredLanguage(): AdvisorLanguage {
  try {
    const saved = localStorage.getItem('tinda_advisor_lang')
    if (saved === 'tl' || saved === 'en') {
      return saved
    }
  } catch {}
  return 'en'
}

export const useNotificationDrawer = create<NotificationDrawerState>((set, get) => ({
  isOpen: false,
  activeTab: 'advisor',
  language: getStoredLanguage(),
  telemetry: null,
  isLoading: false,
  lastFetchedAt: null,

  openDrawer: (tab) => {
    set((s) => ({
      isOpen: true,
      activeTab: tab || s.activeTab
    }))
    // Auto-refresh telemetry if older than 15 seconds or not loaded
    const now = Date.now()
    const { lastFetchedAt, isLoading } = get()
    if (!isLoading && (!lastFetchedAt || now - lastFetchedAt > 15_000)) {
      void get().fetchTelemetry()
    }
  },

  closeDrawer: () => set({ isOpen: false }),

  toggleDrawer: () => {
    const nextState = !get().isOpen
    if (nextState) {
      get().openDrawer()
    } else {
      get().closeDrawer()
    }
  },

  setActiveTab: (tab) => set({ activeTab: tab }),

  setLanguage: (lang) => {
    try {
      localStorage.setItem('tinda_advisor_lang', lang)
    } catch {}
    set({ language: lang })
  },

  fetchTelemetry: async () => {
    set({ isLoading: true })
    try {
      if (typeof window !== 'undefined' && window.api?.telemetry?.getSummary) {
        const summary = await window.api.telemetry.getSummary()
        set({ telemetry: summary, isLoading: false, lastFetchedAt: Date.now() })
      } else {
        set({ isLoading: false })
      }
    } catch (err) {
      console.error('[NotificationDrawer] Error fetching telemetry summary:', err)
      set({ isLoading: false })
    }
  }
}))

/**
 * Calculates total critical alerts across low stock, expiring products, and voided transactions.
 */
export function getCriticalAlertCount(telemetry: StoreTelemetrySummary | null): number {
  if (!telemetry) return 0
  const lowStock = telemetry.critically_low_stock?.length ?? 0
  const expiring = telemetry.expiring_products?.length ?? 0
  const voids = telemetry.void_count ?? 0
  return lowStock + expiring + voids
}
