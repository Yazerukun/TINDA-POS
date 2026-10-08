import { create } from 'zustand'

interface FloatingWidgetsState {
  // TindaBot AI Assistant State
  isAiOpen: boolean
  isAiMinimized: boolean
  isAiWide: boolean
  setAiOpen: (open: boolean) => void
  setAiMinimized: (min: boolean) => void
  setAiWide: (wide: boolean) => void
  toggleAi: () => void

  // Community Chat State
  isChatOpen: boolean
  isChatMinimized: boolean
  isChatWide: boolean
  setChatOpen: (open: boolean) => void
  setChatMinimized: (min: boolean) => void
  setChatWide: (wide: boolean) => void
  toggleChat: () => void

  // Chat notification indicator for dock
  hasUnreadChat: boolean
  setHasUnreadChat: (hasUnread: boolean) => void

  // Unified Floating Dock Controls
  isDockCollapsed: boolean
  setDockCollapsed: (collapsed: boolean) => void
  toggleDockCollapsed: () => void
}

export const useFloatingWidgets = create<FloatingWidgetsState>((set) => ({
  isAiOpen: false,
  isAiMinimized: false,
  isAiWide: false,
  setAiOpen: (open) => set({ isAiOpen: open, ...(open ? { isAiMinimized: false } : {}) }),
  setAiMinimized: (min) => set({ isAiMinimized: min }),
  setAiWide: (wide) => set({ isAiWide: wide }),
  toggleAi: () => set((s) => ({ isAiOpen: !s.isAiOpen, isAiMinimized: false })),

  isChatOpen: false,
  isChatMinimized: false,
  isChatWide: false,
  setChatOpen: (open) =>
    set({ isChatOpen: open, ...(open ? { isChatMinimized: false, hasUnreadChat: false } : {}) }),
  setChatMinimized: (min) => set({ isChatMinimized: min }),
  setChatWide: (wide) => set({ isChatWide: wide }),
  toggleChat: () =>
    set((s) => ({ isChatOpen: !s.isChatOpen, isChatMinimized: false, hasUnreadChat: false })),

  hasUnreadChat: false,
  setHasUnreadChat: (hasUnread) => set({ hasUnreadChat: hasUnread }),

  isDockCollapsed: false,
  setDockCollapsed: (collapsed) => set({ isDockCollapsed: collapsed }),
  toggleDockCollapsed: () => set((s) => ({ isDockCollapsed: !s.isDockCollapsed }))
}))
