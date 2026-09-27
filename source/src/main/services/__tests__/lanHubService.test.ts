import { describe, it, expect, afterAll } from 'vitest'
import {
  startMasterServer,
  stopMasterServer,
  getLanStatus,
  generatePin,
  setMasterDispatcher,
  getLocalIp
} from '../lanHubService'
import http from 'node:http'

describe('LanHubService', () => {
  let port = 0
  let activePin = ''
  let authToken = ''

  afterAll(() => {
    stopMasterServer()
  })

  it('generates a 6-digit numerical pairing PIN', () => {
    activePin = generatePin()
    expect(activePin).toMatch(/^\d{6}$/)
    const status = getLanStatus()
    expect(status.pairingPin).toBe(activePin)
  })

  it('starts Master Server on custom test port', async () => {
    port = await startMasterServer(3195)
    expect(port).toBeGreaterThan(0)

    const status = getLanStatus()
    expect(status.running).toBe(true)
    expect(status.port).toBe(port)
    expect(status.ip).toBe(getLocalIp())
  })

  it('rejects pairing with incorrect PIN', async () => {
    const res = await new Promise<{ status: number; body: { ok: boolean; error: string } }>((resolve, reject) => {
      const postData = JSON.stringify({ pin: '000000', deviceName: 'Unauthorized Terminal' })
      const req = http.request(
        `http://127.0.0.1:${port}/api/lan/pair`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(postData)
          }
        },
        (r) => {
          let data = ''
          r.on('data', (c) => (data += c))
          r.on('end', () => resolve({ status: r.statusCode || 500, body: JSON.parse(data) }))
        }
      )
      req.on('error', reject)
      req.write(postData)
      req.end()
    })

    expect(res.status).toBe(401)
    expect(res.body.ok).toBe(false)
    expect(res.body.error).toContain('Invalid or expired 6-digit PIN')
  })

  it('authorizes pairing with correct 6-digit PIN and issues HMAC session token', async () => {
    const res = await new Promise<{ status: number; body: { ok: boolean; token: string; storeName: string } }>(
      (resolve, reject) => {
        const postData = JSON.stringify({ pin: activePin, deviceName: 'Counter 2 Cashier' })
        const req = http.request(
          `http://127.0.0.1:${port}/api/lan/pair`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Content-Length': Buffer.byteLength(postData)
            }
          },
          (r) => {
            let data = ''
            r.on('data', (c) => (data += c))
            r.on('end', () => resolve({ status: r.statusCode || 500, body: JSON.parse(data) }))
          }
        )
        req.on('error', reject)
        req.write(postData)
        req.end()
      }
    )

    expect(res.status).toBe(200)
    expect(res.body.ok).toBe(true)
    expect(res.body.token).toBeTruthy()
    authToken = res.body.token

    const status = getLanStatus()
    expect(status.clientDevices.length).toBeGreaterThan(0)
    expect(status.clientDevices[0]?.name).toBe('Counter 2 Cashier')
  })

  it('rejects RPC call with missing or invalid token with HTTP 401', async () => {
    const res = await new Promise<{ status: number; body: { ok: boolean; error: string } }>((resolve, reject) => {
      const postData = JSON.stringify({ channel: 'products:search', args: [''] })
      const req = http.request(
        `http://127.0.0.1:${port}/api/lan/rpc`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer invalid_bogus_token',
            'Content-Length': Buffer.byteLength(postData)
          }
        },
        (r) => {
          let data = ''
          r.on('data', (c) => (data += c))
          r.on('end', () => resolve({ status: r.statusCode || 500, body: JSON.parse(data) }))
        }
      )
      req.on('error', reject)
      req.write(postData)
      req.end()
    })

    expect(res.status).toBe(401)
    expect(res.body.ok).toBe(false)
  })

  it('blocks forbidden administrative operations from remote satellite with HTTP 403', async () => {
    const res = await new Promise<{ status: number; body: { ok: boolean; error: string } }>((resolve, reject) => {
      const postData = JSON.stringify({ channel: 'data:resetDatabase', args: ['RESET'] })
      const req = http.request(
        `http://127.0.0.1:${port}/api/lan/rpc`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`,
            'Content-Length': Buffer.byteLength(postData)
          }
        },
        (r) => {
          let data = ''
          r.on('data', (c) => (data += c))
          r.on('end', () => resolve({ status: r.statusCode || 500, body: JSON.parse(data) }))
        }
      )
      req.on('error', reject)
      req.write(postData)
      req.end()
    })

    expect(res.status).toBe(403)
    expect(res.body.ok).toBe(false)
    expect(res.body.error).toContain('locked to the physical Master PC')
  })

  it('executes authorized RPC query via master dispatcher', async () => {
    // Mock dispatcher
    setMasterDispatcher(async (channel, args) => {
      if (channel === 'products:search') {
        return { rows: [{ id: 1, name: 'Coke Sakto', price_c: 1500 }], total: 1 }
      }
      return null
    })

    const res = await new Promise<{ status: number; body: { ok: boolean; data: { rows: Array<{ name: string }> } } }>(
      (resolve, reject) => {
        const postData = JSON.stringify({ channel: 'products:search', args: ['Coke'] })
        const req = http.request(
          `http://127.0.0.1:${port}/api/lan/rpc`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${authToken}`,
              'Content-Length': Buffer.byteLength(postData)
            }
          },
          (r) => {
            let data = ''
            r.on('data', (c) => (data += c))
            r.on('end', () => resolve({ status: r.statusCode || 500, body: JSON.parse(data) }))
          }
        )
        req.on('error', reject)
        req.write(postData)
        req.end()
      }
    )

    expect(res.status).toBe(200)
    expect(res.body.ok).toBe(true)
    expect(res.body.data.rows[0]?.name).toBe('Coke Sakto')
  })

  it('stops Master Server cleanly', () => {
    stopMasterServer()
    const status = getLanStatus()
    expect(status.running).toBe(false)
  })
})
