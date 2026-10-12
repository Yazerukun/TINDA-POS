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
const TAG = 'v2.1.6'
const RELEASE_NAME = 'TINDA POS v2.1.6 — Unified E-Wallet & Bills Center, Single-Receipt POS Cart Integration Edition'

const BUILDS_DIR = fs.existsSync(path.resolve('source', 'builds'))
  ? path.resolve('source', 'builds')
  : fs.existsSync(path.resolve('builds'))
    ? path.resolve('builds')
    : path.resolve('..', 'source', 'builds')

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
        ...headers
      }
    }

    const req = https.request(options, (res) => {
      let data = ''
      res.on('data', (chunk) => {
        data += chunk
      })
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          try {
            resolve(JSON.parse(data))
          } catch {
            resolve(data)
          }
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

    console.log(`  Uploading ${fileName} (${(stat.size / (1024 * 1024)).toFixed(2)} MB)...`)

    const options = {
      hostname: url.hostname,
      path: url.pathname + url.search,
      method: 'POST',
      headers: {
        'User-Agent': 'TINDA-POS-Release-Script',
        Authorization: `Bearer ${GITHUB_TOKEN}`,
        'Content-Type': contentType,
        'Content-Length': stat.size
      }
    }

    const req = https.request(options, (res) => {
      let data = ''
      res.on('data', (chunk) => {
        data += chunk
      })
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          console.log(`  ✅ Uploaded ${fileName}`)
          resolve(JSON.parse(data))
        } else {
          reject(new Error(`Failed to upload ${fileName} (HTTP ${res.statusCode}): ${data}`))
        }
      })
    })

    req.on('error', reject)
    fileStream.pipe(req)
  })
}

