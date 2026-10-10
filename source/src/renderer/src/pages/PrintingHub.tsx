import { useState, useMemo } from 'react'
import {
  Printer,
  Copy,
  FileText,
  Image as ImageIcon,
  Contact,
  ScanLine,
  Layers,
  Sparkles,
  ShoppingCart,
  ArrowRight,
  CheckCircle2,
  Coins,
  BadgePercent,
  Plus,
  RefreshCw,
  FolderPlus,
  HelpCircle
} from 'lucide-react'
import { PageHeader } from '../components/ui/PageHeader'
import { money } from '@shared/format'
import { toastSuccess } from '../stores/toast'
import { usePosCart } from './POS'
import { useNav } from '../stores/nav'

export type ServiceCategory = 'PRINTING' | 'PHOTOCOPY_SCAN' | 'ID_PVC' | 'LAMINATION' | 'RESUME_TYPING'

export type PaperSize = 'A4' | 'SHORT' | 'LONG' | 'PHOTO_4R' | 'PHOTO_A4' | 'PVC_CR80' | 'ID_CARD'
export type InkCoverage = 'BW_TEXT' | 'COLOR_MINIMAL' | 'COLOR_STANDARD' | 'COLOR_PHOTO'
export type LaminationSize = 'NONE' | 'ID' | 'SHORT' | 'LONG' | 'A4'

interface PresetService {
  id: string
  name: string
  category: ServiceCategory
  description: string
  paperSize: PaperSize
  inkCoverage: InkCoverage
  lamination: LaminationSize
  defaultPages: number
  defaultCopies: number
  suggestedPricePerUnit: number
  fixedExtraCost: number // e.g. PVC blank, cardstock, pouch
  fixedLaborFee: number // e.g. encoding or camera fee
  badge?: string
}

