const coreIntegration = require('./test_integration.js')
const { stateMachineParallelSyncTest } = require('./test_CN_StateMachine.js')
const IpldBlacklistTest = require('./test_ipldBlacklist')
const { userReplicaSetBlockSaturationTest } = require('./test_ursmBlockSaturation.js')
const { userReplicaSetManagerTest } = require('./test_userReplicaSetManager.js')
const { trackListenCountsTest } = require('./test_plays.js')

const StateMachineReconfigTests = require('./test_userReplicaSetNodes')

module.exports = {
  coreIntegration,
  stateMachineParallelSyncTest,
  IpldBlacklistTest,
  userReplicaSetManagerTest,
  userReplicaSetBlockSaturationTest,
  trackListenCountsTest,
  StateMachineReconfigTests
}
