const moment = require('moment')

const redisClient = require('../redis')
const { logger: genericLogger } = require('../logging')
const config = require('../config')

const CREATOR_NODE_ENDPOINT = config.get('creatorNodeEndpoint')

const SYNC_STATES = Object.freeze({
  triggered: 'triggered',
  success: 'success',
  fail: 'fail'
})

// Make key expire in 7 days in seconds
const EXPIRATION = 7 /* days */ * 24 /* hr */ * 60 /* min */ * 60 /* s */

/**
 * Class intended to:
 * - Record the number of the current day's triggered, successful, and failed sync attempts
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
      const aggregateSyncKey = SyncHistoryAggregator.getAggregateSyncKey(CREATOR_NODE_ENDPOINT)
      const existingAggregateSyncEntry = await redisClient.get(aggregateSyncKey)
      if (!existingAggregateSyncEntry) {
      // Init aggregate sync data
        await redisClient.set(aggregateSyncKey,
          JSON.stringify({
            triggered: 0,
            success: 0,
            fail: 0
          }),
          'EX', // seconds -- Set the specified expire time, in seconds.
          EXPIRATION
        )
      }

      let currentAggregateData = await redisClient.get(aggregateSyncKey)
      currentAggregateData = JSON.parse(currentAggregateData)
      currentAggregateData[state] += 1
      currentAggregateData[SYNC_STATES.triggered] += 1

      // Get the existing TTL and update the key with it
      let aggregateSyncKeyTTL = await SyncHistoryAggregator.getKeyTTL(aggregateSyncKey)
      await redisClient.set(aggregateSyncKey,
        JSON.stringify(currentAggregateData),
        'EX',
        aggregateSyncKeyTTL
      )

      // Update latest sync data
      const latestSyncKey = SyncHistoryAggregator.getLatestSyncKey(CREATOR_NODE_ENDPOINT)
      const existingLatestSyncEntry = await redisClient.get(latestSyncKey)
      if (!existingLatestSyncEntry) {
        // Init latest sync data
        await redisClient.set(latestSyncKey,
          JSON.stringify({
            success: null,
            fail: null
          }),
          'EX',
          EXPIRATION
        )
      }

      let currentLatestSyncData = await redisClient.get(latestSyncKey)
      currentLatestSyncData = JSON.parse(currentLatestSyncData)
      currentLatestSyncData[state] = timeOfEvent

      // Get the existing TTL and update the key with it
      let latestSyncKeyTTL = await SyncHistoryAggregator.getKeyTTL(latestSyncKey)
      await redisClient.set(latestSyncKey,
        JSON.stringify(currentLatestSyncData),
        'EX',
        latestSyncKeyTTL
      )

      logger.info(`SyncHistoryAggregator - Successfully tracked ${state} sync at ${timeOfEvent} from ${CREATOR_NODE_ENDPOINT}`)
    } catch (e) {
      // Only log error to not block any main thread
      logger.error(`SyncHistoryAggregator - Failed to track ${state} sync at ${timeOfEvent} from ${CREATOR_NODE_ENDPOINT}: ${e.toString()}`)
    }
  }

  static async getKeyTTL (key) {
    const ttl = await redisClient.ttl(key)
    return ttl || EXPIRATION
  }

  static async getAggregateSyncData () {
    const aggregateSyncKey = SyncHistoryAggregator.getAggregateSyncKey(CREATOR_NODE_ENDPOINT)
    const currentAggregateData = await redisClient.get(aggregateSyncKey)

    // Structure: {triggered: <number>, success: <number>, fail: <number>}
    return currentAggregateData ? JSON.parse(currentAggregateData) : {}
  }

  static async getLatestSyncData () {
    const latestSyncKey = SyncHistoryAggregator.getLatestSyncKey(CREATOR_NODE_ENDPOINT)
    const currentLatestSyncData = await redisClient.get(latestSyncKey)

    // Structure: {success: <latest date>, fail: <latest date>}
    return currentLatestSyncData ? JSON.parse(currentLatestSyncData) : {}
  }

  static getAggregateSyncKey (creatorNodeEndpoint) {
    // ex: creatornode.audius.co:::aggregateSync:::05212021
    return `${creatorNodeEndpoint}:::aggregateSync:::${new Date().toISOString().split('T')[0]}`
  }

  static getLatestSyncKey (creatorNodeEndpoint) {
    // ex: creatornode.audius.co:::latestSync:::05212021
    return `${creatorNodeEndpoint}:::latestSync:::${new Date().toISOString().split('T')[0]}`
  }
}

module.exports = SyncHistoryAggregator
