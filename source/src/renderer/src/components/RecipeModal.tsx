import { useState, useEffect } from 'react'
import {
  Layers,
  Plus,
  Trash2,
  AlertTriangle,
  Check,
  Search,
  Sparkles,
  RefreshCw,
  Coins
} from 'lucide-react'
import type { Product, ProductRecipeItem } from '@shared/types'
import { money } from '@shared/format'
import { Modal } from './ui/Modal'
import { toastSuccess, toastError } from '../stores/toast'

interface RecipeModalProps {
  open: boolean
  onClose: () => void
  product: Product | null
  allProducts: Product[]
  onRecipeSaved: () => Promise<void>
}

export function RecipeModal({
  open,
  onClose,
  product,
  allProducts,
  onRecipeSaved
}: RecipeModalProps): React.JSX.Element | null {
  const [items, setItems] = useState<
    Array<{
      component_product_id: number
      component_name: string
      component_cost_c: number
      quantity: number
      unit_name: string
    }>
  >([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  // New ingredient selection state
  const [search, setSearch] = useState('')
  const [selectedCompId, setSelectedCompId] = useState<number | null>(null)
  const [qtyInput, setQtyInput] = useState('1')
  const [unitInput, setUnitInput] = useState('pc')

  useEffect(() => {
    if (!open || !product) {
      setItems([])
      return
    }

    setLoading(true)
    window.api.products
      .getRecipe(product.id)
      .then((recipe) => {
        setItems(
          recipe.map((r) => ({
            component_product_id: r.component_product_id,
            component_name: r.component_name || 'Component Item',
            component_cost_c: r.component_cost_c || 0,
            quantity: r.quantity,
            unit_name: r.unit_name
          }))
        )
      })
      .catch((err) => {
        toastError('Failed to load recipe', String((err as Error)?.message || err))
      })
      .finally(() => setLoading(false))
  }, [open, product])

  if (!open || !product) return null

  // Calculate live rollup cost
  const totalRollupCostC = items.reduce(
    (sum, it) => sum + Math.round(it.component_cost_c * it.quantity),
    0
  )

  const handleAddComponent = async () => {
    if (!selectedCompId) {
      toastError('Select component', 'Please select an ingredient or component product.')
      return
    }
    const q = parseFloat(qtyInput)
    if (isNaN(q) || q <= 0) {
      toastError('Invalid quantity', 'Please enter a quantity greater than zero.')
      return
    }

    // Check if adding this component creates a cycle
    try {
      const cycleCheck = await window.api.products.checkCycle(product.id, selectedCompId)
      if (cycleCheck.hasCycle) {
        toastError(
          'Circular Dependency Detected',
          'This component depends on the current product, which would cause an infinite loop.'
        )
        return
      }
    } catch {
      // Non-blocking
    }

    const compProd = allProducts.find((p) => p.id === selectedCompId)
    if (!compProd) return

    // Check if component is already in recipe
    const existsIndex = items.findIndex((it) => it.component_product_id === selectedCompId)
    if (existsIndex >= 0) {
      const updated = [...items]
      const existing = updated[existsIndex]
      if (existing) {
        existing.quantity += q
        setItems(updated)
      }
    } else {
      setItems([
        ...items,
        {
          component_product_id: compProd.id,
          component_name: compProd.name,
          component_cost_c: compProd.purchase_cost_c,
          quantity: q,
          unit_name: unitInput.trim() || compProd.base_unit || 'pc'
        }
      ])
    }

    // Reset selection
    setSelectedCompId(null)
    setSearch('')
    setQtyInput('1')
    setUnitInput('pc')
  }

  const handleRemoveComponent = (idx: number) => {
    setItems(items.filter((_, i) => i !== idx))
  }

  const handleSaveRecipe = async () => {
    setSaving(true)
    try {
      await window.api.products.saveRecipe(
        product.id,
        items.map((it) => ({
          component_product_id: it.component_product_id,
          quantity: it.quantity,
          unit_name: it.unit_name
        }))
      )

      // Also ensure product is marked as COMPOSITE and update its purchase_cost_c to rollup cost
      await window.api.products.update(product.id, {
        item_type: 'COMPOSITE',
        purchase_cost_c: totalRollupCostC
      })

      await onRecipeSaved()
      toastSuccess(
        'Recipe saved',
        `Updated BOM for "${product.name}". Total Rollup Cost: ${money(totalRollupCostC)}.`
      )
      onClose()
    } catch (err) {
      toastError('Failed to save recipe', String((err as Error)?.message || err))
    } finally {
      setSaving(false)
    }
  }

  // Filter available components (excluding the product itself)
  const candidateProducts = allProducts.filter(
    (p) =>
      p.id !== product.id &&
      (p.name.toLowerCase().includes(search.toLowerCase()) ||
        (p.barcode && p.barcode.includes(search)))
  ).slice(0, 8)

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Bill of Materials & Recipe: ${product.name}`}
      maxWidth="max-w-2xl"
    >
      <div className="space-y-4">
        {/* Banner Info */}
        <div className="rounded-xl border border-indigo-500/30 bg-indigo-500/10 p-3 text-xs text-indigo-200">
          <p className="font-bold flex items-center gap-1.5 text-indigo-100">
            <Layers className="h-4 w-4 text-indigo-400" />
            Composite & Nested Recipe Assembly (BOM)
          </p>
          <p className="mt-1 text-slate-300">
            When <strong>{product.name}</strong> is sold at checkout, the system automatically and recursively deducts its raw ingredients from stock and rolls up the exact production cost.
          </p>
        </div>

        {/* Recipe Components List */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Ingredients / Sub-Components ({items.length})
            </h4>
            <div className="flex items-center gap-2 text-xs">
              <span className="text-slate-400">Total Roll-up Cost:</span>
              <span className="font-mono font-extrabold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30">
                {money(totalRollupCostC)}
              </span>
            </div>
          </div>

          {loading ? (
            <div className="rounded-xl border border-ink-line p-6 text-center text-xs text-slate-400">
              Loading recipe components...
            </div>
          ) : items.length === 0 ? (
            <div className="rounded-xl border border-dashed border-ink-line p-6 text-center text-xs text-slate-400">
              No ingredients added yet. Select a product below to add it to the recipe.
            </div>
          ) : (
            <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1 scrollbar-thin">
              {items.map((it, idx) => {
                const subtotalCost = Math.round(it.component_cost_c * it.quantity)
                return (
                  <div
                    key={`${it.component_product_id}-${idx}`}
                    className="flex items-center justify-between gap-3 rounded-lg border border-ink-line bg-ink-850 px-3 py-2 text-xs"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-white truncate">{it.component_name}</p>
                      <p className="text-[11px] text-slate-400">
                        {it.quantity} {it.unit_name} × {money(it.component_cost_c)} ={' '}
                        <span className="text-emerald-400 font-mono font-medium">{money(subtotalCost)}</span>
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleRemoveComponent(idx)}
                      className="p-1 rounded text-rose-400 hover:bg-rose-500/20 transition-colors"
                      title="Remove ingredient"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Add Ingredient Section */}
        <div className="rounded-xl border border-ink-line bg-ink-850 p-3 space-y-3">
          <h5 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
            <Plus className="h-3.5 w-3.5 text-brand-400" />
            Add Ingredient / Sub-Component
          </h5>

          <div className="relative">
            <input
              type="text"
              placeholder="Search ingredient by name or barcode..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-lg border border-ink-line bg-ink-900 px-3 py-2 text-xs text-white placeholder-slate-500 focus:border-brand-500 focus:outline-none"
            />
            <Search className="absolute right-3 top-2.5 h-3.5 w-3.5 text-slate-500 pointer-events-none" />

            {search.trim() && candidateProducts.length > 0 && !selectedCompId && (
              <div className="absolute z-20 mt-1 max-h-40 w-full overflow-y-auto rounded-lg border border-ink-line bg-ink-900 shadow-xl scrollbar-thin">
                {candidateProducts.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => {
                      setSelectedCompId(p.id)
                      setSearch(p.name)
                      setUnitInput(p.base_unit || 'pc')
                    }}
                    className="flex w-full items-center justify-between px-3 py-2 text-left text-xs text-slate-200 hover:bg-ink-800 transition-colors"
                  >
                    <div>
                      <span className="font-semibold text-white">{p.name}</span>
                      {p.item_type === 'COMPOSITE' && (
                        <span className="ml-1.5 text-[9px] font-extrabold text-indigo-300 bg-indigo-500/20 px-1 rounded">
                          NESTED BOM
                        </span>
                      )}
                    </div>
                    <span className="text-slate-400 font-mono">Cost: {money(p.purchase_cost_c)}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <div className="w-1/2">
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Quantity Needed</label>
              <input
                type="number"
                step="0.01"
                min="0.001"
                placeholder="1"
                value={qtyInput}
                onChange={(e) => setQtyInput(e.target.value)}
                className="w-full rounded-lg border border-ink-line bg-ink-900 px-3 py-1.5 text-xs text-white focus:border-brand-500 focus:outline-none"
              />
            </div>
            <div className="w-1/2">
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Unit</label>
              <input
                type="text"
                placeholder="pc, ml, g, kg"
                value={unitInput}
                onChange={(e) => setUnitInput(e.target.value)}
                className="w-full rounded-lg border border-ink-line bg-ink-900 px-3 py-1.5 text-xs text-white focus:border-brand-500 focus:outline-none"
              />
            </div>
            <div className="pt-4 shrink-0">
              <button
                type="button"
                onClick={handleAddComponent}
                className="inline-flex items-center gap-1 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-indigo-500 active:scale-95 transition-all shadow-md"
              >
                <Plus className="h-3.5 w-3.5" />
                Add Ingredient
              </button>
            </div>
          </div>
        </div>

        {/* Modal Actions */}
        <div className="flex items-center justify-between pt-3 border-t border-ink-line">
          <div className="text-xs text-slate-400">
            Selling Price: <strong className="text-white font-mono">{money(product.default_price_c)}</strong>
            {' · '}
            Gross Margin:{' '}
            <strong className="text-emerald-400">
              {product.default_price_c > totalRollupCostC
                ? `${Math.round(((product.default_price_c - totalRollupCostC) / product.default_price_c) * 100)}%`
                : '0%'}
            </strong>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-ink-line px-3.5 py-1.5 text-xs font-semibold text-slate-300 hover:bg-ink-800"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={saving}
              onClick={handleSaveRecipe}
              className="inline-flex items-center gap-1.5 rounded-lg bg-brand-600 px-4 py-1.5 text-xs font-bold text-white shadow-md hover:bg-brand-500 active:scale-95 transition-all disabled:opacity-50"
            >
              <Check className="h-3.5 w-3.5" />
              {saving ? 'Saving...' : 'Save & Update BOM'}
            </button>
          </div>
        </div>
      </div>
    </Modal>
  )
}
