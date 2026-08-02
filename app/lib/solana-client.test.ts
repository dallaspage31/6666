import { beforeEach, describe, expect, it, vi } from 'vitest'

import { createSolanaRpc } from '@solana/kit'

import { ROBINHOOD_CHAINS } from './robinhood-chain'
import { SolanaClient, createSolanaClient } from './solana-client'

const send = vi.fn(async () => 'sent')

const rpc = {
  getBalance: vi.fn(() => ({ send })),
  getSlot: vi.fn(() => ({ send })),
  getBlockTime: vi.fn(() => ({ send })),
  getLatestBlockhash: vi.fn(() => ({ send })),
  sendTransaction: vi.fn(() => ({ send })),
  getSignatureStatuses: vi.fn(() => ({ send })),
}

vi.mock('@solana/kit', () => ({
  createSolanaRpc: vi.fn(() => rpc),
}))

beforeEach(() => {
  vi.clearAllMocks()
})

describe('SolanaClient construction', () => {
  it('defaults to the robinhood devnet rpc url', () => {
    const client = new SolanaClient()
    expect(client.getChainId()).toBe('robinhood-devnet')
    expect(createSolanaRpc).toHaveBeenCalledWith(ROBINHOOD_CHAINS['robinhood-devnet'].rpcUrl)
    expect(client.getRpc()).toBe(rpc)
  })

  it('uses the rpc url of the requested chain', () => {
    const client = createSolanaClient({ chainId: 'solana-mainnet-beta' })
    expect(client.getChainId()).toBe('solana-mainnet-beta')
    expect(createSolanaRpc).toHaveBeenCalledWith(ROBINHOOD_CHAINS['solana-mainnet-beta'].rpcUrl)
  })
})

describe('SolanaClient rpc methods', () => {
  it('sends rpc requests and returns their result', async () => {
    const client = createSolanaClient()
    await expect(client.getSlot()).resolves.toBe('sent')
    await expect(client.getLatestBlockhash()).resolves.toBe('sent')
    expect(rpc.getSlot).toHaveBeenCalledOnce()
    expect(send).toHaveBeenCalledTimes(2)
  })

  it('passes through addresses, slots, transactions and signatures', async () => {
    const client = createSolanaClient()
    await client.getBalance('addr1')
    await client.getBlockTime(BigInt(5))
    await client.sendTransaction('tx' as never)
    await client.getSignatureStatuses(['sig' as never])
    expect(rpc.getBalance).toHaveBeenCalledWith('addr1')
    expect(rpc.getBlockTime).toHaveBeenCalledWith(BigInt(5))
    expect(rpc.sendTransaction).toHaveBeenCalledWith('tx')
    expect(rpc.getSignatureStatuses).toHaveBeenCalledWith(['sig'])
  })
})
