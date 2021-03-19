const express = require('express')
const bodyParser = require('body-parser')
const cors = require('cors')
const mailgun = require('mailgun-js')
const Redis = require('ioredis')
const config = require('./config.js')
const txRelay = require('./relay/txRelay')
const ethTxRelay = require('./relay/ethTxRelay')
const { runMigrations } = require('./migrationManager')
const audiusLibsWrapper = require('./audiusLibsInstance')
const NotificationProcessor = require('./notifications/index.js')

const { sendResponse, errorResponseServerError } = require('./apiHelpers')
const { fetchAnnouncements } = require('./announcements')
const { logger, loggingMiddleware } = require('./logging')
const {
  getRateLimiter,
  getRateLimiterMiddleware,
  isIPWhitelisted,
  getIP
} = require('./rateLimiter.js')

const DOMAIN = 'mail.audius.co'

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
      await ethTxRelay.fundEthRelayerIfEmpty()
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
    await audiusLibsWrapper.init()
    const audiusInstance = audiusLibsWrapper.getAudiusLibs()
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

  // Create rate limits for listens on a per track per user basis and per track per ip basis
  _createRateLimitsForListenCounts (interval, timeInSeconds) {
    const listenCountLimiter = getRateLimiter({
      prefix: `listenCountLimiter:::${interval}-track:::`,
      expiry: timeInSeconds,
      max: config.get(`rateLimitingListensPerTrackPer${interval}`), // max requests per interval
      skip: function (req) {
        const { ip, senderIP } = getIP(req)
        const ipToCheck = senderIP || ip
        // Do not apply user-specific rate limits for any whitelisted IP
        return isIPWhitelisted(ipToCheck, req)
      },
      keyGenerator: function (req) {
        const trackId = req.params.id
        const userId = req.body.userId
        return `${trackId}:::${userId}`
      }
    })

    const listenCountIPLimiter = getRateLimiter({
      prefix: `listenCountLimiter:::${interval}-ip:::`,
      expiry: timeInSeconds,
      max: config.get(`rateLimitingListensPerIPPer${interval}`), // max requests per interval
      keyGenerator: function (req) {
        const trackId = req.params.id
        const { ip } = getIP(req)
        return `${ip}:::${trackId}`
      }
    })
    return [listenCountLimiter, listenCountIPLimiter]
  }

  setRateLimiters () {
    const requestRateLimiter = getRateLimiter({ prefix: 'reqLimiter', max: config.get('rateLimitingReqLimit') })
    this.express.use(requestRateLimiter)

    const authRequestRateLimiter = getRateLimiter({ prefix: 'authLimiter', max: config.get('rateLimitingAuthLimit') })
    // This limiter double dips with the reqLimiter. The 5 requests every hour are also counted here
    this.express.use('/authentication/', authRequestRateLimiter)

    const twitterRequestRateLimiter = getRateLimiter({ prefix: 'twitterLimiter', max: config.get('rateLimitingTwitterLimit') })
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

    // Eth relay rate limits
    // Default to 50 per ip per day and one of 10 per wallet per day
    const ethRelayIPRateLimiter = getRateLimiter({
      prefix: 'ethRelayIPRateLimiter',
      expiry: ONE_HOUR_IN_SECONDS * 24,
      max: config.get('rateLimitingEthRelaysPerIPPerDay'),
      skip: function (req) {
        return isIPWhitelisted(req.ip, req)
      }
    })
    const ethRelayWalletRateLimiter = getRateLimiter({
      prefix: `ethRelayWalletRateLimiter`,
      expiry: ONE_HOUR_IN_SECONDS * 24,
      max: config.get('rateLimitingEthRelaysPerWalletPerDay'),
      skip: function (req) {
        return isIPWhitelisted(req.ip, req)
      },
      keyGenerator: function (req) {
        return req.body.senderAddress
      }
    })
    this.express.use(
      '/eth_relay',
      ethRelayWalletRateLimiter,
      ethRelayIPRateLimiter
    )
    this.express.use(getRateLimiterMiddleware())
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
