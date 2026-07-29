import { test } from 'node:test';
import assert from 'node:assert';
import { GameRenderer } from '../../game-renderer.js';

test('game-renderer-sprite-fallback', () => {
  const canvas = {
    getContext: () => ({
      drawImage: () => {},
      clearRect: () => {},
      fillRect: () => {},
      beginPath: () => {},
      arc: () => {},
      fill: () => {},
      stroke: () => {},
      save: () => {},
      restore: () => {},
      setTransform: () => {},
      fillText: () => {},
      textAlign: () => {},
    }),
    getBoundingClientRect: () => ({ width: 1280, height: 320 }),
    addEventListener: () => {},
    width: 1280,
    height: 320,
  };
  const renderer = new GameRenderer(canvas, null);
  const primitive = renderer.sprite('missing_key', 14, '#b7410e');
  assert.strictEqual(primitive.type, 'primitive');
  assert.strictEqual(primitive.radius, 14);
  assert.strictEqual(primitive.color, '#b7410e');
});

test('game-renderer-with-assets', () => {
  const canvas = {
    getContext: () => ({
      drawImage: () => {},
      clearRect: () => {},
      fillRect: () => {},
      beginPath: () => {},
      arc: () => {},
      fill: () => {},
      stroke: () => {},
      save: () => {},
      restore: () => {},
      setTransform: () => {},
      fillText: () => {},
      textAlign: () => {},
    }),
    getBoundingClientRect: () => ({ width: 1280, height: 320 }),
    addEventListener: () => {},
    width: 1280,
    height: 320,
  };
  const fakeAssets = {
    get: (key) => {
      if (key === 'hero_guardian') {
        return { complete: true, naturalWidth: 192, naturalHeight: 192 };
      }
      return null;
    },
  };
  const renderer = new GameRenderer(canvas, fakeAssets);
  const sprite = renderer.sprite('hero_guardian', 18, '#fff');
  assert.strictEqual(sprite.type, 'sprite');
  assert.strictEqual(sprite.w, 192);
  assert.strictEqual(sprite.h, 192);
});
