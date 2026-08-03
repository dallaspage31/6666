export const ROBINHOOD_CHAIN = {
  name: 'Robinhood Chain',
  testnet: {
    cluster: 'devnet',
    chainId: 0x6f82,
    rpcUrl: 'https://robinhood-chain-devnet.g.alchemy.com/v2/robinhood-devnet',
    wsUrl: 'wss://robinhood-chain-devnet.g.alchemy.com/v2/robinhood-devnet',
    explorerUrl: 'https://devnet.robinhood-chain.io',
  },
  mainnet: {
    cluster: 'mainnet-beta',
    chainId: 0x5a4d,
    rpcUrl: 'https://robinhood-chain-mainnet.g.alchemy.com/v2/robinhood-mainnet',
    wsUrl: 'wss://robinhood-chain-mainnet.g.alchemy.com/v2/robinhood-mainnet',
    explorerUrl: 'https://robinhood-chain.io',
  },
} as const

export type Cluster = 'devnet' | 'mainnet-beta'
export type ChainEnv = 'testnet' | 'mainnet'

export interface ChainConfig {
  cluster: Cluster
  chainId: number
  rpcUrl: string
  wsUrl: string
  explorerUrl: string
}
