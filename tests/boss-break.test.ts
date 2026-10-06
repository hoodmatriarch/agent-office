import test from 'node:test';
import assert from 'node:assert/strict';
import { BREAK_INTERVAL, BreakSchedule } from '../src/client/features/boss-break/schedule.js';

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
