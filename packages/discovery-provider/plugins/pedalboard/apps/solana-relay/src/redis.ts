import { createClient, RedisClientType } from 'redis'
import { config } from './config'

let redisClient: RedisClientType
let isReady: boolean

const getRedisConnection = async () => {
  if (!isReady) {
    redisClient = createClient({ url: config.redisUrl })
    redisClient.on('ready', () => {
      isReady = true
    })
    await redisClient.connect()
  }
  return redisClient
}

const parseStringArray = (json: string | null) => {
  try {
    const parsed = JSON.parse(json ?? '[]')
    if (!Array.isArray(parsed)) {
      return []
    }
    return parsed.filter((value): value is string => typeof value === 'string')
  } catch {
    return []
  }
}

export const cacheTransaction = async (
  signature: string,
  transaction: string
) => {
  const redis = await getRedisConnection()
  const key = `solana:transaction:${signature}`
  await redis.set(key, transaction)
}

export const getCachedDiscoveryNodeEndpoints = async () => {
  const redis = await getRedisConnection()
  const key = 'all-discovery-nodes'
  const json = await redis.get(key)
  return parseStringArray(json)
}

export const getCachedDiscoveryNodeWallets = async () => {
  const redis = await getRedisConnection()
  const key = 'all-discovery-nodes-wallets'
  const json = await redis.get(key)
  return parseStringArray(json)
}
