'use client'

import { useState } from 'react'
import type { ReactNode } from 'react'

interface TokenGateProps {
  requiredAmount: number
  tokenSymbol?: string
  children: ReactNode
  fallback?: ReactNode
}

export function TokenGate({
  requiredAmount,
  tokenSymbol = 'ROBHEROES',
  children,
  fallback,
}: TokenGateProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [hasAccess, setHasAccess] = useState(false)

  const handleVerify = async () => {
    setIsLoading(true)
    try {
      const res = await fetch('/api/token-balance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tokenSymbol, requiredAmount }),
      })
      const data = await res.json()
      setHasAccess(data.hasAccess ?? false)
    } catch {
      setHasAccess(false)
    } finally {
      setIsLoading(false)
    }
  }

  if (hasAccess) {
    return <>{children}</>
  }

  return (
    <div className="flex flex-col items-center justify-center p-8 bg-gray-900 border border-gray-800 rounded-lg">
      <div className="text-center mb-4">
        <span className="text-3xl mb-2 block">🔒</span>
        <h3 className="text-lg font-semibold text-gray-200">Token Required</h3>
        <p className="text-sm text-gray-400 mt-1">
          You need {requiredAmount} {tokenSymbol} to access this content
        </p>
      </div>
      {fallback && <div className="mb-4">{fallback}</div>}
      <button
        onClick={handleVerify}
        disabled={isLoading}
        className="px-4 py-2 text-sm bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg transition-colors text-gray-300 disabled:opacity-50"
      >
        {isLoading ? 'Verifying...' : 'Verify Token Ownership'}
      </button>
    </div>
  )
}