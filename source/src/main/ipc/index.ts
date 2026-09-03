import type { IpcMainInvokeEvent } from 'electron'
import { ipcMain } from 'electron'
import { getDb } from '../database/connection'
import * as authSvc from '../services/auth'
import * as sessionSvc from '../services/session'
import * as settingRepo from '../repositories/settings'
import * as catRepo from '../repositories/categories'
import * as prodRepo from '../repositories/products'
import * as supRepo from '../repositories/suppliers'
import * as custRepo from '../repositories/customers'
import * as expRepo from '../repositories/expenses'
import * as shiftRepo from '../repositories/shifts'
import * as purchRepo from '../repositories/purchases'
import * as heldRepo from '../repositories/heldSales'
import * as auditRepo from '../repositories/audit'
import * as invRepo from '../repositories/inventory'
import * as backupRepo from '../repositories/backup'
import * as userRepo from '../repositories/users'
import { getSale, listSales } from '../repositories/sales'
import * as checkoutSvc from '../services/checkout'
import * as txSvc from '../services/transaction'
import * as reportSvc from '../services/reporting'
import * as exportSvc from '../services/export'
import { app, dialog, net, shell } from 'electron'
import type { PaymentInput, CompleteSetupPayload } from '@shared/ipc'
import { appDirs } from '../database/connection'

// IPC handlers have differing concrete signatures; the router erases them so
// any handler can be registered. `any` is intentional here (variadic dispatch).
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Handler = (...args: any[]) => unknown
const router: Record<string, Handler> = {}

function handle(channel: string, fn: Handler): void {
  router[channel] = fn
  // Pass the Electron event THROUGH to the handler as its first argument.
  // Handlers are all declared as `(_e, ...realArgs)`; dropping `_e` here
  // shifted every real argument left by one, so the first invoke argument
  // (e.g. the setup payload) was consumed as the event and arrived as
  // `undefined`. This broke every argument-carrying IPC endpoint.
  ipcMain.handle(channel, (_e: IpcMainInvokeEvent, ...args: unknown[]) => fn(_e, ...args))
}

const db = () => getDb()
const user = () => sessionSvc.requireUser()

// ---- App ----
handle('app:info', () => ({ name: 'TINDA POS', version: app.getVersion() ?? '1.0.0', offline: true }))
handle('app:dataDir', () => appDirs().root)
handle('app:checkIntegrity', () => require('../database/connection').integrityCheck())
handle('app:isOnline', async () => {
  if (!net.isOnline()) return false

  const probes = [
    ['https://connectivitycheck.gstatic.com/generate_204', 204],
    ['https://www.msftconnecttest.com/connecttest.txt', 200]
  ] as const

  const results = await Promise.all(
    probes.map(async ([url, expectedStatus]) => {
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 4_000)
      try {
        const response = await net.fetch(url, {
          method: 'GET',
          signal: controller.signal
        })
        return response.status === expectedStatus
      } catch {
        return false
      } finally {
        clearTimeout(timeout)
      }
    })
  )

  return results.some(Boolean)
})

// ---- Auth ----
handle('auth:status', () => authSvc.authStatus())
handle('auth:login', (_e: IpcMainInvokeEvent, username: string, password: string) => authSvc.login(username, password))
handle('auth:loginPin', (_e: IpcMainInvokeEvent, pin: string) => authSvc.loginPin(pin))
handle('auth:logout', () => authSvc.logout())
handle('auth:changePassword', (_e: IpcMainInvokeEvent, current: string, next: string) => authSvc.changePassword(current, next))
handle('auth:changePin', (_e: IpcMainInvokeEvent, pin: string) => authSvc.changePin(pin))
handle('auth:adminResetPin', (_e: IpcMainInvokeEvent, userId: number, newPin: string) => authSvc.adminResetPin(userId, newPin))
handle('auth:setup', () => ({ complete: authSvc.firstRunComplete(db()) }))
handle('auth:completeSetup', (_e: IpcMainInvokeEvent, payload: unknown) => {
  const validated = require('../validation/schemas').validateSetup(payload)
  return authSvc.completeSetup(validated as CompleteSetupPayload)
})

