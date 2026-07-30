export const LAMPORTS_PER_SOL = BigInt(1000000000)

export function solToLamports(sol: number | bigint): bigint {
  if (typeof sol === 'bigint') {
    return sol * LAMPORTS_PER_SOL
  }
  return BigInt(Math.floor(sol * Number(LAMPORTS_PER_SOL)))
}

export function lamportsToSol(lamports: number | bigint): number {
  if (typeof lamports === 'bigint') {
    return Number(lamports) / Number(LAMPORTS_PER_SOL)
  }
  return lamports / Number(LAMPORTS_PER_SOL)
}

export function formatSol(sol: number | bigint, decimals = 4): string {
  const value = typeof sol === 'bigint' ? Number(sol) : sol
  return value.toFixed(decimals)
}

export function formatLamports(lamports: number | bigint, decimals = 2): string {
  return formatSol(lamportsToSol(lamports), decimals)
}
