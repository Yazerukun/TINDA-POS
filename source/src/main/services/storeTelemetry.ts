import type Database from 'better-sqlite3'
import { getDb } from '../database/connection'
import { getSettings } from '../repositories/settings'
import { listExpiration } from '../repositories/expiration'
import { localDate } from '@shared/expiration'
import type {
  StoreTelemetrySummary,
  TelemetryTopProduct,
  TelemetryLowStockItem,
  TelemetryExpiringItem,
  TelemetryUtangSummary,
  TelemetryUtangCustomer
} from '@shared/types'

interface TelemetryCacheEntry {
  data: StoreTelemetrySummary
  timestamp: number
}

let cachedTelemetry: TelemetryCacheEntry | null = null
const TELEMETRY_CACHE_TTL_MS = 10_000 // 10 seconds TTL

/**
 * Invalidates the in-memory telemetry cache so next call computes fresh.
 */
export function invalidateStoreTelemetryCache(): void {
  cachedTelemetry = null
}

/**
 * Computes today's exact store metrics from the SQLite database.
 * Supports in-memory caching with 10s TTL for instant 0ms responses.
 *
 * STRICT INVARIANT (Rule #14 Zero-Error standard):
 * - All financial totals are strictly represented as exact integer centavos (`_c`).
 * - Zero floating-point drift.
 * - Timezone matching adheres strictly to store local calendar boundaries (`localDate()`).
 */
