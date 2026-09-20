import { promises as fs } from 'node:fs'
import path from 'node:path'
import type Database from 'better-sqlite3'
import type { PriceReferenceInput, PriceSyncResult } from '../../shared/types'
import { appDirs } from '../database/connection'
import {
  ensureSeedData,
  getPriceReference,
  upsertPriceReference,
  validatePriceReferenceInput
} from '../repositories/priceReferences'
import { SEED_PRICE_REFERENCES } from './seedPriceReferences'

// Safe reference to electron net if available
function getNet(): typeof import('electron').net | undefined {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const electron = require('electron')
    return electron?.net
  } catch {
    return undefined
  }
}

export async function isOnlineCheck(): Promise<boolean> {
  const electronNet = getNet()
  if (electronNet && typeof electronNet.isOnline === 'function') {
    if (!electronNet.isOnline()) return false

    const probes = [
      ['https://connectivitycheck.gstatic.com/generate_204', 204],
      ['https://www.msftconnecttest.com/connecttest.txt', 200]
    ] as const

    const results = await Promise.all(
      probes.map(async ([url, expectedStatus]) => {
        const controller = new AbortController()
        const timeout = setTimeout(() => controller.abort(), 3_000)
        try {
          const response = await electronNet.fetch(url, {
            method: 'GET',
            signal: controller.signal
          })
          return response.status === expectedStatus
        } catch {
          return false
        } finally {
          clearTimeout(timeout)
        }
      })
    )

    return results.some(Boolean)
  }

  // If running in test or non-electron environment with global fetch
  if (typeof fetch === 'function') {
    try {
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 2_000)
      const res = await fetch('https://connectivitycheck.gstatic.com/generate_204', {
        method: 'GET',
        signal: controller.signal
      })
      clearTimeout(timeout)
      return res.status === 204
    } catch {
      return false
    }
  }

  return true
}

export async function downloadReferenceImage(
  db: Database.Database,
  referenceId: number,
  imageUrl: string
): Promise<string | null> {
  if (!imageUrl || (!imageUrl.startsWith('http://') && !imageUrl.startsWith('https://'))) {
    return null
  }

  try {
    const electronNet = getNet()
    const fetchFn = electronNet?.fetch || (typeof fetch === 'function' ? fetch : undefined)
    if (!fetchFn) return null

    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 5_000)

    const response = await fetchFn(imageUrl, {
      method: 'GET',
      signal: controller.signal
    })
    clearTimeout(timeout)

    if (!response.ok) return null

    const contentType = response.headers.get('content-type') || ''
    const match = contentType.match(/image\/(jpeg|jpg|png|webp|gif)/i)
    const rawExt = match && match[1] ? match[1].toLowerCase() : 'jpg'
    const ext = rawExt === 'jpeg' ? 'jpg' : rawExt

    const arrayBuffer = await response.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Max 5MB image
    if (buffer.length > 5 * 1024 * 1024) return null

    const filename = `price_ref_${referenceId}_${Date.now()}.${ext}`
    const imagesDir = appDirs().images
    const targetPath = path.join(imagesDir, filename)

    await fs.mkdir(imagesDir, { recursive: true })
    await fs.writeFile(targetPath, buffer)

    // Update database record
    db.prepare(`
      UPDATE price_references
      SET image_path = ?, updated_at = datetime('now','localtime')
      WHERE id = ?
    `).run(filename, referenceId)

    return filename
  } catch {
    // Non-blocking failure: never crash the app or sync process for failed image download
    return null
  }
}

export interface PriceReferenceStatus {
  total: number
  last_synced_at: string | null
  is_stale: boolean
  sources: { source_name: string; count: number }[]
}

