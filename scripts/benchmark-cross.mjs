#!/usr/bin/env node
// scripts/benchmark-cross.mjs
// Cross-skill token-reduction benchmark.
//
// Compares how three installed skills that act on AGENT OUTPUT PROSE reduce tokens on a fixed
// dataset:
//   - chisel         : real deterministic function (terseProseAdvisor, with a code-safe guard)
//   - caveman-it     : DETERMINISTIC APPROXIMATION of its stated rules (telegraphic, no
//                      pleasantries, no filler) - directive skills expose no function, so we
//                      approximate the declared behavior for reproducibility
//   - concise-output : DETERMINISTIC APPROXIMATION of its stated rules (no filler, <= 3 blocks)
//
// Token estimate: chars / 4 (rough; the RELATIVE reduction is the comparison).
// Usage: node scripts/benchmark-cross.mjs

import { pathToFileURL } from 'node:url';
import { terseProseAdvisor } from '../lib/compress.js';

// Shared filler pattern (same definition terseProseAdvisor uses), kept local so the directive
// approximations are self-contained.
const FILLER = /(?<![\w-])(let me|i'll|i will|i am going to|just|basically|actually|i think|i guess|you know)(?![\w-])/gi;
const OPENER = /^\s*(let me|i'll|i will|i am going to)\s+/i;
const PLEASANTRIES = /^\s*(sure|of course|certainly|right|ok|okay|well|so|now|great|perfect)[,!.]?\s+/gi;

// caveman-it declared rules: telegraphic, no pleasantries, no filler, short phrases.
function cavemanSim(t) {
  return String(t)
    .replace(PLEASANTRIES, '')
    .replace(OPENER, '')
    .replace(FILLER, '')
    .replace(/[ \t]{2,}/g, ' ')
    .trim();
}

// concise-output declared rules: compact, no filler, at most 3 blocks.
function conciseSim(t) {
  let s = String(t)
    .replace(OPENER, '')
    .replace(FILLER, '')
    .replace(/[ \t]{2,}/g, ' ')
    .trim();
  const blocks = s.split(/\n{2,}/);
  if (blocks.length > 3) s = blocks.slice(0, 3).join('\n\n');
  return s;
}

const SKILLS = [
  ['chisel', terseProseAdvisor],
  ['caveman-it', cavemanSim],
  ['concise-output', conciseSim],
];

const SAMPLES = {
  'verbose prose':
    'Sure, let me just basically go ahead and actually explain the auth flow now. ' +
    "I'll walk you through it step by step. Of course, the client first requests authorization, " +
    'then it exchanges the code for a token. So, basically, it uses OAuth2 with PKCE for security, ' +
    'and I think that keeps the whole thing safe.',

  'code + prose':
    'Let me refactor this function.\n\n```js\nconst x = 1;\n```\n\n' +
    'Basically, this just initializes the counter variable to one before the loop starts, ' +
    'so that the iteration actually begins from the right place.',

  'long structured (5 blocks)': [
    'Sure, let me basically introduce the plan. I think we should start with the database layer.',
    "Now, I'll move on to the API. Basically it exposes a few REST endpoints for the client.",
    'Of course, the frontend comes next. It is a React app, basically a single page.',
    'So, testing matters. We should basically add unit tests and integration tests too.',
    "Finally, I'll mention deployment. Basically Docker, with a CI pipeline on top.",
  ].join('\n\n'),
};

const est = (s) => Math.ceil(String(s).length / 4);
const pct = (a, b) => (b ? Math.round(((b - a) / b) * 100) : 0);

function main() {
  console.log('# Cross-skill token-reduction benchmark\n');
  console.log('Metric: chars/4 ~= tokens. Reduction is relative to each sample.\n');
  for (const [name, src] of Object.entries(SAMPLES)) {
    const before = est(src);
    console.log(`## ${name}  (before: ${before} tok, ${src.length} chars)`);
    for (const [skill, fn] of SKILLS) {
      const out = fn(src);
      const after = est(out);
      console.log(`  ${skill.padEnd(14)} ${String(after).padStart(4)} tok   (-${pct(after, before)}%)`);
    }
    console.log();
  }
  console.log('Caveats: chisel is a real function with a code-safe guard; caveman-it and');
  console.log('concise-output are deterministic approximations of their STATED rules (directive');
  console.log('skills expose no executable function). Live model output following those directives');
  console.log('may differ. context-mode (context-window axis) and karpathy-guidelines (behavioral');
  console.log('axis) reduce tokens on different axes and are not benchmarked here.');
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) main();

export { cavemanSim, conciseSim, SKILLS, SAMPLES };
