'use client'

import { useState } from 'react'
import { api, GRIEVANCE_CATEGORIES, GRIEVANCE_STATUSES, fmtDate } from '@/lib/site/config'
import { useT } from '@/lib/site/i18n'
import { PageBanner, StatusBadge, Loading } from './shared'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { IMAGES } from '@/lib/site/config'
import { toast } from 'sonner'
import { CheckCircle2, Copy, Search, MessageSquarePlus, Lightbulb, HandHelping, ShieldCheck, Clock } from 'lucide-react'

export function Grievance({ go }) {
  const { t } = useT()
  const [type, setType] = useState('Complaint')
  const [form, setForm] = useState({ name: '', mobile: '', email: '', address: '', village: '', gram_panchayat: '', category: '', description: '', consent: false })
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState(null)
  const set = (k, v) => setForm(s => ({ ...s, [k]: v }))

  const submit = async (e) => {
    e.preventDefault()
    if (!form.name || !form.mobile || !form.category || !form.description) { toast.error('Please fill all required fields'); return }
    if (!/^\d{10}$/.test(form.mobile)) { toast.error('Enter a valid 10-digit mobile number'); return }
    if (!form.consent) { toast.error('Please provide consent to proceed'); return }
    setSubmitting(true)
    try {
      const r = await api('/grievances', { method: 'POST', body: JSON.stringify({ ...form, type }) })
      setResult(r.tracking_id)
      toast.success('Request submitted successfully')
    } catch (err) { toast.error(err.message) } finally { setSubmitting(false) }
  }

  if (result) return (
    <div>
      <PageBanner title="Request Submitted" image={IMAGES.gov} breadcrumb={`${t('nav.home')} / ${t('sec.citizenServices')}`} />
      <div className="container py-16 max-w-xl">
        <Card className="p-8 text-center">
          <div className="mx-auto h-16 w-16 rounded-full bg-emerald-50 flex items-center justify-center"><CheckCircle2 className="h-8 w-8 text-emerald-600" /></div>
          <h2 className="mt-5 font-display text-2xl font-bold text-brand-navy">Your request has been successfully submitted.</h2>
          <p className="mt-2 text-muted-foreground">{t('track.subtitle')}</p>
          <div className="mt-6 flex items-center justify-center gap-3 rounded-xl bg-brand-cream p-4">
            <span className="font-mono text-xl font-bold text-brand-navy tracking-wider">{result}</span>
            <button onClick={() => { navigator.clipboard?.writeText(result); toast.success('Copied') }} className="text-brand-navy hover:text-brand-saffron"><Copy className="h-5 w-5" /></button>
          </div>
          <div className="mt-6 flex gap-3 justify-center">
            <Button onClick={() => go('track')} className="bg-brand-navy hover:bg-brand-navy-2"><Search className="h-4 w-4 mr-2" />{t('cta.track')}</Button>
            <Button variant="outline" onClick={() => { setResult(null); setForm({ name: '', mobile: '', email: '', address: '', village: '', gram_panchayat: '', category: '', description: '', consent: false }) }}>Submit another</Button>
          </div>
        </Card>
      </div>
    </div>
  )

  return (
    <div>
      <PageBanner title={t('grievance.title')} subtitle={t('grievance.subtitle')} image={IMAGES.community} breadcrumb={`${t('nav.home')} / ${t('sec.citizenServices')}`} />
      <div className="container py-10 grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <div className="grid grid-cols-3 gap-3 mb-6">
            {[[t('cs.complaint'), MessageSquarePlus, 'Complaint'], [t('cs.suggestion'), Lightbulb, 'Suggestion'], [t('cs.assistance'), HandHelping, 'Assistance']].map(([label, Icon, raw]) => (
              <button key={raw} onClick={() => setType(raw)} className={`rounded-xl border p-4 flex flex-col items-center gap-2 transition-all ${type === raw ? 'border-brand-gold bg-brand-cream' : 'hover:border-brand-gold/40'}`}>
                <Icon className={`h-5 w-5 ${type === raw ? 'text-brand-saffron' : 'text-brand-navy'}`} /><span className="text-sm font-medium text-brand-navy">{label}</span>
              </button>
            ))}
          </div>
          <Card className="p-6">
            <form onSubmit={submit} className="grid gap-4 md:grid-cols-2">
              <div><Label>{t('grievance.fullName')} *</Label><Input className="mt-1.5" value={form.name} onChange={e => set('name', e.target.value)} /></div>
              <div><Label>{t('grievance.mobile')} *</Label><Input className="mt-1.5" maxLength={10} value={form.mobile} onChange={e => set('mobile', e.target.value.replace(/\D/g, ''))} placeholder="10-digit mobile" /></div>
              <div><Label>{t('grievance.email')}</Label><Input type="email" className="mt-1.5" value={form.email} onChange={e => set('email', e.target.value)} /></div>
              <div><Label>{t('grievance.category')} *</Label><Select value={form.category} onValueChange={v => set('category', v)}><SelectTrigger className="mt-1.5"><SelectValue placeholder="Select category" /></SelectTrigger><SelectContent>{GRIEVANCE_CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select></div>
              <div><Label>{t('grievance.village')}</Label><Input className="mt-1.5" value={form.village} onChange={e => set('village', e.target.value)} /></div>
              <div><Label>{t('grievance.gramPanchayat')}</Label><Input className="mt-1.5" value={form.gram_panchayat} onChange={e => set('gram_panchayat', e.target.value)} /></div>
              <div className="md:col-span-2"><Label>Address</Label><Input className="mt-1.5" value={form.address} onChange={e => set('address', e.target.value)} /></div>
              <div className="md:col-span-2"><Label>{t('grievance.description')} *</Label><Textarea rows={5} className="mt-1.5" value={form.description} onChange={e => set('description', e.target.value)} placeholder="Describe your issue or request in detail…" /></div>
              <div className="md:col-span-2 flex items-start gap-2">
                <Checkbox id="consent" checked={form.consent} onCheckedChange={v => set('consent', !!v)} />
                <Label htmlFor="consent" className="text-sm text-muted-foreground font-normal leading-snug">I consent to the MLA office storing and processing this information to address my request.</Label>
              </div>
              <div className="md:col-span-2"><Button type="submit" disabled={submitting} className="w-full bg-brand-saffron hover:bg-brand-saffron-hover text-white font-semibold">{submitting ? 'Submitting…' : t('grievance.submitBtn')}</Button></div>
            </form>
          </Card>
        </div>
        <div className="space-y-4">
          <Card className="p-6">
            <h3 className="font-semibold text-brand-navy mb-3">How it works</h3>
            <ol className="space-y-3 text-sm text-muted-foreground">
              <li className="flex gap-3"><span className="h-6 w-6 rounded-full bg-brand-navy text-white text-xs flex items-center justify-center shrink-0">1</span>Submit your request with details.</li>
              <li className="flex gap-3"><span className="h-6 w-6 rounded-full bg-brand-navy text-white text-xs flex items-center justify-center shrink-0">2</span>Receive a unique tracking ID instantly.</li>
              <li className="flex gap-3"><span className="h-6 w-6 rounded-full bg-brand-navy text-white text-xs flex items-center justify-center shrink-0">3</span>The office reviews and assigns it.</li>
              <li className="flex gap-3"><span className="h-6 w-6 rounded-full bg-brand-navy text-white text-xs flex items-center justify-center shrink-0">4</span>Track progress until resolved.</li>
            </ol>
          </Card>
          <Card className="p-6 bg-brand-cream/50">
            <div className="flex items-center gap-2 text-brand-navy font-semibold"><ShieldCheck className="h-5 w-5 text-brand-saffron" />Your privacy</div>
            <p className="mt-2 text-sm text-muted-foreground">Your personal details are never displayed publicly and are used only to resolve your request.</p>
          </Card>
          <Button variant="outline" className="w-full" onClick={() => go('track')}><Search className="h-4 w-4 mr-2" />{t('cta.track')}</Button>
        </div>
      </div>
    </div>
  )
}

export function Track({ go }) {
  const { t } = useT()
  const [id, setId] = useState('')
  const [mobile, setMobile] = useState('')
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState(null)

  const search = async (e) => {
    e.preventDefault()
    setLoading(true); setData(null)
    try {
      const r = await api('/grievances/track', { method: 'POST', body: JSON.stringify({ tracking_id: id, mobile }) })
      setData(r)
    } catch (err) { toast.error(err.message) } finally { setLoading(false) }
  }

  const currentIdx = data ? GRIEVANCE_STATUSES.indexOf(data.status) : -1

  return (
    <div>
      <PageBanner title={t('track.title')} subtitle={t('track.subtitle')} image={IMAGES.gov} breadcrumb={`${t('nav.home')} / ${t('cta.track')}`} />
      <div className="container py-10 max-w-2xl">
        <Card className="p-6">
          <form onSubmit={search} className="grid gap-4 sm:grid-cols-[1fr_1fr_auto] items-end">
            <div><Label>{t('track.trackingIdLabel')}</Label><Input className="mt-1.5" value={id} onChange={e => setId(e.target.value.toUpperCase())} placeholder="VSH-2026-000001" /></div>
            <div><Label>{t('track.mobileLabel')}</Label><Input className="mt-1.5" maxLength={10} value={mobile} onChange={e => setMobile(e.target.value.replace(/\D/g, ''))} placeholder="Registered mobile" /></div>
            <Button type="submit" className="bg-brand-navy hover:bg-brand-navy-2"><Search className="h-4 w-4 mr-2" />{t('track.checkStatusBtn')}</Button>
          </form>
        </Card>

        {loading && <Loading />}
        {data && (
          <Card className="mt-6 p-6">
            <div className="flex items-center justify-between flex-wrap gap-3 border-b pb-4">
              <div><div className="text-xs text-muted-foreground">Tracking ID</div><div className="font-mono font-bold text-brand-navy text-lg">{data.tracking_id}</div></div>
              <div className="text-right"><div className="text-xs text-muted-foreground">Current Status</div><StatusBadge status={data.status} /></div>
            </div>
            <div className="mt-4 text-sm text-muted-foreground"><b className="text-brand-navy">{data.type}</b> • {data.category} • Submitted {fmtDate(data.created_at)}</div>

            <div className="mt-6">
              <h4 className="font-semibold text-brand-navy mb-4">Status Timeline</h4>
              <div className="space-y-1">
                {GRIEVANCE_STATUSES.map((s, i) => {
                  const done = i <= currentIdx
                  return (
                    <div key={s} className="flex items-center gap-3">
                      <div className={`h-7 w-7 rounded-full flex items-center justify-center shrink-0 ${done ? 'bg-brand-gold text-brand-navy' : 'bg-slate-100 text-slate-400'}`}>{done ? <CheckCircle2 className="h-4 w-4" /> : <Clock className="h-4 w-4" />}</div>
                      <div className={`text-sm ${done ? 'font-medium text-brand-navy' : 'text-muted-foreground'}`}>{t('status.' + s) || s}</div>
                    </div>
                  )
                })}
              </div>
            </div>

            {data.updates?.length > 0 && (
              <div className="mt-6 border-t pt-4">
                <h4 className="font-semibold text-brand-navy mb-3">Updates</h4>
                <div className="space-y-3">
                  {data.updates.map((u, i) => (
                    <div key={i} className="text-sm"><div className="text-xs text-muted-foreground">{fmtDate(u.at)}</div><div className="text-brand-navy"><b>{t('status.' + u.status) || u.status}:</b> {u.note}</div></div>
                  ))}
                </div>
              </div>
            )}
          </Card>
        )}
      </div>
    </div>
  )
}
