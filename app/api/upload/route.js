import { NextResponse } from 'next/server'
import { writeFile, mkdir, readFile, stat } from 'fs/promises'
import { existsSync } from 'fs'
import path from 'path'
import { v4 as uuidv4 } from 'uuid'
import { getAuth, applySecurityHeaders, parseCorsOrigins } from '@/lib/auth'

const IS_PROD = process.env.NODE_ENV === 'production'
const MAX_UPLOAD_BYTES = parseInt(process.env.UPLOAD_MAX_BYTES || (5 * 1024 * 1024).toString(), 10)
const ALLOWED_EXT = new Set(['jpg', 'jpeg', 'png', 'webp'])
const ALLOWED_MIME = new Set(['image/jpeg', 'image/png', 'image/webp'])

const ALLOWED_ORIGINS = parseCorsOrigins(process.env.CORS_ORIGINS)
function resolveCorsOrigin(request) {
  const origin = request.headers.get('origin')
  if (!ALLOWED_ORIGINS) return origin || '*'
  if (!origin) return ALLOWED_ORIGINS[0]
  if (ALLOWED_ORIGINS.includes(origin)) return origin
  return null
}
function addCors(response, request) {
  const origin = resolveCorsOrigin(request)
  if (origin) response.headers.set('Access-Control-Allow-Origin', origin)
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  response.headers.set('Access-Control-Allow-Credentials', 'true')
  response.headers.set('Access-Control-Max-Age', '86400')
  applySecurityHeaders(response.headers)
  return response
}

export async function OPTIONS(request) {
  const origin = resolveCorsOrigin(request)
  if (origin === null) return new NextResponse(null, { status: 403 })
  return addCors(new NextResponse(null, { status: 204 }), request)
}

const MAGIC_SIGNATURES = [
  { ext: 'jpg', bytes: [0xFF, 0xD8, 0xFF] },
  { ext: 'jpeg', bytes: [0xFF, 0xD8, 0xFF] },
  { ext: 'png', bytes: [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A] },
  { ext: 'webp', bytes: [0x52, 0x49, 0x46, 0x46], suffix: [0x57, 0x45, 0x42, 0x50] },
]

function detectMagic(buffer) {
  for (const sig of MAGIC_SIGNATURES) {
    const headOk = sig.bytes.every((b, i) => buffer[i] === b)
    if (headOk) {
      if (sig.suffix) {
        const suffixOk = sig.suffix.every((b, i) => buffer[8 + i] === b)
        if (suffixOk) return sig.ext
      } else {
        return sig.ext
      }
    }
  }
  return null
}

export async function POST(request) {
  const auth = getAuth(request)
  if (!auth || !auth.role.includes('Admin')) {
    return addCors(NextResponse.json({ error: 'Unauthorized' }, { status: 403 }), request)
  }

  try {
    const formData = await request.formData()
    const file = formData.get('file')
    if (!file || typeof file.arrayBuffer !== 'function') {
      return addCors(NextResponse.json({ error: 'No file uploaded' }, { status: 400 }), request)
    }

    const bytes = await file.arrayBuffer()
    if (bytes.byteLength === 0) {
      return addCors(NextResponse.json({ error: 'Empty file' }, { status: 400 }), request)
    }
    if (bytes.byteLength > MAX_UPLOAD_BYTES) {
      const maxMb = (MAX_UPLOAD_BYTES / 1024 / 1024).toFixed(1)
      return addCors(NextResponse.json({ error: `File size must be less than ${maxMb}MB` }, { status: 400 }), request)
    }

    if (!ALLOWED_MIME.has(file.type || '')) {
      return addCors(NextResponse.json({ error: 'Unsupported file type. Only JPG, PNG, WEBP allowed' }, { status: 400 }), request)
    }

    const buffer = Buffer.from(bytes)
    const detected = detectMagic(buffer)
    if (!detected || !ALLOWED_EXT.has(detected)) {
      return addCors(NextResponse.json({ error: 'File content does not match its type. Only JPG, PNG, WEBP allowed.' }, { status: 400 }), request)
    }

    let originalExt = (file.name || '').split('.').pop()?.toLowerCase() || detected
    if (!ALLOWED_EXT.has(originalExt)) originalExt = detected
    const fileName = `${uuidv4()}.${originalExt}`

    if (!/^[a-zA-Z0-9-]+\.[a-z]+$/.test(fileName)) {
      return addCors(NextResponse.json({ error: 'Invalid filename' }, { status: 400 }), request)
    }

    const cwd = process.cwd()
    const uploadDir = path.resolve(cwd, 'public', 'uploads')
    const resolvedUploadDir = path.resolve(uploadDir)
    const publicDirRoot = path.resolve(cwd, 'public')
    if (!resolvedUploadDir.startsWith(publicDirRoot)) {
      return addCors(NextResponse.json({ error: 'Invalid upload directory' }, { status: 500 }), request)
    }
    const destPath = path.resolve(resolvedUploadDir, fileName)
    if (!destPath.startsWith(resolvedUploadDir + path.sep)) {
      return addCors(NextResponse.json({ error: 'Path traversal detected' }, { status: 400 }), request)
    }

    if (!existsSync(resolvedUploadDir)) {
      try { await mkdir(resolvedUploadDir, { recursive: true, mode: 0o755 }) } catch (e) {}
    }
    await writeFile(destPath, buffer, { flag: 'wx', mode: 0o644 })

    try {
      const written = await readFile(destPath)
      if (!written || written.length !== buffer.length) {
        return addCors(NextResponse.json({ error: 'File write verification failed' }, { status: 500 }), request)
      }
    } catch (e) {
      return addCors(NextResponse.json({ error: 'File write verification failed' }, { status: 500 }), request)
    }

    try {
      const info = await stat(destPath)
      if (info.size > MAX_UPLOAD_BYTES) {
        return addCors(NextResponse.json({ error: 'Uploaded file too large' }, { status: 400 }), request)
      }
    } catch (e) {}

    const res = NextResponse.json({ url: `/uploads/${fileName}`, type: detected, size: bytes.byteLength })
    return addCors(res, request)
  } catch (error) {
    const detail = IS_PROD ? undefined : error?.message || String(error)
    const body = IS_PROD ? { error: 'Upload failed' } : { error: 'Upload failed', details: detail }
    return addCors(NextResponse.json(body, { status: 500 }), request)
  }
}
