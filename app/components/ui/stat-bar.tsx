export type StatKind = 'atk' | 'def' | 'hp'

const STAT_STYLES: Record<StatKind, { label: string; text: string; fill: string; max: number }> = {
  atk: { label: 'ATK', text: 'text-orange-400', fill: 'bg-orange-500', max: 50 },
  def: { label: 'DEF', text: 'text-blue-400', fill: 'bg-blue-500', max: 50 },
  hp: { label: 'HP', text: 'text-green-400', fill: 'bg-green-500', max: 100 },
}

export function StatBar({ kind, value }: { kind: StatKind; value: number }) {
  const style = STAT_STYLES[kind]

  return (
    <div className="flex items-center gap-2 text-sm">
      <span className={`${style.text} font-semibold w-8`}>{style.label}</span>
      <div className="flex-1 h-2 bg-gray-800 rounded-full overflow-hidden">
        <div
          className={`h-full ${style.fill} rounded-full transition-all duration-500`}
          style={{ width: `${Math.min((value / style.max) * 100, 100)}%` }}
        />
      </div>
      <span className={`${style.text} font-mono text-xs w-8 text-right`}>+{value}</span>
    </div>
  )
}
