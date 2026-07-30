export interface RateLimitEntry {
  count: number
  resetAt: number
}

const DEFAULT_WINDOW_MS = 60_000
const DEFAULT_LIMIT = 120

export class RateLimiter {
  private limits: Map<string, RateLimitEntry> = new Map()
  private windowMs: number
  private limit: number

  constructor(windowMs = DEFAULT_WINDOW_MS, limit = DEFAULT_LIMIT) {
    this.windowMs = windowMs
    this.limit = limit
  }

  check(key: string): { allowed: boolean; remaining: number; resetMs: number } {
    const now = Date.now()
    const entry = this.limits.get(key)

    if (!entry || now >= entry.resetAt) {
      const resetAt = now + this.windowMs
      this.limits.set(key, { count: 1, resetAt })
      return { allowed: true, remaining: this.limit - 1, resetMs: this.windowMs }
    }

    if (entry.count >= this.limit) {
      return {
        allowed: false,
        remaining: 0,
        resetMs: entry.resetAt - now,
      }
    }

    entry.count += 1
    return {
      allowed: true,
      remaining: this.limit - entry.count,
      resetMs: entry.resetAt - now,
    }
  }

  reset(key: string): void {
    this.limits.delete(key)
  }

  clear(): void {
    this.limits.clear()
  }
}

export const globalRateLimiter = new RateLimiter()
