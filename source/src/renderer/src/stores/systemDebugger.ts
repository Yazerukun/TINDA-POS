import { create } from 'zustand'
import type { SystemDiagnosticReport } from '@shared/types'

interface SystemDebuggerState {
  isOpen: boolean
  report: SystemDiagnosticReport | null
  loading: boolean
  autoFixing: boolean
  openDebugger: () => void
  closeDebugger: () => void
  toggleDebugger: () => void
  fetchReport: () => Promise<void>
  runAutoFix: () => Promise<{ ok: boolean; actionsTaken: string[]; message: string }>
  clearLogs: () => Promise<void>
}

export const useSystemDebugger = create<SystemDebuggerState>((set, get) => ({
  isOpen: false,
  report: null,
  loading: false,
  autoFixing: false,

  openDebugger: () => {
    set({ isOpen: true })
    void get().fetchReport()
  },

  closeDebugger: () => set({ isOpen: false }),

  toggleDebugger: () => {
    const next = !get().isOpen
    set({ isOpen: next })
    if (next) void get().fetchReport()
  },

  fetchReport: async () => {
    set({ loading: true })
    try {
      const rep = await window.api.diagnostics.getReport()
      set({ report: rep })
    } catch (e) {
      console.error('[useSystemDebugger] Failed to fetch report:', e)
    } finally {
      set({ loading: false })
    }
  },

  runAutoFix: async () => {
    set({ autoFixing: true })
    try {
      const res = await window.api.diagnostics.autoFix()
      await get().fetchReport()
      return res
    } finally {
      set({ autoFixing: false })
    }
  },

  clearLogs: async () => {
    set({ loading: true })
    try {
      await window.api.diagnostics.clearLogs()
      await get().fetchReport()
    } finally {
      set({ loading: false })
    }
  }
}))
