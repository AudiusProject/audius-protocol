import type Logger from 'bunyan'
import type { LoDashStatic } from 'lodash'
import type { ReplicaSetEndpoints } from '../../types'
import type {
  DecoratedJobParams,
  DecoratedJobReturnValue,
  JobsToEnqueue
} from '../types'
import type {
  IssueSyncRequestJobParams,
  IssueSyncRequestJobReturnValue,
  SyncRequestAxiosParams
} from './types'
import { SyncStatus, getMaxSyncMonitoringMs } from '../../sync/syncUtil'

import { instrumentTracing, tracing } from '../../../tracer'
import {
  SYNC_MONITORING_RETRY_DELAY_MS,
  SYNC_MODES,
  SyncType,
  QUEUE_NAMES,
  MAX_ISSUE_MANUAL_SYNC_JOB_ATTEMPTS,
  MAX_ISSUE_RECURRING_SYNC_JOB_ATTEMPTS
} from '../stateMachineConstants'
import { getReplicaSetEndpointsByWallet } from '../../ContentNodeInfoManager'
import { SecondarySyncHealthTracker } from './SecondarySyncHealthTracker'
import { makeHistogramToRecord } from '../../prometheusMonitoring/prometheusUsageUtils'

const axios = require('axios')
const _: LoDashStatic = require('lodash')

const config = require('../../../config')
const models = require('../../../models')
const Utils = require('../../../utils')
const {
  METRIC_NAMES
} = require('../../prometheusMonitoring/prometheus.constants')
const { retrieveClockValueForUserFromReplica } = require('../stateMachineUtils')
const primarySyncFromSecondary = require('../../sync/primarySyncFromSecondary')
const SyncRequestDeDuplicator = require('./SyncRequestDeDuplicator')
const {
  generateDataForSignatureRecovery
} = require('../../sync/secondarySyncFromPrimaryUtils')
const { getSyncStatusByUuid } = require('./stateReconciliationUtils')
const initAudiusLibs = require('../../initAudiusLibs')
const { generateTimestampAndSignature } = require('../../../apiSigning')

const mergePrimaryAndSecondaryEnabled = config.get(
  'mergePrimaryAndSecondaryEnabled'
)

const secondarySyncHealthTracker = new SecondarySyncHealthTracker()

type HandleIssueSyncReqParams = {
  syncType: string
  syncMode: string
  syncRequestParameters: SyncRequestAxiosParams
  logger: Logger
}
type HandleIssueSyncReqResult = {
  result: string
  error?: string
  abort?: string
  syncReqsToEnqueue: IssueSyncRequestJobParams[]
  additionalSync?: IssueSyncRequestJobParams
}
type AdditionalSyncIsRequiredResponse = {
  outcome: string
  syncReqToEnqueue?: IssueSyncRequestJobParams
}

/**
 * Processes a job to issue a sync request from a user's primary (this node) to a user's secondary with syncType and syncMode
 * Secondary is specified in param.syncRequestParameters
 *
 * @param {Object} param job data
 * @param {Object} param.logger the logger that can be filtered by jobName and jobId
 * @param {string} param.syncType the type of sync (manual or recurring)
 * @param {string} param.syncMode from SYNC_MODES object
 * @param {Object} param.syncRequestParameters axios params to make the sync request. Shape: { baseURL, url, method, data }
 * @param {number} [param.attemptNumber] optional number of times this job has been run. It will be a no-op if it exceeds MAX_ISSUE_SYNC_JOB_ATTEMPTS
 */
async function issueSyncRequest({
  syncType,
  syncMode,
  syncRequestParameters,
  logger,
  attemptNumber = 1
}: DecoratedJobParams<IssueSyncRequestJobParams>): Promise<
  DecoratedJobReturnValue<IssueSyncRequestJobReturnValue>
