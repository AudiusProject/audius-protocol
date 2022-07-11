/**
 * Exports a Singleton Redis client instance, with custom wallet write locking logic
 */

const Redis = require('ioredis')

const config = require('./config.js')
const { logger: genericLogger } = require('./logging')
const { asyncRetry } = require('./utils')

const redisClient = new Redis(config.get('redisPort'), config.get('redisHost'))

const WalletWriteLock = {
  WALLET_WRITE_LOCK_EXPIRATION_SEC: 1800, // 30 min in sec

  VALID_ACQUIRERS: {
    UserWrite: 'userWrite',
    SecondarySyncFromPrimary: 'secondarySyncFromPrimary',
    PrimarySyncFromSecondary: 'primarySyncFromSecondary'
  },

  getKey: function (wallet) {
    return `WRITE.WALLET.${wallet}`
  },

  /**
   * Return lock holder, if held; else null
   */
  getCurrentHolder: async function (wallet) {
    const key = this.getKey(wallet)
    const holder = await redisClient.get(key)
    return holder
  },

  /** Returns true if lock is held by sync, else false */
  syncIsInProgress: async function (wallet) {
    const holder = await this.getCurrentHolder(wallet)

    return (
      holder === this.VALID_ACQUIRERS.PrimarySyncFromSecondary ||
      holder === this.VALID_ACQUIRERS.SecondarySyncFromPrimary
    )
  },

  /**
   * Return true if lock is held, else false
   */
  isHeld: async function (wallet) {
    const key = this.getKey(wallet)
    const holder = await redisClient.get(key)
    return !!holder
  },

  ttl: async function (wallet) {
    const key = this.getKey(wallet)
    const ttl = await redisClient.ttl(key)
    return ttl
  },

  /**
   * Attempt to acquire write lock for wallet
   * Throws error on call failure or acquisition failure
   * Does not return any value on success
   * @param wallet
   * @param acquirer
   * @param expirationSec
   */
  acquire: async function (
    wallet,
    acquirer,
    expirationSec = this.WALLET_WRITE_LOCK_EXPIRATION_SEC
  ) {
    // Ensure `acquirer` is valid
    if (!Object.values(this.VALID_ACQUIRERS).includes(acquirer)) {
      throw new Error(`Must provide valid acquirer`)
    }

    const key = this.getKey(wallet)

    let acquired = false

    await asyncRetry({
      asyncFn: async function () {
        const response = await redisClient.set(
          key,
          acquirer, // value
          'NX', // set if not exists
          'EX', // set expiration in seconds
          expirationSec
        )
        acquired = !!response
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
   * Does not return any value on success
   */
  release: async function (wallet) {
    const key = this.getKey(wallet)

    await asyncRetry({
      asyncFn: async function () {
        // Succeeds if removed or if no lock exists; throws error on call failure
        await redisClient.del(key)
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
const deleteKeyPatternInRedis = function ({
  keyPattern,
  logger = genericLogger
}) {
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
module.exports.WalletWriteLock = WalletWriteLock
module.exports.deleteKeyPatternInRedis = deleteKeyPatternInRedis
