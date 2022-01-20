const express = require('express')
const bodyParser = require('body-parser')
const cookieParser = require('cookie-parser')
const mailgun = require('mailgun-js')
const { redisClient, Lock } = require('./redis')
const optimizelySDK = require('@optimizely/optimizely-sdk')
const Sentry = require('@sentry/node')
const cluster = require('cluster')

const config = require('./config.js')
const txRelay = require('./relay/txRelay')
const ethTxRelay = require('./relay/ethTxRelay')
const { runMigrations } = require('./migrationManager')
const audiusLibsWrapper = require('./audiusLibsInstance')

const NotificationProcessor = require('./notifications/index.js')
const { generateWalletLockKey } = require('./relay/txRelay.js')
const { generateETHWalletLockKey } = require('./relay/ethTxRelay.js')
const { RewardsAttester } = require('@audius/libs')
const models = require('./models')

const { SlackReporter, RewardsReporter } = require('./utils/rewardsReporter')
const { sendResponse, errorResponseServerError } = require('./apiHelpers')
const { fetchAnnouncements } = require('./announcements')
const { logger, loggingMiddleware } = require('./logging')
const {
  getRateLimiter,
  getRateLimiterMiddleware,
  isIPWhitelisted,
  getIP
} = require('./rateLimiter.js')
const cors = require('./corsMiddleware')
const { getFeatureFlag, FEATURE_FLAGS } = require('./featureFlag')
const { REMOTE_VARS, getRemoteVar } = require('./remoteConfig')

const DOMAIN = 'mail.audius.co'
const REDIS_ATTEST_HEALTH_KEY = 'last-attestation-time'
const REDIS_ATTEST_START_BLOCK_OVERRIDE_KEY = 'attestation-start-block-override'

class App {
  constructor (port) {
    this.port = port
    this.express = express()
    this.redisClient = redisClient
    this.configureSentry()
    this.configureMailgun()

    this.optimizelyPromise = null
    this.optimizelyClientInstance = this.configureOptimizely()

    // Async job configuration
    this.notificationProcessor = new NotificationProcessor({
      errorHandler: (error) => {
        try {
          return Sentry.captureException(error)
        } catch (sentryError) {
          logger.error(`Received error from Sentry ${sentryError}`)
        }
      }
    })

    // Note: The order of the following functions is IMPORTANT, as it sets the functions
    // that process a request in the order applied
    this.expressSettings()
    this.setMiddleware()
    this.setRateLimiters()
    this.setRoutes()
    this.setErrorHandler()
  }

  async init () {
    let server
    await this.getAudiusAnnouncements()

    /**
     * From the cluster docs - https://nodejs.org/docs/latest-v14.x/api/cluster.html#cluster_cluster
     * "A single instance of Node.js runs in a single thread. To take advantage of multi-core systems,
     * the user will sometimes want to launch a cluster of Node.js processes to handle the load.
     * The cluster module allows easy creation of child processes that all share server ports."
     *
     * We have the master node in the cluster run migrations and start notifications processor
     * The workers start express server processes
     */
    if (cluster.isMaster) {
      // run all migrations
      // this is a stupid solution to a timing bug, because migrations attempt to get run when
      // the db port is exposed, not when it's ready to accept incoming connections. the timeout
      // attempts to wait until the db is accepting connections
      await new Promise(resolve => setTimeout(resolve, 2000))
      await this.runMigrations()

      // clear POA & ETH relayer keys
      await Lock.clearAllLocks(generateWalletLockKey('*'))
      await Lock.clearAllLocks(generateETHWalletLockKey('*'))

      // if it's a non test run
      // 1. start notifications processing
      // 2. fork web server worker processes
      if (!config.get('isTestRun')) {
        const audiusInstance = await this.configureAudiusInstance()
        cluster.fork({ 'WORKER_TYPE': 'notifications' })

        await this.configureRewardsAttester(audiusInstance)
        await this.configureReporter()

        // Fork extra web server workers
        // note - we can't have more than 1 worker at the moment because POA and ETH relays
        // use in memory wallet locks
        for (let i = 0; i < config.get('clusterForkProcessCount'); i++) {
          cluster.fork({ 'WORKER_TYPE': 'web_server' })
        }

        cluster.on('exit', (worker, code, signal) => {
          logger.info(`Cluster: Worker ${worker.process.pid} died, forking another worker`)
          cluster.fork(worker.process.env)
        })
      } else {
        // if it's a test run only start the server
        await new Promise(resolve => {
          server = this.express.listen(this.port, resolve)
        })
        server.setTimeout(config.get('setTimeout'))
        server.timeout = config.get('timeout')
        server.keepAliveTimeout = config.get('keepAliveTimeout')
        server.headersTimeout = config.get('headersTimeout')

        this.express.set('redis', this.redisClient)

        logger.info(`Listening on port ${this.port}...`)
      }

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

      return { app: this.express, server }
    } else {
      // if it's not the master worker in the cluster
      const audiusInstance = await this.configureAudiusInstance()
      await this.configureReporter()

      if (process.env['WORKER_TYPE'] === 'notifications') {
        await this.notificationProcessor.init(
          audiusInstance,
          this.express,
          this.redisClient
        )
      } else {
        await new Promise(resolve => {
          server = this.express.listen(this.port, resolve)
        })
        server.setTimeout(config.get('setTimeout'))
        server.timeout = config.get('timeout')
        server.keepAliveTimeout = config.get('keepAliveTimeout')
        server.headersTimeout = config.get('headersTimeout')

        this.express.set('redis', this.redisClient)

        logger.info(`Listening on port ${this.port}...`)
        return { app: this.express, server }
      }
    }
  }

