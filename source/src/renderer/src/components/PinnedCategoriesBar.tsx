import { useState } from 'react'
import {
  Sparkles,
  SlidersHorizontal,
  Pin,
  ChevronRight,
  Package
} from 'lucide-react'
import type { Category } from '@shared/types'
import {
  CATEGORY_COLOR_STYLES,
  getCategoryStyle,
  getCategoryCustomizations,
  getCategoryVisuals
} from '../utils/categoryCustomization'
import { useSettings } from '../stores/settings'
import { CustomizeCategoriesModal } from './CustomizeCategoriesModal'

interface PinnedCategoriesBarProps {
  categories: Category[]
  productsCountMap: Record<number | 'ALL', number>
  totalActiveCount: number
  activeCategory: number | 'ALL'
  onSelectCategory: (catId: number | 'ALL') => void
  onCategoriesChanged: () => Promise<void>
}

export function PinnedCategoriesBar({
  categories,
  productsCountMap,
  totalActiveCount,
  activeCategory,
  onSelectCategory,
  onCategoriesChanged
}: PinnedCategoriesBarProps): React.JSX.Element {
  const { settings } = useSettings()
  const [modalOpen, setModalOpen] = useState(false)
  const customMap = getCategoryCustomizations()

  const pinnedIds: number[] = settings?.pos_pinned_categories || []

  // Resolve pinned category objects in order
  const pinnedCategories = pinnedIds
    .map((id) => categories.find((c) => c.id === id))
    .filter((c): c is Category => c !== undefined)

  return (
    <>
      <div className="mb-3 flex items-center justify-between gap-2 rounded-xl border border-ink-line bg-ink-900/60 p-1.5 shadow-sm">
        {/* Horizontal Scrollable Chips Container */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5 min-w-0 flex-1">
          {/* 'All Items' Master Chip */}
          <button
            type="button"
            onClick={() => onSelectCategory('ALL')}
            className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-bold transition-all shrink-0 ${
              activeCategory === 'ALL'
                ? 'border-brand-400 bg-brand-500/25 text-brand-200 ring-2 ring-brand-400/40 shadow-sm shadow-brand-500/20'
                : 'border-ink-line bg-ink-800/80 text-slate-300 hover:bg-ink-700 hover:border-slate-500'
            }`}
            title="Show all items in store"
          >
            <Sparkles className="h-3.5 w-3.5 text-brand-400" />
            <span>All Items</span>
            <span
              className={`ml-0.5 rounded-full px-1.5 py-0.2 text-[10px] font-bold ${
                activeCategory === 'ALL'
                  ? 'bg-brand-500/30 text-brand-100'
                  : 'bg-ink-700 text-slate-400'
              }`}
            >
              {totalActiveCount}
            </span>
          </button>

          {/* Pinned Category Chips */}
          {pinnedCategories.map((category) => {
            const isActive = activeCategory === category.id
            const visuals = getCategoryVisuals(category.name, customMap[category.id])
            const style = getCategoryStyle(visuals.color)
            const count = productsCountMap[category.id] || 0

            return (
              <button
                key={category.id}
                type="button"
                onClick={() => onSelectCategory(category.id)}
                className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-bold transition-all shrink-0 select-none ${
                  isActive ? style.active : style.inactive
                }`}
                title={`Filter by ${category.name}`}
              >
                <span className="text-sm leading-none">{visuals.icon}</span>
                <span className="truncate max-w-[140px]">{category.name}</span>
                <span
                  className={`ml-0.5 rounded-full px-1.5 py-0.2 text-[10px] font-bold ${
                    isActive ? style.badge : 'bg-ink-800/80 text-slate-400'
                  }`}
                >
                  {count}
                </span>
                {visuals.isBundle && (
                  <span className="h-1.5 w-1.5 rounded-full bg-purple-400 animate-pulse" title="Bundle" />
                )}
              </button>
            )
          })}

          {/* Prompt if zero categories are pinned yet */}
          {pinnedCategories.length === 0 && (
            <button
              type="button"
              onClick={() => setModalOpen(true)}
              className="flex items-center gap-1.5 rounded-lg border border-dashed border-indigo-500/50 bg-indigo-500/10 px-3 py-1.5 text-xs font-semibold text-indigo-300 hover:bg-indigo-500/20 transition-all shrink-0"
            >
              <Package className="h-3.5 w-3.5 text-indigo-400" />
              <span>+ Pin Packages & Bundles</span>
            </button>
          )}
        </div>

        {/* Customize / Manage Pinned Button */}
        <button
          type="button"
          onClick={() => setModalOpen(true)}
          className="flex items-center gap-1.5 rounded-lg border border-ink-line bg-ink-850 px-2.5 py-1.5 text-xs font-semibold text-slate-300 hover:border-brand-500/50 hover:text-white transition-all shrink-0"
          title="Customize Pinned Categories & Bundles"
        >
          <SlidersHorizontal className="h-3.5 w-3.5 text-brand-400" />
          <span className="hidden sm:inline">Customize</span>
        </button>
      </div>

      {/* Modal */}
      <CustomizeCategoriesModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        categories={categories}
        productsCountMap={productsCountMap as Record<number, number>}
        onCategoriesChanged={onCategoriesChanged}
      />
    </>
  )
}
