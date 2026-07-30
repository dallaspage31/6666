interface Env {
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

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
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
  const body = await request.json().catch(() => null)
  if (!body || !body.playerId) {
    return json({ error: 'playerId required' }, 400)
  }

  const sessionToken = `${env.PLAYER_SESSION_SECRET}:${body.playerId}:${Date.now()}`
  return json({ sessionToken, expiresIn: 3600 })
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
  if (token !== env.ADMIN_JWT_SECRET) {
    return json({ error: 'Invalid token' }, 403)
  }

  return json({ players: [], total: 0 })
}