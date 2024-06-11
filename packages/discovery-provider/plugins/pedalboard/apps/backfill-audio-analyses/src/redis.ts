import { createClient, RedisClientType } from 'redis'
import { config } from '.'
import { logger } from './logger'

let redisClient: RedisClientType
let isReady: boolean

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

export const getRedisConnection = async () => {
  if (!isReady) {
    redisClient = createClient({ url: config.redisUrl })
    redisClient.on('ready', () => {
      isReady = true
    })
    await redisClient.connect()
  }
  return redisClient
}

export const dbOffsetKey = (nodeId: number): string =>
  `backfill_audio_analyses:offset:${nodeId}`

export const storeDbOffset = async (
  nodeId: number,
  offset: number
) => {
  try {
    const cacheKey = dbOffsetKey(nodeId)
    const redis = await getRedisConnection()
    await redis.set(cacheKey, offset.toString())
  } catch (e) {
    logger.error({ nodeId, error: e }, "could not store db offset")
  }
}

// reads the last recorded db offset from redis
// returns null if not found
export const readDbOffset = async (
  nodeId: number
): Promise<number | null> => {
  try {
    const cacheKey = dbOffsetKey(nodeId)
    const redis = await getRedisConnection()
    const cacheValue = await redis.get(cacheKey)
    if (cacheValue == null) return null
    return parseInt(cacheValue, 10)
  } catch (e) {
    logger.error({ nodeId, error: e }, "could not read db offset")
    return null
  }
}

type DiscoveryNode = {
  delegateOwnerWallet: string
  endpoint: string
}

export const getCachedDiscoveryNodes = async () => {
  const redis = await getRedisConnection()
  const key = 'all-discovery-nodes-with-wallets'
  const json = await redis.get(key)
  return parseArray(json).filter(
    (p): p is DiscoveryNode =>
      'delegateOwnerWallet' in p &&
      'endpoint' in p &&
      typeof p.delegateOwnerWallet === 'string' &&
      typeof p.endpoint === 'string'
  )
}

type ContentNode = {
  delegateOwnerWallet: string
  endpoint: string
}

export const getCachedHealthyContentNodes = async () => {
  const redis = await getRedisConnection()
  const key = 'all-healthy-content-nodes'
  const json = await redis.get(key)
  return parseArray(json).filter(
    (p): p is ContentNode =>
      'delegateOwnerWallet' in p &&
      'endpoint' in p &&
      typeof p.delegateOwnerWallet === 'string' &&
      typeof p.endpoint === 'string'
  )
}