// ---- Users ----
handle('users:list', () => {
  sessionSvc.requirePermission('users:manage')
  return userRepo.listUsers(db())
})
handle('users:create', (_e: IpcMainInvokeEvent, input: unknown) => {
  sessionSvc.requirePermission('users:manage')
  const v = require('../validation/schemas').validateUserCreate(input)
  return userRepo.createUser(db(), {
    username: v.username,
    passwordHash: require('../security/passwords').hashSecret(v.password),
    pinHash: require('../security/passwords').hashSecret(v.pin),
    full_name: v.full_name ?? 'User',
    roles: v.roles
  })
})
handle('users:update', (_e: IpcMainInvokeEvent, id: number, input: unknown) => {
  sessionSvc.requirePermission('users:manage')
  const v = require('../validation/schemas').validateUserUpdate(input)
  return userRepo.updateUser(db(), id, {
    username: v.username,
    full_name: v.full_name,
    is_active: v.is_active,
    roles: v.roles,
    ...(v.password ? { passwordHash: require('../security/passwords').hashSecret(v.password) } : {}),
    ...(v.pin ? { pinHash: require('../security/passwords').hashSecret(v.pin) } : {})
  })
})
handle('users:roles', () => userRepo.listRoles(db()))

// ---- Settings ----
handle('settings:get', () => settingRepo.getSettings(db()))
handle('settings:update', (_e: IpcMainInvokeEvent, patch: unknown) => {
  user()
  return settingRepo.updateSettings(db(), patch as Partial<import('@shared/types').StoreSettings>)
})

// ---- Categories ----
handle('categories:list', () => catRepo.listCategories(db()))
handle('categories:create', (_e: IpcMainInvokeEvent, name: unknown) => {
  user()
  return catRepo.createCategory(db(), String(name))
})
handle('categories:remove', (_e: IpcMainInvokeEvent, id: number) => {
  user()
  catRepo.removeCategory(db(), id)
})

// ---- Products ----
handle('products:search', (_e: IpcMainInvokeEvent, q: string, opts?: unknown) => {
  user()
  const o = (opts ?? {}) as { category_id?: number | null; status?: string; limit?: number; offset?: number }
  return prodRepo.searchProducts(db(), { q, category_id: o.category_id, status: o.status, limit: o.limit, offset: o.offset })
})
handle('products:get', (_e: IpcMainInvokeEvent, id: number) => prodRepo.getProduct(db(), id))
handle('products:create', (_e: IpcMainInvokeEvent, input: unknown) => {
  user()
  return prodRepo.createProduct(db(), input as Parameters<typeof prodRepo.createProduct>[1], user().id)
})
handle('products:update', (_e: IpcMainInvokeEvent, id: number, input: unknown) => {
  user()
  return prodRepo.updateProduct(db(), id, input as Parameters<typeof prodRepo.updateProduct>[2], user().id)
})
handle('products:archive', (_e: IpcMainInvokeEvent, id: number) => {
  sessionSvc.requirePermission('products:archive')
  return prodRepo.setProductStatus(db(), id, 'ARCHIVED', user().id)
})
handle('products:restore', (_e: IpcMainInvokeEvent, id: number) => {
  sessionSvc.requirePermission('products:archive')
  return prodRepo.setProductStatus(db(), id, 'ACTIVE', user().id)
})
handle('products:count', (_e: IpcMainInvokeEvent, status?: string) => prodRepo.productCount(db(), status))

