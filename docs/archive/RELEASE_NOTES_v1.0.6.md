# TINDA POS v1.0.6 — updater fix (unreleased)

Installed v1.0.4 and v1.0.5 can detect a release but fail before downloading it because the download engine was never given its own update check. v1.0.6 initializes and validates that metadata before downloading.

- Downloads only the version shown in the update prompt, with a fresh check on retry.
- Closing the app no longer installs a downloaded update automatically.
- Restart & Install validates a fresh database backup, including sales made since downloading. A failed backup pauses installation.
- Check for Updates can offer a version again after Later.
- Closing a notification during a download does not discard its state.

## One-time upgrade for existing stores

The old installed updater cannot repair itself by fetching this release. Once the fixed release is approved, users of v1.0.3–v1.0.5 Setup need one manual Setup install over their current installation. Back up first, close TINDA POS, use the same Windows account and data location, and verify data after reopening. Do not uninstall or reset the database.

This is a development candidate, not approved for live tills. Native Windows installation/relaunch and data-preservation acceptance remain mandatory. No database schema or printer behavior changes are included.
