import React, { useEffect } from 'react'
import type { Product, ProductUnit } from '@shared/types'
import { money, formatQuantity } from '@shared/format'
import { Modal } from './ui/Modal'

interface UnitPickerModalProps {
  product: Product | null
  currentUnitName?: string
  onClose: () => void
  onSelectUnit: (unit: ProductUnit) => void
}

export function UnitPickerModal({
  product,
  currentUnitName,
  onClose,
  onSelectUnit
}: UnitPickerModalProps): React.JSX.Element | null {
  if (!product) return null

  const units: ProductUnit[] = product.units && product.units.length > 0
    ? product.units
    : [{ id: 0, product_id: product.id, name: product.base_unit, conversion_to_base: 1, barcode: null, selling_price_c: product.default_price_c, is_default: true }]

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
        return
      }
      const num = parseInt(e.key, 10)
      if (!isNaN(num) && num >= 1 && num <= units.length) {
        e.preventDefault()
        const selected = units[num - 1]
        if (selected) onSelectUnit(selected)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [units, onClose, onSelectUnit])

  return (
    <Modal
      open={Boolean(product)}
      onClose={onClose}
      title={`Select Packaging Unit: ${product.name}`}
      maxWidth="max-w-md"
    >
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs text-slate-400 bg-ink-900/50 p-2.5 rounded-lg border border-ink-line">
          <span>Available Base Stock: <b className="text-white">{formatQuantity(product.stock)} {product.base_unit}</b></span>
          <span className="text-[11px] text-slate-500">Press number key (1, 2, 3...) or tap unit</span>
        </div>

        <div className="grid grid-cols-1 gap-2">
          {units.map((u, idx) => {
            const isCurrent = currentUnitName === u.name
            const priceC = (u.selling_price_c && u.selling_price_c > 0)
              ? u.selling_price_c
              : (u.conversion_to_base === 1 ? product.default_price_c : Math.round(product.default_price_c * u.conversion_to_base))
            const maxUnitsAvailable = Math.floor(product.stock / (u.conversion_to_base || 1))

            return (
              <button
                key={u.id ?? idx}
                type="button"
                onClick={() => onSelectUnit(u)}
                className={`group flex items-center justify-between p-3 rounded-xl border transition-all text-left ${
                  isCurrent
                    ? 'border-brand-500 bg-brand-500/10 shadow-lg shadow-brand-500/10'
                    : 'border-ink-line bg-ink-850 hover:border-brand-500/50 hover:bg-ink-800'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-ink-900 border border-ink-line font-mono font-bold text-sm text-brand-400 group-hover:bg-brand-500 group-hover:text-slate-950 transition-colors">
                    {idx + 1}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-white capitalize">{u.name}</span>
                      {u.is_default && (
                        <span className="rounded bg-slate-800 px-1.5 py-0.2 text-[9px] font-semibold text-slate-400 border border-slate-700">
                          Base
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      {u.conversion_to_base === 1
                        ? `1 ${product.base_unit} per unit`
                        : `Contains ${u.conversion_to_base} ${product.base_unit}s (${maxUnitsAvailable} packs in stock)`}
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <p className="text-base font-bold text-emerald-400 tabular-nums">{money(priceC)}</p>
                  <span className="text-[10px] text-slate-500">/{u.name}</span>
                </div>
              </button>
            )
          })}
        </div>

        <div className="flex justify-end pt-2">
          <button type="button" onClick={onClose} className="btn-ghost text-xs">
            Cancel (Esc)
          </button>
        </div>
      </div>
    </Modal>
  )
}
