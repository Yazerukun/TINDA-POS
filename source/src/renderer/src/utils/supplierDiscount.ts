/**
 * Supplier Chain / Trade Discount Calculator ("Less 5 Less 5", Cascading Discounts)
 *
 * In Philippine wholesale and distributor invoices (e.g. FMCG, Nestlé, Unilever, San Miguel, P&G, Divisoria),
 * trade discounts are frequently given as compounded / series discounts:
 * e.g., "-5%-5%-5%", "10+5", "10/5", "5/5/5", "10-5-3", or flat pesos ("P50", "₱100").
 *
 * Sequential Accounting Logic:
 * Step 1: Gross - d1% = Net 1
 * Step 2: Net 1 - d2% = Net 2
 * Step 3: Net 2 - d3% = Final Net
 */

import { money } from '@shared/format'

export interface ChainDiscountResult {
  raw: string
  percentages: number[]
  netFactor: number
  effectiveRate: number
  effectivePercent: number
  formula: string
  discountAmountC: number
  netAmountC: number
  displayText: string
  isChain: boolean
}

/**
 * Calculates compound/series trade discount from any distributor string notation.
 * Supports:
 * - Single percentage with or without minus: "-50%", "-50", "50%"
 * - Cascading percentages: "-20%-20%", "5+5+5", "10/5", "5/5/5", "10-5-3"
 * - Flat pesos with prefix: "₱50", "P50", "p50", "PHP 50"
 * - Raw number without signs: "50" (treated as flat pesos for backward compatibility)
 */
export function calculateChainDiscount(grossC: number, discountInput: string): ChainDiscountResult {
  const safeGross = Number.isFinite(grossC) ? Math.max(0, Math.round(grossC)) : 0
  const trimmed = (discountInput || '').trim()

  if (!trimmed || trimmed === '0' || trimmed === '0%') {
    return {
      raw: discountInput,
      percentages: [],
      netFactor: 1,
      effectiveRate: 0,
      effectivePercent: 0,
      formula: '',
      discountAmountC: 0,
      netAmountC: safeGross,
      displayText: 'No discount',
      isChain: false
    }
  }

  // Explicit flat peso with currency symbol or prefix (e.g. "₱50", "P50", "p50", "PHP 50")
  if (/^[pP₱]|^(?:php|PHP)\s*/.test(trimmed)) {
    const flatPesos = parseFloat(trimmed.replace(/[^\d.]/g, '')) || 0
    const discountC = Math.min(safeGross, Math.round(flatPesos * 100))
    const netAmountC = Math.max(0, safeGross - discountC)
    const effRate = safeGross > 0 ? discountC / safeGross : 0
    return {
      raw: discountInput,
      percentages: [],
      netFactor: safeGross > 0 ? netAmountC / safeGross : 1,
      effectiveRate: effRate,
      effectivePercent: effRate * 100,
      formula: `₱${flatPesos.toFixed(2)}`,
      discountAmountC: discountC,
      netAmountC,
      displayText: `Less ${money(discountC)} flat`,
      isChain: false
    }
  }

  // Extract all numbers from the input string (handles "-50%", "-50", "-20%-20%", "10/5", "5+5+5", "5%", "50", etc.)
  const rawMatches = trimmed.match(/\d+(?:\.\d+)?/g) || []
  // Cap percentage values at 100% max
  const numbers = rawMatches.map((n) => Math.min(100, parseFloat(n))).filter((n) => !isNaN(n) && n > 0)

  const hasPercentSign = trimmed.includes('%')
  const hasNegativeSign = trimmed.includes('-')

  // If multiple numbers, or has '%' sign, or has leading/embedded '-' discount sign (e.g. "-50%", "-50", "-20%-20%"):
  if (numbers.length > 1 || hasPercentSign || (numbers.length === 1 && hasNegativeSign)) {
    let runningNetC = safeGross
    for (const pct of numbers) {
      const stepDiscountC = Math.round(runningNetC * (pct / 100))
      runningNetC = Math.max(0, runningNetC - stepDiscountC)
    }

    const netAmountC = runningNetC
    const discountAmountC = safeGross - netAmountC
    const effRate =
      safeGross > 0
        ? discountAmountC / safeGross
        : numbers.length === 1
          ? (numbers[0] ?? 0) / 100
          : 1 - numbers.reduce((acc, n) => acc * (1 - n / 100), 1)
    const effectivePct = (effRate * 100).toFixed(2)

    const firstPct = numbers[0] ?? 0
    const displayText =
      numbers.length > 1
        ? `Less ${numbers.map((n) => `${n}%`).join(' Less ')} (-${effectivePct}%) = -${money(discountAmountC)}`
        : `Less ${firstPct}% (-${money(discountAmountC)})`

    return {
      raw: discountInput,
      percentages: numbers,
      netFactor: safeGross > 0 ? netAmountC / safeGross : 1 - effRate,
      effectiveRate: effRate,
      effectivePercent: effRate * 100,
      formula: numbers.map((n) => `${n}%`).join(' + '),
      discountAmountC,
      netAmountC,
      displayText,
      isChain: numbers.length > 1
    }
  }

  // Single number without '%' or '-' or currency symbols (e.g. "50"):
  const singleVal = parseFloat(trimmed.replace(/[^\d.]/g, ''))
  if (!hasPercentSign && !isNaN(singleVal) && singleVal > 0) {
    const discountC = Math.min(safeGross, Math.round(singleVal * 100))
    const netAmountC = Math.max(0, safeGross - discountC)
    const effRate = safeGross > 0 ? discountC / safeGross : 0
    return {
      raw: discountInput,
      percentages: [],
      netFactor: safeGross > 0 ? netAmountC / safeGross : 1,
      effectiveRate: effRate,
      effectivePercent: effRate * 100,
      formula: `₱${singleVal.toFixed(2)}`,
      discountAmountC: discountC,
      netAmountC,
      displayText: `Less ${money(discountC)} flat`,
      isChain: false
    }
  }

  return {
    raw: discountInput,
    percentages: [],
    netFactor: 1,
    effectiveRate: 0,
    effectivePercent: 0,
    formula: '',
    discountAmountC: 0,
    netAmountC: safeGross,
    displayText: '0.00',
    isChain: false
  }
}
