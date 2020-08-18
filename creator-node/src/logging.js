const bunyan = require('bunyan')
const shortid = require('shortid')

const config = require('./config')

const logLevel = config.get('logLevel') || 'info'
const logger = bunyan.createLogger({
  name: 'audius_creator_node',
  streams: [
    {
      level: logLevel,
      stream: process.stdout
    }
  ]
})
logger.info('Loglevel set to:', logLevel)

const excludedRoutes = [ '/health_check' ]
function requestNotExcludedFromLogging (url) {
  return (excludedRoutes.indexOf(url) === -1)
}

function getRequestLoggingContext (req) {
  const requestID = shortid.generate()
  return {
    requestID: requestID,
    requestMethod: req.method,
    requestHostname: req.hostname,
    requestUrl: req.originalUrl,
    requestWallet: req.get('user-wallet-addr'),
    requestBlockchainUserId: req.get('user-id')
  }
}

function loggingMiddleware (req, res, next) {
  const requestID = shortid.generate()
  res.set('CN-Request-ID', requestID)

  req.logContext = getRequestLoggingContext(req)
  req.logger = logger.child(req.logContext)

  res.on('finish', function () {
    // header is set by response-time npm module, but it's only set
    // when you're about to write headers, so that's why this is in
    // finish event
    req.logger.info('Request Duration', res.get('X-Response-Time'))
  })

  if (requestNotExcludedFromLogging(req.originalUrl)) {
    req.logger.debug('Begin processing request')
  }
  next()
}

module.exports = { logger, loggingMiddleware, requestNotExcludedFromLogging, getRequestLoggingContext }
