import { v4 as uuidv4 } from 'uuid'

const ALLOWED_TABLES = new Set([
  'site_settings', 'projects', 'news', 'events', 'schemes', 'gallery',
  'documents', 'villages', 'admin_users', 'users', 'citizen_requests',
  'contact_messages',
])

function assertTable(name) {
  if (!ALLOWED_TABLES.has(name)) {
    throw new Error(`Access denied: unknown table "${name}"`)
  }
  return name
}

let pgPool = null
let inMemoryDb = null
let dbPromise = null
let poolPromise = null
const NODE_ENV = process.env.NODE_ENV || 'development'
const IS_PRODUCTION = NODE_ENV === 'production'

if (IS_PRODUCTION && !process.env.DATABASE_URL && !(process.env.PGUSER && process.env.PGPASSWORD && process.env.PGDATABASE)) {
  console.warn(
    '\n' + '='.repeat(72) + '\n' +
    '  SECURITY WARNING: No PostgreSQL credentials configured in production.\n' +
    '  The app will fall back to an in-memory database, which will lose data\n' +
    '  on every restart. Set DATABASE_URL or PGUSER/PGPASSWORD/PGDATABASE.\n' +
    '='.repeat(72) + '\n'
  )
}

function matchesQuery(doc, query = {}) {
  if (!query || Object.keys(query).length === 0) return true
  for (const [key, val] of Object.entries(query)) {
    if (key === '$or') {
      if (!val.some(subQ => matchesQuery(doc, subQ))) return false
      continue
    }
    const docVal = doc[key]
    if (val instanceof RegExp) {
      if (!val.test(String(docVal || ''))) return false
    } else if (val && typeof val === 'object' && val.$nin) {
      if (val.$nin.includes(docVal)) return false
    } else if (docVal !== val) {
      return false
    }
  }
  return true
}

function applyUpdate(doc, update = {}) {
  if (update.$set) Object.assign(doc, update.$set)
  if (update.$push) {
    for (const [k, v] of Object.entries(update.$push)) {
      if (!Array.isArray(doc[k])) doc[k] = []
      doc[k].push(v)
    }
  }
}

function sortDocs(docs, sortObj) {
  if (!sortObj) return docs
  const [field, dir] = Object.entries(sortObj)[0] || []
  if (!field) return docs
  return [...docs].sort((a, b) => {
    let valA = a[field]
    let valB = b[field]
    if (valA instanceof Date) valA = valA.getTime()
    if (valB instanceof Date) valB = valB.getTime()
    if (valA < valB) return dir === -1 ? 1 : -1
    if (valA > valB) return dir === -1 ? -1 : 1
    return 0
  })
}

function createInMemoryDb() {
  const store = {}
  const getCol = (name) => {
    if (!store[name]) store[name] = []
    const data = store[name]
    return {
      async findOne(query) {
        return data.find(doc => matchesQuery(doc, query)) || null
      },
      find(query) {
        let res = data.filter(doc => matchesQuery(doc, query))
        return {
          sort(sortObj) {
            res = sortDocs(res, sortObj)
            return this
          },
          limit(n) {
            res = res.slice(0, n)
            return this
          },
          async toArray() {
            return res
          }
        }
      },
      async insertOne(doc) {
        data.push(doc)
        return { insertedId: doc.id || doc._id }
      },
      async insertMany(docs) {
        data.push(...docs)
        return { insertedCount: docs.length }
      },
      async updateOne(query, update, options = {}) {
        let target = data.find(doc => matchesQuery(doc, query))
        if (!target && options.upsert) {
          target = { ...query }
          data.push(target)
        }
        if (target) {
          applyUpdate(target, update)
        }
        return { modifiedCount: target ? 1 : 0 }
      },
      async deleteOne(query) {
        const idx = data.findIndex(doc => matchesQuery(doc, query))
        if (idx !== -1) data.splice(idx, 1)
        return { deletedCount: idx !== -1 ? 1 : 0 }
      },
      async countDocuments(query = {}) {
        return data.filter(doc => matchesQuery(doc, query)).length
      }
    }
  }
  return { collection: getCol }
}

