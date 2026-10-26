import { useEffect } from 'react'
import { useAuth } from '../stores/auth'
import { useSettings } from '../stores/settings'
import { useNav } from '../stores/nav'
import { useUpdate } from '../stores/update'
import { Sidebar } from '../components/layout/Sidebar'
import { ToastHost } from '../components/ui/ToastHost'
import { UnifiedUpdateCapsule } from '../components/update/UnifiedUpdateCapsule'
import { Dashboard } from '../pages/Dashboard'
import { POS } from '../pages/POS'
import { Inventory } from '../pages/Inventory'
import { Customers } from '../pages/Customers'
import { Utang } from '../pages/Utang'
import { Expenses } from '../pages/Expenses'
import { Suppliers } from '../pages/Suppliers'
import { Transactions } from '../pages/Transactions'
import { Reports } from '../pages/Reports'
import { Backup } from '../pages/Backup'
import { Settings } from '../pages/Settings'
import { Handbook } from '../pages/Handbook'
import { EwalletAudit } from '../pages/EwalletAudit'
import { BillsLoadHub } from '../pages/BillsLoadHub'
import { PrintingHub } from '../pages/PrintingHub'
import { ExpirationAlerts } from '../components/Expiration'
import { HelpGuideModal } from '../components/HelpGuideModal'
import { TindaCommunityChat } from '../components/community/TindaCommunityChat'
import { TindaAiAssistantModal } from '../components/ai/TindaAiAssistantModal'
import { FloatingWidgetsDock } from '../components/common/FloatingWidgetsDock'
import { NotificationBellDrawer } from '../components/notifications/NotificationBellDrawer'
import { useNotificationDrawer } from '../stores/notificationDrawer'
import { SystemDebuggerModal } from '../components/SystemDebuggerModal'
import { GlobalErrorBoundary } from '../components/GlobalErrorBoundary'
import { AmbientFaultPill } from '../components/AmbientFaultPill'
import { useSystemDebugger } from '../stores/systemDebugger'
import { PurchaseInvoiceModal } from '../components/PurchaseInvoiceModal'

export function Shell(): React.JSX.Element {
  const { user } = useAuth()
  const { load } = useSettings()
  const { page } = useNav()

  useEffect(() => {
    // Pre-warm store telemetry cache immediately in background for 0ms instant drawer response
    void useNotificationDrawer.getState().fetchTelemetry()

    load().catch(() => console.error('settings load failed'))

    // Initialize update store and run silent background check after mount (3 seconds)
    const initTimer = setTimeout(() => {
      void useUpdate.getState().init().then(() => {
        void useUpdate.getState().check(false)
      })
    }, 3000)

    // Periodic background check every 15 minutes when app is active
    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        void useUpdate.getState().check(false)
      }
    }, 15 * 60 * 1000)

    // Real-time check on window focus (when cashier switches back or clicks app)
    const onFocus = () => {
      void useUpdate.getState().check(false)
    }

    // Real-time check on network reconnect
    const onOnline = () => {
      void useUpdate.getState().check(false)
    }

    // Global F3 shortcut listener:
    // Prevents Chromium "Find next" and toggles Quick Calculator across the app
    const onGlobalF3 = (e: KeyboardEvent) => {
      if (e.key === 'F3') {
        e.preventDefault()
        const curPage = useNav.getState().page
        if (curPage !== 'pos') {
          useNav.getState().setPage('pos')
        }
        window.dispatchEvent(new CustomEvent('tinda-open-calculator'))
      } else if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'D' || e.key === 'd')) {
        e.preventDefault()
        useSystemDebugger.getState().toggleDebugger()
      }
    }

    window.addEventListener('focus', onFocus)
    window.addEventListener('online', onOnline)
    window.addEventListener('keydown', onGlobalF3)

    const unsubOpen = window.api?.diagnostics?.onOpenModal?.(() => {
      useSystemDebugger.getState().openDebugger()
    })

    return () => {
      clearTimeout(initTimer)
      clearInterval(interval)
      unsubOpen?.()
      window.removeEventListener('focus', onFocus)
      window.removeEventListener('online', onOnline)
      window.removeEventListener('keydown', onGlobalF3)
    }
  }, [load])

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-ink-950">
      <Sidebar />
      <main className="flex min-w-0 flex-1 flex-col">
        {user && <ExpirationAlerts key={user.id} remind />}
        <div className={`min-h-0 flex-1 ${page === 'pos' ? 'flex flex-col overflow-hidden' : 'overflow-y-auto'}`}>
          <GlobalErrorBoundary viewName={page}>
            {user && page === 'dashboard' && <Dashboard />}
            {user && page === 'pos' && <POS />}
            {user && page === 'inventory' && <Inventory />}
            {user && page === 'customers' && <Customers />}
            {user && page === 'utang' && <Utang />}
            {user && page === 'expenses' && <Expenses />}
            {user && page === 'suppliers' && <Suppliers />}
            {user && page === 'transactions' && <Transactions />}
            {user && page === 'reports' && <Reports />}
            {user && page === 'backup' && <Backup />}
            {user && page === 'settings' && <Settings />}
            {user && page === 'ewallet' && <EwalletAudit />}
            {user && page === 'bills' && <EwalletAudit />}
            {user && page === 'printing' && <PrintingHub />}
            {user && page === 'handbook' && <Handbook />}
          </GlobalErrorBoundary>
        </div>
      </main>
      <ToastHost />
      <UnifiedUpdateCapsule />
      <HelpGuideModal />
      <FloatingWidgetsDock />
      <TindaCommunityChat />
      <TindaAiAssistantModal />
      <NotificationBellDrawer />
      <SystemDebuggerModal />
      <AmbientFaultPill />
      {user && <PurchaseInvoiceModal />}
    </div>
  )
}
