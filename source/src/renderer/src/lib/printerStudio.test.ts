import { describe, it, expect } from 'vitest'
import { receiptCss, receiptBodyHtml } from '@shared/receiptHtml'

describe('Printer Alignment Studio & Layout Customizer', () => {
  it('applies custom left and right margin offsets to resolve edge clipping', () => {
    const customCss = receiptCss('58mm', {
      offsetLeftMm: 6.5,
      offsetRightMm: 4.0
    })

    expect(customCss).toContain('padding: 2mm 4mm 2mm 6.5mm')
    expect(customCss).toContain('padding: 2mm 4mm 2mm 6.5mm !important')
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
