const bunyan = require('bunyan')
const shortid = require('shortid')

const config = require('./config')
const logLevel = config.get('logLevel')

const levelNames = {
  10: 'TRACE',
  20: 'DEBUG',
  30: 'INFO',
  40: 'WARN',
  50: 'ERROR',
  60: 'FATAL'
}

const logStream = {
  write: (record) => {
    const logEntry = JSON.parse(record)
    logEntry.level = levelNames[logEntry.level] || logEntry.level
    process.stdout.write(JSON.stringify(logEntry) + '\n')
  }
}

const logger = bunyan.createLogger({
  name: 'audius_identity_service',
  streams: [
    {
      level: logLevel,
      stream: logStream
    }
  ]
})

logger.info('Loglevel set to:', logLevel)

const excludedRoutes = ['/health_check', '/balance_check']
function requestNotExcludedFromLogging(url) {
  return excludedRoutes.indexOf(url) === -1
}

function loggingMiddleware(req, res, next) {
  const providedRequestID = req.header('X-Request-ID')
  const requestID = providedRequestID || shortid.generate()

  const urlParts = req.url.split('?')
  req.startTime = process.hrtime()
  req.logger = logger.child({
    requestID,
    requestMethod: req.method,
    requestHostname: req.hostname,
    requestUrl: urlParts[0],
    requestQueryParams: urlParts.length > 1 ? urlParts[1] : undefined,
    requestIP: req.ip,
    requestXForwardedFor: req.headers['x-forwarded-for']
  })
  if (requestNotExcludedFromLogging(req.originalUrl)) {
    req.logger.debug('Begin processing request')
  }
  next()
}

module.exports = { logger, loggingMiddleware, requestNotExcludedFromLogging }