// ---- Inventory ----
handle('inventory:movements', (_e: IpcMainInvokeEvent, opts: unknown) => invRepo.listMovements(db(), (opts ?? {}) as object))
handle('inventory:receive', (_e: IpcMainInvokeEvent, input: unknown) => {
  sessionSvc.requirePermission('inventory:receive')
  const i = input as { product_id: number; qty_base: number; unit_name: string; cost_c: number; reason?: string }
  prodRepo.adjustStock(db(), i.product_id, i.qty_base, 'PURCHASE', i.reason ?? 'Stock receiving', user().id, i.cost_c ? `cost ${i.cost_c}` : undefined)
  return invRepo.movementsForProduct(db(), i.product_id, 1)[0]
})
handle('inventory:adjust', (_e: IpcMainInvokeEvent, input: unknown) => {
  sessionSvc.requirePermission('inventory:adjust')
  const i = input as { product_id: number; qty_base: number; reason: string }
  prodRepo.adjustStock(db(), i.product_id, i.qty_base, 'ADJUSTMENT', i.reason, user().id)
  return invRepo.movementsForProduct(db(), i.product_id, 1)[0]
})
handle('inventory:movement', (_e: IpcMainInvokeEvent, type: string, input: unknown) => {
  sessionSvc.requirePermission('inventory:adjust')
  const i = input as { product_id: number; qty_base: number; reason?: string }
  const validTypes = ['PURCHASE', 'REFUND', 'RETURN', 'DAMAGE', 'EXPIRATION', 'LOSS', 'ADJUSTMENT']
  if (!validTypes.includes(type)) throw new Error('Invalid movement type.')
  prodRepo.adjustStock(db(), i.product_id, i.qty_base, type, i.reason ?? '', user().id)
  return invRepo.movementsForProduct(db(), i.product_id, 1)[0]
})
handle('inventory:count', (_e: IpcMainInvokeEvent, input: unknown) => {
  sessionSvc.requirePermission('inventory:count')
  const i = input as { product_id: number; actual_base: number; notes?: string }
  const p = prodRepo.getProduct(db(), i.product_id)
  const diff = i.actual_base - p.stock
  prodRepo.adjustStock(db(), i.product_id, diff, 'ADJUSTMENT', `Inventory count: expected ${p.stock}, actual ${i.actual_base}`, user().id, i.notes)
  return invRepo.movementsForProduct(db(), i.product_id, 1)[0]
})

// ---- Suppliers ----
handle('suppliers:list', (_e: IpcMainInvokeEvent, opts?: unknown) => supRepo.listSuppliers(db(), (opts ?? {}) as object))
handle('suppliers:create', (_e: IpcMainInvokeEvent, input: unknown) => {
  user()
  return supRepo.createSupplier(db(), input as Parameters<typeof supRepo.createSupplier>[1])
})
handle('suppliers:update', (_e: IpcMainInvokeEvent, id: number, input: unknown) => {
  user()
  return supRepo.updateSupplier(db(), id, input as Parameters<typeof supRepo.updateSupplier>[2])
})
handle('suppliers:products', (_e: IpcMainInvokeEvent, id: number) => prodRepo.listProductsBySupplier(db(), id))
handle('suppliers:purchases', (_e: IpcMainInvokeEvent, id: number) => purchRepo.listPurchases(db(), { supplier_id: id }).rows)

