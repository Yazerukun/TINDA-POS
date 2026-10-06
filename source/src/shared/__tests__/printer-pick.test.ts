import { describe, expect, it } from 'vitest'
import {
  printerPick,
  printerStatusLabel,
  autoDetectThermalPrinter,
  inferPaperWidth,
  isThermalPrinterName
} from '../printer'
import type { PrinterChoiceLike } from '../printer'


const none: PrinterChoiceLike[] = []
const one = [{ name: 'Receipt Printer', displayName: 'Receipt Printer', isDefault: true }]
const multiple = [
  { name: 'Office LaserJet', displayName: 'Office LaserJet', isDefault: true },
  { name: 'Epson TM-T82IV', displayName: 'Epson TM-T82IV', isDefault: false },
  { name: 'Xprinter XP-Q801K', displayName: 'Xprinter XP-Q801K', isDefault: false }
]

describe('printerPick', () => {
  it('selects the exact saved printer when it still exists (READY)', () => {
    const pick = printerPick(multiple, 'Epson TM-T82IV')
    expect(pick).toEqual({ name: 'Epson TM-T82IV', status: 'READY' })
  })

  it('marks a disappeared saved printer UNAVAILABLE instead of falling back to the default', () => {
    const pick = printerPick(multiple, 'Old Thermal Printer')
    expect(pick).toEqual({ name: 'Old Thermal Printer', status: 'UNAVAILABLE' })
    // Never silently route to the default office printer.
    expect(pick.name).not.toBe('Office LaserJet')
  })

  it('suggests the system default printer when nothing is saved yet', () => {
    const pick = printerPick(multiple, '')
    expect(pick).toEqual({ name: 'Office LaserJet', status: 'NOT_CONFIGURED' })
  })

  it('suggests the only printer when no default is marked', () => {
    const pick = printerPick([{ name: 'Thermal', displayName: 'Thermal', isDefault: false }], '')
    expect(pick.name).toBe('Thermal')
  })

  it('leaves the printer unset when no printers exist', () => {
    expect(printerPick(none, '')).toEqual({ name: '', status: 'NOT_CONFIGURED' })
  })

  it('treats saved selection case-sensitively like the exact Windows device name', () => {
    expect(printerPick([{ name: 'Epson TM-T82IV', displayName: '', isDefault: false }], 'epson tm-t82iv').status).toBe('UNAVAILABLE')
  })

  it('suggests the default when a one-printer system has no saved choice', () => {
    expect(printerPick(one, '')).toEqual({ name: 'Receipt Printer', status: 'NOT_CONFIGURED' })
  })

  it('provides honest status labels', () => {
    expect(printerStatusLabel('READY')).toBe('Ready')
    expect(printerStatusLabel('UNAVAILABLE')).toBe('Unavailable')
    expect(printerStatusLabel('NOT_CONFIGURED')).toBe('Not configured')
  })
})

describe('autoDetectThermalPrinter & paper width inference', () => {
  it('prioritizes connected thermal printer over office default printer', () => {
    const list = [
      { name: 'Office LaserJet M102', displayName: 'Office LaserJet', isDefault: true },
      { name: 'GOOJPRT PB-58H', displayName: 'GOOJPRT PB-58H', isDefault: false }
    ]
    const detected = autoDetectThermalPrinter(list, '')
    expect(detected).not.toBeNull()
    expect(detected?.name).toBe('GOOJPRT PB-58H')
    expect(detected?.paperWidth).toBe('58mm')
    expect(detected?.isAutoDetected).toBe(true)
  })

  it('infers 58mm for various 58mm models and 80mm for 80mm models', () => {
    expect(inferPaperWidth('GOOJPRT PB-58H')).toBe('58mm')
    expect(inferPaperWidth('POS-58')).toBe('58mm')
    expect(inferPaperWidth('JK-5802H')).toBe('58mm')
    expect(inferPaperWidth('XP-58')).toBe('58mm')
    expect(inferPaperWidth('Xprinter XP-Q801K')).toBe('80mm')
    expect(inferPaperWidth('POS-80 Series')).toBe('80mm')
    expect(inferPaperWidth('Epson TM-T82IV')).toBe('80mm')
  })

  it('recognizes various thermal printer naming patterns', () => {
    expect(isThermalPrinterName('GOOJPRT PB-58H')).toBe(true)
    expect(isThermalPrinterName('POS-58 Thermal')).toBe(true)
    expect(isThermalPrinterName('Xprinter Receipt')).toBe(true)
    expect(isThermalPrinterName('Epson TM-T20II')).toBe(true)
    expect(isThermalPrinterName('HP LaserJet Pro')).toBe(false)
    expect(isThermalPrinterName('Canon PIXMA')).toBe(false)
  })
})


