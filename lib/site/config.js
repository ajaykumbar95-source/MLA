// Site config, constants, images and API helper

export const IMAGES = {
  hero: 'https://images.unsplash.com/photo-1709967884183-7ffa9d168508?crop=entropy&cs=srgb&fm=jpg&q=85&w=1600',
  gov: 'https://images.unsplash.com/photo-1709967884183-7ffa9d168508?crop=entropy&cs=srgb&fm=jpg&q=85&w=1400',
  infra1: 'https://images.unsplash.com/photo-1558464678-2f1570e8d60e?crop=entropy&cs=srgb&fm=jpg&q=85&w=1200',
  infra2: 'https://images.unsplash.com/photo-1576577610667-c9ea0ac983fd?crop=entropy&cs=srgb&fm=jpg&q=85&w=1200',
  community: 'https://images.unsplash.com/photo-1709962223511-108cdbe3e920?crop=entropy&cs=srgb&fm=jpg&q=85&w=1200',
  p1: 'https://images.pexels.com/photos/34525311/pexels-photo-34525311.jpeg?auto=compress&cs=tinysrgb&w=1200',
  p2: 'https://images.pexels.com/photos/33059588/pexels-photo-33059588.jpeg?auto=compress&cs=tinysrgb&w=1200',
}

export const NAV = [
  { label: 'Home', route: 'home' },
  { label: 'About', route: 'about' },
  { label: 'Constituency', route: 'constituency' },
  { label: 'Development', route: 'development' },
  { label: 'Schemes', route: 'schemes' },
  { label: 'Activities', route: 'activities' },
  { label: 'News', route: 'news' },
  { label: 'Gallery', route: 'gallery' },
  { label: 'Documents', route: 'documents' },
  { label: 'Contact', route: 'contact' },
]

export const PROJECT_STATUSES = ['Proposed', 'Approved', 'Ongoing', 'Completed', 'Delayed']
export const GRIEVANCE_STATUSES = ['Submitted', 'Under Review', 'Assigned', 'In Progress', 'Resolved', 'Closed']
export const DEPARTMENTS = ['Public Works Department', 'Rural Development', 'Water Resources', 'Education', 'Health & Family Welfare', 'Urban Development']
export const PROJECT_CATEGORIES = ['Roads & Bridges', 'Water Supply', 'Public Buildings', 'Health', 'Education', 'Sanitation']
export const GRIEVANCE_CATEGORIES = ['Water Supply', 'Roads & Infrastructure', 'Electricity', 'Health', 'Education', 'Sanitation', 'Revenue / Land', 'Pension & Welfare', 'Other']

export const STATUS_STYLES = {
  Proposed: 'bg-slate-100 text-slate-700 border-slate-200',
  Approved: 'bg-blue-50 text-blue-700 border-blue-200',
  Ongoing: 'bg-amber-50 text-amber-700 border-amber-200',
  Completed: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  Delayed: 'bg-red-50 text-red-700 border-red-200',
  Submitted: 'bg-slate-100 text-slate-700 border-slate-200',
  'Under Review': 'bg-blue-50 text-blue-700 border-blue-200',
  Assigned: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  'In Progress': 'bg-amber-50 text-amber-700 border-amber-200',
  Resolved: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  Closed: 'bg-slate-200 text-slate-700 border-slate-300',
}

export const DEFAULT_SETTINGS = {
  mla_name: 'Shri Vithal Somanna Halgekar',
  designation: 'Member of Legislative Assembly (MLA)',
  constituency: 'Khanapur Constituency',
  party: 'Bharatiya Janata Party',
  photo_url: '/branding/vithal-halgekar.png',
  hero_message: 'Committed to inclusive development, transparent governance and being an accessible voice for every citizen.',
  official_quote: 'Public service is a sacred responsibility.',
  office_address: 'MLA Office, Khanapur, Belagavi District, Karnataka - 591302',
  office_phone: '+91 8336 222001',
  office_email: 'office@vsh-mla.gov.in',
  office_hours: 'Monday – Saturday, 10:00 AM – 5:00 PM',
  social: { facebook: '#', twitter: '#', instagram: '#', youtube: '#' },
  stats: [],
}

export function token() {
  if (typeof window === 'undefined') return null
  return localStorage.getItem('vsh_token')
}

export async function api(path, opts = {}) {
  const t = token()
  const res = await fetch(`/api${path}`, {
    ...opts,
    headers: {
      'Content-Type': 'application/json',
      ...(t ? { Authorization: `Bearer ${t}` } : {}),
      ...(opts.headers || {}),
    },
  })
  let data = null
  try { data = await res.json() } catch (e) { data = null }
  if (!res.ok) throw new Error(data?.error || `Request failed (${res.status})`)
  return data
}

export function fmtCurrency(n) {
  if (n == null || isNaN(n)) return '—'
  if (n >= 10000000) return `₹${(n / 10000000).toFixed(2)} Cr`
  if (n >= 100000) return `₹${(n / 100000).toFixed(2)} L`
  return `₹${Number(n).toLocaleString('en-IN')}`
}

export function fmtDate(d) {
  if (!d) return '—'
  try { return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) } catch { return '—' }
}

export function initials(name = '') {
  const honorifics = ['shri', 'smt', 'dr', 'mr', 'ms', 'mrs', 'sri', 'kum']
  const words = name.replace(/[^A-Za-z ]/g, '').split(' ').filter(Boolean).filter(w => !honorifics.includes(w.toLowerCase()))
  return words.slice(0, 3).map(w => w[0]).join('').toUpperCase() || 'VSH'
}

// Return a localized field value: item.title_kn -> falls back to item.title
export function loc(item, field, lang) {
  if (!item) return ''
  if (lang && lang !== 'en') {
    const v = item[`${field}_${lang}`]
    if (v != null && String(v).trim() !== '') return v
  }
  return item[field]
}
