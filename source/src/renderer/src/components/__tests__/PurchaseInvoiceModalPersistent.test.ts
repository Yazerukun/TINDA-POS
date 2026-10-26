import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import * as React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { usePurchaseInvoiceModal } from '../../stores/purchaseInvoiceModal'
import { useNav } from '../../stores/nav'
import { PurchaseInvoiceModal } from '../PurchaseInvoiceModal'

describe('PurchaseInvoiceModal & usePurchaseInvoiceModal Global Persistence', () => {
  const originalLocalStorage = globalThis.localStorage

  beforeEach(() => {
    // Reset Zustand stores
    usePurchaseInvoiceModal.setState({
      isOpen: false,
      isMinimized: false
    })
    useNav.setState({
      page: 'inventory'
    })

    // Mock localStorage
    const store: Record<string, string> = {}
    const mockStorage = {
      getItem: (key: string) => store[key] || null,
      setItem: (key: string, value: string) => {
        store[key] = value
      },
      removeItem: (key: string) => {
        delete store[key]
      },
      clear: () => {
        for (const k in store) delete store[k]
      }
    }
    Object.defineProperty(globalThis, 'localStorage', {
      value: mockStorage,
      writable: true,
      configurable: true
    })

    // Mock window & window.api safely
    const win = (globalThis.window || {}) as unknown as Record<string, unknown>
    globalThis.window = win as unknown as typeof window
    win.api = {
      suppliers: { list: vi.fn().mockResolvedValue([]) },
      products: { search: vi.fn().mockResolvedValue({ rows: [] }) },
      purchases: { list: vi.fn().mockResolvedValue({ rows: [] }) },
      inventory: { onChanged: vi.fn().mockReturnValue(() => {}) }
    }
    if (!win.addEventListener) {
      win.addEventListener = vi.fn()
      win.removeEventListener = vi.fn()
      win.dispatchEvent = vi.fn()
    }
  })

  afterEach(() => {
    Object.defineProperty(globalThis, 'localStorage', {
      value: originalLocalStorage,
      writable: true,
      configurable: true
    })
  })

  it('initializes with isOpen = false and isMinimized = false', () => {
    const state = usePurchaseInvoiceModal.getState()
    expect(state.isOpen).toBe(false)
    expect(state.isMinimized).toBe(false)
  })

  it('openModal() sets isOpen = true and isMinimized = false', () => {
    usePurchaseInvoiceModal.getState().openModal()
    const state = usePurchaseInvoiceModal.getState()
    expect(state.isOpen).toBe(true)
    expect(state.isMinimized).toBe(false)
  })

  it('minimizeModal() keeps modal open but sets isMinimized = true', () => {
    usePurchaseInvoiceModal.getState().openModal()
    usePurchaseInvoiceModal.getState().minimizeModal()
    const state = usePurchaseInvoiceModal.getState()
    expect(state.isOpen).toBe(true)
    expect(state.isMinimized).toBe(true)
  })

  it('restoreModal() restores modal from minimized state', () => {
    usePurchaseInvoiceModal.getState().openModal()
    usePurchaseInvoiceModal.getState().minimizeModal()
    usePurchaseInvoiceModal.getState().restoreModal()
    const state = usePurchaseInvoiceModal.getState()
    expect(state.isOpen).toBe(true)
    expect(state.isMinimized).toBe(false)
  })

  it('closeModal() closes modal and resets isMinimized', () => {
    usePurchaseInvoiceModal.getState().openModal()
    usePurchaseInvoiceModal.getState().minimizeModal()
    usePurchaseInvoiceModal.getState().closeModal()
    const state = usePurchaseInvoiceModal.getState()
    expect(state.isOpen).toBe(false)
    expect(state.isMinimized).toBe(false)
  })

  it('renders null when modal is closed', () => {
    const html = renderToStaticMarkup(React.createElement(PurchaseInvoiceModal as unknown as React.ComponentType<{ open?: boolean; isMinimized?: boolean }>, { open: false }))
    expect(html).toBe('')
  })

  it('renders the floating receiving dock when modal is open and minimized in Inventory', () => {
    useNav.setState({ page: 'inventory' })

    const html = renderToStaticMarkup(React.createElement(PurchaseInvoiceModal as unknown as React.ComponentType<{ open?: boolean; isMinimized?: boolean }>, { open: true, isMinimized: true }))
    expect(html).toContain('Purchase Invoice Receiving')
    expect(html).toContain('bottom-16 right-4')
    expect(html).toContain('Restore Window')
    expect(html).toContain('Discard Draft Invoice')
  })

  it('dynamically repositions the floating dock to the left of the cart when user navigates to POS Cashier', () => {
    useNav.setState({ page: 'pos' })

    const html = renderToStaticMarkup(React.createElement(PurchaseInvoiceModal as unknown as React.ComponentType<{ open?: boolean; isMinimized?: boolean }>, { open: true, isMinimized: true }))
    expect(html).toContain('Purchase Invoice Receiving')
    // Must avoid blocking the POS cart checkout button
    expect(html).toContain('bottom-16 right-[24.5rem] xl:right-[27.5rem]')
  })

  it('auto-loads draft items from localStorage if present', () => {
    const mockDraft = {
      supplierId: 42,
      invoiceNo: 'PO-2026-VIP',
      items: [
        {
          tempId: 'temp-1',
          productId: 1,
          productName: 'Ppr Elbow 1/2',
          barcode: 'SKU-091',
          sku: 'SKU-091',
          unitName: 'pc',
          conversionToBase: 1,
          qty: 50,
          qtyBase: 50,
          unitCostC: 1500,
          discountInput: '-20%',
          discountC: 300,
          netUnitCostC: 1200,
          subtotalC: 60000
        }
      ]
    }
    localStorage.setItem('tinda_purchase_invoice_draft_v1', JSON.stringify(mockDraft))

    const html = renderToStaticMarkup(React.createElement(PurchaseInvoiceModal as unknown as React.ComponentType<{ open?: boolean; isMinimized?: boolean }>, { open: true, isMinimized: true }))
    expect(html).toContain('1 items staged')
    expect(html).toContain('₱600.00')
  })
})
