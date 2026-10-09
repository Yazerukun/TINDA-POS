export type PromoType = 'FIXED_COMBO' | 'VOLUME_TIER'

export interface PromoBundleItem {
  product_id?: number
  name_keyword: string
  quantity: number
  unit_price_c?: number
}

export interface PromoBundle {
  id: string
  name: string
  type: PromoType
  bundle_price_c: number
  is_active: boolean
  description: string
  badge?: string
  // For FIXED_COMBO: required items
  items: PromoBundleItem[]
  // For VOLUME_TIER:
  target_name_keyword?: string
  min_quantity?: number
}

const STORAGE_KEY = 'tinda_promo_bundles_v1'

export const DEFAULT_PROMO_BUNDLES: PromoBundle[] = [
  {
    id: 'combo_breakfast',
    name: 'Breakfast Combo (Pancit Canton + Egg)',
    type: 'FIXED_COMBO',
    bundle_price_c: 2800, // ₱28.00 (regular ₱32.00)
    is_active: true,
    description: 'Instant pancit canton plus fresh egg bundle',
    badge: 'Popular',
    items: [
      { name_keyword: 'canton', quantity: 1 },
      { name_keyword: 'egg', quantity: 1 }
    ]
  },
  {
    id: 'combo_snack',
    name: 'Merienda Combo (Drink + Snack)',
    type: 'FIXED_COMBO',
    bundle_price_c: 3000, // ₱30.00 (regular ₱35.00)
    is_active: true,
    description: 'Chilled beverage and chips / biscuit combo',
    badge: 'Save ₱5',
    items: [
      { name_keyword: 'coke', quantity: 1 },
      { name_keyword: 'chippy', quantity: 1 }
    ]
  },
  {
    id: 'tier_noodles_3for50',
    name: '3 Noodles for ₱50 Bulk Tier',
    type: 'VOLUME_TIER',
    bundle_price_c: 5000, // ₱50.00
    is_active: true,
    description: 'Buy any 3 instant noodle packs for ₱50',
    badge: 'Volume Deal',
    items: [],
    target_name_keyword: 'noodles',
    min_quantity: 3
  }
]

export function getStoredPromoBundles(): PromoBundle[] {
  if (typeof window === 'undefined' || !window.localStorage) {
    return DEFAULT_PROMO_BUNDLES
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return DEFAULT_PROMO_BUNDLES
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : DEFAULT_PROMO_BUNDLES
  } catch {
    return DEFAULT_PROMO_BUNDLES
  }
}

export function savePromoBundles(bundles: PromoBundle[]): void {
  if (typeof window === 'undefined' || !window.localStorage) return
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(bundles))
    window.dispatchEvent(new CustomEvent('tinda:promo-bundles-changed', { detail: bundles }))
  } catch (e) {
    console.error('Failed to save promo bundles', e)
  }
}

export interface EvaluatedPromo {
  bundle: PromoBundle
  appliedCount: number
  savingsC: number
}

/**
 * Pure evaluator for cart items against active promo bundles.
 * Calculates how many times each combo can be fulfilled and total customer savings.
 */
export function evaluateCartPromos(
  cartItems: Array<{ product_id: number | null; name: string; qty: number; unit_price_c: number }>,
  bundles: PromoBundle[]
): EvaluatedPromo[] {
  const activeBundles = bundles.filter((b) => b.is_active)
  const results: EvaluatedPromo[] = []

  for (const bundle of activeBundles) {
    if (bundle.type === 'FIXED_COMBO') {
      if (!bundle.items || bundle.items.length === 0) continue

      // Find cart matching items
      let possibleCombos = Infinity
      let regularComboPriceC = 0

      for (const required of bundle.items) {
        const keyword = required.name_keyword.toLowerCase().trim()
        const found = cartItems.find((i) => i.name.toLowerCase().includes(keyword))
        if (!found || found.qty < required.quantity) {
          possibleCombos = 0
          break
        }
        const matchesCount = Math.floor(found.qty / required.quantity)
        possibleCombos = Math.min(possibleCombos, matchesCount)
        regularComboPriceC += required.quantity * found.unit_price_c
      }

      if (possibleCombos > 0 && possibleCombos !== Infinity) {
        const savingsPerCombo = Math.max(0, regularComboPriceC - bundle.bundle_price_c)
        if (savingsPerCombo > 0) {
          results.push({
            bundle,
            appliedCount: possibleCombos,
            savingsC: savingsPerCombo * possibleCombos
          })
        }
      }
    } else if (bundle.type === 'VOLUME_TIER') {
      if (!bundle.target_name_keyword || !bundle.min_quantity) continue
      const keyword = bundle.target_name_keyword.toLowerCase().trim()
      const found = cartItems.find((i) => i.name.toLowerCase().includes(keyword))

      if (found && found.qty >= bundle.min_quantity) {
        const tiersCount = Math.floor(found.qty / bundle.min_quantity)
        const regularPriceForTier = bundle.min_quantity * found.unit_price_c
        const savingsPerTier = Math.max(0, regularPriceForTier - bundle.bundle_price_c)

        if (savingsPerTier > 0) {
          results.push({
            bundle,
            appliedCount: tiersCount,
            savingsC: savingsPerTier * tiersCount
          })
        }
      }
    }
  }

  return results
}
