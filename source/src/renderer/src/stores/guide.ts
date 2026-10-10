import { create } from 'zustand'

export type GuideTab =
  | 'tour'
  | 'start'
  | 'pos'
  | 'scanner'
  | 'inventory'
  | 'utang'
  | 'backup'
  | 'shortcuts'

interface GuideState {
  open: boolean
  tab: GuideTab
  openGuide: (tab?: GuideTab) => void
  closeGuide: () => void
  setTab: (tab: GuideTab) => void
}

export const useGuide = create<GuideState>((set) => ({
  open: false,
  tab: 'start',
  openGuide: (tab = 'start') => set({ open: true, tab }),
  closeGuide: () => set({ open: false }),
  setTab: (tab) => set({ tab })
}))
