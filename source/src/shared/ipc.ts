import type {
  AuditLog,
  BackupInfo,
  CashMovement,
  Category,
  CreditLedgerEntry,
  CreditEntryType,
  Customer,
  Expense,
  ExpenseCategory,
  ExportResult,
  HeldSale,
  InventoryMovement,
  InventoryMovementType,
  PriceComparisonStatus,
  PriceReference,
  PriceSourceType,
  PriceSyncResult,
  Product,
  ProductInput,
  Purchase,
  CreatePurchaseInput,
  Refund,
  ReportSummary,
  SalesReportRow,
  SessionUser,
  Shift,
  StoreSettings,
  Supplier,
  User,
  LicenseStatus
} from './types'

export type PaymentInput = {
  method: 'CASH' | 'GCASH' | 'MAYA' | 'MARIBANK' | 'UTANG'
  amount_c: number
  reference?: string | null
}

export interface CartPayloadItem {
  product_id: number | null
  name: string
  unit_name: string
  qty: number
  qty_base: number
  unit_price_c: number
  cost_base_c: number
  stock_base: number | null
  subtotal_c: number
}

export interface CheckoutPayload {
  items: CartPayloadItem[]
  discount_c: number
  customer_id: number | null
  payments: PaymentInput[]
  notes?: string | null
}

export interface RefundPayload {
  sale_id: number
  reason: string
  items: { sale_item_id: number; product_id: number; qty_base: number; unit_name: string }[]
}

export interface VoidPayload {
  sale_id: number
  reason: string
}

export interface LoginResult {
  user: SessionUser
  firstRun: boolean
  shiftOpen: boolean
}

export interface PrintResult {
  ok: boolean
  code: 'PRINTED' | 'DISABLED' | 'NO_PRINTER' | 'UNAVAILABLE' | 'FAILED'
  message: string
}

export interface PrinterChoice { name: string; displayName: string; isDefault: boolean }

export interface DataLocationStatus {
  mode: 'SHARED' | 'PORTABLE'
  label: 'Shared AppData' | 'Portable Data'
  root: string
  databaseFile: string
  backupDir: string
  portableAvailable: boolean
  sharedRoot: string
  portableRoot: string | null
  sharedHasData: boolean
  portableHasData: boolean
}

/**
 * Canonical payload for the first-run setup wizard.
 * This is the SINGLE source of truth. Renderer, preload, IPC handler, and
 * the auth service all agree on this exact shape. Keep field names in sync
 * across every layer — a mismatch here previously caused the payload to be
 * misread at the IPC boundary.
 */
export interface CompleteSetupPayload {
  store: {
    store_name: string
    owner_name?: string
    address?: string
    phone?: string
  }
  admin: {
    username: string
    password: string
    pin: string
    full_name?: string
  }
  receipt: {
    header?: string
    footer?: string
  }
  data_dir: string
  load_demo: boolean
}

/**
 * Full typed IPC contract. Renderer never calls ipcRenderer directly;
 * it goes through the preload-exposed `window.api` (see @shared/ipc usage in preload).
 */
export interface TindaApi {
  app: {
    startup: (enabled?: boolean) => Promise<{ supported: boolean; enabled: boolean }>
    info: () => Promise<{ name: string; version: string; offline: boolean }>
    dataDir: () => Promise<string>
    databaseFile: () => Promise<string>
    openDataDir: () => Promise<void>
    openPath: (path: string) => Promise<string>
    revealPath: (path: string) => Promise<void>
    checkIntegrity: () => Promise<{ ok: boolean; message: string }>
    isOnline: () => Promise<boolean>
    openExternal: (url: string) => Promise<void>
    toggleSalesMonitor: () => Promise<boolean>
    salesMonitorSummary: () => Promise<{
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
      recent_sales: import('./types').Sale[]
    }>
    onSaleCompleted: (cb: (sale: import('./types').Sale) => void) => () => void
  }

  update: {
    state: () => Promise<import('./update').UpdateStatusEvent>
    check: (manual: boolean) => Promise<import('./update').UpdateStatusEvent>
    download: (type?: 'PATCH' | 'FULL') => Promise<import('./update').UpdateStatusEvent>
    install: () => Promise<import('./update').UpdateStatusEvent>
    dismiss: () => Promise<void>
    onEvent: (cb: (event: import('./update').UpdateStatusEvent) => void) => () => void
  }

