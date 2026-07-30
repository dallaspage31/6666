import { Pool } from 'pg'
import * as OTPAuth from 'otpauth'

declare type ExecutionContext = any
declare type ScheduledController = any

interface Env {
  DATABASE_URL: string
  NEXT_PUBLIC_WS_URL: string
  PLAYER_SESSION_SECRET: string
  ADMIN_JWT_SECRET: string
  TOTP_ISSUER: string
  QR_CODE_SECRET: string
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Max-Age': '86400',
}

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...corsHeaders,
    },
  })
}

let globalPool: Pool | null = null

function getPool(env: Env): Pool {
  if (!globalPool) {
    globalPool = new Pool({ connectionString: env.DATABASE_URL })
  }
  return globalPool
}

async function hashPassword(password: string): Promise<string> {
  const salt = crypto.randomUUID()
  const encoder = new TextEncoder()
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    'PBKDF2',
    false,
    ['deriveBits'],
  )
  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: encoder.encode(salt),
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    256,
  )
  const hash = Array.from(new Uint8Array(derivedBits))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
  return `${salt}:${hash}`
}

async function verifyPassword(
  password: string,
  storedHash: string,
): Promise<boolean> {
  const [salt, hash] = storedHash.split(':')
  const encoder = new TextEncoder()
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    'PBKDF2',
    false,
    ['deriveBits'],
  )
  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: encoder.encode(salt),
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    256,
  )
  const computedHash = Array.from(new Uint8Array(derivedBits))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
  return computedHash === hash
}

function generateSessionToken(playerId: string, secret: string): string {
  const payload = `${playerId}:${Date.now()}:${Date.now() + 3600000}`
  return btoa(payload)
}

function parseSessionToken(
  token: string,
  _secret: string,
): { playerId: string; valid: boolean } {
  try {
    const decoded = atob(token)
    const parts = decoded.split(':')
    if (parts.length < 3) return { playerId: '', valid: false }
    const expiresAt = parseInt(parts[2], 10)
    if (Date.now() > expiresAt) return { playerId: '', valid: false }
    return { playerId: parts[0], valid: true }
  } catch {
    return { playerId: '', valid: false }
  }
}

export default {
  async fetch(
    request: Request,
    env: Env,
    ctx: ExecutionContext,
  ): Promise<Response> {
    const url = new URL(request.url)

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders })
    }

    if (url.pathname === '/health') {
      return json({ status: 'ok' })
    }

    if (url.pathname.startsWith('/api/')) {
      return handleApiRequest(request, url.pathname.replace('/api', ''), env)
    }

    return json({ error: 'Not Found' }, 404)
  },

  async scheduled(
    _controller: ScheduledController,
    _env: Env,
    _ctx: ExecutionContext,
  ): Promise<void> {
    // Scheduled maintenance runs externally via D1 / queue consumer.
  },
}

async function handleApiRequest(
  request: Request,
  path: string,
  env: Env,
): Promise<Response> {
  if (path === '/auth/player/register' && request.method === 'POST') {
    return handlePlayerRegister(request, env)
  }

  if (path === '/auth/player/login' && request.method === 'POST') {
    return handlePlayerLogin(request, env)
  }

  if (path === '/player/heartbeat' && request.method === 'POST') {
    return handleHeartbeat(request, env)
  }

  if (path === '/player/session' && request.method === 'GET') {
    return handlePlayerSession(request, env)
  }

  if (path === '/admin/auth' && request.method === 'POST') {
    return handleAdminAuth(request, env)
  }

  if (path === '/admin/mfa/setup' && request.method === 'POST') {
    return handleMFASetup(request, env)
  }

  if (path === '/admin/mfa/verify' && request.method === 'POST') {
    return handleMFAVerify(request, env)
  }

  if (path === '/admin/players' && request.method === 'GET') {
    return handleAdminPlayers(request, env)
  }

  if (path === '/admin/players' && request.method === 'POST') {
    return handleAdminCreatePlayer(request, env)
  }

  const match = path.match(/^\/admin\/players\/(\d+)$/)
  if (match) {
    const id = parseInt(match[1], 10)
    if (request.method === 'PUT') {
      return handleAdminUpdatePlayer(request, env, id)
    }
    if (request.method === 'DELETE') {
      return handleAdminDeletePlayer(request, env, id)
    }
  }

  return json({ error: 'Unknown API route' }, 404)
}

