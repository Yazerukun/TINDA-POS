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
  fetchTelemetry: (forceRefresh?: boolean) => Promise<void>
}

/**
 * Returns a pure default StoreTelemetrySummary with safe mathematical zero centavos.
 */
export function createDefaultTelemetry(): StoreTelemetrySummary {
  const today = new Date().toISOString().slice(0, 10)
  return {
    business_date: today,
    generated_at: new Date().toISOString(),
    net_sales_c: 0,
    gross_sales_c: 0,
    discount_c: 0,
    refund_total_c: 0,
    void_count: 0,
    void_total_c: 0,
    transaction_count: 0,
    cash_c: 0,
    gcash_c: 0,
    maya_c: 0,
    maribank_c: 0,
    utang_c: 0,
    expected_drawer_cash_c: 0,
    opening_float_c: 0,
    cash_in_c: 0,
    cash_out_c: 0,
    cash_expenses_c: 0,
    cash_refunds_c: 0,
    top_products: [],
    critically_low_stock: [],
    expiring_products: [],
    unpaid_utang_due: {
      total_outstanding_c: 0,
      customer_count: 0,
      over_limit_count: 0,
      top_debtors: []
    },
    last_sync_at: null
  }
}

/**
 * Retrieves the initial telemetry state synchronously from localStorage cache if available,
 * eliminating 100% of initial loading delay (instant 0ms frame).
 */
export function getInitialTelemetry(): StoreTelemetrySummary {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const cached = localStorage.getItem('tinda_telemetry_cache')
      if (cached) {
        const parsed = JSON.parse(cached)
        if (parsed && typeof parsed === 'object' && typeof parsed.net_sales_c === 'number') {
          return parsed as StoreTelemetrySummary
        }
      }
    }
  } catch (err) {
    console.warn('[NotificationDrawer] Failed to parse localStorage telemetry cache:', err)
  }
  return createDefaultTelemetry()
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
  telemetry: getInitialTelemetry(),
  isLoading: false,
  lastFetchedAt: null,

  openDrawer: (tab) => {
    set((s) => ({
      isOpen: true,
      activeTab: tab || s.activeTab
    }))
    // 0ms instant display with silent background refresh if older than 15 seconds
    const now = Date.now()
    const { lastFetchedAt, isLoading } = get()
    if (!isLoading && (!lastFetchedAt || now - lastFetchedAt > 15_000)) {
      void get().fetchTelemetry(false)
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

  fetchTelemetry: async (forceRefresh = false) => {
    if (forceRefresh) {
      set({ isLoading: true })
    }
    try {
      if (typeof window !== 'undefined' && window.api?.telemetry?.getSummary) {
        const summary = await window.api.telemetry.getSummary(forceRefresh ? { forceRefresh: true } : undefined)
        if (summary) {
          set({ telemetry: summary, isLoading: false, lastFetchedAt: Date.now() })
          try {
            localStorage.setItem('tinda_telemetry_cache', JSON.stringify(summary))
          } catch {}
          return
        }
      }
      set({ isLoading: false })
    } catch (err) {
      console.warn('[NotificationDrawer] fetch error, preserving current telemetry:', err)
      const current = get().telemetry
      set({
        telemetry: current || createDefaultTelemetry(),
        isLoading: false
      })
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
