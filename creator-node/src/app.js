const express = require('express')
const bodyParser = require('body-parser')
const cors = require('cors')
const promBundle = require('express-prom-bundle')

const DiskManager = require('./diskManager')
const { sendResponse, errorResponseServerError } = require('./apiHelpers')
const { logger, loggingMiddleware } = require('./logging')
const {
  readOnlyMiddleware
} = require('./middlewares/readOnly/readOnlyMiddleware')
const {
  userReqLimiter,
  trackReqLimiter,
  audiusUserReqLimiter,
  metadataReqLimiter,
  imageReqLimiter,
  URSMRequestForSignatureReqLimiter,
  batchCidsExistReqLimiter,
  getRateLimiterMiddleware
} = require('./reqLimiter')
const config = require('./config')
const healthCheckRoutes = require('./components/healthCheck/healthCheckController')
const contentBlacklistRoutes = require('./components/contentBlacklist/contentBlacklistController')
const replicaSetRoutes = require('./components/replicaSet/replicaSetController')

function errorHandler(err, req, res, next) {
  req.logger.error('Internal server error')
  req.logger.error(err.stack)
  sendResponse(req, res, errorResponseServerError('Internal server error'))
}

/**
 * Configures express app object with required properties and starts express server
 *
 * @param {number} port port number on which to expose server
 * @param {ServiceRegistry} serviceRegistry object housing all Content Node Services
 */
const initializeApp = (port, serviceRegistry) => {
  const app = express()

  // middleware functions will be run in order they are added to the app below
  //  - loggingMiddleware must be first to ensure proper error handling
  app.use(loggingMiddleware)
  app.use(bodyParser.json({ limit: '1mb' }))
  app.use(readOnlyMiddleware)
  app.use(cors())

  // Rate limit routes
  app.use('/users/', userReqLimiter)
  app.use('/track*', trackReqLimiter)
  app.use('/audius_user/', audiusUserReqLimiter)
  app.use('/metadata', metadataReqLimiter)
  app.use('/image_upload', imageReqLimiter)
  app.use('/ursm_request_for_signature', URSMRequestForSignatureReqLimiter)
  app.use('/batch_cids_exist', batchCidsExistReqLimiter)
  app.use('/batch_image_cids_exist', batchCidsExistReqLimiter)
  app.use(getRateLimiterMiddleware())

  const prometheusRegistry = serviceRegistry.prometheusRegistry

  // Metric tracking middleware
  app.use(
    promBundle({
      // use existing registry for compatibility with custom metrics
      promRegistry: prometheusRegistry.registry,
      // override metric name to include namespace prefix
      httpDurationMetricName: `${prometheusRegistry.namespacePrefix}_http_request_duration_seconds`,
      includeMethod: true,
      includePath: true,
      autoregister: false,
      normalizePath: function (req, opts) {
        const path = promBundle.normalizePath(req, opts)
        try {
          for (const {
            regex,
            path: normalizedPath
          } of prometheusRegistry.regexes) {
            const match = path.match(regex)
            if (match) {
              return normalizedPath
            }
          }
        } catch (e) {
          req.logger.warn(
            `DurationTracking || Could not match on regex: ${e.message}`
          )
        }
        return path
      }
    })
  )

  // import routes
  require('./routes')(app)
  app.use('/', healthCheckRoutes)
  app.use('/', contentBlacklistRoutes)
  app.use('/', replicaSetRoutes)

  app.use(errorHandler)

  const storagePath = DiskManager.getConfigStoragePath()

  // TODO: Can remove these when all routes consume serviceRegistry
  app.set('storagePath', storagePath)
  app.set('redisClient', serviceRegistry.redis)
  app.set('audiusLibs', serviceRegistry.libs)
  app.set('blacklistManager', serviceRegistry.blacklistManager)
  app.set('trustedNotifierManager', serviceRegistry.trustedNotifierManager)

  // Eventually, all components should pull services off the serviceRegistry
  app.set('serviceRegistry', serviceRegistry)

  // https://expressjs.com/en/guide/behind-proxies.html
  app.set('trust proxy', true)

  const server = app.listen(port, () =>
    logger.info(`Listening on port ${port}...`)
  )

  // Increase from 2min default to accommodate long-lived requests.
  server.setTimeout(config.get('setTimeout'), () => {
    logger.debug(`Server socket timeout hit`)
  })
  server.timeout = config.get('timeout')
  server.keepAliveTimeout = config.get('keepAliveTimeout')
  server.headersTimeout = config.get('headersTimeout')

  return { app: app, server: server }
}

module.exports = initializeApp
