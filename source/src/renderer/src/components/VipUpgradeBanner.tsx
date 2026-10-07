import React from 'react'
import { Crown, Sparkles, ExternalLink, ArrowRight } from 'lucide-react'

interface VipUpgradeBannerProps {
  onUpgradeClick: () => void
  isVip?: boolean
}

export function VipUpgradeBanner({ onUpgradeClick, isVip }: VipUpgradeBannerProps): React.JSX.Element | null {
  if (isVip) return null

  return (
    <div className="relative overflow-hidden rounded-2xl border border-amber-500/40 bg-gradient-to-r from-amber-950/80 via-ink-900 to-amber-950/80 p-4 md:p-5 shadow-xl transition-all duration-300 hover:border-amber-400/60 transform hover:-translate-y-0.5">
      {/* Background Glow */}
      <div className="absolute -top-12 -right-12 h-36 w-36 rounded-full bg-amber-500/10 blur-2xl pointer-events-none" />
      <div className="absolute -bottom-12 -left-12 h-36 w-36 rounded-full bg-emerald-500/10 blur-2xl pointer-events-none" />

      <div className="relative flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3.5 text-center md:text-left">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 text-ink-950 shadow-md ring-2 ring-amber-400/40">
            <Crown className="h-6 w-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center justify-center md:justify-start gap-2">
              <span className="text-base font-bold text-white tracking-wide">
                Upgrade to TINDA POS <span className="text-amber-400">VIP Pro</span>
              </span>
              <span className="rounded-full bg-amber-500/20 px-2.5 py-0.5 text-[10px] font-bold text-amber-300 border border-amber-500/30">
                ₱500 ONE-TIME
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-0.5">
              Unlock Multi-PC LAN Network · Paperless QR Receipts · Utang Suki Scorecard · Store Branding · Maya 09912255156
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 shrink-0 w-full md:w-auto justify-center">
          <button
            type="button"
            onClick={() => void window.api.app.openExternal('https://www.facebook.com/Ukauru')}
            className="btn-ghost text-xs px-3 py-2 border-amber-500/30 text-amber-300 hover:bg-amber-500/10 flex items-center gap-1.5"
          >
            <Sparkles className="h-3.5 w-3.5" /> Dev Francis <ExternalLink className="h-3 w-3" />
          </button>
          <button
            type="button"
            onClick={onUpgradeClick}
            className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 px-4 py-2 text-xs font-bold text-ink-950 shadow-lg transition active:scale-95 border-0"
          >
            <span>Upgrade to VIP</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  )
}
