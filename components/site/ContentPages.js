'use client'

import { useEffect, useState } from 'react'
import { api, fmtDate, IMAGES, loc } from '@/lib/site/config'
import { useT } from '@/lib/site/i18n'
import { PageBanner, Loading, EmptyState } from './shared'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Calendar, Search, ArrowLeft, ChevronRight, Download, FileText, MapPin, ExternalLink, Images, Newspaper } from 'lucide-react'

// ---------------- NEWS ----------------
export function News({ go }) {
  const { t, lang } = useT()
  const [all, setAll] = useState([])
  const [loading, setLoading] = useState(true)
  const [q, setQ] = useState('')
  const [cat, setCat] = useState('all')

  useEffect(() => { (async () => { try { setAll(await api('/news')) } catch (e) {} finally { setLoading(false) } })() }, [])
  const cats = Array.from(new Set(all.map(a => a.category)))
  const filtered = all.filter(a => (cat === 'all' || a.category === cat) && (!q || (a.title + a.excerpt).toLowerCase().includes(q.toLowerCase())))
  const featured = filtered.find(a => a.featured) || filtered[0]
  const rest = filtered.filter(a => a !== featured)

  return (
    <div>
      <PageBanner title={t('news.title')} subtitle={t('news.subtitle')} image={IMAGES.community} breadcrumb={`${t('nav.home')} / ${t('nav.news')}`} />
      <div className="container py-10">
        <div className="flex gap-3 mb-8 flex-wrap">
          <div className="relative flex-1 min-w-[200px]"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input className="pl-9" placeholder="Search news…" value={q} onChange={e => setQ(e.target.value)} /></div>
          <Select value={cat} onValueChange={setCat}><SelectTrigger className="w-48"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All Categories</SelectItem>{cats.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select>
        </div>
        {loading ? <Loading /> : filtered.length === 0 ? <EmptyState icon={Newspaper} title="No news found" /> : (
          <div className="space-y-8">
            {featured && (
              <button onClick={() => go('article', featured.slug || featured.id)} className="group grid md:grid-cols-2 gap-6 text-left rounded-md overflow-hidden border border-border bg-card hover:border-brand-saffron/50 transition-colors">
                <img src={featured.cover_image} alt={loc(featured, 'title', lang)} className="h-64 md:h-full w-full object-cover" />
                <div className="p-6 md:p-8 flex flex-col justify-center">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3"><span className="rounded bg-brand-gold/15 px-2 py-0.5 font-semibold text-brand-navy">Featured</span><Calendar className="h-3.5 w-3.5" />{fmtDate(featured.date)}</div>
                  <h2 className="font-display text-2xl font-bold text-brand-navy group-hover:text-brand-saffron">{loc(featured, 'title', lang)}</h2>
                  <p className="mt-3 text-muted-foreground line-clamp-3">{loc(featured, 'excerpt', lang)}</p>
                  <span className="mt-4 inline-flex items-center text-brand-navy font-medium">{t('cta.details')} <ChevronRight className="h-4 w-4" /></span>
                </div>
              </button>
            )}
            <div className="grid gap-6 md:grid-cols-3">
              {rest.map(a => (
                <button key={a.id} onClick={() => go('article', a.slug || a.id)} className="group text-left">
                  <Card className="overflow-hidden rounded-md border-border shadow-none hover:border-brand-saffron/50 transition-colors h-full">
                    <img src={a.cover_image} alt={loc(a, 'title', lang)} loading="lazy" className="h-44 w-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    <div className="p-5">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground"><span className="rounded bg-brand-cream px-2 py-0.5 font-medium text-brand-navy">{a.category}</span><Calendar className="h-3.5 w-3.5" />{fmtDate(a.date)}</div>
                      <h3 className="mt-2 font-semibold text-brand-navy line-clamp-2 group-hover:text-brand-saffron">{loc(a, 'title', lang)}</h3>
                      <p className="mt-1.5 text-sm text-muted-foreground line-clamp-2">{loc(a, 'excerpt', lang)}</p>
                    </div>
                  </Card>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export function Article({ id, go }) {
  const { t, lang } = useT()
  const [a, setA] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => { (async () => { try { setA(await api(`/news/${id}`)) } catch (e) {} finally { setLoading(false) } })() }, [id])
  if (loading) return <div className="container py-20"><Loading /></div>
  if (!a) return <div className="container py-20"><EmptyState title="Article not found" /></div>

  return (
    <div>
      <PageBanner title={loc(a, 'title', lang)} subtitle={`${a.category} • ${fmtDate(a.date)} • ${a.author}`} image={a.cover_image} breadcrumb={`${t('nav.home')} / ${t('nav.news')}`} />
      <div className="container py-10 max-w-3xl">
        <Button variant="ghost" className="mb-6 text-brand-navy" onClick={() => go('news')}><ArrowLeft className="h-4 w-4 mr-2" />{t('nav.news')}</Button>
        <img src={a.cover_image} alt={loc(a, 'title', lang)} className="w-full rounded-2xl object-cover max-h-96 mb-8" />
        <p className="text-lg text-brand-navy font-medium mb-4">{loc(a, 'excerpt', lang)}</p>
        <div className="prose max-w-none text-muted-foreground leading-relaxed whitespace-pre-line">{loc(a, 'content', lang)}</div>
      </div>
    </div>
  )
}

// ---------------- GALLERY ----------------
export function Gallery() {
  const { t, lang } = useT()
  const [all, setAll] = useState([])
  const [loading, setLoading] = useState(true)
  const [cat, setCat] = useState('all')
  const [active, setActive] = useState(null)

  useEffect(() => { (async () => { try { setAll(await api('/gallery')) } catch (e) {} finally { setLoading(false) } })() }, [])
  const cats = Array.from(new Set(all.map(g => g.category)))
  const filtered = all.filter(g => cat === 'all' || g.category === cat)

  return (
    <div>
      <PageBanner title={t('gallery.title')} subtitle={t('gallery.subtitle')} image={IMAGES.infra2} breadcrumb={`${t('nav.home')} / ${t('nav.gallery')}`} />
      <div className="container py-10">
        <div className="flex flex-wrap gap-2 mb-8">
          <button onClick={() => setCat('all')} className={`px-4 py-1.5 rounded-md text-sm font-medium border ${cat === 'all' ? 'bg-brand-navy text-white border-brand-navy' : 'hover:border-brand-gold/40'}`}>All</button>
          {cats.map(c => <button key={c} onClick={() => setCat(c)} className={`px-4 py-1.5 rounded-md text-sm font-medium border ${cat === c ? 'bg-brand-navy text-white border-brand-navy' : 'hover:border-brand-gold/40'}`}>{c}</button>)}
        </div>
        {loading ? <Loading /> : all.length === 0 ? (
          <div className="columns-2 md:columns-3 lg:columns-4 gap-4 space-y-4">
            {[IMAGES.gov, IMAGES.infra1, IMAGES.community, IMAGES.infra2].map((img, i) => (
              <div key={i} className="relative block w-full overflow-hidden rounded-xl break-inside-avoid grayscale-[30%] opacity-80 border-2 border-dashed border-muted-foreground/20">
                <img src={img} alt="Placeholder" className="w-full object-cover" />
                <div className="absolute inset-0 flex items-center justify-center bg-background/20"><span className="bg-background/80 px-3 py-1.5 rounded-md text-sm font-medium text-muted-foreground shadow-sm">Sample Placeholder</span></div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? <EmptyState icon={Images} title="No photos found in this category" /> : (
          <div className="columns-2 md:columns-3 lg:columns-4 gap-4 space-y-4">
            {filtered.map(g => (
              <button key={g.id} onClick={() => setActive(g)} className="group relative block w-full overflow-hidden rounded-xl break-inside-avoid">
                <img src={g.image} alt={loc(g, 'title', lang)} loading="lazy" className="w-full object-cover group-hover:scale-105 transition-transform duration-500" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-3"><span className="text-xs text-white font-medium">{g.category}</span></div>
              </button>
            ))}
          </div>
        )}
      </div>
      <Dialog open={!!active} onOpenChange={() => setActive(null)}>
        <DialogContent className="max-w-4xl p-0 overflow-hidden bg-black border-0">
          {active && <img src={active.image} alt={loc(active, 'title', lang)} className="w-full max-h-[80vh] object-contain" />}
          {active && <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 to-transparent p-4 text-white text-sm">{active.category}</div>}
        </DialogContent>
      </Dialog>
    </div>
  )
}

// ---------------- SCHEMES ----------------
export function Schemes() {
  const { t, lang } = useT()
  const [all, setAll] = useState([])
  const [loading, setLoading] = useState(true)
  const [q, setQ] = useState('')
  const [scope, setScope] = useState('all')

  useEffect(() => { (async () => { try { setAll(await api('/schemes')) } catch (e) {} finally { setLoading(false) } })() }, [])
  const scopes = ['State Government', 'Central Government', 'Constituency Initiative']
  const filtered = all.filter(s => (scope === 'all' || s.scope === scope) && (!q || (s.name + s.description).toLowerCase().includes(q.toLowerCase())))

  return (
    <div>
      <PageBanner title={t('schemes.title')} subtitle={t('schemes.subtitle')} image={IMAGES.gov} breadcrumb={`${t('nav.home')} / ${t('nav.schemes')}`} />
      <div className="container py-10">
        <div className="flex gap-3 mb-8 flex-wrap">
          <div className="relative flex-1 min-w-[200px]"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input className="pl-9" placeholder="Search schemes…" value={q} onChange={e => setQ(e.target.value)} /></div>
          <Select value={scope} onValueChange={setScope}><SelectTrigger className="w-56"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All Schemes</SelectItem>{scopes.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select>
        </div>
        {loading ? <Loading /> : (
          <div className="grid gap-6 md:grid-cols-2">
            {filtered.map(s => (
              <Card key={s.id} className="p-6">
                <div className="flex items-center justify-between"><span className="inline-flex rounded-md bg-brand-navy/5 px-3 py-1 text-xs font-semibold text-brand-navy">{s.scope}</span><span className="text-xs text-muted-foreground">Updated {fmtDate(s.updated_at)}</span></div>
                <h3 className="mt-3 font-display text-xl font-bold text-brand-navy">{loc(s, 'name', lang)}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{loc(s, 'description', lang)}</p>
                <dl className="mt-4 space-y-2 text-sm">
                  <div><dt className="font-semibold text-brand-navy">{t('schemes.eligibility')}</dt><dd className="text-muted-foreground">{loc(s, 'eligibility', lang)}</dd></div>
                  <div><dt className="font-semibold text-brand-navy">{t('schemes.benefits')}</dt><dd className="text-muted-foreground">{loc(s, 'benefits', lang)}</dd></div>
                  <div><dt className="font-semibold text-brand-navy">{t('schemes.documentsRequired')}</dt><dd className="text-muted-foreground">{loc(s, 'documents_required', lang)}</dd></div>
                </dl>
                <a href={s.official_link || '#'} target="_blank" rel="noreferrer" className="mt-4 inline-flex items-center text-sm font-medium text-brand-navy hover:text-brand-saffron">{t('schemes.officialLink')} <ExternalLink className="h-3.5 w-3.5 ml-1" /></a>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ---------------- ACTIVITIES ----------------
export function Activities() {
  const { t, lang } = useT()
  const [all, setAll] = useState([])
  const [loading, setLoading] = useState(true)
  const [cat, setCat] = useState('all')

  useEffect(() => { (async () => { try { setAll(await api('/events')) } catch (e) {} finally { setLoading(false) } })() }, [])
  const cats = Array.from(new Set(all.map(e => e.category)))
  const filtered = all.filter(e => cat === 'all' || e.category === cat)

  return (
    <div>
      <PageBanner title={t('activities.title')} subtitle={t('activities.subtitle')} image={IMAGES.community} breadcrumb={`${t('nav.home')} / ${t('nav.activities')}`} />
      <div className="container py-10">
        <div className="flex flex-wrap gap-2 mb-8">
          <button onClick={() => setCat('all')} className={`px-4 py-1.5 rounded-md text-sm font-medium border ${cat === 'all' ? 'bg-brand-navy text-white border-brand-navy' : 'hover:border-brand-gold/40'}`}>All</button>
          {cats.map(c => <button key={c} onClick={() => setCat(c)} className={`px-4 py-1.5 rounded-md text-sm font-medium border ${cat === c ? 'bg-brand-navy text-white border-brand-navy' : 'hover:border-brand-gold/40'}`}>{c}</button>)}
        </div>
        {loading ? <Loading /> : (
          <div className="space-y-4 border-l-2 border-brand-cream pl-6 md:pl-8">
            {filtered.map(e => (
              <div key={e.id} className="relative">
                <span className="absolute -left-[31px] md:-left-[39px] top-2 h-4 w-4 rounded-md bg-brand-gold ring-4 ring-brand-cream" />
                <Card className="overflow-hidden md:flex">
                  <img src={e.image} alt={loc(e, 'title', lang)} loading="lazy" className="h-40 md:h-auto md:w-56 w-full object-cover shrink-0" />
                  <div className="p-5">
                    <div className="flex items-center gap-2 text-xs"><span className="rounded bg-brand-cream px-2 py-0.5 font-medium text-brand-navy">{e.category}</span><span className="inline-flex items-center gap-1 text-muted-foreground"><Calendar className="h-3.5 w-3.5" />{fmtDate(e.date)}</span></div>
                    <h3 className="mt-2 font-semibold text-brand-navy">{loc(e, 'title', lang)}</h3>
                    <p className="mt-1 text-sm text-muted-foreground inline-flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{loc(e, 'location', lang)}</p>
                    <p className="mt-2 text-sm text-muted-foreground">{loc(e, 'description', lang)}</p>
                  </div>
                </Card>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ---------------- DOCUMENTS ----------------
export function Documents() {
  const { t, lang } = useT()
  const [all, setAll] = useState([])
  const [loading, setLoading] = useState(true)
  const [q, setQ] = useState('')
  const [cat, setCat] = useState('all')

  useEffect(() => { (async () => { try { setAll(await api('/documents')) } catch (e) {} finally { setLoading(false) } })() }, [])
  const cats = Array.from(new Set(all.map(d => d.category)))
  const filtered = all.filter(d => (cat === 'all' || d.category === cat) && (!q || d.title.toLowerCase().includes(q.toLowerCase())))

  return (
    <div>
      <PageBanner title={t('documents.title')} subtitle={t('documents.subtitle')} image={IMAGES.gov} breadcrumb={`${t('nav.home')} / ${t('nav.documents')}`} />
      <div className="container py-10">
        <div className="flex gap-3 mb-8 flex-wrap">
          <div className="relative flex-1 min-w-[200px]"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input className="pl-9" placeholder="Search documents…" value={q} onChange={e => setQ(e.target.value)} /></div>
          <Select value={cat} onValueChange={setCat}><SelectTrigger className="w-56"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All Categories</SelectItem>{cats.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select>
        </div>
        {loading ? <Loading /> : (
          <div className="grid gap-4 md:grid-cols-2">
            {filtered.map(d => (
              <Card key={d.id} className="p-5 flex items-center gap-4">
                <div className="h-12 w-12 rounded-lg bg-red-50 text-red-600 flex items-center justify-center shrink-0"><FileText className="h-6 w-6" /></div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground"><span className="rounded bg-brand-cream px-2 py-0.5 font-medium text-brand-navy">{d.category}</span>{fmtDate(d.date)} • {d.file_size}</div>
                  <h3 className="mt-1 font-semibold text-brand-navy truncate">{loc(d, 'title', lang)}</h3>
                </div>
                <a href={d.file_url || '#'} target="_blank" rel="noreferrer"><Button size="sm" variant="outline"><Download className="h-4 w-4 mr-1.5" />Download</Button></a>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