const PRESET_SERVICES: PresetService[] = [
  // Document Printing
  {
    id: 'bw_print_short',
    name: 'B/W Print (Short)',
    category: 'PRINTING',
    description: 'Black & white document printing on 70gsm short bond paper',
    paperSize: 'SHORT',
    inkCoverage: 'BW_TEXT',
    lamination: 'NONE',
    defaultPages: 1,
    defaultCopies: 1,
    suggestedPricePerUnit: 3,
    fixedExtraCost: 0,
    fixedLaborFee: 0
  },
  {
    id: 'bw_print_long',
    name: 'B/W Print (Long)',
    category: 'PRINTING',
    description: 'Black & white document printing on long bond paper',
    paperSize: 'LONG',
    inkCoverage: 'BW_TEXT',
    lamination: 'NONE',
    defaultPages: 1,
    defaultCopies: 1,
    suggestedPricePerUnit: 4,
    fixedExtraCost: 0,
    fixedLaborFee: 0
  },
  {
    id: 'bw_print_a4',
    name: 'B/W Print (A4)',
    category: 'PRINTING',
    description: 'Black & white document printing on standard A4 paper',
    paperSize: 'A4',
    inkCoverage: 'BW_TEXT',
    lamination: 'NONE',
    defaultPages: 1,
    defaultCopies: 1,
    suggestedPricePerUnit: 3,
    fixedExtraCost: 0,
    fixedLaborFee: 0
  },
  {
    id: 'color_print_text',
    name: 'Color Print (Text / Minimal)',
    category: 'PRINTING',
    description: 'Colored text, headers, and light graphic logos',
    paperSize: 'A4',
    inkCoverage: 'COLOR_MINIMAL',
    lamination: 'NONE',
    defaultPages: 1,
    defaultCopies: 1,
    suggestedPricePerUnit: 7,
    fixedExtraCost: 0,
    fixedLaborFee: 0
  },
  {
    id: 'color_print_standard',
    name: 'Color Print (Graphics / Presentation)',
    category: 'PRINTING',
    description: 'Full color diagrams, charts, reports, or school projects',
    paperSize: 'A4',
    inkCoverage: 'COLOR_STANDARD',
    lamination: 'NONE',
    defaultPages: 1,
    defaultCopies: 1,
    suggestedPricePerUnit: 12,
    fixedExtraCost: 0,
    fixedLaborFee: 0,
    badge: 'Popular'
  },
  {
    id: 'color_print_full',
    name: 'Full Page Photo / Graphic',
    category: 'PRINTING',
    description: '100% ink coverage on photo or glossy paper',
    paperSize: 'PHOTO_A4',
    inkCoverage: 'COLOR_PHOTO',
    lamination: 'NONE',
    defaultPages: 1,
    defaultCopies: 1,
    suggestedPricePerUnit: 35,
    fixedExtraCost: 5,
    fixedLaborFee: 0
  },

  // Photocopy & Scanning
  {
    id: 'copy_single_bw',
    name: 'Photocopy B/W (Single Sided)',
    category: 'PHOTOCOPY_SCAN',
    description: 'Standard black & white document copy',
    paperSize: 'SHORT',
    inkCoverage: 'BW_TEXT',
    lamination: 'NONE',
    defaultPages: 1,
    defaultCopies: 1,
    suggestedPricePerUnit: 2,
    fixedExtraCost: 0,
    fixedLaborFee: 0
  },
  {
    id: 'copy_b2b_bw',
    name: 'Photocopy B/W (Back-to-Back)',
    category: 'PHOTOCOPY_SCAN',
    description: 'Double-sided photocopy (front and back page)',
    paperSize: 'SHORT',
    inkCoverage: 'BW_TEXT',
    lamination: 'NONE',
    defaultPages: 2,
    defaultCopies: 1,
    suggestedPricePerUnit: 4,
    fixedExtraCost: 0,
    fixedLaborFee: 0
  },
  {
    id: 'copy_id_2sided',
    name: 'Photocopy ID (Front & Back on 1 Page)',
    category: 'PHOTOCOPY_SCAN',
    description: 'Government / school ID front and back arranged on single sheet',
    paperSize: 'SHORT',
    inkCoverage: 'BW_TEXT',
    lamination: 'NONE',
    defaultPages: 1,
    defaultCopies: 1,
    suggestedPricePerUnit: 5,
    fixedExtraCost: 0,
    fixedLaborFee: 0,
    badge: 'Standard'
  },
  {
    id: 'scan_doc',
    name: 'Document Scanning (to Phone/Email/USB)',
    category: 'PHOTOCOPY_SCAN',
    description: 'High-resolution flatbed PDF/JPEG scan per page',
    paperSize: 'A4',
    inkCoverage: 'BW_TEXT',
    lamination: 'NONE',
    defaultPages: 1,
    defaultCopies: 1,
    suggestedPricePerUnit: 10,
    fixedExtraCost: 0,
    fixedLaborFee: 5
  },

  // ID Pictures & PVC
  {
    id: 'rush_id_package',
    name: 'Rush ID Package (4x 1x1 + 2x 2x2 + 2x Passport)',
    category: 'ID_PVC',
    description: 'Rush 5-10 min studio print on 260gsm glossy photo paper with crop cut',
    paperSize: 'PHOTO_4R',
    inkCoverage: 'COLOR_PHOTO',
    lamination: 'NONE',
    defaultPages: 1,
    defaultCopies: 1,
    suggestedPricePerUnit: 75,
    fixedExtraCost: 5,
    fixedLaborFee: 25,
    badge: 'Rush 🔥'
  },
  {
    id: 'rush_id_combo_lam',
    name: 'Rush ID + Lamination Combo (8x 1x1 + 4x 2x2 + Pouch)',
    category: 'ID_PVC',
    description: 'Complete rush package with multiple ID photos plus ID thermal pouch lamination',
    paperSize: 'PHOTO_4R',
    inkCoverage: 'COLOR_PHOTO',
    lamination: 'ID',
    defaultPages: 1,
    defaultCopies: 1,
    suggestedPricePerUnit: 95,
    fixedExtraCost: 7,
    fixedLaborFee: 30,
    badge: 'Popular'
  },
  {
    id: 'id_pic_package',
    name: 'ID Picture Studio Package (4x 1x1 + 2x 2x2)',
    category: 'ID_PVC',
    description: 'Printed on 260gsm RC glossy photo paper with crop cut',
    paperSize: 'PHOTO_4R',
    inkCoverage: 'COLOR_PHOTO',
    lamination: 'NONE',
    defaultPages: 1,
    defaultCopies: 1,
    suggestedPricePerUnit: 50,
    fixedExtraCost: 4.5,
    fixedLaborFee: 15,
    badge: 'Bestseller'
  },
  {
    id: 'id_pic_passport',
    name: 'Passport Size Photo (Set of 4)',
    category: 'ID_PVC',
    description: 'Standard DFA / Visa 35mm x 45mm compliant photo layout',
    paperSize: 'PHOTO_4R',
    inkCoverage: 'COLOR_PHOTO',
    lamination: 'NONE',
    defaultPages: 1,
    defaultCopies: 1,
    suggestedPricePerUnit: 60,
    fixedExtraCost: 4.5,
    fixedLaborFee: 20
  },
  {
    id: 'pvc_id_single',
    name: 'PVC ID Card (CR80 Standard Blank)',
    category: 'ID_PVC',
    description: 'Durable waterproof PVC ID card printing (Single-sided)',
    paperSize: 'PVC_CR80',
    inkCoverage: 'COLOR_PHOTO',
    lamination: 'NONE',
    defaultPages: 1,
    defaultCopies: 1,
    suggestedPricePerUnit: 100,
    fixedExtraCost: 12,
    fixedLaborFee: 30,
    badge: 'High Value'
  },
  {
    id: 'pvc_id_double',
    name: 'PVC ID Card (Double-Sided with Lanyard/Hole)',
    category: 'ID_PVC',
    description: 'Dual-sided PVC badge with slot punch and neck lanyard',
    paperSize: 'PVC_CR80',
    inkCoverage: 'COLOR_PHOTO',
    lamination: 'NONE',
    defaultPages: 2,
    defaultCopies: 1,
    suggestedPricePerUnit: 150,
    fixedExtraCost: 20,
    fixedLaborFee: 40
  },

  // Lamination & Badges
  {
    id: 'lam_id_size',
    name: 'ID Lamination (125/250 Micron)',
    category: 'LAMINATION',
    description: 'Thermal seal protective pouch for ID / license cards',
    paperSize: 'ID_CARD',
    inkCoverage: 'BW_TEXT',
    lamination: 'ID',
    defaultPages: 1,
    defaultCopies: 1,
    suggestedPricePerUnit: 15,
    fixedExtraCost: 2,
    fixedLaborFee: 5
  },
  {
    id: 'lam_short_a4',
    name: 'Document Lamination (Short / A4)',
    category: 'LAMINATION',
    description: 'Heavy duty lamination for certificates and diplomas',
    paperSize: 'A4',
    inkCoverage: 'BW_TEXT',
    lamination: 'A4',
    defaultPages: 1,
    defaultCopies: 1,
    suggestedPricePerUnit: 35,
    fixedExtraCost: 4.5,
    fixedLaborFee: 10
  },
  {
    id: 'lam_long',
    name: 'Document Lamination (Long / Folio)',
    category: 'LAMINATION',
    description: 'Heavy duty lamination for land titles, legal documents',
    paperSize: 'LONG',
    inkCoverage: 'BW_TEXT',
    lamination: 'LONG',
    defaultPages: 1,
    defaultCopies: 1,
    suggestedPricePerUnit: 40,
    fixedExtraCost: 5.5,
    fixedLaborFee: 10
  },
  {
    id: 'nametag_cardstock',
    name: 'Nametag / Event Badge with Pin/Clip',
    category: 'LAMINATION',
    description: 'Full color printed cardstock + lamination + alligator clip/pin',
    paperSize: 'ID_CARD',
    inkCoverage: 'COLOR_STANDARD',
    lamination: 'ID',
    defaultPages: 1,
    defaultCopies: 1,
    suggestedPricePerUnit: 30,
    fixedExtraCost: 6,
    fixedLaborFee: 10
  },

  // Resume & Typing Services
  {
    id: 'resume_format_print',
    name: 'Resume Encoding / Reformatting + Print',
    category: 'RESUME_TYPING',
    description: 'Professional layout composition, spell-check + 3 copies',
    paperSize: 'A4',
    inkCoverage: 'BW_TEXT',
    lamination: 'NONE',
    defaultPages: 1,
    defaultCopies: 3,
    suggestedPricePerUnit: 60,
    fixedExtraCost: 2,
    fixedLaborFee: 40,
    badge: 'Service'
  },
  {
    id: 'typing_per_page',
    name: 'Document Typing / Encoding (Per Page)',
    category: 'RESUME_TYPING',
    description: 'Handwritten notes or book transcription encoding',
    paperSize: 'SHORT',
    inkCoverage: 'BW_TEXT',
    lamination: 'NONE',
    defaultPages: 1,
    defaultCopies: 1,
    suggestedPricePerUnit: 25,
    fixedExtraCost: 0.7,
    fixedLaborFee: 20
  }
]

