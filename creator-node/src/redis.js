const Redis = require('ioredis')

const config = require('./config.js')
const { logger: genericLogger } = require('./logging')
const { asyncRetry } = require('./utils')

const redisClient = new Redis(config.get('redisPort'), config.get('redisHost'))

const EXPIRATION_SEC = 60 * 60 * 2 // 2 hours in seconds

// NOTE - only interact with this class in a static context, don't create an instance
class RedisLock {
  static async setLock(key, expirationSec = EXPIRATION_SEC) {
    genericLogger.info(`[Redis][setLock] ${key}`)
    // 'EX' = set expiration in seconds
    return redisClient.set(key, true, 'EX', expirationSec)
  }

  static async getLock(key) {
    genericLogger.info(`[Redis][getLock] ${key}`)
    return redisClient.get(key)
  }

  // Acquire lock if not already held; return true if acquired, false if not
  static async acquireLock(key, expirationSec = EXPIRATION_SEC) {
    genericLogger.info(`[Redis][acquireLock] ${key}`)
    // NX = set if not exists; 'EX' = set expiration in seconds
    const response = await redisClient.set(key, true, 'NX', 'EX', expirationSec)
    return !!response
  }

  static async removeLock(key) {
    genericLogger.info(`[Redis][removeLock] ${key}`)
    return redisClient.del(key)
  }
}

function getNodeSyncRedisKey(wallet) {
  return `NODESYNC.${wallet}`
}

const WalletWriteLock = {
  WALLET_WRITE_LOCK_EXPIRATION_SEC: 1800, // 30 min in sec

  getKey: function (wallet) {
    return `WRITE.WALLET.${wallet}`
  },

  /**
   * Return boolean indicating if lock is already held
   */
  isHeld: async function (wallet) {
    const key = this.getKey(wallet)
    const isHeld = await RedisLock.getLock(key)
    return !!isHeld
  },

  /**
   * Attempt to acquire write lock for wallet
   * Throws error on call failure or acquisition failure
   */
  acquire: async function (
    wallet,
    expiration = this.WALLET_WRITE_LOCK_EXPIRATION_SEC
  ) {
    const key = this.getKey(wallet)

    let acquired = false

    await asyncRetry({
      asyncFn: async function () {
        // Returns boolean indicating acquired; throws error on call failure
        acquired = await RedisLock.acquireLock(key, expiration)
      },
      logger: genericLogger,
      log: false
    })

    if (!acquired) {
      throw new Error(
        `[acquireWriteLockForWallet][Wallet: ${wallet}] Error: Failed to acquire lock - already held.`
      )
    }
  },

  /**
   * Attempt to release write lock for wallet
   * Throws error on call failure
   */
  release: async function (wallet) {
    const key = this.getKey(wallet)

    await asyncRetry({
      asyncFn: async function () {
        // Succeeds if removed or if no lock exists; throws error on call failure
        await RedisLock.removeLock(key)
      },
      logger: genericLogger,
      log: false
    })
  }
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
module.exports.WalletWriteLock = WalletWriteLock
