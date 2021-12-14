module.exports = {
  root: true,
  env: {
    es6: true
  },
  extends: [
    'standard',
    '@react-native-community',
    'plugin:@typescript-eslint/recommended',
    'plugin:jest/recommended',
    'plugin:react/recommended',
    'prettier/react',
    'prettier-standard/prettier-file'
  ],
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
  plugins: ['react', 'react-hooks', '@typescript-eslint', 'jest', 'import'],
  settings: {
    'import/external-module-folders': ['node_modules', 'audius-client'],
    'import/resolver': {
      // NOTE: sk - These aliases are required for the import/order rule.
      alias: {
        map: [['app', './src']],
        extensions: ['.ts', '.tsx', '.js', '.jsx', '.json']
      }
    }
  },
  rules: {
    '@typescript-eslint/ban-ts-comment': 'off',
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/no-non-null-assertion': 'off',
    '@typescript-eslint/member-delimiter-style': 'off',
    '@typescript-eslint/no-empty-interface': 'off',
    '@typescript-eslint/camelcase': 'off',
    '@typescript-eslint/ban-ts-ignore': 'off',
    '@typescript-eslint/no-explicit-any': 'off',
    '@typescript-eslint/no-use-before-define': 'off',
    '@typescript-eslint/no-empty-function': 'off',
    '@typescript-eslint/no-var-requires': 'off',
    '@typescript-eslint/no-unused-vars': ['error', { args: 'none' }], // We should turn this one on soon
    '@typescript-eslint/no-this-alias': 'off',

    'no-redeclare': 'off',
    '@typescript-eslint/no-redeclare': ['error'],

    'no-use-before-define': 'off',
    'no-bitwise': 'off',
    camelcase: 'off',
    'no-unused-vars': 'off',
    'func-call-spacing': 'off',
    semi: ['error', 'never'],
    'no-undef': 'off',
    'no-empty': 'off',
    'no-shadow': 'off',
    'arrow-parens': 'off',
    'padded-blocks': 'off',

    'jest/expect-expect': 'off',

    'react-hooks/rules-of-hooks': 'error',
    'react-hooks/exhaustive-deps': 'warn',

    'react/display-name': 'off',
    'react/prop-types': 'off',

    'react-native/no-inline-styles': 'off',

    'prettier/prettier': 'error',

    'space-before-function-paren': 'off',
    'generator-star-spacing': 'off',

    'import/order': [
      'error',
      {
        alphabetize: {
          order: 'asc'
        },
        groups: [
          'builtin',
          'external',
          'internal',
          'parent',
          'sibling',
          'index'
        ],
        'newlines-between': 'always',
        pathGroups: [
          {
            pattern: 'react',
            group: 'builtin',
            position: 'before'
          }
        ],
        pathGroupsExcludedImportTypes: ['builtin']
      }
    ]
  }
}
