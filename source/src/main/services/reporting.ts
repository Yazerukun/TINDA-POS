import { getDb } from '../database/connection'
// Aggregation queries that derive reports purely from the live database.
import type { SalesReportRow, ReportSummary, Customer, Product } from '@shared/types'

export function groupKey(localIso: string, groupBy: 'DAILY' | 'WEEKLY' | 'MONTHLY'): string {
  const d = new Date(localIso.replace(' ', 'T'))
  if (groupBy === 'DAILY') return d.toISOString().slice(0, 10)
  if (groupBy === 'MONTHLY') return d.toISOString().slice(0, 7)
  const start = new Date(d)
  const day = (d.getDay() + 6) % 7 // Monday-start
  start.setDate(d.getDate() - day)
  return start.toISOString().slice(0, 10)
}

export function salesReport(opts: { from: string; to: string; groupBy?: 'DAILY' | 'WEEKLY' | 'MONTHLY' }) {
  const db = getDb()
  const groupBy = opts.groupBy ?? 'DAILY'
  const rows = db
    .prepare(
      `SELECT s.id AS sale_id, s.transaction_no, s.created_at,
              COALESCE(u.full_name, u.username, '') AS cashier,
              COALESCE(c.full_name, '') AS customer,
              (SELECT COUNT(*) FROM sale_items si WHERE si.sale_id = s.id) AS items,
              s.subtotal_c, s.discount_c, s.total_c,
              (SELECT GROUP_CONCAT(p.method, ',') FROM payments p WHERE p.sale_id = s.id) AS method,
              (SELECT COALESCE(SUM(p.amount_c), 0) FROM payments p WHERE p.sale_id = s.id AND p.method = 'UTANG') AS utang_c,
              s.status, s.shift_id
       FROM sales s
       LEFT JOIN users u ON u.id = s.user_id
       LEFT JOIN customers c ON c.id = s.customer_id
       WHERE s.status != 'VOIDED' AND s.created_at >= ? AND s.created_at <= ?
       ORDER BY s.created_at ASC`
    )
    .all(opts.from + ' 00:00:00', opts.to + ' 23:59:59') as (SalesReportRow & { shift_id: number | null; utang_c: number })[]

  const dateKeys = [...new Set(rows.map((r) => groupKey(r.created_at, groupBy)))].sort()

  const totalUtang = rows.reduce((s, r) => s + (r.utang_c || 0), 0)
  const grossSalesTotal = rows.reduce((s, r) => s + r.total_c, 0)
  const realizedSalesTotal = Math.max(0, grossSalesTotal - totalUtang)

  const summary: ReportSummary = {
    sales_total_c: realizedSalesTotal,
    profit_c: 0,
    items_sold: rows.reduce((s, r) => s + r.items, 0),
    transactions: rows.length,
    cost_c: 0,
    discount_c: rows.reduce((s, r) => s + r.discount_c, 0),
    refunds_c: 0,
    expenses_c: 0,
    utang_sales_c: totalUtang,
    gross_sales_total_c: grossSalesTotal
  }

  const cost = db
    .prepare(
      `SELECT COALESCE(SUM(si.cost_base_c * si.qty_base),0) AS c
       FROM sale_items si JOIN sales s ON s.id = si.sale_id
       WHERE s.status != 'VOIDED' AND s.created_at >= ? AND s.created_at <= ?`
    )
    .get(opts.from + ' 00:00:00', opts.to + ' 23:59:59') as { c: number }
  summary.cost_c = Math.round(cost.c)

  const refundedCost = db
    .prepare(
      `SELECT COALESCE(SUM(si.cost_base_c * ri.qty_base),0) AS c
       FROM refund_items ri JOIN sale_items si ON si.id = ri.sale_item_id
       JOIN sales s ON s.id = si.sale_id
       WHERE s.status != 'VOIDED' AND s.created_at >= ? AND s.created_at <= ?`
    )
    .get(opts.from + ' 00:00:00', opts.to + ' 23:59:59') as { c: number }

  const refunds = db
    .prepare(
      `SELECT COALESCE(SUM(r.total_c),0) AS c FROM refunds r
       JOIN sales s ON s.id = r.sale_id WHERE s.created_at >= ? AND s.created_at <= ?`
    )
    .get(opts.from + ' 00:00:00', opts.to + ' 23:59:59') as { c: number }
  summary.refunds_c = refunds.c
  // Gross Profit reflects true merchandise margin: (Gross Sales - Refunds) - (COGS - Refunded Cost)
  summary.profit_c = Math.round((grossSalesTotal - refunds.c) - (cost.c - refundedCost.c))

  const expenses = db
    .prepare(
      `SELECT COALESCE(SUM(amount_c),0) AS c FROM expenses
       WHERE expense_date >= ? AND expense_date <= ?`
    )
    .get(opts.from, opts.to) as { c: number }
  summary.expenses_c = expenses.c
  summary.net_profit_c = summary.profit_c - summary.expenses_c

  const costBySale = new Map<number, number>()
  for (const r of db
    .prepare('SELECT sale_id, COALESCE(SUM(cost_base_c * qty_base),0) AS c FROM sale_items GROUP BY sale_id')
    .all() as { sale_id: number; c: number }[]) {
    costBySale.set(r.sale_id, r.c)
  }

  const chart = dateKeys.map((k) => {
    const inGroup = rows.filter((r) => groupKey(r.created_at, groupBy) === k)
    const total = inGroup.reduce((s, r) => s + Math.max(0, r.total_c - (r.utang_c || 0)), 0)
    const grossGroupTotal = inGroup.reduce((s, r) => s + r.total_c, 0)
    const cost = inGroup.reduce((s, r) => s + (costBySale.get(r.sale_id) ?? 0), 0)
    return { label: k, total_c: total, profit_c: Math.round(grossGroupTotal - cost) }
  })

  return { rows, summary, chart }
}

