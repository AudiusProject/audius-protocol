/**
 * SecondarySyncHealthTracker
 * API for Primary to measure SyncRequest success and failure counts per Secondary, User, and Day
 */

import type { WalletsToSecondariesMapping } from '../types'

// eslint-disable-next-line import/no-unresolved
import { UserSecondarySyncMetricsMap } from '../stateMonitoring/types'
import {
  SYNC_ERRORS_TO_MAX_NUMBER_OF_RETRIES,
  SYNC_ERRORS
} from './SecondarySyncHealthTrackerConstants'

const config = require('../../../config')
const redisClient = require('../../../redis')
const { logger } = require('../../../logging')

const REDIS_KEY_PREFIX_PRIMARY_TO_SECONDARY_SYNC_FAILURE =
  'PRIMARY_TO_SECONDARY_SYNC_FAILURE'

const DailyRedisKeyExpirationSec =
  90 /* days */ * 24 /* hr */ * 60 /* min */ * 60 /* s */

const RECORD_SYNC_RESULTS = config.get('recordSyncResults')
const PROCESS_SYNC_RESULTS = config.get('processSyncResults')

export const Outcomes = Object.freeze({
  SUCCESS: 'Success',
  FAILURE: 'Failure'
})

type RedisFilters = {
  syncErrorStatus: string
  secondary?: string
  wallet?: string
  syncType?: string
  outcome?: string
  date?: string | null
}

/**
 * Given a mapping of wallet to secondaries arrays, returns mapping from wallet to
 * sync metrics for that wallet, where sync metrics are a mapping of secondary endpoint
 * to successCount, failureCount, and successRate
 *
 * @param {Object { <wallet (string)>: <secondary endpoints (string array)}} walletsToSecondariesMapping
 * @returns {Object} { '0x...': { 'https://secondary1...': { 'successCount' : _, 'failureCount': _, 'successRate': _ }, ... } ... }
 */
export async function computeUsersSecondarySyncSuccessRatesForToday(
  walletsToSecondariesMapping: WalletsToSecondariesMapping
): Promise<UserSecondarySyncMetricsMap> {
  // Initialize sync success and failure counts for every secondary to 0
  const secondarySyncMetricsMap: UserSecondarySyncMetricsMap = {}
  const wallets = Object.keys(walletsToSecondariesMapping)
  for (const wallet of wallets) {
    const secondarySyncMetrics = secondarySyncMetricsMap[wallet] || {}
    for (const secondary of walletsToSecondariesMapping[wallet]) {
      secondarySyncMetrics[secondary] = {
        successCount: 0,
        failureCount: 0,
        successRate: 1
      }
      secondarySyncMetricsMap[wallet] = secondarySyncMetrics
    }
  }

  // Retrieve map of all SyncRequestOutcome keys and daily counts for wallets from all secondaries
  if (PROCESS_SYNC_RESULTS) {
    const userSecondarySyncHealthOutcomes =
      await _batchGetSyncRequestOutcomeMetricsForToday(wallets)

    // Aggregate all daily SyncRequest outcome counts by secondary
    _aggregateSyncSuccessAndFailureCountBySecondaryPerWallet(
      userSecondarySyncHealthOutcomes,
      secondarySyncMetricsMap
    )

    // For each secondary, compute and store successRate
    _aggregateSyncSuccessRateBySecondaryPerWallet(
      wallets,
      secondarySyncMetricsMap
    )
  }

  return secondarySyncMetricsMap
}

function _aggregateSyncSuccessRateBySecondaryPerWallet(
  wallets: string[],
  secondarySyncMetricsMap: UserSecondarySyncMetricsMap
) {
  for (const wallet of wallets) {
    Object.keys(secondarySyncMetricsMap[wallet]).forEach((secondary) => {
      const { successCount, failureCount } =
        secondarySyncMetricsMap[wallet][secondary]
      secondarySyncMetricsMap[wallet][secondary].successRate =
        failureCount === 0 ? 1 : successCount / (successCount + failureCount)
    })
  }
}