> {
  const jobsToEnqueue: JobsToEnqueue = {
    [QUEUE_NAMES.MANUAL_SYNC]: [],
    [QUEUE_NAMES.RECURRING_SYNC]: []
  }
  let metricsToRecord = []

  const startTimeMs = Date.now()

  const { syncReqsToEnqueue, additionalSync, result, error, abort } =
    await _handleIssueSyncRequest({
      syncType,
      syncMode,
      syncRequestParameters,
      logger
    })

  if (error) {
    logger.error(
      `Issuing sync request error: ${error}. Prometheus result: ${result}`
    )
  }

  if (abort) {
    logger.warn(
      `Issuing sync request abort: ${abort}. Prometheus result: ${result}`
    )
  }

  // Enqueue a new sync request if one needs to be enqueued and we haven't retried too many times yet
  const maxRetries =
    additionalSync?.syncType === SyncType.Manual
      ? MAX_ISSUE_MANUAL_SYNC_JOB_ATTEMPTS
      : MAX_ISSUE_RECURRING_SYNC_JOB_ATTEMPTS
  if (!_.isEmpty(additionalSync)) {
    if (attemptNumber < maxRetries) {
      logger.debug(
        `Retrying issue-sync-request after attempt #${attemptNumber}`
      )
      const queueName =
        additionalSync?.syncType === SyncType.Manual
          ? QUEUE_NAMES.MANUAL_SYNC
          : QUEUE_NAMES.RECURRING_SYNC
      jobsToEnqueue[queueName]!.push({
        ...additionalSync!,
        attemptNumber: attemptNumber + 1
      })
    } else {
      logger.warn(
        `Gave up retrying issue-sync-request (type: ${additionalSync?.syncType}) after ${attemptNumber} failed attempts`
      )
    }
  }

  jobsToEnqueue[QUEUE_NAMES.RECURRING_SYNC]!.push(...syncReqsToEnqueue)

  // Make metrics to record
  metricsToRecord = [
    makeHistogramToRecord(
      METRIC_NAMES.ISSUE_SYNC_REQUEST_DURATION_SECONDS_HISTOGRAM,
      (Date.now() - startTimeMs) / 1000, // Metric is in seconds
      {
        sync_type: _.snakeCase(syncType),
        sync_mode: _.snakeCase(syncMode),
        result: _.snakeCase(result)
      }
    )
  ]

  return {
    jobsToEnqueue,
    metricsToRecord,
    error
  }
}

