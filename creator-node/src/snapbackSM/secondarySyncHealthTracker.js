const redisClient = require('../redis')
const { logger: genericLogger } = require('../logging')

const DailyRedisKeyExpirationSec = 90 /* days */ * 24 /* hr */ * 60 /* min */ * 60 /* s */

class SecondarySyncHealthTracker {
  static async recordSuccess (secondary, wallet, syncType, logContext = {}) {
    await SecondarySyncHealthTracker._recordSyncRequestOutcome(
      secondary, wallet, syncType, true, logContext
    )
  }

  static async recordFailure (secondary, wallet, syncType, logContext = {}) {
    await SecondarySyncHealthTracker._recordSyncRequestOutcome(
      secondary, wallet, syncType, false, logContext
    )
  }

  static async _recordSyncRequestOutcome (secondary, wallet, syncType, success, logContext) {
    const logger = genericLogger.child(logContext)

    try {
      const redisKey = SecondarySyncHealthTracker._getDailyRedisKey(secondary, wallet, syncType, success)
      logger.info(`SecondarySyncHealthTracker:_recordSyncRequestOutcome || Recording ${redisKey}`)

      // incr() will create key with value 0 if non-existent
      await redisClient.incr(redisKey)

      // Set key expiration time (sec) in case it hasn't already been set (prob not most efficient)
      await redisClient.expire(redisKey, DailyRedisKeyExpirationSec)

      // Swallow error + log
    } catch (e) {
      logger.error(`SecondarySyncHealthTracker:_recordSyncRequestOutcome Error || ${e.message}`)
    }
  }

  /**
   * Return success and failure counts for SyncRequest outcomes for every user on given secondary
   * Aggregates and 
   */
  static async getSyncMetricsForSecondary (secondary) {
    try {
      const redisKey = SecondarySyncHealthTracker._getDailyRedisKey(secondary, '*', '*', '*', '*')

      const keys = await redisClient.keys(redisKey)
      const vals = await redisClient.mget(keys)

      return vals
    } catch (e) {
      genericLogger.error(`secondarySyncHealthTracker - getSyncMetricsForSecondary() Error || ${e.message}`)
      return []
    }
  }

  static async getAllSyncMetrics () {
    try {
      const redisKey = SecondarySyncHealthTracker._getDailyRedisKey('*', '*', '*', '*', '*')

      const keys = await redisClient.keys(redisKey)
      const vals = await redisClient.mget(keys)

      return vals
    } catch (e) {
      genericLogger.error(`secondarySyncHealthTracker - getAllSyncMetrics() Error || ${e.message}`)
      return []
    }
  }

  /**
   * Return success and failure counts for SyncRequest outcomes for given user wallet on given secondary
   */
  static async getSecondarySyncMetricsForUser (secondary, wallet) {
    try {
      const redisKey = SecondarySyncHealthTracker._getDailyRedisKey(secondary, wallet, '*', '*', '*')

      const keys = await redisClient.keys(redisKey)
      const vals = await redisClient.mget(keys)

      return vals
    } catch (e) {
      genericLogger.error(`secondarySyncHealthTracker - getSecondarySyncMetricsForUser() Error || ${e.message}`)
      return []
    }
  }

  static async getSecondarySyncMetricsForUserForToday (secondary, wallet) {
    try {
      const today = new Date().toISOString().split('T')[0] // format: YYYY-MM-DD
      const redisKey = SecondarySyncHealthTracker._getDailyRedisKey(secondary, wallet, '*', '*', today)

      const keys = await redisClient.keys(redisKey)
      const vals = await redisClient.mget(keys)

      return vals
    } catch (e) {
      genericLogger.error(`secondarySyncHealthTracker - getSecondarySyncMetricsForUserForToday() Error || ${e.message}`)
      return []
    }
  }

  static _getDailyRedisKey (secondary, wallet, syncType, success, date = null) {
    const prefix = 'SecondarySyncRequestOutcomes-Daily'

    // format: YYYY-MM-DD
    date = date || new Date().toISOString().split('T')[0]

    const outcome = !!success ? 'Success' : 'Failure'

    return `${prefix}:::${secondary}:::${wallet}:::${syncType}:::${date}:::${outcome}`
  }
}

module.exports = SecondarySyncHealthTracker