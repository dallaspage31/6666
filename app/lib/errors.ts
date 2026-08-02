export class BlockchainError extends Error {
  constructor(message: string, public code?: string, options?: ErrorOptions) {
    super(message, options)
    this.name = 'BlockchainError'
  }
}

export class SolanaConnectionError extends BlockchainError {
  constructor(message = 'Failed to connect to Solana RPC', options?: ErrorOptions) {
    super(message, 'SOLANA_CONNECTION_ERROR', options)
    this.name = 'SolanaConnectionError'
  }
}

export class TransactionError extends BlockchainError {
  constructor(message = 'Transaction failed', public signature?: string, options?: ErrorOptions) {
    super(message, 'TRANSACTION_ERROR', options)
    this.name = 'TransactionError'
  }
}

export class RateLimitError extends BlockchainError {
  constructor(message = 'Rate limit exceeded', public retryAfterMs?: number, options?: ErrorOptions) {
    super(message, 'RATE_LIMIT_ERROR', options)
    this.name = 'RateLimitError'
  }
}

export class WalletError extends BlockchainError {
  constructor(message = 'Wallet operation failed', public walletAddress?: string, options?: ErrorOptions) {
    super(message, 'WALLET_ERROR', options)
    this.name = 'WalletError'
  }
}

export class ExplorerError extends BlockchainError {
  constructor(message = 'Failed to load explorer data', options?: ErrorOptions) {
    super(message, 'EXPLORER_ERROR', options)
    this.name = 'ExplorerError'
  }
}

export class ChainConfigError extends BlockchainError {
  constructor(message = 'Unknown chain', public chainId?: string, options?: ErrorOptions) {
    super(message, 'CHAIN_CONFIG_ERROR', options)
    this.name = 'ChainConfigError'
  }
}

export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message
  if (typeof error === 'string') return error
  return 'Unknown error'
}
