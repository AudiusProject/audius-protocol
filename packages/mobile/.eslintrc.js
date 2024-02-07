module.exports = {
  root: true,
  env: {
    es6: true
  },
  extends: ['audius'],
  globals: {
    Atomics: 'readonly',
    SharedArrayBuffer: 'readonly'
  },
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaFeatures: {
      jsx: true
    },
    ecmaVersion: 2018,
    sourceType: 'module'
  },
  plugins: ['react', 'react-hooks', '@typescript-eslint', 'import'],
  settings: {
    'import/external-module-folders': ['node_modules', 'web'],
    'import/resolver': {
      // NOTE: sk - These aliases are required for the import/order rule.
      alias: {
        map: [
          ['app', './src'],
          ['utils', 'audius-client/src/utils'],
          ['common', 'audius-client/src/common']
        ],
        extensions: ['.ts', '.tsx', '.js', '.jsx', '.json']
      }
    }
  },
  ignorePatterns: ['**/harmony/**/*'],
  rules: {
    '@typescript-eslint/consistent-type-imports': [
      'error',
      {
        disallowTypeAnnotations: false
      }
    ],
    'no-restricted-properties': [
      'error',
      {
        object: 'Promise',
        property: 'allSettled',
        message:
          'Do NOT use `Promise.allSettled` as it will be undefined. Use `allSettled` from `@audius/common` instead.'
      }
    ],
    'no-restricted-imports': [
      'error',
      {
        paths: [
          {
            name: '@audius/harmony',
            message:
              'Use @audius/harmony-native instead. If needing to access an @audius/harmony export, reference it directly with @audius/harmony/src/..'
          }
        ]
      }
    ]
  }
}
