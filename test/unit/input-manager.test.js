import { test } from 'node:test';
import assert from 'node:assert';
import { InputManager } from '../../js/engine/04-input.js';

test('input-manager-bind-and-isDown', () => {
  const mgr = new InputManager();
  mgr.bind('action1', 'KeyA');
  assert.strictEqual(mgr.isDown('action1'), false);
  mgr.keys.add('KeyA');
  assert.strictEqual(mgr.isDown('action1'), true);
});

test('input-manager-justPressed', () => {
  const mgr = new InputManager();
  mgr.pressed.add('KeyB');
  assert.strictEqual(mgr.justPressed('KeyB'), true);
  assert.strictEqual(mgr.justPressed('KeyC'), false);
});

test('input-manager-flush', () => {
  const mgr = new InputManager();
  mgr.pressed.add('KeyX');
  mgr.flush();
  assert.strictEqual(mgr.pressed.has('KeyX'), false);
});
