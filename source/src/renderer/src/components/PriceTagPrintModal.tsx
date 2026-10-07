import { useState } from 'react'
import { Printer, X, Tag, FileText, Check } from 'lucide-react'
import { Modal } from './ui/Modal'
import { money } from '@shared/format'
import { toastSuccess, toastError } from '../stores/toast'
import type { Product } from '@shared/types'

interface PriceTagPrintModalProps {
  open: boolean
  onClose: () => void
  products: Product[]
  selectedProduct?: Product | null
}

type TagSize = '30x20' | '40x30' | '50x30' | 'custom'

export function PriceTagPrintModal({
  open,
  onClose,
  products,
  selectedProduct
}: PriceTagPrintModalProps): React.JSX.Element | null {
  const [tagSize, setTagSize] = useState<TagSize>('40x30')
  const [customWidthMm, setCustomWidthMm] = useState('40')
  const [customHeightMm, setCustomHeightMm] = useState('30')
  const [printCopies, setPrintCopies] = useState('1')
  const [showBarcode, setShowBarcode] = useState(true)
  const [showSku, setShowSku] = useState(true)
  const [showStoreName, setShowStoreName] = useState(true)

  // Product selection
  const [chosenProductId, setChosenProductId] = useState<number>(
    selectedProduct?.id ?? (products[0]?.id || 0)
  )

  const activeProduct = products.find((p) => p.id === chosenProductId) || selectedProduct || products[0]

  if (!open || !activeProduct) return null

  const copies = Math.max(1, parseInt(printCopies) || 1)

  const handlePrint = () => {
    // Generate isolated printable label document
    const widthMm = tagSize === '30x20' ? '30mm' : tagSize === '40x30' ? '40mm' : tagSize === '50x30' ? '50mm' : `${customWidthMm}mm`
    const heightMm = tagSize === '30x20' ? '20mm' : tagSize === '40x30' ? '30mm' : tagSize === '50x30' ? '30mm' : `${customHeightMm}mm`

    const printWin = window.open('', '_blank', 'width=450,height=600')
    if (!printWin) {
      toastError('Print Blocked', 'Please allow popups to print shelf price tags.')
      return
    }

    const labelsHtml = Array.from({ length: copies })
      .map(
        () => `
        <div class="label-tag">
          ${showStoreName ? `<div class="store-hdr">TINDA STORE</div>` : ''}
          <div class="p-name">${activeProduct.name}</div>
          <div class="price-wrap">
            <span class="currency">₱</span><span class="price">${(activeProduct.default_price_c / 100).toFixed(2)}</span>
          </div>
          ${activeProduct.wholesale_price_c ? `<div class="ws-price">WS: ₱${(activeProduct.wholesale_price_c / 100).toFixed(2)} (≥${activeProduct.wholesale_min_qty || 2})</div>` : ''}
          ${
            showBarcode && activeProduct.barcode
              ? `<div class="barcode-box">
                  <div class="barcode-num">*${activeProduct.barcode}*</div>
                  <div class="barcode-txt">${activeProduct.barcode}</div>
                 </div>`
              : ''
          }
          ${showSku ? `<div class="sku-tag">SKU: ${activeProduct.sku}</div>` : ''}
        </div>
      `
      )
      .join('')

    printWin.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
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
            padding: 1.5mm;
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
            font-size: 7px;
            font-weight: 800;
            letter-spacing: 0.05em;
            text-transform: uppercase;
            border-bottom: 1px solid #000;
            padding-bottom: 1px;
          }
          .p-name {
            font-size: 9px;
            font-weight: 800;
            line-height: 1.1;
            max-height: 20px;
            overflow: hidden;
            text-overflow: ellipsis;
            display: -webkit-box;
            -webkit-line-clamp: 2;
            -webkit-box-orient: vertical;
          }
          .price-wrap {
            font-weight: 900;
            color: #000;
            margin: 1px 0;
          }
          .currency { font-size: 11px; vertical-align: top; }
          .price { font-size: 16px; font-weight: 900; }
          .ws-price {
            font-size: 7.5px;
            font-weight: 700;
            background: #eee;
            padding: 1px;
            border-radius: 2px;
          }
          .barcode-box {
            font-family: monospace;
            font-size: 8px;
            line-height: 1;
            margin-top: 1px;
          }
          .barcode-num {
            font-family: "Courier New", monospace;
            font-size: 10px;
            letter-spacing: 2px;
            font-weight: bold;
          }
          .barcode-txt { font-size: 7px; }
          .sku-tag {
            font-size: 6.5px;
            color: #444;
            text-transform: uppercase;
          }
        </style>
      </head>
      <body>
        ${labelsHtml}
        <script>
          window.onload = function() {
            window.print();
            setTimeout(function() { window.close(); }, 500);
          }
        </script>
      </body>
      </html>
    `)
    printWin.document.close()
    toastSuccess('Print Dialog Ready', `Generated ${copies} price tag(s) for ${activeProduct.name}`)
    onClose()
  }

  return (
    <Modal open={open} onClose={onClose} title="🏷️ Print Shelf Price Tag / Barcode Sticker">
      <div className="space-y-5 p-1">
        {/* Product Picker */}
        <div>
          <label className="text-xs font-semibold text-slate-300 block mb-1.5">Selected Item</label>
          <select
            value={chosenProductId}
            onChange={(e) => setChosenProductId(Number(e.target.value))}
            className="input w-full text-xs font-semibold"
          >
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} — {money(p.default_price_c)} (Stock: {p.stock})
              </option>
            ))}
          </select>
        </div>

        {/* Tag Size Preset Picker */}
        <div>
          <label className="text-xs font-semibold text-slate-300 block mb-1.5">Sticker / Label Size</label>
          <div className="grid grid-cols-4 gap-2">
            {[
              { id: '30x20', label: '30 × 20 mm', sub: 'Micro Grocery' },
              { id: '40x30', label: '40 × 30 mm', sub: 'Standard Retail' },
              { id: '50x30', label: '50 × 30 mm', sub: 'Wide Pharmacy' },
              { id: 'custom', label: 'Custom Size', sub: 'Any Dimensions' }
            ].map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setTagSize(s.id as TagSize)}
                className={`flex flex-col items-center justify-center p-2.5 rounded-xl border text-center transition ${
                  tagSize === s.id
                    ? 'border-brand-500 bg-brand-500/15 text-white font-bold ring-1 ring-brand-500/30'
                    : 'border-ink-line bg-ink-900 text-slate-400 hover:text-white'
                }`}
              >
                <span className="text-xs">{s.label}</span>
                <span className="text-[10px] text-slate-500 mt-0.5">{s.sub}</span>
              </button>
            ))}
          </div>

          {tagSize === 'custom' && (
            <div className="grid grid-cols-2 gap-3 mt-3">
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Width (mm)</label>
                <input
                  type="number"
                  value={customWidthMm}
                  onChange={(e) => setCustomWidthMm(e.target.value)}
                  className="input w-full text-xs"
                />
              </div>
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Height (mm)</label>
                <input
                  type="number"
                  value={customHeightMm}
                  onChange={(e) => setCustomHeightMm(e.target.value)}
                  className="input w-full text-xs"
                />
              </div>
            </div>
          )}
        </div>

        {/* Live Preview Box */}
        <div>
          <label className="text-xs font-semibold text-slate-300 block mb-1.5">Live Tag Preview</label>
          <div className="flex items-center justify-center p-6 rounded-xl bg-ink-950 border border-ink-line">
            <div className="w-48 bg-white text-black p-3 rounded shadow-md text-center space-y-1">
              {showStoreName && <div className="text-[8px] font-extrabold uppercase border-b border-black pb-0.5">TINDA STORE</div>}
              <div className="text-xs font-extrabold leading-tight truncate" title={activeProduct.name}>
                {activeProduct.name}
              </div>
              <div className="text-xl font-black text-black">
                {money(activeProduct.default_price_c)}
              </div>
              {activeProduct.wholesale_price_c && (
                <div className="text-[9px] font-bold bg-slate-200 py-0.5 rounded">
                  WS: {money(activeProduct.wholesale_price_c)} (≥{activeProduct.wholesale_min_qty || 2})
                </div>
              )}
              {showBarcode && activeProduct.barcode && (
                <div className="text-[9px] font-mono tracking-widest font-bold pt-1">
                  ||||| {activeProduct.barcode} |||||
                </div>
              )}
              {showSku && <div className="text-[8px] text-slate-600 uppercase font-mono">SKU: {activeProduct.sku}</div>}
            </div>
          </div>
        </div>

        {/* Options & Copies */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">Number of Copies / Stickers</label>
            <input
              type="number"
              min="1"
              max="100"
              value={printCopies}
              onChange={(e) => setPrintCopies(e.target.value)}
              className="input w-full text-xs font-bold"
            />
          </div>

          <div className="space-y-1.5 pt-4">
            <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={showBarcode}
                onChange={(e) => setShowBarcode(e.target.checked)}
                className="rounded border-ink-line"
              />
              <span>Include Barcode on Tag</span>
            </label>
            <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={showSku}
                onChange={(e) => setShowSku(e.target.checked)}
                className="rounded border-ink-line"
              />
              <span>Include SKU Reference</span>
            </label>
          </div>
        </div>

        {/* Action Button */}
        <div className="flex justify-end gap-3 pt-3 border-t border-ink-line">
          <button type="button" onClick={onClose} className="btn-ghost text-xs">
            Cancel
          </button>
          <button
            type="button"
            onClick={handlePrint}
            className="btn-primary flex items-center gap-2 text-xs font-bold py-2.5 px-4 shadow-lg"
          >
            <Printer className="h-4 w-4" />
            Print {copies} Price Tag{copies > 1 ? 's' : ''}
          </button>
        </div>
      </div>
    </Modal>
  )
}
