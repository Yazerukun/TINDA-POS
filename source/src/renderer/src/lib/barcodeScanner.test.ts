import { describe, expect, it, vi } from 'vitest'
import { createScannerListener, isUsbScannerSupported, isValidBarcode } from './barcodeScanner'

describe('Universal Barcode Scanner Burst Listener', () => {
  it('triggers onScan when rapid keystrokes (<50ms) are followed by Enter', () => {
    const onScan = vi.fn()
    const listener = createScannerListener({
      maxIntervalMs: 50,
      minBarcodeLength: 3,
      onScan
    })

    let currentTime = 1000
    vi.spyOn(Date, 'now').mockImplementation(() => currentTime)

    const simulateKey = (key: string, advanceMs: number) => {
      currentTime += advanceMs
      const event = {
        key,
        preventDefault: vi.fn(),
        stopPropagation: vi.fn()
      } as unknown as KeyboardEvent
      listener(event)
      return event
    }

    // High speed burst simulating USB HID Scanner: 4800016644225 + Enter
    simulateKey('4', 0)
    simulateKey('8', 10)
    simulateKey('0', 10)
    simulateKey('0', 15)
    simulateKey('0', 8)
    simulateKey('1', 12)
    const enterEvent = simulateKey('Enter', 10)

    expect(onScan).toHaveBeenCalledWith('480001')
    expect(enterEvent.preventDefault).toHaveBeenCalled()
  })

  it('resets buffer when keystrokes are too slow (human typing)', () => {
    const onScan = vi.fn()
    const listener = createScannerListener({
      maxIntervalMs: 50,
      minBarcodeLength: 3,
      onScan
    })

    let currentTime = 1000
    vi.spyOn(Date, 'now').mockImplementation(() => currentTime)

    const simulateKey = (key: string, advanceMs: number) => {
      currentTime += advanceMs
      const event = {
        key,
        preventDefault: vi.fn(),
        stopPropagation: vi.fn()
      } as unknown as KeyboardEvent
      listener(event)
      return event
    }

    // Human typing slowly (> 50ms)
    simulateKey('a', 0)
    simulateKey('b', 120) // slow
    simulateKey('c', 150) // slow
    simulateKey('Enter', 200)

    expect(onScan).not.toHaveBeenCalled()
  })

  it('ignores barcodes shorter than minBarcodeLength', () => {
    const onScan = vi.fn()
    const listener = createScannerListener({
      maxIntervalMs: 50,
      minBarcodeLength: 5,
      onScan
    })

    let currentTime = 1000
    vi.spyOn(Date, 'now').mockImplementation(() => currentTime)

    const simulateKey = (key: string, advanceMs: number) => {
      currentTime += advanceMs
      const event = {
        key,
        preventDefault: vi.fn(),
        stopPropagation: vi.fn()
      } as unknown as KeyboardEvent
      listener(event)
      return event
    }

    simulateKey('1', 0)
    simulateKey('2', 10)
    simulateKey('Enter', 10)

    expect(onScan).not.toHaveBeenCalled()
  })

  it('does nothing when enabled is false', () => {
    const onScan = vi.fn()
    const listener = createScannerListener({
      enabled: false,
      onScan
    })

    const event = {
      key: '1',
      preventDefault: vi.fn(),
      stopPropagation: vi.fn()
    } as unknown as KeyboardEvent

    listener(event)
    expect(onScan).not.toHaveBeenCalled()
  })

  it('supports wireless phone scanner app bursts (e.g. 70-90ms interval)', () => {
    const onScan = vi.fn()
    const listener = createScannerListener({
      minBarcodeLength: 3,
      onScan
    })

    let currentTime = 1000
    vi.spyOn(Date, 'now').mockImplementation(() => currentTime)

    const simulateKey = (key: string, advanceMs: number) => {
      currentTime += advanceMs
      const event = {
        key,
        preventDefault: vi.fn(),
        stopPropagation: vi.fn()
      } as unknown as KeyboardEvent
      listener(event)
      return event
    }

    // Wireless phone scanner: 80ms interval
    simulateKey('4', 0)
    simulateKey('8', 80)
    simulateKey('0', 75)
    simulateKey('0', 85)
    simulateKey('1', 80)
    simulateKey('Enter', 80)

    expect(onScan).toHaveBeenCalledWith('48001')
  })

  it('checks isUsbScannerSupported without throwing', () => {
    expect(typeof isUsbScannerSupported()).toBe('boolean')
  })

  it('validates standard EAN-13 retail barcodes with Modulo-10 checksum', () => {
    // Valid Philippine grocery barcodes (verified GS1 check digits)
    expect(isValidBarcode('4800016644818')).toBe(true)
    expect(isValidBarcode('4800016644832')).toBe(true)

    // Corrupted or misread EAN-13 (wrong check digit)
    expect(isValidBarcode('4800016644819')).toBe(false)
    expect(isValidBarcode('4800016644800')).toBe(false)
  })

  it('validates UPC-A and EAN-8 retail barcodes correctly', () => {
    // Valid UPC-A
    expect(isValidBarcode('012345678905')).toBe(true)
    expect(isValidBarcode('012345678909')).toBe(false) // invalid

    // Valid EAN-8
    expect(isValidBarcode('40123455')).toBe(true)
    expect(isValidBarcode('40123459')).toBe(false) // invalid
  })

  it('rejects empty, short, or invalid barcode noise', () => {
    expect(isValidBarcode('')).toBe(false)
    expect(isValidBarcode('12')).toBe(false)
    expect(isValidBarcode('A')).toBe(false)
    // Code 128 / general barcodes with min length 3
    expect(isValidBarcode('BOX-01')).toBe(true)
  })
})
