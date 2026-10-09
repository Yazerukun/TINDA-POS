export interface CategoryCustomization {
  icon?: string
  color?: 'indigo' | 'emerald' | 'amber' | 'rose' | 'cyan' | 'violet' | 'slate'
}

export type CategoryCustomizationMap = Record<number, CategoryCustomization>

const STORAGE_KEY = 'tinda_category_customizations_v1'

export const EMOJI_PRESETS = [
  '📦', // Package / Bundle
  '🎁', // Gift Bundle / Basket
  '🛍️', // Shopping Pack
  '🍔', // Meal Combo
  '🥤', // Drinks / Beverages
  '🍿', // Snacks / Chips
  '🥫', // Canned Goods / Grocery
  '🍱', // Bento / Value Meal
  '⚡', // Flash Promo / Deal
  '🔥', // Hot Seller / Promo
  '🏷️', // Special Discount Tag
  '✨', // Featured / Special
  '☕', // Coffee / Breakfast Pack
  '🍰', // Bakery / Desserts
  '🥩', // Meat & Fresh
  '💊'  // Pharmacy / Essentials
]

export const COLOR_PRESETS: Array<{
  id: 'indigo' | 'emerald' | 'amber' | 'rose' | 'cyan' | 'violet' | 'slate'
  name: string
  bgPreview: string
  borderPreview: string
}> = [
  { id: 'indigo', name: 'Indigo / Purple', bgPreview: 'bg-indigo-500', borderPreview: 'border-indigo-400' },
  { id: 'emerald', name: 'Emerald Green', bgPreview: 'bg-emerald-500', borderPreview: 'border-emerald-400' },
  { id: 'amber', name: 'Amber / Orange', bgPreview: 'bg-amber-500', borderPreview: 'border-amber-400' },
  { id: 'rose', name: 'Rose Red', bgPreview: 'bg-rose-500', borderPreview: 'border-rose-400' },
  { id: 'cyan', name: 'Cyan Blue', bgPreview: 'bg-cyan-500', borderPreview: 'border-cyan-400' },
  { id: 'violet', name: 'Vibrant Violet', bgPreview: 'bg-purple-500', borderPreview: 'border-purple-400' },
  { id: 'slate', name: 'Classic Slate', bgPreview: 'bg-slate-500', borderPreview: 'border-slate-400' }
]

export type CategoryColor = 'indigo' | 'emerald' | 'amber' | 'rose' | 'cyan' | 'violet' | 'slate'

export interface CategoryColorStyle {
  active: string
  inactive: string
  badge: string
  dot: string
}

export const CATEGORY_COLOR_STYLES: Record<CategoryColor, CategoryColorStyle> = {
  indigo: {
    active: 'bg-indigo-500/25 border-indigo-400 text-indigo-100 ring-2 ring-indigo-400/40 shadow-sm shadow-indigo-500/20',
    inactive: 'border-indigo-500/30 bg-indigo-500/10 text-indigo-300 hover:bg-indigo-500/20 hover:border-indigo-400',
    badge: 'bg-indigo-500/30 text-indigo-200 border-indigo-400/40',
    dot: 'bg-indigo-400'
  },
  emerald: {
    active: 'bg-emerald-500/25 border-emerald-400 text-emerald-100 ring-2 ring-emerald-400/40 shadow-sm shadow-emerald-500/20',
    inactive: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20 hover:border-emerald-400',
    badge: 'bg-emerald-500/30 text-emerald-200 border-emerald-400/40',
    dot: 'bg-emerald-400'
  },
  amber: {
    active: 'bg-amber-500/25 border-amber-400 text-amber-100 ring-2 ring-amber-400/40 shadow-sm shadow-amber-500/20',
    inactive: 'border-amber-500/30 bg-amber-500/10 text-amber-300 hover:bg-amber-500/20 hover:border-amber-400',
    badge: 'bg-amber-500/30 text-amber-200 border-amber-400/40',
    dot: 'bg-amber-400'
  },
  rose: {
    active: 'bg-rose-500/25 border-rose-400 text-rose-100 ring-2 ring-rose-400/40 shadow-sm shadow-rose-500/20',
    inactive: 'border-rose-500/30 bg-rose-500/10 text-rose-300 hover:bg-rose-500/20 hover:border-rose-400',
    badge: 'bg-rose-500/30 text-rose-200 border-rose-400/40',
    dot: 'bg-rose-400'
  },
  cyan: {
    active: 'bg-cyan-500/25 border-cyan-400 text-cyan-100 ring-2 ring-cyan-400/40 shadow-sm shadow-cyan-500/20',
    inactive: 'border-cyan-500/30 bg-cyan-500/10 text-cyan-300 hover:bg-cyan-500/20 hover:border-cyan-400',
    badge: 'bg-cyan-500/30 text-cyan-200 border-cyan-400/40',
    dot: 'bg-cyan-400'
  },
  violet: {
    active: 'bg-purple-500/25 border-purple-400 text-purple-100 ring-2 ring-purple-400/40 shadow-sm shadow-purple-500/20',
    inactive: 'border-purple-500/30 bg-purple-500/10 text-purple-300 hover:bg-purple-500/20 hover:border-purple-400',
    badge: 'bg-purple-500/30 text-purple-200 border-purple-400/40',
    dot: 'bg-purple-400'
  },
  slate: {
    active: 'bg-brand-500/25 border-brand-400 text-brand-100 ring-2 ring-brand-400/40 shadow-sm shadow-brand-500/20',
    inactive: 'border-ink-line bg-ink-800/80 text-slate-300 hover:bg-ink-700 hover:border-slate-500',
    badge: 'bg-ink-700 text-slate-300 border-ink-line',
    dot: 'bg-slate-400'
  }
}

