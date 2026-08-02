import { describe, expect, it } from 'vitest'

import { PET_DATABASE, getPetById, getPetCombatBonus } from './pets'

describe('PET_DATABASE', () => {
  it('has unique pet and ability ids', () => {
    const petIds = PET_DATABASE.map((pet) => pet.id)
    const abilityIds = PET_DATABASE.map((pet) => pet.ability.id)
    expect(new Set(petIds).size).toBe(petIds.length)
    expect(new Set(abilityIds).size).toBe(abilityIds.length)
  })

  it('starts every pet at level 1 with no xp', () => {
    for (const pet of PET_DATABASE) {
      expect(pet.level).toBe(1)
      expect(pet.xp).toBe(0)
    }
  })

  it('gives passive abilities no trigger chance or cooldown', () => {
    for (const pet of PET_DATABASE) {
      if (pet.ability.type === 'passive') {
        expect(pet.ability.triggerChance).toBe(0)
        expect(pet.ability.cooldown).toBe(0)
      } else {
        expect(pet.ability.triggerChance).toBeGreaterThan(0)
        expect(pet.ability.cooldown).toBeGreaterThan(0)
      }
    }
  })
})

describe('getPetById', () => {
  it('finds an existing pet', () => {
    expect(getPetById('pet_wolf')?.name).toBe('Iron Wolf')
  })

  it('returns undefined for an unknown id', () => {
    expect(getPetById('pet_nope')).toBeUndefined()
  })
})

describe('getPetCombatBonus', () => {
  it('maps the ability stat bonus onto the combat bonus', () => {
    const pet = getPetById('pet_dragon_hatchling')!
    expect(getPetCombatBonus(pet)).toEqual({
      petId: 'pet_dragon_hatchling',
      ownerId: '',
      atkBonus: 15,
      defBonus: 5,
      hpBonus: 20,
      spdBonus: 3,
    })
  })

  it('handles pets whose ability only boosts one stat', () => {
    const bonus = getPetCombatBonus(getPetById('pet_sparrow')!)
    expect(bonus.spdBonus).toBe(2)
    expect(bonus.atkBonus).toBe(0)
    expect(bonus.defBonus).toBe(0)
    expect(bonus.hpBonus).toBe(0)
  })
})
