const consistency1 = require('./test_1.js')
const { snapbackSMParallelSyncTest } = require('./test_snapbackSM.js')
const IpldBlacklistTest = require('./test_ipldBlacklist')
const replicaSetTest = require('./test_replicaSet')

module.exports = {
  consistency1,
  snapbackSMParallelSyncTest,
  IpldBlacklistTest,
  replicaSetTest
}
