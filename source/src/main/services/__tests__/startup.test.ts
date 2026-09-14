import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { app } from 'electron'
import { startupSetting } from '../startup'

vi.mock('electron', () => ({ app: {
  isPackaged: true,
  getLoginItemSettings: vi.fn(),
  setLoginItemSettings: vi.fn()
} }))

beforeEach(() => {
  vi.spyOn(process, 'platform', 'get').mockReturnValue('win32')
  vi.stubEnv('PORTABLE_EXECUTABLE_FILE', '')
  vi.stubEnv('PORTABLE_EXECUTABLE_DIR', '')
  vi.mocked(app.getLoginItemSettings).mockReturnValue({ openAtLogin: false, executableWillLaunchAtLogin: false } as ReturnType<typeof app.getLoginItemSettings>)
})
afterEach(() => { vi.restoreAllMocks(); vi.clearAllMocks(); vi.unstubAllEnvs() })

describe('Windows startup preference', () => {
  it('reads the OS setting without enabling startup by default', () => {
    expect(startupSetting()).toEqual({ supported: true, enabled: false })
    expect(app.setLoginItemSettings).not.toHaveBeenCalled()
  })
  it.each([true, false])('sets %s at the installed executable with no inherited arguments', (enabled) => {
    startupSetting(enabled)
    expect(app.setLoginItemSettings).toHaveBeenCalledWith({ path: process.execPath, args: [], openAtLogin: enabled, enabled })
    expect(app.getLoginItemSettings).toHaveBeenCalledWith({ path: process.execPath, args: [] })
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
