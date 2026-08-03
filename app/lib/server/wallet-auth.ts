import crypto from 'crypto'
import { verifyMessage } from 'viem'

const NONCE_EXPIRY = 300000

interface NonceRecord {
  nonce: string
  address: string
  createdAt: number
  used: boolean
}

const nonceStore = new Map<string, NonceRecord>()

export interface AuthResult {
  playerId: string
  walletAddress: string
  isNew: boolean
}

function generateId(): string {
  return crypto.randomUUID()
}

export function generateNonce(address: string): string {
  const nonce = `RobHeroes auth\nWallet: ${address}\nNonce: ${crypto.randomUUID()}\nTimestamp: ${Date.now()}`
  const key = address.toLowerCase()
  nonceStore.set(key, { nonce, address, createdAt: Date.now(), used: false })
  pruneNonces()
  return nonce
}

function pruneNonces(): void {
  const now = Date.now()
  for (const [key, record] of nonceStore) {
    if (now - record.createdAt > NONCE_EXPIRY || record.used) {
      nonceStore.delete(key)
    }
  }
}

export async function verifySignature(address: string, signature: string, nonce: string): Promise<boolean> {
  const key = address.toLowerCase()
  const record = nonceStore.get(key)
  if (!record || record.nonce !== nonce || record.used) return false
  record.used = true
  try {
    const isValid = verifyMessage({ address: address as `0x${string}`, message: nonce, signature: signature as `0x${string}` })
    return isValid
  } catch {
    return false
  }
}

export async function authenticateWallet(address: string): Promise<AuthResult> {
  const { db } = await import('./database')
  await db.init()
  let player = await db.playerByWallet(address.toLowerCase())
  if (!player) {
    player = await db.createPlayer({
      id: generateId(),
      wallet_address: address.toLowerCase(),
      username: null,
      level: 1,
      xp: 0,
      gold: 0,
      robheroes_balance: 0,
      last_active: new Date().toISOString(),
      created_at: new Date().toISOString(),
    })
  }
  return {
    playerId: player.id,
    walletAddress: player.wallet_address,
    isNew: !player.username,
  }
}
