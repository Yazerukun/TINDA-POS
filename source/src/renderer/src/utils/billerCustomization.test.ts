import { describe, it, expect, beforeEach } from 'vitest'
import {
  DEFAULT_BILLER_PRESETS,
  loadBillerPresets,
  saveBillerPresets,
  resetBillerPresets,
  BILLER_CUSTOMIZATION_STORAGE_KEY,
  BillerPreset
} from './billerCustomization'

describe('Biller Customization Utility Suite', () => {
  const store: Record<string, string> = {}
  const listeners: Record<string, Function[]> = {}

  beforeEach(() => {
    Object.keys(store).forEach((k) => delete store[k])
    Object.keys(listeners).forEach((k) => delete listeners[k])

    globalThis.localStorage = {
      getItem: (key: string) => store[key] ?? null,
      setItem: (key: string, val: string) => {
        store[key] = String(val)
      },
      removeItem: (key: string) => {
        delete store[key]
      },
      clear: () => {
        Object.keys(store).forEach((k) => delete store[k])
      },
      length: 0,
      key: () => null
    } as unknown as Storage

    globalThis.window = {
      addEventListener: (type: string, cb: Function) => {
        listeners[type] = listeners[type] || []
        listeners[type].push(cb)
      },
      removeEventListener: (type: string, cb: Function) => {
        if (!listeners[type]) return
        listeners[type] = listeners[type].filter((fn) => fn !== cb)
      },
      dispatchEvent: (e: any) => {
        const cbs = listeners[e.type] || []
        cbs.forEach((fn) => fn(e))
        return true
      }
    } as unknown as Window & typeof globalThis
  })

  it('loads default biller presets when storage is empty', () => {
    const presets = loadBillerPresets()
    expect(presets.length).toBe(DEFAULT_BILLER_PRESETS.length)
    expect(presets.some((p) => p.name === 'Meralco')).toBe(true)
    expect(presets.some((p) => p.name === 'Maynilad / Manila Water')).toBe(true)
    expect(presets.some((p) => p.isEload)).toBe(true)
  })

  it('allows renaming billers and changing default fees while preserving E-Load', () => {
    const customList: BillerPreset[] = [
      { id: 'util-beneco', name: 'BENECO Electric', category: 'UTILITIES', defaultFee: 25, icon: '⚡' },
      { id: 'water-mcwd', name: 'MCWD Cebu Water', category: 'WATER', defaultFee: 20, icon: '💧' }
    ]

    saveBillerPresets(customList)

    const reloaded = loadBillerPresets()
    expect(reloaded.some((p) => p.name === 'BENECO Electric' && p.defaultFee === 25)).toBe(true)
    expect(reloaded.some((p) => p.name === 'MCWD Cebu Water' && p.defaultFee === 20)).toBe(true)
    // Protected E-Load networks must still be present
    expect(reloaded.some((p) => p.name.includes('Globe') && p.isEload)).toBe(true)
    expect(reloaded.some((p) => p.name.includes('Smart') && p.isEload)).toBe(true)
  })

  it('restores default presets when resetBillerPresets is called', () => {
    saveBillerPresets([
      { id: 'custom-1', name: 'Custom Utility', category: 'UTILITIES', defaultFee: 30, icon: '⚡' }
    ])

    expect(loadBillerPresets().some((p) => p.name === 'Custom Utility')).toBe(true)

    resetBillerPresets()
    const restored = loadBillerPresets()
    expect(restored.some((p) => p.name === 'Meralco')).toBe(true)
    expect(restored.some((p) => p.name === 'Custom Utility')).toBe(false)
  })
})
