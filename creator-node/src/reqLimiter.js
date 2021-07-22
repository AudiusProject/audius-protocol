const express = require('express')
const rateLimit = require('express-rate-limit')
const config = require('./config.js')
const RedisStore = require('rate-limit-redis')
const client = require('./redis.js')
const { verifyRequesterIsValidSP } = require('./apiSigning.js')

let endpointRateLimits = {}
try {
  endpointRateLimits = JSON.parse(config.get('endpointRateLimits'))
} catch (e) {
  console.error('Failed to parse endpointRateLimits!')
}

// Key generator for rate limiter that rate limits based on unique IP
const ipKeyGenerator = (req) => req.ip

// Creates custom rate limiter key generator function based off url query, request body and IP
const getReqKeyGenerator = (options = {}) => (req) => {
  const { query = [], body = [], withIp = true } = options
  let key = withIp ? req.ip : ''
  if (req.query && query.length > 0) {
    query.forEach(queryKey => {
      if (queryKey in req.query) {
        key = key.concat(req.query[queryKey])
      }
    })
  }
  if (req.body && body.length > 0) {
    body.forEach(paramKey => {
      if (paramKey in req.body) {
        key = key.concat(req.body[paramKey])
      }
    })
  }
  return key
}

const userReqLimiter = rateLimit({
  store: new RedisStore({
    client: client,
    prefix: 'userReqLimiter',
    expiry: 60 * 60 // one hour in seconds
  }),
  max: config.get('rateLimitingUserReqLimit'), // max requests per hour
  keyGenerator: ipKeyGenerator,
  skip: async (req) => {
    const { libs } = req.app.get('serviceRegistry')
    let { timestamp, signature } = req.query
    const path = req.originalUrl

    if (path.includes('/users/clock_status') || path.includes('/users/batch_clock_status')) {
      try {
        await verifyRequesterIsValidSP({
          audiusLibs: libs,
          spID: req.query.spID,
          reqTimestamp: timestamp,
          reqSignature: signature
        })

        return true
      } catch (e) {
        // A non-SP requester query will hit this catch block. This is okay; just continue
        // with the rate limit and other middlewares as expected.
        req.logger.debug(`Requester is not a valid SP. Continuing with rate limit: ${e.toString()}`)
      }
    }

    return false
  }
})

const trackReqLimiter = rateLimit({
  store: new RedisStore({
    client: client,
    prefix: 'trackReqLimiter',
    expiry: 60 * 60 // one hour in seconds
  }),
  max: config.get('rateLimitingTrackReqLimit'), // max requests per hour
  keyGenerator: ipKeyGenerator
})

const audiusUserReqLimiter = rateLimit({
  store: new RedisStore({
    client: client,
    prefix: 'audiusUserReqLimiter',
    expiry: 60 * 60 // one hour in seconds
  }),
  max: config.get('rateLimitingAudiusUserReqLimit'), // max requests per hour
  keyGenerator: ipKeyGenerator
})

const metadataReqLimiter = rateLimit({
  store: new RedisStore({
    client: client,
    prefix: 'metadataReqLimit',
    expiry: 60 * 60 // one hour in seconds
  }),
  max: config.get('rateLimitingMetadataReqLimit'), // max requests per hour
  keyGenerator: ipKeyGenerator
})

const imageReqLimiter = rateLimit({
  store: new RedisStore({
    client: client,
    prefix: 'imageReqLimit',
    expiry: 60 * 60 // one hour in seconds
  }),
  max: config.get('rateLimitingImageReqLimit'), // max requests per hour
  keyGenerator: ipKeyGenerator
})

const URSMRequestForSignatureReqLimiter = rateLimit({
  store: new RedisStore({
    client: client,
    prefix: 'URSMRequestForSignatureReqLimiter',
    expiry: 60 * 60 // one hour in seconds
  }),
  max: config.get('URSMRequestForSignatureReqLimit'), // max requests per hour
  keyGenerator: ipKeyGenerator
})

const batchCidsExistReqLimiter = rateLimit({
  store: new RedisStore({
    client: client,
    prefix: 'batchCidsExistLimit',
    expiry: 5 // 5 seconds
  }),
  max: config.get('rateLimitingBatchCidsExistLimit'), // max requests every five seconds
  keyGenerator: ipKeyGenerator
})

const onLimitReached = (req, res, options) => {
  req.logger.warn(req.rateLimit, `Rate Limit Hit`)
}

/**
 * A generic endpoint rate limiter
 * @param {object} config
 * @param {string} config.prefix redis cache key prefix
 * @param {number?} config.max maximum number of requests in time period
 * @param {expiry?} config.expiry time period (seconds) of the rate limiter
 * @param {(req: Request) => string?} config.keyGenerator redis cache
 *  key suffix (can use the request object)
 * @param {boolean?} config.skip if true, limiter is avoided
 */
const getRateLimiter = ({
  prefix,
  max,
  expiry,
  keyGenerator = req => req.ip,
  skip
}) => {
  return rateLimit({
    store: new RedisStore({
      client,
      prefix: `rate:${prefix}`,
      expiry
    }),
    max, // max requests per hour
    skip,
    keyGenerator,
    onLimitReached
  })
}

/**
 * Create an express router to attach the rate-limiting middleware
 */
const validRouteMethods = ['get', 'post', 'put', 'delete']
const getRateLimiterMiddleware = () => {
  const router = express.Router()
  for (const route in endpointRateLimits) {
    for (const method in endpointRateLimits[route]) {
      if (validRouteMethods.includes(method)) {
        const routeMiddleware = endpointRateLimits[route][method].map(limit => {
          const { expiry, max, options = {} } = limit
          const keyGenerator = getReqKeyGenerator(options)
          return getRateLimiter({
            prefix: `${route}:${method}:${expiry}:${max}`,
            expiry,
            max,
            keyGenerator
          })
        })
        router[method](route, routeMiddleware)
      }
    }
  }
  return router
}

module.exports = {
  userReqLimiter,
  trackReqLimiter,
  audiusUserReqLimiter,
  metadataReqLimiter,
  imageReqLimiter,
  URSMRequestForSignatureReqLimiter,
  batchCidsExistReqLimiter,
  getRateLimiterMiddleware
}
