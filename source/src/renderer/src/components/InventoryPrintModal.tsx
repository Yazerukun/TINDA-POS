import { useState, useMemo, useEffect } from 'react'
import { Printer, FileText, ClipboardList, CheckSquare, ArrowDownUp, PackageSearch, Search, X } from 'lucide-react'
import { Modal } from './ui/Modal'
import { money } from '@shared/format'
import { toastSuccess, toastError } from '../stores/toast'
import { useSettings } from '../stores/settings'
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
  storeName: storeNameProp
}: InventoryPrintModalProps): React.JSX.Element | null {
  const { settings, load: loadSettings } = useSettings()

  useEffect(() => {
    if (open && !settings) {
      void loadSettings()
    }
  }, [open, settings, loadSettings])

  const effectiveStoreName = (storeNameProp && storeNameProp !== 'TINDA STORE' ? storeNameProp : settings?.store_name) || 'TINDA STORE'
  const storeAddress = settings?.address || ''
  const storePhone = settings?.phone || ''
  const storeTin = settings?.tin || ''
  const storeOwner = settings?.owner_name || 'Store Owner'

  const [sheetType, setSheetType] = useState<SheetType>('STOCK_ON_HAND')
  const [onlyLowStock, setOnlyLowStock] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  if (!open) return null

  const q = searchQuery.trim().toLowerCase()
  const targetProducts = useMemo(() => {
    return products.filter((p) => {
      if (onlyLowStock && p.stock > p.low_stock_threshold) return false
      if (!q) return true
      const nameMatch = p.name ? p.name.toLowerCase().includes(q) : false
      const skuMatch = p.sku ? p.sku.toLowerCase().includes(q) : false
      const barcodeMatch = p.barcode ? p.barcode.toLowerCase().includes(q) : false
      const catMatch = p.category_name ? p.category_name.toLowerCase().includes(q) : false
      const descMatch = p.description ? p.description.toLowerCase().includes(q) : false
      return nameMatch || skuMatch || barcodeMatch || catMatch || descMatch
    })
  }, [products, onlyLowStock, q])

  const [isPrinting, setIsPrinting] = useState(false)

  const generateDocumentHtml = (): { title: string; html: string } => {
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

    const activeFilters: string[] = []
    if (q) activeFilters.push(`Filter: "${searchQuery.trim()}"`)
    if (onlyLowStock) activeFilters.push('Low Stock Only')
    const filterSubtitle = activeFilters.join(' • ')

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>${titleMap[sheetType]}</title>
        <style>
          @page { size: A4 portrait; margin: 12mm; }
          * { box-sizing: border-box; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif; font-size: 11px; color: #000; margin: 0; padding: 12px; }
          .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #000; padding-bottom: 8px; margin-bottom: 12px; }
          .title { font-size: 16px; font-weight: 900; text-transform: uppercase; }
          .meta { font-size: 10px; color: #444; }
          table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 10px; }
          th { background: #f0f0f0; border: 1px solid #999; padding: 6px 8px; text-transform: uppercase; font-size: 9px; font-weight: 800; }
          td { border: 1px solid #ccc; padding: 5px 8px; vertical-align: middle; }
          .summary { margin-top: 16px; display: flex; justify-content: flex-end; font-size: 12px; font-weight: 800; }
          .sign-area { margin-top: 40px; display: flex; justify-content: space-between; font-size: 10px; }
          .sign-box { width: 220px; border-top: 1px solid #000; text-align: center; padding-top: 4px; line-height: 1.4; }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <div style="font-size:16px; font-weight:900; letter-spacing:0.5px; text-transform:uppercase;">${effectiveStoreName.toUpperCase()}</div>
            ${storeAddress ? `<div style="font-size:10px; color:#555; margin-top:2px;">${storeAddress}</div>` : ''}
            ${storePhone || storeTin ? `<div style="font-size:10px; color:#555;">${[storePhone ? `Tel: ${storePhone}` : '', storeTin ? `TIN: ${storeTin}` : ''].filter(Boolean).join(' • ')}</div>` : ''}
            <div class="title" style="margin-top:4px;">${titleMap[sheetType]}</div>
          </div>
          <div class="meta" style="text-align:right;">
            <div><strong>Date:</strong> ${new Date().toLocaleDateString('en-PH', { dateStyle: 'long' })}</div>
            ${filterSubtitle ? `<div style="font-weight:700; color:#111; margin-top:2px; background:#f0f0f0; padding:2px 6px; border-radius:4px; display:inline-block;">${filterSubtitle}</div>` : ''}
            <div style="margin-top:2px;"><strong>Total Items:</strong> ${targetProducts.length} Products</div>
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
                 <div>Total Inventory Value${filterSubtitle ? ' (Filtered)' : ''}: ₱${(totalVal / 100).toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
               </div>`
            : ''
        }

        <div class="sign-area">
          <div class="sign-box">Prepared &amp; Counted By<br><small style="color:#666; font-size:9px;">(Auditor / Staff Signature)</small></div>
          <div class="sign-box">Verified &amp; Approved By<br><strong>${storeOwner}</strong> <small style="color:#666; font-size:9px;">(Owner)</small></div>
        </div>
      </body>
      </html>
    `

    return { title: titleMap[sheetType], html }
  }

  const handlePrint = async (manual = false) => {
    setIsPrinting(true)
    const { title, html } = generateDocumentHtml()
    try {
      if (window.api?.printer?.printDocument) {
        const res = await window.api.printer.printDocument(html, {
          manual,
          title,
          pageSize: 'A4'
        })
        if (res.ok) {
          toastSuccess(manual ? 'System Print Dialog' : 'Print Document', res.message)
          onClose()
        } else if (res.code !== 'DISABLED') {
          toastError('Print Failed', res.message)
        }
      } else {
        const printWin = window.open('', '_blank', 'width=850,height=1000')
        if (printWin) {
          printWin.document.write(html)
          printWin.document.close()
          toastSuccess('Print Sheet Ready', `Generated ${title}`)
          onClose()
        } else {
          toastError('Print Blocked', 'Please allow popups to print inventory sheets.')
        }
      }
    } catch (err) {
      toastError('Print Error', err instanceof Error ? err.message : String(err))
    } finally {
      setIsPrinting(false)
    }
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

        {/* Search & Keyword Filter */}
        <div className="relative">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search items by name, SKU, or category (e.g. elbow)..."
            className="w-full rounded-xl border border-ink-line bg-ink-950 py-2.5 pl-10 pr-9 text-xs text-white placeholder-slate-500 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500/50 transition"
            autoFocus
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-0.5 rounded-full hover:bg-ink-800 transition"
              title="Clear search"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
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
          <span>
            Ready to print: <strong className="text-white font-bold">{targetProducts.length}</strong> product items
            {searchQuery.trim() && (
              <span className="text-slate-400 ml-1.5">
                (matching &ldquo;<span className="text-brand-400 font-semibold">{searchQuery.trim()}</span>&rdquo;)
              </span>
            )}
          </span>
          <span>Standard A4 / Letter format</span>
        </div>

        {targetProducts.length === 0 && (
          <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs text-center">
            No items match your active search &ldquo;{searchQuery}&rdquo;. Try clearing the search or adjusting keywords.
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-2 pt-3 border-t border-ink-line">
          <button type="button" onClick={onClose} className="btn-ghost text-xs">
            Cancel
          </button>
          <button
            type="button"
            disabled={isPrinting}
            onClick={() => void handlePrint(true)}
            className="px-3.5 py-2 rounded-xl border border-sky-500/30 bg-sky-500/10 hover:bg-sky-500/20 text-sky-300 font-semibold text-xs flex items-center gap-1.5 transition active:scale-95 disabled:opacity-50"
            title="Open Windows System Print Dialog to choose printer, page range, and paper"
          >
            <Printer className="h-3.5 w-3.5" />
            Manual Print (Dialog)
          </button>
          <button
            type="button"
            disabled={isPrinting}
            onClick={() => void handlePrint(false)}
            className="btn-primary flex items-center gap-2 text-xs font-bold py-2.5 px-4 shadow-lg active:scale-95 transition disabled:opacity-50"
            title="Print directly to configured printer"
          >
            <Printer className="h-4 w-4" />
            {isPrinting ? 'Preparing...' : 'Auto Print (A4)'}
          </button>
        </div>
      </div>
    </Modal>
  )
}
