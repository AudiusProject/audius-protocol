module.exports = {
  providerOptions: {
    // intentionally set to lower than 50 (default) to skip a test that requires 40 accounts
    'total_accounts': 20
  },
  skipFiles: [
    'test'
  ]
}
