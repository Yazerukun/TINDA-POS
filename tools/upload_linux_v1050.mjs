import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import https from 'node:https'

const GITHUB_TOKEN = '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'
const REPO_OWNER = 'Yazerukun'
const REPO_NAME = 'TINDA-POS'
const TAG = 'v1.0.50'

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
        'User-Agent': 'TINDA-POS-Linux-Uploader',
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
  const appImagePath = path.join(BUILDS_DIR, 'TindaPOS-1.0.50.AppImage')
  if (!fs.existsSync(appImagePath)) {
    throw new Error(`Missing AppImage at: ${appImagePath}`)
  }

  const appImageHash = sha256File(appImagePath)
  console.log(`TindaPOS-1.0.50.AppImage SHA256: ${appImageHash}`)

  // Update local SHA256 file
  const shaPath = path.join(BUILDS_DIR, 'SHA256SUMS-v1.0.50.txt')
  let shaContent = fs.existsSync(shaPath) ? fs.readFileSync(shaPath, 'utf-8') : ''
  if (shaContent.includes('TindaPOS-1.0.50.AppImage')) {
    shaContent = shaContent.replace(/.*TindaPOS-1\.0\.50\.AppImage.*/, `${appImageHash}  TindaPOS-1.0.50.AppImage`)
  } else {
    shaContent += `${appImageHash}  TindaPOS-1.0.50.AppImage\n`
  }
  fs.writeFileSync(shaPath, shaContent, 'utf-8')

  console.log('\nFetching release v1.0.50 from GitHub...')
  const release = await ghRequest('GET', `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/releases/tags/${TAG}`)
  console.log(`Release ID: ${release.id}`)

  const existingAssets = release.assets || []

  // 1. Upload or replace TindaPOS-1.0.50.AppImage
  const existingAppImage = existingAssets.find((a) => a.name === 'TindaPOS-1.0.50.AppImage')
  if (existingAppImage) {
    console.log(`Deleting existing AppImage asset (id ${existingAppImage.id})...`)
    await ghRequest('DELETE', `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/releases/assets/${existingAppImage.id}`)
  }
  await uploadAsset(release.upload_url, appImagePath, 'TindaPOS-1.0.50.AppImage', 'application/x-executable')
  console.log('[PASS] Uploaded TindaPOS-1.0.50.AppImage')

  // 2. Re-upload updated SHA256SUMS-v1.0.50.txt
  const existingSha = existingAssets.find((a) => a.name === 'SHA256SUMS-v1.0.50.txt')
  if (existingSha) {
    console.log(`Deleting old SHA256SUMS asset (id ${existingSha.id})...`)
    await ghRequest('DELETE', `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/releases/assets/${existingSha.id}`)
  }
  await uploadAsset(release.upload_url, shaPath, 'SHA256SUMS-v1.0.50.txt', 'text/plain')
  console.log('[PASS] Uploaded updated SHA256SUMS-v1.0.50.txt')

  console.log('\n🎉 Linux AppImage successfully added to GitHub Release v1.0.50!')
}

run().catch((err) => {
  console.error('❌ Failed:', err)
  process.exit(1)
})
