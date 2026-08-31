import { getDb } from '../database/connection'
import type { ExportResult } from '@shared/types'
import { appDirs } from '../database/connection'
import { writeFileSync, mkdirSync } from 'node:fs'
import { join } from 'node:path'
import { listSales } from '../repositories/sales'
import { listExpenses } from '../repositories/expenses'

function toCsv(header: string[], records: (string | number)[][]): string {
  const esc = (v: string | number) => {
    const s = String(v)
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
  }
  return [header.map(esc).join(','), ...records.map((r) => r.map(esc).join(','))].join('\n')
}

export function exportCsv(
  kind: 'SALES' | 'INVENTORY' | 'EXPENSES' | 'UTANG' | 'TRANSACTIONS',
  opts: { from?: string; to?: string } = {}
): ExportResult {
  const db = getDb()
  const { exports } = appDirs()
  if (!require('node:fs').existsSync(exports)) mkdirSync(exports, { recursive: true })
  const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-')
  let path = ''
  let rows = 0

  const flush = (name: string, header: string[], records: (string | number)[][]) => {
    path = join(exports, `${name}-${stamp}.csv`)
    writeFileSync(path, toCsv(header, records), 'utf8')
    rows = records.length
  }

  if (kind === 'SALES') {
    const sales = listSales(db, { from: opts.from ? `${opts.from} 00:00:00` : undefined, to: opts.to ? `${opts.to} 23:59:59` : undefined, limit: 100000 }).rows
    flush(
      'sales',
      ['Transaction No', 'Date', 'Cashier', 'Customer', 'Items', 'Subtotal', 'Discount', 'Total', 'Method', 'Status'],
      sales.map((s) => [
        s.transaction_no,
        s.created_at,
        s.cashier_name,
        s.customer_name ?? '',
        s.items.length,
        s.subtotal_c / 100,
        s.discount_c / 100,
        s.total_c / 100,
        s.payments.map((p) => p.method).join('+'),
        s.status
      ])
    )
  } else if (kind === 'INVENTORY') {
    const rowsRaw = db
      .prepare(
        `SELECT p.name, c.name AS category_name, p.sku, p.base_unit, p.stock, p.purchase_cost_c, p.default_price_c,
                p.low_stock_threshold, p.status, COALESCE(s.name,'') AS supplier
         FROM products p LEFT JOIN categories c ON c.id = p.category_id LEFT JOIN suppliers s ON s.id = p.supplier_id
         WHERE p.status = 'ACTIVE' ORDER BY p.name`
      )
      .all() as Record<string, unknown>[]
    flush(
      'inventory',
      ['Product', 'Category', 'SKU', 'Base Unit', 'Stock', 'Cost', 'Selling Price', 'Low Stock Threshold', 'Status', 'Supplier'],
      rowsRaw.map((r) => [
        String(r.name),
        String(r.category_name ?? ''),
        String(r.sku),
        String(r.base_unit),
        Number(r.stock),
        Number(r.purchase_cost_c) / 100,
        Number(r.default_price_c) / 100,
        Number(r.low_stock_threshold),
        String(r.status),
        String(r.supplier)
      ])
    )
  } else if (kind === 'EXPENSES') {
    const exp = listExpenses(db, { from: opts.from, to: opts.to, limit: 100000 }).rows
    flush(
      'expenses',
      ['Date', 'Category', 'Amount', 'Description', 'Reference', 'User'],
      exp.map((e) => [e.expense_date, e.category_name, e.amount_c / 100, e.description ?? '', e.reference ?? '', e.user_name])
    )
  } else if (kind === 'UTANG') {
    const customers = db.prepare('SELECT * FROM customers ORDER BY full_name').all() as { full_name: string; nickname: string | null; phone: string | null; balance_c: number; credit_limit_c: number }[]
    flush(
      'utang',
      ['Customer', 'Nickname', 'Phone', 'Balance', 'Credit Limit', 'Available'],
      customers.map((c) => [c.full_name, c.nickname ?? '', c.phone ?? '', c.balance_c / 100, c.credit_limit_c / 100, Math.max(0, c.credit_limit_c - c.balance_c) / 100])
    )
  } else {
    // TRANSACTIONS
    const sales = listSales(db, { from: opts.from ? `${opts.from} 00:00:00` : undefined, to: opts.to ? `${opts.to} 23:59:59` : undefined, limit: 100000 }).rows
    const records: (string | number)[][] = []
    for (const s of sales) for (const it of s.items) {
      records.push([
        s.transaction_no,
        s.created_at,
        s.cashier_name,
        it.product_name,
        it.unit_name,
        it.qty,
        it.unit_price_c / 100,
        it.subtotal_c / 100,
        s.payments.map((p) => p.method).join('+'),
        s.status
      ])
    }
    flush(
      'transactions',
      ['Transaction No', 'Date', 'Cashier', 'Item', 'Unit', 'Qty', 'Unit Price', 'Subtotal', 'Method', 'Status'],
      records
    )
  }

  return { path, rows }
}