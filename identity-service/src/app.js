const express = require('express')
const bodyParser = require('body-parser')
const cors = require('cors')
const rateLimit = require('express-rate-limit')
let config = require('./config.js')
var RedisStore = require('rate-limit-redis')
var Redis = require('ioredis')
var client = new Redis(config.get('redisPort'), config.get('redisHost'))

const { sendResponse, errorResponseServerError } = require('./apiHelpers')
const { logger, loggingMiddleware } = require('./logging')

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
    client: client,
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
    client: client,
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
    client: client,
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

  return { app: app, server: server }
}

module.exports = initializeApp
