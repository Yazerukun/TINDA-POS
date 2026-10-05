import { create } from 'zustand'

export type AppTheme = 'dark' | 'light' | 'warm' | 'slate'

export interface ThemeOption {
  id: AppTheme
  label: string
  sublabel: string
  bgPreview: string
  borderPreview: string
  textPreview: string
  accentColor: string
  emoji: string
}

export const THEME_OPTIONS: ThemeOption[] = [
  {
    id: 'dark',
    label: 'Midnight Black',
    sublabel: 'Itom — Original dark mode, elegant & battery-saving',
    bgPreview: '#0a0d0f',
    borderPreview: '#2a313c',
    textPreview: '#f1f5f9',
    accentColor: '#10b981',
    emoji: '🌙'
  },
  {
    id: 'light',
    label: 'Daylight White',
    sublabel: 'Puti — Clean white paper, high contrast sa hayag nga tindahan',
    bgPreview: '#ffffff',
    borderPreview: '#cbd5e1',
    textPreview: '#0f172a',
    accentColor: '#059669',
    emoji: '☀️'
  },
  {
    id: 'warm',
    label: 'Warm Eye-Care',
    sublabel: 'Sepia / Kahoy — Dili sakit sa mata, soft cream panan-aw',
    bgPreview: '#fbf7ee',
    borderPreview: '#e5d7c0',
    textPreview: '#292524',
    accentColor: '#d97706',
    emoji: '🍵'
  },
  {
    id: 'slate',
    label: 'Nordic Slate',
    sublabel: 'Asul / Navy — Balanced modern navy blue contrast',
    bgPreview: '#0f172a',
    borderPreview: '#334155',
    textPreview: '#e2e8f0',
    accentColor: '#38bdf8',
    emoji: '🌊'
  }
]

interface ThemeState {
  theme: AppTheme
  setTheme: (theme: AppTheme) => void
}

const getInitialTheme = (): AppTheme => {
  if (typeof window === 'undefined') return 'dark'
  try {
    const saved = window.localStorage.getItem('tinda_theme') as AppTheme
    if (saved && ['dark', 'light', 'warm', 'slate'].includes(saved)) {
      return saved
    }
  } catch {
    /* storage disabled */
  }
  return 'dark'
}

export const useTheme = create<ThemeState>((set) => ({
  theme: getInitialTheme(),
  setTheme: (theme: AppTheme) => {
    try {
      window.localStorage.setItem('tinda_theme', theme)
      document.documentElement.setAttribute('data-theme', theme)
    } catch {
      /* storage disabled */
    }
    set({ theme })
    // Also save to SQLite store settings
    try {
      void window.api?.settings?.update({ theme }).catch(() => {})
    } catch {
      /* non-blocking */
    }
  }
}))
