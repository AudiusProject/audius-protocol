import type { RedisClientType } from 'redis'
import { createClient } from 'redis'

const url = process.env.AUDIUS_REDIS_URL || 'redis://localhost:6379/0'

let redisClient: RedisClientType
let isReady: boolean

export async function getRedisConnection(): Promise<RedisClientType> {
  if (!isReady) {
    redisClient = createClient({ url })
    redisClient.on('ready', () => {
      isReady = true
    })
    await redisClient.connect()
  }
  return redisClient
}

export async function clearRedisKeys() {
  const redis = await getRedisConnection()
  redis.flushAll()
}
