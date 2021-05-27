const moment = require('moment')

const redisClient = require('../redis')
const { logger: genericLogger } = require('../logging')

const SYNC_STATES = Object.freeze({
  success: 'success',
  fail: 'fail'
})

// Make key expire in 7 days in seconds
const EXPIRATION = 7 /* days */ * 24 /* hr */ * 60 /* min */ * 60 /* s */

/**
 * Class intended to:
 * - Record the number of the current day's successful and failed sync attempts
 * - Record the timestamp of the most recent successful and failed sync
 */

// Note: When recording a sync 'success' or 'fail', it implies that the secondary was able to respectfully
// successfully or unsuccessfully take the primary's exported data, and update its own state

class SyncHistoryAggregator {
  static async recordSyncSuccess (logContext) {
    await SyncHistoryAggregator.recordSyncData({
      state: SYNC_STATES.success,
      timeOfEvent: moment().format('MM-DD-YYYYTHH:MM:SS:sss'),
      logContext
    })
  }

  static async recordSyncFail (logContext) {
    await SyncHistoryAggregator.recordSyncData({
      state: SYNC_STATES.fail,
      timeOfEvent: moment().format('MM-DD-YYYYTHH:MM:SS:sss'),
      logContext
    })
  }

  static async recordSyncData ({ state, timeOfEvent, logContext }) {
    const logger = genericLogger.child(logContext)

    try {
      // Update aggregate sync data
      const aggregateSyncKeys = SyncHistoryAggregator.getAggregateSyncKeys()

      // Get the TTL if the key exists for the number of `state` syncs, and update the value by 1
      const aggregateSyncKeyStateTTL = await this.getKeyTTL(aggregateSyncKeys[state])
      await redisClient.incr(aggregateSyncKeys[state])
      await redisClient.expire(aggregateSyncKeys[state], aggregateSyncKeyStateTTL)

      // Update latest sync data
      const latestSyncKeys = SyncHistoryAggregator.getLatestSyncKeys()

      const latestSyncKeyTTL = await this.getKeyTTL(latestSyncKeys[state])
      await redisClient.set(latestSyncKeys[state], timeOfEvent, 'EX', latestSyncKeyTTL)

      logger.info(`SyncHistoryAggregator - Successfully tracked ${state} sync at ${timeOfEvent}`)
    } catch (e) {
      // Only log error to not block any main thread
      logger.error(`SyncHistoryAggregator - Failed to track ${state} sync at ${timeOfEvent}: ${e.toString()}`)
    }
  }

  static async getKeyTTL (key) {
    const ttl = await redisClient.ttl(key)
    return ttl && ttl > 0 ? ttl : EXPIRATION
  }

  static async getAggregateSyncData () {
    const { success, fail } = SyncHistoryAggregator.getAggregateSyncKeys()

    let successCount = await redisClient.get(success)
    let failCount = await redisClient.get(fail)

    successCount = successCount ? parseInt(successCount) : 0
    failCount = failCount ? parseInt(failCount) : 0

    const currentAggregateData = {
      success: successCount,
      fail: failCount,
      triggered: successCount + failCount
    }

    // Structure: {triggered: <number>, success: <number>, fail: <number>}
    return currentAggregateData
  }

  static async getLatestSyncData () {
    const { success, fail } = SyncHistoryAggregator.getLatestSyncKeys()

    const successDate = await redisClient.get(success)
    const failDate = await redisClient.get(fail)

    const currentLatestSyncData = {
      success: successDate,
      fail: failDate
    }

    // Structure: {success: <latest date>, fail: <latest date>}
    return currentLatestSyncData
  }

  static getAggregateSyncKeys () {
    // ex: aggregateSync:::05212021:::success
    const prefix = `aggregateSync:::${new Date().toISOString().split('T')[0]}`

    return {
      success: `${prefix}:::${SYNC_STATES.success}`,
      fail: `${prefix}:::${SYNC_STATES.fail}`
    }
  }

  static getLatestSyncKeys (creatorNodeEndpoint) {
    // ex: latestSync:::05212021:::success
    const prefix = `latestSync:::${new Date().toISOString().split('T')[0]}`

    return {
      success: `${prefix}:::${SYNC_STATES.success}`,
      fail: `${prefix}:::${SYNC_STATES.fail}`
    }
  }
}

module.exports = SyncHistoryAggregator