async function _handleIssueSyncRequest({
  syncType,
  syncMode,
  syncRequestParameters,
  logger
}: HandleIssueSyncReqParams): Promise<HandleIssueSyncReqResult> {
  const syncReqsToEnqueue: IssueSyncRequestJobParams[] = []

  if (!syncRequestParameters?.data?.wallet?.length) {
    return { result: 'failure_missing_wallet', syncReqsToEnqueue }
  }
  if (syncMode === SYNC_MODES.None) {
    return { result: 'success', syncReqsToEnqueue }
  }

  const userWallet = syncRequestParameters.data.wallet[0]
  const secondaryEndpoint = syncRequestParameters.baseURL
  const immediate = syncRequestParameters.data.immediate

  const logMsgString = `_handleIssueSyncRequest() (${syncType})(${syncMode}) User ${userWallet} | Secondary: ${secondaryEndpoint}`

  /**
   * Remove sync from SyncRequestDeDuplicator once it moves to Active status, before processing.
   * It is ok for two identical syncs to be present in Active and Waiting, just not two in Waiting.
   */
  // eslint-disable-next-line node/no-sync
  await SyncRequestDeDuplicator.removeSync(
    syncType,
    userWallet,
    secondaryEndpoint,
    immediate
  )

  /**
   * Do not issue syncRequest if SecondaryUserSyncFailureCountForToday already exceeded threshold
   */
  await secondarySyncHealthTracker.computeWalletOnSecondaryExceedsMaxErrorsAllowed(
    [{ wallet: userWallet, secondary1: secondaryEndpoint }]
  )

  const walletOnSecondaryExceedsMaxErrorsAllowed =
    await secondarySyncHealthTracker.doesWalletOnSecondaryExceedMaxErrorsAllowed(
      userWallet,
      secondaryEndpoint
    )

  if (walletOnSecondaryExceedsMaxErrorsAllowed) {
    return {
      result: 'failure_secondary_failure_count_threshold_met',
      error: `${logMsgString} || Wallet exceeded max errors allowed. Will not issue further syncRequests today.`,
      syncReqsToEnqueue
    }
  }

  /**
   * For now, if primarySyncFromSecondary fails, we just log & error without any retries
   * Eventually should make this more robust, but proceeding with caution
   */
  if (
    syncMode === SYNC_MODES.MergePrimaryAndSecondary ||
    syncMode === SYNC_MODES.MergePrimaryThenWipeSecondary
  ) {
    const syncEvenIfDisabled = syncRequestParameters.data.sync_even_if_disabled

    // Short-circuit if this syncMode is disabled and override flag is not set
    if (!mergePrimaryAndSecondaryEnabled && !syncEvenIfDisabled) {
      return { result: 'success_mode_disabled', syncReqsToEnqueue }
    }

    const libs = await initAudiusLibs({ logger })
    const userReplicaSet: ReplicaSetEndpoints =
      await getReplicaSetEndpointsByWallet({
        libs,
        wallet: userWallet,
        parentLogger: logger
      })

    const syncCorrectnessAbort = _ensureSyncsEnqueuedToCorrectNodes(
      userReplicaSet,
      syncMode,
      syncRequestParameters.baseURL
    )
    if (syncCorrectnessAbort) {
      return {
        result: 'abort_sync_correctness',
        abort: `${logMsgString}: ${syncCorrectnessAbort}`,
        syncReqsToEnqueue
      }
    }

    const response = await primarySyncFromSecondary({
      wallet: userWallet,
      secondary: secondaryEndpoint
    })

    if (response) {
      const { error, abort, result } = response

      if (error) {
        return {
          result,
          error: `${logMsgString}: ${error}`,
          syncReqsToEnqueue
        }
      }

      if (abort) {
        return {
          result,
          abort: `${logMsgString}: ${abort}`,
          syncReqsToEnqueue
        }
      }
    }
  }

  /**
   * Issue sync request to secondary
   * - If SyncMode = MergePrimaryAndSecondary - issue sync request with forceResync = true
   *   or if SyncMode = MergePrimaryThenWipeSecondary - issue sync request with forceWipe = true
   *    - above call to primarySyncFromSecondary must have succeeded to get here
   *    - Only apply forceResync flag to this initial sync request, any future syncs proceed as usual
   */
  let syncReqResp
  try {
    if (
      syncMode === SYNC_MODES.MergePrimaryAndSecondary ||
      syncMode === SYNC_MODES.MergePrimaryThenWipeSecondary
    ) {
      const data = generateDataForSignatureRecovery(syncRequestParameters.data)
      const { timestamp, signature } = generateTimestampAndSignature(
        data,
        config.get('delegatePrivateKey')
      )

      syncReqResp = await axios({
        ...syncRequestParameters,
        data: {
          ...syncRequestParameters.data,
          forceResync: syncMode === SYNC_MODES.MergePrimaryAndSecondary,
          forceWipe: syncMode === SYNC_MODES.MergePrimaryThenWipeSecondary,
          timestamp,
          signature
        }
      })
    } else {
      syncReqResp = await axios(syncRequestParameters)
    }
  } catch (e: any) {
    tracing.recordException(e)

    // Retry a failed sync in all scenarios except recovering orphaned data
    let additionalSync
    if (syncMode !== SYNC_MODES.MergePrimaryThenWipeSecondary) {
      additionalSync = {
        syncType,
        syncMode: SYNC_MODES.SyncSecondaryFromPrimary,
        syncRequestParameters,
        parentSpanContext: tracing.currentSpanContext()
      }
    }

    return {
      result: 'failure_issue_sync_request',
      error: `${logMsgString} || Error issuing sync request: ${
        e.message
      } - ${JSON.stringify(e.response?.data)}`,
      syncReqsToEnqueue,
      additionalSync
    }
  }
  const syncUuid: string | undefined = syncReqResp?.data?.data?.syncUuid

  // Wait until has sync has completed (within time threshold)
  let outcome
  let additionalSync
  if (syncUuid?.length) {
    ;({ outcome, syncReqToEnqueue: additionalSync } =
      await _additionalSyncIsRequired(
        syncType,
        syncRequestParameters,
        syncUuid,
        logger
      ))
  } else {
    // This is only reached if the node processing the sync isn't up to date (i.e., doesn't return syncUuid)
    const primaryClockValue = (await _getUserPrimaryClockValues([userWallet]))[
      userWallet
    ]
    ;({ outcome, syncReqToEnqueue: additionalSync } =
      await _deprecatedAdditionalSyncIsRequired(
        primaryClockValue,
        syncType,
        syncMode,
        syncRequestParameters,
        logger
      ))
  }

  tracing.info(outcome)

  return {
    result: outcome,
    syncReqsToEnqueue,
    additionalSync
  }
}

