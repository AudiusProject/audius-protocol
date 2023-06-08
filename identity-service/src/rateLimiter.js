const Redis = require('ioredis')
const RedisStore = require('rate-limit-redis')
const config = require('./config.js')
const rateLimit = require('express-rate-limit')
const express = require('express')
const { isIPFromContentNode } = require('./utils/contentNodeIPCheck')
const redisClient = new Redis(
  config.get('redisPort'),
  config.get('redisHost'),
  { showFriendlyErrorStack: config.get('environment') !== 'production' }
)
const { libs } = require('@audius/sdk')
const AudiusABIDecoder = libs.AudiusABIDecoder

const DEFAULT_EXPIRY = 60 * 60 // one hour in seconds

const isIPWhitelisted = (ip, req) => {
  // If the IP is either something in the regex whitelist or it is from
  // a known content node, return true
  const whitelistRegex = config.get('rateLimitingListensIPWhitelist')
  const isWhitelisted = whitelistRegex && !!ip.match(whitelistRegex)

  let isFromContentNode = false
  try {
    isFromContentNode = isIPFromContentNode(ip, req)
  } catch (e) {
    // Log out and continue if for some reason signature validation threw
    req.logger.error(e)
  }

  // Don't return early so we can see logs for both paths
  req.logger.debug(
    `isIPWhitelisted - isWhitelisted: ${isWhitelisted}, isFromContentNode: ${isFromContentNode}`
  )
  return isWhitelisted || isFromContentNode
}

const getIP = (req) => {
  // Gets the IP for rate-limiting based on X-Forwarded-For headers
  // Algorithm:
  // If 1 header or no headers:
  //   We are not running behind a proxy, something is probably wonky, use req.ip (leftmost)
  // If > 1 headers:
  //   This assumes two proxies (some outer proxy like cloudflare and then some proxy like a load balancer)
  //   Rightmost header is the outer proxy
  //   Rightmost - 1 header is either a creator node OR the actual user
  //    If creator node, use Rightmost - 2 (since creator node will pass this along)
  //    Else, use Rightmost - 1 since it's the actual user

  const ip = req.ip
  const forwardedFor = req.get('X-Forwarded-For')

  // This shouldn't ever happen since Identity will always be behind a proxy
  if (!forwardedFor) {
    return { ip, isWhitelisted: true }
  }

  const headers = forwardedFor.split(',')
  // headers length == 1 means that we are not running behind normal 2 layer proxy (probably locally),
  // We can just use req.ip which corresponds to the best guess forward-for that was added if any
  if (headers.length === 1) {
    return { ip }
  }

  // Length is at least 2, length - 1 would be the outermost proxy, so length - 2 is the "sender"
  // either the actual user or a content node
  const senderIP = headers[headers.length - 2]
  const isWhitelisted = isIPWhitelisted(senderIP, req)
  if (isWhitelisted) {
    const forwardedIP = headers[headers.length - 3]
    if (!forwardedIP) {
      return { ip: senderIP, senderIP, isWhitelisted }
    }
    return { ip: forwardedIP, senderIP, isWhitelisted }
  }
  return { ip: senderIP, senderIP, isWhitelisted }
}

let endpointRateLimits = {}
try {
  endpointRateLimits = JSON.parse(config.get('endpointRateLimits'))
} catch (e) {
  console.error('Failed to parse endpointRateLimits!')
}

const getReqKeyGenerator =
  (options = {}) =>
  (req) => {
    const { query = [], body = [], withIp = true } = options
    let key = withIp ? getIP(req).ip : ''
    if (req.query && query.length > 0) {
      query.forEach((queryKey) => {
        if (queryKey in req.query) {
          key = key.concat(req.query[queryKey])
        }
      })
    }
    if (req.body && body.length > 0) {
      body.forEach((paramKey) => {
        if (paramKey in req.body) {
          key = key.concat(req.body[paramKey])
        }
      })
    }
    return key
  }

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
  expiry = DEFAULT_EXPIRY,
  keyGenerator = (req) => getIP(req).ip,
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
        const routeMiddleware = endpointRateLimits[route][method].map(
          (limit) => {
            const { expiry, max, options = {} } = limit
            const keyGenerator = getReqKeyGenerator(options)
            return getRateLimiter({
              prefix: `${route}:${method}:${expiry}:${max}:`,
              expiry,
              max,
              keyGenerator
            })
          }
        )
        router[method](route, routeMiddleware)
      }
    }
  }
  return router
}

const windowMapping = {
  hourly: 60 * 60 * 1000,
  daily: 24 * 60 * 60 * 1000
}
const getRelayRateLimiterMiddleware = (window) => {
  return getRateLimiter({
    windowMs: windowMapping[window],
    prefix: `relayWalletRateLimiter`,
    max: function (req) {
      const decodedABI = AudiusABIDecoder.decodeMethod(
        'EntityManager',
        req.body.encodedABI
      )
      const action = decodedABI.params.find(
        (param) => param.name === '_action'
      ).value
      const entityType = decodedABI.params.find(
        (param) => param.name === '_entityType'
      ).value
      const key = action + entityType
      const limit = config.get(key)[window]
      return limit
    },
    keyGenerator: function (req) {
      const decodedABI = AudiusABIDecoder.decodeMethod(
        'EntityManager',
        req.body.encodedABI
      )
      const action = decodedABI.params.find(
        (param) => param.name === '_action'
      ).value
      const entityType = decodedABI.params.find(
        (param) => param.name === '_entityType'
      ).value
      const key = action + entityType
      return ':::' + key + ':' + req.body.senderAddress
    }
  })
}

module.exports = {
  getIP,
  isIPWhitelisted,
  getRateLimiter,
  getRateLimiterMiddleware,
  getRelayRateLimiterMiddleware
}
