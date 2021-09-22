module.exports = {
  providerOptions: {
    // intentionally set to lower than 50 (default) to skip a test that requires 40 accounts
    'total_accounts': 20
  },
  skipFiles: [
    'test/TestContract.sol',
    'test/MockDelegateManager.sol',
    'test/MockGovernance.sol',
    'test/MockStakingCaller.sol',
    'test/StakingUpgraded.sol',
    'test/GovernanceUpgraded.sol',
    'test/MockAccount.sol',
    'test/DelegateManagerV2Bad.sol',
    'test/MockWormhole.sol'
  ]
}
