/**
 * SecondarySyncHealthTracker
 * API for Primary to measure SyncRequest success and failure counts per Secondary, User, and Day
 */

const redisClient = require('../redis')
const { logger } = require('../logging')

const DailyRedisKeyExpirationSec = 90 /* days */ * 24 /* hr */ * 60 /* min */ * 60 /* s */

const Outcomes = Object.freeze({
  SUCCESS: 'Success',
  FAILURE: 'Failure'
})

const SecondarySyncHealthTracker = {
  async recordSuccess (secondary, wallet, syncType) {
    await this._recordSyncRequestOutcome(secondary, wallet, syncType, true)
  },

  async recordFailure (secondary, wallet, syncType) {
    await this._recordSyncRequestOutcome(secondary, wallet, syncType, false)
  },

  async _recordSyncRequestOutcome (secondary, wallet, syncType, success = true) {
    try {
      const outcome = success ? Outcomes.SUCCESS : Outcomes.FAILURE
      const redisKey = this._getRedisKeyPattern(secondary, wallet, syncType, outcome)

      // incr() will create key with value 0 if non-existent
      await redisClient.incr(redisKey)

      // Set key expiration time (sec) in case it hasn't already been set (prob not most efficient)
      await redisClient.expire(redisKey, DailyRedisKeyExpirationSec)

      logger.info(`SecondarySyncHealthTracker:_recordSyncRequestOutcome || Recorded ${redisKey}`)

      // Swallow error + log
    } catch (e) {
      logger.error(`SecondarySyncHealthTracker:_recordSyncRequestOutcome Error || ${e.message}`)
    }
  },

  async computeUserSecondarySyncSuccessRates (wallet, secondary1, secondary2) {
    // Retrieve map of all SyncRequestOutcome keys and daily counts for user from all secondaries
    const userSecondarySyncHealthOutcomes = await SecondarySyncHealthTracker.getSyncMetricsForUser(wallet)

    // Compute sync success rate per secondary for user
    let sec1UserSyncSuccesses = 0; let sec1UserSyncFailures = 0; let sec2UserSyncSuccesses = 0; let sec2UserSyncFailures = 0
    for (let [key, count] of Object.entries(userSecondarySyncHealthOutcomes)) {
      count = parseInt(count)
      if (key.includes(secondary1) && key.includes('Success')) {
        sec1UserSyncSuccesses += count
      } else if (key.includes(secondary1) && key.includes('Failure')) {
        sec1UserSyncFailures += count
      } else if (key.includes(secondary2) && key.includes('Success')) {
        sec2UserSyncSuccesses += count
      } else if (key.includes(secondary2) && key.includes('Failure')) {
        sec2UserSyncFailures += count
      } else {
        // this case can be hit if old secondaries are present, should be ignored
      }
    }

    // Compute sync success rates for both secondaries
    const sec1UserSyncSuccessRate = (sec1UserSyncFailures === 0) ? 1 : (sec1UserSyncSuccesses / sec1UserSyncFailures)
    const sec2UserSyncSuccessRate = (sec2UserSyncFailures === 0) ? 1 : (sec2UserSyncSuccesses / sec2UserSyncFailures)

    return [sec1UserSyncSuccessRate, sec2UserSyncSuccessRate]
  },

  /**
   * Get SyncRequest outcome metrics for all secondaries, users, and days
   */
  async getAllSyncMetrics () {
    try {
      const pattern = this._getRedisKeyPattern('*', '*', '*', '*', '*')

      return this._getMetricsMatchingPattern(pattern)
    } catch (e) {
      logger.error(`secondarySyncHealthTracker - getAllSyncMetrics() Error || ${e.message}`)
      return {}
    }
  },

  /**
   * Get SyncRequest outcome metrics for given secondary, all users, and all days
   */
  async getSyncMetricsForSecondary (secondary) {
    try {
      const pattern = this._getRedisKeyPattern(secondary, '*', '*', '*', '*')

      return this._getMetricsMatchingPattern(pattern)
    } catch (e) {
      logger.error(`secondarySyncHealthTracker - getSyncMetricsForSecondary() Error || ${e.message}`)
      return {}
    }
  },

  /**
   * Get SyncRequest outcome metrics for given user, all secondaries, and all days
   */
  async getSyncMetricsForUser (wallet) {
    try {
      const pattern = this._getRedisKeyPattern('*', wallet, '*', '*', '*')

      return this._getMetricsMatchingPattern(pattern)
    } catch (e) {
      logger.error(`secondarySyncHealthTracker - getSyncMetricsForUser() Error || ${e.message}`)
      return {}
    }
  },

  /**
   * Get SyncRequest outcome metrics for given secondary, given user, and all days
   */
  async getSecondarySyncMetricsForSecondaryForUser (secondary, wallet) {
    try {
      const pattern = this._getRedisKeyPattern(secondary, wallet, '*', '*', '*')

      return this._getMetricsMatchingPattern(pattern)
    } catch (e) {
      logger.error(`secondarySyncHealthTracker - getSecondarySyncMetricsForUser() Error || ${e.message}`)
      return {}
    }
  },

  /**
   * Get SyncRequest outcome metrics for given secondary, given user, and for today
   */
  async getSecondarySyncMetricsForSecondaryForUserForToday (secondary, wallet) {
    try {
      const today = new Date().toISOString().split('T')[0] // format: YYYY-MM-DD
      const pattern = this._getRedisKeyPattern(secondary, wallet, '*', '*', today)

      return this._getMetricsMatchingPattern(pattern)
    } catch (e) {
      logger.error(`secondarySyncHealthTracker - getSecondarySyncMetricsForUserForToday() Error || ${e.message}`)
      return {}
    }
  },

  /**
   * Given redis key pattern, returns all keys matching pattern and associated values
   * Returns map of key-value pairs
   */
  async _getMetricsMatchingPattern (pattern) {
    const keys = await this._getAllKeysMatchingPattern(pattern)

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
  async _getAllKeysMatchingPattern (pattern) {
    const stream = redisClient.scanStream({ match: pattern })

    let keySet = new Set()
    return new Promise((resolve, reject) => {
      stream.on('data', async (keys = []) => {
        keys.forEach(key => { keySet.add(key) })
      })
      stream.on('end', () => {
        resolve(Array.from(keySet).filter(Boolean))
      })
      stream.on('error', e => {
        reject(e)
      })
    })
  },

  /**
   * Builds redis key pattern given params
   * Key pattern string can map to one or multiple keys
   */
  _getRedisKeyPattern (secondary, wallet, syncType, outcome, date = null) {
    const prefix = 'SecondarySyncRequestOutcomes-Daily'

    // format: YYYY-MM-DD
    date = date || new Date().toISOString().split('T')[0]

    return `${prefix}:::${secondary}:::${wallet}:::${syncType}:::${date}:::${outcome}`
  }
}

module.exports = SecondarySyncHealthTracker
