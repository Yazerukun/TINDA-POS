import { useState, useEffect, useCallback } from 'react'
import {
  Calculator as CalcIcon,
  X,
  Plus,
  Minus,
  Percent,
  Delete,
  CornerDownLeft,
  ShoppingCart,
  Coins,
  ArrowRight,
  Sparkles,
  Check
} from 'lucide-react'
import { Modal } from './ui/Modal'
import { toastSuccess, toastError } from '../stores/toast'
import { safeEvalArithmetic } from '../utils/calculator'

interface CashierCalculatorModalProps {
  open: boolean
  onClose: () => void
  currentCartTotalPesos?: number
  onAddCustomItemToCart?: (item: { name: string; price_c: number }) => void
}

const CASH_DENOMINATIONS = [20, 50, 100, 200, 500, 1000]

export function CashierCalculatorModal({
  open,
  onClose,
  currentCartTotalPesos = 0,
  onAddCustomItemToCart
}: CashierCalculatorModalProps): React.JSX.Element | null {
  const [display, setDisplay] = useState('0')
  const [expression, setExpression] = useState('')
  const [resetOnNext, setResetOnNext] = useState(false)
  const [customItemName, setCustomItemName] = useState('Custom Service / Item')

  // Sukli / Change Mode Tab
  const [tab, setTab] = useState<'calc' | 'sukli'>('calc')
  const [billAmount, setBillAmount] = useState(
    currentCartTotalPesos > 0 ? currentCartTotalPesos.toFixed(2) : '0'
  )
  const [cashTendered, setCashTendered] = useState('')

  useEffect(() => {
    if (open && currentCartTotalPesos > 0) {
      setBillAmount(currentCartTotalPesos.toFixed(2))
    }
  }, [open, currentCartTotalPesos])

  const billNum = parseFloat(billAmount) || 0
  const cashNum = parseFloat(cashTendered) || 0
  const hasCashInput = cashTendered.trim().length > 0
  const changePesos = Math.max(0, cashNum - billNum)
  const isShort = hasCashInput && cashNum < billNum
  const shortPesos = Math.max(0, billNum - cashNum)

  // Calculator logic
  const handleDigit = (digit: string) => {
    if (resetOnNext || display === '0' || display === 'Error' || display.startsWith('Cannot')) {
      if (digit === '.') {
        setDisplay('0.')
      } else {
        setDisplay(digit)
      }
      setResetOnNext(false)
      return
    }
    if (digit === '.' && display.includes('.')) return
    setDisplay((prev) => prev + digit)
  }

  const handleOperator = (op: string) => {
    const normOp = op === '÷' ? '/' : op === '×' ? '*' : op === '−' ? '-' : op
    if (display === 'Error' || display.startsWith('Cannot')) {
      setDisplay('0')
      setExpression('')
      setResetOnNext(false)
      return
    }

    // If user just got a calculated result, use that result as first operand
    if (resetOnNext) {
      setExpression(`${display} ${normOp}`)
      setDisplay('0')
      setResetOnNext(false)
      return
    }

    // If display is '0' and expression already ends with an operator, replace operator
    if (display === '0' && expression.length > 0) {
      const trimmed = expression.trimEnd()
      const lastSpace = trimmed.lastIndexOf(' ')
      if (lastSpace >= 0) {
        setExpression(`${trimmed.substring(0, lastSpace)} ${normOp}`)
        return
      }
    }

    setExpression((prev) => `${prev ? prev + ' ' : ''}${display} ${normOp}`)
    setDisplay('0')
    setResetOnNext(false)
  }

  const handleClear = () => {
    setDisplay('0')
    setExpression('')
    setResetOnNext(false)
  }

  const handleBackspace = () => {
    if (resetOnNext || display === 'Error' || display.startsWith('Cannot')) {
      setDisplay('0')
      setResetOnNext(false)
      return
    }
    setDisplay((prev) => {
      if (prev.length <= 1) return '0'
      return prev.slice(0, -1)
    })
  }

  const handlePercent = () => {
    const val = parseFloat(display)
    if (!isNaN(val) && val !== 0) {
      const pct = Math.round(val * 100) / 10000
      setDisplay(String(pct))
      setResetOnNext(true)
    }
  }

  const handleEquals = useCallback(() => {
    const fullExp = `${expression} ${display}`.trim()
    if (!fullExp) return

    const result = safeEvalArithmetic(fullExp)
    if (result.error) {
      setDisplay(result.error)
      setResetOnNext(true)
    } else if (result.value !== null) {
      setDisplay(String(result.value))
      setExpression('')
      setResetOnNext(true)
    }
  }, [display, expression])

  // Keyboard navigation
  useEffect(() => {
    if (!open) return

    const handleKeyDown = (e: KeyboardEvent) => {
      // Isolate input fields (e.g. custom item name, bill amount, cash tendered)
      const isInput =
        e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement

      if (isInput) {
        if (e.key === 'Escape' || e.key === 'F3') {
          e.preventDefault()
          onClose()
        }
        return
      }

      if (e.key === 'Escape' || e.key === 'F3') {
        e.preventDefault()
        onClose()
        return
      }

      if (tab === 'calc') {
        if (/^[0-9]$/.test(e.key)) {
          e.preventDefault()
          handleDigit(e.key)
        } else if (e.key === '.' || e.key === ',') {
          e.preventDefault()
          handleDigit('.')
        } else if (['+', '-', '*', '/'].includes(e.key)) {
          e.preventDefault()
          handleOperator(e.key)
        } else if (e.key === '%') {
          e.preventDefault()
          handlePercent()
        } else if (e.key === 'Enter' || e.key === '=') {
          e.preventDefault()
          handleEquals()
        } else if (e.key === 'Backspace') {
          e.preventDefault()
          handleBackspace()
        } else if (e.key.toLowerCase() === 'c' || e.key === 'Delete') {
          e.preventDefault()
          handleClear()
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [open, tab, handleEquals, onClose, resetOnNext, display, expression])

  const handlePushToCart = () => {
    const val = parseFloat(display)
    if (isNaN(val) || val <= 0) {
      toastError('Invalid amount', 'Cannot add zero or negative price to cart.')
      return
    }

    if (onAddCustomItemToCart) {
      const cleanName = customItemName.trim() || 'Custom Item'
      onAddCustomItemToCart({
        name: cleanName,
        price_c: Math.round(val * 100)
      })
      toastSuccess('Added to cart', `${cleanName}: ₱${val.toFixed(2)} added.`)
      onClose()
    }
  }

  const handleQuickCash = (denom: number) => {
    setCashTendered(String(denom))
  }

  if (!open) return null

  return (
    <Modal open={open} onClose={onClose} title="Cashier Quick Calculator (F3)" maxWidth="max-w-md">
      <div className="space-y-4">
        {/* Mode Switch Tabs */}
        <div className="flex rounded-lg border border-ink-line bg-ink-850 p-1">
          <button
            type="button"
            onClick={() => setTab('calc')}
            className={`flex-1 flex items-center justify-center gap-1.5 rounded-md py-1.5 text-xs font-bold transition-all ${
              tab === 'calc'
                ? 'bg-brand-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <CalcIcon className="h-3.5 w-3.5" />
            Standard Math Pad
          </button>
          <button
            type="button"
            onClick={() => setTab('sukli')}
            className={`flex-1 flex items-center justify-center gap-1.5 rounded-md py-1.5 text-xs font-bold transition-all ${
              tab === 'sukli'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Coins className="h-3.5 w-3.5" />
            Sukli / Change Calculator
          </button>
        </div>

        {tab === 'calc' ? (
          /* Calculator View */
          <div className="space-y-3">
            {/* Screen Display */}
            <div className="rounded-xl border border-ink-line bg-ink-950 p-3.5 text-right font-mono">
              <div className="min-h-5 text-xs font-medium text-slate-500 truncate">
                {expression || ' '}
              </div>
              <div className="text-3xl font-bold tracking-tight text-white select-all overflow-x-auto">
                {display}
              </div>
            </div>

            {/* Keypad Grid */}
            <div className="grid grid-cols-4 gap-2 text-sm font-bold">
              {/* Row 1 */}
              <button
                type="button"
                onClick={handleClear}
                className="rounded-lg bg-rose-500/20 text-rose-300 border border-rose-500/30 p-3 hover:bg-rose-500/30 active:scale-95"
                title="Clear all (C)"
              >
                C
              </button>
              <button
                type="button"
                onClick={handleBackspace}
                className="rounded-lg bg-ink-800 text-slate-300 border border-ink-line p-3 hover:bg-ink-750 active:scale-95 flex items-center justify-center"
                title="Backspace"
              >
                <Delete className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => handleOperator('/')}
                className="rounded-lg bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 p-3 hover:bg-indigo-500/30 active:scale-95"
                title="Divide (/)"
              >
                ÷
              </button>
              <button
                type="button"
                onClick={() => handleOperator('*')}
                className="rounded-lg bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 p-3 hover:bg-indigo-500/30 active:scale-95"
                title="Multiply (*)"
              >
                ×
              </button>

              {/* Row 2 */}
              <button
                type="button"
                onClick={() => handleDigit('7')}
                className="rounded-lg bg-ink-800 text-white border border-ink-line p-3 hover:bg-ink-750 active:scale-95"
              >
                7
              </button>
              <button
                type="button"
                onClick={() => handleDigit('8')}
                className="rounded-lg bg-ink-800 text-white border border-ink-line p-3 hover:bg-ink-750 active:scale-95"
              >
                8
              </button>
              <button
                type="button"
                onClick={() => handleDigit('9')}
                className="rounded-lg bg-ink-800 text-white border border-ink-line p-3 hover:bg-ink-750 active:scale-95"
              >
                9
              </button>
              <button
                type="button"
                onClick={() => handleOperator('-')}
                className="rounded-lg bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 p-3 hover:bg-indigo-500/30 active:scale-95"
                title="Subtract (-)"
              >
                −
              </button>

              {/* Row 3 */}
              <button
                type="button"
                onClick={() => handleDigit('4')}
                className="rounded-lg bg-ink-800 text-white border border-ink-line p-3 hover:bg-ink-750 active:scale-95"
              >
                4
              </button>
              <button
                type="button"
                onClick={() => handleDigit('5')}
                className="rounded-lg bg-ink-800 text-white border border-ink-line p-3 hover:bg-ink-750 active:scale-95"
              >
                5
              </button>
              <button
                type="button"
                onClick={() => handleDigit('6')}
                className="rounded-lg bg-ink-800 text-white border border-ink-line p-3 hover:bg-ink-750 active:scale-95"
              >
                6
              </button>
              <button
                type="button"
                onClick={() => handleOperator('+')}
                className="rounded-lg bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 p-3 hover:bg-indigo-500/30 active:scale-95"
                title="Add (+)"
              >
                +
              </button>

              {/* Row 4 */}
              <button
                type="button"
                onClick={() => handleDigit('1')}
                className="rounded-lg bg-ink-800 text-white border border-ink-line p-3 hover:bg-ink-750 active:scale-95"
              >
                1
              </button>
              <button
                type="button"
                onClick={() => handleDigit('2')}
                className="rounded-lg bg-ink-800 text-white border border-ink-line p-3 hover:bg-ink-750 active:scale-95"
              >
                2
              </button>
              <button
                type="button"
                onClick={() => handleDigit('3')}
                className="rounded-lg bg-ink-800 text-white border border-ink-line p-3 hover:bg-ink-750 active:scale-95"
              >
                3
              </button>
              <button
                type="button"
                onClick={handleEquals}
                className="row-span-2 rounded-lg bg-brand-600 text-white shadow-md p-3 hover:bg-brand-500 active:scale-95 flex items-center justify-center font-bold text-lg border border-brand-400/40"
                title="Calculate Result (= or Enter)"
              >
                =
              </button>

              {/* Row 5 */}
              <button
                type="button"
                onClick={() => handleDigit('0')}
                className="rounded-lg bg-ink-800 text-white border border-ink-line p-3 hover:bg-ink-750 active:scale-95"
              >
                0
              </button>
              <button
                type="button"
                onClick={() => handleDigit('.')}
                className="rounded-lg bg-ink-800 text-white border border-ink-line p-3 hover:bg-ink-750 active:scale-95"
              >
                .
              </button>
              <button
                type="button"
                onClick={handlePercent}
                className="rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/30 p-3 hover:bg-amber-500/30 active:scale-95 flex items-center justify-center"
                title="Percent (%)"
              >
                <Percent className="h-4 w-4" />
              </button>
            </div>

            {/* Push to Cart Box */}
            {onAddCustomItemToCart && (
              <div className="pt-2 border-t border-ink-line flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Item Name (e.g. Printing, Labor)"
                  value={customItemName}
                  onChange={(e) => setCustomItemName(e.target.value)}
                  className="flex-1 rounded-lg border border-ink-line bg-ink-900 px-3 py-2 text-xs text-white focus:border-brand-500 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={handlePushToCart}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3.5 py-2 text-xs font-bold text-white shadow-md hover:bg-emerald-500 active:scale-95 transition-all shrink-0"
                >
                  <ShoppingCart className="h-3.5 w-3.5" />
                  Add to Cart
                </button>
              </div>
            )}
          </div>
        ) : (
          /* Sukli / Change Mode View */
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl border border-ink-line bg-ink-900 p-3">
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Due Total Amount
                </label>
                <div className="flex items-center gap-1">
                  <span className="text-slate-500 text-sm">₱</span>
                  <input
                    type="number"
                    step="0.25"
                    value={billAmount}
                    onChange={(e) => setBillAmount(e.target.value)}
                    className="w-full bg-transparent font-mono text-xl font-extrabold text-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="rounded-xl border border-brand-500/30 bg-brand-500/10 p-3">
                <label className="block text-[11px] font-bold text-brand-300 uppercase tracking-wider mb-1">
                  Cash Tendered (Bayad)
                </label>
                <div className="flex items-center gap-1">
                  <span className="text-brand-400 text-sm">₱</span>
                  <input
                    type="number"
                    step="1"
                    placeholder="0.00"
                    autoFocus
                    value={cashTendered}
                    onChange={(e) => setCashTendered(e.target.value)}
                    className="w-full bg-transparent font-mono text-xl font-extrabold text-white placeholder-slate-600 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Quick Bill Tap Buttons */}
            <div>
              <p className="text-[11px] font-bold text-slate-400 mb-1.5">Fast Cash Tender:</p>
              <div className="grid grid-cols-3 gap-1.5">
                {CASH_DENOMINATIONS.map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => handleQuickCash(d)}
                    className="rounded-lg border border-ink-line bg-ink-850 px-2 py-1.5 text-xs font-bold text-slate-200 hover:border-emerald-500/50 hover:bg-emerald-500/10 hover:text-emerald-300 transition-all active:scale-95"
                  >
                    ₱{d}
                  </button>
                ))}
              </div>
              <div className="flex gap-1.5 mt-1.5">
                <button
                  type="button"
                  onClick={() => setCashTendered(String(billNum))}
                  className="flex-1 rounded-lg border border-brand-500/30 bg-brand-500/20 px-2 py-1 text-xs font-bold text-brand-200 hover:bg-brand-500/30 active:scale-95"
                >
                  Exact Amount (₱{billNum.toFixed(2)})
                </button>
                <button
                  type="button"
                  onClick={() => setCashTendered('')}
                  className="rounded-lg border border-ink-line bg-ink-850 px-3 py-1 text-xs font-bold text-slate-400 hover:text-white"
                >
                  Clear
                </button>
              </div>
            </div>

            {/* Change Display Card */}
            <div
              className={`rounded-2xl border p-4 text-center transition-all ${
                !hasCashInput
                  ? 'border-ink-line bg-ink-900/60'
                  : isShort
                  ? 'border-rose-500/40 bg-rose-500/10'
                  : 'border-emerald-500/40 bg-emerald-500/10'
              }`}
            >
              <p className="text-xs font-extrabold uppercase tracking-wider text-slate-300">
                {!hasCashInput
                  ? 'Waiting for Cash Tendered...'
                  : isShort
                  ? 'Kulang Pa (Remaining Due):'
                  : 'Sukli (Customer Change):'}
              </p>
              <p
                className={`text-4xl font-extrabold font-mono mt-1 ${
                  !hasCashInput
                    ? 'text-slate-500'
                    : isShort
                    ? 'text-rose-400'
                    : 'text-emerald-400'
                }`}
              >
                {!hasCashInput ? '₱0.00' : `₱${(isShort ? shortPesos : changePesos).toFixed(2)}`}
              </p>
              {hasCashInput && !isShort && cashNum >= billNum && billNum > 0 && (
                <p className="text-xs text-slate-400 mt-1">
                  Cash: ₱{cashNum.toFixed(2)} − Total: ₱{billNum.toFixed(2)}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-2 border-t border-ink-line text-xs text-slate-400">
          <span>Press <strong>F3</strong> or <strong>Esc</strong> to close</span>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-ink-line px-3 py-1.5 text-xs font-semibold text-slate-300 hover:bg-ink-800"
          >
            Close
          </button>
        </div>
      </div>
    </Modal>
  )
}
