'use client'

import { useConnection, useWallet } from '@solana/react'
import { useState } from 'react'

import { WalletError, getErrorMessage } from '../lib/errors'

export function WalletButton() {
  const { publicKey, connected, connecting, disconnect, connect } = useWallet()
  const { connection } = useConnection()
  const [error, setError] = useState<string | null>(null)

  const handleConnect = async () => {
    setError(null)
    try {
      await connect()
    } catch (err) {
      const walletError = new WalletError(
        `Failed to connect to wallet: ${getErrorMessage(err)}`,
        publicKey?.toString(),
        { cause: err },
      )
      console.error(walletError)
      setError(walletError.message)
    }
  }

  const handleDisconnect = async () => {
    setError(null)
    try {
      await disconnect()
    } catch (err) {
      const walletError = new WalletError(
        `Failed to disconnect wallet: ${getErrorMessage(err)}`,
        publicKey?.toString(),
        { cause: err },
      )
      console.error(walletError)
      setError(walletError.message)
    }
  }

  if (connected && publicKey) {
    return (
      <div className="flex items-center gap-3">
        <span className="text-xs font-mono text-gray-400">
          {publicKey.toString().slice(0, 4)}...{publicKey.toString().slice(-4)}
        </span>
        <button
          onClick={handleDisconnect}
          className="px-3 py-1.5 text-sm bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg transition-colors text-gray-300"
        >
          Disconnect
        </button>
        {error && <span className="text-xs text-red-400">{error}</span>}
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
