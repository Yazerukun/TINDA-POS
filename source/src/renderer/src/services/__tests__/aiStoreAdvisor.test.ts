import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import type { StoreTelemetrySummary } from '@shared/types'
import {
  generateStoreBriefing,
  answerStoreQuestion,
  formatCurrencyForSpeech,
  sanitizeTextForSpeech,
  speakAdvisorBriefing,
  stopAdvisorSpeech,
  isAdvisorSpeaking
} from '../aiStoreAdvisor'

describe('AI Store Advisor Service', () => {
  const mockTelemetry: StoreTelemetrySummary = {
    business_date: '2026-10-13',
    generated_at: '2026-10-13T10:00:00Z',
    net_sales_c: 450000, // ₱4,500.00
    gross_sales_c: 480000, // ₱4,800.00
    discount_c: 20000, // ₱200.00
    refund_total_c: 10000, // ₱100.00
    void_count: 2,
    void_total_c: 150000, // ₱1,500.00
    transaction_count: 35,
    cash_c: 300000, // ₱3,000.00
    gcash_c: 100000, // ₱1,000.00
    maya_c: 50000, // ₱500.00
    maribank_c: 0,
    utang_c: 0,
    expected_drawer_cash_c: 350000, // ₱3,500.00
    opening_float_c: 100000, // ₱1,000.00
    cash_in_c: 0,
    cash_out_c: 20000, // ₱200.00
    cash_expenses_c: 20000, // ₱200.00
    cash_refunds_c: 10000, // ₱100.00
    top_products: [
      { product_id: 1, name: 'San Miguel Pale Pilsen', qty_sold: 24, revenue_c: 156000 },
      { product_id: 2, name: 'Kopiko Blanca', qty_sold: 18, revenue_c: 27000 }
    ],
    critically_low_stock: [
      { id: 10, name: 'Egg (Large)', stock: 3, reorder_level: 10, unit: 'tray' },
      { id: 11, name: 'Sugar 1kg', stock: 1, reorder_level: 5, unit: 'pack' }
    ],
    expiring_products: [
      {
        product_id: 20,
        name: 'Fresh Milk 1L',
        expiration_date: '2026-10-15',
        quantity: 5,
        days_until_expiration: 2,
        unit: 'bottle'
      }
    ],
    unpaid_utang_due: {
      total_outstanding_c: 250000, // ₱2,500.00
      customer_count: 4,
      over_limit_count: 1,
      top_debtors: [
        { customer_id: 1, name: 'Mang Kanor', balance_c: 120000, credit_limit_c: 100000, is_over_limit: true },
        { customer_id: 2, name: 'Aling Bebang', balance_c: 80000, credit_limit_c: 100000, is_over_limit: false }
      ]
    },
    last_sync_at: '2026-10-13T09:30:00Z'
  }

  describe('formatCurrencyForSpeech & sanitizeTextForSpeech', () => {
    it('formats exact currency for English and Tagalog speech', () => {
      expect(formatCurrencyForSpeech(125000, 'en')).toBe('1,250 pesos')
      expect(formatCurrencyForSpeech(125050, 'en')).toBe('1,250 pesos and 50 cents')
      expect(formatCurrencyForSpeech(125000, 'tl')).toBe('1,250 piso')
      expect(formatCurrencyForSpeech(125050, 'tl')).toBe('1,250 piso at 50 sentimos')
    })

    it('sanitizes text by stripping markdown and replacing peso symbols', () => {
      const sanitizedEn = sanitizeTextForSpeech('**Net Sales:** ₱1,500.00 today!', 'en')
      expect(sanitizedEn).toBe('Net Sales: 1,500.00 pesos today!')

      const sanitizedTl = sanitizeTextForSpeech('# Benta: ₱500 sa kaha', 'tl')
      expect(sanitizedTl).toBe('Benta: 500 piso sa kaha')
    })
  })

  describe('generateStoreBriefing', () => {
    it('builds an executive briefing in English with strict ground truth', () => {
      const briefing = generateStoreBriefing(mockTelemetry, 'en')

      expect(briefing.language).toBe('en')
      expect(briefing.storeDate).toBe('2026-10-13')
      expect(briefing.overallStatus).toBe('ACTION_REQUIRED') // over_limit_count > 0 & low stocks
      expect(briefing.salesPerformance.title).toBe('Sales Performance')
      expect(briefing.salesPerformance.bulletPoints[0]).toContain('₱4,500.00 across 35 transactions')
      expect(briefing.cashSecurity.bulletPoints[0]).toContain('₱3,500.00')
      expect(briefing.inventoryAlerts.bulletPoints[0]).toContain('Egg (Large)')
      expect(briefing.inventoryAlerts.bulletPoints[1]).toContain('Fresh Milk 1L')
      expect(briefing.actionItems.bulletPoints.length).toBeGreaterThan(0)
      expect(briefing.speechScript).toContain('Executive Store Briefing')
      expect(briefing.speechScript).toContain('4,500 pesos')
    })

    it('builds a respectful and clear executive briefing in Tagalog', () => {
      const briefing = generateStoreBriefing(mockTelemetry, 'tl')

      expect(briefing.language).toBe('tl')
      expect(briefing.storeDate).toBe('2026-10-13')
      expect(briefing.overallStatus).toBe('ACTION_REQUIRED')
      expect(briefing.salesPerformance.title).toBe('Benta at Transaksyon')
      expect(briefing.salesPerformance.bulletPoints[0]).toContain('₱4,500.00')
      expect(briefing.cashSecurity.title).toBe('Seguridad sa Kaha at Pondo')
      expect(briefing.cashSecurity.bulletPoints[0]).toContain('₱3,500.00')
      expect(briefing.inventoryAlerts.title).toBe('Imbentaryo at Babala sa Stocks')
      expect(briefing.speechScript).toContain('Magandang araw po')
      expect(briefing.speechScript).toContain('4,500 piso')
    })
  })

  describe('answerStoreQuestion', () => {
    it('answers best-seller queries in English and Tagalog', () => {
      const resEn = answerStoreQuestion(mockTelemetry, 'Who are the top selling items today?')
      expect(resEn.intent).toBe('TOP_PRODUCTS')
      expect(resEn.language).toBe('en')
      expect(resEn.answer).toContain('San Miguel Pale Pilsen')

      const resTl = answerStoreQuestion(mockTelemetry, 'Ano ang pinakamabenta nating produkto?')
      expect(resTl.intent).toBe('TOP_PRODUCTS')
      expect(resTl.language).toBe('tl')
      expect(resTl.answer).toContain('San Miguel Pale Pilsen')
    })

    it('answers low stock queries in English and Tagalog', () => {
      const resEn = answerStoreQuestion(mockTelemetry, 'Show me low stock items')
      expect(resEn.intent).toBe('LOW_STOCK')
      expect(resEn.language).toBe('en')
      expect(resEn.bullets[0]).toContain('Egg (Large)')

      const resTl = answerStoreQuestion(mockTelemetry, 'May mauubos na bang paninda?')
      expect(resTl.intent).toBe('LOW_STOCK')
      expect(resTl.language).toBe('tl')
      expect(resTl.answer).toContain('2 na produkto')
    })

    it('answers cash drawer queries with exact drawer cash in English and Tagalog', () => {
      const resEn = answerStoreQuestion(mockTelemetry, 'How much expected cash is in the drawer?')
      expect(resEn.intent).toBe('CASH_DRAWER')
      expect(resEn.language).toBe('en')
      expect(resEn.answer).toContain('₱3,500.00')

      const resTl = answerStoreQuestion(mockTelemetry, 'Magkano ang dapat laman ng kaha?')
      expect(resTl.intent).toBe('CASH_DRAWER')
      expect(resTl.language).toBe('tl')
      expect(resTl.answer).toContain('₱3,500.00')
    })

    it('answers void inquiries with exact counts and amounts', () => {
      const res = answerStoreQuestion(mockTelemetry, 'Ilan ang na-void na resibo?')
      expect(res.intent).toBe('VOIDS')
      expect(res.language).toBe('tl')
      expect(res.answer).toContain('2 na na-void na resibo')
      expect(res.answer).toContain('₱1,500.00')
    })

    it('answers customer utang questions accurately', () => {
      const res = answerStoreQuestion(mockTelemetry, 'Magkano ang kabuuang pautang sa suki?')
      expect(res.intent).toBe('UTANG')
      expect(res.language).toBe('tl')
      expect(res.answer).toContain('₱2,500.00')
      expect(res.bullets.some((b) => b.includes('Mang Kanor'))).toBe(true)
    })
  })

  describe('Speech Synthesizer Integration', () => {
    beforeEach(() => {
      vi.stubGlobal('window', {
        speechSynthesis: {
          speak: vi.fn((utterance) => {
            setTimeout(() => {
              utterance.onstart?.()
              utterance.onend?.()
            }, 10)
          }),
          cancel: vi.fn(),
          getVoices: vi.fn(() => [{ lang: 'en-US' }, { lang: 'fil-PH' }]),
          speaking: false
        }
      })
      vi.stubGlobal('SpeechSynthesisUtterance', class MockUtterance {
        text: string
        lang = ''
        rate = 1
        pitch = 1
        volume = 1
        voice = null
        onstart?: () => void
        onend?: () => void
        onerror?: (err: unknown) => void
        constructor(text: string) {
          this.text = text
        }
      })
    })

    afterEach(() => {
      vi.unstubAllGlobals()
    })

    it('synthesizes speech without throwing errors and triggers callbacks', async () => {
      const onStart = vi.fn()
      const onEnd = vi.fn()

      await speakAdvisorBriefing('Executive briefing test', {
        lang: 'en',
        onStart,
        onEnd
      })

      expect(onStart).toHaveBeenCalled()
      expect(onEnd).toHaveBeenCalled()
    })

    it('stops speech cleanly', () => {
      stopAdvisorSpeech()
      expect(window.speechSynthesis.cancel).toHaveBeenCalled()
    })

    it('checks speech speaking status', () => {
      expect(isAdvisorSpeaking()).toBe(false)
    })
  })
})
