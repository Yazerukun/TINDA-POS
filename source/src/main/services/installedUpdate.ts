import type { AppUpdater } from 'electron-updater'
import type { ReleaseInfo } from '@shared/update'
import { compareSemver } from '@shared/update'

/** The REST release check does not initialize electron-updater's provider. */
export async function downloadInstalledUpdate(updater: AppUpdater, release: ReleaseInfo): Promise<void> {
  updater.autoDownload = false
  // Closing the till must never install an update without the backup/install gate.
  updater.autoInstallOnAppQuit = false
  const checked = await updater.checkForUpdates()
  if (!checked?.isUpdateAvailable) throw new Error('The selected update is no longer available. Check for updates again.')
  if (compareSemver(checked.updateInfo.version, release.version) !== 0) {
    throw new Error('The available update changed. Check for updates again.')
  }
  const files = await updater.downloadUpdate()
  if (!files?.length) throw new Error('The update download did not produce an installer.')
}
