import { ExplorerError } from './errors'
import { DEFAULT_CHAIN, getChainConfig, isChainId } from './robinhood-chain'
import type { ChainConfig } from './robinhood-chain'

export interface ExplorerLink {
  url: string
  label: string
}

function resolveConfig(chainId?: string): ChainConfig {
  if (chainId === undefined) return getChainConfig(DEFAULT_CHAIN)
  if (!isChainId(chainId)) {
    throw new ExplorerError(`Cannot build explorer link for unknown chain id: ${chainId}`)
  }
  return getChainConfig(chainId)
}

export function transactionUrl(signature: string, chainId?: string): ExplorerLink {
  const config = resolveConfig(chainId)
  return {
    url: `${config.explorerUrl}/tx/${signature}`,
    label: 'View Transaction',
  }
}

export function addressUrl(address: string, chainId?: string): ExplorerLink {
  const config = resolveConfig(chainId)
  return {
    url: `${config.explorerUrl}/address/${address}`,
    label: 'View Address',
  }
}

export function blockUrl(slot: number, chainId?: string): ExplorerLink {
  const config = resolveConfig(chainId)
  return {
    url: `${config.explorerUrl}/block/${slot}`,
    label: 'View Block',
  }
}

export function shortenAddress(address: string, chars = 4): string {
  return `${address.slice(0, chars)}...${address.slice(-chars)}`
}

export function shortenSignature(signature: string, chars = 6): string {
  return `${signature.slice(0, chars)}...${signature.slice(-chars)}`
}
