import test from 'node:test';
import assert from 'node:assert/strict';
import { BREAK_INTERVAL, BreakSchedule } from '../src/client/features/boss-break/schedule.js';
import { LOFT } from '../src/shared/layout.js';
import { roomLevel } from '../src/client/features/boss-break/levels.js';

test('boss room is 80%, while the workspace and meeting room below are 45%', () => {
  const boss = { x: (LOFT.minX + LOFT.maxX) / 2, y: LOFT.y, z: (LOFT.minZ + LOFT.maxZ) / 2 };
  assert.equal(roomLevel(boss), 0.8);
  assert.equal(roomLevel({ ...boss, y: 0 }), 0.45);
  assert.equal(roomLevel({ x: 0, y: 0, z: 0 }), 0.45);
  assert.equal(roomLevel({ ...boss, x: LOFT.minX - 0.1 }), 0.45);
  assert.equal(roomLevel(boss, 0.9, 0.3), 0.9);
  assert.equal(roomLevel({ ...boss, y: 0 }, 0.9, 0.3), 0.3);
});

test('the boss theme is due only after a full fifteen minutes', () => {
  const schedule = new BreakSchedule();
  assert.equal(schedule.due(0, true), false);
  schedule.arm(1000);
  assert.equal(schedule.due(1000 + BREAK_INTERVAL - 1, true), false);
  assert.equal(schedule.due(1000 + BREAK_INTERVAL, true), true);
  assert.equal(schedule.due(1000 + BREAK_INTERVAL, true), false);
  assert.equal(schedule.due(1000 + BREAK_INTERVAL * 2, true), true);
});

test('returning from a hidden, muted, or other-map session skips missed breaks', () => {
  const schedule = new BreakSchedule();
  schedule.arm(0);
  assert.equal(schedule.due(BREAK_INTERVAL * 8, false), false);
  assert.equal(schedule.due(BREAK_INTERVAL * 8 + 1, true), false);
  assert.equal(schedule.due(BREAK_INTERVAL * 9, true), true);
});
