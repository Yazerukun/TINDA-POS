import { describe, it, expect, afterAll } from 'vitest'
import {
  startPhoneScannerService,
  stopPhoneScannerService,
  getPhoneScannerStatus,
  getLocalIpAddress
} from '../phoneScannerService'
import http from 'node:http'
import https from 'node:https'

describe('PhoneScannerService', () => {
  let port = 0

  afterAll(() => {
    stopPhoneScannerService()
  })

  it('starts phone scanner service on local network with both HTTP and HTTPS', async () => {
    port = await startPhoneScannerService(3188, 3189)
    expect(port).toBeGreaterThan(0)

    const status = getPhoneScannerStatus()
    expect(status.running).toBe(true)
    expect(status.port).toBe(port)
    expect(status.httpsPort).toBeGreaterThan(0)
    expect(status.ip).toBe(getLocalIpAddress())
    expect(status.url).toContain(`http://${status.ip}:${port}/scanner?session=`)
    expect(status.httpsUrl).toContain(`https://${status.ip}:${status.httpsPort}/scanner?session=`)
  })

  it('serves mobile scanner HTML interface', async () => {
    const html = await new Promise<string>((resolve, reject) => {
      http.get(`http://127.0.0.1:${port}/scanner`, (res) => {
        expect(res.statusCode).toBe(200)
        expect(res.headers['content-type']).toContain('text/html')
        let data = ''
        res.on('data', (c) => (data += c))
        res.on('end', () => resolve(data))
      }).on('error', reject)
    })

    expect(html).toContain('TINDA POS — Wireless Phone Scanner')
    expect(html).toContain('isValidBarcode')
  })

  it('serves mobile scanner HTML interface securely over HTTPS', async () => {
    const status = getPhoneScannerStatus()
    const html = await new Promise<string>((resolve, reject) => {
      https.get(`https://127.0.0.1:${status.httpsPort}/scanner`, { rejectUnauthorized: false }, (res) => {
        expect(res.statusCode).toBe(200)
        expect(res.headers['content-type']).toContain('text/html')
        let data = ''
        res.on('data', (c) => (data += c))
        res.on('end', () => resolve(data))
      }).on('error', reject)
    })

    expect(html).toContain('TINDA POS — Wireless Phone Scanner')
    expect(html).toContain('cameraFileInput')
  })

  it('handles phone ping and status check', async () => {
    const response = await new Promise<string>((resolve, reject) => {
      http.get(`http://127.0.0.1:${port}/api/ping?device=iPhone`, (res) => {
        expect(res.statusCode).toBe(200)
        let data = ''
        res.on('data', (c) => (data += c))
        res.on('end', () => resolve(data))
      }).on('error', reject)
    })

    const parsed = JSON.parse(response)
    expect(parsed.ok).toBe(true)

    const status = getPhoneScannerStatus()
    expect(status.connected).toBe(true)
    expect(status.device).toBe('iPhone')
  })

  it('accepts valid barcode scans via POST /api/scan', async () => {
    const payload = JSON.stringify({ barcode: '4800016644800', session: 'test' })

    const response = await new Promise<string>((resolve, reject) => {
      const req = http.request(
        `http://127.0.0.1:${port}/api/scan`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(payload)
          }
        },
        (res) => {
          expect(res.statusCode).toBe(200)
          let data = ''
          res.on('data', (c) => (data += c))
          res.on('end', () => resolve(data))
        }
      )
      req.on('error', reject)
      req.write(payload)
      req.end()
    })

    const parsed = JSON.parse(response)
    expect(parsed.ok).toBe(true)
    expect(parsed.barcode).toBe('4800016644800')
  })
})
