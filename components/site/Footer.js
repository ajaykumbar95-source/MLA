'use client'

import { NAV } from '@/lib/site/config'
import { useT } from '@/lib/site/i18n'
import { PartyLogo } from './Brand'
import { Facebook, Twitter, Instagram, Youtube, MapPin, Phone, Mail, Clock, ArrowUpRight } from 'lucide-react'

export default function Footer({ settings, go }) {
  const { t } = useT()
  const services = [
    { label: t('cta.grievance'), route: 'grievance' },
    { label: t('cta.track'), route: 'track' },
    { label: t('cta.myAccount'), route: 'account' },
    { label: t('nav.schemes'), route: 'schemes' },
    { label: t('nav.documents'), route: 'documents' },
  ]
  const social = [[Facebook, settings?.social?.facebook, 'Facebook'], [Twitter, settings?.social?.twitter, 'X / Twitter'], [Instagram, settings?.social?.instagram, 'Instagram'], [Youtube, settings?.social?.youtube, 'YouTube']].filter(([, href]) => href && href !== '#')
  return (
    <footer className="border-t-4 border-brand-saffron bg-brand-navy text-slate-200">
      <div className="container py-12 md:py-14">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-[1.4fr_0.8fr_1fr_1.2fr]">
          <div>
            <div className="mb-5 inline-flex rounded-sm bg-white p-2"><PartyLogo className="h-12 w-12" /></div>
            <p className="max-w-xs text-lg font-semibold leading-snug text-white">{settings?.mla_name}</p>
            <p className="mt-2 text-sm leading-relaxed">{t('hero.designation')}</p>
            <p className="mt-1 text-sm text-brand-gold-2">{t('brand.party')}</p>
            {social.length > 0 && <div className="mt-5 flex gap-2">{social.map(([Icon, href, label]) => <a key={label} href={href} aria-label={label} target="_blank" rel="noreferrer" className="flex h-10 w-10 items-center justify-center rounded-md border border-white/20 hover:border-brand-gold-2 hover:text-brand-gold-2"><Icon className="h-4 w-4" /></a>)}</div>}
          </div>
          <div>
            <h2 className="mb-4 text-base font-semibold text-white">{t('foot.navigation')}</h2>
            <ul className="space-y-2 text-sm">{NAV.map(n => <li key={n.route}><button onClick={() => go(n.route)} className="py-0.5 text-left hover:text-brand-gold-2">{t('nav.' + n.route)}</button></li>)}</ul>
          </div>
          <div>
            <h2 className="mb-4 text-base font-semibold text-white">{t('foot.citizenServices')}</h2>
            <ul className="space-y-3 text-sm">{services.map(s => <li key={s.route}><button onClick={() => go(s.route)} className="inline-flex items-center gap-2 text-left hover:text-brand-gold-2">{s.label}<ArrowUpRight className="h-3.5 w-3.5 shrink-0" /></button></li>)}</ul>
          </div>
          <div>
            <h2 className="mb-4 text-base font-semibold text-white">{t('foot.office')}</h2>
            <ul className="space-y-4 text-sm leading-relaxed">
              <li className="flex gap-3"><MapPin className="mt-0.5 h-4 w-4 shrink-0 text-brand-gold-2" /><span>{settings?.office_address}</span></li>
              <li className="flex gap-3"><Phone className="mt-0.5 h-4 w-4 shrink-0 text-brand-gold-2" /><span>{settings?.office_phone}</span></li>
              <li className="flex gap-3"><Mail className="mt-0.5 h-4 w-4 shrink-0 text-brand-gold-2" /><span className="break-all">{settings?.office_email}</span></li>
              <li className="flex gap-3"><Clock className="mt-0.5 h-4 w-4 shrink-0 text-brand-gold-2" /><span>{settings?.office_hours}</span></li>
            </ul>
          </div>
        </div>
      </div>
      <div className="border-t border-white/15">
        <div className="container flex flex-col justify-between gap-4 py-5 text-xs leading-relaxed text-slate-300 md:flex-row">
          <p>© {new Date().getFullYear()} {settings?.mla_name}. {t('foot.rights')}</p>
          <div className="flex flex-wrap gap-x-5 gap-y-3">
            <button onClick={() => go('privacy')} className="hover:text-white">{t('nav.privacy')}</button>
            <button onClick={() => go('terms')} className="hover:text-white">{t('nav.terms')}</button>
            <button onClick={() => go('accessibility')} className="hover:text-white">{t('nav.accessibility')}</button>
            <button onClick={() => go('admin')} className="hover:text-white">{t('cta.admin')}</button>
          </div>
        </div>
      </div>
    </footer>
  )
}
