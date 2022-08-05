const { setupTracing } = require('./tracer')
setupTracing('content-node')

const express = require('express')
const bodyParser = require('body-parser')
const cors = require('cors')
const prometheusMiddleware = require('express-prom-bundle')
const _ = require('lodash')

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
const {
  exponentialBucketsRange
} = require('./services/prometheusMonitoring/prometheusUtils')
const healthCheckRoutes = require('./components/healthCheck/healthCheckController')
const contentBlacklistRoutes = require('./components/contentBlacklist/contentBlacklistController')
const replicaSetRoutes = require('./components/replicaSet/replicaSetController')

function errorHandler(err, req, res, next) {
  req.logger.error('Internal server error')
  req.logger.error(err.stack)
  sendResponse(req, res, errorResponseServerError('Internal server error'))
}

/**
 * Get the path, method, and regex used to match to routes. Used to track route durations
 *
 * Structure:
 *  {regex: <some regex>, path: <path that a matched path will route to in the normalize fn in prometheus middleware>}
 *
 * Example:
 * {
 *    regex: /(?:^\/ipfs\/(?:([^/]+?))\/?$|^\/content\/(?:([^/]+?))\/?$)/i,
 *    path: '/ipfs/:CID'
 * }
 * @param {Object[]} routers Array of Express routers
 */
function _setupRouteDurationTracking(routers) {
  let layers = routers.map((route) => route.stack)
  layers = _.flatten(layers)

  const routesWithoutParams = []
  const routesWithParams = []
  for (const layer of layers) {
    const path = layer.route.path
    const method = Object.keys(layer.route.methods)[0]
    const regex = layer.regexp

    if (Array.isArray(path)) {
      path.forEach((p) => {
        if (p.includes(':')) {
          routesWithParams.push({
            path: p,
            method,
            regex
          })
        } else {
          routesWithoutParams.push({
            path: p,
            method,
            regex
          })
        }
      })
    } else {
      if (path.includes(':')) {
        routesWithParams.push({
          path,
          method,
          regex
        })
      } else {
        routesWithoutParams.push({
          path,
          method,
          regex
        })
      }
    }
  }

  return {
    routesWithoutParams,
    routesWithParams,
    routes: [...routesWithParams, ...routesWithoutParams]
  }
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

  // import routes
  let routers = require('./routes')()
  routers = [
    ...routers,
    healthCheckRoutes,
    contentBlacklistRoutes,
    replicaSetRoutes
  ]

  const { routesWithParams, routes } = _setupRouteDurationTracking(routers)

  const prometheusRegistry = serviceRegistry.prometheusRegistry

  // Metric tracking middleware
  app.use(
    routes.map((route) => route.path),
    prometheusMiddleware({
      // Use existing registry for compatibility with custom metrics. Can see
      // the metrics on /prometheus_metrics
      promRegistry: prometheusRegistry.registry,
      // Override metric name to include namespace prefix
      httpDurationMetricName: `${prometheusRegistry.namespacePrefix}_http_request_duration_seconds`,
      // Include HTTP method in duration tracking
      includeMethod: true,
      // Include HTTP status code in duration tracking
      includePath: true,
      // Disable default gauge counter to indicate if this middleware is running
      includeUp: false,
      // The buckets in seconds to measure requests
      buckets: [0.2, 0.5, ...exponentialBucketsRange(1, 60, 4)],
      // Do not register the default /metrics route, since we have the /prometheus_metrics
      autoregister: false,
      // Normalizes the path to be tracked in this middleware. For routes with route params,
      // this fn maps those routes to generic paths. e.g. /ipfs/QmSomeCid -> /ipfs/#CID
      normalizePath: function (req, opts) {
        const path = prometheusMiddleware.normalizePath(req, opts)
        try {
          for (const { regex, path: normalizedPath } of routesWithParams) {
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

  for (const router of routers) {
    app.use('/', router)
  }

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
