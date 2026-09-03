import { useEffect, useState } from 'react'
import { Save, Store, Receipt, Users, UserPlus, Pencil, KeyRound, Heart, Coffee, Copy } from 'lucide-react'
import type { User } from '@shared/types'
import { PageHeader } from '../components/ui/PageHeader'
import { Modal } from '../components/ui/Modal'
import { useSettings } from '../stores/settings'
import { toastSuccess, toastError } from '../stores/toast'

type Tab = 'HOME' | 'RECEIPT' | 'USERS' | 'ABOUT'

export function Settings(): React.JSX.Element {
  const { load } = useSettings()
  const [tab, setTab] = useState<Tab>('HOME')

  useEffect(() => { void load() }, [load])

  return (
    <div className="p-6">
      <PageHeader title="Settings" />
      <div className="mb-4 flex flex-wrap gap-2">
        <button onClick={() => setTab('HOME')} className={`btn-ghost flex items-center gap-2 ${tab === 'HOME' ? '!border-brand-500 !text-brand-400' : ''}`}><Store className="h-4 w-4" /> Store</button>
        <button onClick={() => setTab('RECEIPT')} className={`btn-ghost flex items-center gap-2 ${tab === 'RECEIPT' ? '!border-brand-500 !text-brand-400' : ''}`}><Receipt className="h-4 w-4" /> Receipt</button>
        <button onClick={() => setTab('USERS')} className={`btn-ghost flex items-center gap-2 ${tab === 'USERS' ? '!border-brand-500 !text-brand-400' : ''}`}><Users className="h-4 w-4" /> Users</button>
        <button onClick={() => setTab('ABOUT')} className={`btn-ghost flex items-center gap-2 ${tab === 'ABOUT' ? '!border-brand-500 !text-brand-400' : ''}`}><Heart className="h-4 w-4" /> About</button>
      </div>
      {tab === 'HOME' && <StoreSettingsTab />}
      {tab === 'RECEIPT' && <ReceiptSettingsTab />}
      {tab === 'USERS' && <UsersTab />}
      {tab === 'ABOUT' && <AboutTab />}
    </div>
  )
}

function AboutTab(): React.JSX.Element {
  const copyGcash = async () => {
    try {
      await navigator.clipboard.writeText('09912255156')
      toastSuccess('GCash number copied')
    } catch { toastError('Could not copy number') }
  }
  return (
    <div className="card max-w-xl overflow-hidden">
      <div className="developer-card p-8 text-center">
        <div className="coffee-float relative z-10 mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 text-white shadow-pop ring-1 ring-white/10"><Coffee className="h-7 w-7" /></div>
        <p className="dev-signature signature-reveal relative z-10 text-3xl italic text-white">Crafted with care</p>
        <p className="mt-1 text-sm text-slate-400">by</p>
        <p className="dev-signature signature-reveal relative z-10 text-2xl font-bold text-brand-300">Dev Francis</p>
        <div className="mx-auto my-5 h-px max-w-xs bg-gradient-to-r from-transparent via-brand-500/50 to-transparent" />
        <p className="text-sm text-slate-300">TINDA POS is free. If it helps your store, you may support the developer with a small coffee donation.</p>
        <button onClick={() => void copyGcash()} className="donation-card mx-auto mt-4 flex items-center gap-3 rounded-xl px-5 py-3 text-left">
          <Heart className="h-5 w-5 fill-brand-400 text-brand-400" />
          <span><span className="block text-[10px] uppercase tracking-[0.2em] text-slate-500">GCash · Pang-kape</span><span className="font-mono text-lg font-bold tracking-wider text-white">0991 225 5156</span></span>
          <Copy className="ml-2 h-4 w-4 text-slate-400" />
        </button>
        <p className="mt-3 text-[10px] text-slate-600">Donations are optional and do not unlock any features.</p>
      </div>
    </div>
  )
}

function Toggle({ on, onClick }: { on: boolean; onClick: () => void }): React.JSX.Element {
  return (
    <button type="button" onClick={onClick} className={`h-6 w-11 rounded-full transition ${on ? 'bg-brand-600' : 'bg-ink-700'}`}>
      <span className={`block h-5 w-5 rounded-full bg-white transition ${on ? 'translate-x-5' : 'translate-x-0.5'}`} />
    </button>
  )
}

