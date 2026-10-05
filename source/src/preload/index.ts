import { contextBridge, ipcRenderer } from 'electron'
import type { TindaApi } from '@shared/ipc'
import type { IpcRendererEvent } from 'electron'
import type { CheckoutPayload, RefundPayload, VoidPayload, CompleteSetupPayload } from '@shared/ipc'
import type { UpdateStatusEvent } from '@shared/update'

const invoke = <T = unknown>(channel: string, ...args: unknown[]): Promise<T> => ipcRenderer.invoke(channel, ...args)
const api: TindaApi = {
  app: {
    startup: (enabled?: boolean) => invoke<{ supported: boolean; enabled: boolean }>('app:startup', enabled),
    info: () => invoke<{ name: string; version: string; offline: boolean }>('app:info'),
    dataDir: () => invoke<string>('app:dataDir'),
    databaseFile: () => invoke<string>('app:databaseFile'),
    openDataDir: () => invoke<void>('app:openDataDir'),
    checkIntegrity: () => invoke<{ ok: boolean; message: string }>('app:checkIntegrity'),
    isOnline: () => invoke<boolean>('app:isOnline'),
    openExternal: (url: string) => invoke<void>('app:openExternal', url),
    toggleSalesMonitor: () => invoke<boolean>('app:toggleSalesMonitor'),
    salesMonitorSummary: () =>
      invoke<{
        store_name: string
        currency: string
        today: {
          total_sales_c: number
          total_transactions: number
          cash_c: number
          gcash_c: number
          maya_c: number
          utang_c: number
        }
        recent_sales: import('@shared/types').Sale[]
      }>('app:salesMonitorSummary'),
    onSaleCompleted: (cb: (sale: import('@shared/types').Sale) => void) => {
      const listener = (_e: IpcRendererEvent, sale: import('@shared/types').Sale): void => cb(sale)
      ipcRenderer.on('sales:completed', listener)
      return () => {
        ipcRenderer.removeListener('sales:completed', listener)
      }
    }
  },
  update: {
    state: () => invoke<UpdateStatusEvent>('update:state'),
    check: (manual) => invoke<UpdateStatusEvent>('update:check', manual),
    download: () => invoke<UpdateStatusEvent>('update:download'),
    install: () => invoke<UpdateStatusEvent>('update:install'),
    dismiss: () => invoke<void>('update:dismiss'),
    onEvent: (cb) => {
      const listener = (_e: IpcRendererEvent, event: UpdateStatusEvent): void => cb(event)
      ipcRenderer.on('update:event', listener)
      return () => {
        ipcRenderer.removeListener('update:event', listener)
      }
    }
  },
  auth: {
    status: () => invoke<import('@shared/types').SessionUser | null>('auth:status'),
    login: (u, p) => invoke<import('@shared/ipc').LoginResult>('auth:login', u, p),
    loginPin: (pin: string, targetUserId?: number) => invoke<import('@shared/ipc').LoginResult>('auth:loginPin', pin, targetUserId),
    verifyManagerPin: (pin) => invoke<{ valid: boolean; name?: string }>('auth:verifyManagerPin', pin),
    logout: () => invoke<void>('auth:logout'),
    changePassword: (c, n) => invoke<void>('auth:changePassword', c, n),
    changePin: (pin) => invoke<void>('auth:changePin', pin),
    adminResetPin: (id, pin) => invoke<void>('auth:adminResetPin', id, pin),
    adminResetPassword: (id: number, newPassword: string) => invoke<void>('auth:adminResetPassword', id, newPassword),
    publicUsers: () => invoke<{ id: number; username: string; full_name: string; roles: string[] }[]>('auth:publicUsers'),
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
    count: (status) => invoke<number>('products:count', status),
    csvTemplate: () => invoke<string>('products:csvTemplate'),
    previewCsv: (text) => invoke('products:previewCsv', text),
    importCsv: (text, strategy) => invoke('products:importCsv', text, strategy),
    previewSimplePos: (text) => invoke('products:previewSimplePos', text),
    importSimplePos: (text, strategy) => invoke('products:importSimplePos', text, strategy),
    saveImage: (data) => invoke<{ filename: string; url: string }>('products:saveImage', data),
    deleteImage: (filename) => invoke<void>('products:deleteImage', filename),
    getImageData: (filename) => invoke<string | null>('products:getImageData', filename)
  },
  inventory: {
    expiration: () => invoke<import('@shared/types').ExpirationEntry[]>('inventory:expiration'),
    batchDate: (id, date) => invoke<void>('inventory:batchDate', id, date),
    onChanged: (cb) => {
      const listener = (_e: IpcRendererEvent, event: import('@shared/types').InventoryChangedEvent): void => cb(event)
      ipcRenderer.on('inventory:changed', listener)
      return () => ipcRenderer.removeListener('inventory:changed', listener)
    },
    movements: (opts) => invoke<{ rows: import('@shared/types').InventoryMovement[]; total: number }>('inventory:movements', opts),
    receiving: (opts) => invoke<{ rows: import('@shared/types').StockReceivingRecord[]; total: number; total_cost_c: number }>('inventory:receiving', opts),
    receive: (input) => invoke<import('@shared/types').InventoryMovement>('inventory:receive', input),
    adjust: (input) => invoke<import('@shared/types').InventoryMovement>('inventory:adjust', input),
    movement: (type, input) => invoke<import('@shared/types').InventoryMovement>('inventory:movement', type, input),
    count: (input) => invoke<import('@shared/types').InventoryMovement>('inventory:count', input),
    restock: (input) => invoke<import('@shared/types').InventoryMovement>('inventory:restock', input),
    withdraw: (input) => invoke<import('@shared/types').InventoryMovement>('inventory:withdraw', input)
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
    checkout: (payload: CheckoutPayload) => invoke<{ sale: import('@shared/types').Sale; receipt: string[]; print: import('@shared/ipc').PrintResult }>('pos:checkout', payload),
    hold: (payload: CheckoutPayload) => invoke<import('@shared/types').HeldSale>('pos:hold', payload),
    held: () => invoke<import('@shared/types').HeldSale[]>('pos:held'),
    resumeHeld: (id) => invoke<import('@shared/types').HeldSale>('pos:resumeHeld', id),
    deleteHeld: (id) => invoke<void>('pos:deleteHeld', id),
    reprint: (saleId) => invoke<string[]>('pos:reprint', saleId)
  },
  printer: {
    list: () => invoke<import('@shared/ipc').PrinterChoice[]>('printer:list'),
    save: (input) => invoke<import('@shared/types').StoreSettings>('printer:save', input),
    testPrint: () => invoke<import('@shared/ipc').PrintResult>('printer:testPrint'),
    printReceipt: (saleId) => invoke<import('@shared/ipc').PrintResult>('printer:printReceipt', saleId)
  },
  transactions: {
    list: (opts) => invoke<{ rows: import('@shared/types').Sale[]; total: number }>('transactions:list', opts),
    get: (id) => invoke<import('@shared/types').Sale>('transactions:get', id),
    refund: (payload: RefundPayload) => invoke<import('@shared/types').Refund>('transactions:refund', payload),
    void: (payload: VoidPayload) => invoke<import('@shared/types').Sale>('transactions:void', payload),
    delete: (saleId: number, options?: { restoreStock?: boolean }) =>
      invoke<{ ok: boolean; transaction_no: string }>('transactions:delete', saleId, options),
    onChanged: (handler: (payload: unknown) => void) => {
      const sub = (_e: Electron.IpcRendererEvent, data: unknown) => handler(data)
      ipcRenderer.on('transactions:changed', sub)
      return () => ipcRenderer.removeListener('transactions:changed', sub)
    }
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
    cashCount: (input) => invoke<import('@shared/types').CashCountRecord>('reports:cashCount', input),
    cashCounts: (opts) => invoke<import('@shared/types').CashCountRecord[]>('reports:cashCounts', opts),
    cashCountExpected: () => invoke<import('@shared/types').ReadReport>('reports:cashCountExpected'),
    cashCountPrint: (id) => invoke<import('@shared/ipc').PrintResult>('reports:cashCountPrint', id),
    sales: (opts) => invoke<{ rows: import('@shared/types').SalesReportRow[]; summary: import('@shared/types').ReportSummary; chart: { label: string; total_c: number; profit_c: number }[] }>('reports:sales', opts),
    inventory: () => invoke<{ rows: (import('@shared/types').Product & { inventory_value_c: number; total_cost_c: number })[]; summary: { total_units: number; inventory_value_c: number; low_stock: number; out_of_stock: number } }>('reports:inventory'),
    utang: () => invoke<{ rows: import('@shared/types').Customer[]; total_outstanding_c: number; payments_c: number }>('reports:utang'),
    cashier: (opts) => invoke<{ rows: import('@shared/types').Sale[]; summary: import('@shared/types').ReportSummary }>('reports:cashier', opts),
    shifts: (opts) => invoke<{ rows: import('@shared/types').Shift[]; summary: import('@shared/types').ReportSummary }>('reports:shifts', opts),
    exportCsv: (kind, opts) => invoke<import('@shared/types').ExportResult>('reports:exportCsv', kind, opts),
    xRead: () => invoke<import('@shared/types').ReadReport>('reports:xRead'),
    printXRead: () => invoke<import('@shared/ipc').PrintResult & { report: import('@shared/types').ReadReport }>('reports:printXRead'),
    finalizeZ: (input) => invoke<import('@shared/types').ZRead>('reports:finalizeZ', input),
    zHistory: () => invoke<import('@shared/types').ZRead[]>('reports:zHistory'),
    printZRead: (id) => invoke<import('@shared/ipc').PrintResult>('reports:printZRead', id)
  },
  backup: {
    list: () => invoke<import('@shared/types').BackupInfo[]>('backup:list'),
    create: (reason) => invoke<import('@shared/types').BackupInfo>('backup:create', reason),
    restore: (filename) => invoke<void>('backup:restore', filename),
    exportTinda: () => invoke<string | null>('backup:exportTinda'),
    importTinda: () => invoke<string | null>('backup:importTinda'),
    openFolder: () => invoke<void>('backup:openFolder'),
    selectSyncFolder: () => invoke<string | null>('backup:selectSyncFolder'),
    openSyncFolder: () => invoke<void>('backup:openSyncFolder'),
    dir: () => invoke<string>('backup:dir'),
    resetDatabase: (confirmation) => invoke<void>('backup:resetDatabase', confirmation),
    startNewStore: (confirmation) => invoke<void>('backup:startNewStore', confirmation),
    locationStatus: () => invoke<import('@shared/ipc').DataLocationStatus>('backup:locationStatus'),
    usePortableData: (choice) => invoke<void>('backup:usePortableData', choice),
    useSharedAppData: () => invoke<void>('backup:useSharedAppData')
  },
  audit: {
    list: (opts) => invoke<{ rows: import('@shared/types').AuditLog[]; total: number }>('audit:list', opts)
  },
  priceReferences: {
    search: (opts) => invoke<{ rows: import('@shared/types').PriceReference[]; references: import('@shared/types').PriceReference[]; total: number }>('priceReferences:search', opts),
    get: (id) => invoke<import('@shared/types').PriceReference | undefined>('priceReferences:get', id),
    getByProduct: (productId) => invoke<import('@shared/types').PriceReference | undefined>('priceReferences:getByProduct', productId),
    getByBarcode: (barcode) => invoke<import('@shared/types').PriceReference | undefined>('priceReferences:getByBarcode', barcode),
    matchForProduct: (product) => invoke<import('@shared/types').PriceReference | null>('priceReferences:matchForProduct', product),
    link: (referenceId, productId) => invoke<import('@shared/types').PriceReference>('priceReferences:link', referenceId, productId),
    unlink: (referenceId) => invoke<import('@shared/types').PriceReference>('priceReferences:unlink', referenceId),
    sync: (opts) => invoke<import('@shared/types').PriceSyncResult>('priceReferences:sync', opts),
    status: () => invoke<{
      total: number
      last_synced_at: string | null
      is_stale: boolean
      sources: { source_name: string; count: number }[]
    }>('priceReferences:status'),
    compare: (retailPriceC, reference) => invoke<import('@shared/types').PriceComparisonStatus>('priceReferences:compare', retailPriceC, reference)
  },
  phoneScanner: {
    getStatus: () => invoke<{
      running: boolean
      port: number
      httpsPort: number
      ip: string
      url: string
      httpsUrl: string
      connected: boolean
      device?: string
    }>('phoneScanner:getStatus'),
    restart: () => invoke<number>('phoneScanner:restart'),
    getCfdState: () => invoke<Record<string, unknown>>('phoneScanner:getCfdState'),
    updateCfd: (partial: Record<string, unknown>) => invoke<Record<string, unknown>>('phoneScanner:updateCfd', partial),
    getCfdUrl: () => invoke<{ url: string; httpsUrl: string }>('phoneScanner:getCfdUrl'),
    onScan: (cb) => {
      const listener = (_e: IpcRendererEvent, data: { barcode: string }): void => cb(data.barcode)
      ipcRenderer.on('phoneScanner:scan', listener)
      return () => {
        ipcRenderer.removeListener('phoneScanner:scan', listener)
      }
    },
    onStatus: (cb) => {
      const listener = (_e: IpcRendererEvent, data: { connected: boolean; device?: string }): void => cb(data)
      ipcRenderer.on('phoneScanner:status', listener)
      return () => {
        ipcRenderer.removeListener('phoneScanner:status', listener)
      }
    }
  },
  lan: {
    getStatus: () => invoke<import('@shared/types').LanStatus>('lan:getStatus'),
    setMode: (mode, config) => invoke<import('@shared/types').LanStatus>('lan:setMode', mode, config),
    generatePin: () => invoke<string>('lan:generatePin'),
    pair: (masterIp, pin, deviceName) => invoke<{ ok: boolean; error?: string; storeName?: string }>('lan:pair', masterIp, pin, deviceName),
    testVps: (url, token) => invoke<{ ok: boolean; message: string }>('lan:testVps', url, token),
    triggerVpsSync: () => invoke<{ ok: boolean; syncedCount: number; message: string }>('lan:triggerVpsSync'),
    onStatus: (cb) => {
      const listener = (_e: IpcRendererEvent, data: import('@shared/types').LanStatus): void => cb(data)
      ipcRenderer.on('lan:status', listener)
      return () => {
        ipcRenderer.removeListener('lan:status', listener)
      }
    }
  },
  license: {
    getStatus: () => invoke<import('@shared/types').LicenseStatus>('license:getStatus'),
    activate: (key, customerName) => invoke<{ ok: boolean; message: string; status: import('@shared/types').LicenseStatus }>('license:activate', key, customerName),
    deactivate: () => invoke<{ ok: boolean; message: string }>('license:deactivate'),
    copyMachineId: () => invoke<string>('license:copyMachineId')
  },
  cloud: {
    status: () => invoke<{ isVip: boolean; settings: import('@shared/types').StoreSettings }>('cloud:status'),
    syncNow: () => invoke<{ ok: boolean; message: string }>('cloud:syncNow'),
    updateSettings: (patch) => invoke<import('@shared/types').StoreSettings>('cloud:updateSettings', patch)
  },
  community: {
    getAnnouncements: () => invoke<{ ok: boolean; announcements: import('@shared/types').LiveAnnouncement[] }>('community:getAnnouncements'),
    getMessages: (limit) => invoke<{ ok: boolean; messages: import('@shared/types').CommunityChatMessage[] }>('community:getMessages', limit),
    sendMessage: (text, devKey) => invoke<{ ok: boolean; message?: import('@shared/types').CommunityChatMessage; error?: string }>('community:sendMessage', text, devKey),
    deleteMessage: (messageId, devKey) => invoke<{ ok: boolean; error?: string }>('community:deleteMessage', messageId, devKey),
    postAnnouncement: (title, message, devKey) => invoke<{ ok: boolean; announcement?: import('@shared/types').LiveAnnouncement; error?: string }>('community:postAnnouncement', title, message, devKey)
  },
  ewallet: {
    createTransaction: (input) => invoke<import('@shared/types').EwalletTransactionRecord>('ewallet:createTransaction', input),
    deleteTransaction: (id) => invoke<boolean>('ewallet:deleteTransaction', id),
    listTransactions: (opts) => invoke<import('@shared/types').EwalletTransactionRecord[]>('ewallet:listTransactions', opts),
    getShiftSummary: (shiftId) => invoke<import('@shared/types').EwalletShiftSummary>('ewallet:getShiftSummary', shiftId),
    saveAudit: (input) => invoke<import('@shared/types').EwalletAuditRecord>('ewallet:saveAudit', input),
    listAudits: (opts) => invoke<import('@shared/types').EwalletAuditRecord[]>('ewallet:listAudits', opts),
    printSlip: (id) => invoke<{ ok: boolean; message: string }>('ewallet:printSlip', id),
    printAuditReport: (id) => invoke<{ ok: boolean; message: string }>('ewallet:printAuditReport', id)
  }
}

contextBridge.exposeInMainWorld('api', api)

export default api
