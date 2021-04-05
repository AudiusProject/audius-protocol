const coreIntegration = require('./test_integration.js')
const { snapbackSMParallelSyncTest } = require('./test_snapbackSM.js')
const IpldBlacklistTest = require('./test_ipldBlacklist')
const { userReplicaSetBlockSaturationTest } = require('./test_ursmBlockSaturation.js')
const { userReplicaSetManagerTest } = require('./test_userReplicaSetManager.js')


module.exports = {
  coreIntegration,
  snapbackSMParallelSyncTest,
  IpldBlacklistTest,
  userReplicaSetManagerTest,
  userReplicaSetBlockSaturationTest
}
