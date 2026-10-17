/**
 * Universal Hardware Barcode Scanner Listener
 *
 * Supports all USB HID Keyboard Wedge scanners (1D/2D, Honeywell, Zebra, Netum, generic)
 * by intercepting high-speed keystroke bursts (< 50ms per character) followed by Enter.
 * Allows cashier to scan anywhere on the screen without clicking the search box first.
 */

export interface ScannerListenerOptions {
  maxIntervalMs?: number
  minBarcodeLength?: number
  onScan: (barcode: string) => void
  onDeviceDetected?: () => void
  enabled?: boolean
}

export function createScannerListener(options: ScannerListenerOptions): (e: KeyboardEvent) => void {
  const maxInterval = options.maxIntervalMs ?? 120
  const minLength = options.minBarcodeLength ?? 3
  let buffer = ''
  let lastKeyTime = 0
  let lastScanCompleteTime = 0

  return function handleKeyDown(e: KeyboardEvent): void {
    if (options.enabled === false) return

    const now = Date.now()
    const elapsed = now - lastKeyTime
    lastKeyTime = now

    // If key is Enter or Tab, check if accumulated buffer qualifies as a scanner burst
    if (e.key === 'Enter' || e.key === 'Tab') {
      if (buffer.length >= minLength && elapsed <= Math.max(maxInterval * 3, 350)) {
        const scannedCode = buffer.trim()
        buffer = ''
        if (scannedCode) {
          lastScanCompleteTime = now
          e.preventDefault()
          e.stopPropagation()
          options.onDeviceDetected?.()
          options.onScan(scannedCode)
        }
      } else {
        // Shield against trailing CR+LF or secondary scanner Enter within 450ms
        if (now - lastScanCompleteTime < 450) {
          e.preventDefault()
          e.stopPropagation()
        }
        buffer = ''
      }
      return
    }

    // Ignore single modifier keys (Shift, Ctrl, Alt, Meta)
    if (e.key.length > 1) {
      if (elapsed > maxInterval) {
        buffer = ''
      }
      return
    }

    // If typing speed is too slow (human typing), reset buffer
    if (elapsed > maxInterval && buffer.length > 0) {
      buffer = ''
    }

    buffer += e.key
  }
}

export function isUsbScannerSupported(): boolean {
  return typeof navigator !== 'undefined' && ('usb' in navigator || 'hid' in navigator)
}

/**
 * Universal Web Audio Synthesizer Beep for barcode scanner auditory feedback.
 */
export function playScanBeep(freq = 1050, durationSec = 0.08): void {
  try {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    const ctx = new AudioCtx()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'sine'
    osc.frequency.setValueAtTime(freq, ctx.currentTime)
    gain.gain.setValueAtTime(0.25, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + durationSec)
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.start()
    osc.stop(ctx.currentTime + durationSec)
  } catch {
    // Non-blocking
  }
}

/**
 * Official GS1 Modulo-10 Checksum Validation for retail barcodes.
 * Works universally across EAN-13, UPC-A, EAN-8, and GTIN-14.
 * Prevents false-positive partial matches and corrupted frame decodes.
 */
export function isValidBarcode(text: string): boolean {
  if (!text) return false
  const clean = text.trim()

  // Standard GS1 retail barcodes (EAN-8, UPC-A, EAN-13, GTIN-14)
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

  // Non-GS1 retail barcodes (Code 128, store SKUs, internal codes):
  // Must be clean alphanumeric (minimum 4 characters) without whitespace or random symbols
  if (/^[A-Za-z0-9_-]{4,32}$/.test(clean)) {
    // Reject short pure-letter words (< 4 chars) to prevent OCR text noise
    if (/^[A-Za-z]{1,3}$/.test(clean)) return false
    return true
  }

  return false
}
