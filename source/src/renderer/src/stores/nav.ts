import { create } from 'zustand'

export type PageKey =
  | 'dashboard'
  | 'pos'
  | 'inventory'
  | 'utang'
  | 'expenses'
  | 'suppliers'
  | 'transactions'
  | 'reports'
  | 'backup'
  | 'settings'
  | 'customers'
  | 'ewallet'
  | 'bills'
  | 'printing'
  | 'handbook'

export type ReportsTabKey = 'SALES' | 'ITEMS' | 'INVENTORY' | 'UTANG' | 'X' | 'Z' | 'ZHISTORY' | 'CASHCOUNT'

interface NavState {
  page: PageKey
  setPage: (p: PageKey) => void
  activeCategoryFilter: number | 'ALL' | null
  setActiveCategoryFilter: (filter: number | 'ALL' | null) => void
  reportsTab: ReportsTabKey | null
  setReportsTab: (tab: ReportsTabKey | null) => void
}

export const useNav = create<NavState>((set) => ({
  page: 'dashboard',
  setPage: (p) => set({ page: p }),
  activeCategoryFilter: null,
  setActiveCategoryFilter: (filter) => set({ activeCategoryFilter: filter }),
  reportsTab: null,
  setReportsTab: (tab) => set({ reportsTab: tab })
}))