/**
 * SecondarySyncHealthTracker
 * API for Primary to measure SyncRequest success and failure counts per Secondary, User, and Day
 */

import type { WalletsToSecondariesMapping } from '../types'

// eslint-disable-next-line import/no-unresolved
import { UserSecondarySyncMetricsMap } from '../stateMonitoring/types'
import {
  MAX_SCAN_ATTEMPTS,
  SYNC_ERRORS,
  SYNC_ERRORS_TO_MAX_NUMBER_OF_RETRIES,
  SYNC_ERRORS_TO_MAX_NUMBER_OF_RETRIES_MAP
} from './SecondarySyncHealthTrackerConstants'
import { WalletToSecondaryToShouldReenqueueSync } from './types'
import { ElementFlags } from 'typescript'

const { logger: genericLogger } = require('../../../logging')
const redisClient = require('../../../redis')

const REDIS_KEY_PREFIX_PRIMARY_TO_SECONDARY_SYNC_FAILURE =
  'PRIMARY_TO_SECONDARY_SYNC_FAILURE'

/**
 * Given a mapping of wallet to secondaries arrays, returns mapping from wallet to
 * sync metrics for that wallet, where sync metrics are a mapping of secondary endpoint
 * to successCount, failureCount, and successRate
 *
 * @param {Object { <wallet (string)>: <secondary endpoints (string array)}} walletsToSecondariesMapping
 * @returns {Object} { '0x...': { 'https://secondary1...': { 'successCount' : _, 'failureCount': _, 'successRate': _ }, ... } ... }
 */
export async function computeIfWalletOnSecondaryShouldReenqueueSyncJob(
  walletsToSecondariesMapping: WalletsToSecondariesMapping
): Promise<UserSecondarySyncMetricsMap> {
  console.log('sigh')

  // Get all failure scenarios by reason
  // ^ will go hand-in-hand with batching

  // Get all the keys for sync failures
  // TODO: consider batching
  const failedSyncKeys = await _getAllSyncFailures()

  // For each secondary-wallet-date
  const walletToSecondaryToShouldReenqueueSyncFlag: WalletToSecondaryToShouldReenqueueSync =
    {}
  for (const failedSyncKey of failedSyncKeys) {
    // Get all the errors encountered for the secondary-wallet-date
    // response: [cursor, elements[]] -> elements: [field1, value1, field2, value2, ...]
    const encounteredErrorsAndCounts =
      await _getAllValuesAssociatedWithSyncFailureKey(failedSyncKey)

    // Get sync info from redis key
    const info = _getInfoFromRedisKey(failedSyncKey)

    // Determine whether for the secondary-wallet-error should a failed sync retry
    await _determineIfSyncShouldReenqueue({
      wallet: info.wallet,
      secondary: info.secondary,
      errors: encounteredErrorsAndCounts,
      mapToStoreResultsIn: walletToSecondaryToShouldReenqueueSyncFlag
    })
  }

  // Determine if a secondary-wallet pair should re-enqueue a sync

  // Return response to caller
}

/**
 * On today, for a wallet on a secondary, record the failure as identified by `prometheusError` in Redis.
 * This info is later used to determine whether or not to re-enqueue another sync job
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

// TODO: need to also delete keys not of today's date. maybe extend out to 3 days
// just for a safety net of deletes

async function _getAllSyncFailures(): Promise<string[]> {
  const redisKeyPatternToMatchOn = _getSyncFailureRedisKey({
    secondary: '*',
    wallet: '*',
    syncType: '*'
  })

  // all prefix::date::secondary:wallet:syncType keys
  const syncFailureKeys = await redisClient.getAllKeysMatchingPattern(
    redisKeyPatternToMatchOn
  )

  return syncFailureKeys
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

async function _getAllValuesAssociatedWithSyncFailureKey(
  failedSyncKey: string
): Promise<{ [error: string]: number /* the error count */ }> {
  let done = false
  const results: { [error: string]: number /* the error count */ } = {}
  let attempts = 0
  let currCursor = 0
  while (!done && attempts++ < MAX_SCAN_ATTEMPTS) {
    // response: [cursor, elements[]] -> elements: [field1, value1, field2, value2, ...]
    const currResults = await redisClient.hscan(failedSyncKey, currCursor)
    const returnedCursor = currResults[0]

    const errors = currResults[1]
    for (let i = 0; i < errors.length; i += 2) {
      // Get the error and number of times the error occurred
      const encounteredError = errors[i]
      const encounteredErrorCount = parseInt(errors[i + 1])

      results[encounteredError] = encounteredErrorCount
    }

    // results = results.concat(currResults[1])
    if (returnedCursor === 0) {
      done = true
    } else {
      currCursor = returnedCursor
    }
  }

  return results
}

async function _determineIfSyncShouldReenqueue({
  wallet,
  secondary,
  errors,
  mapToStoreResultsIn
}: {
  wallet: string
  secondary: string
  errors: { [error: string]: number /* the error count */ }
  mapToStoreResultsIn: WalletToSecondaryToShouldReenqueueSync
}) {
  // Check the number of times this secondary-wallet-error occurred
  const errors = Object.keys(errors)

  // Get the error and number of times the error occurred
  for (const [error, errorCount] of Object.entries(errors)) {
    // Compare the above number to the max retry attempts
    if (_shouldReenqueueSync(error, errorCount)) {
      _updateResult({
        resultMap: mapToStoreResultsIn,
        shouldReenqueue: true,
        wallet,
        secondary
      })
    } else {
      _updateResult({
        resultMap: mapToStoreResultsIn,
        shouldReenqueue: false,
        wallet,
        secondary
      })
    }
    // If under, record retry to 'true'. Else, record retry as 'false'.
  }

  // for (let i = 0; i < errors.length; i += 2) {
  //   // Get the error and number of times the error occurred
  //   const encounteredError = errors[i]
  //   const encounteredErrorCount = parseInt(errors[i + 1])
  //   // Compare the above number to the max retry attempts
  //   if (_shouldReenqueueSync(encounteredError, encounteredErrorCount)) {
  //   }
  //   // If under, record retry to 'true'. Else, record retry as 'false'.
  // }
}

function _shouldReenqueueSync(error: string, errorCount: number) {
  const maxRetries = SYNC_ERRORS_TO_MAX_NUMBER_OF_RETRIES_MAP.get(error)

  if (maxRetries === undefined) {
    return SYNC_ERRORS_TO_MAX_NUMBER_OF_RETRIES.default
  }

  return errorCount < maxRetries
}

function _updateResult({ resultMap, shouldReenqueue, wallet, secondary }) {
  if (!resultMap[wallet]) {
    resultMap[wallet] = {}
  }

  if (!resultMap[wallet][secondary]) {
    resultMap[wallet][secondary] = {}
  }

  resultMap[wallet][secondary]
}

module.exports = {
  recordFailure,
  computeIfWalletOnSecondaryShouldReenqueueSyncJob
}
