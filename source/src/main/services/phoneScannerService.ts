import http from 'node:http'
import os from 'node:os'
import fs from 'node:fs'
import { BrowserWindow } from 'electron'

export interface PhoneScannerStatus {
  running: boolean
  port: number
  ip: string
  url: string
  connected: boolean
  device?: string
}

let server: http.Server | null = null
let currentPort = 3112
let sessionToken = ''
let lastClientPing = 0
let connectedDevice = ''
let zxingBundleCache: Buffer | null = null

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

export function getPhoneScannerStatus(): PhoneScannerStatus {
  const isConnected = !!server && Date.now() - lastClientPing < 8000
  return {
    running: !!server,
    port: currentPort,
    ip: getLocalIpAddress(),
    url: getScannerUrl(),
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

const MOBILE_HTML = `<!DOCTYPE html>
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
    .viewport {
      flex: 1;
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
    .feedback-toast {
      position: absolute;
      top: 24px;
      left: 16px;
      right: 16px;
      background: rgba(16, 185, 129, 0.95);
      color: #ffffff;
      padding: 14px 18px;
      border-radius: 12px;
      box-shadow: 0 10px 25px rgba(0, 0, 0, 0.4);
      font-size: 14px;
      font-weight: 700;
      text-align: center;
      z-index: 30;
      transform: translateY(-80px);
      opacity: 0;
      transition: transform 0.25s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.25s ease;
      pointer-events: none;
    }
    .feedback-toast.show {
      transform: translateY(0);
      opacity: 1;
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
    .error-banner {
      position: absolute;
      inset: 20px;
      background: rgba(15, 23, 42, 0.95);
      border: 1px solid #ef4444;
      border-radius: 14px;
      padding: 24px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      text-align: center;
      gap: 12px;
      z-index: 40;
    }
    .error-title { color: #f87171; font-weight: 700; font-size: 16px; }
    .error-desc { color: #cbd5e1; font-size: 13px; line-height: 1.5; }
  </style>
  <script src="/zxing.min.js"></script>
</head>
<body>
  <header>
    <div class="brand">
      <span>TINDA POS</span>
      <div class="status-pill"><div class="status-dot"></div> Connected</div>
    </div>
    <div class="header-actions">
      <button class="btn-icon" id="btnTorch" style="display:none">🔦 Light</button>
      <button class="btn-icon" id="btnFlip">🔄 Flip</button>
    </div>
  </header>

  <div class="viewport">
    <video id="video" playsinline autoplay muted></video>
    <div class="reticle">
      <div class="reticle-corner-bl"></div>
      <div class="reticle-corner-br"></div>
      <div class="scan-laser"></div>
    </div>
    <div class="feedback-toast" id="toast"></div>
    <div class="error-banner" id="errorBanner" style="display: none;">
      <div class="error-title">Camera Permission Needed</div>
      <div class="error-desc" id="errorMsg">Please grant camera permissions in your mobile browser to scan barcodes into TINDA POS.</div>
      <button class="btn-send" style="padding:10px 24px;margin-top:8px" onclick="startScanner()">Try Again</button>
    </div>
  </div>

  <div class="controls-bar">
    <div class="tip-text">Align product barcode inside the green box to auto-scan</div>
    <form class="controls-row" id="manualForm">
      <input type="text" class="input-code" id="manualInput" placeholder="Type barcode manually…" inputmode="numeric" />
      <button type="submit" class="btn-send">Send</button>
    </form>
  </div>

  <script>
    const urlParams = new URLSearchParams(window.location.search);
    const session = urlParams.get('session') || '';
    const video = document.getElementById('video');
    const toast = document.getElementById('toast');
    const btnTorch = document.getElementById('btnTorch');
    const btnFlip = document.getElementById('btnFlip');
    const errorBanner = document.getElementById('errorBanner');
    const errorMsg = document.getElementById('errorMsg');
    const manualForm = document.getElementById('manualForm');
    const manualInput = document.getElementById('manualInput');

    let currentStream = null;
    let currentTrack = null;
    let torchState = false;
    let facingMode = 'environment';
    let lastScanned = '';
    let lastScanTime = 0;
    let isScanning = false;
    let scanCanvas = document.createElement('canvas');

    // Official GS1 Modulo-10 Checksum Validator
    function isValidBarcode(text) {
      if (!text) return false;
      const clean = text.trim();
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
      return clean.length >= 3;
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

    function showFeedback(code) {
      if (navigator.vibrate) navigator.vibrate(80);
      playBeep();
      toast.textContent = '✅ Scanned: ' + code;
      toast.classList.add('show');
      setTimeout(() => toast.classList.remove('show'), 1600);
    }

    async function sendScan(code) {
      const trimmed = code.trim();
      if (!trimmed) return;
      showFeedback(trimmed);
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
      sendScan(code);
      manualInput.value = '';
    });

    // Native BarcodeDetector or ZXing Fallback
    let nativeDetector = null;
    if ('BarcodeDetector' in window) {
      try {
        nativeDetector = new BarcodeDetector({
          formats: ['ean_13', 'ean_8', 'upc_a', 'upc_e', 'code_128', 'qr_code']
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
          ZXing.BarcodeFormat.CODE_128,
          ZXing.BarcodeFormat.QR_CODE
        ]);
        zxingReader = new ZXing.MultiFormatReader();
        zxingReader.setHints(hints);
      } catch (e) { zxingReader = null; }
    }

    async function startScanner() {
      errorBanner.style.display = 'none';
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

        // Check torch capability
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
        errorBanner.style.display = 'flex';
        errorMsg.textContent = 'Camera error: ' + (err.message || err);
      }
    }

    async function scanLoop() {
      if (!isScanning) return;
      if (video.readyState >= 2 && video.videoWidth > 0) {
        let detected = null;

        // 1. Try Native BarcodeDetector (fastest, hardware accelerated)
        if (nativeDetector) {
          try {
            const barcodes = await nativeDetector.detect(video);
            if (barcodes && barcodes.length > 0) {
              const val = barcodes[0].rawValue?.trim();
              if (val && isValidBarcode(val)) detected = val;
            }
          } catch (e) {}
        }

        // 2. Try ZXing fallback if native detector didn't find or is unsupported
        if (!detected && zxingReader) {
          try {
            const vw = video.videoWidth;
            const vh = video.videoHeight;
            // Crop center 70% and scale to max 480px width
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
              const lum = new ZXing.HTMLCanvasElementLuminanceSource(scanCanvas, false);
              try {
                const res = zxingReader.decode(new ZXing.BinaryBitmap(new ZXing.HybridBinarizer(lum)));
                const txt = res.getText()?.trim();
                if (txt && isValidBarcode(txt)) detected = txt;
              } catch (e) {}
            }
            zxingReader.reset();
          } catch (e) {}
        }

        if (detected) {
          const now = Date.now();
          if (detected !== lastScanned || now - lastScanTime > 1800) {
            lastScanned = detected;
            lastScanTime = now;
            sendScan(detected);
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

    // Send heartbeat ping to POS every 3s
    setInterval(() => {
      fetch('/api/ping?session=' + session + '&device=' + encodeURIComponent(navigator.userAgent)).catch(() => {});
    }, 3000);

    // Initial ping & launch
    fetch('/api/ping?session=' + session + '&device=' + encodeURIComponent(navigator.userAgent)).catch(() => {});
    startScanner();
  </script>
</body>
</html>`

export function startPhoneScannerService(preferredPort = 3112): Promise<number> {
  return new Promise((resolve) => {
    if (server) {
      resolve(currentPort)
      return
    }

    sessionToken = Math.random().toString(36).slice(2, 10)
    currentPort = preferredPort

    server = http.createServer((req, res) => {
      const url = new URL(req.url || '/', `http://127.0.0.1:${currentPort}`)
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
        res.end(MOBILE_HTML)
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
        const userAgent = url.searchParams.get('device') || req.headers['user-agent'] || 'Smartphone'
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
            if (barcode) {
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
    })

    server.on('error', (err: NodeJS.ErrnoException) => {
      if (err.code === 'EADDRINUSE') {
        currentPort++
        server?.close()
        server = null
        void startPhoneScannerService(currentPort).then(resolve)
      } else {
        console.error('[phoneScanner] Server error:', err)
        resolve(0)
      }
    })

    server.listen(currentPort, '0.0.0.0', () => {
      resolve(currentPort)
      notifyStatusChange()
    })
  })
}

export function stopPhoneScannerService(): void {
  if (server) {
    server.close()
    server = null
  }
}
