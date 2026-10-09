import { describe, it, expect, afterAll } from 'vitest'
import http from 'node:http'
import {
  startPhoneScannerService,
  stopPhoneScannerService,
  getCfdUrl,
  getCfdState,
  updateCfdState,
  generateQrSvg
} from '../phoneScannerService'

describe('Wireless Customer Facing Display (CFD) & Dynamic QR', () => {
  let port = 0

  afterAll(() => {
    stopPhoneScannerService()
  })

  it('initializes and returns CFD status and URLs', async () => {
    port = await startPhoneScannerService(3192, 3193)
    expect(port).toBeGreaterThan(0)

    const url = getCfdUrl()
    expect(url).toContain(`:${port}/cfd`)
  })

  it('maintains and updates CFD state with cart items and totals', () => {
    const state = updateCfdState({
      status: 'ACTIVE',
      storeName: 'ALAN SARI-SARI STORE',
      items: [
        { id: 1, name: 'Lucky Me Pancit Canton', qty: 3, unit_name: 'pc', price_c: 1800, subtotal_c: 5400 },
        { id: 2, name: 'Coca-Cola Mismo 295ml', qty: 2, unit_name: 'bottle', price_c: 2000, subtotal_c: 4000 }
      ],
      subtotal_c: 9400,
      discount_c: 400,
      total_c: 9000,
      customerName: 'Ate Inday'
    })

    expect(state.status).toBe('ACTIVE')
    expect(state.storeName).toBe('ALAN SARI-SARI STORE')
    expect(state.items).toHaveLength(2)
    expect(state.total_c).toBe(9000)
    expect(state.discount_c).toBe(400)
    expect(state.customerName).toBe('Ate Inday')
    expect(getCfdState()).toEqual(state)
  })

  it('generates dynamic QR code SVG for GCash / Maya payment payloads', () => {
    const qrPayload = 'gcash://pay?amount=90.00&store=ALAN+SARI-SARI+STORE&ref=123456'
    const svg = generateQrSvg(qrPayload, 260)
    expect(svg).toContain('<svg')
    expect(svg).toContain('xmlns="http://www.w3.org/2000/svg"')
    expect(svg).toContain('viewBox="0 0')
    expect(svg).toContain('<rect width=')
    expect(svg).toContain('<path d=')

    const state = updateCfdState({
      status: 'PAYMENT',
      paymentMethod: 'GCASH',
      qrCodeUrl: qrPayload
    })

    expect(state.status).toBe('PAYMENT')
    expect(state.paymentMethod).toBe('GCASH')
    expect(state.qrSvg).toBeDefined()
    expect(state.qrSvg).toContain('<svg')

    const mbState = updateCfdState({
      status: 'PAYMENT',
      paymentMethod: 'MARIBANK',
      qrCodeUrl: 'maribank://pay?amount=120.00&store=ALAN+STORE&ref=7890'
    })
    expect(mbState.paymentMethod).toBe('MARIBANK')
    expect(mbState.qrSvg).toBeDefined()
  })

  it('serves CFD HTML interface over HTTP at /cfd', async () => {
    const html = await new Promise<string>((resolve, reject) => {
      http.get(`http://127.0.0.1:${port}/cfd`, (res) => {
        expect(res.statusCode).toBe(200)
        expect(res.headers['content-type']).toContain('text/html')
        let data = ''
        res.on('data', (c) => (data += c))
        res.on('end', () => resolve(data))
      }).on('error', reject)
    })

    expect(html).toContain('TINDA POS — Customer Facing Display')
    expect(html).toContain('LIVE COUNTER')
    expect(html).toContain('/api/cfd')
    expect(html).toContain('fmtMoney')
    expect(html).toContain('badge-maribank')
  })

  it('returns and accepts CFD state updates via /api/cfd', async () => {
    // 1. GET /api/cfd
    const getRes = await new Promise<Record<string, unknown>>((resolve, reject) => {
      http.get(`http://127.0.0.1:${port}/api/cfd`, (res) => {
        expect(res.statusCode).toBe(200)
        let data = ''
        res.on('data', (c) => (data += c))
        res.on('end', () => resolve(JSON.parse(data)))
      }).on('error', reject)
    })

    expect(getRes.status).toBe('PAYMENT')
    expect(getRes.total_c).toBe(9000)

    // 2. POST /api/cfd
    const postData = JSON.stringify({
      status: 'COMPLETED',
      amount_tendered_c: 10000,
      change_c: 1000
    })

    const postRes = await new Promise<Record<string, unknown>>((resolve, reject) => {
      const req = http.request(
        `http://127.0.0.1:${port}/api/cfd`,
        { method: 'POST', headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(postData) } },
        (res) => {
          expect(res.statusCode).toBe(200)
          let data = ''
          res.on('data', (c) => (data += c))
          res.on('end', () => resolve(JSON.parse(data)))
        }
      )
      req.on('error', reject)
      req.write(postData)
      req.end()
    })

    expect(postRes.status).toBe('COMPLETED')
    expect(postRes.change_c).toBe(1000)
  })

  it('serves dynamic QR code SVGs at /api/qr', async () => {
    const text = 'maya://pay?amount=250.00'
    const svg = await new Promise<string>((resolve, reject) => {
      http.get(`http://127.0.0.1:${port}/api/qr?text=${encodeURIComponent(text)}`, (res) => {
        expect(res.statusCode).toBe(200)
        expect(res.headers['content-type']).toContain('image/svg+xml')
        let data = ''
        res.on('data', (c) => (data += c))
        res.on('end', () => resolve(data))
      }).on('error', reject)
    })

    expect(svg).toContain('<svg')
    expect(svg).toContain('<path d=')
  })
})
