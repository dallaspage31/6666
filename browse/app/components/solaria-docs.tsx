'use client';

import { useState } from 'react';

type SectionKey =
  | 'heroes'
  | 'rarity'
  | 'equipment'
  | 'runes'
  | 'crafting'
  | 'market'
  | 'difficulty';

interface Section {
  key: SectionKey;
  label: string;
  icon: string;
}

const SECTIONS: Section[] = [
  { key: 'heroes', label: 'Hero Classes', icon: '⚔️' },
  { key: 'rarity', label: 'Rarity Tiers', icon: '💎' },
  { key: 'equipment', label: 'Equipment Slots', icon: '🛡️' },
  { key: 'runes', label: 'Rune Trees', icon: '🌿' },
  { key: 'crafting', label: 'Crafting Guide', icon: '🔨' },
  { key: 'market', label: 'Market Pricing', icon: '💰' },
  { key: 'difficulty', label: 'Difficulty Tiers', icon: '🔥' },
];

const HERO_CLASSES = [
  {
    name: 'Knight',
    role: 'Tank',
    color: 'border-blue-400',
    hp: 120,
    attack: 35,
    defense: 55,
    speed: 20,
    abilities: [
      { name: 'Shield Wall', desc: 'Block 80% damage for 2 turns' },
      { name: 'Threaten', desc: 'Force enemies to target you' },
      { name: 'Counterstrike', desc: 'Reflect 40% of melee damage' },
    ],
  },
  {
    name: 'Mage',
    role: 'Ranged DPS',
    color: 'border-purple-400',
    hp: 70,
    attack: 60,
    defense: 20,
    speed: 35,
    abilities: [
      { name: 'Arcane Blast', desc: 'AoE magic damage scaling with INT' },
      { name: 'Mana Shield', desc: 'Absorb damage using MP' },
      { name: 'Time Warp', desc: 'Skip next enemy turn' },
    ],
  },
  {
    name: 'Archer',
    role: 'Physical DPS',
    color: 'border-green-400',
    hp: 80,
    attack: 55,
    defense: 25,
    speed: 55,
    abilities: [
      { name: 'Piercing Shot', desc: 'Ignore 50% armor' },
      { name: 'Volley', desc: '3-hit multi-target attack' },
      { name: 'Evasion', desc: 'Dodge next incoming attack' },
    ],
  },
  {
    name: 'Priest',
    role: 'Healer / Support',
    color: 'border-yellow-400',
    hp: 75,
    attack: 30,
    defense: 30,
    speed: 40,
    abilities: [
      { name: 'Holy Heal', desc: 'Restore 40% max HP to one ally' },
      { name: 'Divine Shield', desc: 'Immunity for 1 turn' },
      { name: 'Cleanse', desc: 'Remove all debuffs from party' },
    ],
  },
  {
    name: 'Assassin',
    role: 'Burst DPS',
    color: 'border-red-400',
    hp: 65,
    attack: 65,
    defense: 15,
    speed: 65,
    abilities: [
      { name: 'Backstab', desc: '300% damage from stealth' },
      { name: 'Smoke Bomb', desc: 'Become untargetable 1 turn' },
      { name: 'Execute', desc: 'Kill targets below 20% HP' },
    ],
  },
];

const RARITY_TIERS = [
  { tier: 'Common', multiplier: '1.0x', color: 'bg-gray-500', textColor: 'text-gray-300', desc: 'Basic equipment. Found frequently in early acts.' },
  { tier: 'Uncommon', multiplier: '1.3x', color: 'bg-green-600', textColor: 'text-green-300', desc: 'Slightly enhanced stats. Common drops after Act 1.' },
  { tier: 'Rare', multiplier: '1.7x', color: 'bg-blue-600', textColor: 'text-blue-300', desc: 'Strong stats with one secondary bonus. Act 2+ drops.' },
  { tier: 'Epic', multiplier: '2.2x', color: 'bg-purple-600', textColor: 'text-purple-300', desc: 'High base stats with two bonuses. Act 5+ and boss drops.' },
  { tier: 'Legendary', multiplier: '3.0x', color: 'bg-orange-600', textColor: 'text-orange-300', desc: 'Very high stats with set bonus potential. Nightmare mode.' },
  { tier: 'Cosmic', multiplier: '5.0x', color: 'bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-500', textColor: 'text-white', desc: 'Peak rarity. Unique effects. Cube Synthesis only.' },
];

