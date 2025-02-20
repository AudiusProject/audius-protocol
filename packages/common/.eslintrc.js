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
            group: ['@audius/sdk/dist*'],
            message:
              'Do not import from the SDK dist folder. If needed, update SDK to export the item you wish to use.'
          }
        ]
      }
    ],
    'no-restricted-syntax': [
      'error',
      {
        selector:
          'CallExpression[callee.name=useQuery] > ObjectExpression > Property[key.name=queryFn] ReturnStatement > Identifier[name=undefined]',
        message:
          'Do not return undefined in React Query queryFn. Return null instead.'
      },
      {
        selector:
          'CallExpression[callee.name=useQuery] > ObjectExpression > Property[key.name=queryFn] IfStatement > BlockStatement > ReturnStatement:not([argument])',
        message:
          'Do not return undefined in React Query queryFn. Return null instead.'
      },
      {
        selector:
          'CallExpression[callee.name=useQuery] > ObjectExpression > Property[key.name=queryFn] ReturnStatement:not([argument])',
        message:
          'Do not return undefined in React Query queryFn. Return null instead.'
      }
    ]
  }
}
