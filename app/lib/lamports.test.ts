import { describe, expect, it } from 'vitest'

import {
  LAMPORTS_PER_SOL,
  formatLamports,
  formatSol,
  lamportsToSol,
  solToLamports,
} from './lamports'

describe('solToLamports', () => {
  it('converts whole and fractional SOL numbers', () => {
    expect(solToLamports(1)).toBe(LAMPORTS_PER_SOL)
    expect(solToLamports(0.5)).toBe(BigInt(500_000_000))
    expect(solToLamports(0)).toBe(BigInt(0))
  })

  it('floors sub-lamport precision', () => {
    expect(solToLamports(1e-10)).toBe(BigInt(0))
  })

  it('multiplies bigint input without float conversion', () => {
    expect(solToLamports(BigInt(3))).toBe(BigInt(3) * LAMPORTS_PER_SOL)
  })
})

describe('lamportsToSol', () => {
  it('converts number and bigint lamports', () => {
    expect(lamportsToSol(1_000_000_000)).toBe(1)
    expect(lamportsToSol(BigInt(2_500_000_000))).toBe(2.5)
  })

  it('round-trips with solToLamports', () => {
    expect(lamportsToSol(solToLamports(1.25))).toBe(1.25)
  })
})

describe('formatSol', () => {
  it('defaults to four decimals', () => {
    expect(formatSol(1.23456)).toBe('1.2346')
  })

  it('honours a custom decimal count and bigint input', () => {
    expect(formatSol(1.23456, 2)).toBe('1.23')
    expect(formatSol(BigInt(7), 1)).toBe('7.0')
  })
})

describe('formatLamports', () => {
  it('formats lamports as SOL with two decimals by default', () => {
    expect(formatLamports(1_500_000_000)).toBe('1.50')
    expect(formatLamports(BigInt(1_000_000_000), 3)).toBe('1.000')
  })
})
