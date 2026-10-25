import http from 'node:http'
import https from 'node:https'
import os from 'node:os'
import fs from 'node:fs'
import { BrowserWindow } from 'electron'
import { getDb } from '../database/connection'
import { findByBarcode, findBySku } from '../repositories/products'

export interface PhoneScannerStatus {
  running: boolean
  port: number
  httpsPort: number
  ip: string
  url: string
  httpsUrl: string
  connected: boolean
  device?: string
  availableIps?: { name: string; address: string }[]
}

let httpServer: http.Server | null = null
let httpsServer: https.Server | null = null
let currentPort = 3122
let currentHttpsPort = 3123
let sessionToken = ''
let lastClientPing = 0
let connectedDevice = ''
let zxingBundleCache: Buffer | null = null

// Bundled 100-year self-signed SSL certificate for local Wi-Fi secure context (getUserMedia)
const SSL_CERT = `-----BEGIN CERTIFICATE-----
MIIDXzCCAkegAwIBAgIUUre6Ioywy2WQz5YlbGLXjbh6crUwDQYJKoZIhvcNAQEL
BQAwMDESMBAGA1UEAwwJVElOREEtUE9TMRowGAYDVQQKDBFUSU5EQSBQT1MgRGVz
a3RvcDAgFw0yNjA5MjcwOTA3MDlaGA8yMTI2MDkwMzA5MDcwOVowMDESMBAGA1UE
AwwJVElOREEtUE9TMRowGAYDVQQKDBFUSU5EQSBQT1MgRGVza3RvcDCCASIwDQYJ
KoZIhvcNAQEBBQADggEPADCCAQoCggEBAJmzbZW10E7RU/NhEFfyN067vP8iD36K
RjCo83crlMec7zJEmZsAof8pnivyPIMol1M+UommIdi1TDdtKKunKmeQOeNAoC98
POETKRmljFWSXLtCI804EiRrFeHJ+goCowB4k7+7K30fObnXpcOfA2sZz43e6Iwr
pL6Qw4rmOZ3ZI0pbNEGZ3yJegzdFGsuv+CQgjsjqEXSHtK7+RBiCF0XtoWS23SB0
ao78absQsktPZ9Pb1aV6pVHLO7dnYq7Z4SqVmf3+kKrdj70m3qGssCs5WnzPUgQ5
8V1wEudWo2Q0omwOxm+p74R1ZjnsF6dedQQWRaoR8yLeAXKvX7W2HdsCAwEAAaNv
MG0wHQYDVR0OBBYEFI6SvdJMJxxab0K7oEexbRoVpZagMB8GA1UdIwQYMBaAFI6S
vdJMJxxab0K7oEexbRoVpZagMA8GA1UdEwEB/wQFMAMBAf8wGgYDVR0RBBMwEYcE
fwAAAYIJbG9jYWxob3N0MA0GCSqGSIb3DQEBCwUAA4IBAQAZsWT1MffzDya/Ezit
kDbTgwNp2g4b5ou7q7rmL8nNDsBoUkFcZ5sj9DirNClFLbey1zXK9akVps/BxuN2
t780iRBcRG4M+O8BcvnqL0T9jzla41BseKY1+NU69s5+smb4nMdyjSIFERz1yWL5
VC17TaSAcxLiOPT8bcVs+CIYKzEr+wTR7sj/m3GUhA7eIrehW8jBBbukcMpa3UAn
mdxA5zowvEhgrmpC6OBehjrRChJ1wcYts9N5ZagFldQzaw/z3qxpRRPECRZfo8fG
jaCmGZS54vLgfNV6RWlxY8x2HHhz2+K6xiKwygj0v7CJ6Re7tregQxajuGNo9NZ/
1r/Q
-----END CERTIFICATE-----`

const SSL_KEY = `-----BEGIN PRIVATE KEY-----
MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQCZs22VtdBO0VPz
YRBX8jdOu7z/Ig9+ikYwqPN3K5THnO8yRJmbAKH/KZ4r8jyDKJdTPlKJpiHYtUw3
bSirpypnkDnjQKAvfDzhEykZpYxVkly7QiPNOBIkaxXhyfoKAqMAeJO/uyt9Hzm5
16XDnwNrGc+N3uiMK6S+kMOK5jmd2SNKWzRBmd8iXoM3RRrLr/gkII7I6hF0h7Su
/kQYghdF7aFktt0gdGqO/Gm7ELJLT2fT29WleqVRyzu3Z2Ku2eEqlZn9/pCq3Y+9
Jt6hrLArOVp8z1IEOfFdcBLnVqNkNKJsDsZvqe+EdWY57BenXnUEFkWqEfMi3gFy
r1+1th3bAgMBAAECggEAKxDeZLNj4aG/jxMkXDAPFS1/YFFv2/nsftfoF/0LG/85
+nDERW0g9vj3S8L895cZB4cP42e8Vhc+es1INwiI1inQPn+uIoACIuKWgowjTRrM
ht+aXncWhkPHBtPsDn/8ojYm1/Me1Vk5eHwXAz/72jeKM2tA532XFJpFYBbwD+0H
JlN9bPXBfH2CPljW8AFqQ56B9DeitPoYxjGmRoEXwKoiSE0iJNCXEkBuopIiWnkv
Hmqo85X4jXcQNAdLbVQmTc9tAJnJWnOA/09oDqlmPg9yyJHshzxXyqkb+HgVK3kj
VEYHbg0iPuDqAbz9XgLgt2Q0BU4m8ieH+I37W9nvcQKBgQDRavcYBjh0jKaGyv+p
JZe1ufAGbn0OOtSbHnZrisMifkcaK1LImwDniB5m8dNbhOcHrQCob/Oqo3XXF/br
Nou0gCJnLYsVs66YF7gg3PLjYTgF2Uu6nAsyu4YNBYPKa4kGg6izdjJe0Xq9zg3q
FAT8oHCoNa1z5/X2yzcCrKReYwKBgQC747tUQT9ISU7GxAd4zYBTaJNaWfxFrIj1
ntQKkneBK3+CBKHRqR2/dq58waw9xSxkkA8BH70KcTijIiFGZxDvutzG4c+IriXt
Y1/HAqxuin50Nwrm89iaNFMhQRwyU2+4jQ1CeHnx7I21wP39dwSPGHMrpYS9PFmB
nLjl2wEAKQKBgFI0iPZ3SqYFqED1YtKFHT6K1LvRl2mEknypwpaIi/z4UPTm2MJC
hmJcvoJunycnzoDm2oFEIQR00gczMww2BzU9r0ONTzGfrQOrG+5ajUXQnes910pT
gtnRXtexuIA3IjzaZdi8px0tYd8sCa4/WY3JdS+yknoTLixIrTlxh7w9AoGAECzY
0bYURprZB0+U/Rdj9spH9T1N9ImX+N1Fj+twElS2U3EmpTAT+Ym0F9VsiJzS541n
XUdoNN/uakzj5HW3BYxmuVBzV2b2qOsnMbDPO2z82fBrJdrUSOI8Td6XGNYKBi9O
dux8QxGEWaNVul5mrBMExzsmpEvvwLLHUDJ8cZECgYEAqWMzepkko3z6OdPIsrrc
KRjzjDcEzId/PyPbBlkaZdJ/8H3VHOusb1WDNSZ2Ct8YyKK/sWdz33t8XlPTtzTj
Oki3LzMZqCV8t5b2/aePdlMfyfzq/A+J6OCxeBiSiTfoW0f0zi+hTwm7Mbx61zgW
zZ4JgK4+0rL7MAC1JCNSMQw=
-----END PRIVATE KEY-----`

export interface NetworkInterfaceInfo {
  name: string
  address: string
}

export function getAllLocalIpAddresses(): NetworkInterfaceInfo[] {
  const interfaces = os.networkInterfaces()
  const results: NetworkInterfaceInfo[] = []

  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name] || []) {
      if (iface.family === 'IPv4' && !iface.internal) {
        // Exclude link-local / APIPA (169.254.x.x) which occurs when an adapter has no DHCP/network
        if (!iface.address.startsWith('169.254.')) {
          results.push({ name, address: iface.address })
        }
      }
    }
  }

  // Sort prioritizing common active LAN subnets and real physical adapters
  results.sort((a, b) => {
    const isVirtual = (name: string) => /vEthernet|virtual|vmware|vbox|docker|wsl|loopback|pseudo/i.test(name)
    const aVirt = isVirtual(a.name)
    const bVirt = isVirtual(b.name)
    if (aVirt !== bVirt) return aVirt ? 1 : -1

    const isPhysical = (name: string) => /wi-?fi|wlan|ethernet|eth|en\d/i.test(name)
    const aPhys = isPhysical(a.name)
    const bPhys = isPhysical(b.name)
    if (aPhys !== bPhys) return aPhys ? -1 : 1

    const isPrivate = (ip: string) =>
      ip.startsWith('192.168.') || ip.startsWith('10.') || /^172\.(1[6-9]|2\d|3[01])\./.test(ip)
    const aPriv = isPrivate(a.address)
    const bPriv = isPrivate(b.address)
    if (aPriv !== bPriv) return aPriv ? -1 : 1

    return 0
  })

  return results
}

export function getLocalIpAddress(): string {
  const all = getAllLocalIpAddresses()
  if (all.length > 0 && all[0]?.address) {
    return all[0].address
  }
  return '127.0.0.1'
}

export function getScannerUrl(): string {
  const ip = getLocalIpAddress()
  return `http://${ip}:${currentPort}/scanner?session=${sessionToken}`
}

export function getScannerHttpsUrl(): string {
  const ip = getLocalIpAddress()
  return `https://${ip}:${currentHttpsPort}/scanner?session=${sessionToken}`
}

export function getCfdUrl(): string {
  const ip = getLocalIpAddress()
  return `http://${ip}:${currentPort}/cfd`
}

export function getCfdHttpsUrl(): string {
  const ip = getLocalIpAddress()
  return `https://${ip}:${currentHttpsPort}/cfd`
}

export interface CfdCartItem {
  id: number
  name: string
  qty: number
  unit_name: string
  price_c: number
  subtotal_c: number
}

export interface CfdBillsPayload {
  category?: string
  biller: string
  accountNo: string
  customerName?: string
  customerPhone?: string
  amount_c: number
  fee_c: number
  total_c: number
  cashReceived_c?: number
  change_c?: number
  sourceWallet?: string
  referenceNo?: string
  status?: 'PENDING' | 'COMPLETED'
}

export interface CfdEwalletPayload {
  channel: 'GCASH' | 'MAYA' | 'MARIBANK' | string
  type: 'CASH_IN' | 'CASH_OUT' | string
  accountNo?: string
  customerName?: string
  customerPhone?: string
  amount_c: number
  fee_c: number
  total_c: number
  feeCollectedVia?: 'CASH' | 'WALLET'
  referenceNo?: string
  notes?: string
  status?: 'PENDING' | 'COMPLETED'
}

export interface CfdState {
  storeName: string
  status: 'IDLE' | 'ACTIVE' | 'PAYMENT' | 'COMPLETED'
  mode?: 'RETAIL' | 'BILLS_PAYMENT' | 'EWALLET'
  items: CfdCartItem[]
  subtotal_c: number
  discount_c: number
  total_c: number
  amount_tendered_c?: number
  change_c?: number
  paymentMethod?: string
  qrCodeUrl?: string
  qrSvg?: string
  customerName?: string
  billsPayload?: CfdBillsPayload
  ewalletPayload?: CfdEwalletPayload
  updatedAt: number
}

