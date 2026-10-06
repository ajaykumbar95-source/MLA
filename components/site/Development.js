'use client'

import { useEffect, useState } from 'react'
import { api, fmtCurrency, fmtDate, PROJECT_STATUSES, DEPARTMENTS, PROJECT_CATEGORIES, loc } from '@/lib/site/config'
import { useT } from '@/lib/site/i18n'
import { PageBanner, StatusBadge, ProgressBar, Loading, EmptyState } from './shared'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { IMAGES } from '@/lib/site/config'
import { MapPin, Building2, Search, ChevronRight, FolderOpen, ArrowLeft } from 'lucide-react'

function Card2({ p, go }) {
  const { t, lang } = useT()
  return (
    <Card className="group overflow-hidden rounded-md border-border bg-card shadow-none transition-colors hover:border-brand-saffron/50 flex flex-col">
      <div className="relative h-40 overflow-hidden">
        <img src={p.image} alt={loc(p, 'title', lang)} loading="lazy" className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500" />
        <div className="absolute top-3 left-3"><StatusBadge status={p.status} /></div>
      </div>
      <div className="p-5 flex flex-col flex-1">
        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1.5"><Building2 className="h-3.5 w-3.5" />{p.department}</div>
        <h3 className="font-semibold text-brand-navy leading-snug line-clamp-2">{loc(p, 'title', lang)}</h3>
        <div className="mt-2 flex items-center gap-1.5 text-sm text-muted-foreground"><MapPin className="h-3.5 w-3.5" />{loc(p, 'location', lang)}, {loc(p, 'gram_panchayat', lang)}</div>
        <div className="mt-4"><div className="flex justify-between text-xs mb-1.5"><span className="text-muted-foreground">{t('dev.progress')}</span><span className="font-semibold">{p.progress}%</span></div><ProgressBar value={p.progress} /></div>
        <div className="mt-4 flex items-center justify-between border-t pt-3">
          <div><div className="text-[11px] text-muted-foreground">{t('dev.sanctioned')}</div><div className="font-semibold text-sm text-brand-navy">{fmtCurrency(p.sanctioned_amount)}</div></div>
          <Button variant="ghost" size="sm" className="text-brand-navy hover:text-brand-saffron" onClick={() => go('project', p.id)}>{t('cta.details')} <ChevronRight className="h-4 w-4" /></Button>
        </div>
      </div>
    </Card>
  )
}

