import js from '@eslint/js'
import tsPlugin from '@typescript-eslint/eslint-plugin'
import tsParser from '@typescript-eslint/parser'

export default [
  js.configs.recommended,
  {
    files: ['**/*.ts', '**/*.tsx'],
    languageOptions: {
      parser: tsParser,
    },
    plugins: {
      '@typescript-eslint': tsPlugin,
    },
    rules: {
      // TypeScript handles this — no-undef produces false positives for Node/browser globals
      'no-undef': 'off',

      // Catch unused variables — primary value of lint for this codebase
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],

      // Discourage any — warn, not error, to avoid blocking stubs
      '@typescript-eslint/no-explicit-any': 'warn',

      // Prevent accidental console.log commits
      'no-console': 'warn',
    },
  },
  {
    // Test files are allowed console and unused vars are less strict
    files: ['**/*.test.ts'],
    rules: {
      'no-console': 'off',
    },
  },
  {
    ignores: ['.next/**', 'node_modules/**'],
  },
]
