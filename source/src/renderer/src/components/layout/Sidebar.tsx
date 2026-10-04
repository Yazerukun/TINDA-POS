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
  Sparkles
} from 'lucide-react'
import { useGuide } from '../../stores/guide'
import { useNav, type PageKey } from '../../stores/nav'
import { useAuth } from '../../stores/auth'
import { useSettings } from '../../stores/settings'
import { hasPermission, type Permission } from '@shared/roles'
import { ConnectionStatus } from '../ConnectionStatus'

interface NavItem {
  key: PageKey
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
    title: 'Cashier & Register',
    items: [
      { key: 'pos', label: 'POS Cashier', icon: <ShoppingCart className="h-4 w-4" />, permission: 'pos:use', isHot: true },
      { key: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="h-4 w-4" />, permission: 'dashboard:view' },
      { key: 'ewallet', label: 'E-Wallet & Audit', icon: <Landmark className="h-4 w-4 text-emerald-400" />, permission: 'pos:use', badge: 'VIP' }
    ]
  },
  {
    title: 'Stock & Operations',
    items: [
      { key: 'inventory', label: 'Inventory', icon: <Boxes className="h-4 w-4" />, permission: 'products:manage' },
      { key: 'suppliers', label: 'Suppliers', icon: <Truck className="h-4 w-4" />, permission: 'suppliers:manage' },
      { key: 'expenses', label: 'Store Expenses', icon: <Receipt className="h-4 w-4" />, permission: 'expenses:manage' }
    ]
  },
  {
    title: 'Customers & Suki',
    items: [
      { key: 'customers', label: 'Customers', icon: <Users className="h-4 w-4" />, permission: 'customers:manage' },
      { key: 'utang', label: 'Utang Ledger', icon: <Wallet className="h-4 w-4" />, permission: 'pos:utang' }
    ]
  },
  {
    title: 'Records & Reports',
    items: [
      { key: 'transactions', label: 'Transactions', icon: <ListOrdered className="h-4 w-4" />, permission: 'transactions:view' },
      { key: 'reports', label: 'Reports & Z-Read', icon: <BarChart3 className="h-4 w-4" />, permission: 'reports:view' }
    ]
  },
  {
    title: 'System & Guide',
    items: [
      { key: 'settings', label: 'Settings', icon: <Settings className="h-4 w-4" />, permission: 'settings:manage' },
      { key: 'backup', label: 'Data & Backup', icon: <HardDriveDownload className="h-4 w-4" />, permission: 'backup:manage' },
      { key: 'handbook', label: 'Store Handbook', icon: <BookOpen className="h-4 w-4 text-amber-400" /> }
    ]
  }
]

export function Sidebar(): React.JSX.Element {
  const { page, setPage } = useNav()
  const { user, logout } = useAuth()
  const { settings } = useSettings()
  const [isVip, setIsVip] = useState(false)

  useEffect(() => {
    window.api?.license?.getStatus().then((s) => setIsVip(s.isVip)).catch(() => {})
  }, [page])

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
        <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 text-sm font-black text-white shadow-card ring-1 ring-white/10">
          TP
          <span className="absolute -bottom-0.5 -right-0.5 flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500 ring-2 ring-ink-900" />
          </span>
        </div>
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
      <nav className="flex-1 overflow-y-auto px-3 py-2 space-y-3.5 scrollbar-thin">
        {filteredSections.map((sec) => (
          <div key={sec.title} className="space-y-0.5">
            <p className="px-2 pb-1 text-[10px] font-bold uppercase tracking-wider text-slate-500">
              {sec.title}
            </p>
            <div className="space-y-0.5">
              {sec.items.map((n) => {
                const isActive = page === n.key
                return (
                  <button
                    key={n.key}
                    type="button"
                    onClick={() => setPage(n.key)}
                    className={`group flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-xs font-medium transition-all ${
                      isActive
                        ? 'bg-gradient-to-r from-brand-600/20 via-brand-600/10 to-transparent text-brand-300 font-semibold border-l-2 border-brand-500 shadow-sm'
                        : 'text-slate-400 hover:bg-ink-800/80 hover:text-slate-200 hover:translate-x-0.5'
                    }`}
                  >
                    <span className="flex items-center gap-2.5 truncate">
                      <span className={`shrink-0 transition-transform group-hover:scale-110 ${isActive ? 'text-brand-400' : 'text-slate-400'}`}>
                        {n.icon}
                      </span>
                      <span className="truncate">{n.label}</span>
                    </span>
                    <span className="flex items-center gap-1.5 shrink-0">
                      {n.badge && (
                        <span className="inline-flex items-center gap-1 rounded bg-amber-500/15 px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wider text-amber-300 border border-amber-500/30">
                          💎 {n.badge}
                        </span>
                      )}
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
        {/* Quick Screen Tools */}
        <div className="grid grid-cols-2 gap-1.5">
          <button
            type="button"
            onClick={() => void window.api.app.toggleSalesMonitor()}
            className="flex items-center justify-center gap-1.5 rounded-lg border border-brand-500/25 bg-brand-500/10 px-2 py-1.5 text-[11px] font-semibold text-brand-300 hover:border-brand-500/40 hover:bg-brand-500/20 transition shadow-sm active:scale-95"
            title="Open / Toggle Live Sales Monitor & Customer Display"
          >
            <Tv className="h-3.5 w-3.5 text-brand-400 shrink-0" />
            <span className="truncate">Monitor</span>
          </button>

          <button
            type="button"
            onClick={() => useGuide.getState().openGuide('start')}
            className="flex items-center justify-center gap-1.5 rounded-lg border border-amber-500/25 bg-amber-500/10 px-2 py-1.5 text-[11px] font-semibold text-amber-300 hover:border-amber-500/40 hover:bg-amber-500/20 transition shadow-sm active:scale-95"
            title="Open User Guide & Cashier Instructions"
          >
            <HelpCircle className="h-3.5 w-3.5 text-amber-400 shrink-0" />
            <span className="truncate">Guide</span>
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
            title="Unlock unlimited products, LAN hub, and VIP features for ₱500 lifetime"
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
    </aside>
  )
}
