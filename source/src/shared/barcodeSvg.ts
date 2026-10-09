/**
 * Pure TypeScript Code 128 (Subset B) Barcode SVG Generator
 * Generates high-definition, 100% scannable 1D barcodes for thermal printers (CT221B, POS-58, etc.)
 * Zero dependencies, pixel-perfect SVG vector paths.
 */

// Code 128 patterns: 6-digit strings of widths (bar, space, bar, space, bar, space)
const CODE128_PATTERNS: string[] = [
  '212222', '222122', '222221', '121223', '121322', '131222', '122213', '122312', '132212', '221213', // 0-9
  '221312', '231212', '112232', '122132', '122231', '113222', '123122', '123221', '223211', '221132', // 10-19
  '221231', '213212', '223112', '312131', '311222', '321122', '321221', '312212', '322112', '322211', // 20-29
  '212123', '212321', '232121', '111323', '131123', '131321', '112313', '132113', '132311', '211313', // 30-39
  '231113', '231311', '112133', '112331', '132131', '113123', '113321', '133121', '313121', '211331', // 40-49
  '231131', '213113', '213311', '213131', '311123', '311321', '331121', '312113', '312311', '332111', // 50-59
  '314111', '221411', '431111', '111224', '111422', '121124', '121421', '141122', '141221', '112214', // 60-69
  '112412', '122114', '122411', '142112', '142211', '241211', '221114', '413111', '241112', '134111', // 70-79
  '111242', '121142', '121241', '114212', '124112', '124211', '411212', '421112', '421211', '212141', // 80-89
  '214121', '412121', '111143', '111341', '131141', '114113', '114311', '411113', '411311', '113141', // 90-99
  '114131', '311141', '411131', '211412', '211214', '211232', '233111'                                   // 100-106
]

const START_CODE_B = 104
const STOP_PATTERN = '2331112' // Stop code has 7 elements

export interface BarcodeSvgOptions {
  width?: number
  height?: number
  includeText?: boolean
  barWidth?: number
  fontSize?: number
}

/**
 * Generates an SVG representation of a Code 128 barcode
 */
export function generateBarcodeSvg(
  rawText: string,
  options: BarcodeSvgOptions = {}
): string {
  // Sanitize input to Code 128 subset B ASCII range (32 to 126)
  const text = (rawText || '').trim().replace(/[^\x20-\x7E]/g, '') || '000000'
  const height = options.height ?? 50
  const includeText = options.includeText ?? true
  const barWidth = options.barWidth ?? 1.5
  const fontSize = options.fontSize ?? 10

  const codes: number[] = [START_CODE_B]

  for (let i = 0; i < text.length; i++) {
    const charCode = text.charCodeAt(i)
    // Code 128B maps ASCII 32..127 to values 0..95
    codes.push(charCode - 32)
  }

  // Calculate checksum
  let checksum = codes[0]!
  for (let i = 1; i < codes.length; i++) {
    checksum += codes[i]! * i
  }
  codes.push(checksum % 103)

  // Build pattern of modules (bars and spaces)
  let pattern = ''
  for (const c of codes) {
    pattern += CODE128_PATTERNS[c] || '111111'
  }
  pattern += STOP_PATTERN

  // Draw bars into SVG rects
  const quietZoneModules = 10
  let currentX = quietZoneModules * barWidth
  let isBar = true
  const rects: string[] = []

  const barHeight = includeText ? Math.max(20, height - fontSize - 4) : height

  for (let i = 0; i < pattern.length; i++) {
    const moduleCount = parseInt(pattern[i]!, 10)
    const w = moduleCount * barWidth
    if (isBar) {
      rects.push(`<rect x="${currentX.toFixed(2)}" y="0" width="${w.toFixed(2)}" height="${barHeight}" fill="#000000" />`)
    }
    currentX += w
    isBar = !isBar
  }

  const totalWidth = currentX + quietZoneModules * barWidth
  const totalHeight = height

  const textElement = includeText
    ? `<text x="${(totalWidth / 2).toFixed(2)}" y="${totalHeight - 1}" font-family="Courier, monospace, sans-serif" font-size="${fontSize}" font-weight="bold" text-anchor="middle" fill="#000000">${escapeXml(text)}</text>`
    : ''

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${totalWidth.toFixed(2)} ${totalHeight}" width="100%" height="${height}" preserveAspectRatio="xMidYMid meet" style="display:block;margin:0 auto;">
  <rect width="100%" height="100%" fill="#ffffff" />
  ${rects.join('\n  ')}
  ${textElement}
</svg>`
}

function escapeXml(unsafe: string): string {
  return unsafe.replace(/[<>&'"]/g, (c) => {
    switch (c) {
      case '<': return '&lt;'
      case '>': return '&gt;'
      case '&': return '&amp;'
      case '\'': return '&apos;'
      case '"': return '&quot;'
      default: return c
    }
  })
}
