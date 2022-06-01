/**
 * Updates replica sets of a user who has one or more unhealthy nodes as their primary or secondaries.
 * @param {number} jobId the id of the job being run
 * @param {Object} users { primary, secondary1, secondary2, primarySpID, secondary1SpID, secondary2SpID, user_id, wallet }
 * @param {Set<string>} unhealthyPeers set of unhealthy peers
 * @param {string (wallet): Object{ string (secondary endpoint): Object{ successRate: number (0-1), successCount: number, failureCount: number }}} userSecondarySyncMetricsMap mapping of user's wallet (string) to metrics for their sync success to secondaries
 * @param {Object} replicaSetNodesToUserWalletsMap map of <replica set node : wallets (string array)>
 * @param {Object} replicaSetNodesToUserClockStatusesMap map(replica set node => map(userWallet => clockValue))
 */
module.exports = async function (
  jobId,
  users, // TODO: This will be updated to only run for one user
  unhealthyPeers,
  userSecondarySyncMetricsMap,
  replicaSetNodesToUserWalletsMap,
  replicaSetNodesToUserClockStatusesMap
) {
  // TODO: Move snapback's `_aggregateOps` (decouple from the sync part of this function), `autoSelectCreatorNodes`, `determineNewReplicaSet`, and `issueUpdateReplicaSetOp` steps
  // into the *monitoring queue* and then make them output a single reconfig to execute here

  // TODO: Return data about updated replica set
  return {}
}
