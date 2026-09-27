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
  enabled?: boolean
}

export function createScannerListener(options: ScannerListenerOptions): (e: KeyboardEvent) => void {
  const maxInterval = options.maxIntervalMs ?? 50
  const minLength = options.minBarcodeLength ?? 3
  let buffer = ''
  let lastKeyTime = 0

  return function handleKeyDown(e: KeyboardEvent): void {
    if (options.enabled === false) return

    const now = Date.now()
    const elapsed = now - lastKeyTime
    lastKeyTime = now

    // If key is Enter, check if accumulated buffer qualifies as a scanner burst
    if (e.key === 'Enter') {
      if (buffer.length >= minLength && elapsed <= maxInterval * 2) {
        const scannedCode = buffer.trim()
        buffer = ''
        if (scannedCode) {
          e.preventDefault()
          e.stopPropagation()
          options.onScan(scannedCode)
        }
      } else {
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