async function handlePlayerRegister(
  request: Request,
  env: Env,
): Promise<Response> {
  const body = await request.json().catch(() => null)
  if (!body || !body.username || !body.email || !body.password) {
    return json({ error: 'username, email, and password required' }, 400)
  }

  const passwordHash = await hashPassword(body.password)
  const pool = getPool(env)

  try {
    const result = await pool.query(
      'INSERT INTO players (username, email, password_hash) VALUES ($1, $2, $3) RETURNING id, username, email, created_at',
      [body.username, body.email, passwordHash],
    )
    return json(result.rows[0], 201)
  } catch (err: unknown) {
    const message = (err as Error).message
    if (message.includes('duplicate key')) {
      return json({ error: 'Username or email already exists' }, 409)
    }
    return json({ error: 'Failed to register player' }, 500)
  }
}

async function handlePlayerLogin(
  request: Request,
  env: Env,
): Promise<Response> {
  const body = await request.json().catch(() => null)
  if (!body || !body.username || !body.password) {
    return json({ error: 'username and password required' }, 400)
  }

  const pool = getPool(env)
  const result = await pool.query(
    'SELECT id, username, password_hash, totp_enabled, totp_secret FROM players WHERE username = $1',
    [body.username],
  )

  if (result.rows.length === 0) {
    return json({ error: 'Invalid credentials' }, 401)
  }

  const player = result.rows[0]
  const validPassword = await verifyPassword(body.password, player.password_hash)

  if (!validPassword) {
    return json({ error: 'Invalid credentials' }, 401)
  }

  if (player.totp_enabled && !body.totpCode) {
    return json({ error: 'TOTP code required', mfaRequired: true }, 401)
  }

  if (player.totp_enabled && body.totpCode) {
    const totp = new OTPAuth.TOTP({
      secret: player.totp_secret,
      issuer: env.TOTP_ISSUER,
      label: player.username,
      digits: 6,
      period: 30,
      algorithm: 'SHA-1',
    })
    const delta = totp.validate({ token: body.totpCode, window: 1 })
    if (delta === null) {
      return json({ error: 'Invalid TOTP code' }, 401)
    }
  }

  const sessionToken = generateSessionToken(String(player.id), env.PLAYER_SESSION_SECRET)

  await pool.query(
    'UPDATE players SET session_token = $1, session_expires_at = NOW() + INTERVAL \'1 hour\' WHERE id = $2',
    [sessionToken, player.id],
  )

  return json({ sessionToken, expiresIn: 3600, playerId: player.id })
}

async function handleHeartbeat(
  request: Request,
  env: Env,
): Promise<Response> {
  const authHeader = request.headers.get('Authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return json({ error: 'Missing or invalid Authorization header' }, 401)
  }

  const token = authHeader.split(' ')[1]
  const { playerId, valid } = parseSessionToken(token, env.PLAYER_SESSION_SECRET)

  if (!valid || !playerId) {
    return json({ error: 'Invalid or expired session token' }, 401)
  }

  const pool = getPool(env)
  await pool.query(
    'UPDATE players SET session_expires_at = NOW() + INTERVAL \'1 hour\' WHERE id = $1 AND session_token = $2',
    [playerId, token],
  )

  return json({ timestamp: Date.now(), status: 'alive', playerId })
}

async function handlePlayerSession(
  request: Request,
  env: Env,
): Promise<Response> {
  const authHeader = request.headers.get('Authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return json({ error: 'Missing or invalid Authorization header' }, 401)
  }

  const token = authHeader.split(' ')[1]
  const { playerId, valid } = parseSessionToken(token, env.PLAYER_SESSION_SECRET)

  if (!valid || !playerId) {
    return json({ error: 'Invalid or expired session token' }, 401)
  }

  const pool = getPool(env)
  const result = await pool.query(
    'SELECT id, username, email, session_token, session_expires_at, created_at FROM players WHERE id = $1',
    [playerId],
  )

  if (result.rows.length === 0) {
    return json({ error: 'Player not found' }, 404)
  }

  const player = result.rows[0]
  delete player.session_token
  return json(player)
}

