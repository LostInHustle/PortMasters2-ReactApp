// @ts-check
import js from '@eslint/js';
import reactHooks from 'eslint-plugin-react-hooks';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  { ignores: ['**/dist/**', '**/node_modules/**'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    rules: {
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
    },
  },
  // The client is the only workspace with React in it. Without this, nothing checks the one
  // rule React cannot recover from at runtime: hooks must run in the same order on every
  // render. A conditional return placed above a useState is invisible to the type checker and
  // to a reading eye, and it only fails once the condition actually flips at runtime, which in
  // this app means during a live session. Worth having the linter own it permanently.
  {
    files: ['apps/client/src/**/*.{ts,tsx}'],
    plugins: { 'react-hooks': reactHooks },
    rules: {
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
    },
  },
);
