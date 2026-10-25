import * as React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { Dashboard } from '../Dashboard'
import { Product } from '@shared/types'

vi.mock('react', async (importOriginal) => {
  const actual = await importOriginal<typeof React>()
  return { ...actual, useState: vi.fn(), useEffect: vi.fn() }
})

afterEach(() => {
  vi.resetAllMocks()
  vi.unstubAllGlobals()
})

describe('dashboard low stock accurate reporting', () => {
  it('correctly reports more than 10 low-stock items without artificial 10-item cap', async () => {
    vi.stubGlobal('React', React)
    const setState = vi.fn()
    vi.mocked(React.useState).mockImplementation(() => [null, setState] as ReturnType<typeof React.useState>)

    // Generate 15 low stock products (stock = 3, threshold = 5)
    const lowStockProducts = Array.from({ length: 15 }, (_, i) => ({
      id: i + 1,
      name: `Low Stock Item ${i + 1}`,
      sku: `LOW-${i + 1}`,
      barcode: null,
      category_id: 1,
      category_name: 'General',
      purchase_cost_c: 1000,
      default_price_c: 1500,
      stock: 3,
      base_unit: 'pc',
      low_stock_threshold: 5,
      status: 'ACTIVE',
      created_at: '2026-01-01',
      updated_at: '2026-01-01'
    })) as unknown as Product[]

    // Generate 2 out of stock products (stock = 0, threshold = 5)
    const outOfStockProducts = Array.from({ length: 2 }, (_, i) => ({
      id: 100 + i,
      name: `Out of Stock Item ${i + 1}`,
      sku: `OUT-${i + 1}`,
      barcode: null,
      category_id: 1,
      category_name: 'General',
      purchase_cost_c: 1000,
      default_price_c: 1500,
      stock: 0,
      base_unit: 'pc',
      low_stock_threshold: 5,
      status: 'ACTIVE',
      created_at: '2026-01-01',
      updated_at: '2026-01-01'
    })) as unknown as Product[]

    // Generate 5 healthy products (stock = 20, threshold = 5)
    const healthyProducts = Array.from({ length: 5 }, (_, i) => ({
      id: 200 + i,
      name: `Healthy Item ${i + 1}`,
      sku: `OK-${i + 1}`,
      barcode: null,
      category_id: 1,
      category_name: 'General',
      purchase_cost_c: 1000,
      default_price_c: 1500,
      stock: 20,
      base_unit: 'pc',
      low_stock_threshold: 5,
      status: 'ACTIVE',
      created_at: '2026-01-01',
      updated_at: '2026-01-01'
    })) as unknown as Product[]

    const allProducts = [...lowStockProducts, ...outOfStockProducts, ...healthyProducts]

    const fakeWindow = {
      api: {
        reports: {
          sales: vi.fn().mockResolvedValue({ summary: { sales_total_c: 10000, refunds_c: 0, transactions: 1 } }),
          utang: vi.fn().mockResolvedValue({ total_outstanding_c: 0 }),
          itemSales: vi.fn().mockResolvedValue({ rows: [] })
        },
        products: {
          search: vi.fn().mockResolvedValue({ rows: allProducts, total: allProducts.length })
        },
        transactions: { list: vi.fn().mockResolvedValue({ rows: [] }) },
        categories: { list: vi.fn().mockResolvedValue([]) },
        inventory: { onChanged: vi.fn().mockReturnValue(vi.fn()) }
      },
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      setInterval: vi.fn().mockReturnValue(1),
      clearInterval: vi.fn()
    }
    vi.stubGlobal('window', fakeWindow)

    renderToStaticMarkup(React.createElement(Dashboard))

    // Trigger load in useEffect
    const effectCallback = vi.mocked(React.useEffect).mock.calls[0]![0]
    const cleanup = effectCallback()

    // Verify search was invoked with limit 5000
    expect(fakeWindow.api.products.search).toHaveBeenCalledWith('', { status: 'ACTIVE', limit: 5000 })

    // Verify that alertProducts received all 17 items (2 out-of-stock + 15 low-stock) without .slice(0, 10)
    await vi.waitFor(() => {
      const alertCall = setState.mock.calls.find((call) => {
        const arg = call[0]
        return Array.isArray(arg) && arg.length === 17
      })
      expect(alertCall).toBeDefined()
    })

    if (typeof cleanup === 'function') cleanup()
  })
})
