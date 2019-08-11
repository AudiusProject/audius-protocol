const config = require('./config.js')
const Redis = require('ioredis')

const { errorResponse, sendResponse } = require('./apiHelpers')

const redisClient = new Redis(config.get('redisPort'), config.get('redisHost'))
module.exports = redisClient

const EXPIRATION = 90 // seconds
class RedisLock {
  static async setLock (key, expiration = EXPIRATION) {
    console.log(`SETTING LOCK ${key}`)
    // set allows you to set an optional expire param
    return redisClient.set(key, true, 'EX', expiration)
  }

  static async getLock (key) {
    console.log(`GETTING LOCK ${key}`)
    return redisClient.get(key)
  }

  static async removeLock (key) {
    console.log(`DELETING LOCK ${key}`)
    return redisClient.del(key)
  }
}
module.exports.lock = RedisLock

/** Ensure resource write access */
async function nodeSyncMiddleware (req, res, next) {
  req.logger.info('before nodeysnc middleware')
  if (req.session && req.session.wallet) {
    const redisKey = getNodeSyncRedisKey(req.session.wallet)
    const lockHeld = await RedisLock.getLock(redisKey)
    if (lockHeld) {
      return sendResponse(req, res, errorResponse(423,
        `Cannot change state of wallet ${req.session.wallet}. Node sync currently in progress.`
      ))
    }
  }
  req.logger.info('after nodeysnc middleware')
  next()
}

module.exports.nodeSyncMiddleware = nodeSyncMiddleware

function getNodeSyncRedisKey (wallet) {
  return `NODESYNC.${wallet}`
}

module.exports.getNodeSyncRedisKey = getNodeSyncRedisKey
