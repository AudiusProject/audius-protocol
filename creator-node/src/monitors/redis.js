import { redisClient as redis } from '../redis'

/**
 * Parses the result from a redis `info` command
 * @param {string} info
 */
const parseInfo = (info) => {
  const lines = info.split('\r\n')
  const obj = {}
  for (let i = 0, l = info.length; i < l; ++i) {
    let line = lines[i]
    if (line && line.split) {
      line = line.split(':')
      if (line.length > 1) {
        const key = line.shift()
        obj[key] = line.join(':')
      }
    }
  }
  return obj
}

const getRedisNumKeys = async () => {
  const numKeys = await redis.dbsize()
  return numKeys
}

const getRedisUsedMemory = async () => {
  const info = await redis.info()
  const parsedInfo = parseInfo(info)
  return parsedInfo.used_memory
}

const getRedisTotalMemory = async () => {
  const info = await redis.info()
  const parsedInfo = parseInfo(info)
  return parsedInfo.total_system_memory
}

module.exports = {
  getRedisNumKeys,
  getRedisUsedMemory,
  getRedisTotalMemory
}
