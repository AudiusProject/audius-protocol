const _ = require('lodash')

const config = require('../../../config')
const {
  MetricNames
} = require('../../prometheusMonitoring/prometheus.constants')
const CNodeToSpIdMapManager = require('../CNodeToSpIdMapManager')
const { makeGaugeIncToRecord } = require('../stateMachineUtils')
const {
  SyncType,
  QUEUE_NAMES,
  SYNC_MODES
} = require('../stateMachineConstants')
const {
  getNewOrExistingSyncReq
} = require('../stateReconciliation/stateReconciliationUtils')
const { computeSyncModeForUserAndReplica } = require('./stateMonitoringUtils')

const thisContentNodeEndpoint = config.get('creatorNodeEndpoint')
const minSecondaryUserSyncSuccessPercent =
  config.get('minimumSecondaryUserSyncSuccessPercent') / 100
const minFailedSyncRequestsBeforeReconfig = config.get(
  'minimumFailedSyncRequestsBeforeReconfig'
)

/**
 * Processes a job to find and return sync requests that should be issued for the given array of users.
 *
 * @param {Object} param job data
 * @param {Object} param.logger the logger that can be filtered by jobName and jobId
 * @param {Object[]} param.users array of { primary, secondary1, secondary2, primarySpID, secondary1SpID, secondary2SpID, user_id, wallet}
 * @param {string[]} param.unhealthyPeers array of unhealthy peers
 * @param {Object} param.replicaToUserInfoMap map(secondary endpoint => map(user wallet => { clock, filesHash }))
 * @param {string (secondary endpoint): Object{ successRate: number (0-1), successCount: number, failureCount: number }} param.userSecondarySyncMetricsMap mapping of each secondary to the success metrics the nodeUser has had syncing to it
 */
module.exports = async function ({
  users,
  unhealthyPeers,
  replicaToUserInfoMap,
  userSecondarySyncMetricsMap,
  logger
}) {
  _validateJobData(
    logger,
    users,
    unhealthyPeers,
    replicaToUserInfoMap,
    userSecondarySyncMetricsMap
  )

  const unhealthyPeersSet = new Set(unhealthyPeers || [])
  const metricsToRecord = []

  // Mapping of primary -> (secondary -> { result: numTimesSeenResult })
  const primaryToSecondaryToResultCountsMap = {}

  // Find any syncs that should be performed from each user to any of their secondaries
  let syncReqsToEnqueue = []
  let duplicateSyncReqs = []
  let errors = []
  for (const user of users) {
    const userSecondarySyncMetrics = userSecondarySyncMetricsMap[
      user.wallet
    ] || {
      [user.secondary1]: { successRate: 1, failureCount: 0 },
      [user.secondary2]: { successRate: 1, failureCount: 0 }
    }

    const {
      syncReqsToEnqueue: userSyncReqsToEnqueue,
      duplicateSyncReqs: userDuplicateSyncReqs,
      errors: userErrors,
      resultBySecondary: userResultsBySecondary
    } = await _findSyncsForUser(
      user,
      unhealthyPeersSet,
      userSecondarySyncMetrics,
      minSecondaryUserSyncSuccessPercent,
      minFailedSyncRequestsBeforeReconfig,
      replicaToUserInfoMap,
      logger
    )

    if (userSyncReqsToEnqueue?.length) {
      syncReqsToEnqueue = syncReqsToEnqueue.concat(userSyncReqsToEnqueue)
    } else if (userDuplicateSyncReqs?.length) {
      duplicateSyncReqs = duplicateSyncReqs.concat(userDuplicateSyncReqs)
    } else if (userErrors?.length) errors = errors.concat(userErrors)

    // Increment total counters for the user's 2 secondaries so we can report an aggregate total
    const { primary } = user
    if (!primaryToSecondaryToResultCountsMap[primary]) {
      primaryToSecondaryToResultCountsMap[primary] = {}
    }
    for (const [secondary, resultForSecondary] of Object.entries(
      userResultsBySecondary
    )) {
      if (!primaryToSecondaryToResultCountsMap[primary][secondary]) {
        primaryToSecondaryToResultCountsMap[primary][secondary] = {}
      }
      if (
        !primaryToSecondaryToResultCountsMap[primary][secondary][
          resultForSecondary
        ]
      ) {
        primaryToSecondaryToResultCountsMap[primary][secondary][
          resultForSecondary
        ] = 0
      }
      primaryToSecondaryToResultCountsMap[primary][secondary][
        resultForSecondary
      ]++
    }
  }

  // Map the result of each findSyncs call to metrics for the reason a sync was found / not found
  for (const [primary, secondaryToResultCountMap] of Object.entries(
    primaryToSecondaryToResultCountsMap
  )) {
    for (const [secondary, resultCountMap] of Object.entries(
      secondaryToResultCountMap
    )) {
      for (const [labelValue, metricValue] of Object.entries(resultCountMap)) {
        metricsToRecord.push(
          makeGaugeIncToRecord(
            MetricNames.FIND_SYNC_REQUEST_COUNTS_GAUGE,
            metricValue,
            { result: labelValue }
          )
        )

        // Log so we can find the primary+secondary for each result, but don't spam logs with the default result
        if (labelValue !== 'not_checked') {
          logger.info(
            `Incrementing gauge for metric ${MetricNames.FIND_SYNC_REQUEST_COUNTS_GAUGE} from primary=${primary} to secondary=${secondary} with result=${labelValue}`
          )
        }
      }
    }
  }
  return {
    duplicateSyncReqs,
    errors,
    jobsToEnqueue: syncReqsToEnqueue?.length
      ? {
          [QUEUE_NAMES.STATE_RECONCILIATION]: syncReqsToEnqueue
        }
      : {},
    metricsToRecord
  }
}

