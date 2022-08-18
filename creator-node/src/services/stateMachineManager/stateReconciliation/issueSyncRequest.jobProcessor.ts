import type Logger from 'bunyan'
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
import type { AxiosRequestConfig } from 'axios'

import axios from 'axios'
import _ from 'lodash'

import { SemanticAttributes } from '@opentelemetry/semantic-conventions'

import config from '../../../config'

import Utils from '../../../utils'
import { METRIC_NAMES } from '../../prometheusMonitoring/prometheus.constants'
import {
  retrieveClockValueForUserFromReplica,
  makeHistogramToRecord
} from '../stateMachineUtils'
import SecondarySyncHealthTracker from './SecondarySyncHealthTracker'
import {
  SYNC_MONITORING_RETRY_DELAY_MS,
  QUEUE_NAMES,
  SYNC_MODES,
  SyncType,
  MAX_ISSUE_MANUAL_SYNC_JOB_ATTEMPTS,
  MAX_ISSUE_RECURRING_SYNC_JOB_ATTEMPTS
} from '../stateMachineConstants'
import primarySyncFromSecondary from '../../sync/primarySyncFromSecondary'
import SyncRequestDeDuplicator from './SyncRequestDeDuplicator'
import {
  instrumentTracing,
  recordException,
  currentSpanContext
} from '../../../utils/tracing'
import { generateDataForSignatureRecovery } from '../../sync/secondarySyncFromPrimaryUtils'
import { generateTimestampAndSignature } from '../../../apiSigning'
const models = require('../../../models')

const secondaryUserSyncDailyFailureCountThreshold = config.get(
  'secondaryUserSyncDailyFailureCountThreshold'
)
const maxSyncMonitoringDurationInMs = config.get(
  'maxSyncMonitoringDurationInMs'
)
const maxManualSyncMonitoringDurationInMs = config.get(
  'maxManualSyncMonitoringDurationInMs'
)
const mergePrimaryAndSecondaryEnabled = config.get(
  'mergePrimaryAndSecondaryEnabled'
)

type HandleIssueSyncReqParams = {
  syncType: string
  syncMode: string
  syncRequestParameters: SyncRequestAxiosParams
  logger: Logger
}
type HandleIssueSyncReqResult = {
  result: string
  error?: any
  syncReqToEnqueue?: IssueSyncRequestJobParams
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
const issueSyncRequest = async ({
  syncType,
  syncMode,
  syncRequestParameters,
  logger,
  attemptNumber = 1
}: DecoratedJobParams<IssueSyncRequestJobParams>): Promise<
  DecoratedJobReturnValue<IssueSyncRequestJobReturnValue>
> => {
  let jobsToEnqueue: JobsToEnqueue = {}
  let metricsToRecord = []
  let error: any = {}

  const startTimeMs = Date.now()

  const {
    syncReqToEnqueue,
    result,
    error: errorResp
  } = await handleIssueSyncRequest({
    syncType,
    syncMode,
    syncRequestParameters,
    logger
  })
  if (errorResp) {
    error = errorResp
    logger.error(error.message)
  }

  // Enqueue a new sync request if one needs to be enqueued and we haven't retried too many times yet
  const maxRetries =
    syncReqToEnqueue?.syncType === SyncType.Manual
      ? MAX_ISSUE_MANUAL_SYNC_JOB_ATTEMPTS
      : MAX_ISSUE_RECURRING_SYNC_JOB_ATTEMPTS
  if (!_.isEmpty(syncReqToEnqueue)) {
    if (attemptNumber < maxRetries) {
      logger.info(`Retrying issue-sync-request after attempt #${attemptNumber}`)
      const queueName =
        syncReqToEnqueue?.syncType === SyncType.Manual
          ? QUEUE_NAMES.MANUAL_SYNC
          : QUEUE_NAMES.RECURRING_SYNC
      jobsToEnqueue = {
        [queueName]: [{ ...syncReqToEnqueue, attemptNumber: attemptNumber + 1 }]
      }
    } else {
      logger.info(
        `Gave up retrying issue-sync-request (type: ${syncReqToEnqueue?.syncType}) after ${attemptNumber} failed attempts`
      )
    }
  }

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
    spanContext: currentSpanContext(),
    error
  }
}

