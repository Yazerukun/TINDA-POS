import React, { useState, useEffect, useCallback, useRef } from 'react'
import {
  ShieldCheck,
  Camera,
  Printer,
  Smartphone,
  BellRing,
  Calculator,
  ChevronLeft,
  ChevronRight,
  ArrowRight,
  Sparkles,
  ChevronDown,
  ChevronUp
} from 'lucide-react'
import { useNav, type PageKey } from '../stores/nav'

interface FeatureSlide {
  id: string
  badge: string
  badgeColor: string
  title: string
  description: string
  ctaText: string
  gradient: string
  border: string
  icon: React.ReactNode
  targetPage: PageKey
  eventTrigger?: string
}

const SLIDES: FeatureSlide[] = [
  {
    id: 'v202-streamlined-workflow',
    badge: '✨ V2.0.2 STREAMLINED WORKFLOW',
    badgeColor: 'border-brand-500/40 bg-brand-500/10 text-brand-300',
    title: 'Zero-Clutter POS & Interactive Cashier Tour',
    description:
      'Clean 1-row POS toolbar with collapsible Quick Keys drawer for maximum product space, paired with an interactive 4-step Store Academy walkthrough.',
    ctaText: 'Start Cashier Tour',
    gradient: 'from-brand-950/60 via-ink-900 to-indigo-950/50',
    border: 'border-brand-500/30',
    icon: <Sparkles className="h-6 w-6 text-brand-400" />,
    targetPage: 'handbook'
  },
  {
    id: 'checkout-immunity',
    badge: '🛡️ ZERO-CRASH IMMUNITY',
    badgeColor: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300',
    title: 'Bulletproof POS Checkout Immunity',
    description:
      'Cashiers are never blocked at checkout. Missing catalog rows, custom print jobs, and composite bundles automatically resolve to custom line items with zero crash.',
    ctaText: 'Open POS Terminal',
    gradient: 'from-emerald-950/60 via-ink-900 to-teal-950/50',
    border: 'border-emerald-500/30',
    icon: <ShieldCheck className="h-6 w-6 text-emerald-400" />,
    targetPage: 'pos'
  },
  {
    id: 'rush-id',
    badge: '📸 PRINTING & PHOTO STUDIO',
    badgeColor: 'border-amber-500/40 bg-amber-500/10 text-amber-300',
    title: 'Rush ID Studio Packages & Fast POS Speed Key',
    description:
      'Official Rush ID packages (4x 1x1 + 2x 2x2 + 2x Passport @ ₱75.00) & ID Lamination Combos (₱95.00) in Printing Hub, with 1-tap POS Fast Buttons.',
    ctaText: 'Explore Printing Hub',
    gradient: 'from-amber-950/60 via-ink-900 to-orange-950/50',
    border: 'border-amber-500/30',
    icon: <Camera className="h-6 w-6 text-amber-400" />,
    targetPage: 'printing'
  },
  {
    id: 'printer-studio',
    badge: '🖨️ HARDWARE CALIBRATION',
    badgeColor: 'border-indigo-500/40 bg-indigo-500/10 text-indigo-300',
    title: 'Dual Receipt & Barcode Alignment Studio',
    description:
      'Micro-tune physical margins, left indentation, cutter feed lines, and Chiteng CT221B thermal labels with 1:1 live WYSIWYG canvas previews.',
    ctaText: 'Open Printer Settings',
    gradient: 'from-indigo-950/60 via-ink-900 to-violet-950/50',
    border: 'border-indigo-500/30',
    icon: <Printer className="h-6 w-6 text-indigo-400" />,
    targetPage: 'settings'
  },
  {
    id: 'cfd-mirroring',
    badge: '📱 SECONDARY DISPLAY',
    badgeColor: 'border-blue-500/40 bg-blue-500/10 text-blue-300',
    title: 'Customer Facing Display (CFD) Mirroring',
    description:
      'Real-time secondary customer display mirroring for GCash, Maya, and MariBank with dynamic scannable QR codes and itemized bill payment breakdowns.',
    ctaText: 'Open E-Wallet Hub',
    gradient: 'from-blue-950/60 via-ink-900 to-sky-950/50',
    border: 'border-blue-500/30',
    icon: <Smartphone className="h-6 w-6 text-blue-400" />,
    targetPage: 'ewallet'
  },
  {
    id: 'utang-reminders',
    badge: '🔔 CREDIT MANAGEMENT',
    badgeColor: 'border-rose-500/40 bg-rose-500/10 text-rose-300',
    title: 'Utang Collection Reminders & Promise Notes',
    description:
      'Track overdue credit balances, promise dates with calendar presets (+3d, +7d, +15d), and get proactive inline alerts directly during POS checkout.',
    ctaText: 'Review Utang Ledger',
    gradient: 'from-rose-950/60 via-ink-900 to-pink-950/50',
    border: 'border-rose-500/30',
    icon: <BellRing className="h-6 w-6 text-rose-400" />,
    targetPage: 'utang'
  },
  {
    id: 'resilient-calculator',
    badge: '🧮 CASHIER ACCELERATOR',
    badgeColor: 'border-teal-500/40 bg-teal-500/10 text-teal-300',
    title: 'Zero-Eval Cashier Quick Calculator (F3)',
    description:
      'Pure Shunting-Yard arithmetic engine with instant sukli change mode, % percent calculation, and global F3 shortcut that never collides with barcode cart entry.',
    ctaText: 'Open Calculator (F3)',
    gradient: 'from-teal-950/60 via-ink-900 to-emerald-950/50',
    border: 'border-teal-500/30',
    icon: <Calculator className="h-6 w-6 text-teal-400" />,
    targetPage: 'pos',
    eventTrigger: 'tinda-open-calculator'
  }
]