const JSON_COLUMNS = {
  site_settings: ['social', 'stats', 'about_sections', 'constituency_stats'],
  projects: ['images', 'updates'],
  news: [],
  events: [],
  schemes: [],
  gallery: [],
  documents: [],
  villages: [],
  admin_users: [],
  users: [],
  citizen_requests: ['internal_notes', 'updates'],
  contact_messages: [],
}

const DATE_COLUMNS = {
  site_settings: ['updated_at'],
  projects: ['start_date', 'expected_completion', 'actual_completion', 'created_at', 'updated_at'],
  news: ['date', 'created_at', 'updated_at'],
  events: ['date', 'created_at', 'updated_at'],
  schemes: ['created_at', 'updated_at'],
  gallery: ['date', 'created_at', 'updated_at'],
  documents: ['date', 'created_at', 'updated_at'],
  villages: ['created_at', 'updated_at'],
  admin_users: ['created_at'],
  users: ['created_at'],
  citizen_requests: ['created_at', 'updated_at'],
  contact_messages: ['created_at'],
}

const BOOL_COLUMNS = {
  projects: ['featured'],
  news: ['featured'],
}

const INT_COLUMNS = {
  projects: ['progress', 'year'],
  villages: ['population', 'projects_count'],
  gallery: ['order'],
}

const NUMERIC_COLUMNS = {
  projects: ['sanctioned_amount', 'estimated_amount'],
}

function serializeValue(table, col, val) {
  if (val === undefined || val === null) return null
  if (JSON_COLUMNS[table]?.includes(col)) {
    return JSON.stringify(val)
  }
  if (DATE_COLUMNS[table]?.includes(col) && val instanceof Date) {
    return val.toISOString()
  }
  return val
}

function deserializeRow(table, row) {
  if (!row) return null
  const out = { ...row }
  for (const col of JSON_COLUMNS[table] || []) {
    if (out[col] !== null && out[col] !== undefined) {
      if (typeof out[col] === 'string') {
        try { out[col] = JSON.parse(out[col]) } catch (e) {}
      }
    }
  }
  for (const col of DATE_COLUMNS[table] || []) {
    if (out[col] && typeof out[col] === 'string') {
      out[col] = new Date(out[col])
    }
  }
  for (const col of BOOL_COLUMNS[table] || []) {
    if (out[col] !== undefined && out[col] !== null) {
      out[col] = !!out[col]
    }
  }
  for (const col of INT_COLUMNS[table] || []) {
    if (out[col] !== undefined && out[col] !== null) {
      out[col] = parseInt(out[col], 10)
    }
  }
  for (const col of NUMERIC_COLUMNS[table] || []) {
    if (out[col] !== undefined && out[col] !== null) {
      out[col] = parseFloat(out[col])
    }
  }
  return out
}

function deserializeRows(table, rows) {
  return rows.map(r => deserializeRow(table, r))
}

function buildWhere(table, query, startIdx = 1) {
  const clauses = []
  const params = []
  let idx = startIdx
  if (!query || Object.keys(query).length === 0) {
    return { clauses: ['TRUE'], params, idx }
  }
  for (const [key, val] of Object.entries(query)) {
    if (key === '$or') {
      const orParts = []
      for (const subQ of val) {
        const sub = buildWhere(table, subQ, idx)
        orParts.push(`(${sub.clauses.join(' AND ')})`)
        params.push(...sub.params)
        idx = sub.idx
      }
      clauses.push(`(${orParts.join(' OR ')})`)
      continue
    }
    const isJson = JSON_COLUMNS[table]?.includes(key)
    if (val instanceof RegExp) {
      const pattern = val.source
      const flags = val.flags
      if (flags.includes('i')) {
        clauses.push(`${key} ILIKE $${idx}`)
      } else {
        clauses.push(`${key} LIKE $${idx}`)
      }
      params.push(`%${pattern}%`)
      idx++
    } else if (val && typeof val === 'object' && val.$nin) {
      const placeholders = val.$nin.map((_, i) => `$${idx + i}`).join(', ')
      clauses.push(`${key} NOT IN (${placeholders})`)
      params.push(...val.$nin)
      idx += val.$nin.length
    } else if (isJson && val && typeof val === 'object') {
      clauses.push(`${key}::jsonb @> $${idx}::jsonb`)
      params.push(JSON.stringify(val))
      idx++
    } else {
      clauses.push(`${key} = $${idx}`)
      params.push(serializeValue(table, key, val))
      idx++
    }
  }
  return { clauses, params, idx }
}

