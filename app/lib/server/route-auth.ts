import { NextRequest, NextResponse } from 'next/server'
import { getSession } from './session'
import { verifyAdminToken, AdminTokenPayload } from './admin-security'
import { getClientIp } from './request-ip'

let globalRateLimiter: { check(ip: string): { allowed: boolean; remaining: number; reset: number } } | null = null

try {
  const mod = await import('@/lib/rate-limit')
  globalRateLimiter = (mod as { globalRateLimiter?: typeof globalRateLimiter }).globalRateLimiter ?? null
} catch {
  globalRateLimiter = null
}

export type PlayerAuth = { playerId: string; ip: string }
export type AdminAuth = { adminId: string; admin: AdminTokenPayload; ip: string }

export async function requirePlayer(req: NextRequest): Promise<PlayerAuth | NextResponse> {
  const ip = getClientIp(req.headers)
  if (globalRateLimiter) {
    const rate = globalRateLimiter.check(ip)
    if (!rate.allowed) {
      return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429, headers: { 'Retry-After': String(Math.ceil((rate.reset - Date.now()) / 1000)) } })
    }
  }
  const session = await getSession()
  if (!session?.playerId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  return { playerId: session.playerId, ip }
}

export async function requireAdmin(req: NextRequest): Promise<AdminAuth | NextResponse> {
  const ip = getClientIp(req.headers)
  if (globalRateLimiter) {
    const rate = globalRateLimiter.check(ip)
    if (!rate.allowed) {
      return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429, headers: { 'Retry-After': String(Math.ceil((rate.reset - Date.now()) / 1000)) } })
    }
  }
  const auth = req.headers.get('authorization')
  const token = auth?.startsWith('Bearer ') ? auth.slice(7) : null
  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const payload = verifyAdminToken(token)
  if (!payload) {
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
  }
  const session = await getSession()
  if (!session?.adminId || session.adminId !== payload.adminId) {
    return NextResponse.json({ error: 'Session expired' }, { status: 401 })
  }
  return { adminId: payload.adminId, admin: payload, ip }
}