  rollback: {
    getTargets: () => Promise<Array<{
      version: string
      tag: string
      title: string
      publishedAt: string
      releaseNotes: string
      assetName: string
      assetUrl: string
      assetSize: number
    }>>
    execute: (version: string) => Promise<{
      ok: boolean
      message: string
      backupPath: string
      installerPath: string
    }>
    onProgress: (cb: (progress: { downloaded: number; total: number; percent: number }) => void) => () => void
  }

  auth: {
    status: () => Promise<SessionUser | null>
    login: (username: string, password: string) => Promise<LoginResult>
    loginPin: (pin: string, targetUserId?: number) => Promise<LoginResult>
    verifyManagerPin: (pin: string) => Promise<{ valid: boolean; name?: string }>
    logout: () => Promise<void>
    changePassword: (current: string, next: string) => Promise<void>
    changePin: (pin: string) => Promise<void>
    adminResetPin: (userId: number, newPin: string) => Promise<void>
    adminResetPassword: (userId: number, newPassword: string) => Promise<void>
    publicUsers: () => Promise<{ id: number; username: string; full_name: string; roles: string[] }[]>
    setup: () => Promise<{ complete: boolean }>
    completeSetup: (payload: CompleteSetupPayload) => Promise<LoginResult>
  }

  users: {
    list: () => Promise<User[]>
    create: (input: {
      username: string
      password: string
      pin: string
      full_name: string
      roles: string[]
      is_active?: boolean
    }) => Promise<User>
    update: (
      id: number,
      input: Partial<{
        username: string
        password: string
        pin: string
        full_name: string
        roles: string[]
        is_active: boolean
      }>
    ) => Promise<User>
    roles: () => Promise<string[]>
  }

  settings: {
    get: () => Promise<StoreSettings>
    update: (patch: Partial<StoreSettings>) => Promise<StoreSettings>
  }

  categories: { list: () => Promise<Category[]>; create: (name: string) => Promise<Category>; remove: (id: number) => Promise<void> }

  products: {
    search: (q: string, opts?: { category_id?: number | null; status?: string; limit?: number; offset?: number }) => Promise<{
      rows: Product[]
      total: number
    }>
    get: (id: number) => Promise<Product>
    create: (input: ProductInput) => Promise<Product>
    update: (id: number, input: Partial<ProductInput>) => Promise<Product>
    archive: (id: number) => Promise<Product>
    restore: (id: number) => Promise<Product>
    count: (status?: string) => Promise<number>
    csvTemplate: () => Promise<string>
    previewCsv: (text: string) => Promise<{ rows: Array<Record<string, unknown> & { row_number: number; product_name: string; valid: boolean; duplicate: boolean; reasons: string[] }>; total: number; valid: number; invalid: number; duplicates: number }>
    importCsv: (text: string, strategy: 'SKIP' | 'UPDATE') => Promise<{ created: number; updated: number; skipped: number; product_ids: number[] }>
    previewSimplePos: (text: string) => Promise<{
      rows: Array<Record<string, unknown> & { row_number: number; product_name: string; valid: boolean; duplicate: boolean; reasons: string[] }>
      total: number
      valid: number
      invalid: number
      duplicates: number
      categories_count: number
      total_stock: number
      total_retail_value_c: number
      active_count: number
      inactive_count: number
    }>
    importSimplePos: (text: string, strategy: 'SKIP' | 'UPDATE') => Promise<{ created: number; updated: number; skipped: number; total_stock: number; product_ids: number[] }>
    saveImage: (data: { name: string; dataUrl: string }) => Promise<{ filename: string; url: string }>
    deleteImage: (filename: string) => Promise<void>
    getImageData: (filename: string) => Promise<string | null>
    getRecipe: (id: number) => Promise<import('./types').ProductRecipeItem[]>
    saveRecipe: (id: number, items: { component_product_id: number; quantity: number; unit_name?: string }[]) => Promise<{ ok: boolean }>
    checkCycle: (parentId: number, componentId: number) => Promise<{ hasCycle: boolean }>
    rollupCost: (id: number) => Promise<{ rollupCostC: number }>
  }

