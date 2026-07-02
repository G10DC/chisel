// test/precision.test.js — estimateToolCost + isRedundant.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { estimateToolCost, isRedundant } from '../lib/precision.js';

test('estimateToolCost returns known costs, defaults unknown to 2', () => {
  assert.equal(estimateToolCost('Read'), 1);
  assert.equal(estimateToolCost('Bash'), 2);
  assert.equal(estimateToolCost('Task'), 8);
  assert.equal(estimateToolCost('Mystery'), 2);
});

test('isRedundant detects an identical prior call', () => {
  const history = [{ name: 'Read', args: { path: '/a' } }];
  assert.equal(isRedundant({ name: 'Read', args: { path: '/a' } }, history), true);
  assert.equal(isRedundant({ name: 'Read', args: { path: '/b' } }, history), false);
  assert.equal(isRedundant({ name: 'Edit', args: { path: '/a' } }, history), false);
});