async function _handleIssueSyncRequest({
  syncType,
  syncMode,
  syncRequestParameters,
  logger
}: HandleIssueSyncReqParams): Promise<HandleIssueSyncReqResult> {
  if (!syncRequestParameters?.data?.wallet?.length) {
    return { result: 'failure_missing_wallet' }
  }
  if (syncMode === SYNC_MODES.None) {
    return { result: 'success' }
  }

  const userWallet = syncRequestParameters.data.wallet[0]
  const secondaryEndpoint = syncRequestParameters.baseURL
  const immediate = syncRequestParameters.data.immediate

  const logMsgString = `_handleIssueSyncRequest() (${syncType})(${syncMode}) User ${userWallet} | Secondary: ${secondaryEndpoint}`

  /**
   * Remove sync from SyncRequestDeDuplicator once it moves to Active status, before processing.
   * It is ok for two identical syncs to be present in Active and Waiting, just not two in Waiting.
   */
  SyncRequestDeDuplicator.removeSync(
    syncType,
    userWallet,
    secondaryEndpoint,
    immediate
  )

  /**
   * Do not issue syncRequest if SecondaryUserSyncFailureCountForToday already exceeded threshold
   */
  const secondaryUserSyncFailureCountForToday =
    await SecondarySyncHealthTracker.getSecondaryUserSyncFailureCountForToday(
      secondaryEndpoint,
      userWallet,
      syncType
    )
  if (
    secondaryUserSyncFailureCountForToday >
    secondaryUserSyncDailyFailureCountThreshold
  ) {
    return {
      result: 'failure_secondary_failure_count_threshold_met',
      error: {
        message: `${logMsgString} || Secondary has already met SecondaryUserSyncDailyFailureCountThreshold (${secondaryUserSyncDailyFailureCountThreshold}). Will not issue further syncRequests today.`
      }
    }
  }

  /**
   * For now, if primarySyncFromSecondary fails, we just log & error without any retries
   * Eventually should make this more robust, but proceeding with caution
   */
  if (syncMode === SYNC_MODES.MergePrimaryAndSecondary) {
    const fromManualRoute = syncRequestParameters.data.from_manual_route

    // Short-circuit if this syncMode is disabled or if manual route override not provided
    if (!mergePrimaryAndSecondaryEnabled && !fromManualRoute) {
      return { result: 'success_mode_disabled' }
    }

    const error = await primarySyncFromSecondary({
      wallet: userWallet,
      secondary: secondaryEndpoint
    })

    if (error) {
      return {
        result: 'failure_primary_sync_from_secondary',
        error
      }
    }
  }

  /**
   * Issue sync request to secondary
   * - If SyncMode = MergePrimaryAndSecondary - issue sync request with forceResync = true
   *    - above call to primarySyncFromSecondary must have succeeded to get here
   *    - Only apply forceResync flag to this initial sync request, any future syncs proceed as usual
   */
  try {
    if (syncMode === SYNC_MODES.MergePrimaryAndSecondary) {
      const data = generateDataForSignatureRecovery(syncRequestParameters.data)
      const { timestamp, signature } = generateTimestampAndSignature(
        data,
        config.get('delegatePrivateKey')
      )

      await axios({
        ...syncRequestParameters,
        data: {
          ...syncRequestParameters.data,
          forceResync: true,
          timestamp,
          signature
        }
      } as AxiosRequestConfig)
    } else {
      await axios(syncRequestParameters as AxiosRequestConfig)
    }
  } catch (e: any) {
    return {
      result: 'failure_issue_sync_request',
      error: {
        message: `${logMsgString} || Error issuing sync request: ${e.message}`
      },
      syncReqToEnqueue: {
        parentSpanContext: currentSpanContext(),
        syncType,
        syncMode: SYNC_MODES.SyncSecondaryFromPrimary,
        syncRequestParameters
      }
    }
  }

  // primaryClockValue is used in additionalSyncIsRequired() call below
  const primaryClockValue = (await getUserPrimaryClockValues([userWallet]))[
    userWallet
  ]

  // Wait until has sync has completed (within time threshold)
  const { outcome, syncReqToEnqueue } = await additionalSyncIsRequired(
    primaryClockValue,
    syncType,
    syncMode,
    syncRequestParameters,
    logger
  )

  return {
    result: outcome,
    syncReqToEnqueue
  }
}

