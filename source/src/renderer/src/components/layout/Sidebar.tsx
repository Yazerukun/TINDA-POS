import { useEffect, useState } from 'react'
import {
  LayoutDashboard,
  ShoppingCart,
  Boxes,
  Wallet,
  Receipt,
  Truck,
  ListOrdered,
  BarChart3,
  HardDriveDownload,
  Settings,
  Users,
  LogOut,
  HelpCircle,
  BookOpen,
  Crown,
  Tv,
  Landmark,
  Sparkles,
  Wrench,
  Zap,
  RefreshCw,
  Loader2,
  Bot,
  Printer,
  Tag
} from 'lucide-react'
import { useGuide } from '../../stores/guide'
import { useNav, type PageKey } from '../../stores/nav'
import { useAuth } from '../../stores/auth'
import { useSettings } from '../../stores/settings'
import { useLicense } from '../../stores/license'
import { useUpdate } from '../../stores/update'
import { hasPermission, type Permission } from '@shared/roles'
import { ConnectionStatus } from '../ConnectionStatus'
import { AppLogo } from '../AppLogo'
import { PrinterStudioModal } from '../PrinterStudioModal'

interface NavItem {
  key: PageKey | 'updates' | 'printerStudio'
  label: string
  icon: React.ReactNode
  permission?: Permission
  badge?: string
  isHot?: boolean
}

interface NavSection {
  title: string
  items: NavItem[]
}

const SECTIONS: NavSection[] = [
  {
    title: 'Storefront & Register',
    items: [
      { key: 'pos', label: 'POS Cashier', icon: <ShoppingCart className="h-4 w-4" />, permission: 'pos:use', isHot: true },
      { key: 'ewallet', label: 'E-Wallet & Bills', icon: <Landmark className="h-4 w-4 text-emerald-400" />, permission: 'pos:use' },
      { key: 'printing', label: 'Customer Print Services', icon: <Printer className="h-4 w-4 text-sky-400" />, permission: 'pos:use' }
    ]
  },
  {
    title: 'Inventory & Operations',
    items: [
      { key: 'inventory', label: 'Inventory & Stock', icon: <Boxes className="h-4 w-4" />, permission: 'products:manage' },
      { key: 'suppliers', label: 'Suppliers', icon: <Truck className="h-4 w-4" />, permission: 'suppliers:manage' },
      { key: 'expenses', label: 'Operating Expenses', icon: <Receipt className="h-4 w-4" />, permission: 'expenses:manage' }
    ]
  },
  {
    title: 'Customers & Suki',
    items: [
      { key: 'customers', label: 'Customer Directory', icon: <Users className="h-4 w-4" />, permission: 'customers:manage' },
      { key: 'utang', label: 'Utang Ledger', icon: <Wallet className="h-4 w-4 text-rose-400" />, permission: 'pos:utang' }
    ]
  },
  {
    title: 'Sales & Analytics',
    items: [
      { key: 'dashboard', label: 'Dashboard & KPIs', icon: <LayoutDashboard className="h-4 w-4 text-brand-400" />, permission: 'dashboard:view' },
      { key: 'transactions', label: 'Transactions & Receipts', icon: <ListOrdered className="h-4 w-4" />, permission: 'transactions:view' },
      { key: 'reports', label: 'Reports & Z-Reading', icon: <BarChart3 className="h-4 w-4" />, permission: 'reports:view' }
    ]
  },
  {
    title: 'Hardware & System',
    items: [
      { key: 'printerStudio', label: 'Thermal & Label Studio', icon: <Tag className="h-4 w-4 text-indigo-400" />, permission: 'settings:manage' },
      { key: 'settings', label: 'Store Settings', icon: <Settings className="h-4 w-4" />, permission: 'settings:manage' },
      { key: 'backup', label: 'Data & Backup', icon: <HardDriveDownload className="h-4 w-4" />, permission: 'backup:manage' },
      { key: 'handbook', label: 'Store Handbook & SOPs', icon: <BookOpen className="h-4 w-4 text-amber-400" /> },
      { key: 'updates', label: 'Check for Updates', icon: <RefreshCw className="h-4 w-4 text-emerald-400" /> }
    ]
  }
]

