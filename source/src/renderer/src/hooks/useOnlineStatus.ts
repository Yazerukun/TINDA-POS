import { useEffect, useState } from 'react'
import { toastInfo, toastSuccess } from '../stores/toast'

export function useOnlineStatus(): boolean {
  const [online, setOnline] = useState(() => navigator.onLine)
  useEffect(() => {
    const connected = () => setOnline(true)
    const disconnected = () => setOnline(false)
    window.addEventListener('online', connected)
    window.addEventListener('offline', disconnected)
    return () => {
      window.removeEventListener('online', connected)
      window.removeEventListener('offline', disconnected)
    }
  }, [])
  return online
}

export function useConnectionNotifications(): void {
  useEffect(() => {
    const connected = () => toastSuccess('Internet connected', 'ONLINE READY — configured cloud backups can sync now.')
    const disconnected = () => toastInfo('Offline mode', 'Sales continue normally. Pending cloud backups will sync later.')
    window.addEventListener('online', connected)
    window.addEventListener('offline', disconnected)
    return () => {
      window.removeEventListener('online', connected)
      window.removeEventListener('offline', disconnected)
    }
  }, [])
}
