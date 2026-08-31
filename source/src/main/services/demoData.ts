import type Database from 'better-sqlite3'
import { createCategory } from '../repositories/categories'
import { createProduct } from '../repositories/products'
import { createSupplier } from '../repositories/suppliers'
import { createExpenseCategory } from '../repositories/expenses'
import { createCustomer } from '../repositories/customers'

const DEMO_CATEGORIES = ['Drinks', 'Snacks', 'Noodles', 'Canned Goods', 'Rice & Grains', 'Coffee', 'Biscuits', 'Personal Care', 'Household', 'Cigarettes', 'Others']

interface DemoProduct {
  category: string
  name: string
  base_unit: string
  cost: number
  price: number
  stock: number
  threshold: number
  units?: { name: string; conv: number; price?: number }[]
  barcode?: string
}

const DEMO_PRODUCTS: DemoProduct[] = [
  { category: 'Drinks', name: 'Coke 1.5L', base_unit: 'bottle', cost: 70, price: 75, stock: 12, threshold: 5, barcode: '48013415', units: [{ name: 'bottle', conv: 1 }] },
  { category: 'Drinks', name: 'Coke Sakto 350ml', base_unit: 'bottle', cost: 18, price: 22, stock: 30, threshold: 10, barcode: '48008888' },
  { category: 'Drinks', name: 'Royal 1.5L', base_unit: 'bottle', cost: 65, price: 70, stock: 3, threshold: 5, barcode: '48060111' },
  { category: 'Snacks', name: 'Piattos Cheese 85g', base_unit: 'pack', cost: 15, price: 25, stock: 40, threshold: 15 },
  { category: 'Snacks', name: 'Jack n Jill Chippy Barbecue 26g', base_unit: 'pack', cost: 8, price: 10, stock: 8, threshold: 20 },
  { category: 'Noodles', name: 'Lucky Me Pancit Canton', base_unit: 'pack', cost: 10, price: 15, stock: 48, threshold: 24, units: [{ name: 'box', conv: 24, price: 300 }, { name: 'pack', conv: 1 }] },
  { category: 'Noodles', name: 'Lucky Me Beef Mami', base_unit: 'pack', cost: 8, price: 12, stock: 5, threshold: 20 },
  { category: 'Canned Goods', name: 'Ligo Sardines 155g', base_unit: 'can', cost: 22, price: 30, stock: 0, threshold: 12 },
  { category: 'Canned Goods', name: 'Argentina Corned Beef 150g', base_unit: 'can', cost: 42, price: 55, stock: 14, threshold: 8 },
  { category: 'Rice & Grains', name: 'Sinandomeng Rice', base_unit: 'gram', cost: 0, price: 55, stock: 50000, threshold: 25000, units: [{ name: '250g', conv: 250 }, { name: '500g', conv: 500, price: 55 }, { name: '1kg', conv: 1000, price: 110 }, { name: '5kg', conv: 5000, price: 545 }, { name: '1g', conv: 1 }] },
  { category: 'Coffee', name: 'Milo (Sachet)', base_unit: 'sachet', cost: 6, price: 9, stock: 67, threshold: 24, units: [{ name: 'box', conv: 24, price: 210 }, { name: 'sachet', conv: 1 }] },
  { category: 'Coffee', name: 'Nescafe 3-in-1', base_unit: 'sachet', cost: 5, price: 7, stock: 100, threshold: 30 },
  { category: 'Biscuits', name: 'Skyflakes 25g', base_unit: 'pack', cost: 5, price: 6.5, stock: 60, threshold: 24 },
  { category: 'Personal Care', name: 'Safeguard Soap', base_unit: 'piece', cost: 28, price: 38, stock: 20, threshold: 8 },
  { category: 'Personal Care', name: 'Colgate 90g', base_unit: 'tube', cost: 45, price: 60, stock: 10, threshold: 6 },
  { category: 'Household', name: 'Surf Powder 25g', base_unit: 'sachet', cost: 5, price: 7, stock: 80, threshold: 30 },
  { category: 'Cigarettes', name: 'Marlboro Red', base_unit: 'piece', cost: 0, price: 20, stock: 100, threshold: 50, units: [{ name: 'pack', conv: 20, price: 400 }, { name: 'ream', conv: 200 }, { name: 'stick', conv: 1 }] },
  { category: 'Others', name: 'Egg', base_unit: 'piece', cost: 8, price: 10, stock: 150, threshold: 30, units: [{ name: 'tray', conv: 30, price: 290 }, { name: 'piece', conv: 1 }] }
]

export function loadDemoData(db: Database.Database): void {
  const categoryIds = new Map<string, number>()
  for (const c of DEMO_CATEGORIES) categoryIds.set(c, createCategory(db, c).id)
  createExpenseCategory(db, 'Ice')
  createSupplier(db, { name: 'PRC Distributor', contact_person: 'Mang Tony', phone: '0917-123-4567', address: 'Palengke', notes: 'Main distributor' })
  void categoryIds
  for (const p of DEMO_PRODUCTS) {
    const cat = DEMO_CATEGORIES.find((c) => c === p.category)
    const units = (p.units ?? [{ name: p.base_unit, conv: 1 }]).map((u) => ({
      name: u.name,
      conversion_to_base: u.conv,
      barcode: u.name === p.base_unit && !p.barcode ? null : undefined,
      selling_price_c: Math.round((u.price ?? p.price) * 100),
      is_default: u.conv === 1
    }))
    const baseBarcode = p.barcode ?? null
    createProduct(
      db,
      {
        category_id: cat ? createCategory(db, cat).id : null,
        name: p.name,
        sku: 'SKU-' + Math.floor(1000 + Math.random() * 9000),
        barcode: baseBarcode,
        description: null,
        base_unit: p.base_unit,
        purchase_cost_c: Math.round(p.cost * 100),
        default_price_c: Math.round(p.price * 100),
        low_stock_threshold: p.threshold,
        supplier_id: 1,
        has_expiration: false,
        notes: null,
        units: units.map((u) => ({ ...u, barcode: u.barcode === undefined ? (u.name === p.base_unit ? baseBarcode : null) : u.barcode })),
        initial_stock_base: p.stock
      },
      1
    )
  }

  const demoCustomers = [
    { name: 'Juan Dela Cruz', nick: 'Juan', limit: 1000 },
    { name: 'Maria Santos', nick: 'Maria', limit: 500 },
    { name: 'Pedro Reyes', nick: 'Pedro', limit: 2000 }
  ]
  for (const c of demoCustomers) {
    createCustomer(db, {
      full_name: c.name,
      nickname: c.nick,
      phone: null,
      address: null,
      notes: 'Demo customer',
      credit_limit_c: c.limit * 100
    })
  }
}