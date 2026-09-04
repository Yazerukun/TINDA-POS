import js from '@eslint/js'
import globals from 'globals'
import tseslint from 'typescript-eslint'
import react from 'eslint-plugin-react'
import reactHooks from 'eslint-plugin-react-hooks'

// ESLint 9 flat config for TINDA POS (Electron + React + TypeScript + Vitest).
// Generated/package output is never linted. No type-aware rules here — the
// separate `tsc` typecheck already performs full type checking, so this config
// focuses on non-type syntactic bugs (undeclared vars, unused code, unreachable
// code, React Hooks misuse) without duplicating compiler checks.
const TS_GLOBS = ['**/*.ts', '**/*.tsx', '**/*.mts', '**/*.cts']
const REACT_GLOBS = ['src/renderer/src/**/*.{ts,tsx}']
const NODE_GLOBS = ['src/main/**/*.ts', 'src/preload/**/*.ts']

export default tseslint.config(
  {
    ignores: [
      '**/node_modules/**',
      '**/builds/**',
      '**/dist/**',
      '**/out/**',
      '**/coverage/**',
      '**/build/**',
      '**/installers/**',
      '**/electron-cache/**',
      '**/temp/**',
      '**/.qa/**',
      '*.config.*',
      'postcss.config.cjs',
      'eslint.config.mjs',
      '.pnpmfile.cjs'
    ]
  },
  {
    files: [...TS_GLOBS],
    extends: [js.configs.recommended],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module'
    }
  },
  ...tseslint.configs.recommended,
  {
    files: TS_GLOBS,
    rules: {
      // tsc already reports genuinely undefined identifiers; keep JS-esque
      // no-undef off here to avoid false positives on TS globals.
      'no-undef': 'off',
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
          ignoreRestSiblings: true
        }
      ]
    }
  },
  {
    files: NODE_GLOBS,
    languageOptions: {
      globals: { ...globals.node, ...globals.electron }
    },
    rules: {
      // The Electron main/preload bundle is compiled to CommonJS, where
      // `require()` is idiomatic (and often the only way to load CJS-built
      // deps). This is not a lint-worthy smell on that side.
      '@typescript-eslint/no-require-imports': 'off'
    }
  },
  {
    files: REACT_GLOBS,
    languageOptions: {
      globals: { ...globals.browser }
    }
  },
  {
    files: REACT_GLOBS,
    settings: {
      react: { version: 'detect' }
    },
    plugins: { react },
    rules: {
      ...react.configs.flat.recommended.rules,
      ...react.configs.flat['jsx-runtime'].rules,
      // Modern JSX transform (React 19): no need to import React for JSX.
      'react/react-in-jsx-scope': 'off',
      'react/prop-types': 'off' // this project is fully typed with TS
    }
  },
  {
    files: REACT_GLOBS,
    plugins: { 'react-hooks': reactHooks },
    rules: {
      ...reactHooks.configs.flat['recommended-latest'].rules,
      // New/experimental rule that false-positives on the standard async
      // "load data from IPC on mount" pattern (`useEffect(() => { void load() }, [])`
      // where load() awaits IPC and then calls setState). setState here is
      // async, not synchronous within the effect body, so it does not cause
      // cascading renders. Keep the exhaustive-deps rule, but not this one.
      'react-hooks/set-state-in-effect': 'off'
    }
  }
)
