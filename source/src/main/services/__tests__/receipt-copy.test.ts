import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

describe('receipt UI copy', () => {
  it('describes receipt generation without claiming physical printing', () => {
    const transactions = readFileSync(new URL('../../../renderer/src/pages/Transactions.tsx', import.meta.url), 'utf8')
    const settings = readFileSync(new URL('../../../renderer/src/pages/Settings.tsx', import.meta.url), 'utf8')
    const currentReceiptUi = `${transactions}\n${settings}`

    expect(currentReceiptUi).toContain('Receipt generated successfully')
    expect(currentReceiptUi).toContain('Generate Receipt')
    expect(currentReceiptUi).not.toMatch(/sent to printer|printed successfully|print successful/i)
  })
})