// ---- Customers ----
handle('customers:list', (_e: IpcMainInvokeEvent, opts?: unknown) => custRepo.listCustomers(db(), (opts ?? {}) as object))
handle('customers:get', (_e: IpcMainInvokeEvent, id: number) => custRepo.getCustomer(db(), id))
handle('customers:create', (_e: IpcMainInvokeEvent, input: unknown) => {
  user()
  const c = custRepo.createCustomer(db(), input as Parameters<typeof custRepo.createCustomer>[1])
  auditRepo.audit(db(), { action: 'CUSTOMER_CREATE', user_id: user().id, entity_type: 'CUSTOMER', entity_id: c.id, new_value: c.full_name })
  return c
})
handle('customers:update', (_e: IpcMainInvokeEvent, id: number, input: unknown) => {
  user()
  return custRepo.updateCustomer(db(), id, input as Parameters<typeof custRepo.updateCustomer>[2])
})
handle('customers:ledger', (_e: IpcMainInvokeEvent, id: number, opts?: unknown) => custRepo.customerLedger(db(), id, (opts as { limit?: number } | undefined)?.limit))
handle('customers:pay', (_e: IpcMainInvokeEvent, input: unknown) => {
  user()
  const i = input as { customer_id: number; amount_c: number; method?: string; notes?: string }
  const entry = custRepo.applyCreditEntry(db(), { customer_id: i.customer_id, entry_type: 'PAYMENT', amount_c: i.amount_c, notes: i.notes ?? 'Payment received', user_id: user().id })
  auditRepo.audit(db(), { action: 'UTANG_PAYMENT', user_id: user().id, entity_type: 'CUSTOMER', entity_id: i.customer_id, new_value: String(i.amount_c) })
  return entry
})
handle('customers:adjust', (_e: IpcMainInvokeEvent, input: unknown) => {
  sessionSvc.requirePermission('utang:adjust')
  const i = input as { customer_id: number; amount_c: number; notes: string; reason: string }
  return custRepo.applyCreditEntry(db(), { customer_id: i.customer_id, entry_type: 'ADJUSTMENT', amount_c: i.amount_c, notes: i.notes, user_id: user().id })
})
handle('customers:revoke', (_e: IpcMainInvokeEvent, input: unknown) => {
  sessionSvc.requirePermission('utang:adjust')
  const i = input as { customer_id: number; amount_c: number; notes: string; reason: string }
  return custRepo.applyCreditEntry(db(), { customer_id: i.customer_id, entry_type: 'REVERSAL', amount_c: i.amount_c, notes: i.notes, user_id: user().id })
})
handle('customers:approveOverlimit', (_e: IpcMainInvokeEvent, input: unknown) => {
  sessionSvc.requirePermission('utang:approve-overlimit')
  const i = input as { customer_id: number; amount_c: number; notes: string; approved_by: string; reason: string }
  const customer = custRepo.getCustomer(db(), i.customer_id)
  if (!custRepo.canExtendCredit(customer, i.amount_c, true)) throw new Error('Cannot approve this amount.')
  custRepo.applyCreditEntry(db(), { customer_id: i.customer_id, entry_type: 'ADJUSTMENT', amount_c: i.amount_c, notes: `${i.reason} (approved by ${i.approved_by})`, user_id: user().id })
  auditRepo.audit(db(), { action: 'UTANG_OVERLIMIT_APPROVED', user_id: user().id, entity_type: 'CUSTOMER', entity_id: i.customer_id, reason: i.reason })
  return custRepo.getCustomer(db(), i.customer_id)
})

// ---- POS ----
handle('pos:searchProducts', (_e: IpcMainInvokeEvent, q: string) => prodRepo.searchProductsSimple(db(), q))
handle('pos:checkout', (_e: IpcMainInvokeEvent, payload: unknown) => {
  user()
  const v = require('../validation/schemas').validateCheckout(payload)
  return checkoutSvc.checkout(v)
})
handle('pos:hold', (_e: IpcMainInvokeEvent, payload: unknown) => {
  user()
  const v = require('../validation/schemas').validateCheckout(payload)
  return checkoutSvc.holdSale(v)
})
handle('pos:held', () => {
  sessionSvc.requirePermission('pos:resume-sale')
  return heldRepo.heldSalesFor(db(), user().id)
})
handle('pos:resumeHeld', (_e: IpcMainInvokeEvent, id: number) => {
  sessionSvc.requirePermission('pos:resume-sale')
  const h = heldRepo.getHeldSale(db(), id)
  if (h.user_id !== user().id) throw new Error('Held sale not found.')
  heldRepo.deleteHeldSale(db(), id)
  return h
})
handle('pos:deleteHeld', (_e: IpcMainInvokeEvent, id: number) => {
  sessionSvc.requirePermission('pos:resume-sale')
  const h = heldRepo.getHeldSale(db(), id)
  if (h.user_id !== user().id) throw new Error('Held sale not found.')
  heldRepo.deleteHeldSale(db(), id)
})
handle('pos:reprint', (_e: IpcMainInvokeEvent, saleId: number) => {
  sessionSvc.requirePermission('transactions:view')
  return checkoutSvc.reprint(saleId)
})

