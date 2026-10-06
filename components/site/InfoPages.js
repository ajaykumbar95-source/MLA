'use client'

import { useEffect, useState } from 'react'
import { api, fmtDate, IMAGES, loc } from '@/lib/site/config'
import { useT } from '@/lib/site/i18n'
import { PageBanner, SectionHeading, Loading } from './shared'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { OfficialPortrait } from './Brand'
import { toast } from 'sonner'
import { Target, Compass, MapPin, Users, Building2, Phone, Mail, Clock, Send, Trees, Landmark, GraduationCap, Award, Milk, Heart, BookOpen, Briefcase, Calendar, Globe } from 'lucide-react'

export function About({ settings }) {
  const { t, lang } = useT()

  const journey = [
    { year: '1963', title: 'Born in Topinkatti', desc: 'Born on January 7, 1963, in Topinkatti, Khanapur taluka, Belagavi district, to a rural working-class family.' },
    { year: '1988', title: 'Teaching Career Begins', desc: 'Began career as a Mathematics teacher at Mauli Girls High School, Garlgunji, after earning B.Sc. and B.Ed. degrees.' },
    { year: '1993', title: 'Gram Panchayat Service', desc: 'Elected as Gram Panchayat member (1993–1999); helped construct the local Panchayat building without government funding.' },
    { year: '1995', title: 'Shri Mahalakshmi Cooperative Founded', desc: 'Founded the Shri Mahalakshmi Multi-Purpose Cooperative Society Ltd. in Topinkatti — now grown to 34 branches across finance, agriculture, and housing.' },
    { year: '2013', title: 'Education Institutions Established', desc: 'Founded Shantiniketan Public School, PU College (2013), and ITI College (2014) under the Shri Mahalakshmi Group Education Society.' },
    { year: '2016', title: 'Dairy Development', desc: 'Established a milk dairy in November 2016, processing approximately 5,000 litres per day to support local dairy farmers.' },
    { year: '2023', title: 'Elected MLA — Khanapur', desc: 'Elected as Member of Legislative Assembly for Khanapur Constituency.' },
    { year: '2024', title: 'Development Projects Launched', desc: 'Initiated 120+ constituency infrastructure and development projects across Khanapur.' },
  ]

  const highlights = [
    { icon: Building2, title: '34 Cooperative Branches', desc: 'Shri Mahalakshmi Multi-Purpose Cooperative Society expanded from 1 branch in 1995 to 34 branches spanning finance, agriculture, credit, and housing.' },
    { icon: GraduationCap, title: 'Education Institutions', desc: 'Founded Shantiniketan Public School, PU College, and ITI College — providing quality education from schooling to vocational training.' },
    { icon: Milk, title: '5,000 Litres / Day Dairy', desc: 'Established a milk dairy processing ~5,000 litres daily, strengthening the rural dairy economy and farmer livelihoods.' },
    { icon: Heart, title: 'Community Welfare', desc: 'Provides scholarships, free schooling for orphaned students, rural student transport, and financial aid for accident-affected families.' },
  ]

  const awards = [
    { icon: Award, title: 'Rashtriya Sahakar Ratna', desc: 'National-level recognition for outstanding contribution to the cooperative movement.' },
    { icon: Award, title: 'Rajya Sahakar Ratna', desc: 'State-level recognition for excellence in cooperative development in Karnataka.' },
    { icon: Globe, title: 'Man of the Year 2014', desc: 'Awarded by Global Gunijan Pariwar, Thailand, for distinguished public service and institution building.' },
  ]

  return (
    <div>
      <PageBanner title={t('about.title')} subtitle={lang === 'en' ? settings?.designation : t('hero.designation')} image={IMAGES.gov} breadcrumb={`${t('nav.home')} / ${t('nav.about')}`} />
      <div className="container py-12">
        <div className="grid lg:grid-cols-3 gap-10">
          <div className="lg:col-span-1">
            <div className="sticky top-52 space-y-6">
              <div className="overflow-hidden rounded-md border border-border bg-card p-2">
                <OfficialPortrait src={settings?.photo_url} name={settings?.mla_name} className="aspect-[4/5] w-full" />
              </div>
              {/* Quick facts sidebar card */}
              <Card className="p-5 space-y-3">
                <h3 className="font-semibold text-brand-navy text-sm uppercase tracking-wide">Quick Facts</h3>
                <div className="space-y-2.5 text-sm">
                  <div className="flex items-start gap-3">
                    <Calendar className="h-4 w-4 text-brand-saffron mt-0.5 shrink-0" />
                    <div><span className="text-muted-foreground">Born:</span> <span className="font-medium text-foreground">January 7, 1963</span></div>
                  </div>
                  <div className="flex items-start gap-3">
                    <MapPin className="h-4 w-4 text-brand-saffron mt-0.5 shrink-0" />
                    <div><span className="text-muted-foreground">From:</span> <span className="font-medium text-foreground">Topinkatti, Khanapur Taluka</span></div>
                  </div>
                  <div className="flex items-start gap-3">
                    <BookOpen className="h-4 w-4 text-brand-saffron mt-0.5 shrink-0" />
                    <div><span className="text-muted-foreground">Education:</span> <span className="font-medium text-foreground">B.Sc., B.Ed. (Mathematics)</span></div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Briefcase className="h-4 w-4 text-brand-saffron mt-0.5 shrink-0" />
                    <div><span className="text-muted-foreground">Profession:</span> <span className="font-medium text-foreground">Educator & Cooperative Leader</span></div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Globe className="h-4 w-4 text-brand-saffron mt-0.5 shrink-0" />
                    <div><span className="text-muted-foreground">Languages:</span> <span className="font-medium text-foreground">Kannada, Marathi, Hindi, English</span></div>
                  </div>
                </div>
              </Card>
            </div>
          </div>
          <div className="lg:col-span-2 space-y-8">
            <div>
              <SectionHeading eyebrow={t('about.biography')} title={settings?.mla_name} />
              <p className="text-muted-foreground leading-relaxed">{loc(settings, 'hero_message', lang)}</p>
              {settings?.biography && <p className="text-muted-foreground leading-relaxed mt-4">{loc(settings, 'biography', lang)}</p>}
              {!settings?.biography && <p className="text-muted-foreground leading-relaxed mt-4">
                An educator turned cooperative visionary, Shri Vithalrao S. Halgekar has dedicated over three decades to institution-building in Khanapur taluka. Starting as a Mathematics teacher, he went on to found the Shri Mahalakshmi Group — a cooperative network spanning finance, agriculture, dairy, education, and housing — while actively serving in local governance and community development.
              </p>}
            </div>
            <blockquote className="border-l-4 border-brand-gold bg-brand-cream/50 p-5 rounded-r-xl">
              <p className="font-display text-lg text-brand-navy italic">"{loc(settings, 'official_quote', lang)}"</p>
              <footer className="mt-2 text-sm text-muted-foreground">— {settings?.mla_name}</footer>
            </blockquote>
            {settings?.about_sections?.length > 0 ? (
              <div className="space-y-10 mt-8">
                {settings.about_sections.map((s, idx) => (
                  <div key={s.id} className="grid md:grid-cols-12 gap-8 items-start">
                    <div className={s.image ? (idx % 2 === 0 ? 'md:col-span-8 md:pr-4' : 'md:col-span-8 md:order-2 md:pl-4') : 'md:col-span-12'}>
                      <SectionHeading title={loc(s, 'heading', lang)} />
                      <div className="text-muted-foreground leading-relaxed whitespace-pre-line mt-4">{loc(s, 'content', lang)}</div>
                    </div>
                    {s.image && (
                      <div className={idx % 2 === 0 ? 'md:col-span-4' : 'md:col-span-4 md:order-1'}>
                        <img src={s.image} alt={s.heading} className="w-full h-auto rounded-xl shadow-sm object-cover" />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <>
                {/* Vision & Mission */}
                <div className="grid sm:grid-cols-2 gap-6 mt-8">
                  <Card className="p-6"><div className="h-11 w-11 rounded-lg bg-brand-navy/5 text-brand-navy flex items-center justify-center"><Compass className="h-5 w-5" /></div><h3 className="mt-4 font-semibold text-brand-navy">{t('about.vision')}</h3><p className="mt-1 text-sm text-muted-foreground">A prosperous, inclusive, well-connected and progressive Khanapur constituency.</p></Card>
                  <Card className="p-6"><div className="h-11 w-11 rounded-lg bg-brand-navy/5 text-brand-navy flex items-center justify-center"><Target className="h-5 w-5" /></div><h3 className="mt-4 font-semibold text-brand-navy">{t('about.mission')}</h3><p className="mt-1 text-sm text-muted-foreground">Transparent governance, active public listening and dedicated service to every citizen.</p></Card>
                </div>

                {/* Key Highlights */}
                <div className="mt-10">
                  <SectionHeading eyebrow="Key Highlights" title="Building Institutions, Empowering Communities" />
                  <div className="grid sm:grid-cols-2 gap-5">
                    {highlights.map((h, i) => (
                      <Card key={i} className="p-5 hover:border-brand-gold/40 transition-colors">
                        <div className="h-11 w-11 rounded-lg bg-brand-saffron/10 text-brand-saffron flex items-center justify-center">
                          <h.icon className="h-5 w-5" />
                        </div>
                        <h3 className="mt-3 font-semibold text-brand-navy">{h.title}</h3>
                        <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">{h.desc}</p>
                      </Card>
                    ))}
                  </div>
                </div>

                {/* Journey Timeline */}
                <div className="mt-10">
                  <SectionHeading eyebrow={t('about.journey')} title="A Life of Service — From Classroom to Legislature" />
                  <div className="space-y-6 border-l-2 border-brand-cream pl-6">
                    {journey.map((j, i) => (
                      <div key={i} className="relative">
                        <span className="absolute -left-[31px] top-1 h-4 w-4 rounded-full bg-brand-gold ring-4 ring-brand-cream" />
                        <div className="text-sm font-semibold text-brand-saffron">{j.year}</div>
                        <div className="font-semibold text-brand-navy">{j.title}</div>
                        <p className="text-sm text-muted-foreground">{j.desc}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Awards & Recognition */}
                <div className="mt-10">
                  <SectionHeading eyebrow="Recognition" title="Awards & Honours" />
                  <div className="grid sm:grid-cols-3 gap-5">
                    {awards.map((a, i) => (
                      <Card key={i} className="p-5 text-center border-brand-gold/20 bg-gradient-to-b from-brand-cream/30 to-transparent">
                        <div className="h-12 w-12 rounded-full bg-brand-gold/10 text-brand-gold flex items-center justify-center mx-auto">
                          <a.icon className="h-5 w-5" />
                        </div>
                        <h3 className="mt-3 font-semibold text-brand-navy text-sm">{a.title}</h3>
                        <p className="mt-1.5 text-xs text-muted-foreground leading-relaxed">{a.desc}</p>
                      </Card>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export function Constituency({ settings }) {
  const { t, lang } = useT()
  const [villages, setVillages] = useState([])
  const [loading, setLoading] = useState(true)
  const [q, setQ] = useState('')

  useEffect(() => { (async () => { try { setVillages(await api('/villages')) } catch (e) {} finally { setLoading(false) } })() }, [])
  const filtered = villages.filter(v => !q || (loc(v, 'name', lang) + loc(v, 'gram_panchayat', lang) + loc(v, 'taluk', lang)).toLowerCase().includes(q.toLowerCase()))
  
  const ICONS = [Users, Trees, Landmark, Building2]
  const defaultStats = [
    { label: t('constituency.population'), value: '2.4 Lakh+' },
    { label: t('constituency.villages'), value: '220+' },
    { label: t('constituency.gramPanchayats'), value: '42' },
    { label: t('constituency.taluks'), value: '1 (Khanapur)' },
  ]
  const stats = (settings?.constituency_stats && settings.constituency_stats.length) ? settings.constituency_stats.map(s => ({ ...s, label: loc(s, 'label', lang) || s.label })) : defaultStats

  return (
    <div>
      <PageBanner title={t('constituency.title')} subtitle={settings?.constituency} image={IMAGES.infra2} breadcrumb={`${t('nav.home')} / ${t('nav.constituency')}`} />
      <div className="container py-12">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
          {stats.map((s, i) => {
            const Icon = ICONS[i % ICONS.length]
            return (
              <Card key={i} className="p-6"><div className="h-11 w-11 rounded-lg bg-brand-navy/5 text-brand-navy flex items-center justify-center"><Icon className="h-5 w-5" /></div><div className="mt-4 text-2xl font-bold text-brand-navy">{s.value}</div><div className="text-sm text-muted-foreground">{s.label}</div></Card>
            )
          })}
        </div>
        <div className="grid lg:grid-cols-2 gap-8 items-start">
          <div>
            <SectionHeading eyebrow={t('nav.constituency')} title={t('constituency.title')} />
            <p className="text-muted-foreground leading-relaxed whitespace-pre-line mt-4">
              {loc(settings, 'constituency_desc', lang) || 'Khanapur is a scenic and culturally rich constituency in Belagavi District, Karnataka. It encompasses over 200 villages with diverse communities speaking Kannada, Marathi, and Hindi.'}
            </p>
            <div className="mt-6 rounded-2xl overflow-hidden border">
              <iframe title="Constituency Map" className="w-full h-72" loading="lazy" src={settings?.constituency_map || 'https://www.openstreetmap.org/export/embed.html?bbox=74.0%2C15.5%2C75.5%2C16.9&layer=mapnik'} />
            </div>
          </div>
          <div>
            <SectionHeading eyebrow={t('constituency.villages')} title={t('constituency.directory')} />
            <Input placeholder="Search villages…" value={q} onChange={e => setQ(e.target.value)} className="mb-4" />
            {loading ? <Loading /> : (
              <div className="space-y-2 max-h-[420px] overflow-auto pr-1">
                {filtered.map(v => (
                  <div key={v.id} className="flex items-center justify-between rounded-lg border p-3 hover:border-brand-gold/40">
                    <div><div className="font-medium text-brand-navy">{loc(v, 'name', lang)}</div><div className="text-xs text-muted-foreground">{loc(v, 'gram_panchayat', lang)} • {loc(v, 'taluk', lang)}</div></div>
                    <span className="text-xs rounded-full bg-brand-cream px-2.5 py-1 font-medium text-brand-navy">{v.projects_count} projects</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export function Contact({ settings }) {
  const { t } = useT()
  const [form, setForm] = useState({ name: '', email: '', mobile: '', message: '' })
  const [sending, setSending] = useState(false)
  const set = (k, v) => setForm(s => ({ ...s, [k]: v }))

  const submit = async (e) => {
    e.preventDefault()
    if (!form.name || !form.message) { toast.error('Please provide your name and message'); return }
    setSending(true)
    try { await api('/contact', { method: 'POST', body: JSON.stringify(form) }); toast.success('Message sent to the MLA office'); setForm({ name: '', email: '', mobile: '', message: '' }) }
    catch (err) { toast.error(err.message) } finally { setSending(false) }
  }

  const items = [
    { icon: MapPin, label: t('contact.officeAddress'), value: settings?.office_address },
    { icon: Phone, label: t('contact.phone'), value: settings?.office_phone },
    { icon: Mail, label: t('contact.email'), value: settings?.office_email },
    { icon: Clock, label: t('contact.hours'), value: settings?.office_hours },
  ]

  return (
    <div>
      <PageBanner title={t('contact.title')} subtitle={t('contact.subtitle')} image={IMAGES.gov} breadcrumb={`${t('nav.home')} / ${t('nav.contact')}`} />
      <div className="container py-12 grid lg:grid-cols-2 gap-10">
        <div>
          <SectionHeading eyebrow={t('nav.contact')} title={t('contact.title')} />
          <div className="space-y-4">
            {items.map((it, i) => (
              <div key={i} className="flex gap-4 rounded-xl border p-4">
                <div className="h-11 w-11 rounded-lg bg-brand-navy/5 text-brand-navy flex items-center justify-center shrink-0"><it.icon className="h-5 w-5" /></div>
                <div><div className="text-sm text-muted-foreground">{it.label}</div><div className="font-medium text-brand-navy">{it.value}</div></div>
              </div>
            ))}
          </div>
        </div>
        <div>
          <SectionHeading eyebrow={t('contact.sendMessage')} title={t('contact.sendMessage')} />
          <Card className="p-6">
            <form onSubmit={submit} className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div><Label>{t('grievance.fullName')} *</Label><Input className="mt-1.5" value={form.name} onChange={e => set('name', e.target.value)} /></div>
                <div><Label>{t('grievance.mobile')}</Label><Input className="mt-1.5" value={form.mobile} onChange={e => set('mobile', e.target.value)} /></div>
              </div>
              <div><Label>{t('grievance.email')}</Label><Input type="email" className="mt-1.5" value={form.email} onChange={e => set('email', e.target.value)} /></div>
              <div><Label>{t('grievance.description')} *</Label><Textarea rows={5} className="mt-1.5" value={form.message} onChange={e => set('message', e.target.value)} /></div>
              <Button type="submit" disabled={sending} className="w-full bg-brand-navy hover:bg-brand-navy-2"><Send className="h-4 w-4 mr-2" />{sending ? 'Sending…' : t('cta.submitNow')}</Button>
            </form>
          </Card>
        </div>
      </div>
    </div>
  )
}

export function LegalPage({ kind }) {
  const { t } = useT()
  const titleKey = `nav.${kind}`
  const title = t(titleKey) || 'Legal'
  return (
    <div>
      <PageBanner title={title} image={IMAGES.gov} breadcrumb={`${t('nav.home')} / ${title}`} />
      <div className="container py-12 max-w-3xl">
        <p className="text-muted-foreground leading-relaxed">
          Official {title} details for the digital platform of Shri Vithal Somanna Halgekar, MLA. This portal operates in public interest for transparent communication and citizen service delivery.
        </p>
      </div>
    </div>
  )
}
