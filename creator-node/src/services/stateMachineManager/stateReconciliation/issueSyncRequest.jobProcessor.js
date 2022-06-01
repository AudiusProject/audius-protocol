/**
 * Processes a job to issue a sync request for a user.
 * Only issues request to a healthy secondary when this node is the user's primary and has a clock value
 * greater than the secondary's clock value.
 *
 * @param {number} jobId the id of the job being run
 * @param {Object[]} users users to find mismatched clock values for and, as necessary, issue requests to sync data from this node to the user's secondary/secondaries
 * @param {Set<string>} unhealthyPeers the set of unhealthy content nodes that one or more `users` has as their primary or secondary
 * @param {Object} userSecondarySyncMetrics mapping of each secondary node to the success metrics the user has had syncing to it
 * @param {Object} replicaSetNodesToUserClockStatusesMap map(replica set node => map(userWallet => clockValue))
 * @returns {Object} data about which sync requests were successfully enqueued and which failed
 */
module.exports = async function (
  jobId,
  users, // TODO: This will change to be for a single user
  unhealthyPeers,
  userSecondarySyncMetricsMap,
  replicaSetNodesToUserClockStatusesMap
) {
  // TODO: Extract the part of snapback's _aggregateOps() code that
  //       finds potentialSyncRequests *into the monitoring queue*, and then
  //       pass it here (update params here) so that this can copy snapback's `issueSyncRequestsToSecondaries()`

  /**
   * TODO: Instead of how snapback currently has issueSyncRequestsToSecondaries() return: {
   *   syncRequestsRequired
   *   syncRequestsEnqueued,
   *   enqueueSyncRequestErrors
   * }
   *
   * make this job return more informative data: {
   *   syncReqsSuccessfullyEnqueued
   *   syncReqsFailedToEnqueue
   * }
   */
  return {}
}
