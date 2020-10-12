const config = require('./config.js')
const Redis = require('ioredis')

const redisClient = new Redis(config.get('redisPort'), config.get('redisHost'))

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

function getNodeSyncRedisKey (wallet) {
  return `NODESYNC.${wallet}`
}

class RedisCache {
  static async setCache (key, value, expiration = EXPIRATION) {
    return redisClient.set(key, value, 'EX', expiration)
  }

  static async getCache (key) {
    return redisClient.get(key)
  }
}

module.exports = redisClient
module.exports.lock = RedisLock
module.exports.cache = RedisCache
module.exports.getNodeSyncRedisKey = getNodeSyncRedisKey
