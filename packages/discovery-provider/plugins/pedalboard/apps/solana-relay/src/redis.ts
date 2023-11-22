import { createClient, RedisClientType } from 'redis'
import { config } from './config'

let redisClient: RedisClientType
let isReady: boolean

export async function getRedisConnection() {
  if (!isReady) {
    redisClient = createClient({ url: config.redisUrl })
    redisClient.on('ready', () => {
      isReady = true
    })
    await redisClient.connect()
  }
  return redisClient
}

export const cacheTransaction = async (
  signature: string,
  transaction: string
) => {
  const redis = await getRedisConnection()
  const key = `solana:transaction:${signature}`
  await redis.set(key, transaction)
  await redis.expire(key, 30)
}

export const getCachedDiscoveryNodes = async () => {
  const redis = await getRedisConnection()
  const key = 'all-discovery-nodes'
  const json = await redis.get(key)
  try {
    const parsed = json === null ? [] : JSON.parse(json)
    if (!Array.isArray(parsed)) {
      return []
    }
    return parsed.filter((endpoint) => typeof endpoint === 'string') as string[]
  } catch {
    return []
  }
}
