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

/**
 * TODO make this more readable
 */
const excludedRoutes = [
  '/health_check',
  '/ipfs',
  'ipfs_peer_info',
  '/tracks/download_status',
  '/db_check',
  '/version',
  '/disk_check',
  '/sync_status'
]
function requestNotExcludedFromLogging (url) {
  return (excludedRoutes.filter(excludedRoute => url.includes(excludedRoute))).length === 0
}

/**
 * @notice request headers are case-insensitive
 */
function getRequestLoggingContext (req, requestID) {
  req.startTime = process.hrtime()
  const urlParts = req.url.split('?')
  return {
    requestID,
    requestMethod: req.method,
    requestHostname: req.hostname,
    requestUrl: urlParts[0],
    requestQueryParams: urlParts.length > 1 ? urlParts[1] : undefined,
    requestWallet: req.get('user-wallet-addr'),
    requestBlockchainUserId: req.get('user-id')
  }
}

function loggingMiddleware (req, res, next) {
  const providedRequestID = req.header('X-Request-ID')
  const requestID = providedRequestID || shortid.generate()
  res.set('CN-Request-ID', requestID)

  req.logContext = getRequestLoggingContext(req, requestID)
  req.logger = logger.child(req.logContext)

  if (requestNotExcludedFromLogging(req.originalUrl)) {
    req.logger.info('Begin processing request')
  }
  next()
}

function setFieldsInChildLogger (req, options = {}) {
  const fields = Object.keys(options)

  const childOptions = {}
  fields.forEach(field => {
    childOptions[field] = options[field]
  })

  return req.logger.child(childOptions)
}

function getDuration (req) {
  let duration
  if (req.startTime) {
    const endTime = process.hrtime(req.startTime)
    duration = Math.round(endTime[0] * 1e3 + endTime[1] * 1e-6)
  }

  return duration
}

function logInfoWithDuration (req, msg) {
  const duration = getDuration(req)

  if (duration) {
    req.logger.info(`${msg} duration=${duration}`)
  } else {
    req.logger.info(msg)
  }
}

module.exports = {
  logger,
  loggingMiddleware,
  requestNotExcludedFromLogging,
  getRequestLoggingContext,
  getDuration,
  setFieldsInChildLogger,
  logInfoWithDuration
}
