import { app, BrowserWindow } from 'electron'
import { readFileSync, writeFileSync, existsSync, renameSync, rmSync, mkdtempSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { tmpdir } from 'node:os'
import { fileURLToPath } from 'node:url'

const toolDir = dirname(fileURLToPath(import.meta.url))
const repoRoot = resolve(toolDir, '..')
const manualPath = join(repoRoot, 'docs', 'USER-MANUAL.md')
const outputPath = join(repoRoot, 'installers', 'TindaPOS-User-Guide.pdf')
const temporaryPdf = join(repoRoot, 'installers', `.TindaPOS-User-Guide-${process.pid}.tmp.pdf`)
const previousPdf = join(repoRoot, 'installers', `.TindaPOS-User-Guide-${process.pid}.previous.pdf`)
const electronDataDir = mkdtempSync(join(tmpdir(), 'tinda-pos-docs-'))

app.setPath('userData', electronDataDir)
app.commandLine.appendSwitch('disable-gpu')

function escapeHtml(value) {
  return value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;')
}

function inlineMarkdown(value) {
  return escapeHtml(value)
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/\*([^*]+)\*/g, '<em>$1</em>')
}

function markdownToHtml(markdown) {
  const lines = markdown.replace(/^# TINDA POS v1\.0\.3 User Manual\s*/u, '').split(/\r?\n/)
  const blocks = []
  let paragraph = []
  let listType = null
  let inCode = false
  let code = []

  const flushParagraph = () => {
    if (paragraph.length) blocks.push(`<p>${inlineMarkdown(paragraph.join(' '))}</p>`)
    paragraph = []
  }
  const closeList = () => {
    if (listType) blocks.push(`</${listType}>`)
    listType = null
  }

  for (const line of lines) {
    if (line.startsWith('```')) {
      flushParagraph()
      closeList()
      if (inCode) {
        blocks.push(`<pre><code>${escapeHtml(code.join('\n'))}</code></pre>`)
        code = []
      }
      inCode = !inCode
      continue
    }
    if (inCode) {
      code.push(line)
      continue
    }
    const heading = line.match(/^(#{2,4})\s+(.+)$/)
    if (heading) {
      flushParagraph()
      closeList()
      const level = heading[1].length
      blocks.push(`<h${level}>${inlineMarkdown(heading[2])}</h${level}>`)
      continue
    }
    const bullet = line.match(/^[-*]\s+(.+)$/)
    const numbered = line.match(/^\d+\.\s+(.+)$/)
    if (bullet || numbered) {
      flushParagraph()
      const nextType = bullet ? 'ul' : 'ol'
      if (listType !== nextType) {
        closeList()
        blocks.push(`<${nextType}>`)
        listType = nextType
      }
      blocks.push(`<li>${inlineMarkdown((bullet || numbered)[1])}</li>`)
      continue
    }
    if (!line.trim()) {
      flushParagraph()
      closeList()
      continue
    }
    paragraph.push(line.trim())
  }
  flushParagraph()
  closeList()
  return blocks.join('\n')
}

const requiredContent = [
  'TINDA POS v1.0.3', 'POS and Checkout', 'Cash and Sukli', 'GCash and Maya recording', 'Utang',
  'Split Payment', 'Hold Sale', 'Held Sales', 'Resume', 'Delete', 'survive app restart',
  'does not deduct stock', 'Inventory and Tingi Units', 'Settings → Data',
  '%APPDATA%\\TINDA POS\\database\\tindapos.db', 'Installer and Portable',
  'does not create a fresh database', 'Backup and Restore', 'validates', 'safety backup',
  'restarts automatically', 'Reset Database', 'ADMIN/settings permission', 'type RESET exactly',
  'first-run wizard', 'ONLINE READY', 'OFFLINE READY', 'remains usable offline',
  'Receipt Generation', 'printer discovery, Test Print, Auto Print', 'manual Print Receipt',
  'Native Windows/thermal-printer validation is still pending',
  'Software Update', 'Restart & Install', 'Check for Updates'
]

const stalePrinterClaims = [
  'not integrated in v1.0.2',
  'not integrated in v1.0.3',
  'direct physical-printer output is not yet integrated',
  'printing is not wired to a device'
]

function assertRequiredContent(text, label) {
  const normalized = text.replace(/[*`]/g, '')
  const missing = requiredContent.filter((item) => !normalized.includes(item))
  if (missing.length) throw new Error(`${label} is missing required content: ${missing.join(', ')}`)
  const stale = stalePrinterClaims.filter((item) => normalized.includes(item))
  if (stale.length) throw new Error(`${label} still contains outdated printer claim(s): ${stale.join(', ')}`)
  if (/^#?\s*TINDA POS v1\.0\.1 User Manual/im.test(text)) throw new Error(`${label} still contains a v1.0.1 manual header.`)
}

function documentHtml(markdown) {
  return `<!doctype html>
<html><head><meta charset="utf-8"><title>TINDA POS v1.0.3 User Guide</title><style>
  @page { size: A4; margin: 18mm 16mm 20mm; }
  * { box-sizing: border-box; }
  html { font-family: Arial, Helvetica, sans-serif; color: #172033; font-size: 10.5pt; line-height: 1.5; }
  body { margin: 0; background: white; }
  .cover { height: 252mm; display: flex; flex-direction: column; justify-content: center; align-items: center; text-align: center; page-break-after: always; }
  .brand { color: #047857; font-size: 34pt; font-weight: 800; letter-spacing: .04em; margin: 0; }
  .guide { font-size: 22pt; margin: 10mm 0 2mm; color: #172033; }
  .version { font-size: 14pt; color: #047857; font-weight: 700; margin: 0 0 8mm; }
  .subtitle { color: #526174; font-size: 12pt; }
  h2 { color: #047857; font-size: 18pt; margin: 9mm 0 3mm; break-after: avoid; border-bottom: .4mm solid #d1fae5; padding-bottom: 1.5mm; }
  h3 { color: #1f3b52; font-size: 13pt; margin: 6mm 0 2mm; break-after: avoid; }
  h4 { font-size: 11pt; margin: 4mm 0 1mm; break-after: avoid; }
  p { margin: 0 0 3mm; orphans: 3; widows: 3; }
  ul, ol { margin: 0 0 4mm 7mm; padding-left: 5mm; }
  li { margin: 0 0 1.5mm; break-inside: avoid; }
  code { font-family: Consolas, monospace; font-size: 9pt; background: #f1f5f9; padding: .3mm 1mm; overflow-wrap: anywhere; }
  pre { background: #f1f5f9; border-left: 1mm solid #10b981; padding: 3mm; white-space: pre-wrap; overflow-wrap: anywhere; break-inside: avoid; }
  strong { color: #0f172a; }
</style></head><body>
  <section class="cover"><p class="brand">TINDA POS</p><p class="guide">User Guide</p><p class="version">v1.0.3</p><p class="subtitle">Offline POS System for Sari-Sari Stores</p></section>
  <main><h1 style="display:none">TINDA POS v1.0.3 User Manual</h1>${markdownToHtml(markdown)}</main>
</body></html>`
}

async function main() {
  const markdown = readFileSync(manualPath, 'utf8')
  assertRequiredContent(markdown, 'Markdown source')
  const html = documentHtml(markdown)

  await app.whenReady()
  process.stdout.write('PDF: Electron ready\n')
  const window = new BrowserWindow({ show: false, webPreferences: { sandbox: true } })
  await window.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(html)}`)
  process.stdout.write('PDF: Guide loaded\n')
  await window.webContents.executeJavaScript('document.fonts.ready.then(() => true)')
  const renderedText = await window.webContents.executeJavaScript('document.body.innerText')
  assertRequiredContent(renderedText, 'Rendered guide')
  process.stdout.write('PDF: Rendered content validated\n')

  const pdf = await window.webContents.printToPDF({
    pageSize: 'A4',
    printBackground: true,
    preferCSSPageSize: true,
    displayHeaderFooter: true,
    headerTemplate: '<span></span>',
    footerTemplate: '<div style="width:100%;font-size:8px;color:#64748b;text-align:center"><span class="pageNumber"></span> / <span class="totalPages"></span></div>'
  })
  process.stdout.write('PDF: Print completed\n')
  window.destroy()

  writeFileSync(temporaryPdf, pdf)
  const check = readFileSync(temporaryPdf)
  if (check.length < 10_000) throw new Error(`Generated PDF is unexpectedly small (${check.length} bytes).`)
  if (check.subarray(0, 5).toString('ascii') !== '%PDF-') throw new Error('Generated file has an invalid PDF header.')
  if (!check.subarray(-2048).toString('latin1').includes('%%EOF')) throw new Error('Generated PDF has no EOF marker.')
  const pageCount = (check.toString('latin1').match(/\/Type\s*\/Page\b/g) || []).length
  if (pageCount < 3 || pageCount > 30) throw new Error(`Generated PDF page count is unreasonable (${pageCount}).`)

  if (existsSync(outputPath)) renameSync(outputPath, previousPdf)
  try {
    renameSync(temporaryPdf, outputPath)
    rmSync(previousPdf, { force: true })
  } catch (error) {
    if (existsSync(previousPdf)) renameSync(previousPdf, outputPath)
    throw error
  }

  process.stdout.write(`${JSON.stringify({ output: outputPath, bytes: check.length, pages: pageCount, version: '1.0.3' })}\n`)
}

void main().then(() => {
  app.quit()
}).catch((error) => {
  rmSync(temporaryPdf, { force: true })
  rmSync(previousPdf, { force: true })
  console.error(error)
  app.exit(1)
})
