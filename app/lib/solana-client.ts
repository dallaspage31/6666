import { createSolanaRpc } from '@solana/kit'
import type { Address } from '@solana/addresses'
import type { Signature } from '@solana/keys'
import type { Base64EncodedWireTransaction } from '@solana/transactions'

import { getChainConfig, DEFAULT_CHAIN, ChainId } from './robinhood-chain'
import { SolanaConnectionError, TransactionError, getErrorMessage } from './errors'

export interface SolanaClientOptions {
  chainId?: ChainId
  commitment?: 'processed' | 'confirmed' | 'finalized'
}

export class SolanaClient {
  private rpc: ReturnType<typeof createSolanaRpc>
  private chainId: ChainId

  constructor(options: SolanaClientOptions = {}) {
    this.chainId = options.chainId ?? DEFAULT_CHAIN
    const config = getChainConfig(this.chainId)
    this.rpc = createSolanaRpc(config.rpcUrl)
  }

  getRpc(): ReturnType<typeof createSolanaRpc> {
    return this.rpc
  }

  getChainId(): ChainId {
    return this.chainId
  }

  private async request<T>(operation: string, run: () => Promise<T>): Promise<T> {
    try {
      return await run()
    } catch (error) {
      throw new SolanaConnectionError(
        `${operation} failed on ${this.chainId}: ${getErrorMessage(error)}`,
        { cause: error },
      )
    }
  }

  async getBalance(address: Address | string) {
    const addr = typeof address === 'string' ? (address as Address) : address
    return this.request('getBalance', () => this.rpc.getBalance(addr).send())
  }

  async getSlot() {
    return this.request('getSlot', () => this.rpc.getSlot().send())
  }

  async getBlockTime(slot: bigint) {
    return this.request('getBlockTime', () => this.rpc.getBlockTime(slot).send())
  }

  async getLatestBlockhash() {
    return this.request('getLatestBlockhash', () => this.rpc.getLatestBlockhash().send())
  }

  async sendTransaction(transaction: Base64EncodedWireTransaction) {
    try {
      return await this.rpc.sendTransaction(transaction).send()
    } catch (error) {
      throw new TransactionError(
        `Failed to send transaction on ${this.chainId}: ${getErrorMessage(error)}`,
        undefined,
        { cause: error },
      )
    }
  }

  async getSignatureStatuses(signatures: readonly Signature[]) {
    return this.request('getSignatureStatuses', () =>
      this.rpc.getSignatureStatuses(signatures).send(),
    )
  }
}

export function createSolanaClient(options?: SolanaClientOptions): SolanaClient {
  return new SolanaClient(options)
}
