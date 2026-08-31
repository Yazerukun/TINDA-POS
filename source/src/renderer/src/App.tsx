import { useEffect, useState } from 'react'
import { useAuth } from './stores/auth'
import { Splash } from './components/Splash'
import { FirstRun } from './pages/FirstRun'
import { Login } from './pages/Login'
import { Shell } from './layouts/Shell'

export default function App(): React.JSX.Element {
  const { user, ready, firstRun, bootstrap } = useAuth()
  const [bootErr, setBootErr] = useState<string | null>(null)

  useEffect(() => {
    bootstrap().catch((e) => setBootErr(String(e?.message ?? e)))
  }, [bootstrap])

  if (!ready) return <Splash error={bootErr} />
  if (firstRun) return <FirstRun />
  if (!user) return <Login />
  return <Shell />
}