interface Env {
  DATABASE_URL: string
  NEXT_PUBLIC_WS_URL: string
  PLAYER_SESSION_SECRET: string
  ADMIN_JWT_SECRET: string
  TOTP_ISSUER: string
  QR_CODE_SECRET: string
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url)

    if (url.pathname === '/health') {
      return new Response(JSON.stringify({ status: 'ok' }), {
        headers: { 'Content-Type': 'application/json' },
      })
    }

    if (url.pathname.startsWith('/api/')) {
      return handleApiRequest(request, url, env, ctx)
    }

    return new Response('Not Found', { status: 404 })
  },

  async scheduled(controller: ScheduledController, env: Env, ctx: ExecutionContext): Promise<void> {
    await runMaintenance(env, ctx)
  },
}

async function handleApiRequest(
  request: Request,
  url: URL,
  env: Env,
  ctx: ExecutionContext,
): Promise<Response> {
  const path = url.pathname.replace('/api', '')

  if (path === '/player/session') {
    return handlePlayerSession(request, env)
  }

  if (path === '/player/heartbeat') {
    return handleHeartbeat(request, env)
  }

  if (path === '/admin/players') {
    return handleAdminPlayers(request, env)
  }

  return new Response(JSON.stringify({ error: 'Unknown API route' }), {
    status: 404,
    headers: { 'Content-Type': 'application/json' },
  })
}

async function handlePlayerSession(request: Request, env: Env): Promise<Response> {
  if (request.method === 'POST') {
    const body = await request.json().catch(() => null)
    if (!body || !body.playerId) {
      return new Response(
        JSON.stringify({ error: 'playerId required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } },
      )
    }
    const sessionToken = `${env.PLAYER_SESSION_SECRET}:${body.playerId}:${Date.now()}`
    return new Response(
      JSON.stringify({ sessionToken, expiresIn: 3600 }),
      { headers: { 'Content-Type': 'application/json' } },
    )
  }

  return new Response(
    JSON.stringify({ error: 'Method not allowed' }),
    { status: 405, headers: { 'Content-Type': 'application/json' } },
  )
}

async function handleHeartbeat(request: Request, env: Env): Promise<Response> {
  return new Response(
    JSON.stringify({ timestamp: Date.now(), status: 'alive' }),
    { headers: { 'Content-Type': 'application/json' } },
  )
}

async function handleAdminPlayers(request: Request, env: Env): Promise<Response> {
  if (request.method !== 'GET') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { 'Content-Type': 'application/json' } },
    )
  }

  const authHeader = request.headers.get('Authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return new Response(
      JSON.stringify({ error: 'Missing or invalid Authorization header' }),
      { status: 401, headers: { 'Content-Type': 'application/json' } },
    )
  }

  const token = authHeader.split(' ')[1]
  if (token !== env.ADMIN_JWT_SECRET) {
    return new Response(
      JSON.stringify({ error: 'Invalid token' }),
      { status: 403, headers: { 'Content-Type': 'application/json' } },
    )
  }

  return new Response(
    JSON.stringify({ players: [], total: 0 }),
    { headers: { 'Content-Type': 'application/json' } },
  )
}

async function runMaintenance(env: Env, ctx: ExecutionContext): Promise<void> {
  ctx.waitUntil(
    fetch(env.DATABASE_URL, {
      method: 'HEAD',
    }).catch(() => null),
  )
}