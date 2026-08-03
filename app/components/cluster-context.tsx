'use client'

import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from 'react'
import {
  ROBINHOOD_CHAIN,
  ChainEnv,
  Cluster,
  type ChainConfig,
} from '@/lib/robinhood-chain'
import { toast } from 'sonner'

interface ClusterInfo {
  env: ChainEnv
  cluster: Cluster
  chainId: number
  rpcUrl: string
  wsUrl: string
  explorerUrl: string
}

interface ClusterContextValue {
  clusterInfo: ClusterInfo
  setCluster: (env: ChainEnv) => void
  isTestnet: boolean
  switchTestnet: () => void
  switchMainnet: () => void
}

const ClusterContext = createContext<ClusterContextValue | null>(null)

function getClusterInfo(env: ChainEnv): ClusterInfo {
  const cfg =
    env === 'testnet' ? ROBINHOOD_CHAIN.testnet : ROBINHOOD_CHAIN.mainnet
  return {
    env,
    cluster: cfg.cluster,
    chainId: cfg.chainId,
    rpcUrl: cfg.rpcUrl,
    wsUrl: cfg.wsUrl,
    explorerUrl: cfg.explorerUrl,
  }
}

export function ClusterProvider({ children }: { children: ReactNode }) {
  const [env, setEnv] = useState<ChainEnv>('mainnet')
  const clusterInfo = getClusterInfo(env)

  const setCluster = useCallback((newEnv: ChainEnv) => {
    setEnv(newEnv)
    toast.info(
      `Network switched to ${newEnv === 'testnet' ? 'Devnet' : 'Mainnet'}`,
    )
  }, [])

  const switchTestnet = useCallback(() => setCluster('testnet'), [setCluster])
  const switchMainnet = useCallback(() => setCluster('mainnet'), [setCluster])

  const value: ClusterContextValue = {
    clusterInfo,
    setCluster,
    isTestnet: env === 'testnet',
    switchTestnet,
    switchMainnet,
  }

  return (
    <ClusterContext.Provider value={value}>{children}</ClusterContext.Provider>
  )
}

export function useCluster(): ClusterContextValue {
  const ctx = useContext(ClusterContext)
  if (!ctx) {
    throw new Error('useCluster must be used within a ClusterProvider')
  }
  return ctx
}
