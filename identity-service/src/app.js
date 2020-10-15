const express = require('express')
const bodyParser = require('body-parser')
const cors = require('cors')
const rateLimit = require('express-rate-limit')
const mailgun = require('mailgun-js')
const RedisStore = require('rate-limit-redis')
const Redis = require('ioredis')
const config = require('./config.js')
const txRelay = require('./txRelay')
const { runMigrations } = require('./migrationManager')
const initAudiusLibs = require('./audiusLibsInstance')
const NotificationProcessor = require('./notifications/index.js')

const { sendResponse, errorResponseServerError } = require('./apiHelpers')
const { fetchAnnouncements } = require('./announcements')
const { logger, loggingMiddleware } = require('./logging')
const DOMAIN = 'mail.audius.co'
const DEFAULT_EXPIRY = 60 * 60 // one hour in seconds
const DEFAULT_KEY_GENERATOR = (req) => req.ip

class App {
  constructor (port) {
    this.port = port
    this.express = express()
    this.redisClient = new Redis(config.get('redisPort'), config.get('redisHost'))
    this.configureMailgun()
    this.notificationProcessor = new NotificationProcessor()

    // Note: The order of the following functions is IMPORTANT, as it sets the functions
    // that process a request in the order applied
    this.expressSettings()
    this.setMiddleware()
    this.setRateLimiters()
    this.setRoutes()
    this.setErrorHandler()
  }

  async init () {
    // run all migrations
    // this is a stupid solution to a timing bug, because migrations attempt to get run when
    // the db port is exposed, not when it's ready to accept incoming connections. the timeout
    // attempts to wait until the db is accepting connections
    await new Promise(resolve => setTimeout(resolve, 2000))
    await this.runMigrations()
    await this.getAudiusAnnouncements()

    // exclude these init's if running tests
    if (!config.get('isTestRun')) {
      const audiusInstance = await this.configureAudiusInstance()
      await this.notificationProcessor.init(
        audiusInstance,
        this.express,
        this.redisClient
      )
    }

    let server
    await new Promise(resolve => {
      server = this.express.listen(this.port, resolve)
    })
    server.setTimeout(config.get('setTimeout'))
    server.timeout = config.get('timeout')
    server.keepAliveTimeout = config.get('keepAliveTimeout')
    server.headersTimeout = config.get('headersTimeout')

    this.express.set('redis', this.redisClient)

    try {
      await txRelay.fundRelayerIfEmpty()
    } catch (e) {
      logger.error(`Failed to fund relayer - ${e}`)
    }

    try {
      await txRelay.fundEthRelayerIfEmpty()
    } catch (e) {
      logger.error(`Failed to fund L1 relayer - ${e}`)
    }

    logger.info(`Listening on port ${this.port}...`)
    return { app: this.express, server }
  }

  configureMailgun () {
    // Configure mailgun instance
    let mg = null
    if (config.get('mailgunApiKey')) {
      mg = mailgun({ apiKey: config.get('mailgunApiKey'), domain: DOMAIN })
    }
    this.express.set('mailgun', mg)
  }

  async configureAudiusInstance () {
    const audiusInstance = await initAudiusLibs()
    this.express.set('audiusLibs', audiusInstance)
    return audiusInstance
  }

  async runMigrations () {
    logger.info('Executing database migrations...')
    try {
      await runMigrations()
    } catch (err) {
      logger.error('Error in migrations: ', err)
      process.exit(1)
    }
  }

  expressSettings () {
    // https://expressjs.com/en/guide/behind-proxies.html
    this.express.set('trust proxy', true)
  }

  setMiddleware () {
    this.express.use(loggingMiddleware)
    this.express.use(bodyParser.json({ limit: '1mb' }))
    this.express.use(cors())
  }

  _isIPWhitelisted (ip) {
    const whitelistRegex = config.get('rateLimitingListensIPWhitelist')
    return whitelistRegex && !!ip.match(whitelistRegex)
  }

