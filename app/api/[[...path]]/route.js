import { connectToDb } from '@/lib/db'
import {
  hashPassword, verifyPassword, signToken, verifyToken, getAuth,
  parseCorsOrigins, applySecurityHeaders,
} from '@/lib/auth'
import { v4 as uuidv4 } from 'uuid'
import { NextResponse } from 'next/server'

let seedPromise

const ALLOWED_ORIGINS = parseCorsOrigins(process.env.CORS_ORIGINS)

function resolveCorsOrigin(request) {
  const origin = request.headers.get('origin')
  if (!ALLOWED_ORIGINS) return origin || '*'
  if (!origin) return ALLOWED_ORIGINS[0]
  if (ALLOWED_ORIGINS.includes(origin)) return origin
  return null
}

function handleCORS(response, request) {
  const origin = resolveCorsOrigin(request)
  if (origin) response.headers.set('Access-Control-Allow-Origin', origin)
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS')
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  response.headers.set('Access-Control-Allow-Credentials', 'true')
  response.headers.set('Access-Control-Max-Age', '86400')
  if (origin && origin !== '*') response.headers.set('Vary', 'Origin')
  applySecurityHeaders(response.headers)
  return response
}

export async function OPTIONS(request) {
  const origin = resolveCorsOrigin(request)
  if (origin === null) return new NextResponse(null, { status: 403 })
  return handleCORS(new NextResponse(null, { status: 204 }), request)
}

const clean = (docs) => Array.isArray(docs) ? docs.map(({ _id, ...r }) => r) : (docs ? (({ _id, ...r }) => r)(docs) : docs)

const TYPE_COLLECTION = {
  projects: 'projects', news: 'news', events: 'events', schemes: 'schemes',
  gallery: 'gallery', documents: 'documents', villages: 'villages',
}

// ---------- Seed placeholder content ----------
const IMG = {
  gov: 'https://images.unsplash.com/photo-1709967884183-7ffa9d168508?crop=entropy&cs=srgb&fm=jpg&q=85&w=1400',
  infra1: 'https://images.unsplash.com/photo-1558464678-2f1570e8d60e?crop=entropy&cs=srgb&fm=jpg&q=85&w=1200',
  infra2: 'https://images.unsplash.com/photo-1576577610667-c9ea0ac983fd?crop=entropy&cs=srgb&fm=jpg&q=85&w=1200',
  community: 'https://images.unsplash.com/photo-1709962223511-108cdbe3e920?crop=entropy&cs=srgb&fm=jpg&q=85&w=1200',
  p1: 'https://images.pexels.com/photos/34525311/pexels-photo-34525311.jpeg?auto=compress&cs=tinysrgb&w=1200',
  p2: 'https://images.pexels.com/photos/33059588/pexels-photo-33059588.jpeg?auto=compress&cs=tinysrgb&w=1200',
}

function ensureSeed(db) {
  if (!seedPromise) seedPromise = doSeed(db).catch((e) => { seedPromise = null; throw e })
  return seedPromise
}

