import { useMemo } from 'react'
import type { ReceiptWidth, ReceiptLayoutOptions } from '@shared/receiptHtml'
import { receiptBodyHtml, receiptCss } from '@shared/receiptHtml'
import { useSettings } from '../stores/settings'
import { reconcilePrinterCustomization } from '../utils/printerCustomization'

interface ReceiptPaperProps {
  lines: string[]
  width?: ReceiptWidth
  customOptions?: Partial<ReceiptLayoutOptions>
}

/**
 * On-screen approximation of the printed thermal receipt. It renders the exact
 * same HTML/CSS used by the silent print path (see shared/receiptHtml.ts), so
 * what you see here is what the printer receives. User text is escaped by the
 * builder before reaching this innerHTML.
 */
export function ReceiptPaper({ lines, width, customOptions }: ReceiptPaperProps): React.JSX.Element {
  const { settings } = useSettings()
  const custom = useMemo(() => reconcilePrinterCustomization(settings), [settings])
  const paper: ReceiptWidth = width ?? custom.receipt_paper_width ?? '80mm'

  const effectiveOptions: ReceiptLayoutOptions = useMemo(() => ({
    offsetLeftMm: customOptions?.offsetLeftMm ?? custom.receipt_offset_left_mm,
    offsetRightMm: customOptions?.offsetRightMm ?? custom.receipt_offset_right_mm,
    feedLinesEnd: customOptions?.feedLinesEnd ?? custom.receipt_feed_lines_end,
    fontScale: customOptions?.fontScale ?? custom.receipt_font_scale,
    lineSpacing: customOptions?.lineSpacing ?? custom.receipt_line_spacing,
    ultraBlack: customOptions?.ultraBlack ?? custom.receipt_ultra_black
  }), [custom, customOptions])

  const css = useMemo(
    () => receiptCss(paper, effectiveOptions),
    [paper, effectiveOptions]
  )

  const body = useMemo(
    () =>
      receiptBodyHtml(lines, paper, settings?.currency, effectiveOptions),
    [lines, paper, settings?.currency, effectiveOptions]
  )

  return (
    <div className="overflow-x-auto rounded-lg border border-ink-line bg-white p-3">
      <style>{css}</style>
      {/* Receipt HTML is fully escaped in shared/receiptHtml.ts — no raw user HTML. */}
      <div dangerouslySetInnerHTML={{ __html: body }} />
    </div>
  )
}


