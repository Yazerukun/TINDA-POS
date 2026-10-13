// File: src/renderer/src/components/PrinterStudioModal.tsx
import React, { useState, useEffect } from 'react'
import {
  Printer,
  Tag,
  Sliders,
  CheckCircle2,
  RotateCcw,
  Save,
  X,
  FileText,
  Maximize2,
  Sparkles,
  Move,
  Layers,
  Info,
  Grid,
  ChevronRight,
  HelpCircle
} from 'lucide-react'
import { Modal } from './ui/Modal'
import { ReceiptPaper } from './ReceiptPaper'
import { useSettings } from '../stores/settings'
import { toastSuccess, toastError } from '../stores/toast'
import { generateBarcodeSvg } from '@shared/barcodeSvg'
import { receiptHtml } from '@shared/receiptHtml'
import {
  reconcilePrinterCustomization,
  saveStoredPrinterCustomization,
  type PrinterCustomizationSettings
} from '../utils/printerCustomization'

interface PrinterStudioModalProps {
  open: boolean
  onClose: () => void
  initialTab?: 'receipt' | 'label'
  onSaved?: () => void
}

export function PrinterStudioModal({
  open,
  onClose,
  initialTab = 'receipt',
  onSaved
}: PrinterStudioModalProps): React.JSX.Element | null {
  const { settings, update: updateSettings } = useSettings()

  const [activeTab, setActiveTab] = useState<'receipt' | 'label'>(initialTab)
  const [saving, setSaving] = useState(false)
  const [showGrid, setShowGrid] = useState(true)
  const [isTestPrinting, setIsTestPrinting] = useState(false)

  // -------------------------------------------------------------
  // RECEIPT STATE
  // -------------------------------------------------------------
  const [receiptWidth, setReceiptWidth] = useState<'58mm' | '80mm'>('58mm')
  const [receiptLeftMargin, setReceiptLeftMargin] = useState(3.5)
  const [receiptRightMargin, setReceiptRightMargin] = useState(2.0)
  const [receiptTopMargin, setReceiptTopMargin] = useState(2.0)
  const [receiptFeedLines, setReceiptFeedLines] = useState(3)
  const [receiptFontScale, setReceiptFontScale] = useState(100)
  const [receiptLineSpacing, setReceiptLineSpacing] = useState<'compact' | 'balanced' | 'spacious'>('balanced')
  const [receiptLineHeightMultiplier, setReceiptLineHeightMultiplier] = useState(1.15)
  const [receiptItemSpacing, setReceiptItemSpacing] = useState(1.0)
  const [receiptSeparatorSpacing, setReceiptSeparatorSpacing] = useState(2.0)
  const [receiptUltraBlack, setReceiptUltraBlack] = useState(true)
  const [receiptCustomHeader, setReceiptCustomHeader] = useState('')
  const [receiptCustomFooter, setReceiptCustomFooter] = useState('')
  const [receiptShowCashier, setReceiptShowCashier] = useState(true)
  const [receiptShowCustomer, setReceiptShowCustomer] = useState(true)
  const [receiptShowChange, setReceiptShowChange] = useState(true)
  const [receiptShowFooterQr, setReceiptShowFooterQr] = useState(false)

  // -------------------------------------------------------------
  // LABEL (CT221B) STATE
  // -------------------------------------------------------------
  const [labelPaperSize, setLabelPaperSize] = useState<string>('40x30')
  const [labelWidthMm, setLabelWidthMm] = useState(40)
  const [labelHeightMm, setLabelHeightMm] = useState(30)
  const [labelOffsetX, setLabelOffsetX] = useState(0.0)
  const [labelOffsetY, setLabelOffsetY] = useState(0.0)
  const [labelSafeMargin, setLabelSafeMargin] = useState(1.2)
  const [labelBarcodeHeight, setLabelBarcodeHeight] = useState(26)
  const [labelBarcodeBarWidth, setLabelBarcodeBarWidth] = useState(1.3)
  const [labelPriceSize, setLabelPriceSize] = useState<'medium' | 'large' | 'jumbo'>('large')
  const [labelShowStoreName, setLabelShowStoreName] = useState(true)
  const [labelShowBarcode, setLabelShowBarcode] = useState(true)
  const [labelShowSku, setLabelShowSku] = useState(true)
  const [labelShowWholesale, setLabelShowWholesale] = useState(false)

  // Sync state on open
  useEffect(() => {
    if (open) {
      setActiveTab(initialTab)
      const reconciled = reconcilePrinterCustomization(settings)
      setReceiptWidth(reconciled.receipt_paper_width || '58mm')
      setReceiptLeftMargin(reconciled.receipt_offset_left_mm)
      setReceiptRightMargin(reconciled.receipt_offset_right_mm)
      setReceiptTopMargin(reconciled.receipt_offset_top_mm)
      setReceiptFeedLines(reconciled.receipt_feed_lines_end)
      setReceiptFontScale(reconciled.receipt_font_scale)
      setReceiptLineSpacing(reconciled.receipt_line_spacing)
      setReceiptLineHeightMultiplier(reconciled.receipt_line_height_multiplier)
      setReceiptItemSpacing(reconciled.receipt_item_spacing_px)
      setReceiptSeparatorSpacing(reconciled.receipt_separator_spacing_px)
      setReceiptUltraBlack(reconciled.receipt_ultra_black)
      setReceiptCustomHeader(reconciled.receipt_custom_header || settings?.receipt_header || '')
      setReceiptCustomFooter(reconciled.receipt_custom_footer || settings?.receipt_footer || '')
      setReceiptShowCashier(reconciled.receipt_show_cashier)
      setReceiptShowCustomer(reconciled.receipt_show_customer)
      setReceiptShowChange(reconciled.receipt_show_change_breakdown)
      setReceiptShowFooterQr(reconciled.receipt_show_footer_qr)

      setLabelPaperSize(reconciled.label_paper_size || '40x30')
      setLabelWidthMm(reconciled.label_custom_width_mm)
      setLabelHeightMm(reconciled.label_custom_height_mm)
      setLabelOffsetX(reconciled.label_offset_x_mm)
      setLabelOffsetY(reconciled.label_offset_y_mm)
      setLabelSafeMargin(reconciled.label_safe_margin_mm)
      setLabelBarcodeHeight(reconciled.label_barcode_height_mm)
      setLabelBarcodeBarWidth(reconciled.label_barcode_bar_width)
      setLabelPriceSize(reconciled.label_price_font_size)
      setLabelShowStoreName(reconciled.label_show_store_name)
      setLabelShowBarcode(reconciled.label_show_barcode)
      setLabelShowSku(reconciled.label_show_sku)
      setLabelShowWholesale(reconciled.label_show_wholesale)
    }
  }, [open, initialTab, settings])

  // Preset Dimensions mapping
  const activeLabelDims = React.useMemo(() => {
    switch (labelPaperSize) {
      case '50x30': return { width: 50, height: 30 }
      case '30x20': return { width: 30, height: 20 }
      case '40x20': return { width: 40, height: 20 }
      case 'custom': return { width: Math.max(15, labelWidthMm), height: Math.max(10, labelHeightMm) }
      case '40x30':
      default: return { width: 40, height: 30 }
    }
  }, [labelPaperSize, labelWidthMm, labelHeightMm])

  // Sample barcode for label preview
  const sampleBarcodeSvg = React.useMemo(() => {
    return generateBarcodeSvg('TINDA-789012', {
      height: activeLabelDims.height <= 20 ? 18 : labelBarcodeHeight,
      includeText: true,
      barWidth: labelBarcodeBarWidth,
      fontSize: activeLabelDims.height <= 20 ? 7 : 8.5
    })
  }, [activeLabelDims.height, labelBarcodeHeight, labelBarcodeBarWidth])

  // Sample receipt lines
  const sampleReceiptLines = React.useMemo(() => {
    const lines = [
      settings?.store_name || 'TINDA POS STORE',
      receiptCustomHeader || 'SARI-SARI & GENERAL MERCHANDISE',
      '--------------------------------',
      'Date: 10/10/2026 08:45 AM',
      receiptShowCashier ? 'Cashier: Cashier 1' : '',
      receiptShowCustomer ? 'Customer: Suki Regular' : '',
      '--------------------------------',
      'Lucky Me Instant Pancit Canton',
      '  2 x 18.00        36.00',
      'Coca-Cola Swakto 200ml',
      '  3 x 15.00        45.00',
      'Silver Swan Soy Sauce 385ml',
      '  1 x 24.50        24.50',
      '================================',
      'Subtotal           105.50',
      'TOTAL              105.50',
      '================================'
    ].filter(Boolean)

    if (receiptShowChange) {
      lines.push('Cash               200.00')
      lines.push('SUKLI               94.50')
      lines.push('================================')
    }

    lines.push(receiptCustomFooter || settings?.receipt_footer || 'Salamat sa inyong pagpalit! Balik-balik!')
    lines.push('--------------------------------')
    lines.push('TINDA POS - 100% Offline Ready')

    return lines
  }, [
    settings?.store_name,
    settings?.receipt_footer,
    receiptCustomHeader,
    receiptCustomFooter,
    receiptShowCashier,
    receiptShowCustomer,
    receiptShowChange
  ])

  // Save changes
  const handleSave = async () => {
    setSaving(true)
    try {
      const payload: PrinterCustomizationSettings = {
        receipt_paper_width: receiptWidth,
        receipt_offset_left_mm: receiptLeftMargin,
        receipt_offset_right_mm: receiptRightMargin,
        receipt_offset_top_mm: receiptTopMargin,
        receipt_feed_lines_end: receiptFeedLines,
        receipt_font_scale: receiptFontScale,
        receipt_line_spacing: receiptLineSpacing,
        receipt_line_height_multiplier: receiptLineHeightMultiplier,
        receipt_item_spacing_px: receiptItemSpacing,
        receipt_separator_spacing_px: receiptSeparatorSpacing,
        receipt_ultra_black: receiptUltraBlack,
        receipt_custom_header: receiptCustomHeader,
        receipt_custom_footer: receiptCustomFooter,
        receipt_show_cashier: receiptShowCashier,
        receipt_show_customer: receiptShowCustomer,
        receipt_show_change_breakdown: receiptShowChange,
        receipt_show_footer_qr: receiptShowFooterQr,

        label_paper_size: labelPaperSize,
        label_custom_width_mm: labelWidthMm,
        label_custom_height_mm: labelHeightMm,
        label_offset_x_mm: labelOffsetX,
        label_offset_y_mm: labelOffsetY,
        label_safe_margin_mm: labelSafeMargin,
        label_barcode_height_mm: labelBarcodeHeight,
        label_barcode_bar_width: labelBarcodeBarWidth,
        label_price_font_size: labelPriceSize,
        label_show_store_name: labelShowStoreName,
        label_show_barcode: labelShowBarcode,
        label_show_sku: labelShowSku,
        label_show_wholesale: labelShowWholesale
      }

      // Synchronously write to localStorage and dispatch event first
      saveStoredPrinterCustomization(payload)

      // Persist to backend settings
      await updateSettings({
        ...payload,
        receipt_header: receiptCustomHeader,
        receipt_footer: receiptCustomFooter
      })

      toastSuccess('Printer Studio Saved', 'Alignment and customization settings have been applied.')
      onSaved?.()
      onClose()
    } catch (err) {
      toastError('Save Error', String(err))
    } finally {
      setSaving(false)
    }
  }

  // Reset to factory defaults
  const handleResetDefaults = () => {
    if (activeTab === 'receipt') {
      const defaultLeft = receiptWidth === '58mm' ? 3.5 : 4.5
      setReceiptLeftMargin(defaultLeft)
      setReceiptRightMargin(2.0)
      setReceiptTopMargin(2.0)
      setReceiptFeedLines(3)
      setReceiptFontScale(100)
      setReceiptLineSpacing('balanced')
      setReceiptLineHeightMultiplier(1.15)
      setReceiptItemSpacing(1.0)
      setReceiptSeparatorSpacing(2.0)
      setReceiptUltraBlack(true)
      setReceiptCustomHeader('')
      setReceiptCustomFooter('')
      setReceiptShowCashier(true)
      setReceiptShowCustomer(true)
      setReceiptShowChange(true)
      setReceiptShowFooterQr(false)
      saveStoredPrinterCustomization({
        receipt_paper_width: receiptWidth,
        receipt_offset_left_mm: defaultLeft,
        receipt_offset_right_mm: 2.0,
        receipt_offset_top_mm: 2.0,
        receipt_feed_lines_end: 3,
        receipt_font_scale: 100,
        receipt_line_spacing: 'balanced',
        receipt_line_height_multiplier: 1.15,
        receipt_item_spacing_px: 1.0,
        receipt_separator_spacing_px: 2.0,
        receipt_ultra_black: true,
        receipt_custom_header: '',
        receipt_custom_footer: '',
        receipt_show_cashier: true,
        receipt_show_customer: true,
        receipt_show_change_breakdown: true,
        receipt_show_footer_qr: false
      })
      toastSuccess('Defaults Restored', 'Receipt parameters reset to recommended thermal standards.')
    } else {
      setLabelOffsetX(0.0)
      setLabelOffsetY(0.0)
      setLabelSafeMargin(1.2)
      setLabelBarcodeHeight(26)
      setLabelBarcodeBarWidth(1.3)
      setLabelPriceSize('large')
      setLabelShowStoreName(true)
      setLabelShowBarcode(true)
      setLabelShowSku(true)
      setLabelShowWholesale(false)
      saveStoredPrinterCustomization({
        label_paper_size: labelPaperSize,
        label_offset_x_mm: 0.0,
        label_offset_y_mm: 0.0,
        label_safe_margin_mm: 1.2,
        label_barcode_height_mm: 26,
        label_barcode_bar_width: 1.3,
        label_price_font_size: 'large',
        label_show_store_name: true,
        label_show_barcode: true,
        label_show_sku: true,
        label_show_wholesale: false
      })
      toastSuccess('Defaults Restored', 'Label parameters reset to Chiteng CT221B defaults.')
    }
  }

  // Print alignment test pattern
  const handleTestPrint = async () => {
    setIsTestPrinting(true)
    try {
      if (activeTab === 'receipt') {
        const testLines = [
          settings?.store_name || 'TINDA POS',
          '=== ALIGNMENT TEST PATTERN ===',
          `Width: ${receiptWidth} | L:${receiptLeftMargin}mm R:${receiptRightMargin}mm`,
          `Top: ${receiptTopMargin}mm | Line:${receiptLineHeightMultiplier}x`,
          `Item Gap: ${receiptItemSpacing}px | Sep:${receiptSeparatorSpacing}px`,
          '--------------------------------',
          '01234567890123456789012345678901',
          '|<- Left Edge        Right Edge->|',
          '--------------------------------',
          'P123.45  P456.78  P789.00  ₱999',
          'CHECK: Is first letter "P" cut?',
          'If cut, increase Left Indent mm.',
          '--------------------------------',
          'Cutter feed buffer: OK',
          '=== END OF TEST RECEIPT ==='
        ]
        const res = await window.api.printer.printLines(testLines, { manual: false })
        if (res.ok) {
          toastSuccess('Test Sent', 'Receipt alignment test pattern printed.')
        } else {
          toastError('Printer Notice', res.message)
        }
      } else {
        // Label test print with scannable barcode and calibration rectangle
        const widthMm = `${activeLabelDims.width}mm`
        const heightMm = `${activeLabelDims.height}mm`
        const calibBarcodeSvg = generateBarcodeSvg('TINDA-TEST-128', {
          height: activeLabelDims.height <= 20 ? 22 : 30,
          barHeight: activeLabelDims.height <= 20 ? 14 : 20,
          includeText: true,
          barWidth: labelBarcodeBarWidth || 1.8,
          fontSize: 7
        })
        const testHtml = `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <style>
              @page { size: ${widthMm} ${heightMm}; margin: 0; }
              * { box-sizing: border-box; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
              body { margin: 0; padding: 0; background: #ffffff !important; color: #000000 !important; font-family: sans-serif; text-align: center; }
              .calib-box {
                width: ${widthMm};
                height: ${heightMm};
                padding: ${labelSafeMargin}mm;
                border: 1px solid #000000;
                display: flex;
                flex-direction: column;
                justify-content: space-between;
                align-items: center;
                position: relative;
                box-sizing: border-box;
                transform: translate(${labelOffsetX}mm, ${labelOffsetY}mm);
              }
              .hdr { font-size: 7px; font-weight: 900; border-bottom: 1px solid #000; width: 100%; padding-bottom: 0.2mm; }
              .dim { font-size: 6px; font-weight: bold; font-family: monospace; }
              .calib-barcode { width: 100%; max-width: 96%; margin: 0.3mm auto; }
              .calib-barcode svg { display: block; width: 100%; height: auto; shape-rendering: crispEdges !important; image-rendering: -webkit-optimize-contrast !important; image-rendering: pixelated !important; }
              .calib-barcode svg rect { shape-rendering: crispEdges !important; }
            </style>
          </head>
          <body>
            <div class="calib-box">
              <div class="hdr">CT221B CALIBRATION &amp; BARCODE TEST</div>
              <div class="dim">${activeLabelDims.width}×${activeLabelDims.height}mm | X:${labelOffsetX}mm Y:${labelOffsetY}mm</div>
              <div class="calib-barcode">${calibBarcodeSvg}</div>
              <div class="dim">SCAN WITH PHONE CAMERA · MARGIN: ${labelSafeMargin}mm</div>
            </div>
          </body>
          </html>
        `
        const res = await window.api.printer.printDocument(testHtml, {
          manual: false,
          title: 'CT221B Calibration Test',
          widthMm: activeLabelDims.width,
          heightMm: activeLabelDims.height
        })
        if (res.ok) {
          toastSuccess('Test Sent', 'CT221B calibration test sticker printed.')
        } else {
          toastError('Printer Notice', res.message)
        }
      }
    } catch (err) {
      toastError('Print Error', String(err))
    } finally {
      setIsTestPrinting(false)
    }
  }

  if (!open) return null

  return (
    <Modal
      open={open}
      onClose={onClose}
      maxWidth="max-w-5xl"
      title="TINDA Printer Alignment & Customization Studio"
    >
      <div className="space-y-4">
        {/* Subheader info */}
        <div className="flex items-center gap-2.5 pb-2 -mt-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500/20 to-sky-500/20 text-indigo-400 border border-indigo-500/30">
            <Sliders className="h-4 w-4" />
          </div>
          <div>
            <div className="text-xs font-semibold text-slate-300 flex items-center gap-2">
              Universal Thermal Calibrator &amp; Precision Alignment
              <span className="badge border border-indigo-500/40 bg-indigo-500/20 text-indigo-300 text-[10px] font-bold">
                Live 1:1 Preview
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Visually tune margins, X/Y coordinate shifts, fonts, and branding with 1:1 real-time preview.
            </p>
          </div>
        </div>
        {/* Mode Switcher Tabs */}
        <div className="flex items-center justify-between border-b border-ink-line pb-3">
          <div className="flex items-center gap-1.5 p-1 bg-ink-900 border border-ink-line rounded-xl">
            <button
              type="button"
              onClick={() => setActiveTab('receipt')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition active:scale-95 ${
                activeTab === 'receipt'
                  ? 'bg-brand-500 text-white shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-ink-800'
              }`}
            >
              <FileText className="h-4 w-4" />
              <span>Receipt Printer (58mm / 80mm)</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('label')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition active:scale-95 ${
                activeTab === 'label'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-ink-800'
              }`}
            >
              <Tag className="h-4 w-4" />
              <span>Barcode &amp; Label Printer (CT221B)</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleResetDefaults}
              className="btn-ghost flex items-center gap-1.5 text-xs text-slate-400 hover:text-white"
              title="Reset current tab settings to recommended factory defaults"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>Reset Defaults</span>
            </button>
          </div>
        </div>

        {/* 2-Column Studio: Left Controls (7 cols) + Right Live Preview (5 cols) */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
          {/* ============================================================== */}
          {/* LEFT COLUMN: TUNING CONTROLS */}
          {/* ============================================================== */}
          <div className="md:col-span-7 space-y-4 max-h-[62vh] overflow-y-auto pr-1">
            {activeTab === 'receipt' ? (
              <>
                {/* 1. Paper Width & Left/Right Margins */}
                <div className="card p-3.5 space-y-3 bg-ink-900/60 border-ink-line">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white flex items-center gap-1.5">
                      <Move className="h-3.5 w-3.5 text-brand-400" />
                      Physical Margins &amp; Alignment Offsets
                    </span>
                    <div className="flex items-center gap-1">
                      {(['58mm', '80mm'] as const).map((w) => (
                        <button
                          key={w}
                          type="button"
                          onClick={() => {
                            setReceiptWidth(w)
                            setReceiptLeftMargin(w === '58mm' ? 3.5 : 4.5)
                          }}
                          className={`px-2.5 py-1 text-xs rounded-md border font-bold transition ${
                            receiptWidth === w
                              ? 'border-brand-500 bg-brand-500/20 text-white'
                              : 'border-ink-line bg-ink-850 text-slate-400'
                          }`}
                        >
                          {w}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Left Indent Stepper (Fixes letter clipping) */}
                  <div className="bg-ink-850 p-2.5 rounded-lg border border-ink-line space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <div>
                        <span className="font-semibold text-slate-200">Left Margin Indent (X-Offset)</span>
                        <p className="text-[10px] text-slate-400">
                          Increase this if your printer clips the first letter (e.g. &apos;P&apos; in &apos;₱&apos;).
                        </p>
                      </div>
                      <span className="font-mono text-sm font-bold text-brand-400">
                        {receiptLeftMargin.toFixed(1)} mm
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setReceiptLeftMargin((v) => Math.max(0, +(v - 0.5).toFixed(1)))}
                        className="btn-ghost px-2.5 py-1 text-xs font-bold"
                      >
                        - 0.5
                      </button>
                      <input
                        type="range"
                        min="0"
                        max="12"
                        step="0.5"
                        value={receiptLeftMargin}
                        onChange={(e) => setReceiptLeftMargin(parseFloat(e.target.value))}
                        className="flex-1 accent-brand-500 cursor-pointer"
                      />
                      <button
                        type="button"
                        onClick={() => setReceiptLeftMargin((v) => Math.min(12, +(v + 0.5).toFixed(1)))}
                        className="btn-ghost px-2.5 py-1 text-xs font-bold"
                      >
                        + 0.5
                      </button>
                    </div>
                  </div>

                  {/* Right Margin Padding */}
                  <div className="bg-ink-850 p-2.5 rounded-lg border border-ink-line space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <div>
                        <span className="font-semibold text-slate-200">Right Margin Padding</span>
                        <p className="text-[10px] text-slate-400">
                          Padding on the right edge so prices don&apos;t get cut off.
                        </p>
                      </div>
                      <span className="font-mono text-sm font-bold text-sky-400">
                        {receiptRightMargin.toFixed(1)} mm
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setReceiptRightMargin((v) => Math.max(0, +(v - 0.5).toFixed(1)))}
                        className="btn-ghost px-2.5 py-1 text-xs font-bold"
                      >
                        - 0.5
                      </button>
                      <input
                        type="range"
                        min="0"
                        max="8"
                        step="0.5"
                        value={receiptRightMargin}
                        onChange={(e) => setReceiptRightMargin(parseFloat(e.target.value))}
                        className="flex-1 accent-sky-500 cursor-pointer"
                      />
                      <button
                        type="button"
                        onClick={() => setReceiptRightMargin((v) => Math.min(8, +(v + 0.5).toFixed(1)))}
                        className="btn-ghost px-2.5 py-1 text-xs font-bold"
                      >
                        + 0.5
                      </button>
                    </div>
                  </div>

                  {/* Cutter Bottom Feed Buffer */}
                  <div className="bg-ink-850 p-2.5 rounded-lg border border-ink-line space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <div>
                        <span className="font-semibold text-slate-200">Cutter Feed Spacing Lines</span>
                        <p className="text-[10px] text-slate-400">
                          Blank lines added before the paper cut, so it doesn&apos;t slice through the totals.
                        </p>
                      </div>
                      <span className="font-mono text-sm font-bold text-emerald-400">
                        {receiptFeedLines} lines
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setReceiptFeedLines((v) => Math.max(0, v - 1))}
                        className="btn-ghost px-2.5 py-1 text-xs font-bold"
                      >
                        - 1
                      </button>
                      <input
                        type="range"
                        min="0"
                        max="8"
                        step="1"
                        value={receiptFeedLines}
                        onChange={(e) => setReceiptFeedLines(parseInt(e.target.value))}
                        className="flex-1 accent-emerald-500 cursor-pointer"
                      />
                      <button
                        type="button"
                        onClick={() => setReceiptFeedLines((v) => Math.min(8, v + 1))}
                        className="btn-ghost px-2.5 py-1 text-xs font-bold"
                      >
                        + 1
                      </button>
                    </div>
                  </div>
                </div>

                {/* 2. Custom Thermal Spacing Studio (Vertical Margins & Density) */}
                <div className="card p-3.5 space-y-3 bg-ink-900/60 border-ink-line">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white flex items-center gap-1.5">
                      <Sliders className="h-3.5 w-3.5 text-amber-400" />
                      Custom Spacing Studio (Vertical Margins &amp; Density)
                    </span>
                    <span className="text-[10px] text-amber-400/90 font-mono">
                      Physical Paper Calibration
                    </span>
                  </div>

                  {/* Top Margin / Header Offset Stepper */}
                  <div className="bg-ink-850 p-2.5 rounded-lg border border-ink-line space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <div>
                        <span className="font-semibold text-slate-200">Top Header Margin (Y-Offset)</span>
                        <p className="text-[10px] text-slate-400">
                          Adds top padding to prevent the physical cutter/tear-bar from clipping the header.
                        </p>
                      </div>
                      <span className="font-mono text-sm font-bold text-amber-400">
                        {receiptTopMargin.toFixed(1)} mm
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setReceiptTopMargin((v) => Math.max(0, +(v - 0.5).toFixed(1)))}
                        className="btn-ghost px-2.5 py-1 text-xs font-bold"
                      >
                        - 0.5
                      </button>
                      <input
                        type="range"
                        min="0"
                        max="15"
                        step="0.5"
                        value={receiptTopMargin}
                        onChange={(e) => setReceiptTopMargin(parseFloat(e.target.value))}
                        className="flex-1 accent-amber-500 cursor-pointer"
                      />
                      <button
                        type="button"
                        onClick={() => setReceiptTopMargin((v) => Math.min(15, +(v + 0.5).toFixed(1)))}
                        className="btn-ghost px-2.5 py-1 text-xs font-bold"
                      >
                        + 0.5
                      </button>
                    </div>

                    <div className="flex items-center gap-1 pt-0.5">
                      {[
                        { label: '0mm (Flush)', val: 0.0 },
                        { label: '2mm (Standard)', val: 2.0 },
                        { label: '5mm (Safe)', val: 5.0 },
                        { label: '8mm (Deep)', val: 8.0 }
                      ].map((p) => (
                        <button
                          key={p.val}
                          type="button"
                          onClick={() => setReceiptTopMargin(p.val)}
                          className={`px-2 py-0.5 text-[10px] rounded border font-semibold transition ${
                            receiptTopMargin === p.val
                              ? 'border-amber-500 bg-amber-500/20 text-amber-300'
                              : 'border-ink-line bg-ink-900 text-slate-400 hover:text-white'
                          }`}
                        >
                          {p.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Item-to-Item Row Gap */}
                  <div className="bg-ink-850 p-2.5 rounded-lg border border-ink-line space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <div>
                        <span className="font-semibold text-slate-200">Cart Item Row Gap</span>
                        <p className="text-[10px] text-slate-400">
                          Vertical space between each product row (tighten to save paper, loosen for clarity).
                        </p>
                      </div>
                      <span className="font-mono text-sm font-bold text-teal-400">
                        {receiptItemSpacing.toFixed(1)} px
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setReceiptItemSpacing((v) => Math.max(0, +(v - 0.5).toFixed(1)))}
                        className="btn-ghost px-2.5 py-1 text-xs font-bold"
                      >
                        - 0.5
                      </button>
                      <input
                        type="range"
                        min="0"
                        max="8"
                        step="0.5"
                        value={receiptItemSpacing}
                        onChange={(e) => setReceiptItemSpacing(parseFloat(e.target.value))}
                        className="flex-1 accent-teal-500 cursor-pointer"
                      />
                      <button
                        type="button"
                        onClick={() => setReceiptItemSpacing((v) => Math.min(8, +(v + 0.5).toFixed(1)))}
                        className="btn-ghost px-2.5 py-1 text-xs font-bold"
                      >
                        + 0.5
                      </button>
                    </div>

                    <div className="flex items-center gap-1 pt-0.5">
                      {[
                        { label: '0px (Dense)', val: 0.0 },
                        { label: '1px (Normal)', val: 1.0 },
                        { label: '2.5px (Relaxed)', val: 2.5 },
                        { label: '4px (Spacious)', val: 4.0 }
                      ].map((p) => (
                        <button
                          key={p.val}
                          type="button"
                          onClick={() => setReceiptItemSpacing(p.val)}
                          className={`px-2 py-0.5 text-[10px] rounded border font-semibold transition ${
                            receiptItemSpacing === p.val
                              ? 'border-teal-500 bg-teal-500/20 text-teal-300'
                              : 'border-ink-line bg-ink-900 text-slate-400 hover:text-white'
                          }`}
                        >
                          {p.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Divider / Separator Margin */}
                  <div className="bg-ink-850 p-2.5 rounded-lg border border-ink-line space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <div>
                        <span className="font-semibold text-slate-200">Divider &amp; Line Gap</span>
                        <p className="text-[10px] text-slate-400">
                          Margin above and below dashed and double separator dividers.
                        </p>
                      </div>
                      <span className="font-mono text-sm font-bold text-indigo-400">
                        {receiptSeparatorSpacing.toFixed(1)} px
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setReceiptSeparatorSpacing((v) => Math.max(0, +(v - 0.5).toFixed(1)))}
                        className="btn-ghost px-2.5 py-1 text-xs font-bold"
                      >
                        - 0.5
                      </button>
                      <input
                        type="range"
                        min="0"
                        max="8"
                        step="0.5"
                        value={receiptSeparatorSpacing}
                        onChange={(e) => setReceiptSeparatorSpacing(parseFloat(e.target.value))}
                        className="flex-1 accent-indigo-500 cursor-pointer"
                      />
                      <button
                        type="button"
                        onClick={() => setReceiptSeparatorSpacing((v) => Math.min(8, +(v + 0.5).toFixed(1)))}
                        className="btn-ghost px-2.5 py-1 text-xs font-bold"
                      >
                        + 0.5
                      </button>
                    </div>

                    <div className="flex items-center gap-1 pt-0.5">
                      {[
                        { label: '1px (Compact)', val: 1.0 },
                        { label: '2px (Balanced)', val: 2.0 },
                        { label: '3.5px (Airy)', val: 3.5 }
                      ].map((p) => (
                        <button
                          key={p.val}
                          type="button"
                          onClick={() => setReceiptSeparatorSpacing(p.val)}
                          className={`px-2 py-0.5 text-[10px] rounded border font-semibold transition ${
                            receiptSeparatorSpacing === p.val
                              ? 'border-indigo-500 bg-indigo-500/20 text-indigo-300'
                              : 'border-ink-line bg-ink-900 text-slate-400 hover:text-white'
                          }`}
                        >
                          {p.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Granular Line Height Multiplier */}
                  <div className="bg-ink-850 p-2.5 rounded-lg border border-ink-line space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <div>
                        <span className="font-semibold text-slate-200">Global Line Height Multiplier</span>
                        <p className="text-[10px] text-slate-400">
                          Continuous vertical height stretching for high legibility thermal printing.
                        </p>
                      </div>
                      <span className="font-mono text-sm font-bold text-fuchsia-400">
                        {receiptLineHeightMultiplier.toFixed(2)}x
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setReceiptLineHeightMultiplier((v) => Math.max(1.0, +(v - 0.05).toFixed(2)))}
                        className="btn-ghost px-2.5 py-1 text-xs font-bold"
                      >
                        - 0.05
                      </button>
                      <input
                        type="range"
                        min="1.00"
                        max="2.00"
                        step="0.05"
                        value={receiptLineHeightMultiplier}
                        onChange={(e) => setReceiptLineHeightMultiplier(parseFloat(e.target.value))}
                        className="flex-1 accent-fuchsia-500 cursor-pointer"
                      />
                      <button
                        type="button"
                        onClick={() => setReceiptLineHeightMultiplier((v) => Math.min(2.0, +(v + 0.05).toFixed(2)))}
                        className="btn-ghost px-2.5 py-1 text-xs font-bold"
                      >
                        + 0.05
                      </button>
                    </div>

                    <div className="flex items-center gap-1 pt-0.5">
                      {[
                        { label: '1.08x (Compact)', val: 1.08 },
                        { label: '1.15x (Standard)', val: 1.15 },
                        { label: '1.25x (Spacious)', val: 1.25 },
                        { label: '1.40x (Airy)', val: 1.40 }
                      ].map((p) => (
                        <button
                          key={p.val}
                          type="button"
                          onClick={() => {
                            setReceiptLineHeightMultiplier(p.val)
                            if (p.val === 1.08) setReceiptLineSpacing('compact')
                            else if (p.val === 1.15) setReceiptLineSpacing('balanced')
                            else if (p.val === 1.25) setReceiptLineSpacing('spacious')
                          }}
                          className={`px-2 py-0.5 text-[10px] rounded border font-semibold transition ${
                            receiptLineHeightMultiplier === p.val
                              ? 'border-fuchsia-500 bg-fuchsia-500/20 text-fuchsia-300'
                              : 'border-ink-line bg-ink-900 text-slate-400 hover:text-white'
                          }`}
                        >
                          {p.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* 3. Optical Typography & Density */}
                <div className="card p-3.5 space-y-3 bg-ink-900/60 border-ink-line">
                  <span className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Layers className="h-3.5 w-3.5 text-purple-400" />
                    Optical Sizing &amp; Thermal Burn Density
                  </span>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                        Font Sizing Scale
                      </label>
                      <div className="grid grid-cols-4 gap-1">
                        {[85, 100, 115, 125].map((s) => (
                          <button
                            key={s}
                            type="button"
                            onClick={() => setReceiptFontScale(s)}
                            className={`py-1 text-xs rounded-md border font-bold transition ${
                              receiptFontScale === s
                                ? 'border-purple-500 bg-purple-500/20 text-purple-300'
                                : 'border-ink-line bg-ink-850 text-slate-400'
                            }`}
                          >
                            {s}%
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                        Line Spacing
                      </label>
                      <div className="grid grid-cols-3 gap-1">
                        {(['compact', 'balanced', 'spacious'] as const).map((sp) => (
                          <button
                            key={sp}
                            type="button"
                            onClick={() => setReceiptLineSpacing(sp)}
                            className={`py-1 text-[11px] capitalize rounded-md border font-semibold transition ${
                              receiptLineSpacing === sp
                                ? 'border-purple-500 bg-purple-500/20 text-purple-300'
                                : 'border-ink-line bg-ink-850 text-slate-400'
                            }`}
                          >
                            {sp}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <label className="flex items-center gap-2.5 text-xs text-slate-200 p-2 rounded-lg bg-ink-850 border border-ink-line cursor-pointer">
                    <input
                      type="checkbox"
                      checked={receiptUltraBlack}
                      onChange={(e) => setReceiptUltraBlack(e.target.checked)}
                      className="rounded text-brand-500 border-ink-line"
                    />
                    <div>
                      <span className="font-bold text-white">Ultra-Dense Solid Black Mode</span>
                      <p className="text-[10px] text-slate-400">
                        Applies optical stroke boosting for crisp black lettering on faint or aged thermal heads.
                      </p>
                    </div>
                  </label>
                </div>

                {/* 3. Custom Branding & Footer */}
                <div className="card p-3.5 space-y-3 bg-ink-900/60 border-ink-line">
                  <span className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Sparkles className="h-3.5 w-3.5 text-amber-400" />
                    Custom Slogan &amp; Receipt Messages
                  </span>

                  <div>
                    <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                      Header Slogan / Subtitle
                    </label>
                    <input
                      type="text"
                      value={receiptCustomHeader}
                      onChange={(e) => setReceiptCustomHeader(e.target.value)}
                      placeholder="e.g. SARI-SARI & GENERAL MERCHANDISE"
                      className="input w-full text-xs"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                      Footer Message / Return Policy / WiFi
                    </label>
                    <textarea
                      value={receiptCustomFooter}
                      onChange={(e) => setReceiptCustomFooter(e.target.value)}
                      placeholder="e.g. Salamat sa pagpalit! Balik-balik! | WiFi: tinda123"
                      rows={2}
                      className="input w-full text-xs"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-1 border-t border-ink-line">
                    <label className="flex items-center gap-2 text-[11px] text-slate-300 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={receiptShowCashier}
                        onChange={(e) => setReceiptShowCashier(e.target.checked)}
                        className="rounded text-brand-500 border-ink-line"
                      />
                      <span>Show Cashier Name</span>
                    </label>
                    <label className="flex items-center gap-2 text-[11px] text-slate-300 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={receiptShowCustomer}
                        onChange={(e) => setReceiptShowCustomer(e.target.checked)}
                        className="rounded text-brand-500 border-ink-line"
                      />
                      <span>Show Customer Name</span>
                    </label>
                    <label className="flex items-center gap-2 text-[11px] text-slate-300 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={receiptShowChange}
                        onChange={(e) => setReceiptShowChange(e.target.checked)}
                        className="rounded text-brand-500 border-ink-line"
                      />
                      <span>Show Change / Sukli</span>
                    </label>
                  </div>
                </div>
              </>
            ) : (
              <>
                {/* -------------------------------------------------------- */}
                {/* LABEL (CT221B) CONTROLS */}
                {/* -------------------------------------------------------- */}
                {/* 1. Paper Size & Presets */}
                <div className="card p-3.5 space-y-3 bg-ink-900/60 border-ink-line">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white flex items-center gap-1.5">
                      <Tag className="h-3.5 w-3.5 text-indigo-400" />
                      Thermal Sticker Dimensions
                    </span>
                    <span className="text-[11px] text-indigo-300 font-mono">
                      {activeLabelDims.width} × {activeLabelDims.height} mm
                    </span>
                  </div>

                  <div className="grid grid-cols-5 gap-1.5">
                    {[
                      { id: '40x30', label: '40×30', desc: 'Standard' },
                      { id: '50x30', label: '50×30', desc: 'Wide Shelf' },
                      { id: '30x20', label: '30×20', desc: 'Micro' },
                      { id: '40x20', label: '40×20', desc: 'Slim' },
                      { id: 'custom', label: 'Custom', desc: 'Custom mm' }
                    ].map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => setLabelPaperSize(p.id)}
                        className={`p-1.5 rounded-lg border text-center transition ${
                          labelPaperSize === p.id
                            ? 'border-indigo-500 bg-indigo-500/20 text-white font-bold'
                            : 'border-ink-line bg-ink-850 text-slate-400 hover:text-white'
                        }`}
                      >
                        <div className="text-xs">{p.label}</div>
                        <div className="text-[9px] opacity-75">{p.desc}</div>
                      </button>
                    ))}
                  </div>

                  {labelPaperSize === 'custom' && (
                    <div className="grid grid-cols-2 gap-3 pt-2 border-t border-ink-line">
                      <div>
                        <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                          Width (mm)
                        </label>
                        <input
                          type="number"
                          min="15"
                          max="80"
                          value={labelWidthMm}
                          onChange={(e) => setLabelWidthMm(parseInt(e.target.value) || 40)}
                          className="input w-full text-xs text-center font-mono font-bold"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                          Height (mm)
                        </label>
                        <input
                          type="number"
                          min="10"
                          max="80"
                          value={labelHeightMm}
                          onChange={(e) => setLabelHeightMm(parseInt(e.target.value) || 30)}
                          className="input w-full text-xs text-center font-mono font-bold"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* 2. Precision X & Y Coordinate Shift (Direct Offset Steppers) */}
                <div className="card p-3.5 space-y-3 bg-ink-900/60 border-ink-line">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white flex items-center gap-1.5">
                      <Move className="h-3.5 w-3.5 text-brand-400" />
                      Physical Print Head 2D Offsets (X &amp; Y Shift)
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setLabelOffsetX(0.0)
                        setLabelOffsetY(0.0)
                      }}
                      className="text-[10px] text-slate-400 hover:text-brand-400 transition"
                    >
                      Zero Offsets (0,0)
                    </button>
                  </div>

                  {/* Horizontal Offset (X-Shift) */}
                  <div className="bg-ink-850 p-2.5 rounded-lg border border-ink-line space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <div>
                        <span className="font-semibold text-slate-200">Horizontal Shift (X-Offset)</span>
                        <p className="text-[10px] text-slate-400">
                          Negative shifts left, positive shifts right.
                        </p>
                      </div>
                      <span className={`font-mono text-sm font-bold ${
                        labelOffsetX === 0 ? 'text-slate-400' : labelOffsetX > 0 ? 'text-emerald-400' : 'text-amber-400'
                      }`}>
                        {labelOffsetX > 0 ? `+${labelOffsetX.toFixed(1)}` : labelOffsetX.toFixed(1)} mm
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setLabelOffsetX((v) => Math.max(-10, +(v - 0.5).toFixed(1)))}
                        className="btn-ghost px-2.5 py-1 text-xs font-bold"
                      >
                        - 0.5
                      </button>
                      <input
                        type="range"
                        min="-10"
                        max="10"
                        step="0.5"
                        value={labelOffsetX}
                        onChange={(e) => setLabelOffsetX(parseFloat(e.target.value))}
                        className="flex-1 accent-indigo-500 cursor-pointer"
                      />
                      <button
                        type="button"
                        onClick={() => setLabelOffsetX((v) => Math.min(10, +(v + 0.5).toFixed(1)))}
                        className="btn-ghost px-2.5 py-1 text-xs font-bold"
                      >
                        + 0.5
                      </button>
                    </div>
                  </div>

                  {/* Vertical Offset (Y-Shift) */}
                  <div className="bg-ink-850 p-2.5 rounded-lg border border-ink-line space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <div>
                        <span className="font-semibold text-slate-200">Vertical Shift (Y-Offset)</span>
                        <p className="text-[10px] text-slate-400">
                          Negative shifts up, positive shifts down.
                        </p>
                      </div>
                      <span className={`font-mono text-sm font-bold ${
                        labelOffsetY === 0 ? 'text-slate-400' : labelOffsetY > 0 ? 'text-emerald-400' : 'text-amber-400'
                      }`}>
                        {labelOffsetY > 0 ? `+${labelOffsetY.toFixed(1)}` : labelOffsetY.toFixed(1)} mm
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setLabelOffsetY((v) => Math.max(-10, +(v - 0.5).toFixed(1)))}
                        className="btn-ghost px-2.5 py-1 text-xs font-bold"
                      >
                        - 0.5
                      </button>
                      <input
                        type="range"
                        min="-10"
                        max="10"
                        step="0.5"
                        value={labelOffsetY}
                        onChange={(e) => setLabelOffsetY(parseFloat(e.target.value))}
                        className="flex-1 accent-indigo-500 cursor-pointer"
                      />
                      <button
                        type="button"
                        onClick={() => setLabelOffsetY((v) => Math.min(10, +(v + 0.5).toFixed(1)))}
                        className="btn-ghost px-2.5 py-1 text-xs font-bold"
                      >
                        + 0.5
                      </button>
                    </div>
                  </div>

                  {/* Safe Margin Inset */}
                  <div className="bg-ink-850 p-2.5 rounded-lg border border-ink-line space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <div>
                        <span className="font-semibold text-slate-200">Inner Die-Cut Margin Padding</span>
                        <p className="text-[10px] text-slate-400">
                          Safe inset from the sticker roll gap borders.
                        </p>
                      </div>
                      <span className="font-mono text-sm font-bold text-sky-400">
                        {labelSafeMargin.toFixed(1)} mm
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setLabelSafeMargin((v) => Math.max(0.5, +(v - 0.2).toFixed(1)))}
                        className="btn-ghost px-2.5 py-1 text-xs font-bold"
                      >
                        - 0.2
                      </button>
                      <input
                        type="range"
                        min="0.5"
                        max="5.0"
                        step="0.2"
                        value={labelSafeMargin}
                        onChange={(e) => setLabelSafeMargin(parseFloat(e.target.value))}
                        className="flex-1 accent-sky-500 cursor-pointer"
                      />
                      <button
                        type="button"
                        onClick={() => setLabelSafeMargin((v) => Math.min(5.0, +(v + 0.2).toFixed(1)))}
                        className="btn-ghost px-2.5 py-1 text-xs font-bold"
                      >
                        + 0.2
                      </button>
                    </div>
                  </div>
                </div>

                {/* 3. Barcode & Typography Sizing */}
                <div className="card p-3.5 space-y-3 bg-ink-900/60 border-ink-line">
                  <span className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Layers className="h-3.5 w-3.5 text-purple-400" />
                    Barcode &amp; Price Visual Layout
                  </span>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                        Price Font Size
                      </label>
                      <div className="grid grid-cols-3 gap-1">
                        {(['medium', 'large', 'jumbo'] as const).map((s) => (
                          <button
                            key={s}
                            type="button"
                            onClick={() => setLabelPriceSize(s)}
                            className={`py-1 text-xs capitalize rounded-md border font-bold transition ${
                              labelPriceSize === s
                                ? 'border-purple-500 bg-purple-500/20 text-purple-300'
                                : 'border-ink-line bg-ink-850 text-slate-400'
                            }`}
                          >
                            {s}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                        Barcode Height
                      </label>
                      <div className="grid grid-cols-3 gap-1">
                        {[20, 26, 32].map((h) => (
                          <button
                            key={h}
                            type="button"
                            onClick={() => setLabelBarcodeHeight(h)}
                            className={`py-1 text-xs rounded-md border font-bold transition ${
                              labelBarcodeHeight === h
                                ? 'border-purple-500 bg-purple-500/20 text-purple-300'
                                : 'border-ink-line bg-ink-850 text-slate-400'
                            }`}
                          >
                            {h}mm
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-1 border-t border-ink-line">
                    <label className="flex items-center gap-2 text-[11px] text-slate-300 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={labelShowStoreName}
                        onChange={(e) => setLabelShowStoreName(e.target.checked)}
                        className="rounded text-brand-500 border-ink-line"
                      />
                      <span>Store Name Header</span>
                    </label>
                    <label className="flex items-center gap-2 text-[11px] text-slate-300 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={labelShowBarcode}
                        onChange={(e) => setLabelShowBarcode(e.target.checked)}
                        className="rounded text-brand-500 border-ink-line"
                      />
                      <span>Scannable 1D Barcode</span>
                    </label>
                    <label className="flex items-center gap-2 text-[11px] text-slate-300 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={labelShowSku}
                        onChange={(e) => setLabelShowSku(e.target.checked)}
                        className="rounded text-brand-500 border-ink-line"
                      />
                      <span>Product SKU</span>
                    </label>
                    <label className="flex items-center gap-2 text-[11px] text-slate-300 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={labelShowWholesale}
                        onChange={(e) => setLabelShowWholesale(e.target.checked)}
                        className="rounded text-brand-500 border-ink-line"
                      />
                      <span>Wholesale Pill</span>
                    </label>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* ============================================================== */}
          {/* RIGHT COLUMN: 1:1 INTERACTIVE WYSIWYG PREVIEW */}
          {/* ============================================================== */}
          <div className="md:col-span-5 flex flex-col items-center justify-between p-4 bg-ink-950/80 rounded-2xl border border-ink-line relative min-h-[420px]">
            <div className="w-full flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="h-3 w-3 text-amber-400" />
                Live 1:1 Simulation
              </span>

              {activeTab === 'label' && (
                <button
                  type="button"
                  onClick={() => setShowGrid((v) => !v)}
                  className={`px-2 py-0.5 rounded text-[10px] font-semibold border flex items-center gap-1 transition ${
                    showGrid
                      ? 'border-indigo-500/40 bg-indigo-500/15 text-indigo-300'
                      : 'border-ink-line text-slate-500 hover:text-slate-300'
                  }`}
                >
                  <Grid className="h-3 w-3" />
                  Grid
                </button>
              )}
            </div>

            {/* PREVIEW CONTAINER */}
            <div className="flex-1 flex items-center justify-center w-full py-2 overflow-hidden">
              {activeTab === 'receipt' ? (
                /* ----------------- RECEIPT PREVIEW (Exact 1:1 Engine) ----------------- */
                <div className="w-full flex justify-center max-h-[56vh] overflow-y-auto px-2">
                  <ReceiptPaper
                    lines={sampleReceiptLines}
                    width={receiptWidth}
                    customOptions={{
                      offsetLeftMm: receiptLeftMargin,
                      offsetRightMm: receiptRightMargin,
                      offsetTopMm: receiptTopMargin,
                      feedLinesEnd: receiptFeedLines,
                      fontScale: receiptFontScale,
                      lineSpacing: receiptLineSpacing,
                      lineHeightMultiplier: receiptLineHeightMultiplier,
                      itemSpacingPx: receiptItemSpacing,
                      separatorSpacingPx: receiptSeparatorSpacing,
                      ultraBlack: receiptUltraBlack
                    }}
                  />
                </div>
              ) : (
                /* ----------------- LABEL (CT221B) PREVIEW ----------------- */
                <div
                  className="relative transition-all select-none"
                  style={{
                    width: `${Math.min(240, Math.max(140, activeLabelDims.width * 4.2))}px`,
                    height: `${Math.min(220, Math.max(110, activeLabelDims.height * 4.2))}px`
                  }}
                >
                  {/* Thermal Sticker Die-Cut Border with subtle rounded corners */}
                  <div className="w-full h-full bg-white rounded-lg shadow-2xl border-2 border-slate-300 overflow-hidden relative flex flex-col justify-between">
                    {/* Optional Millimeter Grid Overlay */}
                    {showGrid && (
                      <div
                        className="absolute inset-0 pointer-events-none opacity-15"
                        style={{
                          backgroundImage: 'linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px)',
                          backgroundSize: '10px 10px'
                        }}
                      />
                    )}

                    {/* Inner content box shifted by X and Y offsets */}
                    <div
                      className="w-full h-full flex flex-col justify-between text-center transition-transform"
                      style={{
                        padding: `${labelSafeMargin * 3}px`,
                        transform: `translate(${labelOffsetX * 3}px, ${labelOffsetY * 3}px)`
                      }}
                    >
                      {labelShowStoreName && (
                        <div className="text-[8px] font-black uppercase tracking-wider border-b border-black pb-0.5 truncate text-black">
                          {settings?.store_name || 'TINDA STORE'}
                        </div>
                      )}

                      <div className="my-0.5">
                        <div className="text-[10px] font-black text-black leading-tight truncate">
                          San Miguel Pale Pilsen 330ml
                        </div>
                        <div className={`font-black text-black leading-none mt-0.5 ${
                          labelPriceSize === 'jumbo' ? 'text-xl' : labelPriceSize === 'large' ? 'text-base' : 'text-sm'
                        }`}>
                          ₱65.00
                        </div>
                        {labelShowWholesale && (
                          <div className="text-[7px] font-bold bg-slate-200 text-black px-1 py-0.2 rounded inline-block mt-0.5">
                            WS: ₱60.00 (≥6)
                          </div>
                        )}
                      </div>

                      {/* Barcode SVG */}
                      {labelShowBarcode && (
                        <div
                          className="flex justify-center my-0.5"
                          dangerouslySetInnerHTML={{ __html: sampleBarcodeSvg }}
                        />
                      )}

                      {labelShowSku && (
                        <div className="text-[7px] font-mono font-bold text-slate-700 tracking-wider">
                          SKU: SMP-330ML
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Offset Status Pill */}
                  {(labelOffsetX !== 0 || labelOffsetY !== 0) && (
                    <div className="absolute -bottom-5 left-1/2 -translate-x-1/2 whitespace-nowrap px-2 py-0.5 rounded-full bg-indigo-500/20 border border-indigo-500/40 text-[9px] font-mono text-indigo-300">
                      Offset: X:{labelOffsetX > 0 ? `+${labelOffsetX}` : labelOffsetX}mm Y:{labelOffsetY > 0 ? `+${labelOffsetY}` : labelOffsetY}mm
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Test Print Accelerator */}
            <div className="w-full pt-3 border-t border-ink-line flex items-center justify-between">
              <span className="text-[10px] text-slate-400">
                {activeTab === 'receipt'
                  ? `Target: ${receiptWidth} Thermal Receipt`
                  : `Target: CT221B (${activeLabelDims.width}×${activeLabelDims.height}mm)`}
              </span>

              <button
                type="button"
                onClick={handleTestPrint}
                disabled={isTestPrinting}
                className="px-3 py-1.5 rounded-lg border border-sky-500/30 bg-sky-500/10 hover:bg-sky-500/20 text-sky-300 text-xs font-semibold flex items-center gap-1.5 transition active:scale-95 disabled:opacity-50"
              >
                <Printer className="h-3.5 w-3.5" />
                <span>{isTestPrinting ? 'Printing...' : 'Print Alignment Test'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-3 border-t border-ink-line">
          <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
            <span>Changes take effect instantly on silent print jobs and manual print dialogs.</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="btn-ghost text-xs"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="btn-primary flex items-center gap-1.5 text-xs font-bold py-2.5 px-5 shadow-lg active:scale-95 transition disabled:opacity-50"
            >
              <Save className="h-4 w-4" />
              <span>{saving ? 'Saving Studio…' : 'Save Configuration'}</span>
            </button>
          </div>
        </div>
      </div>
    </Modal>
  )
}
