const coreIntegration = require('./test_integration.js')
const { snapbackSMParallelSyncTest } = require('./test_snapbackSM.js')
const IpldBlacklistTest = require('./test_ipldBlacklist')

module.exports = {
  coreIntegration,
  snapbackSMParallelSyncTest,
  IpldBlacklistTest
}
