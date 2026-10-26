import { create } from 'zustand'

interface PurchaseInvoiceModalState {
  isOpen: boolean
  isMinimized: boolean
  openModal: () => void
  closeModal: () => void
  minimizeModal: () => void
  restoreModal: () => void
  setIsMinimized: (min: boolean) => void
}

export const usePurchaseInvoiceModal = create<PurchaseInvoiceModalState>((set) => ({
  isOpen: false,
  isMinimized: false,
  openModal: () => set({ isOpen: true, isMinimized: false }),
  closeModal: () => set({ isOpen: false, isMinimized: false }),
  minimizeModal: () => set({ isMinimized: true }),
  restoreModal: () => set({ isOpen: true, isMinimized: false }),
  setIsMinimized: (min: boolean) => set({ isMinimized: min })
}))
