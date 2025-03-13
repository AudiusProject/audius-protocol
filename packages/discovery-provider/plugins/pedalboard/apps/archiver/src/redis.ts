import { createClient, RedisClientType } from '@redis/client'

import { readConfig } from './config'

let redisClient: RedisClientType
let isReady: boolean

export const getRedisConnection = async () => {
  if (!isReady) {
    const config = readConfig()
    redisClient = createClient({ url: config.redisUrl })
    redisClient.on('ready', () => {
      isReady = true
    })
    await redisClient.connect()
  }
  return redisClient
}
