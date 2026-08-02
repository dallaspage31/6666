import { describe, expect, it } from 'vitest'

import {
  ChainId,
  DEFAULT_CHAIN,
  ROBINHOOD_CHAINS,
  getChainConfig,
  isRobinhoodChain,
} from './robinhood-chain'

const chainIds = Object.keys(ROBINHOOD_CHAINS) as ChainId[]

describe('ROBINHOOD_CHAINS', () => {
  it('keys every config by its own chainId', () => {
    for (const id of chainIds) {
      expect(ROBINHOOD_CHAINS[id].chainId).toBe(id)
    }
  })

  it('uses https rpc and wss websocket endpoints', () => {
    for (const id of chainIds) {
      const config = ROBINHOOD_CHAINS[id]
      expect(config.rpcUrl.startsWith('https://')).toBe(true)
      expect(config.wsUrl.startsWith('wss://')).toBe(true)
      expect(config.explorerUrl.startsWith('https://')).toBe(true)
    }
  })

  it('defaults to the robinhood devnet', () => {
    expect(DEFAULT_CHAIN).toBe('robinhood-devnet')
    expect(ROBINHOOD_CHAINS[DEFAULT_CHAIN].commitment).toBe('confirmed')
  })
})

describe('getChainConfig', () => {
  it('returns the config for each known chain', () => {
    expect(getChainConfig('solana-devnet').name).toBe('Solana Devnet')
    expect(getChainConfig('robinhood-mainnet').commitment).toBe('finalized')
  })
})

describe('isRobinhoodChain', () => {
  it('is true only for robinhood chains', () => {
    expect(isRobinhoodChain('robinhood-devnet')).toBe(true)
    expect(isRobinhoodChain('robinhood-mainnet')).toBe(true)
    expect(isRobinhoodChain('solana-devnet')).toBe(false)
    expect(isRobinhoodChain('solana-mainnet-beta')).toBe(false)
  })
})
