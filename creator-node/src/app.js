const express = require('express')
const bodyParser = require('body-parser')
const cors = require('cors')

const { sendResponse, errorResponseServerError } = require('./apiHelpers')
const { logger, loggingMiddleware } = require('./logging')
const { userReqLimiter, trackReqLimiter, audiusUserReqLimiter, metadataReqLimiter, imageReqLimiter } = require('./reqLimiter')
const redisClient = require('./redis')

const app = express()
// middleware functions will be run in order they are added to the app below
//  - loggingMiddleware must be first to ensure proper error handling
app.use(loggingMiddleware)
app.use(bodyParser.json())
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

const initializeApp = (port, storageDir, ipfsAPI, audiusLibs) => {
  app.set('ipfsAPI', ipfsAPI)
  app.set('storagePath', storageDir)
  app.set('redisClient', redisClient)
  app.set('audiusLibs', audiusLibs)

  const server = app.listen(port, () => logger.info(`Listening on port ${port}...`))

  return { app: app, server: server }
}

module.exports = initializeApp
