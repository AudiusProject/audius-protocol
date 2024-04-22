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

const parseArray = (json: string | null) => {
  try {
    const parsed = JSON.parse(json ?? '[]')
    if (!Array.isArray(parsed)) {
      return []
    }
    return parsed
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
  await redis.set(key, transaction, { EX: 60 })
}

type DiscoveryNode = {
  delegateOwnerWallet: string
  endpoint: string
}

export const getCachedDiscoveryNodes = async () => {
  const redis = await getRedisConnection()
  const key = 'all-discovery-nodes'
  const json = await redis.get(key)
  return parseArray(json).filter(
    (p): p is DiscoveryNode =>
      'delegateOwnerWallet' in p &&
      'endpoint' in p &&
      typeof p.delegateOwnerWallet === 'string' &&
      typeof p.endpoint === 'string'
  )
}
