const Redis = require('ioredis')
const RedisStore = require('rate-limit-redis')
const config = require('./config.js')

const redisClient = new Redis(config.get('redisPort'), config.get('redisHost'))
const rateLimit = require('express-rate-limit')

const DEFAULT_MAX = config.get('rateLimiterDefaultMax')
const DEFAULT_EXPIRY = 60 * 60 // one hour in seconds
const DEFAULT_KEY_GENERATOR = (req) => {
  return `${req.path}:${req.ip}`
}

/**
 * A generic endpoint rate limiter
 * @param {object} config
 * @param {string} config.prefix redis cache key prefix
 * @param {number?} config.max maximum number of requests
 * @param {expiry?} config.expiry time period of the rate limiter
 * @param {(req: Request) => string?} config.keyGenerator redis cache
 *  key suffix (can use the request object)
 * @param {boolean?} config.skip if true, limiter is avoided
 */
const getRateLimiter = ({
  prefix,
  max = DEFAULT_MAX,
  expiry = DEFAULT_EXPIRY,
  keyGenerator = DEFAULT_KEY_GENERATOR,
  skip
}) => {
  return rateLimit({
    store: new RedisStore({
      client: redisClient,
      prefix,
      expiry
    }),
    max, // max requests per hour
    skip,
    keyGenerator
  })
}

module.exports = { getRateLimiter }