async function handleAdminAuth(
  request: Request,
  env: Env,
): Promise<Response> {
  const body = await request.json().catch(() => null)
  if (!body || !body.username || !body.password) {
    return json({ error: 'username and password required' }, 400)
  }

  const pool = getPool(env)
  const result = await pool.query(
    'SELECT id, username, password_hash, mfa_enabled, totp_secret FROM admins WHERE username = $1',
    [body.username],
  )

  if (result.rows.length === 0) {
    return json({ error: 'Invalid credentials' }, 401)
  }

  const admin = result.rows[0]
  const validPassword = await verifyPassword(body.password, admin.password_hash)

  if (!validPassword) {
    return json({ error: 'Invalid credentials' }, 401)
  }

  if (admin.mfa_enabled && !body.totpCode) {
    return json({ error: 'TOTP code required', mfaRequired: true }, 401)
  }

  if (admin.mfa_enabled && body.totpCode) {
    const totp = new OTPAuth.TOTP({
      secret: admin.totp_secret,
      issuer: env.TOTP_ISSUER,
      label: admin.username,
      digits: 6,
      period: 30,
      algorithm: 'SHA-1',
    })
    const delta = totp.validate({ token: body.totpCode, window: 1 })
    if (delta === null) {
      return json({ error: 'Invalid TOTP code' }, 401)
    }
  }

  const token = generateSessionToken(String(admin.id), env.ADMIN_JWT_SECRET)

  await pool.query(
    'UPDATE admins SET jwt_secret = $1 WHERE id = $2',
    [token, admin.id],
  )

  return json({ sessionToken: token, expiresIn: 3600, adminId: admin.id })
}

async function handleMFASetup(
  request: Request,
  env: Env,
): Promise<Response> {
  const authHeader = request.headers.get('Authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return json({ error: 'Missing or invalid Authorization header' }, 401)
  }

  const token = authHeader.split(' ')[1]
  const { playerId, valid } = parseSessionToken(token, env.ADMIN_JWT_SECRET)

  if (!valid || !playerId) {
    return json({ error: 'Invalid or expired session token' }, 401)
  }

  const secret = new OTPAuth.Secret({ size: 32 })

  const totp = new OTPAuth.TOTP({
    secret: secret,
    issuer: env.TOTP_ISSUER,
    label: `admin-${playerId}`,
    digits: 6,
    period: 30,
    algorithm: 'SHA-1',
  })

  const otpauthUrl = totp.toString()

  return json({
    secret: secret.base32,
    otpauthUrl,
    expiresIn: 300,
  })
}

async function handleMFAVerify(
  request: Request,
  env: Env,
): Promise<Response> {
  const authHeader = request.headers.get('Authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return json({ error: 'Missing or invalid Authorization header' }, 401)
  }

  const token = authHeader.split(' ')[1]
  const { playerId, valid } = parseSessionToken(token, env.ADMIN_JWT_SECRET)

  if (!valid || !playerId) {
    return json({ error: 'Invalid or expired session token' }, 401)
  }

  const body = await request.json().catch(() => null)
  if (!body || !body.totpCode) {
    return json({ error: 'totpCode required' }, 400)
  }

  const pool = getPool(env)
  const result = await pool.query(
    'SELECT totp_secret FROM admins WHERE id = $1',
    [playerId],
  )

  if (result.rows.length === 0) {
    return json({ error: 'Admin not found' }, 404)
  }

  const admin = result.rows[0]
  if (!admin.totp_secret) {
    return json({ error: 'MFA not configured for this admin' }, 400)
  }

  const totp = new OTPAuth.TOTP({
    secret: admin.totp_secret,
    issuer: env.TOTP_ISSUER,
    label: `admin-${playerId}`,
    digits: 6,
    period: 30,
    algorithm: 'SHA-1',
  })

  const delta = totp.validate({ token: body.totpCode, window: 1 })
  if (delta === null) {
    return json({ error: 'Invalid TOTP code' }, 401)
  }

  return json({ verified: true })
}

async function handleAdminPlayers(
  request: Request,
  env: Env,
): Promise<Response> {
  const authHeader = request.headers.get('Authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return json({ error: 'Missing or invalid Authorization header' }, 401)
  }

  const token = authHeader.split(' ')[1]
  const { playerId, valid } = parseSessionToken(token, env.ADMIN_JWT_SECRET)

  if (!valid || !playerId) {
    return json({ error: 'Invalid or expired session token' }, 401)
  }

  const pool = getPool(env)
  const url = new URL(request.url)
  const page = parseInt(url.searchParams.get('page') || '1', 10)
  const limit = parseInt(url.searchParams.get('limit') || '20', 10)
  const offset = (page - 1) * limit

  const countResult = await pool.query('SELECT COUNT(*) FROM players')
  const total = parseInt(countResult.rows[0].count, 10)

  const result = await pool.query(
    'SELECT id, username, email, session_token, session_expires_at, created_at, updated_at FROM players ORDER BY created_at DESC LIMIT $1 OFFSET $2',
    [limit, offset],
  )

  const players = result.rows.map((p: { session_token: string }) => {
    const { session_token, ...rest } = p
    return rest
  })

  return json({ players, total, page, limit })
}

