const redisClient = require('../redis')
const { logger: genericLogger } = require('../logging')

const DailyRedisKeyExpirationSec = 90 /* days */ * 24 /* hr */ * 60 /* min */ * 60 /* s */

const Outcomes = Object.freeze({
  SUCCESS: 'Success',
  FAILURE: 'Failure'
})

const SecondarySyncHealthTracker = {
  async recordSuccess (secondary, wallet, syncType, logContext = {}) {
    await SecondarySyncHealthTracker._recordSyncRequestOutcome(
      secondary, wallet, syncType, true, logContext
    )
  },

  async recordFailure (secondary, wallet, syncType, logContext = {}) {
    await SecondarySyncHealthTracker._recordSyncRequestOutcome(
      secondary, wallet, syncType, false, logContext
    )
  },

  async _recordSyncRequestOutcome (secondary, wallet, syncType, success = true, logContext) {
    const logger = genericLogger.child(logContext)

    try {
      const outcome = success ? Outcomes.SUCCESS : Outcomes.FAILURE
      const redisKey = SecondarySyncHealthTracker._getRedisKeyPattern(secondary, wallet, syncType, outcome)

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

  /**
   * Get SyncRequest outcome metrics for all secondaries, users, and days
   */
  async getAllSyncMetrics () {
    try {
      const pattern = SecondarySyncHealthTracker._getRedisKeyPattern('*', '*', '*', '*', '*')

      return SecondarySyncHealthTracker._getMetricsMatchingPattern(pattern)
    } catch (e) {
      genericLogger.error(`secondarySyncHealthTracker - getAllSyncMetrics() Error || ${e.message}`)
      return {}
    }
  },

  /**
   * Get SyncRequest outcome metrics for given secondary, all users, and all days
   */
  async getSyncMetricsForSecondary (secondary) {
    try {
      const pattern = SecondarySyncHealthTracker._getRedisKeyPattern(secondary, '*', '*', '*', '*')

      return SecondarySyncHealthTracker._getMetricsMatchingPattern(pattern)
    } catch (e) {
      genericLogger.error(`secondarySyncHealthTracker - getSyncMetricsForSecondary() Error || ${e.message}`)
      return {}
    }
  },

  /**
   * Get SyncRequest outcome metrics for given secondary, given user, and all days
   */
  async getSecondarySyncMetricsForSecondaryForUser (secondary, wallet) {
    try {
      const pattern = SecondarySyncHealthTracker._getRedisKeyPattern(secondary, wallet, '*', '*', '*')

      return SecondarySyncHealthTracker._getMetricsMatchingPattern(pattern)
    } catch (e) {
      genericLogger.error(`secondarySyncHealthTracker - getSecondarySyncMetricsForUser() Error || ${e.message}`)
      return {}
    }
  },

  /**
   * Get SyncRequest outcome metrics for given secondary, given user, and for today
   */
  async getSecondarySyncMetricsForSecondaryForUserForToday (secondary, wallet) {
    try {
      const today = new Date().toISOString().split('T')[0] // format: YYYY-MM-DD
      const pattern = SecondarySyncHealthTracker._getRedisKeyPattern(secondary, wallet, '*', '*', today)

      return SecondarySyncHealthTracker._getMetricsMatchingPattern(pattern)
    } catch (e) {
      genericLogger.error(`secondarySyncHealthTracker - getSecondarySyncMetricsForUserForToday() Error || ${e.message}`)
      return {}
    }
  },

  async _getMetricsMatchingPattern (pattern) {
    const keys = await SecondarySyncHealthTracker._getAllKeysMatchingPattern(pattern)

    if (!keys || !keys.length) {
      return {}
    }

    // This works because vals.length === keys.length
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
      // stream.on('error'),
    })
  },

  _getRedisKeyPattern (secondary, wallet, syncType, outcome, date = null) {
    const prefix = 'SecondarySyncRequestOutcomes-Daily'

    // format: YYYY-MM-DD
    date = date || new Date().toISOString().split('T')[0]

    return `${prefix}:::${secondary}:::${wallet}:::${syncType}:::${date}:::${outcome}`
  }
}

module.exports = SecondarySyncHealthTracker