// ---- Transactions ----
handle('transactions:list', (_e: IpcMainInvokeEvent, opts: unknown) => listSales(db(), (opts ?? {}) as object))
handle('transactions:get', (_e: IpcMainInvokeEvent, id: number) => getSale(db(), id))
handle('transactions:refund', (_e: IpcMainInvokeEvent, payload: unknown) => txSvc.processRefund(payload as Parameters<typeof txSvc.processRefund>[0]))
handle('transactions:void', (_e: IpcMainInvokeEvent, payload: unknown) => txSvc.processVoid(payload as Parameters<typeof txSvc.processVoid>[0]))

// ---- Expenses ----
handle('expenses:categories', () => { user(); return expRepo.listExpenseCategories(db()) })
handle('expenses:createCategory', (_e: IpcMainInvokeEvent, name: string) => { user(); return expRepo.createExpenseCategory(db(), name) })
handle('expenses:list', (_e: IpcMainInvokeEvent, opts: unknown) => expRepo.listExpenses(db(), (opts ?? {}) as object))
handle('expenses:create', (_e: IpcMainInvokeEvent, input: unknown) => {
  sessionSvc.requirePermission('expenses:manage')
  return expRepo.createExpense(db(), input as Parameters<typeof expRepo.createExpense>[1], user().id)
})
handle('expenses:update', (_e: IpcMainInvokeEvent, id: number, input: unknown) => {
  sessionSvc.requirePermission('expenses:manage')
  return expRepo.updateExpense(db(), id, input as Parameters<typeof expRepo.updateExpense>[2])
})
handle('expenses:remove', (_e: IpcMainInvokeEvent, id: number) => {
  sessionSvc.requirePermission('expenses:delete')
  expRepo.deleteExpense(db(), id)
})

// ---- Shifts ----
handle('shifts:current', () => { user(); return shiftRepo.currentShiftFor(db(), user().id) })
handle('shifts:open', (_e: IpcMainInvokeEvent, startingC: number) => {
  user()
  const s = shiftRepo.openShift(db(), user().id, startingC)
  auditRepo.audit(db(), { action: 'SHIFT_OPEN', user_id: user().id, entity_type: 'SHIFT', entity_id: s.id, new_value: String(startingC) })
  return s
})
handle('shifts:close', (_e: IpcMainInvokeEvent, input: { actual_cash_c: number; closing_note?: string }) => {
  user()
  const cur = shiftRepo.currentShiftFor(db(), user().id)
  if (!cur) throw new Error('No open shift.')
  const s = shiftRepo.closeShift(db(), cur.id, input)
  auditRepo.audit(db(), { action: 'SHIFT_CLOSE', user_id: user().id, entity_type: 'SHIFT', entity_id: s.id, new_value: JSON.stringify({ expected: s.expected_cash_c, actual: s.actual_cash_c, diff: s.difference_c }) })
  return s
})
handle('shifts:cashMovement', (_e: IpcMainInvokeEvent, input: { type: 'CASH_IN' | 'CASH_OUT'; amount_c: number; reason?: string }) => {
  user()
  const cur = shiftRepo.currentShiftFor(db(), user().id)
  if (!cur) throw new Error('No open shift.')
  return shiftRepo.insertCashMovement(db(), cur.id, input.type, input.amount_c, input.reason ?? null, user().id)
})
handle('shifts:list', (_e: IpcMainInvokeEvent, opts?: unknown) => {
  sessionSvc.requirePermission('shifts:view-all')
  return { rows: shiftRepo.listShifts(db(), (opts ?? {}) as object).rows, total: 0 }
})
handle('shifts:summary', (_e: IpcMainInvokeEvent, id: number) => {
  user()
  return shiftRepo.getShift(db(), id)
})

