import http from 'node:http'
import https from 'node:https'
import os from 'node:os'
import fs from 'node:fs'
import { BrowserWindow } from 'electron'

export interface PhoneScannerStatus {
  running: boolean
  port: number
  httpsPort: number
  ip: string
  url: string
  httpsUrl: string
  connected: boolean
  device?: string
}

let httpServer: http.Server | null = null
let httpsServer: https.Server | null = null
let currentPort = 3112
let currentHttpsPort = 3113
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

export function getLocalIpAddress(): string {
  const interfaces = os.networkInterfaces()
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name] || []) {
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address
      }
    }
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

export function getPhoneScannerStatus(): PhoneScannerStatus {
  const isConnected = (!!httpServer || !!httpsServer) && Date.now() - lastClientPing < 8000
  return {
    running: !!httpServer || !!httpsServer,
    port: currentPort,
    httpsPort: currentHttpsPort,
    ip: getLocalIpAddress(),
    url: getScannerUrl(),
    httpsUrl: getScannerHttpsUrl(),
    connected: isConnected,
    device: isConnected ? connectedDevice : undefined
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

function notifyBarcodeScan(barcode: string): void {
  try {
    const wins = typeof BrowserWindow?.getAllWindows === 'function' ? BrowserWindow.getAllWindows() : []
    for (const win of wins) {
      if (!win.isDestroyed()) {
        win.webContents.send('phoneScanner:scan', { barcode })
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

    // Official GS1 Modulo-10 Checksum Validator & Strict Format Verifier
    function isValidBarcode(text) {
      if (!text) return false;
      const clean = text.trim();
      if (clean.length < 4 || clean.length > 32) return false;

      // Retail linear barcodes with GS1 check digit (EAN-8, UPC-E/A, EAN-13, ITF-14)
      if (/^\\d{8}$|^\\d{12}$|^\\d{13}$|^\\d{14}$/.test(clean)) {
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
      if (/^\\d{4,32}$/.test(clean)) return true;

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
      }, 2000);
    }

    async function sendScan(code) {
      const trimmed = code.trim();
      if (!trimmed || !isValidBarcode(trimmed)) return;
      showToast('✅ Scanned: ' + trimmed, 'success');
      try {
        await fetch('/api/scan', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ barcode: trimmed, session: session })
        });
      } catch (e) {}
    }

    manualForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const code = manualInput.value.trim();
      if (!code) return;
      if (!isValidBarcode(code)) {
        showToast('⚠️ Invalid barcode format (min 4 characters)', 'error');
        return;
      }
      sendScan(code);
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
              sendScan(detected);
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
                sendScan(detected);
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
      const targetHttpsPort = window.__TINDA_CONFIG__?.httpsPort || 3113;
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
        if (barcode && isValidBarcodeServer(barcode)) {
          lastClientPing = Date.now()
          notifyBarcodeScan(barcode)
          res.writeHead(200, { 'Content-Type': 'application/json' })
          res.end(JSON.stringify({ ok: true, barcode }))
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

  res.writeHead(404)
  res.end('Not Found')
}

export function startPhoneScannerService(preferredPort = 3112, preferredHttpsPort = 3113): Promise<number> {
  return new Promise((resolve) => {
    if (httpServer && httpsServer) {
      resolve(currentPort)
      return
    }

    sessionToken = Math.random().toString(36).slice(2, 10)
    currentPort = preferredPort
    currentHttpsPort = preferredHttpsPort

    // 1. Create HTTP Server
    httpServer = http.createServer((req, res) => handleHttpRequest(req, res))

    httpServer.on('error', (err: NodeJS.ErrnoException) => {
      if (err.code === 'EADDRINUSE') {
        currentPort++
        httpServer?.close()
        httpServer = null
        void startPhoneScannerService(currentPort, currentHttpsPort).then(resolve)
      } else {
        console.error('[phoneScanner] HTTP Server error:', err)
        resolve(0)
      }
    })

    // 2. Create HTTPS Server for secure context (getUserMedia)
    try {
      httpsServer = https.createServer(
        {
          key: SSL_KEY,
          cert: SSL_CERT
        },
        (req, res) => handleHttpRequest(req, res)
      )

      httpsServer.on('error', (err: NodeJS.ErrnoException) => {
        if (err.code === 'EADDRINUSE') {
          currentHttpsPort++
          httpsServer?.close()
          httpsServer = null
          // Restart HTTPS on new port
          try {
            httpsServer = https.createServer({ key: SSL_KEY, cert: SSL_CERT }, (req, res) => handleHttpRequest(req, res))
            httpsServer.listen(currentHttpsPort, '0.0.0.0')
          } catch (e) {
            console.error('[phoneScanner] HTTPS fallback error:', e)
          }
        } else {
          console.error('[phoneScanner] HTTPS Server error:', err)
        }
      })

      httpsServer.listen(currentHttpsPort, '0.0.0.0', () => {
        // HTTPS running
      })
    } catch (e) {
      console.error('[phoneScanner] Failed to initialize HTTPS server:', e)
    }

    httpServer.listen(currentPort, '0.0.0.0', () => {
      resolve(currentPort)
      notifyStatusChange()
    })
  })
}

export function stopPhoneScannerService(): void {
  if (httpServer) {
    httpServer.close()
    httpServer = null
  }
  if (httpsServer) {
    httpsServer.close()
    httpsServer = null
  }
}
