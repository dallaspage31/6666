import { describe, expect, it } from 'vitest'

import {
  BlockchainError,
  ExplorerError,
  RateLimitError,
  SolanaConnectionError,
  TransactionError,
  WalletError,
} from './errors'

describe('BlockchainError', () => {
  it('keeps the message and optional code', () => {
    const error = new BlockchainError('boom', 'CODE')
    expect(error).toBeInstanceOf(Error)
    expect(error.name).toBe('BlockchainError')
    expect(error.message).toBe('boom')
    expect(error.code).toBe('CODE')
  })

  it('leaves the code undefined when omitted', () => {
    expect(new BlockchainError('boom').code).toBeUndefined()
  })
})

describe('error subclasses', () => {
  it.each([
    [SolanaConnectionError, 'SolanaConnectionError', 'SOLANA_CONNECTION_ERROR', 'Failed to connect to Solana RPC'],
    [TransactionError, 'TransactionError', 'TRANSACTION_ERROR', 'Transaction failed'],
    [RateLimitError, 'RateLimitError', 'RATE_LIMIT_ERROR', 'Rate limit exceeded'],
    [WalletError, 'WalletError', 'WALLET_ERROR', 'Wallet operation failed'],
    [ExplorerError, 'ExplorerError', 'EXPLORER_ERROR', 'Failed to load explorer data'],
  ] as const)('%#: defaults message and code', (Ctor, name, code, message) => {
    const error = new Ctor()
    expect(error).toBeInstanceOf(BlockchainError)
    expect(error.name).toBe(name)
    expect(error.code).toBe(code)
    expect(error.message).toBe(message)
  })

  it('accepts custom messages', () => {
    expect(new SolanaConnectionError('down').message).toBe('down')
    expect(new ExplorerError('nope').message).toBe('nope')
  })

  it('carries transaction, rate limit and wallet metadata', () => {
    expect(new TransactionError('failed', 'sig123').signature).toBe('sig123')
    expect(new RateLimitError('slow down', 5000).retryAfterMs).toBe(5000)
    expect(new WalletError('bad wallet', 'addr1').walletAddress).toBe('addr1')
    expect(new TransactionError().signature).toBeUndefined()
  })
})