const IDENTIFIER_RE = /^[A-Za-z_][A-Za-z0-9_]*$/
const SAFE_SORT_FIELDS = new Set([
  'id', 'slug', 'title', 'name', 'date', 'start_date', 'created_at', 'updated_at',
  'status', 'year', 'order', 'tracking_id',
])

function assertIdentifier(name, forSort = false) {
  if (!IDENTIFIER_RE.test(name)) {
    throw new Error(`Invalid identifier: "${name}"`)
  }
  if (forSort && !SAFE_SORT_FIELDS.has(name)) {
    throw new Error(`Sorting by "${name}" is not allowed`)
  }
  return `"${name}"`
}

function buildOrderBy(sortObj) {
  if (!sortObj) return ''
  const [field, dir] = Object.entries(sortObj)[0] || []
  if (!field) return ''
  const safeField = assertIdentifier(field === 'order' ? 'order' : field, true)
  const safeDir = dir === -1 || String(dir).toUpperCase() === 'DESC' ? 'DESC' : 'ASC'
  return ` ORDER BY ${safeField} ${safeDir}`
}

function getPgPool() {
  if (poolPromise) return poolPromise
  poolPromise = (async () => {
    try {
      const { Pool } = await import('pg')
      const connectionString = process.env.DATABASE_URL ||
        `postgresql://${process.env.PGUSER || 'postgres'}:${process.env.PGPASSWORD || 'postgres'}@${process.env.PGHOST || '127.0.0.1'}:${process.env.PGPORT || '5432'}/${process.env.PGDATABASE || 'khanapur_mla'}`

      const sslMode = process.env.PGSSLMODE || (IS_PRODUCTION ? 'require' : 'disable')
      const poolConfig = {
        connectionString,
        max: parseInt(process.env.PG_MAX_CONNECTIONS || '10', 10),
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 5000,
      }
      if (sslMode && sslMode !== 'disable') {
        poolConfig.ssl = sslMode === 'no-verify'
          ? { rejectUnauthorized: false }
          : { rejectUnauthorized: sslMode !== 'require' ? false : !(process.env.PG_SSL_NO_VERIFY === '1' || process.env.PGSSLROOTCERT === '') }
      }
      if (process.env.PG_SSL_NO_VERIFY === '1' && poolConfig.ssl) {
        poolConfig.ssl = { ...poolConfig.ssl, rejectUnauthorized: false }
      }
      const pool = new Pool(poolConfig)
      pgPool = pool
      return pool
    } catch (e) {
      console.warn('PostgreSQL driver load failed:', e?.message || e)
      return null
    }
  })()
  return poolPromise
}

