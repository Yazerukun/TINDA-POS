import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import https from 'node:https'
import { execSync } from 'node:child_process'

function getGhToken() {
  if (process.env.GITHUB_TOKEN) return process.env.GITHUB_TOKEN.trim()
  if (process.env.GH_TOKEN) return process.env.GH_TOKEN.trim()
  try {
    const out = execSync('gh auth token', { encoding: 'utf-8', stdio: ['pipe', 'pipe', 'ignore'] })
    const match = out.match(/(ghp_[a-zA-Z0-9]+|github_pat_[a-zA-Z0-9_]+|gho_[a-zA-Z0-9]+)/)
    if (match) return match[1]
  } catch {}
  try {
    const cred = execSync('git credential fill', {
      input: 'protocol=https\nhost=github.com\n\n',
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'ignore']
    })
    const m = cred.match(/password=(.+)/)
    if (m && m[1]) return m[1].trim()
  } catch {}
  return ''
}

const GITHUB_TOKEN = getGhToken()
const REPO_OWNER = 'Yazerukun'
const REPO_NAME = 'TINDA-POS'

const pkgPath = fs.existsSync(path.resolve('package.json')) && !fs.existsSync(path.resolve('source'))
  ? path.resolve('package.json')
  : path.resolve('source', 'package.json')
const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'))
const version = process.argv[2] || pkg.version || '1.0.86'
const TAG = `v${version}`
const RELEASE_NAME = `TINDA POS ${TAG} — Live Feature Patch`

const BUILDS_DIR = fs.existsSync(path.resolve('builds')) && !fs.existsSync(path.resolve('source'))
  ? path.resolve('builds')
  : path.resolve('source', 'builds')
const patchFile = `TindaPOS-Feature-Patch-${version}.zip`
const patchPath = path.join(BUILDS_DIR, patchFile)
const shaFile = `${patchFile}.sha256`
const shaPath = path.join(BUILDS_DIR, shaFile)

