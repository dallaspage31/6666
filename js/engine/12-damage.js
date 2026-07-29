import { EffectConsumers } from './11-ability-effects.js';

import { BigIntDecimal } from './00-bigint.js';

export class DamageSystem {
  static compute(attacker, defender, isCrit = false) {
    const base = new BigIntDecimal(attacker.baseAttackDamage || 0);
    let final = base;
    if (isCrit) final = final.mul(attacker.critDamage || 1.5);
    const armor = new BigIntDecimal(defender.armor || 0);
    const mitigated = final.sub(armor).max(new BigIntDecimal(1));
    return { base: base.toNumber(), mitigated: mitigated.toNumber(), isCrit };
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
