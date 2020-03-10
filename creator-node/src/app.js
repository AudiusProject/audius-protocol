const express = require('express')
const bodyParser = require('body-parser')
const cors = require('cors')
const responseTime = require('response-time')

const { sendResponse, errorResponseServerError } = require('./apiHelpers')
const { logger, loggingMiddleware } = require('./logging')
const { userNodeMiddleware } = require('./userNodeMiddleware')
const { userReqLimiter, trackReqLimiter, audiusUserReqLimiter, metadataReqLimiter, imageReqLimiter } = require('./reqLimiter')
const redisClient = require('./redis')
const config = require('./config')

const TWENTY_MINUTES = 1000 * 60 * 20 // 1,200,000ms = 20min

const app = express()
// middleware functions will be run in order they are added to the app below
//  - loggingMiddleware must be first to ensure proper error handling
app.use(responseTime())
app.use(loggingMiddleware)
app.use(bodyParser.json({ limit: '1mb' }))
app.use(userNodeMiddleware)
app.use(cors())

// Initialize private IPFS gateway counters
redisClient.set('ipfsGatewayReqs', 0)
redisClient.set('ipfsStandaloneReqs', 0)

// Rate limit routes
app.use('/users/', userReqLimiter)
app.use('/track*', trackReqLimiter)
app.use('/audius_user/', audiusUserReqLimiter)
app.use('/metadata', metadataReqLimiter)
app.use('/image_upload', imageReqLimiter)

// import routes
require('./routes')(app)

function errorHandler (err, req, res, next) {
  req.logger.error('Internal server error')
  req.logger.error(err.stack)
  sendResponse(req, res, errorResponseServerError('Internal server error'))
}
app.use(errorHandler)

const initializeApp = (port, storageDir, ipfsAPI, audiusLibs, blacklistManager, ipfsAPILatest) => {
  app.set('ipfsAPI', ipfsAPI)
  app.set('storagePath', storageDir)
  app.set('redisClient', redisClient)
  app.set('audiusLibs', audiusLibs)
  app.set('blacklistManager', blacklistManager)

  // add latest version of ipfs as app property
  app.set('ipfsLatestAPI', ipfsAPILatest)

  const server = app.listen(port, () => logger.info(`Listening on port ${port}...`))

  // Increase from 2min default to accommodate long-lived requests.
  server.setTimeout(TWENTY_MINUTES)
  server.keepAliveTimeout = config.get('keepAliveTimeout')
  server.headersTimeout = config.get('headersTimeout')

  return { app: app, server: server }
}

module.exports = initializeApp
