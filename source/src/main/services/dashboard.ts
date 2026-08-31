import { getDb } from '../database/connection'
import type { DashboardStats } from '@shared/types'
import { lowStockProducts, outOfStockProducts } from '../repositories/products'
import { listSales } from '../repositories/sales'
import { sumExpenses } from '../repositories/expenses'

export function dashboardStats(): DashboardStats {
  const db = getDb()
  const today = new Date().toISOString().slice(0, 10)

  const sales = listSales(db, {
    from: `${today} 00:00:00`,
    to: `${today} 23:59:59`
  }).rows.filter((s) => s.status !== 'VOIDED')
  const todaySales = sales.reduce((s, x) => s + x.total_c, 0)
  const todayCost = sales.reduce((s, x) => s + x.items.reduce((a, i) => a + i.cost_base_c * i.qty_base, 0), 0)
  const todayProfit = todaySales - sales.reduce((s, x) => s + x.discount_c, 0) - todayCost

  let cash = 0
  let gcash = 0
  let maya = 0
  for (const s of sales)
    for (const p of s.payments) {
      if (p.method === 'CASH') cash += p.amount_c
      if (p.method === 'GCASH') gcash += p.amount_c
      if (p.method === 'MAYA') maya += p.amount_c
    }

  const outstanding =
    (db.prepare('SELECT COALESCE(SUM(balance_c),0) AS s FROM customers').get() as { s: number }).s

  const itemsSold = sales.reduce((s, x) => s + x.items.reduce((a, i) => a + i.qty_base, 0), 0)

  const topSelling = db
    .prepare(
      `SELECT si.product_id, si.product_name AS name, SUM(si.qty_base) AS qty_sold, SUM(si.subtotal_c) AS revenue_c
       FROM sale_items si JOIN sales s ON s.id = si.sale_id
       WHERE s.status != 'VOIDED' AND s.created_at >= ? GROUP BY si.product_id, si.product_name
       ORDER BY qty_sold DESC LIMIT 8`
    )
    .all(`${today} 00:00:00`) as DashboardStats['top_selling']

  const recent = listSales(db, { limit: 10 }).rows.filter((s) => s.status !== 'VOIDED')

  return {
    today_sales_c: todaySales,
    today_profit_c: todayProfit,
    today_transactions: sales.length,
    today_items_sold: itemsSold,
    expenses_today_c: sumExpenses(db, today, today),
    expenses_7d_c: sumExpenses(db, new Date(Date.now() - 6 * 86400000).toISOString().slice(0, 10), today),
    outstanding_utang_c: outstanding,
    cash_sales_today_c: cash,
    gcash_today_c: gcash,
    maya_today_c: maya,
    low_stock: lowStockProducts(db),
    out_of_stock: outOfStockProducts(db),
    top_selling: topSelling.map((t) => ({ ...t, name: String(t.name) })),
    recent_sales: recent
  }
}