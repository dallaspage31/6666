'use client'

import { useCluster } from './cluster-context'
import { toast } from 'sonner'

export function ClusterSelect() {
  const { clusterInfo, switchTestnet, switchMainnet, isTestnet } = useCluster()

  return (
    <div className="flex items-center gap-2">
      <span className="hidden text-sm font-medium text-gray-400 sm:block">
        Network:
      </span>
      <div className="flex items-center overflow-hidden rounded-lg border border-gray-700 bg-gray-900">
        <button
          onClick={switchTestnet}
          className={`px-3 py-1.5 text-sm font-medium transition-colors ${
            isTestnet
              ? 'bg-blue-600 text-white'
              : 'text-gray-400 hover:bg-gray-800 hover:text-gray-200'
          }`}
        >
          Devnet
        </button>
        <div className="h-5 w-px bg-gray-700" />
        <button
          onClick={switchMainnet}
          className={`px-3 py-1.5 text-sm font-medium transition-colors ${
            !isTestnet
              ? 'bg-green-600 text-white'
              : 'text-gray-400 hover:bg-gray-800 hover:text-gray-200'
          }`}
        >
          Mainnet
        </button>
      </div>
      <div className="hidden font-mono text-xs text-gray-500 md:block">
        Chain: {clusterInfo.chainId}
      </div>
      <a
        href={clusterInfo.explorerUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="hidden text-xs text-blue-400 underline hover:text-blue-300 lg:inline"
      >
        Explorer
      </a>
    </div>
  )
}
