import { useCallback, useEffect, useState } from 'react'
import {
  Search,
  RefreshCw,
  Link2,
  Unlink,
  ExternalLink,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  Filter,
  Package,
  Layers
} from 'lucide-react'
import type { PriceReference, PriceSourceType, Product } from '@shared/types'
import { money } from '@shared/format'
import { Modal } from './ui/Modal'
import { ProductImage } from './ui/ProductImage'
import { toastError, toastSuccess } from '../stores/toast'

interface PriceGuideModalProps {
  open: boolean
  onClose: () => void
  products: Product[]
  onProductsChanged?: () => void
}

export function PriceGuideModal({
  open,
  onClose,
  products,
  onProductsChanged
}: PriceGuideModalProps): React.JSX.Element | null {
  const [references, setReferences] = useState<PriceReference[]>([])
  const [loading, setLoading] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [sourceTypeFilter, setSourceTypeFilter] = useState<PriceSourceType | 'ALL'>('ALL')
  const [linkFilter, setLinkFilter] = useState<'ALL' | 'LINKED' | 'UNLINKED'>('ALL')
  const [linkingRef, setLinkingRef] = useState<PriceReference | null>(null)
  const [linkingSearch, setLinkingSearch] = useState('')
  const [status, setStatus] = useState<{
    total: number
    last_synced_at: string | null
    is_stale: boolean
    sources: { source_name: string; count: number }[]
  }>({
    total: 0,
    last_synced_at: null,
    is_stale: false,
    sources: []
  })

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const [res, stat] = await Promise.all([
        window.api.priceReferences.search({
          query: searchQuery,
          sourceType: sourceTypeFilter === 'ALL' ? undefined : sourceTypeFilter,
          linkedOnly: linkFilter === 'LINKED',
          unlinkedOnly: linkFilter === 'UNLINKED',
          limit: 100
        }),
        window.api.priceReferences.status()
      ])
      const rows = res?.rows || (res as any)?.references || []
      setReferences(Array.isArray(rows) ? rows : [])
      if (stat) setStatus(stat)
    } catch (e) {
      toastError('Failed to load price references', String((e as Error)?.message || e))
      setReferences([])
    } finally {
      setLoading(false)
    }
  }, [searchQuery, sourceTypeFilter, linkFilter])

  useEffect(() => {
    if (open) {
      void loadData()
    }
  }, [open, loadData])

  const handleSync = async () => {
    if (syncing) return
    setSyncing(true)
    try {
      const res = await window.api.priceReferences.sync()
      if (res.is_offline) {
        toastError('Offline Mode', res.message || 'Offline — Showing Last Saved Data')
      } else if (res.success) {
        toastSuccess('Sync Complete', res.message)
      } else {
        toastError('Sync Failed', res.errors.join('; ') || 'Could not synchronize.')
      }
      await loadData()
    } catch (e) {
      toastError('Sync Error', String((e as Error)?.message || e))
    } finally {
      setSyncing(false)
    }
  }

  const handleLinkProduct = async (referenceId: number, productId: number) => {
    try {
      await window.api.priceReferences.link(referenceId, productId)
      toastSuccess('Price reference linked to product')
      setLinkingRef(null)
      await loadData()
      onProductsChanged?.()
    } catch (e) {
      toastError('Linking failed', String((e as Error)?.message || e))
    }
  }

  const handleUnlinkProduct = async (referenceId: number) => {
    try {
      await window.api.priceReferences.unlink(referenceId)
      toastSuccess('Price reference unlinked')
      await loadData()
      onProductsChanged?.()
    } catch (e) {
      toastError('Unlinking failed', String((e as Error)?.message || e))
    }
  }

  if (!open) return null

  const filteredProductsForLinking = (Array.isArray(products) ? products : []).filter((p) => {
    if (!linkingSearch) return true
    const q = linkingSearch.toLowerCase()
    return (
      p.name.toLowerCase().includes(q) ||
      (p.barcode || '').toLowerCase().includes(q) ||
      p.sku.toLowerCase().includes(q)
    )
  })

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Online Price Guide / Market Price Reference"
      maxWidth="max-w-4xl"
      footer={
        <div className="flex items-center justify-between w-full">
          <div className="text-xs text-slate-400">
            {status.last_synced_at ? (
              <span>Last synchronized: {status.last_synced_at.slice(0, 16)}</span>
            ) : (
              <span>Not yet synchronized</span>
            )}
            {status.is_stale && (
              <span className="ml-2 text-amber-400 inline-flex items-center gap-1">
                <AlertCircle className="h-3 w-3" /> Price data may be outdated
              </span>
            )}
          </div>
          <button type="button" onClick={onClose} className="btn-ghost">
            Close
          </button>
        </div>
      }
    >
      <div className="space-y-4">
        {/* Top Control Bar: Search, Filters, and Sync Button */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search reference by name, brand, barcode…"
              className="input w-full pl-9"
            />
          </div>

          <select
            value={sourceTypeFilter}
            onChange={(e) => setSourceTypeFilter(e.target.value as PriceSourceType | 'ALL')}
            className="input text-xs"
          >
            <option value="ALL">All Sources</option>
            <option value="official">Official (DTI SRP)</option>
            <option value="market">Market Reference</option>
            <option value="reference">General Reference</option>
          </select>

          <select
            value={linkFilter}
            onChange={(e) => setLinkFilter(e.target.value as 'ALL' | 'LINKED' | 'UNLINKED')}
            className="input text-xs"
          >
            <option value="ALL">All Items</option>
            <option value="LINKED">Linked to Products</option>
            <option value="UNLINKED">Unlinked</option>
          </select>

          <button
            type="button"
            onClick={() => void handleSync()}
            disabled={syncing}
            className="btn-primary flex items-center gap-1.5 text-xs px-3 py-2"
            title="Synchronize price guide with latest market/DTI data"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${syncing ? 'animate-spin' : ''}`} />
            {syncing ? 'Syncing…' : 'Sync Price Guide'}
          </button>
        </div>

        {/* Offline & Transparency Banner */}
        <div className="rounded-lg border border-brand-500/20 bg-brand-500/5 p-3 text-xs text-slate-300 flex items-start gap-2.5">
          <Sparkles className="h-4 w-4 text-brand-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-semibold text-slate-200">
              Offline-First Market Price Reference
            </p>
            <p className="text-slate-400 text-[11px]">
              This price guide is strictly advisory and will never automatically change or overwrite your store's selling prices. Price data is cached locally so you can consult market references even when completely offline.
            </p>
          </div>
        </div>

        {/* Results List */}
        <div className="max-h-[55vh] overflow-y-auto space-y-2 pr-1">
          {loading && (
            <p className="py-12 text-center text-sm text-slate-400">Loading price references…</p>
          )}

          {!loading && (!references || references.length === 0) && (
            <div className="py-12 text-center space-y-2">
              <Layers className="h-8 w-8 text-slate-600 mx-auto" />
              <p className="text-sm font-medium text-slate-300">No price references found</p>
              <p className="text-xs text-slate-500">
                Try searching with different keywords or click "Sync Price Guide" to import standard reference prices.
              </p>
            </div>
          )}

          {!loading &&
            Array.isArray(references) &&
            references.map((ref) => {
              const linkedProduct = ref.product_id
                ? (Array.isArray(products) ? products : []).find((p) => p.id === ref.product_id)
                : null

              return (
                <div
                  key={ref.id}
                  className="rounded-lg border border-ink-line bg-ink-900/40 p-3 hover:border-slate-600 transition-colors"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 min-w-0 flex-1">
                      <ProductImage
                        src={ref.image_path || ref.image_url}
                        alt={ref.product_name}
                        className="h-12 w-12 rounded-lg"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-1.5 mb-1">
                          <span
                            className={`badge border text-[10px] px-2 py-0.5 ${
                              ref.source_type === 'official'
                                ? 'bg-blue-500/10 text-blue-400 border-blue-500/30'
                                : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                            }`}
                          >
                            {ref.source_name}
                          </span>
                          {ref.location && (
                            <span className="badge border border-slate-700 bg-slate-800 text-slate-300 text-[10px] px-2 py-0.5">
                              {ref.location}
                            </span>
                          )}
                          {ref.effective_date && (
                            <span className="text-[10px] text-slate-500">
                              Updated: {ref.effective_date}
                            </span>
                          )}
                        </div>

                        <h4 className="text-sm font-semibold text-white truncate" title={ref.product_name}>
                          {ref.product_name}
                        </h4>
                        <p className="text-xs text-slate-400">
                          {[ref.brand, ref.unit, ref.barcode ? `Barcode: ${ref.barcode}` : null]
                            .filter(Boolean)
                            .join(' · ')}
                        </p>
                      </div>
                    </div>

                    {/* Price Info */}
                    <div className="text-right shrink-0">
                      <span className="text-[10px] text-slate-400 block">Market Price</span>
                      <span className="text-base font-bold text-white block">
                        {ref.market_price_c !== null ? money(ref.market_price_c) : '—'}
                      </span>
                      {ref.min_price_c !== null && ref.max_price_c !== null && (
                        <span className="text-[11px] text-slate-400 block">
                          Range: {money(ref.min_price_c)} – {money(ref.max_price_c)}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Footer: Linked Product Info and Actions */}
                  <div className="mt-2.5 pt-2 border-t border-ink-line/60 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5 min-w-0">
                      {linkedProduct ? (
                        <div className="flex items-center gap-1.5 text-emerald-400 truncate">
                          <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                          <span className="text-slate-400">Linked to:</span>
                          <span className="font-medium text-slate-200 truncate">
                            {linkedProduct.name} ({money(linkedProduct.default_price_c)})
                          </span>
                        </div>
                      ) : (
                        <span className="text-slate-500 text-[11px]">Not linked to your inventory</span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      {ref.source_url && (
                        <a
                          href={ref.source_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-brand-400 hover:text-brand-300 inline-flex items-center gap-1 text-[11px]"
                        >
                          Source <ExternalLink className="h-3 w-3" />
                        </a>
                      )}

                      {linkedProduct ? (
                        <button
                          type="button"
                          onClick={() => void handleUnlinkProduct(ref.id)}
                          className="btn-ghost text-xs text-danger-400 hover:text-danger-300 py-1 px-2 flex items-center gap-1"
                        >
                          <Unlink className="h-3 w-3" /> Unlink
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            setLinkingRef(ref)
                            setLinkingSearch(ref.product_name)
                          }}
                          className="btn-ghost text-xs text-brand-400 hover:text-brand-300 py-1 px-2 flex items-center gap-1"
                        >
                          <Link2 className="h-3 w-3" /> Link to Product
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
        </div>
      </div>

      {/* Product Selector Sub-Modal for Linking */}
      {linkingRef && (
        <Modal
          open={Boolean(linkingRef)}
          onClose={() => setLinkingRef(null)}
          title={`Link "${linkingRef.product_name}" to Product`}
          maxWidth="max-w-md"
          footer={
            <button type="button" onClick={() => setLinkingRef(null)} className="btn-ghost">
              Cancel
            </button>
          }
        >
          <div className="space-y-3">
            <p className="text-xs text-slate-400">
              Select a product from your inventory to link with this market price reference:
            </p>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                value={linkingSearch}
                onChange={(e) => setLinkingSearch(e.target.value)}
                placeholder="Search products…"
                className="input w-full pl-9 text-xs"
                autoFocus
              />
            </div>

            <div className="max-h-60 overflow-y-auto space-y-1.5 pr-1">
              {filteredProductsForLinking.length === 0 && (
                <p className="py-6 text-center text-xs text-slate-500">No matching products.</p>
              )}
              {filteredProductsForLinking.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between rounded-lg border border-ink-line p-2 hover:bg-ink-800/60 transition-colors"
                >
                  <div className="min-w-0 flex-1 pr-2">
                    <p className="text-xs font-medium text-slate-200 truncate">{p.name}</p>
                    <p className="text-[10px] text-slate-400">
                      Price: {money(p.default_price_c)} · Barcode: {p.barcode || '—'}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => void handleLinkProduct(linkingRef.id, p.id)}
                    className="btn-primary text-xs px-2.5 py-1"
                  >
                    Select
                  </button>
                </div>
              ))}
            </div>
          </div>
        </Modal>
      )}
    </Modal>
  )
}
