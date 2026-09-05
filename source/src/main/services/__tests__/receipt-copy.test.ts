import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

describe('receipt UI copy', () => {
  it('offers separate receipt viewing and real printer submission', () => {
    const transactions = readFileSync(new URL('../../../renderer/src/pages/Transactions.tsx', import.meta.url), 'utf8')
    const settings = readFileSync(new URL('../../../renderer/src/pages/Settings.tsx', import.meta.url), 'utf8')
    const currentReceiptUi = `${transactions}\n${settings}`

    expect(currentReceiptUi).toContain('Receipt generated successfully')
    expect(currentReceiptUi).toContain('View Receipt')
    expect(currentReceiptUi).toContain('Print Receipt')
    expect(currentReceiptUi).toContain('window.api.printer.printReceipt')
    expect(currentReceiptUi).toContain('Test Print')
  })
})
