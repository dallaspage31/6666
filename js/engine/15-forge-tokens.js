import { GameState } from './02-state.js';
import { BigIntDecimal } from './00-bigint.js';

const RATIO = new BigIntDecimal(10000);

export class ForgeTokens {
  constructor(state) {
    this.state = state;
  }

  mint(amount) {
    const safe = new BigIntDecimal(Math.floor(amount));
    const tokens = safe.div(RATIO);
    const remainder = safe.mod(RATIO);
    if (tokens.isZero()) return null;

    this.state.forgeEconomy.tokens = this.addStrings(this.state.forgeEconomy.tokens, tokens.toString());
    this.state.forgeEconomy.lifetimeMinted = this.addStrings(this.state.forgeEconomy.lifetimeMinted, tokens.toString());
    this.state.forgeEconomy.mintRemainder = remainder.toNumber();
    return { tokens: tokens.toNumber(), remainder: remainder.toNumber(), newTotal: this.state.forgeEconomy.tokens };
  }

  previewMint(amount) {
    const safe = new BigIntDecimal(Math.floor(amount));
    const tokens = safe.div(RATIO);
    const remainder = safe.sub(tokens.mul(RATIO));
    return { previewTokens: tokens.toNumber(), previewRemainder: remainder.toNumber(), remainingGold: safe.sub(tokens.mul(RATIO)).toNumber() };
  }

  settleAscension() {
    const total = this.addStrings(String(this.state.forgeEconomy.mintRemainder), String(this.state.hero.gold || 0));
    const tokens = new BigIntDecimal(total).div(RATIO);
    const remainder = new BigIntDecimal(total).mod(RATIO);
    if (!tokens.isZero()) {
      this.state.forgeEconomy.tokens = this.addStrings(this.state.forgeEconomy.tokens, tokens.toString());
      this.state.forgeEconomy.lifetimeMinted = this.addStrings(this.state.forgeEconomy.lifetimeMinted, tokens.toString());
    }
    this.state.forgeEconomy.mintRemainder = remainder.toNumber();
    return { tokens: tokens.toNumber(), remainder: remainder.toNumber() };
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
