const pesoFmt = new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP', minimumFractionDigits: 2 })

export function money(c: number): string {
  return pesoFmt.format((c || 0) / 100)
}

export function moneyPlain(c: number): string {
  return ((c || 0) / 100).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

export function moneyShort(c: number): string {
  const v = (c || 0) / 100
  if (Math.abs(v) >= 1000) return '₱' + Math.round(v).toLocaleString()
  return '₱' + v.toLocaleString('en-PH', { minimumFractionDigits: v % 1 === 0 ? 0 : 2 })
}

export function moneyWholePesos(c: number): string {
  const v = (c || 0) / 100
  if (v % 1 === 0) {
    return '₱' + Math.round(v).toLocaleString('en-PH')
  }
  return money(c)
}

export function pesosToC(pesos: number): number {
  return Math.round(pesos * 100)
}

export function nowLocal(): string {
  return new Date().toLocaleString('en-PH', { dateStyle: 'medium', timeStyle: 'short' })
}

export function shortDate(iso?: string | null): string {
  if (!iso) return '—'
  try {
    const clean = String(iso).replace(' ', 'T')
    const d = new Date(clean)
    if (isNaN(d.getTime())) return String(iso)
    return d.toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })
  } catch {
    return String(iso || '—')
  }
}

export function shortDateTime(iso: string): string {
  return iso
}

// "2 boxes + 19 sachets" style quantity breakdown
export function quantityBreakdown(base: number, units: { name: string; conversion_to_base: number }[]): string {
  let rest = base
  const parts: string[] = []
  const sorted = [...units].filter((u) => u.conversion_to_base > 1).sort((a, b) => b.conversion_to_base - a.conversion_to_base)
  for (const u of sorted) {
    if (rest >= u.conversion_to_base) {
      const n = Math.floor(rest / u.conversion_to_base)
      parts.push(`${n} ${u.name}${n > 1 ? 's' : ''}`)
      rest = rest % u.conversion_to_base
    }
  }
  if (rest > 0 || parts.length === 0) {
    const baseName = units.find((u) => u.conversion_to_base === 1)?.name ?? 'pc'
    parts.push(`${rest} ${baseName}${rest > 1 ? 's' : ''}`)
  }
  return parts.join(' + ')
}

const WEIGHABLE_UNITS_REGEX = /^(kilo|kilos|kg|kls|kilogram|kilograms|g|gram|grams|l|liter|liters|litre|litres|ml|milliliter|milliliters|m|meter|meters)$/i

export function isWeighableUnit(unitName: string | null | undefined): boolean {
  if (!unitName) return false
  return WEIGHABLE_UNITS_REGEX.test(unitName.trim())
}

export function formatQuantity(qty: number, unitName?: string | null): string {
  if (!Number.isFinite(qty)) return '0'
  const valStr = qty % 1 === 0 ? String(qty) : Number(qty.toFixed(3)).toString()
  return unitName ? `${valStr} ${unitName}` : valStr
}