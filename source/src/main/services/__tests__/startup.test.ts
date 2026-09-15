import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mkdtempSync, existsSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { app } from 'electron'
import { startupSetting, applyDefaultStartup } from '../startup'

const { setLoginItemSettings, getLoginItemSettings, writeShortcutLink } = vi.hoisted(() => ({
  setLoginItemSettings: vi.fn(),
  getLoginItemSettings: vi.fn(),
  writeShortcutLink: vi.fn()
}))
vi.mock('electron', () => ({
  app: {
    isPackaged: true,
    getPath: vi.fn((name) => name === 'appData' ? process.env.__TD_APP_DATA : process.env.__TD_USER_DATA),
    getLoginItemSettings,
    setLoginItemSettings
  },
  shell: {
    writeShortcutLink
  }
}))

let userData: string
let appData: string

beforeEach(() => {
  userData = mkdtempSync(join(tmpdir(), 'tinda-ss-'))
  appData = mkdtempSync(join(tmpdir(), 'tinda-ad-'))
  process.env.__TD_USER_DATA = userData
  process.env.__TD_APP_DATA = appData
  vi.spyOn(process, 'platform', 'get').mockReturnValue('win32')
  vi.stubEnv('PORTABLE_EXECUTABLE_FILE', '')
  vi.stubEnv('PORTABLE_EXECUTABLE_DIR', '')
  vi.mocked(app.getLoginItemSettings).mockReturnValue({ openAtLogin: false, executableWillLaunchAtLogin: false } as ReturnType<typeof app.getLoginItemSettings>)
})
afterEach(() => {
  vi.clearAllMocks()
  try { rmSync(userData, { recursive: true, force: true }) } catch { /* ignore */ }
  try { rmSync(appData, { recursive: true, force: true }) } catch { /* ignore */ }
  delete process.env.__TD_USER_DATA
  delete process.env.__TD_APP_DATA
})

describe('Windows startup preference', () => {
  it('reads the OS setting without enabling startup by default', () => {
    expect(startupSetting()).toEqual({ supported: true, enabled: false })
    expect(app.setLoginItemSettings).not.toHaveBeenCalled()
  })
  it.each([true, false])('sets %s at the installed executable with no inherited arguments', (enabled) => {
    startupSetting(enabled)
    expect(app.setLoginItemSettings).toHaveBeenCalledWith({ path: process.execPath, args: [], openAtLogin: enabled, enabled })
    expect(app.getLoginItemSettings).toHaveBeenCalledWith({ path: process.execPath, args: [] })
    if (enabled) {
      expect(writeShortcutLink).toHaveBeenCalledWith(
        join(appData, 'Microsoft', 'Windows', 'Start Menu', 'Programs', 'Startup', 'TINDA POS.lnk'),
        'replace',
        expect.objectContaining({ target: process.execPath, description: 'TINDA POS' })
      )
    }
  })
  it('reflects startup disabled by Windows', () => {
    vi.mocked(app.getLoginItemSettings).mockReturnValue({ openAtLogin: true, executableWillLaunchAtLogin: false } as ReturnType<typeof app.getLoginItemSettings>)
    expect(startupSetting().enabled).toBe(false)
  })
  it('reflects enabled startup', () => {
    vi.mocked(app.getLoginItemSettings).mockReturnValue({ openAtLogin: true, executableWillLaunchAtLogin: true } as ReturnType<typeof app.getLoginItemSettings>)
    expect(startupSetting().enabled).toBe(true)
  })
  it.each(['PORTABLE_EXECUTABLE_FILE', 'PORTABLE_EXECUTABLE_DIR'])('rejects Portable %s without registering the temporary executable', (name) => {
    vi.stubEnv(name, 'C:\\Portable')
    expect(startupSetting().supported).toBe(false)
    expect(() => startupSetting(true)).toThrow('Windows Setup')
    expect(app.setLoginItemSettings).not.toHaveBeenCalled()
  })
  it('does not call platform APIs on Linux', () => {
    vi.spyOn(process, 'platform', 'get').mockReturnValue('linux')
    expect(startupSetting().supported).toBe(false)
    expect(app.getLoginItemSettings).not.toHaveBeenCalled()
  })
  it('rejects malformed IPC values', () => {
    expect(() => startupSetting('true' as unknown as boolean)).toThrow('Invalid startup')
    expect(app.setLoginItemSettings).not.toHaveBeenCalled()
  })
})

describe('applyDefaultStartup (default ON for Setup installs)', () => {
  it('enables start-at-sign-in and drops a marker on first launch', () => {
    vi.mocked(app.getLoginItemSettings).mockReturnValue({ openAtLogin: true, executableWillLaunchAtLogin: true } as ReturnType<typeof app.getLoginItemSettings>)
    expect(applyDefaultStartup()).toBe(true)
    expect(app.setLoginItemSettings).toHaveBeenCalledWith({ path: process.execPath, args: [], openAtLogin: true, enabled: true })
    expect(existsSync(join(userData, 'startup-default-on-applied.txt'))).toBe(true)
  })
  it('does not re-enable over a marker left by a later manual opt-out', () => {
    const { writeFileSync } = require('node:fs') as typeof import('node:fs')
    writeFileSync(join(userData, 'startup-default-on-applied.txt'), '1')
    vi.mocked(app.getLoginItemSettings).mockReturnValue({ openAtLogin: false, executableWillLaunchAtLogin: false } as ReturnType<typeof app.getLoginItemSettings>)
    expect(applyDefaultStartup()).toBe(false)
    expect(app.setLoginItemSettings).not.toHaveBeenCalled()
  })
  it('is a no-op on unsupported (portable) installs', () => {
    vi.stubEnv('PORTABLE_EXECUTABLE_FILE', 'C:\\Portable')
    expect(applyDefaultStartup()).toBe(false)
    expect(app.setLoginItemSettings).not.toHaveBeenCalled()
    expect(existsSync(join(userData, 'startup-default-on-applied.txt'))).toBe(false)
  })
})