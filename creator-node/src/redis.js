/**
 * Exports a Singleton Redis client instance, with custom wallet write locking logic
 */

const Redis = require('ioredis')

const config = require('./config.js')
const { logger: genericLogger } = require('./logging')
const asyncRetry = require('./utils/asyncRetry')

const redisClient = new Redis(config.get('redisPort'), config.get('redisHost'))

const _getWalletWriteLockKey = function (wallet) {
  return `WRITE.WALLET.${wallet}`
}

const WalletWriteLock = {
  WALLET_WRITE_LOCK_EXPIRATION_SEC: 1800, // 30 min in sec

  VALID_ACQUIRERS: {
    SecondarySyncFromPrimary: 'secondarySyncFromPrimary',
    PrimarySyncFromSecondary: 'primarySyncFromSecondary'
  },

  /**
   * Return lock holder, if held; else null
   */
  getCurrentHolder: async function (wallet) {
    const key = _getWalletWriteLockKey(wallet)
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
    const key = _getWalletWriteLockKey(wallet)
    const holder = await redisClient.get(key)
    return !!holder
  },

  ttl: async function (wallet) {
    const key = _getWalletWriteLockKey(wallet)
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

    const key = _getWalletWriteLockKey(wallet)

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
    const key = _getWalletWriteLockKey(wallet)

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
 * @param keyPattern the redis key pattern that matches keys to remove
 * @return {Number} numDeleted number of redis keys deleted
 */
const deleteAllKeysMatchingPattern = async function (keyPattern) {
  // Create a readable stream (object mode)
  const stream = redisClient.scanStream({
    match: keyPattern
  })
  const deletedKeysSet = new Set()
  return new Promise((resolve, reject) => {
    stream.on('data', function (keys) {
      // `keys` is an array of strings representing key names
      if (keys.length) {
        const pipeline = redisClient.pipeline()
        keys.forEach(function (key) {
          pipeline.del(key)
          deletedKeysSet.add(key)
        })
        pipeline.exec()
      }
    })
    stream.on('end', function () {
      resolve(deletedKeysSet.size)
    })
    stream.on('error', function (e) {
      reject(e)
    })
  })
}

redisClient.deleteAllKeysMatchingPattern = deleteAllKeysMatchingPattern
module.exports = redisClient
module.exports.WalletWriteLock = WalletWriteLock
