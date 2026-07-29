export class EffectConsumers {
  static damage(state, caster, target, effect) {
    const amount = effect.amount || 0;
    const dmg = Math.max(1, amount - (target.armor || 0));
    target.hp -= dmg;
    return dmg;
  }

  static heal(state, caster, target, effect) {
    const amount = effect.amount || 0;
    target.hp = Math.min(target.maxHp, target.hp + amount);
    return amount;
  }

  static buff(state, caster, target, effect) {
    if (!target.buffs) target.buffs = [];
    target.buffs.push({ field: effect.field, value: effect.value, expires: performance.now() + (effect.durationMs || 0) });
    return { field: effect.field, value: effect.value };
  }

  static status(state, caster, target, effect) {
    target.statuses = target.statuses || [];
    target.statuses.push({ status: effect.status, expires: performance.now() + (effect.durationMs || 0) });
    return { status: effect.status };
  }

  static projectile(state, caster, target, effect) {
    const count = effect.count || 1;
    return Array.from({ length: count }, () => ({ target, split: effect.split || 0, pierce: effect.pierce || 0, consumed: false }));
  }

  static summon(state, caster, effect) {
    const summon = { ...effect.unitDef, hp: effect.unitDef.hp, maxHp: effect.unitDef.hp };
    state.summins = state.summins || [];
    state.summons = state.summons || [];
    state.summons.push(summon);
    return summon;
  }
}
