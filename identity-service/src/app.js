const express = require('express')
const bodyParser = require('body-parser')
const axios = require('axios')
const moment = require('moment')
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
const { logger, loggingMiddleware } = require('./logging')
const DOMAIN = 'mail.audius.co'
const DEFAULT_EXPIRY = 60 * 60 // one hour in seconds
const DEFAULT_KEY_GENERATOR = (req) => req.ip

class App {
  constructor (port) {
    this.port = port
    this.express = express()
    this.redisClient = new Redis(config.get('redisPort'), config.get('redisHost'))

    this.expressSettings()
    this.setMiddleware()
    this.setRateLimiters()
    this.setRoutes()
    this.setErrorHandler()
    this.configureMailgun()
    this.notificationProcessor = new NotificationProcessor()
  }

  async init () {
    // run all migrations
    // this is a stupid solution to a timing bug, because migrations attempt to get run when
    // the db port is exposed, not when it's ready to accept incoming connections. the timeout
    // attempts to wait until the db is accepting connections
    await new Promise(resolve => setTimeout(resolve, 2000))
    await this.runMigrations()
    await this.getAudiusAnnoucments()
    await this.configureAudiusInstance()
    let server
    await new Promise(resolve => {
      server = this.express.listen(this.port, resolve)
    })
    await txRelay.fundRelayerIfEmpty()
    await this.notificationProcessor.init(this.audiusLibs, this.redisClient)
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
    // TODO: Whitelist disc prov for identity service
    this.audiusInstance = await initAudiusLibs()
    this.express.set('audiusLibs', this.audiusInstance)
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
    this.express.use(bodyParser.json())
    this.express.use(cors())
  }

  getRateLimiter ({ prefix, max, expiry = DEFAULT_EXPIRY, keyGenerator = DEFAULT_KEY_GENERATOR }) {
    return rateLimit({
      store: new RedisStore({
        client: this.redisClient,
        prefix,
        expiry
      }),
      max, // max requests per hour
      keyGenerator
    })
  }

  // Create rate limits for listens on a per track per user basis and per track per ip basis
  _createRateLimitsForListenCounts (interval, timeInSeconds) {
    const listenCountLimiter = this.getRateLimiter({
      prefix: `listenCountLimiter:::${interval}-track:::`,
      expiry: timeInSeconds,
      max: config.get(`rateLimitingListensPerTrackPer${interval}`), // max requests per interval
      keyGenerator: function (req) {
        const trackId = req.params.id
        const userId = req.body.userId
        return `${trackId}:::${userId}`
      }
    })

    const listenCountIPLimiter = this.getRateLimiter({
      prefix: `listenCountLimiter:::${interval}-ip:::`,
      expiry: timeInSeconds,
      max: config.get(`rateLimitingListensPerIPPer${interval}`), // max requests per interval
      keyGenerator: function (req) {
        const trackId = req.params.id
        return `${req.ip}:::${trackId}`
      }
    })
    return [listenCountLimiter, listenCountIPLimiter]
  }

  setRateLimiters () {
    const requestRateLimiter = this.getRateLimiter({ prefix: 'reqLimiter', max: config.get('rateLimitingReqLimit') })
    this.express.use(requestRateLimiter)

    const authRequestRateLimiter = this.getRateLimiter({ prefix: 'authLimiter', max: config.get('rateLimitingAuthLimit') })
    // This limiter double dips with the reqLimiter. The 5 requests every hour are also counted here
    this.express.use('/authentication/', authRequestRateLimiter)

    const twitterRequestRateLimiter = this.getRateLimiter({ prefix: 'twitterLimiter', max: config.get('rateLimitingTwitterLimit') })
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

  async getAudiusAnnoucments () {
    const audiusNotificationUrl = config.get('audiusNotificationUrl')
    try {
      const response = await axios.get(`${audiusNotificationUrl}/index.json`)
      if (response.data && Array.isArray(response.data.notifications)) {
        const announcements = await Promise.all(response.data.notifications.map(async notification => {
          const notificationResponse = await axios.get(`${audiusNotificationUrl}/${notification.id}.json`)
          return notificationResponse.data
        }))

        announcements.sort((a, b) => {
          let aDate = moment(a.datePublished)
          let bDate = moment(b.datePublished)
          return bDate - aDate
        })
        const announcementMap = announcements.reduce((acc, a) => {
          acc[a.entityId] = a
          return acc
        }, {})
        this.express.set('announcements', announcements)
        this.express.set('announcementMap', announcementMap)
      }
    } catch (err) {
      logger.error(`Error, unable to get aduius annoucnements from ${audiusNotificationUrl} \n [Err]:`, err)
    }
  }
}

module.exports = App
