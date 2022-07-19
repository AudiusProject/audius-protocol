/**
 * SecondarySyncHealthTracker
 * API for Primary to measure SyncRequest success and failure counts per Secondary, User, and Day
 */

const redisClient = require('../redis')
const { logger } = require('../logging')

const RedisKeyPrefix = 'SecondarySyncRequestOutcomes-Daily'

const DailyRedisKeyExpirationSec =
  90 /* days */ * 24 /* hr */ * 60 /* min */ * 60 /* s */

const Outcomes = Object.freeze({
  SUCCESS: 'Success',
  FAILURE: 'Failure'
})

const Utils = {
  /**
   * Given redis key pattern, returns all keys matching pattern and associated values
   *
   * @param {string} pattern the pattern to run a redis SCAN on to find matching keys
   * @param {String[]} wallets optional array of wallets to filter matched keys by
   * @returns map of key-value pairs
   */
  async _getMetricsMatchingPattern(pattern, wallets = []) {
    const keys = wallets
      ? await Utils._getAllKeysMatchingPattern(pattern, (key) =>
          wallets.some((wallet) => key.includes(wallet))
        )
      : await Utils._getAllKeysMatchingPattern(pattern)

    // Short-circuit here since redis `mget` throws if array param has 0-length
    if (!keys || !keys.length) {
      return {}
    }

    // This works because vals.length === keys.length
    // https://redis.io/commands/mget
    const vals = await redisClient.mget(keys)

    // Zip keys and vals arrays into map of key-val pairs
    const keyMap = {}
    for (let i = 0; i < keys.length; i++) {
      keyMap[keys[i]] = vals[i]
    }

    return keyMap
  },

  /**
   * Returns array of all keys in Redis matching pattern, using redis SCAN
   * https://github.com/luin/ioredis#streamify-scanning
   *
   * @returns array | Error
   */
  async _getAllKeysMatchingPattern(pattern, extraFilter = (_) => true) {
    const stream = redisClient.scanStream({ match: pattern })

    const keySet = new Set()
    return new Promise((resolve, reject) => {
      stream.on('data', async (keys = []) => {
        keys.filter(extraFilter).forEach((key) => {
          keySet.add(key)
        })
      })
      stream.on('end', () => {
        resolve(Array.from(keySet).filter(Boolean))
      })
      stream.on('error', (e) => {
        reject(e)
      })
    })
  },

  /**
   * Builds redis key pattern given params, using today as the default date
   * and wildcard matcher for every other default param.
   * Key pattern string can map to one or multiple keys.
   */
  _getRedisKeyPattern({
    secondary = '*',
    wallet = '*',
    syncType = '*',
    outcome = '*',
    date = null
  }) {
    // format: YYYY-MM-DD
    date = date || new Date().toISOString().split('T')[0]

    return `${RedisKeyPrefix}:::${secondary}:::${wallet}:::${syncType}:::${date}:::${outcome}`
  },

  _parseRedisKeyIntoComponents(key) {
    const components = key.split(':::')
    const [, secondary, wallet, syncType, date, outcome] = components
    return { secondary, wallet, syncType, date, outcome }
  },

  async _recordSyncRequestOutcome(secondary, wallet, syncType, success = true) {
    try {
      const outcome = success ? Outcomes.SUCCESS : Outcomes.FAILURE
      const redisKey = Utils._getRedisKeyPattern({
        secondary,
        wallet,
        syncType,
        outcome
      })

      // incr() will create key with value 0 if non-existent
      await redisClient.incr(redisKey)

      // Set key expiration time (sec) in case it hasn't already been set (prob not most efficient)
      await redisClient.expire(redisKey, DailyRedisKeyExpirationSec)

      logger.info(
        `SecondarySyncHealthTracker:_recordSyncRequestOutcome || Recorded ${redisKey}`
      )

      // Swallow error + log
    } catch (e) {
      logger.error(
        `SecondarySyncHealthTracker:_recordSyncRequestOutcome Error || ${e.message}`
      )
    }
  }
}

const Setters = {
  async recordSuccess(secondary, wallet, syncType) {
    await Utils._recordSyncRequestOutcome(secondary, wallet, syncType, true)
  },

  async recordFailure(secondary, wallet, syncType) {
    await Utils._recordSyncRequestOutcome(secondary, wallet, syncType, false)
  }
}

