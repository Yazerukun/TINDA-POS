import * as React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { GlobalErrorBoundary } from '../GlobalErrorBoundary'

describe('GlobalErrorBoundary', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  it('renders children when no error occurs', () => {
    const markup = renderToStaticMarkup(
      React.createElement(
        GlobalErrorBoundary,
        { viewName: 'TestView' },
        React.createElement('div', null, 'Safe Component Content')
      )
    )

    expect(markup).toContain('Safe Component Content')
  })

  it('contains render errors and captures diagnostic report', () => {
    const recordErrorMock = vi.fn().mockResolvedValue({ id: 1 })
    ;(globalThis as any).window = {
      location: { href: 'http://localhost/' },
      api: {
        diagnostics: {
          recordError: recordErrorMock
        }
      }
    }

    const boundary = new GlobalErrorBoundary({
      children: null,
      viewName: 'POS Cashier'
    })

    const testError = new Error('Simulated UI crash')
    const errorInfo = { componentStack: '\n    in FlakyComponent\n    in POS' }

    boundary.componentDidCatch(testError, errorInfo)

    expect(recordErrorMock).toHaveBeenCalledWith(
      expect.objectContaining({
        severity: 'CRITICAL',
        subsystem: 'RENDERER',
        message: expect.stringContaining('Simulated UI crash'),
        stack: expect.stringContaining('FlakyComponent')
      })
    )

    const state = GlobalErrorBoundary.getDerivedStateFromError(testError)
    expect(state.hasError).toBe(true)
    expect(state.error).toBe(testError)
  })
})