async function createTables(pool) {
  const schema = `
    CREATE TABLE IF NOT EXISTS site_settings (
      id TEXT PRIMARY KEY,
      mla_name TEXT,
      designation TEXT,
      constituency TEXT,
      party TEXT,
      photo_url TEXT,
      hero_message TEXT,
      official_quote TEXT,
      office_address TEXT,
      office_phone TEXT,
      office_email TEXT,
      office_hours TEXT,
      social JSONB DEFAULT '{}'::jsonb,
      stats JSONB DEFAULT '[]'::jsonb,
      about_sections JSONB DEFAULT '[]'::jsonb,
      biography TEXT,
      constituency_desc TEXT,
      constituency_map TEXT,
      constituency_stats JSONB DEFAULT '[]'::jsonb,
      updated_at TIMESTAMPTZ
    );

    CREATE TABLE IF NOT EXISTS projects (
      id TEXT PRIMARY KEY,
      title TEXT,
      description TEXT,
      location TEXT,
      village TEXT,
      gram_panchayat TEXT,
      department TEXT,
      category TEXT,
      sanctioned_amount NUMERIC,
      estimated_amount NUMERIC,
      start_date DATE,
      expected_completion DATE,
      actual_completion DATE,
      status TEXT,
      progress INTEGER,
      year INTEGER,
      image TEXT,
      images JSONB DEFAULT '[]'::jsonb,
      featured BOOLEAN DEFAULT FALSE,
      updates JSONB DEFAULT '[]'::jsonb,
      created_at TIMESTAMPTZ,
      updated_at TIMESTAMPTZ
    );

    CREATE TABLE IF NOT EXISTS news (
      id TEXT PRIMARY KEY,
      slug TEXT,
      title TEXT,
      excerpt TEXT,
      content TEXT,
      category TEXT,
      cover_image TEXT,
      author TEXT,
      featured BOOLEAN DEFAULT FALSE,
      date TIMESTAMPTZ,
      created_at TIMESTAMPTZ,
      updated_at TIMESTAMPTZ
    );

    CREATE TABLE IF NOT EXISTS events (
      id TEXT PRIMARY KEY,
      title TEXT,
      category TEXT,
      date TIMESTAMPTZ,
      location TEXT,
      description TEXT,
      image TEXT,
      created_at TIMESTAMPTZ,
      updated_at TIMESTAMPTZ
    );

    CREATE TABLE IF NOT EXISTS schemes (
      id TEXT PRIMARY KEY,
      name TEXT,
      scope TEXT,
      department TEXT,
      description TEXT,
      eligibility TEXT,
      benefits TEXT,
      documents_required TEXT,
      application_process TEXT,
      official_link TEXT,
      created_at TIMESTAMPTZ,
      updated_at TIMESTAMPTZ
    );

    CREATE TABLE IF NOT EXISTS gallery (
      id TEXT PRIMARY KEY,
      title TEXT,
      category TEXT,
      image TEXT,
      date TIMESTAMPTZ,
      "order" INTEGER DEFAULT 0,
      created_at TIMESTAMPTZ,
      updated_at TIMESTAMPTZ
    );

    CREATE TABLE IF NOT EXISTS documents (
      id TEXT PRIMARY KEY,
      title TEXT,
      category TEXT,
      description TEXT,
      file_url TEXT,
      file_size TEXT,
      date TIMESTAMPTZ,
      created_at TIMESTAMPTZ,
      updated_at TIMESTAMPTZ
    );

    CREATE TABLE IF NOT EXISTS villages (
      id TEXT PRIMARY KEY,
      name TEXT,
      gram_panchayat TEXT,
      taluk TEXT,
      population INTEGER,
      status TEXT,
      projects_count INTEGER,
      created_at TIMESTAMPTZ,
      updated_at TIMESTAMPTZ
    );

    CREATE TABLE IF NOT EXISTS admin_users (
      id TEXT PRIMARY KEY,
      name TEXT,
      email TEXT,
      password TEXT,
      role TEXT,
      created_at TIMESTAMPTZ
    );

    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT,
      email TEXT,
      mobile TEXT,
      password TEXT,
      role TEXT,
      created_at TIMESTAMPTZ
    );

    CREATE TABLE IF NOT EXISTS citizen_requests (
      id TEXT PRIMARY KEY,
      tracking_id TEXT UNIQUE,
      type TEXT,
      name TEXT,
      mobile TEXT,
      email TEXT,
      user_id TEXT,
      user_email TEXT,
      address TEXT,
      village TEXT,
      gram_panchayat TEXT,
      category TEXT,
      description TEXT,
      attachment TEXT,
      status TEXT,
      assigned_to TEXT,
      internal_notes JSONB DEFAULT '[]'::jsonb,
      updates JSONB DEFAULT '[]'::jsonb,
      created_at TIMESTAMPTZ,
      updated_at TIMESTAMPTZ
    );

    CREATE TABLE IF NOT EXISTS contact_messages (
      id TEXT PRIMARY KEY,
      name TEXT,
      mobile TEXT,
      email TEXT,
      message TEXT,
      created_at TIMESTAMPTZ
    );

    CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
    CREATE INDEX IF NOT EXISTS idx_projects_village ON projects(village);
    CREATE INDEX IF NOT EXISTS idx_projects_year ON projects(year);
    CREATE INDEX IF NOT EXISTS idx_news_slug ON news(slug);
    CREATE INDEX IF NOT EXISTS idx_events_date ON events(date);
    CREATE INDEX IF NOT EXISTS idx_requests_status ON citizen_requests(status);
    CREATE INDEX IF NOT EXISTS idx_requests_tracking ON citizen_requests(tracking_id);
    CREATE INDEX IF NOT EXISTS idx_requests_created ON citizen_requests(created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_gallery_order ON gallery("order");

    ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS about_sections JSONB, ADD COLUMN IF NOT EXISTS constituency_desc TEXT, ADD COLUMN IF NOT EXISTS constituency_map TEXT, ADD COLUMN IF NOT EXISTS constituency_stats JSONB,
                              ADD COLUMN IF NOT EXISTS hero_message_kn TEXT, ADD COLUMN IF NOT EXISTS hero_message_mr TEXT, ADD COLUMN IF NOT EXISTS hero_message_hi TEXT,
                              ADD COLUMN IF NOT EXISTS official_quote_kn TEXT, ADD COLUMN IF NOT EXISTS official_quote_mr TEXT, ADD COLUMN IF NOT EXISTS official_quote_hi TEXT,
                              ADD COLUMN IF NOT EXISTS biography TEXT, ADD COLUMN IF NOT EXISTS biography_kn TEXT, ADD COLUMN IF NOT EXISTS biography_mr TEXT, ADD COLUMN IF NOT EXISTS biography_hi TEXT,
                              ADD COLUMN IF NOT EXISTS office_address_kn TEXT, ADD COLUMN IF NOT EXISTS office_address_mr TEXT, ADD COLUMN IF NOT EXISTS office_address_hi TEXT,
                              ADD COLUMN IF NOT EXISTS office_hours_kn TEXT, ADD COLUMN IF NOT EXISTS office_hours_mr TEXT, ADD COLUMN IF NOT EXISTS office_hours_hi TEXT,
                              ADD COLUMN IF NOT EXISTS constituency_desc_kn TEXT, ADD COLUMN IF NOT EXISTS constituency_desc_mr TEXT, ADD COLUMN IF NOT EXISTS constituency_desc_hi TEXT;

    ALTER TABLE projects ADD COLUMN IF NOT EXISTS title_kn TEXT, ADD COLUMN IF NOT EXISTS title_mr TEXT, ADD COLUMN IF NOT EXISTS title_hi TEXT,
                         ADD COLUMN IF NOT EXISTS description_kn TEXT, ADD COLUMN IF NOT EXISTS description_mr TEXT, ADD COLUMN IF NOT EXISTS description_hi TEXT,
                         ADD COLUMN IF NOT EXISTS location_kn TEXT, ADD COLUMN IF NOT EXISTS location_mr TEXT, ADD COLUMN IF NOT EXISTS location_hi TEXT,
                         ADD COLUMN IF NOT EXISTS village_kn TEXT, ADD COLUMN IF NOT EXISTS village_mr TEXT, ADD COLUMN IF NOT EXISTS village_hi TEXT,
                         ADD COLUMN IF NOT EXISTS gram_panchayat_kn TEXT, ADD COLUMN IF NOT EXISTS gram_panchayat_mr TEXT, ADD COLUMN IF NOT EXISTS gram_panchayat_hi TEXT;

    ALTER TABLE news ADD COLUMN IF NOT EXISTS title_kn TEXT, ADD COLUMN IF NOT EXISTS title_mr TEXT, ADD COLUMN IF NOT EXISTS title_hi TEXT,
                     ADD COLUMN IF NOT EXISTS excerpt_kn TEXT, ADD COLUMN IF NOT EXISTS excerpt_mr TEXT, ADD COLUMN IF NOT EXISTS excerpt_hi TEXT,
                     ADD COLUMN IF NOT EXISTS content_kn TEXT, ADD COLUMN IF NOT EXISTS content_mr TEXT, ADD COLUMN IF NOT EXISTS content_hi TEXT;

    ALTER TABLE events ADD COLUMN IF NOT EXISTS title_kn TEXT, ADD COLUMN IF NOT EXISTS title_mr TEXT, ADD COLUMN IF NOT EXISTS title_hi TEXT,
                       ADD COLUMN IF NOT EXISTS location_kn TEXT, ADD COLUMN IF NOT EXISTS location_mr TEXT, ADD COLUMN IF NOT EXISTS location_hi TEXT,
                       ADD COLUMN IF NOT EXISTS description_kn TEXT, ADD COLUMN IF NOT EXISTS description_mr TEXT, ADD COLUMN IF NOT EXISTS description_hi TEXT;

    ALTER TABLE schemes ADD COLUMN IF NOT EXISTS name_kn TEXT, ADD COLUMN IF NOT EXISTS name_mr TEXT, ADD COLUMN IF NOT EXISTS name_hi TEXT,
                        ADD COLUMN IF NOT EXISTS description_kn TEXT, ADD COLUMN IF NOT EXISTS description_mr TEXT, ADD COLUMN IF NOT EXISTS description_hi TEXT,
                        ADD COLUMN IF NOT EXISTS eligibility_kn TEXT, ADD COLUMN IF NOT EXISTS eligibility_mr TEXT, ADD COLUMN IF NOT EXISTS eligibility_hi TEXT,
                        ADD COLUMN IF NOT EXISTS benefits_kn TEXT, ADD COLUMN IF NOT EXISTS benefits_mr TEXT, ADD COLUMN IF NOT EXISTS benefits_hi TEXT,
                        ADD COLUMN IF NOT EXISTS documents_required_kn TEXT, ADD COLUMN IF NOT EXISTS documents_required_mr TEXT, ADD COLUMN IF NOT EXISTS documents_required_hi TEXT;

    ALTER TABLE gallery ADD COLUMN IF NOT EXISTS title_kn TEXT, ADD COLUMN IF NOT EXISTS title_mr TEXT, ADD COLUMN IF NOT EXISTS title_hi TEXT;

    ALTER TABLE documents ADD COLUMN IF NOT EXISTS title_kn TEXT, ADD COLUMN IF NOT EXISTS title_mr TEXT, ADD COLUMN IF NOT EXISTS title_hi TEXT,
                          ADD COLUMN IF NOT EXISTS description_kn TEXT, ADD COLUMN IF NOT EXISTS description_mr TEXT, ADD COLUMN IF NOT EXISTS description_hi TEXT;
  `
  await pool.query(schema)
}

