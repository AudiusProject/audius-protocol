const redisClient = require('../redis')
const { logger: genericLogger } = require('../logging')
const { keys } = require('../redis')

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
  static async recordSyncSuccess (creatorNodeEndpoint, logContext) {
    await SyncHistoryAggregator.recordSyncData({
      creatorNodeEndpoint,
      state: SYNC_STATES.success,
      timeOfEvent: Date.now(),
      logContext
    })
  }

  static async recordSyncFail (creatorNodeEndpoint, logContext) {
    await SyncHistoryAggregator.recordSyncData({
      creatorNodeEndpoint,
      state: SYNC_STATES.fail,
      timeOfEvent: Date.now(),
      logContext
    })
  }

  static async recordSyncData ({ creatorNodeEndpoint, state, timeOfEvent, logContext }) {
    const logger = genericLogger.child(logContext)

    try {
      // Update aggregate sync data
      const aggregateSyncKey = SyncHistoryAggregator.getAggregateSyncKey(creatorNodeEndpoint)
      if (!redisClient.get(aggregateSyncKey)) {
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
      let aggregateSyncKeyTTL = SyncHistoryAggregator.getKeyTTL(aggregateSyncKey)
      await redisClient.set(aggregateSyncKey,
        JSON.stringify(currentAggregateData),
        'EX',
        aggregateSyncKeyTTL
      )

      // Update latest sync data
      const latestSyncKey = SyncHistoryAggregator.getLatestSyncKey(creatorNodeEndpoint)
      if (!redisClient.get(latestSyncKey)) {
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
      currentLatestSyncData[state] = Date.now().format('MM-DD-YYYYTHH:MM:SS:ssss') // or some format

      // Get the existing TTL and update the key with it
      let latestSyncKeyTTL = SyncHistoryAggregator.getKeyTTL(latestSyncKey)
      await redisClient.set(latestSyncKey,
        JSON.stringify(currentLatestSyncData),
        'EX',
        latestSyncKeyTTL
      )

      logger.info(`Successfully tracked ${state} sync at ${timeOfEvent} from ${creatorNodeEndpoint}`)
    } catch (e) {
      // Only log error to not block any main thread
      logger.error(`Failed to track ${state} sync at ${timeOfEvent} from ${creatorNodeEndpoint}: ${e.toString()}`)
    }
  }

  static getKeyTTL (key) {
    redisClient.ttl(key, (err, ttl) => {
      if (err) {
        // If there is an error, use the existing default expiration
        return EXPIRATION
      } else {
        // Else, use the retrieved value
        return ttl
      }
    })
  }

  // ------------------- below methods can be used in determing peer health -------------------

  static getAggregateSyncData (creatorNodeEndpoint) {
    const aggregateSyncKey = SyncHistoryAggregator.getAggregateSyncKey(creatorNodeEndpoint)
    const currentAggregateData = redisClient.get(aggregateSyncKey)

    // Structure: {triggered: <number>, success: <number>, fail: <number>}
    return currentAggregateData
  }

  static getLatestSyncData (creatorNodeEndpoint) {
    const latestSyncKey = SyncHistoryAggregator.getLatestSyncKey(creatorNodeEndpoint)
    const currentLatestSyncData = redisClient.get(latestSyncKey)

    // Structure: {success: <latest date>, fail: <latest date>}
    return currentLatestSyncData
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
