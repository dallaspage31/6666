export class EffectConsumers {
  static damage(state, target, amount) {
    const dmg = Math.max(1, amount - (target.armor || 0));
    target.hp -= dmg;
    return dmg;
  }

  static heal(state, target, amount) {
    target.hp = Math.min(target.maxHp, target.hp + amount);
    return amount;
  }

  static buff(state, target, field, value, durationMs) {
    if (!target.buffs) target.buffs = [];
    target.buffs.push({ field, value, expires: performance.now() + durationMs });
  }

  static status(state, target, status, durationMs) {
    target.statuses = target.statuses || [];
    target.statuses.push({ status, expires: performance.now() + durationMs });
  }

  static projectile(state, target, count, split = 0, pierce = 0) {
    return Array.from({ length: count }, () => ({ target, split, pierce, consumed: false }));
  }

  static summon(state, unitDef) {
    const summon = { ...unitDef, hp: unitDef.hp, maxHp: unitDef.hp };
    state.summins = state.summins || [];
    state.summins.push(summon);
    return summon;
  }
}
