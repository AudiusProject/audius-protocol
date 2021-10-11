const Redis = require('ioredis')
const config = require('./config.js')
const redisClient = new Redis(config.get('redisPort'), config.get('redisHost'))
const { logger } = require('./logging')

const Lock = {
  setLock: async (key) => {
    const response = await redisClient.setnx(key, 1)
    if (response) return true
    else return false
  },
  getLock: async (key) => {
    const response = await redisClient.get(key)
    if (response) return true
    else return false
  },
  clearLock: async (key) => {
    redisClient.del(key)
  },
  clearAllLocks: async (keyPrefix) => {
    const stream = redisClient.scanStream({
      // only returns keys following the pattern of `user:*`
      match: keyPrefix
    })
    const multi = redisClient.multi({ pipeline: true })

    return new Promise((resolve, reject) => {
      stream.on('data', (resultKeys) => {
        for (let i = 0; i < resultKeys.length; i++) {
          multi.del(resultKeys[i])
        }
      })
      stream.on('end', async () => {
        await multi.exec()
        resolve()
      })
      stream.on('error', async (e) => {
        logger.error(`Error deleting all values from Redis`, e)
        reject(e)
      })
    })
  }
}

module.exports = {
  redisClient,
  Lock
}
