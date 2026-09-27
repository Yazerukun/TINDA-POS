import React, { useState, useEffect } from 'react'
import {
  Sparkles,
  ShieldCheck,
  KeyRound,
  Copy,
  Check,
  ExternalLink,
  Crown,
  CheckCircle2,
  AlertCircle,
  X,
  MessageCircle,
  Laptop
} from 'lucide-react'
import type { LicenseStatus } from '@shared/types'
import { toastSuccess, toastError } from '../stores/toast'
import { LegalModal, type LegalTab } from './LegalModal'

interface VipUpgradeModalProps {
  open: boolean
  onClose: () => void
  onActivated?: () => void
}

export function VipUpgradeModal({ open, onClose, onActivated }: VipUpgradeModalProps): React.JSX.Element | null {
  const [status, setStatus] = useState<LicenseStatus | null>(null)
  const [keyInput, setKeyInput] = useState('')
  const [customerName, setCustomerName] = useState('')
  const [loading, setLoading] = useState(false)
  const [copiedMid, setCopiedMid] = useState(false)
  const [copiedMaya, setCopiedMaya] = useState(false)
  const [legalOpen, setLegalOpen] = useState(false)
  const [legalTab, setLegalTab] = useState<LegalTab>('privacy')

  const loadStatus = async (): Promise<void> => {
    try {
      const s = await window.api.license.getStatus()
      setStatus(s)
    } catch (e) {
      toastError('Could not load license status', String((e as Error)?.message || e))
    }
  }

  useEffect(() => {
    if (open) {
      void loadStatus()
    }
  }, [open])

  if (!open) return null

  const copyMachineId = async (): Promise<void> => {
    if (!status?.machineId) return
    try {
      await navigator.clipboard.writeText(status.machineId)
      setCopiedMid(true)
      toastSuccess('Machine ID copied to clipboard!')
      setTimeout(() => setCopiedMid(false), 2500)
    } catch {
      toastError('Failed to copy Machine ID')
    }
  }

  const copyMayaNumber = async (): Promise<void> => {
    try {
      await navigator.clipboard.writeText('09912255156')
      setCopiedMaya(true)
      toastSuccess('Maya number copied: 09912255156')
      setTimeout(() => setCopiedMaya(false), 2500)
    } catch {
      toastError('Failed to copy Maya number')
    }
  }

  const openFacebook = (): void => {
    void window.api.app.openExternal('https://www.facebook.com/Ukauru')
  }

  const handleActivate = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault()
    if (!keyInput.trim()) {
      toastError('Please enter your VIP License Key')
      return
    }

    setLoading(true)
    try {
      const result = await window.api.license.activate(keyInput.trim(), customerName.trim() || undefined)
      if (result.ok) {
        toastSuccess('VIP Pro Activated!', result.message)
        setStatus(result.status)
        setKeyInput('')
        if (onActivated) onActivated()
      } else {
        toastError('Activation Failed', result.message)
      }
    } catch (err) {
      toastError('Activation Error', (err as Error)?.message || String(err))
    } finally {
      setLoading(false)
    }
  }

  const isVip = status?.isVip ?? false

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm transition-opacity duration-300">
      {/* Sliding Dialog Container */}
      <div className="relative w-full max-w-2xl overflow-hidden rounded-2xl border border-amber-500/30 bg-ink-900 shadow-2xl transition-all duration-300 transform animate-in fade-in zoom-in-95">
        
        {/* Glow Header Accent */}
        <div className="h-1.5 w-full bg-gradient-to-r from-amber-500 via-emerald-400 to-amber-500 animate-pulse" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 rounded-xl p-1.5 text-slate-400 hover:bg-ink-800 hover:text-white transition"
          aria-label="Close"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="p-6 md:p-8 space-y-6">
          {/* Header */}
          <div className="text-center space-y-2">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500/20 via-brand-500/20 to-emerald-500/20 ring-1 ring-amber-500/40 shadow-lg">
              <Crown className="h-8 w-8 text-amber-400 animate-bounce" />
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-white flex items-center justify-center gap-2">
              TINDA POS <span className="text-amber-400">VIP Pro Edition</span>
            </h2>
            <p className="text-sm text-slate-300 max-w-md mx-auto">
              {isVip
                ? 'Your system is officially unlocked with a Lifetime VIP Pro license.'
                : 'Upgrade your store to VIP Pro for ₱500 one-time lifetime license. No monthly fees!'}
            </p>
          </div>

          {/* If already VIP Pro */}
          {isVip ? (
            <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-5 text-center space-y-3">
              <div className="flex items-center justify-center gap-2 text-emerald-400 font-semibold text-lg">
                <CheckCircle2 className="h-6 w-6" /> VIP Pro License Active
              </div>
              <p className="text-sm text-slate-300">
                Registered to: <strong className="text-white">{status?.customerName || 'Valued Store Owner'}</strong>
              </p>
              <div className="inline-block bg-ink-950 px-4 py-2 rounded-lg font-mono text-xs text-amber-300 border border-ink-line">
                Machine ID: {status?.machineId}
              </div>
              <div className="pt-2 text-xs text-slate-400">
                All VIP features are permanently active: Multi-PC LAN Hub, Paperless Receipts, and Utang Loyalty Scorecard.
              </div>
            </div>
          ) : (
            <>
              {/* VIP Benefits Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                <div className="flex items-start gap-2.5 p-3 rounded-xl bg-ink-800/60 border border-ink-line">
                  <Sparkles className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold text-white block">Multi-PC LAN Hub</span>
                    <span className="text-slate-400">Run Counter 1 & Counter 2 simultaneously on 1 database.</span>
                  </div>
                </div>
                <div className="flex items-start gap-2.5 p-3 rounded-xl bg-ink-800/60 border border-ink-line">
                  <ShieldCheck className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold text-white block">QR Digital Receipts</span>
                    <span className="text-slate-400">Paperless receipt direct to customer smartphone camera.</span>
                  </div>
                </div>
                <div className="flex items-start gap-2.5 p-3 rounded-xl bg-ink-800/60 border border-ink-line">
                  <Crown className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold text-white block">Utang Trust Scorecard</span>
                    <span className="text-slate-400">Track customer credit reliability and 1-click SMS reminder.</span>
                  </div>
                </div>
                <div className="flex items-start gap-2.5 p-3 rounded-xl bg-ink-800/60 border border-ink-line">
                  <Laptop className="h-4 w-4 text-brand-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold text-white block">100% Store Custom Branding</span>
                    <span className="text-slate-400">Custom store logo, DTI/BIR header, and watermark removal.</span>
                  </div>
                </div>
              </div>

              {/* 3 Steps To Activate */}
              <div className="space-y-4 rounded-xl bg-ink-950 p-4 border border-ink-line">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-amber-400">
                  Easy 3-Step Activation (₱500 One-Time via Maya)
                </h4>

                {/* Step 1: Copy Machine ID & Pay Maya */}
                <div className="space-y-2 text-xs">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2.5 rounded-lg bg-ink-900 border border-ink-line">
                    <div>
                      <span className="text-slate-400 block">Step 1: Your Machine ID (Hardware Locked):</span>
                      <span className="font-mono font-bold text-amber-300 text-sm">{status?.machineId || 'Loading...'}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => void copyMachineId()}
                      className="btn-ghost flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs shrink-0"
                    >
                      {copiedMid ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                      {copiedMid ? 'Copied' : 'Copy Machine ID'}
                    </button>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2.5 rounded-lg bg-emerald-950/40 border border-emerald-500/30">
                    <div>
                      <span className="text-emerald-300 font-medium block">Send ₱500 to Maya:</span>
                      <span className="font-mono font-bold text-white text-base">0991 225 5156</span>
                      <span className="text-[10px] text-emerald-400/80 block">Account: Dev Francis / Ian</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => void copyMayaNumber()}
                      className="btn-ghost border-emerald-500/40 text-emerald-300 flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs shrink-0"
                    >
                      {copiedMaya ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                      {copiedMaya ? 'Copied' : 'Copy Maya #'}
                    </button>
                  </div>
                </div>

                {/* Step 2: Message on Facebook */}
                <div className="p-3 rounded-lg bg-blue-950/40 border border-blue-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <div>
                    <span className="text-blue-300 font-semibold block">Step 2: Message Dev Francis on Facebook</span>
                    <span className="text-slate-400">Send your Machine ID and Maya payment receipt to get your instant VIP Key.</span>
                  </div>
                  <button
                    type="button"
                    onClick={openFacebook}
                    className="bg-blue-600 hover:bg-blue-500 text-white font-medium px-4 py-2 rounded-lg flex items-center justify-center gap-2 shrink-0 transition shadow-md"
                  >
                    <MessageCircle className="h-4 w-4" /> Message on Facebook <ExternalLink className="h-3 w-3" />
                  </button>
                </div>

                {/* Step 3: Enter Key & Activate */}
                <form onSubmit={(e) => void handleActivate(e)} className="space-y-3 pt-1">
                  <div className="text-xs font-semibold text-slate-300">
                    Step 3: Enter your VIP License Key:
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <input
                      type="text"
                      placeholder="Store Name (Optional)"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      className="input text-xs sm:col-span-1"
                    />
                    <input
                      type="text"
                      required
                      placeholder="VIP-XXXX-XXXX-XXXX-XXXX"
                      value={keyInput}
                      onChange={(e) => setKeyInput(e.target.value.toUpperCase())}
                      className="input font-mono text-sm tracking-wider uppercase sm:col-span-2"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={loading || !keyInput.trim()}
                    className="btn-primary w-full flex items-center justify-center gap-2 py-2.5 text-sm font-bold bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-ink-950 border-0 shadow-lg"
                  >
                    <KeyRound className="h-4 w-4" />
                    {loading ? 'Validating Hardware Signature...' : 'Activate VIP Pro Lifetime'}
                  </button>
                </form>
              </div>
            </>
          )}

          {/* Guarantee Footer */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-ink-line pt-4 text-[11px] text-slate-400">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="h-4 w-4 text-emerald-400" /> 100% Offline Cryptographic Lock
            </span>
            <div className="flex items-center gap-2 text-xs">
              <button
                type="button"
                onClick={() => { setLegalTab('privacy'); setLegalOpen(true); }}
                className="hover:text-emerald-400 hover:underline transition"
              >
                Privacy Policy
              </button>
              <span className="text-slate-600">•</span>
              <button
                type="button"
                onClick={() => { setLegalTab('terms'); setLegalOpen(true); }}
                className="hover:text-amber-400 hover:underline transition"
              >
                Terms of Service
              </button>
            </div>
            <button onClick={onClose} className="btn-ghost py-1 px-3 text-xs">
              Close
            </button>
          </div>
        </div>
      </div>

      <LegalModal
        open={legalOpen}
        initialTab={legalTab}
        onClose={() => setLegalOpen(false)}
      />
    </div>
  )
}
