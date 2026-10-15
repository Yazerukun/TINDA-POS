import { useState, useEffect } from 'react'
import {
  Printer,
  X,
  Tag,
  Check,
  Sparkles,
  Layers,
  Settings2,
  Barcode as BarcodeIcon,
  RefreshCw,
  Sliders,
  CheckCircle2,
  Info,
  Wrench,
  FileText
} from 'lucide-react'
import { Modal } from './ui/Modal'
import { money } from '@shared/format'
import { toastSuccess, toastError, toastInfo } from '../stores/toast'
import type { Product } from '@shared/types'
import { useSettings } from '../stores/settings'
import {
  autoDetectLabelPrinter,
  type AutoDetectedLabelPrinter,
  type PrinterChoiceLike
} from '@shared/printer'
import { generateBarcodeSvg } from '@shared/barcodeSvg'
import { PrinterStudioModal } from './PrinterStudioModal'
import {
  reconcilePrinterCustomization,
  saveStoredPrinterCustomization,
  PRINTER_CONFIG_CHANGED_EVENT,
  type PrinterCustomizationSettings
} from '../utils/printerCustomization'

interface PriceTagPrintModalProps {
  open: boolean
  onClose: () => void
  products: Product[]
  selectedProduct?: Product | null
}

export type TagSizePreset = '40x30' | '50x30' | '30x20' | '40x20' | 'custom'

const PRESET_DIMENSIONS: Record<TagSizePreset, { width: number; height: number; label: string; desc: string }> = {
  '40x30': { width: 40, height: 30, label: '40 × 30 mm', desc: 'CT221B Standard Retail' },
  '50x30': { width: 50, height: 30, label: '50 × 30 mm', desc: 'Wide Shelf & Wholesale' },
  '30x20': { width: 30, height: 20, label: '30 × 20 mm', desc: 'Mini Grocery Sticker' },
  '40x20': { width: 40, height: 20, label: '40 × 20 mm', desc: 'Slim Barcode Pouch Tag' },
  'custom': { width: 40, height: 30, label: 'Custom', desc: 'Custom Roll Dimensions' }
}

