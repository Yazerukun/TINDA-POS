import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import type { StoreTelemetrySummary } from '@shared/types'
import {
  useNotificationDrawer,
  getCriticalAlertCount
} from '../../../stores/notificationDrawer'
import {
  generateStoreBriefing,
  askAdvisorQuestion
} from '../../../services/aiStoreAdvisor'

describe('Notification Drawer & AI Advisor Integration', () => {
  const sampleTelemetry: StoreTelemetrySummary = {
    business_date: '2026-10-13',
    generated_at: '2026-10-13T10:00:00Z',
    net_sales_c: 500000, // ₱5,000.00
    gross_sales_c: 550000, // ₱5,500.00
    discount_c: 30000, // ₱300.00
    refund_total_c: 20000, // ₱200.00
    void_count: 3,
    void_total_c: 120000, // ₱1,200.00
    transaction_count: 40,
    cash_c: 350000, // ₱3,500.00
    gcash_c: 100000, // ₱1,000.00
    maya_c: 50000, // ₱500.00
    maribank_c: 0,
    utang_c: 0,
    expected_drawer_cash_c: 400000, // ₱4,000.00
    opening_float_c: 100000, // ₱1,000.00
    cash_in_c: 10000, // ₱100.00
    cash_out_c: 20000, // ₱200.00
    cash_expenses_c: 30000, // ₱300.00
    cash_refunds_c: 10000, // ₱100.00
    top_products: [
      { product_id: 1, name: 'San Miguel Pale Pilsen', qty_sold: 20, revenue_c: 140000 },
      { product_id: 2, name: 'Lucky Me Pancit Canton', qty_sold: 15, revenue_c: 30000 }
    ],
    critically_low_stock: [
      { id: 1, name: 'Alaska Condensed Milk', stock: 2, reorder_level: 10, unit: 'can' },
      { id: 2, name: 'Great Taste White', stock: 4, reorder_level: 20, unit: 'twin-pack' }
    ],
    expiring_products: [
      {
        product_id: 10,
        name: 'Gardenia Loaf Bread',
        expiration_date: '2026-10-16',
        quantity: 4,
        days_until_expiration: 3,
        unit: 'loaf'
      }
    ],
    unpaid_utang_due: {
      total_outstanding_c: 180000, // ₱1,800.00
      customer_count: 5,
      over_limit_count: 1,
      top_debtors: [
        { customer_id: 101, name: 'Kuya Boyet', balance_c: 120000, credit_limit_c: 100000, is_over_limit: true }
      ]
    },
    last_sync_at: '2026-10-13T09:45:00Z'
  }

  beforeEach(() => {
    useNotificationDrawer.setState({
      isOpen: false,
      activeTab: 'advisor',
      language: 'en',
      telemetry: null,
      isLoading: false,
      lastFetchedAt: null
    })
  })

  it('calculates total critical alerts correctly (low stock + expiring + voids)', () => {
    // 2 low stock + 1 expiring + 3 voids = 6 critical alerts
    const count = getCriticalAlertCount(sampleTelemetry)
    expect(count).toBe(6)
  })

  it('returns 0 critical alerts when telemetry is null', () => {
    expect(getCriticalAlertCount(null)).toBe(0)
  })

  it('toggles drawer open and closed state cleanly', () => {
    const store = useNotificationDrawer.getState()
    expect(store.isOpen).toBe(false)

    store.openDrawer('financials')
    expect(useNotificationDrawer.getState().isOpen).toBe(true)
    expect(useNotificationDrawer.getState().activeTab).toBe('financials')

    store.toggleDrawer()
    expect(useNotificationDrawer.getState().isOpen).toBe(false)

    store.toggleDrawer()
    expect(useNotificationDrawer.getState().isOpen).toBe(true)

    store.closeDrawer()
    expect(useNotificationDrawer.getState().isOpen).toBe(false)
  })

  it('updates language and persists to localStorage', () => {
    const store = useNotificationDrawer.getState()
    store.setLanguage('tl')
    expect(useNotificationDrawer.getState().language).toBe('tl')

    store.setLanguage('en')
    expect(useNotificationDrawer.getState().language).toBe('en')
  })

  it('fetches telemetry summary from window.api.telemetry', async () => {
    const getSummaryMock = vi.fn().mockResolvedValue(sampleTelemetry)
    const win: any = (globalThis as any).window || {}
    win.api = {
      ...(win.api || {}),
      telemetry: {
        getSummary: getSummaryMock
      }
    }
    ;(globalThis as any).window = win

    const store = useNotificationDrawer.getState()
    await store.fetchTelemetry()

    expect(getSummaryMock).toHaveBeenCalled()
    expect(useNotificationDrawer.getState().telemetry).toEqual(sampleTelemetry)
    expect(useNotificationDrawer.getState().isLoading).toBe(false)
  })

  it('generates executive briefings in English and Tagalog with accurate values', () => {
    const enBriefing = generateStoreBriefing(sampleTelemetry, 'en')
    expect(enBriefing.language).toBe('en')
    expect(enBriefing.salesPerformance.summary).toContain('₱5,000.00')
    expect(enBriefing.cashSecurity.summary).toContain('₱4,000.00')
    expect(enBriefing.overallStatus).toBe('ACTION_REQUIRED') // 3 voids triggers ACTION_REQUIRED

    const tlBriefing = generateStoreBriefing(sampleTelemetry, 'tl')
    expect(tlBriefing.language).toBe('tl')
    expect(tlBriefing.statusBadge).toContain('Kailangan ng Aksyon')
    expect(tlBriefing.salesPerformance.summary).toContain('₱5,000.00')
  })

  it('answers quick questions with zero hallucinations and accurate navigation actions', () => {
    const resEn = askAdvisorQuestion('What are our best selling products today?', sampleTelemetry, 'en')
    expect(resEn.intent).toBe('TOP_PRODUCTS')
    expect(resEn.action?.page).toBe('reports')

    const resTl = askAdvisorQuestion('Magkano ang inaasahang pera sa kaha?', sampleTelemetry, 'tl')
    expect(resTl.intent).toBe('CASH_DRAWER')
    expect(resTl.answer).toContain('₱4,000.00')

    const resUtang = askAdvisorQuestion('May overdue utang ba?', sampleTelemetry, 'en')
    expect(resUtang.intent).toBe('UTANG')
    expect(resUtang.action?.page).toBe('utang')
  })
})
