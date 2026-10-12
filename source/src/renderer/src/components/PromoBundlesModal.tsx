import { useState, useEffect, useMemo } from 'react'
import {
  Sparkles,
  Plus,
  Trash2,
  X,
  ShoppingCart,
  Package,
  Search,
  Edit3,
  AlertTriangle,
  CheckCircle2,
  Layers
} from 'lucide-react'
import { Modal } from './ui/Modal'
import { money } from '@shared/format'
import { toastSuccess, toastError } from '../stores/toast'
import {
  getStoredPromoBundles,
  savePromoBundles,
  getPromoBundleInventoryStatus,
  evaluateCartPromos,
  type PromoBundle,
  type PromoBundleItem,
  type PromoType,
  DEFAULT_PROMO_BUNDLES
} from '../utils/promoBundles'
import { usePosCart } from '../pages/POS'
import type { Product } from '@shared/types'

interface PromoBundlesModalProps {
  open: boolean
  onClose: () => void
  products: Product[]
  onProductsChanged?: () => void | Promise<void>
}

export function PromoBundlesModal({
  open,
  onClose,
  products,
  onProductsChanged
}: PromoBundlesModalProps): React.JSX.Element | null {
  const [bundles, setBundles] = useState<PromoBundle[]>(() => getStoredPromoBundles())
  const [creating, setCreating] = useState(false)
  const [editingBundleId, setEditingBundleId] = useState<string | null>(null)
  const [savingSync, setSavingSync] = useState(false)

  // Builder form state
  const [newName, setNewName] = useState('')
  const [newType, setNewType] = useState<PromoType>('FIXED_COMBO')
  const [newPricePesos, setNewPricePesos] = useState('50')
  const [newDesc, setNewDesc] = useState('')
  const [newBadge, setNewBadge] = useState('Bundle Deal')
  const [selectedItems, setSelectedItems] = useState<PromoBundleItem[]>([])
  const [minQuantity, setMinQuantity] = useState('3')
  const [syncToInventoryBom, setSyncToInventoryBom] = useState(true)
  const [inventorySearch, setInventorySearch] = useState('')

  useEffect(() => {
    if (open) {
      setBundles(getStoredPromoBundles())
    }
  }, [open])

  // Eligible inventory items to combine (standard/weighted items in Inventory)
  const combineCandidates = useMemo(() => {
    const q = inventorySearch.trim().toLowerCase()
    const base = products.filter((p) => p.status === 'ACTIVE' && p.item_type !== 'COMPOSITE')
    if (!q) return base.slice(0, 40)
    return base
      .filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.sku.toLowerCase().includes(q) ||
          (p.barcode && p.barcode.toLowerCase().includes(q))
      )
      .slice(0, 40)
  }, [products, inventorySearch])

  // Live preview of the bundle currently being created/edited
  const draftBundle = useMemo<PromoBundle>(() => {
    const priceC = Math.max(0, Math.round((parseFloat(newPricePesos) || 0) * 100))
    const firstItem = selectedItems[0]
    return {
      id: editingBundleId || 'draft',
      name: newName.trim() || 'Draft Promo Bundle',
      type: newType,
      bundle_price_c: priceC,
      is_active: true,
      description: newDesc.trim() || 'Combined inventory promo package',
      badge: newBadge.trim() || undefined,
      items: newType === 'FIXED_COMBO' ? selectedItems : [],
      target_product_id: newType === 'VOLUME_TIER' ? firstItem?.product_id : undefined,
      target_name_keyword:
        newType === 'VOLUME_TIER'
          ? firstItem?.product_name || firstItem?.name_keyword || ''
          : undefined,
      min_quantity: newType === 'VOLUME_TIER' ? Math.max(2, parseInt(minQuantity, 10) || 3) : undefined
    }
  }, [editingBundleId, newName, newType, newPricePesos, newDesc, newBadge, selectedItems, minQuantity])

  const draftStatus = useMemo(
    () => getPromoBundleInventoryStatus(draftBundle, products),
    [draftBundle, products]
  )

  if (!open) return null

  const resetForm = () => {
    setCreating(false)
    setEditingBundleId(null)
    setNewName('')
    setNewType('FIXED_COMBO')
    setNewPricePesos('50')
    setNewDesc('')
    setNewBadge('Bundle Deal')
    setSelectedItems([])
    setMinQuantity('3')
    setInventorySearch('')
  }

  const startCreate = () => {
    resetForm()
    setCreating(true)
  }

  const startEdit = (bundle: PromoBundle) => {
    setEditingBundleId(bundle.id)
    setNewName(bundle.name)
    setNewType(bundle.type)
    setNewPricePesos((bundle.bundle_price_c / 100).toFixed(2).replace(/\.00$/, ''))
    setNewDesc(bundle.description || '')
    setNewBadge(bundle.badge || '')
    if (bundle.type === 'VOLUME_TIER') {
      const status = getPromoBundleInventoryStatus(bundle, products)
      const comp = status.components[0]
      setSelectedItems(
        comp?.product
          ? [
              {
                product_id: comp.product.id,
                product_name: comp.product.name,
                sku: comp.product.sku,
                unit_name: comp.product.base_unit,
                name_keyword: comp.product.name,
                quantity: bundle.min_quantity || 3,
                unit_price_c: comp.product.default_price_c
              }
            ]
          : bundle.target_name_keyword
          ? [{ name_keyword: bundle.target_name_keyword, quantity: bundle.min_quantity || 3 }]
          : []
      )
      setMinQuantity(String(bundle.min_quantity || 3))
    } else {
      const status = getPromoBundleInventoryStatus(bundle, products)
      setSelectedItems(
        status.components.map((c) =>
          c.product
            ? {
                product_id: c.product.id,
                product_name: c.product.name,
                sku: c.product.sku,
                unit_name: c.product.base_unit,
                name_keyword: c.product.name,
                quantity: c.requiredQty,
                unit_price_c: c.product.default_price_c
              }
            : c.item
        )
      )
    }
    setCreating(true)
  }

  const handleAddProductToBuilder = (prod: Product) => {
    if (newType === 'VOLUME_TIER') {
      const qty = Math.max(2, parseInt(minQuantity, 10) || 3)
      setSelectedItems([
        {
          product_id: prod.id,
          product_name: prod.name,
          sku: prod.sku,
          unit_name: prod.base_unit,
          name_keyword: prod.name,
          quantity: qty,
          unit_price_c: prod.default_price_c
        }
      ])
      if (!newName.trim()) {
        setNewName(`${qty}x ${prod.name} Promo`)
      }
      return
    }

    setSelectedItems((prev) => {
      const existingIdx = prev.findIndex((i) => i.product_id === prod.id)
      if (existingIdx >= 0) {
        return prev.map((item, idx) =>
          idx === existingIdx ? { ...item, quantity: item.quantity + 1 } : item
        )
      }
      return [
        ...prev,
        {
          product_id: prod.id,
          product_name: prod.name,
          sku: prod.sku,
          unit_name: prod.base_unit,
          name_keyword: prod.name,
          quantity: 1,
          unit_price_c: prod.default_price_c
        }
      ]
    })
  }

  const handleUpdateBuilderItemQty = (index: number, qty: number) => {
    if (qty <= 0) {
      setSelectedItems((prev) => prev.filter((_, i) => i !== index))
      return
    }
    setSelectedItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, quantity: qty } : item))
    )
  }

  const handleRemoveBuilderItem = (index: number) => {
    setSelectedItems((prev) => prev.filter((_, i) => i !== index))
  }

  const handleToggle = (id: string) => {
    const updated = bundles.map((b) => (b.id === id ? { ...b, is_active: !b.is_active } : b))
    setBundles(updated)
    savePromoBundles(updated)
    toastSuccess('Promo bundle status updated')
  }

  const handleDelete = (id: string) => {
    const updated = bundles.filter((b) => b.id !== id)
    setBundles(updated)
    savePromoBundles(updated)
    toastSuccess('Promo bundle removed')
  }

  const handleAddComboToCart = (bundle: PromoBundle) => {
    const status = getPromoBundleInventoryStatus(bundle, products)

    if (!status.allLinkedToInventory) {
      toastError(
        'Link Inventory Items First',
        'One or more items in this promo bundle are not yet linked to your Inventory. Please select the Inventory items to combine.'
      )
      startEdit(bundle)
      return
    }

    const outComponent = status.components.find((c) => !c.isEnoughStock)
    if (outComponent) {
      toastError(
        'Insufficient Component Inventory',
        `"${outComponent.product?.name || outComponent.item.name_keyword}" only has ${outComponent.availableStock} ${outComponent.unitName} in stock (needs ${outComponent.requiredQty}).`
      )
      return
    }

    for (const comp of status.components) {
      if (comp.product) {
        usePosCart.getState().add(comp.product, comp.requiredQty)
      }
    }

    // Automatically evaluate and apply the promo bundle discount in cart
    const updatedCartItems = usePosCart.getState().items
    const activeBundles = bundles.map((b) => (b.id === bundle.id ? { ...b, is_active: true } : b))
    const promos = evaluateCartPromos(updatedCartItems, activeBundles)
    const totalSavingsC = promos.reduce((acc, p) => acc + p.savingsC, 0)
    if (totalSavingsC > 0) {
      usePosCart.getState().setDiscountPesos(totalSavingsC)
    }

    toastSuccess(
      'Promo Bundle Added to Cart',
      `${bundle.name} added! Component inventory will be deducted automatically on checkout.`
    )
    onClose()
  }

  const handleSaveBundle = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newName.trim()) {
      toastError('Bundle Name Required', 'Please enter a name for the promo bundle.')
      return
    }
    if (selectedItems.length === 0) {
      toastError(
        'Select Inventory Items',
        'Please select at least 1 product from your Inventory to combine into this promo bundle.'
      )
      return
    }

    const priceC = Math.max(0, Math.round((parseFloat(newPricePesos) || 0) * 100))
    if (priceC <= 0) {
      toastError('Invalid Promo Price', 'Please enter a valid promo bundle price.')
      return
    }

    setSavingSync(true)
    try {
      let compositeProductId = editingBundleId
        ? bundles.find((b) => b.id === editingBundleId)?.composite_product_id
        : undefined

      // Loyverse-style Inventory Sync: Create or update Composite BOM product in Inventory DB
      if (
        syncToInventoryBom &&
        draftStatus.allLinkedToInventory &&
        window.api?.products?.create &&
        window.api?.products?.saveRecipe
      ) {
        try {
          const recipePayload = draftStatus.components
            .filter((c) => c.product != null)
            .map((c) => ({
              component_product_id: c.product!.id,
              quantity: c.requiredQty,
              unit_name: c.unitName
            }))

          const summaryDesc =
            newDesc.trim() ||
            `Promo Bundle: ${draftStatus.components
              .map((c) => `${c.requiredQty}x ${c.product?.name || c.item.name_keyword}`)
              .join(' + ')}`

          const existingProd = compositeProductId
            ? products.find((p) => p.id === compositeProductId)
            : products.find(
                (p) =>
                  p.item_type === 'COMPOSITE' &&
                  p.name.toLowerCase() === newName.trim().toLowerCase()
              )

          if (existingProd && window.api.products.update) {
            const updatedProd = await window.api.products.update(existingProd.id, {
              name: newName.trim(),
              sku: existingProd.sku,
              barcode: existingProd.barcode,
              category_id: existingProd.category_id,
              description: summaryDesc,
              base_unit: existingProd.base_unit || 'bundle',
              purchase_cost_c: draftStatus.totalCostC,
              default_price_c: priceC,
              srp_c: draftStatus.regularPriceC > priceC ? draftStatus.regularPriceC : null,
              low_stock_threshold: existingProd.low_stock_threshold || 5,
              item_type: 'COMPOSITE'
            })
            compositeProductId = updatedProd.id
            await window.api.products.saveRecipe(updatedProd.id, recipePayload)
          } else {
            const skuCode = `BND-${Date.now().toString().slice(-5)}`
            const createdProd = await window.api.products.create({
              name: newName.trim(),
              sku: skuCode,
              barcode: null,
              category_id: null,
              description: summaryDesc,
              base_unit: 'bundle',
              purchase_cost_c: draftStatus.totalCostC,
              default_price_c: priceC,
              srp_c: draftStatus.regularPriceC > priceC ? draftStatus.regularPriceC : null,
              low_stock_threshold: 5,
              supplier_id: null,
              has_expiration: false,
              notes: null,
              units: [],
              item_type: 'COMPOSITE'
            })
            compositeProductId = createdProd.id
            await window.api.products.saveRecipe(createdProd.id, recipePayload)
          }

          await onProductsChanged?.()
        } catch (syncErr) {
          console.warn('Could not sync composite bundle to Inventory DB:', syncErr)
        }
      }

      const firstItem = selectedItems[0]
      const savedBundle: PromoBundle = {
        id: editingBundleId || `custom_${Date.now()}`,
        name: newName.trim(),
        type: newType,
        bundle_price_c: priceC,
        is_active: true,
        description:
          newDesc.trim() ||
          draftStatus.components
            .map((c) => `${c.requiredQty}x ${c.product?.name || c.item.name_keyword}`)
            .join(' + '),
        badge:
          newBadge.trim() ||
          (draftStatus.savingsC > 0 ? `Save ${money(draftStatus.savingsC)}` : 'Bundle Deal'),
        composite_product_id: compositeProductId,
        items:
          newType === 'FIXED_COMBO'
            ? selectedItems
            : firstItem
            ? [{ ...firstItem, quantity: Math.max(2, parseInt(minQuantity, 10) || 3) }]
            : [],
        target_product_id: newType === 'VOLUME_TIER' ? firstItem?.product_id : undefined,
        target_name_keyword:
          newType === 'VOLUME_TIER'
            ? firstItem?.product_name || firstItem?.name_keyword
            : undefined,
        min_quantity:
          newType === 'VOLUME_TIER' ? Math.max(2, parseInt(minQuantity, 10) || 3) : undefined
      }

      const updated = editingBundleId
        ? bundles.map((b) => (b.id === editingBundleId ? savedBundle : b))
        : [savedBundle, ...bundles]

      setBundles(updated)
      savePromoBundles(updated)
      toastSuccess(
        editingBundleId ? 'Promo Bundle Updated' : 'Promo Bundle Created',
        `Combined ${selectedItems.length} Inventory item(s) · ${draftStatus.availableBundles} bundle(s) available in stock.`
      )
      resetForm()
    } finally {
      setSavingSync(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Promo Bundles & Composite Inventory Combiner"
      maxWidth="max-w-4xl"
      footer={
        <div className="flex items-center justify-between w-full">
          <button
            type="button"
            onClick={() => {
              savePromoBundles(DEFAULT_PROMO_BUNDLES)
              setBundles(DEFAULT_PROMO_BUNDLES)
              toastSuccess('Restored default promos')
            }}
            className="text-xs text-slate-500 hover:text-slate-300"
          >
            Reset to Standard Deals
          </button>
          <button onClick={onClose} className="btn-ghost">
            Close
          </button>
        </div>
      }
    >
      <div className="space-y-4">
        {/* Loyverse-Style Workflow Banner */}
        <div className="rounded-xl border border-brand-500/30 bg-gradient-to-r from-brand-950/40 via-ink-900 to-ink-900 p-4 text-xs text-slate-300">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <p className="font-bold text-brand-300 flex items-center gap-1.5 text-sm">
                <Sparkles className="h-4 w-4 text-brand-400" />
                Loyverse-Style Inventory Bundle Combining &amp; Stock Monitoring
              </p>
              <p className="mt-1 text-slate-400 leading-relaxed">
                <strong className="text-slate-200">1. Input items in Inventory first</strong> →{' '}
                <strong className="text-slate-200">2. Combine Inventory items into a Promo Bundle</strong> →{' '}
                <strong className="text-emerald-300">3. Component stock is monitored &amp; deducted automatically on every sale.</strong>
              </p>
            </div>
            {!creating && (
              <button
                type="button"
                onClick={startCreate}
                className="btn-primary shrink-0 flex items-center gap-1.5 text-xs py-2 px-3.5"
              >
                <Plus className="h-3.5 w-3.5" />
                Combine Inventory Items
              </button>
            )}
          </div>
        </div>

        {/* Create / Edit Loyverse-Style Bundle Builder */}
        {creating && (
          <form
            onSubmit={(e) => void handleSaveBundle(e)}
            className="rounded-2xl border border-brand-500/30 bg-ink-900 p-4 space-y-4 shadow-lg"
          >
            <div className="flex items-center justify-between border-b border-ink-line pb-3">
              <div className="flex items-center gap-2">
                <Layers className="h-4 w-4 text-brand-400" />
                <h4 className="text-sm font-bold text-white">
                  {editingBundleId ? 'Edit Promo Bundle & Linked Inventory' : 'Create Promo Bundle from Inventory'}
                </h4>
              </div>
              <button
                type="button"
                onClick={resetForm}
                className="text-slate-500 hover:text-slate-300"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Bundle Type & Details */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="label">Bundle Type</label>
                <select
                  value={newType}
                  onChange={(e) => setNewType(e.target.value as PromoType)}
                  className="input w-full text-xs font-semibold"
                >
                  <option value="FIXED_COMBO">🧩 Combine Multiple Inventory Items (Combo)</option>
                  <option value="VOLUME_TIER">📦 Bulk / Volume Tier (e.g. 3 for ₱50)</option>
                </select>
              </div>
              <div>
                <label className="label">Promo Bundle Name *</label>
                <input
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g. Breakfast Combo (Canton + Egg)"
                  className="input w-full text-xs"
                />
              </div>
              <div>
                <label className="label">Promo Bundle Price (₱) *</label>
                <input
                  type="number"
                  min={0.01}
                  step="any"
                  required
                  value={newPricePesos}
                  onChange={(e) => setNewPricePesos(e.target.value)}
                  className="input w-full text-xs font-bold text-brand-400"
                />
              </div>
            </div>

            {newType === 'VOLUME_TIER' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="label">Minimum Quantity Required for Promo Price *</label>
                  <input
                    type="number"
                    min={2}
                    step={1}
                    value={minQuantity}
                    onChange={(e) => {
                      const val = e.target.value
                      setMinQuantity(val)
                      const parsed = Math.max(2, parseInt(val, 10) || 3)
                      setSelectedItems((prev) =>
                        prev.map((it, idx) => (idx === 0 ? { ...it, quantity: parsed } : it))
                      )
                    }}
                    className="input w-full text-xs font-bold text-amber-300"
                  />
                </div>
                <div>
                  <label className="label">Optional Description / Note</label>
                  <input
                    value={newDesc}
                    onChange={(e) => setNewDesc(e.target.value)}
                    placeholder="e.g. Buy any 3 packs for special bundle price"
                    className="input w-full text-xs"
                  />
                </div>
              </div>
            )}

            {/* Step 1: Search & Pick Products from Inventory */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 pt-1">
              <div className="lg:col-span-6 space-y-2">
                <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  <Package className="h-3.5 w-3.5 text-brand-400" />
                  1. Select Existing Items from Inventory ({products.filter((p) => p.status === 'ACTIVE' && p.item_type !== 'COMPOSITE').length} items)
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-500" />
                  <input
                    type="text"
                    value={inventorySearch}
                    onChange={(e) => setInventorySearch(e.target.value)}
                    placeholder="Search Inventory product by name, SKU, or barcode..."
                    className="input w-full pl-8 text-xs"
                  />
                </div>

                <div className="max-h-48 overflow-y-auto rounded-xl border border-ink-line bg-ink-950 divide-y divide-ink-line/60">
                  {combineCandidates.length === 0 ? (
                    <div className="p-4 text-center text-xs text-slate-500">
                      No matching Inventory items found. Add items in the Inventory page first.
                    </div>
                  ) : (
                    combineCandidates.map((prod) => {
                      const avail = Math.max(0, prod.sellable_stock ?? prod.stock ?? 0)
                      const alreadySelected = selectedItems.some((i) => i.product_id === prod.id)
                      return (
                        <div
                          key={prod.id}
                          className="flex items-center justify-between px-3 py-2 text-xs hover:bg-ink-900 transition"
                        >
                          <div className="min-w-0 pr-2">
                            <p className="font-semibold text-white truncate">{prod.name}</p>
                            <p className="text-[10px] text-slate-400 flex items-center gap-2">
                              <span className="font-mono text-brand-300">{prod.sku}</span>
                              <span>· Regular: {money(prod.default_price_c)}</span>
                              <span
                                className={`font-semibold ${
                                  avail <= 0
                                    ? 'text-rose-400'
                                    : avail <= prod.low_stock_threshold
                                    ? 'text-amber-400'
                                    : 'text-emerald-400'
                                }`}
                              >
                                · Stock: {avail} {prod.base_unit}
                              </span>
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleAddProductToBuilder(prod)}
                            className={`shrink-0 rounded-lg px-2.5 py-1 text-[11px] font-bold transition ${
                              alreadySelected
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/30'
                                : 'bg-brand-600 text-white hover:bg-brand-500'
                            }`}
                          >
                            {alreadySelected ? '+1 Qty' : '+ Combine'}
                          </button>
                        </div>
                      )
                    })
                  )}
                </div>
              </div>

              {/* Step 2: Combined Components & Live Inventory Calculation */}
              <div className="lg:col-span-6 space-y-2">
                <label className="text-xs font-bold text-slate-300 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Layers className="h-3.5 w-3.5 text-emerald-400" />
                    2. Combined Bundle Components ({selectedItems.length})
                  </span>
                  {draftStatus.allLinkedToInventory && selectedItems.length > 0 && (
                    <span className="text-[11px] font-bold text-emerald-400">
                      Available Bundle Stock: {draftStatus.availableBundles} sets
                    </span>
                  )}
                </label>

                <div className="max-h-48 overflow-y-auto rounded-xl border border-ink-line bg-ink-950 p-2 space-y-1.5">
                  {selectedItems.length === 0 ? (
                    <div className="py-8 text-center text-xs text-slate-500">
                      Click <strong className="text-brand-300">&quot;+ Combine&quot;</strong> on Inventory items on the left to build this promo bundle.
                    </div>
                  ) : (
                    draftStatus.components.map((comp, idx) => (
                      <div
                        key={`${comp.item.product_id ?? comp.item.name_keyword}-${idx}`}
                        className="flex items-center justify-between gap-2 rounded-lg border border-ink-line bg-ink-900 px-2.5 py-2 text-xs"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold text-white truncate">
                            {comp.product ? comp.product.name : comp.item.name_keyword}
                          </p>
                          {comp.product ? (
                            <p className="text-[10px] text-slate-400">
                              Stock:{' '}
                              <strong
                                className={
                                  comp.isEnoughStock ? 'text-emerald-400' : 'text-rose-400'
                                }
                              >
                                {comp.availableStock} {comp.unitName}
                              </strong>{' '}
                              · Reg: {money(comp.unitPriceC)} each · Max: {comp.maxBundles} bundles
                            </p>
                          ) : (
                            <p className="text-[10px] text-amber-400">
                              ⚠️ Not linked to Inventory — select matching item on the left
                            </p>
                          )}
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <span className="text-[10px] text-slate-400">Qty:</span>
                          <input
                            type="number"
                            min={1}
                            step={1}
                            value={comp.item.quantity}
                            onChange={(e) =>
                              handleUpdateBuilderItemQty(idx, parseInt(e.target.value, 10) || 1)
                            }
                            className="w-14 rounded border border-ink-line bg-ink-950 px-1.5 py-1 text-center text-xs font-bold text-white"
                          />
                          <button
                            type="button"
                            onClick={() => handleRemoveBuilderItem(idx)}
                            className="p-1 text-slate-500 hover:text-rose-400 transition"
                            title="Remove component"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Live Roll-up Cost, Regular Price, Savings & Available Bundle Stock */}
                {selectedItems.length > 0 && (
                  <div className="rounded-xl border border-ink-line bg-ink-950/90 p-3 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                    <div>
                      <p className="text-[10px] text-slate-400">Regular Combined</p>
                      <p className="font-bold text-slate-200">{money(draftStatus.regularPriceC)}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400">Combined Cost</p>
                      <p className="font-bold text-slate-300">{money(draftStatus.totalCostC)}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400">Customer Savings</p>
                      <p className="font-bold text-emerald-400">
                        {draftStatus.savingsC > 0 ? `Save ${money(draftStatus.savingsC)}` : '₱0.00'}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400">Available Stock</p>
                      <p
                        className={`font-black ${
                          draftStatus.availableBundles > 0 ? 'text-brand-300' : 'text-rose-400'
                        }`}
                      >
                        {draftStatus.availableBundles} bundle(s)
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Sync as Composite Product in Inventory Toggle */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-ink-line">
              <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={syncToInventoryBom}
                  onChange={(e) => setSyncToInventoryBom(e.target.checked)}
                  className="rounded border-ink-line bg-ink-950 text-brand-500 focus:ring-brand-500"
                />
                <span>
                  Also sync as a <strong className="text-brand-300">Composite Item in Inventory &amp; POS Catalog</strong> (Loyverse BOM monitoring)
                </span>
              </label>

              <div className="flex justify-end gap-2">
                <button type="button" onClick={resetForm} className="btn-ghost text-xs">
                  Cancel
                </button>
                <button type="submit" disabled={savingSync} className="btn-primary text-xs">
                  {savingSync
                    ? 'Saving Bundle...'
                    : editingBundleId
                    ? 'Update Promo Bundle'
                    : 'Save Promo Bundle'}
                </button>
              </div>
            </div>
          </form>
        )}

        {/* Bundles List */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[55vh] overflow-y-auto pr-1">
          {bundles.map((bundle) => {
            const status = getPromoBundleInventoryStatus(bundle, products)
            const canSell = status.allLinkedToInventory && !status.hasOutOfStockComponent

            return (
              <div
                key={bundle.id}
                className={`rounded-xl border p-4 flex flex-col justify-between transition ${
                  bundle.is_active
                    ? 'border-ink-line bg-ink-900/70'
                    : 'border-slate-800 bg-ink-950/40 opacity-60'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-bold text-white text-sm">{bundle.name}</span>
                        {bundle.badge && (
                          <span className="badge border border-brand-500/30 bg-brand-500/20 text-brand-300 text-[10px] px-1.5 py-0.5">
                            {bundle.badge}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">{bundle.description}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-base font-black text-brand-400 font-mono block">
                        {money(bundle.bundle_price_c)}
                      </span>
                      {status.regularPriceC > bundle.bundle_price_c && (
                        <span className="text-[10px] text-slate-500 line-through font-mono">
                          Reg {money(status.regularPriceC)}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Live Bundle Stock Monitoring Bar */}
                  <div className="mt-2.5 flex items-center justify-between rounded-lg bg-ink-950/80 px-2.5 py-1.5 border border-ink-line/70 text-[11px]">
                    <span className="text-slate-400 font-medium">Monitored Bundle Stock:</span>
                    {!status.allLinkedToInventory ? (
                      <button
                        type="button"
                        onClick={() => startEdit(bundle)}
                        className="font-bold text-amber-400 hover:text-amber-300 flex items-center gap-1 underline underline-offset-2"
                      >
                        <AlertTriangle className="h-3 w-3" />
                        Link to Inventory Items
                      </button>
                    ) : status.availableBundles <= 0 ? (
                      <span className="font-bold text-rose-400 flex items-center gap-1">
                        <AlertTriangle className="h-3 w-3" />
                        Out of Stock (0 bundles)
                      </span>
                    ) : (
                      <span
                        className={`font-bold flex items-center gap-1 ${
                          status.availableBundles <= 5 ? 'text-amber-300' : 'text-emerald-400'
                        }`}
                      >
                        <CheckCircle2 className="h-3 w-3" />
                        {status.availableBundles} bundle(s) available
                      </span>
                    )}
                  </div>

                  {/* Component Inventory Breakdown */}
                  {status.components.length > 0 && (
                    <div className="mt-2.5 flex flex-wrap gap-1.5">
                      {status.components.map((comp, idx) => (
                        <span
                          key={idx}
                          className={`rounded px-2 py-1 text-[11px] border flex items-center gap-1.5 ${
                            !comp.isLinked
                              ? 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                              : !comp.isEnoughStock
                              ? 'bg-rose-500/10 text-rose-300 border-rose-500/30'
                              : 'bg-ink-800 text-slate-200 border-ink-line'
                          }`}
                        >
                          <span className="font-bold">
                            {comp.requiredQty}x {comp.product ? comp.product.name : comp.item.name_keyword}
                          </span>
                          <span className="text-[10px] opacity-80">
                            {comp.isLinked
                              ? `(Stock: ${comp.availableStock} ${comp.unitName})`
                              : '(Not in Inventory)'}
                          </span>
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="mt-4 flex items-center justify-between border-t border-ink-line/50 pt-3">
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleToggle(bundle.id)}
                      className={`text-xs px-2 py-1 rounded font-semibold border ${
                        bundle.is_active
                          ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20'
                          : 'border-slate-700 bg-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      {bundle.is_active ? 'Active Deal' : 'Paused'}
                    </button>
                    <button
                      type="button"
                      onClick={() => startEdit(bundle)}
                      className="flex items-center gap-1 px-2 py-1 rounded text-xs font-medium text-slate-300 hover:text-white hover:bg-ink-800 border border-ink-line transition"
                      title="Edit bundle items or link to Inventory"
                    >
                      <Edit3 className="h-3 w-3" />
                      <span>Edit / Link</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(bundle.id)}
                      className="p-1 text-slate-600 hover:text-danger-400 transition"
                      title="Delete Promo"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleAddComboToCart(bundle)}
                    className={`text-xs py-1.5 px-3 rounded-lg font-bold flex items-center gap-1.5 transition ${
                      canSell
                        ? 'btn-primary'
                        : !status.allLinkedToInventory
                        ? 'border border-amber-500/40 bg-amber-500/15 text-amber-300 hover:bg-amber-500/25'
                        : 'border border-ink-line bg-ink-800 text-slate-500 cursor-not-allowed'
                    }`}
                    title={
                      !status.allLinkedToInventory
                        ? 'Click to link this bundle to your Inventory items'
                        : canSell
                        ? 'Add combo items directly into cart with automatic promo discount'
                        : 'Insufficient component stock in Inventory'
                    }
                  >
                    <ShoppingCart className="h-3.5 w-3.5" />
                    <span>{!status.allLinkedToInventory ? 'Link & Add' : 'Add to Cart'}</span>
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </Modal>
  )
}

