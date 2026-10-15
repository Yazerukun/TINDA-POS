import { useState } from 'react'
import {
  X,
  Plus,
  Trash2,
  RotateCcw,
  Check,
  ShieldAlert,
  Zap,
  Droplets,
  CreditCard,
  Globe,
  Tag,
  Building2
} from 'lucide-react'
import {
  BillerPreset,
  BillerCategory,
  loadBillerPresets,
  saveBillerPresets,
  resetBillerPresets
} from '../../utils/billerCustomization'

interface ManageBillersModalProps {
  open?: boolean
  isOpen?: boolean
  onClose: () => void
  onSaved?: () => void
}

const CATEGORY_ICONS: Record<BillerCategory, string> = {
  UTILITIES: '⚡',
  WATER: '💧',
  LOANS: '💳',
  INTERNET: '🌐',
  GOVERNMENT: '🏛️',
  TELCO: '📶',
  OTHER: '🏷️'
}

export function ManageBillersModal({ open, isOpen, onClose, onSaved }: ManageBillersModalProps): React.JSX.Element | null {
  const isVisible = open ?? isOpen ?? false
  const [billers, setBillers] = useState<BillerPreset[]>(() => loadBillerPresets())
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<string>('ALL')

  // New biller form state
  const [newName, setNewName] = useState('')
  const [newCategory, setNewCategory] = useState<BillerCategory>('UTILITIES')
  const [newFee, setNewFee] = useState('15')
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  if (!isVisible) return null

  const handleUpdateBiller = (id: string, updates: Partial<BillerPreset>) => {
    setBillers((prev) =>
      prev.map((b) => (b.id === id ? { ...b, ...updates } : b))
    )
  }

  const handleDeleteBiller = (id: string) => {
    setBillers((prev) => prev.filter((b) => b.id !== id))
  }

  const handleAddBiller = (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg(null)
    const trimmed = newName.trim()
    if (!trimmed) {
      setErrorMsg('Please enter a biller name.')
      return
    }
    if (billers.some((b) => b.name.toLowerCase() === trimmed.toLowerCase())) {
      setErrorMsg(`A biller named "${trimmed}" already exists.`)
      return
    }

    const feeNum = parseFloat(newFee) || 0
    const newBiller: BillerPreset = {
      id: `custom-${Date.now().toString(36)}`,
      name: trimmed,
      category: newCategory,
      defaultFee: feeNum,
      icon: CATEGORY_ICONS[newCategory] || '🏷️',
      isEload: false
    }

    setBillers((prev) => [newBiller, ...prev])
    setNewName('')
    setNewFee('15')
  }

  const handleReset = () => {
    if (confirm('Sigurado ka ba nga i-reset sa default Philippine presets ang tanang billers?')) {
      const defaults = resetBillerPresets()
      setBillers(defaults)
      if (onSaved) onSaved()
    }
  }

  const handleSave = () => {
    saveBillerPresets(billers)
    if (onSaved) onSaved()
    onClose()
  }

  const filteredBillers = billers.filter((b) => {
    if (activeCategoryFilter === 'ALL') return true
    return b.category === activeCategoryFilter
  })

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-3xl max-h-[90vh] flex flex-col rounded-2xl border border-ink-line bg-ink-900 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-ink-line/60 px-6 py-4 bg-ink-950/80">
          <div>
            <h2 className="text-base font-black text-white flex items-center gap-2">
              <span className="text-amber-400">⚙️</span>
              Manage &amp; Customize Billers
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              I-edit ang mga ngalan sa Biller (Meralco, Tubig, Kuryente, Loans) ug default fees. Ang Telco E-Load kay protektado.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 hover:bg-ink-800 hover:text-white transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Add New Biller Card */}
          <div className="rounded-xl border border-brand-500/30 bg-brand-500/5 p-4 space-y-3">
            <h3 className="text-xs font-bold text-brand-300 uppercase tracking-wider flex items-center gap-1.5">
              <Plus className="h-4 w-4" /> Mag-dugang og Bag-ong Biller (Add Custom Biller)
            </h3>
            {errorMsg && (
              <p className="text-xs text-rose-400 font-medium bg-rose-500/10 px-3 py-1.5 rounded-lg border border-rose-500/20">
                {errorMsg}
              </p>
            )}
            <form onSubmit={handleAddBiller} className="grid grid-cols-1 sm:grid-cols-12 gap-2.5">
              <div className="sm:col-span-5">
                <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                  Biller Name (e.g. BENECO, Primewater, Cignal)
                </label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Enter biller name..."
                  className="w-full rounded-xl border border-ink-line bg-ink-950 px-3 py-2 text-xs font-bold text-white outline-none focus:border-brand-500 transition"
                  required
                />
              </div>
              <div className="sm:col-span-3">
                <label className="text-[11px] font-semibold text-slate-300 block mb-1">Category</label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value as BillerCategory)}
                  className="w-full rounded-xl border border-ink-line bg-ink-950 px-3 py-2 text-xs font-semibold text-white outline-none focus:border-brand-500 transition"
                >
                  <option value="UTILITIES">⚡ Utilities / Kuryente</option>
                  <option value="WATER">💧 Water / Tubig</option>
                  <option value="LOANS">💳 Loans / Financing</option>
                  <option value="INTERNET">🌐 Internet &amp; Cable</option>
                  <option value="GOVERNMENT">🏛️ Government / SSS</option>
                  <option value="OTHER">🏷️ Other Services</option>
                </select>
              </div>
              <div className="sm:col-span-2">
                <label className="text-[11px] font-semibold text-slate-300 block mb-1">Default Fee (₱)</label>
                <input
                  type="number"
                  step="any"
                  value={newFee}
                  onChange={(e) => setNewFee(e.target.value)}
                  placeholder="15"
                  className="w-full rounded-xl border border-ink-line bg-ink-950 px-3 py-2 text-xs font-bold text-amber-300 outline-none focus:border-brand-500 transition"
                  required
                />
              </div>
              <div className="sm:col-span-2 flex items-end">
                <button
                  type="submit"
                  className="w-full h-[38px] flex items-center justify-center gap-1.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-slate-950 font-bold text-xs shadow-md transition active:scale-95"
                >
                  <Plus className="h-4 w-4" /> Add
                </button>
              </div>
            </form>
          </div>

          {/* Category Filter Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
            <span className="text-slate-400 font-semibold mr-1">Filter:</span>
            {[
              { id: 'ALL', label: 'All Billers' },
              { id: 'UTILITIES', label: '⚡ Utilities' },
              { id: 'WATER', label: '💧 Water' },
              { id: 'LOANS', label: '💳 Loans' },
              { id: 'INTERNET', label: '🌐 Internet' },
              { id: 'TELCO', label: '📶 Telco E-Load' }
            ].map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setActiveCategoryFilter(cat.id)}
                className={`px-3 py-1.5 rounded-lg border font-medium transition ${
                  activeCategoryFilter === cat.id
                    ? 'border-brand-500 bg-brand-500/15 text-brand-300 font-bold'
                    : 'border-ink-line bg-ink-950 text-slate-400 hover:text-white'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Billers Table / List */}
          <div className="rounded-xl border border-ink-line bg-ink-950 overflow-hidden">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-ink-line bg-ink-900/60 text-slate-400 uppercase text-[10px] tracking-wider font-bold">
                  <th className="py-2.5 px-3">Icon</th>
                  <th className="py-2.5 px-3">Biller Name (Editable)</th>
                  <th className="py-2.5 px-3">Category</th>
                  <th className="py-2.5 px-3 text-right">Default Fee (₱)</th>
                  <th className="py-2.5 px-3 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-line/60">
                {filteredBillers.map((b) => (
                  <tr key={b.id} className="hover:bg-ink-900/40 transition">
                    <td className="py-2.5 px-3 text-base">{b.icon || '🏷️'}</td>
                    <td className="py-2.5 px-3">
                      {b.isEload ? (
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-300">{b.name}</span>
                          <span className="rounded bg-sky-500/15 text-sky-400 px-1.5 py-0.5 text-[9px] font-mono border border-sky-500/30">
                            🔒 E-Load Protected
                          </span>
                        </div>
                      ) : (
                        <input
                          type="text"
                          value={b.name}
                          onChange={(e) => handleUpdateBiller(b.id, { name: e.target.value })}
                          className="w-full rounded-lg border border-ink-line bg-ink-900 px-2.5 py-1.5 text-xs font-bold text-white outline-none focus:border-brand-500 transition"
                        />
                      )}
                    </td>
                    <td className="py-2.5 px-3">
                      {b.isEload ? (
                        <span className="text-slate-400 font-mono text-[11px]">{b.category}</span>
                      ) : (
                        <select
                          value={b.category}
                          onChange={(e) => {
                            const cat = e.target.value as BillerCategory
                            handleUpdateBiller(b.id, {
                              category: cat,
                              icon: CATEGORY_ICONS[cat] || b.icon
                            })
                          }}
                          className="rounded-lg border border-ink-line bg-ink-900 px-2 py-1 text-[11px] font-medium text-slate-300 outline-none focus:border-brand-500"
                        >
                          <option value="UTILITIES">⚡ Utilities</option>
                          <option value="WATER">💧 Water</option>
                          <option value="LOANS">💳 Loans</option>
                          <option value="INTERNET">🌐 Internet</option>
                          <option value="GOVERNMENT">🏛️ Gov</option>
                          <option value="OTHER">🏷️ Other</option>
                        </select>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      {b.isEload ? (
                        <span className="text-amber-400 font-bold">₱{b.defaultFee.toFixed(2)}</span>
                      ) : (
                        <input
                          type="number"
                          step="any"
                          value={b.defaultFee}
                          onChange={(e) => handleUpdateBiller(b.id, { defaultFee: parseFloat(e.target.value) || 0 })}
                          className="w-20 rounded-lg border border-ink-line bg-ink-900 px-2 py-1 text-right text-xs font-bold text-amber-300 outline-none focus:border-brand-500"
                        />
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      {b.isEload ? (
                        <span className="text-[10px] text-slate-500 font-medium">Standard</span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleDeleteBiller(b.id)}
                          className="p-1.5 text-slate-500 hover:text-rose-400 rounded-lg hover:bg-rose-500/10 transition"
                          title="Remove Biller"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-ink-line px-6 py-4 bg-ink-950">
          <button
            type="button"
            onClick={handleReset}
            className="flex items-center gap-1.5 text-xs font-bold text-slate-400 hover:text-white px-3 py-2 rounded-xl hover:bg-ink-800 border border-ink-line transition"
          >
            <RotateCcw className="h-3.5 w-3.5" /> Reset to Defaults
          </button>
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-300 hover:text-white rounded-xl hover:bg-ink-800 transition"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="flex items-center gap-1.5 px-5 py-2 text-xs font-black rounded-xl bg-brand-500 hover:bg-brand-400 text-slate-950 shadow-md transition active:scale-95"
            >
              <Check className="h-4 w-4" /> Save &amp; Apply Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
