import { EffectConsumers } from './11-ability-effects.js';

export class DamageSystem {
  static compute(attacker, defender, isCrit = false) {
    let base = attacker.baseAttackDamage || 0;
    if (isCrit) base *= attacker.critDamage || 1.5;
    const armor = defender.armor || 0;
    const mitigated = Math.max(1, base - armor);
    return { base, mitigated, isCrit };
  }

  static apply(attacker, defender, skill) {
    const isCrit = Math.random() < (attacker.critChance || 0.05);
    const { mitigated } = this.compute(attacker, defender, isCrit);
    defender.hp -= mitigated;
    if (attacker.lifeSteal) {
      attacker.hp = Math.min(attacker.maxHp, attacker.hp + mitigated * attacker.lifeSteal);
    }
    return { damage: mitigated, isCrit, remainingHp: Math.max(0, defender.hp) };
  }

  static processEffects(state, caster, targets, effects) {
    const results = [];
    for (const effect of effects) {
      const consumer = EffectConsumers[effect.consumer];
      if (!consumer) continue;
      for (const t of targets) {
        const r = consumer(state, t, effect.amount || 0, effect.durationMs);
        results.push({ effect: effect.type, target: t.id, result: r });
      }
    }
    return results;
  }
}
