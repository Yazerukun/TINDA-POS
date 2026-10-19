import { useState, useRef, useEffect, useCallback } from 'react'
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
  Search,
  Pencil,
  Link as LinkIcon,
  Unlink,
  Barcode,
  Loader2,
  CheckCircle2
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
  const [editingKeyId, setEditingKeyId] = useState<string | null>(null)

  // Live database product search states
  const [searchQuery, setSearchQuery] = useState('')
  const [dbProducts, setDbProducts] = useState<Product[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [productDropdownOpen, setProductDropdownOpen] = useState(false)
  const [linkedProduct, setLinkedProduct] = useState<Product | null>(null)

  // New item / editing form state
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
  const formRef = useRef<HTMLDivElement>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)

  // Synchronize keys whenever modal opens or currentKeys change
  useEffect(() => {
    if (open) {
      setKeys(currentKeys)
      setEditingKeyId(null)
      resetForm()
    }
  }, [open, currentKeys])

  // Safely search products via IPC with robust fallback to allProducts
  const executeSearch = useCallback(async (term: string) => {
    setIsSearching(true)
    try {
      if (typeof window !== 'undefined' && window.api?.products?.search) {
        const res = await window.api.products.search(term.trim(), { status: 'ACTIVE', limit: 50 })
        setDbProducts(res.rows || [])
        return
      }
    } catch {
      // IPC fallback
    }

    // In-memory fallback
    const q = term.trim().toLowerCase()
    if (!q) {
      setDbProducts(allProducts.slice(0, 50))
    } else {
      const filtered = allProducts.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          (p.barcode && p.barcode.includes(q)) ||
          (p.sku && p.sku.toLowerCase().includes(q))
      )
      setDbProducts(filtered.slice(0, 50))
    }
    setIsSearching(false)
  }, [allProducts])

  // Load initial active items on open
  useEffect(() => {
    if (!open) return
    let active = true
    const init = async () => {
      setIsSearching(true)
      try {
        if (typeof window !== 'undefined' && window.api?.products?.search) {
          const res = await window.api.products.search('', { status: 'ACTIVE', limit: 50 })
          if (active) setDbProducts(res.rows || [])
        } else {
          if (active) setDbProducts(allProducts.slice(0, 50))
        }
      } catch {
        if (active) setDbProducts(allProducts.slice(0, 50))
      } finally {
        if (active) setIsSearching(false)
      }
    }
    void init()
    return () => {
      active = false
    }
  }, [open, allProducts])

  // Debounced live search as user types or scans barcode
  useEffect(() => {
    if (!open) return
    const timer = setTimeout(() => {
      void executeSearch(searchQuery)
    }, 150)
    return () => clearTimeout(timer)
  }, [searchQuery, open, executeSearch])

  // Fetch full linked product info when linkedProductId is present
  useEffect(() => {
    if (!linkedProductId) {
      setLinkedProduct(null)
      return
    }

    let active = true
    const fetchLinked = async () => {
      try {
        if (typeof window !== 'undefined' && window.api?.products?.get) {
          const p = await window.api.products.get(linkedProductId)
          if (active && p) {
            setLinkedProduct(p)
            return
          }
        }
      } catch {
        // Fallback
      }
      const local = allProducts.find((p) => p.id === linkedProductId) || null
      if (active) setLinkedProduct(local)
    }

    void fetchLinked()
    return () => {
      active = false
    }
  }, [linkedProductId, allProducts])

  if (!open) return null

  const resetForm = () => {
    setName('')
    setPricePesos('')
    setUnitName('pc')
    setDefaultQty('1')
    setIcon('⚡')
    setColor('cyan')
    setImagePath(null)
    setLinkedProductId(null)
    setLinkedProduct(null)
    setSearchQuery('')
    setProductDropdownOpen(false)
  }

  const handleSelectProduct = (p: Product) => {
    setName(p.name)
    setPricePesos((p.default_price_c / 100).toFixed(2))
    setUnitName(p.base_unit || 'pc')
    setImagePath(p.image_path || null)
    setLinkedProductId(p.id)
    setLinkedProduct(p)
    setSearchQuery('')
    setProductDropdownOpen(false)
    toastSuccess('Product linked', `Linked to "${p.name}" (${money(p.default_price_c)})`)
  }

  const handleUnlink = () => {
    setLinkedProductId(null)
    setLinkedProduct(null)
    toastSuccess('Unlinked', 'Fast button is now a custom speed key without inventory tracking.')
  }

  const handleStartEdit = (key: SpeedKeyItem) => {
    setEditingKeyId(key.id)
    setName(key.name)
    setPricePesos((key.price_c / 100).toFixed(2))
    setUnitName(key.unit_name || 'pc')
    setDefaultQty(String(key.default_qty || 1))
    setIcon(key.icon || '⚡')
    setColor((key.color as keyof typeof SPEED_KEY_COLORS) || 'cyan')
    setImagePath(key.image_path || null)
    setLinkedProductId(key.productId || null)
    setSearchQuery('')
    setProductDropdownOpen(false)

    // Smooth scroll to editor form
    formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
  }

  const handleCancelEdit = () => {
    setEditingKeyId(null)
    resetForm()
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

  const handleSaveOrAddKey = () => {
    if (!name.trim()) {
      toastError('Name required', 'Please enter a name for the fast button.')
      return
    }
    const priceNum = parseFloat(pricePesos)
    if (isNaN(priceNum) || priceNum < 0) {
      toastError('Invalid price', 'Please enter a valid price in Pesos.')
      return
    }

    if (editingKeyId) {
      // Update existing key
      const updated = keys.map((k) =>
        k.id === editingKeyId
          ? {
              ...k,
              name: name.trim(),
              price_c: Math.round(priceNum * 100),
              productId: linkedProductId,
              image_path: imagePath,
              icon,
              color,
              unit_name: unitName.trim() || 'pc',
              default_qty: Math.max(1, parseInt(defaultQty, 10) || 1)
            }
          : k
      )
      setKeys(updated)
      setEditingKeyId(null)
      resetForm()
      toastSuccess('Speed Key updated', `"${name.trim()}" updated successfully.`)
    } else {
      // Add new key
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
      setKeys([...keys, newItem])
      resetForm()
      toastSuccess('Speed Key added', `"${newItem.name}" added to bar.`)
    }
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
    if (editingKeyId === item.id) {
      handleCancelEdit()
    }
    const next = keys.filter((_, i) => i !== index)
    setKeys(next)
    toastSuccess('Removed', `Removed "${item.name}" from Speed Keys.`)
  }

  const handleReset = () => {
    const def = resetSpeedKeysToDefault()
    setKeys(def)
    handleCancelEdit()
    toastSuccess('Reset to defaults', 'Restored default Yelo, Yosi, Candy, and Sando Bag speed keys.')
  }

  const handleSaveAndClose = () => {
    saveSpeedKeys(keys)
    onSave(keys)
    toastSuccess('Speed Keys saved', 'Your custom fast buttons are now active on the POS register.')
    onClose()
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Customize POS Fast Buttons (Speed Keys)"
      maxWidth="max-w-2xl"
    >
      <div className="space-y-5">
        {/* Banner Info */}
        <div className="rounded-xl border border-brand-500/20 bg-brand-500/10 p-3.5 text-xs text-brand-200">
          <p className="font-bold flex items-center gap-1.5 text-brand-100">
            <Sparkles className="h-4 w-4 text-brand-400" />
            Fast Register Speed Keys & Inventory Linker
          </p>
          <p className="mt-1 text-slate-300 leading-relaxed">
            Speed keys allow cashiers to tap high-frequency items (like <strong>Yelo</strong>, <strong>Yosi</strong>, and <strong>Candy</strong>) with zero searching or scanning. You can link buttons directly to any product in your entire inventory, customize colors, set multipliers per tap, and upload photos.
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
                const isCurrentlyEditing = editingKeyId === k.id

                return (
                  <div
                    key={k.id}
                    className={`flex items-center justify-between gap-3 rounded-lg border px-3 py-2 text-xs transition-all ${
                      isCurrentlyEditing
                        ? 'border-brand-500 bg-brand-500/15 ring-1 ring-brand-500/50 shadow-md'
                        : 'border-ink-line bg-ink-850 hover:border-slate-600'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-ink-750 text-[10px] font-bold text-slate-400">
                        {idx + 1}
                      </span>
                      {k.image_path ? (
                        <ProductImage
                          src={k.image_path}
                          alt={k.name}
                          className="h-8 w-8 rounded-lg shrink-0 object-cover border border-white/10"
                        />
                      ) : (
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-ink-750 text-base">
                          {k.icon || '⚡'}
                        </span>
                      )}
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-bold text-white truncate">{k.name}</span>
                          <span
                            className={`inline-block px-1.5 py-0.2 rounded text-[10px] font-semibold border ${colorMeta.badge}`}
                          >
                            {colorMeta.name}
                          </span>
                          {k.productId ? (
                            <span className="inline-flex items-center gap-0.5 text-[10px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-1.5 py-0.2 rounded font-medium">
                              <LinkIcon className="h-2.5 w-2.5" />
                              Linked #{k.productId}
                            </span>
                          ) : (
                            <span className="text-[10px] text-slate-500">Custom</span>
                          )}
                        </div>
                        <p className="text-[11px] text-emerald-400 font-mono font-medium">
                          {money(k.price_c)}{' '}
                          <span className="text-slate-400 font-normal">/ {k.unit_name || 'pc'}</span>
                          {k.default_qty && k.default_qty > 1 && (
                            <span className="ml-1 text-amber-300 font-bold">({k.default_qty}x per tap)</span>
                          )}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleStartEdit(k)}
                        className={`rounded p-1.5 transition-colors ${
                          isCurrentlyEditing
                            ? 'bg-brand-500 text-white'
                            : 'text-slate-400 hover:bg-ink-700 hover:text-brand-300'
                        }`}
                        title="Edit & Re-link Fast Button"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleMove(idx, 'up')}
                        disabled={idx === 0}
                        className="rounded p-1.5 text-slate-400 hover:bg-ink-700 hover:text-white disabled:opacity-30 disabled:pointer-events-none"
                        title="Move Up"
                      >
                        <ArrowUp className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleMove(idx, 'down')}
                        disabled={idx === keys.length - 1}
                        className="rounded p-1.5 text-slate-400 hover:bg-ink-700 hover:text-white disabled:opacity-30 disabled:pointer-events-none"
                        title="Move Down"
                      >
                        <ArrowDown className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(idx)}
                        className="rounded p-1.5 text-rose-400 hover:bg-rose-500/20 transition-colors ml-0.5"
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

        {/* Add / Edit Speed Key Form */}
        <div
          ref={formRef}
          className={`rounded-xl border p-4 space-y-4 transition-all ${
            editingKeyId
              ? 'border-brand-500/60 bg-ink-850 shadow-lg ring-1 ring-brand-500/30'
              : 'border-ink-line bg-ink-850'
          }`}
        >
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold uppercase tracking-wider text-white flex items-center gap-1.5">
              {editingKeyId ? (
                <>
                  <Pencil className="h-3.5 w-3.5 text-amber-400" />
                  <span className="text-amber-300">Edit Fast Button:</span>
                  <span className="text-white max-w-[200px] truncate">"{name || 'Selected Key'}"</span>
                </>
              ) : (
                <>
                  <Plus className="h-3.5 w-3.5 text-brand-400" />
                  <span>Add New Fast Button</span>
                </>
              )}
            </h4>
            {editingKeyId && (
              <button
                type="button"
                onClick={handleCancelEdit}
                className="text-xs font-semibold text-slate-400 hover:text-white transition-colors flex items-center gap-1"
              >
                <X className="h-3.5 w-3.5" />
                Cancel Edit
              </button>
            )}
          </div>

          {/* Real-time Full Inventory Search & Auto-linker */}
          <div className="relative">
            <div className="flex items-center justify-between mb-1">
              <label className="block text-[11px] font-medium text-slate-300">
                Link from Store Inventory (Search by Name, Barcode, or SKU)
              </label>
              {dbProducts.length > 0 && (
                <span className="text-[10px] text-slate-400">
                  {dbProducts.length} items found
                </span>
              )}
            </div>

            <div className="relative">
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Type product name, barcode, or SKU to search store..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value)
                  setProductDropdownOpen(true)
                }}
                onFocus={() => setProductDropdownOpen(true)}
                className="w-full rounded-lg border border-ink-line bg-ink-900 px-3 py-2 text-xs text-white placeholder-slate-500 focus:border-brand-500 focus:outline-none pr-8"
              />
              <div className="absolute right-3 top-2.5 flex items-center gap-1 pointer-events-none">
                {isSearching ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-brand-400" />
                ) : (
                  <Search className="h-3.5 w-3.5 text-slate-500" />
                )}
              </div>
            </div>

            {/* Live Search Dropdown */}
            {productDropdownOpen && (
              <div className="absolute z-30 mt-1 max-h-56 w-full overflow-y-auto rounded-lg border border-ink-line bg-ink-900 shadow-2xl scrollbar-thin">
                <div className="sticky top-0 bg-ink-950/95 px-3 py-1.5 border-b border-ink-line flex items-center justify-between text-[10px] text-slate-400 z-10 backdrop-blur-sm">
                  <span>
                    {searchQuery.trim()
                      ? `Searching: "${searchQuery}"`
                      : 'Store Catalog (Tap to link & auto-fill)'}
                  </span>
                  <button
                    type="button"
                    onClick={() => setProductDropdownOpen(false)}
                    className="hover:text-white"
                  >
                    Close
                  </button>
                </div>

                {dbProducts.length === 0 ? (
                  <div className="p-4 text-center text-xs text-slate-400">
                    {isSearching ? (
                      <span className="flex items-center justify-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin text-brand-400" />
                        Searching store inventory...
                      </span>
                    ) : (
                      <span>
                        No products found matching "{searchQuery}". You can create a custom non-inventory button below.
                      </span>
                    )}
                  </div>
                ) : (
                  dbProducts.map((p) => {
                    const isSelected = linkedProductId === p.id
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => handleSelectProduct(p)}
                        className={`flex w-full items-center justify-between px-3 py-2 text-left text-xs transition-colors border-b border-ink-line/40 last:border-0 ${
                          isSelected ? 'bg-brand-500/20 text-white' : 'text-slate-200 hover:bg-ink-800'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0 pr-2">
                          <ProductImage
                            src={p.image_path}
                            alt={p.name}
                            className="h-7 w-7 rounded object-cover border border-white/10 shrink-0"
                          />
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="font-semibold truncate text-white">{p.name}</span>
                              {isSelected && (
                                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                              )}
                            </div>
                            <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-0.5">
                              {p.barcode && (
                                <span className="inline-flex items-center gap-0.5 font-mono text-slate-300">
                                  <Barcode className="h-2.5 w-2.5 text-slate-400" />
                                  {p.barcode}
                                </span>
                              )}
                              <span>
                                Stock:{' '}
                                <strong
                                  className={p.stock > 0 ? 'text-emerald-400 font-mono' : 'text-rose-400 font-mono'}
                                >
                                  {p.stock} {p.base_unit || 'pc'}
                                </strong>
                              </span>
                            </div>
                          </div>
                        </div>

                        <span className="text-emerald-400 font-mono font-bold shrink-0">
                          {money(p.default_price_c)}
                        </span>
                      </button>
                    )
                  })
                )}
              </div>
            )}
          </div>

          {/* Linked Product Banner */}
          {linkedProduct && (
            <div className="flex items-center justify-between gap-3 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-2.5 text-xs animate-in fade-in">
              <div className="flex items-center gap-2.5 min-w-0">
                <ProductImage
                  src={linkedProduct.image_path}
                  alt={linkedProduct.name}
                  className="h-8 w-8 rounded-md object-cover border border-emerald-500/40 shrink-0"
                />
                <div className="min-w-0">
                  <p className="font-bold text-white truncate flex items-center gap-1.5">
                    <LinkIcon className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                    <span>Linked to Inventory:</span>
                    <span className="text-emerald-300 font-bold">{linkedProduct.name}</span>
                  </p>
                  <p className="text-[11px] text-slate-300 mt-0.5 flex items-center gap-2 flex-wrap">
                    {linkedProduct.barcode && (
                      <span className="font-mono text-slate-400">Barcode: {linkedProduct.barcode}</span>
                    )}
                    <span>
                      Stock:{' '}
                      <strong className={linkedProduct.stock > 0 ? 'text-emerald-400' : 'text-rose-400'}>
                        {linkedProduct.stock} {linkedProduct.base_unit}
                      </strong>
                    </span>
                    <span>
                      Original Price:{' '}
                      <strong className="text-white font-mono">{money(linkedProduct.default_price_c)}</strong>
                    </span>
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleUnlink}
                className="flex shrink-0 items-center gap-1 rounded-md border border-rose-500/30 bg-rose-500/10 px-2.5 py-1 text-xs font-semibold text-rose-300 hover:bg-rose-500/20 transition-colors"
                title="Unlink product (keep as custom button)"
              >
                <Unlink className="h-3.5 w-3.5" />
                Unlink
              </button>
            </div>
          )}

          {/* Form Inputs: Name, Price, Unit, Multiplier */}
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

          {/* Picture Upload & Action Button */}
          <div className="pt-2 border-t border-ink-line/60 flex items-center justify-between flex-wrap gap-3">
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
                    className="absolute -top-1.5 -right-1.5 rounded-full bg-rose-600 text-white p-0.5 hover:bg-rose-500 shadow-md"
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

            <div className="flex items-center gap-2">
              {editingKeyId && (
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  className="rounded-lg border border-ink-line px-3 py-2 text-xs font-semibold text-slate-300 hover:bg-ink-800 transition-colors"
                >
                  Cancel Edit
                </button>
              )}
              <button
                type="button"
                onClick={handleSaveOrAddKey}
                className={`inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs font-bold text-white shadow-md active:scale-95 transition-all ${
                  editingKeyId
                    ? 'bg-amber-600 hover:bg-amber-500 shadow-amber-900/30'
                    : 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-900/30'
                }`}
              >
                {editingKeyId ? (
                  <>
                    <Check className="h-4 w-4" />
                    Update Fast Button
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4" />
                    Add to Speed Keys
                  </>
                )}
              </button>
            </div>
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
