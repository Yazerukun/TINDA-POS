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

const pkgPath = fs.existsSync(path.resolve('package.json')) && !fs.existsSync(path.resolve('source'))
  ? path.resolve('package.json')
  : path.resolve('source', 'package.json')
const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'))
const version = process.argv[2] || pkg.version || '1.0.86'
const TAG = `v${version}`

const BUILDS_DIR = fs.existsSync(path.resolve('builds')) && !fs.existsSync(path.resolve('source'))
  ? path.resolve('builds')
  : path.resolve('source', 'builds')

const setupFile = `TindaPOS-Setup-${version}.exe`
const setupPath = path.join(BUILDS_DIR, setupFile)
const hasFullBuild = fs.existsSync(setupPath)
const RELEASE_NAME = hasFullBuild
  ? `TINDA POS ${TAG} — Universal Custom Thermal Spacing Studio & Receipt Persistence Edition`
  : `TINDA POS ${TAG} — Live Feature Patch`

const patchFile = `TindaPOS-Feature-Patch-${version}.zip`
const patchPath = path.join(BUILDS_DIR, patchFile)
const shaFile = `${patchFile}.sha256`
const shaPath = path.join(BUILDS_DIR, shaFile)

function ghRequest(method, urlStr, headers = {}, body = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(urlStr)
    const options = {
      hostname: url.hostname,
      path: url.pathname + url.search,
      method,
      headers: {
        'User-Agent': 'TINDA-POS-Patch-Publisher',
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
        'User-Agent': 'TINDA-POS-Patch-Publisher',
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
    console.error('❌ GITHUB_TOKEN not found! Please check git credentials or environment.')
    process.exit(1)
  }

  if (!fs.existsSync(patchPath)) {
    console.error(`❌ Patch file not found at: ${patchPath}`)
    console.log('Run `npm run build:patch` in source/ first.')
    process.exit(1)
  }

  const patchStat = fs.statSync(patchPath)
  const patchSizeMb = (patchStat.size / (1024 * 1024)).toFixed(2)

  // Ensure sha256 file exists
  if (!fs.existsSync(shaPath)) {
    const fileBuffer = fs.readFileSync(patchPath)
    const hash = crypto.createHash('sha256').update(fileBuffer).digest('hex')
    fs.writeFileSync(shaPath, `${hash} *${patchFile}\n`, 'utf8')
  }

  const shaContent = fs.readFileSync(shaPath, 'utf8').trim()

  console.log(`\n======================================================`)
  console.log(`🚀 Publishing Patch-Only Release: ${TAG}`)
  console.log(`📦 Target:       https://github.com/${REPO_OWNER}/${REPO_NAME}/releases/tag/${TAG}`)
  console.log(`⚡ Asset:        ${patchFile} (${patchSizeMb} MB)`)
  console.log(`======================================================\n`)

  // Dynamically extract release notes from README.md or GEMINI.md
  let releaseNotes = ''
  try {
    const readmePaths = [
      path.resolve('..', 'README.md'),
      path.resolve('.', 'README.md'),
      path.resolve('..', 'GEMINI.md')
    ]
    for (const rPath of readmePaths) {
      if (fs.existsSync(rPath)) {
        const text = fs.readFileSync(rPath, 'utf8')
        const regex = new RegExp(`(?:## (?:✨ What's New in|Key Features in)|### [^\\n]*?) ${TAG}[^\\n]*\\n([\\s\\S]*?)(?=\\n## |\\n### |\\n<details|$)`, 'i')
        const match = text.match(regex)
        if (match && match[1].trim()) {
          releaseNotes = match[1].trim()
          break
        }
      }
    }
  } catch {}

  if (!releaseNotes) {
    releaseNotes = `> **Live In-App Hot Patch for TINDA POS ${TAG}**\n\n- Applied in **0.3s** live without restarting the application or downloading 100MB+ full installers.\n- Seamless backward compatibility with all local SQLite store data and hardware peripherals.`
  }

  const todayStr = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
  const portableFile = `TindaPOS-Portable-${version}.exe`
  const portablePath = path.join(BUILDS_DIR, portableFile)
  const blockmapFile = `TindaPOS-Setup-${version}.exe.blockmap`
  const blockmapPath = path.join(BUILDS_DIR, blockmapFile)
  const latestYmlFile = `latest.yml`
  const latestYmlPath = path.join(BUILDS_DIR, latestYmlFile)
  const sumsFile = `SHA256SUMS-${TAG}.txt`
  const sumsPath = path.join(BUILDS_DIR, sumsFile)

  if (hasFullBuild) {
    const filesToHash = [setupPath, portablePath, blockmapPath, patchPath, latestYmlPath].filter(fs.existsSync)
    const checksumLines = filesToHash.map((f) => {
      const h = crypto.createHash('sha256').update(fs.readFileSync(f)).digest('hex')
      return `${h}  ${path.basename(f)}`
    }).join('\n') + '\n'
    fs.writeFileSync(sumsPath, checksumLines, 'utf8')
  }

  const setupSizeMb = hasFullBuild ? (fs.statSync(setupPath).size / 1024 / 1024).toFixed(1) : ''
  const portableSizeMb = fs.existsSync(portablePath) ? (fs.statSync(portablePath).size / 1024 / 1024).toFixed(1) : ''

  const body = `## 🚀 TINDA POS ${TAG} — ${hasFullBuild ? 'Full Windows Standalone & Live Feature Patch Edition' : 'Live Feature Hot Patch'}

> **Official Stable Release · ${todayStr}**  
> *Full Windows Installer (NSIS), Standalone Portable executable, and fast 0.3-second in-app live hot patch for TINDA POS ${TAG}.*

---

### 📦 Quick Download Assets
| Asset | Size | Type | Download Link |
|---|---|---|---|
${hasFullBuild ? `| 💿 **${setupFile}** | ${setupSizeMb} MB | Official Windows Setup (NSIS) | [Download Setup](https://github.com/${REPO_OWNER}/${REPO_NAME}/releases/download/${TAG}/${setupFile}) |\n| 🚀 **${portableFile}** | ${portableSizeMb} MB | Standalone Zero-Install Executable | [Download Portable](https://github.com/${REPO_OWNER}/${REPO_NAME}/releases/download/${TAG}/${portableFile}) |\n` : ''}| ⚡ **${patchFile}** | ${patchSizeMb} MB | In-App Live Hot Patch | [Download Patch](https://github.com/${REPO_OWNER}/${REPO_NAME}/releases/download/${TAG}/${patchFile}) |
${hasFullBuild ? `| 📄 **latest.yml** | ~360 B | Auto-Updater Manifest | [Download latest.yml](https://github.com/${REPO_OWNER}/${REPO_NAME}/releases/download/${TAG}/latest.yml) |\n| 🛡️ **${sumsFile}** | ~320 B | Cryptographic SHA-256 Hashes | [Download Hashes](https://github.com/${REPO_OWNER}/${REPO_NAME}/releases/download/${TAG}/${sumsFile}) |\n` : `| 🛡️ **SHA-256 Checksum** | 64 B | Verification Hash | \`${shaContent.split(' ')[0]}\` |\n`}
---

### 🌟 What's New in ${TAG}:
${releaseNotes}

---

### 🔒 Cryptographic Verification
\`\`\`text
${hasFullBuild && fs.existsSync(sumsPath) ? fs.readFileSync(sumsPath, 'utf8').trim() : shaContent}
\`\`\`

🌐 **Cloud Owner Dashboard**: [https://tinda-owner-dashboard.pages.dev/](https://tinda-owner-dashboard.pages.dev/)  
📖 **Cashier Quick Guide**: [https://github.com/Yazerukun/TINDA-POS-Source/blob/master/docs/CASHIER-QUICK-GUIDE.md](https://github.com/Yazerukun/TINDA-POS-Source/blob/master/docs/CASHIER-QUICK-GUIDE.md)
`

  // 1. Check if release exists or create it
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
      prerelease: false,
      make_latest: 'true'
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
      prerelease: false,
      make_latest: 'true'
    }))
  }

  console.log(`✅ Release ready! Uploading release assets...`)

  const assetsToUpload = [
    { file: patchFile, path: patchPath, type: 'application/zip' },
    { file: shaFile, path: shaPath, type: 'text/plain' }
  ]

  if (hasFullBuild) {
    assetsToUpload.push({ file: setupFile, path: setupPath, type: 'application/vnd.microsoft.portable-executable' })
    if (fs.existsSync(portablePath)) {
      assetsToUpload.push({ file: portableFile, path: portablePath, type: 'application/vnd.microsoft.portable-executable' })
    }
    if (fs.existsSync(blockmapPath)) {
      assetsToUpload.push({ file: blockmapFile, path: blockmapPath, type: 'application/octet-stream' })
    }
    if (fs.existsSync(latestYmlPath)) {
      assetsToUpload.push({ file: latestYmlFile, path: latestYmlPath, type: 'text/yaml' })
    }
    if (fs.existsSync(sumsPath)) {
      assetsToUpload.push({ file: sumsFile, path: sumsPath, type: 'text/plain' })
    }
  }

  for (const item of assetsToUpload) {
    const existing = (release.assets || []).find((a) => a.name === item.file)
    if (existing) {
      console.log(`🗑️ Deleting existing asset: ${item.file} (ID: ${existing.id})...`)
      try {
        await ghRequest('DELETE', `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/releases/assets/${existing.id}`)
      } catch (e) {
        console.warn(`Could not delete asset ${item.file}:`, e.message)
      }
    }

    console.log(`⬆️ Uploading ${item.file} (${(fs.statSync(item.path).size / 1024 / 1024).toFixed(2)} MB)...`)
    await uploadAsset(release.upload_url, item.path, item.file, item.type)
    console.log(`   ✓ ${item.file} uploaded successfully!`)
  }

  console.log(`\n🎉 PATCH-ONLY RELEASE ${TAG} PUBLISHED SUCCESSFULLY TO GITHUB RELEASES!`)
  console.log(`🔗 https://github.com/${REPO_OWNER}/${REPO_NAME}/releases/tag/${TAG}`)
}

main().catch((err) => {
  console.error('Fatal error during patch publish:', err)
  process.exit(1)
})
