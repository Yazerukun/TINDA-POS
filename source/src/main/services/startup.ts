import { app } from 'electron'

export function startupSetting(enabled?: boolean): { supported: boolean; enabled: boolean } {
  const supported = process.platform === 'win32' && app.isPackaged && !process.env.PORTABLE_EXECUTABLE_FILE && !process.env.PORTABLE_EXECUTABLE_DIR
  if (enabled !== undefined && typeof enabled !== 'boolean') throw new Error('Invalid startup setting')
  if (!supported) {
    if (enabled !== undefined) throw new Error('Windows Setup installation required')
    return { supported: false, enabled: false }
  }
  const options = { path: process.execPath, args: [] as string[] }
  if (enabled !== undefined) app.setLoginItemSettings({ ...options, openAtLogin: enabled, enabled })
  const current = app.getLoginItemSettings(options)
  return { supported: true, enabled: current.openAtLogin && current.executableWillLaunchAtLogin }
}