function createPostgresDb(pool) {
  const collection = (tableName) => {
    const table = assertTable(tableName)
    return {
      async findOne(query) {
        const { clauses, params } = buildWhere(table, query)
        const sql = `SELECT * FROM ${table} WHERE ${clauses.join(' AND ')} LIMIT 1`
        const res = await pool.query(sql, params)
        return deserializeRow(table, res.rows[0] || null)
      },
      find(query) {
        const { clauses, params } = buildWhere(table, query)
        let sortObj = null
        let limitN = null
        return {
          sort(s) { sortObj = s; return this },
          limit(n) { limitN = n; return this },
          async toArray() {
            let sql = `SELECT * FROM ${table} WHERE ${clauses.join(' AND ')}`
            sql += buildOrderBy(sortObj)
            let finalParams = [...params]
            if (limitN !== null) {
              finalParams.push(limitN)
              sql += ` LIMIT $${finalParams.length}`
            }
            const res = await pool.query(sql, finalParams)
            return deserializeRows(table, res.rows)
          }
        }
      },
      async insertOne(doc) {
        const docToInsert = { id: doc.id || uuidv4(), ...doc }
        const keys = Object.keys(docToInsert)
        const placeholders = keys.map((_, i) => `$${i + 1}`).join(', ')
        const values = keys.map(k => serializeValue(table, k, docToInsert[k]))
        const sql = `INSERT INTO ${table} (${keys.join(', ')}) VALUES (${placeholders})`
        await pool.query(sql, values)
        return { insertedId: docToInsert.id }
      },
      async insertMany(docs) {
        if (!docs.length) return { insertedCount: 0 }
        const docsToInsert = docs.map(d => ({ id: d.id || uuidv4(), ...d }))
        const keys = Object.keys(docsToInsert[0])
        const rowsSql = []
        const values = []
        let idx = 1
        for (const doc of docsToInsert) {
          const placeholders = keys.map((_, i) => `$${idx + i}`).join(', ')
          rowsSql.push(`(${placeholders})`)
          values.push(...keys.map(k => serializeValue(table, k, doc[k])))
          idx += keys.length
        }
        const sql = `INSERT INTO ${table} (${keys.join(', ')}) VALUES ${rowsSql.join(', ')}`
        await pool.query(sql, values)
        return { insertedCount: docsToInsert.length }
      },
      async updateOne(query, update, options = {}) {
        const existing = await this.findOne(query)
        if (!existing) {
          if (options.upsert) {
            const newDoc = { ...query }
            applyUpdate(newDoc, update)
            await this.insertOne(newDoc)
            return { modifiedCount: 1 }
          }
          return { modifiedCount: 0 }
        }
        if (update.$set) {
          const { clauses, params } = buildWhere(table, query)
          const setClauses = []
          let idx = params.length + 1
          for (const [k, v] of Object.entries(update.$set)) {
            if (JSON_COLUMNS[table]?.includes(k)) {
              setClauses.push(`${k} = $${idx}::jsonb`)
              params.push(JSON.stringify(serializeValue(table, k, v)))
            } else {
              setClauses.push(`${k} = $${idx}`)
              params.push(serializeValue(table, k, v))
            }
            idx++
          }
          if (setClauses.length) {
            const sql = `UPDATE ${table} SET ${setClauses.join(', ')} WHERE ${clauses.join(' AND ')}`
            await pool.query(sql, params)
          }
        }
        if (update.$push) {
          for (const [k, v] of Object.entries(update.$push)) {
            const curDoc = await this.findOne(query)
            if (curDoc) {
              const curArr = Array.isArray(curDoc[k]) ? [...curDoc[k]] : []
              curArr.push(v)
              const { clauses, params } = buildWhere(table, query)
              params.push(JSON.stringify(serializeValue(table, k, curArr)))
              const sql = `UPDATE ${table} SET ${k} = $${params.length}::jsonb WHERE ${clauses.join(' AND ')}`
              await pool.query(sql, params)
            }
          }
        }
        return { modifiedCount: 1 }
      },
      async deleteOne(query) {
        const { clauses, params } = buildWhere(table, query)
        const sql = `DELETE FROM ${table} WHERE ${clauses.join(' AND ')}`
        const res = await pool.query(sql, params)
        return { deletedCount: res.rowCount || 0 }
      },
      async countDocuments(query = {}) {
        const { clauses, params } = buildWhere(table, query)
        const sql = `SELECT COUNT(*)::int AS cnt FROM ${table} WHERE ${clauses.join(' AND ')}`
        const res = await pool.query(sql, params)
        return res.rows[0]?.cnt || 0
      }
    }
  }
  return { collection }
}

export async function connectToDb() {
  if (inMemoryDb) return inMemoryDb
  if (dbPromise) return dbPromise
  dbPromise = (async () => {
    try {
      const pool = await getPgPool()
      if (!pool) {
        console.warn('PostgreSQL pool unavailable, using in-memory database')
        inMemoryDb = createInMemoryDb()
        return inMemoryDb
      }
      try {
        await pool.query('SELECT NOW()')
      } catch (connectErr) {
        console.warn('PostgreSQL connection failed, using in-memory database:', connectErr?.message || connectErr)
        inMemoryDb = createInMemoryDb()
        return inMemoryDb
      }
      try {
        await createTables(pool)
      } catch (schemaErr) {
        console.warn('PostgreSQL schema creation warning:', schemaErr?.message || schemaErr)
      }
      return createPostgresDb(pool)
    } catch (e) {
      console.warn('PostgreSQL init failed, using in-memory database:', e?.message || e)
      inMemoryDb = createInMemoryDb()
      return inMemoryDb
    }
  })()
  return dbPromise
}
