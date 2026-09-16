# TINDA POS v1.0.17

- **Fix Windows Startup Checkbox Accessibility**:
  - Fixed an issue where the "Start TINDA POS when I sign in to Windows" checkbox in Settings > Store was disabled / unclickable.
  - Removed restrictive environment checks that falsely disabled startup on Windows Setup installations.
  - Wrapped registry login-item queries in safe error handling so Windows registry permissions never lock the setting.
  - Guaranteed that the checkbox is always enabled and clickable on all Windows systems.
