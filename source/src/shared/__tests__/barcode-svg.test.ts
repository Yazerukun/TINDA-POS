import { describe, expect, it } from 'vitest'
import { generateBarcodeSvg } from '../barcodeSvg'

describe('generateBarcodeSvg', () => {
  it('generates a valid SVG string containing rectangles and text', () => {
    const svg = generateBarcodeSvg('4800016644812')
    expect(svg).toContain('<svg')
    expect(svg).toContain('</svg>')
    expect(svg).toContain('<rect')
    expect(svg).toContain('4800016644812')
    expect(svg).toContain('font-family="Consolas, \'Roboto Mono\', \'Courier New\', Arial, sans-serif"')
    expect(svg).toContain('font-weight="900"')
  })

  it('handles empty or special string gracefully with fallback', () => {
    const svg = generateBarcodeSvg('')
    expect(svg).toContain('<svg')
    expect(svg).toContain('000000')
  })

  it('honors options like height and text exclusion', () => {
    const svg = generateBarcodeSvg('TINDA-101', { height: 35, includeText: false })
    expect(svg).toContain('height="35"')
    expect(svg).not.toContain('<text')
  })
})
