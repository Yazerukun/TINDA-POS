import React, { useState } from 'react'
import { X, ShieldCheck, FileText, CheckCircle2, Heart } from 'lucide-react'

export type LegalTab = 'privacy' | 'terms'

interface LegalModalProps {
  open: boolean
  initialTab?: LegalTab
  onClose: () => void
}

export function LegalModal({ open, initialTab = 'privacy', onClose }: LegalModalProps): React.JSX.Element | null {
  const [activeTab, setActiveTab] = useState<LegalTab>(initialTab)

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative flex flex-col w-full max-w-3xl max-h-[85vh] rounded-2xl border border-ink-line bg-ink-900 shadow-2xl overflow-hidden">
        
        {/* Top Accent Line */}
        <div className="h-1.5 w-full bg-gradient-to-r from-brand-500 via-amber-400 to-brand-500" />

        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-ink-line bg-ink-950/60">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-500/20 text-brand-300 ring-1 ring-brand-500/30">
              {activeTab === 'privacy' ? <ShieldCheck className="h-5 w-5 text-emerald-400" /> : <FileText className="h-5 w-5 text-amber-400" />}
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                {activeTab === 'privacy' ? 'Privacy Policy' : 'Terms of Service'}
              </h3>
              <p className="text-xs text-slate-400">TINDA POS · 100% Offline-First Retail System</p>
            </div>
          </div>

          {/* Close Button */}
          <button
            onClick={onClose}
            className="rounded-xl p-1.5 text-slate-400 hover:bg-ink-800 hover:text-white transition"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Tab Selector */}
        <div className="flex border-b border-ink-line bg-ink-950/40 px-6 pt-2">
          <button
            type="button"
            onClick={() => setActiveTab('privacy')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition ${
              activeTab === 'privacy'
                ? 'border-emerald-400 text-emerald-400 bg-ink-800/40 rounded-t-lg'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <ShieldCheck className="h-4 w-4" /> Privacy Policy
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('terms')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition ${
              activeTab === 'terms'
                ? 'border-amber-400 text-amber-400 bg-ink-800/40 rounded-t-lg'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <FileText className="h-4 w-4" /> Terms of Service
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-xs text-slate-300 leading-relaxed custom-scrollbar">
          {activeTab === 'privacy' ? (
            <div className="space-y-5">
              <div className="p-4 rounded-xl bg-emerald-950/30 border border-emerald-500/30 flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <span className="font-semibold text-white block text-sm">100% Offline & Zero Telemetry Guarantee</span>
                  <span className="text-slate-300 text-xs">
                    TINDA POS never monitors, transmits, or uploads your store sales, profits, barcodes, or customer debts to any cloud or external servers.
                  </span>
                </div>
              </div>

              <section className="space-y-2">
                <h4 className="text-sm font-bold text-white uppercase tracking-wider text-brand-300">
                  1. Local Data Sovereignty
                </h4>
                <p>
                  All transactions, catalog items, cashier shifts, and customer credit (<em>utang</em>) records are saved locally inside an encrypted-capable SQLite database file (<code>tindapos.db</code>) on this specific computer. You retain 100% ownership and control over your store records.
                </p>
              </section>

              <section className="space-y-2">
                <h4 className="text-sm font-bold text-white uppercase tracking-wider text-brand-300">
                  2. Anonymous Machine ID & Hardware Binding
                </h4>
                <p>
                  To prevent unauthorized license duplication and software piracy, the system calculates an anonymous, cryptographic SHA-256 hash from your computer&apos;s physical motherboard and processor IDs (format: <code>TNDA-XXXX-XXXX-XXXX-XXXX</code>).
                </p>
                <p>
                  This identifier is used strictly for offline mathematical verification of your VIP Pro license key. It cannot be reversed into personal hardware details and is never transmitted over the internet.
                </p>
              </section>

              <section className="space-y-2">
                <h4 className="text-sm font-bold text-white uppercase tracking-wider text-brand-300">
                  3. Philippine Data Privacy Act Compliance (RA 10173)
                </h4>
                <p>
                  In accordance with Republic Act No. 10173, customer credit accounts and phone numbers stored in your Suki directory remain solely in your store&apos;s custody. The developer has zero remote access or backdoor into your store system.
                </p>
              </section>

              <section className="space-y-2">
                <h4 className="text-sm font-bold text-white uppercase tracking-wider text-brand-300">
                  4. Developer Contact & Support
                </h4>
                <p>
                  For privacy questions, license inquiries, or technical support, contact Dev Francis directly on Facebook at{' '}
                  <span className="text-brand-300 font-medium">fb.com/Ukauru</span> or via Maya at{' '}
                  <span className="text-amber-300 font-mono font-medium">0991 225 5156</span>.
                </p>
              </section>
            </div>
          ) : (
            <div className="space-y-5">
              <div className="p-4 rounded-xl bg-amber-950/30 border border-amber-500/30 flex items-start gap-3">
                <FileText className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <span className="font-semibold text-white block text-sm">End-User License Agreement (EULA)</span>
                  <span className="text-slate-300 text-xs">
                    By downloading or running TINDA POS, you agree to these fair usage and anti-theft licensing terms.
                  </span>
                </div>
              </div>

              <section className="space-y-2">
                <h4 className="text-sm font-bold text-white uppercase tracking-wider text-amber-400">
                  1. License Editions
                </h4>
                <ul className="list-disc pl-5 space-y-1.5 text-slate-300">
                  <li>
                    <strong className="text-white">Community Edition:</strong> 100% Free lifetime access with single-counter operation, up to 50 active products, and standard receipt watermarks.
                  </li>
                  <li>
                    <strong className="text-white">VIP Pro Edition:</strong> One-time ₱500 payment via Maya (0991 225 5156) for a perpetual, lifetime hardware-locked license per PC. Unlocks unlimited products, Multi-PC LAN Network, Suki Trust Scorecard, 1-Click SMS collection reminders, and custom receipt branding. No recurring monthly or annual fees.
                  </li>
                </ul>
              </section>

              <section className="space-y-2">
                <h4 className="text-sm font-bold text-white uppercase tracking-wider text-amber-400">
                  2. Anti-Piracy & Anti-Theft Policy
                </h4>
                <p>
                  TINDA POS is the proprietary intellectual property of Dev Francis. You may not reverse-engineer, crack, rebrand, or resell this software on e-commerce marketplaces (Shopee, Lazada, TikTok Shop) or online forums. Keys generated for one machine are non-transferable without developer authorization.
                </p>
              </section>

              <section className="space-y-2">
                <h4 className="text-sm font-bold text-white uppercase tracking-wider text-amber-400">
                  3. Store Backups & Data Responsibility
                </h4>
                <p>
                  Store owners are solely responsible for creating regular offline database backups via <em>Settings &rarr; Database & Backup &rarr; Backup to File</em>. The developer is not liable for data loss caused by local computer hardware breakdown or power failure.
                </p>
              </section>

              <section className="space-y-2">
                <h4 className="text-sm font-bold text-white uppercase tracking-wider text-amber-400">
                  4. As-Is Software Disclaimer
                </h4>
                <p>
                  TINDA POS is provided &ldquo;as is&rdquo; as a local POS helper tool for micro and small businesses. The store owner is responsible for compliance with local government, DTI, and BIR regulations.
                </p>
              </section>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-6 py-3.5 border-t border-ink-line bg-ink-950/80">
          <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
            <Heart className="h-3.5 w-3.5 text-rose-400" />
            <span>Dev Francis · Maya 0991 225 5156</span>
          </div>
          <button
            onClick={onClose}
            className="btn-primary py-1.5 px-5 text-xs font-semibold bg-brand-500 hover:bg-brand-600 text-white"
          >
            Understood & Close
          </button>
        </div>
      </div>
    </div>
  )
}
