'use client'

import { useEffect, useState } from 'react'
import { api, fmtDate, fmtCurrency, PROJECT_STATUSES, DEPARTMENTS, PROJECT_CATEGORIES, GRIEVANCE_STATUSES, loc } from '@/lib/site/config'
import { useT } from '@/lib/site/i18n'
import { StatusBadge, Loading, EmptyState, Emblem } from './shared'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { toast } from 'sonner'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import {
  LayoutDashboard, Inbox, HardHat, Newspaper, CalendarDays, Landmark, Images, FileText,
  Settings as SettingsIcon, LogOut, Plus, Pencil, Trash2, Search, Shield, TrendingUp, CheckCircle2, Clock, Menu, Languages, Info, Users, Map
} from 'lucide-react'

const FIELD_DEFS = {
  projects: [
    { k: 'title', t: 'text', label: 'Project Title', full: true, i18n: true },
    { k: 'description', t: 'textarea', label: 'Description', full: true, i18n: true },
    { k: 'department', t: 'select', label: 'Department', options: DEPARTMENTS },
    { k: 'category', t: 'select', label: 'Category', options: PROJECT_CATEGORIES },
    { k: 'status', t: 'select', label: 'Status', options: PROJECT_STATUSES },
    { k: 'progress', t: 'number', label: 'Progress %' },
    { k: 'location', t: 'text', label: 'Location', i18n: true },
    { k: 'village', t: 'text', label: 'Village', i18n: true },
    { k: 'gram_panchayat', t: 'text', label: 'Gram Panchayat', i18n: true },
    { k: 'year', t: 'number', label: 'Year' },
    { k: 'sanctioned_amount', t: 'number', label: 'Sanctioned Amount (\u20b9)' },
    { k: 'estimated_amount', t: 'number', label: 'Estimated Amount (\u20b9)' },
    { k: 'image', t: 'image', label: 'Image', full: true },
    { k: 'featured', t: 'checkbox', label: 'Show on homepage (featured)' },
  ],
  news: [
    { k: 'title', t: 'text', label: 'Title', full: true, i18n: true },
    { k: 'category', t: 'text', label: 'Category' },
    { k: 'author', t: 'text', label: 'Author' },
    { k: 'excerpt', t: 'textarea', label: 'Excerpt', full: true, i18n: true },
    { k: 'content', t: 'textarea', label: 'Content', full: true, i18n: true },
    { k: 'cover_image', t: 'image', label: 'Cover Image', full: true },
    { k: 'date', t: 'date', label: 'Date' },
    { k: 'featured', t: 'checkbox', label: 'Featured' },
  ],
  events: [
    { k: 'title', t: 'text', label: 'Title', full: true, i18n: true },
    { k: 'category', t: 'text', label: 'Category' },
    { k: 'date', t: 'date', label: 'Date' },
    { k: 'location', t: 'text', label: 'Location', i18n: true },
    { k: 'description', t: 'textarea', label: 'Description', full: true, i18n: true },
    { k: 'image', t: 'image', label: 'Image', full: true },
  ],
  schemes: [
    { k: 'name', t: 'text', label: 'Scheme Name', full: true, i18n: true },
    { k: 'scope', t: 'select', label: 'Scope', options: ['State Government', 'Central Government', 'Constituency Initiative'] },
    { k: 'department', t: 'text', label: 'Department' },
    { k: 'description', t: 'textarea', label: 'Description', full: true, i18n: true },
    { k: 'eligibility', t: 'textarea', label: 'Eligibility', full: true, i18n: true },
    { k: 'benefits', t: 'textarea', label: 'Benefits', full: true, i18n: true },
    { k: 'documents_required', t: 'textarea', label: 'Documents Required', full: true, i18n: true },
    { k: 'official_link', t: 'text', label: 'Official Link', full: true },
  ],
  gallery: [
    { k: 'title', t: 'text', label: 'Title', full: true, i18n: true },
    { k: 'category', t: 'text', label: 'Category' },
    { k: 'order', t: 'number', label: 'Order' },
    { k: 'image', t: 'image', label: 'Image', full: true },
  ],
  documents: [
    { k: 'title', t: 'text', label: 'Title', full: true, i18n: true },
    { k: 'category', t: 'text', label: 'Category' },
    { k: 'file_size', t: 'text', label: 'File Size' },
    { k: 'date', t: 'date', label: 'Date' },
    { k: 'file_url', t: 'text', label: 'File URL', full: true },
    { k: 'description', t: 'textarea', label: 'Description', full: true, i18n: true },
  ],
}
const TITLE_KEY = { projects: 'title', news: 'title', events: 'title', schemes: 'name', gallery: 'title', documents: 'title' }

function toInputDate(d) { if (!d) return ''; try { return new Date(d).toISOString().slice(0, 10) } catch { return '' } }

