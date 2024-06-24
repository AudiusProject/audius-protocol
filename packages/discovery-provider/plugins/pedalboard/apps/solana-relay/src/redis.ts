import { createClient, RedisClientType } from 'redis'

import { config } from './config'

let redisClient: RedisClientType
let isReady: boolean

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

export const getCachedContentNodes = async () => {
  const redis = await getRedisConnection()
  const key = 'all-content-nodes'
  const json = await redis.get(key)
  return parseArray(json).filter(
    (p): p is ContentNode =>
      'delegateOwnerWallet' in p &&
      'endpoint' in p &&
      typeof p.delegateOwnerWallet === 'string' &&
      typeof p.endpoint === 'string'
  )
}

const TOKEN_ACCOUNT_CREATION_USER_KEY_EXPIRY = 60 * 60 * 24
const TOKEN_ACCOUNT_CREATION_USER_LIMIT = 2
const TOKEN_ACCOUNT_CREATION_VERIFIED_USER_LIMIT = 5
const TOKEN_ACCOUNT_CREATION_SYSTEM_KEY_EXPIRY = 60 * 60 * 24
const TOKEN_ACCOUNT_CREATION_SYSTEM_LIMIT = 5000

export const rateLimitTokenAccountCreation = async (
  wallet: string,
  isVerified: boolean
) => {
  const redis = await getRedisConnection()
  const userKey = `ata-creation-count:user:${wallet}`
  const limit = isVerified
    ? TOKEN_ACCOUNT_CREATION_VERIFIED_USER_LIMIT
    : TOKEN_ACCOUNT_CREATION_USER_LIMIT
  const [userCount] = await redis
    .multi()
    .incr(userKey)
    .expire(userKey, TOKEN_ACCOUNT_CREATION_USER_KEY_EXPIRY)
    .exec()
  if (typeof userCount !== 'number' || userCount > limit) {
    throw new Error(`User ${wallet} has created too many token accounts`)
  }

  const systemKey = `ata-creation-count`
  const [systemCount] = await redis
    .multi()
    .incr(systemKey)
    .expire(systemKey, TOKEN_ACCOUNT_CREATION_SYSTEM_KEY_EXPIRY)
    .exec()

  if (
    typeof systemCount !== 'number' ||
    systemCount > TOKEN_ACCOUNT_CREATION_SYSTEM_LIMIT
  ) {
    throw new Error('System has created too many token accounts')
  }
}
