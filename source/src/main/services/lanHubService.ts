// File: src/main/services/lanHubService.ts
import http from 'node:http'
import crypto from 'node:crypto'
import os from 'node:os'
import dgram from 'node:dgram'
import { BrowserWindow, powerSaveBlocker } from 'electron'
import type { LanRole, LanStatus, LanDevice, StoreSettings, InventoryChangedEvent, DiscoveredMaster } from '@shared/types'
import { getSettings, updateSettings } from '../repositories/settings'
import { getDb } from '../database/connection'

let lanServer: http.Server | null = null
let currentPort = 3111
let activePairingPin = ''
let pairingPinExpiry = 0
let serverSecret = crypto.randomBytes(32).toString('hex')
const pairedClients = new Map<string, LanDevice & { token: string }>()
const sseConnections = new Set<http.ServerResponse>()

// PowerSave blocker handle to prevent Windows Sleep during business hours
let powerBlockerId: number | null = null

// UDP Auto-Discovery Beacon state
const UDP_BEACON_PORT = 3112
let udpBeaconInterval: NodeJS.Timeout | null = null
let udpBeaconSocket: dgram.Socket | null = null

// Satellite client state
let satelliteToken = ''
let satelliteMasterIp = ''
let satelliteMasterPort = 3111
let satelliteConnected = false
let satelliteIsVip = false
let sseClientReq: http.ClientRequest | null = null

// VPS Sync state
let lastVpsSyncAt: string | null = null
let vpsSyncStatus: 'idle' | 'syncing' | 'error' | 'ok' = 'idle'
let lastVpsError: string | undefined

import { getLocalIpAddress } from './phoneScannerService'

export function getLocalIp(): string {
  return getLocalIpAddress()
}

export function isSatelliteVip(): boolean {
  return satelliteConnected && satelliteIsVip
}

export function setSatelliteVip(val: boolean): void {
  satelliteIsVip = val
}

export function startUdpBeacon(port: number): void {
  stopUdpBeacon()
  try {
    const socket = dgram.createSocket({ type: 'udp4', reuseAddr: true })
    socket.bind(() => {
      try {
        socket.setBroadcast(true)
      } catch (err) {
        console.warn('[UDP Beacon] setBroadcast error:', err)
      }
    })

    udpBeaconSocket = socket

    const broadcast = (): void => {
      try {
        let storeName = 'TINDA Store'
        try { storeName = getSettings(getDb()).store_name || storeName } catch {}
        const payload = Buffer.from(
          JSON.stringify({
            cmd: 'TINDA_BEACON',
            storeName,
            ip: getLocalIp(),
            port,
            version: '2.2.2'
          })
        )
        socket.send(payload, 0, payload.length, UDP_BEACON_PORT, '255.255.255.255')
      } catch {
        // Non-fatal if broadcast temporarily fails
      }
    }

    broadcast()
    udpBeaconInterval = setInterval(broadcast, 3000)
  } catch (err) {
    console.warn('[UDP Beacon] Failed to start UDP beacon:', err)
  }
}

export function stopUdpBeacon(): void {
  if (udpBeaconInterval) {
    clearInterval(udpBeaconInterval)
    udpBeaconInterval = null
  }
  if (udpBeaconSocket) {
    try { udpBeaconSocket.close() } catch {}
    udpBeaconSocket = null
  }
}

export async function discoverMasters(timeoutMs = 2000): Promise<DiscoveredMaster[]> {
  return new Promise((resolve) => {
    const discovered = new Map<string, DiscoveredMaster>()
    let socket: dgram.Socket | null = null

    try {
      socket = dgram.createSocket({ type: 'udp4', reuseAddr: true })
      socket.on('message', (msg, rinfo) => {
        try {
          const parsed = JSON.parse(msg.toString())
          if (parsed && parsed.cmd === 'TINDA_BEACON') {
            const ip = parsed.ip || rinfo.address
            const port = parsed.port || 3111
            const key = `${ip}:${port}`
            discovered.set(key, {
              ip,
              port,
              storeName: parsed.storeName || 'TINDA Store',
              version: parsed.version || '2.2.2'
            })
          }
        } catch {}
      })

      socket.on('error', () => {
        // Suppress transient port collisions
      })

      socket.bind(UDP_BEACON_PORT, '0.0.0.0', () => {
        try {
          socket?.setBroadcast(true)
          const probe = Buffer.from(JSON.stringify({ cmd: 'TINDA_PROBE' }))
          socket?.send(probe, 0, probe.length, UDP_BEACON_PORT, '255.255.255.255')
        } catch {}
      })
    } catch {
      // Fallback
    }

    setTimeout(() => {
      try { socket?.close() } catch {}
      resolve(Array.from(discovered.values()))
    }, timeoutMs)
  })
}

