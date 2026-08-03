export interface XpEntry {
  level: number
  xpRequired: number
  totalXp: number
}

export const XP_TABLE: XpEntry[] = []
for (let i = 1; i <= 100; i++) {
  const xpRequired = Math.floor(100 * Math.pow(1.15, i - 1))
  const totalXp = i === 1 ? 0 : XP_TABLE[i - 2].totalXp + XP_TABLE[i - 2].xpRequired
  XP_TABLE.push({ level: i, xpRequired, totalXp })
}

export function getXpForLevel(level: number): number {
  if (level <= 1) return 0
  return XP_TABLE[level - 2]?.totalXp ?? 0
}

export function getLevelFromXp(xp: number): number {
  for (let i = XP_TABLE.length - 1; i >= 0; i--) {
    if (xp >= XP_TABLE[i].totalXp) {
      return XP_TABLE[i].level
    }
  }
  return 1
}

export function getXpProgress(level: number, currentXp: number): number {
  if (level >= XP_TABLE.length) return 100
  const entry = XP_TABLE[level - 1]
  if (!entry) return 0
  const needed = entry.xpRequired
  if (needed <= 0) return 100
  return Math.min(100, Math.max(0, ((currentXp - entry.totalXp) / needed) * 100))
}

export interface PrestigeRank {
  rank: number
  name: string
  xpBonus: number
  goldBonus: number
  requiredPrestige: number
}

export const PRESTIGE_RANKS: PrestigeRank[] = [
  { rank: 1, name: 'Novice', xpBonus: 0.05, goldBonus: 0.05, requiredPrestige: 0 },
  { rank: 2, name: 'Adept', xpBonus: 0.1, goldBonus: 0.1, requiredPrestige: 1 },
  { rank: 3, name: 'Expert', xpBonus: 0.15, goldBonus: 0.15, requiredPrestige: 3 },
  { rank: 4, name: 'Master', xpBonus: 0.2, goldBonus: 0.2, requiredPrestige: 6 },
  { rank: 5, name: 'Grandmaster', xpBonus: 0.25, goldBonus: 0.25, requiredPrestige: 10 },
  { rank: 6, name: 'Legend', xpBonus: 0.3, goldBonus: 0.3, requiredPrestige: 15 },
  { rank: 7, name: 'Mythic', xpBonus: 0.4, goldBonus: 0.4, requiredPrestige: 25 },
  { rank: 8, name: 'Astral', xpBonus: 0.5, goldBonus: 0.5, requiredPrestige: 40 },
  { rank: 9, name: 'Cosmic', xpBonus: 0.65, goldBonus: 0.65, requiredPrestige: 60 },
  { rank: 10, name: 'Transcendent', xpBonus: 0.8, goldBonus: 0.8, requiredPrestige: 100 },
]
