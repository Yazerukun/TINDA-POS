import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'

export type DataMode = 'SHARED' | 'PORTABLE'

export interface DataLocationInfo {
  mode: DataMode
  label: 'Shared AppData' | 'Portable Data'
  root: string
  databaseFile: string
  backupDir: string
  portableAvailable: boolean
  sharedRoot: string
  portableRoot: string | null
}

interface ModeFile { mode: DataMode; portableRoot?: string }

export function portableRootFromEnvironment(env: NodeJS.ProcessEnv = process.env): string | null {
  const portableDir = env.PORTABLE_EXECUTABLE_DIR?.trim()
  return portableDir ? join(resolve(portableDir), 'TindaPOS-Data') : null
}

export function resolveDataLocation(input: {
  sharedRoot: string
  env?: NodeJS.ProcessEnv
  saved?: ModeFile | null
}): DataLocationInfo {
  const env = input.env ?? process.env
  const isolated = env.TINDA_DATA_DIR?.trim()
  const sharedRoot = resolve(isolated || input.sharedRoot)
  const runtimePortableRoot = portableRootFromEnvironment(env)
  const savedPortableRoot = input.saved?.portableRoot ? resolve(input.saved.portableRoot) : null
  const portableRoot = runtimePortableRoot ?? savedPortableRoot
  const mode: DataMode = !isolated && input.saved?.mode === 'PORTABLE' && portableRoot ? 'PORTABLE' : 'SHARED'
  const root = mode === 'PORTABLE' ? portableRoot! : sharedRoot
  return {
    mode,
    label: mode === 'PORTABLE' ? 'Portable Data' : 'Shared AppData',
    root,
    databaseFile: join(root, 'database', 'tindapos.db'),
    backupDir: join(root, 'backups'),
    portableAvailable: Boolean(runtimePortableRoot),
    sharedRoot,
    portableRoot: runtimePortableRoot
  }
}

export function readModeFile(sharedRoot: string): ModeFile | null {
  const file = join(sharedRoot, 'data-mode.json')
  if (!existsSync(file)) return null
  try {
    const parsed = JSON.parse(readFileSync(file, 'utf8')) as ModeFile
    return parsed.mode === 'SHARED' || parsed.mode === 'PORTABLE' ? parsed : null
  } catch {
    return null
  }
}

export function writeModeFile(sharedRoot: string, mode: DataMode, portableRoot?: string): void {
  const file = join(sharedRoot, 'data-mode.json')
  const payload: ModeFile = { mode, ...(portableRoot ? { portableRoot: resolve(portableRoot) } : {}) }
  writeFileSync(file, `${JSON.stringify(payload, null, 2)}\n`, { encoding: 'utf8', mode: 0o600 })
}
