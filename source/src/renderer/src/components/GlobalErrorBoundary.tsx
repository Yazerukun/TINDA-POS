import React, { Component, type ErrorInfo, type ReactNode } from 'react'
import { AlertOctagon, RefreshCw, ShoppingCart, Copy, Check, ShieldCheck } from 'lucide-react'
import { getClientBreadcrumbs } from '../lib/errorTracer'
import { toastSuccess } from '../stores/toast'

interface Props {
  children?: ReactNode
  viewName?: string
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
  errorInfo: ErrorInfo | null
  copied: boolean
}

export class GlobalErrorBoundary extends Component<Props, State> {
  public override state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
    copied: false
  }

  public static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null,
      copied: false
    }
  }

  public override componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    this.setState({ errorInfo })

    try {
      const view = this.props.viewName || 'Application'
      const message = `[React ${view} Crash] ${error.name}: ${error.message}`
      const stack = `${error.stack || ''}\n\nComponent Stack:\n${errorInfo.componentStack || ''}`

      window.api?.diagnostics?.recordError?.({
        severity: 'CRITICAL',
        subsystem: 'RENDERER',
        message,
        stack,
        breadcrumbs: getClientBreadcrumbs(),
        metadata: {
          view,
          componentStack: errorInfo.componentStack,
          url: typeof window !== 'undefined' ? window.location.href : ''
        }
      })
    } catch {}
  }

  private handleReset = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      copied: false
    })
  }

  private handleReturnToPos = (): void => {
    try {
      import('../stores/nav')
        .then((m) => m.useNav.getState().setPage('pos'))
        .catch(() => undefined)
    } catch {}
    this.handleReset()
  }

  private handleOpenDiagnostics = (): void => {
    try {
      import('../stores/systemDebugger')
        .then((m) => m.useSystemDebugger.getState().openDebugger())
        .catch(() => undefined)
    } catch {}
  }

  private handleCopyCrashReport = async (): Promise<void> => {
    const { error, errorInfo } = this.state
    const view = this.props.viewName || 'Application'
    const report = [
      `# TINDA POS React Error Boundary Crash Report`,
      `**View:** ${view}`,
      `**Time:** ${new Date().toLocaleString('en-US')}`,
      `**Error:** ${error?.name}: ${error?.message}`,
      '',
      '## Stack Trace',
      '```',
      error?.stack || 'No stack trace available',
      '```',
      '',
      '## Component Stack',
      '```',
      errorInfo?.componentStack || 'No component stack available',
      '```'
    ].join('\n')

    try {
      await navigator.clipboard.writeText(report)
      this.setState({ copied: true })
      toastSuccess('Crash Report Copied!', 'Ready to paste in chat for Jin.')
      setTimeout(() => this.setState({ copied: false }), 3000)
    } catch {}
  }

  public override render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback

      const view = this.props.viewName || 'Section'
      return (
        <div className="flex h-full w-full items-center justify-center p-6 bg-ink-950/80 backdrop-blur-md">
          <div className="max-w-xl w-full rounded-2xl border border-danger-500/35 bg-danger-950/20 p-6 text-center shadow-2xl backdrop-blur-xl">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-danger-500/20 text-danger-400 mb-4 shadow-inner">
              <AlertOctagon className="h-8 w-8" />
            </div>

            <h3 className="text-lg font-bold text-white">
              {view} Rendering Glitch Contained
            </h3>

            <p className="mt-1.5 text-xs text-slate-300 leading-relaxed max-w-md mx-auto">
              An unexpected display glitch occurred in this view. The system flight recorder has
              safely captured and clustered the diagnostic trace. Your database and financial
              records are completely secure.
            </p>

            <div className="mt-4 max-h-24 overflow-y-auto rounded-xl border border-danger-500/25 bg-black/50 p-2.5 font-mono text-[11px] text-danger-300 text-left break-all select-all">
              {this.state.error?.message || 'Unknown view exception'}
            </div>

            <div className="mt-6 flex flex-wrap items-center justify-center gap-2.5">
              <button
                type="button"
                onClick={this.handleReset}
                className="btn-primary flex items-center gap-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs py-2 px-3.5 shadow-md active:scale-95 transition"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                <span>Reload View</span>
              </button>

              <button
                type="button"
                onClick={this.handleReturnToPos}
                className="btn-secondary flex items-center gap-1.5 border-brand-500/30 text-brand-300 hover:bg-brand-500/10 text-xs py-2 px-3 active:scale-95 transition"
              >
                <ShoppingCart className="h-3.5 w-3.5" />
                <span>Return to Cashier (POS)</span>
              </button>

              <button
                type="button"
                onClick={this.handleCopyCrashReport}
                className="btn-secondary flex items-center gap-1.5 border-slate-700 text-slate-300 hover:bg-white/5 text-xs py-2 px-3 active:scale-95 transition"
                title="Copy crash dump to send to Jin"
              >
                {this.state.copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                <span>{this.state.copied ? 'Copied!' : 'Copy Incident for Jin'}</span>
              </button>

              <button
                type="button"
                onClick={this.handleOpenDiagnostics}
                className="btn-ghost flex items-center gap-1.5 text-xs text-sky-400 hover:underline py-2 px-2"
              >
                <ShieldCheck className="h-3.5 w-3.5" />
                <span>Diagnostics (Ctrl+Shift+D)</span>
              </button>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
