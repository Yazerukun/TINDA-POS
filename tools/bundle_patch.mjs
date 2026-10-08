import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync, unlinkSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'

const start = Date.now()
const rootDir = resolve(process.cwd(), '..')
const sourceDir = existsSync(join(process.cwd(), 'package.json'))
  ? process.cwd()
  : join(process.cwd(), 'source')

const pkgPath = join(sourceDir, 'package.json')
if (!existsSync(pkgPath)) {
  console.error(`[bundle_patch] Missing package.json at ${pkgPath}`)
  process.exit(1)
}

const pkg = JSON.parse(readFileSync(pkgPath, 'utf8'))
const version = process.argv[2] || pkg.version || '1.0.0'
const outDir = join(sourceDir, 'out')
const buildsDir = join(sourceDir, 'builds')

if (!existsSync(outDir) || !existsSync(join(outDir, 'renderer', 'index.html'))) {
  console.error(`[bundle_patch] out/ directory is missing or incomplete. Run electron-vite build first.`)
  process.exit(1)
}

if (!existsSync(buildsDir)) {
  mkdirSync(buildsDir, { recursive: true })
}

// 1. Write patch manifest into out/
const manifest = {
  name: 'TINDA POS',
  version,
  type: 'FEATURE_PATCH',
  createdAt: new Date().toISOString(),
  minBaseVersion: '1.0.0'
}
writeFileSync(join(outDir, 'manifest.json'), JSON.stringify(manifest, null, 2), 'utf8')

// 2. Archive out/ into TindaPOS-Feature-Patch-${version}.zip
const zipName = `TindaPOS-Feature-Patch-${version}.zip`
const zipPath = join(buildsDir, zipName)
console.log(`📦 Packaging Fast Feature Patch: ${zipName}...`)
try {
  if (existsSync(zipPath)) {
    unlinkSync(zipPath)
  }
  if (process.platform === 'win32') {
    // Use Windows built-in bsdtar to create standard zip archive
    execFileSync('tar', ['-a', '-cf', zipPath, '-C', outDir, '.'], { stdio: 'inherit' })
  } else {
    // On Linux/macOS, use zip (or python3 -m zipfile fallback) to create a valid zip
    try {
      execFileSync('zip', ['-q', '-r', zipPath, '.'], { cwd: outDir, stdio: 'inherit' })
    } catch {
      execFileSync('python3', ['-m', 'zipfile', '-c', zipPath, '.'], { cwd: outDir, stdio: 'inherit' })
    }
  }
} catch (err) {
  console.error(`[bundle_patch] Archive creation failed:`, err)
  process.exit(1)
}

// 3. Compute SHA-256 and size
const fileBuffer = readFileSync(zipPath)
const hash = createHash('sha256').update(fileBuffer).digest('hex')
const stats = statSync(zipPath)
const sizeMb = (stats.size / (1024 * 1024)).toFixed(2)

writeFileSync(`${zipPath}.sha256`, `${hash} *${zipName}\n`, 'utf8')

const elapsed = ((Date.now() - start) / 1000).toFixed(2)
console.log(`\n======================================================`)
console.log(`⚡ FAST FEATURE PATCH BUNDLED SUCCESSFULLY!`)
console.log(`======================================================`)
console.log(`🏷️  Version:       v${version}`)
console.log(`📦  Archive:       ${zipPath}`)
console.log(`⚖️  Size:          ${sizeMb} MB (${stats.size.toLocaleString()} bytes)`)
console.log(`🔒  SHA-256:       ${hash}`)
console.log(`⏱️  Duration:      ${elapsed}s`)
console.log(`======================================================\n`)