  inventory: {
    expiration: () => Promise<import('./types').ExpirationEntry[]>
    batchDate: (id: number, date: string) => Promise<void>
    onChanged: (cb: (event: import('./types').InventoryChangedEvent) => void) => () => void
    movements: (opts: { product_id?: number; movement_type?: InventoryMovementType | ''; limit?: number; offset?: number; from?: string; to?: string }) => Promise<{
      rows: InventoryMovement[]
      total: number
    }>
    receiving: (opts?: { search?: string; from?: string; to?: string; supplier_id?: number; source?: import('./types').StockReceivingSource | ''; limit?: number; offset?: number }) => Promise<{
      rows: import('./types').StockReceivingRecord[]
      total: number
      total_cost_c: number
    }>
    receive: (input: { product_id: number; qty_base: number; unit_name: string; cost_c: number; reason?: string }) => Promise<InventoryMovement>
    adjust: (input: { product_id: number; qty_base: number; reason: string }) => Promise<InventoryMovement>
    movement: (type: InventoryMovementType, input: { product_id: number; qty_base: number; reason?: string; notes?: string }) => Promise<InventoryMovement>
    count: (input: { product_id: number; actual_base: number; notes?: string }) => Promise<InventoryMovement>
    restock: (input: { product_id: number; quantity: number; unit_name: string; supplier_id?: number | null; cost_c: number; reference?: string; notes?: string; expiration_date?: string; batch_label?: string }) => Promise<InventoryMovement>
    withdraw: (input: { product_id: number; quantity: number; unit_name: string; reason: import('./types').WithdrawalReason; notes?: string; batch_id?: number }) => Promise<InventoryMovement>
  }

  suppliers: {
    list: (opts?: { status?: string; search?: string }) => Promise<Supplier[]>
    create: (input: Partial<SupplierInput>) => Promise<Supplier>
    update: (id: number, input: Partial<SupplierInput>) => Promise<Supplier>
    products: (id: number) => Promise<Product[]>
    purchases: (id: number) => Promise<Purchase[]>
  }

  purchases: {
    list: (opts?: { supplier_id?: number; from?: string; to?: string; limit?: number; offset?: number }) => Promise<{ rows: Purchase[]; total: number }>
    get: (id: number) => Promise<Purchase>
    create: (input: CreatePurchaseInput) => Promise<Purchase>
  }

  customers: {
    list: (opts?: { search?: string; status?: string; limit?: number; offset?: number }) => Promise<{ rows: Customer[]; total: number }>
    get: (id: number) => Promise<Customer>
    create: (input: CustomerInput) => Promise<Customer>
    update: (id: number, input: Partial<CustomerInput>) => Promise<Customer>
    ledger: (id: number, opts?: { limit?: number }) => Promise<CreditLedgerEntry[]>
    deleteLedgerEntry: (entryId: number) => Promise<{ ok: boolean; customer: Customer }>
    deleteledgerEntry?: (entryId: number) => Promise<{ ok: boolean; customer: Customer }>
    recalculateBalance: (customerId: number) => Promise<Customer>
    pay: (input: { customer_id: number; amount_c: number; method?: string; notes?: string }) => Promise<CreditLedgerEntry>
    adjust: (input: { customer_id: number; amount_c: number; notes: string; reason: string }) => Promise<CreditLedgerEntry>
    revoke: (input: { customer_id: number; amount_c: number; notes: string; reason: string }) => Promise<CreditLedgerEntry>
    approveOverlimit: (input: { customer_id: number; amount_c: number; notes: string; approved_by: string; reason: string }) => Promise<{ balance_c: number }>
  }

  pos: {
    searchProducts: (q: string) => Promise<Product[]>
    checkout: (payload: CheckoutPayload) => Promise<{ sale: import('./types').Sale; receipt: string[]; print: PrintResult }>
    hold: (payload: CheckoutPayload) => Promise<HeldSale>
    held: () => Promise<HeldSale[]>
    resumeHeld: (id: number) => Promise<HeldSale>
    deleteHeld: (id: number) => Promise<void>
    reprint: (saleId: number) => Promise<string[]>
  }

