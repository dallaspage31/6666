import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { RateLimiter, globalRateLimiter } from './rate-limit'

describe('RateLimiter', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2025-01-01T00:00:00Z'))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('allows the first request and reports the full remaining budget', () => {
    const limiter = new RateLimiter(1000, 3)
    expect(limiter.check('a')).toEqual({ allowed: true, remaining: 2, resetMs: 1000 })
  })

  it('decrements remaining across requests in the same window', () => {
    const limiter = new RateLimiter(1000, 3)
    limiter.check('a')
    vi.advanceTimersByTime(200)
    expect(limiter.check('a')).toEqual({ allowed: true, remaining: 1, resetMs: 800 })
    expect(limiter.check('a')).toEqual({ allowed: true, remaining: 0, resetMs: 800 })
  })

  it('blocks once the limit is reached', () => {
    const limiter = new RateLimiter(1000, 2)
    limiter.check('a')
    limiter.check('a')
    expect(limiter.check('a')).toEqual({ allowed: false, remaining: 0, resetMs: 1000 })
  })

  it('tracks keys independently', () => {
    const limiter = new RateLimiter(1000, 1)
    expect(limiter.check('a').allowed).toBe(true)
    expect(limiter.check('b').allowed).toBe(true)
    expect(limiter.check('a').allowed).toBe(false)
  })

  it('starts a fresh window after the reset time passes', () => {
    const limiter = new RateLimiter(1000, 1)
    limiter.check('a')
    expect(limiter.check('a').allowed).toBe(false)
    vi.advanceTimersByTime(1000)
    expect(limiter.check('a')).toEqual({ allowed: true, remaining: 0, resetMs: 1000 })
  })

  it('reset clears a single key and clear drops all keys', () => {
    const limiter = new RateLimiter(1000, 1)
    limiter.check('a')
    limiter.check('b')
    limiter.reset('a')
    expect(limiter.check('a').allowed).toBe(true)
    expect(limiter.check('b').allowed).toBe(false)
    limiter.clear()
    expect(limiter.check('b').allowed).toBe(true)
  })

  it('exposes a shared default limiter', () => {
    globalRateLimiter.clear()
    expect(globalRateLimiter.check('shared')).toEqual({
      allowed: true,
      remaining: 119,
      resetMs: 60_000,
    })
    globalRateLimiter.clear()
  })
})
