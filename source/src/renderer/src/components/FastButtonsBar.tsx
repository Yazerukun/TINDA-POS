import { useState, useEffect } from 'react'
import { Zap, SlidersHorizontal, Plus, Sparkles } from 'lucide-react'
import type { Product } from '@shared/types'
import { money } from '@shared/format'
import {
  type SpeedKeyItem,
  getStoredSpeedKeys,
  SPEED_KEY_COLORS,
  SPEED_KEYS_CHANGED_EVENT,
  saveSpeedKeys
} from '../utils/speedKeys'
import { ProductImage } from './ui/ProductImage'
import { CustomizeFastButtonsModal } from './CustomizeFastButtonsModal'
import { playScanBeep } from '../lib/barcodeScanner'
import { toastSuccess, toastError } from '../stores/toast'

interface FastButtonsBarProps {
  products: Product[]
  onAddToCart: (p: Product, qty?: number) => void
  onProductsChanged?: () => Promise<void>
}

export function FastButtonsBar({
  products,
  onAddToCart,
  onProductsChanged
}: FastButtonsBarProps): React.JSX.Element {
  const [keys, setKeys] = useState<SpeedKeyItem[]>(() => getStoredSpeedKeys())
  const [modalOpen, setModalOpen] = useState(false)
  const [provisioning, setProvisioning] = useState<string | null>(null)

  useEffect(() => {
    const handleUpdate = () => {
      setKeys(getStoredSpeedKeys())
    }
    window.addEventListener(SPEED_KEYS_CHANGED_EVENT, handleUpdate)
    return () => window.removeEventListener(SPEED_KEYS_CHANGED_EVENT, handleUpdate)
  }, [])

  const handleKeyClick = async (key: SpeedKeyItem) => {
    playScanBeep(1200, 0.05)

    // 1. Check for product matched by explicit ID
    let matched = key.productId ? products.find((p) => p.id === key.productId) : null

    // 2. Fallback: match by name case-insensitively
    if (!matched) {
      const cleanKeyName = key.name.trim().toLowerCase()
      matched = products.find((p) => p.name.trim().toLowerCase() === cleanKeyName)
    }

    if (matched) {
      onAddToCart(matched, key.default_qty || 1)
      return
    }

    // 3. If product does not yet exist in inventory, auto-provision on-the-fly!
    try {
      setProvisioning(key.id)
      const unit = key.unit_name?.trim() || 'pc'
      const newProduct = await window.api.products.create({
        name: key.name.trim(),
        sku: `FAST-${Date.now().toString(36).toUpperCase()}`,
        barcode: null,
        description: null,
        base_unit: unit,
        purchase_cost_c: Math.round(key.price_c * 0.7),
        default_price_c: key.price_c,
        initial_stock_base: 999,
        low_stock_threshold: 5,
        has_expiration: false,
        image_path: key.image_path || null,
        category_id: null,
        supplier_id: null,
        notes: null,
        units: [
          {
            name: unit,
            conversion_to_base: 1,
            barcode: null,
            selling_price_c: key.price_c,
            is_default: true
          }
        ]
      })

      // Update key with newly created productId for permanent linkage
      const updatedKeys = keys.map((k) => (k.id === key.id ? { ...k, productId: newProduct.id } : k))
      saveSpeedKeys(updatedKeys)
      setKeys(updatedKeys)

      if (onProductsChanged) {
        await onProductsChanged()
      }

      onAddToCart(newProduct, key.default_qty || 1)
      toastSuccess('Added to cart', `Provisioned "${key.name}" and added to cart.`)
    } catch (err) {
      toastError('Could not add fast item', String((err as Error)?.message || err))
    } finally {
      setProvisioning(null)
    }
  }

  return (
    <>
      <div className="mb-2 flex items-center gap-2 overflow-hidden rounded-xl border border-ink-line/80 bg-ink-900/80 p-1.5 shadow-sm">
        {/* Speed Keys Title Badge */}
        <div className="flex shrink-0 items-center gap-1.5 px-2 py-1 text-slate-400 select-none">
          <Zap className="h-4 w-4 text-amber-400 fill-amber-400/20" />
          <span className="hidden lg:inline text-[11px] font-extrabold uppercase tracking-wider text-slate-300">
            Fast Keys
          </span>
        </div>

        {/* Horizontal Speed Keys Carousel */}
        <div className="flex flex-1 items-center gap-1.5 overflow-x-auto py-0.5 scrollbar-thin">
          {keys.map((k) => {
            const colorMeta = SPEED_KEY_COLORS[k.color || 'cyan']
            const isBusy = provisioning === k.id

            return (
              <button
                key={k.id}
                type="button"
                disabled={isBusy}
                onClick={() => void handleKeyClick(k)}
                className={`group relative flex shrink-0 items-center gap-2 rounded-lg border px-2.5 py-1.5 transition-all text-left select-none ${colorMeta.card} ${
                  isBusy ? 'opacity-50 pointer-events-none' : ''
                }`}
                title={`Fast Add: ${k.name} (${money(k.price_c)})`}
              >
                {/* Visual Thumbnail */}
                {k.image_path ? (
                  <ProductImage
                    src={k.image_path}
                    alt={k.name}
                    className="h-7 w-7 rounded-md object-cover border border-white/10 shrink-0"
                  />
                ) : (
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-ink-800 text-sm shadow-inner">
                    {k.icon || '⚡'}
                  </span>
                )}

                {/* Details */}
                <div className="min-w-0 pr-1">
                  <div className="flex items-center gap-1">
                    <p className="max-w-[100px] truncate text-[11px] font-bold text-white group-hover:text-white">
                      {k.name}
                    </p>
                    {k.default_qty && k.default_qty > 1 && (
                      <span className="text-[9px] font-extrabold text-amber-300 bg-amber-400/10 px-1 rounded">
                        {k.default_qty}x
                      </span>
                    )}
                  </div>
                  <p className={`text-[11px] font-extrabold font-mono ${colorMeta.text}`}>
                    {money(k.price_c)}
                  </p>
                </div>
              </button>
            )
          })}
        </div>

        {/* Customize Button */}
        <button
          type="button"
          onClick={() => setModalOpen(true)}
          className="flex shrink-0 items-center gap-1 rounded-lg border border-ink-line bg-ink-800/80 px-2.5 py-1.5 text-[11px] font-bold text-slate-300 hover:border-slate-500 hover:text-white hover:bg-ink-750 transition-all active:scale-95 shadow-sm"
          title="Customize Fast Buttons (Speed Keys)"
        >
          <SlidersHorizontal className="h-3.5 w-3.5 text-brand-400" />
          <span className="hidden xl:inline">Customize</span>
        </button>
      </div>

      <CustomizeFastButtonsModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        currentKeys={keys}
        allProducts={products}
        onSave={(updated) => setKeys(updated)}
      />
    </>
  )
}
