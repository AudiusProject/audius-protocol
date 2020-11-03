const Redis = require('ioredis')
const RedisStore = require('rate-limit-redis')
const config = require('./config.js')
const rateLimit = require('express-rate-limit')
const compose = require('./composeMiddlewares.js')

const redisClient = new Redis(config.get('redisPort'), config.get('redisHost'))

const DEFAULT_EXPIRY = 60 * 60 // one hour in seconds
const DEFAULT_KEY_GENERATOR = (req) => {
  console.log('RATE LIMITING IP: ' + req.ip)
  return req.ip
}

let endpointRateLimits = {}
try {
  endpointRateLimits = JSON.parse(config.get('endpointRateLimits'))
} catch (e) {
  console.error('Failed to parse endpointRateLimits!')
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
  max,
  expiry = DEFAULT_EXPIRY,
  keyGenerator = DEFAULT_KEY_GENERATOR,
  skip
}) => {
  return rateLimit({
    store: new RedisStore({
      client: redisClient,
      prefix: `rate:${prefix}`,
      expiry
    }),
    max, // max requests per hour
    skip,
    keyGenerator
  })
}

const rateLimiterMiddleware = (req, res, next) => {
  const definedMethods = endpointRateLimits[req.path]
  if (!definedMethods) {
    return next()
  }
  const definedLimits = definedMethods[req.method.toLowerCase()]
  if (!definedLimits || !definedLimits.length) {
    return next()
  }

  const limiters = definedLimits.map(limit => {
    const { expiry, max } = limit
    return getRateLimiter({
      prefix: req.path,
      expiry,
      max
    })
  })

  return compose(limiters)(req, res, next)
}

module.exports = { getRateLimiter, rateLimiterMiddleware }