const EQUIPMENT_SLOTS = [
  { slot: 'Weapon', stat: 'ATK +10~50', icon: '⚔️', desc: 'Primary damage source. All classes benefit.' },
  { slot: 'Helmet', stat: 'DEF +5~25, HP +20~100', icon: '🪖', desc: 'Head protection. Adds HP and armor.' },
  { slot: 'Armor', stat: 'DEF +15~60, HP +50~200', icon: '🛡️', desc: 'Body armor. Highest DEF contribution.' },
  { slot: 'Gloves', stat: 'ATK +3~15, SPD +2~10', icon: '🧤', desc: 'Hand protection. Adds crit chance.' },
  { slot: 'Boots', stat: 'SPD +5~25, DEF +3~12', icon: '👢', desc: 'Footwear. Evasion and movement.' },
  { slot: 'Belt', stat: 'HP +30~120, DEF +2~8', icon: '🪢', desc: 'Waist slot. HP sustain bonus.' },
  { slot: 'Ring', stat: 'ATK +2~10, MAG +2~10', icon: '💍', desc: 'Accessory. Balanced stat boost.' },
  { slot: 'Amulet', stat: 'HP +20~80, MP +20~80', icon: '📿', desc: 'Neck slot. Resource pool bonus.' },
  { slot: 'Cape', stat: 'DEF +3~15, SPD +2~8', icon: '🧣', desc: 'Back slot. Utility and defense.' },
  { slot: 'Artifact', stat: 'All +5~15', icon: '✨', desc: 'Special slot. Small boost to all stats.' },
];

const RUNE_TREES = {
  Power: {
    color: 'text-red-400 border-red-500',
    desc: 'Offensive runes increasing raw damage output.',
    runes: [
      { name: 'Berserker', bonus: '+25% ATK, -10% DEF' },
      { name: 'Sniper', bonus: '+30% Crit Chance' },
      { name: 'Executioner', bonus: '+50% damage below 30% HP' },
      { name: 'Blade Master', bonus: '+20% attack speed' },
    ],
  },
  Defense: {
    color: 'text-blue-400 border-blue-500',
    desc: 'Defensive runes improving survivability.',
    runes: [
      { name: 'Fortress', bonus: '+40% DEF, -5% SPD' },
      { name: 'Regeneration', bonus: '+5% HP per turn' },
      { name: 'Iron Will', bonus: 'Reduce damage by 20%' },
      { name: 'Last Stand', bonus: 'Survive 1 HP once per battle' },
    ],
  },
  Growth: {
    color: 'text-green-400 border-green-500',
    desc: 'Utility runes providing scaling bonuses.',
    runes: [
      { name: 'Vampirism', bonus: 'Heal 15% of damage dealt' },
      { name: 'Adrenaline', bonus: '+SPD as battle continues' },
      { name: 'Treasure Hunter', bonus: '+20% gold and loot' },
      { name: 'Echo', bonus: 'Skills hit twice 10% chance' },
    ],
  },
};

const CRAFTING_OPERATIONS = [
  {
    name: 'Synthesis',
    icon: '🔮',
    desc: 'Combine 9 items of the same rarity to upgrade one item to the next rarity tier. Higher rarity items cost more gold.成功率 scales with item level.',
    cost: 'Gold: 500 × rarity tier',
    result: '1 item of next rarity',
  },
  {
    name: 'Recycle',
    icon: '♻️',
    desc: 'Break down unwanted equipment into component materials. Rewards are randomly distributed: 60% equipment shards, 20% crafting materials, 12% gems, 8% engraving stones.',
    cost: 'Free',
    result: 'Random crafting components',
  },
  {
    name: 'Crafting',
    icon: '🔨',
    desc: 'Use crafting materials to create new equipment. Select slot type and rarity tier. Higher tiers require rare materials from late-game content.',
    cost: 'Materials + Gold',
    result: 'New equipment piece',
  },
  {
    name: 'Socketing',
    icon: '💎',
    desc: 'Add gems to equipment sockets for stat bonuses. Gems can be removed and swapped at no cost. Engraving slots provide unique passive effects.',
    cost: 'Gems + Gold',
    result: 'Enhanced equipment',
  },
];