export function Development({ go }) {
  const { t } = useT()
  const [all, setAll] = useState([])
  const [loading, setLoading] = useState(true)
  const [f, setF] = useState({ q: '', status: 'all', department: 'all', category: 'all', year: 'all' })

  useEffect(() => { (async () => { try { setAll(await api('/projects')) } catch (e) {} finally { setLoading(false) } })() }, [])

  const years = Array.from(new Set(all.map(p => p.year).filter(Boolean))).sort()
  const filtered = all.filter(p =>
    (f.status === 'all' || p.status === f.status) &&
    (f.department === 'all' || p.department === f.department) &&
    (f.category === 'all' || p.category === f.category) &&
    (f.year === 'all' || String(p.year) === String(f.year)) &&
    (!f.q || (p.title + p.location + p.village + p.gram_panchayat).toLowerCase().includes(f.q.toLowerCase()))
  )
  const counts = PROJECT_STATUSES.map(s => ({ s, n: all.filter(p => p.status === s).length }))

  return (
    <div>
      <PageBanner title={t('dev.title')} subtitle={t('dev.subtitle')} image={IMAGES.infra1} breadcrumb={`${t('nav.home')} / ${t('nav.development')}`} />
      <div className="container py-10">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-8">
          {counts.map(({ s, n }) => (
            <button key={s} onClick={() => setF({ ...f, status: f.status === s ? 'all' : s })} className={`rounded-xl border p-4 text-left transition-all ${f.status === s ? 'border-brand-gold bg-brand-cream' : 'hover:border-brand-gold/40'}`}>
              <div className="text-2xl font-bold text-brand-navy">{n}</div>
              <div className="text-xs text-muted-foreground">{t('status.' + s) || s}</div>
            </button>
          ))}
        </div>

        <Card className="p-4 mb-8">
          <div className="grid gap-3 md:grid-cols-5">
            <div className="relative md:col-span-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder={t('dev.searchPlaceholder')} className="pl-9" value={f.q} onChange={e => setF({ ...f, q: e.target.value })} />
            </div>
            <Select value={f.status} onValueChange={v => setF({ ...f, status: v })}><SelectTrigger><SelectValue placeholder={t('dev.allStatuses')} /></SelectTrigger><SelectContent><SelectItem value="all">{t('dev.allStatuses')}</SelectItem>{PROJECT_STATUSES.map(s => <SelectItem key={s} value={s}>{t('status.' + s) || s}</SelectItem>)}</SelectContent></Select>
            <Select value={f.department} onValueChange={v => setF({ ...f, department: v })}><SelectTrigger><SelectValue placeholder={t('dev.allDepartments')} /></SelectTrigger><SelectContent><SelectItem value="all">{t('dev.allDepartments')}</SelectItem>{DEPARTMENTS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select>
            <Select value={f.category} onValueChange={v => setF({ ...f, category: v })}><SelectTrigger><SelectValue placeholder={t('dev.allCategories')} /></SelectTrigger><SelectContent><SelectItem value="all">{t('dev.allCategories')}</SelectItem>{PROJECT_CATEGORIES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select>
            <Select value={f.year} onValueChange={v => setF({ ...f, year: v })}><SelectTrigger><SelectValue placeholder={t('dev.allYears')} /></SelectTrigger><SelectContent><SelectItem value="all">{t('dev.allYears')}</SelectItem>{years.map(y => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}</SelectContent></Select>
          </div>
        </Card>

        {loading ? <Loading /> : filtered.length === 0 ? <EmptyState icon={FolderOpen} title="No projects match your filters" desc="Try adjusting or clearing the filters." /> : (
          <>
            <div className="text-sm text-muted-foreground mb-4">{t('dev.showing')} <span className="font-semibold text-brand-navy">{filtered.length}</span> {t('dev.of')} {all.length} {t('dev.projectsLabel')}</div>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">{filtered.map(p => <Card2 key={p.id} p={p} go={go} />)}</div>
          </>
        )}
      </div>
    </div>
  )
}

export function ProjectDetail({ id, go }) {
  const { t, lang } = useT()
  const [p, setP] = useState(null)
  const [loading, setLoading] = useState(true)
  useEffect(() => { (async () => { try { setP(await api(`/projects/${id}`)) } catch (e) {} finally { setLoading(false) } })() }, [id])
  if (loading) return <div className="container py-20"><Loading /></div>
  if (!p) return <div className="container py-20"><EmptyState title="Project not found" /></div>

  const rows = [
    ['Department', p.department], ['Category', p.category], ['Location', loc(p, 'location', lang)], ['Village', loc(p, 'village', lang)],
    ['Gram Panchayat', loc(p, 'gram_panchayat', lang)], [t('dev.sanctioned'), fmtCurrency(p.sanctioned_amount)], [t('dev.estimated'), fmtCurrency(p.estimated_amount)],
    [t('dev.startDate'), fmtDate(p.start_date)], [t('dev.expectedCompletion'), fmtDate(p.expected_completion)], [t('dev.actualCompletion'), p.actual_completion ? fmtDate(p.actual_completion) : 'In progress'],
  ]
  return (
    <div>
      <PageBanner title={loc(p, 'title', lang)} subtitle={`${loc(p, 'location', lang)} • ${p.department}`} image={p.image} breadcrumb={`${t('nav.home')} / ${t('nav.development')}`} />
      <div className="container py-10">
        <Button variant="ghost" className="mb-6 text-brand-navy" onClick={() => go('development')}><ArrowLeft className="h-4 w-4 mr-2" />{t('dev.backToProjects')}</Button>
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <img src={p.image} alt={loc(p, 'title', lang)} className="w-full rounded-2xl object-cover max-h-96" />
            <div>
              <div className="flex items-center gap-3 mb-3"><StatusBadge status={p.status} /><span className="text-sm text-muted-foreground">{t('dev.progress')}: <b className="text-brand-navy">{p.progress}%</b></span></div>
              <ProgressBar value={p.progress} />
            </div>
            <div><h3 className="font-display text-xl font-bold text-brand-navy mb-2">{t('dev.projectOverview')}</h3><p className="text-muted-foreground leading-relaxed">{loc(p, 'description', lang)}</p></div>
            <div>
              <h3 className="font-display text-xl font-bold text-brand-navy mb-4">{t('dev.projectTimeline')}</h3>
              <div className="space-y-4 border-l-2 border-brand-cream pl-6">
                {(p.updates || []).map((u, i) => (
                  <div key={i} className="relative">
                    <span className="absolute -left-[31px] top-1 h-4 w-4 rounded-full bg-brand-gold ring-4 ring-brand-cream" />
                    <div className="text-xs text-muted-foreground">{fmtDate(u.date)}</div>
                    <div className="text-sm text-brand-navy">{u.note}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div>
            <Card className="p-6 sticky top-52">
              <h3 className="font-semibold text-brand-navy mb-4">{t('dev.projectDetails')}</h3>
              <dl className="space-y-3 text-sm">
                {rows.map(([k, v]) => (
                  <div key={k} className="flex justify-between gap-4 border-b border-dashed pb-2"><dt className="text-muted-foreground">{k}</dt><dd className="font-medium text-brand-navy text-right">{v}</dd></div>
                ))}
              </dl>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
