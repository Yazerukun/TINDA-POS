import fs from 'node:fs'
import crypto from 'node:crypto'
import path from 'node:path'

const files = [
  'TindaPOS-Setup-1.0.72.exe',
  'TindaPOS-Portable-1.0.72.exe',
  'TindaPOS-Setup-1.0.72.exe.blockmap',
  'latest.yml'
]

const results = []

for (const f of files) {
  const p = path.resolve('source', 'builds', f)
  if (fs.existsSync(p)) {
    const data = fs.readFileSync(p)
    const hash = crypto.createHash('sha256').update(data).digest('hex')
    const sizeMb = (data.length / (1024 * 1024)).toFixed(2)
    results.push({ name: f, sizeMb, bytes: data.length, hash })
    console.log(`${f} | ${sizeMb} MB | ${data.length} bytes | ${hash}`)
  }
}

const sumContent = results.map(r => `${r.hash}  ${r.name}`).join('\n') + '\n'
fs.writeFileSync(path.resolve('source', 'builds', 'SHA256SUMS-v1.0.72.txt'), sumContent)
console.log('Saved source/builds/SHA256SUMS-v1.0.72.txt')