export function inventoryReport() {
  const db = getDb()
  const rows = db
    .prepare(
      `SELECT p.*, c.name AS category_name, p.stock * p.purchase_cost_c AS inventory_value_c,
              p.stock * p.purchase_cost_c AS total_cost_c
       FROM products p LEFT JOIN categories c ON c.id = p.category_id
       WHERE p.status = 'ACTIVE' ORDER BY p.name`
    )
    .all() as (Product & { inventory_value_c: number; total_cost_c: number })[]
  return {
    rows,
    summary: {
      total_units: rows.length,
      inventory_value_c: rows.reduce((s, r) => s + r.inventory_value_c, 0),
      low_stock: rows.filter((r) => r.stock > 0 && r.stock <= r.low_stock_threshold).length,
      out_of_stock: rows.filter((r) => r.stock <= 0).length
    }
  }
}

export function utangReport() {
  const db = getDb()
  const rows = db
    .prepare(
      `SELECT * FROM customers WHERE is_active = 1 AND (balance_c != 0 OR credit_limit_c > 0)
       ORDER BY balance_c DESC`
    )
    .all() as Customer[]
  const total = rows.reduce((s, r) => s + r.balance_c, 0)
  const payments = db.prepare(`SELECT COALESCE(SUM(amount_c),0) AS s FROM credit_ledger WHERE entry_type = 'PAYMENT'`).get() as { s: number }
  return { rows, total_outstanding_c: total, payments_c: payments.s }
}

export function itemSalesReport(opts: { from?: string; to?: string; category_id?: number; search?: string } = {}) {
  const db = getDb()
  const from = opts.from ? `${opts.from} 00:00:00` : '1970-01-01 00:00:00'
  const to = opts.to ? `${opts.to} 23:59:59` : '2099-12-31 23:59:59'
  const whereClauses: string[] = [
    "s.status != 'VOIDED'",
    's.created_at >= ?',
    's.created_at <= ?'
  ]
  const params: (string | number)[] = [from, to]

  if (opts.category_id && opts.category_id > 0) {
    whereClauses.push('p.category_id = ?')
    params.push(opts.category_id)
  }
  if (opts.search && opts.search.trim()) {
    const q = `%${opts.search.trim()}%`
    whereClauses.push('(si.product_name LIKE ? OR p.sku LIKE ? OR p.barcode LIKE ?)')
    params.push(q, q, q)
  }

  const query = `
    SELECT
      si.product_id,
      si.product_name,
      si.unit_name,
      COALESCE(c.name, 'General') AS category_name,
      p.sku,
      p.barcode,
      COUNT(DISTINCT s.id) AS transaction_count,
      SUM(si.qty) AS total_qty,
      SUM(si.qty_base) AS total_qty_base,
      SUM(si.subtotal_c) AS total_sales_c,
      SUM(si.cost_base_c * si.qty_base) AS total_cost_c,
      SUM(si.refunded_qty_base) AS refunded_qty
    FROM sale_items si
    JOIN sales s ON s.id = si.sale_id
    LEFT JOIN products p ON p.id = si.product_id
    LEFT JOIN categories c ON c.id = p.category_id
    WHERE ${whereClauses.join(' AND ')}
    GROUP BY si.product_name, si.unit_name
    ORDER BY total_sales_c DESC
  `
  const rawRows = db.prepare(query).all(...params) as Record<string, unknown>[]
  const rows = rawRows.map((r) => {
    const total_sales_c = Number(r.total_sales_c || 0)
    const total_cost_c = Number(r.total_cost_c || 0)
    const profit_c = total_sales_c - total_cost_c
    const margin_pct = total_sales_c > 0 ? Math.round((profit_c / total_sales_c) * 1000) / 10 : 0
    return {
      product_id: r.product_id != null ? Number(r.product_id) : null,
      product_name: String(r.product_name),
      unit_name: String(r.unit_name || 'pc'),
      category_name: String(r.category_name || 'General'),
      sku: r.sku ? String(r.sku) : null,
      barcode: r.barcode ? String(r.barcode) : null,
      transaction_count: Number(r.transaction_count || 0),
      total_qty: Number(r.total_qty || 0),
      total_qty_base: Number(r.total_qty_base || 0),
      total_sales_c,
      total_cost_c,
      profit_c,
      margin_pct,
      refunded_qty: Number(r.refunded_qty || 0)
    }
  })

  return {
    rows,
    summary: {
      total_items_sold: rows.reduce((acc, r) => acc + r.total_qty, 0),
      total_sales_c: rows.reduce((acc, r) => acc + r.total_sales_c, 0),
      total_cost_c: rows.reduce((acc, r) => acc + r.total_cost_c, 0),
      total_profit_c: rows.reduce((acc, r) => acc + r.profit_c, 0),
      unique_products_count: rows.length
    }
  }
}