export function getStoreTelemetrySummary(
  db?: Database.Database,
  options?: { forceRefresh?: boolean; useCache?: boolean }
): StoreTelemetrySummary {
  const isCustomDb = db !== undefined
  const shouldCheckCache = (!isCustomDb || options?.useCache) && !options?.forceRefresh
  const now = Date.now()

  if (shouldCheckCache && cachedTelemetry && (now - cachedTelemetry.timestamp < TELEMETRY_CACHE_TTL_MS)) {
    return cachedTelemetry.data
  }

  const database = db ?? getDb()
  const today = localDate()
  const from = `${today} 00:00:00`
  const to = `${today} 23:59:59`
  const generated_at = new Date().toISOString()

  // 1. Sales & Voids Aggregate
  const salesAgg = database
    .prepare(
      `SELECT
        COALESCE(SUM(CASE WHEN status != 'VOIDED' THEN subtotal_c ELSE 0 END), 0) AS gross_sales_c,
        COALESCE(SUM(CASE WHEN status != 'VOIDED' THEN discount_c ELSE 0 END), 0) AS discount_c,
        COALESCE(SUM(CASE WHEN status != 'VOIDED' THEN total_c ELSE 0 END), 0) AS total_sales_c,
        COALESCE(SUM(CASE WHEN status != 'VOIDED' THEN 1 ELSE 0 END), 0) AS transaction_count,
        COALESCE(SUM(CASE WHEN status = 'VOIDED' THEN 1 ELSE 0 END), 0) AS void_count,
        COALESCE(SUM(CASE WHEN status = 'VOIDED' THEN total_c ELSE 0 END), 0) AS void_total_c
      FROM sales
      WHERE created_at >= ? AND created_at <= ?`
    )
    .get(from, to) as {
      gross_sales_c: number
      discount_c: number
      total_sales_c: number
      transaction_count: number
      void_count: number
      void_total_c: number
    }

  // 2. Refunds Aggregate
  const refundAgg = database
    .prepare(
      `SELECT
        COALESCE(SUM(r.total_c), 0) AS refund_total_c,
        COALESCE(SUM(MAX(0, r.total_c - COALESCE((
          SELECT SUM(cl.amount_c) FROM credit_ledger cl
          WHERE cl.entry_type = 'REFUND' AND cl.reference_type = 'REFUND' AND cl.reference_id = r.id
        ), 0))), 0) AS cash_refunds_c
      FROM refunds r
      JOIN sales s ON s.id = r.sale_id
      WHERE r.created_at >= ? AND r.created_at <= ? AND s.status != 'VOIDED'`
    )
    .get(from, to) as {
      refund_total_c: number
      cash_refunds_c: number
    }

  // Net Sales: Gross - Discount - Refunds
  const net_sales_c = Math.max(0, salesAgg.gross_sales_c - salesAgg.discount_c - refundAgg.refund_total_c)

  // 3. Payment Method Allocation & Drawer Cash Retained
  const paymentRows = database
    .prepare(
      `SELECT p.sale_id, p.method, COALESCE(p.amount_c, 0) AS amount_c, s.total_c
       FROM payments p
       JOIN sales s ON s.id = p.sale_id
       WHERE s.created_at >= ? AND s.created_at <= ? AND s.status != 'VOIDED'`
    )
    .all(from, to) as { sale_id: number; method: string; amount_c: number; total_c: number }[]

  let gcash_c = 0
  let maya_c = 0
  let maribank_c = 0
  let utang_c = 0

  const cashBySale = new Map<number, { tendered: number; nonCash: number; total: number }>()

  for (const row of paymentRows) {
    if (row.method === 'GCASH') gcash_c += row.amount_c
    else if (row.method === 'MAYA') maya_c += row.amount_c
    else if (row.method === 'MARIBANK') maribank_c += row.amount_c
    else if (row.method === 'UTANG') utang_c += row.amount_c

    const entry = cashBySale.get(row.sale_id) ?? { tendered: 0, nonCash: 0, total: row.total_c }
    if (row.method === 'CASH') {
      entry.tendered += row.amount_c
    } else {
      entry.nonCash += row.amount_c
    }
    cashBySale.set(row.sale_id, entry)
  }

  // Amount retained in drawer from cash transactions
  const cash_c = [...cashBySale.values()].reduce(
    (sum, sale) => sum + Math.min(sale.tendered, Math.max(0, sale.total - sale.nonCash)),
    0
  )

  // 4. Drawer Cash Movements & Opening Float
  const shiftRows = database
    .prepare(
      `SELECT starting_cash_c
       FROM shifts
       WHERE (opened_at >= ? AND opened_at <= ?) OR status = 'OPENED'`
    )
    .all(from, to) as { starting_cash_c: number }[]

  const opening_float_c = shiftRows.reduce((sum, s) => sum + (s.starting_cash_c || 0), 0)

  const movements = database
    .prepare(
      `SELECT
        COALESCE(SUM(CASE WHEN type = 'CASH_IN' THEN amount_c ELSE 0 END), 0) AS cash_in_c,
        COALESCE(SUM(CASE WHEN type = 'CASH_OUT' THEN amount_c ELSE 0 END), 0) AS cash_out_c
      FROM cash_movements
      WHERE created_at >= ? AND created_at <= ?`
    )
    .get(from, to) as { cash_in_c: number; cash_out_c: number }

  const expensesAgg = database
    .prepare(
      `SELECT COALESCE(SUM(amount_c), 0) AS cash_expenses_c
       FROM expenses
       WHERE (expense_date = ? OR (created_at >= ? AND created_at <= ?))`
    )
    .get(today, from, to) as { cash_expenses_c: number }

  const expected_drawer_cash_c = Math.max(
    0,
    opening_float_c +
      cash_c +
      movements.cash_in_c -
      movements.cash_out_c -
      expensesAgg.cash_expenses_c -
      refundAgg.cash_refunds_c
  )

  // 5. Top 5 Best-Selling Products Today
  const topProductsRaw = database
    .prepare(
      `SELECT
        si.product_id,
        si.product_name AS name,
        COALESCE(SUM(si.qty_base), 0) AS qty_sold,
        COALESCE(SUM(si.subtotal_c), 0) AS revenue_c
      FROM sale_items si
      JOIN sales s ON s.id = si.sale_id
      WHERE s.status != 'VOIDED' AND s.created_at >= ? AND s.created_at <= ?
      GROUP BY si.product_id, si.product_name
      ORDER BY qty_sold DESC, revenue_c DESC
      LIMIT 5`
    )
    .all(from, to) as { product_id: number | null; name: string; qty_sold: number; revenue_c: number }[]

  const top_products: TelemetryTopProduct[] = topProductsRaw.map((p) => ({
    product_id: p.product_id,
    name: p.name,
    qty_sold: Number(p.qty_sold),
    revenue_c: Number(p.revenue_c)
  }))

  // 6. Critically Low Stock Items (stock <= low_stock_threshold OR stock <= 5)
  const lowStockRaw = database
    .prepare(
      `SELECT
        p.id,
        p.name,
        p.stock,
        COALESCE(p.low_stock_threshold, 5) AS reorder_level,
        p.base_unit AS unit
      FROM products p
      WHERE p.status = 'ACTIVE' AND (p.stock <= COALESCE(p.low_stock_threshold, 5) OR p.stock <= 5)
      ORDER BY p.stock ASC, p.name ASC
      LIMIT 20`
    )
    .all() as { id: number; name: string; stock: number; reorder_level: number; unit: string }[]

  const critically_low_stock: TelemetryLowStockItem[] = lowStockRaw.map((r) => ({
    id: r.id,
    name: r.name,
    stock: r.stock,
    reorder_level: r.reorder_level,
    unit: r.unit || 'pc'
  }))

  // 7. Expiring Products (within 7 days)
  const allExpiring = listExpiration(database)
  const expiring_products: TelemetryExpiringItem[] = []
  for (const item of allExpiring) {
    if (!item.expiration_date) continue
    const daysUntil = Math.round(
      (Date.parse(`${item.expiration_date}T00:00:00Z`) - Date.parse(`${today}T00:00:00Z`)) / 86400000
    )
    if (daysUntil <= 7) {
      expiring_products.push({
        product_id: item.product_id,
        name: item.product_name,
        expiration_date: item.expiration_date,
        quantity: item.quantity,
        days_until_expiration: daysUntil,
        unit: item.base_unit || 'pc'
      })
    }
  }
  expiring_products.sort((a, b) => a.days_until_expiration - b.days_until_expiration)

  // 8. Unpaid Utang Summary
  const utangAgg = database
    .prepare(
      `SELECT
        COALESCE(SUM(balance_c), 0) AS total_outstanding_c,
        COUNT(*) AS customer_count,
        COALESCE(SUM(CASE WHEN credit_limit_c > 0 AND balance_c > credit_limit_c THEN 1 ELSE 0 END), 0) AS over_limit_count
      FROM customers
      WHERE is_active = 1 AND balance_c > 0`
    )
    .get() as {
      total_outstanding_c: number
      customer_count: number
      over_limit_count: number
    }

  const debtorRows = database
    .prepare(
      `SELECT
        id AS customer_id,
        full_name AS name,
        balance_c,
        credit_limit_c,
        CASE WHEN credit_limit_c > 0 AND balance_c > credit_limit_c THEN 1 ELSE 0 END AS is_over_limit
      FROM customers
      WHERE is_active = 1 AND balance_c > 0
      ORDER BY balance_c DESC
      LIMIT 5`
    )
    .all() as Array<{
      customer_id: number
      name: string
      balance_c: number
      credit_limit_c: number
      is_over_limit: number
    }>

  const top_debtors: TelemetryUtangCustomer[] = debtorRows.map((r) => ({
    customer_id: r.customer_id,
    name: r.name,
    balance_c: r.balance_c,
    credit_limit_c: r.credit_limit_c,
    is_over_limit: Boolean(r.is_over_limit)
  }))

  const unpaid_utang_due: TelemetryUtangSummary = {
    total_outstanding_c: utangAgg.total_outstanding_c,
    customer_count: utangAgg.customer_count,
    over_limit_count: utangAgg.over_limit_count,
    top_debtors
  }

  // 9. Cloud Sync Timestamp
  let last_sync_at: string | null = null
  try {
    const settings = getSettings(database)
    last_sync_at = settings.cloud_last_synced_at ?? null
  } catch {}

  const result: StoreTelemetrySummary = {
    business_date: today,
    generated_at,
    net_sales_c,
    gross_sales_c: salesAgg.gross_sales_c,
    discount_c: salesAgg.discount_c,
    refund_total_c: refundAgg.refund_total_c,
    void_count: salesAgg.void_count,
    void_total_c: salesAgg.void_total_c,
    transaction_count: salesAgg.transaction_count,
    cash_c,
    gcash_c,
    maya_c,
    maribank_c,
    utang_c,
    expected_drawer_cash_c,
    opening_float_c,
    cash_in_c: movements.cash_in_c,
    cash_out_c: movements.cash_out_c,
    cash_expenses_c: expensesAgg.cash_expenses_c,
    cash_refunds_c: refundAgg.cash_refunds_c,
    top_products,
    critically_low_stock,
    expiring_products,
    unpaid_utang_due,
    last_sync_at
  }

  if (!isCustomDb || options?.useCache) {
    cachedTelemetry = { data: result, timestamp: Date.now() }
  }

  return result
}