/**
 * Given wallets array, queries DB and returns a map of all users with
 *    those wallets and their clock values, or -1 if wallet not found
 *
 * @returns map(wallet -> clock val)
 */
const _getUserPrimaryClockValues = async (wallets: string[]) => {
  // Query DB for all cnodeUsers with walletPublicKey in `wallets` arg array
  const cnodeUsersFromDB = await models.CNodeUser.findAll({
    where: {
      walletPublicKey: {
        [models.Sequelize.Op.in]: wallets
      }
    }
  })

  // Initialize clock values for all users to -1
  const cnodeUserClockValuesMap: { [wallet: string]: number } = {}
  wallets.forEach((wallet: string) => {
    cnodeUserClockValuesMap[wallet] = -1
  })

  // Populate clock values into map with DB data
  cnodeUsersFromDB.forEach((cnodeUser: any) => {
    cnodeUserClockValuesMap[cnodeUser.walletPublicKey] = cnodeUser.clock
  })

  return cnodeUserClockValuesMap
}

/**
 * @deprecated - For backwards compat only. Use _additionalSyncIsRequired to poll by UUID instead of clock value.
 * TODO: Remove after all SPs are updated to v0.3.69. Close https://linear.app/audius/issue/CON-464/remove-deprecatedadditionalsyncisrequired-after-v0369
 *
 * Monitor an ongoing sync operation for a given secondaryUrl and user wallet
 * Return boolean indicating if an additional sync is required and reason why (or 'none' if no additional sync is required)
 * Record SyncRequest outcomes to SecondarySyncHealthTracker
 */
