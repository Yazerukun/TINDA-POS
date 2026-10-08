import { useEffect } from 'react'
import { useAuth } from '../stores/auth'
import { useSettings } from '../stores/settings'
import { useNav } from '../stores/nav'
import { useUpdate } from '../stores/update'
import { Sidebar } from '../components/layout/Sidebar'
import { ToastHost } from '../components/ui/ToastHost'
import { UpdateModal } from '../components/update/UpdateModal'
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
import { ExpirationAlerts } from '../components/Expiration'
import { HelpGuideModal } from '../components/HelpGuideModal'
import { TindaCommunityChat } from '../components/community/TindaCommunityChat'
import { TindaAiAssistantModal } from '../components/ai/TindaAiAssistantModal'

export function Shell(): React.JSX.Element {
  const { user } = useAuth()
  const { load } = useSettings()
  const { page } = useNav()

  useEffect(() => {
    load().catch(() => console.error('settings load failed'))

    // Initialize update store and run immediate check after mount (1.5 seconds)
    const initTimer = setTimeout(() => {
      void useUpdate.getState().init().then(() => {
        void useUpdate.getState().check(true)
      })
    }, 1500)

    // Real-time background check every 10 seconds
    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        void useUpdate.getState().check(false)
      }
    }, 10000)

    // Real-time check on window focus (when cashier switches back or clicks app)
    const onFocus = () => {
      void useUpdate.getState().check(false)
    }

    // Real-time check on network reconnect
    const onOnline = () => {
      void useUpdate.getState().check(false)
    }

    window.addEventListener('focus', onFocus)
    window.addEventListener('online', onOnline)

    return () => {
      clearTimeout(initTimer)
      clearInterval(interval)
      window.removeEventListener('focus', onFocus)
      window.removeEventListener('online', onOnline)
    }
  }, [load])

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-ink-950">
      <Sidebar />
      <main className="flex min-w-0 flex-1 flex-col">
        {user && <ExpirationAlerts key={user.id} remind />}
        <div className={`min-h-0 flex-1 ${page === 'pos' ? 'flex flex-col overflow-hidden' : 'overflow-y-auto'}`}>
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
        {user && page === 'handbook' && <Handbook />}
        </div>
      </main>
      <ToastHost />
      <UpdateModal />
      <HelpGuideModal />
      <TindaCommunityChat />
      <TindaAiAssistantModal />
    </div>
  )
}
