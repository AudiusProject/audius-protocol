import type { LoDashStatic } from 'lodash'
import type { DecoratedJobParams, DecoratedJobReturnValue } from '../types'
import type {
  FindSyncRequestsJobParams,
  FindSyncRequestsJobReturnValue,
  OutcomeCountsMap,
  ReplicaToAllUserInfoMaps,
  StateMonitoringUser
} from './types'
import type {
  IssueSyncRequestJobParams,
  SecondarySyncHealthTrackerState
} from '../stateReconciliation/types'

// eslint-disable-next-line import/no-unresolved
import { QUEUE_NAMES } from '../stateMachineConstants'
import { getMapOfCNodeEndpointToSpId } from '../../ContentNodeInfoManager'
import { instrumentTracing, tracing } from '../../../tracer'
import { SecondarySyncHealthTracker } from '../stateReconciliation/SecondarySyncHealthTracker'
import { makeGaugeIncToRecord } from '../../prometheusMonitoring/prometheusUsageUtils'

const _: LoDashStatic = require('lodash')

const config = require('../../../config')
const {
  METRIC_NAMES
} = require('../../prometheusMonitoring/prometheus.constants')
const { SyncType, SYNC_MODES } = require('../stateMachineConstants')
const {
  getNewOrExistingSyncReq
} = require('../stateReconciliation/stateReconciliationUtils')
const { computeSyncModeForUserAndReplica } = require('./stateMonitoringUtils')

const thisContentNodeEndpoint = config.get('creatorNodeEndpoint')

type FindSyncsForUserResult = {
  syncReqsToEnqueue: IssueSyncRequestJobParams[]
  duplicateSyncReqs: IssueSyncRequestJobParams[]
  errors: string[]
  outcomesBySecondary: {
    [secondary: string]: {
      syncMode: string
      result: string
    }
  }
}

/**
 * Processes a job to find and return sync requests that should be issued for the given array of users.
 *
 * @param {Object} param job data
 * @param {Object} param.logger the logger that can be filtered by jobName and jobId
 * @param {Object[]} param.users array of { primary, secondary1, secondary2, primarySpID, secondary1SpID, secondary2SpID, user_id, wallet}
 * @param {string[]} param.unhealthyPeers array of unhealthy peers
 * @param {Object} param.replicaToAllUserInfoMaps map(secondary endpoint => map(user wallet => { clock, filesHash }))
 * @param {SecondarySyncHealthTrackerState} param.secondarySyncHealthTrackerState used to determine if wallet should continue action on secondary
 */
async function findSyncRequests({
  users,
  unhealthyPeers,
  replicaToAllUserInfoMaps,
  secondarySyncHealthTrackerState,
  logger
}: DecoratedJobParams<FindSyncRequestsJobParams>): Promise<
  DecoratedJobReturnValue<FindSyncRequestsJobReturnValue>
