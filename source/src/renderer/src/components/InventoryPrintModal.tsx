import { useState } from 'react'
import { Printer, FileText, ClipboardList, CheckSquare, ArrowDownUp, PackageSearch } from 'lucide-react'
import { Modal } from './ui/Modal'
import { money } from '@shared/format'
import { toastSuccess, toastError } from '../stores/toast'
import type { Product } from '@shared/types'

interface InventoryPrintModalProps {
  open: boolean
  onClose: () => void
  products: Product[]
  storeName?: string
}

type SheetType = 'STOCK_ON_HAND' | 'COUNT_SHEET' | 'PURCHASE_ORDER' | 'ADJUSTMENT_SHEET'

export function InventoryPrintModal({
  open,
  onClose,
  products,
  storeName = 'TINDA STORE'
}: InventoryPrintModalProps): React.JSX.Element | null {
  const [sheetType, setSheetType] = useState<SheetType>('STOCK_ON_HAND')
  const [onlyLowStock, setOnlyLowStock] = useState(false)

  if (!open) return null

  const targetProducts = onlyLowStock
    ? products.filter((p) => p.stock <= p.low_stock_threshold)
    : products

  const handlePrint = () => {
    const printWin = window.open('', '_blank', 'width=850,height=1000')
    if (!printWin) {
      toastError('Print Blocked', 'Please allow popups to print inventory sheets.')
      return
    }

    const titleMap: Record<SheetType, string> = {
      STOCK_ON_HAND: 'PHYSICAL STOCK ON HAND REPORT',
      COUNT_SHEET: 'BLIND PHYSICAL INVENTORY COUNT SHEET',
      PURCHASE_ORDER: 'SUPPLIER PURCHASE / RESTOCK ORDER',
      ADJUSTMENT_SHEET: 'INVENTORY ADJUSTMENT & AUDIT LOG'
    }

    const rowsHtml = targetProducts
      .map((p, idx) => {
        if (sheetType === 'COUNT_SHEET') {
          return `
            <tr>
              <td style="text-align:center;">${idx + 1}</td>
              <td><strong>${p.name}</strong><br><small style="color:#666;">SKU: ${p.sku}</small></td>
              <td>${p.category_id || 'General'}</td>
              <td style="text-align:right;">${p.base_unit}</td>
              <td style="border: 1px solid #000; height: 26px; width: 110px;"></td>
              <td style="border: 1px solid #000; height: 26px; width: 110px;"></td>
            </tr>
          `
        }
        if (sheetType === 'PURCHASE_ORDER') {
          const suggested = Math.max(10, (p.low_stock_threshold || 10) * 2 - p.stock)
          return `
            <tr>
              <td style="text-align:center;">${idx + 1}</td>
              <td><strong>${p.name}</strong><br><small style="color:#666;">SKU: ${p.sku}</small></td>
              <td style="text-align:right;">${p.stock} ${p.base_unit}</td>
              <td style="text-align:right;">₱${(p.purchase_cost_c / 100).toFixed(2)}</td>
              <td style="text-align:right; font-weight:bold;">${suggested} ${p.base_unit}</td>
              <td style="text-align:right; font-weight:bold;">₱${((suggested * p.purchase_cost_c) / 100).toFixed(2)}</td>
            </tr>
          `
        }
        // Stock on hand / adjustment
        return `
          <tr>
            <td style="text-align:center;">${idx + 1}</td>
            <td><strong>${p.name}</strong><br><small style="color:#666;">SKU: ${p.sku}</small></td>
            <td>${p.category_id || 'General'}</td>
            <td style="text-align:right; font-weight:bold;">${p.stock} ${p.base_unit}</td>
            <td style="text-align:right;">₱${(p.purchase_cost_c / 100).toFixed(2)}</td>
            <td style="text-align:right;">₱${(p.default_price_c / 100).toFixed(2)}</td>
            <td style="text-align:right; font-weight:bold;">₱${((p.stock * p.purchase_cost_c) / 100).toFixed(2)}</td>
          </tr>
        `
      })
      .join('')

    const totalVal = targetProducts.reduce((s, p) => s + p.stock * p.purchase_cost_c, 0)

    printWin.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>${titleMap[sheetType]}</title>
        <style>
          @page { size: A4 portrait; margin: 12mm; }
          * { box-sizing: border-box; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif; font-size: 11px; color: #000; margin: 0; }
          .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #000; padding-bottom: 8px; margin-bottom: 12px; }
          .title { font-size: 16px; font-weight: 900; text-transform: uppercase; }
          .meta { font-size: 10px; color: #444; }
          table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 10px; }
          th { background: #f0f0f0; border: 1px solid #999; padding: 6px 8px; text-transform: uppercase; font-size: 9px; font-weight: 800; }
          td { border: 1px solid #ccc; padding: 5px 8px; vertical-align: middle; }
          .summary { margin-top: 16px; display: flex; justify-content: flex-end; font-size: 12px; font-weight: 800; }
          .sign-area { margin-top: 40px; display: flex; justify-content: space-between; font-size: 10px; }
          .sign-box { width: 200px; border-top: 1px solid #000; text-align: center; padding-top: 4px; }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <div style="font-size:13px; font-weight:800;">${storeName}</div>
            <div class="title">${titleMap[sheetType]}</div>
          </div>
          <div class="meta" style="text-align:right;">
            Date: ${new Date().toLocaleDateString('en-PH', { dateStyle: 'long' })}<br>
            Items: ${targetProducts.length} Products
          </div>
        </div>

        <table>
          <thead>
            ${
              sheetType === 'COUNT_SHEET'
                ? `<tr>
                    <th style="width:30px;">#</th>
                    <th>Product Name & SKU</th>
                    <th>Category</th>
                    <th style="text-align:right;">Unit</th>
                    <th style="width:110px;">Physical Count</th>
                    <th style="width:110px;">Variance / Notes</th>
                   </tr>`
                : sheetType === 'PURCHASE_ORDER'
                ? `<tr>
                    <th style="width:30px;">#</th>
                    <th>Product Name & SKU</th>
                    <th style="text-align:right;">Stock Left</th>
                    <th style="text-align:right;">Unit Cost</th>
                    <th style="text-align:right;">Suggested Order</th>
                    <th style="text-align:right;">Estimated Total</th>
                   </tr>`
                : `<tr>
                    <th style="width:30px;">#</th>
                    <th>Product Name & SKU</th>
                    <th>Category</th>
                    <th style="text-align:right;">Stock Balance</th>
                    <th style="text-align:right;">Cost Price</th>
                    <th style="text-align:right;">Selling SRP</th>
                    <th style="text-align:right;">Inventory Value</th>
                   </tr>`
            }
          </thead>
          <tbody>
            ${rowsHtml}
          </tbody>
        </table>

        ${
          sheetType !== 'COUNT_SHEET'
            ? `<div class="summary">
                 <div>Total Inventory Value: ₱${(totalVal / 100).toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
               </div>`
            : ''
        }

        <div class="sign-area">
          <div class="sign-box">Prepared / Counted By</div>
          <div class="sign-box">Audited / Approved By (Owner)</div>
        </div>

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
    toastSuccess('Print Sheet Ready', `Generated ${titleMap[sheetType]}`)
    onClose()
  }

  return (
    <Modal open={open} onClose={onClose} title="📄 Printable Inventory Sheets & Operations Reports">
      <div className="space-y-5 p-1">
        {/* Sheet Selector */}
        <div className="grid grid-cols-2 gap-3">
          {[
            {
              id: 'STOCK_ON_HAND',
              title: 'Stock on Hand Report',
              desc: 'Official balance listing with cost, SRP & valuation',
              icon: <PackageSearch className="h-5 w-5 text-emerald-400" />
            },
            {
              id: 'COUNT_SHEET',
              title: 'Physical Count Sheet',
              desc: 'Blind counting audit sheets with write-in columns',
              icon: <CheckSquare className="h-5 w-5 text-sky-400" />
            },
            {
              id: 'PURCHASE_ORDER',
              title: 'Purchase / Restock Order',
              desc: 'Supplier order form with suggested reorder quantities',
              icon: <ClipboardList className="h-5 w-5 text-amber-400" />
            },
            {
              id: 'ADJUSTMENT_SHEET',
              title: 'Stock Adjustment Log',
              desc: 'Damage, spoilage & reconciliation audit document',
              icon: <ArrowDownUp className="h-5 w-5 text-purple-400" />
            }
          ].map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => setSheetType(s.id as SheetType)}
              className={`flex items-start gap-3 p-3.5 rounded-xl border text-left transition ${
                sheetType === s.id
                  ? 'border-brand-500 bg-brand-500/15 text-white ring-1 ring-brand-500/30'
                  : 'border-ink-line bg-ink-900 text-slate-400 hover:text-white'
              }`}
            >
              <div className="mt-0.5">{s.icon}</div>
              <div>
                <p className="text-xs font-bold text-white">{s.title}</p>
                <p className="text-[11px] text-slate-400 mt-0.5 leading-snug">{s.desc}</p>
              </div>
            </button>
          ))}
        </div>

        {/* Filter Option */}
        <div className="p-3 rounded-xl bg-ink-950 border border-ink-line flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-white">Filter Low-Stock Items Only</p>
            <p className="text-[11px] text-slate-400">Print only products approaching or at zero stock</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={onlyLowStock}
              onChange={(e) => setOnlyLowStock(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-9 h-5 bg-ink-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-brand-500"></div>
          </label>
        </div>

        {/* Product Count Preview */}
        <div className="text-xs text-slate-400 flex items-center justify-between px-1">
          <span>Ready to print: <strong>{targetProducts.length}</strong> product items</span>
          <span>Standard A4 / Letter format</span>
        </div>

        {/* Actions */}
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
            Print Document
          </button>
        </div>
      </div>
    </Modal>
  )
}