function EntityForm({ type, item, onClose, onSaved }) {
  const defs = FIELD_DEFS[type]
  const [form, setForm] = useState(() => {
    const base = {}
    defs.forEach(d => {
      base[d.k] = item ? (d.t === 'date' ? toInputDate(item[d.k]) : (item[d.k] ?? (d.t === 'checkbox' ? false : ''))) : (d.t === 'checkbox' ? false : '')
      if (d.i18n) {
        base[`${d.k}_kn`] = item ? (item[`${d.k}_kn`] ?? '') : ''
        base[`${d.k}_mr`] = item ? (item[`${d.k}_mr`] ?? '') : ''
        base[`${d.k}_hi`] = item ? (item[`${d.k}_hi`] ?? '') : ''
      }
    })
    return base
  })
  const [saving, setSaving] = useState(false)
  const set = (k, v) => setForm(s => ({ ...s, [k]: v }))
  const save = async () => {
    setSaving(true)
    try {
      const payload = { ...form }
      defs.forEach(d => { if (d.t === 'number' && payload[d.k] !== '') payload[d.k] = Number(payload[d.k]) })
      if (item) await api(`/admin/${type}/${item.id}`, { method: 'PUT', body: JSON.stringify(payload) })
      else await api(`/admin/${type}`, { method: 'POST', body: JSON.stringify(payload) })
      toast.success('Saved')
      onSaved()
    } catch (e) { toast.error(e.message) } finally { setSaving(false) }
  }
  const fieldInput = (key, type, options) => {
    if (type === 'textarea') return <Textarea rows={3} value={form[key] || ''} onChange={e => set(key, e.target.value)} />
    if (type === 'select') return <Select value={form[key]} onValueChange={v => set(key, v)}><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger><SelectContent>{options.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent></Select>
    if (type === 'number') return <Input type="number" value={form[key]} onChange={e => set(key, e.target.value)} />
    if (type === 'date') return <Input type="date" value={form[key]} onChange={e => set(key, e.target.value)} />
    if (type === 'image') return (
      <div className="space-y-2">
        {form[key] && <img src={form[key]} alt="Preview" className="h-32 object-contain rounded border" />}
        <Input type="file" accept="image/png, image/jpeg, image/webp" onChange={async (e) => {
          const file = e.target.files?.[0]; if (!file) return;
          const fd = new FormData(); fd.append('file', file);
          try {
            const res = await fetch('/api/upload', { method: 'POST', body: fd, headers: { Authorization: `Bearer ${localStorage.getItem('vsh_token')}` } })
            const data = await res.json()
            if (data.error) throw new Error(data.error)
            set(key, data.url)
          } catch(err) { toast.error(err.message) }
        }} />
      </div>
    )
    return <Input value={form[key] || ''} onChange={e => set(key, e.target.value)} />
  }
  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-auto">
        <DialogHeader><DialogTitle>{item ? 'Edit' : 'Add'} {type.slice(0, -1)}</DialogTitle></DialogHeader>
        <div className="grid gap-4 sm:grid-cols-2">
          {defs.map(d => (
            <div key={d.k} className={d.full || d.t === 'textarea' || d.i18n ? 'sm:col-span-2' : ''}>
              {d.t === 'checkbox' ? (
                <label className="flex items-center gap-2 mt-1"><Checkbox checked={!!form[d.k]} onCheckedChange={v => set(d.k, !!v)} /><span className="text-sm">{d.label}</span></label>
              ) : d.i18n ? (
                <div className="rounded-lg border p-3 bg-slate-50/60">
                  <div className="flex items-center gap-2 mb-2"><Languages className="h-3.5 w-3.5 text-brand-gold" /><span className="text-sm font-semibold text-brand-navy">{d.label}</span><span className="text-[11px] text-muted-foreground">(multilingual)</span></div>
                  <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-4">
                    <div><Label className="mb-1 block text-xs text-muted-foreground">English</Label>{fieldInput(d.k, d.t)}</div>
                    <div><Label className="mb-1 block text-xs text-muted-foreground">ಕನ್ನಡ (Kannada)</Label>{fieldInput(`${d.k}_kn`, d.t)}</div>
                    <div><Label className="mb-1 block text-xs text-muted-foreground">मराठी (Marathi)</Label>{fieldInput(`${d.k}_mr`, d.t)}</div>
                    <div><Label className="mb-1 block text-xs text-muted-foreground">हिंदी (Hindi)</Label>{fieldInput(`${d.k}_hi`, d.t)}</div>
                  </div>
                </div>
              ) : (
                <>
                  <Label className="mb-1.5 block">{d.label}</Label>
                  {fieldInput(d.k, d.t, d.options)}
                </>
              )}
            </div>
          ))}
        </div>
        <DialogFooter><Button variant="outline" onClick={onClose}>Cancel</Button><Button className="bg-brand-navy hover:bg-brand-navy-2" disabled={saving} onClick={save}>{saving ? 'Saving\u2026' : 'Save'}</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function GenericManager({ type, label }) {
  const { lang } = useT()
  const [items, setItems] = useState([]); const [loading, setLoading] = useState(true)
  const [q, setQ] = useState(''); const [editing, setEditing] = useState(undefined)
  const load = async () => { setLoading(true); try { setItems(await api(`/${type}`)) } catch (e) {} finally { setLoading(false) } }
  useEffect(() => { load() }, [type])
  const del = async (id) => { if (!confirm('Delete this item?')) return; try { await api(`/admin/${type}/${id}`, { method: 'DELETE' }); toast.success('Deleted'); load() } catch (e) { toast.error(e.message) } }
  const tk = TITLE_KEY[type]
  const filtered = items.filter(i => !q || String(loc(i, tk, lang) || '').toLowerCase().includes(q.toLowerCase()))
  return (
    <div>
      <div className="flex items-center justify-between gap-4 mb-6 flex-wrap">
        <div><h2 className="font-display text-2xl font-bold text-brand-navy">{label}</h2><p className="text-sm text-muted-foreground">{items.length} item(s)</p></div>
        <div className="flex gap-2">
          <div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input className="pl-9 w-56" placeholder="Search\u2026" value={q} onChange={e => setQ(e.target.value)} /></div>
          <Button className="bg-brand-navy hover:bg-brand-navy-2" onClick={() => setEditing(null)}><Plus className="h-4 w-4 mr-1.5" />Add</Button>
        </div>
      </div>
      {loading ? <Loading /> : filtered.length === 0 ? <EmptyState title="No items" desc="Click Add to create one." /> : (
        <Card className="overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase text-muted-foreground"><tr><th className="px-4 py-3">Title</th><th className="px-4 py-3 hidden md:table-cell">Category / Status</th><th className="px-4 py-3 hidden lg:table-cell">Date</th><th className="px-4 py-3 text-right">Actions</th></tr></thead>
            <tbody className="divide-y">
              {filtered.map(i => (
                <tr key={i.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium text-brand-navy max-w-xs truncate">{loc(i, tk, lang)}</td>
                  <td className="px-4 py-3 hidden md:table-cell">{i.status ? <StatusBadge status={i.status} /> : (i.category || i.scope || '\u2014')}</td>
                  <td className="px-4 py-3 hidden lg:table-cell text-muted-foreground">{fmtDate(i.date || i.created_at)}</td>
                  <td className="px-4 py-3 text-right whitespace-nowrap">
                    <Button size="icon" variant="ghost" onClick={() => setEditing(i)}><Pencil className="h-4 w-4" /></Button>
                    <Button size="icon" variant="ghost" className="text-red-600" onClick={() => del(i.id)}><Trash2 className="h-4 w-4" /></Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
      {editing !== undefined && <EntityForm type={type} item={editing} onClose={() => setEditing(undefined)} onSaved={() => { setEditing(undefined); load() }} />}
    </div>
  )
}

function Requests() {
  const [items, setItems] = useState([]); const [loading, setLoading] = useState(true)
  const [q, setQ] = useState(''); const [status, setStatus] = useState('all'); const [active, setActive] = useState(null)
  const load = async () => { setLoading(true); try { const p = new URLSearchParams(); if (q) p.set('q', q); if (status !== 'all') p.set('status', status); setItems(await api(`/admin/grievances?${p}`)) } catch (e) { toast.error(e.message) } finally { setLoading(false) } }
  useEffect(() => { load() }, [status])
  const update = async (id, body) => { try { const r = await api(`/admin/grievances/${id}`, { method: 'PUT', body: JSON.stringify(body) }); setActive(r); toast.success('Updated'); load() } catch (e) { toast.error(e.message) } }
  return (
    <div>
      <h2 className="font-display text-2xl font-bold text-brand-navy mb-1">Citizen Requests</h2>
      <p className="text-sm text-muted-foreground mb-6">Review, assign, respond to and resolve citizen grievances.</p>
      <div className="flex gap-2 mb-4 flex-wrap">
        <div className="relative flex-1 min-w-[200px]"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input className="pl-9" placeholder="Search by ID, name, mobile\u2026" value={q} onChange={e => setQ(e.target.value)} onKeyDown={e => e.key === 'Enter' && load()} /></div>
        <Select value={status} onValueChange={setStatus}><SelectTrigger className="w-48"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All Statuses</SelectItem>{GRIEVANCE_STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select>
        <Button variant="outline" onClick={load}>Search</Button>
      </div>
      {loading ? <Loading /> : items.length === 0 ? <EmptyState icon={Inbox} title="No requests" /> : (
        <Card className="overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase text-muted-foreground"><tr><th className="px-4 py-3">Tracking ID</th><th className="px-4 py-3 hidden md:table-cell">Citizen</th><th className="px-4 py-3 hidden lg:table-cell">Category</th><th className="px-4 py-3">Status</th><th className="px-4 py-3 hidden md:table-cell">Date</th><th className="px-4 py-3"></th></tr></thead>
            <tbody className="divide-y">
              {items.map(r => (
                <tr key={r.id} className="hover:bg-slate-50 cursor-pointer" onClick={() => setActive(r)}>
                  <td className="px-4 py-3 font-mono font-medium text-brand-navy">{r.tracking_id}</td>
                  <td className="px-4 py-3 hidden md:table-cell">{r.name}<div className="text-xs text-muted-foreground">{r.mobile}</div></td>
                  <td className="px-4 py-3 hidden lg:table-cell text-muted-foreground">{r.category}</td>
                  <td className="px-4 py-3"><StatusBadge status={r.status} /></td>
                  <td className="px-4 py-3 hidden md:table-cell text-muted-foreground">{fmtDate(r.created_at)}</td>
                  <td className="px-4 py-3 text-right"><Button size="sm" variant="ghost">Manage</Button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
      {active && <RequestDrawer r={active} onClose={() => setActive(null)} onUpdate={update} />}
    </div>
  )
}

function RequestDrawer({ r, onClose, onUpdate }) {
  const [status, setStatus] = useState(r.status)
  const [note, setNote] = useState('')
  const [assigned, setAssigned] = useState(r.assigned_to || '')
  const [internal, setInternal] = useState('')
  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-auto">
        <DialogHeader><DialogTitle className="font-mono">{r.tracking_id}</DialogTitle></DialogHeader>
        <div className="grid sm:grid-cols-2 gap-3 text-sm">
          <div><span className="text-muted-foreground">Name:</span> <b className="text-brand-navy">{r.name}</b></div>
          <div><span className="text-muted-foreground">Mobile:</span> <b className="text-brand-navy">{r.mobile}</b></div>
          <div><span className="text-muted-foreground">Type:</span> {r.type}</div>
          <div><span className="text-muted-foreground">Category:</span> {r.category}</div>
          <div className="sm:col-span-2"><span className="text-muted-foreground">Village / GP:</span> {r.village || '\u2014'} / {r.gram_panchayat || '\u2014'}</div>
          <div className="sm:col-span-2"><span className="text-muted-foreground">Description:</span><p className="mt-1 text-brand-navy">{r.description}</p></div>
        </div>
        <div className="border-t pt-4 grid gap-3">
          <div className="grid sm:grid-cols-2 gap-3">
            <div><Label className="mb-1.5 block">Update Status</Label><Select value={status} onValueChange={setStatus}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{GRIEVANCE_STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select></div>
            <div><Label className="mb-1.5 block">Assign To</Label><Input value={assigned} onChange={e => setAssigned(e.target.value)} placeholder="Officer name" /></div>
          </div>
          <div><Label className="mb-1.5 block">Public note (visible to citizen)</Label><Textarea rows={2} value={note} onChange={e => setNote(e.target.value)} /></div>
          <Button className="bg-brand-navy hover:bg-brand-navy-2" onClick={() => onUpdate(r.id, { status, public_note: note, assigned_to: assigned })}>Save & Notify</Button>
          <div><Label className="mb-1.5 block">Add internal note (staff only)</Label><div className="flex gap-2"><Input value={internal} onChange={e => setInternal(e.target.value)} placeholder="Internal note\u2026" /><Button variant="outline" onClick={() => { onUpdate(r.id, { internal_note: internal }); setInternal('') }}>Add</Button></div></div>
        </div>
        <div className="border-t pt-4">
          <h4 className="font-semibold text-brand-navy mb-2 text-sm">Audit Trail</h4>
          <div className="space-y-2 text-xs">
            {(r.updates || []).map((u, i) => <div key={i} className="text-muted-foreground"><b className="text-brand-navy">{u.status}</b> \u2014 {u.note} <span className="opacity-70">({fmtDate(u.at)})</span></div>)}
            {(r.internal_notes || []).map((u, i) => <div key={i} className="text-amber-700">Internal: {u.note} <span className="opacity-70">\u2014 {u.by}, {fmtDate(u.at)}</span></div>)}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function Dashboard({ stats }) {
  if (!stats) return <Loading />
  const cards = [
    { label: 'Total Projects', value: stats.projects, icon: HardHat, color: 'bg-blue-50 text-blue-700' },
    { label: 'Ongoing', value: stats.ongoing, icon: TrendingUp, color: 'bg-amber-50 text-amber-700' },
    { label: 'Completed', value: stats.completed, icon: CheckCircle2, color: 'bg-emerald-50 text-emerald-700' },
    { label: 'Citizen Requests', value: stats.requests, icon: Inbox, color: 'bg-indigo-50 text-indigo-700' },
    { label: 'Pending Requests', value: stats.pendingRequests, icon: Clock, color: 'bg-red-50 text-red-700' },
    { label: 'News Articles', value: stats.news, icon: Newspaper, color: 'bg-slate-100 text-slate-700' },
    { label: 'Events', value: stats.events, icon: CalendarDays, color: 'bg-purple-50 text-purple-700' },
    { label: 'Gallery Items', value: stats.gallery, icon: Images, color: 'bg-teal-50 text-teal-700' },
  ]
  const byStatus = [
    { name: 'Proposed', value: stats.proposed }, { name: 'Approved', value: stats.approved },
    { name: 'Ongoing', value: stats.ongoing }, { name: 'Completed', value: stats.completed }, { name: 'Delayed', value: stats.delayed },
  ]
  const COLORS = ['#94a3b8', '#3b82f6', '#f59e0b', '#10b981', '#ef4444']
  return (
    <div>
      <h2 className="font-display text-2xl font-bold text-brand-navy mb-6">Dashboard</h2>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {cards.map(c => (
          <Card key={c.label} className="p-5"><div className={`h-10 w-10 rounded-lg flex items-center justify-center ${c.color}`}><c.icon className="h-5 w-5" /></div><div className="mt-3 text-3xl font-bold text-brand-navy">{c.value}</div><div className="text-sm text-muted-foreground">{c.label}</div></Card>
        ))}
      </div>
      <div className="grid lg:grid-cols-2 gap-6">
        <Card className="p-6"><h3 className="font-semibold text-brand-navy mb-4">Projects by Status</h3><ResponsiveContainer width="100%" height={260}><BarChart data={byStatus}><XAxis dataKey="name" fontSize={12} /><YAxis allowDecimals={false} fontSize={12} /><Tooltip /><Bar dataKey="value" radius={[6, 6, 0, 0]}>{byStatus.map((e, i) => <Cell key={i} fill={COLORS[i]} />)}</Bar></BarChart></ResponsiveContainer></Card>
        <Card className="p-6"><h3 className="font-semibold text-brand-navy mb-4">Project Distribution</h3><ResponsiveContainer width="100%" height={260}><PieChart><Pie data={byStatus} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label>{byStatus.map((e, i) => <Cell key={i} fill={COLORS[i]} />)}</Pie><Tooltip /></PieChart></ResponsiveContainer></Card>
      </div>
    </div>
  )
}

function SettingsPanel({ settings, reload }) {
  const [form, setForm] = useState(settings || {})
  const [saving, setSaving] = useState(false)
  useEffect(() => { setForm(settings || {}) }, [settings])
  const set = (k, v) => setForm(s => ({ ...s, [k]: v }))
  const setStat = (i, k, v) => setForm(s => { const stats = [...(s.stats || [])]; stats[i] = { ...stats[i], [k]: k === 'value' ? Number(v) : v }; return { ...s, stats } })
  const save = async () => { setSaving(true); try { await api('/admin/settings', { method: 'PUT', body: JSON.stringify(form) }); toast.success('Settings saved'); reload() } catch (e) { toast.error(e.message) } finally { setSaving(false) } }
  const fields = [
    ['mla_name', 'MLA Name'], ['designation', 'Designation'], ['constituency', 'Constituency'], ['party', 'Party'],
    ['photo_url', 'Photograph URL'], ['office_address', 'Office Address'], ['office_phone', 'Office Phone'],
    ['office_email', 'Office Email'], ['office_hours', 'Office Hours'],
  ]
  return (
    <div className="max-w-3xl">
      <h2 className="font-display text-2xl font-bold text-brand-navy mb-6">Website Settings</h2>
      <Card className="p-6 space-y-6">
        <div className="grid sm:grid-cols-2 gap-4">
          {fields.map(([k, l]) => <div key={k}><Label className="mb-1.5 block">{l}</Label><Input value={form[k] || ''} onChange={e => set(k, e.target.value)} /></div>)}
        </div>
        
        <div className="rounded-lg border p-4 bg-slate-50/60">
          <div className="flex items-center gap-2 mb-3"><Languages className="h-4 w-4 text-brand-gold" /><span className="text-sm font-semibold text-brand-navy">Hero Message</span></div>
          <div className="grid gap-3 md:grid-cols-2">
            <div><Label className="mb-1.5 block text-xs text-muted-foreground">English</Label><Textarea rows={3} value={form.hero_message || ''} onChange={e => set('hero_message', e.target.value)} /></div>
            <div><Label className="mb-1.5 block text-xs text-muted-foreground">Kannada</Label><Textarea rows={3} value={form.hero_message_kn || ''} onChange={e => set('hero_message_kn', e.target.value)} /></div>
            <div><Label className="mb-1.5 block text-xs text-muted-foreground">Marathi</Label><Textarea rows={3} value={form.hero_message_mr || ''} onChange={e => set('hero_message_mr', e.target.value)} /></div>
            <div><Label className="mb-1.5 block text-xs text-muted-foreground">Hindi</Label><Textarea rows={3} value={form.hero_message_hi || ''} onChange={e => set('hero_message_hi', e.target.value)} /></div>
          </div>
        </div>

        <div className="rounded-lg border p-4 bg-slate-50/60">
          <div className="flex items-center gap-2 mb-3"><Languages className="h-4 w-4 text-brand-gold" /><span className="text-sm font-semibold text-brand-navy">Official Quote</span></div>
          <div className="grid gap-3 md:grid-cols-2">
            <div><Label className="mb-1.5 block text-xs text-muted-foreground">English</Label><Textarea rows={2} value={form.official_quote || ''} onChange={e => set('official_quote', e.target.value)} /></div>
            <div><Label className="mb-1.5 block text-xs text-muted-foreground">Kannada</Label><Textarea rows={2} value={form.official_quote_kn || ''} onChange={e => set('official_quote_kn', e.target.value)} /></div>
            <div><Label className="mb-1.5 block text-xs text-muted-foreground">Marathi</Label><Textarea rows={2} value={form.official_quote_mr || ''} onChange={e => set('official_quote_mr', e.target.value)} /></div>
            <div><Label className="mb-1.5 block text-xs text-muted-foreground">Hindi</Label><Textarea rows={2} value={form.official_quote_hi || ''} onChange={e => set('official_quote_hi', e.target.value)} /></div>
          </div>
        </div>
        
        <div className="rounded-lg border p-4 bg-slate-50/60">
          <div className="flex items-center gap-2 mb-3"><Languages className="h-4 w-4 text-brand-gold" /><span className="text-sm font-semibold text-brand-navy">Biography (About Page)</span></div>
          <div className="grid gap-3 md:grid-cols-2">
            <div><Label className="mb-1.5 block text-xs text-muted-foreground">English</Label><Textarea rows={4} value={form.biography || ''} onChange={e => set('biography', e.target.value)} /></div>
            <div><Label className="mb-1.5 block text-xs text-muted-foreground">Kannada</Label><Textarea rows={4} value={form.biography_kn || ''} onChange={e => set('biography_kn', e.target.value)} /></div>
            <div><Label className="mb-1.5 block text-xs text-muted-foreground">Marathi</Label><Textarea rows={4} value={form.biography_mr || ''} onChange={e => set('biography_mr', e.target.value)} /></div>
            <div><Label className="mb-1.5 block text-xs text-muted-foreground">Hindi</Label><Textarea rows={4} value={form.biography_hi || ''} onChange={e => set('biography_hi', e.target.value)} /></div>
          </div>
        </div>
      </Card>
      <Card className="p-6 mt-6">
        <h3 className="font-semibold text-brand-navy mb-4">Homepage Statistics</h3>
        <div className="space-y-3">
          {(form.stats || []).map((s, i) => (
            <div key={i} className="border-b border-dashed pb-4 mb-4 last:border-0 last:mb-0 last:pb-0">
              <div className="grid grid-cols-[1fr_120px_80px] gap-3 mb-2">
                <div><Label className="text-xs text-muted-foreground mb-1 block">Label (English)</Label><Input value={s.label} onChange={e => setStat(i, 'label', e.target.value)} /></div>
                <div><Label className="text-xs text-muted-foreground mb-1 block">Value</Label><Input type="number" value={s.value} onChange={e => setStat(i, 'value', e.target.value)} /></div>
                <div><Label className="text-xs text-muted-foreground mb-1 block">Suffix</Label><Input value={s.suffix} onChange={e => setStat(i, 'suffix', e.target.value)} placeholder="+" /></div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div><Label className="text-[10px] text-muted-foreground mb-1 block">Label (Kannada)</Label><Input value={s.label_kn || ''} onChange={e => setStat(i, 'label_kn', e.target.value)} /></div>
                <div><Label className="text-[10px] text-muted-foreground mb-1 block">Label (Marathi)</Label><Input value={s.label_mr || ''} onChange={e => setStat(i, 'label_mr', e.target.value)} /></div>
                <div><Label className="text-[10px] text-muted-foreground mb-1 block">Label (Hindi)</Label><Input value={s.label_hi || ''} onChange={e => setStat(i, 'label_hi', e.target.value)} /></div>
              </div>
            </div>
          ))}
        </div>
      </Card>
      <Button className="mt-6 bg-brand-navy hover:bg-brand-navy-2" disabled={saving} onClick={save}>{saving ? 'Saving\u2026' : 'Save All Settings'}</Button>
    </div>
  )
}

function AboutManager({ settings, reload }) {
  const [sections, setSections] = useState(settings?.about_sections || [])
  const [saving, setSaving] = useState(false)
  
  const addSection = () => setSections([...sections, { id: Date.now().toString(), heading: '', content: '', image: '' }])
  const removeSection = (idx) => setSections(sections.filter((_, i) => i !== idx))
  const updateSection = (idx, key, val) => {
    const next = [...sections]
    next[idx][key] = val
    setSections(next)
  }
  
  const save = async () => {
    setSaving(true)
    try { 
      await api('/admin/settings', { method: 'PUT', body: JSON.stringify({ about_sections: sections }) })
      toast.success('About content saved')
      reload()
    } catch (e) { toast.error(e.message) } finally { setSaving(false) }
  }

  return (
    <div className="max-w-3xl">
      <div className="flex items-center justify-between mb-6">
        <div><h2 className="font-display text-2xl font-bold text-brand-navy">About Page Content</h2><p className="text-sm text-muted-foreground">Manage sections displayed on the public About page.</p></div>
        <Button className="bg-brand-navy hover:bg-brand-navy-2" disabled={saving} onClick={save}>{saving ? 'Saving...' : 'Publish Changes'}</Button>
      </div>
      <div className="space-y-4">
        {sections.map((s, i) => (
          <Card key={s.id} className="p-5 relative group">
            <Button size="icon" variant="ghost" className="absolute top-3 right-3 text-red-600 opacity-0 md:opacity-100 transition-opacity" onClick={() => removeSection(i)}><Trash2 className="h-4 w-4" /></Button>
            <div className="space-y-4 pr-10">
              <div className="rounded-lg border p-3 bg-slate-50/60">
                <div className="flex items-center gap-2 mb-2"><Languages className="h-3.5 w-3.5 text-brand-gold" /><span className="text-sm font-semibold text-brand-navy">Section Content (Multilingual)</span></div>
                
                <div className="space-y-4">
                  <div className="border-l-2 border-brand-navy pl-3">
                    <Label className="mb-1 block text-xs text-brand-navy font-semibold">English</Label>
                    <Input className="mb-2" value={s.heading || ''} onChange={e => updateSection(i, 'heading', e.target.value)} placeholder="Heading..." />
                    <Textarea rows={3} value={s.content || ''} onChange={e => updateSection(i, 'content', e.target.value)} placeholder="Content..." />
                  </div>
                  <div className="border-l-2 border-brand-gold pl-3">
                    <Label className="mb-1 block text-xs font-semibold text-muted-foreground">Kannada</Label>
                    <Input className="mb-2" value={s.heading_kn || ''} onChange={e => updateSection(i, 'heading_kn', e.target.value)} placeholder="Heading (KN)..." />
                    <Textarea rows={3} value={s.content_kn || ''} onChange={e => updateSection(i, 'content_kn', e.target.value)} placeholder="Content (KN)..." />
                  </div>
                  <div className="border-l-2 border-brand-gold pl-3">
                    <Label className="mb-1 block text-xs font-semibold text-muted-foreground">Marathi</Label>
                    <Input className="mb-2" value={s.heading_mr || ''} onChange={e => updateSection(i, 'heading_mr', e.target.value)} placeholder="Heading (MR)..." />
                    <Textarea rows={3} value={s.content_mr || ''} onChange={e => updateSection(i, 'content_mr', e.target.value)} placeholder="Content (MR)..." />
                  </div>
                  <div className="border-l-2 border-brand-gold pl-3">
                    <Label className="mb-1 block text-xs font-semibold text-muted-foreground">Hindi</Label>
                    <Input className="mb-2" value={s.heading_hi || ''} onChange={e => updateSection(i, 'heading_hi', e.target.value)} placeholder="Heading (HI)..." />
                    <Textarea rows={3} value={s.content_hi || ''} onChange={e => updateSection(i, 'content_hi', e.target.value)} placeholder="Content (HI)..." />
                  </div>
                </div>
              </div>
              
              <div>
                <Label className="mb-1.5 block">Section Image (Optional)</Label>
                <div className="flex items-center gap-4">
                  {s.image && <img src={s.image} alt="Preview" className="h-16 w-24 object-cover rounded" />}
                  <Input type="file" accept="image/png, image/jpeg, image/webp" onChange={async (e) => {
                    const file = e.target.files?.[0]; if (!file) return;
                    const fd = new FormData(); fd.append('file', file);
                    try {
                      const res = await fetch('/api/upload', { method: 'POST', body: fd, headers: { Authorization: `Bearer ${localStorage.getItem('vsh_token')}` } })
                      const data = await res.json()
                      if (data.error) throw new Error(data.error)
                      updateSection(i, 'image', data.url)
                    } catch(err) { toast.error(err.message) }
                  }} />
                </div>
              </div>
            </div>
          </Card>
        ))}
        <Button variant="outline" className="w-full border-dashed" onClick={addSection}><Plus className="h-4 w-4 mr-2" />Add New Section</Button>
      </div>
    </div>
  )
}

function ConstituencyManager({ settings, reload }) {
  const [form, setForm] = useState({
    constituency_desc: settings?.constituency_desc || 'Khanapur is a scenic and culturally rich constituency in Belagavi District, Karnataka. It encompasses over 200 villages with diverse communities speaking Kannada, Marathi, and Hindi.',
    constituency_desc_kn: settings?.constituency_desc_kn || '',
    constituency_desc_mr: settings?.constituency_desc_mr || '',
    constituency_desc_hi: settings?.constituency_desc_hi || '',
    constituency_map: settings?.constituency_map || 'https://www.openstreetmap.org/export/embed.html?bbox=74.0%2C15.5%2C75.5%2C16.9&layer=mapnik'
  })
  const setField = (k, v) => setForm(s => ({ ...s, [k]: v }))

  const [stats, setStats] = useState(settings?.constituency_stats || [
    { label: 'Population', value: '2.4 Lakh+' },
    { label: 'Villages', value: '220+' },
    { label: 'Gram Panchayats', value: '42' },
    { label: 'Taluks', value: '1 (Khanapur)' }
  ])
  const [saving, setSaving] = useState(false)
  
  const setStat = (i, k, v) => setStats(s => { const next = [...s]; next[i] = { ...next[i], [k]: v }; return next })
  const save = async () => {
    setSaving(true)
    try { 
      await api('/admin/settings', { method: 'PUT', body: JSON.stringify({ ...form, constituency_stats: stats }) })
      toast.success('Constituency content saved')
      reload()
    } catch (e) { toast.error(e.message) } finally { setSaving(false) }
  }

  return (
    <div className="max-w-3xl">
      <div className="flex items-center justify-between mb-6">
        <div><h2 className="font-display text-2xl font-bold text-brand-navy">Constituency Page</h2><p className="text-sm text-muted-foreground">Manage the content and map on the Constituency page.</p></div>
        <Button className="bg-brand-navy hover:bg-brand-navy-2" disabled={saving} onClick={save}>{saving ? 'Saving...' : 'Publish Changes'}</Button>
      </div>
      <Card className="p-6 space-y-4">
        <div className="rounded-lg border p-4 bg-slate-50/60">
          <div className="flex items-center gap-2 mb-3"><Languages className="h-4 w-4 text-brand-gold" /><span className="text-sm font-semibold text-brand-navy">Description</span></div>
          <div className="grid gap-3 md:grid-cols-2">
            <div><Label className="mb-1.5 block text-xs text-muted-foreground">English</Label><Textarea rows={4} value={form.constituency_desc} onChange={e => setField('constituency_desc', e.target.value)} /></div>
            <div><Label className="mb-1.5 block text-xs text-muted-foreground">Kannada</Label><Textarea rows={4} value={form.constituency_desc_kn} onChange={e => setField('constituency_desc_kn', e.target.value)} /></div>
            <div><Label className="mb-1.5 block text-xs text-muted-foreground">Marathi</Label><Textarea rows={4} value={form.constituency_desc_mr} onChange={e => setField('constituency_desc_mr', e.target.value)} /></div>
            <div><Label className="mb-1.5 block text-xs text-muted-foreground">Hindi</Label><Textarea rows={4} value={form.constituency_desc_hi} onChange={e => setField('constituency_desc_hi', e.target.value)} /></div>
          </div>
        </div>
        <div><Label className="mb-1.5 block mt-4">Map Embed URL (e.g. OpenStreetMap or Google Maps embed link)</Label><Input value={form.constituency_map} onChange={e => setField('constituency_map', e.target.value)} /></div>
      </Card>
      <Card className="p-6 mt-6">
        <h3 className="font-semibold text-brand-navy mb-4">Constituency Statistics</h3>
        <div className="space-y-3">
          {stats.map((s, i) => (
            <div key={i} className="border-b border-dashed pb-4 mb-4 last:border-0 last:mb-0 last:pb-0">
              <div className="flex gap-3 mb-2">
                <Input value={s.label} onChange={e => setStat(i, 'label', e.target.value)} placeholder="Label (English)" className="flex-1" />
                <Input value={s.value} onChange={e => setStat(i, 'value', e.target.value)} placeholder="Value" className="flex-1" />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div><Label className="text-[10px] text-muted-foreground mb-1 block">Label (Kannada)</Label><Input value={s.label_kn || ''} onChange={e => setStat(i, 'label_kn', e.target.value)} /></div>
                <div><Label className="text-[10px] text-muted-foreground mb-1 block">Label (Marathi)</Label><Input value={s.label_mr || ''} onChange={e => setStat(i, 'label_mr', e.target.value)} /></div>
                <div><Label className="text-[10px] text-muted-foreground mb-1 block">Label (Hindi)</Label><Input value={s.label_hi || ''} onChange={e => setStat(i, 'label_hi', e.target.value)} /></div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}

const MENU = [
  { k: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { k: 'requests', label: 'Citizen Requests', icon: Inbox },
  { k: 'projects', label: 'Development', icon: HardHat },
  { k: 'news', label: 'News', icon: Newspaper },
  { k: 'events', label: 'Events', icon: CalendarDays },
  { k: 'schemes', label: 'Schemes', icon: Landmark },
  { k: 'gallery', label: 'Gallery', icon: Images },
  { k: 'documents', label: 'Documents', icon: FileText },
  { k: 'about', label: 'About Page', icon: Info },
  { k: 'constituency', label: 'Constituency', icon: Map },
  { k: 'settings', label: 'Settings', icon: SettingsIcon },
]

export default function Admin({ go, reloadSettings }) {
  const [user, setUser] = useState(null)
  const [checking, setChecking] = useState(true)
  const [tab, setTab] = useState('dashboard')
  const [stats, setStats] = useState(null)
  const [settings, setSettings] = useState(null)
  const [creds, setCreds] = useState({ email: 'admin@vsh.gov.in', password: 'Admin@12345' })
  const [loggingIn, setLoggingIn] = useState(false)
  const [sidebar, setSidebar] = useState(false)

  useEffect(() => { (async () => { try { const r = await api('/auth/me'); setUser(r.user) } catch (e) { } finally { setChecking(false) } })() }, [])
  useEffect(() => { if (user) { api('/admin/stats').then(setStats).catch(() => {}); api('/settings').then(setSettings).catch(() => {}) } }, [user, tab])

  const login = async (e) => {
    e.preventDefault(); setLoggingIn(true)
    try { const r = await api('/auth/login', { method: 'POST', body: JSON.stringify(creds) }); localStorage.setItem('vsh_token', r.token); setUser(r.user); toast.success(`Welcome, ${r.user.name}`) }
    catch (err) { toast.error(err.message) } finally { setLoggingIn(false) }
  }
  const logout = () => { localStorage.removeItem('vsh_token'); setUser(null); go('home') }

  if (checking) return <div className="min-h-[60vh] flex items-center justify-center"><Loading /></div>

  if (!user) return (
    <div className="min-h-[80vh] flex items-center justify-center bg-brand-navy px-4">
      <Card className="w-full max-w-md p-8">
        <div className="flex flex-col items-center text-center mb-6"><Emblem size={56} /><h1 className="mt-4 font-display text-2xl font-bold text-brand-navy">Admin Console</h1><p className="text-sm text-muted-foreground">Office of the MLA \u2014 Content Management</p></div>
        <form onSubmit={login} className="space-y-4">
          <div><Label className="mb-1.5 block">Email</Label><Input type="email" value={creds.email} onChange={e => setCreds({ ...creds, email: e.target.value })} /></div>
          <div><Label className="mb-1.5 block">Password</Label><Input type="password" value={creds.password} onChange={e => setCreds({ ...creds, password: e.target.value })} /></div>
          <Button type="submit" disabled={loggingIn} className="w-full bg-brand-navy hover:bg-brand-navy-2"><Shield className="h-4 w-4 mr-2" />{loggingIn ? 'Signing in\u2026' : 'Sign In'}</Button>
        </form>
        <p className="mt-4 text-xs text-center text-muted-foreground">Demo credentials pre-filled. Change them in production.</p>
      </Card>
    </div>
  )

  return (
    <div className="flex min-h-[80vh] bg-slate-50">
      <aside className={`fixed lg:static z-40 inset-y-0 left-0 w-64 bg-brand-navy text-slate-300 flex flex-col transition-transform ${sidebar ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        <div className="p-5 flex items-center gap-3 border-b border-white/10"><Emblem size={40} /><div><div className="text-white font-display font-bold text-sm">Admin Console</div><div className="text-[11px] text-slate-400">{user.role}</div></div></div>
        <nav className="flex-1 p-3 space-y-1 overflow-auto">
          {MENU.map(m => (
            <button key={m.k} onClick={() => { setTab(m.k); setSidebar(false) }} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${tab === m.k ? 'bg-brand-gold text-brand-navy' : 'hover:bg-white/5 text-slate-300'}`}><m.icon className="h-4 w-4" />{m.label}</button>
          ))}
        </nav>
        <div className="p-3 border-t border-white/10 space-y-1">
          <button onClick={() => go('home')} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm hover:bg-white/5">View Website</button>
          <button onClick={logout} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-red-300 hover:bg-white/5"><LogOut className="h-4 w-4" />Logout</button>
        </div>
      </aside>
      {sidebar && <div className="fixed inset-0 bg-black/40 z-30 lg:hidden" onClick={() => setSidebar(false)} />}
      <main className="flex-1 min-w-0">
        <div className="lg:hidden sticky top-0 z-20 bg-white border-b p-3 flex items-center gap-3"><Button size="icon" variant="outline" onClick={() => setSidebar(true)}><Menu className="h-5 w-5" /></Button><span className="font-semibold text-brand-navy">Admin</span></div>
        <div className="p-6 md:p-8">
          {tab === 'dashboard' && <Dashboard stats={stats} />}
          {tab === 'requests' && <Requests />}
          {tab === 'projects' && <GenericManager type="projects" label="Development Projects" />}
          {tab === 'news' && <GenericManager type="news" label="News & Updates" />}
          {tab === 'events' && <GenericManager type="events" label="Events & Activities" />}
          {tab === 'schemes' && <GenericManager type="schemes" label="Government Schemes" />}
          { tab === 'gallery' && <GenericManager type="gallery" label="Gallery" /> }
          { tab === 'documents' && <GenericManager type="documents" label="Documents" /> }
          { tab === 'about' && <AboutManager settings={settings} reload={() => { api('/settings').then(s => { setSettings(s); reloadSettings && reloadSettings() }) }} /> }
          { tab === 'constituency' && <ConstituencyManager settings={settings} reload={() => { api('/settings').then(s => { setSettings(s); reloadSettings && reloadSettings() }) }} /> }
          { tab === 'settings' && <SettingsPanel settings={settings} reload={() => { api('/settings').then(s => { setSettings(s); reloadSettings && reloadSettings() }) }} /> }
        </div>
      </main>
    </div>
  )
}
