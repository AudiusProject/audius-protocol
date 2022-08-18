const redis = require('../../redis')

const HSetKey = 'UserSyncFailureCounts'

/**
 * Tracks user SyncRequest failure counts in Redis
 */
module.exports = class UserSyncFailureCountService {
  static async resetFailureCount(wallet: string) {
    await redis.hSet(HSetKey, wallet, 0)
  }

  static async incrementFailureCount(wallet: string) {
    return await redis.hIncrBy(HSetKey, wallet, 1)
  }

  static async getFailureCount(wallet: string) {
    return (await redis.hGet(wallet)) || 0
  }
}