let cfdState: CfdState = {
  storeName: 'TINDA POS',
  status: 'IDLE',
  mode: 'RETAIL',
  items: [],
  subtotal_c: 0,
  discount_c: 0,
  total_c: 0,
  updatedAt: Date.now()
}

export function getCfdState(): CfdState {
  return cfdState
}

export function generateQrSvg(text: string, size = 260): string {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { QRCodeWriter, BarcodeFormat } = require('@zxing/library')
    const writer = new QRCodeWriter()
    const matrix = writer.encode(text, BarcodeFormat.QR_CODE, 0, 0, new Map())
    const width = matrix.getWidth()
    const height = matrix.getHeight()
    let paths = ''
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        if (matrix.get(x, y)) {
          paths += `M${x},${y}h1v1h-1z `
        }
      }
    }
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${size}" height="${size}" shape-rendering="crispEdges"><rect width="${width}" height="${height}" fill="#ffffff"/><path d="${paths}" fill="#000000"/></svg>`
  } catch (err) {
    console.error('[cfd] Failed to generate QR SVG:', err)
    return ''
  }
}

export function updateCfdState(partial: Partial<CfdState>): CfdState {
  let qrSvg: string | undefined = partial.qrSvg
  if (partial.qrCodeUrl && !partial.qrSvg) {
    qrSvg = generateQrSvg(partial.qrCodeUrl, 240)
  }
  const nextMode =
    partial.mode !== undefined
      ? partial.mode
      : partial.billsPayload
        ? 'BILLS_PAYMENT'
        : partial.ewalletPayload
          ? 'EWALLET'
          : partial.status === 'IDLE'
            ? 'RETAIL'
            : cfdState.mode || 'RETAIL'

  cfdState = {
    ...cfdState,
    ...partial,
    mode: nextMode,
    qrSvg: qrSvg !== undefined ? qrSvg : partial.qrCodeUrl ? cfdState.qrSvg : undefined,
    billsPayload:
      partial.billsPayload !== undefined
        ? partial.billsPayload
        : partial.status === 'IDLE' && partial.mode !== 'BILLS_PAYMENT'
          ? undefined
          : cfdState.billsPayload,
    ewalletPayload:
      partial.ewalletPayload !== undefined
        ? partial.ewalletPayload
        : partial.status === 'IDLE' && partial.mode !== 'EWALLET'
          ? undefined
          : cfdState.ewalletPayload,
    updatedAt: Date.now()
  }
  return cfdState
}

export function getPhoneScannerStatus(): PhoneScannerStatus {
  const isConnected = (!!httpServer || !!httpsServer) && Date.now() - lastClientPing < 8000
  const allIps = getAllLocalIpAddresses()
  return {
    running: !!httpServer || !!httpsServer,
    port: currentPort,
    httpsPort: currentHttpsPort,
    ip: getLocalIpAddress(),
    url: getScannerUrl(),
    httpsUrl: getScannerHttpsUrl(),
    connected: isConnected,
    device: isConnected ? connectedDevice : undefined,
    availableIps: allIps
  }
}

function notifyStatusChange(): void {
  const status = getPhoneScannerStatus()
  try {
    const wins = typeof BrowserWindow?.getAllWindows === 'function' ? BrowserWindow.getAllWindows() : []
    for (const win of wins) {
      if (!win.isDestroyed()) {
        win.webContents.send('phoneScanner:status', status)
      }
    }
  } catch {
    // Vitest or headless environment
  }
}

function notifyBarcodeScan(barcode: string, quantity = 1, action = 'cart'): void {
  try {
    const wins = typeof BrowserWindow?.getAllWindows === 'function' ? BrowserWindow.getAllWindows() : []
    for (const win of wins) {
      if (!win.isDestroyed()) {
        win.webContents.send('phoneScanner:scan', { barcode, quantity, action })
      }
    }
  } catch {
    // Vitest or headless environment
  }
}

function getZxingBundle(): Buffer | null {
  if (zxingBundleCache) return zxingBundleCache
  try {
    const bundlePath = require.resolve('@zxing/library/umd/index.min.js')
    if (fs.existsSync(bundlePath)) {
      zxingBundleCache = fs.readFileSync(bundlePath)
      return zxingBundleCache
    }
  } catch {
    // Non-fatal if missing
  }
  return null
}

