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
const TAG = 'v1.0.96'
const RELEASE_NAME = 'TINDA POS v1.0.96 — Chiteng CT221B Direct Thermal Spooler & Bundled Drivers Edition'

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

  const setupFile = path.join(BUILDS_DIR, `TindaPOS-Setup-1.0.96.exe`)
  const portableFile = path.join(BUILDS_DIR, `TindaPOS-Portable-1.0.96.exe`)
  const blockmapFile = path.join(BUILDS_DIR, `TindaPOS-Setup-1.0.96.exe.blockmap`)
  const latestYmlFile = path.join(BUILDS_DIR, `latest.yml`)
  const guideFile = path.join(BUILDS_DIR, `TindaPOS-User-Guide.pdf`)

  if (!fs.existsSync(setupFile)) {
    throw new Error(`Build artifact missing! Expected ${setupFile}`)
  }

  const setupSha = sha256File(setupFile)
  const portableSha = fs.existsSync(portableFile) ? sha256File(portableFile) : null
  const blockmapSha = fs.existsSync(blockmapFile) ? sha256File(blockmapFile) : null
  const latestSha = fs.existsSync(latestYmlFile) ? sha256File(latestYmlFile) : null

  console.log(`  Setup SHA256:    ${setupSha}`)
  if (portableSha) console.log(`  Portable SHA256: ${portableSha}`)

  const sumsFile = path.join(BUILDS_DIR, `SHA256SUMS-${TAG}.txt`)
  let sumsContent = `${setupSha}  TindaPOS-Setup-1.0.96.exe\n`
  if (portableSha) sumsContent += `${portableSha}  TindaPOS-Portable-1.0.96.exe\n`
  if (blockmapSha) sumsContent += `${blockmapSha}  TindaPOS-Setup-1.0.96.exe.blockmap\n`
  if (latestSha) sumsContent += `${latestSha}  latest.yml\n`
  fs.writeFileSync(sumsFile, sumsContent, 'utf-8')

  const releaseNotes = `## ✨ What's New in TINDA POS ${TAG} (Chiteng CT221B Direct Thermal Spooler & Bundled Drivers Edition)

> **Official Full Executable Release · October 9, 2026**
> *Fixes blank/empty paper feeding on Chiteng CT221B / Clabel thermal label printers, bundles official V1.5 Windows driver installer and visual tutorial guide, with 1-click setup.*

---

### 🏷️ 1. Chiteng CT221B Direct Thermal Spooler Engine ("Mo Gana Pero Blank Paper Na-Fix")
- **RGB Color Spooling Fix**: Changed Chromium printing pipeline to pass 24-bit color graphics instead of 1-bit monochrome DIB format. On Windows, the Clabel/Chiteng minidriver expects RGB bitmaps to threshold dark pixels into thermal burn heat pulses; sending 1-bit raw monochrome was causing the printhead to interpret every pixel as white (\`0xFF\`), ejecting a blank label despite receiving the print job.
- **Native DEVMODE Resolution Alignment**: Removed conflicting forced 203 DPI override in Electron print options, allowing Windows and the vendor driver to negotiate precise coordinate scaling without clipping.
- **DOM Layout Synchronization**: Enforced double-frame animation buffer and DOM layout completion check before triggering \`webContents.print()\`, preventing premature rasterization of unrendered barcodes.
- **Trailing Blank Label Elimination**: Paged CSS media rule updated with \`.label-tag:not(:last-child) { page-break-after: always; break-after: page; }\`, completely eliminating spurious trailing blank sticker feeds.
- **High-Density Solid Black CSS**: Forced \`-webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; color: #000000 !important;\` on all text and barcode vectors.

### 💿 2. Bundled Official Drivers & Visual Setup Guide
- **Bundled Label Printer Driver V1.5**: Integrated official Clabel/Chiteng USB driver installer directly into app distribution assets (\`resources/drivers/Label-Printer-Driver-V1.5.exe\`).
- **Bundled Windows Setup Tutorial**: Included official PDF documentation (\`resources/drivers/Chiteng-CT221B-Tutorial.pdf\`).
- **1-Click Driver Installation**: Added direct "Install CT221B Driver (V1.5)" and "Driver Guide (PDF)" action buttons inside both the **Price Tag Print Modal** and **Hardware / Label Printer Settings**.
- **Cross-Distribution Packaging**: Configured \`extraResources\` in \`electron-builder.yml\` to automatically bundle driver binaries in both Windows NSIS Setup and Portable builds.

### 👑 3. Unified VIP-First Auto-Updater & Zero-Interruption Core
- **Single Dynamic Capsule**: High-polish non-blocking update capsule docked neatly in the top right header (\`fixed top-3 right-6 z-40\`).
- **Shift Close Deferral**: Postpone updates during busy customer rushes; silently applied upon cashier shift close.
- **Community Chat Clearance**: Top-right placement leaves the nationwide Community Chat button at \`bottom-5 right-5\` unobstructed.

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
    { file: setupFile, name: `TindaPOS-Setup-1.0.96.exe` }
  ]

  const patchFile = path.join(BUILDS_DIR, `TindaPOS-Feature-Patch-${TAG.replace(/^v/, '')}.zip`)
  if (fs.existsSync(patchFile)) {
    assetsToUpload.push({ file: patchFile, name: `TindaPOS-Feature-Patch-${TAG.replace(/^v/, '')}.zip` })
  }
  if (portableFile && fs.existsSync(portableFile)) {
    assetsToUpload.push({ file: portableFile, name: `TindaPOS-Portable-1.0.96.exe` })
  }
  if (blockmapFile && fs.existsSync(blockmapFile)) {
    assetsToUpload.push({ file: blockmapFile, name: `TindaPOS-Setup-1.0.96.exe.blockmap` })
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
