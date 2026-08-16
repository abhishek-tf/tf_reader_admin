// ESLint flat config. React + Vite + plain JavaScript.
//
// Deliberately small. Formatting belongs to Prettier, so nothing here is about layout.
// These are rules that catch a real bug or enforce something in STYLE.md.
//
// If a rule turns out to be noise on this codebase, DELETE it rather than turning it to
// "warn". A config full of ignored warnings teaches the team to ignore the linter.

import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import react from 'eslint-plugin-react';

export default [
  { ignores: ['dist/**', 'build/**', 'node_modules/**', 'coverage/**'] },

  js.configs.recommended,

  {
    files: ['**/*.{js,jsx}'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: { ...globals.browser },
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    plugins: { 'react-hooks': reactHooks, react },
    rules: {
      // ── JSX counts as using a variable ───────────────────────────────────
      // Without this one rule, no-unused-vars flags EVERY imported component,
      // because plain ESLint does not see <Header /> as a use of Header.
      // We take this single rule rather than react/recommended, which is 90 rules
      // of mostly prop-types noise that does not apply to a plain JS app.
      'react/jsx-uses-vars': 'error',

      // ── real bugs ────────────────────────────────────────────────────────
      // The two that actually break a React app.
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'error',

      // == vs === on a fresher team, every time.
      eqeqeq: ['error', 'always', { null: 'ignore' }],
      // A caught error that is silently dropped.
      'no-empty': ['error', { allowEmptyCatch: false }],
      // Reassigning a parameter, which surprises the caller.
      'no-param-reassign': 'error',
      // Shadowing hides which variable you meant.
      'no-shadow': 'error',
      // A promise nobody awaits, which is how a save silently does nothing.
      'no-async-promise-executor': 'error',
      'require-atomic-updates': 'error',

      // ── STYLE.md, as lint rules ──────────────────────────────────────────
      // No debugging left behind. console.error is allowed: real errors matter.
      'no-console': ['error', { allow: ['error', 'warn'] }],
      'no-debugger': 'error',
      // No dependency sneaking in via a bare require.
      'no-restricted-imports': [
        'error',
        {
          paths: [
            {
              name: 'redux',
              message: 'No state library. useState plus one context. See STYLE.md.',
            },
            { name: '@reduxjs/toolkit', message: 'No state library. See STYLE.md.' },
            { name: 'zustand', message: 'No state library. See STYLE.md.' },
            { name: '@tanstack/react-query', message: 'No data fetching library. See STYLE.md.' },
            { name: 'swr', message: 'No data fetching library. See STYLE.md.' },
            { name: '@mui/material', message: 'No component library. Plain CSS. See STYLE.md.' },
            { name: 'antd', message: 'No component library. See STYLE.md.' },
          ],
        },
      ],
      // The token must never be persisted. An XSS reads localStorage.
      'no-restricted-properties': [
        'error',
        {
          object: 'localStorage',
          property: 'setItem',
          message: 'Never persist a token. Keep the access token in memory. See CLAUDE.md.',
        },
        {
          object: 'sessionStorage',
          property: 'setItem',
          message: 'Never persist a token. Keep the access token in memory. See CLAUDE.md.',
        },
      ],

      // ── size budgets, matching STYLE.md ──────────────────────────────────
      // These fire at the point where you should STOP AND ASK, not silently split.
      'max-lines': ['error', { max: 200, skipBlankLines: true, skipComments: true }],
      'max-depth': ['error', 4],
      complexity: ['error', 12],

      // ── noise removal ────────────────────────────────────────────────────
      'no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
    },
  },
];
