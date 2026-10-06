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
const TAG = 'v1.0.61'
const RELEASE_NAME = 'TINDA POS v1.0.61 — Mathematical Mass Edition & GOOJPRT Desktop Thermal'

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
  
  const setupExe = path.join(BUILDS_DIR, 'TindaPOS-Setup-1.0.61.exe')
  const setupBlockmap = path.join(BUILDS_DIR, 'TindaPOS-Setup-1.0.61.exe.blockmap')
  const portableExe = path.join(BUILDS_DIR, 'TindaPOS-Portable-1.0.61.exe')
  const latestYml = path.join(BUILDS_DIR, 'latest.yml')
  const userGuide = path.join(BUILDS_DIR, 'TindaPOS-User-Guide.pdf')

  if (!fs.existsSync(userGuide)) {
    const guideSrc = path.resolve('source', 'builds', 'TindaPOS-User-Guide.pdf')
    if (fs.existsSync(guideSrc)) {
      fs.copyFileSync(guideSrc, userGuide)
    }
  }

  const artifacts = [
    { file: setupExe, name: 'TindaPOS-Setup-1.0.61.exe', type: 'application/vnd.microsoft.portable-executable' },
    { file: setupBlockmap, name: 'TindaPOS-Setup-1.0.61.exe.blockmap', type: 'application/octet-stream' },
    { file: portableExe, name: 'TindaPOS-Portable-1.0.61.exe', type: 'application/vnd.microsoft.portable-executable' },
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

  console.log(`\n=== Step 2: Generating SHA256SUMS-v1.0.61.txt ===`)
  const checksumLines = []
  for (const a of artifacts) {
    const hash = sha256File(a.file)
    checksumLines.push(`${hash}  ${a.name}`)
  }
  const checksumsFile = path.join(BUILDS_DIR, 'SHA256SUMS-v1.0.61.txt')
  fs.writeFileSync(checksumsFile, checksumLines.join('\n') + '\n', 'utf8')
  console.log(`Generated SHA256 checksums:\n${checksumLines.join('\n')}\n`)

  artifacts.push({ file: checksumsFile, name: 'SHA256SUMS-v1.0.61.txt', type: 'text/plain' })

  console.log(`\n=== Step 3: Checking / Creating GitHub Release ===`)
  let release = null
  try {
    release = await ghRequest('GET', `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/releases/tags/${TAG}`)
    console.log(`Release ${TAG} found (id: ${release.id}).`)
  } catch {
    console.log(`Release ${TAG} not found, creating new release...`)
    const releaseBody = `## TINDA POS v1.0.61 — Mathematical Mass Edition & GOOJPRT Desktop Thermal

### 📐 1. Mathematical Mass Brand Mark (The Quantum Summation T)
- **Sacred Geometry & Quantum Vector**: Engineered an isometric hexagonal mass bounding volume, Golden Ratio (Φ = 1.618) optical grid alignment, and a mathematical summation (Σ) apex seamlessly fused with the letter "T".
- **Dynamic Visual Feedback**: Integrated into the Sidebar brand header, Hardware Hub, and Terminal Tools modal with active hardware pulse indicators and VIP Pro gold gradients.

### 🖨️ 2. GOOJPRT PB-58H (USB + Bluetooth) Desktop Thermal Printer Support
- **Hardware Agnostic 58mm Optimization**: Integrated full hardware documentation and optimization for 58mm retail thermal printers (GOOJPRT PB-58H / JK-5802H / POS-58 / Xprinter).
- **In-App Guide & Official Handbook Chapter 10**: Added in-app setup tips in **Settings ⚙️ → Receipt** and published official **Chapter 10: Thermal Printers** in the offline **Store Handbook**.

### 🧰 3. Terminal Tools [F3] Consolidated Hardware Workspace
- **Workspace Clutter Elimination**: Consolidated 10 crowded top-bar buttons into a single sleek Cupertino pill **Terminal Tools [F3]** in the POS header and a permanent **Tools** button in the sidebar footer.
- **Centralized Control**: 1-Tap toggles for barcode scanner, webcam, companion phone pairing, secondary customer display (CFD), sales monitor, shift cash operations (F7/F8), thermal Z-Reading, sound toggle, and cashier shortcut guide.

### 🏷️ 4. Line Item Custom Unit Price Editing
- **Direct In-Cart Price Override**: Cashiers and managers can directly edit the unit selling price of any item currently in the cart with 1-click on the unit price tag or pencil icon.
- **Professional Terminology**: Replaced informal "Tawad / Custom price" labeling with clean **"Edit Unit Price"** modal and live subtotal calculation.

### 📱 5. Intelligent Wireless Phone Scanner Engine & Multi-Adapter Discovery
- **Auto-Discovery & APIPA Filtering**: Traced and fixed pairing failures caused by arbitrary \`os.networkInterfaces()\` order picking inactive virtual adapters (Bluetooth PAN, WSL, Docker, VMware) or link-local APIPA addresses (\`169.254.x.x\`).
- **Multi-Adapter Network Dropdown**: When a PC has multiple active networks (e.g., wired Ethernet + store Wi-Fi), the companion QR screen provides an instant dropdown selector to switch the generated pairing link to the Wi-Fi subnet reachable by phones.
- **1-Tap Direct Snap (HTTP) Fallback**: Instant fallback that opens immediately in all mobile browsers (iOS Safari & Android Chrome) with 100% zero SSL certificate warnings.

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
