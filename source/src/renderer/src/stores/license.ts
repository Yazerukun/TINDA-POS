import { create } from 'zustand'
import type { LicenseStatus } from '@shared/types'

interface LicenseState {
  status: LicenseStatus | null
  isVip: boolean
  loaded: boolean
  loadLicense: () => Promise<LicenseStatus | null>
  setLicenseStatus: (status: LicenseStatus) => void
}

const getInitialVip = (): boolean => {
  if (typeof window === 'undefined') return false
  try {
    return window.localStorage.getItem('tinda_is_vip') === 'true'
  } catch {
    return false
  }
}

export const useLicense = create<LicenseState>((set) => ({
  status: null,
  isVip: getInitialVip(),
  loaded: false,
  loadLicense: async () => {
    if (typeof window === 'undefined' || !window.api?.license?.getStatus) {
      return null
    }
    try {
      const s = await window.api.license.getStatus()
      const isVip = Boolean(s?.isVip)
      try {
        window.localStorage.setItem('tinda_is_vip', String(isVip))
      } catch {
        /* storage disabled fallback */
      }
      set({ status: s, isVip, loaded: true })
      return s
    } catch (err) {
      console.error('Failed to load license status:', err)
      set({ loaded: true })
      return null
    }
  },
  setLicenseStatus: (status: LicenseStatus) => {
    const isVip = Boolean(status?.isVip)
    try {
      window.localStorage.setItem('tinda_is_vip', String(isVip))
    } catch {
      /* storage disabled fallback */
    }
    set({ status, isVip, loaded: true })
  }
}))
