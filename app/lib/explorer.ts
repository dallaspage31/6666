import { getChainConfig, DEFAULT_CHAIN, type ChainId } from './robinhood-chain'

export interface ExplorerLink {
  url: string
  label: string
}

function explorerLink(path: string, label: string, chainId?: string): ExplorerLink {
  const config = getChainConfig((chainId ?? DEFAULT_CHAIN) as ChainId)
  return {
    url: `${config.explorerUrl}/${path}`,
    label,
  }
}

export function transactionUrl(signature: string, chainId?: string): ExplorerLink {
  return explorerLink(`tx/${signature}`, 'View Transaction', chainId)
}

export function addressUrl(address: string, chainId?: string): ExplorerLink {
  return explorerLink(`address/${address}`, 'View Address', chainId)
}

export function blockUrl(slot: number, chainId?: string): ExplorerLink {
  return explorerLink(`block/${slot}`, 'View Block', chainId)
}

export function shorten(value: string, chars: number): string {
  return `${value.slice(0, chars)}...${value.slice(-chars)}`
}

export function shortenAddress(address: string, chars = 4): string {
  return shorten(address, chars)
}

export function shortenSignature(signature: string, chars = 6): string {
  return shorten(signature, chars)
}