export function generatePin(): string {
  // Generate high-entropy 6-digit numerical PIN
  const pin = Math.floor(100000 + Math.random() * 900000).toString()
  activePairingPin = pin
  pairingPinExpiry = Date.now() + 15 * 60 * 1000 // Valid for 15 minutes
  notifyStatus()
  return pin
}

export function getLanStatus(): LanStatus {
  let role: LanRole = 'standalone'
  let vpsEnabled = false
  let vpsUrl = ''
  try {
    const settings = getSettings(getDb())
    role = settings.lan_network_mode || 'standalone'
    vpsEnabled = !!settings.vps_sync_enabled
    vpsUrl = settings.vps_server_url || ''
    if (settings.lan_master_ip) satelliteMasterIp = settings.lan_master_ip
    if (settings.lan_master_port) satelliteMasterPort = settings.lan_master_port
  } catch {
    // Non-fatal if DB not yet initialized
  }

  const clients: LanDevice[] = Array.from(pairedClients.values()).map((c) => ({
    id: c.id,
    name: c.name,
    ip: c.ip,
    connectedAt: c.connectedAt,
    lastSeen: c.lastSeen
  }))

  return {
    role,
    running: lanServer !== null,
    ip: getLocalIp(),
    port: currentPort,
    pairingPin: activePairingPin,
    connectedClients: sseConnections.size,
    clientDevices: clients,
    masterUrl: satelliteMasterIp ? `http://${satelliteMasterIp}:${satelliteMasterPort}` : '',
    satelliteConnected: role === 'satellite' ? satelliteConnected : false,
    vpsStatus: {
      enabled: vpsEnabled,
      url: vpsUrl,
      lastSyncAt: lastVpsSyncAt,
      syncStatus: vpsSyncStatus,
      lastError: lastVpsError
    },
    isVipManaged: isSatelliteVip()
  }
}

export function notifyStatus(): void {
  const status = getLanStatus()
  const wins = typeof BrowserWindow?.getAllWindows === 'function' ? BrowserWindow.getAllWindows() : []
  for (const win of wins) {
    if (!win.isDestroyed()) {
      win.webContents.send('lan:status', status)
    }
  }
}

// Channels permanently forbidden for remote satellite execution to guarantee safety
const FORBIDDEN_REMOTE_CHANNELS = new Set([
  'data:resetDatabase',
  'data:startNewStore',
  'backup:restore',
  'backup:importWindows',
  'app:openDataDir',
  'app:databaseFile',
  'app:startup',
  'lan:setMode',
  'lan:generatePin',
  'lan:pair'
])

// Channels that satellite terminals should proxy to the Master PC
const PROXIED_CHANNELS = new Set([
  // Products
  'products:search',
  'products:get',
  'products:create',
  'products:update',
  'products:archive',
  'products:restore',
  'products:count',
  'products:saveImage',
  'products:deleteImage',
  'products:getImageData',
  'products:csvTemplate',
  'products:previewCsv',
  'products:importCsv',
  'products:previewSimplePos',
  'products:importSimplePos',

  // Inventory
  'inventory:expiration',
  'inventory:batchDate',
  'inventory:movements',
  'inventory:receiving',
  'inventory:receive',
  'inventory:restock',
  'inventory:adjust',
  'inventory:movement',
  'inventory:count',
  'inventory:withdraw',

  // Categories
  'categories:list',
  'categories:create',
  'categories:remove',

  // Suppliers & Purchases
  'suppliers:list',
  'suppliers:create',
  'suppliers:update',
  'suppliers:products',
  'suppliers:purchases',
  'purchases:list',
  'purchases:get',
  'purchases:create',

  // Customers
  'customers:list',
  'customers:get',
  'customers:create',
  'customers:update',
  'customers:ledger',
  'customers:pay',
  'customers:adjust',
  'customers:revoke',
  'customers:approveOverlimit',

  // POS & Checkout
  'pos:searchProducts',
  'pos:checkout',
  'pos:hold',
  'pos:held',
  'pos:resumeHeld',
  'pos:deleteHeld',
  'pos:reprint',

  // Transactions
  'transactions:list',
  'transactions:get',
  'transactions:refund',
  'transactions:void',
  'transactions:delete',

  // Expenses
  'expenses:categories',
  'expenses:createCategory',
  'expenses:list',
  'expenses:create',
  'expenses:update',
  'expenses:remove',

  // Shifts
  'shifts:current',
  'shifts:open',
  'shifts:close',
  'shifts:cashMovement',
  'shifts:list',
  'shifts:summary',

  // Reports
  'reports:sales',
  'reports:itemSales',
  'reports:inventory',
  'reports:utang',
  'reports:cashier',
  'reports:shifts',
  'reports:exportCsv',
  'reports:xRead',
  'reports:cashCountExpected',
  'reports:dailyCashExpected',
  'reports:cashCount',
  'reports:cashCounts',
  'reports:cashCountPrint',
  'reports:printXRead',
  'reports:finalizeZ',
  'reports:zHistory',
  'reports:printZRead',

  // Price references
  'priceReferences:search',
  'priceReferences:get',
  'priceReferences:getByProduct',
  'priceReferences:getByBarcode',
  'priceReferences:matchForProduct',
  'priceReferences:link',
  'priceReferences:unlink',
  'priceReferences:sync',
  'priceReferences:status',
  'priceReferences:compare',

  // Users & Auth
  'users:list',
  'users:create',
  'users:update',
  'users:roles',
  'auth:publicUsers',
  'auth:status',
  'auth:login',
  'auth:loginPin',
  'auth:logout',

  // Settings
  'settings:get'
])

