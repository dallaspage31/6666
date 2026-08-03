'use client'

import useSWR from 'swr'

interface PlayerData {
  id: string
  walletAddress: string
  username: string | null
  level: number
  xp: number
  gold: number
  robheroesBalance: number
  lastActive: string | null
  createdAt: string
}

interface PlayerState {
  player: PlayerData | null
  loading: boolean
  error: Error | null
  refetch: () => Promise<void>
}

async function fetchPlayerSession(): Promise<PlayerData> {
  const res = await fetch('/api/player/session')
  if (!res.ok) {
    throw new Error(`Failed to fetch player session: ${res.status}`)
  }
  return res.json()
}

export function usePlayer(): PlayerState {
  const { data, error, isLoading, mutate } = useSWR<PlayerData>(
    '/api/player/session',
    fetchPlayerSession,
  )

  return {
    player: data ?? null,
    loading: isLoading,
    error: error ?? null,
    refetch: () => mutate() as Promise<void>,
  }
}
