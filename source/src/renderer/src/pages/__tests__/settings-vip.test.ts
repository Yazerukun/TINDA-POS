import * as React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { Settings } from '../Settings'

describe('Settings page — Centered Layout & VIP Licensing Integration', () => {
  afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
  })

  it('renders centered Settings container with Community Edition and Maya payment details', () => {
    const fakeWindow = {
      api: {
        settings: {
          get: vi.fn().mockResolvedValue({
            store_name: 'Aling Nena Store',
            owner_name: 'Nena Santos',
            address: 'Manila',
            phone: '09123456789',
            tin: '',
            default_low_stock: 5,
            allow_negative_inventory: false,
            default_tax_c: 0,
            receipt_header: '',
            receipt_title: 'ALing NENA',
            receipt_show_app_name: true,
            receipt_footer: 'Salamat po!'
          })
        },
        license: {
          getStatus: vi.fn().mockResolvedValue({
            tier: 'COMMUNITY',
            isVip: false,
            machineId: 'TNDA-1111-2222-3333-4444',
            activatedAt: null,
            customerName: null,
            licenseKey: null,
            statusMessage: 'Community Edition'
          })
        },
        app: {
          startup: vi.fn().mockResolvedValue({ supported: true, enabled: false }),
          openExternal: vi.fn().mockResolvedValue(undefined)
        }
      }
    }
    vi.stubGlobal('window', fakeWindow)

    const html = renderToStaticMarkup(React.createElement(Settings))

    // Centered layout verification
    expect(html).toContain('max-w-4xl mx-auto')
    expect(html).toContain('justify-center')

    // VIP upgrade banner and tabs
    expect(html).toContain('VIP Pro License')
    expect(html).toContain('Community Edition')
    expect(html).toContain('Upgrade to VIP (₱500)')
    expect(html).toContain('09912255156')
  })
})