function generateMobileHtml(): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover">
  <title>TINDA POS — Wireless Phone Scanner</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; -webkit-tap-highlight-color: transparent; }
    body {
      background: #090d10;
      color: #f1f5f9;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      user-select: none;
    }
    header {
      background: rgba(15, 23, 42, 0.95);
      border-bottom: 1px solid rgba(51, 65, 85, 0.6);
      padding: 12px 16px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      z-index: 20;
    }
    .brand {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 15px;
      font-weight: 700;
      letter-spacing: -0.02em;
    }
    .brand span { color: #10b981; }
    .status-pill {
      font-size: 11px;
      font-weight: 600;
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 4px 10px;
      border-radius: 9999px;
      background: rgba(16, 185, 129, 0.15);
      color: #34d399;
      border: 1px solid rgba(16, 185, 129, 0.3);
    }
    .status-dot {
      width: 7px;
      height: 7px;
      border-radius: 50%;
      background: #10b981;
      animation: pulse 2s infinite;
    }
    @keyframes pulse { 0%, 100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.4; transform: scale(0.85); } }
    .header-actions { display: flex; gap: 8px; }
    .btn-icon {
      background: #1e293b;
      border: 1px solid #334155;
      color: #cbd5e1;
      padding: 8px 12px;
      border-radius: 8px;
      font-size: 13px;
      font-weight: 600;
      display: inline-flex;
      align-items: center;
      gap: 4px;
      cursor: pointer;
    }

    .main-content {
      flex: 1;
      position: relative;
      display: flex;
      flex-direction: column;
      overflow-y: auto;
    }

    .viewport {
      flex: 1;
      min-height: 280px;
      position: relative;
      background: #000;
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
    }
    video {
      position: absolute;
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
    .reticle {
      position: relative;
      width: 76vw;
      max-width: 320px;
      height: 180px;
      border-radius: 14px;
      pointer-events: none;
      z-index: 10;
      box-shadow: 0 0 0 4000px rgba(0, 0, 0, 0.55);
      transition: box-shadow 0.25s ease;
    }
    .reticle.scanned {
      box-shadow: 0 0 0 4000px rgba(16, 185, 129, 0.45) !important;
    }
    .reticle::before, .reticle::after,
    .reticle-corner-bl, .reticle-corner-br {
      content: '';
      position: absolute;
      width: 28px;
      height: 28px;
      border-color: #10b981;
      border-style: solid;
      pointer-events: none;
    }
    .reticle::before { top: 0; left: 0; border-width: 4px 0 0 4px; border-top-left-radius: 12px; }
    .reticle::after { top: 0; right: 0; border-width: 4px 4px 0 0; border-top-right-radius: 12px; }
    .reticle-corner-bl { bottom: 0; left: 0; border-width: 0 0 4px 4px; border-bottom-left-radius: 12px; }
    .reticle-corner-br { bottom: 0; right: 0; border-width: 0 4px 4px 0; border-bottom-right-radius: 12px; }
    .scan-laser {
      position: absolute;
      top: 0; left: 0; right: 0;
      height: 2px;
      background: linear-gradient(90deg, transparent, #34d399, transparent);
      box-shadow: 0 0 8px #10b981;
      animation: sweep 2.2s ease-in-out infinite alternate;
    }
    @keyframes sweep { from { top: 8%; } to { top: 92%; } }

    /* Snap & Fallback Cards */
    .snap-section {
      padding: 16px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 12px;
      text-align: center;
    }
    .btn-snap-main {
      width: 100%;
      max-width: 340px;
      background: linear-gradient(135deg, #10b981 0%, #059669 100%);
      color: #ffffff;
      font-size: 16px;
      font-weight: 700;
      padding: 16px 20px;
      border-radius: 14px;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 10px;
      cursor: pointer;
      box-shadow: 0 4px 15px rgba(16, 185, 129, 0.4);
      border: 1px solid rgba(255, 255, 255, 0.2);
      transition: transform 0.15s ease, filter 0.15s ease;
    }
    .btn-snap-main:active {
      transform: scale(0.97);
      filter: brightness(0.9);
    }
    .camera-svg {
      width: 24px;
      height: 24px;
    }
    .snap-hint {
      font-size: 12px;
      color: #94a3b8;
      max-width: 320px;
      line-height: 1.4;
    }

    .notice-card {
      margin: 16px;
      padding: 16px;
      border-radius: 12px;
      background: rgba(15, 23, 42, 0.9);
      border: 1px solid rgba(56, 189, 248, 0.3);
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .notice-badge {
      display: inline-flex;
      align-self: flex-start;
      font-size: 10px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      padding: 2px 8px;
      border-radius: 9999px;
      background: rgba(56, 189, 248, 0.2);
      color: #38bdf8;
    }
    .notice-title {
      font-size: 14px;
      font-weight: 700;
      color: #f1f5f9;
    }
    .notice-desc {
      font-size: 12px;
      color: #94a3b8;
      line-height: 1.4;
    }
    .btn-switch-https {
      display: inline-block;
      text-align: center;
      background: #0284c7;
      color: #ffffff;
      font-size: 13px;
      font-weight: 600;
      padding: 10px 14px;
      border-radius: 8px;
      text-decoration: none;
      margin-top: 4px;
    }
    .notice-sub {
      font-size: 11px;
      color: #64748b;
      line-height: 1.3;
    }

    .feedback-toast {
      position: fixed;
      top: 24px;
      left: 16px;
      right: 16px;
      background: rgba(16, 185, 129, 0.95);
      color: #ffffff;
      padding: 14px 18px;
      border-radius: 12px;
      box-shadow: 0 10px 25px rgba(0, 0, 0, 0.5);
      font-size: 14px;
      font-weight: 700;
      text-align: center;
      z-index: 50;
      transform: translateY(-80px);
      opacity: 0;
      transition: transform 0.25s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.25s ease;
      pointer-events: none;
    }
    .feedback-toast.show {
      transform: translateY(0);
      opacity: 1;
    }
    .feedback-toast.error {
      background: rgba(239, 68, 68, 0.95);
    }
    .feedback-toast.info {
      background: rgba(2, 132, 199, 0.95);
    }

    .controls-bar {
      background: rgba(15, 23, 42, 0.95);
      border-top: 1px solid rgba(51, 65, 85, 0.6);
      padding: 12px 16px env(safe-area-inset-bottom, 16px);
      display: flex;
      flex-direction: column;
      gap: 10px;
      z-index: 20;
    }
    .controls-row {
      display: flex;
      gap: 8px;
      align-items: center;
    }
    .input-code {
      flex: 1;
      background: #0f172a;
      border: 1px solid #334155;
      color: #fff;
      padding: 10px 14px;
      border-radius: 8px;
      font-size: 14px;
      outline: none;
    }
    .input-code:focus { border-color: #10b981; }
    .btn-send {
      background: #10b981;
      color: #0f172a;
      font-weight: 700;
      border: none;
      padding: 10px 16px;
      border-radius: 8px;
      font-size: 13px;
      cursor: pointer;
    }
    .tip-text {
      font-size: 12px;
      color: #94a3b8;
      text-align: center;
    }

    /* Mode Switcher Pill */
    .mode-switch {
      display: inline-flex;
      background: #0b1120;
      border: 1px solid #334155;
      border-radius: 9999px;
      padding: 3px;
      gap: 3px;
    }
    .mode-btn {
      border: none;
      background: transparent;
      color: #94a3b8;
      font-size: 11px;
      font-weight: 700;
      padding: 4px 10px;
      border-radius: 9999px;
      cursor: pointer;
      transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
      display: inline-flex;
      align-items: center;
      gap: 4px;
    }
    .mode-btn.active {
      background: #10b981;
      color: #042f2e;
      box-shadow: 0 2px 8px rgba(16, 185, 129, 0.35);
    }

    /* Bottom Sheet Modal */
    .bottom-sheet-backdrop {
      position: fixed;
      top: 0; left: 0; right: 0; bottom: 0;
      background: rgba(0, 0, 0, 0.75);
      backdrop-filter: blur(8px);
      -webkit-backdrop-filter: blur(8px);
      z-index: 100;
      display: none;
      align-items: flex-end;
      justify-content: center;
      opacity: 0;
      transition: opacity 0.25s ease;
    }
    .bottom-sheet-backdrop.show {
      display: flex;
      opacity: 1;
    }
    .bottom-sheet {
      width: 100%;
      max-width: 480px;
      background: #0f172a;
      border-top: 1px solid #334155;
      border-radius: 24px 24px 0 0;
      padding: 16px 20px env(safe-area-inset-bottom, 20px);
      box-shadow: 0 -12px 40px rgba(0, 0, 0, 0.85);
      display: flex;
      flex-direction: column;
      gap: 12px;
      transform: translateY(100%);
      transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1);
    }
    .bottom-sheet-backdrop.show .bottom-sheet {
      transform: translateY(0);
    }
    .sheet-handle {
      width: 40px;
      height: 4px;
      background: #475569;
      border-radius: 9999px;
      margin: -4px auto 4px;
    }
    .sheet-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 10px;
    }
    .sheet-product-title {
      font-size: 17px;
      font-weight: 800;
      color: #f8fafc;
      line-height: 1.25;
    }
    .sheet-product-meta {
      font-size: 13px;
      color: #94a3b8;
      margin-top: 4px;
      display: flex;
      align-items: center;
      gap: 8px;
      flex-wrap: wrap;
    }
    .sheet-price-tag {
      font-size: 16px;
      font-weight: 800;
      color: #10b981;
    }
    .badge-stock {
      font-size: 11px;
      font-weight: 700;
      padding: 2px 8px;
      border-radius: 6px;
      background: rgba(16, 185, 129, 0.15);
      color: #34d399;
      border: 1px solid rgba(16, 185, 129, 0.3);
    }
    .badge-stock.low {
      background: rgba(245, 158, 11, 0.15);
      color: #fbbf24;
      border-color: rgba(245, 158, 11, 0.3);
    }
    .badge-stock.out {
      background: rgba(239, 68, 68, 0.15);
      color: #f87171;
      border-color: rgba(239, 68, 68, 0.3);
    }
    .wholesale-banner {
      background: rgba(56, 189, 248, 0.12);
      border: 1px solid rgba(56, 189, 248, 0.3);
      border-radius: 10px;
      padding: 6px 12px;
      font-size: 12px;
      color: #38bdf8;
      font-weight: 600;
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .qty-stepper-container {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 12px;
      margin: 2px 0;
    }
    .btn-stepper {
      width: 52px;
      height: 52px;
      border-radius: 14px;
      background: #1e293b;
      border: 1px solid #334155;
      color: #f1f5f9;
      font-size: 26px;
      font-weight: 700;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      touch-action: manipulation;
    }
    .btn-stepper:active {
      background: #334155;
      transform: scale(0.95);
    }
    .input-qty-display {
      flex: 1;
      max-width: 140px;
      height: 52px;
      background: #020617;
      border: 2px solid #3b82f6;
      border-radius: 14px;
      color: #ffffff;
      font-size: 26px;
      font-weight: 800;
      text-align: center;
      outline: none;
      box-shadow: 0 0 16px rgba(59, 130, 246, 0.25);
    }
    .quick-chips-grid {
      display: grid;
      grid-template-columns: repeat(6, 1fr);
      gap: 6px;
    }
    .chip-btn {
      background: #1e293b;
      border: 1px solid #334155;
      color: #cbd5e1;
      border-radius: 8px;
      padding: 9px 0;
      font-size: 12px;
      font-weight: 700;
      cursor: pointer;
      text-align: center;
      touch-action: manipulation;
    }
    .chip-btn:active {
      background: #10b981;
      color: #0f172a;
      border-color: #10b981;
    }
    .sheet-subtotal-bar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 8px 14px;
      background: rgba(15, 23, 42, 0.85);
      border-radius: 10px;
      border: 1px solid #1e293b;
    }
    .subtotal-label { font-size: 12px; color: #94a3b8; font-weight: 600; }
    .subtotal-val { font-size: 17px; color: #10b981; font-weight: 800; }
    .sheet-actions {
      display: flex;
      gap: 10px;
    }
    .btn-sheet-cart {
      flex: 1.3;
      background: linear-gradient(135deg, #10b981 0%, #059669 100%);
      color: #ffffff;
      font-size: 15px;
      font-weight: 800;
      padding: 13px 16px;
      border-radius: 12px;
      border: none;
      cursor: pointer;
      box-shadow: 0 4px 15px rgba(16, 185, 129, 0.4);
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      touch-action: manipulation;
    }
    .btn-sheet-cart:active { transform: scale(0.98); }
    .btn-sheet-quote {
      flex: 1;
      background: #1e293b;
      border: 1px solid #38bdf8;
      color: #38bdf8;
      font-size: 13px;
      font-weight: 700;
      padding: 13px 12px;
      border-radius: 12px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      touch-action: manipulation;
    }
    .btn-sheet-quote:active { background: rgba(56, 189, 248, 0.15); }
    .btn-sheet-cancel {
      background: transparent;
      border: none;
      color: #64748b;
      font-size: 22px;
      font-weight: 700;
      cursor: pointer;
      padding: 2px 6px;
      line-height: 1;
    }
  </style>
  <script src="/zxing.min.js"></script>
  <script>
    window.__TINDA_CONFIG__ = {
      httpPort: ${currentPort},
      httpsPort: ${currentHttpsPort},
      session: "${sessionToken}"
    };
  </script>
</head>
<body>
  <header>
    <div class="brand">
      <span>TINDA POS</span>
      <div class="status-pill"><div class="status-dot"></div> Connected</div>
    </div>
    <div class="mode-switch">
      <button type="button" class="mode-btn active" id="btnModeBulk" title="Hardware Roving & Bulk Mode (Prompt Quantity)">📦 Bulk Qty</button>
      <button type="button" class="mode-btn" id="btnModeRapid" title="Continuous 1x Rapid Scanning">⚡ Rapid</button>
    </div>
    <div class="header-actions">
      <button class="btn-icon" id="btnTorch" style="display:none">🔦 Light</button>
      <button class="btn-icon" id="btnFlip" style="display:none">🔄 Flip</button>
    </div>
  </header>

  <div class="main-content">
    <!-- Notice shown if opened on HTTP without getUserMedia capability -->
    <div id="httpNotice" class="notice-card" style="display: none;">
      <div class="notice-badge">⚡ Instant Scan Option</div>
      <div class="notice-title">Continuous Video Requires HTTPS</div>
      <p class="notice-desc">Mobile browsers restrict live camera video on local HTTP. Tap below to switch to HTTPS mode for continuous 60 FPS live scanning, or use the <strong>Instant Snap</strong> button below!</p>
      <a id="httpsSwitchBtn" href="#" class="btn-switch-https">👉 Switch to HTTPS (Live Video)</a>
      <div class="notice-sub">Note: If your browser shows a security warning on local Wi-Fi, tap <em>Advanced</em> &rarr; <em>Proceed</em>.</div>
    </div>

    <!-- Live Video Viewport (Active when camera API is supported) -->
    <div id="videoContainer" class="viewport" style="display: none;">
      <video id="video" playsinline autoplay muted></video>
      <div class="reticle">
        <div class="reticle-corner-bl"></div>
        <div class="reticle-corner-br"></div>
        <div class="scan-laser"></div>
      </div>
    </div>

    <!-- Snap Barcode Photo (Works on 100% of devices via native camera input) -->
    <div id="snapSection" class="snap-section">
      <label for="cameraFileInput" class="btn-snap-main">
        <svg class="camera-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
          <circle cx="12" cy="13" r="4"/>
        </svg>
        <span id="snapButtonText">Tap to Snap Barcode Photo</span>
      </label>
      <input type="file" id="cameraFileInput" accept="image/*" capture="environment" style="display:none;" />
      <div class="snap-hint" id="snapHint">Opens phone camera directly. Zero certificate setup required.</div>
    </div>

    <!-- Hardware Bulk Quantity Bottom Sheet Modal -->
    <div id="bottomSheetBackdrop" class="bottom-sheet-backdrop">
      <div class="bottom-sheet">
        <div class="sheet-handle"></div>
        <div class="sheet-header">
          <div style="flex:1;">
            <div id="sheetProductTitle" class="sheet-product-title">Scanning product…</div>
            <div class="sheet-product-meta">
              <span id="sheetBarcodeLabel" style="font-family:monospace; color:#94a3b8;">--</span>
              <span>•</span>
              <span id="sheetPriceTag" class="sheet-price-tag">₱0.00</span>
              <span id="sheetStockBadge" class="badge-stock">Checking stock…</span>
            </div>
          </div>
          <button type="button" class="btn-sheet-cancel" id="btnSheetClose" aria-label="Close">✕</button>
        </div>

        <!-- Wholesale Tier Banner (Conditional) -->
        <div id="sheetWholesaleBanner" class="wholesale-banner" style="display:none;">
          <span style="font-size:14px;">💡</span>
          <span id="sheetWholesaleText">Wholesale tier available</span>
        </div>

        <!-- Stepper Input -->
        <div class="qty-stepper-container">
          <button type="button" class="btn-stepper" id="btnQtyMinus" aria-label="Decrease quantity">−</button>
          <input type="text" inputmode="numeric" class="input-qty-display" id="sheetQtyInput" value="1" />
          <button type="button" class="btn-stepper" id="btnQtyPlus" aria-label="Increase quantity">+</button>
        </div>

        <!-- Hardware Quick Increment Chips -->
        <div class="quick-chips-grid">
          <button type="button" class="chip-btn" data-add="1">+1</button>
          <button type="button" class="chip-btn" data-add="5">+5</button>
          <button type="button" class="chip-btn" data-add="10">+10</button>
          <button type="button" class="chip-btn" data-add="25">+25</button>
          <button type="button" class="chip-btn" data-add="50">+50</button>
          <button type="button" class="chip-btn" data-add="100">+100</button>
        </div>

        <!-- Dynamic Subtotal Bar -->
        <div class="sheet-subtotal-bar">
          <span class="subtotal-label">Subtotal Estimate:</span>
          <span id="sheetSubtotalDisplay" class="subtotal-val">₱0.00</span>
        </div>

        <!-- Action Buttons -->
        <div class="sheet-actions">
          <button type="button" class="btn-sheet-cart" id="btnSheetAddToCart">
            <span>🛒</span>
            <span id="btnSheetCartText">Add to Cart</span>
          </button>
          <button type="button" class="btn-sheet-quote" id="btnSheetAddToQuote">
            <span>📋</span>
            <span>Quotation</span>
          </button>
        </div>
      </div>
    </div>

    <div class="feedback-toast" id="toast"></div>
  </div>

  <div class="controls-bar">
    <div class="tip-text" id="statusTip">Align barcode inside camera or tap Snap Photo above</div>
    <form class="controls-row" id="manualForm">
      <input type="text" class="input-code" id="manualInput" placeholder="Type barcode manually…" inputmode="numeric" />
      <button type="submit" class="btn-send">Send</button>
    </form>
  </div>

  <script>
    const urlParams = new URLSearchParams(window.location.search);
    const session = urlParams.get('session') || window.__TINDA_CONFIG__?.session || '';
    const video = document.getElementById('video');
    const videoContainer = document.getElementById('videoContainer');
    const httpNotice = document.getElementById('httpNotice');
    const httpsSwitchBtn = document.getElementById('httpsSwitchBtn');
    const snapSection = document.getElementById('snapSection');
    const snapButtonText = document.getElementById('snapButtonText');
    const snapHint = document.getElementById('snapHint');
    const cameraFileInput = document.getElementById('cameraFileInput');
    const toast = document.getElementById('toast');
    const btnTorch = document.getElementById('btnTorch');
    const btnFlip = document.getElementById('btnFlip');
    const statusTip = document.getElementById('statusTip');
    const manualForm = document.getElementById('manualForm');
    const manualInput = document.getElementById('manualInput');

    // Bottom Sheet & Mode Switcher Elements
    const btnModeBulk = document.getElementById('btnModeBulk');
    const btnModeRapid = document.getElementById('btnModeRapid');
    const bottomSheetBackdrop = document.getElementById('bottomSheetBackdrop');
    const sheetProductTitle = document.getElementById('sheetProductTitle');
    const sheetBarcodeLabel = document.getElementById('sheetBarcodeLabel');
    const sheetPriceTag = document.getElementById('sheetPriceTag');
    const sheetStockBadge = document.getElementById('sheetStockBadge');
    const sheetWholesaleBanner = document.getElementById('sheetWholesaleBanner');
    const sheetWholesaleText = document.getElementById('sheetWholesaleText');
    const sheetQtyInput = document.getElementById('sheetQtyInput');
    const btnQtyMinus = document.getElementById('btnQtyMinus');
    const btnQtyPlus = document.getElementById('btnQtyPlus');
    const sheetSubtotalDisplay = document.getElementById('sheetSubtotalDisplay');
    const btnSheetAddToCart = document.getElementById('btnSheetAddToCart');
    const btnSheetCartText = document.getElementById('btnSheetCartText');
    const btnSheetAddToQuote = document.getElementById('btnSheetAddToQuote');
    const btnSheetClose = document.getElementById('btnSheetClose');

    let currentStream = null;
    let currentTrack = null;
    let torchState = false;
    let facingMode = 'environment';
    let lastScanned = '';
    let lastScanTime = 0;
    let candidateCode = '';
    let candidateHits = 0;
    let isScanning = false;
    let scanCanvas = document.createElement('canvas');

    // Scanner Mode: 'bulk' (prompt quantity bottom sheet) vs 'rapid' (instant 1x)
    let scanMode = localStorage.getItem('tinda_scan_mode') || 'bulk';
    function updateModeButtons() {
      if (scanMode === 'rapid') {
        btnModeRapid.classList.add('active');
        btnModeBulk.classList.remove('active');
        statusTip.textContent = '⚡ Rapid Mode: Scans immediately add 1x to cart';
      } else {
        btnModeBulk.classList.add('active');
        btnModeRapid.classList.remove('active');
        statusTip.textContent = '📦 Hardware Mode: Prompt quantity & quotation on scan';
      }
    }
    updateModeButtons();

    btnModeBulk.addEventListener('click', () => {
      scanMode = 'bulk';
      localStorage.setItem('tinda_scan_mode', 'bulk');
      updateModeButtons();
      showToast('📦 Bulk Quantity Mode Active', 'info');
    });
    btnModeRapid.addEventListener('click', () => {
      scanMode = 'rapid';
      localStorage.setItem('tinda_scan_mode', 'rapid');
      updateModeButtons();
      showToast('⚡ 1x Rapid Mode Active', 'info');
    });

    let activeSheetBarcode = '';
    let activeProduct = null;
    let sheetOpen = false;

    // Official GS1 Modulo-10 Checksum Validator & Strict Format Verifier
    function isValidBarcode(text) {
      if (!text) return false;
      const clean = text.trim();
      if (clean.length < 4 || clean.length > 32) return false;

      // Retail linear barcodes with GS1 check digit (EAN-8, UPC-E/A, EAN-13, ITF-14)
      if (/^\d{8}$|^\d{12}$|^\d{13}$|^\d{14}$/.test(clean)) {
        let sum = 0;
        let multiplier = 3;
        for (let i = clean.length - 2; i >= 0; i--) {
          sum += (clean.charCodeAt(i) - 48) * multiplier;
          multiplier = multiplier === 3 ? 1 : 3;
        }
        const check = (10 - (sum % 10)) % 10;
        return check === (clean.charCodeAt(clean.length - 1) - 48);
      }

      // Pure digits 4-32 chars
      if (/^\d{4,32}$/.test(clean)) return true;

      // Alphanumeric barcodes (Code 128, Code 39, custom alphanumeric SKU)
      if (/^[A-Za-z0-9_-]{4,32}$/.test(clean)) return true;

      return false;
    }

    function triggerScanVisual() {
      const ret = document.querySelector('.reticle');
      if (ret) {
        ret.classList.add('scanned');
        setTimeout(() => ret.classList.remove('scanned'), 600);
      }
    }

    function playBeep() {
      try {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        const ctx = new AudioCtx();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(920, ctx.currentTime);
        gain.gain.setValueAtTime(0.3, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.1);
      } catch (e) {}
    }

    function playSuccessChime() {
      try {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        const ctx = new AudioCtx();
        const now = ctx.currentTime;
        const osc1 = ctx.createOscillator();
        const gain1 = ctx.createGain();
        osc1.frequency.setValueAtTime(1046, now);
        gain1.gain.setValueAtTime(0.25, now);
        gain1.gain.exponentialRampToValueAtTime(0.01, now + 0.12);
        osc1.connect(gain1);
        gain1.connect(ctx.destination);
        osc1.start(now);
        osc1.stop(now + 0.12);

        const osc2 = ctx.createOscillator();
        const gain2 = ctx.createGain();
        osc2.frequency.setValueAtTime(1318, now + 0.08);
        gain2.gain.setValueAtTime(0.3, now + 0.08);
        gain2.gain.exponentialRampToValueAtTime(0.01, now + 0.25);
        osc2.connect(gain2);
        gain2.connect(ctx.destination);
        osc2.start(now + 0.08);
        osc2.stop(now + 0.25);
      } catch (e) {}
    }

    function showToast(msg, type = 'success') {
      if (type === 'success') {
        if (navigator.vibrate) navigator.vibrate(80);
        triggerScanVisual();
        playBeep();
      }
      toast.textContent = msg;
      toast.className = 'feedback-toast show ' + type;
      setTimeout(() => {
        toast.className = 'feedback-toast';
      }, 2200);
    }

    function updateSubtotal() {
      const qty = Math.max(1, parseInt(sheetQtyInput.value, 10) || 1);
      btnSheetCartText.textContent = 'Add ' + qty + 'x to Cart';
      if (!activeProduct) {
        sheetSubtotalDisplay.textContent = '--';
        return;
      }
      let unitPriceC = activeProduct.price_c || 0;
      if (activeProduct.wholesale_min_qty && qty >= activeProduct.wholesale_min_qty && activeProduct.wholesale_price_c) {
        unitPriceC = activeProduct.wholesale_price_c;
      }
      const totalC = Math.round(unitPriceC * qty);
      sheetSubtotalDisplay.textContent = '₱' + (totalC / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }

    async function openQuantitySheet(barcode) {
      if (sheetOpen) return;
      sheetOpen = true;
      activeSheetBarcode = barcode;
      activeProduct = null;

      // Haptic and audio feedback
      playBeep();
      if (navigator.vibrate) navigator.vibrate([40, 50, 40]);
      triggerScanVisual();

      // Reset Sheet UI
      sheetProductTitle.textContent = 'Loading product…';
      sheetBarcodeLabel.textContent = barcode;
      sheetPriceTag.textContent = '₱0.00';
      sheetStockBadge.textContent = 'Checking stock…';
      sheetStockBadge.className = 'badge-stock';
      sheetWholesaleBanner.style.display = 'none';
      sheetQtyInput.value = '1';
      updateSubtotal();

      bottomSheetBackdrop.classList.add('show');

      // Fetch live product details from POS
      try {
        const res = await fetch('/api/product?barcode=' + encodeURIComponent(barcode));
        const data = await res.json();
        if (data && data.ok && data.product) {
          activeProduct = data.product;
          sheetProductTitle.textContent = activeProduct.name;
          sheetPriceTag.textContent = '₱' + activeProduct.price + (activeProduct.base_unit ? ' / ' + activeProduct.base_unit : '');
          const stock = activeProduct.stock ?? 0;
          if (stock <= 0) {
            sheetStockBadge.textContent = '❌ Out of stock';
            sheetStockBadge.className = 'badge-stock out';
          } else if (stock <= 5) {
            sheetStockBadge.textContent = '⚠️ ' + stock + ' ' + activeProduct.base_unit + ' left';
            sheetStockBadge.className = 'badge-stock low';
          } else {
            sheetStockBadge.textContent = '📦 ' + stock + ' ' + activeProduct.base_unit + ' in stock';
            sheetStockBadge.className = 'badge-stock';
          }

          if (activeProduct.wholesale_min_qty && activeProduct.wholesale_price) {
            sheetWholesaleBanner.style.display = 'flex';
            sheetWholesaleText.textContent = 'Wholesale: ₱' + activeProduct.wholesale_price + ' each for ' + activeProduct.wholesale_min_qty + '+ ' + activeProduct.base_unit;
          }
        } else {
          sheetProductTitle.textContent = 'Uncatalogued Item';
          sheetStockBadge.textContent = 'Not in catalog';
          sheetStockBadge.className = 'badge-stock low';
        }
      } catch (err) {
        sheetProductTitle.textContent = 'Barcode: ' + barcode;
        sheetStockBadge.textContent = 'Offline check';
      }
      updateSubtotal();

      // Select quantity input for quick editing
      setTimeout(() => {
        sheetQtyInput.focus();
        sheetQtyInput.select();
      }, 100);
    }

    function closeQuantitySheet() {
      bottomSheetBackdrop.classList.remove('show');
      sheetOpen = false;
      setTimeout(() => {
        sheetQtyInput.blur();
      }, 200);
    }

    btnQtyMinus.addEventListener('click', () => {
      const cur = parseInt(sheetQtyInput.value, 10) || 1;
      sheetQtyInput.value = Math.max(1, cur - 1);
      updateSubtotal();
    });

    btnQtyPlus.addEventListener('click', () => {
      const cur = parseInt(sheetQtyInput.value, 10) || 1;
      sheetQtyInput.value = Math.min(99999, cur + 1);
      updateSubtotal();
    });

    sheetQtyInput.addEventListener('input', () => {
      sheetQtyInput.value = sheetQtyInput.value.replace(/[^0-9]/g, '');
      updateSubtotal();
    });

    document.querySelectorAll('.chip-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const add = parseInt(btn.dataset.add, 10) || 1;
        const cur = parseInt(sheetQtyInput.value, 10) || 0;
        sheetQtyInput.value = Math.min(99999, cur + add);
        updateSubtotal();
      });
    });

    btnSheetAddToCart.addEventListener('click', () => {
      const qty = Math.max(1, parseInt(sheetQtyInput.value, 10) || 1);
      const code = activeSheetBarcode;
      closeQuantitySheet();
      sendScan(code, qty, 'cart');
    });

    btnSheetAddToQuote.addEventListener('click', () => {
      const qty = Math.max(1, parseInt(sheetQtyInput.value, 10) || 1);
      const code = activeSheetBarcode;
      closeQuantitySheet();
      sendScan(code, qty, 'quotation');
    });

    btnSheetClose.addEventListener('click', closeQuantitySheet);
    bottomSheetBackdrop.addEventListener('click', (e) => {
      if (e.target === bottomSheetBackdrop) closeQuantitySheet();
    });

    async function sendScan(code, quantity = 1, action = 'cart') {
      const trimmed = code.trim();
      if (!trimmed || !isValidBarcode(trimmed)) return;
      const safeQty = Math.max(1, Math.round(quantity));
      const actionName = action === 'quotation' ? 'Quotation' : 'Cart';
      const prodName = activeProduct && activeProduct.name ? activeProduct.name : trimmed;
      showToast('✅ Added ' + safeQty + 'x ' + prodName + ' to ' + actionName, 'success');
      playSuccessChime();
      if (navigator.vibrate) navigator.vibrate([60, 40, 60]);

      try {
        await fetch('/api/scan', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ barcode: trimmed, quantity: safeQty, action, session })
        });
      } catch (e) {}
    }

    function handleDetectedBarcode(code) {
      if (sheetOpen) return;
      const trimmed = code.trim();
      if (!trimmed || !isValidBarcode(trimmed)) return;

      if (scanMode === 'rapid') {
        sendScan(trimmed, 1, 'cart');
      } else {
        openQuantitySheet(trimmed);
      }
    }

    manualForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const code = manualInput.value.trim();
      if (!code) return;
      if (!isValidBarcode(code)) {
        showToast('⚠️ Invalid barcode format (min 4 characters)', 'error');
        return;
      }
      handleDetectedBarcode(code);
      manualInput.value = '';
    });

    // Native BarcodeDetector or ZXing Fallback - Linear Retail Formats Only
    let nativeDetector = null;
    if ('BarcodeDetector' in window) {
      try {
        nativeDetector = new BarcodeDetector({
          formats: ['ean_13', 'ean_8', 'upc_a', 'upc_e', 'code_128']
        });
      } catch (e) { nativeDetector = null; }
    }

    let zxingReader = null;
    if (window.ZXing) {
      try {
        const hints = new Map();
        hints.set(ZXing.DecodeHintType.TRY_HARDER, true);
        hints.set(ZXing.DecodeHintType.POSSIBLE_FORMATS, [
          ZXing.BarcodeFormat.EAN_13,
          ZXing.BarcodeFormat.EAN_8,
          ZXing.BarcodeFormat.UPC_A,
          ZXing.BarcodeFormat.UPC_E,
          ZXing.BarcodeFormat.CODE_128
        ]);
        zxingReader = new ZXing.MultiFormatReader();
        zxingReader.setHints(hints);
      } catch (e) { zxingReader = null; }
    }

    // Decode an image canvas using native detector and ZXing
    async function decodeCanvas(canvas) {
      // 1. Try Native BarcodeDetector
      if (nativeDetector) {
        try {
          const barcodes = await nativeDetector.detect(canvas);
          if (barcodes && barcodes.length > 0) {
            const val = barcodes[0].rawValue?.trim();
            if (val && isValidBarcode(val)) return val;
          }
        } catch (e) {}
      }

      // 2. Try ZXing MultiFormatReader
      if (zxingReader) {
        try {
          const lum = new ZXing.HTMLCanvasElementLuminanceSource(canvas, false);
          const res = zxingReader.decode(new ZXing.BinaryBitmap(new ZXing.HybridBinarizer(lum)));
          const txt = res.getText()?.trim();
          if (txt && isValidBarcode(txt)) return txt;
        } catch (e) {
          try {
            const lum2 = new ZXing.HTMLCanvasElementLuminanceSource(canvas, true);
            const res2 = zxingReader.decode(new ZXing.BinaryBitmap(new ZXing.GlobalHistogramBinarizer(lum2)));
            const txt2 = res2.getText()?.trim();
            if (txt2 && isValidBarcode(txt2)) return txt2;
          } catch (e2) {}
        } finally {
          zxingReader.reset();
        }
      }

      return null;
    }

    // Photo Snapshot Scanner Handler (Zero-Permission Fallback)
    cameraFileInput.addEventListener('change', async (e) => {
      const file = e.target.files && e.target.files[0];
      if (!file) return;

      showToast('Analyzing barcode photo…', 'info');
      try {
        const img = new Image();
        const objectUrl = URL.createObjectURL(file);
        img.onload = async () => {
          URL.revokeObjectURL(objectUrl);
          let w = img.naturalWidth || img.width;
          let h = img.naturalHeight || img.height;
          const maxDim = 1200;
          if (w > maxDim || h > maxDim) {
            if (w > h) { h = Math.round((h * maxDim) / w); w = maxDim; }
            else { w = Math.round((w * maxDim) / h); h = maxDim; }
          }
          scanCanvas.width = w;
          scanCanvas.height = h;
          const ctx = scanCanvas.getContext('2d', { willReadFrequently: true });
          if (ctx) {
            ctx.drawImage(img, 0, 0, w, h);
            const detected = await decodeCanvas(scanCanvas);
            if (detected) {
              handleDetectedBarcode(detected);
            } else {
              showToast('❌ No barcode detected. Please ensure barcode is well lit and snap again.', 'error');
            }
          }
          cameraFileInput.value = '';
        };
        img.onerror = () => {
          URL.revokeObjectURL(objectUrl);
          showToast('❌ Failed to process photo.', 'error');
          cameraFileInput.value = '';
        };
        img.src = objectUrl;
      } catch (err) {
        showToast('❌ Error: ' + err.message, 'error');
        cameraFileInput.value = '';
      }
    });

    async function startScanner() {
      if (currentStream) {
        currentStream.getTracks().forEach(t => t.stop());
      }
      try {
        const constraints = {
          video: {
            facingMode: { ideal: facingMode },
            width: { ideal: 1280, min: 640 },
            height: { ideal: 720, min: 480 }
          }
        };
        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        currentStream = stream;
        currentTrack = stream.getVideoTracks()[0];
        video.srcObject = stream;
        await video.play();

        videoContainer.style.display = 'flex';
        btnFlip.style.display = 'inline-flex';
        snapButtonText.textContent = '📸 Snap High-Res Photo (Optional)';
        snapHint.textContent = 'Use live video box above, or snap a photo for tiny barcodes.';
        statusTip.textContent = 'Align product barcode inside the green box to auto-scan';

        if (currentTrack && currentTrack.getCapabilities && currentTrack.getCapabilities().torch) {
          btnTorch.style.display = 'inline-flex';
        } else {
          btnTorch.style.display = 'none';
        }

        if (!isScanning) {
          isScanning = true;
          scanLoop();
        }
      } catch (err) {
        // Fallback gracefully to snap mode
        videoContainer.style.display = 'none';
        btnFlip.style.display = 'none';
        btnTorch.style.display = 'none';
        statusTip.textContent = 'Tap Snap Barcode Photo above to scan items';
      }
    }

    async function scanLoop() {
      if (!isScanning) return;
      if (video.readyState >= 2 && video.videoWidth > 0) {
        const vw = video.videoWidth;
        const vh = video.videoHeight;
        const rawW = Math.round(vw * 0.70);
        const rawH = Math.round(vh * 0.55);
        const cropX = Math.round((vw - rawW) / 2);
        const cropY = Math.round((vh - rawH) / 2);

        const scale = Math.min(1, 480 / rawW);
        const targetW = Math.round(rawW * scale);
        const targetH = Math.round(rawH * scale);

        scanCanvas.width = targetW;
        scanCanvas.height = targetH;
        const ctx = scanCanvas.getContext('2d', { willReadFrequently: true });
        if (ctx) {
          ctx.drawImage(video, cropX, cropY, rawW, rawH, 0, 0, targetW, targetH);
          const detected = await decodeCanvas(scanCanvas);
          if (detected) {
            if (detected === candidateCode) {
              candidateHits++;
            } else {
              candidateCode = detected;
              candidateHits = 1;
            }

            if (candidateHits >= 2) {
              const now = Date.now();
              if (detected !== lastScanned || now - lastScanTime > 3500) {
                lastScanned = detected;
                lastScanTime = now;
                handleDetectedBarcode(detected);
              }
            }
          } else {
            candidateHits = 0;
            candidateCode = '';
          }
        }
      }
      setTimeout(scanLoop, 40);
    }

    btnFlip.addEventListener('click', () => {
      facingMode = (facingMode === 'environment') ? 'user' : 'environment';
      startScanner();
    });

    btnTorch.addEventListener('click', async () => {
      if (currentTrack && currentTrack.applyConstraints) {
        torchState = !torchState;
        try {
          await currentTrack.applyConstraints({ advanced: [{ torch: torchState }] });
          btnTorch.textContent = torchState ? '🔦 Off' : '🔦 Light';
        } catch (e) {}
      }
    });

    // Detect secure context and getUserMedia capability
    const isHttps = window.location.protocol === 'https:';
    const hasGetUserMedia = !!(navigator.mediaDevices && typeof navigator.mediaDevices.getUserMedia === 'function');

    if (!isHttps) {
      httpNotice.style.display = 'flex';
      const targetHttpsPort = window.__TINDA_CONFIG__?.httpsPort || 3123;
      httpsSwitchBtn.href = 'https://' + window.location.hostname + ':' + targetHttpsPort + '/scanner' + window.location.search;
    }

    if (hasGetUserMedia) {
      startScanner();
    } else {
      videoContainer.style.display = 'none';
      snapButtonText.textContent = '📸 Tap to Snap Barcode Photo';
      snapHint.textContent = 'Direct camera snapshot. Works on all mobile browsers with zero setup!';
      statusTip.textContent = 'Tap Snap Barcode Photo above or type barcode below';
    }

    // Send heartbeat ping to POS every 3s
    setInterval(() => {
      fetch('/api/ping?session=' + session + '&device=' + encodeURIComponent(navigator.userAgent)).catch(() => {});
    }, 3000);

    // Initial ping
    fetch('/api/ping?session=' + session + '&device=' + encodeURIComponent(navigator.userAgent)).catch(() => {});
  </script>