export function isSatellite(): boolean {
  try {
    const s = getSettings(getDb())
    return s.lan_network_mode === 'satellite' && satelliteConnected
  } catch {
    return false
  }
}

export function shouldProxyChannel(channel: string): boolean {
  return PROXIED_CHANNELS.has(channel)
}

// Master RPC Dispatcher Reference (bound during ipc init)
let masterDispatcher: ((channel: string, args: unknown[]) => Promise<unknown>) | null = null

export function setMasterDispatcher(fn: (channel: string, args: unknown[]) => Promise<unknown>): void {
  masterDispatcher = fn
}

function handleLanRequest(req: http.IncomingMessage, res: http.ServerResponse): void {
  const host = req.headers.host || `127.0.0.1:${currentPort}`
  const url = new URL(req.url || '/', `http://${host}`)
  const pathname = url.pathname

  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')

  if (req.method === 'OPTIONS') {
    res.writeHead(204)
    res.end()
    return
  }

  // 1. Status Ping
  if (pathname === '/api/lan/status' && req.method === 'GET') {
    let isVip = false
    try {
      const { licenseService } = require('./licenseService')
      isVip = !!licenseService.getStatus()?.isVip
    } catch {}
    res.writeHead(200, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ ok: true, status: getLanStatus(), isVip }))
    return
  }

  // 2. Pairing Handshake (Verify PIN & Issue Token)
  if (pathname === '/api/lan/pair' && req.method === 'POST') {
    let body = ''
    req.on('data', (chunk) => { body += chunk })
    req.on('end', () => {
      try {
        const payload = JSON.parse(body)
        const { pin, deviceName } = payload
        if (!pin || pin !== activePairingPin || Date.now() > pairingPinExpiry) {
          res.writeHead(401, { 'Content-Type': 'application/json' })
          res.end(JSON.stringify({ ok: false, error: 'Invalid or expired 6-digit PIN. Check the Master PC screen.' }))
          return
        }

        const deviceId = crypto.randomUUID()
        const token = crypto.createHmac('sha256', serverSecret).update(`${deviceId}:${Date.now()}`).digest('hex')
        const clientIp = (req.socket.remoteAddress || '').replace(/^.*:/, '')
        const now = new Date().toISOString()

        const device: LanDevice & { token: string } = {
          id: deviceId,
          name: typeof deviceName === 'string' && deviceName.trim() ? deviceName.trim() : `Cashier Terminal (${clientIp})`,
          ip: clientIp,
          connectedAt: now,
          lastSeen: now,
          token
        }

        pairedClients.set(token, device)
        notifyStatus()

        let storeName = 'TINDA Store'
        try { storeName = getSettings(getDb()).store_name || storeName } catch { /* default */ }

        let isVip = false
        try {
          const { licenseService } = require('./licenseService')
          isVip = !!licenseService.getStatus()?.isVip
        } catch {}

        res.writeHead(200, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({ ok: true, token, storeName, deviceId, isVip }))
      } catch (err) {
        res.writeHead(400, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({ ok: false, error: 'Bad request: ' + (err as Error).message }))
      }
    })
    return
  }

  // 3. Real-Time Event Stream (Server-Sent Events for Live Inventory / Cart Sync)
  if (pathname === '/api/lan/events' && req.method === 'GET') {
    const token = url.searchParams.get('token') || ''
    if (!pairedClients.has(token)) {
      res.writeHead(401, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ ok: false, error: 'Unauthorized token' }))
      return
    }

    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive'
    })
    res.write(`data: ${JSON.stringify({ type: 'connected', time: Date.now() })}\n\n`)

    sseConnections.add(res)
    notifyStatus()

    req.on('close', () => {
      sseConnections.delete(res)
      notifyStatus()
    })
    return
  }

  // 4. Remote RPC Dispatcher (The Core Master Database Bridge)
  if (pathname === '/api/lan/rpc' && req.method === 'POST') {
    const authHeader = req.headers.authorization || ''
    const token = authHeader.replace(/^Bearer\s+/i, '').trim()

    if (!token || !pairedClients.has(token)) {
      res.writeHead(401, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ ok: false, error: 'Unauthorized terminal token' }))
      return
    }

    const client = pairedClients.get(token)
    if (client) client.lastSeen = new Date().toISOString()

    let body = ''
    req.on('data', (chunk) => {
      body += chunk
      if (body.length > 5000000) req.destroy() // 5MB max payload guard
    })
    req.on('end', async () => {
      try {
        const payload = JSON.parse(body)
        const { channel, args } = payload

        if (FORBIDDEN_REMOTE_CHANNELS.has(channel)) {
          res.writeHead(403, { 'Content-Type': 'application/json' })
          res.end(JSON.stringify({ ok: false, error: `Forbidden: Channel [${channel}] is locked to the physical Master PC.` }))
          return
        }

        if (!masterDispatcher) {
          res.writeHead(500, { 'Content-Type': 'application/json' })
          res.end(JSON.stringify({ ok: false, error: 'Master RPC Dispatcher not initialized' }))
          return
        }

        const result = await masterDispatcher(channel, Array.isArray(args) ? args : [])
        res.writeHead(200, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({ ok: true, data: result }))
      } catch (err) {
        res.writeHead(500, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({ ok: false, error: (err as Error).message || String(err) }))
      }
    })
    return
  }

  res.writeHead(404)
  res.end('Not Found')
}

