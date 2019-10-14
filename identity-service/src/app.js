const express = require('express')
const bodyParser = require('body-parser')
const cors = require('cors')
const rateLimit = require('express-rate-limit')
const mailgun = require('mailgun-js')
let config = require('./config.js')
var RedisStore = require('rate-limit-redis')
var Redis = require('ioredis')
var client = new Redis(config.get('redisPort'), config.get('redisHost'))

const { sendResponse, errorResponseServerError } = require('./apiHelpers')
const { logger, loggingMiddleware } = require('./logging')
const DOMAIN = 'mail.audius.co'

const app = express()
// middleware functions will be run in order they are added to the app below
//  - loggingMiddleware must be first to ensure proper error handling
app.use(loggingMiddleware)
app.use(bodyParser.json())
app.use(cors())

// https://expressjs.com/en/guide/behind-proxies.html
app.set('trust proxy', true)

const reqLimiter = rateLimit({
  store: new RedisStore({
    client,
    prefix: 'reqLimiter',
    expiry: 60 * 60 // one hour in seconds
  }),
  max: config.get('rateLimitingReqLimit'), // max requests per hour
  keyGenerator: function (req) {
    return req.ip
  }
})

app.use(reqLimiter)

const authLimiter = rateLimit({
  store: new RedisStore({
    client,
    prefix: 'authLimiter',
    expiry: 60 * 60 // one hour in seconds
  }),
  max: config.get('rateLimitingAuthLimit'), // max requests per hour
  keyGenerator: function (req) {
    return req.ip
  }
})

// This limiter double dips with the reqLimiter. The 5 requests every hour are also counted here
app.use('/authentication/', authLimiter)

const twitterLimiter = rateLimit({
  store: new RedisStore({
    client,
    prefix: 'twitterLimiter',
    expiry: 60 * 60 // one hour in seconds
  }),
  max: config.get('rateLimitingTwitterLimit'), // max requests per hour
  keyGenerator: function (req) {
    return req.ip
  }
})

// This limiter double dips with the reqLimiter. The 5 requests every hour are also counted here
app.use('/twitter/', twitterLimiter)

const ONE_HOUR_IN_SECONDS = 60 * 60
const [listenCountHourlyLimiter, listenCountHourlyIPLimiter] = _createRateLimitsForListenCounts('Hour', ONE_HOUR_IN_SECONDS)
const [listenCountDailyLimiter, listenCountDailyIPLimiter] = _createRateLimitsForListenCounts('Day', ONE_HOUR_IN_SECONDS * 24)
const [listenCountWeeklyLimiter, listenCountWeeklyIPLimiter] = _createRateLimitsForListenCounts('Week', ONE_HOUR_IN_SECONDS * 24 * 7)

// This limiter double dips with the reqLimiter. The 5 requests every hour are also counted here
app.use('/tracks/:id/listen', listenCountWeeklyIPLimiter, listenCountWeeklyLimiter, listenCountDailyIPLimiter, listenCountDailyLimiter, listenCountHourlyIPLimiter, listenCountHourlyLimiter)

// import routes
require('./routes')(app)

function errorHandler (err, req, res, next) {
  req.logger.error('Internal server error')
  req.logger.error(err.stack)
  sendResponse(req, res, errorResponseServerError('Internal server error'))
}
app.use(errorHandler)

const initializeApp = (port, audiusLibs) => {
  const server = app.listen(port, () => logger.info(`Listening on port ${port}...`))
  app.set('audiusLibs', audiusLibs)

  // Configure mailgun instance
  let mg = null
  if (config.get('mailgunApiKey')) {
    mg = mailgun({ apiKey: config.get('mailgunApiKey'), domain: DOMAIN })
  }
  app.set('mg', mg)

  return { app: app, server: server }
}

module.exports = initializeApp

// Create rate limits for listens on a per track per user basis and per track per ip basis
function _createRateLimitsForListenCounts (interval, timeInSeconds) {
  const listenCountLimiter = rateLimit({
    store: new RedisStore({
      client,
      prefix: `listenCountLimiter:::${interval}-track:::`,
      expiry: timeInSeconds
    }),
    max: config.get(`rateLimitingListensPerTrackPer${interval}`), // max requests per interval
    keyGenerator: function (req) {
      const trackId = req.params.id
      const userId = req.body.userId
      return `${trackId}:::${userId}`
    }
  })

  const listenCountIPLimiter = rateLimit({
    store: new RedisStore({
      client,
      prefix: `listenCountLimiter:::${interval}-ip:::`,
      expiry: timeInSeconds
    }),
    max: config.get(`rateLimitingListensPerIPPer${interval}`), // max requests per interval
    keyGenerator: function (req) {
      const trackId = req.params.id
      return `${req.ip}:::${trackId}`
    }
  })

  return [listenCountLimiter, listenCountIPLimiter]
}
