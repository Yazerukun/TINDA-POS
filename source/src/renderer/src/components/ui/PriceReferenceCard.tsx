import { useMemo } from 'react'
import { ExternalLink, Sparkles, AlertCircle, CheckCircle2, TrendingDown, TrendingUp, Info } from 'lucide-react'
import type { PriceComparisonStatus, PriceReference } from '@shared/types'
import { money } from '@shared/format'
import { ProductImage } from './ProductImage'

export interface PriceReferenceCardProps {
  reference: PriceReference
  currentPriceC?: number | null
  onAdoptPrice?: (priceC: number) => void
  onLink?: () => void
  onUnlink?: () => void
  compact?: boolean
}

export function PriceReferenceCard({
  reference,
  currentPriceC,
  onAdoptPrice,
  onLink,
  onUnlink,
  compact = false
}: PriceReferenceCardProps): React.JSX.Element {
  const comparisonStatus: PriceComparisonStatus = useMemo(() => {
    if (currentPriceC === undefined || currentPriceC === null) return 'NO_REFERENCE'

    if (reference.min_price_c !== null && reference.max_price_c !== null) {
      if (currentPriceC < reference.min_price_c) return 'BELOW_RANGE'
      if (currentPriceC > reference.max_price_c) return 'ABOVE_RANGE'
      return 'WITHIN_RANGE'
    }

    if (reference.market_price_c !== null) {
      if (currentPriceC < reference.market_price_c) return 'BELOW_RANGE'
      if (currentPriceC > reference.market_price_c) return 'ABOVE_RANGE'
      return 'WITHIN_RANGE'
    }

    return 'NO_REFERENCE'
  }, [currentPriceC, reference])

  const isStale = useMemo(() => {
    if (!reference.last_synced_at) return true
    const syncTime = new Date(reference.last_synced_at).getTime()
    // Stale if older than 30 days
    return Date.now() - syncTime > 30 * 24 * 60 * 60 * 1000
  }, [reference.last_synced_at])

  const sourceBadgeColor = useMemo(() => {
    switch (reference.source_type) {
      case 'official':
        return 'bg-blue-500/10 text-blue-400 border-blue-500/30'
      case 'market':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
      case 'reference':
        return 'bg-purple-500/10 text-purple-400 border-purple-500/30'
      default:
        return 'bg-slate-500/10 text-slate-400 border-slate-500/30'
    }
  }, [reference.source_type])

  const comparisonBadge = useMemo(() => {
    if (comparisonStatus === 'WITHIN_RANGE') {
      return (
        <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[11px] font-medium text-emerald-400">
          <CheckCircle2 className="h-3 w-3" /> Within Market Range
        </span>
      )
    }
    if (comparisonStatus === 'BELOW_RANGE') {
      return (
        <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-[11px] font-medium text-amber-400">
          <TrendingDown className="h-3 w-3" /> Below Market Range
        </span>
      )
    }
    if (comparisonStatus === 'ABOVE_RANGE') {
      return (
        <span className="inline-flex items-center gap-1 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-2 py-0.5 text-[11px] font-medium text-indigo-400">
          <TrendingUp className="h-3 w-3" /> Above Market Range
        </span>
      )
    }
    return null
  }, [comparisonStatus])

  if (compact) {
    return (
      <div className="flex items-center justify-between gap-2 rounded-lg border border-ink-line bg-ink-900/40 p-2 text-xs">
        <div className="flex items-center gap-2 min-w-0">
          <ProductImage
            src={reference.image_path || reference.image_url}
            alt={reference.product_name}
            className="h-8 w-8 rounded"
          />
          <div className="min-w-0 truncate">
            <p className="font-medium text-slate-200 truncate">{reference.product_name}</p>
            <p className="text-[10px] text-slate-400">
              Ref: {reference.market_price_c !== null ? money(reference.market_price_c) : 'N/A'}
              {reference.min_price_c !== null && reference.max_price_c !== null && (
                <span> ({money(reference.min_price_c)} – {money(reference.max_price_c)})</span>
              )}
            </p>
          </div>
        </div>
        {comparisonBadge}
      </div>
    )
  }

  return (
    <div className="rounded-lg border border-ink-line bg-ink-900/40 p-3.5 space-y-3">
      {/* Header with Image and Name */}
      <div className="flex items-start gap-3">
        <ProductImage
          src={reference.image_path || reference.image_url}
          alt={reference.product_name}
          className="h-14 w-14 rounded-lg"
        />
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-1.5 mb-1">
            <span className={`badge border text-[10px] px-2 py-0.5 ${sourceBadgeColor}`}>
              {reference.source_name}
            </span>
            {reference.location && (
              <span className="badge border border-slate-700 bg-slate-800/60 text-slate-300 text-[10px] px-2 py-0.5">
                {reference.location}
              </span>
            )}
            {comparisonBadge}
          </div>
          <h4 className="text-sm font-semibold text-white truncate" title={reference.product_name}>
            {reference.product_name}
          </h4>
          <p className="text-xs text-slate-400">
            {[reference.brand, reference.unit, reference.barcode].filter(Boolean).join(' · ')}
          </p>
        </div>
      </div>

      {/* Pricing Information Grid */}
      <div className="grid grid-cols-2 gap-2 rounded-lg border border-ink-line/60 bg-ink-950/40 p-2.5 text-xs">
        <div>
          <span className="text-[11px] text-slate-400">Market Reference Price</span>
          <p className="text-base font-bold text-white">
            {reference.market_price_c !== null ? money(reference.market_price_c) : '—'}
          </p>
        </div>
        <div>
          <span className="text-[11px] text-slate-400">Suggested Price Range</span>
          <p className="text-sm font-semibold text-slate-200">
            {reference.min_price_c !== null && reference.max_price_c !== null ? (
              `${money(reference.min_price_c)} – ${money(reference.max_price_c)}`
            ) : reference.market_price_c !== null ? (
              money(reference.market_price_c)
            ) : (
              '—'
            )}
          </p>
        </div>
      </div>

      {/* Freshness & Stale Data Transparency */}
      <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-400 pt-1 border-t border-ink-line/40">
        <div className="flex items-center gap-1">
          <Info className="h-3.5 w-3.5 text-slate-500" />
          <span>
            {reference.effective_date ? `Updated: ${reference.effective_date}` : `Synced: ${reference.last_synced_at.slice(0, 10)}`}
          </span>
          {isStale && (
            <span className="inline-flex items-center gap-1 text-amber-400 ml-1.5" title="Price data may be outdated">
              <AlertCircle className="h-3 w-3" /> Data may be outdated
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {reference.source_url && (
            <a
              href={reference.source_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-brand-400 hover:text-brand-300 hover:underline"
              title="View source reference page"
            >
              Source <ExternalLink className="h-3 w-3" />
            </a>
          )}

          {onUnlink && (
            <button
              type="button"
              onClick={onUnlink}
              className="text-danger-400 hover:text-danger-300 hover:underline text-[11px]"
            >
              Unlink
            </button>
          )}

          {onLink && (
            <button
              type="button"
              onClick={onLink}
              className="text-brand-400 hover:text-brand-300 hover:underline text-[11px]"
            >
              Link to Product
            </button>
          )}
        </div>
      </div>

      {/* Adopt Reference Price Button */}
      {onAdoptPrice && reference.market_price_c !== null && (
        <button
          type="button"
          onClick={() => onAdoptPrice(reference.market_price_c!)}
          className="btn-ghost w-full py-2 flex items-center justify-center gap-2 text-xs font-medium text-brand-400 hover:text-brand-300 hover:bg-brand-500/10 border border-brand-500/20 rounded-lg transition-colors"
        >
          <Sparkles className="h-3.5 w-3.5" />
          Adopt Reference Price ({money(reference.market_price_c)})
        </button>
      )}
    </div>
  )
}
