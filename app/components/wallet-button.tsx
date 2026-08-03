'use client'

import { useSelectedWalletAccount } from '@solana/react'
import { useState } from 'react'

export function WalletButton() {
  const [selectedWalletAccount, setSelectedWalletAccount, _filteredWallets] =
    useSelectedWalletAccount()
  const [error, setError] = useState<string | null>(null)

  const handleDisconnect = () => {
    setSelectedWalletAccount(undefined)
    setError(null)
  }

  if (selectedWalletAccount) {
    const address = selectedWalletAccount.address
    return (
      <div className="flex items-center gap-3">
        <span className="text-xs font-mono text-gray-400">
          {address.slice(0, 4)}...{address.slice(-4)}
        </span>
        <button
          onClick={handleDisconnect}
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
        onClick={() => {
          setError('Wallet connection requires a wallet adapter provider')
        }}
        className="px-4 py-1.5 text-sm bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-400 hover:to-orange-400 text-black font-semibold rounded-lg transition-colors"
      >
        Connect Wallet
      </button>
      {error && <span className="text-xs text-red-400">{error}</span>}
    </div>
  )
}