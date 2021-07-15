const redisClient = require('../redis')
const { logger: genericLogger } = require('../logging')

const SYNC_STATES = Object.freeze({
  success: 'success',
  fail: 'fail'
})

// Make key expire in 90 days in seconds
const EXPIRATION = 90 /* days */ * 24 /* hr */ * 60 /* min */ * 60 /* s */

/**
 * A static class intended to:
 * - Record the number of the current day's successful and failed sync attempts
 * - Record the timestamp of the most recent successful and failed sync
 *
 * Note: A sync 'success' or 'fail' is a reflection of a secondary's ability to take the exported
 * data from the primary and update its own state. This code is only run on secondaries.
 *
 * TODO: Will be useful to pass along more data about syncs on top of `logContext`
 * e.g. user info
 */
class SyncHistoryAggregator {
  /**
   * Records a sync success
   * @param {Object} logContext the log context taken off of the Express req object
   */
  static async recordSyncSuccess (wallet, logContext = {}) {
    await SyncHistoryAggregator.recordSyncData({
      wallet,
      state: SYNC_STATES.success,
      timeOfEvent: new Date().toISOString(), // ex: "2021-05-28T01:05:20.294Z"
      logContext
    })
  }

  /**
   * Records a sync fail
   * @param {String} wallet wallet to record the sync status of
   * @param {Object} logContext the log context taken off of the Express req object
   */
  static async recordSyncFail (wallet, logContext = {}) {
    await SyncHistoryAggregator.recordSyncData({
      wallet,
      state: SYNC_STATES.fail,
      timeOfEvent: new Date().toISOString(), // ex: "2021-05-28T01:05:20.294Z"
      logContext
    })
  }

  /**
   * The underlying function that increments the `success` and `fail` sync count, and
   * also records the latest `success` and `fail`sync
   * @param {Object} param
   * @param {enum} state SYNC_STATUS.success or SYNC_STATUS.fail
   * @param {String} timeOfEvent date in structure MM-DD-YYYYTHH:MM:SS:sssZ
   * @param {String} wallet wallet to record the sync status of
   */
  static async recordSyncData ({ state, timeOfEvent, logContext, wallet }) {
    const logger = genericLogger.child(logContext)

    try {
      if (!wallet) throw new Error(`Required parameter wallet not passed into syncHistoryAggregator#recordSyncData`)

      if (!SYNC_STATES.hasOwnProperty(state)) {
        throw new Error(`Invalid state='${state}'. Must either be '${SYNC_STATES.success}' or '${SYNC_STATES.fail}'`)
      }

      // Update aggregate sync data
      const aggregateSyncKeys = SyncHistoryAggregator.getAggregateSyncKeys()

      // Get the TTL if the key exists for the number of `state` syncs, and update the value by 1
      const aggregateSyncKeyStateTTL = await SyncHistoryAggregator.getKeyTTL(aggregateSyncKeys[state])
      await redisClient.incr(aggregateSyncKeys[state])
      await redisClient.expire(aggregateSyncKeys[state], aggregateSyncKeyStateTTL)

      // Update latest sync data
      const latestSyncKeys = SyncHistoryAggregator.getLatestSyncKeys()

      const latestSyncKeyTTL = await SyncHistoryAggregator.getKeyTTL(latestSyncKeys[state])
      await redisClient.set(latestSyncKeys[state], timeOfEvent, 'EX', latestSyncKeyTTL)

      // Update per wallet success/fail sync data
      // Each daily wallet key stores a set of wallets, representing each unique user with a sync in that state that day
      const dailyWalletSyncKey = SyncHistoryAggregator.getUniqueSyncKeys()
      const dailyWalletSyncKeyTTL = await SyncHistoryAggregator.getKeyTTL(dailyWalletSyncKey[state])
      await redisClient.sadd(dailyWalletSyncKey[state], wallet)
      await redisClient.expire(dailyWalletSyncKey[state], dailyWalletSyncKeyTTL)

      logger.info(`SyncHistoryAggregator - Successfully tracked ${state} sync for wallet ${wallet} at ${timeOfEvent}`)
    } catch (e) {
      // Only log error to not block any main thread
      logger.error(`SyncHistoryAggregator - Failed to track ${state} sync for wallet ${wallet} at ${timeOfEvent}: ${e.toString()}`)
    }
  }

  /**
   * Retrieves the current key's ttl. If the key doesn't exist or is indefinite,
   * return the default expiration time of 7 days.
   * @param {String} key key to retrieve from redis
   * @returns expiration time in seconds
   */
  static async getKeyTTL (key) {
    try {
      const ttl = await redisClient.ttl(key)
      return ttl && ttl > 0 ? ttl : EXPIRATION
    } catch (e) {
      return EXPIRATION
    }
  }