</body>
</html>`
}

function isValidBarcodeServer(text: string): boolean {
  if (!text) return false
  const clean = text.trim()
  if (clean.length < 4 || clean.length > 32) return false

  // Standard retail linear barcodes with GS1 check digit (EAN-8, UPC-E/A, EAN-13, ITF-14)
  if (/^\d{8}$|^\d{12}$|^\d{13}$|^\d{14}$/.test(clean)) {
    let sum = 0
    let multiplier = 3
    for (let i = clean.length - 2; i >= 0; i--) {
      sum += (clean.charCodeAt(i) - 48) * multiplier
      multiplier = multiplier === 3 ? 1 : 3
    }
    const check = (10 - (sum % 10)) % 10
    return check === clean.charCodeAt(clean.length - 1) - 48
  }

  // Pure digits: 4 to 32 digits
  if (/^\d{4,32}$/.test(clean)) return true

  // Alphanumeric barcodes (Code 128, Code 39, custom alphanumeric SKU)
  if (/^[A-Za-z0-9_-]{4,32}$/.test(clean)) return true

  return false
}

function handleHttpRequest(req: http.IncomingMessage, res: http.ServerResponse): void {
  const protocol = (req.socket as { encrypted?: boolean }).encrypted ? 'https' : 'http'
  const host = req.headers.host || `127.0.0.1:${currentPort}`
  const url = new URL(req.url || '/', `${protocol}://${host}`)
  const pathname = url.pathname

  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') {
    res.writeHead(204)
    res.end()
    return
  }

  if (pathname === '/' || pathname === '/scanner') {
    res.writeHead(200, {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-cache, no-store, must-revalidate'
    })
    res.end(generateMobileHtml())
    return
  }

  if (pathname === '/zxing.min.js') {
    const bundle = getZxingBundle()
    if (bundle) {
      res.writeHead(200, {
        'Content-Type': 'application/javascript; charset=utf-8',
        'Cache-Control': 'public, max-age=86400'
      })
      res.end(bundle)
    } else {
      res.writeHead(404)
      res.end('/* ZXing not found */')
    }
    return
  }

  if (pathname === '/api/ping') {
    lastClientPing = Date.now()
    const userAgent = url.searchParams.get('device') || (req.headers['user-agent'] as string) || 'Smartphone'
    if (userAgent.includes('iPhone')) connectedDevice = 'iPhone'
    else if (userAgent.includes('Android')) connectedDevice = 'Android Phone'
    else connectedDevice = 'Mobile Device'

    notifyStatusChange()
    res.writeHead(200, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ ok: true, connected: true }))
    return
  }

  if (pathname === '/api/product') {
    const barcode = url.searchParams.get('barcode')?.trim() || ''
    if (!barcode) {
      res.writeHead(400, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ ok: false, error: 'Barcode parameter required' }))
      return
    }
    try {
      const db = getDb()
      if (db) {
        const p = findByBarcode(db, barcode) || findBySku(db, barcode)
        if (p) {
          res.writeHead(200, { 'Content-Type': 'application/json' })
          res.end(
            JSON.stringify({
              ok: true,
              product: {
                id: p.id,
                name: p.name,
                barcode: p.barcode,
                sku: p.sku,
                base_unit: p.base_unit || 'pc',
                price_c: p.default_price_c,
                price: (p.default_price_c / 100).toFixed(2),
                stock: p.stock,
                wholesale_price_c: p.wholesale_price_c,
                wholesale_price: p.wholesale_price_c ? (p.wholesale_price_c / 100).toFixed(2) : null,
                wholesale_min_qty: p.wholesale_min_qty || null
              }
            })
          )
          return
        }
      }
    } catch {
      // Vitest or headless environment without active db
    }
    res.writeHead(200, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ ok: false, error: 'Product not found' }))
    return
  }

  if (pathname === '/api/scan' && req.method === 'POST') {
    let body = ''
    req.on('data', (chunk) => {
      body += chunk
      if (body.length > 10000) req.destroy()
    })
    req.on('end', () => {
      try {
        const data = JSON.parse(body)
        const barcode = typeof data.barcode === 'string' ? data.barcode.trim() : ''
        const rawQty = typeof data.quantity === 'number' ? data.quantity : parseFloat(data.quantity)
        const quantity = Number.isFinite(rawQty) && rawQty > 0 ? Math.min(Math.max(1, Math.round(rawQty)), 99999) : 1
        const action = typeof data.action === 'string' && data.action === 'quotation' ? 'quotation' : 'cart'
        if (barcode && isValidBarcodeServer(barcode)) {
          lastClientPing = Date.now()
          notifyBarcodeScan(barcode, quantity, action)
          res.writeHead(200, { 'Content-Type': 'application/json' })
          res.end(JSON.stringify({ ok: true, barcode, quantity, action }))
          return
        }
      } catch {
        // Invalid JSON
      }
      res.writeHead(400, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ ok: false, error: 'Invalid barcode' }))
    })
    return
  }

  if (pathname === '/api/status') {
    res.writeHead(200, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify(getPhoneScannerStatus()))
    return
  }

  if (pathname === '/cfd' || pathname === '/display') {
    res.writeHead(200, {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-cache, no-store, must-revalidate'
    })
    res.end(generateCfdHtml())
    return
  }

  if (pathname === '/api/cfd') {
    if (req.method === 'POST') {
      let body = ''
      req.on('data', (chunk) => {
        body += chunk
        if (body.length > 50000) req.destroy()
      })
      req.on('end', () => {
        try {
          const data = JSON.parse(body)
          const updated = updateCfdState(data)
          res.writeHead(200, { 'Content-Type': 'application/json' })
          res.end(JSON.stringify(updated))
        } catch {
          res.writeHead(400, { 'Content-Type': 'application/json' })
          res.end(JSON.stringify({ ok: false, error: 'Invalid JSON' }))
        }
      })
      return
    }
    res.writeHead(200, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify(getCfdState()))
    return
  }

  if (pathname === '/api/qr') {
    const text = url.searchParams.get('text') || ''
    const size = parseInt(url.searchParams.get('size') || '260', 10)
    const svg = generateQrSvg(text, size)
    res.writeHead(200, { 'Content-Type': 'image/svg+xml; charset=utf-8' })
    res.end(svg)
    return
  }

  res.writeHead(404)
  res.end('Not Found')
}

