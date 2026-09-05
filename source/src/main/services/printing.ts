import { BrowserWindow } from 'electron'
import type { PrinterInfo, WebContents } from 'electron'
import type { Sale, StoreSettings } from '@shared/types'
import { receiptHtml } from '@shared/receiptHtml'
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

export async function submitPrint(webContents: WebContents, settings: StoreSettings): Promise<PrintResult> {
  const selected = settings.receipt_printer.trim()
  if (!selected) return { ok: false, code: 'NO_PRINTER', message: 'No receipt printer is configured.' }
  const printers = await webContents.getPrintersAsync()
  if (!printers.some((printer) => printer.name === selected)) {
    return { ok: false, code: 'UNAVAILABLE', message: `The selected receipt printer "${selected}" is unavailable.` }
  }
  const copies = Math.min(3, Math.max(1, Math.trunc(settings.receipt_copies || 1)))
  return new Promise((resolve) => {
    webContents.print({ silent: true, deviceName: selected, printBackground: false, copies }, (success, failureReason) => {
      resolve(success
        ? { ok: true, code: 'PRINTED', message: 'Receipt printed successfully.' }
        : { ok: false, code: 'FAILED', message: failureReason || 'Receipt printing failed.' })
    })
  })
}

async function printLines(settings: StoreSettings, lines: string[]): Promise<PrintResult> {
  const window = new BrowserWindow({ show: false, webPreferences: { sandbox: true, contextIsolation: true, nodeIntegration: false } })
  try {
    await window.loadURL(`data:text/html;charset=UTF-8,${encodeURIComponent(receiptHtml(lines, settings.receipt_paper_width, settings.currency))}`)
    return await submitPrint(window.webContents, settings)
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
  return printLines(settings, testPrintLines(settings, settings.receipt_printer))
}
