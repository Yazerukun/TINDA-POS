import { useState, useEffect } from 'react'
import {
  X,
  Plus,
  Pin,
  PinOff,
  Trash2,
  Package,
  Sparkles,
  SlidersHorizontal,
  Check,
  Search
} from 'lucide-react'
import type { Category } from '@shared/types'
import {
  EMOJI_PRESETS,
  COLOR_PRESETS,
  CATEGORY_COLOR_STYLES,
  getCategoryStyle,
  getCategoryCustomizations,
  saveCategoryCustomization,
  getCategoryVisuals,
  reconcilePinnedCategoryIds,
  savePinnedCategoryIds,
  togglePinnedCategoryId,
  PINNED_CATEGORIES_CHANGED_EVENT,
  type CategoryCustomization
} from '../utils/categoryCustomization'
import { useSettings } from '../stores/settings'
import { toastSuccess, toastError } from '../stores/toast'

interface CustomizeCategoriesModalProps {
  open: boolean
  onClose: () => void
  categories: Category[]
  productsCountMap: Record<number, number>
  onCategoriesChanged: () => Promise<void>
}

export function CustomizeCategoriesModal({
  open,
  onClose,
  categories,
  productsCountMap,
  onCategoriesChanged
}: CustomizeCategoriesModalProps): React.JSX.Element | null {
  const { settings, update: updateSettings } = useSettings()
  const [searchTerm, setSearchTerm] = useState('')
  const [newCatName, setNewCatName] = useState('')
  const [newCatIcon, setNewCatIcon] = useState('📦')
  const [newCatColor, setNewCatColor] = useState<'indigo' | 'emerald' | 'amber' | 'rose' | 'cyan' | 'violet' | 'slate'>('indigo')
  const [newCatAutoPin, setNewCatAutoPin] = useState(true)
  const [creating, setCreating] = useState(false)
  const [customMap, setCustomMap] = useState(getCategoryCustomizations)
  const [pinnedIds, setPinnedIds] = useState<number[]>(() =>
    reconcilePinnedCategoryIds(settings?.pos_pinned_categories)
  )

  useEffect(() => {
    setPinnedIds(reconcilePinnedCategoryIds(settings?.pos_pinned_categories))
  }, [settings?.pos_pinned_categories])

  useEffect(() => {
    const handleSync = () => {
      setPinnedIds(reconcilePinnedCategoryIds(settings?.pos_pinned_categories))
    }
    window.addEventListener(PINNED_CATEGORIES_CHANGED_EVENT, handleSync)
    return () => window.removeEventListener(PINNED_CATEGORIES_CHANGED_EVENT, handleSync)
  }, [settings?.pos_pinned_categories])

  if (!open) return null

  const togglePin = async (categoryId: number) => {
    try {
      const isCurrentlyPinned = pinnedIds.some((id) => Number(id) === Number(categoryId))
      const nextPinned = await togglePinnedCategoryId(categoryId, pinnedIds, updateSettings)
      setPinnedIds(nextPinned)
      toastSuccess(isCurrentlyPinned ? 'Category unpinned from POS' : 'Category pinned to POS bar')
    } catch (err) {
      toastError('Failed to update pinned categories', String((err as Error)?.message || err))
    }
  }

  const handleUpdateStyle = (
    categoryId: number,
    patch: Partial<CategoryCustomization>
  ) => {
    saveCategoryCustomization(categoryId, patch)
    setCustomMap(getCategoryCustomizations())
  }

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = newCatName.trim()
    if (!trimmed) {
      toastError('Category name is required')
      return
    }

    setCreating(true)
    try {
      const created = await window.api.categories.create(trimmed)
      saveCategoryCustomization(created.id, {
        icon: newCatIcon,
        color: newCatColor
      })
      setCustomMap(getCategoryCustomizations())

      if (newCatAutoPin) {
        const nextPinned = await savePinnedCategoryIds([...pinnedIds, created.id], updateSettings)
        setPinnedIds(nextPinned)
      }

      setNewCatName('')
      await onCategoriesChanged()
      toastSuccess(`Category "${created.name}" created and pinned!`)
    } catch (err) {
      toastError('Failed to create category', String((err as Error)?.message || err))
    } finally {
      setCreating(false)
    }
  }

  const handleDeleteCategory = async (cat: Category) => {
    const count = productsCountMap[cat.id] || 0
    if (count > 0) {
      toastError('Cannot delete category', `This category currently has ${count} product(s). Move products first.`)
      return
    }

    if (!confirm(`Delete category "${cat.name}"? This action cannot be undone.`)) return

    try {
      await window.api.categories.remove(cat.id)
      if (pinnedIds.some((id) => Number(id) === Number(cat.id))) {
        const nextPinned = await savePinnedCategoryIds(
          pinnedIds.filter((id) => Number(id) !== Number(cat.id)),
          updateSettings
        )
        setPinnedIds(nextPinned)
      }
      await onCategoriesChanged()
      toastSuccess(`Category "${cat.name}" removed`)
    } catch (err) {
      toastError('Failed to delete category', String((err as Error)?.message || err))
    }
  }

  const handlePinAllDetectedBundles = async () => {
    const bundleCategoryIds = categories
      .filter((c) => {
        const vis = getCategoryVisuals(c.name, customMap[c.id])
        return vis.isBundle && !pinnedIds.some((id) => Number(id) === Number(c.id))
      })
      .map((c) => c.id)

    if (bundleCategoryIds.length === 0) return

    const nextPinned = await savePinnedCategoryIds(
      Array.from(new Set([...pinnedIds, ...bundleCategoryIds])),
      updateSettings
    )
    setPinnedIds(nextPinned)
    toastSuccess(`Pinned ${bundleCategoryIds.length} bundle categories to POS!`)
  }

  const filteredCategories = categories.filter((c) =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase().trim())
  )

  const unpinnedBundlesCount = categories.filter((c) => {
    const vis = getCategoryVisuals(c.name, customMap[c.id])
    return vis.isBundle && !pinnedIds.some((id) => Number(id) === Number(c.id))
  }).length

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-md animate-fadeIn"
      role="dialog"
      aria-modal="true"
    >
      <div className="flex max-h-[90vh] w-full max-w-2xl flex-col rounded-2xl border border-ink-line bg-gradient-to-b from-ink-900 via-ink-850 to-ink-950 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-ink-line px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-400">
              <SlidersHorizontal className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
                Customize Pinned Categories & Bundles
                <span className="badge border border-indigo-500/40 bg-indigo-500/10 text-indigo-300 text-[10px] font-bold">
                  {pinnedIds.length} Pinned
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Personalize your quick-access bar in POS. Pin package, bundle, and frequent categories.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="btn-ghost-2 rounded-lg p-2 text-slate-400 hover:text-white"
            title="Close (Esc)"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Unpinned Bundles Accelerator Banner */}
          {unpinnedBundlesCount > 0 && (
            <div className="flex items-center justify-between rounded-xl border border-indigo-500/30 bg-gradient-to-r from-indigo-950/60 to-purple-950/40 p-3">
              <div className="flex items-center gap-2.5">
                <span className="text-xl">📦</span>
                <div>
                  <p className="text-xs font-bold text-indigo-200">
                    {unpinnedBundlesCount} Package/Bundle category detected
                  </p>
                  <p className="text-[11px] text-indigo-300/80">
                    Pin them to your POS screen for 1-tap checkout access.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handlePinAllDetectedBundles}
                className="flex items-center gap-1.5 rounded-lg border border-indigo-400/50 bg-indigo-500/30 px-3 py-1.5 text-xs font-bold text-indigo-100 hover:bg-indigo-500/40 transition-all shadow-sm"
              >
                <Pin className="h-3.5 w-3.5" />
                Pin All Bundles
              </button>
            </div>
          )}

          {/* Section 1: Add New Category / Bundle Form */}
          <div className="rounded-xl border border-ink-line bg-ink-900/60 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                <Plus className="h-3.5 w-3.5 text-brand-400" />
                Create New Category or Bundle
              </h3>
              <span className="text-[11px] text-slate-500">Auto-pins to POS quick bar</span>
            </div>

            <form onSubmit={handleCreateCategory} className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <input
                    value={newCatName}
                    onChange={(e) => setNewCatName(e.target.value)}
                    placeholder="e.g. Merienda Bundle, Grocery Package, Promo Pack..."
                    className="input w-full pl-3 text-sm"
                    autoFocus
                  />
                </div>
                <button
                  type="submit"
                  disabled={creating || !newCatName.trim()}
                  className="btn-primary flex items-center gap-1.5 px-4 text-xs font-bold shrink-0"
                >
                  <Plus className="h-4 w-4" />
                  {creating ? 'Creating...' : 'Create & Pin'}
                </button>
              </div>

              {/* Emoji & Color Customizers */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                {/* Emoji Preset Selector */}
                <div>
                  <p className="text-[11px] font-semibold text-slate-400 mb-1.5">Choose Icon / Emoji:</p>
                  <div className="flex flex-wrap gap-1">
                    {EMOJI_PRESETS.map((emoji) => (
                      <button
                        key={emoji}
                        type="button"
                        onClick={() => setNewCatIcon(emoji)}
                        className={`flex h-8 w-8 items-center justify-center rounded-lg text-base transition-all ${
                          newCatIcon === emoji
                            ? 'border border-brand-400 bg-brand-500/30 ring-2 ring-brand-400/40 scale-105'
                            : 'border border-ink-line bg-ink-800 hover:bg-ink-700'
                        }`}
                        title={emoji}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Color Palette Selector */}
                <div>
                  <p className="text-[11px] font-semibold text-slate-400 mb-1.5">Choose Badge Accent:</p>
                  <div className="flex flex-wrap gap-1.5">
                    {COLOR_PRESETS.map((col) => (
                      <button
                        key={col.id}
                        type="button"
                        onClick={() => setNewCatColor(col.id)}
                        className={`flex items-center gap-1.5 rounded-lg border px-2 py-1 text-xs font-semibold transition-all ${
                          newCatColor === col.id
                            ? `${col.borderPreview} bg-ink-700 ring-2 ring-brand-400/40 text-white font-bold`
                            : 'border-ink-line bg-ink-800 text-slate-300 hover:bg-ink-700'
                        }`}
                      >
                        <span className={`h-2.5 w-2.5 rounded-full ${col.bgPreview}`} />
                        <span className="text-[10px]">{col.name.split(' ')[0]}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </form>
          </div>

          {/* Section 2: Manage Existing Categories */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                <Pin className="h-3.5 w-3.5 text-indigo-400" />
                Active Categories ({categories.length})
              </h3>
              <div className="relative w-48">
                <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-500" />
                <input
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Filter categories..."
                  className="input h-8 w-full pl-8 text-xs"
                />
              </div>
            </div>

            <div className="max-h-72 space-y-2 overflow-y-auto pr-1">
              {filteredCategories.length === 0 && (
                <div className="rounded-xl border border-ink-line p-6 text-center text-sm text-slate-400">
                  {searchTerm ? 'No matching categories found.' : 'No categories created yet.'}
                </div>
              )}

              {filteredCategories.map((category) => {
                const isPinned = pinnedIds.some((id) => Number(id) === Number(category.id))
                const custom = customMap[category.id]
                const visuals = getCategoryVisuals(category.name, custom)
                const count = productsCountMap[category.id] || 0
                const style = getCategoryStyle(visuals.color)

                return (
                  <div
                    key={category.id}
                    className={`flex items-center justify-between gap-3 rounded-xl border p-2.5 transition-all ${
                      isPinned
                        ? 'border-indigo-500/40 bg-indigo-950/20 shadow-sm'
                        : 'border-ink-line bg-ink-900/50 hover:bg-ink-850'
                    }`}
                  >
                    <div className="flex min-w-0 items-center gap-2.5 flex-1">
                      {/* Interactive Emoji Trigger */}
                      <div className="relative group shrink-0">
                        <span className="text-xl cursor-pointer" title="Custom icon">
                          {visuals.icon}
                        </span>
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="truncate text-sm font-bold text-white">
                            {category.name}
                          </span>
                          {visuals.isBundle && (
                            <span className="badge border border-purple-500/40 bg-purple-500/10 text-purple-300 text-[9px] font-bold uppercase">
                              Bundle
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-400">
                          {count} {count === 1 ? 'item' : 'items'} in catalog
                        </p>
                      </div>
                    </div>

                    {/* Styling & Pin Controls */}
                    <div className="flex items-center gap-2 shrink-0">
                      {/* Emoji Quick Picker Dropdown */}
                      <select
                        value={visuals.icon}
                        onChange={(e) =>
                          handleUpdateStyle(category.id, { icon: e.target.value })
                        }
                        className="rounded-lg border border-ink-line bg-ink-800 px-2 py-1 text-xs text-white cursor-pointer hover:border-slate-500"
                        title="Change icon"
                      >
                        {EMOJI_PRESETS.map((em) => (
                          <option key={em} value={em}>
                            {em}
                          </option>
                        ))}
                      </select>

                      {/* Color Quick Picker Dropdown */}
                      <select
                        value={visuals.color}
                        onChange={(e) =>
                          handleUpdateStyle(category.id, {
                            color: e.target.value as any
                          })
                        }
                        className="rounded-lg border border-ink-line bg-ink-800 px-2 py-1 text-xs text-white cursor-pointer hover:border-slate-500 capitalize"
                        title="Change color theme"
                      >
                        {COLOR_PRESETS.map((col) => (
                          <option key={col.id} value={col.id}>
                            {col.name.split(' ')[0]}
                          </option>
                        ))}
                      </select>

                      {/* Pin Toggle Button */}
                      <button
                        type="button"
                        onClick={() => togglePin(category.id)}
                        className={`flex items-center gap-1 rounded-lg border px-2.5 py-1 text-xs font-semibold transition-all ${
                          isPinned
                            ? 'border-indigo-400 bg-indigo-500/30 text-indigo-200 ring-1 ring-indigo-400/40'
                            : 'border-ink-line bg-ink-800 text-slate-400 hover:text-white hover:border-slate-500'
                        }`}
                        title={isPinned ? 'Unpin from POS' : 'Pin to POS'}
                      >
                        {isPinned ? (
                          <>
                            <Pin className="h-3 w-3 fill-indigo-300" />
                            <span>Pinned</span>
                          </>
                        ) : (
                          <>
                            <PinOff className="h-3 w-3 text-slate-500" />
                            <span>Pin</span>
                          </>
                        )}
                      </button>

                      {/* Delete Category Button */}
                      <button
                        type="button"
                        onClick={() => handleDeleteCategory(category)}
                        className="btn-ghost-2 rounded-lg p-1.5 text-slate-500 hover:text-danger-400"
                        title="Delete category"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-ink-line px-5 py-3.5 bg-ink-950/80">
          <p className="text-xs text-slate-400 flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5 text-brand-400" />
            Pinned categories appear instantly as 1-tap tabs on the POS screen.
          </p>
          <button
            type="button"
            onClick={onClose}
            className="btn-primary px-5 text-xs font-bold"
          >
            Done (Esc)
          </button>
        </div>
      </div>
    </div>
  )
}
