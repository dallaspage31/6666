import { test } from 'node:test';
import assert from 'node:assert';
import { ShopSystem } from '../../js/engine/08-shop.js';
import { DeterministicRNG } from '../../js/engine/01-rng.js';

test('shop-generate-catalog', () => {
  const shop = new ShopSystem();
  const rng = new DeterministicRNG(42);
  const catalog = shop.generateCatalog(rng, 1, 4);
  assert.strictEqual(catalog.length, 4);
  assert.ok(catalog[0].price > 0);
});

test('shop-buy-success', () => {
  const shop = new ShopSystem();
  const state = { hero: { gold: 500 }, inventory: [] };
  shop.generateCatalog(new DeterministicRNG(42), 1, 4);
  const price = shop.catalog[0].price;
  const res = shop.buy(0, state);
  assert.strictEqual(res.success, true);
  assert.strictEqual(state.inventory.length, 1);
  assert.strictEqual(state.hero.gold, 500 - price);
});

test('shop-buy-insufficient-gold', () => {
  const shop = new ShopSystem();
  const state = { hero: { gold: 1 }, inventory: [] };
  shop.generateCatalog(new DeterministicRNG(42), 1, 4);
  const res = shop.buy(0, state);
  assert.strictEqual(res.success, false);
  assert.strictEqual(res.reason, 'INSUFFICIENT_GOLD');
});