export function PriceTagPrintModal({
  open,
  onClose,
  products,
  selectedProduct
}: PriceTagPrintModalProps): React.JSX.Element | null {
  const { settings, update: updateSettings } = useSettings()

  const [tagSize, setTagSize] = useState<TagSizePreset>((settings?.label_paper_size as TagSizePreset) || '40x30')
  const [customWidthMm, setCustomWidthMm] = useState(String(settings?.label_custom_width_mm || 40))
  const [customHeightMm, setCustomHeightMm] = useState(String(settings?.label_custom_height_mm || 30))
  const [printCopies, setPrintCopies] = useState('1')
  const [showBarcode, setShowBarcode] = useState(settings?.label_show_barcode ?? true)
  const [showSku, setShowSku] = useState(settings?.label_show_sku ?? true)
  const [showStoreName, setShowStoreName] = useState(settings?.label_show_store_name ?? true)
  const [showWholesale, setShowWholesale] = useState(settings?.label_show_wholesale ?? true)
  const [showDescription, setShowDescription] = useState(settings?.label_show_description ?? true)
  const [nameWrapLines, setNameWrapLines] = useState<1 | 2 | 3 | 4 | 5>(settings?.label_name_wrap_lines ?? 4)
  const [nameFontSize, setNameFontSize] = useState<'auto' | 'small' | 'medium' | 'large'>(settings?.label_name_font_size ?? 'auto')
  const [studioOpen, setStudioOpen] = useState(false)

  const updateCustomPreference = (patch: Partial<PrinterCustomizationSettings>) => {
    saveStoredPrinterCustomization(patch)
    void updateSettings(patch as any)
  }

  // Hardware printer detection state
  const [detectedPrinter, setDetectedPrinter] = useState<AutoDetectedLabelPrinter | null>(null)
  const [installedPrinters, setInstalledPrinters] = useState<PrinterChoiceLike[]>([])
  const [isRefreshingPrinters, setIsRefreshingPrinters] = useState(false)
  const [isPrinting, setIsPrinting] = useState(false)
  const [isInstallingDriver, setIsInstallingDriver] = useState(false)

  const handleInstallDriver = async () => {
    if (!window.api?.printer?.installDriver) return
    setIsInstallingDriver(true)
    try {
      const res = await window.api.printer.installDriver()
      if (res.ok) {
        toastSuccess('Driver Setup Started', 'Follow the on-screen wizard to install the CT221B driver.')
      } else {
        toastError('Installer Notice', res.message)
      }
    } catch (e) {
      toastError('Driver Error', String(e))
    } finally {
      setIsInstallingDriver(false)
    }
  }

  const handleOpenTutorial = async () => {
    if (!window.api?.printer?.openDriverTutorial) return
    try {
      const res = await window.api.printer.openDriverTutorial()
      if (res.ok) {
        toastSuccess('Tutorial Opened', 'Windows driver installation guide opened in PDF viewer.')
      } else {
        toastError('Tutorial Notice', res.message)
      }
    } catch (e) {
      toastError('Tutorial Error', String(e))
    }
  }

  // Product selection
  const [chosenProductId, setChosenProductId] = useState<number>(
    selectedProduct?.id ?? (products[0]?.id || 0)
  )

  const activeProduct = products.find((p) => p.id === chosenProductId) || selectedProduct || products[0]

  // Detect connected label printers on mount or open
  const scanPrinters = async () => {
    if (!window.api?.printer?.list) return
    setIsRefreshingPrinters(true)
    try {
      const list = await window.api.printer.list()
      setInstalledPrinters(list)
      const detected = autoDetectLabelPrinter(list, settings?.label_printer)
      setDetectedPrinter(detected)
    } catch (err) {
      console.warn('Failed to list system printers:', err)
    } finally {
      setIsRefreshingPrinters(false)
    }
  }

  useEffect(() => {
    if (open) {
      void scanPrinters()
      const reconciled = reconcilePrinterCustomization(settings)
      setTagSize((reconciled.label_paper_size as TagSizePreset) || '40x30')
      setCustomWidthMm(String(reconciled.label_custom_width_mm || 40))
      setCustomHeightMm(String(reconciled.label_custom_height_mm || 30))
      setShowBarcode(reconciled.label_show_barcode)
      setShowSku(reconciled.label_show_sku)
      setShowStoreName(reconciled.label_show_store_name)
      setShowWholesale(reconciled.label_show_wholesale)
      setShowDescription(reconciled.label_show_description)
      setNameWrapLines(reconciled.label_name_wrap_lines)
      setNameFontSize(reconciled.label_name_font_size)
      if (selectedProduct?.id) {
        setChosenProductId(selectedProduct.id)
      }
    }
  }, [open, selectedProduct, settings])

  // React to live changes from Printer Studio Modal
  useEffect(() => {
    const onCustomChange = () => {
      const reconciled = reconcilePrinterCustomization(settings)
      setTagSize((reconciled.label_paper_size as TagSizePreset) || '40x30')
      setCustomWidthMm(String(reconciled.label_custom_width_mm || 40))
      setCustomHeightMm(String(reconciled.label_custom_height_mm || 30))
      setShowBarcode(reconciled.label_show_barcode)
      setShowSku(reconciled.label_show_sku)
      setShowStoreName(reconciled.label_show_store_name)
      setShowWholesale(reconciled.label_show_wholesale)
      setShowDescription(reconciled.label_show_description)
      setNameWrapLines(reconciled.label_name_wrap_lines)
      setNameFontSize(reconciled.label_name_font_size)
    }
    window.addEventListener(PRINTER_CONFIG_CHANGED_EVENT, onCustomChange)
    return () => window.removeEventListener(PRINTER_CONFIG_CHANGED_EVENT, onCustomChange)
  }, [settings])

  if (!open || !activeProduct) return null

  const copies = Math.max(1, parseInt(printCopies) || 1)
  const activeDims = tagSize === 'custom'
    ? { width: Math.max(10, parseInt(customWidthMm) || 40), height: Math.max(10, parseInt(customHeightMm) || 30) }
    : PRESET_DIMENSIONS[tagSize]

  const widthMm = `${activeDims.width}mm`
  const heightMm = `${activeDims.height}mm`

  // Generate true scannable Code 128 barcode SVG for preview & printing
  const barcodeValue = activeProduct.barcode?.trim() || activeProduct.sku?.trim() || `TINDA-${activeProduct.id}`
  const isCompactTag = activeDims.height <= 20
  const barcodeSvgString = generateBarcodeSvg(barcodeValue, {
    height: isCompactTag ? 55 : 78,          // v2.1.3 fix: was 32/42 — increased ~2× so physical bar height reaches 7–9mm after SVG scale-down (was 3.4mm — scanner hesitated!)
    barHeight: isCompactTag ? 42 : 60,       // v2.1.3 fix: was 22/30 — tall bars = wide scan beam acceptance angle → instant 1st-pass detection
    includeText: true,
    barWidth: activeDims.width <= 30 ? 2.4 : 2.6,  // v2.1.3 fix: slightly reduced (was 2.5/2.8) — pairs with quietZone:10 to reduce total SVG width → less scale-down compression
    fontSize: isCompactTag ? 12 : 13,        // v2.1.3 fix: was 7.5/9 — scaled physical text now ~5–6pt (was ~2.8pt — microscopic on thermal!)
    quietZone: 10                            // v2.1.3 fix: was 14 → ISO 15416 minimum is 10. Saves ~22px SVG width, reduces scale compression by ~10%
  })

  const handlePrint = async (manual = false) => {
    if (!activeProduct) return
    setIsPrinting(true)

    const reconciled = reconcilePrinterCustomization(settings)
    const offsetX = reconciled.label_offset_x_mm
    const offsetY = reconciled.label_offset_y_mm
    const safeMargin = reconciled.label_safe_margin_mm
    const priceSize = reconciled.label_price_font_size || 'large'
    const nameWrap = nameWrapLines || reconciled.label_name_wrap_lines || 4
    const nameFontSetting = nameFontSize || reconciled.label_name_font_size || 'auto'
    const showDesc = showDescription ?? reconciled.label_show_description ?? true

    let computedNameFontSize = '9px'
    if (activeDims.height <= 20) {
      if (nameFontSetting === 'small') computedNameFontSize = '6.5px'
      else if (nameFontSetting === 'medium') computedNameFontSize = '7.5px'
      else if (nameFontSetting === 'large') computedNameFontSize = '8.5px'
      else {
        const len = activeProduct.name.length
        computedNameFontSize = len > 40 ? '6.5px' : len > 22 ? '7.5px' : '8.5px'
      }
    } else {
      if (nameFontSetting === 'small') computedNameFontSize = '7.5px'
      else if (nameFontSetting === 'medium') computedNameFontSize = '9px'
      else if (nameFontSetting === 'large') computedNameFontSize = '10.5px'
      else {
        const len = activeProduct.name.length
        computedNameFontSize = len > 50 ? '7.5px' : len > 28 ? '8.5px' : '9.5px'
      }
    }

    const computedDescFontSize = activeDims.height <= 20 ? '6px' : '7.5px'

    // Build thermal label HTML
    const singleLabelHtml = `
      <div class="label-tag">
        <div class="label-inner" style="width: 100%; height: 100%; padding: ${safeMargin}mm; display: flex; flex-direction: column; justify-content: space-between; transform: translate(${offsetX}mm, ${offsetY}mm);">
          ${showStoreName ? `<div class="store-hdr">${settings?.store_name || 'TINDA STORE'}</div>` : ''}
          <div class="p-header-box">
            <div class="p-name">${activeProduct.name}</div>
            ${showDesc && activeProduct.description ? `<div class="p-desc">${activeProduct.description}</div>` : ''}
          </div>
          <div class="price-wrap price-${priceSize}">
            <span class="currency">₱</span><span class="price">${(activeProduct.default_price_c / 100).toFixed(2)}</span>
          </div>
          ${
            showWholesale && activeProduct.wholesale_price_c
              ? `<div class="ws-price">WS: ₱${(activeProduct.wholesale_price_c / 100).toFixed(2)} (≥${activeProduct.wholesale_min_qty || 2})</div>`
              : ''
          }
          ${
            showBarcode
              ? `<div class="barcode-box">${barcodeSvgString}</div>`
              : ''
          }
          ${showSku ? `<div class="sku-tag">SKU: ${activeProduct.sku}</div>` : ''}
        </div>
      </div>
    `

    const labelsHtml = Array.from({ length: copies })
      .map(() => singleLabelHtml)
      .join('')

    const fullHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Price Tag - ${activeProduct.name}</title>
        <style>
          @page {
            size: ${widthMm} ${heightMm};
            margin: 0;
          }
          * {
            box-sizing: border-box;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          body {
            margin: 0;
            padding: 0;
            background: #ffffff !important;
            color: #000000 !important;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif;
          }
          .label-tag {
            width: ${widthMm};
            height: ${heightMm};
            max-height: ${heightMm};
            padding: 0;
            overflow: hidden;
            text-align: center;
            box-sizing: border-box;
            page-break-inside: avoid;
            break-inside: avoid;
            position: relative;
          }
          .price-wrap.price-medium .price { font-size: ${activeDims.height <= 20 ? '11px' : '14px'} !important; }
          .price-wrap.price-large .price { font-size: ${activeDims.height <= 20 ? '13px' : '17px'} !important; }
          .price-wrap.price-jumbo .price { font-size: ${activeDims.height <= 20 ? '15px' : '22px'} !important; }
          .label-tag:not(:last-child) {
            page-break-after: always;
            break-after: page;
          }
          @media print {
            body {
              margin: 0 !important;
              padding: 0 !important;
              background: #ffffff !important;
              color: #000000 !important;
            }
            .label-tag {
              border: none !important;
            }
            * {
              color: #000000 !important;
            }
          }
          .store-hdr {
            font-size: ${activeDims.height <= 20 ? '6px' : '7.5px'};
            font-weight: 900;
            letter-spacing: 0.05em;
            text-transform: uppercase;
            border-bottom: 1.5px solid #000000;
            padding-bottom: 0.4px;
            color: #000000;
          }
          .p-header-box {
            margin: 0.5px 0;
            max-width: 100%;
            overflow: hidden;
          }
          .p-name {
            font-size: ${computedNameFontSize};
            font-weight: 800;
            line-height: 1.1;
            overflow: hidden;
            text-overflow: ellipsis;
            display: -webkit-box;
            -webkit-line-clamp: ${nameWrap};
            -webkit-box-orient: vertical;
            word-break: break-word;
            overflow-wrap: break-word;
            color: #000000;
          }
          .p-desc {
            font-size: ${computedDescFontSize};
            font-weight: 500;
            font-style: italic;
            line-height: 1.05;
            color: #222222;
            margin-top: 0.5px;
            display: -webkit-box;
            -webkit-line-clamp: 2;
            -webkit-box-orient: vertical;
            overflow: hidden;
            word-break: break-word;
            overflow-wrap: break-word;
          }
          .price-wrap {
            font-weight: 900;
            color: #000000;
            margin: 0.5px 0;
          }
          .currency { font-size: ${activeDims.height <= 20 ? '9px' : '11px'}; vertical-align: top; color: #000000; }
          .price { font-size: ${activeDims.height <= 20 ? '13px' : '17px'}; font-weight: 900; color: #000000; }
          .ws-price {
            font-size: 7px;
            font-weight: 800;
            background: #f0f0f0;
            border: 1px solid #000000;
            padding: 0.5px 1px;
            border-radius: 1.5px;
            color: #000000;
          }
          .barcode-box {
            display: flex;
            justify-content: center;
            align-items: center;
            margin: 0.5px auto;
            width: 100%;
            background: #ffffff !important;
          }
          .barcode-box svg {
            display: block;
            width: auto;
            max-width: 100%;
            height: auto;
            overflow: visible;
            color: #000000;
            shape-rendering: crispEdges !important;
            image-rendering: -webkit-optimize-contrast !important;
            image-rendering: pixelated !important;
          }
          .barcode-box svg rect {
            shape-rendering: crispEdges !important;
          }
          .sku-tag {
            font-size: 6px;
            color: #000000;
            text-transform: uppercase;
            font-family: monospace;
            font-weight: bold;
          }
        </style>
      </head>
      <body>
        ${labelsHtml}
      </body>
      </html>
    `

    try {
      const targetDevice = detectedPrinter?.name || settings?.label_printer || undefined
      const effectiveManual = manual || !targetDevice

      if (!targetDevice && !manual) {
        toastInfo('Select Printer Device', 'No dedicated label printer configured. Opening print dialog to select your printer.')
      }

      if (window.api?.printer?.printDocument) {
        const res = await window.api.printer.printDocument(fullHtml, {
          manual: effectiveManual,
          title: `Price Tag - ${activeProduct.name}`,
          deviceName: targetDevice,
          widthMm: activeDims.width,
          heightMm: activeDims.height
        })

        if (res.ok) {
          toastSuccess(
            effectiveManual ? 'System Print Dialog Opened' : 'Price Tags Printed',
            `${copies} label(s) dispatched to ${targetDevice || 'printer'}.`
          )
          onClose()
        } else if (res.code !== 'DISABLED') {
          toastError('Print Failed', res.message)
        }
      } else {
        const printWin = window.open('', '_blank', 'width=450,height=600')
        if (printWin) {
          printWin.document.write(fullHtml)
          printWin.document.close()
          toastSuccess('Print Ready', `Generated ${copies} price tag(s).`)
          onClose()
        } else {
          toastError('Print Blocked', 'Please allow popups to print shelf price tags.')
        }
      }
    } catch (err) {
      toastError('Print Error', err instanceof Error ? err.message : String(err))
    } finally {
      setIsPrinting(false)
    }
  }

  const handleTestPrint = async () => {
    setIsPrinting(true)
    try {
      if (window.api?.printer?.testPrintLabel) {
        const res = await window.api.printer.testPrintLabel({
          deviceName: detectedPrinter?.name || settings?.label_printer || undefined
        })
        if (res.ok) {
          toastSuccess('CT221B Test Printed', 'Test sticker dispatched successfully!')
        } else {
          toastError('Test Failed', res.message)
        }
      }
    } catch (err) {
      toastError('Test Error', String(err))
    } finally {
      setIsPrinting(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="🏷️ Chiteng CT221B Label & Barcode Studio" maxWidth="max-w-2xl">
      <div className="space-y-4 p-1">
        {/* Hardware Status Banner */}
        <div className="flex items-center justify-between rounded-xl border border-ink-line bg-gradient-to-r from-ink-900 via-ink-850 to-ink-900 p-3 shadow-inner">
          <div className="flex items-center gap-3">
            <div className={`flex h-9 w-9 items-center justify-center rounded-lg border ${
              detectedPrinter
                ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-400'
                : 'border-amber-500/40 bg-amber-500/10 text-amber-400'
            }`}>
              <Printer className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-white">
                  {detectedPrinter ? detectedPrinter.name : 'No Dedicated Label Printer Auto-Detected'}
                </span>
                {detectedPrinter?.isCt221b && (
                  <span className="badge border border-emerald-500/40 bg-emerald-500/20 text-emerald-300 text-[10px] font-bold">
                    CT221B Ready
                  </span>
                )}
                {detectedPrinter?.isAutoDetected && (
                  <span className="badge border border-sky-500/40 bg-sky-500/20 text-sky-300 text-[10px] font-semibold">
                    Auto-Paired
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-400">
                {detectedPrinter
                  ? 'Hardware recognized via USB · 1-Tap silent thermal printing enabled.'
                  : 'Plug in Chiteng CT221B via USB or select printer in Settings for direct silent printing.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0 flex-wrap">
            <button
              type="button"
              onClick={() => void scanPrinters()}
              disabled={isRefreshingPrinters}
              className="p-1.5 rounded-lg border border-ink-line bg-ink-800 hover:bg-ink-700 text-slate-300 hover:text-white transition disabled:opacity-50"
              title="Rescan connected printers"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isRefreshingPrinters ? 'animate-spin' : ''}`} />
            </button>
            <button
              type="button"
              onClick={() => void handleTestPrint()}
              disabled={isPrinting}
              className="px-2.5 py-1.5 rounded-lg border border-indigo-500/40 bg-indigo-500/15 text-indigo-300 hover:bg-indigo-500/25 text-xs font-semibold flex items-center gap-1.5 transition disabled:opacity-50"
              title="Print a test alignment label on CT221B"
            >
              <Sparkles className="h-3 w-3 text-indigo-400" />
              <span>Test Sticker</span>
            </button>
            <button
              type="button"
              onClick={() => setStudioOpen(true)}
              className="px-2.5 py-1.5 rounded-lg border border-brand-500/40 bg-brand-500/15 text-brand-300 hover:bg-brand-500/25 text-xs font-semibold flex items-center gap-1.5 transition active:scale-95"
              title="Open Universal Alignment & Customization Studio (Fine-tune X/Y coordinates, gaps, margins)"
            >
              <Sliders className="h-3 w-3 text-brand-400" />
              <span>Align &amp; Calibrate</span>
            </button>
          </div>
        </div>

        {/* Driver Guidance & 1-Click Installer Box */}
        <div className="rounded-xl border border-sky-500/30 bg-sky-500/10 p-3 text-xs text-sky-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start gap-2.5">
            <Info className="h-4 w-4 text-sky-400 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <p className="font-bold text-white flex items-center gap-1.5">
                Chiteng CT221B Driver &amp; Setup Assistant
              </p>
              <p className="text-[11px] text-sky-300/90 leading-relaxed">
                Solid green light indicates printer is ready. If paper ejects blank or printer isn&apos;t detected, run the bundled official driver installer.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => void handleInstallDriver()}
              disabled={isInstallingDriver}
              className="px-2.5 py-1.5 rounded-lg border border-sky-500/40 bg-sky-500/20 hover:bg-sky-500/30 text-white font-semibold text-xs flex items-center gap-1.5 transition active:scale-95 disabled:opacity-50"
              title="Launch official Chiteng CT221B / Clabel Windows Driver Setup"
            >
              <Wrench className="h-3 w-3 text-sky-300" />
              <span>{isInstallingDriver ? 'Launching...' : 'Install Driver (V1.5)'}</span>
            </button>
            <button
              type="button"
              onClick={() => void handleOpenTutorial()}
              className="px-2.5 py-1.5 rounded-lg border border-slate-700 bg-ink-850 hover:bg-ink-800 text-slate-300 hover:text-white font-semibold text-xs flex items-center gap-1.5 transition active:scale-95"
              title="Open Windows Driver Installation Tutorial PDF"
            >
              <FileText className="h-3 w-3 text-slate-400" />
              <span>Driver Tutorial (PDF)</span>
            </button>
          </div>
        </div>

        {/* Product Picker */}
        <div>
          <label className="text-xs font-semibold text-slate-300 block mb-1.5">Target Product to Print</label>
          <select
            value={chosenProductId}
            onChange={(e) => setChosenProductId(Number(e.target.value))}
            className="input w-full text-xs font-bold text-white bg-ink-900 border-ink-line py-2"
          >
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} — {money(p.default_price_c)} (Stock: {p.stock} {p.base_unit}) {p.barcode ? `· [${p.barcode}]` : ''}
              </option>
            ))}
          </select>
        </div>

        {/* Tag Size Presets & Custom Dimensions */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-semibold text-slate-300">CT221B Thermal Sticker Size</label>
            <span className="text-[11px] text-slate-400 font-mono">
              Current: {activeDims.width}mm × {activeDims.height}mm
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
            {(Object.keys(PRESET_DIMENSIONS) as TagSizePreset[]).map((key) => {
              const preset = PRESET_DIMENSIONS[key]
              const isSelected = tagSize === key
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setTagSize(key)}
                  className={`flex flex-col items-center justify-center p-2 rounded-xl border text-center transition-all ${
                    isSelected
                      ? 'border-brand-500 bg-brand-500/20 text-white font-bold ring-2 ring-brand-400/30 scale-[1.02]'
                      : 'border-ink-line bg-ink-900 text-slate-400 hover:bg-ink-850 hover:text-slate-200'
                  }`}
                >
                  <span className="text-xs font-bold">{preset.label}</span>
                  <span className="text-[9px] text-slate-400 mt-0.5 truncate max-w-full">{preset.desc}</span>
                </button>
              )
            })}
          </div>

          {tagSize === 'custom' && (
            <div className="grid grid-cols-2 gap-3 mt-2.5 p-3 rounded-xl border border-ink-line bg-ink-900/60">
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Custom Width (mm)</label>
                <input
                  type="number"
                  min="15"
                  max="80"
                  value={customWidthMm}
                  onChange={(e) => setCustomWidthMm(e.target.value)}
                  className="input w-full text-xs"
                />
              </div>
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Custom Height (mm)</label>
                <input
                  type="number"
                  min="10"
                  max="120"
                  value={customHeightMm}
                  onChange={(e) => setCustomHeightMm(e.target.value)}
                  className="input w-full text-xs"
                />
              </div>
            </div>
          )}
        </div>

        {/* Live Visual Preview & Customization Toggles */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
          {/* Left: Interactive Preview (5 cols) */}
          <div className="md:col-span-5 flex flex-col items-center justify-center p-4 rounded-2xl bg-ink-950 border border-ink-line min-h-[220px]">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2">Live Physical Sticker Preview</p>

            {/* Simulated Label with actual aspect ratio */}
            <div
              className="bg-white text-black rounded-lg shadow-xl border border-slate-300 p-2.5 text-center flex flex-col justify-between transition-all"
              style={{
                width: `${Math.min(200, Math.max(140, activeDims.width * 3.8))}px`,
                minHeight: `${Math.min(180, Math.max(110, activeDims.height * 3.8))}px`
              }}
            >
              {showStoreName && (
                <div className="text-[8px] font-black uppercase border-b border-black pb-0.5 tracking-wider truncate">
                  {settings?.store_name || 'TINDA STORE'}
                </div>
              )}

              <div className="my-1">
                <div
                  className="font-black leading-tight text-black text-center"
                  style={{
                    fontSize:
                      nameFontSize === 'small'
                        ? '9.5px'
                        : nameFontSize === 'large'
                        ? '13px'
                        : nameFontSize === 'medium'
                        ? '11px'
                        : activeProduct.name.length > 40
                        ? '9.5px'
                        : '11.5px',
                    display: '-webkit-box',
                    WebkitLineClamp: nameWrapLines,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                    wordBreak: 'break-word'
                  }}
                  title={activeProduct.name}
                >
                  {activeProduct.name}
                </div>
                {showDescription && activeProduct.description && (
                  <div
                    className="text-[8.5px] text-slate-700 font-medium italic leading-tight mt-0.5 text-center"
                    style={{
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                      wordBreak: 'break-word'
                    }}
                    title={activeProduct.description}
                  >
                    {activeProduct.description}
                  </div>
                )}
                <div className="text-lg font-black text-black leading-none mt-1">
                  {money(activeProduct.default_price_c)}
                </div>
                {showWholesale && activeProduct.wholesale_price_c && (
                  <div className="text-[8px] font-bold bg-slate-200 py-0.5 px-1 rounded mt-0.5 inline-block">
                    WS: {money(activeProduct.wholesale_price_c)} (≥{activeProduct.wholesale_min_qty || 2})
                  </div>
                )}
              </div>

              {/* Scannable Barcode SVG */}
              {showBarcode && (
                <div
                  className="my-1 flex justify-center"
                  dangerouslySetInnerHTML={{ __html: barcodeSvgString }}
                />
              )}

              {showSku && (
                <div className="text-[7px] text-slate-600 uppercase font-mono tracking-wider">
                  SKU: {activeProduct.sku}
                </div>
              )}
            </div>

            <p className="text-[10px] text-emerald-400 mt-2 font-medium flex items-center gap-1">
              <CheckCircle2 className="h-3 w-3" />
              100% Scannable Code 128 Vector
            </p>
          </div>

          {/* Right: Quantity & Toggles (7 cols) */}
          <div className="md:col-span-7 space-y-3.5">
            {/* Copies with Quick Accelerators */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-slate-300">Quantity of Stickers to Print</label>
                <span className="text-[11px] text-slate-400">In Stock: {activeProduct.stock} {activeProduct.base_unit}</span>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="1"
                  max="500"
                  value={printCopies}
                  onChange={(e) => setPrintCopies(e.target.value)}
                  className="input w-24 text-sm font-bold text-white text-center py-1.5"
                />

                <div className="flex flex-wrap gap-1">
                  {['1', '5', '10', '25'].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => setPrintCopies(num)}
                      className={`px-2.5 py-1.5 text-xs rounded-lg border transition ${
                        printCopies === num
                          ? 'border-brand-500 bg-brand-500/20 text-white font-bold'
                          : 'border-ink-line bg-ink-850 text-slate-400 hover:text-white'
                      }`}
                    >
                      {num}
                    </button>
                  ))}

                  {activeProduct.stock > 0 && (
                    <button
                      type="button"
                      onClick={() => setPrintCopies(String(activeProduct.stock))}
                      className="px-2.5 py-1.5 text-xs rounded-lg border border-purple-500/40 bg-purple-500/15 text-purple-300 hover:bg-purple-500/25 font-semibold transition"
                      title="Print stickers matching total current stock"
                    >
                      Match Stock ({activeProduct.stock})
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Description & Long Title Auto-Wrap Controls */}
            <div className="bg-ink-850/80 p-2.5 rounded-xl border border-ink-line space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-200">
                  Description &amp; Long Name Auto-Wrap
                </span>
                <span className="text-[10px] text-brand-400 font-semibold">
                  Zero Truncation
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                {/* Max Lines */}
                <div>
                  <span className="text-[10px] text-slate-400 block mb-1">Title Max Lines</span>
                  <div className="flex items-center gap-1">
                    {([2, 3, 4, 5] as const).map((lines) => (
                      <button
                        key={lines}
                        type="button"
                        onClick={() => {
                          setNameWrapLines(lines)
                          updateCustomPreference({ label_name_wrap_lines: lines })
                        }}
                        className={`flex-1 py-1 text-[11px] font-bold rounded border transition ${
                          nameWrapLines === lines
                            ? 'border-brand-500 bg-brand-500/20 text-white'
                            : 'border-ink-line bg-ink-900 text-slate-400 hover:text-white'
                        }`}
                      >
                        {lines}L
                      </button>
                    ))}
                  </div>
                </div>

                {/* Font Scaling */}
                <div>
                  <span className="text-[10px] text-slate-400 block mb-1">Font Scaling</span>
                  <div className="flex items-center gap-1">
                    {(['auto', 'small', 'medium', 'large'] as const).map((sz) => (
                      <button
                        key={sz}
                        type="button"
                        onClick={() => {
                          setNameFontSize(sz)
                          updateCustomPreference({ label_name_font_size: sz })
                        }}
                        className={`flex-1 py-1 text-[10px] font-bold capitalize rounded border transition ${
                          nameFontSize === sz
                            ? 'border-brand-500 bg-brand-500/20 text-white'
                            : 'border-ink-line bg-ink-900 text-slate-400 hover:text-white'
                        }`}
                      >
                        {sz === 'auto' ? 'Auto' : sz}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Toggle Switches */}
            <div className="grid grid-cols-2 gap-2 pt-1 border-t border-ink-line">
              <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer p-1.5 rounded-lg hover:bg-ink-850 transition">
                <input
                  type="checkbox"
                  checked={showDescription}
                  onChange={(e) => {
                    setShowDescription(e.target.checked)
                    updateCustomPreference({ label_show_description: e.target.checked })
                  }}
                  className="rounded border-ink-line text-brand-500"
                />
                <span className="font-medium text-emerald-400">Include Product Description</span>
              </label>

              <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer p-1.5 rounded-lg hover:bg-ink-850 transition">
                <input
                  type="checkbox"
                  checked={showBarcode}
                  onChange={(e) => {
                    setShowBarcode(e.target.checked)
                    updateCustomPreference({ label_show_barcode: e.target.checked })
                  }}
                  className="rounded border-ink-line text-brand-500"
                />
                <span>Include Scannable Barcode</span>
              </label>

              <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer p-1.5 rounded-lg hover:bg-ink-850 transition">
                <input
                  type="checkbox"
                  checked={showStoreName}
                  onChange={(e) => {
                    setShowStoreName(e.target.checked)
                    updateCustomPreference({ label_show_store_name: e.target.checked })
                  }}
                  className="rounded border-ink-line text-brand-500"
                />
                <span>Include Store Name Header</span>
              </label>

              <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer p-1.5 rounded-lg hover:bg-ink-850 transition">
                <input
                  type="checkbox"
                  checked={showSku}
                  onChange={(e) => {
                    setShowSku(e.target.checked)
                    updateCustomPreference({ label_show_sku: e.target.checked })
                  }}
                  className="rounded border-ink-line text-brand-500"
                />
                <span>Include SKU Code</span>
              </label>

              <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer p-1.5 rounded-lg hover:bg-ink-850 transition col-span-2">
                <input
                  type="checkbox"
                  checked={showWholesale}
                  onChange={(e) => {
                    setShowWholesale(e.target.checked)
                    updateCustomPreference({ label_show_wholesale: e.target.checked })
                  }}
                  className="rounded border-ink-line text-brand-500"
                />
                <span>Include Wholesale Price</span>
              </label>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-3 border-t border-ink-line">
          <div className="text-[11px] text-slate-400">
            <span>Ready to dispatch </span>
            <strong className="text-white">{copies}</strong>
            <span> sticker{copies > 1 ? 's' : ''} ({widthMm} × {heightMm})</span>
          </div>

          <div className="flex items-center gap-2">
            <button type="button" onClick={onClose} className="btn-ghost text-xs">
              Cancel
            </button>

            <button
              type="button"
              disabled={isPrinting}
              onClick={() => void handlePrint(true)}
              className="px-3.5 py-2.5 rounded-xl border border-sky-500/30 bg-sky-500/10 hover:bg-sky-500/20 text-sky-300 font-semibold text-xs flex items-center gap-1.5 transition active:scale-95 disabled:opacity-50"
              title="Open Windows System Print Dialog"
            >
              <Printer className="h-3.5 w-3.5" />
              <span>Print Dialog (Manual)</span>
            </button>

            <button
              type="button"
              disabled={isPrinting}
              onClick={() => void handlePrint(false)}
              className="btn-primary flex items-center gap-2 text-xs font-bold py-2.5 px-4 shadow-lg active:scale-95 transition disabled:opacity-50"
            >
              <Printer className="h-4 w-4" />
              <span>{isPrinting ? 'Dispatching...' : `Print ${copies} Sticker${copies > 1 ? 's' : ''} (CT221B)`}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Dedicated Printer Alignment Studio */}
      <PrinterStudioModal
        open={studioOpen}
        onClose={() => setStudioOpen(false)}
        initialTab="label"
      />
    </Modal>
  )
}
