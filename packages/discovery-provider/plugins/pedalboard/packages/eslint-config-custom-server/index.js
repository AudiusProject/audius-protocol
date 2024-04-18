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
  overrides: [
    {
      files: ['**/__tests__/**/*'],
      env: {
        jest: true
      }
    }
  ]
}
