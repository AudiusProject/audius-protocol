import type { RedisClientType } from 'redis'
import { createClient } from 'redis'
import { parse } from 'ini'
import { readFileSync } from 'fs'

// TODO how to manage config between DN and plugin
// const config = parse(readFileSync(`${__dirname}/../../../../default_config.ini`, 'utf-8'))
// const url = config.redis.url
const url = "redis://localhost:5379/0" 

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