function StoreSettingsTab(): React.JSX.Element {
  const { settings, update } = useSettings()
  const [f, setF] = useState({
    store_name: settings?.store_name ?? '',
    owner_name: settings?.owner_name ?? '',
    address: settings?.address ?? '',
    phone: settings?.phone ?? '',
    tin: settings?.tin ?? '',
    default_low_stock: settings?.default_low_stock ?? 5,
    allow_negative_inventory: settings?.allow_negative_inventory ?? false,
    default_tax_c: settings?.default_tax_c ?? 0
  })
  const [saving, setSaving] = useState(false)
  const set = (patch: Partial<typeof f>) => setF((p) => ({ ...p, ...patch }))

  const save = async () => {
    setSaving(true)
    try {
      await update({ store_name: f.store_name, owner_name: f.owner_name, address: f.address, phone: f.phone, tin: f.tin, default_low_stock: f.default_low_stock, allow_negative_inventory: f.allow_negative_inventory, default_tax_c: f.default_tax_c })
      toastSuccess('Settings saved')
    } catch (e) { toastError('Save failed', String((e as Error)?.message || e)) } finally { setSaving(false) }
  }

  return (
    <div className="card max-w-xl p-5">
      <div className="space-y-3">
        <div><label className="label">Store Name *</label><input value={f.store_name} onChange={(e) => set({ store_name: e.target.value })} className="input w-full" /></div>
        <div><label className="label">Owner Name</label><input value={f.owner_name} onChange={(e) => set({ owner_name: e.target.value })} className="input w-full" /></div>
        <div><label className="label">Address</label><input value={f.address} onChange={(e) => set({ address: e.target.value })} className="input w-full" /></div>
        <div className="grid grid-cols-2 gap-3">
          <div><label className="label">Phone</label><input value={f.phone} onChange={(e) => set({ phone: e.target.value })} className="input w-full" /></div>
          <div><label className="label">TIN</label><input value={f.tin} onChange={(e) => set({ tin: e.target.value })} className="input w-full" /></div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div><label className="label">Default Low Stock Alert</label><input type="number" min={0} value={f.default_low_stock} onChange={(e) => set({ default_low_stock: parseInt(e.target.value || '0', 10) })} className="input w-full" /></div>
          <div><label className="label">Default Tax (₱)</label><input type="number" min={0} value={f.default_tax_c / 100} onChange={(e) => set({ default_tax_c: Math.round(parseFloat(e.target.value || '0') * 100) })} className="input w-full" /></div>
        </div>
        <div className="flex items-center justify-between rounded-lg border border-ink-line px-3 py-2">
          <div>
            <p className="text-sm text-slate-200">Allow negative stock</p>
            <p className="text-xs text-slate-500">Let sales go below zero stock</p>
          </div>
          <Toggle on={f.allow_negative_inventory} onClick={() => set({ allow_negative_inventory: !f.allow_negative_inventory })} />
        </div>
        <button onClick={() => void save()} disabled={saving} className="btn-primary flex items-center gap-2"><Save className="h-4 w-4" /> Save Settings</button>
      </div>
    </div>
  )
}

function ReceiptSettingsTab(): React.JSX.Element {
  const { settings, update } = useSettings()
  const [f, setF] = useState({ receipt_header: settings?.receipt_header ?? '', receipt_footer: settings?.receipt_footer ?? '', receipt_printer: settings?.receipt_printer ?? '' })
  const set = (patch: Partial<typeof f>) => setF((p) => ({ ...p, ...patch }))
  const [saving, setSaving] = useState(false)

  const save = async () => {
    setSaving(true)
    try {
      await update({ receipt_header: f.receipt_header, receipt_footer: f.receipt_footer, receipt_printer: f.receipt_printer })
      toastSuccess('Receipt settings saved')
    } catch (e) { toastError('Save failed', String((e as Error)?.message || e)) } finally { setSaving(false) }
  }

  return (
    <div className="card max-w-xl p-5">
      <div className="space-y-3">
        <div><label className="label">Receipt Header (shown on top)</label><textarea value={f.receipt_header} onChange={(e) => set({ receipt_header: e.target.value })} rows={2} className="input w-full" /></div>
        <div><label className="label">Receipt Footer (message at bottom)</label><textarea value={f.receipt_footer} onChange={(e) => set({ receipt_footer: e.target.value })} rows={2} className="input w-full" /></div>
        <div><label className="label">Receipt Printer</label><input value={f.receipt_printer} onChange={(e) => set({ receipt_printer: e.target.value })} className="input w-full" placeholder="Leave blank for system default" /></div>
        <button onClick={() => void save()} disabled={saving} className="btn-primary flex items-center gap-2"><Save className="h-4 w-4" /> Save Receipt</button>
      </div>
    </div>
  )
}

interface UserForm { id: number | null; username: string; password: string; pin: string; full_name: string; roles: string[] }

