import type { StoreSettings } from '@shared/types'

export const PRINTER_CUSTOMIZATION_STORAGE_KEY = 'tinda_printer_customization_v1'
export const PRINTER_CONFIG_CHANGED_EVENT = 'tinda-printer-config-changed'

export interface PrinterCustomizationSettings {
  // Receipt Layout Parameters
  receipt_paper_width: '58mm' | '80mm'
  receipt_offset_left_mm: number
  receipt_offset_right_mm: number
  receipt_feed_lines_end: number
  receipt_font_scale: number
  receipt_line_spacing: 'compact' | 'balanced' | 'spacious'
  receipt_ultra_black: boolean
  receipt_custom_header: string
  receipt_custom_footer: string
  receipt_show_cashier: boolean
  receipt_show_customer: boolean
  receipt_show_change_breakdown: boolean
  receipt_show_footer_qr: boolean

  // Chiteng CT221B Barcode & Label Parameters
  label_paper_size: string
  label_custom_width_mm: number
  label_custom_height_mm: number
  label_offset_x_mm: number
  label_offset_y_mm: number
  label_safe_margin_mm: number
  label_barcode_height_mm: number
  label_barcode_bar_width: number
  label_price_font_size: 'medium' | 'large' | 'jumbo'
  label_show_store_name: boolean
  label_show_barcode: boolean
  label_show_sku: boolean
  label_show_wholesale: boolean
}

export const DEFAULT_PRINTER_CUSTOMIZATION: PrinterCustomizationSettings = {
  receipt_paper_width: '58mm',
  receipt_offset_left_mm: 3.5,
  receipt_offset_right_mm: 2.0,
  receipt_feed_lines_end: 3,
  receipt_font_scale: 100,
  receipt_line_spacing: 'balanced',
  receipt_ultra_black: true,
  receipt_custom_header: '',
  receipt_custom_footer: '',
  receipt_show_cashier: true,
  receipt_show_customer: true,
  receipt_show_change_breakdown: true,
  receipt_show_footer_qr: false,

  label_paper_size: '40x30',
  label_custom_width_mm: 40,
  label_custom_height_mm: 30,
  label_offset_x_mm: 0.0,
  label_offset_y_mm: 0.0,
  label_safe_margin_mm: 1.2,
  label_barcode_height_mm: 26,
  label_barcode_bar_width: 1.3,
  label_price_font_size: 'large',
  label_show_store_name: true,
  label_show_barcode: true,
  label_show_sku: true,
  label_show_wholesale: false
}

/**
 * Safely reads the locally persisted printer customization backup from localStorage.
 */
export function getStoredPrinterCustomization(): Partial<PrinterCustomizationSettings> {
  if (typeof window === 'undefined') return {}
  try {
    const raw = localStorage.getItem(PRINTER_CUSTOMIZATION_STORAGE_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw)
    return typeof parsed === 'object' && parsed !== null ? parsed : {}
  } catch {
    return {}
  }
}

/**
 * Synchronously writes printer customization to localStorage and dispatches a 0ms cross-component event.
 */
export function saveStoredPrinterCustomization(
  patch: Partial<PrinterCustomizationSettings>
): PrinterCustomizationSettings {
  const current = getStoredPrinterCustomization()
  const merged: PrinterCustomizationSettings = {
    ...DEFAULT_PRINTER_CUSTOMIZATION,
    ...current,
    ...patch
  }

  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(PRINTER_CUSTOMIZATION_STORAGE_KEY, JSON.stringify(merged))
      window.dispatchEvent(new CustomEvent(PRINTER_CONFIG_CHANGED_EVENT, { detail: merged }))
    } catch (err) {
      console.warn('Failed to save printer customization to localStorage:', err)
    }
  }

  return merged
}

/**
 * Reconciles settings between SQLite StoreSettings, localStorage persistent fallback,
 * and standard factory defaults. This guarantees that un-restarted Electron main processes
 * or stripped keys never cause printer configurations to revert to defaults.
 */
