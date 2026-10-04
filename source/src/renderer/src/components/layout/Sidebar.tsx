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
  Landmark
} from 'lucide-react'
import { useGuide } from '../../stores/guide'
import { useNav, type PageKey } from '../../stores/nav'
import { useAuth } from '../../stores/auth'
import { useSettings } from '../../stores/settings'
import { hasPermission, type Permission } from '@shared/roles'
import { ConnectionStatus } from '../ConnectionStatus'

const NAV: { key: PageKey; label: string; icon: React.ReactNode; permission?: Permission; badge?: string }[] = [
  { key: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="h-4 w-4" />, permission: 'dashboard:view' },
  { key: 'pos', label: 'POS', icon: <ShoppingCart className="h-4 w-4" />, permission: 'pos:use' },
  { key: 'ewallet', label: 'E-Wallet & Audit', icon: <Landmark className="h-4 w-4 text-emerald-400" />, permission: 'pos:use', badge: 'VIP' },
  { key: 'inventory', label: 'Inventory', icon: <Boxes className="h-4 w-4" />, permission: 'products:manage' },
  { key: 'customers', label: 'Customers', icon: <Users className="h-4 w-4" />, permission: 'customers:manage' },
  { key: 'utang', label: 'Utang', icon: <Wallet className="h-4 w-4" />, permission: 'pos:utang' },
  { key: 'expenses', label: 'Expenses', icon: <Receipt className="h-4 w-4" />, permission: 'expenses:manage' },
  { key: 'suppliers', label: 'Suppliers', icon: <Truck className="h-4 w-4" />, permission: 'suppliers:manage' },
  { key: 'transactions', label: 'Transactions', icon: <ListOrdered className="h-4 w-4" />, permission: 'transactions:view' },
  { key: 'reports', label: 'Reports', icon: <BarChart3 className="h-4 w-4" />, permission: 'reports:view' },
  { key: 'backup', label: 'Backup', icon: <HardDriveDownload className="h-4 w-4" />, permission: 'backup:manage' },
  { key: 'settings', label: 'Settings', icon: <Settings className="h-4 w-4" />, permission: 'settings:manage' },
  { key: 'handbook', label: 'Store Handbook', icon: <BookOpen className="h-4 w-4 text-amber-400" /> }
]

export function Sidebar(): React.JSX.Element {
  const { page, setPage } = useNav()
  const { user, logout } = useAuth()
  const { settings } = useSettings()
  const [isVip, setIsVip] = useState(false)

  useEffect(() => {
    window.api?.license?.getStatus().then((s) => setIsVip(s.isVip)).catch(() => {})
  }, [page])

  const visible = NAV.filter((n) => (user ? (!n.permission || hasPermission(user.roles, n.permission)) : false))

  return (
    <aside className="flex w-56 shrink-0 flex-col border-r border-ink-line bg-ink-900">
      <div className="flex items-center gap-2.5 px-4 py-4">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-600 text-sm font-black text-white shadow-card">
          TP
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-bold leading-tight text-white">TINDA POS</p>
          <p className="truncate text-[11px] text-slate-500">{settings?.store_name ?? 'Sari-Sari Store'}</p>
        </div>
      </div>

      <div className="px-3 pb-2">
        <ConnectionStatus />
      </div>

      <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 py-2">
        {visible.map((n) => (
          <button
            key={n.key}
            onClick={() => setPage(n.key)}
            className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm font-medium transition ${
              page === n.key
                ? 'bg-brand-600/15 text-brand-400'
                : 'text-slate-400 hover:bg-ink-800 hover:text-slate-200'
            }`}
          >
            <span className="flex items-center gap-2.5 truncate">
              {n.icon}
              <span className="truncate">{n.label}</span>
            </span>
            {n.badge && (
              <span className="inline-flex items-center gap-1 rounded bg-amber-500/15 px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wider text-amber-300 border border-amber-500/30">
                💎 {n.badge}
              </span>
            )}
          </button>
        ))}
      </nav>

      <div className="border-t border-ink-line px-3 py-3">
        <button
          type="button"
          onClick={() => void window.api.app.toggleSalesMonitor()}
          className="mb-2 flex w-full items-center gap-2.5 rounded-lg border border-brand-500/30 bg-brand-500/10 px-3 py-2 text-xs font-semibold text-brand-300 hover:border-brand-500/50 hover:bg-brand-500/20 transition-colors shadow-sm"
          title="Open / Toggle Live Sales Monitor & Customer Display"
        >
          <Tv className="h-4 w-4 text-brand-400 shrink-0" />
          <span>Sales Monitor</span>
        </button>

        <button
          type="button"
          onClick={() => useGuide.getState().openGuide('start')}
          className="mb-3 flex w-full items-center gap-2.5 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs font-semibold text-amber-300 hover:border-amber-500/50 hover:bg-amber-500/20 transition-colors shadow-sm"
          title="Open User Guide & Cashier Instructions"
        >
          <HelpCircle className="h-4 w-4 text-amber-400 shrink-0" />
          <span>Help & User Guide</span>
        </button>

        <div className="mb-2 flex items-center gap-2.5 px-1">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-ink-700 text-xs font-bold text-slate-300">
            {(user?.full_name || 'U').slice(0, 1).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="truncate text-xs font-semibold text-slate-200">{user?.full_name}</p>
            <p className="text-[10px] uppercase text-slate-500">
              {user?.roles.join(' · ')}
            </p>
          </div>
        </div>
        <button
          onClick={logout}
          className="flex w-full items-center gap-2.5 rounded-lg px-3 py-1.5 text-sm font-medium text-slate-400 hover:bg-danger-500/10 hover:text-danger-400"
        >
          <LogOut className="h-4 w-4" />
          Logout
        </button>

        {isVip ? (
          <div className="mt-2 text-center">
            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-400 bg-amber-500/10 px-2.5 py-0.5 rounded-full border border-amber-500/30">
              <Crown className="h-3 w-3" /> VIP Pro Active
            </span>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setPage('settings')}
            className="mt-2 flex w-full items-center justify-center gap-1.5 text-[11px] font-bold text-amber-400 hover:text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 px-2 py-1.5 rounded-lg border border-amber-500/30 transition shadow-sm active:scale-95"
            title="Upgrade to VIP Pro for ₱500 Lifetime"
          >
            <Crown className="h-3.5 w-3.5 animate-pulse text-amber-400" />
            <span>Upgrade VIP (₱500)</span>
          </button>
        )}

        <p className="dev-signature signature-reveal mt-3 text-center text-xs italic text-slate-600">by Dev Francis</p>
      </div>
    </aside>
  )
}