  printer: {
    list: () => Promise<PrinterChoice[]>
    save: (input: { name: string; autoPrint: boolean; paperWidth: '58mm' | '80mm'; copies: number; manualPrintDialog?: boolean }) => Promise<StoreSettings>
    testPrint: (options?: { manual?: boolean }) => Promise<PrintResult>
    printReceipt: (saleId: number, options?: { manual?: boolean }) => Promise<PrintResult>
    printLines: (lines: string[], options?: { manual?: boolean }) => Promise<PrintResult>
    printDocument: (
      html: string,
      options?: {
        manual?: boolean
        title?: string
        pageSize?: 'A4' | 'Letter'
        deviceName?: string
        widthMm?: number
        heightMm?: number
      }
    ) => Promise<PrintResult>
    testPrintLabel: (options?: { manual?: boolean; deviceName?: string }) => Promise<PrintResult>
    saveLabel: (input: { name: string; paperSize?: string }) => Promise<StoreSettings>
    kickCashDrawer: (deviceName?: string) => Promise<PrintResult>
    installDriver: () => Promise<{ ok: boolean; message: string }>
    openDriverTutorial: () => Promise<{ ok: boolean; message: string }>
  }

  transactions: {
    list: (opts: {
      from?: string
      to?: string
      status?: string
      method?: string
      cashier_id?: number
      search?: string
      limit?: number
      offset?: number
    }) => Promise<{ rows: import('./types').Sale[]; total: number }>
    get: (id: number) => Promise<import('./types').Sale>
    refund: (payload: RefundPayload) => Promise<Refund>
    void: (payload: VoidPayload) => Promise<import('./types').Sale>
    delete: (saleId: number, options?: { restoreStock?: boolean }) => Promise<{ ok: boolean; transaction_no: string }>
    updateItemPrice?: (saleItemId: number, newUnitPriceC: number) => Promise<{ ok: boolean; saleId: number; deltaC: number }>
    onChanged: (handler: (payload: unknown) => void) => () => void
  }

  expenses: {
    categories: () => Promise<ExpenseCategory[]>
    createCategory: (name: string) => Promise<ExpenseCategory>
    list: (opts: { from?: string; to?: string; category_id?: number; limit?: number; offset?: number }) => Promise<{ rows: Expense[]; total: number }>
    create: (input: ExpenseInput) => Promise<Expense>
    update: (id: number, input: Partial<ExpenseInput>) => Promise<Expense>
    remove: (id: number) => Promise<void>
  }

  shifts: {
    current: () => Promise<Shift | null>
    open: (starting_cash_c: number) => Promise<Shift>
    close: (input: { actual_cash_c: number; closing_note?: string }) => Promise<Shift>
    cashMovement: (input: { type: 'CASH_IN' | 'CASH_OUT'; amount_c: number; reason?: string }) => Promise<CashMovement>
    list: (opts?: { from?: string; to?: string; cashier_id?: number; limit?: number; offset?: number; status?: string }) => Promise<{
      rows: Shift[]
      total: number
    }>
    summary: (id: number) => Promise<Shift>
  }

  reports: {
    cashCount: (input: { shift_id?: number; quantities: number[]; notes?: string | null }) => Promise<import('./types').CashCountRecord>
    cashCounts: (opts?: { business_date?: string; user_id?: number; status?: string }) => Promise<import('./types').CashCountRecord[]>
    cashCountExpected: () => Promise<import('./types').ReadReport>
    cashCountPrint: (id: number) => Promise<PrintResult>
    sales: (opts: { from: string; to: string; groupBy?: 'DAILY' | 'WEEKLY' | 'MONTHLY' }) => Promise<{
      rows: SalesReportRow[]
      summary: ReportSummary
      chart: { label: string; total_c: number; profit_c: number }[]
    }>
    itemSales: (opts?: { from?: string; to?: string; category_id?: number; search?: string }) => Promise<import('./types').ItemSalesReport>
    inventory: () => Promise<{
      rows: (Product & { inventory_value_c: number; total_cost_c: number })[]
      summary: { total_units: number; inventory_value_c: number; low_stock: number; out_of_stock: number }
    }>
    utang: () => Promise<{ rows: Customer[]; total_outstanding_c: number; payments_c: number }>
    cashier: (opts: { from?: string; to?: string; cashier_id?: number }) => Promise<{
      rows: import('./types').Sale[]
      summary: ReportSummary
    }>
    shifts: (opts?: { from?: string; to?: string }) => Promise<{ rows: Shift[]; summary: ReportSummary }>
    exportCsv: (kind: 'SALES' | 'ITEMS' | 'INVENTORY' | 'EXPENSES' | 'UTANG' | 'TRANSACTIONS', opts?: { from?: string; to?: string; category_id?: number; search?: string }) => Promise<ExportResult>
    xRead: () => Promise<import('./types').ReadReport>
    printXRead: () => Promise<PrintResult & { report: import('./types').ReadReport }>
    finalizeZ: (input: { actual_cash_c: number; note?: string }) => Promise<import('./types').ZRead>
    zHistory: () => Promise<import('./types').ZRead[]>
    printZRead: (id: number) => Promise<PrintResult>
  }

