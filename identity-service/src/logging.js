const bunyan = require('bunyan')
const shortid = require('shortid')

const config = require('./config')

const logLevel = config.get('logLevel')
const logger = bunyan.createLogger({
  name: 'audius_identity_service',
  streams: [
    {
      level: logLevel,
      stream: process.stdout
    }
  ]
})
logger.info('Loglevel set to:', logLevel)

const excludedRoutes = [ '/health_check', '/balance_check' ]
function requestNotExcludedFromLogging (url) {
  return (excludedRoutes.indexOf(url) === -1)
}

function loggingMiddleware (req, res, next) {
  const requestID = shortid.generate()
  req.logger = logger.child({
    requestID: requestID,
    requestMethod: req.method,
    requestHostname: req.hostname,
    requestUrl: req.url.split('?')[0], // remove query params from request before logging
    requestIP: req.ip
  })
  if (requestNotExcludedFromLogging(req.originalUrl)) {
    req.logger.debug('Begin processing request')
  }
  next()
}

module.exports = { logger, loggingMiddleware, requestNotExcludedFromLogging }
