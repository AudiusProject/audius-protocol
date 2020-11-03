const express = require('express')
const rateLimit = require('express-rate-limit')
const config = require('./config.js')
const RedisStore = require('rate-limit-redis')
const client = require('./redis.js')

let endpointRateLimits = {}
try {
  endpointRateLimits = JSON.parse(config.get('endpointRateLimits'))
} catch (e) {
  console.error('Failed to parse endpointRateLimits!')
}

const userReqLimiter = rateLimit({
  store: new RedisStore({
    client: client,
    prefix: 'userReqLimiter',
    expiry: 60 * 60 // one hour in seconds
  }),
  max: config.get('rateLimitingUserReqLimit'), // max requests per hour
  keyGenerator: function (req) {
    return req.ip
  }
})

const trackReqLimiter = rateLimit({
  store: new RedisStore({
    client: client,
    prefix: 'trackReqLimiter',
    expiry: 60 * 60 // one hour in seconds
  }),
  max: config.get('rateLimitingTrackReqLimit'), // max requests per hour
  keyGenerator: function (req) {
    return req.ip
  }
})

const audiusUserReqLimiter = rateLimit({
  store: new RedisStore({
    client: client,
    prefix: 'audiusUserReqLimiter',
    expiry: 60 * 60 // one hour in seconds
  }),
  max: config.get('rateLimitingAudiusUserReqLimit'), // max requests per hour
  keyGenerator: function (req) {
    return req.ip
  }
})

const metadataReqLimiter = rateLimit({
  store: new RedisStore({
    client: client,
    prefix: 'metadataReqLimit',
    expiry: 60 * 60 // one hour in seconds
  }),
  max: config.get('rateLimitingMetadataReqLimit'), // max requests per hour
  keyGenerator: function (req) {
    return req.ip
  }
})

const imageReqLimiter = rateLimit({
  store: new RedisStore({
    client: client,
    prefix: 'imageReqLimit',
    expiry: 60 * 60 // one hour in seconds
  }),
  max: config.get('rateLimitingImageReqLimit'), // max requests per hour
  keyGenerator: function (req) {
    return req.ip
  }
})

const onLimitReached = (req, res, options) => {
  req.logger.warn(req.rateLimit, `Rate Limit Hit`)
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
          const { expiry, max } = limit
          return getRateLimiter({
            prefix: `${route}:${method}:${expiry}:${max}`,
            expiry,
            max
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
  getRateLimiterMiddleware
}
