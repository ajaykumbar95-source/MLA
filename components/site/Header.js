'use client'

import { useState } from 'react'
import { NAV } from '@/lib/site/config'
import { useT, LANGS } from '@/lib/site/i18n'
import { PartyLogo } from './Brand'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/components/ui/sheet'
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu'
import { Menu, Mail, ArrowRight, Search, Shield, Languages, Clock, User, LogOut, ChevronDown } from 'lucide-react'

export default function Header({ settings, current, go, user, onLogout }) {
  const [open, setOpen] = useState(false)
  const { t, lang, setLang } = useT()
  const nav = r => { go(r); setOpen(false) }
  const isActive = r => current === r || (r === 'development' && current === 'project') || (r === 'news' && current === 'article')
  const currentLang = LANGS.find(l => l.code === lang) || LANGS[0]

  const LangMenu = ({ className = '' }) => (
    <DropdownMenu>
      <DropdownMenuTrigger aria-label={`Language: ${currentLang.label}`} className={`inline-flex min-h-10 items-center gap-2 rounded-sm px-1 text-sm ${className}`}>
        <Languages className="h-4 w-4" />{currentLang.label}<ChevronDown className="h-3.5 w-3.5" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {LANGS.map(l => <DropdownMenuItem key={l.code} onClick={() => setLang(l.code)} className={`py-2.5 ${l.code === lang ? 'font-semibold text-brand-saffron' : ''}`}>{l.label}</DropdownMenuItem>)}
      </DropdownMenuContent>
    </DropdownMenu>
  )

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-card">
      <div className="bg-brand-navy text-white">
        <div className="container flex min-h-10 items-center justify-between gap-3 text-xs sm:text-sm">
          <span className="inline-flex items-center gap-2"><span className="h-1.5 w-1.5 bg-brand-gold" />{t('hero.badge')}</span>
          <span className="hidden xl:inline-flex items-center gap-2 text-slate-200"><Clock className="h-3.5 w-3.5" />{settings?.office_hours}</span>
          <div className="flex items-center gap-3 sm:gap-5">
            <LangMenu className="text-white hover:text-brand-gold-2" />
            <button onClick={() => go('account')} className="hidden sm:inline-flex items-center gap-1.5 py-2 hover:text-brand-gold-2"><User className="h-3.5 w-3.5" />{user ? user.name?.split(' ')[0] : t('cta.login')}</button>
            {user && <button aria-label={t('cta.logout')} onClick={onLogout} className="hidden sm:inline-flex items-center gap-1.5 py-2 hover:text-brand-gold-2"><LogOut className="h-3.5 w-3.5" />{t('cta.logout')}</button>}
            <button onClick={() => go('admin')} className="hidden md:inline-flex items-center gap-1.5 py-2 text-slate-200 hover:text-white"><Shield className="h-3.5 w-3.5" />{t('cta.admin')}</button>
          </div>
        </div>
      </div>

      <div className="container flex items-center justify-between gap-4 py-4 md:py-5">
        <button onClick={() => go('home')} className="flex min-w-0 items-center gap-3 text-left sm:gap-4" aria-label={`${settings?.mla_name} — ${t('nav.home')}`}>
          <PartyLogo className="h-12 w-12 sm:h-16 sm:w-16" />
          <div className="min-w-0 border-l border-border pl-3 sm:pl-4">
            <div className="max-w-[260px] text-base font-semibold leading-snug tracking-tight text-foreground sm:max-w-none md:text-xl">{settings?.mla_name}</div>
            <div className="mt-1 text-xs leading-relaxed text-muted-foreground sm:text-sm">{t('hero.designation')}</div>
          </div>
        </button>
        <div className="flex shrink-0 items-center gap-3">
          <div className="hidden lg:flex items-center gap-3">
            <Button variant="outline" onClick={() => go('track')} className="h-11 gap-2 rounded-md border-brand-line bg-card text-foreground hover:bg-brand-cream"><Search className="h-4 w-4" />{t('cta.track')}</Button>
            <Button onClick={() => go('grievance')} className="h-11 gap-2 rounded-md bg-brand-saffron px-5 text-white hover:bg-brand-saffron-hover">{t('cta.citizenServices')}<ArrowRight className="h-4 w-4" /></Button>
          </div>
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild><Button variant="outline" size="icon" className="h-11 w-11 rounded-md lg:hidden" aria-label="Open navigation"><Menu className="h-5 w-5" /></Button></SheetTrigger>
            <SheetContent side="right" className="w-[min(22rem,100vw)] overflow-auto bg-brand-cream p-0">
              <SheetTitle className="sr-only">Navigation</SheetTitle>
              <div className="border-b border-border bg-card p-6 pr-10">
                <PartyLogo className="mb-3 h-12 w-12" />
                <p className="font-semibold text-brand-navy">{settings?.mla_name}</p>
                <p className="mt-1 text-sm text-muted-foreground">Bharatiya Janata Party</p>
                <LangMenu className="mt-2 text-brand-navy" />
              </div>
              <nav aria-label="Mobile navigation" className="flex flex-col p-4">
                {NAV.map(n => <button key={n.route} aria-current={isActive(n.route) ? 'page' : undefined} onClick={() => nav(n.route)} className={`border-l-2 px-4 py-3 text-left text-sm font-medium ${isActive(n.route) ? 'border-brand-saffron bg-brand-saffron-soft text-brand-saffron' : 'border-transparent text-brand-navy hover:bg-card'}`}>{t('nav.' + n.route)}</button>)}
                <Button onClick={() => nav('grievance')} className="mt-5 h-11 bg-brand-saffron text-white hover:bg-brand-saffron-hover">{t('cta.citizenServices')}<ArrowRight className="ml-2 h-4 w-4" /></Button>
                <Button onClick={() => nav('track')} variant="outline" className="mt-2 h-11 bg-card"><Search className="mr-2 h-4 w-4" />{t('cta.track')}</Button>
                <Button onClick={() => nav('account')} variant="ghost" className="mt-2"><User className="mr-2 h-4 w-4" />{user?.name || t('cta.login')}</Button>
                {user && <Button onClick={() => { onLogout(); setOpen(false) }} variant="ghost"><LogOut className="mr-2 h-4 w-4" />{t('cta.logout')}</Button>}
                <Button onClick={() => nav('admin')} variant="ghost"><Shield className="mr-2 h-4 w-4" />{t('cta.admin')}</Button>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      <div className="hidden border-t border-border lg:block">
        <nav aria-label="Main navigation" className="container flex items-stretch justify-between gap-1">
          {NAV.map(n => <button key={n.route} aria-current={isActive(n.route) ? 'page' : undefined} onClick={() => go(n.route)} className={`border-b-2 px-2 py-3.5 text-sm font-medium xl:px-3 ${isActive(n.route) ? 'border-brand-saffron text-brand-saffron' : 'border-transparent text-foreground hover:border-brand-line hover:text-brand-saffron'}`}>{t('nav.' + n.route)}</button>)}
        </nav>
      </div>
    </header>
  )
}
