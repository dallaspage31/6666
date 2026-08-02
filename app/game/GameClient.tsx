'use client'

import dynamic from 'next/dynamic'

const BattleGame = dynamic(() => import('./BattleGame'), { ssr: false })

export default function GameClient() {
  return (
    <div className="h-[calc(100vh-8rem)] w-full">
      <BattleGame />
    </div>
  )
}
