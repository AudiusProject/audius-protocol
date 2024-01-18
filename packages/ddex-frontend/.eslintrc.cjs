module.exports = {
  root: true,
  env: { browser: true, es6: true },
  extends: ['audius'],
  plugins: ['react-refresh'],
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
