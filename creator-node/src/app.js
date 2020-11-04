const start = Date.now()

const express = require('express')
const bodyParser = require('body-parser')
const cors = require('cors')

console.log('startup profiling - app.js - about to start requires')
const { sendResponse, errorResponseServerError } = require('./apiHelpers')
console.log('startup profiling - app.js - required apiHelpers', Math.floor((Date.now() - start) / 1000))
const { logger, loggingMiddleware } = require('./logging')
console.log('startup profiling - app.js - required logging', Math.floor((Date.now() - start) / 1000))
const { userNodeMiddleware } = require('./userNodeMiddleware')
console.log('startup profiling - app.js - required userNodeMiddleware', Math.floor((Date.now() - start) / 1000))
const { readOnlyMiddleware } = require('./middlewares/readOnly/readOnlyMiddleware')
console.log('startup profiling - app.js - required readOnlyMiddleware', Math.floor((Date.now() - start) / 1000))
const {
  userReqLimiter,
  trackReqLimiter,
  audiusUserReqLimiter,
  metadataReqLimiter,
  imageReqLimiter,
  rateLimiterMiddleware
} = require('./reqLimiter')
console.log('startup profiling - app.js - required reqLimiter', Math.floor((Date.now() - start) / 1000))
const config = require('./config')
console.log('startup profiling - app.js - required config', Math.floor((Date.now() - start) / 1000))
const healthCheckRoutes = require('./components/healthCheck/healthCheckController')
console.log('startup profiling - app.js - required healthCheckController', Math.floor((Date.now() - start) / 1000))
const contentBlacklistRoutes = require('./components/contentBlacklist/contentBlacklistController')
console.log('startup profiling - app.js - required contentBlacklistController', Math.floor((Date.now() - start) / 1000))

console.log('startup profiling - app.js - finished requires')

const app = express()
// middleware functions will be run in order they are added to the app below
//  - loggingMiddleware must be first to ensure proper error handling
app.use(loggingMiddleware)
app.use(bodyParser.json({ limit: '1mb' }))
app.use(userNodeMiddleware)
app.use(readOnlyMiddleware)
app.use(cors())

// Rate limit routes
app.use('/users/', userReqLimiter)
app.use('/track*', trackReqLimiter)
app.use('/audius_user/', audiusUserReqLimiter)
app.use('/metadata', metadataReqLimiter)
app.use('/image_upload', imageReqLimiter)
app.use('/', rateLimiterMiddleware)

// import routes
require('./routes')(app)
app.use('/', healthCheckRoutes)
app.use('/', contentBlacklistRoutes)

function errorHandler (err, req, res, next) {
  req.logger.error('Internal server error')
  req.logger.error(err.stack)
  sendResponse(req, res, errorResponseServerError('Internal server error'))
}
app.use(errorHandler)

const initializeApp = (port, storageDir, serviceRegistry) => {
  // TODO: Can remove these when all routes
  // consume serviceRegistry
  app.set('ipfsAPI', serviceRegistry.ipfs)
  app.set('storagePath', storageDir)
  app.set('redisClient', serviceRegistry.redis)
  app.set('audiusLibs', serviceRegistry.libs)
  app.set('blacklistManager', serviceRegistry.blacklistManager)

  // add a newer version of ipfs as app property
  app.set('ipfsLatestAPI', serviceRegistry.ipfsLatest)

  // https://expressjs.com/en/guide/behind-proxies.html
  app.set('trust proxy', true)

  const server = app.listen(port, () => logger.info(`Listening on port ${port}...`))

  // Increase from 2min default to accommodate long-lived requests.
  server.setTimeout(config.get('setTimeout'))
  server.timeout = config.get('timeout')
  server.keepAliveTimeout = config.get('keepAliveTimeout')
  server.headersTimeout = config.get('headersTimeout')

  return { app: app, server: server }
}

module.exports = initializeApp
