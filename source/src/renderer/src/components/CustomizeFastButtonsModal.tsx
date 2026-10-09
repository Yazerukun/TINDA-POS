import { useState, useRef } from 'react'
import {
  X,
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  Upload,
  RotateCcw,
  Sparkles,
  Check,
  Package,
  SlidersHorizontal,
  Search
} from 'lucide-react'
import type { Product } from '@shared/types'
import { money } from '@shared/format'
import { Modal } from './ui/Modal'
import { ProductImage } from './ui/ProductImage'
import {
  type SpeedKeyItem,
  SPEED_KEY_COLORS,
  DEFAULT_SPEED_KEYS,
  saveSpeedKeys,
  resetSpeedKeysToDefault
} from '../utils/speedKeys'
import { toastSuccess, toastError } from '../stores/toast'

interface CustomizeFastButtonsModalProps {
  open: boolean
  onClose: () => void
  currentKeys: SpeedKeyItem[]
  allProducts: Product[]
  onSave: (keys: SpeedKeyItem[]) => void
}

const EMOJI_OPTIONS = ['🧊', '🚬', '🍬', '🛍️', '🥤', '☕', '🥚', '🍞', '🥪', '⚡', '⭐', '🏷️', '🔥', '🍜', '🍪', '🍫']

export function CustomizeFastButtonsModal({
  open,
  onClose,
  currentKeys,
  allProducts,
  onSave
}: CustomizeFastButtonsModalProps): React.JSX.Element | null {
  const [keys, setKeys] = useState<SpeedKeyItem[]>(currentKeys)
  const [selectedProductSearch, setSelectedProductSearch] = useState('')
  const [productDropdownOpen, setProductDropdownOpen] = useState(false)

  // New item form state
  const [name, setName] = useState('')
  const [pricePesos, setPricePesos] = useState('')
  const [unitName, setUnitName] = useState('pc')
  const [defaultQty, setDefaultQty] = useState('1')
  const [icon, setIcon] = useState('⚡')
  const [color, setColor] = useState<keyof typeof SPEED_KEY_COLORS>('cyan')
  const [imagePath, setImagePath] = useState<string | null>(null)
  const [linkedProductId, setLinkedProductId] = useState<number | null>(null)
  const [uploadingImage, setUploadingImage] = useState(false)

  const fileInputRef = useRef<HTMLInputElement>(null)

  if (!open) return null

  const handleSelectProduct = (p: Product) => {
    setName(p.name)
    setPricePesos((p.default_price_c / 100).toFixed(2))
    setUnitName(p.base_unit || 'pc')
    setImagePath(p.image_path || null)
    setLinkedProductId(p.id)
    setSelectedProductSearch(p.name)
    setProductDropdownOpen(false)
  }

  const handleImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) {
      toastError('Invalid file', 'Please select an image file (PNG, JPG, WebP).')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      toastError('File too large', 'Image must be under 5MB.')
      return
    }

    setUploadingImage(true)
    try {
      const reader = new FileReader()
      reader.onload = async () => {
        try {
          const dataUrl = reader.result as string
          const res = await window.api.products.saveImage({ name: file.name, dataUrl })
          setImagePath(res.filename)
          toastSuccess('Image uploaded for Speed Key')
        } catch (err) {
          toastError('Upload failed', String((err as Error)?.message || err))
        } finally {
          setUploadingImage(false)
        }
      }
      reader.onerror = () => {
        toastError('Read error', 'Failed to read image file.')
        setUploadingImage(false)
      }
      reader.readAsDataURL(file)
    } catch (err) {
      toastError('Upload failed', String((err as Error)?.message || err))
      setUploadingImage(false)
    }
  }

  const handleAddKey = () => {
    if (!name.trim()) {
      toastError('Name required', 'Please enter a name for the fast button.')
      return
    }
    const priceNum = parseFloat(pricePesos)
    if (isNaN(priceNum) || priceNum < 0) {
      toastError('Invalid price', 'Please enter a valid price in Pesos.')
      return
    }

    const newItem: SpeedKeyItem = {
      id: `speedkey-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`,
      name: name.trim(),
      price_c: Math.round(priceNum * 100),
      productId: linkedProductId,
      image_path: imagePath,
      icon,
      color,
      unit_name: unitName.trim() || 'pc',
      default_qty: Math.max(1, parseInt(defaultQty, 10) || 1)
    }

    const updated = [...keys, newItem]
    setKeys(updated)
    // Reset form
    setName('')
    setPricePesos('')
    setUnitName('pc')
    setDefaultQty('1')
    setImagePath(null)
    setLinkedProductId(null)
    setSelectedProductSearch('')
    toastSuccess('Speed Key added', `"${newItem.name}" added to bar.`)
  }

  const handleMove = (index: number, direction: 'up' | 'down') => {
    const target = direction === 'up' ? index - 1 : index + 1
    if (target < 0 || target >= keys.length) return
    const next = [...keys]
    const currentItem = next[index]
    const targetItem = next[target]
    if (!currentItem || !targetItem) return
    next[index] = targetItem
    next[target] = currentItem
    setKeys(next)
  }

  const handleDelete = (index: number) => {
    const item = keys[index]
    if (!item) return
    const next = keys.filter((_, i) => i !== index)
    setKeys(next)
    toastSuccess('Removed', `Removed "${item.name}" from Speed Keys.`)
  }

  const handleReset = () => {
    const def = resetSpeedKeysToDefault()
    setKeys(def)
    toastSuccess('Reset to defaults', 'Restored Yelo, Yosi, Candy, and Sando Bag speed keys.')
  }

  const handleSaveAndClose = () => {
    saveSpeedKeys(keys)
    onSave(keys)
    toastSuccess('Speed Keys saved', 'Your custom fast buttons are now active on the POS register.')
    onClose()
  }

  const filteredProducts = selectedProductSearch.trim()
    ? allProducts.filter((p) =>
        p.name.toLowerCase().includes(selectedProductSearch.toLowerCase()) ||
        (p.barcode && p.barcode.includes(selectedProductSearch))
      ).slice(0, 10)
    : []

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Customize POS Fast Buttons (Speed Keys)"
      maxWidth="max-w-2xl"
    >
      <div className="space-y-6">
        <div className="rounded-xl border border-brand-500/20 bg-brand-500/10 p-3.5 text-xs text-brand-200">
          <p className="font-bold flex items-center gap-1.5 text-brand-100">
            <Sparkles className="h-4 w-4 text-brand-400" />
            Fast Register Speed Keys
          </p>
          <p className="mt-1 text-slate-300">
            Speed keys allow cashiers to tap high-frequency items (like <strong>Yelo</strong>, <strong>Yosi</strong>, and <strong>Candy</strong>) with zero searching or scanning. You can link them directly to products, set custom colors, and upload your own photos.
          </p>
        </div>

        {/* Existing Keys Reorder & Manage List */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Active Speed Keys ({keys.length})
            </h4>
            <button
              type="button"
              onClick={handleReset}
              className="flex items-center gap-1 text-xs text-slate-400 hover:text-amber-300 transition-colors"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Reset to Defaults
            </button>
          </div>

          {keys.length === 0 ? (
            <div className="rounded-xl border border-dashed border-ink-line p-6 text-center text-xs text-slate-400">
              No speed keys configured. Add one below or click "Reset to Defaults".
            </div>
          ) : (
            <div className="space-y-2 max-h-56 overflow-y-auto pr-1 scrollbar-thin">
              {keys.map((k, idx) => {
                const colorMeta = SPEED_KEY_COLORS[k.color || 'cyan']
                return (
                  <div
                    key={k.id}
                    className="flex items-center justify-between gap-3 rounded-lg border border-ink-line bg-ink-850 px-3 py-2 text-xs transition-all hover:border-slate-600"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-ink-750 text-[10px] font-bold text-slate-400">
                        {idx + 1}
                      </span>
                      {k.image_path ? (
                        <ProductImage
                          src={k.image_path}
                          alt={k.name}
                          className="h-8 w-8 rounded-lg shrink-0 object-cover"
                        />
                      ) : (
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-ink-750 text-base">
                          {k.icon || '⚡'}
                        </span>
                      )}
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-white truncate">{k.name}</span>
                          <span
                            className={`inline-block px-1.5 py-0.2 rounded text-[10px] font-semibold border ${colorMeta.badge}`}
                          >
                            {colorMeta.name}
                          </span>
                        </div>
                        <p className="text-[11px] text-emerald-400 font-mono font-medium">
                          {money(k.price_c)} <span className="text-slate-400 font-normal">/ {k.unit_name || 'pc'}</span>
                          {k.default_qty && k.default_qty > 1 && (
                            <span className="ml-1 text-slate-400">({k.default_qty}x per tap)</span>
                          )}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleMove(idx, 'up')}
                        disabled={idx === 0}
                        className="rounded p-1 text-slate-400 hover:bg-ink-700 hover:text-white disabled:opacity-30 disabled:pointer-events-none"
                        title="Move Up"
                      >
                        <ArrowUp className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleMove(idx, 'down')}
                        disabled={idx === keys.length - 1}
                        className="rounded p-1 text-slate-400 hover:bg-ink-700 hover:text-white disabled:opacity-30 disabled:pointer-events-none"
                        title="Move Down"
                      >
                        <ArrowDown className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(idx)}
                        className="rounded p-1 text-rose-400 hover:bg-rose-500/20 transition-colors ml-1"
                        title="Delete Speed Key"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Add New Speed Key Form */}
        <div className="rounded-xl border border-ink-line bg-ink-850 p-4 space-y-4">
          <h4 className="text-xs font-bold uppercase tracking-wider text-white flex items-center gap-1.5">
            <Plus className="h-3.5 w-3.5 text-brand-400" />
            Add New Fast Button
          </h4>

          {/* Quick autofill from inventory search */}
          <div className="relative">
            <label className="block text-[11px] font-medium text-slate-300 mb-1">
              Link from Existing Product (Optional Search)
            </label>
            <div className="relative">
              <input
                type="text"
                placeholder="Type product name or barcode to auto-fill..."
                value={selectedProductSearch}
                onChange={(e) => {
                  setSelectedProductSearch(e.target.value)
                  setProductDropdownOpen(true)
                }}
                onFocus={() => setProductDropdownOpen(true)}
                className="w-full rounded-lg border border-ink-line bg-ink-900 px-3 py-2 text-xs text-white placeholder-slate-500 focus:border-brand-500 focus:outline-none"
              />
              <Search className="absolute right-3 top-2.5 h-3.5 w-3.5 text-slate-500 pointer-events-none" />
            </div>

            {productDropdownOpen && filteredProducts.length > 0 && (
              <div className="absolute z-20 mt-1 max-h-44 w-full overflow-y-auto rounded-lg border border-ink-line bg-ink-900 shadow-xl scrollbar-thin">
                {filteredProducts.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => handleSelectProduct(p)}
                    className="flex w-full items-center justify-between px-3 py-2 text-left text-xs text-slate-200 hover:bg-ink-800 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <ProductImage src={p.image_path} alt={p.name} className="h-6 w-6 rounded" />
                      <span className="font-semibold">{p.name}</span>
                    </div>
                    <span className="text-emerald-400 font-mono">{money(p.default_price_c)}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-medium text-slate-300 mb-1">
                Button Label / Name *
              </label>
              <input
                type="text"
                placeholder="e.g. Yelo, Marlboro Red"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-lg border border-ink-line bg-ink-900 px-3 py-2 text-xs text-white placeholder-slate-500 focus:border-brand-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-[11px] font-medium text-slate-300 mb-1">
                Selling Price (₱) *
              </label>
              <input
                type="number"
                step="0.25"
                placeholder="e.g. 5.00"
                value={pricePesos}
                onChange={(e) => setPricePesos(e.target.value)}
                className="w-full rounded-lg border border-ink-line bg-ink-900 px-3 py-2 text-xs text-white placeholder-slate-500 focus:border-brand-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-[11px] font-medium text-slate-300 mb-1">
                Unit / Multiplier per Tap
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="pc/bag/stick"
                  value={unitName}
                  onChange={(e) => setUnitName(e.target.value)}
                  className="w-2/3 rounded-lg border border-ink-line bg-ink-900 px-3 py-2 text-xs text-white placeholder-slate-500 focus:border-brand-500 focus:outline-none"
                />
                <input
                  type="number"
                  min="1"
                  placeholder="1x"
                  value={defaultQty}
                  onChange={(e) => setDefaultQty(e.target.value)}
                  className="w-1/3 rounded-lg border border-ink-line bg-ink-900 px-2 py-2 text-xs text-center text-white placeholder-slate-500 focus:border-brand-500 focus:outline-none"
                  title="Quantity added per tap"
                />
              </div>
            </div>
          </div>

          {/* Color & Icon Selection */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div>
              <label className="block text-[11px] font-medium text-slate-300 mb-1">
                Accent Theme Color
              </label>
              <div className="flex flex-wrap gap-1.5">
                {(Object.keys(SPEED_KEY_COLORS) as Array<keyof typeof SPEED_KEY_COLORS>).map((cKey) => {
                  const meta = SPEED_KEY_COLORS[cKey]
                  const isSelected = color === cKey
                  return (
                    <button
                      key={cKey}
                      type="button"
                      onClick={() => setColor(cKey)}
                      className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold border transition-all ${
                        isSelected
                          ? `${meta.badge} ring-2 ring-brand-400 scale-105`
                          : 'border-ink-line bg-ink-900 text-slate-400 hover:text-white'
                      }`}
                    >
                      <span className={`h-2 w-2 rounded-full ${meta.dot}`} />
                      {meta.name.split(' ')[0]}
                    </button>
                  )
                })}
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-medium text-slate-300 mb-1">
                Emoji Icon (If no picture)
              </label>
              <div className="flex flex-wrap gap-1 max-h-20 overflow-y-auto p-1 bg-ink-900 rounded-lg border border-ink-line scrollbar-thin">
                {EMOJI_OPTIONS.map((e) => (
                  <button
                    key={e}
                    type="button"
                    onClick={() => setIcon(e)}
                    className={`h-7 w-7 rounded flex items-center justify-center text-base transition-all ${
                      icon === e ? 'bg-brand-500/30 ring-2 ring-brand-400 scale-110' : 'hover:bg-ink-800'
                    }`}
                  >
                    {e}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Picture Upload */}
          <div className="pt-2 border-t border-ink-line/60 flex items-center justify-between">
            <div className="flex items-center gap-3">
              {imagePath ? (
                <div className="relative">
                  <ProductImage
                    src={imagePath}
                    alt="Preview"
                    className="h-10 w-10 rounded-lg object-cover border border-brand-500/50"
                  />
                  <button
                    type="button"
                    onClick={() => setImagePath(null)}
                    className="absolute -top-1.5 -right-1.5 rounded-full bg-rose-600 text-white p-0.5 hover:bg-rose-500"
                    title="Remove custom photo"
                  >
                    <X className="h-2.5 w-2.5" />
                  </button>
                </div>
              ) : (
                <div className="h-10 w-10 rounded-lg border border-dashed border-ink-line flex items-center justify-center text-slate-500">
                  <Package className="h-5 w-5" />
                </div>
              )}
              <div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  className="hidden"
                  onChange={handleImageFileChange}
                />
                <button
                  type="button"
                  disabled={uploadingImage}
                  onClick={() => fileInputRef.current?.click()}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-ink-line bg-ink-900 px-3 py-1.5 text-xs font-semibold text-slate-200 hover:bg-ink-800 hover:text-white transition-colors"
                >
                  <Upload className="h-3.5 w-3.5 text-brand-400" />
                  {uploadingImage ? 'Uploading...' : imagePath ? 'Change Photo' : 'Upload Custom Photo'}
                </button>
                <p className="text-[10px] text-slate-500 mt-0.5">PNG, JPG, WebP up to 5MB</p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleAddKey}
              className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-md hover:bg-emerald-500 active:scale-95 transition-all"
            >
              <Plus className="h-4 w-4" />
              Add to Speed Keys
            </button>
          </div>
        </div>

        {/* Modal Actions */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-ink-line">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-ink-line px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-ink-800 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSaveAndClose}
            className="inline-flex items-center gap-1.5 rounded-lg bg-brand-600 px-5 py-2 text-xs font-bold text-white shadow-lg hover:bg-brand-500 active:scale-95 transition-all"
          >
            <Check className="h-4 w-4" />
            Save & Activate
          </button>
        </div>
      </div>
    </Modal>
  )
}
