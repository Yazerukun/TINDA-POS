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
const TAG = 'v1.0.59'
const RELEASE_NAME = 'TINDA POS v1.0.59 — High-Density Enterprise POS Cashier Listing Engine'

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

function ghUploadAsset(uploadUrlTemplate, filePath, fileName, contentType = 'application/octet-stream') {
  return new Promise((resolve, reject) => {
    const fileStats = fs.statSync(filePath)
    const fileSize = fileStats.size

    const uploadBase = uploadUrlTemplate.split('{')[0]
    const fullUploadUrl = `${uploadBase}?name=${encodeURIComponent(fileName)}`
    const url = new URL(fullUploadUrl)

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
          reject(new Error(`Asset upload error HTTP ${res.statusCode}: ${resBody}`))
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
  
  const setupExe = path.join(BUILDS_DIR, 'TindaPOS-Setup-1.0.59.exe')
  const setupBlockmap = path.join(BUILDS_DIR, 'TindaPOS-Setup-1.0.59.exe.blockmap')
  const portableExe = path.join(BUILDS_DIR, 'TindaPOS-Portable-1.0.59.exe')
  const linuxTar = path.join(BUILDS_DIR, 'TindaPOS-1.0.59-linux-x64.tar.gz')
  const latestYml = path.join(BUILDS_DIR, 'latest.yml')
  const userGuide = path.join(BUILDS_DIR, 'TindaPOS-User-Guide.pdf')

  if (!fs.existsSync(userGuide)) {
    const guideSrc = path.resolve('source', 'builds', 'TindaPOS-User-Guide.pdf')
    if (fs.existsSync(guideSrc)) {
      fs.copyFileSync(guideSrc, userGuide)
    }
  }

  const artifacts = [
    { file: setupExe, name: 'TindaPOS-Setup-1.0.59.exe', type: 'application/vnd.microsoft.portable-executable' },
    { file: setupBlockmap, name: 'TindaPOS-Setup-1.0.59.exe.blockmap', type: 'application/octet-stream' },
    { file: portableExe, name: 'TindaPOS-Portable-1.0.59.exe', type: 'application/vnd.microsoft.portable-executable' },
    { file: latestYml, name: 'latest.yml', type: 'text/yaml' },
    { file: userGuide, name: 'TindaPOS-User-Guide.pdf', type: 'application/pdf' }
  ]

  if (fs.existsSync(linuxTar)) {
    artifacts.splice(3, 0, { file: linuxTar, name: 'TindaPOS-1.0.59-linux-x64.tar.gz', type: 'application/gzip' })
  }

  for (const a of artifacts) {
    if (!fs.existsSync(a.file)) {
      console.error(`[ERROR] Missing required artifact: ${a.file}`)
      process.exit(1)
    }
    const sz = (fs.statSync(a.file).size / (1024 * 1024)).toFixed(2)
    console.log(`[PASS] ${a.name} exists (${sz} MB)`)
  }

  console.log(`\n=== Step 2: Generating SHA256SUMS-v1.0.59.txt ===`)
  const checksumLines = []
  for (const a of artifacts) {
    const hash = sha256File(a.file)
    checksumLines.push(`${hash}  ${a.name}`)
  }
  const checksumsFile = path.join(BUILDS_DIR, 'SHA256SUMS-v1.0.59.txt')
  fs.writeFileSync(checksumsFile, checksumLines.join('\n') + '\n', 'utf8')
  console.log(`Generated SHA256 checksums:\n${checksumLines.join('\n')}\n`)

  artifacts.push({ file: checksumsFile, name: 'SHA256SUMS-v1.0.59.txt', type: 'text/plain' })

  console.log(`\n=== Step 3: Checking / Creating GitHub Release ===`)
  let release = null
  try {
    release = await ghRequest('GET', `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/releases/tags/${TAG}`)
    console.log(`Release ${TAG} found (id: ${release.id}).`)
  } catch (err) {
    console.log(`Release ${TAG} not found, creating new release...`)
    const releaseBody = `## TINDA POS v1.0.59 — High-Density Enterprise POS Cashier Listing Engine

### 📋 1. High-Density Enterprise POS Cashier Listing Table
- **Supermarket-Grade Listing View**: Replaced bulky catalog tiles with an ultra-clean, high-density listing table, displaying 15–25 products simultaneously without vertical layout waste.
- **Dedicated Column Layout**:
  - **Product / Barcode**: 36x36 thumbnail image avatar, high-visibility product name, cyan mono SKU badge, barcode, and optional specs.
  - **Category**: Clean rounded tag pill.
  - **Stock & Safety Status**: Exact available quantity with unit (pcs, kg), live pulse indicator (🟢 In Stock, 🟡 Low Stock Alert, 🔴 Out of Stock), and near-expiry warning dots.
  - **Pricing & Tier**: Bold retail price, wholesale volume pricing badge (\`WS: ₱XX.XX (≥10)\`), and Suggested Retail Price (\`SRP\`).
  - **Cart Status & Quick Stepper**: Active \`In Cart: X\` indicator with in-row \`[ - ] [ count ] [ + ]\` quantity stepper and 1-tap add.

### 🔄 2. Dual-Mode Switcher with Persistent Memory
- **Instant List / Grid Toggle**: Seamless toggle buttons in the top search bar allowing cashiers to switch between the dense **Listing Table** (default) and the visual **Card Grid**.
- **Local Persistence**: User preference is automatically saved in \`localStorage\` (\`tinda_pos_view_mode\`) and restored across sessions.

### ⌨️ 3. High-Speed Keyboard Navigation Ergonomics
- **Arrow Key Row Selection**: \`ArrowDown\` and \`ArrowUp\` navigate through products seamlessly with automatic smooth scroll follow.
- **Instant Enter Checkout**: Pressing \`Enter\` adds the selected product to the cart immediately with audible feedback.
- **Retained Fast Hotkeys**: \`F1\` (Search), \`F2\` (Cart Qty), \`F4\` (Discount), \`F7\` (Petty Cash), \`F8\` (Hold / E-Wallet), \`F9\` (Cash), \`F10\` (GCash).

### 🛡️ 4. 100% Retained System Invariants
- Zero regression on hardware scanners, counter cameras, wireless phone scanners, CFD customer screens, or quad-vault VIP licensing.
`

    release = await ghRequest('POST', `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/releases`, {}, {
      tag_name: TAG,
      target_commitish: 'master',
      name: RELEASE_NAME,
      body: releaseBody,
      draft: false,
      prerelease: false
    })
    console.log(`Successfully created release id: ${release.id}`)
  }

  console.log(`\n=== Step 4: Uploading Artifacts to GitHub Release ===`)
  const existingAssets = release.assets || []

  for (const a of artifacts) {
    const existing = existingAssets.find(ea => ea.name === a.name)
    if (existing) {
      console.log(`Deleting existing asset ${a.name} (id: ${existing.id})...`)
      try {
        await ghRequest('DELETE', `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/releases/assets/${existing.id}`)
      } catch (err) {
        console.warn(`Could not delete asset ${a.name}:`, err.message)
      }
    }

    const szMB = (fs.statSync(a.file).size / (1024 * 1024)).toFixed(2)
    console.log(`Uploading ${a.name} (${szMB} MB)...`)
    try {
      await ghUploadAsset(release.upload_url, a.file, a.name, a.type)
      console.log(`[PASS] Uploaded ${a.name}`)
    } catch (err) {
      console.error(`[FAIL] Failed to upload ${a.name}:`, err.message)
      throw err
    }
  }

  console.log(`\n🎉 ALL RELEASE ASSETS SUCCESSFULLY PUBLISHED TO GITHUB!`)
  console.log(`URL: https://github.com/${REPO_OWNER}/${REPO_NAME}/releases/tag/${TAG}\n`)
}

main().catch(err => {
  console.error('Publish script error:', err)
  process.exit(1)
})
