import crypto from 'crypto'
import { createHmac, randomBytes } from 'crypto'
import { TOTP } from 'otpauth'
import QRCode from 'qrcode'

export interface AdminTokenPayload {
  adminId: string
  username: string
  exp: number
}

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString('hex')
  const hash = crypto
    .pbkdf2Sync(password, salt, 100000, 64, 'sha512')
    .toString('hex')
  return `${salt}:${hash}`
}

export async function verifyPassword(
  password: string,
  stored: string,
): Promise<boolean> {
  const [salt, hash] = stored.split(':')
  if (!salt || !hash) return false
  const test = crypto
    .pbkdf2Sync(password, salt, 100000, 64, 'sha512')
    .toString('hex')
  return test === hash
}

export function generateTOTPSecret(): string {
  const totp = new TOTP({
    issuer: 'RobHeroes',
    label: 'Admin',
    algorithm: 'SHA1',
    digits: 6,
    period: 30,
  })
  return totp.secret.base32
}

export async function getTOTPUri(
  secret: string,
  label: string,
): Promise<string> {
  const totp = new TOTP({
    issuer: 'RobHeroes',
    label,
    algorithm: 'SHA1',
    digits: 6,
    period: 30,
    secret: secret,
  })
  // @ts-ignore
  return totp.uri
}

export async function generateQrCode(uri: string): Promise<string> {
  return QRCode.toDataURL(uri)
}

export function verifyTOTP(token: string, secret: string): boolean {
  try {
    const totp = new TOTP({
      issuer: 'RobHeroes',
      label: 'Admin',
      algorithm: 'SHA1',
      digits: 6,
      period: 30,
      secret: secret as string,
    })
    const delta = totp.validate({ token, window: 1 })
    return delta !== null
  } catch {
    return false
  }
}

const JWT_SECRET = process.env.JWT_SECRET
if (!JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is required')
}

export function generateAdminToken(payload: AdminTokenPayload): string {
  const header = Buffer.from(
    JSON.stringify({ alg: 'HS256', typ: 'JWT' }),
  ).toString('base64url')
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url')
  const signInput = `${header}.${body}`
  const signature = createHmac('sha256', JWT_SECRET)
    .update(signInput)
    .digest('base64url')
  return `${signInput}.${signature}`
}

export function verifyAdminToken(token: string): AdminTokenPayload | null {
  const parts = token.split('.')
  if (parts.length !== 3) return null
  const [headerB64, bodyB64, signature] = parts
  const signInput = `${headerB64}.${bodyB64}`
  const expected = createHmac('sha256', JWT_SECRET)
    .update(signInput)
    .digest('base64url')
  if (signature !== expected) return null
  try {
    const payload = JSON.parse(
      Buffer.from(bodyB64, 'base64url').toString('utf8'),
    ) as AdminTokenPayload
    if (payload.exp && Date.now() > payload.exp * 1000) return null
    return payload
  } catch {
    return null
  }
}
