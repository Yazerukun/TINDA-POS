import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import https from 'node:https'
import { execSync } from 'node:child_process'

function getGhToken() {
  if (process.env.GITHUB_TOKEN) return process.env.GITHUB_TOKEN
  try {
    return execSync('gh auth token', { encoding: 'utf-8' }).trim()
  } catch {
    return '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'
  }
}

const GITHUB_TOKEN = getGhToken()
const REPO_OWNER = 'Yazerukun'
const REPO_NAME = 'TINDA-POS'
const TAG = 'v1.0.60'
const RELEASE_NAME = 'TINDA POS v1.0.60 — VIP Client Infinite Scroll & 7 Core Enhancements'

const BUILDS_DIR = path.resolve('source', 'builds')

function sha256File(filePath) {
  const hash = crypto.createHash('sha256')
  const data = fs.readFileSync(filePath)
  hash.update(data)
  return hash.digest('hex')
}

function ghRequest(method, urlStr, headers = {}, body = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(urlStr)
    const options = {
      hostname: url.hostname,
      path: url.pathname + url.search,
      method,
      headers: {
        'User-Agent': 'TINDA-POS-Release-Script',
        Authorization: `Bearer ${GITHUB_TOKEN}`,
        Accept: 'application/vnd.github.v3+json',
        ...headers
      }
    }

    const req = https.request(options, (res) => {
      let chunks = []
      res.on('data', (d) => chunks.push(d))
      res.on('end', () => {
        const resBody = Buffer.concat(chunks).toString('utf-8')
        if (res.statusCode >= 200 && res.statusCode < 300) {
          try {
            resolve(JSON.parse(resBody))
          } catch {
            resolve(resBody)
          }
        } else {
          reject(new Error(`GitHub API HTTP ${res.statusCode}: ${resBody}`))
        }
      })
    })

    req.on('error', reject)
    if (body) {
      req.write(body)
    }
    req.end()
  })
}

function uploadAsset(uploadUrl, filePath, fileName, contentType) {
  return new Promise((resolve, reject) => {
    const cleanUrl = uploadUrl.replace(/\{.*?\}$/, '') + `?name=${encodeURIComponent(fileName)}`
    const url = new URL(cleanUrl)
    const fileStats = fs.statSync(filePath)
    const fileSize = fileStats.size

    console.log(`Uploading ${fileName} (${(fileSize / (1024 * 1024)).toFixed(2)} MB)...`)

    const options = {
      hostname: url.hostname,
      path: url.pathname + url.search,
      method: 'POST',
      headers: {
        'User-Agent': 'TINDA-POS-Release-Script',
        Authorization: `Bearer ${GITHUB_TOKEN}`,
        'Content-Type': contentType,
        'Content-Length': fileSize
      }
    }

    const req = https.request(options, (res) => {
      let chunks = []
      res.on('data', (d) => chunks.push(d))
      res.on('end', () => {
        const resBody = Buffer.concat(chunks).toString('utf-8')
        if (res.statusCode >= 200 && res.statusCode < 300) {
          try {
            resolve(JSON.parse(resBody))
          } catch {
            resolve(resBody)
          }
        } else {
          reject(new Error(`Upload HTTP ${res.statusCode}: ${resBody}`))
        }
      })
    })

    req.on('error', reject)
    const readStream = fs.createReadStream(filePath)
    readStream.pipe(req)
  })
}

