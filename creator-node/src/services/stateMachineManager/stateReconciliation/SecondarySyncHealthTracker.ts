/**
 * SecondarySyncHealthTracker
 * API for Primary to measure SyncRequest success and failure counts per Secondary, User, and Day
 */

import { ComputeWalletOnSecondaryUserInfo } from '../stateMonitoring/types'
import {
  SYNC_ERRORS_TO_MAX_NUMBER_OF_RETRIES,
  SYNC_ERRORS_TO_MAX_NUMBER_OF_RETRIES_MAP
} from './SecondarySyncHealthTrackerConstants'
import { WalletToSecondaryToShouldContinueActions } from './types'

const { logger: genericLogger } = require('../../../logging')
const redisClient = require('../../../redis')

const REDIS_KEY_PREFIX_PRIMARY_TO_SECONDARY_SYNC_FAILURE =
  'PRIMARY_TO_SECONDARY_SYNC_FAILURE'

const REDIS_KEY_EXPIRY_SECONDS = 259_200 // 3 days -- small range of buffer time
const PROCESS_USERS_BATCH_SIZE = 30

/**
 * On today, for a wallet on a secondary, record the failure as identified by `prometheusError` in Redis.
 * This info is later used to determine whether or not to re-enqueue another sync job or issue replica set update
 */
export async function recordFailure({
  secondary,
  wallet,
  syncType,
  prometheusError
}: {
  secondary: string
  wallet: string
  syncType: string
  prometheusError: string
}) {
  const redisKey = _getSyncFailureRedisKey({
    secondary,
    wallet,
    syncType
  })

  try {
    // For a secondary-wallet pairing for today, increment the error count for prometheusError by 1
    await redisClient.hincrby(redisKey, prometheusError, 1 /* increment */)

    // Set the expiry by REDIS_KEY_EXPIRY_SECONDS
    await redisClient.expire(redisKey, REDIS_KEY_EXPIRY_SECONDS)

    genericLogger.debug(
      { SecondarySyncHealthTracker: 'recordFailure' },
      `Incremented ${redisKey}:${prometheusError} count`
    )
  } catch (e: any) {
    genericLogger.error(
      { SecondarySyncHealthTracker: 'recordFailure' },
      `Failed to increment ${redisKey}:${prometheusError} count`
    )
  }
}

/**
 * Given an array of user info, determine whether the further action on the secondary for the
 * wallet should engage. Currently used for determining if a sync should reenqueue and if a
 * replica set update should be issued.
 */
export async function determineIfWalletOnSecondaryShouldContinueActions(
  userInfo: ComputeWalletOnSecondaryUserInfo[]
): Promise<WalletToSecondaryToShouldContinueActions> {
  // For each secondary-wallet-date
  const walletToSecondaryToShouldContinueAction: WalletToSecondaryToShouldContinueActions =
    {}

  for (let i = 0; i < userInfo.length; i += PROCESS_USERS_BATCH_SIZE) {
    // Get batch slice of users
    const userInfoSlice = userInfo.slice(i, i + PROCESS_USERS_BATCH_SIZE)

    // Get all the keys for sync failures
    const failedSyncKeys = await _getSyncFailureKeyForWalletOnSecondaries(
      userInfoSlice
    )

    for (const failedSyncKey of failedSyncKeys) {
      // Get all the errors encountered for the wallet-secondaray-date
      const errorToErrorCount = await redisClient.hgetall(failedSyncKey)

      if (errorToErrorCount) {
        // Get sync info from redis key
        const info = _getInfoFromRedisKey(failedSyncKey)

        // Determine whether for the secondary-wallet-error should a failed sync retry
        _determineIfSyncShouldReenqueue({
          wallet: info.wallet,
          secondary: info.secondary,
          errorToErrorCount,
          mapToStoreResultsIn: walletToSecondaryToShouldContinueAction
        })
      }
    }
  }

  return walletToSecondaryToShouldContinueAction
}

/**
 * Given user info, generate the redis keys
 * @param userInfo user info
 * @returns the redis keys
 */
async function _getSyncFailureKeyForWalletOnSecondaries(
  userInfo: ComputeWalletOnSecondaryUserInfo[]
): Promise<string[]> {
  const syncFailureKeys = []
  for (const { wallet, secondary1, secondary2 } of userInfo) {
    const redisKeyWalletToSecondary1 = _getSyncFailureRedisKey({
      secondary: secondary1,
      wallet,
      syncType: '*'
    })

    const redisKeyWalletToSecondary2 = _getSyncFailureRedisKey({
      secondary: secondary2,
      wallet,
      syncType: '*'
    })

    syncFailureKeys.push(redisKeyWalletToSecondary1)
    syncFailureKeys.push(redisKeyWalletToSecondary2)
  }

  return syncFailureKeys
}

function _determineIfSyncShouldReenqueue({
  wallet,
  secondary,
  errorToErrorCount,
  mapToStoreResultsIn
}: {
  wallet: string
  secondary: string
  errorToErrorCount: { [error: string]: number /* the error count */ }
  mapToStoreResultsIn: WalletToSecondaryToShouldContinueActions
}) {
  // Get the error and number of times the error occurred
  for (const [error, errorCount] of Object.entries(errorToErrorCount)) {
    // Compare the above number to the max retry attempts
    let shouldReenqueue = false
    if (_shouldReenqueueSync(error, errorCount)) {
      shouldReenqueue = true
    }

    // If under, record retry to 'true'. Else, record retry as 'false'.
    _updateResult({
      resultMap: mapToStoreResultsIn,
      shouldReenqueue,
      wallet,
      secondary
    })
  }
}

function _updateResult({
  resultMap,
  shouldReenqueue,
  wallet,
  secondary
}: {
  wallet: string
  secondary: string
  shouldReenqueue: boolean
  resultMap: WalletToSecondaryToShouldContinueActions
}) {
  if (!resultMap[wallet]) {
    resultMap[wallet] = {}
  }

  resultMap[wallet][secondary] = shouldReenqueue
}

function _shouldReenqueueSync(error: string, errorCount: number) {
  const maxRetries = SYNC_ERRORS_TO_MAX_NUMBER_OF_RETRIES_MAP.get(error)

  if (maxRetries === undefined) {
    return errorCount <= SYNC_ERRORS_TO_MAX_NUMBER_OF_RETRIES.default
  }

  return errorCount <= maxRetries
}

function _getSyncFailureRedisKey({
  secondary,
  wallet,
  syncType
}: {
  secondary: string
  wallet: string
  syncType: string
}) {
  // format: YYYY-MM-DD
  const date = new Date().toISOString().split('T')[0]

  return `${REDIS_KEY_PREFIX_PRIMARY_TO_SECONDARY_SYNC_FAILURE}::${date}::${secondary}::${wallet}::${syncType}`
}

function _getInfoFromRedisKey(redisKey: string): {
  date: string
  secondary: string
  wallet: string
  syncType: string
} {
  const info = redisKey.split('::')

  return {
    date: info[1],
    secondary: info[2],
    wallet: info[3],
    syncType: info[4]
  }
}

module.exports = {
  recordFailure,
  determineIfWalletOnSecondaryShouldContinueActions
}
