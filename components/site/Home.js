'use client'

import { useEffect, useState } from 'react'
import { api, fmtCurrency, fmtDate, loc } from '@/lib/site/config'
import { useT } from '@/lib/site/i18n'
import { SectionHeading, StatusBadge, ProgressBar, Loading } from './shared'
import { OfficialPortrait, PartyLogo } from './Brand'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import {
  ArrowRight, ArrowUpRight, MapPin, Building2, MessageSquarePlus,
  Lightbulb, HandHelping, Search, ChevronRight
} from 'lucide-react'

function Stat({ label, value, suffix }) {
  return (
    <div className="px-3 py-6 text-center md:py-8">
      <div className="text-2xl font-semibold tabular-nums tracking-tight text-foreground md:text-3xl">{Number(value || 0).toLocaleString('en-IN')}{suffix}</div>
      <div className="mx-auto mt-2 max-w-[150px] text-sm leading-relaxed text-muted-foreground">{label}</div>
    </div>
  )
}

function ProjectCard({ p, go, lang }) {
  return (
    <Card className="group overflow-hidden rounded-md border-border bg-card shadow-none transition-colors hover:border-brand-saffron/50 flex flex-col">
      <div className="relative h-44 overflow-hidden">
        <img src={p.image} alt={p.title} loading="lazy" className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500" />
        <div className="absolute top-3 left-3"><StatusBadge status={p.status} /></div>
      </div>
      <div className="p-5 flex flex-col flex-1">
        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
          <Building2 className="h-3.5 w-3.5" />{p.department}
        </div>
        <h3 className="font-semibold text-brand-navy leading-snug line-clamp-2">{loc(p, 'title', lang)}</h3>
        <div className="mt-2 flex items-center gap-1.5 text-sm text-muted-foreground"><MapPin className="h-3.5 w-3.5" />{loc(p, 'location', lang)}</div>
        <div className="mt-4">
          <div className="flex justify-between text-xs mb-1.5"><span className="text-muted-foreground">Progress</span><span className="font-semibold text-brand-navy">{p.progress}%</span></div>
          <ProgressBar value={p.progress} />
        </div>
        <div className="mt-4 flex items-center justify-between border-t pt-3">
          <div><div className="text-[11px] text-muted-foreground">Sanctioned</div><div className="font-semibold text-brand-navy text-sm">{fmtCurrency(p.sanctioned_amount)}</div></div>
          <Button variant="ghost" size="sm" className="text-brand-navy hover:text-brand-saffron" onClick={() => go('project', p.id)}>Details <ChevronRight className="h-4 w-4" /></Button>
        </div>
      </div>
    </Card>
  )
}