export function Sidebar(): React.JSX.Element {
  const { page, setPage } = useNav()
  const { user, logout } = useAuth()
  const { settings } = useSettings()
  const { isVip } = useLicense()
  const { event, checking, check, download, install, showModal, openHub } = useUpdate()
  const [printerStudioOpen, setPrinterStudioOpen] = useState(false)

  // Filter sections by user permissions, keeping only sections that have at least one visible item
  const filteredSections = SECTIONS.map((sec) => ({
    ...sec,
    items: sec.items.filter((item) => (user ? (!item.permission || hasPermission(user.roles, item.permission)) : false))
  })).filter((sec) => sec.items.length > 0)

  const userInitial = (user?.full_name || user?.username || 'U').slice(0, 1).toUpperCase()
  const userRolesText = user?.roles.join(' · ') || 'Cashier'

  return (
    <aside className="flex w-60 shrink-0 flex-col border-r border-ink-line bg-ink-900 select-none">
      {/* Brand Header */}
      <div className="flex items-center gap-3 px-4 pt-4 pb-3 border-b border-ink-line/50">
        <AppLogo size={38} isVip={isVip} showBadge={true} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <p className="truncate text-sm font-bold tracking-tight text-white">TINDA POS</p>
            {isVip && (
              <span className="inline-flex items-center text-[9px] font-extrabold text-amber-400 bg-amber-400/10 px-1.5 py-0.2 rounded border border-amber-400/25">
                PRO
              </span>
            )}
          </div>
          <p className="truncate text-[11px] font-medium text-slate-400" title={settings?.store_name ?? 'Sari-Sari Store'}>
            {settings?.store_name || 'Sari-Sari Store'}
          </p>
        </div>
      </div>

      {/* Network / Offline Indicator */}
      <div className="px-3 pt-2.5 pb-1">
        <ConnectionStatus />
      </div>

      {/* Categorized Navigation List */}
      <nav className="flex-1 overflow-y-auto px-2.5 py-1.5 space-y-2 scrollbar-thin">
        {filteredSections.map((sec) => (
          <div key={sec.title} className="space-y-0.5">
            <p className="px-2 pb-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-500">
              {sec.title}
            </p>
            <div className="space-y-0.5">
              {sec.items.map((n) => {
                const isActive = page === n.key
                return (
                  <button
                    key={n.key}
                    type="button"
                    onClick={() => {
                      if (n.key === 'updates') {
                        openHub()
                        void check(true)
                        return
                      }
                      if (n.key === 'printerStudio') {
                        setPrinterStudioOpen(true)
                        return
                      }
                      setPage(n.key)
                    }}
                    className={`group flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-xs font-medium transition-all ${
                      isActive
                        ? 'bg-gradient-to-r from-brand-600/20 via-brand-600/10 to-transparent text-brand-300 font-semibold border-l-2 border-brand-500 shadow-sm'
                        : n.key === 'updates' && event?.status === 'UPDATE_AVAILABLE'
                        ? 'bg-emerald-500/15 text-emerald-300 font-bold border-l-2 border-emerald-400 shadow-sm'
                        : n.key === 'updates' && event?.status === 'READY_TO_INSTALL'
                        ? 'bg-emerald-500/20 text-white font-extrabold border-l-2 border-emerald-400 shadow-md'
                        : 'text-slate-400 hover:bg-ink-800/80 hover:text-slate-200 hover:translate-x-0.5'
                    }`}
                  >
                    <span className="flex items-center gap-2.5 truncate">
                      <span className={`shrink-0 transition-transform group-hover:scale-110 ${
                        isActive
                          ? 'text-brand-400'
                          : n.key === 'updates' && (event?.status === 'UPDATE_AVAILABLE' || event?.status === 'READY_TO_INSTALL')
                          ? 'text-emerald-400 animate-pulse'
                          : 'text-slate-400'
                      }`}>
                        {n.key === 'updates' && checking ? (
                          <RefreshCw className="h-4 w-4 animate-spin text-emerald-400" />
                        ) : n.key === 'updates' && event?.status === 'DOWNLOADING' ? (
                          <Loader2 className="h-4 w-4 animate-spin text-brand-400" />
                        ) : (
                          n.icon
                        )}
                      </span>
                      <span className="truncate">{n.label}</span>
                    </span>
                    <span className="flex items-center gap-1.5 shrink-0">
                      {n.key === 'updates' ? (
                        event?.status === 'UPDATE_AVAILABLE' ? (
                          <span className="inline-flex items-center gap-1 rounded bg-emerald-500/25 px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wider text-emerald-300 border border-emerald-500/40 animate-pulse">
                            ⚡ v{event.available?.version}
                          </span>
                        ) : event?.status === 'DOWNLOADING' ? (
                          <span className="inline-flex items-center gap-1 rounded bg-brand-500/20 px-1.5 py-0.5 text-[9px] font-bold text-brand-300 border border-brand-500/30">
                            {event.progress?.percent ?? 0}%
                          </span>
                        ) : event?.status === 'READY_TO_INSTALL' ? (
                          <span className="inline-flex items-center gap-0.5 rounded bg-emerald-500 px-1.5 py-0.5 text-[9px] font-black uppercase text-ink-950 shadow-sm animate-bounce">
                            ⚡ APPLY
                          </span>
                        ) : event?.status === 'ERROR' ? (
                          <span className="inline-flex items-center rounded bg-rose-500/20 px-1.5 py-0.5 text-[9px] font-bold text-rose-300 border border-rose-500/30">
                            RETRY
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 font-mono text-[9px] text-slate-500 group-hover:text-slate-400">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500/70" />
                            v{event?.installedVersion || '1.0.80'}
                          </span>
                        )
                      ) : n.badge ? (
                        <span className="inline-flex items-center gap-1 rounded bg-amber-500/15 px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wider text-amber-300 border border-amber-500/30">
                          💎 {n.badge}
                        </span>
                      ) : null}
                      {n.isHot && !isActive && (
                        <span className="h-1.5 w-1.5 rounded-full bg-brand-500/60" />
                      )}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Utilities & Profile Footer */}
      <div className="border-t border-ink-line/70 bg-ink-950/40 p-3 space-y-2">
        {/* Primary Terminal Tools Pill Button */}
        <button
          type="button"
          onClick={() => {
            if (page !== 'pos') setPage('pos')
            window.dispatchEvent(new CustomEvent('tinda-open-pos-tools'))
          }}
          className="group flex w-full items-center justify-between rounded-xl border border-brand-500/35 bg-gradient-to-r from-brand-600/20 via-brand-500/15 to-brand-600/10 px-3 py-2 text-xs font-bold text-brand-300 hover:border-brand-500/60 hover:bg-brand-500/25 transition-all shadow-sm active:scale-[0.98]"
          title="Open POS Terminal Tools (Scanner, Camera, Thermal Printer, CFD, Audio, Cash)"
        >
          <span className="flex items-center gap-2">
            <Wrench className="h-4 w-4 text-brand-400 group-hover:rotate-45 transition-transform shrink-0" />
            <span>Terminal Tools</span>
          </span>
          <span className="rounded bg-brand-500/25 px-1.5 py-0.5 text-[10px] font-mono text-brand-200 border border-brand-500/35 font-bold">
            Tools
          </span>
        </button>

        {/* Secondary Utilities Strip */}
        <div className="grid grid-cols-3 gap-1.5">
          <button
            type="button"
            onClick={() => void window.api.app.toggleSalesMonitor()}
            className="flex items-center justify-center gap-1 rounded-lg border border-sky-500/25 bg-sky-500/10 px-1.5 py-1.5 text-[11px] font-semibold text-sky-300 hover:border-sky-500/40 hover:bg-sky-500/20 transition shadow-sm active:scale-95"
            title="Open / Toggle Live Sales Monitor & Customer Display"
          >
            <Tv className="h-3.5 w-3.5 text-sky-400 shrink-0" />
            <span className="truncate">Monitor</span>
          </button>

          <button
            type="button"
            onClick={() => useGuide.getState().openGuide('tour')}
            className="flex items-center justify-center gap-1 rounded-lg border border-amber-500/25 bg-amber-500/10 px-1.5 py-1.5 text-[11px] font-semibold text-amber-300 hover:border-amber-500/40 hover:bg-amber-500/20 transition shadow-sm active:scale-95"
            title="Open User Guide & Cashier Instructions"
          >
            <HelpCircle className="h-3.5 w-3.5 text-amber-400 shrink-0" />
            <span className="truncate">Guide</span>
          </button>

          <button
            type="button"
            onClick={() => window.dispatchEvent(new CustomEvent('tinda-open-ai-assistant'))}
            className="flex items-center justify-center gap-1 rounded-lg border border-indigo-500/35 bg-indigo-500/15 px-1.5 py-1.5 text-[11px] font-bold text-indigo-300 hover:border-indigo-400 hover:bg-indigo-500/25 transition shadow-sm active:scale-95"
            title="Open TindaBot AI Assistant"
          >
            <Bot className="h-3.5 w-3.5 text-indigo-400 shrink-0" />
            <span className="truncate">AI Bot</span>
          </button>
        </div>

        {/* Staff Identity Card */}
        <div className="flex items-center justify-between gap-2 rounded-xl bg-ink-850/80 border border-ink-line p-2 shadow-sm">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-ink-750 text-xs font-bold text-slate-200 border border-ink-line">
              {userInitial}
              <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-emerald-500 ring-2 ring-ink-850" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-xs font-bold text-slate-100 leading-tight">
                {user?.full_name || user?.username || 'Staff'}
              </p>
              <p className="truncate text-[10px] font-medium text-slate-400 uppercase tracking-tight">
                {userRolesText}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={logout}
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-slate-400 hover:bg-danger-500/15 hover:text-danger-400 transition"
            title="Sign out of TINDA POS"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>

        {/* VIP Status or Upgrade Callout */}
        {isVip ? (
          <div className="flex items-center justify-center gap-1.5 rounded-lg bg-gradient-to-r from-amber-500/10 via-amber-400/10 to-amber-500/10 py-1 px-2 border border-amber-500/25">
            <Crown className="h-3.5 w-3.5 text-amber-400 shrink-0" />
            <span className="text-[10px] font-bold text-amber-300 tracking-wide uppercase">
              VIP Pro Activated
            </span>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setPage('settings')}
            className="group flex w-full items-center justify-center gap-1.5 rounded-lg bg-gradient-to-r from-amber-500/20 via-amber-400/20 to-amber-500/20 hover:from-amber-500/30 hover:to-amber-400/30 py-1.5 px-2 text-[11px] font-bold text-amber-300 border border-amber-500/40 shadow-sm transition active:scale-95"
            title="Unlock unlimited products, multi-counter sync, and VIP features for ₱500 lifetime"
          >
            <Sparkles className="h-3.5 w-3.5 text-amber-400 transition-transform group-hover:rotate-12" />
            <span>Upgrade to VIP (₱500)</span>
          </button>
        )}

        {/* Dev Signature */}
        <p className="dev-signature signature-reveal text-center text-xs italic text-slate-600 pt-0.5">
          by Dev Francis
        </p>
      </div>
      {printerStudioOpen && (
        <PrinterStudioModal
          open={printerStudioOpen}
          onClose={() => setPrinterStudioOpen(false)}
          initialTab="label"
        />
      )}
    </aside>
  )
}