  backup: {
    list: () => Promise<BackupInfo[]>
    create: (reason?: string) => Promise<BackupInfo>
    restore: (filename: string) => Promise<void>
    exportTinda: () => Promise<string | null>
    importTinda: () => Promise<string | null>
    openFolder: () => Promise<void>
    selectSyncFolder: () => Promise<string | null>
    openSyncFolder: () => Promise<void>
    dir: () => Promise<string>
    resetDatabase: (confirmation: string) => Promise<void>
    startNewStore: (confirmation: string) => Promise<void>
    locationStatus: () => Promise<DataLocationStatus>
    usePortableData: (choice: 'FRESH' | 'COPY') => Promise<void>
    useSharedAppData: () => Promise<void>
  }

  audit: {
    list: (opts?: { limit?: number; offset?: number; action?: string }) => Promise<{ rows: AuditLog[]; total: number }>
  }

  priceReferences: {
    search: (opts?: {
      query?: string
      sourceType?: PriceSourceType
      linkedOnly?: boolean
      unlinkedOnly?: boolean
      limit?: number
      offset?: number
    }) => Promise<{ rows: PriceReference[]; references: PriceReference[]; total: number }>
    get: (id: number) => Promise<PriceReference | undefined>
    getByProduct: (productId: number) => Promise<PriceReference | undefined>
    getByBarcode: (barcode: string) => Promise<PriceReference | undefined>
    matchForProduct: (product: { id: number; name: string; barcode?: string | null }) => Promise<PriceReference | null>
    link: (referenceId: number, productId: number) => Promise<PriceReference>
    unlink: (referenceId: number) => Promise<PriceReference>
    sync: (opts?: { force?: boolean; remoteUrl?: string }) => Promise<PriceSyncResult>
    status: () => Promise<{
      total: number
      last_synced_at: string | null
      is_stale: boolean
      sources: { source_name: string; count: number }[]
    }>
    compare: (retailPriceC: number, reference: PriceReference | null) => Promise<PriceComparisonStatus>
  }
  phoneScanner: {
    getStatus: () => Promise<{
      running: boolean
      port: number
      httpsPort: number
      ip: string
      url: string
      httpsUrl: string
      connected: boolean
      device?: string
      availableIps?: { name: string; address: string }[]
    }>
    restart: () => Promise<number>
    getCfdState: () => Promise<Record<string, unknown>>
    updateCfd: (partial: Record<string, unknown>) => Promise<Record<string, unknown>>
    getCfdUrl: () => Promise<{ url: string; httpsUrl: string }>
    onScan: (cb: (barcode: string) => void) => () => void
    onStatus: (cb: (status: { connected: boolean; device?: string }) => void) => () => void
  }
  lan: {
    getStatus: () => Promise<import('@shared/types').LanStatus>
    setMode: (mode: import('@shared/types').LanRole, config?: { masterIp?: string; masterPort?: number; pin?: string }) => Promise<import('@shared/types').LanStatus>
    generatePin: () => Promise<string>
    pair: (masterIp: string, pin: string, deviceName?: string) => Promise<{ ok: boolean; error?: string; storeName?: string }>
    testVps: (url: string, token: string) => Promise<{ ok: boolean; message: string }>
    triggerVpsSync: () => Promise<{ ok: boolean; syncedCount: number; message: string }>
    discover: () => Promise<import('@shared/types').DiscoveredMaster[]>
    onStatus: (cb: (status: import('@shared/types').LanStatus) => void) => () => void
  }
  license: {
    getStatus: () => Promise<LicenseStatus>
    activate: (key: string, customerName?: string) => Promise<{ ok: boolean; message: string; status: LicenseStatus }>
    deactivate: () => Promise<{ ok: boolean; message: string }>
    copyMachineId: () => Promise<string>
  }
  cloud: {
    status: () => Promise<{ isVip: boolean; settings: import('@shared/types').StoreSettings }>
    syncNow: () => Promise<{ ok: boolean; message: string }>
    updateSettings: (patch: Partial<import('@shared/types').StoreSettings>) => Promise<import('@shared/types').StoreSettings>
  }
  community: {
    getAnnouncements: () => Promise<{ ok: boolean; announcements: import('@shared/types').LiveAnnouncement[] }>
    getMessages: (limit?: number) => Promise<{ ok: boolean; messages: import('@shared/types').CommunityChatMessage[] }>
    sendMessage: (text: string, devKey?: string, imageUrl?: string | null) => Promise<{ ok: boolean; message?: import('@shared/types').CommunityChatMessage; error?: string }>
    recordSeen: (messageId: string, userName?: string) => Promise<{ ok: boolean }>
    deleteMessage: (messageId: string, devKey?: string) => Promise<{ ok: boolean; error?: string }>
    postAnnouncement: (title: string, message: string, devKey: string) => Promise<{ ok: boolean; announcement?: import('@shared/types').LiveAnnouncement; error?: string }>
  }
  ewallet: {
    createTransaction: (input: {
      shift_id?: number | null
      channel: import('./types').EwalletChannel
      type: import('./types').EwalletTransactionType
      amount_c: number
      fee_c?: number
      reference_no?: string | null
      customer_name?: string | null
      customer_phone?: string | null
      fee_collected_via?: 'CASH' | 'WALLET'
      notes?: string | null
    }) => Promise<import('./types').EwalletTransactionRecord>
    deleteTransaction: (id: number) => Promise<boolean>
    listTransactions: (opts?: { shift_id?: number; channel?: import('./types').EwalletChannel; type?: import('./types').EwalletTransactionType; limit?: number }) => Promise<import('./types').EwalletTransactionRecord[]>
    getShiftSummary: (shiftId?: number | null) => Promise<import('./types').EwalletShiftSummary>
    saveAudit: (input: {
      shift_id?: number | null
      business_date?: string
      expected_cash_c: number
      actual_cash_c: number
      denominations: number[]
      starting_gcash_c: number
      actual_gcash_c: number
      starting_maya_c: number
      actual_maya_c: number
      starting_maribank_c?: number
      actual_maribank_c?: number
      notes?: string | null
    }) => Promise<import('./types').EwalletAuditRecord>
    listAudits: (opts?: { limit?: number }) => Promise<import('./types').EwalletAuditRecord[]>
    deleteAudit: (id: number) => Promise<boolean>
    clearAudits?: () => Promise<number>
    printSlip: (id: number, options?: { manual?: boolean }) => Promise<{ ok: boolean; message: string }>
    printAuditReport: (id: number, options?: { manual?: boolean }) => Promise<{ ok: boolean; message: string }>
    printBillSlip: (
      payload: import('./receiptHtml').BillSlipPayload,
      options?: { manual?: boolean }
    ) => Promise<{ ok: boolean; message: string }>
  }
  ai: {
    ask: (question: string) => Promise<{ reply: string; action?: { label: string; page: string; tab?: string; description?: string } }>
    askAdvisor: (
      question: string,
      telemetry: import('./types').StoreTelemetrySummary,
      language?: 'en' | 'tl'
    ) => Promise<{
      reply: string
      source: 'opencode' | 'gemini' | 'local_rules'
      action?: { label: string; page: string; tab?: string; description?: string }
    }>
  }
  telemetry: {
    getSummary: (options?: { forceRefresh?: boolean }) => Promise<import('./types').StoreTelemetrySummary>
  }
}

export type SupplierInput = {
  name: string
  contact_person?: string | null
  phone?: string | null
  address?: string | null
  notes?: string | null
  status?: 'ACTIVE' | 'ARCHIVED'
}

export type CustomerInput = {
  full_name: string
  nickname?: string | null
  phone?: string | null
  address?: string | null
  notes?: string | null
  credit_limit_c: number
}

export type ExpenseInput = {
  category_id: number
  amount_c: number
  expense_date: string
  description?: string | null
  reference?: string | null
  notes?: string | null
}

export type { CreditEntryType }
