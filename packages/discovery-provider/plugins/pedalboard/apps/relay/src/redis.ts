import { createClient, RedisClientType } from 'redis'
import { readConfig } from './config/config'
import { AbuseStatus } from './middleware/antiAbuse'

let redisClient: RedisClientType
let isReady: boolean

const getRedisConnection = async () => {
  const config = readConfig()
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

export const scanWithPrefix = async <T>(
  prefix: string
): Promise<T[]> => {
  const processedRecords: T[] = [];
  let cursor = 0;

  do {
    // Use SCAN to fetch keys in batches without blocking the server
    const reply = await redisClient.scan(cursor, {
      MATCH: `${prefix}*`,
      COUNT: 100,
    });
    
    // redis will return 0 when scan is complete
    cursor = reply.cursor;
    const keys = reply.keys;
    
    for (const key of keys) {
      const value = await redisClient.get(key);
      if (value !== null) {
        processedRecords.push(JSON.parse(value));
      }
    }
  } while (cursor !== 0);
  return processedRecords;
};
