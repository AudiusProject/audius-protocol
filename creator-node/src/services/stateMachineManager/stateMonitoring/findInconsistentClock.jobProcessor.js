// TODO: do

/**
 * Processes a job to find and return reconfigurations of replica sets that
 * need to occur for the given array of users.
 *
 * @param {Object} param job data
 * @param {Object} param.logger a logger that can be filtered by jobName and jobId
 * @param {Object[]} param.users array of { primary, secondary1, secondary2, primarySpID, secondary1SpID, secondary2SpID, user_id, wallet }
 * @param {Set<string>} param.unhealthyPeers set of unhealthy peers
 * @param {Object} param.replicaToUserInfoMap map(secondary endpoint => map(user wallet => { clock, filesHash }))
 * @param {string (wallet): Object{ string (secondary endpoint): Object{ successRate: number (0-1), successCount: number, failureCount: number }}} param.userSecondarySyncMetricsMap mapping of nodeUser's wallet (string) to metrics for their sync success to secondaries
 */
module.exports = async function ({
  logger,
  users,
  unhealthyPeers,
  replicaToUserInfoMap,
  userSecondarySyncMetricsMap
}) {}
