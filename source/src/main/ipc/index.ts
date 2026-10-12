import type { IpcMainInvokeEvent } from 'electron'
import { ipcMain } from 'electron'
import { promises as fs } from 'node:fs'
import { getDb, getDbFile, appDirs } from '../database/connection'
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
import { getSale, listSales, updateSaleItemPrice } from '../repositories/sales'
import * as checkoutSvc from '../services/checkout'
import * as expirationRepo from '../repositories/expiration'
import * as txSvc from '../services/transaction'
import * as reportSvc from '../services/reporting'
import * as exportSvc from '../services/export'
import * as dataManagementSvc from '../services/dataManagement'
import * as printingSvc from '../services/printing'
import * as importSvc from '../services/productImport'
import * as simplePosSvc from '../services/simplePosImport'
import * as readSvc from '../services/readReports'
import { importWindowsBackup, exportWindowsBackup } from '../services/tindaBackupWindows'
import * as cashCountRepo from '../repositories/cashCounts'
import { cashCountLines } from '@shared/cashCount'
import { emitInventoryChanged, emitTransactionsChanged } from '../services/inventoryEvents'
import { app, dialog, net, shell } from 'electron'
import type { PaymentInput, CompleteSetupPayload } from '@shared/ipc'
import { beginCriticalOperation } from '../services/operationGuard'
import { getUpdateService } from '../services/updateRuntime'
import { startupSetting } from '../services/startup'
import * as priceRefRepo from '../repositories/priceReferences'
import * as priceRefSvc from '../services/priceReferenceService'
import * as lanHubSvc from '../services/lanHubService'
import { licenseService } from '../services/licenseService'
import { rollbackService } from '../services/rollbackService'

// IPC handlers have differing concrete signatures; the router erases them so
// any handler can be registered. `any` is intentional here (variadic dispatch).
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Handler = (...args: any[]) => unknown
const router: Record<string, Handler> = {}

function handle(channel: string, fn: Handler): void {
  router[channel] = fn
  ipcMain.handle(channel, async (_e: IpcMainInvokeEvent, ...args: unknown[]) => {
    if (lanHubSvc.isSatellite() && lanHubSvc.shouldProxyChannel(channel)) {
      try {
        return await lanHubSvc.callRemoteRpc(channel, args)
      } catch (err) {
        throw new Error((err as Error).message || String(err))
      }
    }
    return fn(_e, ...args)
  })
}

lanHubSvc.setMasterDispatcher(async (channel: string, args: unknown[]) => {
  const handler = router[channel]
  if (!handler) throw new Error(`Unknown RPC channel: ${channel}`)
  return handler({} as IpcMainInvokeEvent, ...args)
})

const db = () => getDb()
const user = () => sessionSvc.requireUser()

