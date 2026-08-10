import { cookies } from 'next/headers'
import crypto from 'crypto'

const SESSION_SECRET = process.env.SESSION_SECRET
if (!SESSION_SECRET) {
  throw new Error('SESSION_SECRET environment variable is required')
}
const SESSION_COOKIE = 'robheroes_session'
const PLAYER_EXPIRY = 3600
const ADMIN_EXPIRY = 86400

function getKey(): Buffer {
  return crypto.createHash('sha256').update(SESSION_SECRET).digest()
}

function encrypt(text: string): string {
  const key = getKey()
  const iv = crypto.randomBytes(12)
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv)
  const encrypted = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()])
  const tag = cipher.getAuthTag()
  return `${iv.toString('hex')}:${tag.toString('hex')}:${encrypted.toString('hex')}`
}

function decrypt(payload: string): string | null {
  try {
    const [ivHex, tagHex, dataHex] = payload.split(':')
    const key = getKey()
    const decipher = crypto.createDecipheriv(
      'aes-256-gcm',
      key,
      Buffer.from(ivHex, 'hex'),
    )
    decipher.setAuthTag(Buffer.from(tagHex, 'hex'))
    const decrypted = Buffer.concat([
      decipher.update(Buffer.from(dataHex, 'hex')),
      decipher.final(),
    ])
    return decrypted.toString('utf8')
  } catch {
    return null
  }
}

export interface SessionData {
  playerId?: string
  adminId?: string
}

export async function createSession(data: SessionData): Promise<void> {
  const maxAge = data.adminId ? ADMIN_EXPIRY : PLAYER_EXPIRY
  const payload = JSON.stringify({ ...data, exp: Date.now() + maxAge * 1000 })
  const encrypted = encrypt(payload)
  const cookieStore = await cookies()
  cookieStore.set(SESSION_COOKIE, encrypted, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge,
    path: '/',
  })
}

export async function getSession(): Promise<SessionData | null> {
  const cookieStore = await cookies()
  const cookie = cookieStore.get(SESSION_COOKIE)
  if (!cookie) return null
  const decrypted = decrypt(cookie.value)
  if (!decrypted) return null
  try {
    const parsed = JSON.parse(decrypted) as SessionData & { exp: number }
    if (Date.now() > parsed.exp) {
      await destroySession()
      return null
    }
    const { exp: _, ...rest } = parsed
    return rest
  } catch {
    return null
  }
}

export async function updateSession(data: Partial<SessionData>): Promise<void> {
  const current = (await getSession()) || {}
  await createSession({ ...current, ...data })
}

export async function destroySession(): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.set(SESSION_COOKIE, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 0,
    path: '/',
  })
}
