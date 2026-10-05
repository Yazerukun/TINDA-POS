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

    // On v1.0.59, v1.0.58 must be available for rollback
    const v58 = targets.find((t) => t.version === '1.0.58')
    expect(v58).toBeDefined()
    expect(v58?.assetName).toMatch(/^TindaPOS-.*\.exe$/)

    // v1.0.57 also available
    const v57 = targets.find((t) => t.version === '1.0.57')
    expect(v57).toBeDefined()
    expect(v57?.assetName).toMatch(/^TindaPOS-.*\.exe$/)
  })
})
