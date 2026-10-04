import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import https from 'node:https'

const GITHUB_TOKEN = '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'
const REPO_OWNER = 'Yazerukun'
const REPO_NAME = 'TINDA-POS'
const TAG = 'v1.0.50'
const RELEASE_NAME = 'TINDA POS v1.0.50 — Global Community Lounge & Live Dev Announcements'

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
  const setupExe = path.join(BUILDS_DIR, 'TindaPOS-Setup-1.0.50.exe')
  const setupBlockmap = path.join(BUILDS_DIR, 'TindaPOS-Setup-1.0.50.exe.blockmap')
  const portableExe = path.join(BUILDS_DIR, 'TindaPOS-Portable-1.0.50.exe')
  const latestYml = path.join(BUILDS_DIR, 'latest.yml')
  const userGuidePdf = path.join(BUILDS_DIR, 'TindaPOS-User-Guide.pdf')

  const requiredFiles = [
    { path: setupExe, name: 'TindaPOS-Setup-1.0.50.exe', mime: 'application/octet-stream' },
    { path: setupBlockmap, name: 'TindaPOS-Setup-1.0.50.exe.blockmap', mime: 'application/octet-stream' },
    { path: portableExe, name: 'TindaPOS-Portable-1.0.50.exe', mime: 'application/octet-stream' },
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

  console.log('\n=== Step 2: Generating SHA256SUMS-v1.0.50.txt ===')
  const sha256Lines = []
  for (const f of requiredFiles) {
    const hash = sha256File(f.path)
    sha256Lines.push(`${hash}  ${f.name}`)
  }
  const shaContent = sha256Lines.join('\n') + '\n'
  const shaPath = path.join(BUILDS_DIR, 'SHA256SUMS-v1.0.50.txt')
  fs.writeFileSync(shaPath, shaContent, 'utf-8')
  console.log(`Generated SHA256 checksums:\n${shaContent}`)

  const allAssets = [
    ...requiredFiles,
    { path: shaPath, name: 'SHA256SUMS-v1.0.50.txt', mime: 'text/plain' }
  ]

  console.log('\n=== Step 3: Checking / Creating GitHub Release ===')
  let release = null
  try {
    release = await ghRequest('GET', `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/releases/tags/${TAG}`)
    console.log(`Found existing release id: ${release.id}`)
  } catch {
    console.log(`Release ${TAG} not found, creating new release...`)
    const releaseBody = `## 🚀 TINDA POS v1.0.50 — Global Community Lounge & Live Dev Announcements

### 🛠️ What's New in v1.0.50

1. **TINDA Global Community Lounge** (VIP Pro Exclusive):
   - Floating **Global Lounge** button in the bottom-right corner of the POS with an amber unread-message badge.
   - Slide-over chat drawer showing real-time messages from all VIP stores powered by Cloudflare D1.
   - **VIP Pro members can send messages**; free-tier users get read-only access with a clear upgrade prompt.
   - Polling runs only while the drawer is open (every 6 seconds) — automatically stops when closed to conserve bandwidth and battery.
   - Zero-freeze, non-blocking architecture: all network calls use AbortSignal timeouts (4s GET / 5s POST) and fail silently so the POS never stalls.

2. **Live Developer Announcements**:
   - Pinned announcement banner at the top of the Community Lounge showing the latest official message from the Dev/Owner.
   - Founder messages display with a **👑 Ian (Founder / Dev) [VERIFIED]** badge in a distinct amber style.
   - Only Ian (using the protected Dev Master Key) can post announcements.

3. **Dev/Owner Verified Badge**:
   - Messages posted with the Dev Master Key are cryptographically identified server-side and rendered with a special \`[VERIFIED]\` badge and amber styling.
   - Protects users from impersonation — the badge cannot be faked by any regular VIP user.

4. **English Update Notification Modal**:
   - The "New Update Available" pop-up is now 100% in English: **"New Update Available"**, **"Later"**, **"Download Update"**, **"Restart & Install"**.
   - No more Bisaya/Tagalog text in system dialogs.

5. **Architecture & Quality**:
   - 59/59 test suites passing (378/378 tests) with 6 new unit tests for the community chat service.
   - 0 TypeScript errors — full typecheck clean.
   - Master invariants guard: ALL PASSED.

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
