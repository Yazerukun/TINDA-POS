export interface StockAwareCartItem {
  product_id: number
  qty: number
  conversion_to_base: number
  stock_base: number
}

export function reservedBase(item: Pick<StockAwareCartItem, 'qty' | 'conversion_to_base'>): number {
  return item.qty * item.conversion_to_base
}

export function availableBase(stockBase: number, item?: Pick<StockAwareCartItem, 'qty' | 'conversion_to_base'>): number {
  return stockBase - (item ? reservedBase(item) : 0)
}

export function maxQuantity(stockBase: number, conversionToBase: number): number {
  if (!Number.isFinite(stockBase) || !Number.isInteger(conversionToBase) || conversionToBase < 1) return 0
  return Math.max(0, Math.floor(stockBase / conversionToBase))
}

export function hasStockConflict(item: StockAwareCartItem): boolean {
  return reservedBase(item) > item.stock_base
}

export function cartHasStockConflict(items: StockAwareCartItem[]): boolean {
  return items.some(hasStockConflict)
}

export function calculateItemUnitPrice(
  basePriceC: number,
  qty: number,
  wholesalePriceC?: number | null,
  wholesaleMinQty?: number | null
): { unitPriceC: number; isWholesale: boolean } {
  if (
    wholesalePriceC != null &&
    wholesalePriceC > 0 &&
    wholesaleMinQty != null &&
    wholesaleMinQty > 0 &&
    qty >= wholesaleMinQty
  ) {
    return { unitPriceC: wholesalePriceC, isWholesale: true }
  }
  return { unitPriceC: basePriceC, isWholesale: false }
}