> {
  const unhealthyPeersSet = new Set(unhealthyPeers || [])
  const metricsToRecord = []
  const cNodeEndpointToSpIdMap = await getMapOfCNodeEndpointToSpId(logger)

  // mapping ( syncMode => mapping ( result => count ) )
  const outcomeCountsMap: OutcomeCountsMap = {}

  // Find any syncs that should be performed from each user to any of their secondaries
  let syncReqsToEnqueue: IssueSyncRequestJobParams[] = []
  let duplicateSyncReqs: IssueSyncRequestJobParams[] = []
  let errors: string[] = []
  for (const user of users) {
    const { wallet, primary } = user
    const {
      syncReqsToEnqueue: userSyncReqsToEnqueue,
      duplicateSyncReqs: userDuplicateSyncReqs,
      errors: userErrors,
      outcomesBySecondary: userOutcomesBySecondary
    } = await _findSyncsForUser(
      user,
      unhealthyPeersSet,
      secondarySyncHealthTrackerState,
      replicaToAllUserInfoMaps,
      cNodeEndpointToSpIdMap
    )

    if (userSyncReqsToEnqueue?.length) {
      syncReqsToEnqueue = syncReqsToEnqueue.concat(userSyncReqsToEnqueue)
    }
    if (userDuplicateSyncReqs?.length) {
      duplicateSyncReqs = duplicateSyncReqs.concat(userDuplicateSyncReqs)
    }
    if (userErrors?.length) {
      errors = errors.concat(userErrors)
    }

    // Emit a log for every result except for default
    for (const [secondary, outcome] of Object.entries(
      userOutcomesBySecondary
    )) {
      if (outcome.result !== 'not_checked') {
        logger.info(
          `Recorded findSyncRequests from primary=${primary} to secondary=${secondary} for wallet ${wallet} with syncMode=${outcome.syncMode} and result=${outcome.result}`
        )
      }
    }

    // Update aggregate outcome counts for metric reporting
    for (const outcome of Object.values(userOutcomesBySecondary)) {
      const { syncMode, result } = outcome
      if (!outcomeCountsMap[syncMode]) {
        outcomeCountsMap[syncMode] = {}
      }
      if (!outcomeCountsMap[syncMode][result]) {
        outcomeCountsMap[syncMode][result] = 0
      }
      outcomeCountsMap[syncMode][result] += 1
    }
  }

  // Report aggregate metrics
  for (const [syncMode, resultCountsMap] of Object.entries(outcomeCountsMap)) {
    for (const [result, count] of Object.entries(resultCountsMap)) {
      metricsToRecord.push(
        makeGaugeIncToRecord(
          METRIC_NAMES.FIND_SYNC_REQUEST_COUNTS_GAUGE,
          count,
          { sync_mode: _.snakeCase(syncMode), result }
        )
      )
    }
  }

  return {
    duplicateSyncReqs,
    errors,
    jobsToEnqueue: syncReqsToEnqueue?.length
      ? { [QUEUE_NAMES.RECURRING_SYNC]: syncReqsToEnqueue }
      : undefined,
    metricsToRecord
  }
}

/**
 * Determines which sync requests should be sent for a given user to any of their secondaries.
 *
 * @param {Object} user { primary, secondary1, secondary2, primarySpID, secondary1SpID, secondary2SpID, user_id, wallet}
 * @param {Set<string>} unhealthyPeers set of unhealthy peers
 * @param {SecondarySyncHealthTrackerState} secondarySyncHealthTrackerState used to determine if wallet should continue action on secondary
 * @param {Object} replicaToAllUserInfoMaps map(secondary endpoint => map(user wallet => { clock value, filesHash }))
 * @param {Map<string, number>} cNodeEndpointToSpIdMap map of cnode endpoints to SP IDs
 */
