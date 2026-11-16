import js from '@eslint/js';

/** Globals for the Node-side code. Nothing here is a secret or a shortcut: just what Node provides. */
const nodeGlobals = {
  process: 'readonly',
  console: 'readonly',
  URL: 'readonly',
  URLSearchParams: 'readonly',
  fetch: 'readonly',
  AbortController: 'readonly',
  AbortSignal: 'readonly',
  setTimeout: 'readonly',
  clearTimeout: 'readonly',
  structuredClone: 'readonly',
  TextEncoder: 'readonly',
  TextDecoder: 'readonly',
  Buffer: 'readonly',
};

/** Globals for the browser artifact and the client source it is generated from. */
const browserGlobals = {
  window: 'readonly',
  navigator: 'readonly',
  document: 'readonly',
};

export default [
  {
    ignores: [
      'node_modules/**',
      'coverage/**',
      'dist/**',
      '.scratch/**',
      // Generated from src/client plus the catalog; checked by scripts/build-client.mjs --check
      // and by test/build.test.mjs, which is a stronger guarantee than a style rule.
      'client.js',
      // Vendored fixture inputs are deliberately written in the shape a real project has.
      'test/fixtures/**',
      // Concatenation fragments, not standalone modules: `client.js` is generated from them
      // and the build's drift check plus test/build.test.mjs verify the result.
      'src/client/*.part.js',
    ],
  },
  js.configs.recommended,
  {
    files: ['**/*.mjs', '**/*.js'],
    languageOptions: {
      ecmaVersion: 2024,
      sourceType: 'module',
      globals: nodeGlobals,
    },
    rules: {
      'no-unused-vars': ['error', { argsIgnorePattern: '^_', caughtErrors: 'none' }],
      'no-console': 'error',
      eqeqeq: ['error', 'always', { null: 'ignore' }],
      'no-var': 'error',
      'prefer-const': 'error',
      'no-throw-literal': 'error',
      'no-eval': 'error',
      'no-implied-eval': 'error',
      'no-new-func': 'error',
    },
  },
  {
    files: ['src/client/panel.part.js', 'scripts/build-client.mjs'],
    languageOptions: { globals: { ...nodeGlobals, ...browserGlobals } },
  },
  {
    // These two files are concatenation fragments, not modules: the build injects `React`,
    // `h`, `CATALOG`, `LOCALE` and the model helpers into the factory around them. `no-undef`
    // cannot see that scope, so it is off here and the build's own drift check plus
    // test/build.test.mjs guard the same ground.
    files: ['src/client/panel.part.js', 'src/client/entry.part.js'],
    rules: { 'no-undef': 'off' },
  },
  {
    // Scripts and the CLI print to the terminal by design.
    files: ['bin/**/*.mjs', 'src/cli/**/*.mjs', 'scripts/**/*.mjs', 'test/**/*.mjs'],
    rules: { 'no-console': 'off' },
  },
  {
    // The verifier writes to stderr/stdout rather than console; keep the pause rule off for tests only.
    files: ['test/**/*.mjs'],
    languageOptions: { globals: { ...nodeGlobals } },
  },
];
