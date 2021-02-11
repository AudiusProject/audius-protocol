const { MONITORS, getMonitorRedisKey } = require('../../src/monitors/monitors')
const redisClient = require('../../src/redis')

// Mock monitoring queue that sets monitor values on construction
class MonitoringQueueMock {
  constructor () {
    redisClient.set(
      getMonitorRedisKey(MONITORS.DATABASE_LIVENESS),
      'true'
    )
  }
}

module.exports = MonitoringQueueMock