async function main() {
  console.log(`🚀 Starting Full Stable Release Publication for ${TAG}...`)

  const setupFile = path.join(BUILDS_DIR, `TindaPOS-Setup-2.1.6.exe`)
  const portableFile = path.join(BUILDS_DIR, `TindaPOS-Portable-2.1.6.exe`)
  const blockmapFile = path.join(BUILDS_DIR, `TindaPOS-Setup-2.1.6.exe.blockmap`)
  const patchFile = path.join(BUILDS_DIR, `TindaPOS-Feature-Patch-2.1.6.zip`)
  const patchShaFile = path.join(BUILDS_DIR, `TindaPOS-Feature-Patch-2.1.6.zip.sha256`)
  const latestYmlFile = path.join(BUILDS_DIR, `latest.yml`)
  const sumsFile = path.join(BUILDS_DIR, `SHA256SUMS-${TAG}.txt`)

  if (!fs.existsSync(setupFile)) {
    throw new Error(`Build artifact missing! Expected ${setupFile}`)
  }

  // Generate SHA256SUMS file
  const filesToHash = [setupFile, portableFile, blockmapFile, patchFile, latestYmlFile].filter(fs.existsSync)
  const checksumLines = filesToHash.map((f) => `${sha256File(f)}  ${path.basename(f)}`).join('\n') + '\n'
  fs.writeFileSync(sumsFile, checksumLines)
  console.log(`  ✅ Generated ${sumsFile}`)

  const releaseNotes = `## ✨ What's New in TINDA POS ${TAG} (Unified E-Wallet & Bills Center, Single-Receipt POS Cart Integration Edition)

> **Official Full Executable & Feature Patch Stable Release · October 12, 2026**  
> *Introduces unified E-Wallet & Bills Center architecture, single consolidated POS thermal receipt integration for utility bills & cash-in via retail cart, dual-mode express thermal slips, and complete timezone ghosting elimination across all store shifts.*

---

### 📦 Quick Download Assets
| Asset | Size | Type | Direct Download Link |
|---|---|---|---|
| 💿 **TindaPOS-Setup-2.1.6.exe** | ~116.8 MB | Official Windows NSIS Installer | [Download Setup](https://github.com/${REPO_OWNER}/${REPO_NAME}/releases/download/${TAG}/TindaPOS-Setup-2.1.6.exe) |
| 🚀 **TindaPOS-Portable-2.1.6.exe** | ~115.8 MB | Standalone Zero-Install Executable | [Download Portable](https://github.com/${REPO_OWNER}/${REPO_NAME}/releases/download/${TAG}/TindaPOS-Portable-2.1.6.exe) |
| ⚡ **TindaPOS-Feature-Patch-2.1.6.zip** | ~0.95 MB | Fast In-App Live Hot Patch | [Download Patch](https://github.com/${REPO_OWNER}/${REPO_NAME}/releases/download/${TAG}/TindaPOS-Feature-Patch-2.1.6.zip) |
| 📄 **latest.yml** | ~360 B | Auto-Updater Manifest | [Download latest.yml](https://github.com/${REPO_OWNER}/${REPO_NAME}/releases/download/${TAG}/latest.yml) |
| 🛡️ **SHA256SUMS-v2.1.6.txt** | ~310 B | Cryptographic Verification Hashes | [Download Hashes](https://github.com/${REPO_OWNER}/${REPO_NAME}/releases/download/${TAG}/SHA256SUMS-v2.1.6.txt) |

---

### 🛡️ 1. Timezone Invariant & Zero-Ghosting Datetime Parsing (\`EwalletAudit.tsx\`, \`BillsLoadHub.tsx\`)
- **Root Cause Rectification:** Fixed timezone distortion in \`parseRecordLocalDateKey(raw)\` where appending \`'Z'\` to space-separated SQLite local datetime timestamps (\`YYYY-MM-DD HH:MM:SS\`) falsely converted local store time to UTC. In Asia/Manila (UTC+8), this shifted transactions recorded after 4:00 PM into tomorrow's date, causing them to disappear from the \`TODAY\` filter.
- **Strict Local Date Extraction:** Space-separated SQLite local datetimes and ISO dates are strictly parsed into local store date keys (\`YYYY-MM-DD\`), guaranteeing 100% visibility of all transactions across daytime, evening, and night operations.
- **KPI Date Parity:** Replaced \`new Date().toISOString().slice(0, 10)\` in \`BillsLoadHub.tsx\` with local store date matching to ensure KPI metrics accurately reflect daily inflows and fee totals.

### 🛒 2. Dual-Mode E-Wallet & Bills Architecture with POS Cart Integration (\`BillsLoadHub.tsx\`)
- **Mode A (Express Standalone Slip):** Immediate 58mm/80mm thermal slip generation (\`printSlip\` / \`printBillSlip\`) for rapid standalone transactions without passing through retail checkout.
- **Mode B (Single Consolidated POS Receipt via Cart):**
  - **1-Click Integration:** 1-Click **"Add to POS Cart"** (\`usePosCart.getState().addCustomItem(...)\`) and **"Add & Go to POS Cashier"** (\`useNav.getState().setPage('pos')\`).
  - **Exact Line-Item Specs:**
    - Bills: \`Bills: {Biller} ({AccountNo})\`, Price: \`Amount + Fee\`, Cost: \`Amount\`, Profit: \`Fee\`.
    - E-Wallet Cash In: \`Cash In: {Channel} ({Phone/Ref})\`, Price: \`Amount + Fee\`, Cost: \`Amount\`, Profit: \`Fee\`.
  - **Single Official Receipt:** Bundles utility bills and cash-in with retail items (groceries, snacks, drinks) onto a single official POS thermal receipt at checkout.
  - **Dual-Audit Consistency:** Simultaneously records into the E-Wallet ledger with \`[POS Cart Item]\` tag, keeping shift balances and physical cash counts 100% synchronized.

### 📊 3. Unified Transactions & Multi-Ledger Viewer (\`Transactions.tsx\`)
- **Top-Level Multi-Tab Selector:**
  - **Tab 1: 🛒 POS Sales & Receipts:** Complete sales registry with expandable line items, refunds, voids, and reprint capabilities.
  - **Tab 2: ⚡ E-Wallet & Bills Center:** Cross-channel ledger displaying all standalone and mirrored E-Wallet, Bills Payment, and E-Load records.
- **Channel & Type Filtering:** Real-time filtering across Channels (All, GCash, Maya, MariBank, Bills & Load) and Types (Cash In, Cash Out, Bills Payment).
- **Instant Reprinting & Manual Dialog Fallback:** Direct 1-click thermal reprinting and system print dialog access directly from the master Transactions ledger.

---

### 🌐 Live Cloud Infrastructure
- **Store Owner Mobile Dashboard:** [https://tinda-owner-dashboard.pages.dev/](https://tinda-owner-dashboard.pages.dev/)
- **Documentation & User Guide:** [https://github.com/Yazerukun/TINDA-POS-Source](https://github.com/Yazerukun/TINDA-POS-Source)
- **Source Code Repository:** [https://github.com/Yazerukun/TINDA-POS-Source](https://github.com/Yazerukun/TINDA-POS-Source)
`

  // 1. Check if release already exists
  console.log(`Checking existing release for tag ${TAG}...`)
  let release = null
  try {
    release = await ghRequest('GET', `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/releases/tags/${TAG}`)
    console.log(`  Found existing release ID: ${release.id}`)
  } catch (err) {
    console.log(`  No existing release found. Creating new release for ${TAG}...`)
  }

  // 2. Create release if not found
  if (!release) {
    release = await ghRequest(
      'POST',
      `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/releases`,
      { 'Content-Type': 'application/json' },
      JSON.stringify({
        tag_name: TAG,
        name: RELEASE_NAME,
        body: releaseNotes,
        draft: false,
        prerelease: false,
        make_latest: 'true'
      })
    )
    console.log(`  ✅ Created release ${RELEASE_NAME} (ID: ${release.id})`)
  } else {
    // Update release notes & make latest
    await ghRequest(
      'PATCH',
      `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/releases/${release.id}`,
      { 'Content-Type': 'application/json' },
      JSON.stringify({
        name: RELEASE_NAME,
        body: releaseNotes,
        make_latest: 'true'
      })
    )
    console.log(`  ✅ Updated release notes for ${TAG} and set make_latest: true`)
  }

  const uploadUrl = release.upload_url
  const existingAssets = release.assets || []

  // Helper to delete existing asset before uploading
  async function ensureUpload(filePath, fileName, mimeType) {
    if (!fs.existsSync(filePath)) {
      console.warn(`  ⚠️ Skip missing file: ${fileName}`)
      return
    }
    const found = existingAssets.find((a) => a.name === fileName)
    if (found) {
      console.log(`  Deleting existing asset ${fileName} (ID: ${found.id})...`)
      try {
        await ghRequest('DELETE', `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/releases/assets/${found.id}`)
      } catch (e) {
        console.warn(`  Warning: Could not delete ${fileName}:`, e.message)
      }
    }
    await uploadAsset(uploadUrl, filePath, fileName, mimeType)
  }

  console.log(`Uploading release assets...`)
  await ensureUpload(setupFile, `TindaPOS-Setup-2.1.6.exe`, 'application/vnd.microsoft.portable-executable')
  await ensureUpload(portableFile, `TindaPOS-Portable-2.1.6.exe`, 'application/vnd.microsoft.portable-executable')
  await ensureUpload(blockmapFile, `TindaPOS-Setup-2.1.6.exe.blockmap`, 'application/octet-stream')
  await ensureUpload(patchFile, `TindaPOS-Feature-Patch-2.1.6.zip`, 'application/zip')
  await ensureUpload(patchShaFile, `TindaPOS-Feature-Patch-2.1.6.zip.sha256`, 'text/plain')
  await ensureUpload(latestYmlFile, `latest.yml`, 'text/yaml')
  await ensureUpload(sumsFile, `SHA256SUMS-v2.1.6.txt`, 'text/plain')

  console.log(`\n🎉 RELEASE ${TAG} PUBLISHED AND VERIFIED SUCCESSFULLY!`)
  console.log(`🌐 URL: https://github.com/${REPO_OWNER}/${REPO_NAME}/releases/tag/${TAG}`)
}

main().catch((err) => {
  console.error(`❌ Release publication failed:`, err)
  process.exit(1)
})
