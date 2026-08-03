'use client'

import { useCluster } from './cluster-context'
import { toast } from 'sonner'

export function ClusterSelect() {
  const { clusterInfo, switchTestnet, switchMainnet, isTestnet } = useCluster()

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-gray-400 font-medium hidden sm:block">Network:</span>
      <div className="flex items-center bg-gray-900 border border-gray-700 rounded-lg overflow-hidden">
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
        <div className="w-px h-5 bg-gray-700" />
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
      <div className="text-xs text-gray-500 font-mono hidden md:block">
        Chain: {clusterInfo.chainId}
      </div>
      <a
        href={clusterInfo.explorerUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="text-xs text-blue-400 hover:text-blue-300 underline hidden lg:inline"
      >
        Explorer
      </a>
    </div>
  )
}