function _aggregateSyncSuccessAndFailureCountBySecondaryPerWallet(
  userSecondarySyncHealthOutcomes: { [key: string]: any },
  secondarySyncMetricsMap: UserSecondarySyncMetricsMap
) {
  for (let [key, count] of Object.entries(userSecondarySyncHealthOutcomes)) {
    count = parseInt(count)
    const { wallet, secondary, outcome } = _parseRedisKeyIntoComponents(key)
    const secondarySyncMetrics = secondarySyncMetricsMap[wallet]
    if (!(secondary in secondarySyncMetrics)) {
      // This case can be hit for old secondaries that have been cycled out of user's replica set - these can be safely skipped
      continue
    }
    if (outcome === Outcomes.SUCCESS) {
      secondarySyncMetrics[secondary].successCount += count
    } else if (outcome === Outcomes.FAILURE) {
      secondarySyncMetrics[secondary].failureCount += count
    }
    secondarySyncMetricsMap[wallet] = secondarySyncMetrics
    // All keys should contain 'Success' or 'Failure' - ignore any keys that don't
  }
}

export async function recordFailure({
  secondary,
  wallet,
  syncType,
  syncErrorStatus
}: {
  secondary: string
  wallet: string
  syncType: string
  syncErrorStatus: string
}) {
  if (RECORD_SYNC_RESULTS) {
    await _recordSyncRequestOutcome({
      secondary,
      wallet,
      syncType,
      syncErrorStatus,
      outcome: Outcomes.FAILURE
    })
  }
}

/**
 * Returns single int representing SyncRequestOutcome for secondary, wallet, syncType, date=today, and Outcome=Failure
 * Only one redis key should exist for above params, but takes 1st value if multiple are found
 */
export async function getSecondaryUserSyncFailureCountForToday(
  secondary: string,
  wallet: string,
  syncType: string
) {
  if (!PROCESS_SYNC_RESULTS) {
    return 0
  }

  const resp = await getSyncRequestOutcomeMetrics({
    secondary,
    wallet,
    syncType,
    outcome: Outcomes.FAILURE
    /* date defaults to today */
  })

  const entries = Object.entries(resp)

  if (entries.length === 0) {
    return 0
  } else {
    return parseInt(entries[0][1])
  }
}

/**
 * Get SyncRequest outcome metrics, optionally filtered on { `secondary`, `wallet`, `syncType`, `outcome`, `date` }.
 * Defaults to matching date=<today> and other params=* (wildcard / any value).
 * @param {Object} filters object specifying any of above filters
 * @returns {Object} map from every key matching pattern with above filters to associated value
 */
export async function getSyncRequestOutcomeMetrics(filters: RedisFilters) {
  try {
    const pattern = _getRedisKeyPattern(filters)
    return _getMetricsMatchingPattern(pattern)
  } catch (e: any) {
    logger.error(
      `SecondarySyncHealthTracker - getSyncRequestOutcomeMetrics() Error || ${e.message}`
    )
    return {}
  }
}

/**
 * Given redis key pattern, returns all keys matching pattern and associated values
 *
 * @param {string} pattern the pattern to run a redis SCAN on to find matching keys
 * @param {String[]} wallets optional array of wallets to filter matched keys by
 * @returns map of key-value pairs
 */
async function _getMetricsMatchingPattern(
  pattern: string,
  wallets: string[] = []
) {
  const keys: string[] = wallets
    ? await _getAllKeysMatchingPattern(pattern, (key) =>
        wallets.some((wallet) => key.includes(wallet))
      )
    : await _getAllKeysMatchingPattern(pattern)

  // Short-circuit here since redis `mget` throws if array param has 0-length
  if (!keys || !keys.length) {
    return {}
  }

  // This works because vals.length === keys.length
  // https://redis.io/commands/mget
  const vals = await redisClient.mget(keys)

  // Zip keys and vals arrays into map of key-val pairs
  const keyMap: { [key: string]: any } = {}
  for (let i = 0; i < keys.length; i++) {
    keyMap[keys[i]] = vals[i]
  }

  return keyMap
}