export function broadcastLanEvent(event: { type: string; payload: unknown }): void {
  const data = `data: ${JSON.stringify(event)}\n\n`
  for (const client of sseConnections) {
    try {
      client.write(data)
    } catch {
      sseConnections.delete(client)
    }
  }
}

export function startMasterServer(port = 3111, attempts = 0): Promise<number> {
  return new Promise((resolve) => {
    if (lanServer) {
      resolve(currentPort)
      return
    }

    if (attempts >= 5) {
      console.warn('[LAN Hub] Could not bind Master Server after 5 attempts; LAN Hub disabled.')
      resolve(0)
      return
    }

    currentPort = port
    lanServer = http.createServer(handleLanRequest)

    lanServer.on('error', (err: NodeJS.ErrnoException) => {
      if (err.code === 'EADDRINUSE' && attempts < 5) {
        try { lanServer?.close() } catch { /* ignore */ }
        lanServer = null
        void startMasterServer(currentPort + 1, attempts + 1).then(resolve)
      } else {
        console.error('[LAN Hub] Master Server error:', err.message)
        try { lanServer?.close() } catch { /* ignore */ }
        lanServer = null
        resolve(0)
      }
    })

    lanServer.listen(currentPort, '0.0.0.0', () => {
      console.log(`[LAN Hub] Master Server listening on 0.0.0.0:${currentPort}`)
      if (!activePairingPin) generatePin()
      startUdpBeacon(currentPort)
      if (typeof powerSaveBlocker?.start === 'function' && powerBlockerId === null) {
        try {
          powerBlockerId = powerSaveBlocker.start('prevent-app-suspension')
        } catch {}
      }
      notifyStatus()
      resolve(currentPort)
    })
  })
}

export function stopMasterServer(): void {
  stopUdpBeacon()
  if (powerBlockerId !== null && typeof powerSaveBlocker?.stop === 'function') {
    try {
      powerSaveBlocker.stop(powerBlockerId)
    } catch {}
    powerBlockerId = null
  }
  for (const res of sseConnections) {
    try { res.end() } catch { /* ignore */ }
  }
  sseConnections.clear()
  if (lanServer) {
    try { lanServer.close() } catch { /* ignore */ }
    lanServer = null
  }
  notifyStatus()
}