const MARKET_PRICING = [
  { item: 'Mythic Hero Chest', price: '1,500,000', token: 'ROBHEROES', usd: '$1.50', desc: 'Guaranteed Mythic rarity hero.' },
  { item: 'Astral Hero Chest', price: '3,000,000', token: 'ROBHEROES', usd: '$3.00', desc: 'Guaranteed Astral rarity hero.' },
  { item: 'Cosmic Hero Chest', price: '4,500,000', token: 'ROBHEROES', usd: '$4.50', desc: 'Guaranteed Cosmic rarity hero.' },
  { item: 'Legendary Equipment', price: '500,000', token: 'ROBHEROES', usd: '$0.50', desc: 'Random Legendary slot item.' },
  { item: 'Epic Equipment', price: '150,000', token: 'ROBHEROES', usd: '$0.15', desc: 'Random Epic slot item.' },
];

const DIFFICULTY_TIERS = [
  {
    name: 'Adventurer',
    color: 'text-green-400 border-green-500',
    recommendedLevel: '1-30',
    desc: 'Standard difficulty for new players. Enemies have normal stats and AI. Rewards are scaled for solo play. Ideal for learning mechanics.',
    rewards: 'Common–Rare gear, basic materials',
    bosses: 'Standard boss patterns',
  },
  {
    name: 'Veteran',
    color: 'text-yellow-400 border-yellow-500',
    recommendedLevel: '30-70',
    desc: 'Increased enemy HP and damage. Enemies use advanced abilities. Rewards include Epic items and rare crafting materials. Requires coordinated team play.',
    rewards: 'Rare–Epic gear, rare materials',
    bosses: 'Enraged patterns, adds',
  },
  {
    name: 'Nightmare',
    color: 'text-red-400 border-red-500',
    recommendedLevel: '70+',
    desc: 'Extreme challenge. Enemies deal double damage and have immunity phases. Only for fully optimized teams. Drops Legendary and Cosmic items with set bonuses.',
    rewards: 'Epic–Cosmic gear, set pieces',
    bosses: 'Mechanic-heavy, multiple phases',
  },
];

