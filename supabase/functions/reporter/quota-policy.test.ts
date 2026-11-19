import assert from 'node:assert/strict';
import { costOf, perActionLimits, pointsUsed, quotaExceeded } from './quota-policy.ts';

Deno.test('points used follow the price table, long protocols cost 12', () => {
  assert.equal(pointsUsed({ chat: 10, image: 2, paper: 1 }), 10 + 4 + 20);
  assert.equal(pointsUsed({ protocol: 3 }, 1), 3 * 8 + 4);
  assert.equal(costOf('protocol', true), 12);
});

Deno.test('a user with 100 points can afford exactly what the points allow', () => {
  const used = { paper: 4 }; // 80 points
  const remaining = 100 - pointsUsed(used);
  const q = { used, limit: perActionLimits(used, remaining), unlimited: [], points: { grant: 100, used: 80, remaining, cost: {} } };
  assert.equal(quotaExceeded('paper', q), false); // 20 left, paper costs 20
  assert.equal(q.limit.paper, 5);
  assert.equal(q.limit.chat, 20);
  const after = { ...q, points: { ...q.points, remaining: 7 } };
  assert.equal(quotaExceeded('protocol', after), true);
  assert.equal(quotaExceeded('layout', after), false);
  assert.equal(quotaExceeded('protocol', { ...q, points: { ...q.points, remaining: 10 } }, true), true);
});

Deno.test('unlimited test users and the old count mode still work', () => {
  const q = { used: { chat: 500 }, limit: { chat: 200 }, unlimited: ['chat'] };
  assert.equal(quotaExceeded('chat', q), false);
  assert.equal(quotaExceeded('chat', { ...q, unlimited: [] }), true);
});
