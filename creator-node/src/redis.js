const config = require('./config.js')
const { logger } = require('../logging')
const Redis = require('ioredis')

const redisClient = new Redis(config.get('redisPort'), config.get('redisHost'))

const EXPIRATION = 60 * 60 * 2 // 2 hours in seconds
class RedisLock {
  static async setLock(key, expiration = EXPIRATION) {
    logger.info(`SETTING LOCK ${key}`)
    // set allows you to set an optional expire param
    return redisClient.set(key, true, 'EX', expiration)
  }

  static async getLock(key) {
    logger.info(`GETTING LOCK ${key}`)
    return redisClient.get(key)
  }

  static async acquireLock(key, expiration = EXPIRATION) {
    logger.info(`SETTING LOCK IF NOT EXISTS ${key}`)
    const response = await redisClient.set(key, true, 'NX', 'EX', expiration)
    return !!response
  }

  static async removeLock(key) {
    logger.info(`DELETING LOCK ${key}`)
    return redisClient.del(key)
  }
}

function getNodeSyncRedisKey(wallet) {
  return `NODESYNC.${wallet}`
}

module.exports = redisClient
module.exports.lock = RedisLock
module.exports.getNodeSyncRedisKey = getNodeSyncRedisKey
