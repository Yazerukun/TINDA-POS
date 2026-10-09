import { describe, it, expect, beforeEach } from 'vitest'
import {
  DEFAULT_SPEED_KEYS,
  getStoredSpeedKeys,
  saveSpeedKeys,
  resetSpeedKeysToDefault,
  SPEED_KEY_COLORS
} from '../utils/speedKeys'

describe('Speed Keys (Fast Buttons) System', () => {
  const store: Record<string, string> = {}

  beforeEach(() => {
    Object.keys(store).forEach((k) => delete store[k])
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
  })

  it('provides default speed keys prioritizing Yelo, Yosi, Candy, and Sando Bag', () => {
    const keys = getStoredSpeedKeys()
    expect(keys.length).toBeGreaterThanOrEqual(4)
    expect(keys[0]!.name).toContain('Yelo')
    expect(keys[0]!.price_c).toBe(500)
    expect(keys[1]!.name).toContain('Yosi')
    expect(keys[1]!.price_c).toBe(1000)
    expect(keys[2]!.name).toContain('Candy')
    expect(keys[2]!.price_c).toBe(100)
    expect(keys[3]!.name).toContain('Sando Bag')
    expect(keys[3]!.price_c).toBe(200)
  })

  it('persists customized speed keys to storage and reloads accurately', () => {
    const custom = [
      {
        id: 'k1',
        name: 'Cold Water Bottle',
        price_c: 1500,
        color: 'cyan' as const,
        unit_name: 'bottle',
        default_qty: 1
      },
      {
        id: 'k2',
        name: 'Instant Noodles Cooked',
        price_c: 2500,
        color: 'amber' as const,
        unit_name: 'bowl',
        default_qty: 1
      }
    ]

    saveSpeedKeys(custom)
    const reloaded = getStoredSpeedKeys()
    expect(reloaded).toHaveLength(2)
    expect(reloaded[0]!.name).toBe('Cold Water Bottle')
    expect(reloaded[0]!.price_c).toBe(1500)
    expect(reloaded[1]!.name).toBe('Instant Noodles Cooked')
    expect(reloaded[1]!.price_c).toBe(2500)
  })

  it('resets back to default Yelo, Yosi, Candy when requested', () => {
    saveSpeedKeys([])
    expect(getStoredSpeedKeys()).toEqual(DEFAULT_SPEED_KEYS)

    resetSpeedKeysToDefault()
    const def = getStoredSpeedKeys()
    expect(def[0]!.name).toContain('Yelo')
    expect(def[1]!.name).toContain('Yosi')
  })

  it('has comprehensive color styles with high-contrast text and border', () => {
    expect(SPEED_KEY_COLORS.cyan).toBeDefined()
    expect(SPEED_KEY_COLORS.amber).toBeDefined()
    expect(SPEED_KEY_COLORS.rose).toBeDefined()
    expect(SPEED_KEY_COLORS.emerald).toBeDefined()
    expect(SPEED_KEY_COLORS.indigo).toBeDefined()
    expect(SPEED_KEY_COLORS.violet).toBeDefined()
    expect(SPEED_KEY_COLORS.slate).toBeDefined()
  })
})
