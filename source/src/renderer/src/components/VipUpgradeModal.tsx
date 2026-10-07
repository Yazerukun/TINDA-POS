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
  X,
  MessageCircle,
  Laptop
} from 'lucide-react'
import type { LicenseStatus } from '@shared/types'
import { toastSuccess, toastError } from '../stores/toast'
import { LegalModal, type LegalTab } from './LegalModal'
import { useLicense } from '../stores/license'

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

  // Close on Escape key
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

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
        useLicense.getState().setLicenseStatus(result.status)
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
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm transition-opacity duration-200"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      {/* Dialog Container with strict max-h to prevent overflow */}
      <div className="relative flex flex-col w-full max-w-xl max-h-[88vh] overflow-hidden rounded-2xl border border-amber-500/40 bg-ink-900 shadow-2xl animate-in fade-in zoom-in-95">
        
        {/* Glow Header Accent */}
        <div className="h-1.5 w-full bg-gradient-to-r from-amber-500 via-emerald-400 to-amber-500 animate-pulse shrink-0" />

        {/* Sticky Header with Always-Visible Close Button */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-ink-line bg-ink-950/80 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/20 text-amber-400 ring-1 ring-amber-500/40">
              <Crown className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                TINDA POS <span className="text-amber-400">VIP Pro</span>
              </h3>
              <p className="text-[11px] text-slate-400">₱500 Lifetime · No Monthly Fees</p>
            </div>
          </div>

          {/* Prominent High-Visibility Close Button */}
          <button
            type="button"
            onClick={onClose}
            className="flex items-center gap-1.5 rounded-xl px-3 py-1.5 bg-ink-800 hover:bg-rose-600/30 text-slate-300 hover:text-white border border-ink-line text-xs font-semibold transition"
            aria-label="Close"
          >
            <X className="h-4 w-4 text-rose-400" />
            <span>Close</span>
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 custom-scrollbar text-xs">
          
          {/* Active VIP State */}
          {isVip ? (
            <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-5 text-center space-y-3">
              <div className="flex items-center justify-center gap-2 text-emerald-400 font-semibold text-base">
                <CheckCircle2 className="h-5 w-5" /> VIP Pro License Active
              </div>
              <p className="text-slate-300">
                Registered to: <strong className="text-white">{status?.customerName || 'Valued Store Owner'}</strong>
              </p>
              <div className="inline-block bg-ink-950 px-3 py-1.5 rounded-lg font-mono text-xs text-amber-300 border border-ink-line">
                Machine ID: {status?.machineId}
              </div>
              <div className="text-[11px] text-slate-400">
                All VIP features are permanently unlocked on this machine.
              </div>
            </div>
          ) : (
            <>
              {/* VIP Benefits Grid (Compact 2-col) */}
              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div className="flex items-center gap-2 p-2.5 rounded-lg bg-ink-800/60 border border-ink-line">
                  <Sparkles className="h-4 w-4 text-amber-400 shrink-0" />
                  <span className="font-medium text-slate-200">Multi-PC LAN Network</span>
                </div>
                <div className="flex items-center gap-2 p-2.5 rounded-lg bg-ink-800/60 border border-ink-line">
                  <ShieldCheck className="h-4 w-4 text-emerald-400 shrink-0" />
                  <span className="font-medium text-slate-200">QR Digital Receipts</span>
                </div>
                <div className="flex items-center gap-2 p-2.5 rounded-lg bg-ink-800/60 border border-ink-line">
                  <Crown className="h-4 w-4 text-amber-400 shrink-0" />
                  <span className="font-medium text-slate-200">Utang Suki Trust Score</span>
                </div>
                <div className="flex items-center gap-2 p-2.5 rounded-lg bg-ink-800/60 border border-ink-line">
                  <Laptop className="h-4 w-4 text-brand-400 shrink-0" />
                  <span className="font-medium text-slate-200">Custom Logo & Watermark-Free</span>
                </div>
              </div>

              {/* 3-Step Activation Box */}
              <div className="space-y-3 rounded-xl bg-ink-950 p-3.5 border border-ink-line">
                
                {/* Step 1: Copy Machine ID & Maya */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2 p-2.5 rounded-lg bg-ink-900 border border-ink-line">
                    <div className="min-w-0">
                      <span className="text-[10px] text-slate-400 block uppercase">1. Machine ID:</span>
                      <span className="font-mono font-bold text-amber-300 text-xs truncate block">
                        {status?.machineId || 'Generating...'}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => void copyMachineId()}
                      className="btn-ghost flex items-center gap-1 px-2.5 py-1 text-xs shrink-0"
                    >
                      {copiedMid ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                      {copiedMid ? 'Copied' : 'Copy'}
                    </button>
                  </div>

                  <div className="flex items-center justify-between gap-2 p-2.5 rounded-lg bg-emerald-950/40 border border-emerald-500/30">
                    <div>
                      <span className="text-[10px] text-emerald-400 block uppercase">2. Pay ₱500 to Maya:</span>
                      <span className="font-mono font-bold text-white text-sm">0991 225 5156</span>
                      <span className="text-[10px] text-emerald-300/80 block">Dev Francis</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => void copyMayaNumber()}
                      className="btn-ghost border-emerald-500/40 text-emerald-300 flex items-center gap-1 px-2.5 py-1 text-xs shrink-0"
                    >
                      {copiedMaya ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                      {copiedMaya ? 'Copied' : 'Copy Maya #'}
                    </button>
                  </div>
                </div>

                {/* Step 2: Message Facebook */}
                <div className="p-2.5 rounded-lg bg-blue-950/40 border border-blue-500/30 flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <span className="text-[10px] text-blue-300 uppercase block font-semibold">3. Send Receipt to FB:</span>
                    <span className="text-slate-300 text-xs truncate block">fb.com/Ukauru (Dev Francis)</span>
                  </div>
                  <button
                    type="button"
                    onClick={openFacebook}
                    className="bg-blue-600 hover:bg-blue-500 text-white font-medium px-3 py-1.5 rounded-lg flex items-center gap-1.5 text-xs shrink-0 transition shadow-sm"
                  >
                    <MessageCircle className="h-3.5 w-3.5" /> Message FB <ExternalLink className="h-3 w-3" />
                  </button>
                </div>

                {/* Step 3: Enter Key Form */}
                <form onSubmit={(e) => void handleActivate(e)} className="space-y-2 pt-1 border-t border-ink-line/60">
                  <span className="text-[11px] font-semibold text-slate-300 block">
                    Enter your VIP Pro License Key:
                  </span>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <input
                      type="text"
                      placeholder="Store Name (Optional)"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      className="input text-xs sm:w-1/3"
                    />
                    <input
                      type="text"
                      required
                      placeholder="VIP-XXXX-XXXX-XXXX-XXXX"
                      value={keyInput}
                      onChange={(e) => setKeyInput(e.target.value.toUpperCase())}
                      className="input font-mono text-xs tracking-wider uppercase sm:w-2/3"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={loading || !keyInput.trim()}
                    className="btn-primary w-full flex items-center justify-center gap-2 py-2 text-xs font-bold bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 text-ink-950 border-0 shadow-md"
                  >
                    <KeyRound className="h-3.5 w-3.5" />
                    {loading ? 'Validating Signature...' : 'Activate VIP Pro Lifetime'}
                  </button>
                </form>
              </div>
            </>
          )}
        </div>

        {/* Sticky Footer with Clear Buttons */}
        <div className="flex items-center justify-between px-5 py-3 border-t border-ink-line bg-ink-950/80 shrink-0 text-xs">
          <div className="flex items-center gap-2 text-slate-400 text-[11px]">
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
          <button
            type="button"
            onClick={onClose}
            className="btn-ghost py-1 px-4 text-xs font-semibold text-slate-300 hover:text-white"
          >
            Close Dialog
          </button>
        </div>
      </div>

      {/* Embedded Legal Modal */}
      <LegalModal
        open={legalOpen}
        initialTab={legalTab}
        onClose={() => setLegalOpen(false)}
      />
    </div>
  )
}
