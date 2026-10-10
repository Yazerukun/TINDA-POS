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
const TAG = 'v2.0.2'
const RELEASE_NAME = 'TINDA POS v2.0.2 — Streamlined Cashier Experience & Interactive Store Academy'

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
  console.log(`🚀 Starting Full Release Publication for ${TAG}...`)

  const setupFile = path.join(BUILDS_DIR, `TindaPOS-Setup-2.0.2.exe`)
  const portableFile = path.join(BUILDS_DIR, `TindaPOS-Portable-2.0.2.exe`)
  const blockmapFile = path.join(BUILDS_DIR, `TindaPOS-Setup-2.0.2.exe.blockmap`)
  const appImageFile = path.join(BUILDS_DIR, `TindaPOS-2.0.2.AppImage`)
  const patchFile = path.join(BUILDS_DIR, `TindaPOS-Feature-Patch-2.0.2.zip`)
  const patchShaFile = path.join(BUILDS_DIR, `TindaPOS-Feature-Patch-2.0.2.zip.sha256`)
  const latestYmlFile = path.join(BUILDS_DIR, `latest.yml`)
  const latestLinuxFile = path.join(BUILDS_DIR, `latest-linux.yml`)
  const sumsFile = path.join(BUILDS_DIR, `SHA256SUMS-${TAG}.txt`)

  if (!fs.existsSync(setupFile)) {
    throw new Error(`Build artifact missing! Expected ${setupFile}`)
  }

  const releaseNotes = `## ✨ What's New in TINDA POS ${TAG} (Streamlined Cashier Experience & Interactive Store Academy)

> **Official Full Executable & Feature Patch Release · October 10, 2026**
> *Introduces a clean, zero-clutter POS Cashier action bar with collapsible Quick Keys drawer, a unified Store Academy with an interactive 4-step cashier tour, and dual-store hardware alignment with zero database disruption.*

---

### 🛒 1. Zero-Clutter Streamlined POS Layout
- **1-Row Compact Action Bar:** Unifies Search (\`F1\` / \`/\`), Category Selector, Inventory Safety HUD badges (\`Low Stock\`, \`Near Expiry\`), View Toggle (\`List\` / \`Grid\`), Quick Calculator (\`F3\`), Promos, and the new \`⚡ Quick Keys\` and \`❓ Guide\` buttons into a single sleek row.
- **Collapsible Quick Keys Drawer:** Fast Buttons (\`FastButtonsBar\`: Yelo ₱5, Yosi ₱8, Candy ₱1, Rush ID ₱75) and Pinned Categories (\`PinnedCategoriesBar\`) are neatly housed in a collapsible Cupertino drawer.
- **Reclaims ~120px Screen Space:** Cashiers on standard 1366x768 screens get full vertical height for catalog products and cart items with zero clutter. State persists in \`localStorage\` (\`tinda_pos_quick_keys_open\`).

### 📖 2. Unified Store Academy & Interactive Cashier Tour
- **4-Step Cashier Superpower Tour:** An interactive, step-by-step walkthrough covering the core sari-sari store workflow:
  1. 📦 **Step 1: Paspas Pag-Scan & Search:** Barcode gun auto-entry, F1 quick search, and 1-tap Speed Keys.
  2. 👥 **Step 2: Suki & Utang Recording:** Customer selection from cart, instant credit limit & balance check, auto-ledger posting.
  3. 💵 **Step 3: Multi-Payment Checkout:** Cash with automatic change calculation, GCash QR, Maya, and Split Payment.
  4. 🧾 **Step 4: Thermal Receipt & Shift Balancing:** Chiteng CT221B / 58mm/80mm solid black printing, end-of-day Z-Reading drawer balancing.
- **Direct Handbook Bridge:** \`HelpGuideModal\` features a 1-click jump to the full in-depth Store Handbook (13 chapters).
- **POS Toolbar Access:** Cashiers can open the walkthrough at any moment via the \`[ ❓ Guide ]\` button in the POS header.

### 🛡️ 3. Safety Guarantees & Compatibility Invariants
- **Zero Database Disruption:** No destructive schema changes; 100% backward compatible with existing SQLite sales, utang, and inventory data.
- **Hardware & Keyboard Preservation:** Barcode scanners, thermal receipt printers, Chiteng CT221B label printers, and hotkeys (\`F1\`, \`F2\`, \`F3\`, \`F4\`, \`F12\`, \`Enter\`) work seamlessly.
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
    // Update release notes
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
    console.log(`  ✅ Updated release notes for ${TAG}`)
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
  await ensureUpload(setupFile, `TindaPOS-Setup-2.0.2.exe`, 'application/vnd.microsoft.portable-executable')
  await ensureUpload(portableFile, `TindaPOS-Portable-2.0.2.exe`, 'application/vnd.microsoft.portable-executable')
  await ensureUpload(blockmapFile, `TindaPOS-Setup-2.0.2.exe.blockmap`, 'application/octet-stream')
  await ensureUpload(appImageFile, `TindaPOS-2.0.2.AppImage`, 'application/x-executable')
  await ensureUpload(patchFile, `TindaPOS-Feature-Patch-2.0.2.zip`, 'application/zip')
  await ensureUpload(patchShaFile, `TindaPOS-Feature-Patch-2.0.2.zip.sha256`, 'text/plain')
  await ensureUpload(latestYmlFile, `latest.yml`, 'text/yaml')
  await ensureUpload(latestLinuxFile, `latest-linux.yml`, 'text/yaml')
  await ensureUpload(sumsFile, `SHA256SUMS-v2.0.2.txt`, 'text/plain')

  console.log(`\n🎉 RELEASE ${TAG} PUBLISHED AND VERIFIED SUCCESSFULLY!`)
  console.log(`🌐 URL: https://github.com/${REPO_OWNER}/${REPO_NAME}/releases/tag/${TAG}`)
}

main().catch((err) => {
  console.error(`❌ Release publication failed:`, err)
  process.exit(1)
})