export function generateCfdHtml(): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover">
  <title>TINDA POS — Customer Facing Display</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background: #090d16;
      color: #f8fafc;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      overflow-x: hidden;
      user-select: none;
    }
    header {
      background: #0e1526;
      border-bottom: 1px solid rgba(255, 255, 255, 0.08);
      padding: 16px 24px;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .store-info { display: flex; align-items: center; gap: 12px; }
    .store-badge {
      background: #10b981;
      color: #042f2e;
      font-weight: 800;
      padding: 4px 8px;
      border-radius: 6px;
      font-size: 13px;
      letter-spacing: 0.05em;
    }
    .store-name { font-size: 20px; font-weight: 700; color: #ffffff; }
    .status-pill {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      font-size: 12px;
      font-weight: 600;
      color: #10b981;
      background: rgba(16, 185, 129, 0.12);
      border: 1px solid rgba(16, 185, 129, 0.25);
      padding: 5px 12px;
      border-radius: 9999px;
    }
    .status-dot { width: 8px; height: 8px; border-radius: 50%; background: #10b981; animation: pulse 2s infinite; }
    @keyframes pulse { 0%, 100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.4; transform: scale(0.85); } }

    main { flex: 1; display: flex; flex-direction: column; padding: 20px; max-width: 1200px; margin: 0 auto; width: 100%; }

    /* IDLE VIEW */
    .view-idle {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      text-align: center;
      padding: 40px 20px;
    }
    .welcome-card {
      background: #101827;
      border: 1px solid rgba(255,255,255,0.08);
      border-radius: 24px;
      padding: 48px 36px;
      max-width: 520px;
      box-shadow: 0 20px 40px rgba(0,0,0,0.5);
    }
    .welcome-icon {
      width: 72px;
      height: 72px;
      border-radius: 20px;
      background: rgba(16, 185, 129, 0.15);
      color: #34d399;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 20px;
    }
    .welcome-title { font-size: 28px; font-weight: 800; color: #ffffff; margin-bottom: 8px; }
    .welcome-sub { font-size: 15px; color: #94a3b8; line-height: 1.5; }

    /* ACTIVE CART VIEW */
    .view-active {
      display: grid;
      grid-template-columns: 1fr 380px;
      gap: 20px;
      flex: 1;
      min-height: 0;
    }
    @media (max-width: 768px) {
      .view-active { grid-template-columns: 1fr; }
    }
    .cart-box {
      background: #101827;
      border: 1px solid rgba(255,255,255,0.08);
      border-radius: 18px;
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }
    .cart-header {
      padding: 14px 20px;
      background: #0f172a;
      border-bottom: 1px solid rgba(255,255,255,0.06);
      font-size: 13px;
      font-weight: 700;
      color: #94a3b8;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .cart-items {
      flex: 1;
      overflow-y: auto;
      padding: 12px 16px;
      display: flex;
      flex-direction: column;
      gap: 8px;
      max-height: 60vh;
    }
    .cart-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 12px 14px;
      background: #172033;
      border-radius: 12px;
      border: 1px solid rgba(255,255,255,0.04);
      animation: fadeIn 0.2s ease-out;
    }
    @keyframes fadeIn { from { opacity: 0; transform: translateY(-4px); } to { opacity: 1; transform: translateY(0); } }
    .item-info { min-width: 0; flex: 1; padding-right: 12px; }
    .item-name { font-size: 16px; font-weight: 600; color: #f8fafc; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .item-meta { font-size: 13px; color: #94a3b8; margin-top: 2px; }
    .item-subtotal { font-size: 17px; font-weight: 700; color: #34d399; }

    .summary-box {
      background: #101827;
      border: 1px solid rgba(255,255,255,0.08);
      border-radius: 18px;
      padding: 24px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      height: fit-content;
    }
    .summary-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;
      font-size: 14px;
      color: #94a3b8;
    }
    .summary-row.discount { color: #f59e0b; }
    .total-box {
      border-top: 1px solid rgba(255,255,255,0.08);
      padding-top: 16px;
      margin-top: 12px;
    }
    .total-label { font-size: 13px; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.05em; }
    .total-amount { font-size: 44px; font-weight: 900; color: #10b981; margin-top: 4px; line-height: 1; }

    /* PAYMENT VIEW */
    .view-payment {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      text-align: center;
      padding: 20px;
    }
    .qr-card {
      background: #101827;
      border: 1px solid rgba(255,255,255,0.1);
      border-radius: 24px;
      padding: 32px;
      max-width: 440px;
      width: 100%;
      box-shadow: 0 25px 50px rgba(0,0,0,0.6);
    }
    .qr-wrapper {
      background: #ffffff;
      padding: 14px;
      border-radius: 16px;
      display: inline-block;
      margin: 16px auto;
      box-shadow: 0 4px 12px rgba(0,0,0,0.2);
    }
    .qr-wrapper svg { display: block; max-width: 220px; height: auto; }
    .payment-badge {
      display: inline-block;
      padding: 6px 14px;
      border-radius: 8px;
      font-weight: 700;
      font-size: 14px;
      letter-spacing: 0.05em;
      margin-bottom: 8px;
    }
    .badge-gcash { background: #007dfe; color: #ffffff; }
    .badge-maya { background: #000000; color: #22c55e; border: 1px solid #22c55e; }
    .badge-maribank { background: linear-gradient(135deg, #FF6A00, #EE4D2D); color: #ffffff; }
    .badge-cash { background: #10b981; color: #042f2e; }
    .badge-bills { background: linear-gradient(135deg, #0284c7, #0369a1); color: #ffffff; }
    .badge-deposit { background: rgba(16, 185, 129, 0.2); color: #34d399; border: 1px solid rgba(16, 185, 129, 0.4); }
    .badge-withdraw { background: rgba(245, 158, 11, 0.2); color: #fbbf24; border: 1px solid rgba(245, 158, 11, 0.4); }

    /* SPECIAL HUB CARDS FOR BILLS & EWALLET */
    .view-hub {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 24px;
    }
    .hub-card {
      background: #101827;
      border: 1px solid rgba(255,255,255,0.1);
      border-radius: 24px;
      padding: 32px;
      max-width: 480px;
      width: 100%;
      box-shadow: 0 25px 50px rgba(0,0,0,0.6);
      animation: fadeIn 0.25s ease-out;
    }
    .hub-card-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 20px;
      padding-bottom: 16px;
      border-bottom: 1px solid rgba(255,255,255,0.08);
    }
    .hub-title { font-size: 22px; font-weight: 800; color: #ffffff; display: flex; align-items: center; gap: 8px; }
    .hub-account-box {
      background: #172033;
      border: 1px solid rgba(255,255,255,0.06);
      border-radius: 14px;
      padding: 14px 18px;
      margin-bottom: 18px;
    }
    .hub-account-label { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: #94a3b8; }
    .hub-account-val { font-size: 19px; font-weight: 800; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; color: #38bdf8; margin-top: 4px; word-break: break-all; }
    .hub-customer-name { font-size: 14px; font-weight: 600; color: #e2e8f0; margin-top: 6px; }
    .hub-breakdown-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 14px;
      color: #94a3b8;
      margin-bottom: 10px;
    }
    .hub-total-box {
      background: rgba(16, 185, 129, 0.08);
      border: 1px solid rgba(16, 185, 129, 0.25);
      border-radius: 16px;
      padding: 16px 20px;
      margin-top: 16px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .hub-total-label { font-size: 12px; font-weight: 700; text-transform: uppercase; color: #a7f3d0; letter-spacing: 0.05em; }
    .hub-total-val { font-size: 32px; font-weight: 900; color: #10b981; }

    /* COMPLETED VIEW */
    .view-completed {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      text-align: center;
      padding: 40px 20px;
    }
    .check-icon {
      width: 88px;
      height: 88px;
      border-radius: 50%;
      background: rgba(16, 185, 129, 0.2);
      color: #34d399;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 24px;
      animation: pop 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    }
    @keyframes pop { 0% { transform: scale(0.5); opacity: 0; } 100% { transform: scale(1); opacity: 1; } }
  </style>
</head>
<body>
  <header>
    <div class="store-info">
      <span class="store-badge">TINDA</span>
      <h1 id="store-name" class="store-name">TINDA POS</h1>
    </div>
    <div class="status-pill">
      <span class="status-dot"></span>
      <span id="conn-text">LIVE COUNTER</span>
    </div>
  </header>

  <main id="main-content">
    <div class="view-idle">
      <div class="welcome-card">
        <div class="welcome-icon">
          <svg width="36" height="36" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
          </svg>
        </div>
        <h2 class="welcome-title">Maligayang Pagdating!</h2>
        <p class="welcome-sub">Please present your items at the counter.<br>Items will appear here in real time as they are scanned.</p>
      </div>
    </div>
  </main>

  <script>
    function fmtMoney(c) {
      return '₱' + (Math.max(0, c || 0) / 100).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }

    let lastUpdated = 0;
    const mainEl = document.getElementById('main-content');
    const storeNameEl = document.getElementById('store-name');

    async function poll() {
      try {
        const res = await fetch('/api/cfd');
        if (!res.ok) return;
        const data = await res.json();
        if (data.updatedAt !== lastUpdated) {
          lastUpdated = data.updatedAt;
          render(data);
        }
      } catch (e) {
        // retry
      } finally {
        setTimeout(poll, 600);
      }
    }

    function render(data) {
      if (data.storeName && storeNameEl) storeNameEl.textContent = data.storeName;

      // ─── BILLS PAYMENT VIEW ──────────────────────────────────────
      if (data.mode === 'BILLS_PAYMENT' && data.billsPayload) {
        const bp = data.billsPayload;
        if (data.status === 'COMPLETED' || bp.status === 'COMPLETED') {
          mainEl.innerHTML = \`
            <div class="view-completed">
              <div class="welcome-card" style="max-width: 480px; width: 100%;">
                <div class="check-icon">
                  <svg width="44" height="44" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="3">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <span class="payment-badge badge-bills">BILLS PAYMENT COMPLETED</span>
                <h2 class="welcome-title" style="color: #34d399; margin-top: 8px;">Bayad sa Bill Nadawat!</h2>
                <p class="welcome-sub" style="margin-bottom: 20px;">Thank you! Your bill payment has been successfully processed.</p>
                <div style="background: #172033; padding: 18px 22px; border-radius: 14px; text-align: left;">
                  <div style="display:flex; justify-content:space-between; margin-bottom: 8px; font-size: 14px; color: #cbd5e1;">
                    <span>Biller / Provider:</span>
                    <strong style="color: #ffffff;">\${bp.biller}</strong>
                  </div>
                  <div style="display:flex; justify-content:space-between; margin-bottom: 8px; font-size: 13px; color: #94a3b8;">
                    <span>Account / Mobile:</span>
                    <strong style="color: #38bdf8; font-family: monospace;">\${bp.accountNo}</strong>
                  </div>
                  \${bp.customerName ? \`
                    <div style="display:flex; justify-content:space-between; margin-bottom: 8px; font-size: 13px; color: #94a3b8;">
                      <span>Customer:</span>
                      <span style="color: #f1f5f9;">\${bp.customerName}</span>
                    </div>
                  \` : ''}
                  <div style="display:flex; justify-content:space-between; margin-bottom: 8px; font-size: 14px; color: #cbd5e1; border-top: 1px solid rgba(255,255,255,0.08); padding-top: 10px;">
                    <span>Bill Amount:</span>
                    <span>\${fmtMoney(bp.amount_c)}</span>
                  </div>
                  <div style="display:flex; justify-content:space-between; margin-bottom: 8px; font-size: 14px; color: #94a3b8;">
                    <span>Convenience Fee:</span>
                    <span>\${fmtMoney(bp.fee_c)}</span>
                  </div>
                  <div style="display:flex; justify-content:space-between; font-size: 19px; color: #34d399; font-weight: 800; border-top: 1px solid rgba(255,255,255,0.08); padding-top: 10px;">
                    <span>Total Paid:</span>
                    <span>\${fmtMoney(bp.total_c)}</span>
                  </div>
                  \${bp.change_c !== undefined && bp.change_c >= 0 ? \`
                    <div style="display:flex; justify-content:space-between; font-size: 14px; color: #38bdf8; margin-top: 6px;">
                      <span>Sukli / Change:</span>
                      <strong>\${fmtMoney(bp.change_c)}</strong>
                    </div>
                  \` : ''}
                  \${bp.referenceNo ? \`
                    <div style="margin-top: 12px; font-size: 11px; color: #64748b; text-align: center;">
                      Reference No: \${bp.referenceNo}
                    </div>
                  \` : ''}
                </div>
              </div>
            </div>
          \`;
          return;
        }

        // Active / Pending Bills Payment View
        mainEl.innerHTML = \`
          <div class="view-hub">
            <div class="hub-card">
              <div class="hub-card-header">
                <div class="hub-title">
                  <span>⚡</span>
                  <span>\${bp.biller}</span>
                </div>
                <span class="payment-badge badge-bills">BILLS PAYMENT</span>
              </div>
              <div class="hub-account-box">
                <div class="hub-account-label">Account / Mobile Number</div>
                <div class="hub-account-val">\${bp.accountNo || '—'}</div>
                \${bp.customerName ? \`
                  <div class="hub-customer-name">👤 \${bp.customerName}</div>
                \` : ''}
              </div>
              <div>
                <div class="hub-breakdown-row">
                  <span>Bill Amount</span>
                  <strong style="color: #ffffff; font-size: 16px;">\${fmtMoney(bp.amount_c)}</strong>
                </div>
                <div class="hub-breakdown-row">
                  <span>Convenience Fee</span>
                  <strong style="color: #cbd5e1;">\${fmtMoney(bp.fee_c)}</strong>
                </div>
                \${bp.cashReceived_c ? \`
                  <div class="hub-breakdown-row" style="color: #38bdf8;">
                    <span>Cash Tendered</span>
                    <strong>\${fmtMoney(bp.cashReceived_c)}</strong>
                  </div>
                \` : ''}
                \${bp.change_c !== undefined && bp.change_c >= 0 ? \`
                  <div class="hub-breakdown-row" style="color: #34d399; font-weight: 700;">
                    <span>Change (Sukli)</span>
                    <strong>\${fmtMoney(bp.change_c)}</strong>
                  </div>
                \` : ''}
              </div>
              <div class="hub-total-box">
                <div class="hub-total-label">Total to Pay</div>
                <div class="hub-total-val">\${fmtMoney(bp.total_c)}</div>
              </div>
              <p style="font-size: 11px; color: #64748b; text-align: center; margin-top: 14px;">
                Please verify the biller name and account number before paying at the counter.
              </p>
            </div>
          </div>
        \`;
        return;
      }

      // ─── EWALLET VIEW ─────────────────────────────────────────────
      if (data.mode === 'EWALLET' && data.ewalletPayload) {
        const ep = data.ewalletPayload;
        const isGcash = (ep.channel || '').toUpperCase() === 'GCASH';
        const isMaya = (ep.channel || '').toUpperCase() === 'MAYA';
        const isMaribank = (ep.channel || '').toUpperCase() === 'MARIBANK';
        const badgeClass = isGcash ? 'badge-gcash' : isMaya ? 'badge-maya' : isMaribank ? 'badge-maribank' : 'badge-cash';
        const isCashIn = (ep.type || '').toUpperCase() === 'CASH_IN';

        if (data.status === 'COMPLETED' || ep.status === 'COMPLETED') {
          mainEl.innerHTML = \`
            <div class="view-completed">
              <div class="welcome-card" style="max-width: 480px; width: 100%;">
                <div class="check-icon">
                  <svg width="44" height="44" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="3">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div style="display:flex; justify-content:center; gap:6px; margin-bottom: 8px;">
                  <span class="payment-badge \${badgeClass}">\${ep.channel}</span>
                  <span class="payment-badge \${isCashIn ? 'badge-deposit' : 'badge-withdraw'}">\${isCashIn ? 'CASH IN' : 'CASH OUT'}</span>
                </div>
                <h2 class="welcome-title" style="color: #34d399;">Transaksyon Nahuman!</h2>
                <p class="welcome-sub" style="margin-bottom: 20px;">Thank you! Your e-wallet transaction is complete.</p>
                <div style="background: #172033; padding: 18px 22px; border-radius: 14px; text-align: left;">
                  \${ep.accountNo ? \`
                    <div style="display:flex; justify-content:space-between; margin-bottom: 8px; font-size: 14px; color: #94a3b8;">
                      <span>Account / Mobile:</span>
                      <strong style="color: #38bdf8; font-family: monospace;">\${ep.accountNo}</strong>
                    </div>
                  \` : ''}
                  \${ep.customerName ? \`
                    <div style="display:flex; justify-content:space-between; margin-bottom: 8px; font-size: 13px; color: #94a3b8;">
                      <span>Customer:</span>
                      <span style="color: #f1f5f9;">\${ep.customerName}</span>
                    </div>
                  \` : ''}
                  <div style="display:flex; justify-content:space-between; margin-bottom: 8px; font-size: 14px; color: #cbd5e1; border-top: 1px solid rgba(255,255,255,0.08); padding-top: 10px;">
                    <span>Amount:</span>
                    <span>\${fmtMoney(ep.amount_c)}</span>
                  </div>
                  <div style="display:flex; justify-content:space-between; margin-bottom: 8px; font-size: 14px; color: #94a3b8;">
                    <span>Service Fee:</span>
                    <span>\${fmtMoney(ep.fee_c)}</span>
                  </div>
                  <div style="display:flex; justify-content:space-between; font-size: 19px; color: #34d399; font-weight: 800; border-top: 1px solid rgba(255,255,255,0.08); padding-top: 10px;">
                    <span>\${isCashIn ? 'Total to Pay:' : 'Total Payout:'}</span>
                    <span>\${fmtMoney(ep.total_c)}</span>
                  </div>
                  \${ep.referenceNo ? \`
                    <div style="margin-top: 12px; font-size: 11px; color: #64748b; text-align: center;">
                      Reference No: \${ep.referenceNo}
                    </div>
                  \` : ''}
                </div>
              </div>
            </div>
          \`;
          return;
        }

        // Active / Pending E-Wallet View
        mainEl.innerHTML = \`
          <div class="view-hub">
            <div class="hub-card">
              <div class="hub-card-header">
                <div class="hub-title">
                  <span class="payment-badge \${badgeClass}" style="margin: 0;">\${ep.channel}</span>
                  <span class="payment-badge \${isCashIn ? 'badge-deposit' : 'badge-withdraw'}" style="margin: 0;">\${isCashIn ? 'CASH IN / DEPOSIT' : 'CASH OUT / WITHDRAWAL'}</span>
                </div>
              </div>
              <div class="hub-account-box">
                <div class="hub-account-label">Target Mobile / Account Number</div>
                <div class="hub-account-val">\${ep.accountNo || '—'}</div>
                \${ep.customerName ? \`
                  <div class="hub-customer-name">👤 \${ep.customerName}</div>
                \` : ''}
              </div>
              <div>
                <div class="hub-breakdown-row">
                  <span>Transaction Amount</span>
                  <strong style="color: #ffffff; font-size: 16px;">\${fmtMoney(ep.amount_c)}</strong>
                </div>
                <div class="hub-breakdown-row">
                  <span>Convenience / Service Fee</span>
                  <strong style="color: #cbd5e1;">\${fmtMoney(ep.fee_c)}</strong>
                </div>
              </div>
              <div class="hub-total-box">
                <div class="hub-total-label">\${isCashIn ? 'Total to Pay' : 'Total Cash Payout'}</div>
                <div class="hub-total-val">\${fmtMoney(ep.total_c)}</div>
              </div>
              \${data.qrSvg ? \`
                <div style="text-align: center; margin-top: 16px;">
                  <div class="qr-wrapper">
                    \${data.qrSvg}
                  </div>
                  <p style="font-size: 13px; color: #cbd5e1; font-weight: 600;">Scan with \${ep.channel} App</p>
                </div>
              \` : ''}
              <p style="font-size: 11px; color: #64748b; text-align: center; margin-top: 14px;">
                Please double check the mobile number and name before completing transaction.
              </p>
            </div>
          </div>
        \`;
        return;
      }

      if (data.status === 'COMPLETED') {
        mainEl.innerHTML = \`
          <div class="view-completed">
            <div class="welcome-card">
              <div class="check-icon">
                <svg width="44" height="44" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="3">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 class="welcome-title" style="color: #34d399;">Salamat sa Pagpamalit!</h2>
              <p class="welcome-sub" style="margin-bottom: 24px;">Thank you for your purchase!</p>
              <div style="background: #172033; padding: 16px 20px; border-radius: 12px; text-align: left; margin-top: 12px;">
                <div style="display:flex; justify-content:space-between; margin-bottom: 8px; font-size: 15px; color: #cbd5e1;">
                  <span>Total Amount:</span>
                  <strong style="color: #ffffff;">\${fmtMoney(data.total_c)}</strong>
                </div>
                \${data.amount_tendered_c ? \`
                  <div style="display:flex; justify-content:space-between; margin-bottom: 8px; font-size: 14px; color: #94a3b8;">
                    <span>Amount Paid:</span>
                    <span>\${fmtMoney(data.amount_tendered_c)}</span>
                  </div>
                \` : ''}
                \${data.change_c !== undefined ? \`
                  <div style="display:flex; justify-content:space-between; font-size: 16px; color: #34d399; font-weight: bold; border-top: 1px solid rgba(255,255,255,0.08); padding-top: 8px;">
                    <span>Change:</span>
                    <span>\${fmtMoney(data.change_c)}</span>
                  </div>
                \` : ''}
              </div>
            </div>
          </div>
        \`;
        return;
      }

      if (data.status === 'PAYMENT') {
        const isGcash = (data.paymentMethod || '').toUpperCase() === 'GCASH';
        const isMaya = (data.paymentMethod || '').toUpperCase() === 'MAYA';
        const isMaribank = (data.paymentMethod || '').toUpperCase() === 'MARIBANK';
        const badgeClass = isGcash ? 'badge-gcash' : isMaya ? 'badge-maya' : isMaribank ? 'badge-maribank' : 'badge-cash';

        mainEl.innerHTML = \`
          <div class="view-payment">
            <div class="qr-card">
              <span class="payment-badge \${badgeClass}">\${data.paymentMethod || 'PAYMENT'}</span>
              <div style="margin: 8px 0 16px;">
                <p style="font-size: 14px; color: #94a3b8; text-transform: uppercase;">Total Amount to Pay</p>
                <p style="font-size: 40px; font-weight: 900; color: #10b981; line-height: 1.1;">\${fmtMoney(data.total_c)}</p>
              </div>
              \${data.qrSvg ? \`
                <div class="qr-wrapper">
                  \${data.qrSvg}
                </div>
                <p style="font-size: 15px; color: #f1f5f9; font-weight: 600;">Scan with your \${isGcash ? 'GCash' : isMaya ? 'Maya' : isMaribank ? 'MariBank' : 'e-Wallet'} App</p>
                <p style="font-size: 12px; color: #94a3b8; margin-top: 4px;">Dynamic QR generated for exact amount</p>
              \` : \`
                <div style="background: #172033; padding: 24px; border-radius: 16px; margin: 16px 0;">
                  <p style="font-size: 16px; color: #e2e8f0;">Please proceed with cash payment at the counter.</p>
                  \${data.amount_tendered_c ? \`
                    <p style="font-size: 14px; color: #94a3b8; margin-top: 8px;">Tendered: \${fmtMoney(data.amount_tendered_c)}</p>
                  \` : ''}
                </div>
              \`}
            </div>
          </div>
        \`;
        return;
      }

      if (!data.items || data.items.length === 0) {
        mainEl.innerHTML = \`
          <div class="view-idle">
            <div class="welcome-card">
              <div class="welcome-icon">
                <svg width="36" height="36" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
              </div>
              <h2 class="welcome-title">Maligayang Pagdating!</h2>
              <p class="welcome-sub">Please present your items at the counter.<br>Items will appear here in real time as they are scanned.</p>
            </div>
          </div>
        \`;
        return;
      }

      let itemsHtml = '';
      for (const item of data.items) {
        itemsHtml += \`
          <div class="cart-item">
            <div class="item-info">
              <div class="item-name" title="\${item.name}">\${item.name}</div>
              <div class="item-meta">\${item.qty} \${item.unit_name || 'pc'} × \${fmtMoney(item.price_c)}</div>
            </div>
            <div class="item-subtotal">\${fmtMoney(item.subtotal_c)}</div>
          </div>
        \`;
      }

      mainEl.innerHTML = \`
        <div class="view-active">
          <div class="cart-box">
            <div class="cart-header">Items in Cart (\${data.items.length})</div>
            <div class="cart-items" id="cart-list">\${itemsHtml}</div>
          </div>
          <div class="summary-box">
            <div>
              <div class="summary-row">
                <span>Subtotal</span>
                <strong>\${fmtMoney(data.subtotal_c)}</strong>
              </div>
              \${data.discount_c > 0 ? \`
                <div class="summary-row discount">
                  <span>Discount</span>
                  <strong>-\${fmtMoney(data.discount_c)}</strong>
                </div>
              \` : ''}
              \${data.customerName ? \`
                <div class="summary-row" style="color: #38bdf8;">
                  <span>Customer</span>
                  <span>\${data.customerName}</span>
                </div>
              \` : ''}
            </div>
            <div class="total-box">
              <div class="total-label">Total to Pay</div>
              <div class="total-amount">\${fmtMoney(data.total_c)}</div>
            </div>
          </div>
        </div>
      \`;

      const list = document.getElementById('cart-list');
      if (list) list.scrollTop = list.scrollHeight;
    }

    if ('wakeLock' in navigator) {
      try { navigator.wakeLock.request('screen'); } catch(e) {}
    }

    poll();
  </script>
</body>
</html>`
}


function startHttpsServerHelper(port: number, attempt = 0): void {
  if (attempt >= 5) {
    console.warn('[phoneScanner] Could not bind HTTPS server after 5 attempts; HTTPS scanner disabled.')
    httpsServer = null
    return
  }
  try {
    const srv = https.createServer({ key: SSL_KEY, cert: SSL_CERT }, (req, res) => handleHttpRequest(req, res))
    srv.on('error', (err: NodeJS.ErrnoException) => {
      if (err.code === 'EADDRINUSE' && attempt < 5) {
        try { srv.close() } catch { /* ignore */ }
        startHttpsServerHelper(port + 1, attempt + 1)
      } else {
        console.error('[phoneScanner] HTTPS Server error:', err.message)
      }
    })
    srv.listen(port, '0.0.0.0', () => {
      currentHttpsPort = port
      httpsServer = srv
    })
  } catch (e) {
    console.error('[phoneScanner] Failed to initialize HTTPS server:', e)
  }
}

export function startPhoneScannerService(preferredPort = 3122, preferredHttpsPort = 3123, attempt = 0): Promise<number> {
  return new Promise((resolve) => {
    if (httpServer && httpsServer) {
      resolve(currentPort)
      return
    }

    if (attempt >= 5) {
      console.warn('[phoneScanner] Could not bind HTTP server after 5 attempts; phone scanner disabled.')
      resolve(0)
      return
    }

    sessionToken = Math.random().toString(36).slice(2, 10)
    currentPort = preferredPort
    currentHttpsPort = preferredHttpsPort

    // 1. Create HTTP Server
    httpServer = http.createServer((req, res) => handleHttpRequest(req, res))

    httpServer.on('error', (err: NodeJS.ErrnoException) => {
      if (err.code === 'EADDRINUSE' && attempt < 5) {
        try { httpServer?.close() } catch { /* ignore */ }
        httpServer = null
        void startPhoneScannerService(preferredPort + 1, preferredHttpsPort + 1, attempt + 1).then(resolve)
      } else {
        console.error('[phoneScanner] HTTP Server error:', err.message)
        try { httpServer?.close() } catch { /* ignore */ }
        httpServer = null
        resolve(0)
      }
    })

    // 2. Create HTTPS Server with safe helper and full error listeners
    if (!httpsServer) {
      startHttpsServerHelper(currentHttpsPort, 0)
    }

    httpServer.listen(currentPort, '0.0.0.0', () => {
      resolve(currentPort)
      notifyStatusChange()
    })
  })
}

export function stopPhoneScannerService(): void {
  if (httpServer) {
    try { httpServer.close() } catch { /* ignore */ }
    httpServer = null
  }
  if (httpsServer) {
    try { httpsServer.close() } catch { /* ignore */ }
    httpsServer = null
  }
}
