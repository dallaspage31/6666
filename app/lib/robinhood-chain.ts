export type ChainId =
  | "robinhood-devnet"
  | "robinhood-mainnet"
  | "solana-devnet"
  | "solana-mainnet-beta";

export interface ChainConfig {
  chainId: ChainId;
  name: string;
  rpcUrl: string;
  wsUrl: string;
  explorerUrl: string;
  commitment: "processed" | "confirmed" | "finalized";
}

export const ROBINHOOD_CHAINS: Record<ChainId, ChainConfig> = {
  "robinhood-devnet": {
    chainId: "robinhood-devnet",
    name: "Robinhood Devnet",
    rpcUrl: "https://api.devnet.robinhood-chain.com",
    wsUrl: "wss://ws.devnet.robinhood-chain.com",
    explorerUrl: "https://explorer.devnet.robinhood-chain.com",
    commitment: "confirmed",
  },
  "robinhood-mainnet": {
    chainId: "robinhood-mainnet",
    name: "Robinhood Mainnet",
    rpcUrl: "https://api.mainnet.robinhood-chain.com",
    wsUrl: "wss://ws.mainnet.robinhood-chain.com",
    explorerUrl: "https://explorer.robinhood-chain.com",
    commitment: "finalized",
  },
  "solana-devnet": {
    chainId: "solana-devnet",
    name: "Solana Devnet",
    rpcUrl: "https://api.devnet.solana.com",
    wsUrl: "wss://ws.devnet.solana.com",
    explorerUrl: "https://explorer.solana.com",
    commitment: "confirmed",
  },
  "solana-mainnet-beta": {
    chainId: "solana-mainnet-beta",
    name: "Solana Mainnet Beta",
    rpcUrl: "https://api.mainnet-beta.solana.com",
    wsUrl: "wss://ws.mainnet-beta.solana.com",
    explorerUrl: "https://explorer.solana.com",
    commitment: "finalized",
  },
};

export const DEFAULT_CHAIN: ChainId = "robinhood-devnet";

export function getChainConfig(chainId: ChainId): ChainConfig {
  return ROBINHOOD_CHAINS[chainId];
}

export function isRobinhoodChain(chainId: ChainId): boolean {
  return chainId.startsWith("robinhood");
}
