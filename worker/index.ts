interface Env {
  DATABASE_URL: string
  NEXT_PUBLIC_WS_URL: string
  NEXT_PUBLIC_APP_URL: string
  ALLOWED_ORIGINS?: string
  PLAYER_SESSION_SECRET: string
  ADMIN_JWT_SECRET: string
  TOTP_ISSUER: string
  QR_CODE_SECRET: string
}

const SESSION_TTL_MS = 3600_000

function allowedOrigins(env: Env): string[] {
  const raw = env.ALLOWED_ORIGINS ?? env.NEXT_PUBLIC_APP_URL ?? ''
  return raw
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean)
}

function corsHeaders(request: Request, env: Env): Record<string, string> {
  const origin = request.headers.get('Origin')
  const headers: Record<string, string> = {
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400',
    Vary: 'Origin',
  }
  if (origin && allowedOrigins(env).includes(origin)) {
    headers['Access-Control-Allow-Origin'] = origin
    headers['Access-Control-Allow-Credentials'] = 'true'
  }
  return headers
}

function json(
  data: unknown,
  status = 200,
  cors: Record<string, string> = {},
): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...cors,
    },
  })
}

function timingSafeEqual(a: string, b: string): boolean {
  const aBytes = new TextEncoder().encode(a)
  const bBytes = new TextEncoder().encode(b)
  if (aBytes.length !== bBytes.length) return false
  let diff = 0
  for (let i = 0; i < aBytes.length; i++) {
    diff |= aBytes[i] ^ bBytes[i]
  }
  return diff === 0
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url)
    const cors = corsHeaders(request, env)

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: cors })
    }

    if (url.pathname === '/health') {
      return json({ status: 'ok' }, 200, cors)
    }

    if (url.pathname.startsWith('/api/')) {
      return handleApiRequest(request, url.pathname.replace('/api', ''), env, cors)
    }

    return json({ error: 'Not Found' }, 404, cors)
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
  cors: Record<string, string>,
): Promise<Response> {
  if (path === '/player/session' && request.method === 'POST') {
    return handlePlayerSession(request, env, cors)
  }

  if (path === '/player/heartbeat' && request.method === 'POST') {
    return handleHeartbeat(cors)
  }

  if (path === '/admin/players' && request.method === 'GET') {
    return handleAdminPlayers(request, env, cors)
  }

  return json({ error: 'Unknown API route' }, 404, cors)
}

const PLAYER_ID_PATTERN = /^[A-Za-z0-9_-]{1,64}$/

async function handlePlayerSession(
  request: Request,
  env: Env,
  cors: Record<string, string>,
): Promise<Response> {
  const body = await request.json().catch(() => null)
  if (!body || typeof body.playerId !== 'string' || !PLAYER_ID_PATTERN.test(body.playerId)) {
    return json({ error: 'valid playerId required' }, 400, cors)
  }

  const payload = `${body.playerId}:${Date.now()}`
  const signature = new Uint8Array(
    await crypto.subtle.sign(
      'HMAC',
      await crypto.subtle.importKey(
        'raw',
        new TextEncoder().encode(env.PLAYER_SESSION_SECRET),
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['sign'],
      ),
      new TextEncoder().encode(payload),
    ),
  )
  const token = `${payload}:${Buffer.from(signature).toString('base64url')}`
  return json({ sessionToken: token, expiresIn: SESSION_TTL_MS / 1000 }, 200, cors)
}

async function parseSessionToken(token: string, env: Env): Promise<string | null> {
  const parts = token.split(':')
  if (parts.length !== 3) return null

  const [playerId, timestamp, signature] = parts
  const payload = `${playerId}:${timestamp}`

  const issuedAt = Number(timestamp)
  if (!Number.isFinite(issuedAt) || Date.now() - issuedAt > SESSION_TTL_MS) {
    return null
  }

  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(env.PLAYER_SESSION_SECRET),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['verify'],
  )

  const valid = await crypto.subtle.verify(
    'HMAC',
    key,
    Uint8Array.from(atob(signature.replace(/-/g, '+').replace(/_/g, '/')), (c) => c.charCodeAt(0)),
    new TextEncoder().encode(payload),
  )

  if (!valid) return null
  return playerId
}

function handleHeartbeat(cors: Record<string, string>): Response {
  return json({ timestamp: Date.now(), status: 'alive' }, 200, cors)
}

async function handleAdminPlayers(
  request: Request,
  env: Env,
  cors: Record<string, string>,
): Promise<Response> {
  const authHeader = request.headers.get('Authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return json({ error: 'Missing or invalid Authorization header' }, 401, cors)
  }

  const token = authHeader.split(' ')[1]
  if (!env.ADMIN_JWT_SECRET || !timingSafeEqual(token, env.ADMIN_JWT_SECRET)) {
    return json({ error: 'Invalid token' }, 403, cors)
  }

  return json({ players: [], total: 0 }, 200, cors)
}

