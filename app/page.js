'use client'

import { useEffect, useState, useCallback } from 'react'
import { api, DEFAULT_SETTINGS } from '@/lib/site/config'
import Header from '@/components/site/Header'
import Footer from '@/components/site/Footer'
import Home from '@/components/site/Home'
import { Development, ProjectDetail } from '@/components/site/Development'
import { Grievance, Track } from '@/components/site/Grievance'
import { News, Article, Gallery, Schemes, Activities, Documents } from '@/components/site/ContentPages'
import { About, Constituency, Contact, LegalPage } from '@/components/site/InfoPages'
import Account from '@/components/site/Account'
import Admin from '@/components/site/Admin'

function parseHash() {
  const h = (typeof window !== 'undefined' ? window.location.hash : '').replace(/^#\/?/, '')
  const [name, id] = h.split('/')
  return { name: name || 'home', id: id || null }
}

const TITLES = {
  home: 'Home', about: 'About', constituency: 'Constituency', development: 'Development Projects',
  project: 'Project Details', schemes: 'Government Schemes', activities: 'Activities & Events',
  news: 'News & Updates', article: 'News', gallery: 'Gallery', documents: 'Documents',
  grievance: 'Citizen Services', track: 'Track Request', contact: 'Contact', admin: 'Admin Console', account: 'Citizen Portal',
  privacy: 'Privacy Policy', terms: 'Terms of Use', accessibility: 'Accessibility', disclaimer: 'Disclaimer',
}

function App() {
  const [route, setRoute] = useState({ name: 'home', id: null })
  const [settings, setSettings] = useState(DEFAULT_SETTINGS)
  const [user, setUser] = useState(null)

  const loadSettings = useCallback(() => {
    api('/settings').then(s => { if (s) setSettings({ ...DEFAULT_SETTINGS, ...s }) }).catch(() => {})
  }, [])

  useEffect(() => { loadSettings() }, [loadSettings])

  useEffect(() => {
    if (typeof window === 'undefined' || !localStorage.getItem('vsh_token')) return
    api('/auth/me').then(r => { if (r?.user?.role === 'Citizen') setUser(r.user) }).catch(() => {})
  }, [])

  const onAuthed = useCallback((token, u) => { localStorage.setItem('vsh_token', token); setUser(u) }, [])
  const onLogout = useCallback(() => { localStorage.removeItem('vsh_token'); setUser(null); window.location.hash = '/home' }, [])

  useEffect(() => {
    const onHash = () => { setRoute(parseHash()); window.scrollTo({ top: 0, behavior: 'smooth' }) }
    onHash()
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])

  useEffect(() => {
    const t = TITLES[route.name] || 'Home'
    document.title = `${t} | ${settings?.mla_name || 'MLA'}`
  }, [route, settings])

  const go = useCallback((name, id) => {
    window.location.hash = id ? `/${name}/${id}` : `/${name}`
  }, [])

  const { name, id } = route

  if (name === 'admin') {
    return <Admin go={go} reloadSettings={loadSettings} />
  }

  const render = () => {
    switch (name) {
      case 'home': return <Home settings={settings} go={go} />
      case 'about': return <About settings={settings} />
      case 'constituency': return <Constituency settings={settings} />
      case 'development': return <Development go={go} />
      case 'project': return <ProjectDetail id={id} go={go} />
      case 'schemes': return <Schemes />
      case 'activities': return <Activities />
      case 'news': return <News go={go} />
      case 'article': return <Article id={id} go={go} />
      case 'gallery': return <Gallery />
      case 'documents': return <Documents />
      case 'grievance': return <Grievance go={go} />
      case 'track': return <Track go={go} />
      case 'contact': return <Contact settings={settings} />
      case 'account': return <Account user={user} go={go} onAuthed={onAuthed} />
      case 'privacy': case 'terms': case 'accessibility': case 'disclaimer': return <LegalPage kind={name} />
      default: return <Home settings={settings} go={go} />
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-background font-sans text-base leading-relaxed text-foreground [--background:40_38%_97%] [--foreground:208_45%_18%] [--muted:40_27%_93%] [--muted-foreground:211_15%_36%] [--border:40_22%_85%] [--input:40_22%_80%] [&_button]:transition-colors [&_button:focus-visible]:outline [&_button:focus-visible]:outline-2 [&_button:focus-visible]:outline-offset-4 [&_button:focus-visible]:outline-brand-saffron [&_a:focus-visible]:outline [&_a:focus-visible]:outline-2 [&_a:focus-visible]:outline-offset-4 [&_a:focus-visible]:outline-brand-saffron [&_input]:bg-card [&_textarea]:bg-card [&_button[role=combobox]]:bg-card [&_main_input]:h-11 [&_main_button[role=combobox]]:h-11 [&_.rounded-xl]:rounded-md [&_.rounded-2xl]:rounded-md [&_.shadow]:shadow-none [&_.shadow-sm]:shadow-none">
      <a href="#main-content" onClick={e => { e.preventDefault(); document.getElementById('main-content')?.focus() }} className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[100] focus:rounded-md focus:bg-card focus:p-3 focus:text-foreground">Skip to content</a>
      <Header settings={settings} current={name} go={go} user={user} onLogout={onLogout} />
      <main id="main-content" tabIndex={-1} className="flex-1 outline-none">{render()}</main>
      <Footer settings={settings} go={go} />
    </div>
  )
}

export default App
