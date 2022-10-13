const BlacklistManager = require('../../src/blacklistManager')
const { deleteAllKeysMatchingPattern } = require('../../src/redis')

/**
 * Removes all BlacklistManager keys in redis
 * @param {Object} redis
 */
async function restartBlacklistManager(redis) {
  await redis.del(BlacklistManager.getRedisTrackIdKey())
  await redis.del(BlacklistManager.getRedisUserIdKey())
  await redis.del(BlacklistManager.getRedisSegmentCIDKey())
  await redis.del(BlacklistManager.getInvalidTrackIdsKey())

  await deleteAllKeysMatchingPattern(BlacklistManager.getRedisTrackIdToCIDsKey('*'))

  BlacklistManager.initialized = false
}

module.exports = {
  restartBlacklistManager
}