async function doSeed(db) {
  const now = new Date()
  const existing = await db.collection('site_settings').findOne({ id: 'main' })
  if (!existing) {
    await db.collection('site_settings').insertOne({
      id: 'main',
      mla_name: 'Shri Vithal Somanna Halgekar',
      designation: 'Member of Legislative Assembly (MLA)',
      constituency: 'Khanapur Constituency',
      party: 'Bharatiya Janata Party',
      photo_url: '/branding/vithal-halgekar.png',
      hero_message: 'Committed to inclusive development, transparent governance and being an accessible voice for every citizen of our constituency.',
      official_quote: 'Public service is a sacred responsibility. My office is always open to the people I represent.',
      office_address: 'MLA Office, Khanapur, Belagavi District, Karnataka - 591302',
      office_phone: '+91 8336 222001',
      office_email: 'office@vsh-mla.gov.in',
      office_hours: 'Monday – Saturday, 10:00 AM – 5:00 PM',
      social: { facebook: '#', twitter: '#', instagram: '#', youtube: '#' },
      stats: [
        { label: 'Development Projects', value: 128, suffix: '+' },
        { label: 'Completed Works', value: 74, suffix: '' },
        { label: 'Ongoing Works', value: 39, suffix: '' },
        { label: 'Villages Covered', value: 52, suffix: '' },
        { label: 'Citizen Requests Resolved', value: 1860, suffix: '+' },
      ],
      updated_at: now,
    })
  }

  if (await db.collection('projects').countDocuments() === 0) {
    const depts = ['Public Works Department', 'Rural Development', 'Water Resources', 'Education', 'Health & Family Welfare', 'Urban Development']
    const cats = ['Roads & Bridges', 'Water Supply', 'Public Buildings', 'Health', 'Education', 'Sanitation']
    const statuses = ['Proposed', 'Approved', 'Ongoing', 'Completed', 'Delayed']
    const imgs = [IMG.infra1, IMG.infra2, IMG.p1, IMG.p2, IMG.gov, IMG.community]
    const projects = []
    for (let i = 1; i <= 12; i++) {
      const st = statuses[i % statuses.length]
      projects.push({
        id: uuidv4(),
        title: `Development Project #${i} [Placeholder title]`,
        description: 'Official project details will be published here by the MLA office. This is clearly-labelled placeholder content used only for demonstration.',
        location: `Ward / Zone ${i}`,
        village: `Village ${((i % 6) + 1)}`,
        gram_panchayat: `Gram Panchayat ${((i % 4) + 1)}`,
        department: depts[i % depts.length],
        category: cats[i % cats.length],
        sanctioned_amount: (i * 1250000),
        estimated_amount: (i * 1400000),
        start_date: new Date(2024, (i % 12), 5),
        expected_completion: new Date(2025, (i % 12), 20),
        actual_completion: st === 'Completed' ? new Date(2025, (i % 12), 15) : null,
        status: st,
        progress: st === 'Completed' ? 100 : st === 'Ongoing' ? 55 : st === 'Delayed' ? 40 : st === 'Approved' ? 15 : 5,
        year: 2024 + (i % 2),
        image: imgs[i % imgs.length],
        images: [imgs[i % imgs.length], imgs[(i + 1) % imgs.length]],
        featured: i <= 3,
        updates: [
          { date: new Date(2024, (i % 12), 6), note: 'Project sanctioned and administrative approval granted. [Placeholder]' },
          { date: new Date(2025, (i % 12), 2), note: 'Work in progress; site inspection completed. [Placeholder]' },
        ],
        created_at: now, updated_at: now,
      })
    }
    await db.collection('projects').insertMany(projects)
  }

  if (await db.collection('news').countDocuments() === 0) {
    const imgs = [IMG.community, IMG.gov, IMG.infra1, IMG.p1]
    const news = []
    for (let i = 1; i <= 6; i++) {
      news.push({
        id: uuidv4(),
        slug: `news-update-${i}`,
        title: `News & Update #${i} [Placeholder headline]`,
        excerpt: 'Short official summary of the announcement will appear here.',
        content: 'Full article content will be published by the MLA office. This is clearly-labelled placeholder content used only for demonstration purposes.',
        category: ['Announcement', 'Development', 'Public Notice', 'Event'][i % 4],
        cover_image: imgs[i % imgs.length],
        author: 'Office of the MLA',
        featured: i === 1,
        date: new Date(2025, 5 - (i % 5), 10 + i),
        created_at: now, updated_at: now,
      })
    }
    await db.collection('news').insertMany(news)
  }

  if (await db.collection('events').countDocuments() === 0) {
    const cats = ['Public Meeting', 'Village Visit', 'Development Inspection', 'Inauguration', 'Government Meeting', 'Community Program']
    const events = []
    for (let i = 1; i <= 6; i++) {
      events.push({
        id: uuidv4(),
        title: `Upcoming Activity #${i} [Placeholder]`,
        category: cats[i % cats.length],
        date: new Date(2025, 5 + (i % 3), 5 + i, 10, 30),
        location: `Community Hall, Zone ${i}`,
        description: 'Details of this activity will be published by the MLA office. Placeholder content.',
        image: IMG.community,
        created_at: now, updated_at: now,
      })
    }
    await db.collection('events').insertMany(events)
  }

  if (await db.collection('schemes').countDocuments() === 0) {
    const scopes = ['State Government', 'Central Government', 'Constituency Initiative']
    const schemes = []
    for (let i = 1; i <= 6; i++) {
      schemes.push({
        id: uuidv4(),
        name: `Government Scheme #${i} [Placeholder]`,
        scope: scopes[i % scopes.length],
        department: 'Concerned Department',
        description: 'Official scheme description will be published here. Placeholder content.',
        eligibility: '[Eligibility criteria to be provided by the concerned department]',
        benefits: '[Scheme benefits to be provided]',
        documents_required: '[List of required documents to be provided]',
        application_process: '[Application process to be provided]',
        official_link: '#',
        updated_at: now, created_at: now,
      })
    }
    await db.collection('schemes').insertMany(schemes)
  }

  if (await db.collection('documents').countDocuments() === 0) {
    const cats = ['Official Notices', 'Development Reports', 'Government Documents', 'Press Releases', 'Forms', 'Public Information']
    const docs = []
    for (let i = 1; i <= 6; i++) {
      docs.push({
        id: uuidv4(),
        title: `Document #${i} [Placeholder]`,
        category: cats[i % cats.length],
        description: 'Official document. Placeholder entry.',
        file_url: '#',
        file_size: `${(i * 0.3 + 0.4).toFixed(1)} MB`,
        date: new Date(2025, 3, 2 + i),
        created_at: now, updated_at: now,
      })
    }
    await db.collection('documents').insertMany(docs)
  }

  if (await db.collection('villages').countDocuments() === 0) {
    const villages = []
    for (let i = 1; i <= 8; i++) {
      villages.push({
        id: uuidv4(),
        name: `Village ${i} [Placeholder]`,
        gram_panchayat: `Gram Panchayat ${((i % 4) + 1)}`,
        taluk: `Taluk ${((i % 2) + 1)}`,
        population: 2000 + i * 350,
        status: ['Developing', 'Active', 'Priority'][i % 3],
        projects_count: (i % 5) + 1,
        created_at: now, updated_at: now,
      })
    }
    await db.collection('villages').insertMany(villages)
  }

  if (await db.collection('admin_users').countDocuments() === 0) {
    await db.collection('admin_users').insertOne({
      id: uuidv4(),
      name: 'Super Admin',
      email: 'admin@vsh.gov.in',
      password: hashPassword('Admin@12345'),
      role: 'Super Admin',
      created_at: now,
    })
  }
}

