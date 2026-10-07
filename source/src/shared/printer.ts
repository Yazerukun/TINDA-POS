// Pure helpers for choosing the receipt printer in Settings.
// Shared so the exact same selection rules can be unit-tested without Electron.

export interface PrinterChoiceLike {
  name: string
  displayName?: string
  isDefault?: boolean
}

export type PrinterStatus = 'READY' | 'UNAVAILABLE' | 'NOT_CONFIGURED'

export interface PrinterPick {
  name: string
  status: PrinterStatus
}

export const THERMAL_KEYWORD_REGEX =
  /(pos-?\s*58|pos-?\s*80|58mm|80mm|58h|thermal|receipt|goojprt|xprinter|jk-?\s*58|zj-?\s*58|xp-?\s*58|xp-?\s*80|rp-?\s*58|rp-?\s*80|jp-?\s*58|kp-?\s*58|black copper|printer-?\s*58|printer-?\s*80|tm-?t\d+|bixolon|hprt|munbyn|snappy|rongta|gprinter|sunmi)/i

export const FIFTY_EIGHT_MM_REGEX =
  /(58|58mm|58h|pb-?58|jk-?58|zj-?58|pos-?58|xp-?58|rp-?58|jp-?58|kp-?58|mini)/i

export function isThermalPrinterName(name: string): boolean {
  if (!name) return false
  return THERMAL_KEYWORD_REGEX.test(name)
}

export function inferPaperWidth(printerName: string): '58mm' | '80mm' {
  if (FIFTY_EIGHT_MM_REGEX.test(printerName)) {
    return '58mm'
  }
  return '80mm'
}

export interface AutoDetectedPrinter {
  name: string
  paperWidth: '58mm' | '80mm'
  isAutoDetected: boolean
}

/**
 * Intelligent Auto-Detection Engine:
 * Resolves the optimal receipt printer without requiring manual user interaction.
 *
 * 1. Saved printer matches currently connected devices -> use it immediately.
 * 2. If saved is missing or not currently connected:
 *    a. Look for any active printer whose name matches POS / Thermal / Receipt keywords (GOOJPRT, Xprinter, POS-58, etc.).
 *    b. If multiple thermal printers exist, pick default thermal or first thermal.
 *    c. If no thermal keyword matches but system has a default printer, pick it.
 *    d. If only 1 physical printer exists on the machine, pick it.
 */
export function autoDetectThermalPrinter(
  printers: PrinterChoiceLike[],
  savedPrinter?: string | null
): AutoDetectedPrinter | null {
  if (!printers || printers.length === 0) return null

  const trimmedSaved = (savedPrinter || '').trim()

  // 1. Saved printer is physically available
  if (trimmedSaved) {
    const existing = printers.find((p) => p.name === trimmedSaved)
    if (existing) {
      return {
        name: existing.name,
        paperWidth: inferPaperWidth(existing.name),
        isAutoDetected: false
      }
    }
  }

  // 2a. Search for connected POS/thermal printers
  const thermalPrinters = printers.filter((p) => isThermalPrinterName(p.name) || isThermalPrinterName(p.displayName || ''))
  if (thermalPrinters.length > 0) {
    // If one of the thermal printers is default, prioritize it
    const defaultThermal = thermalPrinters.find((p) => p.isDefault)
    const target = defaultThermal || thermalPrinters[0]!
    return {
      name: target.name,
      paperWidth: inferPaperWidth(target.name),
      isAutoDetected: true
    }
  }

  // 2b. Fallback to system default if available
  const systemDefault = printers.find((p) => p.isDefault)
  if (systemDefault) {
    return {
      name: systemDefault.name,
      paperWidth: inferPaperWidth(systemDefault.name),
      isAutoDetected: true
    }
  }

  // 2c. Fallback to the single installed printer
  if (printers.length === 1 && printers[0]) {
    return {
      name: printers[0].name,
      paperWidth: inferPaperWidth(printers[0].name),
      isAutoDetected: true
    }
  }

  return null
}

// Selection rules:
//  1. A previously saved printer that still exists -> select it (READY).
//  2. A previously saved printer that disappeared  -> keep it visible and mark
//     UNAVAILABLE so the store owner must choose again (no silent fallback to an
//     office printer). Actual print jobs also fail safely in submitPrint unless an auto-detected
//     POS printer is explicitly available.
//  3. Nothing saved yet -> suggest the system default printer when one exists;
//     otherwise, when exactly one printer is installed or a thermal printer is detected, suggest it.
export function printerPick(printers: PrinterChoiceLike[], saved: string): PrinterPick {
  const savedName = (saved || '').trim()
  if (savedName) {
    if (printers.some((p) => p.name === savedName)) return { name: savedName, status: 'READY' }
    return { name: savedName, status: 'UNAVAILABLE' }
  }
  const systemDefault = printers.find((p) => p.isDefault)
  const only = printers.length === 1 ? printers[0] : undefined
  const thermal = printers.find((p) => isThermalPrinterName(p.name) || isThermalPrinterName(p.displayName || ''))
  const suggested = systemDefault ?? only ?? thermal
  return { name: suggested ? suggested.name : '', status: 'NOT_CONFIGURED' }
}

export function printerStatusLabel(status: PrinterStatus): string {
  switch (status) {
    case 'READY': return 'Ready'
    case 'UNAVAILABLE': return 'Unavailable'
    case 'NOT_CONFIGURED': return 'Not configured'
  }
}


