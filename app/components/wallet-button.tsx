'use client'

import { useState } from 'react'

export function WalletButton() {
  const [connecting, setConnecting] = useState(false)
  const [error] = useState<string | null>(null)

  const handleConnect = async () => {
    setConnecting(true)
    try {
      // Wallet connection requires a configured Solana wallet provider.
      // Reserved for future integration with @solana/kit-plugin-wallet/react.
      await new Promise((resolve) => setTimeout(resolve, 500))
    } finally {
      setConnecting(false)
    }
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
