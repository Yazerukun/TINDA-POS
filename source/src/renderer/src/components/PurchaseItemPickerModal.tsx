import { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import {
  Search,
  X,
  PackageSearch,
  Check,
  AlertTriangle,
  AlertCircle,
  Tag,
  Barcode,
  CornerDownLeft
} from 'lucide-react'
import type { Product } from '@shared/types'
import { money } from '@shared/format'
import { matchesProductSearch } from '@shared/searchUtils'

interface PurchaseItemPickerModalProps {
  open: boolean
  onClose: () => void
  products: Product[]
  onSelectProduct: (product: Product) => void
  onRefresh?: () => Promise<void> | void
}

const INITIAL_CHUNK_SIZE = 80
const CHUNK_INCREMENT = 50

export function PurchaseItemPickerModal({
  open,
  onClose,
  products,
  onSelectProduct,
  onRefresh
}: PurchaseItemPickerModalProps): React.JSX.Element | null {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL')
  const [selectedIndex, setSelectedIndex] = useState<number>(0)
  const [renderLimit, setRenderLimit] = useState<number>(INITIAL_CHUNK_SIZE)
  const [extraDbProducts, setExtraDbProducts] = useState<Product[]>([])

  const searchInputRef = useRef<HTMLInputElement>(null)
  const tableContainerRef = useRef<HTMLDivElement>(null)
  const rowRefs = useRef<(HTMLTableRowElement | null)[]>([])

  // Live search fallback if query has no in-memory matches or to discover newly added codes
  useEffect(() => {
    const q = searchQuery.trim()
    if (!q) {
      setExtraDbProducts([])
      return
    }
    const timer = setTimeout(async () => {
      if (typeof window !== 'undefined' && window.api?.products?.search) {
        try {
          const res = await window.api.products.search(q, { status: 'ACTIVE', limit: 50 })
          if (res?.rows && res.rows.length > 0) {
            const newItems = res.rows.filter((rp) => !products.some((p) => p.id === rp.id))
            if (newItems.length > 0) {
              setExtraDbProducts(newItems)
            }
          }
        } catch (err) {
          console.debug('F1 Explorer live search error:', err)
        }
      }
    }, 180)
    return () => clearTimeout(timer)
  }, [searchQuery, products])

  // Catalog combining provided products and any newly discovered live DB rows
  const effectiveCatalog = useMemo(() => {
    if (extraDbProducts.length === 0) return products
    return [...products, ...extraDbProducts]
  }, [products, extraDbProducts])

  // Extract unique categories from catalog
  const categories = useMemo(() => {
    const catMap = new Map<string, number>()
    effectiveCatalog.forEach((p) => {
      const cat = p.category_name?.trim() || 'Uncategorized'
      catMap.set(cat, (catMap.get(cat) || 0) + 1)
    })
    return Array.from(catMap.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
  }, [effectiveCatalog])

  // Count low stock items
  const lowStockCount = useMemo(() => {
    return effectiveCatalog.filter((p) => {
      const threshold = p.low_stock_threshold ?? 5
      return p.stock <= threshold
    }).length
  }, [effectiveCatalog])

  // Filtered products list
  const filteredProducts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    return effectiveCatalog.filter((p) => {
      // Category filter
      if (selectedCategory === 'LOW_STOCK') {
        const threshold = p.low_stock_threshold ?? 5
        if (p.stock > threshold) return false
      } else if (selectedCategory !== 'ALL') {
        const cat = p.category_name?.trim() || 'Uncategorized'
        if (cat.toLowerCase() !== selectedCategory.toLowerCase()) return false
      }

      // Search query filter
      if (!q) return true
      return matchesProductSearch(p, q)
    })
  }, [effectiveCatalog, searchQuery, selectedCategory])

  // Progressive rendering slice for 0ms instantaneous opening and silky 60fps scrolling
  const displayedProducts = useMemo(() => {
    return filteredProducts.slice(0, renderLimit)
  }, [filteredProducts, renderLimit])

  // Reset selected index & render limit when search or filter changes
  useEffect(() => {
    setSelectedIndex(0)
    setRenderLimit(INITIAL_CHUNK_SIZE)
  }, [searchQuery, selectedCategory])

  // Auto-focus search input with 0ms microtask and trigger proactive refresh whenever modal opens
  useEffect(() => {
    if (open) {
      void onRefresh?.()
      setSearchQuery('')
      setSelectedCategory('ALL')
      setSelectedIndex(0)
      setRenderLimit(INITIAL_CHUNK_SIZE)
      setExtraDbProducts([])
      requestAnimationFrame(() => {
        searchInputRef.current?.focus()
        searchInputRef.current?.select()
      })
    }
  }, [open, onRefresh])

  // Ensure active row is scrolled into view smoothly
  useEffect(() => {
    if (!open) return
    const activeRow = rowRefs.current[selectedIndex]
    if (activeRow && tableContainerRef.current) {
      activeRow.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
    }
  }, [selectedIndex, open])

  // Dynamic chunk loading as user scrolls table
  const handleScroll = useCallback(
    (e: React.UIEvent<HTMLDivElement>) => {
      const { scrollTop, scrollHeight, clientHeight } = e.currentTarget
      if (scrollHeight - scrollTop - clientHeight < 250) {
        setRenderLimit((prev) => Math.min(filteredProducts.length, prev + CHUNK_INCREMENT))
      }
    },
    [filteredProducts.length]
  )

  // Keyboard navigation
  useEffect(() => {
    if (!open) return

    const handleKeyDown = (e: KeyboardEvent) => {
      // Escape or F1 closes the picker
      if (e.key === 'Escape' || e.key === 'F1') {
        e.preventDefault()
        e.stopPropagation()
        onClose()
        return
      }

      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setSelectedIndex((prev) => {
          const next = Math.min(prev + 1, Math.max(0, filteredProducts.length - 1))
          if (next >= renderLimit - 5) {
            setRenderLimit((lim) => Math.min(filteredProducts.length, lim + CHUNK_INCREMENT))
          }
          return next
        })
        return
      }

      if (e.key === 'ArrowUp') {
        e.preventDefault()
        setSelectedIndex((prev) => Math.max(prev - 1, 0))
        return
      }

      if (e.key === 'PageDown') {
        e.preventDefault()
        setSelectedIndex((prev) => {
          const next = Math.min(prev + 8, Math.max(0, filteredProducts.length - 1))
          if (next >= renderLimit - 5) {
            setRenderLimit((lim) => Math.min(filteredProducts.length, lim + CHUNK_INCREMENT))
          }
          return next
        })
        return
      }

      if (e.key === 'PageUp') {
        e.preventDefault()
        setSelectedIndex((prev) => Math.max(prev - 8, 0))
        return
      }

      if (e.key === 'Enter') {
        e.preventDefault()
        const selected = filteredProducts[selectedIndex]
        if (selected) {
          onSelectProduct(selected)
          onClose()
        }
        return
      }
    }

    window.addEventListener('keydown', handleKeyDown, true)
    return () => window.removeEventListener('keydown', handleKeyDown, true)
  }, [open, filteredProducts, selectedIndex, renderLimit, onClose, onSelectProduct])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-150 select-none"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className="relative flex flex-col w-full max-w-6xl h-[86vh] max-h-[860px] rounded-2xl border border-white/10 bg-[#0A0E17]/95 shadow-2xl overflow-hidden">
        {/* Header Bar */}
        <div className="flex items-center justify-between border-b border-ink-line/80 px-6 py-4 bg-ink-950/70">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shadow-inner">
              <PackageSearch className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white tracking-tight">
                  Inventory Spotlight Explorer
                </h2>
                <span className="rounded-full bg-emerald-500/20 border border-emerald-500/30 px-2 py-0.5 text-[11px] font-semibold text-emerald-300 font-mono">
                  F1 Quick Picker
                </span>
                <span className="rounded-full bg-ink-800 border border-ink-line px-2 py-0.5 text-[11px] text-slate-400">
                  {effectiveCatalog.length} Products Active
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Browse catalog, audit stock levels, and press{' '}
                <kbd className="px-1 py-0.5 rounded bg-ink-800 border border-ink-line text-[10px] text-white font-mono">
                  Enter
                </kbd>{' '}
                to select into invoice with automatic quantity focus.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              title="Close (Esc / F1)"
              className="flex items-center gap-1.5 rounded-xl border border-ink-line bg-ink-850 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:bg-ink-750 hover:text-white transition-colors"
            >
              <span>Close</span>
              <kbd className="rounded bg-ink-900 px-1.5 py-0.5 text-[10px] font-mono text-slate-400 border border-ink-line">
                Esc
              </kbd>
              <X className="h-4 w-4 ml-0.5" />
            </button>
          </div>
        </div>

        {/* Omnibox Search Bar */}
        <div className="border-b border-ink-line/80 px-6 py-3.5 bg-ink-900/40">
          <div className="relative flex items-center">
            <Search className="pointer-events-none absolute left-4 h-5 w-5 text-emerald-400" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by product name, barcode, SKU, category... (Type or scan barcode)"
              className="w-full rounded-xl border border-white/10 bg-ink-950/80 pl-12 pr-10 py-3 text-sm font-medium text-white placeholder-slate-500 outline-none transition-all focus:border-emerald-500/60 focus:ring-2 focus:ring-emerald-500/20 shadow-inner"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('')
                  searchInputRef.current?.focus()
                }}
                className="absolute right-3 rounded-lg p-1 text-slate-400 hover:bg-ink-800 hover:text-white transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Category & Status Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pt-3 pb-1 scrollbar-none text-xs">
            <button
              type="button"
              onClick={() => setSelectedCategory('ALL')}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-medium transition-all shrink-0 ${
                selectedCategory === 'ALL'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'bg-ink-850 text-slate-400 hover:bg-ink-750 hover:text-slate-200 border border-ink-line/60'
              }`}
            >
              <span>All Items</span>
              <span className="rounded-full bg-black/20 px-1.5 py-0.2 text-[10px] font-mono">
                {products.length}
              </span>
            </button>

            {lowStockCount > 0 && (
              <button
                type="button"
                onClick={() => setSelectedCategory('LOW_STOCK')}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-medium transition-all shrink-0 ${
                  selectedCategory === 'LOW_STOCK'
                    ? 'bg-amber-600 text-white shadow-md'
                    : 'bg-amber-500/10 text-amber-300 hover:bg-amber-500/20 border border-amber-500/30'
                }`}
              >
                <AlertTriangle className="h-3.5 w-3.5 text-amber-400" />
                <span>Low / Out of Stock</span>
                <span className="rounded-full bg-amber-950/60 border border-amber-500/40 px-1.5 py-0.2 text-[10px] font-mono font-bold text-amber-200">
                  {lowStockCount}
                </span>
              </button>
            )}

            <div className="h-4 w-px bg-white/10 shrink-0 mx-1" />

            {categories.slice(0, 10).map((cat) => (
              <button
                key={cat.name}
                type="button"
                onClick={() => setSelectedCategory(cat.name)}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-medium transition-all shrink-0 ${
                  selectedCategory === cat.name
                    ? 'bg-emerald-600 text-white shadow-md'
                    : 'bg-ink-850 text-slate-400 hover:bg-ink-750 hover:text-slate-200 border border-ink-line/60'
                }`}
              >
                <span>{cat.name}</span>
                <span className="rounded-full bg-black/20 px-1.5 py-0.2 text-[10px] font-mono">
                  {cat.count}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Scrollable Inventory Grid Table with Progressive Loading */}
        <div
          ref={tableContainerRef}
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto px-6 py-2"
        >
          {filteredProducts.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-center">
              <PackageSearch className="h-12 w-12 text-slate-600 mb-3" />
              <p className="text-sm font-semibold text-slate-300">No matching products found</p>
              <p className="text-xs text-slate-500 mt-1 max-w-sm">
                No inventory item matched &ldquo;{searchQuery}&rdquo; in the selected filter. Try another keyword or scan a barcode.
              </p>
            </div>
          ) : (
            <table className="w-full border-collapse text-left text-xs">
              <thead className="sticky top-0 z-10 bg-[#0A0E17] text-[11px] font-semibold uppercase tracking-wider text-slate-400 border-b border-ink-line">
                <tr>
                  <th className="py-2.5 pl-3 pr-4">Product Name & Barcode</th>
                  <th className="py-2.5 px-3">Category</th>
                  <th className="py-2.5 px-3">Current Stock</th>
                  <th className="py-2.5 px-3">Base Unit</th>
                  <th className="py-2.5 px-3 text-right">Purchase Cost</th>
                  <th className="py-2.5 px-3 text-right">Retail SRP</th>
                  <th className="py-2.5 px-3 text-right">Markup %</th>
                  <th className="py-2.5 pr-3 pl-2 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-line/40">
                {displayedProducts.map((p, idx) => {
                  const isSelected = idx === selectedIndex
                  const isLow = p.stock <= (p.low_stock_threshold ?? 5)
                  const isOut = p.stock <= 0
                  const marginPct =
                    p.default_price_c > 0 && p.purchase_cost_c > 0
                      ? Math.round(
                          ((p.default_price_c - p.purchase_cost_c) / p.default_price_c) * 100
                        )
                      : 0

                  return (
                    <tr
                      key={p.id}
                      ref={(el) => {
                        rowRefs.current[idx] = el
                      }}
                      onClick={() => {
                        setSelectedIndex(idx)
                        onSelectProduct(p)
                        onClose()
                      }}
                      onMouseEnter={() => setSelectedIndex(idx)}
                      className={`cursor-pointer transition-colors ${
                        isSelected
                          ? 'bg-emerald-600/20 text-white font-medium ring-1 ring-inset ring-emerald-500/50'
                          : 'text-slate-300 hover:bg-ink-850/60'
                      }`}
                    >
                      {/* Product Name & Barcode */}
                      <td className="py-2.5 pl-3 pr-4">
                        <div className="flex flex-col">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-white text-[13px]">{p.name}</span>
                            {p.sku && (
                              <span className="rounded bg-ink-800 px-1.5 py-0.2 text-[10px] font-mono text-slate-400 border border-ink-line/60">
                                {p.sku}
                              </span>
                            )}
                          </div>
                          {p.barcode && (
                            <div className="flex items-center gap-1.5 mt-0.5 text-[11px] text-slate-400 font-mono">
                              <Barcode className="h-3 w-3 text-slate-500" />
                              <span>{p.barcode}</span>
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Category */}
                      <td className="py-2.5 px-3">
                        <span className="inline-flex items-center gap-1 rounded-md bg-ink-850 px-2 py-0.5 text-[11px] text-slate-300 border border-ink-line/50">
                          <Tag className="h-2.5 w-2.5 text-slate-500" />
                          <span>{p.category_name || 'General'}</span>
                        </span>
                      </td>

                      {/* Stock Level with Apple-Grade Status Badge */}
                      <td className="py-2.5 px-3">
                        {isOut ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-rose-500/15 border border-rose-500/30 px-2 py-0.5 text-[11px] font-bold text-rose-300">
                            <AlertCircle className="h-3 w-3 text-rose-400" />
                            <span>Out of Stock (0)</span>
                          </span>
                        ) : isLow ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 border border-amber-500/30 px-2 py-0.5 text-[11px] font-bold text-amber-300">
                            <AlertTriangle className="h-3 w-3 text-amber-400" />
                            <span>Low: {p.stock}</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 text-[11px] font-semibold text-emerald-300">
                            <Check className="h-3 w-3 text-emerald-400" />
                            <span>{p.stock} on hand</span>
                          </span>
                        )}
                      </td>

                      {/* Base Unit */}
                      <td className="py-2.5 px-3 font-mono text-slate-400">
                        {p.base_unit || 'pc'}
                      </td>

                      {/* Purchase Cost */}
                      <td className="py-2.5 px-3 text-right font-mono font-semibold text-slate-200">
                        {money(p.purchase_cost_c)}
                      </td>

                      {/* Retail SRP */}
                      <td className="py-2.5 px-3 text-right font-mono font-semibold text-emerald-400">
                        {money(p.default_price_c)}
                      </td>

                      {/* Margin % */}
                      <td className="py-2.5 px-3 text-right font-mono">
                        <span
                          className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${
                            marginPct > 20
                              ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                              : marginPct > 10
                                ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30'
                                : 'bg-slate-700/50 text-slate-400'
                          }`}
                        >
                          {marginPct > 0 ? `+${marginPct}%` : '0%'}
                        </span>
                      </td>

                      {/* Select Action */}
                      <td className="py-2.5 pr-3 pl-2 text-center">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            onSelectProduct(p)
                            onClose()
                          }}
                          className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-bold transition-all ${
                            isSelected
                              ? 'bg-emerald-500 text-slate-950 shadow-md hover:bg-emerald-400 active:scale-95'
                              : 'bg-ink-800 text-slate-300 hover:bg-ink-750 hover:text-white border border-ink-line'
                          }`}
                        >
                          <span>Select</span>
                          <CornerDownLeft className="h-3 w-3" />
                        </button>
                      </td>
                    </tr>
                  )
                })}

                {filteredProducts.length > displayedProducts.length && (
                  <tr className="bg-ink-950/40 text-center text-slate-500 font-mono text-[11px]">
                    <td colSpan={8} className="py-2.5">
                      Showing first {displayedProducts.length} of {filteredProducts.length} items. Scroll down or type to filter more…
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>

        {/* Footer Navigation Hints */}
        <div className="flex flex-wrap items-center justify-between border-t border-ink-line/80 px-6 py-3 bg-ink-950/80 text-[11px] text-slate-400">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5">
              <kbd className="rounded bg-ink-850 border border-ink-line px-1.5 py-0.5 font-mono text-white text-[10px]">
                ↑ / ↓
              </kbd>
              <span>Navigate</span>
            </span>

            <span className="flex items-center gap-1.5">
              <kbd className="rounded bg-ink-850 border border-ink-line px-1.5 py-0.5 font-mono text-white text-[10px]">
                ↵ Enter
              </kbd>
              <span>Choose & Focus Qty</span>
            </span>

            <span className="flex items-center gap-1.5">
              <kbd className="rounded bg-ink-850 border border-ink-line px-1.5 py-0.5 font-mono text-white text-[10px]">
                Esc / F1
              </kbd>
              <span>Close</span>
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span>
              Showing <strong className="text-white font-mono">{displayedProducts.length}</strong> of{' '}
              <strong className="text-white font-mono">{filteredProducts.length}</strong> matching (
              <span className="text-slate-500 font-mono">{products.length} catalog</span>)
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
