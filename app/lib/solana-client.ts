import { createSolanaRpc } from '@solana/kit'
import type { Address } from '@solana/addresses'
import type { Signature } from '@solana/keys'
import type { Base64EncodedWireTransaction } from '@solana/transactions'

import { getChainConfig, DEFAULT_CHAIN, ChainId } from './robinhood-chain'

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

  async getBalance(address: Address | string) {
    const addr = typeof address === 'string' ? (address as Address) : address
    return this.rpc.getBalance(addr).send()
  }

  async getSlot() {
    return this.rpc.getSlot().send()
  }

  async getBlockTime(slot: bigint) {
    return this.rpc.getBlockTime(slot).send()
  }

  async getLatestBlockhash() {
    return this.rpc.getLatestBlockhash().send()
  }

  async sendTransaction(transaction: Base64EncodedWireTransaction) {
    return this.rpc.sendTransaction(transaction).send()
  }

  async getSignatureStatuses(signatures: readonly Signature[]) {
    return this.rpc.getSignatureStatuses(signatures).send()
  }
}

export function createSolanaClient(
  options?: SolanaClientOptions,
): SolanaClient {
  return new SolanaClient(options)
}