// Raw Consumable Standard Rates (Philippine Retail Benchmark)
const PAPER_COSTS: Record<PaperSize, number> = {
  SHORT: 0.65,
  LONG: 0.75,
  A4: 0.7,
  PHOTO_4R: 4.0,
  PHOTO_A4: 6.5,
  PVC_CR80: 9.0,
  ID_CARD: 1.0
}

const INK_COSTS: Record<InkCoverage, number> = {
  BW_TEXT: 0.35,
  COLOR_MINIMAL: 1.25,
  COLOR_STANDARD: 2.5,
  COLOR_PHOTO: 4.8
}

const LAMINATION_COSTS: Record<LaminationSize, number> = {
  NONE: 0,
  ID: 1.8,
  SHORT: 3.5,
  LONG: 4.0,
  A4: 3.8
}

export function PrintingHub(): React.JSX.Element {
  const { setPage } = useNav()
  const [selectedCategory, setSelectedCategory] = useState<ServiceCategory>('PRINTING')
  const [selectedPreset, setSelectedPreset] = useState<PresetService>(PRESET_SERVICES[0]!)

  // Job Configuration State
  const [jobTitle, setJobTitle] = useState(selectedPreset.name)
  const [paperSize, setPaperSize] = useState<PaperSize>(selectedPreset.paperSize)
  const [inkCoverage, setInkCoverage] = useState<InkCoverage>(selectedPreset.inkCoverage)
  const [lamination, setLamination] = useState<LaminationSize>(selectedPreset.lamination)
  const [pageCount, setPageCount] = useState<number>(selectedPreset.defaultPages)
  const [copies, setCopies] = useState<number>(selectedPreset.defaultCopies)
  const [pricePerSet, setPricePerSet] = useState<number>(selectedPreset.suggestedPricePerUnit)
  const [laborFee, setLaborFee] = useState<number>(selectedPreset.fixedLaborFee)
  const [extraConsumableCost, setExtraConsumableCost] = useState<number>(selectedPreset.fixedExtraCost)
  const [customerNotes, setCustomerNotes] = useState<string>('')

  // Recent Dispatched Jobs Log
  const [recentJobs, setRecentJobs] = useState<
    Array<{
      id: string
      title: string
      totalPriceC: number
      profitC: number
      time: string
    }>
  >([])

  // When a preset is chosen, auto-load its specs
  const handleSelectPreset = (preset: PresetService) => {
    setSelectedPreset(preset)
    setJobTitle(preset.name)
    setPaperSize(preset.paperSize)
    setInkCoverage(preset.inkCoverage)
    setLamination(preset.lamination)
    setPageCount(preset.defaultPages)
    setCopies(preset.defaultCopies)
    setPricePerSet(preset.suggestedPricePerUnit)
    setLaborFee(preset.fixedLaborFee)
    setExtraConsumableCost(preset.fixedExtraCost)
  }

  // Costing calculations
  const costing = useMemo(() => {
    const paperPerSheet = PAPER_COSTS[paperSize] || 0.7
    const inkPerPage = INK_COSTS[inkCoverage] || 0.35
    const lamPerUnit = LAMINATION_COSTS[lamination] || 0

    // Material cost per single set
    const materialCostPerSet = (paperPerSheet + inkPerPage) * pageCount + lamPerUnit + extraConsumableCost
    const totalMaterialCost = materialCostPerSet * copies
    const totalJobCost = totalMaterialCost // direct COGS

    // Total selling price
    const subtotalSelling = pricePerSet * copies + laborFee
    const totalSellingPrice = Math.max(0, subtotalSelling)

    // Profit & Margin
    const totalProfit = totalSellingPrice - totalJobCost
    const marginPct = totalSellingPrice > 0 ? ((totalProfit / totalSellingPrice) * 100).toFixed(1) : '0.0'

    return {
      materialCostPerSet,
      totalJobCost,
      totalSellingPrice,
      totalProfit,
      marginPct,
      paperPerSheet,
      inkPerPage,
      lamPerUnit
    }
  }, [paperSize, inkCoverage, lamination, pageCount, copies, extraConsumableCost, pricePerSet, laborFee])

  // Send to POS Cart
  const handleSendToCart = (autoRedirect = false) => {
    const priceCents = Math.round(costing.totalSellingPrice * 100)
    const costCents = Math.round(costing.totalJobCost * 100)

    const itemName = `${jobTitle} (${pageCount}p × ${copies}c)${lamination !== 'NONE' ? ' + Lam' : ''}`

    // Add as custom item with accurate price and roll-up cost
    usePosCart.getState().addCustomItem(
      itemName,
      priceCents,
      copies > 1 ? 'sets' : 'job',
      1,
      costCents
    )

    toastSuccess(
      'Sent to POS Cart',
      `${itemName} added for ${money(priceCents)}`
    )

    // Log to recent jobs
    setRecentJobs((prev) => [
      {
        id: String(Date.now()),
        title: itemName,
        totalPriceC: priceCents,
        profitC: Math.round(costing.totalProfit * 100),
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      },
      ...prev.slice(0, 7)
    ])

    if (autoRedirect) {
      setPage('pos')
    }
  }

  const categoryList: Array<{ key: ServiceCategory; label: string; icon: React.ReactNode }> = [
    { key: 'PRINTING', label: 'Document Printing', icon: <Printer className="h-4 w-4" /> },
    { key: 'PHOTOCOPY_SCAN', label: 'Photocopy & Scan', icon: <Copy className="h-4 w-4" /> },
    { key: 'ID_PVC', label: 'ID Photo & PVC Cards', icon: <Contact className="h-4 w-4" /> },
    { key: 'LAMINATION', label: 'Lamination & Badges', icon: <Layers className="h-4 w-4" /> },
    { key: 'RESUME_TYPING', label: 'Resume & Encoding', icon: <FileText className="h-4 w-4" /> }
  ]

  const activePresets = PRESET_SERVICES.filter((p) => p.category === selectedCategory)

  return (
    <div className="p-6">
      <PageHeader
        title="Printing & Document Services Hub"
        subtitle="Automated cost calculator, print job specifier, and instant 1-click POS cart quoting"
        actions={
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleSendToCart(true)}
              className="btn-primary flex items-center gap-2 shadow-lg shadow-brand-500/20"
            >
              <ShoppingCart className="h-4 w-4" />
              <span>Quote & Go to POS ({money(Math.round(costing.totalSellingPrice * 100))})</span>
            </button>
          </div>
        }
      />

      {/* Main Grid: Left side Presets & Customizer; Right side Cost Engine & POS Push */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
        {/* Left Column: Preset Catalog & Job Specifier */}
        <div className="space-y-5 xl:col-span-8">
          {/* Category Tabs */}
          <div className="flex flex-wrap items-center gap-2 border-b border-ink-line pb-3">
            {categoryList.map((cat) => (
              <button
                key={cat.key}
                onClick={() => {
                  setSelectedCategory(cat.key)
                  const firstOfCat = PRESET_SERVICES.find((p) => p.category === cat.key)
                  if (firstOfCat) handleSelectPreset(firstOfCat)
                }}
                className={`flex items-center gap-2 rounded-lg px-3.5 py-2 text-xs font-semibold transition ${
                  selectedCategory === cat.key
                    ? 'bg-sky-500 text-ink-950 shadow-md font-bold'
                    : 'bg-ink-900/80 text-slate-300 hover:bg-ink-800 border border-ink-line'
                }`}
              >
                {cat.icon}
                <span>{cat.label}</span>
              </button>
            ))}
          </div>

          {/* Quick Presets Grid */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3">
            {activePresets.map((preset) => {
              const isSelected = selectedPreset.id === preset.id
              return (
                <button
                  key={preset.id}
                  onClick={() => handleSelectPreset(preset)}
                  className={`relative flex flex-col justify-between rounded-xl border p-3.5 text-left transition ${
                    isSelected
                      ? 'border-sky-500 bg-sky-500/10 ring-1 ring-sky-500'
                      : 'border-ink-line bg-ink-900/60 hover:border-slate-600 hover:bg-ink-850'
                  }`}
                >
                  {preset.badge && (
                    <span className="absolute right-2 top-2 rounded bg-sky-500/20 px-1.5 py-0.5 text-[10px] font-bold text-sky-300 border border-sky-500/30">
                      {preset.badge}
                    </span>
                  )}
                  <div>
                    <p className="text-sm font-semibold text-white pr-12">{preset.name}</p>
                    <p className="mt-1 text-xs text-slate-400 line-clamp-2">{preset.description}</p>
                  </div>
                  <div className="mt-3 flex items-center justify-between border-t border-ink-line/50 pt-2 text-xs">
                    <span className="font-mono text-slate-400">{preset.paperSize}</span>
                    <span className="font-bold text-sky-400">₱{preset.suggestedPricePerUnit}</span>
                  </div>
                </button>
              )
            })}
          </div>

          {/* Detailed Job Specifications Form */}
          <div className="rounded-xl border border-ink-line bg-ink-900/60 p-5 backdrop-blur">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-sky-400" />
                <h3 className="text-sm font-bold text-white">Customize Job Specifications</h3>
              </div>
              <span className="text-xs text-slate-400">Live Costing Active</span>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
              {/* Job Title */}
              <div className="sm:col-span-2 md:col-span-3">
                <label className="label">Job Title / Line Item Label</label>
                <input
                  value={jobTitle}
                  onChange={(e) => setJobTitle(e.target.value)}
                  className="input w-full font-medium text-white"
                  placeholder="e.g. A4 Color Print - School Project"
                />
              </div>

              {/* Paper / Material */}
              <div>
                <label className="label">Paper / Blank Media</label>
                <select
                  value={paperSize}
                  onChange={(e) => setPaperSize(e.target.value as PaperSize)}
                  className="input w-full text-xs font-medium"
                >
                  <option value="SHORT">Short Bond Paper (₱0.65)</option>
                  <option value="LONG">Long Bond Paper (₱0.75)</option>
                  <option value="A4">A4 Standard Bond (₱0.70)</option>
                  <option value="PHOTO_4R">4R Glossy Photo Paper (₱4.00)</option>
                  <option value="PHOTO_A4">A4 Glossy Photo Paper (₱6.50)</option>
                  <option value="PVC_CR80">CR80 Blank PVC Card (₱9.00)</option>
                  <option value="ID_CARD">Cardstock / Board (₱1.00)</option>
                </select>
              </div>

              {/* Ink Coverage */}
              <div>
                <label className="label">Ink Coverage Level</label>
                <select
                  value={inkCoverage}
                  onChange={(e) => setInkCoverage(e.target.value as InkCoverage)}
                  className="input w-full text-xs font-medium"
                >
                  <option value="BW_TEXT">Black & White Text (₱0.35/p)</option>
                  <option value="COLOR_MINIMAL">Minimal Color (₱1.25/p)</option>
                  <option value="COLOR_STANDARD">Standard Color Graphics (₱2.50/p)</option>
                  <option value="COLOR_PHOTO">Full Page Photo / Graphic (₱4.80/p)</option>
                </select>
              </div>

              {/* Lamination Finish */}
              <div>
                <label className="label">Lamination Seal</label>
                <select
                  value={lamination}
                  onChange={(e) => setLamination(e.target.value as LaminationSize)}
                  className="input w-full text-xs font-medium"
                >
                  <option value="NONE">None (No Lamination)</option>
                  <option value="ID">ID Card Size Pouch (₱1.80)</option>
                  <option value="SHORT">Short Bond Pouch (₱3.50)</option>
                  <option value="A4">A4 Standard Pouch (₱3.80)</option>
                  <option value="LONG">Long Legal Pouch (₱4.00)</option>
                </select>
              </div>

              {/* Page Count */}
              <div>
                <label className="label">Page Count per Set</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={1}
                    value={pageCount}
                    onChange={(e) => setPageCount(Math.max(1, parseInt(e.target.value, 10) || 1))}
                    className="input w-full text-sm font-bold"
                  />
                  <span className="text-xs text-slate-400">pages</span>
                </div>
              </div>

              {/* Copies / Sets Multiplier */}
              <div>
                <label className="label">Total Copies / Sets</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={1}
                    value={copies}
                    onChange={(e) => setCopies(Math.max(1, parseInt(e.target.value, 10) || 1))}
                    className="input w-full text-sm font-bold"
                  />
                  <span className="text-xs text-slate-400">copies</span>
                </div>
              </div>

              {/* Price per Set */}
              <div>
                <label className="label">Selling Rate per Set (₱)</label>
                <input
                  type="number"
                  min={0}
                  step={0.5}
                  value={pricePerSet}
                  onChange={(e) => setPricePerSet(Math.max(0, parseFloat(e.target.value) || 0))}
                  className="input w-full text-sm font-bold text-sky-400"
                />
              </div>

              {/* Labor / Encoding Fee */}
              <div>
                <label className="label">Labor / Typing / Rush Fee (₱)</label>
                <input
                  type="number"
                  min={0}
                  value={laborFee}
                  onChange={(e) => setLaborFee(Math.max(0, parseFloat(e.target.value) || 0))}
                  className="input w-full text-sm"
                  placeholder="0.00"
                />
              </div>

              {/* Extra Hardware / Accessory Cost */}
              <div>
                <label className="label">Extra Hardware Cost (₱)</label>
                <input
                  type="number"
                  min={0}
                  value={extraConsumableCost}
                  onChange={(e) => setExtraConsumableCost(Math.max(0, parseFloat(e.target.value) || 0))}
                  className="input w-full text-sm"
                  placeholder="e.g. clip, lanyard"
                />
              </div>

              {/* Notes */}
              <div>
                <label className="label">Customer / Order Note</label>
                <input
                  value={customerNotes}
                  onChange={(e) => setCustomerNotes(e.target.value)}
                  className="input w-full text-xs"
                  placeholder="e.g. Rush 3pm, matte finish"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Automated Costing Dashboard & Push to Cart */}
        <div className="space-y-5 xl:col-span-4">
          <div className="rounded-xl border border-sky-500/30 bg-gradient-to-b from-sky-950/40 to-ink-900/90 p-5 shadow-xl backdrop-blur">
            <div className="flex items-center justify-between border-b border-ink-line pb-3">
              <div className="flex items-center gap-2">
                <Coins className="h-5 w-5 text-sky-400" />
                <h3 className="text-base font-bold text-white">Live Costing Engine</h3>
              </div>
              <span className="rounded bg-sky-500/20 px-2 py-0.5 text-xs font-bold text-sky-300">
                {costing.marginPct}% Margin
              </span>
            </div>

            {/* Cost Breakdown */}
            <div className="mt-4 space-y-2.5 text-xs text-slate-300">
              <div className="flex justify-between">
                <span className="text-slate-400">Paper Consumables ({pageCount * copies} sheets):</span>
                <span className="font-mono">{money(Math.round(costing.paperPerSheet * pageCount * copies * 100))}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Ink Wear & Factor:</span>
                <span className="font-mono">{money(Math.round(costing.inkPerPage * pageCount * copies * 100))}</span>
              </div>
              {lamination !== 'NONE' && (
                <div className="flex justify-between">
                  <span className="text-slate-400">Lamination Film ({copies} pcs):</span>
                  <span className="font-mono">{money(Math.round(costing.lamPerUnit * copies * 100))}</span>
                </div>
              )}
              {extraConsumableCost > 0 && (
                <div className="flex justify-between">
                  <span className="text-slate-400">Extra Hardware / Accessories:</span>
                  <span className="font-mono">{money(Math.round(extraConsumableCost * copies * 100))}</span>
                </div>
              )}
              <div className="flex justify-between border-t border-ink-line/60 pt-2 font-medium">
                <span className="text-slate-300">Total Material Cost (COGS):</span>
                <span className="font-mono font-bold text-amber-300">{money(Math.round(costing.totalJobCost * 100))}</span>
              </div>
            </div>

            {/* Selling Price & Profit Highlight */}
            <div className="mt-5 rounded-lg border border-ink-line bg-ink-950/60 p-4">
              <div className="flex items-center justify-between">
                <span className="text-xs uppercase tracking-wider text-slate-400 font-semibold">Total Price Quoted</span>
                <span className="text-2xl font-black text-sky-400">
                  {money(Math.round(costing.totalSellingPrice * 100))}
                </span>
              </div>
              <div className="mt-2 flex items-center justify-between border-t border-ink-line/40 pt-2 text-xs">
                <span className="text-slate-400">Net Estimated Profit:</span>
                <span className="font-bold text-emerald-400">
                  +{money(Math.round(costing.totalProfit * 100))} ({costing.marginPct}%)
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="mt-5 space-y-2">
              <button
                onClick={() => handleSendToCart(false)}
                className="btn-primary w-full py-2.5 flex items-center justify-center gap-2 text-sm font-bold bg-sky-500 hover:bg-sky-400 text-ink-950 shadow-md"
              >
                <Plus className="h-4 w-4" />
                <span>Add Job to POS Cart</span>
              </button>
              <button
                onClick={() => handleSendToCart(true)}
                className="btn-ghost w-full py-2 flex items-center justify-center gap-2 text-xs text-sky-300 border border-sky-500/30 hover:bg-sky-500/10"
              >
                <span>Add and Go to POS Cashier</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          {/* Recent Dispatched Print Jobs */}
          {recentJobs.length > 0 && (
            <div className="rounded-xl border border-ink-line bg-ink-900/40 p-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                <span>Recently Quoted Jobs</span>
              </h4>
              <div className="space-y-2">
                {recentJobs.map((j) => (
                  <div
                    key={j.id}
                    className="flex items-center justify-between rounded-lg border border-ink-line/60 bg-ink-950/40 p-2 text-xs"
                  >
                    <div className="min-w-0 flex-1 pr-2">
                      <p className="truncate font-medium text-white">{j.title}</p>
                      <span className="text-[10px] text-slate-500">{j.time}</span>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-bold text-sky-400">{money(j.totalPriceC)}</p>
                      <p className="text-[10px] text-emerald-400 font-medium">+{money(j.profitC)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
