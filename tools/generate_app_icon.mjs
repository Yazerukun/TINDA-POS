import fs from 'node:fs'
import path from 'node:path'
import { app, BrowserWindow, nativeImage } from 'electron'

// Ensure build directory exists
const buildDir = path.resolve('build')
if (!fs.existsSync(buildDir)) {
  fs.mkdirSync(buildDir, { recursive: true })
}

const svgMarkup = `
<svg viewBox="0 0 100 100" width="512" height="512" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="tindaModernBg" x1="0" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stopColor="#0b231c" />
      <stop offset="50%" stopColor="#061612" />
      <stop offset="100%" stopColor="#020b08" />
    </linearGradient>

    <linearGradient id="tindaModernMark" x1="18" y1="18" x2="82" y2="82" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stopColor="#34d399" />
      <stop offset="45%" stopColor="#10b981" />
      <stop offset="100%" stopColor="#059669" />
    </linearGradient>

    <linearGradient id="tindaGlassBevel" x1="0" y1="0" x2="0" y2="100" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stopColor="#ffffff" stopOpacity="0.35" />
      <stop offset="30%" stopColor="#ffffff" stopOpacity="0.08" />
      <stop offset="100%" stopColor="#000000" stopOpacity="0.5" />
    </linearGradient>
  </defs>

  <!-- 1. Enterprise Rounded Squircle Chassis -->
  <rect
    x="4"
    y="4"
    width="92"
    height="92"
    rx="22"
    fill="url(#tindaModernBg)"
    stroke="url(#tindaGlassBevel)"
    stroke-width="2"
  />

  <!-- 2. Soft Inner Glow -->
  <circle
    cx="50"
    cy="48"
    r="32"
    fill="#10b981"
    opacity="0.18"
  />

  <!-- 3. Crisp Modern Retail T Mark -->
  <path
    d="M20 28 C20 24.686 22.686 22 26 22 H74 C77.314 22 80 24.686 80 28 C80 31.314 77.314 34 74 34 H61 V74 C61 77.314 58.314 80 55 80 H45 C41.686 80 39 77.314 39 74 V34 H26 C22.686 34 20 31.314 20 28 Z"
    fill="url(#tindaModernMark)"
  />

  <!-- 4. Left Precision Angle Accent -->
  <path
    d="M20 40 L33 40 L26 49 L20 49 Z"
    fill="#34d399"
    opacity="0.9"
  />

  <!-- 5. Right Precision Angle Accent -->
  <path
    d="M80 40 L67 40 L74 49 L80 49 Z"
    fill="#059669"
    opacity="0.9"
  />

  <!-- 6. Precision Vertical Light Center Ray -->
  <line
    x1="50"
    y1="23"
    x2="50"
    y2="78"
    stroke="#ffffff"
    stroke-width="1.8"
    stroke-linecap="round"
    opacity="0.45"
  />

  <!-- 7. Core Optical Center Node -->
  <circle
    cx="50"
    cy="28"
    r="3.2"
    fill="#ffffff"
  />
</svg>
`.trim()

function createIcoBuffer(pngImages) {
  const header = Buffer.alloc(6)
  header.writeUInt16LE(0, 0)
  header.writeUInt16LE(1, 2)
  header.writeUInt16LE(pngImages.length, 4)

  let currentOffset = 6 + 16 * pngImages.length
  const dirEntries = []
  for (const img of pngImages) {
    const entry = Buffer.alloc(16)
    entry.writeUInt8(img.width >= 256 ? 0 : img.width, 0)
    entry.writeUInt8(img.height >= 256 ? 0 : img.height, 1)
    entry.writeUInt8(0, 2)
    entry.writeUInt8(0, 3)
    entry.writeUInt16LE(1, 4)
    entry.writeUInt16LE(32, 6)
    entry.writeUInt32LE(img.buffer.length, 8)
    entry.writeUInt32LE(currentOffset, 12)
    currentOffset += img.buffer.length
    dirEntries.push(entry)
  }

  return Buffer.concat([header, ...dirEntries, ...pngImages.map((img) => img.buffer)])
}

app.whenReady().then(async () => {
  const win = new BrowserWindow({
    width: 512,
    height: 512,
    show: false,
    transparent: true,
    frame: false,
    webPreferences: {
      offscreen: true
    }
  })

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { margin: 0; padding: 0; background: transparent; overflow: hidden; display: flex; align-items: center; justify-content: center; width: 512px; height: 512px; }
          svg { width: 512px; height: 512px; display: block; }
        </style>
      </head>
      <body>
        ${svgMarkup}
      </body>
    </html>
  `

  await win.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(html)}`)
  await new Promise((r) => setTimeout(r, 600))

  const image = await win.webContents.capturePage({ x: 0, y: 0, width: 512, height: 512 })
  
  // Save 512x512 master icon.png
  const png512 = image.toPNG()
  fs.writeFileSync(path.join(buildDir, 'icon.png'), png512)
  console.log('✅ Generated build/icon.png (512x512)')

  // Generate multi-resolution icons for Windows ICO
  const sizes = [256, 128, 64, 48, 32, 16]
  const pngImages = []
  for (const size of sizes) {
    const resized = image.resize({ width: size, height: size, quality: 'best' })
    pngImages.push({
      width: size,
      height: size,
      buffer: resized.toPNG()
    })
  }

  const icoBuffer = createIcoBuffer(pngImages)
  fs.writeFileSync(path.join(buildDir, 'icon.ico'), icoBuffer)
  console.log(`✅ Generated build/icon.ico (${(icoBuffer.length / 1024).toFixed(1)} KB with 6 resolutions: 256, 128, 64, 48, 32, 16)`)

  win.close()
  app.quit()
})