export default function Home({ settings, go }) {
  const { t, lang } = useT()
  const [data, setData] = useState({ projects: [], news: [], events: [], schemes: [], gallery: [], stats: null })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    (async () => {
      try {
        const [projects, news, events, schemes, gallery, stats] = await Promise.all([
          api('/projects?featured=true'), api('/news'), api('/events'), api('/schemes'), api('/gallery'), api('/stats'),
        ])
        setData({ projects: projects.slice(0, 3), news: news.slice(0, 4), events: events.slice(0, 4), schemes: schemes.slice(0, 3), gallery: gallery.slice(0, 8), stats })
      } catch (e) { /* ignore */ } finally { setLoading(false) }
    })()
  }, [])

  const stats = (settings?.stats && settings.stats.length) ? settings.stats.map(s => ({ ...s, label: loc(s, 'label', lang) || s.label })) : [
    { label: t('stat.devProjects'), value: data.stats?.projects || 0, suffix: '' },
    { label: t('stat.completed'), value: data.stats?.completed || 0, suffix: '' },
    { label: t('stat.ongoing'), value: data.stats?.ongoing || 0, suffix: '' },
    { label: t('stat.villages'), value: data.stats?.villages || 0, suffix: '' },
    { label: t('stat.resolved'), value: data.stats?.requests || 0, suffix: '' },
  ]

  return (
    <div>
      {/* MLA introduction */}
      <section className="border-b border-border bg-brand-cream">
        <div className="container grid items-center gap-10 py-10 md:py-14 lg:grid-cols-[1.35fr_1fr] lg:gap-20">
          <div className="max-w-2xl">
            <p className="mb-5 flex items-center gap-3 text-sm font-medium text-brand-saffron"><span className="h-px w-8 bg-brand-saffron" />{t('brand.publicService')}</p>
            <h1 className="max-w-xl text-3xl font-semibold leading-tight tracking-tight text-foreground sm:text-4xl lg:text-[44px] lg:leading-[1.18]">{settings?.mla_name}</h1>
            <p className="mt-4 text-base font-medium text-brand-saffron md:text-lg">{lang === 'en' ? settings?.designation : t('hero.designation')}</p>
            {settings?.constituency && !settings.constituency.startsWith('[') && <p className="mt-2 inline-flex items-center gap-2 text-sm text-muted-foreground"><MapPin className="h-4 w-4" />{settings.constituency}</p>}
            <p className="mt-5 max-w-lg text-base leading-7 text-muted-foreground">{loc(settings, 'hero_message', lang)}</p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Button size="lg" className="h-12 gap-2 rounded-md bg-brand-saffron px-5 text-sm font-semibold text-white hover:bg-brand-saffron-hover" onClick={() => go('grievance')}>{t('cta.grievance')}<ArrowRight className="h-4 w-4" /></Button>
              <Button size="lg" variant="outline" className="h-12 rounded-md border-brand-line bg-transparent px-5 text-sm text-foreground hover:bg-card" onClick={() => go('about')}>{t('brand.meetRepresentative')}<ArrowRight className="ml-2 h-4 w-4" /></Button>
            </div>
            <div className="mt-7 flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-brand-line pt-5 text-sm">
              <button onClick={() => go('development')} className="inline-flex items-center gap-2 font-medium text-foreground hover:text-brand-saffron">{t('cta.explore')}<ChevronRight className="h-4 w-4" /></button>
              <span className="hidden h-4 w-px bg-brand-line sm:block" />
              <button onClick={() => go('contact')} className="inline-flex items-center gap-2 text-muted-foreground hover:text-brand-saffron">{t('cta.contactOffice')}<ChevronRight className="h-4 w-4" /></button>
            </div>
          </div>
          <figure className="mx-auto w-full max-w-[350px] lg:mr-4">
            <div className="border border-brand-line bg-card p-2 pb-0">
              <OfficialPortrait src={settings?.photo_url} name={settings?.mla_name} className="aspect-[1/1.08] w-full" />
              <figcaption className="flex items-center justify-center gap-3 px-2 py-4">
                <PartyLogo className="h-10 w-10" />
                <div className="border-l border-border pl-3"><p className="text-sm font-semibold text-foreground">{t('brand.party')}</p><p className="mt-0.5 text-xs text-muted-foreground">{t('hero.designation')}</p></div>
              </figcaption>
            </div>
            <div className="h-1.5 bg-brand-saffron" />
          </figure>
        </div>
      </section>

      {/* QUICK STATS */}
      <section className="bg-white border-b">
        <div className="container">
          <div className="grid grid-cols-2 md:grid-cols-5 divide-x divide-y md:divide-y-0 divide-slate-100">
            {stats.map((s, i) => <Stat key={i} {...s} />)}
          </div>
        </div>
      </section>

      {/* DEVELOPMENT HIGHLIGHTS */}
      <section className="py-16 md:py-20 bg-brand-cream/40">
        <div className="container">
          <div className="flex items-end justify-between gap-4 flex-wrap">
            <SectionHeading eyebrow={t('sec.transparency')} title={t('sec.devHighlights')} desc={t('sec.devHighlightsDesc')} />
            <Button variant="outline" className="mb-10 border-brand-navy text-brand-navy hover:bg-brand-navy hover:text-white" onClick={() => go('development')}>{t('cta.viewAll')} <ArrowRight className="h-4 w-4 ml-2" /></Button>
          </div>
          {loading ? <Loading /> : (
            <div className="grid gap-6 md:grid-cols-3">
              {data.projects.map(p => <ProjectCard key={p.id} p={p} go={go} lang={lang} />)}
            </div>
          )}
        </div>
      </section>

      {/* A direct route to citizen services */}
      <section className="border-y border-border bg-brand-cream py-12 md:py-14">
        <div className="container grid items-start gap-8 lg:grid-cols-[1fr_1.65fr] lg:gap-16">
          <div>
            <SectionHeading eyebrow={t('sec.yourVoice')} title={t('sec.citizenServices')} desc={t('sec.citizenDesc')} />
            <button onClick={() => go('account')} className="inline-flex items-center gap-2 text-sm font-semibold text-brand-saffron hover:underline">{t('cta.myAccount')}<ArrowRight className="h-4 w-4" /></button>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {[
              { icon: MessageSquarePlus, title: t('cs.complaint'), desc: t('cs.complaintDesc'), route: 'grievance' },
              { icon: Lightbulb, title: t('cs.suggestion'), desc: t('cs.suggestionDesc'), route: 'grievance' },
              { icon: HandHelping, title: t('cs.assistance'), desc: t('cs.assistanceDesc'), route: 'grievance' },
              { icon: Search, title: t('cs.track'), desc: t('cs.trackDesc'), route: 'track' },
            ].map(c => (
              <button key={c.title} onClick={() => go(c.route)} className="group flex items-start gap-4 rounded-md border border-border bg-card p-5 text-left transition-colors hover:border-brand-saffron">
                <c.icon className="mt-1 h-5 w-5 shrink-0 text-brand-saffron" />
                <span className="min-w-0 flex-1"><span className="block text-base font-semibold text-foreground">{c.title}</span><span className="mt-1 block text-sm text-muted-foreground">{c.desc}</span></span>
                <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-muted-foreground group-hover:text-brand-saffron" />
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Newsroom and public schedule */}
      <section className="bg-card py-12 md:py-16">
        <div className="container grid gap-10 lg:grid-cols-[1.6fr_1fr] lg:gap-14">
          <div>
            <SectionHeading eyebrow={t('sec.newsroom')} title={t('sec.latestNews')} />
            {loading ? <Loading /> : <div className="divide-y divide-border border-t border-border">
              {data.news.map(a => (
                <button key={a.id} onClick={() => go('article', a.slug || a.id)} className="group flex w-full gap-4 py-5 text-left sm:gap-5">
                  <img src={a.cover_image} alt={loc(a, 'title', lang)} loading="lazy" className="h-24 w-24 shrink-0 rounded-sm object-cover sm:h-28 sm:w-36" />
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground"><span className="font-medium text-brand-saffron">{a.category}</span><span>{fmtDate(a.date)}</span></div>
                    <h3 className="mt-2 line-clamp-2 text-base font-semibold leading-snug text-foreground group-hover:text-brand-saffron">{loc(a, 'title', lang)}</h3>
                    <p className="mt-2 hidden text-sm leading-relaxed text-muted-foreground sm:line-clamp-2">{loc(a, 'excerpt', lang)}</p>
                  </div>
                </button>
              ))}
            </div>}
            <button onClick={() => go('news')} className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-brand-saffron hover:underline">{t('cta.viewAll')}<ArrowRight className="h-4 w-4" /></button>
          </div>
          <div className="border-border lg:border-l lg:pl-10">
            <SectionHeading eyebrow={t('sec.schedule')} title={t('sec.upcoming')} />
            <div className="divide-y divide-border border-t border-border">
              {data.events.map(e => (
                <div key={e.id} className="flex items-start gap-4 py-5">
                  <div className="flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-sm border border-border bg-brand-cream text-brand-navy">
                    <span className="text-xs">{new Date(e.date).toLocaleDateString(lang === 'kn' ? 'kn-IN' : lang === 'hi' ? 'hi-IN' : 'en-IN', { month: 'short' })}</span>
                    <span className="text-xl font-semibold leading-tight">{new Date(e.date).getDate()}</span>
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-brand-saffron">{e.category}</p>
                    <h3 className="mt-1 line-clamp-2 text-base font-semibold leading-snug text-foreground">{loc(e, 'title', lang)}</h3>
                    <p className="mt-2 flex items-center gap-1.5 text-sm text-muted-foreground"><MapPin className="h-3.5 w-3.5 shrink-0" />{loc(e, 'location', lang)}</p>
                  </div>
                </div>
              ))}
            </div>
            <Button variant="outline" className="mt-4 h-11 w-full rounded-md border-border" onClick={() => go('activities')}>{t('nav.activities')}<ArrowRight className="ml-2 h-4 w-4" /></Button>
          </div>
        </div>
      </section>

      {/* Welfare information */}
      <section className="border-y border-border bg-brand-cream py-12 md:py-16">
        <div className="container">
          <div className="flex flex-wrap items-end justify-between gap-x-6">
            <SectionHeading eyebrow={t('sec.welfare')} title={t('sec.schemes')} desc={t('sec.schemesDesc')} />
            <Button variant="outline" className="mb-8 h-11 border-border bg-card" onClick={() => go('schemes')}>{t('cta.viewAll')}<ArrowRight className="ml-2 h-4 w-4" /></Button>
          </div>
          <div className="grid gap-5 md:grid-cols-3">
            {data.schemes.map(s => (
              <div key={s.id} className="flex flex-col rounded-md border border-border border-t-2 border-t-brand-saffron bg-card p-6">
                <p className="text-xs font-medium text-brand-saffron">{s.scope}</p>
                <h3 className="mt-3 text-lg font-semibold leading-snug text-foreground">{loc(s, 'name', lang)}</h3>
                <p className="mb-5 mt-3 line-clamp-3 text-sm leading-relaxed text-muted-foreground">{loc(s, 'description', lang)}</p>
                <button className="mt-auto inline-flex items-center gap-2 self-start text-sm font-semibold text-brand-navy hover:text-brand-saffron" onClick={() => go('schemes')}>{t('cta.details')}<ArrowRight className="h-4 w-4" /></button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* A simple photographic record */}
      <section className="bg-card py-12 md:py-16">
        <div className="container">
          <div className="flex flex-wrap items-end justify-between gap-x-6">
            <SectionHeading eyebrow={t('sec.inPictures')} title={t('sec.gallery')} desc={t('brand.galleryDesc')} />
            <Button variant="outline" className="mb-8 h-11 border-border" onClick={() => go('gallery')}>{t('cta.viewAll')}<ArrowRight className="ml-2 h-4 w-4" /></Button>
          </div>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {data.gallery.slice(0, 4).map(g => (
              <button key={g.id} onClick={() => go('gallery')} className="group min-w-0 text-left">
                <div className="overflow-hidden rounded-sm"><img src={g.image} alt={loc(g, 'title', lang)} loading="lazy" className="aspect-[4/3] w-full object-cover transition-opacity group-hover:opacity-90" /></div>
                <span className="mt-3 flex items-center justify-between gap-2 text-sm font-medium text-foreground group-hover:text-brand-saffron">{g.category}<ArrowUpRight className="h-4 w-4 shrink-0" /></span>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Office message and contact */}
      <section className="border-t border-border bg-brand-cream py-12">
        <div className="container grid items-center gap-8 lg:grid-cols-[1.4fr_1fr]">
          <div className="border-l-[3px] border-brand-saffron pl-5 md:pl-7">
            <p className="mb-3 text-sm font-medium text-brand-saffron">{t('brand.officeMessage')}</p>
            <blockquote className="max-w-2xl text-lg font-medium leading-relaxed text-foreground">“{loc(settings, 'official_quote', lang)}”</blockquote>
            <p className="mt-3 text-sm text-muted-foreground">— {settings?.mla_name}</p>
          </div>
          <div className="flex flex-wrap gap-3 lg:justify-end">
            <Button size="lg" className="h-12 rounded-md bg-brand-saffron text-white hover:bg-brand-saffron-hover" onClick={() => go('grievance')}>{t('cta.submitNow')}<ArrowRight className="ml-2 h-4 w-4" /></Button>
            <Button size="lg" variant="outline" className="h-12 rounded-md border-brand-line bg-card text-foreground hover:bg-muted" onClick={() => go('contact')}>{t('cta.contactOffice')}</Button>
          </div>
        </div>
      </section>
    </div>
  )
}
