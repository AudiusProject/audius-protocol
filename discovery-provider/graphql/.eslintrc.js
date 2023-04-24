module.exports = {
  extends: ['standard-with-typescript'],
  parserOptions: {
    project: 'tsconfig.json',
    tsconfigRootDir: __dirname,
    sourceType: 'module'
  },
  rules: {
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/restrict-template-expressions': 'off',
    '@typescript-eslint/strict-boolean-expressions': 'off',
    '@typescript-eslint/no-floating-promises': 'off',
    '@typescript-eslint/no-extraneous-class': 'off',
    // Conflict between ESLint + Prettier, rules disabled for now
    '@typescript-eslint/space-before-function-paren': 'off',
    '@typescript-eslint/indent': 'off',
    '@typescript-eslint/quotes': 'off',
    '@typescript-eslint/no-non-null-assertion': 'off',
    '@typescript-eslint/consistent-type-definitions': 'off',
    '@typescript-eslint/require-array-sort-compare': 'off',
    'comma-dangle': 'off'
  },
  overrides: [
    {
      files: '**/*.ts',
      extends: ['plugin:prettier/recommended'],
      plugins: ['prettier']
    }
  ]
}
