import React, { useState, useEffect, useRef } from 'react'
import { Scale, Banknote, Sparkles, Check, X, Calculator } from 'lucide-react'
import { money, isWeighableUnit } from '@shared/format'
import { Modal } from './ui/Modal'

export interface KiloPriceCalculatorModalProps {
  open: boolean
  productName: string
  unitName: string
  unitPriceC: number
  currentQty: number
  onClose: () => void
  onApply: (qty: number) => void
}

export function KiloPriceCalculatorModal({
  open,
  productName,
  unitName,
  unitPriceC,
  currentQty,
  onClose,
  onApply
}: KiloPriceCalculatorModalProps): React.JSX.Element | null {
  const [mode, setMode] = useState<'amount' | 'weight'>('amount')
  const [amountStr, setAmountStr] = useState<string>('')
  const [weightStr, setWeightStr] = useState<string>('')
  const inputRef = useRef<HTMLInputElement>(null)

  const pricePerUnit = unitPriceC / 100

  // Initialize values when opened
  useEffect(() => {
    if (open) {
      if (currentQty > 0 && pricePerUnit > 0) {
        const estAmount = Math.round(currentQty * pricePerUnit * 100) / 100
        setAmountStr(String(estAmount))
        setWeightStr(Number(currentQty.toFixed(6)).toString())
      } else {
        setAmountStr('')
        setWeightStr('')
      }
      setTimeout(() => inputRef.current?.select(), 50)
    }
  }, [open, currentQty, pricePerUnit])

  if (!open) return null

  // Calculate live numbers
  let computedWeight = 0
  let computedSubtotalC = 0

  if (mode === 'amount') {
    const enteredAmount = parseFloat(amountStr) || 0
    if (enteredAmount > 0 && pricePerUnit > 0) {
      computedWeight = Math.round((enteredAmount / pricePerUnit) * 1_000_000) / 1_000_000
      computedSubtotalC = Math.round(computedWeight * unitPriceC)
    }
  } else {
    computedWeight = parseFloat(weightStr) || 0
    if (computedWeight > 0) {
      computedSubtotalC = Math.round(computedWeight * unitPriceC)
    }
  }

  const handleAmountChange = (val: string) => {
    setAmountStr(val)
    const num = parseFloat(val) || 0
    if (num > 0 && pricePerUnit > 0) {
      const w = Math.round((num / pricePerUnit) * 1_000_000) / 1_000_000
      setWeightStr(Number(w.toFixed(6)).toString())
    } else {
      setWeightStr('')
    }
  }

  const handleWeightChange = (val: string) => {
    setWeightStr(val)
    const w = parseFloat(val) || 0
    if (w > 0 && pricePerUnit > 0) {
      const a = Math.round(w * pricePerUnit * 100) / 100
      setAmountStr(String(a))
    } else {
      setAmountStr('')
    }
  }

  const handleApply = () => {
    if (computedWeight > 0) {
      onApply(computedWeight)
      onClose()
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleApply()
    } else if (e.key === 'Escape') {
      e.preventDefault()
      onClose()
    }
  }

  const amountPresets = [20, 30, 35, 37, 50, 100, 150, 200]
  const weightPresets = [0.25, 0.37755, 0.5, 0.75, 1.0]

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Scale & Weight Calculator (Kilo-to-Price)"
      maxWidth="max-w-md"
    >
      <div className="space-y-4 text-slate-200" onKeyDown={handleKeyDown}>
        {/* Item Header */}
        <div className="rounded-xl border border-ink-line bg-ink-900/60 p-3">
          <p className="text-xs text-slate-400 font-medium">Selected Product</p>
          <div className="flex items-center justify-between gap-2 mt-0.5">
            <span className="font-bold text-white text-base truncate">{productName}</span>
            <span className="shrink-0 rounded-lg bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 text-xs font-mono font-bold text-emerald-400">
              {money(unitPriceC)} <span className="text-slate-400 font-normal">/{unitName}</span>
            </span>
          </div>
        </div>

        {/* Mode Switcher */}
        <div className="grid grid-cols-2 gap-1 rounded-xl bg-ink-950 p-1 border border-ink-line">
          <button
            type="button"
            onClick={() => {
              setMode('amount')
              setTimeout(() => inputRef.current?.select(), 50)
            }}
            className={`flex items-center justify-center gap-2 rounded-lg py-2 text-xs font-bold transition-all ${
              mode === 'amount'
                ? 'bg-brand-500 text-slate-950 shadow-md shadow-brand-500/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Banknote className="h-4 w-4" />
            <span>Sell by Pesos (₱)</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('weight')
              setTimeout(() => inputRef.current?.select(), 50)
            }}
            className={`flex items-center justify-center gap-2 rounded-lg py-2 text-xs font-bold transition-all ${
              mode === 'weight'
                ? 'bg-brand-500 text-slate-950 shadow-md shadow-brand-500/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Scale className="h-4 w-4" />
            <span>Exact Weight ({unitName})</span>
          </button>
        </div>

        {/* Input Box */}
        {mode === 'amount' ? (
          <div>
            <label className="label flex items-center justify-between">
              <span>Customer Desired Amount (₱)</span>
              <span className="text-[10px] text-slate-400">e.g. ₱37, ₱50, ₱100</span>
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-bold text-slate-400 text-lg">
                ₱
              </span>
              <input
                ref={inputRef}
                type="number"
                step="any"
                min="0"
                autoFocus
                placeholder="0.00"
                value={amountStr}
                onChange={(e) => handleAmountChange(e.target.value)}
                className="input w-full pl-8 text-xl font-black font-mono text-emerald-400 bg-ink-950 focus:border-brand-500"
              />
            </div>

            {/* Quick Amount Presets */}
            <div className="flex flex-wrap items-center gap-1.5 mt-2">
              <span className="text-[10px] text-slate-500 mr-1">Presets:</span>
              {amountPresets.map((amt) => (
                <button
                  key={amt}
                  type="button"
                  onClick={() => handleAmountChange(String(amt))}
                  className="rounded-md border border-ink-line bg-ink-900 px-2 py-1 text-xs font-mono font-semibold text-slate-300 hover:border-brand-500 hover:text-brand-300 transition active:scale-95"
                >
                  ₱{amt}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div>
            <label className="label flex items-center justify-between">
              <span>Measured Weight ({unitName})</span>
              <span className="text-[10px] text-slate-400">Up to 6 decimals (e.g. 0.37755)</span>
            </label>
            <div className="relative">
              <input
                ref={inputRef}
                type="number"
                step="any"
                min="0"
                autoFocus
                placeholder="0.000000"
                value={weightStr}
                onChange={(e) => handleWeightChange(e.target.value)}
                className="input w-full pr-12 text-xl font-black font-mono text-cyan-400 bg-ink-950 focus:border-brand-500"
              />
              <span className="absolute right-3.5 top-1/2 -translate-y-1/2 font-bold text-slate-400 text-xs uppercase">
                {unitName}
              </span>
            </div>

            {/* Quick Weight Presets */}
            <div className="flex flex-wrap items-center gap-1.5 mt-2">
              <span className="text-[10px] text-slate-500 mr-1">Presets:</span>
              {weightPresets.map((w) => (
                <button
                  key={w}
                  type="button"
                  onClick={() => handleWeightChange(String(w))}
                  className="rounded-md border border-ink-line bg-ink-900 px-2 py-1 text-xs font-mono font-semibold text-slate-300 hover:border-brand-500 hover:text-brand-300 transition active:scale-95"
                >
                  {w} {unitName}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Live Converted Preview Card */}
        <div className="rounded-xl border border-brand-500/30 bg-brand-500/5 p-3.5 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400 flex items-center gap-1.5">
              <Scale className="h-3.5 w-3.5 text-cyan-400" />
              Computed Quantity:
            </span>
            <span className="font-mono font-bold text-cyan-300 text-sm">
              {computedWeight > 0 ? Number(computedWeight.toFixed(6)).toString() : '0.000'} {unitName}
            </span>
          </div>

          <div className="flex items-center justify-between text-xs pt-1 border-t border-brand-500/20">
            <span className="text-slate-400 flex items-center gap-1.5">
              <Banknote className="h-3.5 w-3.5 text-emerald-400" />
              Computed Total:
            </span>
            <span className="font-mono font-black text-emerald-400 text-lg">
              {money(computedSubtotalC)}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-2 pt-1">
          <button
            type="button"
            onClick={onClose}
            className="btn-ghost text-xs py-2 px-3 flex items-center gap-1.5 text-slate-400 hover:text-white"
          >
            <X className="h-4 w-4" />
            <span>Cancel (Esc)</span>
          </button>
          <button
            type="button"
            disabled={computedWeight <= 0}
            onClick={handleApply}
            className="btn-primary text-xs py-2 px-4 flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold disabled:opacity-40 disabled:hover:bg-emerald-600"
          >
            <Check className="h-4 w-4" />
            <span>Apply to Cart (Enter)</span>
          </button>
        </div>
      </div>
    </Modal>
  )
}
