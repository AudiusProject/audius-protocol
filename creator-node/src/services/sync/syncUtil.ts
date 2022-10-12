import type Logger from 'bunyan'
import type { Redis } from 'ioredis'

import axios from 'axios'
import _ from 'lodash'

import {
  SyncType,
  SYNC_MONITORING_RETRY_DELAY_MS
} from '../../services/stateMachineManager/stateMachineConstants'

const config = require('../../config')
const redisClient: Redis & {
  deleteAllKeysMatchingPattern: (keyPattern: string) => Promise<number>
} = require('../../redis')
const asyncRetry = require('../../utils/asyncRetry')

const EXPORT_REQ_TIMEOUT_MS = 60 /* sec */ * 1000 /* millis */
const EXPORT_REQ_MAX_RETRIES = 3
const ONE_HOUR_IN_MILLIS = 60 /* min */ * 60 /* sec */ * 1000 /* millis */

const maxSyncMonitoringDurationInMs = config.get(
  'maxSyncMonitoringDurationInMs'
)
const maxManualSyncMonitoringDurationInMs = config.get(
  'maxManualSyncMonitoringDurationInMs'
)

type ExportQueryParams = {
  wallet_public_key: string
  clock_range_min: number
  force_export: boolean
  source_endpoint?: string
}
export type FetchExportParams = {
  nodeEndpointToFetchFrom: string
  wallet: string
  clockRangeMin: number
  selfEndpoint?: string
  logger: Logger
  forceExport: boolean
}
export type FetchExportOutput = {
  fetchedCNodeUser?: any
  error?: {
    message: string
    code: 'failure_export_wallet'
  }
  abort?: {
    message: string
    code:
      | 'abort_user_does_not_exist_on_node'
      | 'abort_multiple_users_returned_from_export'
      | 'abort_missing_user_export_key_fields'
      | 'abort_mismatched_export_wallet'
  }
}
export type SyncStatus =
  | 'waiting'
  | 'success'
  | 'success_clocks_already_match'
  | 'success_force_wipe'
  | 'abort_user_does_not_exist_on_node'
  | 'abort_multiple_users_returned_from_export'
  | 'abort_missing_user_export_key_fields'
  | 'abort_mismatched_export_wallet'
  | 'abort_current_node_is_not_user_primary'
  | 'abort_current_node_is_not_user_secondary'
  | 'abort_sync_in_progress'
  | 'abort_force_wipe_disabled'
  | 'failure_fetching_user_replica_set'
  | 'failure_force_resync_check'
  | 'failure_fetching_user_gateway'
  | 'failure_delete_db_data'
  | 'failure_delete_disk_data'
  | 'failure_sync_secondary_from_primary'
  | 'failure_db_transaction'
  | 'failure_export_wallet'
  | 'failure_import_not_consistent'
  | 'failure_import_not_contiguous'
  | 'failure_inconsistent_clock'

export async function fetchExportFromNode({
  nodeEndpointToFetchFrom,
  wallet,
  clockRangeMin,
  selfEndpoint,
  logger,
  forceExport = false
}: FetchExportParams): Promise<FetchExportOutput> {
  const exportQueryParams: ExportQueryParams = {
    wallet_public_key: wallet,
    clock_range_min: clockRangeMin,
    force_export: forceExport
  }

  // This is used only for logging by primary to record endpoint of requesting node
  if (selfEndpoint) {
    exportQueryParams.source_endpoint = selfEndpoint
  }

  // Make request to get data from /export route
  let exportResp
  try {
    exportResp = await asyncRetry({
      // Throws on any non-200 response code
      asyncFn: () =>
        axios({
          method: 'get',
          baseURL: nodeEndpointToFetchFrom,
          url: '/export',
          responseType: 'json',
          params: exportQueryParams,
          timeout: EXPORT_REQ_TIMEOUT_MS
        }),
      retries: EXPORT_REQ_MAX_RETRIES,
      log: false
    })
  } catch (e: any) {
    logger.error(`Error fetching /export route: ${e.message}`)
    return {
      error: {
        message: e.message,
        code: 'failure_export_wallet'
      }
    }
  }

  // Validate export response has cnodeUsers array with 1 wallet
  const { data: body } = exportResp
  if (!_.has(body, 'data.cnodeUsers') || _.isEmpty(body.data.cnodeUsers)) {
    return {
      abort: {
        message: '"cnodeUsers" array is empty or missing from response body',
        code: 'abort_user_does_not_exist_on_node'
      }
    }
  }
  const { cnodeUsers } = body.data
  if (Object.keys(cnodeUsers).length > 1) {
    return {
      abort: {
        message: 'Multiple cnodeUsers returned from export',
        code: 'abort_multiple_users_returned_from_export'
      }
    }
  }

  // Ensure all required properties are present
  const fetchedCNodeUser: any = Object.values(cnodeUsers)[0]
  if (
    !_.has(fetchedCNodeUser, 'walletPublicKey') ||
    !_.has(fetchedCNodeUser, 'clock') ||
    !_.has(fetchedCNodeUser, ['clockInfo', 'localClockMax']) ||
    !_.has(fetchedCNodeUser, ['clockInfo', 'requestedClockRangeMax'])
  ) {
    return {
      abort: {
        message:
          'Required properties not found on CNodeUser in response object',
        code: 'abort_missing_user_export_key_fields'
      }
    }
  }

  // Validate wallet from cnodeUsers array matches the wallet we requested in the /export request
  if (wallet !== fetchedCNodeUser.walletPublicKey) {
    return {
      abort: {
        message: `Returned data for walletPublicKey that was not requested: ${fetchedCNodeUser.walletPublicKey}`,
        code: 'abort_mismatched_export_wallet'
      }
    }
  }

  logger.info('Export successful')

  return {
    fetchedCNodeUser
  }
}

export async function getSyncStatus(syncUuid: string) {
  return redisClient.get(`syncStatus${syncUuid}`) as Promise<SyncStatus | null>
}

/**
 * Sets the status of a sync (by UUID) as a redis key that expires after 1 hour.
 * 1 hour is an upper bound for the node that issued the sync in case that node
 * increased their maxSyncMonitoringDurationInMs or maxManualSyncMonitoringDurationInMs.
 */
export async function setSyncStatus(syncUuid: string, syncStatus: SyncStatus) {
  await redisClient.set(
    `syncStatus${syncUuid}`,
    syncStatus,
    'PX', // Sets expiration in millis (like how EX is expiration in seconds)
    ONE_HOUR_IN_MILLIS
  )
}

export async function clearSyncStatuses() {
  return redisClient.deleteAllKeysMatchingPattern('syncStatus*')
}

export function getMaxSyncMonitoringMs(syncType: string) {
  return syncType === SyncType.Manual
    ? maxManualSyncMonitoringDurationInMs
    : maxSyncMonitoringDurationInMs
}