export function reconcilePrinterCustomization(
  settings?: Partial<StoreSettings> | null
): PrinterCustomizationSettings {
  const stored = getStoredPrinterCustomization()

  const resolveVal = <K extends keyof PrinterCustomizationSettings>(
    key: K,
    defaultVal: PrinterCustomizationSettings[K]
  ): PrinterCustomizationSettings[K] => {
    // 1. First priority: settings prop if explicitly defined and not null
    const settingVal = settings ? (settings as any)[key] : undefined
    if (settingVal !== undefined && settingVal !== null) {
      return settingVal as PrinterCustomizationSettings[K]
    }

    // 2. Second priority: localStorage persistent backup
    const storedVal = (stored as any)[key]
    if (storedVal !== undefined && storedVal !== null) {
      return storedVal as PrinterCustomizationSettings[K]
    }

    // 3. Fallback: factory default
    return defaultVal
  }

  const result: PrinterCustomizationSettings = {
    receipt_paper_width: resolveVal('receipt_paper_width', DEFAULT_PRINTER_CUSTOMIZATION.receipt_paper_width),
    receipt_offset_left_mm: Number(resolveVal('receipt_offset_left_mm', DEFAULT_PRINTER_CUSTOMIZATION.receipt_offset_left_mm)),
    receipt_offset_right_mm: Number(resolveVal('receipt_offset_right_mm', DEFAULT_PRINTER_CUSTOMIZATION.receipt_offset_right_mm)),
    receipt_feed_lines_end: Number(resolveVal('receipt_feed_lines_end', DEFAULT_PRINTER_CUSTOMIZATION.receipt_feed_lines_end)),
    receipt_font_scale: Number(resolveVal('receipt_font_scale', DEFAULT_PRINTER_CUSTOMIZATION.receipt_font_scale)),
    receipt_line_spacing: resolveVal('receipt_line_spacing', DEFAULT_PRINTER_CUSTOMIZATION.receipt_line_spacing),
    receipt_ultra_black: Boolean(resolveVal('receipt_ultra_black', DEFAULT_PRINTER_CUSTOMIZATION.receipt_ultra_black)),
    receipt_custom_header: String(resolveVal('receipt_custom_header', DEFAULT_PRINTER_CUSTOMIZATION.receipt_custom_header)),
    receipt_custom_footer: String(resolveVal('receipt_custom_footer', DEFAULT_PRINTER_CUSTOMIZATION.receipt_custom_footer)),
    receipt_show_cashier: Boolean(resolveVal('receipt_show_cashier', DEFAULT_PRINTER_CUSTOMIZATION.receipt_show_cashier)),
    receipt_show_customer: Boolean(resolveVal('receipt_show_customer', DEFAULT_PRINTER_CUSTOMIZATION.receipt_show_customer)),
    receipt_show_change_breakdown: Boolean(resolveVal('receipt_show_change_breakdown', DEFAULT_PRINTER_CUSTOMIZATION.receipt_show_change_breakdown)),
    receipt_show_footer_qr: Boolean(resolveVal('receipt_show_footer_qr', DEFAULT_PRINTER_CUSTOMIZATION.receipt_show_footer_qr)),

    label_paper_size: String(resolveVal('label_paper_size', DEFAULT_PRINTER_CUSTOMIZATION.label_paper_size)),
    label_custom_width_mm: Number(resolveVal('label_custom_width_mm', DEFAULT_PRINTER_CUSTOMIZATION.label_custom_width_mm)),
    label_custom_height_mm: Number(resolveVal('label_custom_height_mm', DEFAULT_PRINTER_CUSTOMIZATION.label_custom_height_mm)),
    label_offset_x_mm: Number(resolveVal('label_offset_x_mm', DEFAULT_PRINTER_CUSTOMIZATION.label_offset_x_mm)),
    label_offset_y_mm: Number(resolveVal('label_offset_y_mm', DEFAULT_PRINTER_CUSTOMIZATION.label_offset_y_mm)),
    label_safe_margin_mm: Number(resolveVal('label_safe_margin_mm', DEFAULT_PRINTER_CUSTOMIZATION.label_safe_margin_mm)),
    label_barcode_height_mm: Number(resolveVal('label_barcode_height_mm', DEFAULT_PRINTER_CUSTOMIZATION.label_barcode_height_mm)),
    label_barcode_bar_width: Number(resolveVal('label_barcode_bar_width', DEFAULT_PRINTER_CUSTOMIZATION.label_barcode_bar_width)),
    label_price_font_size: resolveVal('label_price_font_size', DEFAULT_PRINTER_CUSTOMIZATION.label_price_font_size),
    label_show_store_name: Boolean(resolveVal('label_show_store_name', DEFAULT_PRINTER_CUSTOMIZATION.label_show_store_name)),
    label_show_barcode: Boolean(resolveVal('label_show_barcode', DEFAULT_PRINTER_CUSTOMIZATION.label_show_barcode)),
    label_show_sku: Boolean(resolveVal('label_show_sku', DEFAULT_PRINTER_CUSTOMIZATION.label_show_sku)),
    label_show_wholesale: Boolean(resolveVal('label_show_wholesale', DEFAULT_PRINTER_CUSTOMIZATION.label_show_wholesale))
  }

  // Self-heal localStorage if settings had valid customization values that were missing in storage
  if (typeof window !== 'undefined' && settings) {
    let needsSync = false
    const currentStored = getStoredPrinterCustomization()
    for (const key of Object.keys(DEFAULT_PRINTER_CUSTOMIZATION) as (keyof PrinterCustomizationSettings)[]) {
      if ((settings as any)[key] !== undefined && (currentStored as any)[key] !== (settings as any)[key]) {
        needsSync = true
        break
      }
    }
    if (needsSync) {
      try {
        localStorage.setItem(PRINTER_CUSTOMIZATION_STORAGE_KEY, JSON.stringify(result))
      } catch {}
    }
  }

  return result
}
