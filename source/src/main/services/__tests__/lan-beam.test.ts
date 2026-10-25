import { describe, expect, it, afterEach } from 'vitest'
import http from 'node:http'
import Database from 'better-sqlite3'
import { runMigrations } from '../../database/migrations'
import { startBeamSender, stopBeamSender, getActiveBeamSender } from '../lanHubService'

describe('LAN Direct Beam Service', () => {
  afterEach(() => {
    stopBeamSender()
  })

  it('generates a 6-digit PIN and active beam sender session', async () => {
    const sender = await startBeamSender()
    expect(sender).toBeDefined()
    expect(sender.pin).toMatch(/^\d{6}$/)
    expect(sender.port).toBeGreaterThan(0)
    expect(sender.expiresAt).toBeGreaterThan(Date.now())

    const active = getActiveBeamSender()
    expect(active?.pin).toBe(sender.pin)
  })

  it('stops beam session cleanly and releases active state', async () => {
    await startBeamSender()
    expect(getActiveBeamSender()).not.toBeNull()
    stopBeamSender()
    expect(getActiveBeamSender()).toBeNull()
  })
})
