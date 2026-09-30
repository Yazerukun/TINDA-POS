import React, { useState, useEffect, useRef } from 'react'
import { Receipt, X, Banknote, Check, Loader2, AlertCircle } from 'lucide-react'
import type { ExpenseCategory } from '@shared/types'
import { toastSuccess, toastError } from '../stores/toast'

interface QuickExpenseModalProps {
  open: boolean
  onClose: () => void
  onRecorded?: () => void
}

function playSuccessChirp(): void {
  try {
    const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'sine'
    osc.frequency.setValueAtTime(880, ctx.currentTime) // A5
    osc.frequency.exponentialRampToValueAtTime(1320, ctx.currentTime + 0.12) // E6
    gain.gain.setValueAtTime(0.12, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15)
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.start()
    osc.stop(ctx.currentTime + 0.15)
  } catch {
    // Ignore audio context initialization failure
  }
}

export function QuickExpenseModal({ open, onClose, onRecorded }: QuickExpenseModalProps): React.JSX.Element | null {
  const [categories, setCategories] = useState<ExpenseCategory[]>([])
  const [selectedCatId, setSelectedCatId] = useState<number | null>(null)
  const [amountInput, setAmountInput] = useState('')
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const amountRef = useRef<HTMLInputElement>(null)

  // Close on Escape key
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  // Load categories
  useEffect(() => {
    if (!open) return
    let active = true
    const fetchCategories = async () => {
      setLoading(true)
      try {
        const cats = await window.api.expenses.categories()
        if (active && cats && cats.length > 0) {
          setCategories(cats)
          // Default to 'Ice' or 'Store Supplies' if available, otherwise first category
          const defaultCat = cats.find((c) => /ice|supplies|misc/i.test(c.name)) ?? cats[0]
          if (defaultCat) {
            setSelectedCatId(defaultCat.id)
          }
        }
      } catch (err) {
        if (active) {
          toastError('Failed to load expense categories', String((err as Error)?.message || err))
        }
      } finally {
        if (active) {
          setLoading(false)
          setTimeout(() => amountRef.current?.focus(), 80)
        }
      }
    }
    void fetchCategories()
    return () => { active = false }
  }, [open])

  if (!open) return null

  const handleRecordExpense = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedCatId) {
      toastError('Validation Error', 'Please select an expense category.')
      return
    }

    const num = parseFloat(amountInput)
    if (isNaN(num) || num <= 0) {
      toastError('Validation Error', 'Please enter a valid expense amount greater than ₱0.00.')
      amountRef.current?.focus()
      return
    }

    const amount_c = Math.round(num * 100)
    const selectedCat = categories.find((c) => c.id === selectedCatId)
    const desc = description.trim() || (selectedCat ? `Cash out: ${selectedCat.name}` : 'Petty cash out')
    const today = new Date().toISOString().slice(0, 10)

    setSubmitting(true)
    try {
      await window.api.expenses.create({
        category_id: selectedCatId,
        amount_c,
        expense_date: today,
        description: desc
      })

      playSuccessChirp()
      toastSuccess('Cash Out Recorded', `Successfully recorded ₱${num.toFixed(2)} from active drawer.`)
      onRecorded?.()
      onClose()
    } catch (err) {
      toastError('Record Failed', String((err as Error)?.message || err))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm animate-in fade-in duration-150"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className="flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-ink-line bg-ink-900 shadow-2xl">
        {/* Sticky Header */}
        <div className="flex items-center justify-between border-b border-ink-line px-5 py-4 bg-ink-850">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Receipt className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-wide">Petty Cash / Store Expense</h2>
              <p className="text-xs text-slate-400">Record cash taken from drawer for store needs</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-ink-700 hover:text-white transition-colors"
            title="Close dialog (Escape)"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Form Content */}
        <form onSubmit={handleRecordExpense} className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* Quick Notice Banner */}
          <div className="flex items-start gap-2.5 rounded-xl border border-amber-500/20 bg-amber-500/5 p-3 text-xs text-amber-300">
            <AlertCircle className="h-4 w-4 shrink-0 text-amber-400 mt-0.5" />
            <span>
              This cash out will be recorded in your active cashier shift and automatically deducted from expected cash in Z-Reading.
            </span>
          </div>

          {/* Amount Input */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Amount to Disburse (₱) <span className="text-rose-400">*</span>
            </label>
            <div className="relative">
              <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-lg font-bold text-slate-400">₱</span>
              <input
                ref={amountRef}
                type="number"
                step="0.01"
                min="0.01"
                required
                placeholder="0.00"
                value={amountInput}
                onChange={(e) => setAmountInput(e.target.value)}
                className="input h-12 w-full pl-9 pr-3 text-xl font-bold text-white tracking-wide"
              />
            </div>
          </div>

          {/* Category Chips / Grid */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Expense Category <span className="text-rose-400">*</span>
            </label>
            {loading ? (
              <div className="flex items-center justify-center p-4">
                <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {categories.map((cat) => {
                  const isSelected = selectedCatId === cat.id
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setSelectedCatId(cat.id)}
                      className={`flex items-center justify-between rounded-xl border px-3 py-2.5 text-xs font-medium transition-all ${
                        isSelected
                          ? 'border-amber-500 bg-amber-500/15 text-amber-200 font-semibold shadow-sm'
                          : 'border-ink-line bg-ink-800 text-slate-300 hover:border-slate-600 hover:bg-ink-700'
                      }`}
                    >
                      <span className="truncate">{cat.name}</span>
                      {isSelected && <Check className="h-3.5 w-3.5 text-amber-400 shrink-0 ml-1.5" />}
                    </button>
                  )
                })}
              </div>
            )}
          </div>

          {/* Description / Note */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Reason / Note <span className="text-slate-500 font-normal">(Optional)</span>
            </label>
            <input
              type="text"
              placeholder="e.g. 5 bags of tube ice, plastic bags, helper lunch"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="input h-10 w-full text-sm"
              maxLength={150}
            />
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-ink-line">
            <button
              type="button"
              onClick={onClose}
              className="btn-ghost px-4 py-2 text-sm text-slate-300"
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || !amountInput || parseFloat(amountInput) <= 0}
              className="btn-primary min-w-[140px] px-5 py-2.5 text-sm font-semibold flex items-center justify-center gap-2 bg-amber-600 hover:bg-amber-500 text-white border-transparent"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Recording...</span>
                </>
              ) : (
                <>
                  <Banknote className="h-4 w-4" />
                  <span>Record Cash Out</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