// ---------- Stats ----------
async function computeStats(db) {
  const [projects, ongoing, completed, proposed, approved, delayed, villages, reqTotal, reqPending, news, events, gallery, documents] = await Promise.all([
    db.collection('projects').countDocuments(),
    db.collection('projects').countDocuments({ status: 'Ongoing' }),
    db.collection('projects').countDocuments({ status: 'Completed' }),
    db.collection('projects').countDocuments({ status: 'Proposed' }),
    db.collection('projects').countDocuments({ status: 'Approved' }),
    db.collection('projects').countDocuments({ status: 'Delayed' }),
    db.collection('villages').countDocuments(),
    db.collection('citizen_requests').countDocuments(),
    db.collection('citizen_requests').countDocuments({ status: { $nin: ['Resolved', 'Closed'] } }),
    db.collection('news').countDocuments(),
    db.collection('events').countDocuments(),
    db.collection('gallery').countDocuments(),
    db.collection('documents').countDocuments(),
  ])
  return { projects, ongoing, completed, proposed, approved, delayed, villages, requests: reqTotal, pendingRequests: reqPending, news, events, gallery, documents }
}

// ---------- Router ----------
async function handleRoute(request, { params }) {
  const { path = [] } = await params
  const route = `/${path.join('/')}`
  const method = request.method
  const url = new URL(request.url)
  const q = url.searchParams
  const json = (data, status = 200) => handleCORS(NextResponse.json(data, { status }), request)

  try {
    const db = await connectToDb()
    await ensureSeed(db)

    if ((route === '/' || route === '/root') && method === 'GET') return json({ message: 'VSH MLA Portal API' })

    // ---- Settings ----
    if (route === '/settings' && method === 'GET') {
      const s = await db.collection('site_settings').findOne({ id: 'main' })
      return json(clean(s))
    }
    if (route === '/admin/settings' && method === 'PUT') {
      const auth = getAuth(request)
      if (!auth || !auth.role.includes('Admin')) return json({ error: 'Unauthorized' }, 403)
      const body = await request.json()
      delete body._id; delete body.id
      body.updated_at = new Date()
      await db.collection('site_settings').updateOne({ id: 'main' }, { $set: body }, { upsert: true })
      const s = await db.collection('site_settings').findOne({ id: 'main' })
      return json(clean(s))
    }

    // ---- Stats ----
    if (route === '/stats' && method === 'GET') return json(await computeStats(db))
    if (route === '/admin/stats' && method === 'GET') {
      const auth = getAuth(request)
      if (!auth || !auth.role.includes('Admin')) return json({ error: 'Unauthorized' }, 403)
      return json(await computeStats(db))
    }

    // ---- Auth ----
    if (route === '/auth/register' && method === 'POST') {
      const b = await request.json()
      const email = (b.email || '').toLowerCase().trim()
      if (!b.name || !email || !b.password) return json({ error: 'Name, email and password are required' }, 400)
      if ((b.password || '').length < 6) return json({ error: 'Password must be at least 6 characters' }, 400)
      const exists = await db.collection('users').findOne({ email })
      if (exists) return json({ error: 'An account with this email already exists' }, 409)
      const user = { id: uuidv4(), name: b.name, email, mobile: b.mobile || '', password: hashPassword(b.password), role: 'Citizen', created_at: new Date() }
      await db.collection('users').insertOne(user)
      const token = signToken({ id: user.id, role: 'Citizen', name: user.name, email })
      return json({ token, user: { id: user.id, name: user.name, email, mobile: user.mobile, role: 'Citizen' } })
    }
    if (route === '/auth/login' && method === 'POST') {
      const { email, password } = await request.json()
      const id = (email || '').toLowerCase().trim()
      // Admins first, then citizen users
      let acct = await db.collection('admin_users').findOne({ email: id })
      let kind = 'admin'
      if (!acct) { acct = await db.collection('users').findOne({ $or: [{ email: id }, { mobile: (email || '').trim() }] }); kind = 'user' }
      if (!acct || !verifyPassword(password || '', acct.password)) {
        return json({ error: 'Invalid email/mobile or password' }, 401)
      }
      const token = signToken({ id: acct.id, role: acct.role, name: acct.name, email: acct.email })
      return json({ token, user: { id: acct.id, name: acct.name, email: acct.email, mobile: acct.mobile || '', role: acct.role, kind } })
    }
    if (route === '/auth/me' && method === 'GET') {
      const auth = getAuth(request)
      if (!auth) return json({ error: 'Unauthorized' }, 401)
      return json({ user: { id: auth.id, name: auth.name, email: auth.email, role: auth.role } })
    }
    // ---- Citizen: my requests ----
    if (route === '/users/me/requests' && method === 'GET') {
      const auth = getAuth(request)
      if (!auth) return json({ error: 'Unauthorized' }, 401)
      const list = await db.collection('citizen_requests').find({ $or: [{ user_id: auth.id }, { user_email: auth.email }] }).sort({ created_at: -1 }).limit(200).toArray()
      return json(clean(list))
    }

    // ---- Grievance: create ----
    if (route === '/grievances' && method === 'POST') {
      const b = await request.json()
      if (!b.name || !b.mobile || !b.category || !b.description) {
        return json({ error: 'Name, mobile, category and description are required' }, 400)
      }
      const auth = getAuth(request)
      const seq = (await db.collection('citizen_requests').countDocuments()) + 1
      const tracking_id = `VSH-2026-${String(seq).padStart(6, '0')}`
      const now = new Date()
      const doc = {
        id: uuidv4(),
        tracking_id,
        type: b.type || 'Complaint',
        name: b.name, mobile: b.mobile, email: b.email || '',
        user_id: auth?.id || '', user_email: auth?.email || '',
        address: b.address || '', village: b.village || '', gram_panchayat: b.gram_panchayat || '',
        category: b.category, description: b.description,
        attachment: b.attachment || '',
        status: 'Submitted',
        assigned_to: '',
        internal_notes: [],
        updates: [{ status: 'Submitted', note: 'Your request has been received by the MLA office.', at: now, public: true }],
        created_at: now, updated_at: now,
      }
      await db.collection('citizen_requests').insertOne(doc)
      return json({ success: true, tracking_id })
    }

    // ---- Grievance: track (public) ----
    if (route === '/grievances/track' && method === 'POST') {
      const { tracking_id, mobile } = await request.json()
      const r = await db.collection('citizen_requests').findOne({ tracking_id: (tracking_id || '').trim().toUpperCase(), mobile: (mobile || '').trim() })
      if (!r) return json({ error: 'No request found with the provided ID and mobile number' }, 404)
      return json({
        tracking_id: r.tracking_id, type: r.type, category: r.category, status: r.status,
        created_at: r.created_at,
        updates: (r.updates || []).filter(u => u.public !== false).map(u => ({ status: u.status, note: u.note, at: u.at })),
      })
    }

    // ---- Contact message ----
    if (route === '/contact' && method === 'POST') {
      const b = await request.json()
      if (!b.name || !b.message) return json({ error: 'Name and message are required' }, 400)
      await db.collection('contact_messages').insertOne({ id: uuidv4(), ...b, created_at: new Date() })
      return json({ success: true })
    }

    // ---- Admin: grievances list ----
    if (route === '/admin/grievances' && method === 'GET') {
      const auth = getAuth(request)
      if (!auth || !auth.role.includes('Admin')) return json({ error: 'Unauthorized' }, 403)
      const filter = {}
      if (q.get('status')) filter.status = q.get('status')
      if (q.get('q')) {
        const rx = new RegExp(q.get('q'), 'i')
        filter.$or = [{ tracking_id: rx }, { name: rx }, { mobile: rx }, { category: rx }]
      }
      const list = await db.collection('citizen_requests').find(filter).sort({ created_at: -1 }).limit(500).toArray()
      return json(clean(list))
    }
    if (route.startsWith('/admin/grievances/') && method === 'PUT') {
      const auth = getAuth(request)
      if (!auth || !auth.role.includes('Admin')) return json({ error: 'Unauthorized' }, 403)
      const id = path[2]
      const b = await request.json()
      const now = new Date()
      const set = { updated_at: now }
      const push = {}
      if (b.status) {
        set.status = b.status
        push.updates = { status: b.status, note: b.public_note || `Status updated to ${b.status}.`, at: now, public: true }
      }
      if (b.assigned_to !== undefined) set.assigned_to = b.assigned_to
      if (b.internal_note) push.internal_notes = { note: b.internal_note, by: auth.name, at: now }
      const update = { $set: set }
      if (Object.keys(push).length) update.$push = push
      await db.collection('citizen_requests').updateOne({ id }, update)
      const r = await db.collection('citizen_requests').findOne({ id })
      return json(clean(r))
    }

    // ---- Generic content: public list & detail ----
    const parts = path
    if (parts.length >= 1 && TYPE_COLLECTION[parts[0]] && !route.startsWith('/admin')) {
      const col = db.collection(TYPE_COLLECTION[parts[0]])
      if (method === 'GET' && parts.length === 1) {
        const filter = {}
        for (const key of ['status', 'department', 'category', 'scope', 'year', 'village', 'gram_panchayat', 'featured']) {
          const v = q.get(key)
          if (v) filter[key] = key === 'year' ? parseInt(v) : (v === 'true' ? true : v)
        }
        if (q.get('q')) {
          const rx = new RegExp(q.get('q'), 'i')
          filter.$or = [{ title: rx }, { name: rx }, { description: rx }, { location: rx }, { category: rx }]
        }
        const sortField = parts[0] === 'gallery' ? { order: 1 } : (parts[0] === 'projects' || parts[0] === 'villages') ? { created_at: -1 } : { date: -1 }
        const list = await col.find(filter).sort(sortField).limit(500).toArray()
        return json(clean(list))
      }
      if (method === 'GET' && parts.length === 2) {
        const r = await col.findOne({ $or: [{ id: parts[1] }, { slug: parts[1] }] })
        if (!r) return json({ error: 'Not found' }, 404)
        return json(clean(r))
      }
    }

    // ---- Admin generic CRUD: /admin/:type[/:id] ----
    if (parts[0] === 'admin' && TYPE_COLLECTION[parts[1]]) {
      const auth = getAuth(request)
      if (!auth || !auth.role.includes('Admin')) return json({ error: 'Unauthorized' }, 403)
      const col = db.collection(TYPE_COLLECTION[parts[1]])
      const now = new Date()
      if (method === 'POST' && parts.length === 2) {
        const b = await request.json()
        delete b._id
        const doc = { id: uuidv4(), ...b, created_at: now, updated_at: now }
        for (const k of ['date', 'start_date', 'expected_completion', 'actual_completion']) if (doc[k]) doc[k] = new Date(doc[k])
        await col.insertOne(doc)
        return json(clean(doc))
      }
      if (method === 'PUT' && parts.length === 3) {
        const b = await request.json()
        delete b._id; delete b.id
        for (const k of ['date', 'start_date', 'expected_completion', 'actual_completion']) if (b[k]) b[k] = new Date(b[k])
        b.updated_at = now
        await col.updateOne({ id: parts[2] }, { $set: b })
        const r = await col.findOne({ id: parts[2] })
        return json(clean(r))
      }
      if (method === 'DELETE' && parts.length === 3) {
        await col.deleteOne({ id: parts[2] })
        return json({ success: true })
      }
    }

    return json({ error: `Route ${route} not found` }, 404)
  } catch (error) {
    console.error('API Error:', error)
    return json({ error: 'Internal server error', detail: String(error?.message || error) }, 500)
  }
}

export const GET = handleRoute
export const POST = handleRoute
export const PUT = handleRoute
export const DELETE = handleRoute
export const PATCH = handleRoute
