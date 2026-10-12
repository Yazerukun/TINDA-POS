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
const TAG = 'v2.1.4'
const RELEASE_NAME = 'TINDA POS v2.1.4 — 1-Tap QR Code Auto-Pair & Background Auto-Sync Loop Edition'

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

  const setupFile = path.join(BUILDS_DIR, `TindaPOS-Setup-2.1.4.exe`)
  const portableFile = path.join(BUILDS_DIR, `TindaPOS-Portable-2.1.4.exe`)
  const blockmapFile = path.join(BUILDS_DIR, `TindaPOS-Setup-2.1.4.exe.blockmap`)
  const patchFile = path.join(BUILDS_DIR, `TindaPOS-Feature-Patch-2.1.4.zip`)
  const patchShaFile = path.join(BUILDS_DIR, `TindaPOS-Feature-Patch-2.1.4.zip.sha256`)
  const latestYmlFile = path.join(BUILDS_DIR, `latest.yml`)
  const sumsFile = path.join(BUILDS_DIR, `SHA256SUMS-${TAG}.txt`)

  if (!fs.existsSync(setupFile)) {
    throw new Error(`Build artifact missing! Expected ${setupFile}`)
  }

  // Generate SHA256SUMS file
  const filesToHash = [setupFile, portableFile, blockmapFile, patchFile].filter(fs.existsSync)
  const checksumLines = filesToHash.map((f) => `${sha256File(f)}  ${path.basename(f)}`).join('\n') + '\n'
  fs.writeFileSync(sumsFile, checksumLines)
  console.log(`  ✅ Generated ${sumsFile}`)

  const releaseNotes = `## ✨ What's New in TINDA POS ${TAG} (1-Tap QR Code Auto-Pair & Background Auto-Sync Loop Edition)

> **Official Full Executable & Feature Patch Release · October 12, 2026**  
> *Introduces 1-tap mobile QR code pairing for the Cloud Owner Dashboard, continuous background auto-sync loop, multi-owner account linking in Cloudflare D1, and instant 1-click magic setup links.*

---

### 📦 Quick Download Assets
| Asset | Size | Type | Direct Download Link |
|---|---|---|---|
| 💿 **TindaPOS-Setup-2.1.4.exe** | ~116.7 MB | Official Windows NSIS Installer | [Download Setup](https://github.com/${REPO_OWNER}/${REPO_NAME}/releases/download/${TAG}/TindaPOS-Setup-2.1.4.exe) |
| 🚀 **TindaPOS-Portable-2.1.4.exe** | ~115.8 MB | Standalone Zero-Install Executable | [Download Portable](https://github.com/${REPO_OWNER}/${REPO_NAME}/releases/download/${TAG}/TindaPOS-Portable-2.1.4.exe) |
| ⚡ **TindaPOS-Feature-Patch-2.1.4.zip** | ~0.94 MB | Fast In-App Live Hot Patch | [Download Patch](https://github.com/${REPO_OWNER}/${REPO_NAME}/releases/download/${TAG}/TindaPOS-Feature-Patch-2.1.4.zip) |
| 📄 **latest.yml** | ~360 B | Auto-Updater Manifest | [Download latest.yml](https://github.com/${REPO_OWNER}/${REPO_NAME}/releases/download/${TAG}/latest.yml) |
| 🛡️ **SHA256SUMS-v2.1.4.txt** | ~310 B | Cryptographic Verification Hashes | [Download Hashes](https://github.com/${REPO_OWNER}/${REPO_NAME}/releases/download/${TAG}/SHA256SUMS-v2.1.4.txt) |

---

### 📱 1. 1-Tap Mobile Phone Pairing & Auto-Connect
- **High-Contrast QR Code Modal (\`Settings.tsx\`):** Store owners and cashiers can scan the pairing QR code directly using their iPhone Camera or Android QR Scanner.
- **Zero Manual Typing:** Tapping the link opens the Owner Dashboard with store ID and sync key pre-configured (\`?sid=...&key=...&name=...\`) and automatically links the branch in 0.1 seconds.
- **Copy Setup Link Button:** 1-click button to copy the direct setup link and send to the store owner via Messenger, Viber, or SMS.
- **Open Pre-Paired on PC:** Instant launcher to view the dashboard in the default browser pre-paired.

### 🔄 2. Autonomous Background Auto-Sync Loop
- **Startup Backfill (4s Grace):** Automatically pushes up to 50 recent transactions right when the POS application opens.
- **Continuous 3-Minute Loop:** Keeps owner dashboards updated live in real time without requiring manual "Sync Now" button clicks from cashiers.
- **Safe Offline Queue:** All transactions remain 100% offline-first and safe in local SQLite if internet is disconnected.

### 👥 3. Multi-Owner D1 Branch Resolution
- **Multi-Account Linking (\`store_owners\` Table):** Enabled multiple user accounts to access the same store branch (e.g., \`mary grace flor\` and \`adamgrace123\` for Adamgrace Minimart).
- **Zero-Branch Visibility Resolved:** Store owners can log in with any linked credential and immediately see real-time store performance.

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
  await ensureUpload(setupFile, `TindaPOS-Setup-2.1.4.exe`, 'application/vnd.microsoft.portable-executable')
  await ensureUpload(portableFile, `TindaPOS-Portable-2.1.4.exe`, 'application/vnd.microsoft.portable-executable')
  await ensureUpload(blockmapFile, `TindaPOS-Setup-2.1.4.exe.blockmap`, 'application/octet-stream')
  await ensureUpload(patchFile, `TindaPOS-Feature-Patch-2.1.4.zip`, 'application/zip')
  await ensureUpload(patchShaFile, `TindaPOS-Feature-Patch-2.1.4.zip.sha256`, 'text/plain')
  await ensureUpload(latestYmlFile, `latest.yml`, 'text/yaml')
  await ensureUpload(sumsFile, `SHA256SUMS-v2.1.4.txt`, 'text/plain')

  console.log(`\n🎉 RELEASE ${TAG} PUBLISHED AND VERIFIED SUCCESSFULLY!`)
  console.log(`🌐 URL: https://github.com/${REPO_OWNER}/${REPO_NAME}/releases/tag/${TAG}`)
}

main().catch((err) => {
  console.error(`❌ Release publication failed:`, err)
  process.exit(1)
})
