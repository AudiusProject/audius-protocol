import { createClient, RedisClientType } from 'redis'
import { AbuseStatus } from './middleware/antiAbuse'
import { config } from '.'

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

export const aaoStateKey = (handle: string): string =>
  `relay:aao:${handle}`

// stores the AAO status of a user into redis
export const storeAAOState = async (
  handle: string,
  abuseStatus: AbuseStatus
) => {
  const cacheKey = aaoStateKey(handle)
  const redis = await getRedisConnection()
  const cacheValue = JSON.stringify(abuseStatus)
  await redis.set(cacheKey, cacheValue)
}

// reads the last recorded AAO status of a user from redis
// returns null if not found
// antiAbuseMiddleware updates the cache asynchronously
export const readAAOState = async (
  handle: string
): Promise<AbuseStatus | null> => {
  const cacheKey = aaoStateKey(handle)
  const redis = await getRedisConnection()
  const cacheValue = await redis.get(cacheKey)
  if (cacheValue === null) return null
  return JSON.parse(cacheValue)
}
