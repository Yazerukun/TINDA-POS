import { readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it, vi } from 'vitest'
import type { WebContents } from 'electron'
import type { Sale } from '../../../shared/types'
import { defaultSettings } from '../../repositories/settings'
import { portableRootFromEnvironment, resolveDataLocation } from '../../database/dataLocation'
import { autoPrintAfterCheckout, receiptHtml, submitPrint, testPrintLines } from '../printing'
import { buildReceiptLines } from '../checkout'

const sale = {
  id: 7,
  transaction_no: 'TPOS-000007',
  created_at: '2026-09-05 10:30:00',
  cashier_name: 'QA Cashier',
  customer_name: 'Juan Customer',
  subtotal_c: 12000,
  discount_c: 1000,
  total_c: 11000,
  items: [{ product_name: 'A very long product name that should wrap safely', qty: 2, unit_price_c: 6000, subtotal_c: 12000 }],
  payments: [{ method: 'CASH', amount_c: 15000, reference: null }]
} as Sale

describe('data location modes', () => {
  it('keeps Shared AppData as the default and moving the EXE does not change it', () => {
    const first = resolveDataLocation({ sharedRoot: 'C:/Users/QA/AppData/Roaming/TINDA POS', env: { PORTABLE_EXECUTABLE_DIR: 'D:/TINDA POS' } })
    const moved = resolveDataLocation({ sharedRoot: 'C:/Users/QA/AppData/Roaming/TINDA POS', env: { PORTABLE_EXECUTABLE_DIR: 'E:/Moved' } })
    expect(first.mode).toBe('SHARED')
    expect(moved.databaseFile).toBe(first.databaseFile)
  })

  it('resolves Portable Data beside the verified portable executable directory without hardcoding a drive', () => {
    const fwd = (p: string) => p.replaceAll(path.sep, '/')
    expect(fwd(portableRootFromEnvironment({ PORTABLE_EXECUTABLE_DIR: 'E:/Apps/TINDA POS' }) ?? '')).toMatch(/E:\/Apps\/TINDA POS\/TindaPOS-Data$/)
    const info = resolveDataLocation({ sharedRoot: 'C:/shared', env: { PORTABLE_EXECUTABLE_DIR: 'E:/Apps/TINDA POS' }, saved: { mode: 'PORTABLE', portableRoot: 'E:/Apps/TINDA POS/TindaPOS-Data' } })
    expect(info.mode).toBe('PORTABLE')
    expect(fwd(info.databaseFile)).toMatch(/TindaPOS-Data\/database\/tindapos\.db$/)
  })

  it('forces isolated QA profiles to Shared mode even if a portable preference exists', () => {
    const info = resolveDataLocation({ sharedRoot: '/real', env: { TINDA_DATA_DIR: '/tmp/tinda-qa', PORTABLE_EXECUTABLE_DIR: '/media/usb' }, saved: { mode: 'PORTABLE', portableRoot: '/media/usb/TindaPOS-Data' } })
    expect(info.mode).toBe('SHARED')
    expect(info.root.replaceAll(path.sep, '/')).toMatch(/\/tmp\/tinda-qa$/)
  })
})

