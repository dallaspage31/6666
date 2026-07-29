export class BigIntDecimal {
  constructor(value = 0) {
    if (typeof value === 'bigint') {
      this.value = value;
    } else if (typeof value === 'number') {
      this.value = BigInt(Math.floor(value));
    } else if (typeof value === 'string') {
      this.value = BigInt(value);
    } else {
      this.value = BigInt(0);
    }
  }

  static fromString(s) {
    return new BigIntDecimal(s);
  }

  add(other) {
    return new BigIntDecimal(this.value + (other instanceof BigIntDecimal ? other.value : BigInt(other)));
  }

  sub(other) {
    return new BigIntDecimal(this.value - (other instanceof BigIntDecimal ? other.value : BigInt(other)));
  }

  mul(other) {
    return new BigIntDecimal(this.value * (other instanceof BigIntDecimal ? other.value : BigInt(other)));
  }

  div(other) {
    return new BigIntDecimal(this.value / (other instanceof BigIntDecimal ? other.value : BigInt(other)));
  }

  mod(other) {
    return new BigIntDecimal(this.value % (other instanceof BigIntDecimal ? other.value : BigInt(other)));
  }

  pow(exp) {
    return new BigIntDecimal(this.value ** BigInt(exp));
  }

  min(other) {
    return new BigIntDecimal(this.value < (other instanceof BigIntDecimal ? other.value : BigInt(other)) ? this.value : other.value);
  }

  max(other) {
    return new BigIntDecimal(this.value > (other instanceof BigIntDecimal ? other.value : BigInt(other)) ? this.value : other.value);
  }

  floor() {
    return this;
  }

  ceil() {
    return this;
  }

  toNumber() {
    return Number(this.value);
  }

  toString() {
    return this.value.toString();
  }

  toJSON() {
    return this.value.toString();
  }

  valueOf() {
    return this.value;
  }

  isZero() {
    return this.value === BigInt(0);
  }

  isNegative() {
    return this.value < BigInt(0);
  }

  clone() {
    return new BigIntDecimal(this.value);
  }
}

export function formatBigInt(val) {
  const n = typeof val === 'number' ? BigInt(Math.floor(val)) : typeof val === 'bigint' ? val : BigInt(val);
  if (n < 1_000n) return n.toString();
  if (n < 1_000_000n) return `${(n / 1_000n).toString()}K`;
  if (n < 1_000_000_000n) return `${(n / 1_000_000n).toString()}M`;
  if (n < 1_000_000_000_000n) return `${(n / 1_000_000_000n).toString()}B`;
  return `${(n / 1_000_000_000_000n).toString()}T`;
}

export function parseBigInt(str) {
  return new BigIntDecimal(str);
}