export function getPriceReferenceStatus(db: Database.Database): PriceReferenceStatus {
  const countRow = db.prepare('SELECT COUNT(*) as total FROM price_references').get() as {
    total: number
  }
  const lastSyncRow = db
    .prepare('SELECT last_synced_at FROM price_references ORDER BY last_synced_at DESC LIMIT 1')
    .get() as { last_synced_at: string } | undefined

  const lastSynced = lastSyncRow?.last_synced_at || null
  let isStale = true
  if (lastSynced) {
    const syncTime = new Date(lastSynced).getTime()
    // Stale if older than 30 days
    isStale = Date.now() - syncTime > 30 * 24 * 60 * 60 * 1000
  }

  const sources = db
    .prepare(
      'SELECT source_name, COUNT(*) as count FROM price_references GROUP BY source_name ORDER BY count DESC'
    )
    .all() as { source_name: string; count: number }[]

  return {
    total: countRow.total,
    last_synced_at: lastSynced,
    is_stale: isStale,
    sources
  }
}

export interface SyncPriceReferencesOptions {
  force?: boolean
  remoteUrl?: string
  catalogData?: PriceReferenceInput[]
}

export async function syncPriceReferences(
  db: Database.Database,
  options: SyncPriceReferencesOptions = {}
): Promise<PriceSyncResult> {
  let catalogToSync: PriceReferenceInput[] | null = options.catalogData ?? null

  if (!catalogToSync) {
    const online = await isOnlineCheck()
    if (!online) {
      const status = getPriceReferenceStatus(db)
      return {
        success: false,
        synced_count: 0,
        rejected_count: 0,
        errors: ['No internet connection.'],
        last_synced_at: status.last_synced_at || 'Never',
        message: 'Offline — Showing Last Saved Data',
        is_offline: true
      }
    }

    if (options.remoteUrl) {
      try {
        const electronNet = getNet()
        const fetchFn = electronNet?.fetch || (typeof fetch === 'function' ? fetch : undefined)
        if (fetchFn) {
          const controller = new AbortController()
          const timeout = setTimeout(() => controller.abort(), 6_000)
          const res = await fetchFn(options.remoteUrl, { signal: controller.signal })
          clearTimeout(timeout)
          if (res.ok) {
            const data = await res.json()
            if (Array.isArray(data)) {
              catalogToSync = data
            }
          }
        }
      } catch {
        // Fallback to bundled seed data
      }
    }

    // Default to bundled high-quality seed catalog
    if (!catalogToSync || catalogToSync.length === 0) {
      catalogToSync = SEED_PRICE_REFERENCES
    }
  }

  let syncedCount = 0
  let rejectedCount = 0
  const errors: string[] = []
  const imageDownloadQueue: { referenceId: number; imageUrl: string }[] = []

  const syncTx = db.transaction((items: PriceReferenceInput[]) => {
    for (const item of items) {
      const validation = validatePriceReferenceInput(item)
      if (!validation.valid || !validation.sanitized) {
        rejectedCount++
        errors.push(`Item "${item.product_name || 'unknown'}": ${validation.errors.join('; ')}`)
        continue
      }

      try {
        const res = upsertPriceReference(db, validation.sanitized)
        syncedCount++

        if (validation.sanitized.image_url && !res.reference.image_path) {
          imageDownloadQueue.push({
            referenceId: res.reference.id,
            imageUrl: validation.sanitized.image_url
          })
        }
      } catch (err: unknown) {
        rejectedCount++
        errors.push(`Item "${item.product_name}": ${err instanceof Error ? err.message : String(err)}`)
      }
    }
  })

  syncTx(catalogToSync)

  // Download queued images in the background (fire & forget, non-blocking)
  if (imageDownloadQueue.length > 0) {
    Promise.allSettled(
      imageDownloadQueue.map((item) => downloadReferenceImage(db, item.referenceId, item.imageUrl))
    ).catch(() => {
      // Ignored
    })
  }

  const now = new Date().toISOString().replace('T', ' ').substring(0, 19)

  return {
    success: true,
    synced_count: syncedCount,
    rejected_count: rejectedCount,
    errors,
    last_synced_at: now,
    message: `Successfully synchronized ${syncedCount} price reference(s)${rejectedCount > 0 ? ` (${rejectedCount} rejected)` : ''}.`,
    is_offline: false
  }
}
