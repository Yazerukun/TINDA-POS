import fs from 'node:fs'
import path from 'node:path'
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
const REPO = 'Yazerukun/TINDA-POS'

function ghRequest(method, urlStr, headers = {}, body = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(urlStr)
    const options = {
      hostname: url.hostname,
      path: url.pathname + url.search,
      method,
      headers: {
        'User-Agent': 'TINDA-POS-Sync-Script',
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

async function syncFile(localPath, repoPath) {
  const content = fs.readFileSync(localPath)
  const base64Content = content.toString('base64')

  let sha = undefined
  try {
    const existing = await ghRequest('GET', `https://api.github.com/repos/${REPO}/contents/${repoPath}?ref=master`)
    sha = existing.sha
  } catch {
    // New file
  }

  const payload = {
    message: `release: sync v5.1.1 ${repoPath}`,
    content: base64Content,
    branch: 'master'
  }
  if (sha) {
    payload.sha = sha
  }

  console.log(`Syncing ${repoPath} (sha: ${sha || 'new'})...`)
  const result = await ghRequest(
    'PUT',
    `https://api.github.com/repos/${REPO}/contents/${repoPath}`,
    { 'Content-Type': 'application/json' },
    JSON.stringify(payload)
  )
  console.log(`  ✅ Synced ${repoPath}: commit ${result.commit.sha.substring(0, 7)}`)
}

async function main() {
  const filesToSync = [
    { local: path.resolve('source', 'builds', 'latest.yml'), repo: 'latest.yml' },
    { local: path.resolve('README.md'), repo: 'README.md' },
    { local: path.resolve('GEMINI.md'), repo: 'GEMINI.md' },
    { local: path.resolve('SYSTEM_MASTER.md'), repo: 'SYSTEM_MASTER.md' },
    { local: path.resolve('docs', 'RELEASE-STATE.md'), repo: 'docs/RELEASE-STATE.md' }
  ]

  for (const f of filesToSync) {
    if (fs.existsSync(f.local)) {
      await syncFile(f.local, f.repo)
    }
  }

  console.log('\n🎉 ALL PUBLIC FILES SYNCED TO TINDA-POS MASTER VIA GITHUB API!')
}

main().catch((err) => {
  console.error('❌ Sync failed:', err)
  process.exit(1)
})
