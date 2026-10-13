import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import {
  Bell,
  Sparkles,
  X,
  Volume2,
  VolumeX,
  TrendingUp,
  AlertTriangle,
  Clock,
  ArrowRight,
  ExternalLink,
  DollarSign,
  ShieldAlert,
  RefreshCw,
  Send,
  Bot,
  Boxes,
  CreditCard,
  Wallet,
  Receipt,
  Calendar,
  CheckCircle2,
  Store,
  HelpCircle
} from 'lucide-react'
import { useNotificationDrawer, getCriticalAlertCount, type DrawerTab } from '../../stores/notificationDrawer'
import { useOnlineStatus } from '../../hooks/useOnlineStatus'
import { useSettings } from '../../stores/settings'
import { useNav, type PageKey } from '../../stores/nav'
import {
  generateStoreBriefing,
  askAdvisorQuestion,
  speakAdvisorBriefing,
  stopAdvisorSpeech,
  isAdvisorSpeaking,
  type AdvisorLanguage,
  type StoreExecutiveBriefing,
  type AdvisorQAResponse
} from '../../services/aiStoreAdvisor'
import { money, shortDate } from '@shared/format'
import type { StoreTelemetrySummary } from '@shared/types'

/**
 * Audio Waveform animated indicator when AI Advisor is speaking.
 */
function AudioWaveformIndicator({ isSpeaking }: { isSpeaking: boolean }): React.JSX.Element {
  if (!isSpeaking) return <Volume2 className="h-4 w-4 text-emerald-400" />
  return (
    <div className="flex items-center gap-0.5 px-0.5">
      <span className="w-0.5 h-3 bg-emerald-400 rounded-full animate-pulse" />
      <span className="w-0.5 h-4.5 bg-emerald-300 rounded-full animate-bounce [animation-delay:0.15s]" />
      <span className="w-0.5 h-2.5 bg-emerald-400 rounded-full animate-bounce [animation-delay:0.3s]" />
      <span className="w-0.5 h-4 bg-emerald-200 rounded-full animate-pulse [animation-delay:0.45s]" />
    </div>
  )
}

/**
 * Notification Bell Trigger Button.
 * Online-Reactive with emerald pulse beacon, alert count badge, and F9 / Ctrl+B shortcut.
 */
export function NotificationBellButton({ className = '' }: { className?: string }): React.JSX.Element {
  const { isOpen, toggleDrawer, telemetry, fetchTelemetry } = useNotificationDrawer()
  const online = useOnlineStatus()
  const criticalCount = useMemo(() => getCriticalAlertCount(telemetry), [telemetry])

  // Periodic poll every 60s for updated alert count
  useEffect(() => {
    void fetchTelemetry()
    const timer = setInterval(() => {
      void fetchTelemetry()
    }, 60_000)
    return () => clearInterval(timer)
  }, [fetchTelemetry])

  return (
    <button
      type="button"
      onClick={toggleDrawer}
      aria-label="Store Notifications & AI Advisor"
      title={
        online
          ? `Store Alerts & AI Advisor (Online) • ${criticalCount} Alert${criticalCount === 1 ? '' : 's'} (F9 / Ctrl+B)`
          : `Store Alerts & AI Advisor (Offline Ready) • ${criticalCount} Alert${criticalCount === 1 ? '' : 's'} (F9 / Ctrl+B)`
      }
      className={`group relative flex h-9 w-9 items-center justify-center rounded-xl border transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/50 active:scale-95 ${
        isOpen
          ? 'border-emerald-500/60 bg-emerald-500/20 text-emerald-300 shadow-md shadow-emerald-500/10'
          : online
            ? 'border-white/10 bg-white/5 text-slate-300 hover:border-emerald-500/40 hover:bg-emerald-500/10 hover:text-emerald-300'
            : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:border-slate-700 hover:bg-slate-800/80 hover:text-slate-300'
      } ${className}`}
    >
      <Bell className={`h-4.5 w-4.5 transition-transform duration-200 ${isOpen ? 'rotate-12' : 'group-hover:rotate-12'}`} />

      {/* Online Beacon vs Offline Dot */}
      {online ? (
        <span className="absolute top-1 right-1 flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75 animate-ping" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500 ring-1 ring-ink-950" />
        </span>
      ) : (
        <span className="absolute top-1 right-1 h-1.5 w-1.5 rounded-full bg-slate-500 ring-1 ring-ink-950" />
      )}

      {/* Critical Alert Counter Badge */}
      {criticalCount > 0 && (
        <span
          className={`absolute -top-1.5 -right-1.5 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[9px] font-black text-white shadow-md ring-2 ring-ink-950 ${
            online ? 'bg-rose-500 shadow-rose-500/40' : 'bg-slate-600'
          }`}
        >
          {criticalCount > 99 ? '99+' : criticalCount}
        </span>
      )}
    </button>
  )
}

/**
 * Slide-Over Cupertino Glassmorphism Drawer component with AI Advisor, Live Financials, and Alerts.
 */
