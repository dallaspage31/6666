'use client'

import { useConnection, useWallet } from '@solana/react'
import { useState } from 'react'

export function WalletButton() {
  const { publicKey, connected, connecting, disconnect, connect } = useWallet()
  const { connection } = useConnection()
  const [error, setError] = useState<string | null>(null)

  const handleConnect = async () => {
    setError(null)
    try {
      await connect()
    } catch {
      setError('Failed to connect to wallet')
    }
  }

  if (connected && publicKey) {
    return (
      <div className="flex items-center gap-3">
        <span className="text-xs font-mono text-gray-400">
          {publicKey.toString().slice(0, 4)}...{publicKey.toString().slice(-4)}
        </span>
        <button
          onClick={disconnect}
          className="px-3 py-1.5 text-sm bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg transition-colors text-gray-300"
        >
          Disconnect
        </button>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-3">
      <button
        onClick={handleConnect}
        disabled={connecting}
        className="px-4 py-1.5 text-sm bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-400 hover:to-orange-400 text-black font-semibold rounded-lg transition-colors disabled:opacity-50"
      >
        {connecting ? 'Connecting...' : 'Connect Wallet'}
      </button>
      {error && <span className="text-xs text-red-400">{error}</span>}
    </div>
  )
}
