import { app } from 'electron'
import { existsSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

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

// Marker so a later manual "off" in Settings is not overridden on a subsequent
// launch. Enabled behaves the same either way; the marker state only records
// whether the default has been applied once.
const DEFAULT_ON_MARKER = 'startup-default-on-applied.txt'
const markerFile = (): string => join(app.getPath('userData'), DEFAULT_ON_MARKER)

/** Registers the Setup install to start at sign-in on the first launch. */
export function applyDefaultStartup(): boolean {
  const current = startupSetting()
  if (!current.supported) return false
  if (existsSync(markerFile())) return current.enabled
  startupSetting(true)
  writeFileSync(markerFile(), '1')
  return true
}
