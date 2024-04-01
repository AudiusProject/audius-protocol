module.exports = {
  extends: ['audius'],
  rules: {
    'no-restricted-properties': [
      'error',
      {
        object: 'Promise',
        property: 'allSettled',
        message:
          'Do NOT use `Promise.allSettled` as it will be undefined. Use `allSettled` from `utils/allSettled.ts` instead.'
      }
    ],
    'no-restricted-imports': [
      'error',
      {
        patterns: [
          {
            group: ['dayjs/plugin/timezone'],
            message:
              'Avoid using dayjs timezone plugin because it does not work in React Native Hermes'
          }
        ]
      }
    ]
  }
}
