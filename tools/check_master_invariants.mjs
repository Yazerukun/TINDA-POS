import fs from 'node:fs'
import path from 'node:path'
import { execSync } from 'node:child_process'

console.log('🔒 Verifying Master Codebase Invariants before build...')

// 1. Check Git Remote
try {
  const remote = execSync('git remote get-url origin', { encoding: 'utf-8' }).trim()
  if (!remote.includes('TINDA-POS-Source')) {
    console.error(`❌ FATAL: Wrong Git remote detected: "${remote}". Must be "TINDA-POS-Source". Build aborted!`)
    process.exit(1)
  }
  console.log(`[PASS] Git Remote verified: ${remote}`)
} catch (e) {
  console.error('❌ FATAL: Not inside a valid git repository or git command failed:', e.message)
  process.exit(1)
}

// 2. Check Critical Feature Files
const repoRoot = fs.existsSync(path.resolve('source')) ? path.resolve('.') : path.resolve('..')

const criticalFiles = [
  'source/src/main/database/migrations.ts',
  'source/src/main/repositories/expiration.ts',
  'source/src/main/repositories/priceReferences.ts',
  'source/src/main/services/lanHubService.ts',
  'source/src/renderer/src/pages/SalesMonitor.tsx'
]

for (const relPath of criticalFiles) {
  const fullPath = path.resolve(repoRoot, relPath)
  if (!fs.existsSync(fullPath)) {
    console.error(`❌ FATAL: Critical master feature file missing: ${relPath}. Build aborted!`)
    process.exit(1)
  }
}
console.log('[PASS] All critical feature files verified.')

// 3. Check Migration Invariant
const migrationContent = fs.readFileSync(path.resolve(repoRoot, 'source/src/main/database/migrations.ts'), 'utf-8')
if (!migrationContent.includes('epoch_41_anti_downgrade') || !migrationContent.includes('wholesale_tiering')) {
  console.error('❌ FATAL: Migrations are missing master schema versions (epoch_41 or wholesale_tiering)! Build aborted!')
  process.exit(1)
}
console.log('[PASS] Master migration schemas verified.')

// 4. Check Public Distribution Invariants
const possibleDistDirs = [
  path.resolve(repoRoot, '../TINDA-POS'),
  '/home/ian/Projects/TINDA-POS'
]
for (const publicDistDir of possibleDistDirs) {
  if (fs.existsSync(publicDistDir)) {
    const distWorkflows = path.join(publicDistDir, '.github', 'workflows')
    if (fs.existsSync(distWorkflows)) {
      console.error(`❌ FATAL: Orphaned .github/workflows detected in public distribution repository (${publicDistDir})! Build aborted!`)
      process.exit(1)
    }
    const distSource = path.join(publicDistDir, 'source')
    if (fs.existsSync(distSource)) {
      console.error(`❌ FATAL: Proprietary source/ folder leaked into public distribution repository (${publicDistDir})! Build aborted!`)
      process.exit(1)
    }
    console.log(`[PASS] Public distribution repository invariants verified for ${path.basename(publicDistDir)} (zero orphaned CI workflows, zero source leaks).`)
  }
}

console.log('✅ ALL MASTER INVARIANTS PASSED! Safe to build.\n')
