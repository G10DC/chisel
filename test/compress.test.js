// test/compress.test.js — terseProseAdvisor: prose filler reduction, code left intact.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { terseProseAdvisor } from '../lib/compress.js';

test('terseProseAdvisor strips filler openers and padding from prose (meaning unchanged)', () => {
  assert.equal(terseProseAdvisor('Let me just basically fix the bug.'), 'fix the bug.');
  assert.equal(terseProseAdvisor("I'll run the tests"), 'run the tests');
});

test('terseProseAdvisor never corrupts hyphenated compounds', () => {
  assert.equal(terseProseAdvisor('just-in-time compilation'), 'just-in-time compilation');
  assert.equal(terseProseAdvisor('a basically-sound design'), 'a basically-sound design');
});

test('terseProseAdvisor leaves code, strings, commands UNCHANGED (safety guard)', () => {
  assert.equal(terseProseAdvisor('def f():\n    return 1'), 'def f():\n    return 1');
  assert.equal(terseProseAdvisor('const x = "  spaced  ";'), 'const x = "  spaced  ";');
  assert.equal(terseProseAdvisor('echo "I think the build failed"'), 'echo "I think the build failed"');
  assert.equal(terseProseAdvisor('```\nlet me x = 1\n```'), '```\nlet me x = 1\n```');
  assert.equal(terseProseAdvisor('const x = 1;'), 'const x = 1;');
});

test('terseProseAdvisor("") -> ""', () => {
  assert.equal(terseProseAdvisor(''), '');
});

test('terseProseAdvisor strips opener pleasantries (Sure, / Well, / So,) but keeps real conjunctions', () => {
  assert.equal(terseProseAdvisor('Sure, let me run the tests'), 'run the tests');
  assert.equal(terseProseAdvisor('Well, the build failed.'), 'the build failed.');
  assert.equal(terseProseAdvisor('So, this is the plan.'), 'this is the plan.');
  // "So" without a comma is a real conjunction -> NOT stripped
  assert.equal(terseProseAdvisor('So the result is correct.'), 'So the result is correct.');
});

test('terseProseAdvisor reduces verbose Italian prose (pleasantries + filler IT)', () => {
  const it = 'Certo, praticamente ti mostro come funziona; fondamentalmente è semplice, e ovviamente gira bene.';
  const out = terseProseAdvisor(it);
  assert.ok(out.length < it.length, 'Italian prose shrinks');
  assert.match(out, /funziona|gira/, 'core meaning preserved');
  assert.doesNotMatch(out, /praticamente|fondamentalmente|Certo,/);
});

test('terseProseAdvisor leaves Italian code/strings intact', () => {
  assert.equal(terseProseAdvisor('const x = "valore";'), 'const x = "valore";');
});
