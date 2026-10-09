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
  | 'handbook'

interface NavState {
  page: PageKey
  setPage: (p: PageKey) => void
  activeCategoryFilter: number | 'ALL' | null
  setActiveCategoryFilter: (filter: number | 'ALL' | null) => void
}

export const useNav = create<NavState>((set) => ({
  page: 'dashboard',
  setPage: (p) => set({ page: p }),
  activeCategoryFilter: null,
  setActiveCategoryFilter: (filter) => set({ activeCategoryFilter: filter })
}))