const STORAGE_KEY = 'tinda_feature_banner_collapsed_v2'

export function FeatureCarouselBanner(): React.JSX.Element {
  const { setPage } = useNav()
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isPaused, setIsPaused] = useState(false)
  const [isCollapsed, setIsCollapsed] = useState(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) === 'true'
    } catch {
      return false
    }
  })
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  const toggleCollapse = useCallback(() => {
    setIsCollapsed((prev) => {
      const next = !prev
      try {
        localStorage.setItem(STORAGE_KEY, String(next))
      } catch {}
      return next
    })
  }, [])

  const nextSlide = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % SLIDES.length)
  }, [])

  const prevSlide = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + SLIDES.length) % SLIDES.length)
  }, [])

  // Auto-slide every 6 seconds if not paused and not collapsed
  useEffect(() => {
    if (isPaused || isCollapsed) return

    timerRef.current = setInterval(() => {
      nextSlide()
    }, 6000)

    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [isPaused, isCollapsed, nextSlide])

  const currentSlide = SLIDES[currentIndex] ?? SLIDES[0]!

  const handleActionClick = () => {
    setPage(currentSlide.targetPage)
    if (currentSlide.eventTrigger) {
      window.dispatchEvent(new CustomEvent(currentSlide.eventTrigger))
    }
  }

  if (isCollapsed) {
    return (
      <div className="animate-fadeInUp flex items-center justify-between px-3.5 py-2 rounded-xl border border-brand-500/25 bg-gradient-to-r from-ink-900 via-brand-950/30 to-ink-900 shadow-sm">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-brand-400 animate-pulse" />
          <span className="text-xs font-bold text-white tracking-wide">
            v2.0.1 Release Showcase
          </span>
          <span className="text-[10px] font-mono font-bold text-brand-300 bg-brand-500/10 px-2 py-0.5 rounded-full border border-brand-500/20">
            6 New Features
          </span>
        </div>
        <button
          type="button"
          onClick={toggleCollapse}
          className="flex items-center gap-1.5 text-xs font-semibold text-brand-300 hover:text-white transition-colors px-2 py-1 rounded-lg hover:bg-ink-800/60"
        >
          <span>Expand Highlights</span>
          <ChevronDown className="h-3.5 w-3.5" />
        </button>
      </div>
    )
  }

  return (
    <div
      className={`relative overflow-hidden rounded-2xl border ${currentSlide.border} bg-gradient-to-r ${currentSlide.gradient} p-4 md:p-5 shadow-card transition-all duration-500 animate-fadeInUp`}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Top Header Row with Badge & Controls */}
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <span className={`flex items-center gap-1.5 text-[10px] font-black tracking-wider uppercase px-2.5 py-1 rounded-full border shadow-sm ${currentSlide.badgeColor}`}>
            <span className="h-1.5 w-1.5 rounded-full bg-current animate-pulse" />
            <span>{currentSlide.badge}</span>
          </span>
          <span className="text-[11px] font-mono text-slate-400 hidden sm:inline">
            Slide {currentIndex + 1} of {SLIDES.length}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          {/* Slide Navigation Buttons */}
          <button
            type="button"
            onClick={prevSlide}
            aria-label="Previous feature"
            className="flex h-7 w-7 items-center justify-center rounded-lg border border-ink-line/60 bg-ink-850/80 text-slate-300 hover:text-white hover:bg-ink-750 transition-all active:scale-95"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={nextSlide}
            aria-label="Next feature"
            className="flex h-7 w-7 items-center justify-center rounded-lg border border-ink-line/60 bg-ink-850/80 text-slate-300 hover:text-white hover:bg-ink-750 transition-all active:scale-95"
          >
            <ChevronRight className="h-4 w-4" />
          </button>

          {/* Minimize / Collapse Button */}
          <button
            type="button"
            onClick={toggleCollapse}
            title="Minimize feature highlights"
            className="flex h-7 w-7 items-center justify-center rounded-lg border border-ink-line/40 bg-ink-850/60 text-slate-400 hover:text-slate-200 hover:bg-ink-750 transition-all ml-1"
          >
            <ChevronUp className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Main Slide Content */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5 min-w-0">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-ink-800/80 shadow-md">
            {currentSlide.icon}
          </div>
          <div className="min-w-0">
            <h3 className="text-base md:text-lg font-black text-white tracking-tight leading-snug">
              {currentSlide.title}
            </h3>
            <p className="mt-1 text-xs md:text-sm text-slate-300/90 leading-relaxed max-w-3xl">
              {currentSlide.description}
            </p>
          </div>
        </div>

        {/* CTA Action Button */}
        <div className="shrink-0 pt-1 md:pt-0">
          <button
            type="button"
            onClick={handleActionClick}
            className="w-full md:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-white px-4 py-2.5 text-xs font-extrabold text-ink-950 shadow-md hover:bg-slate-100 active:scale-[0.98] transition-all"
          >
            <span>{currentSlide.ctaText}</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Bottom Progress Pagination Indicators */}
      <div className="mt-4 flex items-center justify-between border-t border-white/5 pt-2.5">
        <div className="flex items-center gap-1.5">
          {SLIDES.map((slide, idx) => (
            <button
              key={slide.id}
              type="button"
              onClick={() => setCurrentIndex(idx)}
              aria-label={`Go to slide ${idx + 1}`}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                idx === currentIndex
                  ? 'w-7 bg-white'
                  : 'w-2 bg-white/20 hover:bg-white/40'
              }`}
            />
          ))}
        </div>

        <div className="flex items-center gap-1 text-[11px] text-slate-400">
          <Sparkles className="h-3 w-3 text-brand-400" />
          <span>v2.0.1 Official Release</span>
        </div>
      </div>
    </div>
  )
}
