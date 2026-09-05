import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

describe('receipt UI copy', () => {
  it('offers separate receipt viewing and real printer submission', () => {
    const transactions = readFileSync(new URL('../../../renderer/src/pages/Transactions.tsx', import.meta.url), 'utf8')
    const settings = readFileSync(new URL('../../../renderer/src/pages/Settings.tsx', import.meta.url), 'utf8')
    const currentReceiptUi = `${transactions}\n${settings}`

    // Transactions keeps a separate print path: View Receipt reconstructs the
    // EXISTING sale for on-screen preview; Print Receipt submits a real job.
    expect(currentReceiptUi).toContain('View Receipt')
    expect(currentReceiptUi).toContain('Print Receipt')
    expect(currentReceiptUi).toContain('window.api.printer.printReceipt')
    expect(currentReceiptUi).toContain('window.api.pos.reprint')
    expect(currentReceiptUi).toContain('<ReceiptPaper')
    // Settings exposes Test Print, Refresh Printers, honest status, and live discovery.
    expect(currentReceiptUi).toContain('Test Print')
    expect(currentReceiptUi).toContain('Refresh Printers')
    expect(currentReceiptUi).toContain('printerPick')
    expect(currentReceiptUi).toContain('window.api.printer.list')
  })
})
