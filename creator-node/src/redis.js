const config = require('./config.js')
const { logger: genericLogger } = require('./logging')
const Redis = require('ioredis')

const redisClient = new Redis(config.get('redisPort'), config.get('redisHost'))

const EXPIRATION = 60 * 60 * 2 // 2 hours in seconds
class RedisLock {
  static async setLock(key, expiration = EXPIRATION) {
    genericLogger.info(`SETTING LOCK ${key}`)
    // set allows you to set an optional expire param
    return redisClient.set(key, true, 'EX', expiration)
  }

  static async getLock(key) {
    genericLogger.info(`GETTING LOCK ${key}`)
    return redisClient.get(key)
  }

  static async acquireLock(key, expiration = EXPIRATION) {
    genericLogger.info(`SETTING LOCK IF NOT EXISTS ${key}`)
    const response = await redisClient.set(key, true, 'NX', 'EX', expiration)
    return !!response
  }

  static async removeLock(key) {
    genericLogger.info(`DELETING LOCK ${key}`)
    return redisClient.del(key)
  }
}

function getNodeSyncRedisKey(wallet) {
  return `NODESYNC.${wallet}`
}

function getRedisKeyForWallet(wallet) {
  return `WALLET.${wallet}`
}

/**
 * Deletes keys of a pattern: https://stackoverflow.com/a/36006360
 * @param {Object} param
 * @param {string} param.keyPattern the redis key pattern that matches keys to remove
 * @param {Object} param.logger the logger instance
 */
function deleteKeyPatternInRedis({ keyPattern, logger = genericLogger }) {
  // Create a readable stream (object mode)
  const stream = redisClient.scanStream({
    match: keyPattern
  })
  stream.on('data', function (keys) {
    // `keys` is an array of strings representing key names
    if (keys.length) {
      const pipeline = redisClient.pipeline()
      keys.forEach(function (key) {
        pipeline.del(key)
      })
      pipeline.exec()
    }
  })
  stream.on('end', function () {
    logger.info(`Done deleting ${keyPattern} entries`)
  })
  stream.on('error', function (e) {
    logger.error(`Could not delete ${keyPattern} entries: ${e.toString()}`)
  })
}

module.exports = redisClient
module.exports.lock = RedisLock
module.exports.getNodeSyncRedisKey = getNodeSyncRedisKey
module.exports.deleteKeyPatternInRedis = deleteKeyPatternInRedis
module.exports.getRedisKeyForWallet = getRedisKeyForWallet
