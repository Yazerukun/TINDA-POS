import { BrowserWindow } from 'electron'
import type { PrinterInfo, WebContents } from 'electron'
import type { Sale, StoreSettings } from '@shared/types'
import { receiptHtml } from '@shared/receiptHtml'
import { autoDetectThermalPrinter, inferPaperWidth } from '@shared/printer'
import { buildReceiptLines } from './checkout'

// Re-exported so existing consumers keep importing from the printing service.
export { escapeHtml, receiptHtml } from '@shared/receiptHtml'

export interface PrintResult {
  ok: boolean
  code: 'PRINTED' | 'DISABLED' | 'NO_PRINTER' | 'UNAVAILABLE' | 'FAILED'
  message: string
}

export function testPrintLines(settings: StoreSettings, printer: string, now = new Date()): string[] {
  return [
    'TINDA POS',
    'PRINTER TEST',
    '',
    `Store: ${settings.store_name}`,
    `Printer: ${printer}`,
    `Paper: ${settings.receipt_paper_width}`,
    `Date: ${now.toLocaleString('en-PH')}`,
    '--------------------------',
    'Printer configuration successful',
    '--------------------------',
    'Thank you!'
  ]
}

export async function resolvePrinterTarget(webContents: WebContents, settings: StoreSettings): Promise<{
  printerName: string
  paperWidth: '58mm' | '80mm'
} | null> {
  const printers = await webContents.getPrintersAsync()
  if (!printers || printers.length === 0) return null

  const saved = (settings.receipt_printer || '').trim()
  const detected = autoDetectThermalPrinter(printers, saved)
  if (!detected) return null

  // If user explicitly configured paper width, keep it; otherwise use inferred width
  const paperWidth = settings.receipt_paper_width || detected.paperWidth
  return {
    printerName: detected.name,
    paperWidth
  }
}

export async function submitPrint(webContents: WebContents, settings: StoreSettings): Promise<PrintResult> {
  const selected = (settings.receipt_printer || '').trim()
  const printers = await webContents.getPrintersAsync()

  // If a printer was explicitly configured by the merchant but is now missing/offline
  if (selected && !printers.some((p) => p.name === selected)) {
    // If an alternative thermal printer is connected, auto-recover to it; otherwise fail honestly with UNAVAILABLE
    const fallback = autoDetectThermalPrinter(printers)
    if (!fallback) {
      return { ok: false, code: 'UNAVAILABLE', message: `The selected receipt printer "${selected}" is unavailable.` }
    }
  }

  if (!printers || printers.length === 0) {
    return { ok: false, code: 'NO_PRINTER', message: 'No printer found on this system. Please connect a thermal printer via USB or Bluetooth.' }
  }

  const target = autoDetectThermalPrinter(printers, settings.receipt_printer)
  if (!target) {
    return { ok: false, code: 'NO_PRINTER', message: 'No receipt printer is available.' }
  }

  const printerName = target.name

  const copies = Math.min(3, Math.max(1, Math.trunc(settings.receipt_copies || 1)))
  // If paper width is configured use it, otherwise use auto-detected
  const effectivePaperWidth = settings.receipt_paper_width || target.paperWidth
  const is58mm = effectivePaperWidth === '58mm'
  
  // Custom paper size in microns: 58mm = 58,000 microns, 80mm = 80,000 microns
  const pageSizeMicrons = is58mm
    ? { width: 58000, height: 297000 }
    : { width: 80000, height: 297000 }

  return new Promise((resolve) => {
    webContents.print(
      {
        silent: true,
        deviceName: printerName,
        printBackground: true,
        color: true,
        copies,
        pageSize: pageSizeMicrons,
        margins: {
          marginType: 'none'
        }
      },
      (success, failureReason) => {
        resolve(
          success
            ? { ok: true, code: 'PRINTED', message: `Receipt printed successfully to "${printerName}".` }
            : { ok: false, code: 'FAILED', message: failureReason || 'Receipt printing failed.' }
        )
      }
    )
  })

}

export async function printLines(settings: StoreSettings, lines: string[]): Promise<PrintResult> {
  const window = new BrowserWindow({
    show: false,
    width: 320,
    height: 600,
    webPreferences: {
      sandbox: true,
      contextIsolation: true,
      nodeIntegration: false
    }
  })

  try {
    const printers = await window.webContents.getPrintersAsync()
    const target = autoDetectThermalPrinter(printers, settings.receipt_printer)
    const effectiveWidth = settings.receipt_paper_width || (target ? target.paperWidth : '58mm')

    const htmlPayload = receiptHtml(lines, effectiveWidth, settings.currency)
    await window.loadURL(`data:text/html;charset=UTF-8,${encodeURIComponent(htmlPayload)}`)

    // Wait 250ms buffer to guarantee the Chromium layout and fonts are 100% rasterized before spooling
    await new Promise((r) => setTimeout(r, 250))

    const result = await submitPrint(window.webContents, settings)

    // Wait an additional 350ms so Windows Print Spooler finishes reading before destroying the WebContents
    await new Promise((r) => setTimeout(r, 350))

    return result
  } finally {
    if (!window.isDestroyed()) window.destroy()
  }
}

export async function listPrinters(webContents: WebContents): Promise<PrinterInfo[]> {
  return webContents.getPrintersAsync()
}

export async function printSale(settings: StoreSettings, sale: Sale): Promise<PrintResult> {
  const lines = buildReceiptLines({
    header: settings.receipt_header,
    title: settings.receipt_title,
    show_app_name: settings.receipt_show_app_name,
    store_name: settings.store_name,
    owner_name: settings.owner_name,
    address: settings.address,
    phone: settings.phone,
    tin: settings.tin,
    currency: settings.currency,
    footer: settings.receipt_footer
  }, sale)
  return printLines(settings, lines)
}

export async function autoPrintAfterCheckout(settings: StoreSettings, sale: Sale, printer = printSale): Promise<PrintResult> {
  if (!settings.auto_print_after_sale) return { ok: true, code: 'DISABLED', message: 'Automatic receipt printing is off.' }
  try {
    return await printer(settings, sale)
  } catch (error) {
    return { ok: false, code: 'FAILED', message: error instanceof Error ? error.message : String(error) }
  }
}

export async function printTest(settings: StoreSettings): Promise<PrintResult> {
  const targetPrinter = settings.receipt_printer || 'Auto-Detected Thermal Printer'
  return printLines(settings, testPrintLines(settings, targetPrinter))
}

