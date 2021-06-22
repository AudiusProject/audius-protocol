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
    const redisKey = SecondarySyncHealthTracker._getDailyRedisKey(secondary, '*', '*', '*', '*')
  }

  static async getAllSyncMetrics () {
    try {
      genericLogger.info(`SIDTEST getAllSyncMetrics START`)
      const redisKey = SecondarySyncHealthTracker._getDailyRedisKey('*', '*', '*', '*', '*')
      const resp = await redisClient.keys(redisKey)
      genericLogger.info(`SIDTEST getAllSyncMetrics ${redisKey}: ${resp}`)
    } catch (e) {
      genericLogger.error(`SIDTEST GETALLSYNCMETRICS ERROR ${e.message}`)
    }
  }

  /**
   * Return success and failure counts for SyncRequest outcomes for given user wallet on given secondary
   */
  static async getSecondarySyncMetricsForUser (secondary, wallet) {

  }

  static async getSecondarySyncMetricsForUserForToday (secondary, wallet) {

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