/**
 * Returns array of all keys in Redis matching pattern, using redis SCAN
 * https://github.com/luin/ioredis#streamify-scanning
 *
 * @returns array | Error
 */
async function _getAllKeysMatchingPattern(
  pattern: string,
  extraFilter = (_: string) => true
): Promise<string[]> {
  const stream = redisClient.scanStream({ match: pattern })

  const keySet = new Set<string>()
  return new Promise<string[]>((resolve, reject) => {
    stream.on('data', async (keys = []) => {
      keys.filter(extraFilter).forEach((key) => {
        keySet.add(key)
      })
    })
    stream.on('end', () => {
      resolve(Array.from<string>(keySet).filter(Boolean))
    })
    stream.on('error', (e: any) => {
      reject(e)
    })
  })
}

/**
 * Builds redis key pattern given params, using today as the default date
 * and wildcard matcher for every other default param.
 * Key pattern string can map to one or multiple keys.
 */
function _getRedisKeyPattern({
  syncErrorStatus,
  secondary = '*',
  wallet = '*',
  syncType = '*',
  outcome = '*',
  date = null
}: RedisFilters) {
  // format: YYYY-MM-DD
  date = date || new Date().toISOString().split('T')[0]

  return `${REDIS_KEY_PREFIX_PRIMARY_TO_SECONDARY_SYNC_FAILURE}:::${date}:::${secondary}:::${wallet}:::${outcome}`
}

function _parseRedisKeyIntoComponents(key: string) {
  const components = key.split(':::')
  const [, secondary, wallet, syncType, date, outcome] = components
  return { secondary, wallet, syncType, date, outcome }
}

async function _recordSyncRequestOutcome({
  secondary,
  wallet,
  syncType,
  syncErrorStatus,
  outcome
}: {
  secondary: string
  wallet: string
  syncType: string
  syncErrorStatus: string
  outcome: string
}) {
  try {
    const redisKey = _getRedisKeyPattern({
      secondary,
      wallet,
      syncType,
      outcome,
      syncErrorStatus
    })

    // incr() will create key with value 0 if non-existent
    await redisClient.incr(redisKey)

    // Set key expiration time (sec) in case it hasn't already been set (prob not most efficient)
    await redisClient.expire(redisKey, DailyRedisKeyExpirationSec)

    logger.debug(
      `SecondarySyncHealthTracker:_recordSyncRequestOutcome || Recorded ${redisKey}`
    )

    // Swallow error + log
  } catch (e: any) {
    logger.error(
      `SecondarySyncHealthTracker:_recordSyncRequestOutcome Error || ${e.message}`
    )
  }
}

/**
 * Get today's SyncRequest outcome metrics for a batch of wallets
 * @param {String[]} wallets wallets to use as individual filters
 * @returns {Object} map from every redis key matching sync request pattern with any of the given wallets
 */
async function _batchGetSyncRequestOutcomeMetricsForToday(wallets: string[]) {
  try {
    // Use all wildcards for the pattern and filter keys by wallet after retrieving them
    const pattern = _getRedisKeyPattern({})
    return _getMetricsMatchingPattern(pattern, wallets)
  } catch (e: any) {
    logger.error(
      `SecondarySyncHealthTracker - _batchGetSyncRequestOutcomeMetricsForToday() Error || ${e.message}`
    )
    return {}
  }
}

module.exports = {
  Outcomes,
  recordFailure,
  computeUsersSecondarySyncSuccessRatesForToday,
  getSyncRequestOutcomeMetrics,
  getSecondaryUserSyncFailureCountForToday
}
