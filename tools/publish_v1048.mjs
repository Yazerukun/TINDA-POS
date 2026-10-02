import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import https from 'node:https'

const GITHUB_TOKEN = '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'
const REPO_OWNER = 'Yazerukun'
const REPO_NAME = 'TINDA-POS'
const TAG = 'v1.0.48'
const RELEASE_NAME = 'TINDA POS v1.0.48 — Executive Cloud Dashboard Sync, Live Sales Remote Access & VIP Integration'

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
      if (Buffer.isBuffer(body)) {
        req.write(body)
      } else if (typeof body === 'string') {
        req.write(body)
      } else {
        req.write(JSON.stringify(body))
      }
    }
    req.end()
  })
}

async function uploadAsset(uploadUrlTemplate, filePath, fileName, mimeType) {
  const cleanUploadUrl = uploadUrlTemplate.replace(/\{(\?name,label|name)\}/, '')
  const uploadUrl = `${cleanUploadUrl}?name=${encodeURIComponent(fileName)}`
  const fileData = fs.readFileSync(filePath)

  console.log(`Uploading ${fileName} (${(fileData.length / 1024 / 1024).toFixed(2)} MB)...`)
  return ghRequest('POST', uploadUrl, {
    'Content-Type': mimeType,
    'Content-Length': fileData.length
  }, fileData)
}

async function run() {
  console.log('=== Step 1: Validating Build Artifacts ===')
  const setupExe = path.join(BUILDS_DIR, 'TindaPOS-Setup-1.0.48.exe')
  const setupBlockmap = path.join(BUILDS_DIR, 'TindaPOS-Setup-1.0.48.exe.blockmap')
  const portableExe = path.join(BUILDS_DIR, 'TindaPOS-Portable-1.0.48.exe')
  const latestYml = path.join(BUILDS_DIR, 'latest.yml')
  const userGuidePdf = path.join(BUILDS_DIR, 'TindaPOS-User-Guide.pdf')

  const requiredFiles = [
    { path: setupExe, name: 'TindaPOS-Setup-1.0.48.exe', mime: 'application/octet-stream' },
    { path: setupBlockmap, name: 'TindaPOS-Setup-1.0.48.exe.blockmap', mime: 'application/octet-stream' },
    { path: portableExe, name: 'TindaPOS-Portable-1.0.48.exe', mime: 'application/octet-stream' },
    { path: latestYml, name: 'latest.yml', mime: 'text/yaml' },
    { path: userGuidePdf, name: 'TindaPOS-User-Guide.pdf', mime: 'application/pdf' }
  ]

  for (const f of requiredFiles) {
    if (!fs.existsSync(f.path)) {
      throw new Error(`Missing required artifact: ${f.name} at ${f.path}`)
    }
    const stat = fs.statSync(f.path)
    console.log(`[PASS] ${f.name} exists (${(stat.size / 1024 / 1024).toFixed(2)} MB)`)
  }

  console.log('\n=== Step 2: Generating SHA256SUMS-v1.0.48.txt ===')
  const sha256Lines = []
  for (const f of requiredFiles) {
    const hash = sha256File(f.path)
    sha256Lines.push(`${hash}  ${f.name}`)
  }
  const shaContent = sha256Lines.join('\n') + '\n'
  const shaPath = path.join(BUILDS_DIR, 'SHA256SUMS-v1.0.48.txt')
  fs.writeFileSync(shaPath, shaContent, 'utf-8')
  console.log(`Generated SHA256 checksums:\n${shaContent}`)

  const allAssets = [
    ...requiredFiles,
    { path: shaPath, name: 'SHA256SUMS-v1.0.48.txt', mime: 'text/plain' }
  ]

  console.log('\n=== Step 3: Checking / Creating GitHub Release ===')
  let release = null
  try {
    release = await ghRequest('GET', `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/releases/tags/${TAG}`)
    console.log(`Found existing release id: ${release.id}`)
  } catch {
    console.log(`Release ${TAG} not found, creating new release...`)
    const releaseBody = `## 🚀 TINDA POS v1.0.48 — Executive Cloud Dashboard Sync, Live Sales Remote Access & VIP Integration

### 🛠️ What's New in v1.0.48

1. **Executive Cloud Owner Dashboard Direct Integration**:
   - Integrated full Cloud Sync support directly inside the official master desktop application.
   - Built a dedicated **Cloud Dashboard (VIP)** tab in Settings with:
     - Real-time cloud sync status & toggle.
     - One-click copyable **Store ID** and secret **Sync Key** for branch pairing.
     - **Sync Now** live health ping and offline sync queue indicator.
     - Full English step-by-step setup guide and direct launcher for the Web Dashboard ([https://tinda-owner-dashboard.pages.dev/](https://tinda-owner-dashboard.pages.dev/)).

2. **Automated Non-Blocking Background Sync Engine**:
   - **Sales Auto-Sync**: Every completed checkout automatically syncs payment breakdowns (Cash, GCash, Maya, Utang) and cart line items to the Cloudflare Worker.
   - **Shift Z-Read Auto-Sync**: Every closed shift automatically transmits the Z-Read snapshot and cash reconciliation record to the owner's dashboard.
   - **Stock Movements Auto-Sync**: All restocks, adjustments, and deductions sync live without interrupting POS cashier performance.
   - **Offline Resilience**: Offline queues protect POS transactions if store internet drops; automatically retries once connectivity is restored.

3. **Cloudflare Worker & Dashboard Backend Upgrade**:
   - Upgraded Cloudflare Worker backend (\`https://tinda-sync.yomikaze-md.workers.dev\`) with open owner registration and multi-branch support.
   - Updated Cloud Web Dashboard with streamlined authentication and eliminated placeholder artifacts.

4. **100% Master Feature Invariant Preservation**:
   - All master capabilities preserved: Decimal Kilo Checkout, SRP Comparisons, DTI Catalog, Expiration Tracking, Multi-PC LAN Hub, and Secondary Sales Monitor Screen.

---

### 📦 Verify Release Checksums (SHA-256)
\`\`\`text
${shaContent.trim()}
\`\`\`
`
    release = await ghRequest('POST', `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/releases`, {
      'Content-Type': 'application/json'
    }, {
      tag_name: TAG,
      target_commitish: 'master',
      name: RELEASE_NAME,
      body: releaseBody,
      draft: false,
      prerelease: false
    })
    console.log(`Successfully created release id: ${release.id}`)
  }

  console.log('\n=== Step 4: Uploading Artifacts to GitHub Release ===')
  // Check existing assets
  const existingAssets = release.assets || []
  for (const asset of allAssets) {
    const existing = existingAssets.find((a) => a.name === asset.name)
    if (existing) {
      console.log(`Asset ${asset.name} already exists (id ${existing.id}), deleting to replace...`)
      await ghRequest('DELETE', `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/releases/assets/${existing.id}`)
    }
    await uploadAsset(release.upload_url, asset.path, asset.name, asset.mime)
    console.log(`[PASS] Uploaded ${asset.name}`)
  }

  console.log('\n🎉 ALL 6 RELEASE ASSETS SUCCESSFULLY PUBLISHED TO GITHUB!')
  console.log(`URL: https://github.com/${REPO_OWNER}/${REPO_NAME}/releases/tag/${TAG}`)
}

run().catch((err) => {
  console.error('\n❌ Release publishing failed:', err)
  process.exit(1)
})