export function NotificationBellDrawer(): React.JSX.Element | null {
  const {
    isOpen,
    closeDrawer,
    toggleDrawer,
    activeTab,
    setActiveTab,
    language,
    setLanguage,
    telemetry,
    isLoading,
    fetchTelemetry
  } = useNotificationDrawer()

  const { settings } = useSettings()
  const { setPage } = useNav()
  const online = useOnlineStatus()

  // Live Local Clock State
  const [currentTime, setCurrentTime] = useState<string>(() =>
    new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
  )

  useEffect(() => {
    const clockTimer = setInterval(() => {
      setCurrentTime(
        new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      )
    }, 1000)
    return () => clearInterval(clockTimer)
  }, [])

  // Global Keyboard Shortcuts: F9 and Ctrl+B / Cmd+B to toggle; Escape to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F9' || ((e.ctrlKey || e.metaKey) && (e.key === 'b' || e.key === 'B'))) {
        e.preventDefault()
        toggleDrawer()
      } else if (e.key === 'Escape' && isOpen) {
        e.preventDefault()
        closeDrawer()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, toggleDrawer, closeDrawer])

  // Speech Synthesizer State
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false)

  // Sync speaking status on unmount or drawer close
  useEffect(() => {
    if (!isOpen) {
      stopAdvisorSpeech()
      setIsSpeaking(false)
    }
  }, [isOpen])

  // Stop speaking when language changes
  const handleLanguageToggle = (nextLang: AdvisorLanguage) => {
    stopAdvisorSpeech()
    setIsSpeaking(false)
    setLanguage(nextLang)
  }

  // Interactive Question & Answer State
  const [questionInput, setQuestionInput] = useState<string>('')
  const [activeQA, setActiveQA] = useState<AdvisorQAResponse | null>(null)
  const [isAsking, setIsAsking] = useState<boolean>(false)

  // Executive briefing memo
  const briefing: StoreExecutiveBriefing | null = useMemo(() => {
    if (!telemetry) return null
    return generateStoreBriefing(telemetry, language)
  }, [telemetry, language])

  // Critical Alerts Count
  const criticalCount = useMemo(() => getCriticalAlertCount(telemetry), [telemetry])

  // Speech handler for executive briefing
  const handleToggleSpeech = useCallback(() => {
    if (!briefing) return

    if (isSpeaking || isAdvisorSpeaking()) {
      stopAdvisorSpeech()
      setIsSpeaking(false)
      return
    }

    setIsSpeaking(true)
    void speakAdvisorBriefing(briefing.speechScript, {
      lang: language,
      onStart: () => setIsSpeaking(true),
      onEnd: () => setIsSpeaking(false),
      onError: () => setIsSpeaking(false)
    })
  }, [briefing, isSpeaking, language])

  // Question submission handler
  const handleAskQuestion = useCallback(
    (questionText: string) => {
      if (!telemetry || !questionText.trim()) return
      stopAdvisorSpeech()
      setIsSpeaking(false)
      setIsAsking(true)

      try {
        const response = askAdvisorQuestion(questionText.trim(), telemetry, language)
        setActiveQA(response)
      } catch (err) {
        console.error('[AI Advisor] QA Error:', err)
      } finally {
        setIsAsking(false)
        setQuestionInput('')
      }
    },
    [telemetry, language]
  )

  // QA answer speech handler
  const handleSpeakQA = useCallback(
    (speechText: string) => {
      if (isSpeaking) {
        stopAdvisorSpeech()
        setIsSpeaking(false)
        return
      }

      setIsSpeaking(true)
      void speakAdvisorBriefing(speechText, {
        lang: language,
        onStart: () => setIsSpeaking(true),
        onEnd: () => setIsSpeaking(false),
        onError: () => setIsSpeaking(false)
      })
    },
    [isSpeaking, language]
  )

  // Action navigation helper
  const handleNavigateAction = useCallback(
    (page: string) => {
      closeDrawer()
      setPage(page as PageKey)
    },
    [closeDrawer, setPage]
  )

  // Open Cloud Dashboard in browser
  const handleOpenCloudDashboard = useCallback(() => {
    if (typeof window !== 'undefined' && window.api?.app?.openExternal) {
      void window.api.app.openExternal('https://tinda-owner-dashboard.pages.dev/')
    } else {
      window.open('https://tinda-owner-dashboard.pages.dev/', '_blank')
    }
  }, [])

  // Quick chips definitions
  const quickChipsEn = [
    { label: '🏆 Best Sellers', query: 'What are our best selling products today?' },
    { label: '⚠️ Low Stock', query: 'Which items are low in stock?' },
    { label: '💵 Cash Drawer', query: 'How much cash is in the drawer?' },
    { label: '🛑 Voids', query: 'Were there any voided sales today?' },
    { label: '💳 Overdue Utang', query: 'How much is the total overdue utang?' }
  ]

  const quickChipsTl = [
    { label: '🏆 Pinakamabenta', query: 'Ano ang pinakamabentang paninda ngayon?' },
    { label: '⚠️ Mauubos na Stock', query: 'Aling mga paninda ang mauubos na?' },
    { label: '💵 Pera sa Kaha', query: 'Magkano ang inaasahang pera sa kaha?' },
    { label: '🛑 Na-void', query: 'May na-void bang benta ngayong araw?' },
    { label: '💳 May Utang', query: 'Magkano ang kabuuang pautang sa suki?' }
  ]

  const quickChips = language === 'tl' ? quickChipsTl : quickChipsEn

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 overflow-hidden select-none">
      {/* Cupertino Glassmorphism Backdrop Overlay */}
      <div
        className="fixed inset-0 bg-black/65 backdrop-blur-md transition-opacity duration-300 animate-fadeIn"
        onClick={closeDrawer}
        aria-hidden="true"
      />

      {/* Slide-Over Cupertino Glassmorphism Drawer Panel */}
      <div className="fixed inset-y-0 right-0 flex max-w-full pl-10 pointer-events-auto">
        <div className="w-screen max-w-xl flex flex-col bg-ink-950/92 backdrop-blur-2xl border-l border-white/10 shadow-2xl transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]">
          {/* Top Cupertino Drawer Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 bg-white/[0.02]">
            <div className="flex items-center gap-3 min-w-0">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-tr from-brand-600 via-emerald-600 to-teal-500 shadow-md shadow-brand-500/20 ring-1 ring-white/20">
                <Store className="h-5 w-5 text-white" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-bold text-white tracking-tight truncate">
                    {settings?.store_name || 'TINDA POS'}
                  </h2>
                  {/* Online Beacon */}
                  <div
                    className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                      online
                        ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-400'
                        : 'border-slate-700 bg-slate-800 text-slate-400'
                    }`}
                  >
                    <span
                      className={`h-1.5 w-1.5 rounded-full ${online ? 'bg-emerald-400 animate-pulse' : 'bg-slate-400'}`}
                    />
                    <span>{online ? 'ONLINE' : 'OFFLINE'}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-[11px] text-slate-400">
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3 text-slate-500" />
                    <span className="font-mono text-slate-300">{currentTime}</span>
                  </span>
                  <span>•</span>
                  <span>{telemetry?.business_date ? shortDate(telemetry.business_date) : 'Today'}</span>
                </div>
              </div>
            </div>

            {/* Action Buttons: Language Toggle Pill & Close Button */}
            <div className="flex items-center gap-2">
              {/* Language Toggle Pill */}
              <div className="flex items-center p-0.5 rounded-xl bg-ink-900 border border-white/10">
                <button
                  type="button"
                  onClick={() => handleLanguageToggle('en')}
                  className={`px-2 py-1 rounded-lg text-xs font-semibold transition-all ${
                    language === 'en'
                      ? 'bg-emerald-500/20 text-emerald-300 shadow-sm border border-emerald-500/30'
                      : 'text-slate-400 hover:text-white'
                  }`}
                  title="Switch to English"
                >
                  🇺🇸 EN
                </button>
                <button
                  type="button"
                  onClick={() => handleLanguageToggle('tl')}
                  className={`px-2 py-1 rounded-lg text-xs font-semibold transition-all ${
                    language === 'tl'
                      ? 'bg-emerald-500/20 text-emerald-300 shadow-sm border border-emerald-500/30'
                      : 'text-slate-400 hover:text-white'
                  }`}
                  title="Switch to Tagalog"
                >
                  🇵🇭 TL
                </button>
              </div>

              {/* Refresh Telemetry */}
              <button
                type="button"
                onClick={() => void fetchTelemetry()}
                disabled={isLoading}
                aria-label="Refresh telemetry data"
                className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white transition active:scale-95 disabled:opacity-50"
                title="Refresh Metrics"
              >
                <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin text-emerald-400' : ''}`} />
              </button>

              {/* Close Drawer */}
              <button
                type="button"
                onClick={closeDrawer}
                aria-label="Close drawer"
                className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-400 hover:text-white transition active:scale-95"
                title="Close (Esc)"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* 3 Bento Segmented Navigation Tabs */}
          <div className="px-5 pt-3 pb-2 border-b border-white/10 bg-white/[0.01]">
            <div className="grid grid-cols-3 gap-1.5 p-1 rounded-2xl bg-ink-900/90 border border-white/10">
              <button
                type="button"
                onClick={() => setActiveTab('advisor')}
                className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-bold transition-all ${
                  activeTab === 'advisor'
                    ? 'bg-gradient-to-r from-brand-600 to-emerald-600 text-white shadow-md shadow-brand-500/20'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <Bot className="h-3.5 w-3.5" />
                <span>{language === 'tl' ? 'AI Advisor' : 'AI Advisor'}</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('financials')}
                className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-bold transition-all ${
                  activeTab === 'financials'
                    ? 'bg-gradient-to-r from-brand-600 to-emerald-600 text-white shadow-md shadow-brand-500/20'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <TrendingUp className="h-3.5 w-3.5" />
                <span>{language === 'tl' ? 'Pananalapi' : 'Financials'}</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('alerts')}
                className={`relative flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-bold transition-all ${
                  activeTab === 'alerts'
                    ? 'bg-gradient-to-r from-brand-600 to-emerald-600 text-white shadow-md shadow-brand-500/20'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <AlertTriangle className="h-3.5 w-3.5" />
                <span>{language === 'tl' ? 'Mga Babala' : 'Alerts'}</span>
                {criticalCount > 0 && (
                  <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[9px] font-black text-white shadow-sm">
                    {criticalCount}
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Drawer Body Area */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4 scrollbar-thin">
            {/* ======================================================== */}
            {/* TAB 1: 🤖 AI ADVISOR */}
            {/* ======================================================== */}
            {activeTab === 'advisor' && (
              <div className="space-y-4 animate-fadeIn">
                {/* Executive Briefing Card */}
                {briefing ? (
                  <div className="rounded-2xl border border-white/10 bg-gradient-to-b from-white/[0.04] to-white/[0.01] p-4.5 space-y-3.5 shadow-xl ring-1 ring-white/5">
                    {/* Briefing Card Header */}
                    <div className="flex items-center justify-between pb-2 border-b border-white/10">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">🤖</span>
                        <div>
                          <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                            {language === 'tl' ? 'Ulat ng Tindahan' : 'Executive Store Briefing'}
                          </h3>
                          <p className="text-[10px] text-slate-400">
                            {language === 'tl' ? 'Pagsusuri sa real-time na benta at kaha' : 'Real-time ledger & operational telemetry'}
                          </p>
                        </div>
                      </div>

                      {/* Listen / Stop Audio Button */}
                      <button
                        type="button"
                        onClick={handleToggleSpeech}
                        className={`group flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all active:scale-95 ${
                          isSpeaking
                            ? 'border-rose-500/50 bg-rose-500/20 text-rose-300 shadow-md shadow-rose-500/20 ring-1 ring-rose-400/40'
                            : 'border-emerald-500/40 bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/25 shadow-sm'
                        }`}
                        title={isSpeaking ? 'Stop speaking' : 'Listen to briefing read aloud'}
                      >
                        <AudioWaveformIndicator isSpeaking={isSpeaking} />
                        <span>
                          {isSpeaking
                            ? language === 'tl'
                              ? 'Ihinto'
                              : 'Stop'
                            : language === 'tl'
                              ? 'Pakinggan'
                              : 'Listen'}
                        </span>
                      </button>
                    </div>

                    {/* Status Badge & Headline */}
                    <div className="p-3 rounded-xl bg-ink-900/80 border border-white/10 space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold">{briefing.statusBadge}</span>
                      </div>
                      <p className="text-xs leading-relaxed text-slate-200 font-medium">
                        {briefing.statusHeadline}
                      </p>
                    </div>

                    {/* 4 Bento Briefing Sections */}
                    <div className="space-y-2.5">
                      {/* 1. Sales Performance */}
                      <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5 space-y-1.5">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-400">
                          <span>{briefing.salesPerformance.icon}</span>
                          <span>{briefing.salesPerformance.title}</span>
                        </div>
                        <p className="text-xs text-slate-300">{briefing.salesPerformance.summary}</p>
                        <ul className="space-y-1 pl-1 text-[11px] text-slate-400">
                          {briefing.salesPerformance.bulletPoints.map((b, i) => (
                            <li key={i} className="flex items-start gap-1.5">
                              <span className="text-emerald-500/70 mt-0.5">•</span>
                              <span className="flex-1 leading-normal">{b}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* 2. Cash Security */}
                      <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5 space-y-1.5">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-sky-400">
                          <span>{briefing.cashSecurity.icon}</span>
                          <span>{briefing.cashSecurity.title}</span>
                        </div>
                        <p className="text-xs text-slate-300">{briefing.cashSecurity.summary}</p>
                        <ul className="space-y-1 pl-1 text-[11px] text-slate-400">
                          {briefing.cashSecurity.bulletPoints.map((b, i) => (
                            <li key={i} className="flex items-start gap-1.5">
                              <span className="text-sky-500/70 mt-0.5">•</span>
                              <span className="flex-1 leading-normal">{b}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* 3. Inventory Alerts */}
                      <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5 space-y-1.5">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-amber-400">
                          <span>{briefing.inventoryAlerts.icon}</span>
                          <span>{briefing.inventoryAlerts.title}</span>
                        </div>
                        <p className="text-xs text-slate-300">{briefing.inventoryAlerts.summary}</p>
                        <ul className="space-y-1 pl-1 text-[11px] text-slate-400">
                          {briefing.inventoryAlerts.bulletPoints.map((b, i) => (
                            <li key={i} className="flex items-start gap-1.5">
                              <span className="text-amber-500/70 mt-0.5">•</span>
                              <span className="flex-1 leading-normal">{b}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* 4. Executive Recommendations */}
                      <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5 space-y-1.5">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-purple-400">
                          <span>{briefing.actionItems.icon}</span>
                          <span>{briefing.actionItems.title}</span>
                        </div>
                        <ul className="space-y-1 pl-1 text-[11px] text-slate-300">
                          {briefing.actionItems.bulletPoints.map((b, i) => (
                            <li key={i} className="flex items-start gap-1.5">
                              <span className="text-purple-400 mt-0.5">⚡</span>
                              <span className="flex-1 leading-normal font-medium">{b}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-6 text-center text-slate-400 text-xs">
                    {language === 'tl' ? 'Kinukuha ang pinakabagong ulat...' : 'Loading executive briefing...'}
                  </div>
                )}

                {/* 1-Tap Quick Question Chips */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      {language === 'tl' ? 'Mabilisang Tanong' : 'Quick Questions'}
                    </span>
                    <span className="text-[10px] text-slate-500">1-Tap Inquiry</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {quickChips.map((chip, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleAskQuestion(chip.query)}
                        className="px-2.5 py-1.5 rounded-xl bg-ink-900 hover:bg-emerald-500/10 border border-white/10 hover:border-emerald-500/30 text-xs text-slate-300 hover:text-emerald-300 transition-all active:scale-95 shadow-sm"
                      >
                        {chip.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Interactive Ask Input */}
                <form
                  onSubmit={(e) => {
                    e.preventDefault()
                    handleAskQuestion(questionInput)
                  }}
                  className="relative flex items-center"
                >
                  <input
                    type="text"
                    value={questionInput}
                    onChange={(e) => setQuestionInput(e.target.value)}
                    placeholder={
                      language === 'tl'
                        ? 'Magtanong ukol sa benta, kaha, stocks, o utang...'
                        : 'Ask AI Advisor about sales, cash, stocks, suki utang...'
                    }
                    className="w-full rounded-2xl border border-white/10 bg-ink-900/90 py-2.5 pl-3.5 pr-11 text-xs text-white placeholder-slate-500 focus:border-emerald-500/50 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                  <button
                    type="submit"
                    disabled={!questionInput.trim() || isAsking}
                    aria-label="Submit question to AI Advisor"
                    className="absolute right-1.5 flex h-7 w-7 items-center justify-center rounded-xl bg-gradient-to-tr from-brand-600 to-emerald-600 text-white shadow hover:scale-105 active:scale-95 disabled:opacity-30 disabled:hover:scale-100 transition"
                  >
                    <Send className="h-3.5 w-3.5" />
                  </button>
                </form>

                {/* Conversational QA Response Card */}
                {activeQA && (
                  <div className="p-4 rounded-2xl border border-emerald-500/30 bg-emerald-950/20 space-y-2.5 shadow-lg animate-fadeInUp">
                    <div className="flex items-center justify-between pb-1.5 border-b border-emerald-500/20">
                      <div className="flex items-center gap-1.5">
                        <Sparkles className="h-4 w-4 text-emerald-400" />
                        <h4 className="text-xs font-bold text-white">{activeQA.headline}</h4>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleSpeakQA(activeQA.speechText)}
                        className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 text-[10px] font-bold transition active:scale-95"
                        title="Listen to this answer"
                      >
                        <Volume2 className="h-3 w-3" />
                        <span>{language === 'tl' ? 'Pakinggan' : 'Listen'}</span>
                      </button>
                    </div>

                    <p className="text-xs leading-relaxed text-slate-200">{activeQA.answer}</p>

                    {activeQA.bullets.length > 0 && (
                      <ul className="space-y-1 text-[11px] text-slate-300 pl-1">
                        {activeQA.bullets.map((b, i) => (
                          <li key={i} className="flex items-start gap-1.5">
                            <span className="text-emerald-400 mt-0.5">•</span>
                            <span className="flex-1">{b}</span>
                          </li>
                        ))}
                      </ul>
                    )}

                    {/* Action Button */}
                    {activeQA.action && (
                      <div className="pt-2 border-t border-emerald-500/20">
                        <button
                          type="button"
                          onClick={() => handleNavigateAction(activeQA.action!.page)}
                          className="group flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold shadow-md transition active:scale-95"
                        >
                          <span>{activeQA.action.label}</span>
                          <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* ======================================================== */}
            {/* TAB 2: 📊 LIVE FINANCIALS */}
            {/* ======================================================== */}
            {activeTab === 'financials' && (
              <div className="space-y-4 animate-fadeIn">
                {telemetry ? (
                  <>
                    {/* Exact Centavo Financial KPI Grid */}
                    <div className="grid grid-cols-2 gap-2.5">
                      {/* Net Sales */}
                      <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/10 space-y-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">
                          {language === 'tl' ? 'Kabuuang Net Sales' : 'Net Sales'}
                        </span>
                        <p className="text-lg font-black text-white">{money(telemetry.net_sales_c)}</p>
                        <p className="text-[10px] text-slate-400">
                          {telemetry.transaction_count} {language === 'tl' ? 'mga transaksyon' : 'transactions'}
                        </p>
                      </div>

                      {/* Gross Sales */}
                      <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/10 space-y-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          {language === 'tl' ? 'Gross Sales' : 'Gross Sales'}
                        </span>
                        <p className="text-lg font-black text-white">{money(telemetry.gross_sales_c)}</p>
                        <p className="text-[10px] text-slate-400">
                          {money(telemetry.discount_c)} {language === 'tl' ? 'diskwento' : 'discounts'}
                        </p>
                      </div>

                      {/* Discounts & Promos */}
                      <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/10 space-y-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400">
                          {language === 'tl' ? 'Diskwento at Promos' : 'Total Discounts'}
                        </span>
                        <p className="text-lg font-black text-amber-300">{money(telemetry.discount_c)}</p>
                        <p className="text-[10px] text-slate-400">Senior, PWD & Promos</p>
                      </div>

                      {/* Voids & Cancellations */}
                      <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/10 space-y-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-rose-400">
                          {language === 'tl' ? 'Na-void na Benta' : 'Voided Sales'}
                        </span>
                        <p className="text-lg font-black text-rose-400">{money(telemetry.void_total_c)}</p>
                        <p className="text-[10px] text-slate-400">
                          {telemetry.void_count} {language === 'tl' ? 'mga resibo' : 'voided receipts'}
                        </p>
                      </div>

                      {/* Transactions Count */}
                      <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/10 space-y-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-sky-400">
                          {language === 'tl' ? 'Bilang ng Benta' : 'Transactions'}
                        </span>
                        <p className="text-lg font-black text-sky-300">{telemetry.transaction_count}</p>
                        <p className="text-[10px] text-slate-400">
                          {language === 'tl' ? 'Natapos ngayong araw' : 'Completed today'}
                        </p>
                      </div>

                      {/* Average Basket Size */}
                      <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/10 space-y-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-purple-400">
                          {language === 'tl' ? 'Karaniwang Benta (Basket)' : 'Average Basket'}
                        </span>
                        <p className="text-lg font-black text-purple-300">
                          {telemetry.transaction_count > 0
                            ? money(Math.round(telemetry.net_sales_c / telemetry.transaction_count))
                            : '₱0.00'}
                        </p>
                        <p className="text-[10px] text-slate-400">
                          {language === 'tl' ? 'Bawat customer' : 'Per transaction'}
                        </p>
                      </div>
                    </div>

                    {/* Expected Drawer Cash Breakdown Card */}
                    <div className="p-4 rounded-2xl bg-ink-900/90 border border-white/10 space-y-3 shadow-md">
                      <div className="flex items-center justify-between pb-2 border-b border-white/10">
                        <div className="flex items-center gap-1.5">
                          <Wallet className="h-4 w-4 text-emerald-400" />
                          <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                            {language === 'tl' ? 'Kuwenta ng Pera sa Kaha' : 'Expected Drawer Cash Breakdown'}
                          </h4>
                        </div>
                        <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono text-xs font-black">
                          {money(telemetry.expected_drawer_cash_c)}
                        </span>
                      </div>

                      <div className="space-y-1.5 text-xs">
                        <div className="flex justify-between text-slate-300">
                          <span>{language === 'tl' ? 'Panimulang Pondo (Float)' : 'Starting Float'}:</span>
                          <span className="font-mono">{money(telemetry.opening_float_c)}</span>
                        </div>
                        <div className="flex justify-between text-emerald-400">
                          <span>{language === 'tl' ? '+ Cash na Benta' : '+ Cash Sales'}:</span>
                          <span className="font-mono">+{money(telemetry.cash_c)}</span>
                        </div>
                        <div className="flex justify-between text-sky-400">
                          <span>{language === 'tl' ? '+ Cash In (Kaha)' : '+ Cash In'}:</span>
                          <span className="font-mono">+{money(telemetry.cash_in_c)}</span>
                        </div>
                        <div className="flex justify-between text-amber-400">
                          <span>{language === 'tl' ? '- Cash Out (Kaha)' : '- Cash Out'}:</span>
                          <span className="font-mono">-{money(telemetry.cash_out_c)}</span>
                        </div>
                        <div className="flex justify-between text-rose-400">
                          <span>{language === 'tl' ? '- Mga Gastos (Expenses)' : '- Cash Expenses'}:</span>
                          <span className="font-mono">-{money(telemetry.cash_expenses_c)}</span>
                        </div>
                        <div className="flex justify-between text-rose-400">
                          <span>{language === 'tl' ? '- Binalik na Cash (Refunds)' : '- Cash Refunds'}:</span>
                          <span className="font-mono">-{money(telemetry.cash_refunds_c)}</span>
                        </div>
                        <div className="pt-2 border-t border-white/10 flex justify-between font-bold text-white text-sm">
                          <span>{language === 'tl' ? 'Kabuuang Inaasahan sa Kaha' : 'Net Expected Drawer Cash'}:</span>
                          <span className="text-emerald-400 font-mono">{money(telemetry.expected_drawer_cash_c)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Payment Breakdown Bars */}
                    <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/10 space-y-3">
                      <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                        {language === 'tl' ? 'Paraan ng Pagbabayad' : 'Settlement Breakdown'}
                      </h4>

                      {(() => {
                        const totalSettled =
                          telemetry.cash_c +
                          telemetry.gcash_c +
                          telemetry.maya_c +
                          telemetry.maribank_c +
                          telemetry.utang_c

                        const payments = [
                          { label: 'Cash', amount_c: telemetry.cash_c, color: 'bg-emerald-500' },
                          { label: 'GCash', amount_c: telemetry.gcash_c, color: 'bg-sky-500' },
                          { label: 'Maya', amount_c: telemetry.maya_c, color: 'bg-green-500' },
                          { label: 'MariBank', amount_c: telemetry.maribank_c, color: 'bg-teal-500' },
                          { label: 'Utang / Credit', amount_c: telemetry.utang_c, color: 'bg-rose-500' }
                        ]

                        return (
                          <div className="space-y-2">
                            {payments.map((p, idx) => {
                              const pct = totalSettled > 0 ? (p.amount_c / totalSettled) * 100 : 0
                              return (
                                <div key={idx} className="space-y-1">
                                  <div className="flex justify-between text-xs">
                                    <span className="text-slate-300 font-medium">{p.label}</span>
                                    <span className="font-mono text-white">
                                      {money(p.amount_c)} ({pct.toFixed(1)}%)
                                    </span>
                                  </div>
                                  <div className="h-1.5 w-full rounded-full bg-white/10 overflow-hidden">
                                    <div
                                      className={`h-full rounded-full ${p.color}`}
                                      style={{ width: `${pct}%` }}
                                    />
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        )
                      })()}
                    </div>

                    {/* Direct Cloud Dashboard Launcher */}
                    <button
                      type="button"
                      onClick={handleOpenCloudDashboard}
                      className="w-full flex items-center justify-center gap-2 p-3 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-lg shadow-emerald-500/20 transition active:scale-98"
                    >
                      <ExternalLink className="h-4 w-4" />
                      <span>{language === 'tl' ? 'Buksan ang Cloud Owner Dashboard (Web)' : 'Open Cloud Owner Dashboard (tinda-owner-dashboard.pages.dev)'}</span>
                    </button>
                  </>
                ) : (
                  <div className="p-6 text-center text-slate-400 text-xs">
                    {language === 'tl' ? 'Kinukuha ang ulat sa pananalapi...' : 'Loading financial telemetry...'}
                  </div>
                )}
              </div>
            )}

            {/* ======================================================== */}
            {/* TAB 3: 🚨 STORE ALERTS */}
            {/* ======================================================== */}
            {activeTab === 'alerts' && (
              <div className="space-y-4 animate-fadeIn">
                {telemetry ? (
                  <>
                    {/* Summary Counter Banner */}
                    <div className="p-3.5 rounded-2xl bg-ink-900 border border-white/10 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <ShieldAlert className="h-5 w-5 text-amber-400" />
                        <div>
                          <h4 className="text-xs font-bold text-white">
                            {language === 'tl' ? 'Kasalukuyang Babala' : 'Active Store Alerts'}
                          </h4>
                          <p className="text-[10px] text-slate-400">
                            {criticalCount}{' '}
                            {language === 'tl'
                              ? 'kailangang aksyunan sa stocks, expiration, at kaha'
                              : 'critical items needing operational attention'}
                          </p>
                        </div>
                      </div>
                      <span className="px-2.5 py-1 rounded-xl bg-amber-500/20 text-amber-300 font-mono text-xs font-bold">
                        {criticalCount} {language === 'tl' ? 'Babala' : 'Alerts'}
                      </span>
                    </div>

                    {/* Section 1: Low Stock Items List */}
                    <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/10 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <Boxes className="h-4 w-4 text-amber-400" />
                          <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                            {language === 'tl' ? 'Mauubos na Paninda' : 'Critically Low Stock'} (
                            {telemetry.critically_low_stock.length})
                          </h4>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleNavigateAction('inventory')}
                          className="text-[10px] text-amber-400 hover:text-amber-300 font-bold flex items-center gap-0.5"
                        >
                          <span>{language === 'tl' ? 'Tingnan Lahat' : 'Manage'}</span>
                          <ArrowRight className="h-3 w-3" />
                        </button>
                      </div>

                      {telemetry.critically_low_stock.length > 0 ? (
                        <div className="space-y-2">
                          {telemetry.critically_low_stock.map((item) => (
                            <div
                              key={item.id}
                              className="flex items-center justify-between p-2.5 rounded-xl bg-ink-900/80 border border-white/5 text-xs"
                            >
                              <div className="min-w-0 pr-2">
                                <p className="font-semibold text-white truncate">{item.name}</p>
                                <p className="text-[10px] text-slate-400">
                                  {language === 'tl' ? 'Reorder kapag' : 'Reorder at'}: {item.reorder_level} {item.unit}
                                </p>
                              </div>
                              <span
                                className={`px-2 py-0.5 rounded-lg text-xs font-mono font-bold shrink-0 ${
                                  item.stock <= 0
                                    ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                                    : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                }`}
                              >
                                {item.stock} {item.unit}
                              </span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="p-3 text-center text-[11px] text-emerald-400 bg-emerald-500/10 rounded-xl border border-emerald-500/20">
                          {language === 'tl'
                            ? 'Ligtas ang lahat ng stocks at lampas sa reorder limits.'
                            : 'All product inventory levels are safely above reorder thresholds.'}
                        </div>
                      )}
                    </div>

                    {/* Section 2: Expiring Items List */}
                    <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/10 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="h-4 w-4 text-rose-400" />
                          <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                            {language === 'tl' ? 'Malapit nang Mag-Expire' : 'Expiring Products'} (
                            {telemetry.expiring_products.length})
                          </h4>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleNavigateAction('inventory')}
                          className="text-[10px] text-rose-400 hover:text-rose-300 font-bold flex items-center gap-0.5"
                        >
                          <span>{language === 'tl' ? 'Tingnan Lahat' : 'Manage'}</span>
                          <ArrowRight className="h-3 w-3" />
                        </button>
                      </div>

                      {telemetry.expiring_products.length > 0 ? (
                        <div className="space-y-2">
                          {telemetry.expiring_products.map((item, idx) => {
                            const days = item.days_until_expiration
                            const isExpired = days < 0
                            const isToday = days === 0

                            return (
                              <div
                                key={idx}
                                className="flex items-center justify-between p-2.5 rounded-xl bg-ink-900/80 border border-white/5 text-xs"
                              >
                                <div className="min-w-0 pr-2">
                                  <p className="font-semibold text-white truncate">{item.name}</p>
                                  <p className="text-[10px] text-slate-400">
                                    {item.quantity} {item.unit} • {shortDate(item.expiration_date)}
                                  </p>
                                </div>
                                <span
                                  className={`px-2 py-0.5 rounded-lg text-[10px] font-bold shrink-0 ${
                                    isExpired
                                      ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                                      : isToday
                                        ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 animate-pulse'
                                        : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                  }`}
                                >
                                  {isExpired
                                    ? language === 'tl'
                                      ? `Expired (${Math.abs(days)}d)`
                                      : `Expired (${Math.abs(days)}d)`
                                    : isToday
                                      ? language === 'tl'
                                        ? 'Mag-eexpire Ngayon'
                                        : 'Expires Today'
                                      : language === 'tl'
                                        ? `${days} araw natitira`
                                        : `Expires in ${days}d`}
                                </span>
                              </div>
                            )
                          })}
                        </div>
                      ) : (
                        <div className="p-3 text-center text-[11px] text-emerald-400 bg-emerald-500/10 rounded-xl border border-emerald-500/20">
                          {language === 'tl'
                            ? 'Walang produktong mag-eexpire sa susunod na pitong (7) araw.'
                            : 'No product batches expiring within the next 7 days.'}
                        </div>
                      )}
                    </div>

                    {/* Section 3: Overdue / Over-Limit Utang List */}
                    <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/10 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <CreditCard className="h-4 w-4 text-purple-400" />
                          <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                            {language === 'tl' ? 'Pautang sa Suki' : 'Overdue & Over-Limit Utang'} (
                            {telemetry.unpaid_utang_due.customer_count})
                          </h4>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleNavigateAction('utang')}
                          className="text-[10px] text-purple-400 hover:text-purple-300 font-bold flex items-center gap-0.5"
                        >
                          <span>{language === 'tl' ? 'Buksan ang Utang' : 'Open Utang'}</span>
                          <ArrowRight className="h-3 w-3" />
                        </button>
                      </div>

                      {telemetry.unpaid_utang_due.top_debtors.length > 0 ? (
                        <div className="space-y-2">
                          {telemetry.unpaid_utang_due.top_debtors.map((debtor) => (
                            <div
                              key={debtor.customer_id}
                              className="flex items-center justify-between p-2.5 rounded-xl bg-ink-900/80 border border-white/5 text-xs"
                            >
                              <div className="min-w-0 pr-2">
                                <p className="font-semibold text-white truncate">{debtor.name}</p>
                                <p className="text-[10px] text-slate-400">
                                  {language === 'tl' ? 'Credit Limit' : 'Limit'}: {money(debtor.credit_limit_c)}
                                </p>
                              </div>
                              <div className="text-right shrink-0">
                                <p className="font-mono font-bold text-rose-400">{money(debtor.balance_c)}</p>
                                {debtor.is_over_limit && (
                                  <span className="text-[9px] font-bold text-rose-300 bg-rose-500/20 px-1.5 py-0.2 rounded border border-rose-500/30">
                                    ⚠️ {language === 'tl' ? 'Lagpas sa Limit' : 'Over Limit'}
                                  </span>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="p-3 text-center text-[11px] text-emerald-400 bg-emerald-500/10 rounded-xl border border-emerald-500/20">
                          {language === 'tl'
                            ? 'Walang naitalang overdue o lagpas na pautang sa suki.'
                            : 'No customer credit accounts currently exceeding approved limits.'}
                        </div>
                      )}
                    </div>
                  </>
                ) : (
                  <div className="p-6 text-center text-slate-400 text-xs">
                    {language === 'tl' ? 'Kinukuha ang mga babala...' : 'Loading store alerts...'}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