async function handleAdminCreatePlayer(
  request: Request,
  env: Env,
): Promise<Response> {
  const authHeader = request.headers.get('Authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return json({ error: 'Missing or invalid Authorization header' }, 401)
  }

  const token = authHeader.split(' ')[1]
  const { playerId, valid } = parseSessionToken(token, env.ADMIN_JWT_SECRET)

  if (!valid || !playerId) {
    return json({ error: 'Invalid or expired session token' }, 401)
  }

  const body = await request.json().catch(() => null)
  if (!body || !body.username || !body.email || !body.password) {
    return json({ error: 'username, email, and password required' }, 400)
  }

  const passwordHash = await hashPassword(body.password)
  const pool = getPool(env)

  try {
    const result = await pool.query(
      'INSERT INTO players (username, email, password_hash) VALUES ($1, $2, $3) RETURNING id, username, email, created_at',
      [body.username, body.email, passwordHash],
    )
    return json(result.rows[0], 201)
  } catch (err: unknown) {
    const message = (err as Error).message
    if (message.includes('duplicate key')) {
      return json({ error: 'Username or email already exists' }, 409)
    }
    return json({ error: 'Failed to create player' }, 500)
  }
}

async function handleAdminUpdatePlayer(
  request: Request,
  env: Env,
  id: number,
): Promise<Response> {
  const authHeader = request.headers.get('Authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return json({ error: 'Missing or invalid Authorization header' }, 401)
  }

  const token = authHeader.split(' ')[1]
  const { playerId, valid } = parseSessionToken(token, env.ADMIN_JWT_SECRET)

  if (!valid || !playerId) {
    return json({ error: 'Invalid or expired session token' }, 401)
  }

  const body = await request.json().catch(() => null)
  if (!body) {
    return json({ error: 'Request body required' }, 400)
  }

  const pool = getPool(env)
  const updates: string[] = []
  const values: unknown[] = []
  let index = 1

  if (body.username !== undefined) {
    updates.push(`username = $${++index}`)
    values.push(body.username)
  }
  if (body.email !== undefined) {
    updates.push(`email = $${++index}`)
    values.push(body.email)
  }
  if (body.password !== undefined) {
    const passwordHash = await hashPassword(body.password)
    updates.push(`password_hash = $${++index}`)
    values.push(passwordHash)
  }

  if (updates.length === 0) {
    return json({ error: 'No fields to update' }, 400)
  }

  updates.push(`updated_at = NOW()`)
  values.push(id)

  try {
    const result = await pool.query(
      `UPDATE players SET ${updates.join(', ')} WHERE id = $${index + 1} RETURNING id, username, email, updated_at`,
      values,
    )

    if (result.rows.length === 0) {
      return json({ error: 'Player not found' }, 404)
    }

    return json(result.rows[0])
  } catch (err: unknown) {
    const message = (err as Error).message
    if (message.includes('duplicate key')) {
      return json({ error: 'Username or email already exists' }, 409)
    }
    return json({ error: 'Failed to update player' }, 500)
  }
}

async function handleAdminDeletePlayer(
  request: Request,
  env: Env,
  id: number,
): Promise<Response> {
  const authHeader = request.headers.get('Authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return json({ error: 'Missing or invalid Authorization header' }, 401)
  }

  const token = authHeader.split(' ')[1]
  const { playerId, valid } = parseSessionToken(token, env.ADMIN_JWT_SECRET)

  if (!valid || !playerId) {
    return json({ error: 'Invalid or expired session token' }, 401)
  }

  const pool = getPool(env)
  const result = await pool.query(
    'DELETE FROM players WHERE id = $1 RETURNING id',
    [id],
  )

  if (result.rows.length === 0) {
    return json({ error: 'Player not found' }, 404)
  }

  return json({ deleted: true, id })
}