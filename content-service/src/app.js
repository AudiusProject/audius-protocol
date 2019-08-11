const express = require('express')
const bodyParser = require('body-parser')
const cors = require('cors')

const { sendResponse, errorResponseServerError } = require('./apiHelpers')
const { logger, loggingMiddleware } = require('./logging')

const app = express()
// middleware functions will be run in order they are added to the app below
//  - loggingMiddleware must be first to ensure proper error handling
app.use(loggingMiddleware)
app.use(bodyParser.json())
app.use(cors())

// import routes
require('./routes')(app)

function errorHandler (err, req, res, next) {
  req.logger.error('Internal server error')
  req.logger.error(err.stack)
  sendResponse(req, res, errorResponseServerError('Internal server error'))
}
app.use(errorHandler)

const initializeApp = (port, ipfsAPI) => {
  app.set('ipfsAPI', ipfsAPI)

  const server = app.listen(port, () => logger.info(`Listening on port ${port}...`))

  return { app: app, server: server }
}

module.exports = initializeApp
