import { describe, expect, it } from 'vitest'

import { addressUrl, blockUrl, shortenAddress, shortenSignature, transactionUrl } from './explorer'
import { ROBINHOOD_CHAINS } from './robinhood-chain'

const devnet = ROBINHOOD_CHAINS['robinhood-devnet'].explorerUrl
const solana = ROBINHOOD_CHAINS['solana-mainnet-beta'].explorerUrl

describe('explorer urls', () => {
  it('defaults to the robinhood devnet explorer', () => {
    expect(transactionUrl('sig')).toEqual({ url: `${devnet}/tx/sig`, label: 'View Transaction' })
    expect(addressUrl('addr')).toEqual({ url: `${devnet}/address/addr`, label: 'View Address' })
    expect(blockUrl(42)).toEqual({ url: `${devnet}/block/42`, label: 'View Block' })
  })

  it('uses the explorer of the requested chain', () => {
    expect(transactionUrl('sig', 'solana-mainnet-beta').url).toBe(`${solana}/tx/sig`)
    expect(addressUrl('addr', 'solana-mainnet-beta').url).toBe(`${solana}/address/addr`)
    expect(blockUrl(7, 'solana-mainnet-beta').url).toBe(`${solana}/block/7`)
  })
})

describe('shortenAddress', () => {
  it('keeps four leading and trailing characters by default', () => {
    expect(shortenAddress('abcdefghijkl')).toBe('abcd...ijkl')
  })

  it('honours a custom character count', () => {
    expect(shortenAddress('abcdefghijkl', 2)).toBe('ab...kl')
  })

  it('overlaps rather than truncating when the input is shorter than 2n', () => {
    expect(shortenAddress('abc')).toBe('abc...abc')
  })
})

describe('shortenSignature', () => {
  it('keeps six leading and trailing characters by default', () => {
    expect(shortenSignature('0123456789abcdef')).toBe('012345...abcdef')
  })

  it('honours a custom character count', () => {
    expect(shortenSignature('0123456789abcdef', 3)).toBe('012...def')
  })
})
