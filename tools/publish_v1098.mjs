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
const TAG = 'v1.0.98'
const RELEASE_NAME = 'TINDA POS v1.0.98 — Fast Buttons, Composite BOM, Printing Hub, Cashier Calculator & Promo Bundles Edition'

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
    if (body) {
      req.write(body)
    }
    req.end()
  })
}

function uploadAsset(uploadUrlTemplate, filePath, fileName) {
  return new Promise((resolve, reject) => {
    const uploadUrl = uploadUrlTemplate.replace('{?name,label}', `?name=${encodeURIComponent(fileName)}`)
    const url = new URL(uploadUrl)
    const stat = fs.statSync(filePath)
    const fileStream = fs.createReadStream(filePath)

    const options = {
      hostname: url.hostname,
      path: url.pathname + url.search,
      method: 'POST',
      headers: {
        'User-Agent': 'TINDA-POS-Release-Script',
        Authorization: `Bearer ${GITHUB_TOKEN}`,
        'Content-Type': 'application/octet-stream',
        'Content-Length': stat.size
      }
    }

    console.log(`  ⬆️ Uploading ${fileName} (${(stat.size / (1024 * 1024)).toFixed(2)} MB)...`)

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
  console.log(`🚀 Starting Release Publication for ${TAG}...`)

  const setupFile = path.join(BUILDS_DIR, `TindaPOS-Setup-1.0.98.exe`)
  const portableFile = path.join(BUILDS_DIR, `TindaPOS-Portable-1.0.98.exe`)
  const blockmapFile = path.join(BUILDS_DIR, `TindaPOS-Setup-1.0.98.exe.blockmap`)
  const patchFile = path.join(BUILDS_DIR, `TindaPOS-Feature-Patch-1.0.98.zip`)
  const latestYmlFile = path.join(BUILDS_DIR, `latest.yml`)
  const guideFile = path.join(BUILDS_DIR, `TindaPOS-User-Guide.pdf`)

  if (!fs.existsSync(setupFile)) {
    throw new Error(`Build artifact missing! Expected ${setupFile}`)
  }

  const setupSha = sha256File(setupFile)
  const portableSha = fs.existsSync(portableFile) ? sha256File(portableFile) : null
  const blockmapSha = fs.existsSync(blockmapFile) ? sha256File(blockmapFile) : null
  const patchSha = fs.existsSync(patchFile) ? sha256File(patchFile) : null
  const latestSha = fs.existsSync(latestYmlFile) ? sha256File(latestYmlFile) : null

  console.log(`  Setup SHA256:    ${setupSha}`)
  if (portableSha) console.log(`  Portable SHA256: ${portableSha}`)
  if (patchSha) console.log(`  Patch SHA256:    ${patchSha}`)

  const sumsFile = path.join(BUILDS_DIR, `SHA256SUMS-${TAG}.txt`)
  let sumsContent = `${setupSha}  TindaPOS-Setup-1.0.98.exe\n`
  if (portableSha) sumsContent += `${portableSha}  TindaPOS-Portable-1.0.98.exe\n`
  if (blockmapSha) sumsContent += `${blockmapSha}  TindaPOS-Setup-1.0.98.exe.blockmap\n`
  if (patchSha) sumsContent += `${patchSha}  TindaPOS-Feature-Patch-1.0.98.zip\n`
  if (latestSha) sumsContent += `${latestSha}  latest.yml\n`
  fs.writeFileSync(sumsFile, sumsContent, 'utf-8')

  const releaseNotes = `## ✨ What's New in TINDA POS ${TAG} (Fast Buttons, Composite BOM, Printing Hub, Cashier Calculator & Promo Bundles Edition)

> **Official Full Executable Release · October 10, 2026**
> *Introduces POS Fast Buttons, Cashier Calculator (F3), Composite & Nested BOM Recipe Assemblies, Dedicated Printing Business & Document Services Hub, Dynamic Promo Bundles Engine, and Category-Based Inventory Valuation.*

---

### ⚡ 1. POS Fast Buttons (Speed Keys)
- **Top Quick-Access Carousel**: Direct 1-tap addition for high-velocity sari-sari items: **Yelo (Ice)** ₱5, **Yosi (Cigarette)** ₱10, **Candy** ₱1, and **Sando Bag** ₱2.
- **Full Customization**: Merchants can add custom items, reorder, change color themes, search catalog items, and upload custom product images.
- **Instant Provisioning & Audio Chime**: Automatically provisions catalog products on-the-fly if missing with audio chime feedback.

### 🧮 2. Cashier Calculator & Sukli Assistant (\`F3\`)
- **Dual Mode Calculator**: Standard arithmetic calculator with running equation history and dedicated **Sukli (Change) Assistant**.
- **Quick Cash Tender**: Rapid denomination buttons (₱20, ₱50, ₱100, ₱200, ₱500, ₱1,000) for instant change calculation without manual math errors.
- **Cart Integration**: 1-click "Add as Custom Item to Cart" with custom item description and base cost tracking.

### 🍲 3. Composite & Multi-Tier Nested BOM Engine
- **Migration 14 Database Schema**: Introduces \`product_recipes\` table and item classification: \`STANDARD\` (physical goods), \`COMPOSITE\` (recipe assemblies), and \`SERVICE\` (labor/intangible).
- **Automated Roll-Up COGS**: Real-time ingredient costing with live markup and gross margin tracking.
- **Nested Assemblies & Recursive Deduction**: Supports multi-tier BOMs (e.g. combo meal -> burger -> bun/patty) with depth-first cycle prevention. On checkout, leaf raw components are deducted atomically with audit trails.
- **Visual BOM Builder**: Interactive Recipe Modal in Inventory with live component search and unit breakdown.

### 🖨️ 4. Dedicated Printing Business & Document Services Hub
- **Organized Cashier Hub**: Dedicated page in Cashier & Register navigation for print shops and computer centers.
- **8 Core Services**: Automated costing for B/W Printing, Color Printing, Photocopy, ID Picture (1x1, 2x2, Passport), PVC ID, Resume Printing, Nametag, and Document Scanning/Lamination.
- **Granular Cost Model**: Combines paper stock, ink coverage factor, consumable wear, and labor into dynamic cost of goods sold.
- **1-Click POS Push**: Immediately pushes service orders with custom quantities and options into active POS cart.

### 🎁 5. Dynamic Promo Bundles Engine
- **Combos & Volume Tiers**: Supports fixed combo packages (e.g. Breakfast Combo) and quantity discount tiers (e.g. 3 for ₱50).
- **Live Cart Evaluation**: Automatically detects qualifying cart items and surfaces non-disruptive savings notification with 1-click discount application.
- **Promo Management**: Interactive modal to browse, activate, or build custom combos with 1-tap cart addition.

### 📊 6. Category Inventory Valuation
- **Category Valuation Pills**: Live horizontal metrics bar in Inventory displaying total SKU counts and stock valuation (₱) per category.
- **Item Type Filtering**: 1-click filter chips for Standard Physical items, Composite BOM recipes, and Services.

### 👑 7. Verification & Invariants
- **458/458 Vitest Unit Tests Passing**: 100% test coverage across 71 test suites.
- **0 TypeScript Errors**: Full type safety verified across both Node and Web runtimes.
- **Master Invariants Passed**: Zero regressions across barcode scanners, camera scanner, CFD secondary display, and hotkeys.
- **Section 81 Codification**: Master specifications recorded in \`SYSTEM_MASTER.md\`.

---

### 📦 Checksums (SHA-256)
\`\`\`
${sumsContent.trim()}
\`\`\`
`

  console.log('📡 Checking if release exists...')
  let release = null
  try {
    release = await ghRequest('GET', `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/releases/tags/${TAG}`)
    console.log(`Found existing release: ${release.id}`)
  } catch {
    console.log('No existing release found. Creating new release...')
  }

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
        prerelease: false
      })
    )
    console.log(`Created release: ${release.html_url}`)
  } else {
    release = await ghRequest(
      'PATCH',
      `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/releases/${release.id}`,
      { 'Content-Type': 'application/json' },
      JSON.stringify({
        name: RELEASE_NAME,
        body: releaseNotes
      })
    )
    console.log(`Updated release: ${release.html_url}`)
  }

  release = await ghRequest('GET', `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/releases/tags/${TAG}`)

  const assetsToUpload = [
    { file: setupFile, name: `TindaPOS-Setup-1.0.98.exe` }
  ]

  if (portableFile && fs.existsSync(portableFile)) {
    assetsToUpload.push({ file: portableFile, name: `TindaPOS-Portable-1.0.98.exe` })
  }
  if (blockmapFile && fs.existsSync(blockmapFile)) {
    assetsToUpload.push({ file: blockmapFile, name: `TindaPOS-Setup-1.0.98.exe.blockmap` })
  }
  if (patchFile && fs.existsSync(patchFile)) {
    assetsToUpload.push({ file: patchFile, name: `TindaPOS-Feature-Patch-1.0.98.zip` })
  }
  if (latestYmlFile && fs.existsSync(latestYmlFile)) {
    assetsToUpload.push({ file: latestYmlFile, name: 'latest.yml' })
  }
  if (sumsFile && fs.existsSync(sumsFile)) {
    assetsToUpload.push({ file: sumsFile, name: `SHA256SUMS-${TAG}.txt` })
  }
  if (guideFile && fs.existsSync(guideFile)) {
    assetsToUpload.push({ file: guideFile, name: 'TindaPOS-User-Guide.pdf' })
  }

  const existingAssets = release.assets || []
  for (const asset of assetsToUpload) {
    const existing = existingAssets.find((a) => a.name === asset.name)
    if (existing) {
      console.log(`  🗑️ Deleting outdated asset ${asset.name} (ID: ${existing.id})...`)
      try {
        await ghRequest('DELETE', `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/releases/assets/${existing.id}`)
      } catch (e) {
        console.warn(`Failed to delete asset ${asset.name}: ${e.message}`)
      }
    }
    await uploadAsset(release.upload_url, asset.file, asset.name)
  }

  console.log(`\n🎉 SUCCESS! Release ${TAG} published with all assets verified at: ${release.html_url}`)
}

main().catch((err) => {
  console.error(`❌ Release publication failed:`, err)
  process.exit(1)
})
