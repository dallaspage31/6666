import { InfoCard, PageHeading } from '../../components/ui/panel'

export default function GameMechanicsDocs() {
  return (
    <div>
      <PageHeading
        title="Game Mechanics"
        description="Core systems that drive combat, progression, and inventory."
      />
      <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-2">
        <InfoCard
          title="Combat"
          description="Wave-based auto-battle with hero attacks, pet assists, and rune buffs."
        />
        <InfoCard
          title="Items & Equipment"
          description="Weapons, armor, and accessories with rarity tiers and set bonuses."
        />
        <InfoCard
          title="Pets"
          description="Companion system with passive and active abilities."
        />
        <InfoCard
          title="Runes"
          description="Socketable modifiers that enhance hero stats and abilities."
        />
        <InfoCard
          title="Crafting"
          description="Combine materials into equipment, upgrade runes, and fuse pets."
        />
        <InfoCard
          title="Progression"
          description="Hero levels, prestige ranks, and account-wide unlocks."
        />
      </div>
    </div>
  )
}
