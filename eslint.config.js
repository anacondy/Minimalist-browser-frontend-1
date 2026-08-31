/**
 * ESLint flat config (ESLint 10) for the SYS® Minimalist Browser.
 * Enforces:
 *  - correct React hooks usage (react-hooks)
 *  - Fast Refresh safety for component files (react-refresh)
 *  - ES2021+ syntax; browser + node globals
 */
import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';

export default [
  // Ignore generated / dependency folders and the archived draft
  // versions (index.jsx, 2IMPROVEDindex.jsx, 3MOREIMPROVEDindex.jsx).
  // The maintained source lives in src/ (see ARCHITECTURE.md).
  {
    ignores: [
      'dist',
      'node_modules',
      'coverage',
      'index.jsx',
      '2IMPROVEDindex.jsx',
      '3MOREIMPROVEDindex.jsx',
    ],
  },

  {
    files: ['**/*.{js,jsx}'],
    languageOptions: {
      ecmaVersion: 2021,
      sourceType: 'module',
      globals: {
        ...globals.browser,
        ...globals.node,
      },
      parserOptions: {
        ecmaFeatures: { jsx: true },
        sourceType: 'module',
      },
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...js.configs.recommended.rules,
      // Hooks: enforce rules-of-hooks and exhaustive-deps.
      ...reactHooks.configs.recommended.rules,
      // Only export components (Fast Refresh friendly).
      'react-refresh/only-export-components': [
        'warn',
        { allowConstantExport: true },
      ],
      // Keep the codebase tidy: no unused vars, prefer const.
      'no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      'prefer-const': 'warn',
    },
  },
];