async function main() {
  console.log(`=== Step 1: Validating Build Artifacts for ${TAG} ===`)
  
  const setupExe = path.join(BUILDS_DIR, 'TindaPOS-Setup-1.0.60.exe')
  const setupBlockmap = path.join(BUILDS_DIR, 'TindaPOS-Setup-1.0.60.exe.blockmap')
  const portableExe = path.join(BUILDS_DIR, 'TindaPOS-Portable-1.0.60.exe')
  const latestYml = path.join(BUILDS_DIR, 'latest.yml')
  const userGuide = path.join(BUILDS_DIR, 'TindaPOS-User-Guide.pdf')

  if (!fs.existsSync(userGuide)) {
    const guideSrc = path.resolve('source', 'builds', 'TindaPOS-User-Guide.pdf')
    if (fs.existsSync(guideSrc)) {
      fs.copyFileSync(guideSrc, userGuide)
    }
  }

  const artifacts = [
    { file: setupExe, name: 'TindaPOS-Setup-1.0.60.exe', type: 'application/vnd.microsoft.portable-executable' },
    { file: setupBlockmap, name: 'TindaPOS-Setup-1.0.60.exe.blockmap', type: 'application/octet-stream' },
    { file: portableExe, name: 'TindaPOS-Portable-1.0.60.exe', type: 'application/vnd.microsoft.portable-executable' },
    { file: latestYml, name: 'latest.yml', type: 'text/yaml' },
    { file: userGuide, name: 'TindaPOS-User-Guide.pdf', type: 'application/pdf' }
  ]

  for (const a of artifacts) {
    if (!fs.existsSync(a.file)) {
      console.error(`[ERROR] Missing required artifact: ${a.file}`)
      process.exit(1)
    }
    const sz = (fs.statSync(a.file).size / (1024 * 1024)).toFixed(2)
    console.log(`[PASS] ${a.name} exists (${sz} MB)`)
  }

  console.log(`\n=== Step 2: Generating SHA256SUMS-v1.0.60.txt ===`)
  const checksumLines = []
  for (const a of artifacts) {
    const hash = sha256File(a.file)
    checksumLines.push(`${hash}  ${a.name}`)
  }
  const checksumsFile = path.join(BUILDS_DIR, 'SHA256SUMS-v1.0.60.txt')
  fs.writeFileSync(checksumsFile, checksumLines.join('\n') + '\n', 'utf8')
  console.log(`Generated SHA256 checksums:\n${checksumLines.join('\n')}\n`)

  artifacts.push({ file: checksumsFile, name: 'SHA256SUMS-v1.0.60.txt', type: 'text/plain' })

  console.log(`\n=== Step 3: Checking / Creating GitHub Release ===`)
  let release = null
  try {
    release = await ghRequest('GET', `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/releases/tags/${TAG}`)
    console.log(`Release ${TAG} found (id: ${release.id}).`)
  } catch (err) {
    console.log(`Release ${TAG} not found, creating new release...`)
    const releaseBody = `## TINDA POS v1.0.60 — VIP Client Infinite Scroll & 7 Core Enhancements

### 📜 1. VIP Client Full Scrolling & Infinite Inventory Feed (Client Feedback Addressed)
- **Root Cause Eliminated**: Removed the hardcoded \`limit: 60\` query cap and fixed the double-scroll height trapping in \`Shell.tsx\`.
- **Continuous Infinite Pagination**: Implemented paginated auto-loading with \`PAGE_SIZE = 120\`, scroll boundary listeners, and \`pb-28\` bottom padding. Large catalogs (500–10,000+ items) now scroll completely and fluidly without cut-offs in both Table and Grid views.

### 💵 2. Quick Cash Denomination & Increment Chips
- 1-Tap quick payment chips in Cash Checkout: \`Exact (₱...)\`, \`₱20\`, \`₱50\`, \`₱100\`, \`₱200\`, \`₱500\`, \`₱1,000\`, plus instant increment chips \`+₱20\`, \`+₱50\`, \`+₱100\` for rapid sukli calculation.

### 🔊 3. Zero-Asset Web Audio API Hardware Synthesizer
- 100% offline audio engine with crisp high-pitched scan confirmation chimes (1300Hz-1750Hz sine), out-of-stock warning buzzers (280Hz sawtooth), cash register chime (C6-C7 arpeggio), and 1-tap header mute/unmute toggle.

### ⚡ 4. Multiplier Scan & Rapid Entry Engine
- Cashiers can scan or enter \`5*BARCODE\` or \`10*PRODUCT\` to instantly add bulk quantities without tapping the plus button multiple times.

### 🏷️ 5. Senior Citizen & PWD 20% Statutory Discount System
- One-click modal calculation of 20% discount on cart subtotal with OSCA / PWD booklet and ID tracking for retail and tax compliance.

### 🖨️ 6. 1-Click Thermal Z-Reading / Daily Cash Balancing Print
- Direct header Z-Reading button prints daily sales and shift balancing reports to ESC/POS thermal printers.

### 🛡️ 7. Automated 7-Day Rolling Daily SQLite Safety Snapshot
- Daily database backups are maintained on a 7-day rolling window with automatic pruning of older snapshots to optimize store storage.

### 🚨 8. Live Inventory Safety & Expiry HUD Badges
- Real-time header badges for Low-Stock and Near-Expiry items with 1-click catalog filtering.

---

### 📦 Checksums & Verification (SHA-256)
\`\`\`text
${checksumLines.join('\n')}
\`\`\`
`
    const createPayload = JSON.stringify({
      tag_name: TAG,
      target_commitish: 'master',
      name: RELEASE_NAME,
      body: releaseBody,
      draft: false,
      prerelease: false
    })

    release = await ghRequest('POST', `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/releases`, {
      'Content-Type': 'application/json'
    }, createPayload)
    console.log(`Release created successfully (id: ${release.id})`)
  }

  console.log(`\n=== Step 4: Uploading Release Assets ===`)
  const existingAssets = release.assets || []
  for (const a of artifacts) {
    const existing = existingAssets.find((ea) => ea.name === a.name)
    if (existing) {
      console.log(`Asset ${a.name} already exists (id: ${existing.id}), deleting old asset...`)
      await ghRequest('DELETE', `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/releases/assets/${existing.id}`)
      console.log(`Deleted ${a.name}`)
    }
    await uploadAsset(release.upload_url, a.file, a.name, a.type)
    console.log(`[PASS] Uploaded ${a.name}`)
  }

  console.log(`\n🎉 SUCCESS! TINDA POS ${TAG} published with all assets!`)
  console.log(`Release URL: https://github.com/${REPO_OWNER}/${REPO_NAME}/releases/tag/${TAG}`)
}

main().catch((err) => {
  console.error('\n[FATAL ERROR]', err)
  process.exit(1)
})
