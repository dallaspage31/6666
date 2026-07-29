import { GameState } from './02-state.js';

const RATIO = 10000;

export class ForgeTokens {
  constructor(state) {
    this.state = state;
  }

  mint(amount) {
    const safe = Math.floor(amount);
    const tokens = Math.floor(safe / RATIO);
    const remainder = safe % RATIO;
    if (tokens <= 0) return null;

    this.state.forgeEconomy.tokens = this.addStrings(this.state.forgeEconomy.tokens, String(tokens));
    this.state.forgeEconomy.lifetimeMinted = this.addStrings(this.state.forgeEconomy.lifetimeMinted, String(tokens));
    this.state.forgeEconomy.mintRemainder += remainder;
    return { tokens, remainder, newTotal: this.state.forgeEconomy.tokens };
  }

  previewMint(amount) {
    const safe = Math.floor(amount);
    const tokens = Math.floor(safe / RATIO);
    const remainder = safe % RATIO;
    return { previewTokens: tokens, previewRemainder: remainder, remainingGold: safe - tokens * RATIO };
  }

  settleAscension() {
    const total = this.addStrings(String(this.state.forgeEconomy.mintRemainder), String(this.state.hero.gold || 0));
    const tokens = Math.floor(parseInt(total, 10) / RATIO);
    const remainder = parseInt(total, 10) % RATIO;
    if (tokens > 0) {
      this.state.forgeEconomy.tokens = this.addStrings(this.state.forgeEconomy.tokens, String(tokens));
      this.state.forgeEconomy.lifetimeMinted = this.addStrings(this.state.forgeEconomy.lifetimeMinted, String(tokens));
    }
    this.state.forgeEconomy.mintRemainder = remainder;
    return { tokens, remainder };
  }

  addStrings(a, b) {
    const max = Math.max(a.length, b.length);
    const aN = a.padStart(max, '0');
    const bN = b.padStart(max, '0');
    let carry = 0;
    let result = '';
    for (let i = max - 1; i >= 0; i--) {
      const sum = parseInt(aN[i], 10) + parseInt(bN[i], 10) + carry;
      carry = Math.floor(sum / 10);
      result = (sum % 10) + result;
    }
    if (carry > 0) result = carry + result;
    return result;
  }
}
