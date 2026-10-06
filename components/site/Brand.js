'use client'

import { useEffect, useState } from 'react'
import { UserRound } from 'lucide-react'

export function PartyLogo({ className = 'h-12 w-12' }) {
  return <img src="/branding/bjp-lotus.svg" alt="Bharatiya Janata Party (BJP) lotus logo" width={141} height={151} className={`shrink-0 object-contain ${className}`} />
}

export function OfficialPortrait({ src, name, className = '' }) {
  const [failed, setFailed] = useState(false)
  useEffect(() => { setFailed(false) }, [src])
  const imageSrc = (failed || !src) ? '/branding/vithal-halgekar.png' : src
  return <img src={imageSrc} alt={name || 'Shri Vithal Somanna Halgekar'} width={1204} height={1568} fetchPriority="high" onError={() => setFailed(true)} className={`object-cover object-top ${className}`} />
}