  _getRateLimiter ({ prefix, max, expiry = DEFAULT_EXPIRY, keyGenerator = DEFAULT_KEY_GENERATOR, skip }) {
    return rateLimit({
      store: new RedisStore({
        client: this.redisClient,
        prefix,
        expiry
      }),
      max, // max requests per hour
      skip,
      keyGenerator
    })
  }

  // Create rate limits for listens on a per track per user basis and per track per ip basis
  _createRateLimitsForListenCounts (interval, timeInSeconds) {
    const isIPWhitelisted = this._isIPWhitelisted

    const listenCountLimiter = this._getRateLimiter({
      prefix: `listenCountLimiter:::${interval}-track:::`,
      expiry: timeInSeconds,
      max: config.get(`rateLimitingListensPerTrackPer${interval}`), // max requests per interval
      skip: function (req) {
        return isIPWhitelisted(req.ip)
      },
      keyGenerator: function (req) {
        const trackId = req.params.id
        const userId = req.body.userId
        return `${trackId}:::${userId}`
      }
    })

    const listenCountIPLimiter = this._getRateLimiter({
      prefix: `listenCountLimiter:::${interval}-ip:::`,
      expiry: timeInSeconds,
      max: config.get(`rateLimitingListensPerIPPer${interval}`), // max requests per interval
      skip: function (req) {
        return isIPWhitelisted(req.ip)
      },
      keyGenerator: function (req) {
        const trackId = req.params.id
        return `${req.ip}:::${trackId}`
      }
    })
    return [listenCountLimiter, listenCountIPLimiter]
  }

  setRateLimiters () {
    const requestRateLimiter = this._getRateLimiter({ prefix: 'reqLimiter', max: config.get('rateLimitingReqLimit') })
    this.express.use(requestRateLimiter)

    const authRequestRateLimiter = this._getRateLimiter({ prefix: 'authLimiter', max: config.get('rateLimitingAuthLimit') })
    // This limiter double dips with the reqLimiter. The 5 requests every hour are also counted here
    this.express.use('/authentication/', authRequestRateLimiter)

    const twitterRequestRateLimiter = this._getRateLimiter({ prefix: 'twitterLimiter', max: config.get('rateLimitingTwitterLimit') })
    // This limiter double dips with the reqLimiter. The 5 requests every hour are also counted here
    this.express.use('/twitter/', twitterRequestRateLimiter)

    const ONE_HOUR_IN_SECONDS = 60 * 60
    const [listenCountHourlyLimiter, listenCountHourlyIPLimiter] = this._createRateLimitsForListenCounts('Hour', ONE_HOUR_IN_SECONDS)
    const [listenCountDailyLimiter, listenCountDailyIPLimiter] = this._createRateLimitsForListenCounts('Day', ONE_HOUR_IN_SECONDS * 24)
    const [listenCountWeeklyLimiter, listenCountWeeklyIPLimiter] = this._createRateLimitsForListenCounts('Week', ONE_HOUR_IN_SECONDS * 24 * 7)

    // This limiter double dips with the reqLimiter. The 5 requests every hour are also counted here
    this.express.use(
      '/tracks/:id/listen',
      listenCountWeeklyIPLimiter,
      listenCountWeeklyLimiter,
      listenCountDailyIPLimiter,
      listenCountDailyLimiter,
      listenCountHourlyIPLimiter,
      listenCountHourlyLimiter
    )
  }

  setRoutes () {
    // import routes
    require('./routes')(this.express)
  }

  setErrorHandler () {
    function errorHandler (err, req, res, next) {
      req.logger.error('Internal server error')
      req.logger.error(err.stack)
      sendResponse(req, res, errorResponseServerError('Internal server error'))
    }
    this.express.use(errorHandler)
  }

  async getAudiusAnnouncements () {
    try {
      let { announcements, announcementMap } = await fetchAnnouncements()
      this.express.set('announcements', announcements)
      this.express.set('announcementMap', announcementMap)
    } catch (err) {
      const audiusNotificationUrl = config.get('audiusNotificationUrl')
      logger.error(`Error, unable to get aduius announcements from ${audiusNotificationUrl} \n [Err]:`, err)
    }
  }
}

module.exports = App