export function getCategoryStyle(color?: string): CategoryColorStyle {
  if (!color || !(color in CATEGORY_COLOR_STYLES)) {
    return CATEGORY_COLOR_STYLES.slate
  }
  return CATEGORY_COLOR_STYLES[color as CategoryColor]
}

export function getCategoryCustomizations(): CategoryCustomizationMap {
  if (typeof window === 'undefined') return {}
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw)
    return typeof parsed === 'object' && parsed !== null ? parsed : {}
  } catch {
    return {}
  }
}

export function saveCategoryCustomization(categoryId: number, custom: CategoryCustomization): void {
  if (typeof window === 'undefined') return
  try {
    const map = getCategoryCustomizations()
    map[categoryId] = { ...map[categoryId], ...custom }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(map))
  } catch (err) {
    console.error('Failed to save category customization:', err)
  }
}

export function removeCategoryCustomization(categoryId: number): void {
  if (typeof window === 'undefined') return
  try {
    const map = getCategoryCustomizations()
    delete map[categoryId]
    localStorage.setItem(STORAGE_KEY, JSON.stringify(map))
  } catch (err) {
    console.error('Failed to remove category customization:', err)
  }
}

export function getCategoryVisuals(
  categoryName: string,
  custom?: CategoryCustomization
): { icon: string; color: 'indigo' | 'emerald' | 'amber' | 'rose' | 'cyan' | 'violet' | 'slate'; isBundle: boolean } {
  const lower = categoryName.toLowerCase()
  const isBundle =
    lower.includes('package') ||
    lower.includes('bundle') ||
    lower.includes('promo') ||
    lower.includes('combo') ||
    lower.includes('pack')

  if (custom?.icon && custom?.color) {
    return { icon: custom.icon, color: custom.color, isBundle }
  }

  if (isBundle) {
    return { icon: custom?.icon || '📦', color: custom?.color || 'indigo', isBundle: true }
  }
  if (lower.includes('drink') || lower.includes('beverage') || lower.includes('juice') || lower.includes('water') || lower.includes('coffee') || lower.includes('soda')) {
    return { icon: custom?.icon || '🥤', color: custom?.color || 'cyan', isBundle: false }
  }
  if (lower.includes('snack') || lower.includes('biscuit') || lower.includes('chip') || lower.includes('candy') || lower.includes('merienda')) {
    return { icon: custom?.icon || '🍿', color: custom?.color || 'amber', isBundle: false }
  }
  if (lower.includes('grocery') || lower.includes('canned') || lower.includes('noodle') || lower.includes('rice')) {
    return { icon: custom?.icon || '🥫', color: custom?.color || 'emerald', isBundle: false }
  }
  if (lower.includes('meat') || lower.includes('fresh') || lower.includes('fish') || lower.includes('vegetable')) {
    return { icon: custom?.icon || '🥩', color: custom?.color || 'rose', isBundle: false }
  }
  if (lower.includes('dessert') || lower.includes('bakery') || lower.includes('bread') || lower.includes('cake')) {
    return { icon: custom?.icon || '🍰', color: custom?.color || 'violet', isBundle: false }
  }

  return { icon: custom?.icon || '🏷️', color: custom?.color || 'slate', isBundle: false }
}
