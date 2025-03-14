module.exports = {
  extends: ['eslint:recommended', 'typescript'],
  env: {
    node: true,
    es6: true
  },
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module'
  },
  rules: {
    '@typescript-eslint/no-unused-vars': [
      'error',
      { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }
    ]
  },
  overrides: [
    {
      files: ['**/__tests__/**/*'],
      env: {
        jest: true
      }
    }
  ]
}
