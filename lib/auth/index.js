import crypto from 'crypto'

const DEFAULT_SECRET = 'vsh-mla-dev-insecure-secret-do-not-use-in-production'
const NODE_ENV = process.env.NODE_ENV || 'development'
export const IS_PRODUCTION = NODE_ENV === 'production'

const AUTH_SECRET_ENV = process.env.AUTH_SECRET || ''
export const AUTH_SECRET = (IS_PRODUCTION && !AUTH_SECRET_ENV) ? null : (AUTH_SECRET_ENV || DEFAULT_SECRET)

if (IS_PRODUCTION && (!AUTH_SECRET || AUTH_SECRET === DEFAULT_SECRET)) {
  console.warn(
    '\n' + '='.repeat(72) + '\n' +
    '  SECURITY WARNING: AUTH_SECRET is not set or uses the default value.\n' +
    '  Set AUTH_SECRET to a long random string in production environment.\n' +
    '  Generate one with: node -e "console.log(crypto.randomBytes(64).toString(\'hex\'))"\n' +
    '='.repeat(72) + '\n'
  )
  if (AUTH_SECRET === DEFAULT_SECRET) {
    throw new Error('Insecure AUTH_SECRET detected in production. Refusing to start.')
  }
}

const PASSWORD_SCRYPT_N = IS_PRODUCTION ? 262144 : 32768
const PASSWORD_SCRYPT_R = 8
const PASSWORD_SCRYPT_P = 1
const PASSWORD_KEYLEN = 64
const PASSWORD_SALTLEN = 16

export function hashPassword(pw) {
  if (typeof pw !== 'string') throw new Error('Password must be a string')
  if (pw.length < 6) throw new Error('Password too short')
  const salt = crypto.randomBytes(PASSWORD_SALTLEN).toString('hex')
  const h = crypto.scryptSync(pw, salt, PASSWORD_KEYLEN, {
    N: PASSWORD_SCRYPT_N, r: PASSWORD_SCRYPT_R, p: PASSWORD_SCRYPT_P,
    maxmem: 128 * PASSWORD_SCRYPT_N * PASSWORD_SCRYPT_R * 2,
  }).toString('hex')
  return `${PASSWORD_SCRYPT_N}$${PASSWORD_SCRYPT_R}$${PASSWORD_SCRYPT_P}$${salt}$${h}`
}

export function verifyPassword(pw, stored) {
  try {
    if (typeof pw !== 'string' || typeof stored !== 'string') return false
    // Support legacy format salt:hash for any already-seeded accounts
    if (!stored.includes('$') && stored.includes(':')) {
      const [salt, h] = stored.split(':')
      const hh = crypto.scryptSync(pw, salt, 64).toString('hex')
      return crypto.timingSafeEqual(Buffer.from(h, 'hex'), Buffer.from(hh, 'hex'))
    }
    const parts = stored.split('$')
    if (parts.length !== 5) return false
    const [nStr, rStr, pStr, salt, h] = parts
    const N = parseInt(nStr, 10)
    const r = parseInt(rStr, 10)
    const p = parseInt(pStr, 10)
    const maxmem = 128 * N * r * 2
    const hh = crypto.scryptSync(pw, salt, PASSWORD_KEYLEN, { N, r, p, maxmem }).toString('hex')
    return crypto.timingSafeEqual(Buffer.from(h, 'hex'), Buffer.from(hh, 'hex'))
  } catch { return false }
}

const TOKEN_TTL_MS = IS_PRODUCTION
  ? (parseInt(process.env.AUTH_TOKEN_TTL_HOURS || '24', 10)) * 60 * 60 * 1000
  : 7 * 24 * 60 * 60 * 1000

export function signToken(payload) {
  if (!AUTH_SECRET) throw new Error('AUTH_SECRET not configured')
  const exp = Date.now() + TOKEN_TTL_MS
  const body = Buffer.from(JSON.stringify({ ...payload, exp, iat: Date.now() })).toString('base64url')
  const sig = crypto.createHmac('sha256', AUTH_SECRET).update(body).digest('base64url')
  return `${body}.${sig}`
}

export function verifyToken(token) {
  try {
    if (!AUTH_SECRET || typeof token !== 'string') return null
    const dot = token.indexOf('.')
    if (dot === -1) return null
    const body = token.slice(0, dot)
    const sig = token.slice(dot + 1)
    const expect = crypto.createHmac('sha256', AUTH_SECRET).update(body).digest('base64url')
    if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expect))) return null
    const data = JSON.parse(Buffer.from(body, 'base64url').toString())
    if (!data.exp || data.exp < Date.now()) return null
    return data
  } catch { return null }
}

export function getAuth(request) {
  try {
    const header = request.headers.get('authorization') || ''
    const token = header.startsWith('Bearer ') ? header.slice(7) : null
    if (!token) return null
    return verifyToken(token)
  } catch { return null }
}

export function parseCorsOrigins(envVal) {
  if (!envVal) return null
  return envVal.split(',').map(s => s.trim()).filter(Boolean)
}

export function applySecurityHeaders(headers) {
  const defaults = {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': IS_PRODUCTION ? 'SAMEORIGIN' : 'ALLOWALL',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=(), interest-cohort=()',
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
    'X-XSS-Protection': '1; mode=block',
  }
  for (const [k, v] of Object.entries(defaults)) {
    try { headers.set(k, v) } catch {}
  }
  return headers
}