  configureMailgun () {
    // Configure mailgun instance
    let mg = null
    if (config.get('mailgunApiKey')) {
      mg = mailgun({ apiKey: config.get('mailgunApiKey'), domain: DOMAIN })
    }
    this.express.set('mailgun', mg)
  }

  configureSentry () {
    const dsn = config.get('sentryDSN')
    if (dsn) {
      Sentry.init({
        dsn
      })
    }
  }

  configureOptimizely () {
    const sdkKey = config.get('optimizelySdkKey')
    const optimizelyClientInstance = optimizelySDK.createInstance({
      sdkKey
    })

    this.optimizelyPromise = new Promise(resolve => {
      optimizelyClientInstance.onReady().then(() => {
        this.express.set('optimizelyClient', optimizelyClientInstance)
        resolve()
      })
    })
    return optimizelyClientInstance
  }

  configureReporter () {
    const slackReporter = new SlackReporter({
      slackUrl: config.get('reporterSlackUrl'),
      childLogger: logger
    })
    this.express.set('slackReporter', slackReporter)
  }

  async configureAudiusInstance () {
    await audiusLibsWrapper.init()
    const audiusInstance = audiusLibsWrapper.getAudiusLibs()
    this.express.set('audiusLibs', audiusInstance)
    return audiusInstance
  }

