import { contextBridge, ipcRenderer } from 'electron'
import type { TindaApi } from '@shared/ipc'
import type { CheckoutPayload, RefundPayload, VoidPayload, CompleteSetupPayload } from '@shared/ipc'

const invoke = <T = unknown>(channel: string, ...args: unknown[]): Promise<T> => ipcRenderer.invoke(channel, ...args)
const api: TindaApi = {
  app: {
    info: () => invoke<{ name: string; version: string; offline: boolean }>('app:info'),
    dataDir: () => invoke<string>('app:dataDir'),
    checkIntegrity: () => invoke<{ ok: boolean; message: string }>('app:checkIntegrity')
  },
  auth: {
    status: () => invoke<import('@shared/types').SessionUser | null>('auth:status'),
    login: (u, p) => invoke<import('@shared/ipc').LoginResult>('auth:login', u, p),
    loginPin: (pin) => invoke<import('@shared/ipc').LoginResult>('auth:loginPin', pin),
    logout: () => invoke<void>('auth:logout'),
    changePassword: (c, n) => invoke<void>('auth:changePassword', c, n),
    changePin: (pin) => invoke<void>('auth:changePin', pin),
    adminResetPin: (id, pin) => invoke<void>('auth:adminResetPin', id, pin),
    setup: () => invoke<{ complete: boolean }>('auth:setup'),
    completeSetup: (payload: CompleteSetupPayload) => invoke<import('@shared/ipc').LoginResult>('auth:completeSetup', payload)
  },
  users: {
    list: () => invoke<import('@shared/types').User[]>('users:list'),
    create: (input) => invoke<import('@shared/types').User>('users:create', input),
    update: (id, input) => invoke<import('@shared/types').User>('users:update', id, input),
    roles: () => invoke<string[]>('users:roles')
  },
  settings: {
    get: () => invoke<import('@shared/types').StoreSettings>('settings:get'),
    update: (patch) => invoke<import('@shared/types').StoreSettings>('settings:update', patch)
  },
  categories: {
    list: () => invoke<import('@shared/types').Category[]>('categories:list'),
    create: (name) => invoke<import('@shared/types').Category>('categories:create', name),
    remove: (id) => invoke<void>('categories:remove', id)
  },
  products: {
    search: (q, opts) => invoke<{ rows: import('@shared/types').Product[]; total: number }>('products:search', q, opts),
    get: (id) => invoke<import('@shared/types').Product>('products:get', id),
    create: (input) => invoke<import('@shared/types').Product>('products:create', input),
    update: (id, input) => invoke<import('@shared/types').Product>('products:update', id, input),
    archive: (id) => invoke<import('@shared/types').Product>('products:archive', id),
    restore: (id) => invoke<import('@shared/types').Product>('products:restore', id),
    count: (status) => invoke<number>('products:count', status)
  },
  inventory: {
    movements: (opts) => invoke<{ rows: import('@shared/types').InventoryMovement[]; total: number }>('inventory:movements', opts),
    receive: (input) => invoke<import('@shared/types').InventoryMovement>('inventory:receive', input),
    adjust: (input) => invoke<import('@shared/types').InventoryMovement>('inventory:adjust', input),
    movement: (type, input) => invoke<import('@shared/types').InventoryMovement>('inventory:movement', type, input),
    count: (input) => invoke<import('@shared/types').InventoryMovement>('inventory:count', input)
  },
  suppliers: {
    list: (opts) => invoke<import('@shared/types').Supplier[]>('suppliers:list', opts),
    create: (input) => invoke<import('@shared/types').Supplier>('suppliers:create', input),
    update: (id, input) => invoke<import('@shared/types').Supplier>('suppliers:update', id, input),
    products: (id) => invoke<import('@shared/types').Product[]>('suppliers:products', id),
    purchases: (id) => invoke<import('@shared/types').Purchase[]>('suppliers:purchases', id)
  },
  customers: {
    list: (opts) => invoke<{ rows: import('@shared/types').Customer[]; total: number }>('customers:list', opts),
    get: (id) => invoke<import('@shared/types').Customer>('customers:get', id),
    create: (input) => invoke<import('@shared/types').Customer>('customers:create', input),
    update: (id, input) => invoke<import('@shared/types').Customer>('customers:update', id, input),
    ledger: (id, opts) => invoke<import('@shared/types').CreditLedgerEntry[]>('customers:ledger', id, opts),
    pay: (input) => invoke<import('@shared/types').CreditLedgerEntry>('customers:pay', input),
    adjust: (input) => invoke<import('@shared/types').CreditLedgerEntry>('customers:adjust', input),
    revoke: (input) => invoke<import('@shared/types').CreditLedgerEntry>('customers:revoke', input),
    approveOverlimit: (input) => invoke<{ balance_c: number }>('customers:approveOverlimit', input)
  },
  pos: {
    searchProducts: (q) => invoke<import('@shared/types').Product[]>('pos:searchProducts', q),
    checkout: (payload: CheckoutPayload) => invoke<{ sale: import('@shared/types').Sale; receipt: string[] }>('pos:checkout', payload),
    hold: (payload: CheckoutPayload) => invoke<import('@shared/types').HeldSale>('pos:hold', payload),
    held: () => invoke<import('@shared/types').HeldSale[]>('pos:held'),
    resumeHeld: (id) => invoke<import('@shared/types').HeldSale>('pos:resumeHeld', id),
    deleteHeld: (id) => invoke<void>('pos:deleteHeld', id),
    reprint: (saleId) => invoke<string[]>('pos:reprint', saleId)
  },
  transactions: {
    list: (opts) => invoke<{ rows: import('@shared/types').Sale[]; total: number }>('transactions:list', opts),
    get: (id) => invoke<import('@shared/types').Sale>('transactions:get', id),
    refund: (payload: RefundPayload) => invoke<import('@shared/types').Refund>('transactions:refund', payload),
    void: (payload: VoidPayload) => invoke<import('@shared/types').Sale>('transactions:void', payload)
  },
  expenses: {
    categories: () => invoke<import('@shared/types').ExpenseCategory[]>('expenses:categories'),
    createCategory: (name) => invoke<import('@shared/types').ExpenseCategory>('expenses:createCategory', name),
    list: (opts) => invoke<{ rows: import('@shared/types').Expense[]; total: number }>('expenses:list', opts),
    create: (input) => invoke<import('@shared/types').Expense>('expenses:create', input),
    update: (id, input) => invoke<import('@shared/types').Expense>('expenses:update', id, input),
    remove: (id) => invoke<void>('expenses:remove', id)
  },
  shifts: {
    current: () => invoke<import('@shared/types').Shift | null>('shifts:current'),
    open: (starting) => invoke<import('@shared/types').Shift>('shifts:open', starting),
    close: (input) => invoke<import('@shared/types').Shift>('shifts:close', input),
    cashMovement: (input) => invoke<import('@shared/types').CashMovement>('shifts:cashMovement', input),
    list: (opts) => invoke<{ rows: import('@shared/types').Shift[]; total: number }>('shifts:list', opts),
    summary: (id) => invoke<import('@shared/types').Shift>('shifts:summary', id)
  },
  reports: {
    sales: (opts) => invoke<{ rows: import('@shared/types').SalesReportRow[]; summary: import('@shared/types').ReportSummary; chart: { label: string; total_c: number; profit_c: number }[] }>('reports:sales', opts),
    inventory: () => invoke<{ rows: (import('@shared/types').Product & { inventory_value_c: number; total_cost_c: number })[]; summary: { total_units: number; inventory_value_c: number; low_stock: number; out_of_stock: number } }>('reports:inventory'),
    utang: () => invoke<{ rows: import('@shared/types').Customer[]; total_outstanding_c: number; payments_c: number }>('reports:utang'),
    cashier: (opts) => invoke<{ rows: import('@shared/types').Sale[]; summary: import('@shared/types').ReportSummary }>('reports:cashier', opts),
    shifts: (opts) => invoke<{ rows: import('@shared/types').Shift[]; summary: import('@shared/types').ReportSummary }>('reports:shifts', opts),
    exportCsv: (kind, opts) => invoke<import('@shared/types').ExportResult>('reports:exportCsv', kind, opts)
  },
  backup: {
    list: () => invoke<import('@shared/types').BackupInfo[]>('backup:list'),
    create: (reason) => invoke<import('@shared/types').BackupInfo>('backup:create', reason),
    restore: (filename) => invoke<void>('backup:restore', filename),
    openFolder: () => invoke<void>('backup:openFolder')
  },
  audit: {
    list: (opts) => invoke<{ rows: import('@shared/types').AuditLog[]; total: number }>('audit:list', opts)
  }
}

contextBridge.exposeInMainWorld('api', api)

export default api