function UsersTab(): React.JSX.Element {
  const [users, setUsers] = useState<User[]>([])
  const [editing, setEditing] = useState<UserForm | null>(null)
  const [roles, setRoles] = useState<string[]>([])
  const [resetPin, setResetPin] = useState<{ id: number; full_name: string } | null>(null)

  const load = async () => {
    try {
      const [u, r] = await Promise.all([window.api.users.list(), window.api.users.roles()])
      setUsers(u)
      setRoles(r)
    } catch (e) { toastError('Failed to load users', String((e as Error)?.message || e)) }
  }
  useEffect(() => { void load() }, [])

  const save = async (f: UserForm) => {
    try {
      if (f.id) {
        await window.api.users.update(f.id, { username: f.username, full_name: f.full_name, roles: f.roles, password: f.password || undefined, pin: f.pin || undefined })
        toastSuccess('User updated')
      } else {
        await window.api.users.create({ username: f.username, password: f.password, pin: f.pin, full_name: f.full_name, roles: f.roles })
        toastSuccess('User created')
      }
      setEditing(null)
      void load()
    } catch (e) { toastError('Save failed', String((e as Error)?.message || e)) }
  }

  return (
    <div className="max-w-2xl">
      <div className="mb-4 flex justify-between">
        <p className="text-sm text-slate-400">{users.length} users</p>
        <button onClick={() => setEditing({ id: null, username: '', password: '', pin: '', full_name: '', roles: ['CASHIER'] })} className="btn-primary flex items-center gap-2"><UserPlus className="h-4 w-4" /> New User</button>
      </div>
      <div className="card overflow-hidden">
        <table className="table">
          <thead><tr><th>User</th><th>Username</th><th>Roles</th><th>Status</th><th className="w-28">Actions</th></tr></thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id}>
                <td className="font-medium text-slate-200">{u.full_name}</td>
                <td className="text-slate-400">{u.username}</td>
                <td className="text-slate-300">{u.roles.join(', ')}</td>
                <td><span className={`badge ${u.is_active ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' : 'bg-slate-500/10 text-slate-400 border-slate-500/30'}`}>{u.is_active ? 'Active' : 'Inactive'}</span></td>
                <td>
                  <div className="flex gap-1">
                    <button onClick={() => setEditing({ id: u.id, username: u.username, password: '', pin: '', full_name: u.full_name, roles: u.roles })} className="btn-ghost-2 rounded-lg p-2" title="Edit"><Pencil className="h-4 w-4" /></button>
                    <button onClick={() => setResetPin({ id: u.id, full_name: u.full_name })} className="btn-ghost-2 rounded-lg p-2" title="Reset PIN"><KeyRound className="h-4 w-4" /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {editing && <UserModal form={editing} roles={roles} onSave={save} onClose={() => setEditing(null)} />}
      {resetPin && <ResetPinModal user={resetPin} onClose={() => setResetPin(null)} />}
    </div>
  )
}

function UserModal({ form, roles, onSave, onClose }: { form: UserForm; roles: string[]; onSave: (f: UserForm) => void; onClose: () => void }): React.JSX.Element {
  const [f, setF] = useState<UserForm>(form)
  const set = (patch: Partial<UserForm>) => setF((p) => ({ ...p, ...patch }))
  const isNew = f.id === null

  return (
    <Modal open onClose={onClose} title={isNew ? 'New User' : `Edit ${f.full_name}`} maxWidth="max-w-md" footer={
      <>
        <button onClick={onClose} className="btn-ghost">Cancel</button>
        <button onClick={() => onSave(f)} className="btn-primary">Save</button>
      </>
    }>
      <form onSubmit={(e) => { e.preventDefault(); onSave(f) }} className="space-y-3">
        <div><label className="label">Full Name *</label><input required value={f.full_name} onChange={(e) => set({ full_name: e.target.value })} className="input w-full" /></div>
        <div><label className="label">Username *</label><input required value={f.username} onChange={(e) => set({ username: e.target.value })} className="input w-full" /></div>
        {isNew && (
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label">Password *</label><input type="password" required value={f.password} onChange={(e) => set({ password: e.target.value })} className="input w-full" /></div>
            <div><label className="label">PIN (4 digits) *</label><input required value={f.pin} maxLength={4} onChange={(e) => set({ pin: e.target.value.replace(/\D/g, '') })} className="input w-full" /></div>
          </div>
        )}
        <div><label className="label">Roles</label>
          <div className="flex flex-wrap gap-2">
            {roles.map((r) => (
              <button key={r} type="button" onClick={() => set({ roles: f.roles.includes(r) ? f.roles.filter((x) => x !== r) : [...f.roles, r] })} className={`badge cursor-pointer border ${f.roles.includes(r) ? 'bg-brand-600/20 text-brand-300 border-brand-500/40' : 'bg-ink-800 text-slate-400 border-ink-line'}`}>{r}</button>
            ))}
          </div>
        </div>
      </form>
    </Modal>
  )
}

function ResetPinModal({ user, onClose }: { user: { id: number; full_name: string }; onClose: () => void }): React.JSX.Element {
  const [pin, setPin] = useState('')
  const [saving, setSaving] = useState(false)
  const submit = async () => {
    if (pin.length !== 4) { toastError('PIN must be 4 digits'); return }
    setSaving(true)
    try {
      await window.api.auth.adminResetPin(user.id, pin)
      toastSuccess('PIN reset')
      onClose()
    } catch (e) { toastError('Reset failed', String((e as Error)?.message || e)) } finally { setSaving(false) }
  }
  return (
    <Modal open onClose={onClose} title={`Reset PIN — ${user.full_name}`} maxWidth="max-w-xs" footer={
      <>
        <button onClick={onClose} className="btn-ghost">Cancel</button>
        <button onClick={() => void submit()} disabled={saving} className="btn-primary">Reset</button>
      </>
    }>
      <label className="label">New 4-digit PIN</label>
      <input value={pin} maxLength={4} onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))} className="input w-full text-2xl tracking-widest" autoFocus />
    </Modal>
  )
}
