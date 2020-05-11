module.exports = {
  providerOptions: {
    'total_accounts': 20
  },
  skipFiles: [
    'test/TestContract.sol',
    'test/MockDelegateManager.sol',
    'test/MockGovernance.sol',
    'test/MockStakingCaller.sol'
  ]
}
