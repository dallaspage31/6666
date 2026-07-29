export class DeterministicRNG {
  constructor(seed) {
    this.seed = seed | 0;
    this.state = seed | 0;
  }

  next() {
    let s = this.state | 0;
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), s | 1);
    t = (t + Math.imul(t ^ (t >>> 7), t | 61)) ^ (t >>> 14);
    this.state = t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  nextInt(min, max) {
    return Math.floor(this.next() * (max - min + 1)) + min;
  }

  pick(arr) {
    return arr[this.nextInt(0, arr.length - 1)];
  }

  shuffle(arr) {
    const out = arr.slice();
    for (let i = out.length - 1; i > 0; i--) {
      const j = this.nextInt(0, i);
      [out[i], out[j]] = [out[j], out[i]];
    }
    return out;
  }

  freeze() {
    return this.state | 0;
  }
}
