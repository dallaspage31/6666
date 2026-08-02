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

class HttpError extends Error {
  constructor(message: string, public status: number) {
    super(message)
    this.name = 'HttpError'
  }
}

function requireSecret(env: Env, key: keyof Env): string {
  const value = env[key]
  if (!value) {
    throw new HttpError(`Server misconfigured: ${key} is not set`, 500)
  }
  return value
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    try {
      const url = new URL(request.url)

      if (request.method === 'OPTIONS') {
        return new Response(null, { headers: corsHeaders })
      }

      if (url.pathname === '/health') {
        return json({ status: 'ok' })
      }

      if (url.pathname.startsWith('/api/')) {
        return await handleApiRequest(request, url.pathname.replace('/api', ''), env)
      }

      return json({ error: 'Not Found' }, 404)
    } catch (error) {
      if (error instanceof HttpError) {
        console.error(`[worker] ${request.method} ${request.url} -> ${error.status}`, error)
        return json({ error: error.message }, error.status)
      }
      console.error(`[worker] Unhandled error on ${request.method} ${request.url}`, error)
      return json({ error: 'Internal Server Error' }, 500)
    }
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
  if (path === '/player/session' && request.method === 'POST') {
    return handlePlayerSession(request, env)
  }

  if (path === '/player/heartbeat' && request.method === 'POST') {
    return handleHeartbeat()
  }

  if (path === '/admin/players' && request.method === 'GET') {
    return handleAdminPlayers(request, env)
  }

  return json({ error: 'Unknown API route' }, 404)
}

async function handlePlayerSession(request: Request, env: Env): Promise<Response> {
  const secret = requireSecret(env, 'PLAYER_SESSION_SECRET')

  let body: unknown
  try {
    body = await request.json()
  } catch (error) {
    console.warn('[worker] Rejected player session with unparsable body', error)
    return json({ error: 'Request body must be valid JSON' }, 400)
  }

  const playerId =
    typeof body === 'object' && body !== null && 'playerId' in body
      ? (body as { playerId: unknown }).playerId
      : undefined
  if (typeof playerId !== 'string' || playerId.length === 0) {
    return json({ error: 'playerId required' }, 400)
  }

  const payload = `${playerId}:${Date.now()}`
  const signature = new Uint8Array(
    await crypto.subtle.sign(
      'HMAC',
      await crypto.subtle.importKey(
        'raw',
        new TextEncoder().encode(secret),
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['sign'],
      ),
      new TextEncoder().encode(payload),
    ),
  )
  const token = `${payload}:${Buffer.from(signature).toString('base64url')}`
  return json({ sessionToken: token, expiresIn: 3600 })
}

function decodeBase64Url(value: string) {
  let binary: string
  try {
    binary = atob(value.replace(/-/g, '+').replace(/_/g, '/'))
  } catch (error) {
    console.warn('[worker] Rejected session token with malformed base64url signature', error)
    return null
  }

  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i)
  }
  return bytes
}

export async function parseSessionToken(token: string, env: Env): Promise<string | null> {
  const secret = requireSecret(env, 'PLAYER_SESSION_SECRET')

  const parts = token.split(':')
  if (parts.length !== 3) return null

  const [playerId, timestamp, signature] = parts
  const payload = `${playerId}:${timestamp}`

  const signatureBytes = decodeBase64Url(signature)
  if (!signatureBytes) return null

  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['verify'],
  )

  const valid = await crypto.subtle.verify(
    'HMAC',
    key,
    signatureBytes,
    new TextEncoder().encode(payload),
  )

  if (!valid) return null
  return playerId
}

function handleHeartbeat(): Response {
  return json({ timestamp: Date.now(), status: 'alive' })
}

async function handleAdminPlayers(request: Request, env: Env): Promise<Response> {
  const authHeader = request.headers.get('Authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return json({ error: 'Missing or invalid Authorization header' }, 401)
  }

  const token = authHeader.split(' ')[1]
  if (token !== requireSecret(env, 'ADMIN_JWT_SECRET')) {
    return json({ error: 'Invalid token' }, 403)
  }

  return json({ players: [], total: 0 })
}

