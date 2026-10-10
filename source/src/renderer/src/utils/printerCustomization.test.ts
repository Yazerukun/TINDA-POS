import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  DEFAULT_PRINTER_CUSTOMIZATION,
  PRINTER_CUSTOMIZATION_STORAGE_KEY,
  PRINTER_CONFIG_CHANGED_EVENT,
  getStoredPrinterCustomization,
  saveStoredPrinterCustomization,
  reconcilePrinterCustomization
} from './printerCustomization'

describe('Printer & Receipt Customization Dual-Store Resilience', () => {
  const store: Record<string, string> = {}
  const listeners: Record<string, Function[]> = {}

  beforeEach(() => {
    Object.keys(store).forEach((k) => delete store[k])
    Object.keys(listeners).forEach((k) => delete listeners[k])

    globalThis.localStorage = {
      getItem: (key: string) => store[key] ?? null,
      setItem: (key: string, val: string) => {
        store[key] = String(val)
      },
      removeItem: (key: string) => {
        delete store[key]
      },
      clear: () => {
        Object.keys(store).forEach((k) => delete store[k])
      },
      length: 0,
      key: () => null
    } as unknown as Storage

    globalThis.window = {
      addEventListener: (type: string, cb: Function) => {
        listeners[type] = listeners[type] || []
        listeners[type].push(cb)
      },
      removeEventListener: (type: string, cb: Function) => {
        if (!listeners[type]) return
        listeners[type] = listeners[type].filter((fn) => fn !== cb)
      },
      dispatchEvent: (e: any) => {
        const cbs = listeners[e.type] || []
        cbs.forEach((fn) => fn(e))
        return true
      }
    } as any

    vi.restoreAllMocks()
  })

  it('provides sensible factory defaults for thermal receipts and CT221B labels', () => {
    expect(DEFAULT_PRINTER_CUSTOMIZATION.receipt_offset_left_mm).toBe(3.5)
    expect(DEFAULT_PRINTER_CUSTOMIZATION.receipt_offset_right_mm).toBe(2.0)
    expect(DEFAULT_PRINTER_CUSTOMIZATION.receipt_feed_lines_end).toBe(3)
    expect(DEFAULT_PRINTER_CUSTOMIZATION.receipt_font_scale).toBe(100)
    expect(DEFAULT_PRINTER_CUSTOMIZATION.receipt_ultra_black).toBe(true)
    expect(DEFAULT_PRINTER_CUSTOMIZATION.label_paper_size).toBe('40x30')
    expect(DEFAULT_PRINTER_CUSTOMIZATION.label_offset_x_mm).toBe(0.0)
    expect(DEFAULT_PRINTER_CUSTOMIZATION.label_offset_y_mm).toBe(0.0)
  })

  it('returns empty object when no customization is stored in localStorage', () => {
    const stored = getStoredPrinterCustomization()
    expect(stored).toEqual({})
  })

  it('synchronously saves to localStorage and dispatches reactive event', () => {
    const eventSpy = vi.fn()
    window.addEventListener(PRINTER_CONFIG_CHANGED_EVENT, eventSpy)

    const saved = saveStoredPrinterCustomization({
      receipt_offset_left_mm: 5.5,
      receipt_feed_lines_end: 4,
      label_offset_x_mm: 1.5
    })

    expect(saved.receipt_offset_left_mm).toBe(5.5)
    expect(saved.receipt_feed_lines_end).toBe(4)
    expect(saved.label_offset_x_mm).toBe(1.5)

    const inStorage = JSON.parse(localStorage.getItem(PRINTER_CUSTOMIZATION_STORAGE_KEY)!)
    expect(inStorage.receipt_offset_left_mm).toBe(5.5)
    expect(inStorage.label_offset_x_mm).toBe(1.5)

    expect(eventSpy).toHaveBeenCalledTimes(1)
    window.removeEventListener(PRINTER_CONFIG_CHANGED_EVENT, eventSpy)
  })

  it('reconciles cleanly to defaults when neither settings nor localStorage have values', () => {
    const result = reconcilePrinterCustomization(null)
    expect(result.receipt_offset_left_mm).toBe(3.5)
    expect(result.receipt_paper_width).toBe('58mm')
    expect(result.label_offset_x_mm).toBe(0.0)
  })

  it('recovers custom offsets from localStorage when backend settings drops or misses them', () => {
    // Merchant customized offsets
    saveStoredPrinterCustomization({
      receipt_offset_left_mm: 6.2,
      receipt_offset_right_mm: 3.1,
      receipt_custom_header: 'MY SARI-SARI STORE',
      label_offset_x_mm: -1.0,
      label_offset_y_mm: 0.5
    })

    // Simulate an Electron main process that did not return the new keys (or returned undefined)
    const backendSettingsMissingKeys: any = {
      store_name: 'Test Store',
      receipt_paper_width: '58mm'
      // Notice: receipt_offset_left_mm, label_offset_x_mm etc. are absent
    }

    const reconciled = reconcilePrinterCustomization(backendSettingsMissingKeys)
    expect(reconciled.receipt_offset_left_mm).toBe(6.2)
    expect(reconciled.receipt_offset_right_mm).toBe(3.1)
    expect(reconciled.receipt_custom_header).toBe('MY SARI-SARI STORE')
    expect(reconciled.label_offset_x_mm).toBe(-1.0)
    expect(reconciled.label_offset_y_mm).toBe(0.5)
  })

  it('prioritizes explicitly passed settings when provided', () => {
    // Local storage has older value
    saveStoredPrinterCustomization({
      receipt_offset_left_mm: 4.0
    })

    // Backend provides updated value
    const settings: any = {
      receipt_offset_left_mm: 7.0
    }

    const reconciled = reconcilePrinterCustomization(settings)
    expect(reconciled.receipt_offset_left_mm).toBe(7.0)
  })

  it('self-heals localStorage when settings contains newer configuration', () => {
    const settings: any = {
      receipt_offset_left_mm: 8.0,
      label_offset_y_mm: 2.2
    }

    reconcilePrinterCustomization(settings)

    const inStorage = JSON.parse(localStorage.getItem(PRINTER_CUSTOMIZATION_STORAGE_KEY)!)
    expect(inStorage.receipt_offset_left_mm).toBe(8.0)
    expect(inStorage.label_offset_y_mm).toBe(2.2)
  })
})