async function _findSyncsForUser(
  user: StateMonitoringUser,
  unhealthyPeers: Set<string>,
  secondarySyncHealthTrackerState: SecondarySyncHealthTrackerState,
  replicaToAllUserInfoMaps: ReplicaToAllUserInfoMaps,
  cNodeEndpointToSpIdMap: Map<string, number>
): Promise<FindSyncsForUserResult> {
  const {
    wallet,
    primary,
    secondary1,
    secondary2,
    secondary1SpID,
    secondary2SpID
  } = user

  const outcomesBySecondary = {
    [secondary1]: { syncMode: SYNC_MODES.None, result: 'not_checked' },
    [secondary2]: { syncMode: SYNC_MODES.None, result: 'not_checked' }
  }

  // Only sync from this node to other nodes if this node is the user's primary
  if (primary !== thisContentNodeEndpoint) {
    return {
      outcomesBySecondary,
      syncReqsToEnqueue: [],
      duplicateSyncReqs: [],
      errors: []
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

  const syncReqsToEnqueue = []
  const duplicateSyncReqs = []
  const errors: string[] = []

  const secondarySyncHealthTracker = new SecondarySyncHealthTracker(
    secondarySyncHealthTrackerState
  )

  // For each secondary, add a potential sync request if healthy
  for (const secondaryInfo of secondariesInfo) {
    const secondary = secondaryInfo.endpoint

    // Secondary is unhealthy if we already marked it as unhealthy previously -- don't sync to it
    if (unhealthyPeers.has(secondary)) {
      outcomesBySecondary[secondary].result = 'no_sync_already_marked_unhealthy'
      continue
    }

    // Secondary is unhealthy if its spID is mismatched -- don't sync to it
    const spIdFromChain = cNodeEndpointToSpIdMap.get(secondary)
    if (spIdFromChain !== secondaryInfo.spId) {
      outcomesBySecondary[secondary].result = 'no_sync_sp_id_mismatch'
      continue
    }

    // Secondary has too low of a success rate -- don't sync to it
    const walletOnSecondaryExceedsMaxErrorsAllowed =
      secondarySyncHealthTracker.doesWalletOnSecondaryExceedMaxErrorsAllowed(
        wallet,
        secondary
      )
    if (walletOnSecondaryExceedsMaxErrorsAllowed) {
      outcomesBySecondary[secondary].result = 'no_sync_max_errors_encountered'
      continue
    }

    // Determine if secondary requires a sync by comparing its user data against primary (this node)
    let syncMode
    const primaryUserInfo = replicaToAllUserInfoMaps[primary]?.[wallet]
    const secondaryUserInfo = replicaToAllUserInfoMaps[secondary]?.[wallet]

    if (_.isEmpty(primaryUserInfo) || _.isEmpty(secondaryUserInfo)) {
      let missingFor
      if (_.isEmpty(primaryUserInfo) && _.isEmpty(secondaryUserInfo)) {
        missingFor = 'primary and secondary'
      } else if (_.isEmpty(primaryUserInfo)) missingFor = 'primary'
      else missingFor = 'secondary'
      tracing.error(
        `missing user info for ${missingFor} - maybe batch_clock_status failed earlier`
      )
      outcomesBySecondary[secondary].result = 'no_sync_unexpected_error'
      continue
    }

    const { clock: primaryClock, filesHash: primaryFilesHash } = primaryUserInfo

    const { clock: secondaryClock, filesHash: secondaryFilesHash } =
      secondaryUserInfo

    try {
      syncMode = await computeSyncModeForUserAndReplica({
        wallet,
        primaryClock,
        secondaryClock,
        primaryFilesHash,
        secondaryFilesHash
      })
    } catch (e: any) {
      tracing.recordException(e)
      outcomesBySecondary[secondary].result =
        'no_sync_error_computing_sync_mode'
      errors.push(
        `Error computing sync mode for user ${wallet} and secondary ${secondary} - ${e.message}`
      )
      continue
    }

    let result = 'not_checked'
    if (syncMode === SYNC_MODES.None) {
      result = 'no_sync_secondary_data_matches_primary'
    } else if (
      syncMode === SYNC_MODES.SyncSecondaryFromPrimary ||
      syncMode === SYNC_MODES.MergePrimaryAndSecondary
    ) {
      try {
        const { duplicateSyncReq, syncReqToEnqueue } =
          await getNewOrExistingSyncReq({
            userWallet: wallet,
            primaryEndpoint: thisContentNodeEndpoint,
            secondaryEndpoint: secondary,
            syncType: SyncType.Recurring,
            syncMode
          })

        if (!_.isEmpty(syncReqToEnqueue)) {
          result = 'new_sync_request_enqueued'
          syncReqsToEnqueue.push(syncReqToEnqueue)
        } else if (!_.isEmpty(duplicateSyncReq)) {
          result = 'sync_request_already_enqueued'
          duplicateSyncReqs.push(duplicateSyncReq)
        } else {
          result = 'new_sync_request_unable_to_enqueue'
        }
      } catch (e: any) {
        tracing.recordException(e)
        result = 'no_sync_unexpected_error'
        errors.push(
          `Error getting new or existing sync request for syncMode ${syncMode}, user ${wallet} and secondary ${secondary} - ${e.message}`
        )
      }
    }

    outcomesBySecondary[secondary] = {
      syncMode,
      result
    }
  }

  return {
    syncReqsToEnqueue,
    duplicateSyncReqs,
    errors,
    outcomesBySecondary
  }
}

module.exports = async (
  params: DecoratedJobParams<FindSyncRequestsJobParams>
) => {
  const { parentSpanContext } = params
  const jobProcessor = instrumentTracing({
    name: 'findSyncRequests.jobProcessor',
    fn: findSyncRequests,
    options: {
      links: parentSpanContext
        ? [
            {
              context: parentSpanContext
            }
          ]
        : [],
      attributes: {
        [tracing.CODE_FILEPATH]: __filename
      }
    }
  })

  return await jobProcessor(params)
}
