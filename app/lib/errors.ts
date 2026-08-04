export class BlockchainError extends Error {
  constructor(
    message: string,
    public code?: string,
  ) {
    super(message)
    this.name = 'BlockchainError'
  }
}

export class SolanaConnectionError extends BlockchainError {
  constructor(message = 'Failed to connect to Solana RPC') {
    super(message, 'SOLANA_CONNECTION_ERROR')
    this.name = 'SolanaConnectionError'
  }
}

export class TransactionError extends BlockchainError {
  constructor(
    message = 'Transaction failed',
    public signature?: string,
  ) {
    super(message, 'TRANSACTION_ERROR')
    this.name = 'TransactionError'
  }
}

export class RateLimitError extends BlockchainError {
  constructor(
    message = 'Rate limit exceeded',
    public retryAfterMs?: number,
  ) {
    super(message, 'RATE_LIMIT_ERROR')
    this.name = 'RateLimitError'
  }
}

export class WalletError extends BlockchainError {
  constructor(
    message = 'Wallet operation failed',
    public walletAddress?: string,
  ) {
    super(message, 'WALLET_ERROR')
    this.name = 'WalletError'
  }
}

export class ExplorerError extends BlockchainError {
  constructor(message = 'Failed to load explorer data') {
    super(message, 'EXPLORER_ERROR')
    this.name = 'ExplorerError'
  }
}
