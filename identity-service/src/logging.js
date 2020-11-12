const bunyan = require('bunyan')
const { nanoid } = require('nanoid')

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

// ? why dont we use a set here instead
const excludedRoutes = [ '/health_check', '/balance_check' ]
function requestNotExcludedFromLogging (url) {
  return (excludedRoutes.indexOf(url) === -1)
}

function loggingMiddleware (req, res, next) {
  // Generate requestID, and then pass to response
  const requestID = req.get('request-ID') || nanoid()
  res.set('request-ID', requestID)

  const urlParts = req.url.split('?')
  req.startTime = process.hrtime()
  req.logger = logger.child({
    requestID: requestID,
    requestMethod: req.method,
    requestHostname: req.hostname,
    requestUrl: urlParts[0],
    requestQueryParams: urlParts.length > 1 ? urlParts[1] : undefined,
    requestIP: req.ip
  })
  if (requestNotExcludedFromLogging(req.originalUrl)) {
    req.logger.debug('Begin processing request')
  }
  next()
}

module.exports = { logger, loggingMiddleware, requestNotExcludedFromLogging }
