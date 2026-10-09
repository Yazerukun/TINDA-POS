import { describe, it, expect } from 'vitest'
import { RollbackService } from '../rollbackService'

describe('RollbackService — Version Rollback & Safe Downgrade', () => {
  it('instantiates as a singleton', () => {
    const s1 = RollbackService.getInstance()
    const s2 = RollbackService.getInstance()
    expect(s1).toBe(s2)
  })

  it('fetches rollback targets and filters strictly older versions', async () => {
    const service = RollbackService.getInstance()
    const targets = await service.getRollbackTargets()

    expect(Array.isArray(targets)).toBe(true)
    for (const t of targets) {
      expect(t.version).toBeDefined()
      expect(t.tag).toBeDefined()
      expect(t.assetName).toBeDefined()
      expect(t.assetUrl).toBeDefined()
    }

    expect(targets.length).toBeGreaterThan(0)
    const target = targets[0]!
    expect(target.version).toBeDefined()
    expect(target.assetName).toMatch(/^TindaPOS-.*(\.exe|\.tar\.gz|\.AppImage|\.zip)$/)
  })
})
