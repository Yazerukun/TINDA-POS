import { afterAll, afterEach, beforeEach, describe, expect, it } from 'vitest'
import { existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { completeSetup, firstRunComplete } from '../auth'
import { checkout, holdSale } from '../checkout'
import { resetActiveDatabase, startNewStore, usePortableData } from '../dataManagement'
import { getDb, getDbFile, closeDb, integrityCheck } from '../../database/connection'
import { cleanupTemporaryDatabase, createBackupSync, listBackups, restoreBackup, validateBackupDatabase } from '../../repositories/backup'
import { createProduct, getProduct } from '../../repositories/products'
import { createUser, listUsers } from '../../repositories/users'
import { deleteHeldSale, getHeldSale, heldSalesFor } from '../../repositories/heldSales'
import { getSettings, updateSettings } from '../../repositories/settings'
import { getSale, listSales } from '../../repositories/sales'
import { listShifts, openShift } from '../../repositories/shifts'
import { hashSecret } from '../../security/passwords'
import { requirePermission, setSession } from '../session'
import { mayReplaceCart } from '../../../shared/pos'
import type { CheckoutPayload } from '../../../shared/ipc'
import type { ProductInput, SessionUser } from '../../../shared/types'
import { processRefund } from '../transaction'
import { autoPrintAfterCheckout } from '../printing'
import { defaultSettings } from '../../repositories/settings'

const dataDir = mkdtempSync(join(tmpdir(), 'tinda-stabilization-'))
process.env.TINDA_DATA_DIR = dataDir

function cleanData(): void {
  closeDb()
  setSession(null)
  for (const name of ['database', 'backups', 'receipts', 'logs', 'exports', 'images']) {
    const dir = join(dataDir, name)
    rmSync(dir, { recursive: true, force: true })
    mkdirSync(dir, { recursive: true })
  }
}

beforeEach(cleanData)
afterEach(() => { delete process.env.PORTABLE_EXECUTABLE_DIR })
afterAll(() => {
  closeDb()
  setSession(null)
  rmSync(dataDir, { recursive: true, force: true })
})

function setupStore(name = 'QA Store'): SessionUser {
  return completeSetup({
    store: { store_name: name, owner_name: 'QA Owner', address: 'Test only', phone: '000' },
    admin: { username: 'admin', password: 'secret', pin: '1234', full_name: 'QA Admin' },
    receipt: { header: 'QA', footer: 'Salamat' },
    data_dir: dataDir,
    load_demo: false
  }).user
}

function productInput(sku: string, stock = 10): ProductInput {
  return {
    category_id: null, name: `Product ${sku}`, sku, barcode: `BAR-${sku}`,
    description: null, base_unit: 'pc', purchase_cost_c: 1500, default_price_c: 2500,
    low_stock_threshold: 2, supplier_id: null, has_expiration: false, notes: null,
    units: [{ name: 'pc', conversion_to_base: 1, selling_price_c: 2500, barcode: null, is_default: true }],
    initial_stock_base: stock
  }
}

function cart(productId: number, qty: number, discount = 0): CheckoutPayload {
  return {
    items: [{ product_id: productId, name: `Product SKU-${productId}`, unit_name: 'pc', qty, qty_base: qty, unit_price_c: 2500, cost_base_c: 1500, stock_base: 10, subtotal_c: qty * 2500 }],
    discount_c: discount,
    customer_id: null,
    payments: []
  }
}

describe('Database reset regression', () => {
  it('blocks unauthorized users and requires exact RESET confirmation', () => {
    const admin = setupStore()
    const db = getDb()
    const cashier = createUser(db, { username: 'cashier', passwordHash: hashSecret('pass'), pinHash: hashSecret('2222'), full_name: 'Cashier', roles: ['CASHIER'] })
    setSession({ id: cashier.id, username: cashier.username, full_name: cashier.full_name, roles: ['CASHIER'] })
    expect(() => resetActiveDatabase('RESET')).toThrow(/permission/i)
    expect(existsSync(getDbFile())).toBe(true)

    setSession(admin)
    expect(() => resetActiveDatabase('reset')).toThrow(/Type RESET exactly/)
    expect(existsSync(getDbFile())).toBe(true)
  })

  it('creates and verifies safety backup, removes active DB sidecars, preserves backups, and reinitializes fresh', () => {
    setupStore()
    const db = getDb()
    createProduct(db, productInput('RESET'), 1)
    const older = createBackupSync(db, 'MANUAL')
    const file = getDbFile()
    const safety = resetActiveDatabase('RESET')

    expect(existsSync(older.path)).toBe(true)
    expect(existsSync(safety.path)).toBe(true)
    expect(safety.filename).not.toBe(older.filename)
    expect(() => validateBackupDatabase(safety.path)).not.toThrow()
    expect(existsSync(file)).toBe(false)
    expect(existsSync(`${file}-wal`)).toBe(false)
    expect(existsSync(`${file}-shm`)).toBe(false)
    expect(listBackups(db).length).toBeGreaterThanOrEqual(2)

    const fresh = getDb()
    expect(firstRunComplete(fresh)).toBe(false)
    expect(integrityCheck()).toEqual({ ok: true, message: 'Database integrity OK.' })
    expect(Number(fresh.pragma('foreign_keys', { simple: true }))).toBe(1)
  })
})

describe('Start New Store and Portable Data regression', () => {
  it('requires settings permission and exact NEW STORE confirmation, then creates a verified safety backup', () => {
    const admin = setupStore()
    const db = getDb()
    const cashier = createUser(db, { username: 'cashier', passwordHash: hashSecret('pass'), pinHash: hashSecret('2222'), full_name: 'Cashier', roles: ['CASHIER'] })
    setSession({ id: cashier.id, username: cashier.username, full_name: cashier.full_name, roles: ['CASHIER'] })
    expect(() => startNewStore('NEW STORE')).toThrow(/permission/i)
    setSession(admin)
    expect(() => startNewStore('new store')).toThrow(/NEW STORE exactly/)
    const safety = startNewStore('NEW STORE')
    expect(() => validateBackupDatabase(safety.path)).not.toThrow()
    expect(existsSync(getDbFile())).toBe(false)
    expect(firstRunComplete(getDb())).toBe(false)
    expect(existsSync(safety.path)).toBe(true)
  })

  it('copies the current store to Portable Data, verifies it, and preserves the original Shared database', () => {
    const admin = setupStore('Portable Copy QA')
    const original = getDbFile()
    createProduct(getDb(), productInput('PORTABLE'), admin.id)
    process.env.PORTABLE_EXECUTABLE_DIR = join(dataDir, 'portable-runtime')
    usePortableData('COPY')
    const portable = join(dataDir, 'portable-runtime', 'TindaPOS-Data', 'database', 'tindapos.db')
    expect(existsSync(original)).toBe(true)
    expect(existsSync(portable)).toBe(true)
    expect(() => validateBackupDatabase(original)).not.toThrow()
    expect(() => validateBackupDatabase(portable)).not.toThrow()
    expect(existsSync(join(dataDir, 'data-mode.json'))).toBe(true)
  })

  it('refuses to overwrite an existing portable store and leaves Shared AppData active', () => {
    setupStore('Shared QA')
    process.env.PORTABLE_EXECUTABLE_DIR = join(dataDir, 'portable-existing')
    const target = join(dataDir, 'portable-existing', 'TindaPOS-Data', 'database', 'tindapos.db')
    mkdirSync(join(dataDir, 'portable-existing', 'TindaPOS-Data', 'database'), { recursive: true })
    writeFileSync(target, 'existing portable customer data')
    expect(() => usePortableData('COPY')).toThrow(/already contains a store/i)
    expect(existsSync(getDbFile())).toBe(true)
    expect(readFileSync(target, 'utf8')).toBe('existing portable customer data')
  })
})

describe('Printer settings and retry regression', () => {
  it('persists printer settings locally and repeated print attempts do not duplicate a completed sale', async () => {
    const admin = setupStore()
    const db = getDb()
    updateSettings(db, { receipt_printer: 'QA Printer', auto_print_after_sale: true, receipt_paper_width: '80mm', receipt_copies: 2 })
    expect(getSettings(db)).toMatchObject({ receipt_printer: 'QA Printer', auto_print_after_sale: true, receipt_paper_width: '80mm', receipt_copies: 2 })
    const product = createProduct(db, productInput('PRINT'), admin.id)
    const completed = checkout({ ...cart(product.id, 1), payments: [{ method: 'CASH', amount_c: 2500 }] }).sale
    const before = listSales(db).total
    const printer = async () => ({ ok: false, code: 'FAILED' as const, message: 'offline' })
    await autoPrintAfterCheckout({ ...defaultSettings, auto_print_after_sale: true }, completed, printer)
    await autoPrintAfterCheckout({ ...defaultSettings, auto_print_after_sale: true }, completed, printer)
    expect(listSales(db).total).toBe(before)
    expect(getProduct(db, product.id).stock).toBe(9)
  })
})

describe('Refund status regression', () => {
  it('sets partial and complete refund statuses accurately and blocks double refund', () => {
    const admin = setupStore()
    const product = createProduct(getDb(), productInput('REFUND', 10), admin.id)
    const completed = checkout({ ...cart(product.id, 2), payments: [{ method: 'CASH', amount_c: 5000 }] }).sale
    const item = completed.items[0]!
    processRefund({ sale_id: completed.id, reason: 'Partial QA', items: [{ sale_item_id: item.id, product_id: product.id, qty_base: 1, unit_name: item.unit_name }] })
    expect(getSale(getDb(), completed.id).status).toBe('PARTIALLY_REFUNDED')
    expect(getProduct(getDb(), product.id).stock).toBe(9)
    processRefund({ sale_id: completed.id, reason: 'Complete QA', items: [{ sale_item_id: item.id, product_id: product.id, qty_base: 1, unit_name: item.unit_name }] })
    expect(getSale(getDb(), completed.id).status).toBe('REFUNDED')
    expect(getProduct(getDb(), product.id).stock).toBe(10)
    expect(() => processRefund({ sale_id: completed.id, reason: 'Duplicate', items: [{ sale_item_id: item.id, product_id: product.id, qty_base: 1, unit_name: item.unit_name }] })).toThrow(/already fully refunded/i)
  })
})

describe('Hold Sale regression', () => {
  it('persists unique holds without changing stock and resumes exact items once', () => {
    const admin = setupStore()
    const db = getDb()
    const product = createProduct(db, productInput('HOLD'), admin.id)
    const payload = cart(product.id, 2, 500)
    const before = getProduct(db, product.id).stock

    const first = holdSale(payload)
    const second = holdSale({ ...payload, items: [{ ...payload.items[0]!, qty: 1, qty_base: 1, subtotal_c: 2500 }] })
    expect(first.token).not.toBe(second.token)
    expect(getProduct(db, product.id).stock).toBe(before)

    closeDb()
    const reopened = getDb()
    const persisted = getHeldSale(reopened, first.id)
    expect(persisted.items).toHaveLength(1)
    expect(persisted.items[0]?.qty).toBe(2)
    expect(persisted.discount_c).toBe(500)
    expect(new Set(persisted.items.map((item) => item.product_id)).size).toBe(persisted.items.length)

    deleteHeldSale(reopened, first.id)
    expect(() => getHeldSale(reopened, first.id)).toThrow(/not found/i)
    expect(getProduct(reopened, product.id).stock).toBe(before)
    expect(listSales(reopened).total).toBe(0)
  })

  it('isolates cashiers, enforces role permissions, and requires confirmation before cart replacement', () => {
    const admin = setupStore()
    const db = getDb()
    const manager = createUser(db, { username: 'manager', passwordHash: hashSecret('pass'), pinHash: hashSecret('3333'), full_name: 'Manager', roles: ['MANAGER'] })
    const cashier = createUser(db, { username: 'cashier', passwordHash: hashSecret('pass'), pinHash: hashSecret('4444'), full_name: 'Cashier', roles: ['CASHIER'] })
    const product = createProduct(db, productInput('ISOLATE'), admin.id)
    holdSale(cart(product.id, 1))

    expect(heldSalesFor(db, admin.id)).toHaveLength(1)
    expect(heldSalesFor(db, cashier.id)).toHaveLength(0)
    for (const user of [admin, { ...manager, roles: ['MANAGER'] }, { ...cashier, roles: ['CASHIER'] }] as SessionUser[]) {
      setSession(user)
      expect(() => requirePermission('pos:hold-sale')).not.toThrow()
      expect(() => requirePermission('pos:resume-sale')).not.toThrow()
    }
    expect(mayReplaceCart(0, false)).toBe(true)
    expect(mayReplaceCart(1, false)).toBe(false)
    expect(mayReplaceCart(1, true)).toBe(true)
  })
})

describe('Backup restore regression', () => {
  it('restores all core entities, verifies integrity, removes later data, and creates a safety backup', () => {
    const admin = setupStore('State A Store')
    const db = getDb()
    const product = createProduct(db, productInput('STATE-A', 10), admin.id)
    const shift = openShift(db, admin.id, 10000)
    checkout({ ...cart(product.id, 1), payments: [{ method: 'CASH', amount_c: 2500 }] })
    expect(getProduct(db, product.id).stock).toBe(9)
    const stateAUsers = listUsers(db).length
    const stateASales = listSales(db).total
    const stateAShifts = listShifts(db).total
    expect(integrityCheck().ok).toBe(true)
    const backup = createBackupSync(db, 'MANUAL')
    validateBackupDatabase(backup.path)

    createProduct(db, productInput('LATER', 5), admin.id)
    checkout({ ...cart(product.id, 3), payments: [{ method: 'CASH', amount_c: 7500 }] })
    updateSettings(db, { store_name: 'State B Store' })
    expect(getProduct(db, product.id).stock).toBe(6)
    const countBeforeRestore = listBackups(db).length

    restoreBackup(db, backup.filename)
    const restored = getDb()
    expect(listBackups(restored).length).toBe(countBeforeRestore + 1)
    expect(integrityCheck()).toEqual({ ok: true, message: 'Database integrity OK.' })
    expect(Number(restored.pragma('foreign_keys', { simple: true }))).toBe(1)
    expect(getProduct(restored, product.id).stock).toBe(9)
    expect(() => restored.prepare("SELECT id FROM products WHERE sku = 'LATER'").get()).not.toThrow()
    expect(restored.prepare("SELECT id FROM products WHERE sku = 'LATER'").get()).toBeUndefined()
    expect(listUsers(restored)).toHaveLength(stateAUsers)
    expect(listSales(restored).total).toBe(stateASales)
    expect(getSettings(restored).store_name).toBe('State A Store')
    expect(listShifts(restored).total).toBe(stateAShifts)
    expect(listShifts(restored).rows[0]?.id).toBe(shift.id)
    expect(readdirSync(join(dataDir, 'database')).filter((name) => name.startsWith('.restore-'))).toHaveLength(0)
  })

  it('cleans only explicit restore/rollback temporary databases and sidecars', () => {
    const temp = join(dataDir, 'database', '.restore-cleanup.db')
    for (const suffix of ['', '-wal', '-shm']) writeFileSync(`${temp}${suffix}`, 'qa')
    cleanupTemporaryDatabase(temp)
    for (const suffix of ['', '-wal', '-shm']) expect(existsSync(`${temp}${suffix}`)).toBe(false)
    expect(() => cleanupTemporaryDatabase(getDbFile())).toThrow(/non-temporary/i)
  })

  it('rejects corrupt/non-TINDA backups before replacement and keeps current data valid', () => {
    setupStore()
    const db = getDb()
    const product = createProduct(db, productInput('SAFE', 10), 1)
    const bad = join(dataDir, 'backups', 'tindapos-corrupt.db')
    writeFileSync(bad, 'not a sqlite database')
    expect(() => restoreBackup(db, 'tindapos-corrupt.db')).toThrow(/not a valid SQLite/i)
    expect(getProduct(getDb(), product.id).stock).toBe(10)
    expect(integrityCheck().ok).toBe(true)
  })

  it('rolls back to the original database when replacement fails after the original was moved', () => {
    setupStore()
    const db = getDb()
    const product = createProduct(db, productInput('ROLLBACK', 10), 1)
    const backup = createBackupSync(db, 'MANUAL')
    db.prepare('UPDATE products SET stock = 7 WHERE id = ?').run(product.id)

    expect(() => restoreBackup(db, backup.filename, { afterOriginalMoved: () => { throw new Error('forced replacement failure') } })).toThrow(/original database was recovered/i)
    const recovered = getDb()
    expect(getProduct(recovered, product.id).stock).toBe(7)
    expect(integrityCheck().ok).toBe(true)
  })
})