const handleIssueSyncRequest = instrumentTracing({
  fn: _handleIssueSyncRequest
})

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

const getUserPrimaryClockValues = instrumentTracing({
  fn: _getUserPrimaryClockValues
})

/**
 * Monitor an ongoing sync operation for a given secondaryUrl and user wallet
 * Return boolean indicating if an additional sync is required and reason why (or 'none' if no additional sync is required)
 * Record SyncRequest outcomes to SecondarySyncHealthTracker
 */
const _additionalSyncIsRequired = async (
  primaryClockValue = -1,
  syncType: string,
  syncMode: string,
  syncRequestParameters: SyncRequestAxiosParams,
  logger: any
): Promise<AdditionalSyncIsRequiredResponse> => {
  const userWallet = syncRequestParameters.data.wallet[0]
  const secondaryUrl = syncRequestParameters.baseURL
  const logMsgString = `additionalSyncIsRequired() (${syncType}): wallet ${userWallet} secondary ${secondaryUrl} primaryClock ${primaryClockValue}`

  const startTimeMs = Date.now()
  const maxMonitoringTimeMs =
    startTimeMs +
    (syncType === SyncType.Manual
      ? maxManualSyncMonitoringDurationInMs
      : maxSyncMonitoringDurationInMs)

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
      if (secondaryClockValue >= primaryClockValue) {
        secondaryCaughtUpToPrimary = true
        break
      }
    } catch (e: any) {
      recordException(e)
      logger.warn(`${logMsgString} || Error: ${e.message}`)
    }

    // Delay between retries
    await Utils.timeout(SYNC_MONITORING_RETRY_DELAY_MS, false)
  }

  const monitoringTimeMs = Date.now() - startTimeMs

  /**
   * As Primary for user, record SyncRequest outcomes to all secondaries
   * Also check whether additional sync is required
   */
  let additionalSyncIsRequired
  let outcome
  if (secondaryCaughtUpToPrimary) {
    await SecondarySyncHealthTracker.recordSuccess(
      secondaryUrl,
      userWallet,
      syncType
    )
    outcome = 'success_secondary_caught_up'
    additionalSyncIsRequired = false
    logger.info(`${logMsgString} || Sync completed in ${monitoringTimeMs}ms`)

    // Secondary completed sync but is still behind primary since it was behind by more than max export range
    // Since syncs are all-or-nothing, if secondary clock has increased at all, we know it successfully completed sync
  } else if (finalSecondaryClock > initialSecondaryClock) {
    await SecondarySyncHealthTracker.recordSuccess(
      secondaryUrl,
      userWallet,
      syncType
    )
    additionalSyncIsRequired = true
    outcome = 'success_secondary_partially_caught_up'
    logger.info(
      `${logMsgString} || Secondary successfully synced from clock ${initialSecondaryClock} to ${finalSecondaryClock} but hasn't caught up to Primary. Enqueuing additional syncRequest.`
    )

    // (1) secondary did not catch up to primary AND (2) secondary did not complete sync
  } else {
    await SecondarySyncHealthTracker.recordFailure(
      secondaryUrl,
      userWallet,
      syncType
    )
    additionalSyncIsRequired = true
    outcome = 'failure_secondary_failed_to_progress'
    logger.error(
      `${logMsgString} || Secondary failed to progress from clock ${initialSecondaryClock}. Enqueuing additional syncRequest.`
    )
  }

  const response: AdditionalSyncIsRequiredResponse = { outcome }
  if (additionalSyncIsRequired) {
    response.syncReqToEnqueue = {
      parentSpanContext: currentSpanContext(),
      syncType,
      syncMode: SYNC_MODES.SyncSecondaryFromPrimary,
      syncRequestParameters
    }
  }

  return response
}

const additionalSyncIsRequired = instrumentTracing({
  fn: _additionalSyncIsRequired
})

module.exports = async (
  params: DecoratedJobParams<IssueSyncRequestJobParams>
) => {
  const { parentSpanContext } = params
  return await instrumentTracing({
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
        [SemanticAttributes.CODE_FILEPATH]: __filename
      }
    }
  })(params)
}