const _deprecatedAdditionalSyncIsRequired = async (
  primaryClockValue = -1,
  syncType: string,
  syncMode: string,
  syncRequestParameters: SyncRequestAxiosParams,
  logger: any
): Promise<AdditionalSyncIsRequiredResponse> => {
  const userWallet = syncRequestParameters.data.wallet[0]
  const secondaryUrl = syncRequestParameters.baseURL
  const logMsgString = `deprecatedAdditionalSyncIsRequired() (${syncType}): wallet ${userWallet} secondary ${secondaryUrl} primaryClock ${primaryClockValue}`

  const startTimeMs = Date.now()
  const maxMonitoringTimeMs = startTimeMs + getMaxSyncMonitoringMs(syncType)

  /**
   * Poll secondary for sync completion, up to `maxMonitoringTimeMs`
   */

  let secondaryCaughtUpToPrimary = false
  let initialSecondaryClock = null
  let finalSecondaryClock = null

  while (Date.now() < maxMonitoringTimeMs) {
    try {
      const secondaryClockValue = await retrieveClockValueForUserFromReplica(
        secondaryUrl,
        userWallet
      )
      logger.info(`${logMsgString} secondaryClock ${secondaryClockValue}`)

      // Stop monitoring if the orphaned node successfully wiped the user's state
      if (
        syncMode === SYNC_MODES.MergePrimaryThenWipeSecondary &&
        secondaryClockValue === -1
      ) {
        return {
          outcome: 'success_orphan_wiped'
        }
      }

      // Record starting and current clock values for secondary to determine future action
      if (syncMode === SYNC_MODES.MergePrimaryAndSecondary) {
        initialSecondaryClock = -1
      } else if (initialSecondaryClock === null) {
        initialSecondaryClock = secondaryClockValue
      }
      finalSecondaryClock = secondaryClockValue

      /**
       * Stop monitoring if secondary has caught up to primary
       * Note - secondaryClockValue can be greater than primaryClockValue if additional
       *    data was written to primary after primaryClockValue was computed
       */
      if (
        secondaryClockValue >= primaryClockValue &&
        syncMode !== SYNC_MODES.MergePrimaryThenWipeSecondary
      ) {
        secondaryCaughtUpToPrimary = true
        break
      }
    } catch (e: any) {
      tracing.recordException(e)
      logger.warn(`${logMsgString} || Error: ${e.message}`)
    }

    // Delay between retries
    await Utils.timeout(SYNC_MONITORING_RETRY_DELAY_MS, false)
  }

  // Orphaned data sync failed to wipe the orphan node if we reach this far
  if (syncMode === SYNC_MODES.MergePrimaryThenWipeSecondary) {
    return {
      outcome: 'failure_orphan_not_wiped'
    }
  }

  const monitoringTimeMs = Date.now() - startTimeMs

  /**
   * As Primary for user, record SyncRequest outcomes to all secondaries
   * Also check whether additional sync is required
   */
  let additionalSyncIsRequired
  let outcome
  if (secondaryCaughtUpToPrimary) {
    outcome = 'success_secondary_caught_up'
    additionalSyncIsRequired = false
    logger.info(
      `${logMsgString} || Sync completed in ${monitoringTimeMs}ms. Prometheus result: ${outcome}`
    )

    // Secondary completed sync but is still behind primary since it was behind by more than max export range
    // Since syncs are all-or-nothing, if secondary clock has increased at all, we know it successfully completed sync
  } else if (finalSecondaryClock > initialSecondaryClock) {
    additionalSyncIsRequired = true
    outcome = 'success_secondary_partially_caught_up'
    logger.info(
      `${logMsgString} || Secondary successfully synced from clock ${initialSecondaryClock} to ${finalSecondaryClock} but hasn't caught up to Primary. Enqueuing additional syncRequest. Prometheus result: ${outcome}`
    )

    // (1) secondary did not catch up to primary AND (2) secondary did not complete sync
  } else {
    outcome = 'failure_secondary_failed_to_progress'
    await secondarySyncHealthTracker.recordFailure({
      secondary: secondaryUrl,
      wallet: userWallet,
      prometheusError: outcome
    })
    additionalSyncIsRequired = true
    logger.error(
      `${logMsgString} || Secondary failed to progress from clock ${initialSecondaryClock}. Enqueuing additional syncRequest. Prometheus result: ${outcome}`
    )
  }

  const response: AdditionalSyncIsRequiredResponse = { outcome }
  if (additionalSyncIsRequired) {
    response.syncReqToEnqueue = {
      syncType,
      syncMode: SYNC_MODES.SyncSecondaryFromPrimary,
      syncRequestParameters
    }
  }

  return response
}

/**
 * Monitor an ongoing sync operation for a given secondaryUrl and user wallet
 * Return boolean indicating if an additional sync is required and reason why
 * Record SyncRequest outcomes to SecondarySyncHealthTracker
 */
