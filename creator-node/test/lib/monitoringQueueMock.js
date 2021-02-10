const { MONITORS, getMonitorRedisKey } = require('../../src/monitors/monitors')
const redisClient = require('../../src/redis')

// Mock monitoring queue that sets monitor values on construction
class MonitoringQueueMock {
  constructor () {
    redisClient.set(
      getMonitorRedisKey(MONITORS.DATABASE_LIVENESS),
      'true'
    )

    // Init mock storage used to a low percentage to pass storage check
    redisClient.set(
      getMonitorRedisKey(MONITORS.STORAGE_PATH_SIZE),
      100
    )
    redisClient.set(
      getMonitorRedisKey(MONITORS.STORAGE_PATH_USED),
      20
    )
  }

  async setRedisValues (key, value) {
    redisClient.set(key, value)
  }
}

module.exports = MonitoringQueueMock
