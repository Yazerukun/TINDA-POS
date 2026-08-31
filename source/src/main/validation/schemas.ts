// Centralized validation for IPC inputs and shared strings. Pure functions — usable in renderer too.

export function isNonEmptyString(v: unknown, label: string): string {
  if (typeof v !== 'string' || v.trim().length === 0) throw new Error(`${label} is required.`)
  return v.trim()
}

export function isInt(v: unknown, label: string, min = -Infinity): number {
  if (typeof v !== 'number' || !Number.isInteger(v)) throw new Error(`${label} must be a whole number.`)
  if (v < min) throw new Error(`${label} must be at least ${min}.`)
  return v
}

export function isNonNegInt(v: unknown, label: string): number {
  return isInt(v, label, 0)
}

export function isPositiveInt(v: unknown, label: string): number {
  return isInt(v, label, 1)
}

export function isPin(v: unknown): string {
  if (typeof v !== 'string' || !/^\d{4}$/.test(v)) throw new Error('PIN must be exactly 4 digits.')
  return v
}

export function isAmountNonNeg(v: unknown, label: string): number {
  if (typeof v !== 'number' || !Number.isFinite(v) || v < 0) throw new Error(`${label} must be a valid non-negative amount.`)
  return Math.round(v)
}

export function isCentavos(v: unknown, label: string): number {
  return isAmountNonNeg(v, label)
}

export function isDateStr(v: unknown, label: string, required = true): string | null {
  if (v === null || v === undefined || v === '') return required ? (() => { throw new Error(`${label} is required.`) })() : null
  if (typeof v !== 'string') throw new Error(`${label} must be a date.`)
  return v
}

export const validateSetup = (input: unknown) => {
  // Defensive: the payload must actually be received before touching any
  // nested property. Reading `.store` on `undefined` is what produced the
  // original "Cannot read properties of undefined (reading 'store')" crash.
  if (input === null || input === undefined || typeof input !== 'object') {
    throw new Error('Setup payload was not received. Please fill in the form and try again.')
  }
  const i = input as Record<string, unknown>
  if (typeof i.store !== 'object' || i.store === null) {
    throw new Error('Store setup data was not received.')
  }
  if (typeof i.admin !== 'object' || i.admin === null) {
    throw new Error('Admin account data was not received.')
  }
  if (typeof i.receipt !== 'object' || i.receipt === null) {
    throw new Error('Receipt settings data was not received.')
  }
  const store = (i.store ?? {}) as Record<string, unknown>
  const admin = (i.admin ?? {}) as Record<string, unknown>
  const receipt = (i.receipt ?? {}) as Record<string, unknown>
  return {
    store: {
      store_name: isNonEmptyString(store.store_name, 'Store name'),
      owner_name: typeof store.owner_name === 'string' ? store.owner_name : '',
      address: typeof store.address === 'string' ? store.address : '',
      phone: typeof store.phone === 'string' ? store.phone : ''
    },
    admin: {
      username: isNonEmptyString(admin.username, 'Admin username'),
      password: typeof admin.password === 'string' && admin.password.length >= 4 ? admin.password : (() => { throw new Error('Password must be at least 4 characters.') })(),
      pin: isPin(admin.pin),
      full_name: typeof admin.full_name === 'string' ? admin.full_name : undefined
    },
    receipt: {
      header: typeof receipt.header === 'string' ? receipt.header : '',
      footer: typeof receipt.footer === 'string' ? receipt.footer : 'Salamat po!'
    },
    data_dir: typeof i.data_dir === 'string' ? i.data_dir : '',
    load_demo: !!i.load_demo
  }
}

export const validateUserCreate = (input: unknown) => {
  const i = input as Record<string, unknown>
  const roles = Array.isArray(i.roles) && (i.roles as unknown[]).length > 0 ? (i.roles as string[]).map(String) : ['CASHIER']
  return {
    username: isNonEmptyString(i.username, 'Username'),
    password: typeof i.password === 'string' && i.password.length >= 4 ? i.password : (() => { throw new Error('Password must be at least 4 characters.') })(),
    pin: isPin(i.pin),
    full_name: typeof i.full_name === 'string' ? i.full_name : '',
    roles
  }
}

export const validateUserUpdate = (input: unknown) => {
  const i = input as Record<string, unknown>
  const out: Record<string, unknown> = {}
  if (i.username !== undefined) out.username = isNonEmptyString(i.username, 'Username')
  if (i.full_name !== undefined) out.full_name = typeof i.full_name === 'string' ? i.full_name : ''
  if (i.is_active !== undefined) out.is_active = !!i.is_active
  if (i.roles !== undefined) out.roles = Array.isArray(i.roles) ? (i.roles as string[]).map(String) : undefined
  if (i.password !== undefined && i.password !== '') {
    if (typeof i.password !== 'string' || i.password.length < 4) throw new Error('Password must be at least 4 characters.')
    out.password = i.password
  }
  if (i.pin !== undefined && i.pin !== '') out.pin = isPin(i.pin)
  return out
}

export function validateCheckout(payload: unknown) {
  const p = payload as Record<string, unknown>
  const items = Array.isArray(p.items) ? p.items : []
  if (items.length === 0) throw new Error('Cart is empty.')
  const cart = items.map((it) => {
    const x = it as Record<string, unknown>
    return {
      product_id: x.product_id === null ? null : Number(x.product_id),
      name: isNonEmptyString(x.name, 'Item name'),
      unit_name: isNonEmptyString(x.unit_name, 'Unit'),
      qty: isPositiveInt(x.qty, 'Quantity'),
      qty_base: isPositiveInt(x.qty_base, 'Quantity (base)'),
      unit_price_c: isCentavos(x.unit_price_c, 'Unit price'),
      cost_base_c: isAmountNonNeg(x.cost_base_c ?? 0, 'Cost'),
      stock_base: x.stock_base === null ? null : (typeof x.stock_base === 'number' ? x.stock_base : null),
      subtotal_c: isCentavos(x.subtotal_c, 'Subtotal')
    }
  })
  const payments = Array.isArray(p.payments) && p.payments.length ? (p.payments as unknown[]).map((pm) => {
    const y = pm as Record<string, unknown>
    const method = String(y.method)
    if (!['CASH', 'GCASH', 'MAYA', 'UTANG'].includes(method)) throw new Error('Invalid payment method.')
    return { method, amount_c: isCentavos(y.amount_c, 'Payment amount'), reference: typeof y.reference === 'string' && y.reference ? y.reference : null } as { method: 'CASH' | 'GCASH' | 'MAYA' | 'UTANG'; amount_c: number; reference: string | null }
  }) : []
  return {
    items: cart,
    discount_c: isAmountNonNeg(p.discount_c ?? 0, 'Discount'),
    customer_id: p.customer_id === null || p.customer_id === undefined ? null : Number(p.customer_id),
    payments,
    notes: typeof p.notes === 'string' && p.notes ? p.notes : null
  }
}