const _additionalSyncIsRequired = async (
  syncType: string,
  syncRequestParameters: SyncRequestAxiosParams,
  syncUuid: string,
  logger: any
): Promise<AdditionalSyncIsRequiredResponse> => {
  const userWallet = syncRequestParameters.data.wallet[0]
  const targetNode = syncRequestParameters.baseURL
  const logMsgString = `additionalSyncIsRequired() (${syncType}): wallet ${userWallet} secondary ${targetNode} syncUuid: ${syncUuid}`

  const startTimeMs = Date.now()
  const maxMonitoringTimeMs = startTimeMs + getMaxSyncMonitoringMs(syncType)

  /**
   * Poll target node for sync completion, up to `maxMonitoringTimeMs`
   */

  let syncStatus: SyncStatus | 'failure_polling_timed_out' = 'waiting'
  while (Date.now() < maxMonitoringTimeMs && syncStatus === 'waiting') {
    try {
      syncStatus = await getSyncStatusByUuid(targetNode, syncUuid)
    } catch (e: any) {
      tracing.recordException(e)
      logger.warn(`${logMsgString} || Error: ${e.message}`)
    }

    // Delay between retries
    await Utils.timeout(SYNC_MONITORING_RETRY_DELAY_MS, false)
  }

  if (!syncStatus) {
    syncStatus = 'failure_undefined_sync_status'
  } else if (syncStatus === 'waiting') {
    syncStatus = 'failure_polling_timed_out'
  }

  const response: AdditionalSyncIsRequiredResponse = { outcome: syncStatus }
  // Retry if the error was something that could be intermittent (e.g., network-related issues)
  if (
    syncStatus === 'failure_fetching_user_replica_set' ||
    syncStatus === 'failure_sync_secondary_from_primary' ||
    syncStatus === 'failure_export_wallet' ||
    syncStatus === 'failure_db_transaction'
  ) {
    response.syncReqToEnqueue = {
      syncType,
      syncMode: SYNC_MODES.SyncSecondaryFromPrimary,
      syncRequestParameters
    }
  }

  if (syncStatus?.startsWith('failure')) {
    await secondarySyncHealthTracker.recordFailure({
      secondary: targetNode,
      wallet: userWallet,
      prometheusError: syncStatus
    })
  }

  return response
}

const _ensureSyncsEnqueuedToCorrectNodes = (
  userReplicaSet: ReplicaSetEndpoints,
  syncMode: string,
  syncTargetEndpoint: string
) => {
  // Ensure this node is the user's primary
  const thisContentNodeEndpoint = config.get('creatorNodeEndpoint')
  if (userReplicaSet.primary !== thisContentNodeEndpoint) {
    return `This node is not primary for user. This node: ${thisContentNodeEndpoint} Primary: ${userReplicaSet.primary}`
  }

  // Ensure a MergePrimaryAndSecondary request is being made to a secondary
  if (
    syncMode === SYNC_MODES.MergePrimaryAndSecondary &&
    syncTargetEndpoint !== userReplicaSet.secondary1 &&
    syncTargetEndpoint !== userReplicaSet.secondary2
  ) {
    return `Sync request is not being made to secondary. Request endpoint: ${syncTargetEndpoint} Secondaries: [${userReplicaSet.secondary1},${userReplicaSet.secondary2}]`
  }

  // Ensure a MergePrimaryThenWipeSecondary (orphaned data) request is being made to a node outside the Replica Set
  if (
    syncMode === SYNC_MODES.MergePrimaryThenWipeSecondary &&
    (syncTargetEndpoint === userReplicaSet.primary ||
      syncTargetEndpoint === userReplicaSet.secondary1 ||
      syncTargetEndpoint === userReplicaSet.secondary2)
  ) {
    return `Orphaned data sync request is being made to node in replica set. Request endpoint: ${syncTargetEndpoint} Replica set: ${JSON.stringify(
      userReplicaSet
    )}`
  }

  return null
}

module.exports = async (
  params: DecoratedJobParams<IssueSyncRequestJobParams>
) => {
  const { parentSpanContext } = params
  const jobProcessor = instrumentTracing({
    name: 'issueSyncRequest.jobProcessor',
    fn: issueSyncRequest,
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