  async configureRewardsAttester (libs) {
    // Make a more greppable child logger
    const childLogger = logger.child({ 'service': 'RewardsAttester' })

    // Await for optimizely config so we know
    // whether rewards attestation is enabled,
    // returning early if false
    await this.optimizelyPromise
    const isEnabled = getFeatureFlag(this.optimizelyClientInstance, FEATURE_FLAGS.REWARDS_ATTESTATION_ENABLED)
    if (!isEnabled) {
      childLogger.info('Attestation disabled!')
      return
    }

    // Fetch the challengeDenyList, used to filter out
    // arbitrary challenges by their challengeId
    const challengeIdsDenyList = (
      (getRemoteVar(this.optimizelyClientInstance, REMOTE_VARS.CHALLENGE_IDS_DENY_LIST) || '')
        .split(',')
    )

    const endpoints = (
      (getRemoteVar(this.optimizelyClientInstance, REMOTE_VARS.REWARDS_ATTESTATION_ENDPOINTS) || '')
      .split(',')
    )

    // Fetch the last saved offset and startingBLock from the DB,
    // or create them if necessary.
    let initialVals = await models.RewardAttesterValues.findOne()
    if (!initialVals) {
      initialVals = models.RewardAttesterValues.build()
      initialVals.startingBlock = 0
      initialVals.offset = 0
      await initialVals.save()
    }

    const rewardsReporter = new RewardsReporter({
      slackUrl: config.get('rewardsReporterSlackUrl'),
      childLogger
    })

    // Init the RewardsAttester
    const attester = new RewardsAttester({
      libs,
      logger: childLogger,
      parallelization: config.get('rewardsParallelization'),
      quorumSize: config.get('rewardsQuorumSize'),
      aaoEndpoint: config.get('aaoEndpoint'),
      aaoAddress: config.get('aaoAddress'),
      startingBlock: initialVals.startingBlock,
      offset: initialVals.offset,
      challengeIdsDenyList,
      reporter: rewardsReporter,
      endpoints,
      updateValues: async ({ startingBlock, offset, successCount }) => {
        childLogger.info(`Persisting offset: ${offset}, startingBlock: ${startingBlock}`)

        await models.RewardAttesterValues.update({
          startingBlock,
          offset
        }, { where: {} })

        // If we succeeded in attesting for at least a single reward,
        // store in Redis so we can healthcheck it.
        if (successCount > 0) {
          await this.redisClient.set(REDIS_ATTEST_HEALTH_KEY, Date.now())
        }
      },
      getStartingBlockOverride: async () => {
        // Retrieve a starting block override from redis (that is set externally, CLI, or otherwise)
        // return that starting block so that the rewards attester changes its
        // starting block, and then delete the value from redis as to stop re-reading it
        const startBlock = await this.redisClient.get(REDIS_ATTEST_START_BLOCK_OVERRIDE_KEY)
        if (startBlock === undefined || startBlock === null) {
          return null
        }

        const parsedStartBlock = parseInt(startBlock, 10)
        // Regardless if we were able to parse the start block override, clear it now
        // so that subsequent runs don't pick it up again.
        await this.redisClient.del(REDIS_ATTEST_START_BLOCK_OVERRIDE_KEY)

        if (
          parsedStartBlock !== undefined &&
          parsedStartBlock !== null &&
          !isNaN(parsedStartBlock)
        ) {
          return parsedStartBlock
        }
        // In the case of failing to parse from redis, just return null
        return null
      }
    })
    attester.start()
    this.express.set('rewardsAttester', attester)
    return attester
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
    this.express.use(cookieParser())
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

    const listenCountIPTrackLimiter = getRateLimiter({
      prefix: `listenCountLimiter:::${interval}-ip-track:::`,
      expiry: timeInSeconds,
      max: config.get(`rateLimitingListensPerIPTrackPer${interval}`), // max requests per interval
      keyGenerator: function (req) {
        const trackId = req.params.id
        const { ip } = getIP(req)
        return `${ip}:::${trackId}`
      }
    })

    // Create a rate limiter for listens  based on IP
    const listenCountIPRequestLimiter = getRateLimiter({
      prefix: `listenCountLimiter:::${interval}-ip-exclusive:::`,
      expiry: interval,
      max: config.get(`rateLimitingListensPerIPPer${interval}`), // max requests per interval
      keyGenerator: function (req) {
        const { ip } = getIP(req)
        return `${ip}`
      }
    })

    return [listenCountLimiter, listenCountIPTrackLimiter, listenCountIPRequestLimiter]
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

    const tikTokRequestRateLimiter = getRateLimiter({ prefix: 'tikTokLimiter', max: config.get('rateLimitingTikTokLimit') })
    // This limiter double dips with the reqLimiter. The 5 requests every hour are also counted here
    this.express.use('/tiktok/', tikTokRequestRateLimiter)

    const ONE_HOUR_IN_SECONDS = 60 * 60
    const [listenCountHourlyLimiter, listenCountHourlyIPTrackLimiter] = this._createRateLimitsForListenCounts('Hour', ONE_HOUR_IN_SECONDS)
    const [listenCountDailyLimiter, listenCountDailyIPTrackLimiter, listenCountDailyIPLimiter] = this._createRateLimitsForListenCounts('Day', ONE_HOUR_IN_SECONDS * 24)
    const [listenCountWeeklyLimiter, listenCountWeeklyIPTrackLimiter] = this._createRateLimitsForListenCounts('Week', ONE_HOUR_IN_SECONDS * 24 * 7)

    // This limiter double dips with the reqLimiter. The 5 requests every hour are also counted here
    this.express.use(
      '/tracks/:id/listen',
      listenCountWeeklyIPTrackLimiter,
      listenCountWeeklyLimiter,
      listenCountDailyIPTrackLimiter,
      listenCountDailyLimiter,
      listenCountHourlyIPTrackLimiter,
      listenCountHourlyLimiter,
      listenCountDailyIPLimiter
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
      Sentry.captureException(err)
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
      logger.error(`Error, unable to get audius announcements from ${audiusNotificationUrl} \n [Err]:`, err)
    }
  }
}

module.exports = App
module.exports.REDIS_ATTEST_HEALTH_KEY = REDIS_ATTEST_HEALTH_KEY
