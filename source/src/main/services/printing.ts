import { BrowserWindow } from 'electron'
import type { PrinterInfo, WebContents } from 'electron'
import type { Sale, StoreSettings } from '@shared/types'
import { formatReceiptDate, receiptHtml } from '@shared/receiptHtml'
import { autoDetectThermalPrinter, inferPaperWidth } from '@shared/printer'
import { generateBarcodeSvg } from '@shared/barcodeSvg'
import { buildReceiptLines } from './checkout'

// Re-exported so existing consumers keep importing from the printing service.
export { escapeHtml, receiptHtml } from '@shared/receiptHtml'

export interface PrintResult {
  ok: boolean
  code: 'PRINTED' | 'DISABLED' | 'NO_PRINTER' | 'UNAVAILABLE' | 'FAILED'
  message: string
}

export interface PrintOptions {
  manual?: boolean
  deviceName?: string
}

export function testPrintLines(settings: StoreSettings, printer: string, now = new Date()): string[] {
  return [
    'TINDA POS',
    'PRINTER TEST',
    '',
    `Store: ${settings.store_name}`,
    `Printer: ${printer}`,
    `Paper: ${settings.receipt_paper_width}`,
    `Date: ${formatReceiptDate(now)}`,
    '--------------------------------',
    'Printer configuration successful',
    '--------------------------------',
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

export async function submitPrint(
  webContents: WebContents,
  settings: StoreSettings,
  options?: PrintOptions
): Promise<PrintResult> {
  const isManual = options?.manual === true
  const selected = (options?.deviceName || settings.receipt_printer || '').trim()
  const printers = await webContents.getPrintersAsync()

  // If a printer was explicitly configured by the merchant but is now missing/offline
  if (!isManual && selected && !printers.some((p) => p.name === selected)) {
    // If an alternative thermal printer is connected, auto-recover to it; otherwise fail honestly with UNAVAILABLE
    const fallback = autoDetectThermalPrinter(printers)
    if (!fallback) {
      return { ok: false, code: 'UNAVAILABLE', message: `The selected receipt printer "${selected}" is unavailable.` }
    }
  }

  if (!isManual && (!printers || printers.length === 0)) {
    return { ok: false, code: 'NO_PRINTER', message: 'No printer found on this system. Please connect a thermal printer via USB or Bluetooth.' }
  }

  const target = autoDetectThermalPrinter(printers, selected || settings.receipt_printer)
  const printerName = isManual ? (selected || (target ? target.name : undefined)) : (target ? target.name : undefined)

  if (!isManual && !printerName) {
    return { ok: false, code: 'NO_PRINTER', message: 'No receipt printer is available.' }
  }

  const copies = Math.min(3, Math.max(1, Math.trunc(settings.receipt_copies || 1)))
  // If paper width is configured use it, otherwise use auto-detected
  const effectivePaperWidth = settings.receipt_paper_width || (target ? target.paperWidth : '58mm')
  const is58mm = effectivePaperWidth === '58mm'
  
  // Custom paper size in microns: 58mm = 58,000 microns, 80mm = 80,000 microns
  const pageSizeMicrons = is58mm
    ? { width: 58000, height: 297000 }
    : { width: 80000, height: 297000 }

  return new Promise((resolve) => {
    webContents.print(
      {
        silent: !isManual,
        deviceName: printerName,
        printBackground: true,
        color: false, // Monochrome: avoids chromatic dithering and blur on 203 DPI thermal printheads
        dpi: { horizontal: 203, vertical: 203 },
        copies,
        pageSize: pageSizeMicrons,
        margins: {
          marginType: 'none'
        }
      },
      (success, failureReason) => {
        if (success) {
          resolve({
            ok: true,
            code: 'PRINTED',
            message: isManual
              ? 'Print job completed successfully via system print dialog.'
              : `Receipt printed successfully to "${printerName || 'thermal printer'}".`
          })
        } else {
          const reason = failureReason || ''
          const isCancelled = /cancel/i.test(reason)
          resolve({
            ok: false,
            code: isCancelled ? 'DISABLED' : 'FAILED',
            message: isCancelled ? 'Print dialog cancelled by user.' : (reason || 'Receipt printing failed.')
          })
        }
      }
    )
  })
}

export async function printLines(
  settings: StoreSettings,
  lines: string[],
  options?: PrintOptions
): Promise<PrintResult> {
  const isManual = options?.manual ?? settings.manual_print_dialog ?? false
  const window = new BrowserWindow({
    show: isManual,
    width: 380,
    height: 640,
    center: true,
    title: 'TINDA POS - Print Receipt',
    autoHideMenuBar: true,
    alwaysOnTop: isManual,
    webPreferences: {
      sandbox: true,
      contextIsolation: true,
      nodeIntegration: false
    }
  })

  try {
    const printers = await window.webContents.getPrintersAsync()
    const target = autoDetectThermalPrinter(printers, options?.deviceName || settings.receipt_printer)
    const effectiveWidth = settings.receipt_paper_width || (target ? target.paperWidth : '58mm')

    const htmlPayload = receiptHtml(lines, effectiveWidth, settings.currency)
    await window.loadURL(`data:text/html;charset=UTF-8,${encodeURIComponent(htmlPayload)}`)

    // Wait 350ms buffer to guarantee the Chromium layout and fonts are 100% rasterized before spooling
    await new Promise((r) => setTimeout(r, 350))

    if (window.isDestroyed()) {
      return { ok: false, code: 'FAILED', message: 'Print window closed before printing.' }
    }

    const result = await submitPrint(window.webContents, settings, {
      ...options,
      manual: isManual
    })

    // Wait an additional 500ms so Windows Print Spooler finishes reading before destroying the WebContents
    await new Promise((r) => setTimeout(r, 500))

    return result
  } finally {
    if (!window.isDestroyed()) window.destroy()
  }
}

export async function listPrinters(webContents: WebContents): Promise<PrinterInfo[]> {
  return webContents.getPrintersAsync()
}

export async function printSale(
  settings: StoreSettings,
  sale: Sale,
  options?: PrintOptions
): Promise<PrintResult> {
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
  return printLines(settings, lines, options)
}

export async function autoPrintAfterCheckout(
  settings: StoreSettings,
  sale: Sale,
  printer = printSale
): Promise<PrintResult> {
  if (!settings.auto_print_after_sale) return { ok: true, code: 'DISABLED', message: 'Automatic receipt printing is off.' }
  try {
    return await printer(settings, sale, { manual: settings.manual_print_dialog })
  } catch (error) {
    return { ok: false, code: 'FAILED', message: error instanceof Error ? error.message : String(error) }
  }
}

export async function printTest(
  settings: StoreSettings,
  options?: PrintOptions
): Promise<PrintResult> {
  const targetPrinter = options?.deviceName || settings.receipt_printer || 'Auto-Detected Thermal Printer'
  return printLines(settings, testPrintLines(settings, targetPrinter), options)
}

export async function printDocument(
  html: string,
  options?: {
    manual?: boolean
    title?: string
    pageSize?: 'A4' | 'Letter'
    deviceName?: string
    widthMm?: number
    heightMm?: number
  }
): Promise<PrintResult> {
  const isManual = options?.manual ?? false
  const title = options?.title || 'TINDA POS - Printable Document'

  // Custom paper size in microns if width/height are specified (1mm = 1000 microns)
  const isCustomLabel = Boolean(options?.widthMm && options?.heightMm)
  const effectivePageSize = isCustomLabel
    ? { width: Math.round((options!.widthMm || 40) * 1000), height: Math.round((options!.heightMm || 30) * 1000) }
    : (options?.pageSize || 'A4')

  const window = new BrowserWindow({
    show: isManual,
    width: isCustomLabel ? 520 : 900,
    height: isCustomLabel ? 550 : 1050,
    center: true,
    title,
    autoHideMenuBar: true,
    alwaysOnTop: isManual,
    webPreferences: {
      sandbox: true,
      contextIsolation: true,
      nodeIntegration: false
    }
  })

  try {
    await window.loadURL(`data:text/html;charset=UTF-8,${encodeURIComponent(html)}`)
    // Give Chromium 400ms buffer to layout tables and render CSS print assets
    await new Promise((r) => setTimeout(r, 400))

    if (window.isDestroyed()) {
      return { ok: false, code: 'FAILED', message: 'Print window closed before printing.' }
    }

    const printParams: Electron.WebContentsPrintOptions = {
      silent: !isManual,
      printBackground: true,
      color: true,
      pageSize: effectivePageSize,
      margins: {
        marginType: isCustomLabel ? 'none' : 'printableArea'
      }
    }

    if (options?.deviceName) {
      printParams.deviceName = options.deviceName
    }

    return await new Promise((resolve) => {
      window.webContents.print(
        printParams,
        (success, failureReason) => {
          if (success) {
            resolve({
              ok: true,
              code: 'PRINTED',
              message: isManual
                ? 'Document sent to system print dialog.'
                : 'Document printed successfully.'
            })
          } else {
            const isCancelled = /cancel/i.test(failureReason || '')
            resolve({
              ok: false,
              code: isCancelled ? 'DISABLED' : 'FAILED',
              message: isCancelled ? 'Print dialog cancelled by user.' : (failureReason || 'Document printing failed.')
            })
          }
        }
      )
    })
  } finally {
    // Keep window alive briefly for Windows Spooler to buffer
    await new Promise((r) => setTimeout(r, 600))
    if (!window.isDestroyed()) window.destroy()
  }
}

export async function printLabelTest(
  settings: StoreSettings,
  options?: { manual?: boolean; deviceName?: string }
): Promise<PrintResult> {
  const targetDevice = options?.deviceName || settings.label_printer || ''
  const testSvg = generateBarcodeSvg('TINDA-CT221B', { height: 35, includeText: true, barWidth: 1.4, fontSize: 8 })
  const testHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        @page { size: 40mm 30mm; margin: 0; }
        * { box-sizing: border-box; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        body { margin: 0; padding: 1.5mm; background: #fff; color: #000; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; text-align: center; }
        .hdr { font-size: 7.5px; font-weight: 900; text-transform: uppercase; border-bottom: 1px solid #000; padding-bottom: 0.5mm; }
        .sub { font-size: 9px; font-weight: 800; margin: 1mm 0 0.5mm 0; }
        .badge { display: inline-block; font-size: 6.5px; font-weight: bold; background: #000; color: #fff; padding: 0.5mm 1.5mm; border-radius: 1mm; }
        .footer { font-size: 6px; color: #333; margin-top: 0.5mm; font-family: monospace; }
      </style>
    </head>
    <body>
      <div class="hdr">${settings.store_name || 'TINDA POS'}</div>
      <div class="sub">CHITENG CT221B</div>
      <div style="margin: 0.5mm 0;">${testSvg}</div>
      <div><span class="badge">HARDWARE READY</span></div>
      <div class="footer">${new Date().toLocaleTimeString()}</div>
    </body>
    </html>
  `
  return printDocument(testHtml, {
    manual: options?.manual ?? false,
    title: 'CT221B Label Test',
    deviceName: targetDevice || undefined,
    widthMm: 40,
    heightMm: 30
  })
}


