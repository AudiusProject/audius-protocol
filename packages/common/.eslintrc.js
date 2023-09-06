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
    ]
  }
}