  /**
   * Returns the aggregate sync data of the current day's number of successful, failed,
   * and triggered syncs
   * @param {Object?} logContext the log context off of the Express req object
   * @returns an object of the current day's aggregate sync count like
   *    {triggered: <natural number>, success: <natural number>, fail: <natural number>}
   */
  static async getAggregateSyncData (logContext = {}) {
    const logger = genericLogger.child(logContext)
    let currentAggregateData = {
      success: 0,
      fail: 0,
      triggered: 0
    }

    try {
      const { success, fail } = SyncHistoryAggregator.getAggregateSyncKeys()

      let successfulSyncsCount = await redisClient.get(success)
      let failedSyncsCount = await redisClient.get(fail)

      successfulSyncsCount = successfulSyncsCount ? parseInt(successfulSyncsCount) : 0
      failedSyncsCount = failedSyncsCount ? parseInt(failedSyncsCount) : 0

      currentAggregateData.success = successfulSyncsCount
      currentAggregateData.fail = failedSyncsCount
      currentAggregateData.triggered = successfulSyncsCount + failedSyncsCount
    } catch (e) {
      logger.error(`syncHistoryAggregator - getAggregateSyncData() error - ${e.toString()}`)
    }

    // Structure: {triggered: <natural number>, success: <natural number>, fail: <natural number>}
    return currentAggregateData
  }

  /**
   * Returns the date of the latest successful and failed sync. Will be `null` if a sync with those
   * states have not been triggered.
   * @param {Object?} logContext the log context off of the Express req object
   * @returns an object of the current day's aggregate sync count like
   *     {success: <YYYY-MM-DDTHH:MM:SS:sssZ>, fail: <YYYY-MM-DDTHH:MM:SS:sssZ>}
   */
  static async getLatestSyncData (logContext = {}) {
    const logger = genericLogger.child(logContext)
    let currentLatestSyncData = {
      success: 0,
      fail: 0
    }

    try {
      const { success, fail } = SyncHistoryAggregator.getLatestSyncKeys()

      const latestSyncSuccessTimestamp = await redisClient.get(success)
      const latestSyncFailTimestamp = await redisClient.get(fail)

      currentLatestSyncData.success = latestSyncSuccessTimestamp
      currentLatestSyncData.fail = latestSyncFailTimestamp
    } catch (e) {
      logger.error(`syncHistoryAggregator - getLatestSyncData() error - ${e.toString()}`)
    }
    // Structure: {success: <YYYY-MM-DDTHH:MM:SS:sssZ>, fail: <YYYY-MM-DDTHH:MM:SS:sssZ>}
    return currentLatestSyncData
  }

  /**
   * Returns the number of unique users with successful and fail syncs that day. Will be `null` if a sync with those
   * states have not been triggered.
   * @param {string?} date string with the structure YYYY-MM-DD. defaulted to today's date
   * @param {Object?} logContext the log context off of the Express req object
   * @returns an object of the current day's aggregate sync count like
   *     {success: <YYYY-MM-DDTHH:MM:SS:sssZ>, fail: <YYYY-MM-DDTHH:MM:SS:sssZ>}
   */
  static async getDailyWalletSyncData (date = new Date().toISOString().split('T')[0], logContext = {}) {
    const logger = genericLogger.child(logContext)
    let perWalletSyncData = {
      success: 0,
      fail: 0
    }

    try {
      const { success, fail } = SyncHistoryAggregator.getUniqueSyncKeys(date)

      // redis SCARD returns set cardinality (number of elements) in set
      const perWalletSyncSuccess = await redisClient.scard(success)
      const perWalletSyncFail = await redisClient.scard(fail)

      perWalletSyncData.success = perWalletSyncSuccess
      perWalletSyncData.fail = perWalletSyncFail
    } catch (e) {
      logger.error(`syncHistoryAggregator - getDailyWalletSyncData() error - ${e.toString()}`)
    }
    // Structure: {success: <int>, fail: <int>}
    return perWalletSyncData
  }

  /**
   * Retrieves the redis keys used for storing aggregate sync counts
   * @param {string?} date string with the structure YYYY-MM-DD. defaulted to today's date
   * @returns an object of the `success` and `fail` redis keys for the aggregate sync count
   */
  static getAggregateSyncKeys (date = new Date().toISOString().split('T')[0]) {
    const prefix = `aggregateSync:::${date}`

    // ex: aggregateSync:::2021-06-01:::success
    return {
      success: `${prefix}:::${SYNC_STATES.success}`,
      fail: `${prefix}:::${SYNC_STATES.fail}`
    }
  }

  /**
   * Retreives the redis keys used for storing wallets for syncs that succeeded or failed
   * @param {string?} date string with the structure YYYY-MM-DD. defaulted to today's date
   * @returns an object of the `succes` and `fail` redis keys for sync status by wallet
   */
  static getUniqueSyncKeys (date = new Date().toISOString().split('T')[0]) {
    const prefix = `uniqueSync:::${date}`

    // ex: uniqueSync:::2021-06-1:::success
    return {
      success: `${prefix}:::${SYNC_STATES.success}`,
      fail: `${prefix}:::${SYNC_STATES.fail}`
    }
  }

  /**
   * Retreives the redis keys used for storing latest sync dates
   * @param {string?} date string with the structure YYYY-MM-DD. defaulted to today's date
   * @returns an object of the `succes` and `fail` redis keys for the latest sync dates
   */
  static getLatestSyncKeys (date = new Date().toISOString().split('T')[0]) {
    const prefix = `latestSync:::${date}`

    // ex: latestSync:::2021-06-01:::success
    return {
      success: `${prefix}:::${SYNC_STATES.success}`,
      fail: `${prefix}:::${SYNC_STATES.fail}`
    }
  }
}

module.exports = SyncHistoryAggregator
module.exports.SYNC_STATES = SYNC_STATES
