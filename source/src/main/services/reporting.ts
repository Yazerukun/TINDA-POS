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
              s.status, s.shift_id
       FROM sales s
       LEFT JOIN users u ON u.id = s.user_id
       LEFT JOIN customers c ON c.id = s.customer_id
       WHERE s.status != 'VOIDED' AND s.created_at >= ? AND s.created_at <= ?
       ORDER BY s.created_at ASC`
    )
    .all(opts.from + ' 00:00:00', opts.to + ' 23:59:59') as (SalesReportRow & { shift_id: number | null })[]

  const dateKeys = [...new Set(rows.map((r) => groupKey(r.created_at, groupBy)))].sort()

  const summary: ReportSummary = {
    sales_total_c: rows.reduce((s, r) => s + r.total_c, 0),
    profit_c: 0,
    items_sold: rows.reduce((s, r) => s + r.items, 0),
    transactions: rows.length,
    cost_c: 0,
    discount_c: rows.reduce((s, r) => s + r.discount_c, 0),
    refunds_c: 0,
    expenses_c: 0
  }

  const cost = db
    .prepare(
      `SELECT COALESCE(SUM(si.cost_base_c * si.qty_base),0) AS c
       FROM sale_items si JOIN sales s ON s.id = si.sale_id
       WHERE s.status != 'VOIDED' AND s.created_at >= ? AND s.created_at <= ?`
    )
    .get(opts.from + ' 00:00:00', opts.to + ' 23:59:59') as { c: number }
  summary.cost_c = cost.c
  summary.profit_c = summary.sales_total_c - summary.discount_c - summary.cost_c

  const refunds = db
    .prepare(
      `SELECT COALESCE(SUM(r.total_c),0) AS c FROM refunds r
       JOIN sales s ON s.id = r.sale_id WHERE s.created_at >= ? AND s.created_at <= ?`
    )
    .get(opts.from + ' 00:00:00', opts.to + ' 23:59:59') as { c: number }
  summary.refunds_c = refunds.c

  const expenses = db
    .prepare(
      `SELECT COALESCE(SUM(amount_c),0) AS c FROM expenses
       WHERE expense_date >= ? AND expense_date <= ?`
    )
    .get(opts.from, opts.to) as { c: number }
  summary.expenses_c = expenses.c

  const chart = dateKeys.map((k) => {
    const inGroup = rows.filter((r) => groupKey(r.created_at, groupBy) === k)
    const total = inGroup.reduce((s, r) => s + r.total_c, 0)
    const cost = inGroup.reduce((s, _r) => s, 0)
    return { label: k, total_c: total, profit_c: total - (cost || 0) }
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