describe('receipt printing', () => {
  it('includes custom header/footer, store details, cash received, and SUKLI', () => {
    const lines = buildReceiptLines({ header: 'CUSTOM HEADER', store_name: 'QA Store', owner_name: 'Owner', address: 'Test Address', phone: '000', tin: '123', currency: 'PHP', footer: 'CUSTOM FOOTER' }, sale)
    expect(lines).toContain('CUSTOM HEADER')
    expect(lines).toContain('Cash          150.00')
    expect(lines).toContain('SUKLI         40.00')
    expect(lines.at(-1)).toBe('CUSTOM FOOTER')
  })

  it.each(['GCASH', 'MAYA'] as const)('includes %s reference numbers', (method) => {
    const electronic = { ...sale, payments: [{ method, amount_c: 11000, reference: 'REF-123' }] } as Sale
    const lines = buildReceiptLines({ header: '', store_name: 'QA', owner_name: '', address: '', phone: '', tin: '', currency: 'PHP', footer: 'Thanks' }, electronic)
    expect(lines).toContain('Reference: REF-123')
  })

  it('supports printer-safe 58mm and 80mm HTML with wrapping', () => {
    expect(receiptHtml(['long product'], '58mm')).toContain('size: 58mm auto')
    expect(receiptHtml(['long product'], '80mm')).toContain('overflow-wrap: anywhere')
  })

  it('does not submit a job when no printer is configured or the selected printer is unavailable', async () => {
    const print = vi.fn()
    const webContents = { getPrintersAsync: vi.fn().mockResolvedValue([]), print } as unknown as WebContents
    expect((await submitPrint(webContents, { ...defaultSettings, receipt_printer: '' })).code).toBe('NO_PRINTER')
    expect((await submitPrint(webContents, { ...defaultSettings, receipt_printer: 'Missing' })).code).toBe('UNAVAILABLE')
    expect(print).not.toHaveBeenCalled()
  })

  it('resolves success/failure from the Electron callback and uses the exact printer name', async () => {
    const webContents = {
      getPrintersAsync: vi.fn().mockResolvedValue([{ name: 'Windows Printer Exact Name' }]),
      print: vi.fn((_options, callback) => callback(true, ''))
    } as unknown as WebContents
    const result = await submitPrint(webContents, { ...defaultSettings, receipt_printer: 'Windows Printer Exact Name', receipt_copies: 2 })
    expect(result.code).toBe('PRINTED')
    expect(webContents.print).toHaveBeenCalledWith(expect.objectContaining({ silent: true, deviceName: 'Windows Printer Exact Name', copies: 2 }), expect.any(Function))
  })

  it('keeps completed sales successful when auto-print is disabled or printing fails', async () => {
    const printer = vi.fn().mockRejectedValue(new Error('spooler offline'))
    expect((await autoPrintAfterCheckout({ ...defaultSettings, auto_print_after_sale: false }, sale, printer)).code).toBe('DISABLED')
    expect(printer).not.toHaveBeenCalled()
    const failed = await autoPrintAfterCheckout({ ...defaultSettings, auto_print_after_sale: true }, sale, printer)
    expect(failed).toMatchObject({ ok: false, code: 'FAILED' })
  })

  it('creates test-print content without invoking checkout or creating a transaction', () => {
    const lines = testPrintLines({ ...defaultSettings, store_name: 'QA Store' }, 'QA Printer', new Date('2026-09-05T00:00:00Z'))
    expect(lines).toContain('PRINTER TEST')
    expect(lines).toContain('Store: QA Store')
    expect(lines).toContain('Printer: QA Printer')
  })

  it('keeps printer access behind preload and explicit IPC channels', () => {
    const preload = readFileSync(new URL('../../../preload/index.ts', import.meta.url), 'utf8')
    const ipc = readFileSync(new URL('../../ipc/index.ts', import.meta.url), 'utf8')
    for (const channel of ['printer:list', 'printer:save', 'printer:testPrint', 'printer:printReceipt']) {
      expect(preload).toContain(channel)
      expect(ipc).toContain(channel)
    }
    expect(ipc).toContain("sessionSvc.requirePermission('settings:manage')")
    expect(ipc).toContain("sessionSvc.requirePermission('transactions:view')")
    expect(ipc).toContain('isDefault: (printer as { isDefault?: boolean }).isDefault === true')
    expect(ipc).toContain('Math.min(3, Math.max(1, Math.trunc(input.copies)))')
  })

  it('defaults the receipt paper width to 80mm', () => {
    expect(defaultSettings.receipt_paper_width).toBe('80mm')
  })

  it('reports the paper width in test-print content and prints no transaction', () => {
    const lines = testPrintLines({ ...defaultSettings, store_name: 'QA Store', receipt_paper_width: '58mm' }, 'QA Printer', new Date('2026-09-05T00:00:00Z'))
    expect(lines).toContain('Paper: 58mm')
    expect(lines).toContain('Printer configuration successful')
    expect(lines).toContain('Thank you!')
  })

  it('clamps copies to the allowed 1-3 range and reports real Electron callback failures', async () => {
    const webContents = {
      getPrintersAsync: vi.fn().mockResolvedValue([{ name: 'Receipt Printer' }]),
      print: vi.fn((_options, callback) => callback(false, 'Printer is offline or out of paper'))
    } as unknown as WebContents
    const failed = await submitPrint(webContents, { ...defaultSettings, receipt_printer: 'Receipt Printer', receipt_copies: 9 })
    expect(failed).toMatchObject({ ok: false, code: 'FAILED' })
    expect(failed.message).toContain('Printer is offline or out of paper')
    expect(webContents.print).toHaveBeenCalledWith(expect.objectContaining({ copies: 3, silent: true, printBackground: false, deviceName: 'Receipt Printer' }), expect.any(Function))
  })

  it('sends exactly one silent auto-print job per sale when enabled', async () => {
    const printer = vi.fn().mockResolvedValue({ ok: true, code: 'PRINTED', message: 'ok' })
    const result = await autoPrintAfterCheckout({ ...defaultSettings, auto_print_after_sale: true }, sale, printer)
    expect(result.code).toBe('PRINTED')
    expect(printer).toHaveBeenCalledTimes(1)
  })
})
