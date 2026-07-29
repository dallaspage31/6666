import { ForgeTokens } from '../../js/engine/15-forge-tokens.js';

export class ForgeTokenTests {
  static run() {
    const results = [];
    const assert = (name, fn) => {
      try {
        const pass = fn();
        results.push({ name, pass });
      } catch (e) {
        results.push({ name, pass: false, error: e.message });
      }
    };

    const state = {
      forgeEconomy: { tokens: '0', lifetimeMinted: '0', mintRemainder: 0 },
      hero: { gold: 25500 },
    };
    const ft = new ForgeTokens(state);

    assert('forge_token_manual_mint', () => {
      const r = ft.mint(25500);
      return r && r.tokens === 2 && r.remainder === 5500 && state.forgeEconomy.tokens === '2';
    });

    assert('forge_token_settlement_carries_remainder', () => {
      const before = state.forgeEconomy.mintRemainder;
      state.hero.gold = 9500;
      const r = ft.settleAscension();
      return r.tokens === 1 && state.forgeEconomy.mintRemainder === 500;
    });

    assert('forge_token_big_number', () => {
      state.forgeEconomy.tokens = '99999999999999999999';
      const r = ft.mint(10000);
      return r && r.tokens === 1 && state.forgeEconomy.tokens === '100000000000000000000';
    });

    return results;
  }
}
