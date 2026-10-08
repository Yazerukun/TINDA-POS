import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import https from 'node:https'
import { execSync } from 'node:child_process'

function getGhToken() {
  if (process.env.GITHUB_TOKEN) return process.env.GITHUB_TOKEN.trim()
  try {
    const out = execSync('gh auth token', { encoding: 'utf-8' })
    const match = out.match(/(ghp_[a-zA-Z0-9]+|github_pat_[a-zA-Z0-9_]+)/)
    return match ? match[1] : out.trim().split('\n').pop().trim()
  } catch {
    return ''
  }
}

const GITHUB_TOKEN = getGhToken()
const REPO_OWNER = 'Yazerukun'
const REPO_NAME = 'TINDA-POS'
const TAG = 'v1.0.84'
const RELEASE_NAME = 'TINDA POS v1.0.84 — Compact TindaBot & Non-Blocking POS Clearance Edition'

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
        'User-Agent': 'TINDA-POS-Release-Script',
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
    console.error('❌ GITHUB_TOKEN not found! Please login with `gh auth login` or set GITHUB_TOKEN.')
    process.exit(1)
  }

  console.log(`🚀 Publishing official GitHub release: ${TAG} (${RELEASE_NAME})...`)

  // 1. Files to upload
  const assetsToUpload = [
    { file: 'TindaPOS-1.0.84.AppImage', type: 'application/x-executable' },
    { file: 'TindaPOS-Setup-1.0.84.exe', type: 'application/vnd.microsoft.portable-executable' },
    { file: 'TindaPOS-Portable-1.0.84.exe', type: 'application/vnd.microsoft.portable-executable' },
    { file: 'TindaPOS-Setup-1.0.84.exe.blockmap', type: 'application/octet-stream' },
    { file: 'TindaPOS-Feature-Patch-1.0.84.zip', type: 'application/zip' },
    { file: 'TindaPOS-Feature-Patch-1.0.84.zip.sha256', type: 'text/plain' },
    { file: 'latest.yml', type: 'text/yaml' },
    { file: 'latest-linux.yml', type: 'text/yaml' },
    { file: 'SHA256SUMS-v1.0.84.txt', type: 'text/plain' }
  ]

  for (const item of assetsToUpload) {
    const fullPath = path.join(BUILDS_DIR, item.file)
    if (!fs.existsSync(fullPath)) {
      console.error(`❌ Missing asset file: ${fullPath}`)
      process.exit(1)
    }
  }

  // Release notes body
  const body = `## 🤖 TINDA POS v1.0.84 — Compact TindaBot & Non-Blocking POS Clearance Edition

Official Production Release: **October 9, 2026**

### 🌟 What's New in v1.0.84:
1. **🎨 Compact 330px AI Assistant (TindaBot):**
   - Redesigned sleek 330px default width (reduced by 25% from 420px) and 450px height.
   - Built-in width switcher (\`⤢\` / 330px ↔ 390px) in the header for comfortable multi-language reading.
   - Micro-bar minimization (\`240px × 42px\`) with drag handle, live pulse dot, restore, and close buttons.
2. **🛡️ Unified Floating Widgets Dock with POS Clearance:**
   - Consolidated TindaBot AI and Community Chat launchers into a single compact dock: \`[ 🤖 Ask AI ] [ 💬 Chat ] [ — ]\`.
   - **Zero Checkout Obstruction**: When viewing the POS Cashier screen (\`page === 'pos'\`), the dock automatically relocates to \`right-[24.5rem]\` (left of the Cart). The entire Cart column, totals, Hold, Clear, and the big \`CHECKOUT\` button remain 100% unobstructed.
   - **Distraction-Free Collapse**: 1-click collapse to a miniature 36px floating badge (\`[ ✦ ]\`) for rush-hour cashier operations.
3. **🤝 Side-by-Side Coexistence:**
   - When opening both TindaBot and Community Chat, they tile side-by-side cleanly without overlapping.
   - Header drag handles (\`⠿\`) allow repositioning anywhere on screen, with positions saved to local storage.
4. **🔒 Zero-Key-Leak Desktop Vault & Multi-Model Free Pool:**
   - Keys and network requests are strictly confined within the Electron Main backend process.
   - Automatic failover across OpenCode Free models (\`nemotron-3.5-lightning-free\`, \`mimo-v2.6-flash-free\`, \`exo-free\`, \`space-bunny-free\`, \`step-5-preview-free\`), cloud Gemini Flash Lite, and offline store handbook.

### 📦 Checksums & Verification:
\`\`\`
${fs.readFileSync(path.join(BUILDS_DIR, 'SHA256SUMS-v1.0.84.txt'), 'utf8').trim()}
\`\`\`
`

  // 2. Check if release exists or create it
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
      prerelease: false
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
      prerelease: false
    }))
  }

  console.log(`✅ Release ready! Uploading ${assetsToUpload.length} release assets...`)

  // 3. Upload assets
  for (const item of assetsToUpload) {
    const fullPath = path.join(BUILDS_DIR, item.file)
    const existing = (release.assets || []).find((a) => a.name === item.file)
    if (existing) {
      console.log(`🗑️ Deleting existing asset: ${item.file} (ID: ${existing.id})...`)
      try {
        await ghRequest('DELETE', `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/releases/assets/${existing.id}`)
      } catch (e) {
        console.warn(`Could not delete asset ${item.file}:`, e.message)
      }
    }

    console.log(`⬆️ Uploading ${item.file} (${(fs.statSync(fullPath).size / 1024 / 1024).toFixed(2)} MB)...`)
    await uploadAsset(release.upload_url, fullPath, item.file, item.type)
    console.log(`   ✓ ${item.file} uploaded successfully!`)
  }

  console.log(`\n🎉 ALL ASSETS FOR ${TAG} PUBLISHED TO GITHUB RELEASES!`)
  console.log(`🔗 https://github.com/${REPO_OWNER}/${REPO_NAME}/releases/tag/${TAG}`)
}

main().catch((err) => {
  console.error('Fatal error during publish:', err)
  process.exit(1)
})
