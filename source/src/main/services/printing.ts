import { BrowserWindow } from 'electron'
import type { PrinterInfo, WebContents } from 'electron'
import type { Sale, StoreSettings } from '@shared/types'
import { buildReceiptLines } from './checkout'

export interface PrintResult {
  ok: boolean
  code: 'PRINTED' | 'DISABLED' | 'NO_PRINTER' | 'UNAVAILABLE' | 'FAILED'
  message: string
}

export function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' })[char]!)
}

export function receiptHtml(lines: string[], width: '58mm' | '80mm'): string {
  return `<!doctype html><html><head><meta charset="utf-8"><style>
    @page { size: ${width} auto; margin: 3mm; }
    html, body { margin: 0; padding: 0; width: ${width}; background: white; color: black; }
    body { box-sizing: border-box; padding: 2mm; font: 10pt/1.28 Consolas, "Courier New", monospace; }
    pre { margin: 0; white-space: pre-wrap; overflow-wrap: anywhere; word-break: break-word; }
  </style></head><body><pre>${escapeHtml(lines.join('\n'))}</pre></body></html>`
}

export function testPrintLines(settings: StoreSettings, printer: string, now = new Date()): string[] {
  return [
    'TINDA POS',
    'PRINTER TEST',
    '',
    `Store: ${settings.store_name}`,
    `Printer: ${printer}`,
    `Date: ${now.toLocaleString('en-PH')}`,
    '--------------------------',
    'Printing is working.',
    '--------------------------'
  ]
}

export async function submitPrint(webContents: WebContents, settings: StoreSettings): Promise<PrintResult> {
  const selected = settings.receipt_printer.trim()
  if (!selected) return { ok: false, code: 'NO_PRINTER', message: 'No receipt printer is configured.' }
  const printers = await webContents.getPrintersAsync()
  if (!printers.some((printer) => printer.name === selected)) {
    return { ok: false, code: 'UNAVAILABLE', message: 'The selected printer is unavailable.' }
  }
  return new Promise((resolve) => {
    webContents.print({ silent: true, deviceName: selected, printBackground: false, copies: Math.max(1, settings.receipt_copies) }, (success, failureReason) => {
      resolve(success
        ? { ok: true, code: 'PRINTED', message: 'Receipt printed successfully.' }
        : { ok: false, code: 'FAILED', message: failureReason || 'Receipt printing failed.' })
    })
  })
}

async function printLines(settings: StoreSettings, lines: string[]): Promise<PrintResult> {
  const window = new BrowserWindow({ show: false, webPreferences: { sandbox: true, contextIsolation: true, nodeIntegration: false } })
  try {
    await window.loadURL(`data:text/html;charset=UTF-8,${encodeURIComponent(receiptHtml(lines, settings.receipt_paper_width))}`)
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
