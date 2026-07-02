// test/reads.test.js — read-cache advisor: flag re-reads of files already in context.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { shouldRead, duplicateReads } from '../lib/reads.js';

test('shouldRead allows a path not yet read', () => {
  const r = shouldRead('/repo/lib/foo.js', []);
  assert.equal(r.read, true);
  assert.equal(r.reason, 'new');
});

test('shouldRead flags a path already in context', () => {
  const r = shouldRead('/repo/lib/foo.js', ['/repo/lib/foo.js']);
  assert.equal(r.read, false);
  assert.equal(r.reason, 'already-in-context');
});

test('shouldRead normalizes path variants before comparing (dot segment, //, trailing /, backslash)', () => {
  const seen = ['/repo/lib/foo.js'];
  assert.equal(shouldRead('/repo/lib/./foo.js', seen).read, false);
  assert.equal(shouldRead('/repo//lib/foo.js', seen).read, false);
  assert.equal(shouldRead('/repo/lib/foo.js/', seen).read, false);
  assert.equal(shouldRead('\\repo\\lib\\foo.js', seen).read, false);
});

test('shouldRead does NOT conflate a relative path with an absolute one (no cwd to resolve)', () => {
  const seen = ['/repo/lib/foo.js'];
  assert.equal(shouldRead('repo/lib/foo.js', seen).read, true);
});

test('shouldRead is robust to empty / non-string alreadyRead entries', () => {
  const r = shouldRead('/repo/lib/foo.js', ['', null, 42, '/repo/lib/bar.js']);
  assert.equal(r.read, true);
});

test('duplicateReads returns only the planned reads already in context', () => {
  const plan = [
    { name: 'Read', args: { file_path: '/repo/a.js' } },
    { name: 'Read', args: { file_path: '/repo/b.js' } },
    { name: 'Read', args: { file_path: '/repo/c.js' } },
  ];
  const dupes = duplicateReads(plan, ['/repo/a.js', '/repo/b.js']);
  assert.equal(dupes.length, 2);
  assert.deepEqual(dupes.map((d) => d.path).sort(), ['/repo/a.js', '/repo/b.js']);
  assert.equal(dupes[0].reason, 'already-in-context');
});

test('duplicateReads tolerates string entries and missing args', () => {
  const plan = ['/repo/a.js', { name: 'Read' }, { name: 'Read', args: { file_path: '/repo/a.js' } }];
  const dupes = duplicateReads(plan, ['/repo/a.js']);
  assert.equal(dupes.length, 2);
});

test('duplicateReads returns [] when nothing is a re-read', () => {
  assert.deepEqual(duplicateReads(['/repo/a.js'], ['/repo/b.js']), []);
  assert.deepEqual(duplicateReads([], ['/repo/a.js']), []);
});
