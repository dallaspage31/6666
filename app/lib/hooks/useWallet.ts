'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { createWalletClient, custom, http } from 'viem'
import { toast } from 'sonner'
import { ROBINHOOD_CHAIN, ChainEnv } from '@/lib/robinhood-chain'

interface WalletState {
  connected: boolean
  chain: ChainEnv
  evmAddress: string | null
  solAddress: string | null
  chainId: number | null
  balance: bigint | null
  robheroesBalance: number
  connecting: boolean
  error: Error | null
  connect: () => Promise<void>
  disconnect: () => void
  switchChain: (env: ChainEnv) => void
  getTokenBalance: () => Promise<number>
}

export function useWallet(): WalletState {
  const [connected, setConnected] = useState(false)
  const [chain, setChain] = useState<ChainEnv>('mainnet')
  const [evmAddress, setEvmAddress] = useState<string | null>(null)
  const [solAddress, setSolAddress] = useState<string | null>(null)
  const [chainId, setChainId] = useState<number | null>(null)
  const [balance, setBalance] = useState<bigint | null>(null)
  const [robheroesBalance, setRobheroesBalance] = useState(0)
  const [connecting, setConnecting] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const evmAddressRef = useRef<string | null>(null)

  const config =
    chain === 'testnet' ? ROBINHOOD_CHAIN.testnet : ROBINHOOD_CHAIN.mainnet

  const getTokenBalance = useCallback(async () => {
    const addr = evmAddressRef.current
    if (!addr) return 0
    try {
      const client = createWalletClient({
        chain: {
          id: config.chainId,
          name: ROBINHOOD_CHAIN.name,
          nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
          rpcUrls: { default: { http: [config.rpcUrl] } },
        },
        transport: http(config.rpcUrl),
      })
      // @ts-ignore
      const bal = await client.readBalance({ address: addr as `0x${string}` })
      setBalance(bal)
      return Number(bal)
    } catch {
      return 0
    }
  }, [config])

  const connect = useCallback(async () => {
    setConnecting(true)
    setError(null)
    let hasEvmWallet = false

    try {
      if (
        typeof window !== 'undefined' &&
        (window as unknown as { ethereum?: unknown }).ethereum
      ) {
        const client = createWalletClient({
          chain: {
            id: config.chainId,
            name: ROBINHOOD_CHAIN.name,
            nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
            rpcUrls: { default: { http: [config.rpcUrl] } },
          },
          transport: custom(
            // @ts-ignore
            (window as unknown as { ethereum: unknown }).ethereum,
          ),
        })
        const accounts = await client.requestAddresses()
        if (accounts.length > 0) {
          setEvmAddress(accounts[0])
          evmAddressRef.current = accounts[0]
          setChainId(config.chainId)
          hasEvmWallet = true
        }
      }

      if (hasEvmWallet) {
        setConnected(true)
        toast.success(
          `EVM connected: ${evmAddressRef.current!.slice(0, 6)}...${evmAddressRef.current!.slice(-4)}`,
        )
      } else {
        toast.info('No wallet detected. Install MetaMask.')
      }
    } catch (err) {
      const e = err instanceof Error ? err : new Error(String(err))
      setError(e)
      toast.error(`Wallet connection failed: ${e.message}`)
    } finally {
      setConnecting(false)
    }
  }, [config])

  const disconnect = useCallback(() => {
    setConnected(false)
    setEvmAddress(null)
    evmAddressRef.current = null
    setSolAddress(null)
    setBalance(null)
    setRobheroesBalance(0)
    setChainId(null)
    toast.info('Wallet disconnected')
  }, [])

  const switchChain = useCallback((env: ChainEnv) => {
    setChain(env)
    const cfg =
      env === 'testnet' ? ROBINHOOD_CHAIN.testnet : ROBINHOOD_CHAIN.mainnet
    setChainId(cfg.chainId)
    toast.info(
      `Switched to ${env === 'testnet' ? 'Robinhood Chain Testnet' : 'Robinhood Chain Mainnet'}`,
    )
  }, [])

  useEffect(() => {
    const addr = evmAddressRef.current
    if (addr) {
      getTokenBalance()
    }
  }, [evmAddress, getTokenBalance])

  return {
    connected,
    chain,
    evmAddress,
    solAddress,
    chainId,
    balance,
    robheroesBalance,
    connecting,
    error,
    connect,
    disconnect,
    switchChain,
    getTokenBalance,
  }
}