// ---- App ----
handle('app:info', () => {
  // Return the active patch version if a stable patch is loaded, so the UI
  // reflects the true running version after an Apply Live hot-patch.
  let version = app.getVersion() ?? '1.0.0'
  try {
    const { getPatchManifest, getPatchSentinel } = require('../services/patchService') as typeof import('../services/patchService')
    const manifest = getPatchManifest()
    const sentinel = getPatchSentinel()
    if (manifest?.version && sentinel?.status === 'STABLE') {
      const { compareSemver } = require('@shared/update') as typeof import('@shared/update')
      if (compareSemver(manifest.version, version) > 0) {
        version = manifest.version
      }
    }
  } catch { /* fall back to base version */ }
  return { name: 'TINDA POS', version, offline: true }
})
handle('app:startup', (_e, enabled?: boolean) => {
  sessionSvc.requirePermission('settings:manage')
  return startupSetting(enabled)
})
handle('app:dataDir', () => appDirs().root)
handle('app:databaseFile', () => getDbFile())
handle('app:openDataDir', () => { sessionSvc.requirePermission('settings:manage'); return shell.openPath(appDirs().root) })
handle('app:openPath', (_e, targetPath: string) => { sessionSvc.requirePermission('settings:manage'); return shell.openPath(targetPath) })
handle('app:revealPath', (_e, targetPath: string) => { sessionSvc.requirePermission('settings:manage'); shell.showItemInFolder(targetPath) })
handle('app:checkIntegrity', () => require('../database/connection').integrityCheck())
handle('app:isOnline', async () => {
  if (!net.isOnline()) return false

  const probes = [
    ['https://connectivitycheck.gstatic.com/generate_204', 204],
    ['http://www.msftconnecttest.com/connecttest.txt', 200]
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
handle('app:openExternal', (_e: IpcMainInvokeEvent, targetUrl: string) => {
  if (typeof targetUrl === 'string' && (targetUrl.startsWith('https://') || targetUrl.startsWith('http://'))) {
    return shell.openExternal(targetUrl)
  }
  return Promise.resolve()
})
handle('app:toggleSalesMonitor', () => {
  const { toggleSalesMonitorWindow } = require('../index')
  return toggleSalesMonitorWindow()
})
handle('app:salesMonitorSummary', () => {
  const d = db()
  const now = new Date()
  const yyyy = now.getFullYear()
  const mm = String(now.getMonth() + 1).padStart(2, '0')
  const dd = String(now.getDate()).padStart(2, '0')
  const todayPrefix = `${yyyy}-${mm}-${dd}`

  const todaySummary = d.prepare(`
    SELECT 
      COUNT(*) AS total_transactions,
      COALESCE(SUM(total_c), 0) AS total_sales_c,
      COALESCE(SUM(subtotal_c), 0) AS subtotal_c,
      COALESCE(SUM(discount_c), 0) AS discount_c
    FROM sales
    WHERE created_at LIKE ? AND status = 'COMPLETED'
  `).get(`${todayPrefix}%`) as { total_transactions: number; total_sales_c: number; subtotal_c: number; discount_c: number }

  const todayRefunds = d.prepare(`
    SELECT COALESCE(SUM(r.total_c), 0) AS total_refunds_c
    FROM refunds r
    JOIN sales s ON s.id = r.sale_id
    WHERE s.created_at LIKE ?
  `).get(`${todayPrefix}%`) as { total_refunds_c: number }


  const paymentsSummary = d.prepare(`
    SELECT 
      p.method,
      COALESCE(SUM(p.amount_c), 0) AS amount_c
    FROM payments p
    JOIN sales s ON s.id = p.sale_id
    WHERE s.created_at LIKE ? AND s.status = 'COMPLETED'
    GROUP BY p.method
  `).all(`${todayPrefix}%`) as { method: string; amount_c: number }[]

  let cash_c = 0
  let gcash_c = 0
  let maya_c = 0
  let maribank_c = 0
  let utang_c = 0

  for (const p of paymentsSummary) {
    if (p.method === 'CASH') cash_c = p.amount_c
    else if (p.method === 'GCASH') gcash_c = p.amount_c
    else if (p.method === 'MAYA') maya_c = p.amount_c
    else if (p.method === 'MARIBANK') maribank_c = p.amount_c
    else if (p.method === 'UTANG') utang_c = p.amount_c
  }

  const refunds_c = todayRefunds?.total_refunds_c ?? 0
  const realized_sales_c = Math.max(0, cash_c + gcash_c + maya_c + maribank_c - refunds_c)
  const recentSales = listSales(d, { limit: 50 }).rows
  const settings = settingRepo.getSettings(d)

  return {
    store_name: settings.store_name || 'TINDA POS',
    currency: settings.currency || 'PHP',
    today: {
      total_sales_c: realized_sales_c,
      gross_sales_c: todaySummary?.total_sales_c ?? 0,
      total_transactions: todaySummary?.total_transactions ?? 0,
      cash_c,
      gcash_c,
      maya_c,
      maribank_c,
      utang_c,
      refunds_c
    },
    recent_sales: recentSales
  }

})

// ---- Auth ----
handle('auth:status', () => authSvc.authStatus())
handle('auth:login', (_e: IpcMainInvokeEvent, username: string, password: string) => authSvc.login(username, password))
handle('auth:loginPin', (_e: IpcMainInvokeEvent, pin: string, targetUserId?: number) => authSvc.loginPin(pin, targetUserId))
handle('auth:verifyManagerPin', (_e: IpcMainInvokeEvent, pin: string) => authSvc.verifyManagerPin(pin))
handle('auth:logout', () => authSvc.logout())
handle('auth:changePassword', (_e: IpcMainInvokeEvent, current: string, next: string) => authSvc.changePassword(current, next))
handle('auth:changePin', (_e: IpcMainInvokeEvent, pin: string) => authSvc.changePin(pin))
handle('auth:adminResetPin', (_e: IpcMainInvokeEvent, userId: number, newPin: string) => authSvc.adminResetPin(userId, newPin))
// M7.4 — admin password reset for any user
handle('auth:adminResetPassword', (_e: IpcMainInvokeEvent, userId: number, newPassword: string) => authSvc.adminResetPassword(userId, newPassword))
// M7.4 — public user directory for login chips (no auth required)
handle('auth:publicUsers', () => authSvc.publicUsers())
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
  const p = patch as Partial<import('@shared/types').StoreSettings>
  if (p.logo_path) {
    try {
      const { BrowserWindow, nativeImage } = require('electron')
      const win = BrowserWindow.getFocusedWindow() || BrowserWindow.getAllWindows()[0]
      if (win) {
        const img = p.logo_path.startsWith('data:')
          ? nativeImage.createFromDataURL(p.logo_path)
          : nativeImage.createFromPath(p.logo_path)
        if (!img.isEmpty()) {
          win.setIcon(img)
        }
      }
    } catch {}
  }
  return settingRepo.updateSettings(db(), p)
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
  const isVip = licenseService.getStatus().isVip
  if (!isVip && process.env.NODE_ENV !== 'test') {
    const activeCount = prodRepo.productCount(db(), 'ACTIVE')
    if (activeCount >= 50) {
      throw new Error('Product limit reached (50 items max on Free Community Edition). Upgrade to VIP Pro (₱500 Lifetime) for unlimited items.')
    }
  }
  const product = prodRepo.createProduct(db(), input as Parameters<typeof prodRepo.createProduct>[1], user().id)
  emitInventoryChanged({ reason: 'ADJUSTMENT', product_ids: [product.id] })
  return product
})
handle('products:update', (_e: IpcMainInvokeEvent, id: number, input: unknown) => {
  user()
  const product = prodRepo.updateProduct(db(), id, input as Parameters<typeof prodRepo.updateProduct>[2], user().id)
  emitInventoryChanged({ reason: 'ADJUSTMENT', product_ids: [id] })
  return product
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
handle('products:getRecipe', (_e: IpcMainInvokeEvent, id: number) => {
  return prodRepo.getRecipe(db(), id)
})
handle('products:saveRecipe', (_e: IpcMainInvokeEvent, id: number, items: unknown) => {
  sessionSvc.requirePermission('products:manage')
  prodRepo.saveRecipe(db(), id, items as { component_product_id: number; quantity: number; unit_name?: string }[])
  emitInventoryChanged({ reason: 'ADJUSTMENT', product_ids: [id] })
  return { ok: true }
})
handle('products:checkCycle', (_e: IpcMainInvokeEvent, parentId: number, componentId: number) => {
  return { hasCycle: prodRepo.hasRecipeCycle(db(), parentId, componentId) }
})
handle('products:rollupCost', (_e: IpcMainInvokeEvent, id: number) => {
  return { rollupCostC: prodRepo.calculateRollupCost(db(), id) }
})
handle('products:csvTemplate', () => { sessionSvc.requirePermission('products:manage'); return importSvc.CSV_TEMPLATE })
handle('products:previewCsv', (_e: IpcMainInvokeEvent, text: string) => { sessionSvc.requirePermission('products:manage'); return importSvc.previewCsv(db(), text) })
handle('products:importCsv', (_e: IpcMainInvokeEvent, text: string, strategy: 'SKIP' | 'UPDATE') => {
  sessionSvc.requirePermission('products:manage')
  const result = importSvc.importCsv(db(), text, strategy, user().id)
  emitInventoryChanged({ reason: 'CSV_IMPORT', product_ids: result.product_ids })
  return result
})
handle('products:previewSimplePos', (_e: IpcMainInvokeEvent, text: string) => {
  sessionSvc.requirePermission('products:manage')
  return simplePosSvc.previewSimplePos(db(), text)
})
handle('products:importSimplePos', (_e: IpcMainInvokeEvent, text: string, strategy: 'SKIP' | 'UPDATE') => {
  sessionSvc.requirePermission('products:manage')
  const result = simplePosSvc.importSimplePos(db(), text, strategy, user().id)
  emitInventoryChanged({ reason: 'CSV_IMPORT', product_ids: result.product_ids })
  return result
})
handle('products:saveImage', async (_e: IpcMainInvokeEvent, data: { name: string; dataUrl: string }) => {
  sessionSvc.requirePermission('products:manage')
  if (!data?.dataUrl || typeof data.dataUrl !== 'string') throw new Error('Invalid image data.')
  const match = data.dataUrl.match(/^data:image\/(png|jpeg|jpg|webp|gif);base64,(.+)$/i)
  if (!match || !match[1] || !match[2]) throw new Error('Invalid image format. Allowed: PNG, JPEG, WEBP, GIF.')
  const rawExt = match[1].toLowerCase()
  const ext = rawExt === 'jpeg' ? 'jpg' : rawExt
  const base64Data = match[2]
  const buffer = Buffer.from(base64Data, 'base64')
  if (buffer.length > 5 * 1024 * 1024) throw new Error('Image size must not exceed 5MB.')
  const filename = `prod_${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${ext}`
  const filePath = require('node:path').join(appDirs().images, filename)
  await fs.writeFile(filePath, buffer)
  return { filename, url: `tinda-image://${filename}` }
})
handle('products:deleteImage', async (_e: IpcMainInvokeEvent, filename: string) => {
  sessionSvc.requirePermission('products:manage')
  if (!filename || typeof filename !== 'string') return
  const safeName = require('node:path').basename(filename)
  const filePath = require('node:path').join(appDirs().images, safeName)
  try {
    await fs.unlink(filePath)
  } catch {
    // Ignore if file doesn't exist
  }
})
handle('products:getImageData', async (_e: IpcMainInvokeEvent, filename: string) => {
  if (!filename || typeof filename !== 'string') return null
  const safeName = require('node:path').basename(filename)
  const filePath = require('node:path').join(appDirs().images, safeName)
  try {
    const buffer = await fs.readFile(filePath)
    const ext = safeName.split('.').pop()?.toLowerCase() || 'png'
    const mime = ext === 'jpg' || ext === 'jpeg' ? 'image/jpeg' : `image/${ext}`
    return `data:${mime};base64,${buffer.toString('base64')}`
  } catch {
    return null
  }
})

// ---- Inventory ----
handle('inventory:expiration', () => { user(); return expirationRepo.listExpiration(db()) })
handle('inventory:batchDate', (_e: IpcMainInvokeEvent, id: number, date: string) => {
  sessionSvc.requirePermission('products:manage')
  const productId = db().transaction(() => expirationRepo.updateBatchDate(db(), id, date, user().id))()
  emitInventoryChanged({ reason: 'ADJUSTMENT', product_ids: [productId] })
})
handle('inventory:movements', (_e: IpcMainInvokeEvent, opts: unknown) => invRepo.listMovements(db(), (opts ?? {}) as object))
handle('inventory:receiving', (_e: IpcMainInvokeEvent, opts: unknown) => invRepo.listReceiving(db(), (opts ?? {}) as object))
handle('inventory:receive', (_e: IpcMainInvokeEvent, input: unknown) => {
  sessionSvc.requirePermission('inventory:receive')
  const i = input as { product_id: number; qty_base: number; unit_name: string; cost_c: number; reason?: string }
  prodRepo.adjustStock(db(), i.product_id, i.qty_base, 'PURCHASE', i.reason ?? 'Stock receiving', user().id, undefined, {
    source: 'MANUAL RECEIVING', received_unit: i.unit_name, received_quantity: i.qty_base,
    unit_cost_c: i.cost_c || null, notes: i.reason ?? null
  })
  const movement = invRepo.movementsForProduct(db(), i.product_id, 1)[0]
  emitInventoryChanged({ reason: 'PURCHASE', product_ids: [i.product_id] })
  return movement
})
handle('inventory:restock', (_e: IpcMainInvokeEvent, input: unknown) => {
  sessionSvc.requirePermission('inventory:receive')
  const i = input as { product_id: number; quantity: number; unit_name: string; supplier_id?: number | null; cost_c: number; reference?: string; notes?: string; expiration_date?: string; batch_label?: string }
  if (!Number.isFinite(i.quantity) || i.quantity <= 0) throw new Error('Quantity to add must be greater than zero.')
  if (!Number.isFinite(i.cost_c) || i.cost_c < 0) throw new Error('Cost cannot be negative.')
  if (i.cost_c > 0 && i.cost_c % 100 !== 0) throw new Error('Unit cost must be in whole pesos (no centavos).')
  const product = prodRepo.getProduct(db(), i.product_id)
  const unit = product.units.find((u) => u.name === i.unit_name)
  if (!unit) throw new Error('Select a valid product unit.')
  const qtyBase = i.quantity * unit.conversion_to_base
  if (!Number.isFinite(qtyBase)) throw new Error('Restock must convert to a valid number.')
  const supplier = i.supplier_id ? supRepo.getSupplier(db(), i.supplier_id) : null
  const reason = [`Restock: ${i.quantity} ${unit.name} x ${unit.conversion_to_base} = ${qtyBase} ${product.base_unit}`, supplier ? `Supplier: ${supplier.name}` : '', i.cost_c ? `Cost: ${i.cost_c}` : '', i.notes?.trim() || ''].filter(Boolean).join(' | ')
  db().transaction(() => prodRepo.adjustStock(db(), i.product_id, qtyBase, 'PURCHASE', reason, user().id, i.reference, {
    source: 'RESTOCK', supplier_id: i.supplier_id ?? null, received_unit: unit.name,
    received_quantity: i.quantity, unit_cost_c: i.cost_c || null, notes: i.notes ?? null,
    expiration_date: i.expiration_date, batch_label: i.batch_label
  }))()
  const movement = invRepo.movementsForProduct(db(), i.product_id, 1)[0]
  emitInventoryChanged({ reason: 'RESTOCK', product_ids: [i.product_id] })
  return movement
})
handle('inventory:adjust', (_e: IpcMainInvokeEvent, input: unknown) => {
  sessionSvc.requirePermission('inventory:adjust')
  const i = input as { product_id: number; qty_base: number; reason: string }
  prodRepo.adjustStock(db(), i.product_id, i.qty_base, 'ADJUSTMENT', i.reason, user().id)
  const movement = invRepo.movementsForProduct(db(), i.product_id, 1)[0]
  emitInventoryChanged({ reason: 'ADJUSTMENT', product_ids: [i.product_id] })
  return movement
})
handle('inventory:movement', (_e: IpcMainInvokeEvent, type: string, input: unknown) => {
  sessionSvc.requirePermission('inventory:adjust')
  const i = input as { product_id: number; qty_base: number; reason?: string }
  const validTypes = ['PURCHASE', 'REFUND', 'RETURN', 'DAMAGE', 'EXPIRATION', 'LOSS', 'ADJUSTMENT']
  if (!validTypes.includes(type)) throw new Error('Invalid movement type.')
  prodRepo.adjustStock(db(), i.product_id, i.qty_base, type, i.reason ?? '', user().id, undefined,
    type === 'PURCHASE' && i.qty_base > 0 ? { source: 'MANUAL RECEIVING', received_quantity: i.qty_base, notes: i.reason ?? null } : undefined)
  const movement = invRepo.movementsForProduct(db(), i.product_id, 1)[0]
  emitInventoryChanged({ reason: type === 'PURCHASE' ? 'PURCHASE' : 'ADJUSTMENT', product_ids: [i.product_id] })
  return movement
})
handle('inventory:count', (_e: IpcMainInvokeEvent, input: unknown) => {
  sessionSvc.requirePermission('inventory:count')
  const i = input as { product_id: number; actual_base: number; notes?: string }
  const p = prodRepo.getProduct(db(), i.product_id)
  const diff = i.actual_base - p.stock
  prodRepo.adjustStock(db(), i.product_id, diff, 'ADJUSTMENT', `Inventory count: expected ${p.stock}, actual ${i.actual_base}`, user().id, i.notes)
  const movement = invRepo.movementsForProduct(db(), i.product_id, 1)[0]
  emitInventoryChanged({ reason: 'ADJUSTMENT', product_ids: [i.product_id] })
  return movement
})
handle('inventory:withdraw', (_e: IpcMainInvokeEvent, input: unknown) => {
  sessionSvc.requirePermission('inventory:adjust')
  const i = input as { product_id: number; quantity: number; unit_name: string; reason: string; notes?: string; batch_id?: number }
  const validReasons = ['TAKEN', 'DAMAGED', 'EXPIRED', 'FORWARD']
  if (!validReasons.includes(i.reason)) throw new Error('Invalid withdrawal reason.')
  if (!Number.isFinite(i.quantity) || i.quantity <= 0) throw new Error('Quantity to withdraw must be greater than zero.')
  const product = prodRepo.getProduct(db(), i.product_id)
  const unit = product.units.find((u) => u.name === i.unit_name)
  if (!unit) throw new Error('Select a valid product unit.')
  const qtyBase = i.quantity * unit.conversion_to_base
  if (!Number.isFinite(qtyBase)) throw new Error('Withdrawal must convert to a valid number.')
  const reason = [`Withdrawal: ${i.reason}`, `${i.quantity} ${unit.name} x ${unit.conversion_to_base} = ${qtyBase} ${product.base_unit}`, i.notes?.trim() || ''].filter(Boolean).join(' | ')
  prodRepo.adjustStock(db(), i.product_id, -qtyBase, 'WITHDRAWAL', reason, user().id, undefined, { batch_id: i.batch_id })
  const movement = invRepo.movementsForProduct(db(), i.product_id, 1)[0]
  emitInventoryChanged({ reason: 'ADJUSTMENT', product_ids: [i.product_id] })
  return movement
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

// ---- Purchases / Purchase Invoices ----
handle('purchases:list', (_e: IpcMainInvokeEvent, opts?: unknown) => purchRepo.listPurchases(db(), (opts ?? {}) as object))
handle('purchases:get', (_e: IpcMainInvokeEvent, id: number) => purchRepo.getPurchase(db(), id))
handle('purchases:create', (_e: IpcMainInvokeEvent, input: unknown) => {
  const u = user()
  const payload = input as Parameters<typeof purchRepo.createPurchase>[1]
  const p = purchRepo.createPurchase(db(), { ...payload, user_id: u.id })
  auditRepo.audit(db(), {
    action: 'PURCHASE_CREATE',
    user_id: u.id,
    entity_type: 'PURCHASE',
    entity_id: p.id,
    new_value: `${p.purchase_no} (Supplier: ${p.supplier_name}, Total: ${p.total_c})`
  })
  emitInventoryChanged({ reason: 'PURCHASE', product_ids: p.items.map((i) => i.product_id) })
  return p
})

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
handle('customers:deleteLedgerEntry', (_e: IpcMainInvokeEvent, entryId: number) => {
  user()
  const res = custRepo.deleteCreditLedgerEntry(db(), entryId)
  auditRepo.audit(db(), {
    action: 'CUSTOMER_UPDATE',
    user_id: user().id,
    entity_type: 'CUSTOMER',
    entity_id: res.customer.id,
    reason: `Deleted credit ledger entry #${entryId}`
  })
  return res
})
handle('customers:recalculateBalance', (_e: IpcMainInvokeEvent, customerId: number) => {
  user()
  const customer = custRepo.recalculateCustomerBalance(db(), customerId)
  auditRepo.audit(db(), {
    action: 'CUSTOMER_UPDATE',
    user_id: user().id,
    entity_type: 'CUSTOMER',
    entity_id: customerId,
    reason: `Recalculated ledger balance: ${customer.balance_c}`
  })
  return customer
})
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
  const isVip = licenseService.getStatus().isVip
  if (!isVip && process.env.NODE_ENV !== 'test' && i.amount_c > 0) {
    const cust = custRepo.getCustomer(db(), i.customer_id)
    if (cust.balance_c === 0) {
      const debtorCount = (db().prepare('SELECT COUNT(*) as c FROM customers WHERE balance_c > 0 AND is_active = 1').get() as { c: number }).c
      if (debtorCount >= 15) {
        throw new Error('Active debtor limit reached (15 debtors max on Free Community Edition). Upgrade to VIP Pro (₱500 Lifetime) for unlimited credit debtors.')
      }
    }
  }
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
handle('pos:checkout', async (_e: IpcMainInvokeEvent, payload: unknown) => {
  const release = beginCriticalOperation('CHECKOUT')
  try {
    user()
    const v = require('../validation/schemas').validateCheckout(payload)
    const completed = checkoutSvc.checkout(v)
    emitInventoryChanged({ reason: 'SALE', product_ids: completed.sale.items.flatMap((item) => item.product_id ? [item.product_id] : []) })
    emitTransactionsChanged({ reason: 'SALE', sale_id: completed.sale.id })
    const settings = settingRepo.getSettings(db())
    return { ...completed, print: await printingSvc.autoPrintAfterCheckout(settings, completed.sale) }
  } finally {
    release()
  }
})
handle('pos:hold', (_e: IpcMainInvokeEvent, payload: unknown) => {
  const release = beginCriticalOperation('HOLD_SALE')
  try {
    user()
    const v = require('../validation/schemas').validateCheckout(payload)
    return checkoutSvc.holdSale(v)
  } finally {
    release()
  }
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

// ---- Printer ----
handle('printer:list', async (event: IpcMainInvokeEvent) => {
  sessionSvc.requirePermission('settings:manage')
  const printers = await printingSvc.listPrinters(event.sender)
  // Report the exact system device name (never normalized) and mark the real
  // Windows default so Settings can suggest it on first setup.
  return printers.map((printer) => ({ name: printer.name, displayName: printer.displayName || printer.name, isDefault: (printer as { isDefault?: boolean }).isDefault === true }))
})
handle('printer:save', (_e: IpcMainInvokeEvent, input: { name: string; autoPrint: boolean; paperWidth: '58mm' | '80mm'; copies: number; manualPrintDialog?: boolean }) => {
  sessionSvc.requirePermission('settings:manage')
  if (!['58mm', '80mm'].includes(input.paperWidth)) throw new Error('Invalid receipt paper width.')
  const copies = Math.min(3, Math.max(1, Math.trunc(input.copies)))
  return settingRepo.updateSettings(db(), {
    receipt_printer: input.name,
    auto_print_after_sale: input.autoPrint,
    receipt_paper_width: input.paperWidth,
    receipt_copies: copies,
    manual_print_dialog: input.manualPrintDialog ?? false
  })
})
handle('printer:testPrint', async (_e: IpcMainInvokeEvent, options?: { manual?: boolean }) => {
  sessionSvc.requirePermission('settings:manage')
  return printingSvc.printTest(settingRepo.getSettings(db()), options)
})
handle('printer:printReceipt', async (_e: IpcMainInvokeEvent, saleId: number, options?: { manual?: boolean }) => {
  sessionSvc.requirePermission('transactions:view')
  return printingSvc.printSale(settingRepo.getSettings(db()), getSale(db(), saleId), options)
})
handle('printer:printLines', async (_e: IpcMainInvokeEvent, lines: string[], options?: { manual?: boolean }) => {
  sessionSvc.requirePermission('transactions:view')
  return printingSvc.printLines(settingRepo.getSettings(db()), lines, options)
})
handle('printer:kickCashDrawer', async (_e: IpcMainInvokeEvent, deviceName?: string) => {
  sessionSvc.requirePermission('pos:checkout')
  return printingSvc.kickCashDrawer(settingRepo.getSettings(db()), { deviceName })
})
handle('printer:printDocument', async (_e: IpcMainInvokeEvent, html: string, options?: { manual?: boolean; title?: string; pageSize?: 'A4' | 'Letter'; deviceName?: string; widthMm?: number; heightMm?: number }) => {
  return printingSvc.printDocument(html, options)
})
handle('printer:testPrintLabel', async (_e: IpcMainInvokeEvent, options?: { manual?: boolean; deviceName?: string }) => {
  sessionSvc.requirePermission('settings:manage')
  return printingSvc.printLabelTest(settingRepo.getSettings(db()), options)
})
handle('printer:saveLabel', (_e: IpcMainInvokeEvent, input: { name: string; paperSize?: string }) => {
  sessionSvc.requirePermission('settings:manage')
  return settingRepo.updateSettings(db(), {
    label_printer: input.name,
    label_paper_size: input.paperSize || '40x30'
  })
})
handle('printer:installDriver', async () => {
  return printingSvc.installLabelDriver()
})
handle('printer:openDriverTutorial', async () => {
  return printingSvc.openDriverTutorial()
})

// ---- Transactions ----
handle('transactions:list', (_e: IpcMainInvokeEvent, opts: unknown) => listSales(db(), (opts ?? {}) as object))
handle('transactions:get', (_e: IpcMainInvokeEvent, id: number) => getSale(db(), id))
handle('transactions:refund', (_e: IpcMainInvokeEvent, payload: unknown) => {
  const release = beginCriticalOperation('REFUND')
  try {
    const result = txSvc.processRefund(payload as Parameters<typeof txSvc.processRefund>[0])
    emitInventoryChanged({ reason: 'REFUND', product_ids: [...new Set(result.items.map((item) => item.product_id))] })
    emitTransactionsChanged({ reason: 'REFUND', sale_id: result.sale_id })
    return result
  } finally {
    release()
  }
})
handle('transactions:void', (_e: IpcMainInvokeEvent, payload: unknown) => {
  const release = beginCriticalOperation('VOID')
  try {
    const result = txSvc.processVoid(payload as Parameters<typeof txSvc.processVoid>[0])
    emitInventoryChanged({ reason: 'VOID', product_ids: result.items.flatMap((item) => item.product_id ? [item.product_id] : []) })
    emitTransactionsChanged({ reason: 'VOID', sale_id: result.id })
    return result
  } finally {
    release()
  }
})
handle('transactions:delete', (_e: IpcMainInvokeEvent, saleId: number, options?: { restoreStock?: boolean }) => {
  const release = beginCriticalOperation('DELETE_TRANSACTION')
  try {
    const result = txSvc.deleteTransaction(saleId, options)
    emitInventoryChanged({ reason: 'ADJUSTMENT', product_ids: result.product_ids })
    emitTransactionsChanged({ reason: 'DELETE', sale_id: saleId })
    return result
  } finally {
    release()
  }
})
handle('transactions:updateItemPrice', (_e: IpcMainInvokeEvent, saleItemId: number, newUnitPriceC: number) => {
  user()
  sessionSvc.requirePermission('transactions:view')
  const res = updateSaleItemPrice(db(), saleItemId, newUnitPriceC)
  emitTransactionsChanged({ reason: 'UPDATE', sale_id: res.saleId })
  return res
})


// ---- Expenses ----
handle('expenses:categories', () => { user(); return expRepo.listExpenseCategories(db()) })
handle('expenses:createCategory', (_e: IpcMainInvokeEvent, name: string) => { user(); return expRepo.createExpenseCategory(db(), name) })
handle('expenses:list', (_e: IpcMainInvokeEvent, opts: unknown) => expRepo.listExpenses(db(), (opts ?? {}) as object))
handle('expenses:create', (_e: IpcMainInvokeEvent, input: unknown) => {
  const u = user()
  const activeShift = shiftRepo.currentShiftFor(db(), u.id)
  if (!activeShift) {
    sessionSvc.requirePermission('expenses:manage')
  }
  const exp = expRepo.createExpense(db(), input as Parameters<typeof expRepo.createExpense>[1], u.id)
  if (activeShift) {
    shiftRepo.updateShiftTotals(db(), activeShift.id)
  }
  return exp
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
  const isVip = licenseService.getStatus().isVip
  const o = { ...((opts ?? {}) as { from: string; to: string; groupBy?: 'DAILY' | 'WEEKLY' | 'MONTHLY' }) }
  if (!isVip && process.env.NODE_ENV !== 'test') {
    const sevenDaysAgo = new Date(Date.now() - 7 * 86400 * 1000).toISOString().slice(0, 10)
    if (o.from && o.from < sevenDaysAgo) {
      o.from = sevenDaysAgo
    }
  }
  return reportSvc.salesReport(o)
})
handle('reports:itemSales', (_e: IpcMainInvokeEvent, opts: unknown) => {
  sessionSvc.requirePermission('reports:view')
  const isVip = licenseService.getStatus().isVip
  const o = { ...((opts ?? {}) as { from?: string; to?: string; category_id?: number; search?: string }) }
  if (!isVip && process.env.NODE_ENV !== 'test') {
    const sevenDaysAgo = new Date(Date.now() - 7 * 86400 * 1000).toISOString().slice(0, 10)
    if (o.from && o.from < sevenDaysAgo) {
      o.from = sevenDaysAgo
    }
  }
  return reportSvc.itemSalesReport(o)
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
  const dbh = db()
  const saleIds = result.map((s) => s.id)
  const placeholders = saleIds.map(() => '?').join(',')
  const refundedCost = saleIds.length
    ? (dbh.prepare(`SELECT COALESCE(SUM(si.cost_base_c * ri.qty_base),0) AS c FROM refund_items ri JOIN sale_items si ON si.id = ri.sale_item_id WHERE si.sale_id IN (${placeholders})`).get(...saleIds) as { c: number }).c
    : 0
  const refundsTotal = saleIds.length
    ? (dbh.prepare(`SELECT COALESCE(SUM(total_c),0) AS c FROM refunds WHERE sale_id IN (${placeholders})`).get(...saleIds) as { c: number }).c
    : 0
  const cost = result.reduce((s, x) => s + x.items.reduce((a, i) => a + i.cost_base_c * i.qty_base, 0), 0)
  const summary = {
    sales_total_c: result.reduce((s, x) => s + x.total_c, 0),
    profit_c: Math.round((result.reduce((s, x) => s + x.total_c, 0) - refundsTotal) - (cost - refundedCost)),
    items_sold: result.reduce((s, x) => s + x.items.reduce((a, i) => a + i.qty, 0), 0),
    transactions: result.length,
    cost_c: Math.round(cost),
    discount_c: result.reduce((s, x) => s + x.discount_c, 0),
    refunds_c: refundsTotal,
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
  const isVip = licenseService.getStatus().isVip
  if (!isVip && process.env.NODE_ENV !== 'test') {
    throw new Error('CSV Tax Export is a VIP Pro feature. Upgrade to VIP Pro (₱500 Lifetime) to export lifetime reports and tax records.')
  }
  return exportSvc.exportCsv(kind as Parameters<typeof exportSvc.exportCsv>[0], (opts ?? {}) as { from?: string; to?: string })
})
handle('reports:xRead', () => {
  sessionSvc.requirePermission('reports:view')
  const shift = shiftRepo.currentShiftFor(db(), user().id)
  if (!shift) throw new Error('No open shift for X-Read.')
  return readSvc.calculateRead(db(), shift.id, 'X')
})
handle('reports:cashCountExpected', () => { sessionSvc.requirePermission('reports:view'); const s=shiftRepo.currentShiftFor(db(),user().id); if(!s) throw new Error('No open shift.'); return cashCountRepo.getExpected(db(),s.id) })
handle('reports:cashCount', (_e: IpcMainInvokeEvent, input: cashCountRepo.CashCountInput) => { const u=user(); sessionSvc.requirePermission('reports:view'); return cashCountRepo.save(db(),u.id,input) })
handle('reports:cashCounts', (_e: IpcMainInvokeEvent, opts?: unknown) => { sessionSvc.requirePermission('reports:view'); const u=user(); const o=(opts??{}) as {business_date?:string;user_id?:number;status?:string}; if(!u.roles.some(r=>r==='ADMIN'||r==='MANAGER')) o.user_id=u.id; return cashCountRepo.list(db(),o) })
handle('reports:cashCountPrint', async (_e: IpcMainInvokeEvent, id: number) => {
  sessionSvc.requirePermission('reports:view')
  const record = cashCountRepo.get(db(), id)
  const settings = settingRepo.getSettings(db())
  // Printing is read-only: it only formats the authoritative saved Cash Count.
  // A printer failure must never alter expected/actual/difference/status.
  return printingSvc.printLines(settings, cashCountLines({ ...record, store_name: settings.store_name }))
})
handle('reports:printXRead', async () => {
  sessionSvc.requirePermission('reports:view')
  const shift = shiftRepo.currentShiftFor(db(), user().id)
  if (!shift) throw new Error('No open shift for X-Read.')
  const settings = settingRepo.getSettings(db())
  const report = readSvc.calculateRead(db(), shift.id, 'X')
  const result = await printingSvc.printLines(settings, readSvc.readReportLines(report, undefined, undefined, settings.store_name))
  return { ...result, report }
})
handle('reports:finalizeZ', (_e: IpcMainInvokeEvent, input: { actual_cash_c: number; note?: string }) => {
  const u = user()
  if (!u.roles.some((role) => role === 'ADMIN' || role === 'MANAGER')) throw new Error('Only an Admin or Manager can finalize a Z-Read.')
  const shift = shiftRepo.currentShiftFor(db(), u.id)
  if (!shift) throw new Error('No open shift to finalize.')
  const z = readSvc.finalizeZ(db(), shift.id, u.id, input.actual_cash_c, input.note)
  auditRepo.audit(db(), { action: 'Z_READ_FINALIZE', user_id: u.id, entity_type: 'SHIFT', entity_id: shift.id, new_value: z.report_no })
  return z
})
handle('reports:zHistory', () => { sessionSvc.requirePermission('reports:view'); return readSvc.listZ(db()) })
handle('reports:printZRead', async (_e: IpcMainInvokeEvent, id: number) => {
  sessionSvc.requirePermission('reports:view'); const z = readSvc.getZ(db(), id)
  const settings = settingRepo.getSettings(db())
  const shift = shiftRepo.getShift(db(), z.shift_id)
  const closing = shift.actual_cash_c == null ? undefined : { actual_cash_c: shift.actual_cash_c, finalized_at: z.finalized_at }
  return printingSvc.printLines(settings, readSvc.readReportLines(z.snapshot, z.report_no, closing, settings.store_name))
})

// ---- Backup ----
handle('backup:list', () => backupRepo.listBackups(db()))
handle('backup:create', async (_e: IpcMainInvokeEvent, reason?: string) => {
  const release = beginCriticalOperation('BACKUP')
  try {
    sessionSvc.requirePermission('backup:manage')
    const info = await backupRepo.createBackup(db(), 'MANUAL')
    auditRepo.audit(db(), { action: 'BACKUP', user_id: user().id, reason: reason ?? 'Manual backup' })
    return info
  } finally {
    release()
  }
})
handle('backup:restore', (_e: IpcMainInvokeEvent, filename: string) => {
  const release = beginCriticalOperation('RESTORE')
  try {
    sessionSvc.requirePermission('backup:manage')
    backupRepo.restoreBackup(db(), filename)
    dataManagementSvc.relaunchAfterDataChange()
  } finally {
    release()
  }
})
handle('backup:exportTinda', async () => {
  const release = beginCriticalOperation('EXPORT_UNIVERSAL')
  try {
    sessionSvc.requirePermission('backup:manage')
    const stamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)
    const result = await dialog.showSaveDialog({
      title: 'Export Universal Backup (.tinda-backup)',
      defaultPath: `tinda-pos-backup-${stamp}.tinda-backup`,
      filters: [{ name: 'TINDA POS Universal Backup', extensions: ['tinda-backup'] }]
    })
    if (result.canceled || !result.filePath) return null
    const text = await exportWindowsBackup(db(), app.getVersion() ?? '1.0.0')
    await fs.writeFile(result.filePath, text, 'utf8')
    auditRepo.audit(db(), { action: 'EXPORT_UNIVERSAL_BACKUP', user_id: user().id, reason: 'Universal .tinda-backup' })
    return result.filePath
  } finally {
    release()
  }
})
handle('backup:importTinda', async () => {
  const release = beginCriticalOperation('RESTORE_UNIVERSAL')
  try {
    sessionSvc.requirePermission('backup:manage')
    const result = await dialog.showOpenDialog({
      title: 'Import Universal Backup (.tinda-backup)',
      filters: [{ name: 'TINDA POS Universal Backup', extensions: ['tinda-backup'] }],
      properties: ['openFile']
    })
    if (result.canceled || !result.filePaths[0]) return null
    const text = await fs.readFile(result.filePaths[0], 'utf8')
    const { counts } = await importWindowsBackup(db(), text)
    const total = Object.values(counts).reduce((a, b) => a + b, 0)
    auditRepo.audit(db(), { action: 'IMPORT_UNIVERSAL_BACKUP', user_id: user().id, reason: `${total} rows from ${result.filePaths[0]}` })
    dataManagementSvc.relaunchAfterDataChange()
    return result.filePaths[0]
  } finally {
    release()
  }
})
handle('backup:openFolder', () => {
  shell.openPath(backupRepo.backupDir())
})
handle('backup:dir', () => backupRepo.backupDir())
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
handle('backup:resetDatabase', (_e: IpcMainInvokeEvent, confirmation: string) => {
  const release = beginCriticalOperation('RESET_DATABASE')
  try {
    dataManagementSvc.resetActiveDatabase(confirmation)
    dataManagementSvc.relaunchAfterDataChange()
  } finally {
    release()
  }
})
handle('backup:startNewStore', (_e: IpcMainInvokeEvent, confirmation: string) => {
  const release = beginCriticalOperation('START_NEW_STORE')
  try {
    dataManagementSvc.startNewStore(confirmation)
    dataManagementSvc.relaunchAfterDataChange()
  } finally {
    release()
  }
})
handle('backup:locationStatus', () => {
  sessionSvc.requirePermission('settings:manage')
  return dataManagementSvc.getDataLocationStatus()
})
handle('backup:usePortableData', (_e: IpcMainInvokeEvent, choice: 'FRESH' | 'COPY') => {
  const release = beginCriticalOperation('PORTABLE_SWITCH')
  try {
    dataManagementSvc.usePortableData(choice)
    dataManagementSvc.relaunchAfterDataChange()
  } finally {
    release()
  }
})
handle('backup:useSharedAppData', () => {
  const release = beginCriticalOperation('PORTABLE_SWITCH')
  try {
    dataManagementSvc.useSharedAppData()
    dataManagementSvc.relaunchAfterDataChange()
  } finally {
    release()
  }
})

// ---- Updates ----
handle('update:state', () => getUpdateService().getState())
handle('update:check', (_e, manual: boolean) => getUpdateService().check({ manual: manual === true }))
handle('update:download', (_e, type?: 'PATCH' | 'FULL') => getUpdateService().download(type))
handle('update:install', () => getUpdateService().install())
handle('update:dismiss', () => getUpdateService().dismiss())

// ---- Rollback & Version Recovery (VIP Pro Protected) ----
handle('rollback:getTargets', () => {
  sessionSvc.requirePermission('settings:manage')
  const status = licenseService.getStatus()
  if (!status.isVip && process.env.NODE_ENV !== 'test') {
    throw new Error('VIP Pro license required. Version rollback and downgrade recovery is protected and strictly restricted to verified VIP Pro merchants.')
  }
  return rollbackService.getRollbackTargets()
})
handle('rollback:execute', async (_e: IpcMainInvokeEvent, version: string) => {
  sessionSvc.requirePermission('settings:manage')
  const status = licenseService.getStatus()
  if (!status.isVip && process.env.NODE_ENV !== 'test') {
    throw new Error('VIP Pro license required. Version rollback and downgrade recovery is protected and strictly restricted to verified VIP Pro merchants.')
  }
  return await rollbackService.executeRollback(version, (downloaded, total) => {
    try {
      _e.sender.send('rollback:progress', {
        downloaded,
        total,
        percent: total > 0 ? Math.round((downloaded / total) * 100) : 0
      })
    } catch {}
  })
})

// ---- Audit ----
handle('audit:list', (_e: IpcMainInvokeEvent, opts?: unknown) => {
  sessionSvc.requirePermission('audit:view')
  return auditRepo.listAudit(db(), (opts ?? {}) as object)
})

// ---- Price References ----
handle('priceReferences:search', (_e: IpcMainInvokeEvent, opts?: priceRefRepo.SearchPriceReferencesOptions) => {
  user()
  return priceRefRepo.searchPriceReferences(db(), opts)
})
handle('priceReferences:get', (_e: IpcMainInvokeEvent, id: number) => {
  user()
  return priceRefRepo.getPriceReference(db(), id)
})
handle('priceReferences:getByProduct', (_e: IpcMainInvokeEvent, productId: number) => {
  user()
  return priceRefRepo.getPriceReferenceByProductId(db(), productId)
})
handle('priceReferences:getByBarcode', (_e: IpcMainInvokeEvent, barcode: string) => {
  user()
  return priceRefRepo.getPriceReferenceByBarcode(db(), barcode)
})
handle('priceReferences:matchForProduct', (_e: IpcMainInvokeEvent, product: { id: number; name: string; barcode?: string | null }) => {
  user()
  return priceRefRepo.matchReferenceForProduct(db(), product)
})
handle('priceReferences:link', (_e: IpcMainInvokeEvent, referenceId: number, productId: number) => {
  sessionSvc.requirePermission('products:manage')
  return priceRefRepo.linkProduct(db(), referenceId, productId)
})
handle('priceReferences:unlink', (_e: IpcMainInvokeEvent, referenceId: number) => {
  sessionSvc.requirePermission('products:manage')
  return priceRefRepo.unlinkProduct(db(), referenceId)
})
handle('priceReferences:sync', (_e: IpcMainInvokeEvent, opts?: priceRefSvc.SyncPriceReferencesOptions) => {
  sessionSvc.requirePermission('products:manage')
  return priceRefSvc.syncPriceReferences(db(), opts)
})
handle('priceReferences:status', () => {
  user()
  return priceRefSvc.getPriceReferenceStatus(db())
})
handle('priceReferences:compare', (_e: IpcMainInvokeEvent, retailPriceC: number, reference: import('@shared/types').PriceReference | null) => {
  user()
  return priceRefRepo.comparePrice(retailPriceC, reference)
})

handle('phoneScanner:getStatus', () => {
  const { getPhoneScannerStatus } = require('../services/phoneScannerService')
  return getPhoneScannerStatus()
})

handle('phoneScanner:restart', () => {
  const { startPhoneScannerService } = require('../services/phoneScannerService')
  return startPhoneScannerService()
})

handle('phoneScanner:getCfdState', () => {
  const { getCfdState } = require('../services/phoneScannerService')
  return getCfdState()
})

handle('phoneScanner:updateCfd', (_e: IpcMainInvokeEvent, partial: Record<string, unknown>) => {
  const { updateCfdState } = require('../services/phoneScannerService')
  return updateCfdState(partial)
})

handle('phoneScanner:getCfdUrl', () => {
  const { getCfdUrl, getCfdHttpsUrl } = require('../services/phoneScannerService')
  return { url: getCfdUrl(), httpsUrl: getCfdHttpsUrl() }
})

// ---- LAN Hub & VPS Sync ----
handle('lan:getStatus', () => lanHubSvc.getLanStatus())
handle('lan:setMode', (_e: IpcMainInvokeEvent, mode: import('@shared/types').LanRole, config?: { masterIp?: string; masterPort?: number; pin?: string }) => {
  sessionSvc.requirePermission('settings:manage')
  const isVip = licenseService.getStatus().isVip
  if (mode !== 'standalone' && !isVip && process.env.NODE_ENV !== 'test') {
    throw new Error('Multi-PC LAN Hub is an exclusive VIP Pro feature. Upgrade to VIP Pro (₱500 Lifetime) to connect multiple cashiers on one database.')
  }
  return lanHubSvc.setLanMode(mode, config)
})
handle('lan:generatePin', () => {
  sessionSvc.requirePermission('settings:manage')
  return lanHubSvc.generatePin()
})
handle('lan:pair', (_e: IpcMainInvokeEvent, masterIp: string, pin: string, deviceName?: string) => {
  sessionSvc.requirePermission('settings:manage')
  return lanHubSvc.pairWithMaster(masterIp, pin, deviceName)
})
handle('lan:testVps', (_e: IpcMainInvokeEvent, url: string, token: string) => {
  sessionSvc.requirePermission('settings:manage')
  return lanHubSvc.testVpsConnection(url, token)
})
handle('lan:triggerVpsSync', () => {
  sessionSvc.requirePermission('settings:manage')
  return lanHubSvc.triggerVpsSync()
})

// ---- Machine-Locked VIP Licensing ----
handle('license:getStatus', () => licenseService.getStatus())
handle('license:activate', (_e: IpcMainInvokeEvent, key: string, customerName?: string) => {
  sessionSvc.requirePermission('settings:manage')
  return licenseService.activate(key, customerName)
})
handle('license:deactivate', () => {
  sessionSvc.requirePermission('settings:manage')
  return licenseService.deactivate()
})
handle('license:copyMachineId', () => licenseService.getMachineId())

// ---- VIP Pro Cloud Dashboard Sync ----
handle('cloud:status', () => {
  const isVip = licenseService.getStatus().isVip
  const { ensureSyncCredentials } = require('../services/cloudSync')
  const settings = ensureSyncCredentials(db())
  return {
    isVip,
    settings
  }
})
handle('cloud:syncNow', async () => {
  sessionSvc.requirePermission('settings:manage')
  const { syncNow } = require('../services/cloudSync')
  return await syncNow(db())
})
handle('cloud:updateSettings', (_e: IpcMainInvokeEvent, patch: Record<string, unknown>) => {
  sessionSvc.requirePermission('settings:manage')
  return settingRepo.updateSettings(db(), patch as any)
})

// ---- VIP Pro Community Lounge & Live Announcements ----
handle('community:getAnnouncements', async () => {
  const { getLiveAnnouncements } = require('../services/communityChat')
  return await getLiveAnnouncements(db())
})
handle('community:getMessages', async (_e: IpcMainInvokeEvent, limit?: number) => {
  const { getCommunityMessages } = require('../services/communityChat')
  return await getCommunityMessages(db(), limit)
})
handle('community:sendMessage', async (_e: IpcMainInvokeEvent, text: string, devKey?: string, imageUrl?: string | null) => {
  const { sendCommunityMessage } = require('../services/communityChat')
  return await sendCommunityMessage(db(), text, devKey, imageUrl)
})
handle('community:recordSeen', async (_e: IpcMainInvokeEvent, messageId: string, userName?: string) => {
  const { recordMessageSeen } = require('../services/communityChat')
  return await recordMessageSeen(db(), messageId, userName)
})
handle('community:deleteMessage', async (_e: IpcMainInvokeEvent, messageId: string, devKey?: string) => {
  const { deleteCommunityMessage } = require('../services/communityChat')
  return await deleteCommunityMessage(db(), messageId, devKey)
})
handle('community:postAnnouncement', async (_e: IpcMainInvokeEvent, title: string, message: string, devKey: string) => {
  sessionSvc.requirePermission('settings:manage')
  const { postLiveAnnouncement } = require('../services/communityChat')
  return await postLiveAnnouncement(db(), title, message, devKey)
})

// ---- VIP E-Wallet & Cash Audit Hub ----
handle('ewallet:createTransaction', (_e: IpcMainInvokeEvent, input: unknown) => {
  const isVip = licenseService.getStatus().isVip
  if (!isVip && process.env.NODE_ENV !== 'test') {
    throw new Error('VIP_LOCKED: E-Wallet Cash-In/Out is a VIP Pro feature. Upgrade to VIP Pro (₱500 Lifetime) to unlock.')
  }
  const ewalletRepo = require('../repositories/ewallet')
  const u = user()
  return ewalletRepo.recordEwalletTransaction(db(), u.id, input)
})
handle('ewallet:deleteTransaction', (_e: IpcMainInvokeEvent, id: number) => {
  const isVip = licenseService.getStatus().isVip
  if (!isVip && process.env.NODE_ENV !== 'test') {
    throw new Error('VIP_LOCKED: E-Wallet Cash-In/Out is a VIP Pro feature.')
  }
  const ewalletRepo = require('../repositories/ewallet')
  return ewalletRepo.deleteEwalletTransaction(db(), id)
})
handle('ewallet:listTransactions', (_e: IpcMainInvokeEvent, opts?: unknown) => {
  const isVip = licenseService.getStatus().isVip
  if (!isVip && process.env.NODE_ENV !== 'test') {
    return []
  }
  const ewalletRepo = require('../repositories/ewallet')
  return ewalletRepo.listEwalletTransactions(db(), (opts ?? {}) as object)
})
handle('ewallet:getShiftSummary', (_e: IpcMainInvokeEvent, shiftId?: number | null) => {
  const isVip = licenseService.getStatus().isVip
  if (!isVip && process.env.NODE_ENV !== 'test') {
    throw new Error('VIP_LOCKED: E-Wallet Audit is a VIP Pro feature.')
  }
  const ewalletRepo = require('../repositories/ewallet')
  let targetShiftId = shiftId
  if (targetShiftId === undefined) {
    const s = shiftRepo.currentShiftFor(db(), user().id)
    targetShiftId = s?.id ?? null
  }
  return ewalletRepo.getEwalletShiftSummary(db(), targetShiftId)
})
handle('ewallet:saveAudit', (_e: IpcMainInvokeEvent, input: unknown) => {
  const isVip = licenseService.getStatus().isVip
  if (!isVip && process.env.NODE_ENV !== 'test') {
    throw new Error('VIP_LOCKED: E-Wallet Audit is a VIP Pro feature.')
  }
  const ewalletRepo = require('../repositories/ewallet')
  const u = user()
  return ewalletRepo.saveEwalletAudit(db(), u.id, input)
})
handle('ewallet:listAudits', (_e: IpcMainInvokeEvent, opts?: unknown) => {
  const isVip = licenseService.getStatus().isVip
  if (!isVip && process.env.NODE_ENV !== 'test') {
    return []
  }
  const ewalletRepo = require('../repositories/ewallet')
  return ewalletRepo.listEwalletAudits(db(), (opts ?? {}) as object)
})
handle('ewallet:deleteAudit', (_e: IpcMainInvokeEvent, id: number) => {
  const isVip = licenseService.getStatus().isVip
  if (!isVip && process.env.NODE_ENV !== 'test') {
    throw new Error('VIP Pro feature: E-Wallet Audit is locked.')
  }
  const ewalletRepo = require('../repositories/ewallet')
  return ewalletRepo.deleteEwalletAudit(db(), Number(id))
})
handle('ewallet:clearAudits', (_e: IpcMainInvokeEvent) => {
  const isVip = licenseService.getStatus().isVip
  if (!isVip && process.env.NODE_ENV !== 'test') {
    throw new Error('VIP Pro feature: E-Wallet Audit is locked.')
  }
  const ewalletRepo = require('../repositories/ewallet')
  return ewalletRepo.clearAllEwalletAudits(db())
})
handle('ewallet:printSlip', async (_e: IpcMainInvokeEvent, id: number, options?: { manual?: boolean }) => {
  const isVip = licenseService.getStatus().isVip
  if (!isVip && process.env.NODE_ENV !== 'test') {
    throw new Error('VIP_LOCKED: E-Wallet slip printing is a VIP Pro feature.')
  }
  const ewalletRepo = require('../repositories/ewallet')
  const tx = ewalletRepo.getEwalletTransaction(db(), id)
  const settings = settingRepo.getSettings(db())
  const { formatEwalletSlipLines } = require('../../shared/receiptHtml')
  return await printingSvc.printLines(settings, formatEwalletSlipLines(tx, settings.store_name), options)
})
handle('ewallet:printAuditReport', async (_e: IpcMainInvokeEvent, id: number, options?: { manual?: boolean }) => {
  const isVip = licenseService.getStatus().isVip
  if (!isVip && process.env.NODE_ENV !== 'test') {
    throw new Error('VIP_LOCKED: E-Wallet audit report printing is a VIP Pro feature.')
  }
  const ewalletRepo = require('../repositories/ewallet')
  const audit = ewalletRepo.getEwalletAudit(db(), id)
  const settings = settingRepo.getSettings(db())
  const { formatEwalletAuditLines } = require('../../shared/receiptHtml')
  return await printingSvc.printLines(settings, formatEwalletAuditLines(audit, settings.store_name), options)
})
handle('ewallet:printBillSlip', async (_e: IpcMainInvokeEvent, payload: import('../../shared/receiptHtml').BillSlipPayload, options?: { manual?: boolean }) => {
  const isVip = licenseService.getStatus().isVip
  if (!isVip && process.env.NODE_ENV !== 'test') {
    throw new Error('VIP_LOCKED: Bills receipt printing is a VIP Pro feature.')
  }
  const settings = settingRepo.getSettings(db())
  const { formatBillSlipLines } = require('../../shared/receiptHtml')
  return await printingSvc.printLines(settings, formatBillSlipLines(payload, settings.store_name), options)
})

handle('ai:ask', async (_e: IpcMainInvokeEvent, question: string) => {
  const { askMainAiService } = require('../services/aiService')
  return await askMainAiService(question)
})

export function registerIpcHandlers(): void {
  void router // router populated by handle() calls at module load
}

// silence unused import for PaymentInput
void (null as unknown as PaymentInput)
