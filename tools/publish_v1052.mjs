import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import https from 'node:https'

const GITHUB_TOKEN = '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'
const REPO_OWNER = 'Yazerukun'
const REPO_NAME = 'TINDA-POS'
const TAG = 'v1.0.52'
const RELEASE_NAME = 'TINDA POS v1.0.52 — Verified VIP Badges, Animated Shimmer & Linux Auto-Updater'

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
  const setupExe = path.join(BUILDS_DIR, 'TindaPOS-Setup-1.0.52.exe')
  const setupBlockmap = path.join(BUILDS_DIR, 'TindaPOS-Setup-1.0.52.exe.blockmap')
  const portableExe = path.join(BUILDS_DIR, 'TindaPOS-Portable-1.0.52.exe')
  const appImage = path.join(BUILDS_DIR, 'TindaPOS-1.0.52.AppImage')
  const latestYml = path.join(BUILDS_DIR, 'latest.yml')
  const latestLinuxYml = path.join(BUILDS_DIR, 'latest-linux.yml')
  const userGuidePdf = path.join(BUILDS_DIR, 'TindaPOS-User-Guide.pdf')

  const requiredFiles = [
    { path: setupExe, name: 'TindaPOS-Setup-1.0.52.exe', mime: 'application/octet-stream' },
    { path: setupBlockmap, name: 'TindaPOS-Setup-1.0.52.exe.blockmap', mime: 'application/octet-stream' },
    { path: portableExe, name: 'TindaPOS-Portable-1.0.52.exe', mime: 'application/octet-stream' },
    { path: appImage, name: 'TindaPOS-1.0.52.AppImage', mime: 'application/x-executable' },
    { path: latestYml, name: 'latest.yml', mime: 'text/yaml' },
    { path: latestLinuxYml, name: 'latest-linux.yml', mime: 'text/yaml' },
    { path: userGuidePdf, name: 'TindaPOS-User-Guide.pdf', mime: 'application/pdf' }
  ]

  for (const f of requiredFiles) {
    if (!fs.existsSync(f.path)) {
      throw new Error(`Missing required artifact: ${f.name} at ${f.path}`)
    }
    const stat = fs.statSync(f.path)
    console.log(`[PASS] ${f.name} exists (${(stat.size / 1024 / 1024).toFixed(2)} MB)`)
  }

  console.log('\n=== Step 2: Generating SHA256SUMS-v1.0.52.txt ===')
  const sha256Lines = []
  for (const f of requiredFiles) {
    const hash = sha256File(f.path)
    sha256Lines.push(`${hash}  ${f.name}`)
  }
  const shaContent = sha256Lines.join('\n') + '\n'
  const shaPath = path.join(BUILDS_DIR, 'SHA256SUMS-v1.0.52.txt')
  fs.writeFileSync(shaPath, shaContent, 'utf-8')
  console.log(`Generated SHA256 checksums:\n${shaContent}`)

  const allAssets = [
    ...requiredFiles,
    { path: shaPath, name: 'SHA256SUMS-v1.0.52.txt', mime: 'text/plain' }
  ]

  console.log('\n=== Step 3: Checking / Creating GitHub Release ===')
  let release = null
  try {
    release = await ghRequest('GET', `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/releases/tags/${TAG}`)
    console.log(`Found existing release id: ${release.id}`)
  } catch {
    console.log(`Release ${TAG} not found, creating new release...`)
    const releaseBody = `## 💎 TINDA POS v1.0.52 — Verified VIP Badges, Animated Shimmer & Linux Auto-Updater

### 🛠️ What's New in v1.0.52

1. **Animated VERIFIED VIP Badges in Global Lounge**:
   - Store owners with active VIP Pro licenses now feature an exclusive animated glowing gold badge (\`💎 VERIFIED VIP\`) beside their store name.
   - Includes rotating sparkle animation (\`animate-spin\`), glowing gold pulse aura, and warm golden chat bubbles.
   - Honors all loyal VIP merchants who purchased lifetime licenses from Dev Ian.

2. **Cross-Platform Linux AppImage Auto-Updater**:
   - Fixed Linux AppImage updater routing and permissions.
   - Standalone download, automatic \`chmod +x\` execution permissions, atomic in-place replacement of active binary, and instant clean relaunch.

3. **100% Free Nationwide Merchant Community Lounge**:
   - Open for all store owners to collaborate, share wholesale pricing, and connect.
   - Real-time unread alert red pulse beacon when drawer is closed.

4. **Streamlined POS Header Toolbar**:
   - Distraction-free cashier workspace with unclickable header items removed.

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

  console.log('\n🎉 ALL RELEASE ASSETS SUCCESSFULLY PUBLISHED TO GITHUB!')
  console.log(`URL: https://github.com/${REPO_OWNER}/${REPO_NAME}/releases/tag/${TAG}`)
}

run().catch((err) => {
  console.error('\n❌ Release publishing failed:', err)
  process.exit(1)
})
