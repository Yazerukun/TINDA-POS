import { useEffect, useState } from 'react'
import { useAuth } from './stores/auth'
import { useUpdate } from './stores/update'
import { useLicense } from './stores/license'
import { Splash } from './components/Splash'
import { FirstRun } from './pages/FirstRun'
import { Login } from './pages/Login'
import { Shell } from './layouts/Shell'
import { useConnectionNotifications } from './hooks/useOnlineStatus'
import { SalesMonitorScreen } from './pages/SalesMonitor'
import { initFrontendErrorTracer } from './lib/errorTracer'
import { initConsoleInterceptor } from './lib/consoleInterceptor'

// Initialize client-side error interceptor & user action flight recorder
initFrontendErrorTracer()
initConsoleInterceptor()

export default function App(): React.JSX.Element {
  if (
    typeof window !== 'undefined' &&
    (window.location.hash === '#sales-monitor' ||
      window.location.hash === '#/sales-monitor' ||
      window.location.hash.includes('sales-monitor'))
  ) {
    return <SalesMonitorScreen />
  }

  useConnectionNotifications()
  const { user, ready, firstRun, bootstrap } = useAuth()
  const { init: initUpdate } = useUpdate()
  const [bootErr, setBootErr] = useState<string | null>(null)

  useEffect(() => {
    bootstrap().catch((e) => setBootErr(String(e?.message ?? e)))
    initUpdate().catch(() => undefined)
    useLicense.getState().loadLicense().catch(() => undefined)
  }, [bootstrap, initUpdate])

  if (!ready) return <Splash error={bootErr} />
  if (firstRun) return <FirstRun />
  if (!user) return <Login />
  return <Shell />
}
