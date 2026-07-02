// eslint.config.js — flat config (eslint 9). Complexity threshold like the parent project.

import js from '@eslint/js';

export default [
  js.configs.recommended,
  {
    languageOptions: { ecmaVersion: 2023, sourceType: 'module' },
  },
  {
    files: ['**/*.js', '**/*.mjs'],
    rules: {
      complexity: ['warn', 12],
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
    },
  },
  {
    ignores: ['node_modules/', 'coverage/'],
  },
];
