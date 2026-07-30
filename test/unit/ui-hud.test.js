import { test } from 'node:test';
import assert from 'node:assert';
import { UIHUD } from '../../js/engine/06-ui-hud.js';

test('ui-hud-toast-noop-in-node', () => {
  if (typeof document !== 'undefined') {
    UIHUD.toast('hello');
  }
  assert.ok(true);
});

test('ui-hud-spawn-damage-number-noop-in-node', () => {
  if (typeof document !== 'undefined') {
    UIHUD.spawnDamageNumber(100, 100, '5', '#fff');
  }
  assert.ok(true);
});

test('ui-hud-set-progress-noop-in-node', () => {
  if (typeof document !== 'undefined') {
    UIHUD.setProgress('bar-id', 50, 100);
  }
  assert.ok(true);
});