const _validateJobData = (
  logger,
  users,
  unhealthyPeers,
  replicaToUserInfoMap,
  userSecondarySyncMetricsMap
) => {
  if (typeof logger !== 'object') {
    throw new Error(
      `Invalid type ("${typeof logger}") or value ("${logger}") of logger param`
    )
  }
  if (!(users instanceof Array)) {
    throw new Error(
      `Invalid type ("${typeof users}") or value ("${users}") of users param`
    )
  }
  if (!(unhealthyPeers instanceof Array)) {
    throw new Error(
      `Invalid type ("${typeof unhealthyPeers}") or value ("${unhealthyPeers}") of unhealthyPeers param`
    )
  }
  if (
    typeof replicaToUserInfoMap !== 'object' ||
    replicaToUserInfoMap instanceof Array
  ) {
    throw new Error(
      `Invalid type ("${typeof replicaToUserInfoMap}") or value ("${replicaToUserInfoMap}") of replicaToUserInfoMap`
    )
  }
  if (
    typeof userSecondarySyncMetricsMap !== 'object' ||
    userSecondarySyncMetricsMap instanceof Array
  ) {
    throw new Error(
      `Invalid type ("${typeof userSecondarySyncMetricsMap}") or value ("${userSecondarySyncMetricsMap}") of userSecondarySyncMetricsMap`
    )
  }
}

/**
 * Determines which sync requests should be sent for a given user to any of their secondaries.
 *
 * @param {Object} user { primary, secondary1, secondary2, primarySpID, secondary1SpID, secondary2SpID, user_id, wallet}
 * @param {Set<string>} unhealthyPeers set of unhealthy peers
 * @param {string (secondary endpoint): Object{ successRate: number (0-1), successCount: number, failureCount: number }} userSecondarySyncMetricsMap mapping of each secondary to the success metrics the user has had syncing to it
 * @param {number} minSecondaryUserSyncSuccessPercent 0-1 minimum sync success rate a secondary must have to perform a sync to it
 * @param {number} minFailedSyncRequestsBeforeReconfig minimum number of failed sync requests to a secondary before the user's replica set gets updated to not include the secondary
 * @param {Object} replicaToUserInfoMap map(secondary endpoint => map(user wallet => { clock value, filesHash }))
 */
