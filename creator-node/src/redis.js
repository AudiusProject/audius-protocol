const config = require('./config.js')
const Redis = require('ioredis')

const redisClient = new Redis(config.get('redisPort'), config.get('redisHost'))

const EXPIRATION = 60 * 60 * 2 // 2 hours in seconds
class RedisLock {
  static async setLock(key, expiration = EXPIRATION) {
    console.log(`SETTING LOCK ${key}`)
    // set allows you to set an optional expire param
    return redisClient.set(key, true, 'EX', expiration)
  }

  static async getLock(key) {
    console.log(`GETTING LOCK ${key}`)
    return redisClient.get(key)
  }

  static async removeLock(key) {
    console.log(`DELETING LOCK ${key}`)
    return redisClient.del(key)
  }
}

function getNodeSyncRedisKey(wallet) {
  return `NODESYNC.${wallet}`
}

class CID {
  static CID_KEY_PREFIX = 'CID:::'

  static METADATA_EXPIRATION_SEC = 3600 // 1hr

  static getKey (CID) {
    return `${CID_KEY_PREFIX}${CID}`
  }

  static async get (CID) {
    const key = this.getKey(CID)
    const val = await redisClient.get(key)
    if (!val) {
      return
    }
    return JSON.parse(val)
  }

  static async setMetadata (CID, metadata) {
    /**
     * TODO error if data size above max
     */
    const key = this.getKey(CID)
    return redisClient.set(key, JSON.stringify(metadata), 'EX', METADATA_EXPIRATION_SEC)
  }
}

module.exports = redisClient
module.exports.lock = RedisLock
module.exports.getNodeSyncRedisKey = getNodeSyncRedisKey
module.exports.CID = CID