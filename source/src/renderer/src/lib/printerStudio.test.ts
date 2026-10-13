// File: src/renderer/src/lib/printerStudio.test.ts
import { describe, it, expect } from 'vitest'
import { receiptCss, receiptBodyHtml } from '@shared/receiptHtml'
import {
  DEFAULT_PRINTER_CUSTOMIZATION,
  reconcilePrinterCustomization
} from '../utils/printerCustomization'

describe('Printer Alignment Studio & Layout Customizer', () => {
  it('applies custom left and right margin offsets to resolve edge clipping', () => {
    const customCss = receiptCss('58mm', {
      offsetLeftMm: 6.5,
      offsetRightMm: 4.0
    })

    expect(customCss).toContain('padding: 2mm 4mm 2mm 6.5mm')
    expect(customCss).toContain('padding: 2mm 4mm 2mm 6.5mm !important')
  })

  it('applies custom top margin offset to eliminate cutter clipping', () => {
    const customCss = receiptCss('58mm', {
      offsetLeftMm: 4.5,
      offsetRightMm: 3.5,
      offsetTopMm: 5.0
    })

    expect(customCss).toContain('padding: 5mm 3.5mm 2mm 4.5mm')
    expect(customCss).toContain('padding: 5mm 3.5mm 2mm 4.5mm !important')
  })

  it('applies granular line height multiplier across print sheet', () => {
    const multiplierCss = receiptCss('58mm', {
      lineHeightMultiplier: 1.35
    })

    expect(multiplierCss).toContain('line-height: 1.35')
    expect(multiplierCss).toContain('line-height: 1.35 !important')
  })

  it('applies custom cart item row spacing and divider margins', () => {
    const customSpacingCss = receiptCss('80mm', {
      itemSpacingPx: 3.5,
      separatorSpacingPx: 4.0
    })

    expect(customSpacingCss).toContain('padding: 3.5px 0')
    expect(customSpacingCss).toContain('padding: 3.5px 0 !important')
    expect(customSpacingCss).toContain('margin: 4px 0')
    expect(customSpacingCss).toContain('margin: 4px 0 !important')
  })

  it('reconciles custom spacing from StoreSettings and factory defaults', () => {
    const emptyReconciled = reconcilePrinterCustomization(null)
    expect(emptyReconciled.receipt_offset_top_mm).toBe(DEFAULT_PRINTER_CUSTOMIZATION.receipt_offset_top_mm)
    expect(emptyReconciled.receipt_line_height_multiplier).toBe(DEFAULT_PRINTER_CUSTOMIZATION.receipt_line_height_multiplier)
    expect(emptyReconciled.receipt_item_spacing_px).toBe(DEFAULT_PRINTER_CUSTOMIZATION.receipt_item_spacing_px)
    expect(emptyReconciled.receipt_separator_spacing_px).toBe(DEFAULT_PRINTER_CUSTOMIZATION.receipt_separator_spacing_px)

    const customReconciled = reconcilePrinterCustomization({
      receipt_offset_top_mm: 6.5,
      receipt_line_height_multiplier: 1.4,
      receipt_item_spacing_px: 2.5,
      receipt_separator_spacing_px: 3.5
    })
    expect(customReconciled.receipt_offset_top_mm).toBe(6.5)
    expect(customReconciled.receipt_line_height_multiplier).toBe(1.4)
    expect(customReconciled.receipt_item_spacing_px).toBe(2.5)
    expect(customReconciled.receipt_separator_spacing_px).toBe(3.5)
  })

  it('applies typography scaling factor without clipping layout', () => {
    const scaledCss = receiptCss('80mm', {
      fontScale: 120
    })

    // 12px * 1.2 = 14.4px
    expect(scaledCss).toContain('font-size: 14.4px')
    // 13px * 1.2 = 15.6px
    expect(scaledCss).toContain('font-size: 15.6px !important')
  })

  it('injects cutter feed spacer lines at the end of the receipt sheet', () => {
    const htmlWithBuffer = receiptBodyHtml(['STORE HEADER', 'TOTAL  100.00'], '58mm', 'PHP', {
      feedLinesEnd: 5
    })

    // 5 lines * 3.8mm = 19mm spacer
    expect(htmlWithBuffer).toContain('tp-feed-spacer')
    expect(htmlWithBuffer).toContain('height: 19mm')
  })

  it('applies compact and spacious line spacing modes', () => {
    const compactCss = receiptCss('58mm', { lineSpacing: 'compact' })
    const spaciousCss = receiptCss('58mm', { lineSpacing: 'spacious' })

    expect(compactCss).toContain('line-height: 1.08')
    expect(spaciousCss).toContain('line-height: 1.25')
  })

  it('supports ultraBlack print head burn mode for faint printers', () => {
    const ultraCss = receiptCss('58mm', { ultraBlack: true })
    const regularCss = receiptCss('58mm', { ultraBlack: false })

    expect(ultraCss).toContain('-webkit-text-stroke: 0.18px #000000 !important')
    expect(regularCss).toContain('-webkit-text-stroke: 0.05px #000000 !important')
  })
})
