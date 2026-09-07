import { beforeEach, describe, expect, it } from 'vitest'
import Database from 'better-sqlite3'
import { runMigrations } from '../../database/migrations'
import { CSV_TEMPLATE, importCsv, previewCsv } from '../productImport'
import { buildReceiptLines } from '../checkout'
import { calculateRead, finalizeZ, listZ } from '../readReports'
import * as products from '../../repositories/products'
import * as shifts from '../../repositories/shifts'
import type { Sale } from '@shared/types'

let db: Database.Database
beforeEach(() => {
  db = new Database(':memory:'); db.pragma('foreign_keys=ON'); runMigrations(db)
  db.prepare("INSERT INTO users(username,password_hash,pin_hash,full_name) VALUES ('admin','x','x','Admin')").run()
})

describe('v1.0.4 CSV product import', () => {
  it('provides the documented template and previews valid, invalid and duplicate rows exactly', () => {
    expect(CSV_TEMPLATE).toContain('product_name,sku,barcode')
    const text = `${CSV_TEMPLATE}Milo,M1,111,Drinks,9,6,24,5,Supplier A,sachet\n,M2,222,,bad,0,-1,,,pc\nMilo 2,M1,333,,10,0,0,5,,pc\n`
    const p = previewCsv(db, text)
    expect(p.total).toBe(3); expect(p.invalid).toBe(2)
    expect(p.rows[1]?.reasons).toEqual(expect.arrayContaining(['Missing product name','Invalid selling price','Negative stock']))
    expect(p.rows[2]?.reasons).toContain('Duplicate SKU in CSV')
  })
  it('imports atomically, records opening stock, skips and updates existing identifiers', () => {
    const csv = `${CSV_TEMPLATE}Milo,M1,111,Drinks,9,6,24,5,Supplier A,sachet\n`
    const first = importCsv(db, csv, 'SKIP', 1); expect(first.created).toBe(1)
    const product = products.findBySku(db,'M1')!; expect(product.stock).toBe(24)
    expect((db.prepare("SELECT COUNT(*) c FROM inventory_movements WHERE movement_type='INITIAL_STOCK'").get() as {c:number}).c).toBe(1)
    expect(importCsv(db, csv, 'SKIP', 1).skipped).toBe(1)
    const update = `${CSV_TEMPLATE}Milo Updated,M1,111,Drinks,10,7,0,3,Supplier A,sachet\n`
    expect(importCsv(db, update, 'UPDATE', 1).updated).toBe(1); expect(products.getProduct(db,product.id).name).toBe('Milo Updated')
    const before=(db.prepare('SELECT COUNT(*) c FROM products').get() as {c:number}).c
    expect(()=>importCsv(db,`${CSV_TEMPLATE}Good,G1,444,,10,0,0,5,,pc\nBad,G2,555,,oops,0,0,5,,pc\n`,'SKIP',1)).toThrow()
    expect((db.prepare('SELECT COUNT(*) c FROM products').get() as {c:number}).c).toBe(before)
  })
})

const sale = { transaction_no:'TPOS-1', cashier_name:'Ana', customer_name:null, subtotal_c:1000, discount_c:0,total_c:1000,created_at:'2026-09-07 10:00:00',items:[],payments:[] } as unknown as Sale
describe('v1.0.4 receipt heading',()=>{
  const base={header:'',store_name:'',owner_name:'',address:'',phone:'',tin:'',currency:'PHP',footer:''}
  it('supports app name on/off, custom title and blank heading',()=>{
    expect(buildReceiptLines({...base,show_app_name:true,title:''},sale)[0]).toBe('TINDA POS')
    expect(buildReceiptLines({...base,show_app_name:false,title:''},sale)).not.toContain('TINDA POS')
    expect(buildReceiptLines({...base,show_app_name:false,title:'JUAN STORE'},sale)[0]).toBe('JUAN STORE')
    const both=buildReceiptLines({...base,show_app_name:true,title:'JUAN STORE'},sale); expect(both.slice(0,2)).toEqual(['JUAN STORE','TINDA POS'])
  })
})

describe('v1.0.4 X/Z read',()=>{
  it('aggregates read-only data repeatedly and persists one immutable snapshot without deleting data',()=>{
    const shift=shifts.openShift(db,1,10000)
    db.prepare("INSERT INTO sales(transaction_no,user_id,subtotal_c,discount_c,total_c,shift_id) VALUES ('T1',1,10000,1000,9000,?)").run(shift.id)
    const saleId=Number((db.prepare("SELECT id FROM sales WHERE transaction_no='T1'").get() as {id:number}).id)
    db.prepare("INSERT INTO payments(sale_id,method,amount_c) VALUES (?,'CASH',5000),(?,'GCASH',4000)").run(saleId,saleId)
    const a=calculateRead(db,shift.id), b=calculateRead(db,shift.id)
    expect({...a,report_at:''}).toEqual({...b,report_at:''}); expect(a.net_sales_c).toBe(9000); expect(a.split_count).toBe(1)
    const z=finalizeZ(db,shift.id,1,a.expected_cash_c); expect(z.snapshot.net_sales_c).toBe(9000)
    expect(()=>finalizeZ(db,shift.id,1,a.expected_cash_c)).toThrow(/already/)
    db.prepare("UPDATE sales SET total_c=1 WHERE id=?").run(saleId)
    expect(listZ(db)[0]?.snapshot.net_sales_c).toBe(9000)
    expect((db.prepare('SELECT COUNT(*) c FROM sales').get() as {c:number}).c).toBe(1)
    expect((db.prepare('SELECT COUNT(*) c FROM payments').get() as {c:number}).c).toBe(2)
  })
})

describe('v1.0.4 restock rules',()=>{
  it('reuses unit conversion and records a purchase movement',()=>{
    const p=products.createProduct(db,{category_id:null,name:'Milo',sku:'M',barcode:null,description:null,base_unit:'sachet',purchase_cost_c:600,default_price_c:900,low_stock_threshold:5,supplier_id:null,has_expiration:false,notes:null,units:[{name:'sachet',conversion_to_base:1,barcode:null,selling_price_c:900,is_default:true},{name:'box',conversion_to_base:24,barcode:null,selling_price_c:21600,is_default:false}],initial_stock_base:24},1)
    products.adjustStock(db,p.id,2*24,'PURCHASE','Restock 2 box',1)
    expect(products.getProduct(db,p.id).stock).toBe(72)
    expect((db.prepare("SELECT quantity_change FROM inventory_movements WHERE movement_type='PURCHASE'").get() as {quantity_change:number}).quantity_change).toBe(48)
  })
})