// -------------------------------------------------------------
// SATELLITE TERMINAL CLIENT METHODS
// -------------------------------------------------------------

export async function pairWithMaster(
  masterIp: string,
  pin: string,
  deviceName = 'Satellite Cashier'
): Promise<{ ok: boolean; error?: string; storeName?: string }> {
  const cleanIp = masterIp.trim()
  const cleanPin = pin.trim()
  if (!cleanIp || !cleanPin) {
    return { ok: false, error: 'Master IP and 6-digit PIN are required.' }
  }

  const port = satelliteMasterPort || 3111
  const url = `http://${cleanIp}:${port}/api/lan/pair`

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pin: cleanPin, deviceName })
    })

    const data = (await res.json()) as { ok?: boolean; error?: string; token?: string; storeName?: string; isVip?: boolean }
    if (!res.ok || !data.ok) {
      return { ok: false, error: data.error || `HTTP ${res.status} connection failed` }
    }

    satelliteToken = data.token || ''
    satelliteMasterIp = cleanIp
    satelliteConnected = true
    satelliteIsVip = !!data.isVip

    // Save connection configuration to settings
    const database = getDb()
    updateSettings(database, {
      lan_network_mode: 'satellite',
      lan_master_ip: cleanIp,
      lan_master_port: port,
      lan_pairing_pin: cleanPin
    })

    connectSatelliteSse(cleanIp, port, satelliteToken)
    notifyStatus()
    return { ok: true, storeName: data.storeName }
  } catch (err) {
    satelliteConnected = false
    notifyStatus()
    return { ok: false, error: 'Could not connect to Master PC: ' + (err as Error).message }
  }
}

function connectSatelliteSse(ip: string, port: number, token: string): void {
  if (sseClientReq) {
    try { sseClientReq.destroy() } catch { /* ignore */ }
    sseClientReq = null
  }

  const url = `http://${ip}:${port}/api/lan/events?token=${encodeURIComponent(token)}`
  const req = http.get(url, (res) => {
    if (res.statusCode !== 200) {
      satelliteConnected = false
      notifyStatus()
      return
    }

    satelliteConnected = true
    notifyStatus()

    let buffer = ''
    res.on('data', (chunk) => {
      buffer += chunk.toString()
      const lines = buffer.split('\n\n')
      buffer = lines.pop() || ''
      for (const line of lines) {
        const match = line.match(/^data:\s*(.+)$/m)
        if (match && match[1]) {
          try {
            const ev = JSON.parse(match[1])
            if (ev.type === 'inventory:changed') {
              const wins = BrowserWindow.getAllWindows()
              for (const win of wins) {
                if (!win.isDestroyed()) {
                  win.webContents.send('inventory:changed', ev.payload)
                }
              }
            } else if (ev.type === 'transactions:changed') {
              const wins = BrowserWindow.getAllWindows()
              for (const win of wins) {
                if (!win.isDestroyed()) {
                  win.webContents.send('transactions:changed', ev.payload)
                }
              }
            }
          } catch {
            // Ignore malformed event
          }
        }
      }
    })

    res.on('end', () => {
      satelliteConnected = false
      notifyStatus()
      // Auto-reconnect after 3 seconds
      setTimeout(() => {
        if (isSatellite()) connectSatelliteSse(ip, port, token)
      }, 3000)
    })
  })

  req.on('error', () => {
    satelliteConnected = false
    notifyStatus()
    setTimeout(() => {
      if (isSatellite()) connectSatelliteSse(ip, port, token)
    }, 3000)
  })

  sseClientReq = req
}

