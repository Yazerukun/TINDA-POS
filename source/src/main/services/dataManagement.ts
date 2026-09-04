import type { BackupInfo } from '@shared/types'
import { getDb } from '../database/connection'
import { resetDatabase } from '../repositories/backup'
import { requirePermission } from './session'

/** Security boundary for destructive database administration. */
export function resetActiveDatabase(confirmation: string): BackupInfo {
  requirePermission('settings:manage')
  return resetDatabase(getDb(), confirmation)
}
