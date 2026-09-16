import { app, shell } from 'electron'
import { existsSync, writeFileSync, unlinkSync, mkdirSync } from 'node:fs'
import { join, dirname } from 'node:path'

function getStartupShortcutPath(): string {
  try {
    const appData = app.getPath('appData')
    if (!appData) return ''
    return join(appData, 'Microsoft', 'Windows', 'Start Menu', 'Programs', 'Startup', 'TINDA POS.lnk')
  } catch {
    return ''
  }
}

export function startupSetting(enabled?: boolean): { supported: boolean; enabled: boolean } {
  const supported = process.platform === 'win32'
  if (enabled !== undefined && typeof enabled !== 'boolean') throw new Error('Invalid startup setting')
  if (!supported) {
    if (enabled !== undefined) throw new Error('Windows Setup installation required')
    return { supported: false, enabled: false }
  }
  const options = { path: process.execPath, args: [] as string[] }
  const shortcutPath = getStartupShortcutPath()

  if (enabled !== undefined) {
    try {
      app.setLoginItemSettings({ ...options, openAtLogin: enabled, enabled })
    } catch {
      // Non-fatal if Windows registry login items fail
    }

    if (shortcutPath) {
      if (enabled) {
        try {
          const dir = dirname(shortcutPath)
          if (!existsSync(dir)) mkdirSync(dir, { recursive: true })
          if (shell?.writeShortcutLink) {
            shell.writeShortcutLink(shortcutPath, 'replace', {
              target: process.execPath,
              cwd: dirname(process.execPath),
              description: 'TINDA POS'
            })
          }
        } catch {
          // Non-fatal if shortcut creation fails
        }
      } else {
        try {
          if (existsSync(shortcutPath)) unlinkSync(shortcutPath)
        } catch {
          // Non-fatal
        }
      }
    }
  }

  let current = { openAtLogin: false, executableWillLaunchAtLogin: false }
  try {
    current = app.getLoginItemSettings(options)
  } catch {
    // Non-fatal
  }
  const shortcutActive = Boolean(shortcutPath && existsSync(shortcutPath))
  const isEnabled = Boolean((current.openAtLogin && current.executableWillLaunchAtLogin) || shortcutActive)
  return { supported: true, enabled: isEnabled }
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
  try {
    writeFileSync(markerFile(), '1')
  } catch {
    // Non-fatal
  }
  return true
}