// ---- Reports ----
handle('reports:sales', (_e: IpcMainInvokeEvent, opts: unknown) => {
  sessionSvc.requirePermission('reports:view')
  return reportSvc.salesReport((opts ?? {}) as { from: string; to: string; groupBy?: 'DAILY' | 'WEEKLY' | 'MONTHLY' })
})
handle('reports:inventory', () => {
  sessionSvc.requirePermission('reports:view')
  return reportSvc.inventoryReport()
})
handle('reports:utang', () => {
  sessionSvc.requirePermission('reports:view')
  return reportSvc.utangReport()
})
handle('reports:cashier', (_e: IpcMainInvokeEvent, opts: unknown) => {
  sessionSvc.requirePermission('reports:view')
  const d = (opts ?? {}) as { from?: string; to?: string; cashier_id?: number }
  const result = listSales(db(), { from: d.from ? `${d.from} 00:00:00` : undefined, to: d.to ? `${d.to} 23:59:59` : undefined, cashier_id: d.cashier_id, limit: 100000 }).rows.filter((s) => s.status !== 'VOIDED')
  const summary = {
    sales_total_c: result.reduce((s, x) => s + x.total_c, 0),
    profit_c: result.reduce((s, x) => s + x.total_c, 0) - result.reduce((s, x) => s + x.items.reduce((a, i) => a + i.cost_base_c * i.qty_base, 0), 0),
    items_sold: result.reduce((s, x) => s + x.items.reduce((a, i) => a + i.qty, 0), 0),
    transactions: result.length,
    cost_c: 0,
    discount_c: result.reduce((s, x) => s + x.discount_c, 0),
    refunds_c: 0,
    expenses_c: 0
  }
  return { rows: result, summary }
})
handle('reports:shifts', (_e: IpcMainInvokeEvent, opts?: unknown) => {
  sessionSvc.requirePermission('reports:view')
  const d = (opts ?? {}) as { from?: string; to?: string }
  const result = shiftRepo.listShifts(db(), { from: d.from ? `${d.from} 00:00:00` : undefined, to: d.to ? `${d.to} 23:59:59` : undefined, status: 'CLOSED', limit: 100000 }).rows
  return { rows: result, summary: { sales_total_c: result.reduce((s, x) => s + x.cash_sales_c, 0), profit_c: 0, items_sold: 0, transactions: result.length, cost_c: 0, discount_c: 0, refunds_c: result.reduce((s, x) => s + x.refund_cash_c, 0), expenses_c: result.reduce((s, x) => s + x.cash_expenses_c, 0) } }
})
handle('reports:exportCsv', (_e: IpcMainInvokeEvent, kind: string, opts?: unknown) => {
  sessionSvc.requirePermission('reports:export')
  return exportSvc.exportCsv(kind as Parameters<typeof exportSvc.exportCsv>[0], (opts ?? {}) as { from?: string; to?: string })
})

// ---- Backup ----
handle('backup:list', () => backupRepo.listBackups(db()))
handle('backup:create', async (_e: IpcMainInvokeEvent, reason?: string) => {
  sessionSvc.requirePermission('backup:manage')
  const info = await backupRepo.createBackup(db(), 'MANUAL')
  auditRepo.audit(db(), { action: 'BACKUP', user_id: user().id, reason: reason ?? 'Manual backup' })
  return info
})
handle('backup:restore', (_e: IpcMainInvokeEvent, filename: string) => {
  sessionSvc.requirePermission('backup:manage')
  return backupRepo.restoreBackup(db(), filename)
})
handle('backup:openFolder', () => {
  shell.openPath(backupRepo.backupDir())
})
handle('backup:selectSyncFolder', async () => {
  sessionSvc.requirePermission('backup:manage')
  const result = await dialog.showOpenDialog({
    title: 'Select OneDrive, Google Drive, or another synced backup folder',
    properties: ['openDirectory', 'createDirectory']
  })
  if (result.canceled || !result.filePaths[0]) return null
  return result.filePaths[0]
})
handle('backup:openSyncFolder', () => {
  sessionSvc.requirePermission('backup:manage')
  const location = settingRepo.getSettings(db()).backup_location.trim()
  if (!location) throw new Error('No synced backup folder configured.')
  return shell.openPath(location)
})

// ---- Audit ----
handle('audit:list', (_e: IpcMainInvokeEvent, opts?: unknown) => {
  sessionSvc.requirePermission('audit:view')
  return auditRepo.listAudit(db(), (opts ?? {}) as object)
})

export function registerIpcHandlers(): void {
  void router // router populated by handle() calls at module load
}

// silence unused import for PaymentInput
void (null as unknown as PaymentInput)
