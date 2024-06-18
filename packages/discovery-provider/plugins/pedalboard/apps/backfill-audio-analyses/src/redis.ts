import { createClient, RedisClientType } from 'redis'
import { config } from '.'
import { logger } from './logger'

let redisClient: RedisClientType
let isReady: boolean

const DB_OFFSET_KEY = 'backfill_audio_analyses:offset'

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

export const storeDbOffset = async (offset: number) => {
  try {
    const redis = await getRedisConnection()
    await redis.set(DB_OFFSET_KEY, offset.toString())
  } catch (e) {
    logger.error({ error: e }, 'could not store db offset')
  }
}

// reads the last recorded db offset from redis
// returns null if not found
export const readDbOffset = async (): Promise<number | null> => {
  try {
    const redis = await getRedisConnection()
    const cacheValue = await redis.get(DB_OFFSET_KEY)
    if (cacheValue == null) return null
    return parseInt(cacheValue, 10)
  } catch (e) {
    logger.error({ error: e }, 'could not read db offset')
    return null
  }
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
