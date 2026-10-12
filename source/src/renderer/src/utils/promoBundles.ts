import type { Product } from '@shared/types'

export type PromoType = 'FIXED_COMBO' | 'VOLUME_TIER'

export interface PromoBundleItem {
  product_id?: number
  product_name?: string
  sku?: string
  unit_name?: string
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
  composite_product_id?: number
  // For FIXED_COMBO: required items from Inventory
  items: PromoBundleItem[]
  // For VOLUME_TIER:
  target_product_id?: number
  target_name_keyword?: string
  min_quantity?: number
}

export interface BundleComponentStatus {
  item: PromoBundleItem
  product?: Product
  availableStock: number
  requiredQty: number
  maxBundles: number
  unitName: string
  unitPriceC: number
  unitCostC: number
  isLinked: boolean
  isEnoughStock: boolean
}

export interface PromoBundleInventoryStatus {
  availableBundles: number
  regularPriceC: number
  totalCostC: number
  savingsC: number
  allLinkedToInventory: boolean
  hasOutOfStockComponent: boolean
  components: BundleComponentStatus[]
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

function getSellableStock(p: Product): number {
  return Math.max(0, p.sellable_stock ?? p.stock ?? 0)
}

/**
 * Resolves a PromoBundleItem to an actual Inventory Product.
 * Prioritizes exact product_id match (Loyverse style), then SKU, then keyword match.
 */
export function resolveBundleComponentProduct(
  item: PromoBundleItem,
  products: Product[]
): Product | undefined {
  if (item.product_id != null) {
    const byId = products.find((p) => p.id === item.product_id)
    if (byId) return byId
  }
  if (item.sku) {
    const skuLower = item.sku.toLowerCase().trim()
    const bySku = products.find((p) => p.sku.toLowerCase() === skuLower)
    if (bySku) return bySku
  }
  const kw = (item.product_name || item.name_keyword || '').toLowerCase().trim()
  if (!kw) return undefined
  const exactName = products.find((p) => p.name.toLowerCase() === kw)
  if (exactName) return exactName
  return products.find(
    (p) => p.name.toLowerCase().includes(kw) || p.sku.toLowerCase().includes(kw)
  )
}

/**
 * Computes real-time Loyverse-style Inventory monitoring metrics for a PromoBundle:
 * - How many complete bundles can be assembled from current Inventory stock
 * - Combined regular retail price vs promo price (Customer Savings)
 * - Combined component purchase cost
 * - Per-component stock availability
 */
export function getPromoBundleInventoryStatus(
  bundle: PromoBundle,
  products: Product[]
): PromoBundleInventoryStatus {
  const effectiveItems: PromoBundleItem[] =
    bundle.type === 'VOLUME_TIER'
      ? [
          {
            product_id: bundle.target_product_id,
            name_keyword: bundle.target_name_keyword || bundle.name,
            quantity: bundle.min_quantity || 3
          }
        ]
      : bundle.items || []

  if (effectiveItems.length === 0) {
    return {
      availableBundles: 0,
      regularPriceC: 0,
      totalCostC: 0,
      savingsC: 0,
      allLinkedToInventory: false,
      hasOutOfStockComponent: true,
      components: []
    }
  }

  // Track total required qty per product_id in case multiple rows reference the same product
  const requiredByProductId = new Map<number, number>()
  const components: BundleComponentStatus[] = []
  let regularPriceC = 0
  let totalCostC = 0
  let allLinkedToInventory = true

  for (const item of effectiveItems) {
    const qty = Math.max(0.001, Number(item.quantity) || 1)
    const prod = resolveBundleComponentProduct(item, products)
    if (prod) {
      requiredByProductId.set(prod.id, (requiredByProductId.get(prod.id) || 0) + qty)
      const avail = getSellableStock(prod)
      const maxForThisRow = Math.floor(avail / qty)
      regularPriceC += Math.round(prod.default_price_c * qty)
      totalCostC += Math.round(prod.purchase_cost_c * qty)
      components.push({
        item,
        product: prod,
        availableStock: avail,
        requiredQty: qty,
        maxBundles: maxForThisRow,
        unitName: prod.base_unit || item.unit_name || 'pc',
        unitPriceC: prod.default_price_c,
        unitCostC: prod.purchase_cost_c,
        isLinked: true,
        isEnoughStock: avail >= qty
      })
    } else {
      allLinkedToInventory = false
      const fallbackPrice = item.unit_price_c || 0
      regularPriceC += Math.round(fallbackPrice * qty)
      components.push({
        item,
        product: undefined,
        availableStock: 0,
        requiredQty: qty,
        maxBundles: 0,
        unitName: item.unit_name || 'pc',
        unitPriceC: fallbackPrice,
        unitCostC: 0,
        isLinked: false,
        isEnoughStock: false
      })
    }
  }

  let availableBundles = allLinkedToInventory ? Infinity : 0
  if (allLinkedToInventory) {
    for (const [prodId, totalReqQty] of requiredByProductId.entries()) {
      const prod = products.find((p) => p.id === prodId)
      const avail = prod ? getSellableStock(prod) : 0
      const canMake = Math.floor(avail / totalReqQty)
      availableBundles = Math.min(availableBundles, canMake)
    }
    if (availableBundles === Infinity) availableBundles = 0
  }

  const hasOutOfStockComponent = components.some((c) => !c.isLinked || !c.isEnoughStock)
  const savingsC = Math.max(0, regularPriceC - bundle.bundle_price_c)

  return {
    availableBundles: Math.max(0, availableBundles),
    regularPriceC,
    totalCostC,
    savingsC,
    allLinkedToInventory,
    hasOutOfStockComponent,
    components
  }
}

export interface EvaluatedPromo {
  bundle: PromoBundle
  appliedCount: number
  savingsC: number
}

/**
 * Pure evaluator for cart items against active promo bundles.
 * Matches by exact Inventory product_id first (Loyverse style), then falls back to keyword.
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

      let possibleCombos = Infinity
      let regularComboPriceC = 0

      for (const required of bundle.items) {
        const keyword = (required.product_name || required.name_keyword || '').toLowerCase().trim()
        const found =
          required.product_id != null
            ? cartItems.find((i) => i.product_id === required.product_id) ||
              (keyword ? cartItems.find((i) => i.name.toLowerCase().includes(keyword)) : undefined)
            : keyword
            ? cartItems.find((i) => i.name.toLowerCase().includes(keyword))
            : undefined

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
      const minQty = bundle.min_quantity || 0
      if (minQty <= 0) continue
      const keyword = (bundle.target_name_keyword || '').toLowerCase().trim()
      const found =
        bundle.target_product_id != null
          ? cartItems.find((i) => i.product_id === bundle.target_product_id) ||
            (keyword ? cartItems.find((i) => i.name.toLowerCase().includes(keyword)) : undefined)
          : keyword
          ? cartItems.find((i) => i.name.toLowerCase().includes(keyword))
          : undefined

      if (found && found.qty >= minQty) {
        const tiersCount = Math.floor(found.qty / minQty)
        const regularPriceForTier = minQty * found.unit_price_c
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

