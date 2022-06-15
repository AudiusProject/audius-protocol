const BlacklistManager = require('../../src/blacklistManager')

const { deleteKeyPatternInRedis } = require('./utils')

/**
 * Removes all BlacklistManager keys in redis
 * @param {Object} redis
 */
async function restartBlacklistManager(redis) {
  await redis.del(BlacklistManager.getRedisTrackIdKey())
  await redis.del(BlacklistManager.getRedisUserIdKey())
  await redis.del(BlacklistManager.getRedisSegmentCIDKey())
  await redis.del(BlacklistManager.getInvalidTrackIdsKey())

  deleteKeyPatternInRedis({
    keyPattern: BlacklistManager.getRedisTrackIdToCIDsKey('*'),
    redis
  })

  deleteKeyPatternInRedis({
    keyPattern: BlacklistManager.getRedisBlacklistSegmentToTrackIdKey('*'),
    redis
  })

  BlacklistManager.initialized = false
}

module.exports = {
  restartBlacklistManager
}