function Chevron({ open }: { open: boolean }) {
  return (
    <svg
      className={`w-5 h-5 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
    </svg>
  );
}

function CollapsibleSection({
  children,
  isOpen,
  onToggle,
  title,
  icon,
}: {
  children: React.ReactNode;
  isOpen: boolean;
  onToggle: () => void;
  title: string;
  icon: string;
}) {
  return (
    <div className="border border-gray-700 rounded-lg overflow-hidden mb-3">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-4 py-3 bg-gray-800 hover:bg-gray-750 transition-colors"
      >
        <span className="flex items-center gap-2 text-gray-100 font-semibold">
          <span>{icon}</span>
          {title}
        </span>
        <Chevron open={isOpen} />
      </button>
      {isOpen && (
        <div className="p-4 bg-gray-900 border-t border-gray-700">
          {children}
        </div>
      )}
    </div>
  );
}

export default function SolariaDocs() {
  const [openSections, setOpenSections] = useState<Record<SectionKey, boolean>>({
    heroes: false,
    rarity: false,
    equipment: false,
    runes: false,
    crafting: false,
    market: false,
    difficulty: false,
  });

  const toggleSection = (key: SectionKey) => {
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="w-full max-w-3xl mx-auto p-4 bg-gray-950 text-gray-100 font-sans">
      <div className="text-center mb-6">
        <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-500 mb-1">
          Solaria Codex
        </h1>
        <p className="text-gray-400 text-sm">In-game documentation and reference guide</p>
      </div>

      <div className="space-y-2">
        {SECTIONS.map((section) => (
          <CollapsibleSection
            key={section.key}
            title={section.label}
            icon={section.icon}
            isOpen={openSections[section.key]}
            onToggle={() => toggleSection(section.key)}
          >
            {section.key === 'heroes' && (
              <div className="grid gap-3">
                {HERO_CLASSES.map((hero) => (
                  <div key={hero.name} className={`border ${hero.color} rounded p-3 bg-gray-800`}>
                    <div className="flex justify-between items-center mb-2">
                      <h3 className="font-bold text-lg">{hero.name}</h3>
                      <span className="text-xs text-gray-400">{hero.role}</span>
                    </div>
                    <div className="flex gap-4 text-sm mb-2">
                      <span className="text-red-400">HP: {hero.hp}</span>
                      <span className="text-orange-400">ATK: {hero.attack}</span>
                      <span className="text-blue-400">DEF: {hero.defense}</span>
                      <span className="text-green-400">SPD: {hero.speed}</span>
                    </div>
                    <div className="space-y-1">
                      {hero.abilities.map((ability) => (
                        <div key={ability.name} className="text-sm">
                          <span className="text-yellow-400 font-medium">{ability.name}:</span>{' '}
                          <span className="text-gray-300">{ability.desc}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {section.key === 'rarity' && (
              <div className="space-y-2">
                {RARITY_TIERS.map((rarity) => (
                  <div key={rarity.tier} className="flex items-center gap-3 p-2 bg-gray-800 rounded">
                    <div className={`w-3 h-3 rounded-full ${rarity.color}`} />
                    <div className="flex-1">
                      <div className="flex justify-between items-center">
                        <span className={`font-semibold ${rarity.textColor}`}>{rarity.tier}</span>
                        <span className="text-sm text-gray-400">{rarity.multiplier}</span>
                      </div>
                      <p className="text-xs text-gray-400 mt-0.5">{rarity.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {section.key === 'equipment' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {EQUIPMENT_SLOTS.map((eq) => (
                  <div key={eq.slot} className="flex items-start gap-3 p-2 bg-gray-800 rounded border border-gray-700">
                    <span className="text-xl">{eq.icon}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-center">
                        <span className="font-medium text-sm">{eq.slot}</span>
                        <span className="text-xs text-yellow-400">{eq.stat}</span>
                      </div>
                      <p className="text-xs text-gray-400 mt-0.5">{eq.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {section.key === 'runes' && (
              <div className="space-y-4">
                {Object.entries(RUNE_TREES).map(([treeName, tree]) => (
                  <div key={treeName} className={`border ${tree.color} rounded p-3 bg-gray-800`}>
                    <h3 className="font-bold mb-1">{treeName} Tree</h3>
                    <p className="text-sm text-gray-400 mb-2">{tree.desc}</p>
                    <div className="space-y-1">
                      {tree.runes.map((rune) => (
                        <div key={rune.name} className="flex justify-between text-sm">
                          <span className="text-gray-300">{rune.name}</span>
                          <span className="text-gray-400">{rune.bonus}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {section.key === 'crafting' && (
              <div className="space-y-3">
                {CRAFTING_OPERATIONS.map((op) => (
                  <div key={op.name} className="border border-gray-700 rounded p-3 bg-gray-800">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xl">{op.icon}</span>
                      <h3 className="font-bold">{op.name}</h3>
                    </div>
                    <p className="text-sm text-gray-300 mb-2">{op.desc}</p>
                    <div className="flex gap-4 text-xs text-gray-400">
                      <span>Cost: {op.cost}</span>
                      <span>Result: {op.result}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {section.key === 'market' && (
              <div className="space-y-2">
                {MARKET_PRICING.map((item) => (
                  <div key={item.item} className="flex items-center justify-between p-2 bg-gray-800 rounded border border-gray-700">
                    <div>
                      <div className="font-medium text-sm">{item.item}</div>
                      <div className="text-xs text-gray-400">{item.desc}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-yellow-400 font-mono text-sm">{item.price} {item.token}</div>
                      <div className="text-xs text-gray-500">{item.usd}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {section.key === 'difficulty' && (
              <div className="space-y-3">
                {DIFFICULTY_TIERS.map((tier) => (
                  <div key={tier.name} className={`border ${tier.color} rounded p-3 bg-gray-800`}>
                    <div className="flex justify-between items-center mb-1">
                      <h3 className="font-bold">{tier.name}</h3>
                      <span className="text-xs text-gray-400">Lv. {tier.recommendedLevel}</span>
                    </div>
                    <p className="text-sm text-gray-300 mb-2">{tier.desc}</p>
                    <div className="flex gap-4 text-xs text-gray-400">
                      <span>Rewards: {tier.rewards}</span>
                      <span>Bosses: {tier.bosses}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CollapsibleSection>
        ))}
      </div>
    </div>
  );
}