const _findSyncsForUser = async (
  user,
  unhealthyPeers,
  userSecondarySyncMetricsMap,
  minSecondaryUserSyncSuccessPercent,
  minFailedSyncRequestsBeforeReconfig,
  replicaToUserInfoMap,
  logger
) => {
  const syncReqsToEnqueue = []
  const duplicateSyncReqs = []
  const errors = []

  const {
    wallet,
    primary,
    secondary1,
    secondary2,
    secondary1SpID,
    secondary2SpID
  } = user

  const resultBySecondary = {
    [secondary1]: 'not_checked',
    [secondary2]: 'not_checked'
  }

  // Only sync from this node to other nodes if this node is the user's primary
  if (primary !== thisContentNodeEndpoint) {
    return {
      resultBySecondary
    }
  }

  const replicaSetNodesToObserve = [
    { endpoint: secondary1, spId: secondary1SpID },
    { endpoint: secondary2, spId: secondary2SpID }
  ]

  // filter out false-y values to account for incomplete replica sets
  const secondariesInfo = replicaSetNodesToObserve.filter(
    (entry) => entry.endpoint
  )

  // For each secondary, add a potential sync request if healthy
  for (const secondaryInfo of secondariesInfo) {
    const secondary = secondaryInfo.endpoint

    const { successRate, failureCount } = userSecondarySyncMetricsMap[secondary]

    // Secondary is unhealthy if we already marked it as unhealthy previously -- don't sync to it
    if (unhealthyPeers.has(secondary)) {
      resultBySecondary[secondary] = 'no_sync_already_marked_unhealthy'
      continue
    }

    // Secondary is unhealthy if its spID is mismatched -- don't sync to it
    if (
      CNodeToSpIdMapManager.getCNodeEndpointToSpIdMap()[secondary] !==
      secondaryInfo.spId
    ) {
      resultBySecondary[secondary] = 'no_sync_sp_id_mismatch'
      continue
    }

    // Secondary has too low of a success rate -- don't sync to it
    if (
      failureCount >= minFailedSyncRequestsBeforeReconfig &&
      successRate < minSecondaryUserSyncSuccessPercent
    ) {
      resultBySecondary[secondary] = 'no_sync_success_rate_too_low'
      continue
    }

    // Determine if secondary requires a sync by comparing its user data against primary (this node)
    const { clock: primaryClock, filesHash: primaryFilesHash } =
      replicaToUserInfoMap[primary][wallet]
    const { clock: secondaryClock, filesHash: secondaryFilesHash } =
      replicaToUserInfoMap[secondary][wallet]

    let syncMode
    try {
      syncMode = await computeSyncModeForUserAndReplica({
        wallet,
        primaryClock,
        secondaryClock,
        primaryFilesHash,
        secondaryFilesHash
      })
    } catch (e) {
      errors.push(
        `Error computing sync mode for user ${wallet} and secondary ${secondary} - ${e.message}`
      )
      continue
    }

    if (syncMode === SYNC_MODES.SyncSecondaryFromPrimary) {
      try {
        const { duplicateSyncReq, syncReqToEnqueue } = getNewOrExistingSyncReq({
          userWallet: wallet,
          primaryEndpoint: thisContentNodeEndpoint,
          secondaryEndpoint: secondary,
          syncType: SyncType.Recurring
        })

        if (!_.isEmpty(syncReqToEnqueue)) {
          resultBySecondary[secondary] =
            'new_sync_request_enqueued_primary_to_secondary'
          syncReqsToEnqueue.push(syncReqToEnqueue)
        } else if (!_.isEmpty(duplicateSyncReq)) {
          resultBySecondary[secondary] = 'sync_request_already_enqueued'
          duplicateSyncReqs.push(duplicateSyncReq)
        } else {
          resultBySecondary[secondary] = 'new_sync_request_unable_to_enqueue'
        }
      } catch (e) {
        resultBySecondary[secondary] = 'no_sync_unexpected_error'
        errors.push(
          `Error getting new or existing sync request for user ${wallet} and secondary ${secondary} - ${e.message}`
        )
        continue
      }
    } else if (syncMode === SYNC_MODES.MergePrimaryAndSecondary) {
      /**
       * TODO - currently just logs as placeholder
       * 1. Primary will sync all content from secondary
       * 2. Primary will force secondary to wipe its local state and resync all content
       */
      logger.info(
        `[findSyncRequests][_findSyncsForUser][MergePrimaryAndSecondary = true][SyncType = ${SyncType.Recurring}] wallet ${wallet} secondary ${secondary} Clocks: [${primaryClock},${secondaryClock}] Files hashes: [${primaryFilesHash},${secondaryFilesHash}]`
      )

      // Note that this metric says a sync was enqueued, but once implemented it could be a duplicate so will need to be changed to be more like the log in the if block above this
      resultBySecondary[secondary] =
        'new_sync_request_enqueued_secondary_to_primary'
    } else if (syncMode === SYNC_MODES.None) {
      resultBySecondary[secondary] = 'no_sync_secondary_data_matches_primary'
    }
  }

  return {
    syncReqsToEnqueue,
    duplicateSyncReqs,
    errors,
    resultBySecondary
  }
}