export async function callRemoteRpc(channel: string, args: unknown[]): Promise<unknown> {
  if (!satelliteConnected || !satelliteMasterIp || !satelliteToken) {
    throw new Error('Not connected to Master Server. Check network connection or Settings → Network.')
  }

  const url = `http://${satelliteMasterIp}:${satelliteMasterPort}/api/lan/rpc`
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${satelliteToken}`
    },
    body: JSON.stringify({ channel, args })
  })

  const json = (await res.json()) as { ok?: boolean; error?: string; data?: unknown }
  if (!res.ok || !json.ok) {
    throw new Error(json.error || `Remote RPC failed with HTTP ${res.status}`)
  }
  return json.data
}

export async function setLanMode(
  mode: LanRole,
  config?: { masterIp?: string; masterPort?: number; pin?: string }
): Promise<LanStatus> {
  const database = getDb()
  const patch: Partial<StoreSettings> = { lan_network_mode: mode }

  if (config?.masterIp) patch.lan_master_ip = config.masterIp
  if (config?.masterPort) patch.lan_master_port = config.masterPort
  if (config?.pin) patch.lan_pairing_pin = config.pin

  updateSettings(database, patch)

  if (mode === 'master') {
    if (sseClientReq) {
      try { sseClientReq.destroy() } catch { /* ignore */ }
      sseClientReq = null
    }
    satelliteConnected = false
    await startMasterServer(config?.masterPort || 3111)
  } else if (mode === 'satellite') {
    stopMasterServer()
    if (config?.masterIp && config?.pin) {
      await pairWithMaster(config.masterIp, config.pin)
    }
  } else {
    // Standalone
    stopMasterServer()
    if (sseClientReq) {
      try { sseClientReq.destroy() } catch { /* ignore */ }
      sseClientReq = null
    }
    satelliteConnected = false
  }

  notifyStatus()
  return getLanStatus()
}

// -------------------------------------------------------------
// VPS CLOUD SYNC METHODS
// -------------------------------------------------------------

export async function testVpsConnection(vpsUrl: string, token: string): Promise<{ ok: boolean; message: string }> {
  const cleanUrl = vpsUrl.trim().replace(/\/+$/, '')
  if (!cleanUrl) return { ok: false, message: 'VPS Server URL is required.' }

  try {
    const res = await fetch(`${cleanUrl}/api/vps/ping`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token.trim()}`
      }
    })

    if (res.ok) {
      vpsSyncStatus = 'ok'
      lastVpsError = undefined
      notifyStatus()
      return { ok: true, message: 'Connected to VPS successfully!' }
    } else {
      const errText = await res.text()
      vpsSyncStatus = 'error'
      lastVpsError = `HTTP ${res.status}: ${errText}`
      notifyStatus()
      return { ok: false, message: `VPS responded with error (${res.status}): ${errText}` }
    }
  } catch (err) {
    vpsSyncStatus = 'error'
    lastVpsError = (err as Error).message
    notifyStatus()
    return { ok: false, message: 'Could not reach VPS server: ' + (err as Error).message }
  }
}

export async function triggerVpsSync(): Promise<{ ok: boolean; syncedCount: number; message: string }> {
  const settings = getSettings(getDb())
  if (!settings.vps_sync_enabled || !settings.vps_server_url) {
    return { ok: false, syncedCount: 0, message: 'VPS Sync is not enabled in settings.' }
  }

  vpsSyncStatus = 'syncing'
  notifyStatus()

  try {
    const url = settings.vps_server_url.trim().replace(/\/+$/, '')
    const db = getDb()

    // Fetch store summary and recent sales
    const summary = db.prepare(`
      SELECT 
        COUNT(*) as total_sales,
        COALESCE(SUM(total_c), 0) as total_revenue_c,
        COALESCE(SUM(items_count), 0) as total_items
      FROM sales WHERE status = 'COMPLETED'
    `).get() as { total_sales: number; total_revenue_c: number; total_items: number }

    const payload = {
      storeName: settings.store_name,
      timestamp: new Date().toISOString(),
      summary,
      appVersion: '1.0.35'
    }

    const res = await fetch(`${url}/api/vps/sync`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${(settings.vps_api_token || '').trim()}`
      },
      body: JSON.stringify(payload)
    })

    if (!res.ok) {
      throw new Error(`VPS Sync returned HTTP ${res.status}`)
    }

    lastVpsSyncAt = new Date().toISOString()
    vpsSyncStatus = 'ok'
    lastVpsError = undefined
    notifyStatus()
    return { ok: true, syncedCount: summary.total_sales, message: 'Sync completed successfully' }
  } catch (err) {
    vpsSyncStatus = 'error'
    lastVpsError = (err as Error).message
    notifyStatus()
    return { ok: false, syncedCount: 0, message: (err as Error).message }
  }
}

export function initializeLanHub(): void {
  try {
    const settings = getSettings(getDb())
    if (settings.lan_network_mode === 'master') {
      void startMasterServer(settings.lan_master_port || 3111)
    } else if (settings.lan_network_mode === 'satellite' && settings.lan_master_ip && settings.lan_pairing_pin) {
      void pairWithMaster(settings.lan_master_ip, settings.lan_pairing_pin)
    }
  } catch (e) {
    console.error('[LAN Hub] Initialization error:', e)
  }
}