const Getters = {
  /**
   * Given a mapping of wallet to secondaries arrays, returns mapping from wallet to
   * sync metrics for that wallet, where sync metrics are a mapping of secondary endpoint
   * to successCount, failureCount, and successRate
   *
   * @param {Object { <wallet (string)>: <secondary endpoints (string array)}} walletsToSecondariesMapping
   * @returns {Object} { '0x...': { 'https://secondary1...': { 'successCount' : _, 'failureCount': _, 'successRate': _ }, ... } ... }
   */
  async computeUsersSecondarySyncSuccessRatesForToday(
    walletsToSecondariesMapping = {}
  ) {
    // Initialize sync success and failure counts for every secondary to 0
    const secondarySyncMetricsMap = {}
    const wallets = Object.keys(walletsToSecondariesMapping)
    for (const wallet of wallets) {
      const secondarySyncMetrics = secondarySyncMetricsMap[wallet] || {}
      for (const secondary of walletsToSecondariesMapping[wallet]) {
        secondarySyncMetrics[secondary] = { successCount: 0, failureCount: 0 }
        secondarySyncMetricsMap[wallet] = secondarySyncMetrics
      }
    }

    // Retrieve map of all SyncRequestOutcome keys and daily counts for wallets from all secondaries
    const userSecondarySyncHealthOutcomes =
      await Getters.batchGetSyncRequestOutcomeMetricsForToday(wallets)

    // Aggregate all daily SyncRequest outcome counts by secondary
    for (let [key, count] of Object.entries(userSecondarySyncHealthOutcomes)) {
      count = parseInt(count)
      const { wallet, secondary, outcome } =
        Utils._parseRedisKeyIntoComponents(key)
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

    // For each secondary, compute and store successRate
    for (const wallet of wallets) {
      Object.keys(secondarySyncMetricsMap[wallet] || {}).forEach(
        (secondary) => {
          const { successCount, failureCount } =
            secondarySyncMetricsMap[wallet][secondary]
          secondarySyncMetricsMap[wallet][secondary].successRate =
            failureCount === 0
              ? 1
              : successCount / (successCount + failureCount)
        }
      )
    }

    return secondarySyncMetricsMap
  },

  /**
   * Get SyncRequest outcome metrics, optionally filtered on { `secondary`, `wallet`, `syncType`, `outcome`, `date` }.
   * Defaults to matching date=<today> and other params=* (wildcard / any value).
   * @param {Object} filters object specifying any of above filters
   * @returns {Object} map from every key matching pattern with above filters to associated value
   */
  async getSyncRequestOutcomeMetrics(filters) {
    try {
      const pattern = Utils._getRedisKeyPattern(filters)
      return Utils._getMetricsMatchingPattern(pattern)
    } catch (e) {
      logger.error(
        `SecondarySyncHealthTracker - getSyncRequestOutcomeMetrics() Error || ${e.message}`
      )
      return {}
    }
  },

  /**
   * Get today's SyncRequest outcome metrics for a batch of wallets
   * @param {String[]} wallets wallets to use as individual filters
   * @returns {Object} map from every redis key matching sync request pattern with any of the given wallets
   */
  async batchGetSyncRequestOutcomeMetricsForToday(wallets) {
    try {
      // Use all wildcards for the pattern and filter keys by wallet after retrieving them
      const pattern = Utils._getRedisKeyPattern({})
      return Utils._getMetricsMatchingPattern(pattern, wallets)
    } catch (e) {
      logger.error(
        `SecondarySyncHealthTracker - batchGetSyncRequestOutcomeMetricsForToday() Error || ${e.message}`
      )
      return {}
    }
  },

  /**
   * Returns single int representing SyncRequestOutcome for secondary, wallet, syncType, date=today, and Outcome=Failure
   * Only one redis key should exist for above params, but takes 1st value if multiple are found
   */
  async getSecondaryUserSyncFailureCountForToday(secondary, wallet, syncType) {
    const resp = await Getters.getSyncRequestOutcomeMetrics({
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
}

const SecondarySyncHealthTracker = {
  Outcomes,

  // Setters
  recordSuccess: Setters.recordSuccess,
  recordFailure: Setters.recordFailure,

  // Getters
  computeUsersSecondarySyncSuccessRatesForToday:
    Getters.computeUsersSecondarySyncSuccessRatesForToday,
  getSyncRequestOutcomeMetrics: Getters.getSyncRequestOutcomeMetrics,
  getSecondaryUserSyncFailureCountForToday:
    Getters.getSecondaryUserSyncFailureCountForToday
}

module.exports = SecondarySyncHealthTracker
