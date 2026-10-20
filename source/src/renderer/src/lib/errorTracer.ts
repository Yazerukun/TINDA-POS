import type { DiagnosticBreadcrumb } from '@shared/types'

const MAX_BREADCRUMBS = 20
const breadcrumbs: DiagnosticBreadcrumb[] = []
let lastErrorSig = ''
let lastErrorTime = 0

function triggerRealtimeSync(): void {
  try {
    import('../stores/systemDebugger')
      .then((m) => m.useSystemDebugger.getState().fetchReport())
      .catch(() => undefined)
  } catch {}
}

/**
 * Record a breadcrumb in the client flight recorder.
 */
export function recordBreadcrumb(
  category: DiagnosticBreadcrumb['category'],
  message: string,
  data?: Record<string, unknown>
): void {
  const entry: DiagnosticBreadcrumb = {
    timestamp: new Date().toLocaleTimeString('en-US', { hour12: false }),
    category,
    message,
    data
  }
  breadcrumbs.push(entry)
  if (breadcrumbs.length > MAX_BREADCRUMBS) {
    breadcrumbs.shift()
  }
}

export function getClientBreadcrumbs(): DiagnosticBreadcrumb[] {
  return [...breadcrumbs]
}

/**
 * Initialize frontend global error capturing and user breadcrumb tracking.
 */
export function initFrontendErrorTracer(): void {
  if (typeof window === 'undefined') return

  // 1. Capture unhandled JavaScript exceptions
  window.addEventListener('error', (event) => {
    try {
      const message = event.message || 'Unknown Window Error'
      const stack = event.error?.stack || `${event.filename}:${event.lineno}:${event.colno}`
      const sig = `${message}::${event.filename}:${event.lineno}`
      const now = Date.now()

      // Debounce identical rapid fire UI errors
      if (sig === lastErrorSig && now - lastErrorTime < 1000) return
      lastErrorSig = sig
      lastErrorTime = now

      recordBreadcrumb('ui', `Unhandled Window Error: ${message.slice(0, 80)}`)
      window.api?.diagnostics
        ?.recordError?.({
          severity: 'ERROR',
          subsystem: 'RENDERER',
          message,
          stack,
          breadcrumbs: getClientBreadcrumbs(),
          metadata: {
            url: window.location.href,
            line: event.lineno,
            col: event.colno
          }
        })
        .then(() => triggerRealtimeSync())
        .catch(() => undefined)
    } catch {}
  })

  // 2. Capture unhandled Promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    try {
      const reason = event.reason
      const message = reason instanceof Error ? reason.message : String(reason)
      const stack = reason instanceof Error ? reason.stack : undefined
      const sig = `rejection::${message}`
      const now = Date.now()

      if (sig === lastErrorSig && now - lastErrorTime < 1000) return
      lastErrorSig = sig
      lastErrorTime = now

      recordBreadcrumb('ui', `Unhandled Promise Rejection: ${message.slice(0, 80)}`)
      window.api?.diagnostics
        ?.recordError?.({
          severity: 'ERROR',
          subsystem: 'RENDERER',
          message: `Unhandled Promise: ${message}`,
          stack,
          breadcrumbs: getClientBreadcrumbs()
        })
        .then(() => triggerRealtimeSync())
        .catch(() => undefined)
    } catch {}
  })

  // 3. User Interaction Breadcrumbs Listener
  window.addEventListener(
    'click',
    (e) => {
      try {
        const target = e.target as HTMLElement | null
        if (!target) return
        const btn = target.closest('button, a, input[type="submit"]') as HTMLElement | null
        if (btn) {
          const text = (
            btn.innerText ||
            btn.getAttribute('aria-label') ||
            btn.title ||
            btn.id ||
            'Action Button'
          ).trim()
          recordBreadcrumb('action', `Clicked: "${text.slice(0, 40)}"`)
        }
      } catch {}
    },
    { passive: true }
  )
}
