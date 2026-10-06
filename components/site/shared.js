'use client'

import { STATUS_STYLES, initials } from '@/lib/site/config'
import { useT } from '@/lib/site/i18n'
import { Landmark, Loader2 } from 'lucide-react'

export function SectionHeading({ eyebrow, title, desc, center, light }) {
  return (
    <div className={`${center ? 'text-center mx-auto max-w-2xl' : 'max-w-2xl'} mb-8`}>
      {eyebrow && <p className={`mb-2 text-sm font-medium ${light ? 'text-brand-gold-2' : 'text-brand-saffron'}`}>{eyebrow}</p>}
      <h2 className={`text-2xl font-semibold leading-snug tracking-tight md:text-3xl ${light ? 'text-white' : 'text-foreground'}`}>{title}</h2>
      {desc && <p className={`mt-3 text-base leading-7 ${light ? 'text-slate-200' : 'text-muted-foreground'}`}>{desc}</p>}
    </div>
  )
}

export function StatusBadge({ status }) {
  const { t } = useT()
  return (
    <span className={`inline-flex items-center rounded-sm border px-2.5 py-1 text-xs font-medium ${STATUS_STYLES[status] || 'bg-slate-100 text-slate-700 border-slate-200'}`}>
      {t('status.' + status) || status}
    </span>
  )
}

export function ProgressBar({ value = 0 }) {
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-sm bg-muted">
      <div className="h-full rounded-sm bg-brand-saffron transition-all motion-reduce:transition-none" style={{ width: `${Math.max(0, Math.min(100, value))}%` }} />
    </div>
  )
}

export function Monogram({ name, className = '' }) {
  return (
    <div className={`relative flex items-center justify-center bg-gradient-to-br from-brand-navy via-brand-navy-2 to-brand-navy-3 text-white ${className}`}>
      <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 30% 20%, #fff 1px, transparent 1px)', backgroundSize: '18px 18px' }} />
      <div className="text-center px-4">
        <span className="font-display font-bold tracking-tight" style={{ fontSize: 'clamp(2.5rem, 6vw, 5rem)' }}>{initials(name)}</span>
      </div>
    </div>
  )
}

export function Emblem({ size = 40 }) {
  return (
    <div className="flex items-center justify-center rounded-full bg-brand-navy text-brand-gold-2 ring-2 ring-brand-gold/40 shrink-0" style={{ width: size, height: size }}>
      <Landmark size={size * 0.5} />
    </div>
  )
}

export function Loading({ label = 'Loading…' }) {
  return (
    <div className="flex items-center justify-center gap-3 py-20 text-muted-foreground">
      <Loader2 className="h-5 w-5 animate-spin" /> {label}
    </div>
  )
}

export function EmptyState({ title = 'Nothing here yet', desc, icon: Icon }) {
  return (
    <div className="text-center py-16 border border-dashed rounded-xl bg-muted/30">
      {Icon && <Icon className="h-10 w-10 mx-auto text-muted-foreground/50 mb-3" />}
      <p className="font-semibold text-brand-navy">{title}</p>
      {desc && <p className="text-sm text-muted-foreground mt-1">{desc}</p>}
    </div>
  )
}

export function PageBanner({ title, subtitle, image, breadcrumb }) {
  return (
    <section className="border-b border-border bg-brand-cream">
      <div className="container border-l-0 py-9 md:py-12">
        {breadcrumb && <p className="mb-4 text-sm text-muted-foreground">{breadcrumb}</p>}
        <div className="border-l-[3px] border-brand-saffron pl-5">
          <h1 className="max-w-4xl text-2xl font-semibold leading-snug tracking-tight text-foreground md:text-4xl">{title}</h1>
          {subtitle && <p className="mt-3 max-w-3xl text-base leading-7 text-muted-foreground">{subtitle}</p>}
        </div>
      </div>
    </section>
  )
}
