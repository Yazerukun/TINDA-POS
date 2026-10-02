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

export function maxQuantity(stockBase: number, conversionToBase: number, isWeighable = false): number {
  if (!Number.isFinite(stockBase) || !Number.isFinite(conversionToBase) || conversionToBase <= 0) return 0
  const max = stockBase / conversionToBase
  if (isWeighable) return Math.max(0, Math.round(max * 1000) / 1000)
  return Math.max(0, Math.floor(max))
}

export function hasStockConflict(item: StockAwareCartItem): boolean {
  return reservedBase(item) > item.stock_base
}

export function cartHasStockConflict(items: StockAwareCartItem[]): boolean {
  return items.some(hasStockConflict)
}
