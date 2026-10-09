import { useState, useEffect } from 'react'
import {
  Sparkles,
  Plus,
  Trash2,
  Check,
  X,
  ShoppingCart,
  Percent,
  Layers,
  CheckCircle2,
  Tag
} from 'lucide-react'
import { Modal } from './ui/Modal'
import { money } from '@shared/format'
import { toastSuccess } from '../stores/toast'
import {
  getStoredPromoBundles,
  savePromoBundles,
  type PromoBundle,
  DEFAULT_PROMO_BUNDLES
} from '../utils/promoBundles'
import { usePosCart } from '../pages/POS'
import type { Product } from '@shared/types'

interface PromoBundlesModalProps {
  open: boolean
  onClose: () => void
  products: Product[]
}

export function PromoBundlesModal({
  open,
  onClose,
  products
}: PromoBundlesModalProps): React.JSX.Element | null {
  const [bundles, setBundles] = useState<PromoBundle[]>(() => getStoredPromoBundles())
  const [creating, setCreating] = useState(false)

  // New combo form state
  const [newName, setNewName] = useState('')
  const [newPricePesos, setNewPricePesos] = useState('50')
  const [newDesc, setNewDesc] = useState('')
  const [item1Keyword, setItem1Keyword] = useState('')
  const [item2Keyword, setItem2Keyword] = useState('')

  useEffect(() => {
    setBundles(getStoredPromoBundles())
  }, [open])

  if (!open) return null

  const handleToggle = (id: string) => {
    const updated = bundles.map((b) => (b.id === id ? { ...b, is_active: !b.is_active } : b))
    setBundles(updated)
    savePromoBundles(updated)
    toastSuccess('Promo bundle status updated')
  }

  const handleDelete = (id: string) => {
    const updated = bundles.filter((b) => b.id !== id)
    setBundles(updated)
    savePromoBundles(updated)
    toastSuccess('Promo bundle removed')
  }

  const handleAddComboToCart = (bundle: PromoBundle) => {
    let addedCount = 0

    if (bundle.type === 'FIXED_COMBO') {
      for (const required of bundle.items) {
        const keyword = required.name_keyword.toLowerCase()
        const matchedProduct = products.find((p) => p.name.toLowerCase().includes(keyword))

        if (matchedProduct) {
          usePosCart.getState().add(matchedProduct, required.quantity)
          addedCount += required.quantity
        } else {
          // If no inventory product matches keyword, add as line item
          usePosCart.getState().addCustomItem(
            required.name_keyword.toUpperCase(),
            Math.round((bundle.bundle_price_c / bundle.items.length)),
            'pc',
            required.quantity
          )
          addedCount += required.quantity
        }
      }
    } else if (bundle.type === 'VOLUME_TIER') {
      const keyword = (bundle.target_name_keyword || '').toLowerCase()
      const matched = products.find((p) => p.name.toLowerCase().includes(keyword))
      const qty = bundle.min_quantity || 3

      if (matched) {
        usePosCart.getState().add(matched, qty)
        addedCount += qty
      } else {
        usePosCart.getState().addCustomItem(
          `${bundle.target_name_keyword?.toUpperCase() || 'PROMO ITEM'} (Bulk)`,
          bundle.bundle_price_c,
          'set',
          1
        )
        addedCount += 1
      }
    }

    toastSuccess('Combo Added to Cart', `${bundle.name} added to cart!`)
    onClose()
  }

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newName.trim()) return

    const priceC = Math.round(parseFloat(newPricePesos || '0') * 100)
    const items = []
    if (item1Keyword.trim()) items.push({ name_keyword: item1Keyword.trim(), quantity: 1 })
    if (item2Keyword.trim()) items.push({ name_keyword: item2Keyword.trim(), quantity: 1 })

    const newBundle: PromoBundle = {
      id: `custom_${Date.now()}`,
      name: newName.trim(),
      type: 'FIXED_COMBO',
      bundle_price_c: priceC,
      is_active: true,
      description: newDesc.trim() || 'Custom promotional meal package',
      items: items.length > 0 ? items : [{ name_keyword: newName.trim(), quantity: 1 }]
    }

    const updated = [...bundles, newBundle]
    setBundles(updated)
    savePromoBundles(updated)
    toastSuccess('Promo bundle created')
    setCreating(false)
    setNewName('')
    setItem1Keyword('')
    setItem2Keyword('')
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Promo Bundles & Meal Combos"
      maxWidth="max-w-3xl"
      footer={
        <div className="flex items-center justify-between w-full">
          <button
            type="button"
            onClick={() => {
              savePromoBundles(DEFAULT_PROMO_BUNDLES)
              setBundles(DEFAULT_PROMO_BUNDLES)
              toastSuccess('Restored default promos')
            }}
            className="text-xs text-slate-500 hover:text-slate-300"
          >
            Reset to Standard Deals
          </button>
          <button onClick={onClose} className="btn-ghost">
            Close
          </button>
        </div>
      }
    >
      <div className="space-y-4">
        {/* Banner */}
        <div className="rounded-xl border border-brand-500/30 bg-gradient-to-r from-brand-950/40 via-ink-900 to-ink-900 p-4 text-xs text-slate-300">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="font-bold text-brand-300 flex items-center gap-1.5 text-sm">
                <Sparkles className="h-4 w-4 text-brand-400" />
                Automatic POS Bundle Recognition
              </p>
              <p className="mt-1 text-slate-400 leading-relaxed">
                When customers purchase items belonging to a promo combo, the POS cart automatically evaluates savings.
                Cashiers can also 1-tap add entire package deals below.
              </p>
            </div>
            {!creating && (
              <button
                onClick={() => setCreating(true)}
                className="btn-primary shrink-0 flex items-center gap-1.5 text-xs py-2 px-3"
              >
                <Plus className="h-3.5 w-3.5" />
                Create Promo
              </button>
            )}
          </div>
        </div>

        {/* Create Combo Form */}
        {creating && (
          <form onSubmit={handleCreate} className="rounded-xl border border-ink-line bg-ink-900 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold text-white">Create New Combo Bundle</h4>
              <button
                type="button"
                onClick={() => setCreating(false)}
                className="text-slate-500 hover:text-slate-300"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="label">Bundle Name *</label>
                <input
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g. Snack Combo A"
                  className="input w-full text-xs"
                />
              </div>
              <div>
                <label className="label">Bundle Promo Price (₱) *</label>
                <input
                  type="number"
                  min={1}
                  step={1}
                  required
                  value={newPricePesos}
                  onChange={(e) => setNewPricePesos(e.target.value)}
                  className="input w-full text-xs font-bold text-brand-400"
                />
              </div>
              <div>
                <label className="label">Item 1 Name / Keyword</label>
                <input
                  value={item1Keyword}
                  onChange={(e) => setItem1Keyword(e.target.value)}
                  placeholder="e.g. canton, egg, coke"
                  className="input w-full text-xs"
                />
              </div>
              <div>
                <label className="label">Item 2 Name / Keyword</label>
                <input
                  value={item2Keyword}
                  onChange={(e) => setItem2Keyword(e.target.value)}
                  placeholder="e.g. chippy, bread"
                  className="input w-full text-xs"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-ink-line">
              <button type="button" onClick={() => setCreating(false)} className="btn-ghost text-xs">
                Cancel
              </button>
              <button type="submit" className="btn-primary text-xs">
                Save Promo Bundle
              </button>
            </div>
          </form>
        )}

        {/* Bundles List */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[50vh] overflow-y-auto pr-1">
          {bundles.map((bundle) => (
            <div
              key={bundle.id}
              className={`rounded-xl border p-4 flex flex-col justify-between transition ${
                bundle.is_active
                  ? 'border-ink-line bg-ink-900/70'
                  : 'border-slate-800 bg-ink-950/40 opacity-60'
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-bold text-white text-sm">{bundle.name}</span>
                      {bundle.badge && (
                        <span className="badge border border-brand-500/30 bg-brand-500/20 text-brand-300 text-[10px] px-1.5 py-0.5">
                          {bundle.badge}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">{bundle.description}</p>
                  </div>
                  <span className="text-base font-black text-brand-400 font-mono">
                    {money(bundle.bundle_price_c)}
                  </span>
                </div>

                {bundle.items && bundle.items.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {bundle.items.map((it, idx) => (
                      <span
                        key={idx}
                        className="rounded bg-ink-800 px-2 py-0.5 text-[11px] text-slate-300 border border-ink-line"
                      >
                        {it.quantity}x {it.name_keyword}
                      </span>
                    ))}
                  </div>
                )}
                {bundle.type === 'VOLUME_TIER' && (
                  <div className="mt-3">
                    <span className="rounded bg-ink-800 px-2 py-0.5 text-[11px] text-slate-300 border border-ink-line">
                      ≥{bundle.min_quantity}x {bundle.target_name_keyword}
                    </span>
                  </div>
                )}
              </div>

              <div className="mt-4 flex items-center justify-between border-t border-ink-line/50 pt-3">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleToggle(bundle.id)}
                    className={`text-xs px-2 py-1 rounded font-semibold border ${
                      bundle.is_active
                        ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20'
                        : 'border-slate-700 bg-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    {bundle.is_active ? 'Active Deal' : 'Paused'}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(bundle.id)}
                    className="p-1 text-slate-600 hover:text-danger-400 transition"
                    title="Delete Promo"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => handleAddComboToCart(bundle)}
                  className="btn-primary text-xs py-1.5 px-3 flex items-center gap-1.5"
                  title="Add combo items directly into cart"
                >
                  <ShoppingCart className="h-3.5 w-3.5" />
                  <span>Add to Cart</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Modal>
  )
}
