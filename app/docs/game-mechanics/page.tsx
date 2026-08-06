export default function GameMechanicsDocs() {
  return (
    <div>
      <h1 className="text-3xl font-bold text-white">Game Mechanics</h1>
      <p className="mt-2 text-gray-400">
        Core systems that drive combat, progression, and inventory.
      </p>
      <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-2">
        <MechanicsCard
          title="Combat"
          description="Wave-based auto-battle with hero attacks, pet assists, and rune buffs."
        />
        <MechanicsCard
          title="Items & Equipment"
          description="Weapons, armor, and accessories with rarity tiers and set bonuses."
        />
        <MechanicsCard
          title="Pets"
          description="Companion system with passive and active abilities."
        />
        <MechanicsCard
          title="Runes"
          description="Socketable modifiers that enhance hero stats and abilities."
        />
        <MechanicsCard
          title="Crafting"
          description="Combine materials into equipment, upgrade runes, and fuse pets."
        />
        <MechanicsCard
          title="Progression"
          description="Hero levels, prestige ranks, and account-wide unlocks."
        />
      </div>
    </div>
  )
}

function MechanicsCard({
  title,
  description,
}: {
  title: string
  description: string
}) {
  return (
    <div className="rounded-lg border border-gray-800 bg-gray-900 p-6">
      <h3 className="text-lg font-semibold text-white">{title}</h3>
      <p className="mt-2 text-sm text-gray-400">{description}</p>
    </div>
  )
}