function ghRequest(method, urlStr, headers = {}, body = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(urlStr)
    const options = {
      hostname: url.hostname,
      path: url.pathname + url.search,
      method,
      headers: {
        'User-Agent': 'TINDA-POS-Patch-Publisher',
        Authorization: `Bearer ${GITHUB_TOKEN}`,
        ...headers
      }
    }

    const req = https.request(options, (res) => {
      let data = ''
      res.on('data', (chunk) => { data += chunk })
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          try { resolve(JSON.parse(data)) } catch { resolve(data) }
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${data}`))
        }
      })
    })

    req.on('error', reject)
    if (body) req.write(body)
    req.end()
  })
}

function uploadAsset(uploadUrlTemplate, filePath, fileName, contentType = 'application/octet-stream') {
  return new Promise((resolve, reject) => {
    const uploadUrlStr = uploadUrlTemplate.replace('{?name,label}', `?name=${encodeURIComponent(fileName)}`)
    const url = new URL(uploadUrlStr)
    const stat = fs.statSync(filePath)
    const fileStream = fs.createReadStream(filePath)

    const options = {
      hostname: url.hostname,
      path: url.pathname + url.search,
      method: 'POST',
      headers: {
        'User-Agent': 'TINDA-POS-Patch-Publisher',
        Authorization: `Bearer ${GITHUB_TOKEN}`,
        'Content-Type': contentType,
        'Content-Length': stat.size
      }
    }

    const req = https.request(options, (res) => {
      let data = ''
      res.on('data', (chunk) => { data += chunk })
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          try { resolve(JSON.parse(data)) } catch { resolve(data) }
        } else {
          reject(new Error(`Upload failed HTTP ${res.statusCode}: ${data}`))
        }
      })
    })

    req.on('error', reject)
    fileStream.pipe(req)
  })
}

async function main() {
  if (!GITHUB_TOKEN) {
    console.error('❌ GITHUB_TOKEN not found! Please check git credentials or environment.')
    process.exit(1)
  }

  if (!fs.existsSync(patchPath)) {
    console.error(`❌ Patch file not found at: ${patchPath}`)
    console.log('Run `npm run build:patch` in source/ first.')
    process.exit(1)
  }

  const patchStat = fs.statSync(patchPath)
  const patchSizeMb = (patchStat.size / (1024 * 1024)).toFixed(2)

  // Ensure sha256 file exists
  if (!fs.existsSync(shaPath)) {
    const fileBuffer = fs.readFileSync(patchPath)
    const hash = crypto.createHash('sha256').update(fileBuffer).digest('hex')
    fs.writeFileSync(shaPath, `${hash} *${patchFile}\n`, 'utf8')
  }

  const shaContent = fs.readFileSync(shaPath, 'utf8').trim()

  console.log(`\n======================================================`)
  console.log(`🚀 Publishing Patch-Only Release: ${TAG}`)
  console.log(`📦 Target:       https://github.com/${REPO_OWNER}/${REPO_NAME}/releases/tag/${TAG}`)
  console.log(`⚡ Asset:        ${patchFile} (${patchSizeMb} MB)`)
  console.log(`======================================================\n`)

  const body = `## ⚡ TINDA POS ${TAG} — Live Feature Patch (0.3s Zero Restart)

Official Live Feature Patch Release: **${new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}**

### 🌟 What's New in ${TAG}:
1. **🛡️ Resilient Ledger Offset Fallback & Zero-Error Hot-Patch Guarantee:**
   - Fixed \`window.api.customers.deleteledgerEntry is not a function\` during hot-patch updates on older base app installations.
   - Automatically applies universal mathematical ledger offset using existing \`adjust\` and \`revoke\` APIs if native backend IPC is missing, preventing crashes.
   - Added \`deleteledgerEntry\` alias in preload and shared IPC for casing safety.
2. **✏️ Interactive 1-Tap "Set Exact Balance" Tool in Utang Modal:**
   - Added Cupertino **Set / Fix Balance** (\`Pencil\`) button in customer Balance card.
   - Allows store owners and cashiers to directly set the customer's total outstanding balance to their exact verified figure (e.g. ₱325,065.00), automatically logging the difference as an audited balance correction.
3. **🔄 Resilient Frontend Balance Recalculation Engine:**
   - \`Sync Balance\` (\`RotateCcw\`) automatically replays all chronological ledger entries in the frontend if native IPC is not exposed, calculating running debt and synchronizing customer balance seamlessly.
4. **🔀 Split / Mixed Payment POS Checkout Engine & Void Protection:**
   - Preserved full Apple-grade Split / Mixed Payment checkout engine across Cash, GCash, Maya, MariBank, and Utang.
   - Preserved transaction void-check guard preventing duplicate utang deductions on transaction deletion.

### 📦 Patch Verification Hash:
\`\`\`
${shaContent}
\`\`\`
`

  // 1. Check if release exists or create it
  let release = null
  try {
    release = await ghRequest('GET', `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/releases/tags/${TAG}`)
    console.log(`ℹ️ Existing release found (ID: ${release.id}). Updating release metadata...`)
    release = await ghRequest('PATCH', `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/releases/${release.id}`, {
      'Content-Type': 'application/json'
    }, JSON.stringify({
      name: RELEASE_NAME,
      body,
      draft: false,
      prerelease: false,
      make_latest: 'true'
    }))
  } catch {
    console.log(`✨ Creating new GitHub release ${TAG}...`)
    release = await ghRequest('POST', `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/releases`, {
      'Content-Type': 'application/json'
    }, JSON.stringify({
      tag_name: TAG,
      name: RELEASE_NAME,
      body,
      draft: false,
      prerelease: false,
      make_latest: 'true'
    }))
  }

  console.log(`✅ Release ready! Uploading patch assets...`)

  const assetsToUpload = [
    { file: patchFile, path: patchPath, type: 'application/zip' },
    { file: shaFile, path: shaPath, type: 'text/plain' }
  ]

  for (const item of assetsToUpload) {
    const existing = (release.assets || []).find((a) => a.name === item.file)
    if (existing) {
      console.log(`🗑️ Deleting existing asset: ${item.file} (ID: ${existing.id})...`)
      try {
        await ghRequest('DELETE', `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/releases/assets/${existing.id}`)
      } catch (e) {
        console.warn(`Could not delete asset ${item.file}:`, e.message)
      }
    }

    console.log(`⬆️ Uploading ${item.file} (${(fs.statSync(item.path).size / 1024 / 1024).toFixed(2)} MB)...`)
    await uploadAsset(release.upload_url, item.path, item.file, item.type)
    console.log(`   ✓ ${item.file} uploaded successfully!`)
  }

  console.log(`\n🎉 PATCH-ONLY RELEASE ${TAG} PUBLISHED SUCCESSFULLY TO GITHUB RELEASES!`)
  console.log(`🔗 https://github.com/${REPO_OWNER}/${REPO_NAME}/releases/tag/${TAG}`)
}

main().catch((err) => {
  console.error('Fatal error during patch publish:', err)
  process.exit(1)
})
