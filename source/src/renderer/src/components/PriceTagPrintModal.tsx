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
  Info
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

  const [tagSize, setTagSize] = useState<TagSizePreset>('40x30')
  const [customWidthMm, setCustomWidthMm] = useState('40')
  const [customHeightMm, setCustomHeightMm] = useState('30')
  const [printCopies, setPrintCopies] = useState('1')
  const [showBarcode, setShowBarcode] = useState(true)
  const [showSku, setShowSku] = useState(true)
  const [showStoreName, setShowStoreName] = useState(true)
  const [showWholesale, setShowWholesale] = useState(true)

  // Hardware printer detection state
  const [detectedPrinter, setDetectedPrinter] = useState<AutoDetectedLabelPrinter | null>(null)
  const [installedPrinters, setInstalledPrinters] = useState<PrinterChoiceLike[]>([])
  const [isRefreshingPrinters, setIsRefreshingPrinters] = useState(false)
  const [isPrinting, setIsPrinting] = useState(false)

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
      if (selectedProduct?.id) {
        setChosenProductId(selectedProduct.id)
      }
    }
  }, [open, selectedProduct])

  if (!open || !activeProduct) return null

  const copies = Math.max(1, parseInt(printCopies) || 1)
  const activeDims = tagSize === 'custom'
    ? { width: Math.max(10, parseInt(customWidthMm) || 40), height: Math.max(10, parseInt(customHeightMm) || 30) }
    : PRESET_DIMENSIONS[tagSize]

  const widthMm = `${activeDims.width}mm`
  const heightMm = `${activeDims.height}mm`

  // Generate true scannable Code 128 barcode SVG for preview & printing
  const barcodeValue = activeProduct.barcode?.trim() || activeProduct.sku?.trim() || `TINDA-${activeProduct.id}`
  const barcodeSvgString = generateBarcodeSvg(barcodeValue, {
    height: activeDims.height <= 20 ? 22 : 30,
    includeText: true,
    barWidth: activeDims.width <= 30 ? 1.1 : 1.4,
    fontSize: activeDims.height <= 20 ? 7 : 8.5
  })

  const handlePrint = async (manual = false) => {
    if (!activeProduct) return
    setIsPrinting(true)

    // Build thermal label HTML
    const singleLabelHtml = `
      <div class="label-tag">
        ${showStoreName ? `<div class="store-hdr">${settings?.store_name || 'TINDA STORE'}</div>` : ''}
        <div class="p-name">${activeProduct.name}</div>
        <div class="price-wrap">
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
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          body {
            margin: 0;
            padding: 0;
            background: #fff;
            color: #000;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif;
          }
          .label-tag {
            width: ${widthMm};
            height: ${heightMm};
            padding: ${activeDims.height <= 20 ? '1mm' : '1.5mm'};
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            page-break-after: always;
            border: 1px dashed #ccc;
            overflow: hidden;
            text-align: center;
          }
          @media print {
            .label-tag { border: none; }
          }
          .store-hdr {
            font-size: ${activeDims.height <= 20 ? '6px' : '7.5px'};
            font-weight: 800;
            letter-spacing: 0.05em;
            text-transform: uppercase;
            border-bottom: 1px solid #000;
            padding-bottom: 0.5px;
          }
          .p-name {
            font-size: ${activeDims.height <= 20 ? '7.5px' : '9px'};
            font-weight: 800;
            line-height: 1.1;
            max-height: ${activeDims.height <= 20 ? '14px' : '22px'};
            overflow: hidden;
            text-overflow: ellipsis;
            display: -webkit-box;
            -webkit-line-clamp: 2;
            -webkit-box-orient: vertical;
          }
          .price-wrap {
            font-weight: 900;
            color: #000;
            margin: 0.5px 0;
          }
          .currency { font-size: ${activeDims.height <= 20 ? '9px' : '11px'}; vertical-align: top; }
          .price { font-size: ${activeDims.height <= 20 ? '13px' : '17px'}; font-weight: 900; }
          .ws-price {
            font-size: 7px;
            font-weight: 700;
            background: #eee;
            padding: 0.5px;
            border-radius: 1.5px;
          }
          .barcode-box {
            display: flex;
            justify-content: center;
            align-items: center;
            margin: 0.5px 0;
          }
          .barcode-box svg {
            max-width: 95%;
            height: auto;
          }
          .sku-tag {
            font-size: 6px;
            color: #333;
            text-transform: uppercase;
            font-family: monospace;
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

          <div className="flex items-center gap-1.5 shrink-0">
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
          </div>
        </div>

        {/* Driver Guidance when not detected */}
        {!detectedPrinter && (
          <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-200 flex items-start gap-2.5">
            <Info className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-bold text-white flex items-center gap-1.5">
                Chiteng CT221B Connection Notice
              </p>
              <p className="text-[11px] text-amber-300/90 leading-relaxed">
                A solid green light on the physical printer means power &amp; paper roll are ready. If printing does not start, please install the official PC driver from <a href="http://www.claiot.com" target="_blank" rel="noreferrer" className="underline font-bold text-amber-200 hover:text-white">www.claiot.com</a>.
              </p>
              <p className="text-[11px] text-amber-200 font-semibold">
                Tip: You can also click <span className="text-white underline">"Print Dialog (Manual)"</span> below to choose your printer from the Windows list.
              </p>
            </div>
          </div>
        )}

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
                <div className="text-xs font-black leading-tight truncate" title={activeProduct.name}>
                  {activeProduct.name}
                </div>
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

            {/* Toggle Switches */}
            <div className="grid grid-cols-2 gap-2 pt-1 border-t border-ink-line">
              <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer p-1.5 rounded-lg hover:bg-ink-850 transition">
                <input
                  type="checkbox"
                  checked={showBarcode}
                  onChange={(e) => setShowBarcode(e.target.checked)}
                  className="rounded border-ink-line text-brand-500"
                />
                <span>Include Scannable Barcode</span>
              </label>

              <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer p-1.5 rounded-lg hover:bg-ink-850 transition">
                <input
                  type="checkbox"
                  checked={showStoreName}
                  onChange={(e) => setShowStoreName(e.target.checked)}
                  className="rounded border-ink-line text-brand-500"
                />
                <span>Include Store Name Header</span>
              </label>

              <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer p-1.5 rounded-lg hover:bg-ink-850 transition">
                <input
                  type="checkbox"
                  checked={showSku}
                  onChange={(e) => setShowSku(e.target.checked)}
                  className="rounded border-ink-line text-brand-500"
                />
                <span>Include SKU Code</span>
              </label>

              <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer p-1.5 rounded-lg hover:bg-ink-850 transition">
                <input
                  type="checkbox"
                  checked={showWholesale}
                  onChange={(e) => setShowWholesale(e.target.checked)}
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
    </Modal>
  )
}
