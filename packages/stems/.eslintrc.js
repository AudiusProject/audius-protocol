module.exports = {
  extends: ['audius', 'plugin:storybook/recommended'],
  settings: {
    'import/resolver': {
      // NOTE: sk - These aliases are required for the import/order rule.
      // We are using the typescript baseUrl to do absolute import paths
      // relative to /src, which eslint can't tell apart from 3rd party deps
      alias: {
        map: [
          ['assets', './src/assets'],
          ['components', './src/components'],
          ['hooks', './src/hooks'],
          ['utils', './src/utils']
        ],
        extensions: ['.ts', '.tsx', '.js', '.jsx', '.json']
      }
    }
  },
  overrides: [
    {
      files: ['src/**/*.d.ts', 'src/**/*.stories.tsx'],
      rules: {
        'import/no-default-export': 'off'
      }
    }
  ],
  rules: {
    'no-restricted-imports': [
      'error',
      {
        patterns: [
          {
            group: ['react-spring*'],
            message: 'Please use @react-spring/web instead'
          }
        ]
      }
    ]
  }
}
