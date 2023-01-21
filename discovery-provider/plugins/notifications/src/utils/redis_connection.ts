import type { RedisClientType } from 'redis'
import { createClient } from 'redis'

const url = process.env.audius_redis_url || "redis://localhost:5379/0"
console.log(`redis url: ${url}`)

let redisClient: RedisClientType
let isReady: boolean

export async function getRedisConnection(): Promise<RedisClientType> {
  if (!isReady) {
    redisClient = createClient({url})
    redisClient.on('ready', () => {
      isReady = true
    })
    await redisClient.connect()
  }
  return redisClient
}
