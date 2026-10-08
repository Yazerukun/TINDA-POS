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
const TAG = 'v1.0.79'
const RELEASE_NAME = 'TINDA POS v1.0.79 — Sidebar Fast Updates & Zero-Restart Live Engine Edition'

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
          try {
            resolve(JSON.parse(data))
          } catch {
            resolve(data)
          }
        } else {
          reject(new Error(`Failed to upload ${fileName}: HTTP ${res.statusCode}: ${data}`))
        }
      })
    })

    req.on('error', reject)
    fileStream.pipe(req)
  })
}

async function main() {
  console.log(`🚀 Publishing ${RELEASE_NAME} (${TAG})...\n`)

  const setupFile = path.join(BUILDS_DIR, `TindaPOS-Setup-1.0.79.exe`)
  const portableFile = path.join(BUILDS_DIR, `TindaPOS-Portable-1.0.79.exe`)
  const blockmapFile = path.join(BUILDS_DIR, `TindaPOS-Setup-1.0.79.exe.blockmap`)
  const patchFile = path.join(BUILDS_DIR, `TindaPOS-Feature-Patch-1.0.79.zip`)
  const latestYmlFile = path.join(BUILDS_DIR, 'latest.yml')
  const guideFile = path.join(BUILDS_DIR, 'TindaPOS-User-Guide.pdf')
  const sumsFile = path.join(BUILDS_DIR, `SHA256SUMS-${TAG}.txt`)

  if (!fs.existsSync(setupFile) || !fs.existsSync(portableFile)) {
    throw new Error('Build artifacts not found in source/builds! Please run npm run build:win first.')
  }

  const setupSha = sha256File(setupFile)
  const portableSha = sha256File(portableFile)
  const blockmapSha = fs.existsSync(blockmapFile) ? sha256File(blockmapFile) : ''
  const patchSha = fs.existsSync(patchFile) ? sha256File(patchFile) : ''
  const latestSha = fs.existsSync(latestYmlFile) ? sha256File(latestYmlFile) : ''

  console.log(`📦 Artifact Hashes:`)
  console.log(`  Setup:         ${setupSha}`)
  console.log(`  Portable:      ${portableSha}`)
  console.log(`  Blockmap:      ${blockmapSha}`)
  console.log(`  Feature Patch: ${patchSha}`)
  console.log(`  latest.yml:    ${latestSha}\n`)

  fs.writeFileSync(
    sumsFile,
    `${setupSha}  TindaPOS-Setup-1.0.79.exe\n${portableSha}  TindaPOS-Portable-1.0.79.exe\n${blockmapSha}  TindaPOS-Setup-1.0.79.exe.blockmap\n${patchSha}  TindaPOS-Feature-Patch-1.0.79.zip\n${latestSha}  latest.yml\n`,
    'utf-8'
  )

  const releaseNotesPath = path.resolve(`RELEASE_NOTES_${TAG}.md`)
  let releaseNotes = ''
  if (fs.existsSync(releaseNotesPath)) {
    releaseNotes = fs.readFileSync(releaseNotesPath, 'utf-8')
  } else {
    releaseNotes = `## ${RELEASE_NAME}\n\nAutomated release for version ${TAG}.`
  }

  // 1. Check if release already exists
  console.log(`🔍 Checking if release ${TAG} already exists...`)
  let release = null
  try {
    release = await ghRequest('GET', `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/releases/tags/${TAG}`)
    console.log(`  ℹ️ Found existing release ${TAG} (ID: ${release.id})`)
  } catch (err) {
    if (err.message.includes('404')) {
      console.log(`  ℹ️ Release ${TAG} does not exist yet. Will create new.`)
    } else {
      throw err
    }
  }

  // 2. Create release if not found
  if (!release) {
    console.log(`\n✨ Creating GitHub release ${TAG}...`)
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
    console.log(`  ✅ Created release ${TAG} (ID: ${release.id})`)
  } else {
    console.log(`\n📝 Updating existing GitHub release ${TAG}...`)
    release = await ghRequest(
      'PATCH',
      `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/releases/${release.id}`,
      { 'Content-Type': 'application/json' },
      JSON.stringify({
        name: RELEASE_NAME,
        body: releaseNotes
      })
    )
    console.log(`  ✅ Updated release ${TAG}`)
  }

  // 3. Upload assets
  console.log(`\n📤 Uploading release assets...`)
  const existingAssets = release.assets || []

  const assetsToUpload = [
    { file: setupFile, name: 'TindaPOS-Setup-1.0.79.exe' },
    { file: portableFile, name: 'TindaPOS-Portable-1.0.79.exe' },
    { file: blockmapFile, name: 'TindaPOS-Setup-1.0.79.exe.blockmap' },
    { file: patchFile, name: 'TindaPOS-Feature-Patch-1.0.79.zip' },
    { file: latestYmlFile, name: 'latest.yml' },
    { file: sumsFile, name: `SHA256SUMS-${TAG}.txt` }
  ]

  if (fs.existsSync(guideFile)) {
    assetsToUpload.push({ file: guideFile, name: 'TindaPOS-User-Guide.pdf' })
  }

  for (const asset of assetsToUpload) {
    if (!fs.existsSync(asset.file)) {
      console.warn(`  ⚠️ Skipping missing file: ${asset.name}`)
      continue
    }

    const existing = existingAssets.find((a) => a.name === asset.name)
    if (existing) {
      console.log(`  🗑️ Deleting existing asset ${asset.name} (ID: ${existing.id})...`)
      await ghRequest('DELETE', `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/releases/assets/${existing.id}`)
    }

    await uploadAsset(release.upload_url, asset.file, asset.name)
  }

  console.log(`\n🎉 Release ${TAG} published successfully!`)
  console.log(`🔗 URL: https://github.com/${REPO_OWNER}/${REPO_NAME}/releases/tag/${TAG}`)
}

main().catch((err) => {
  console.error('\n❌ Release publishing failed:', err)
  process.exit(1)
})
