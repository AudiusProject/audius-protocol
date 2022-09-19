const bunyan = require('bunyan')
const shortid = require('shortid')

const config = require('./config')
const { tracing } = require('./tracer')

// taken from: https://github.com/trentm/node-bunyan/issues/194#issuecomment-347801909
// since there is no official support for string-based "level" values
// response from author: https://github.com/trentm/node-bunyan/issues/194#issuecomment-70397668
function RawStdOutWithLevelName() {
  return {
    write: (log) => {
      // duplicate log object before sending to stdout
      const clonedLog = { ...log }

      // add new level (string) to level key
      clonedLog.logLevel = bunyan.nameFromLevel[clonedLog.level]

      // stringify() uses the safeCycles() replacer, which returns '[Circular]'
      // when circular references are detected
      // related code: https://github.com/trentm/node-bunyan/blob/0ff1ae29cc9e028c6c11cd6b60e3b90217b66a10/lib/bunyan.js#L1155-L1200
      const logLine = JSON.stringify(clonedLog, bunyan.safeCycles()) + '\n'
      process.stdout.write(logLine)
    }
  }
}

function tracerMixin(klass) {
  const origFunc = klass.prototype.createLogger
  const childProto = klass.prototype.child
  klass.prototype.createLogger = function () {
    const theLogger = origFunc.apply(this, arguments)
    const logDebug = klass.prototype.debug
    const logInfo = klass.prototype.info
    const logWarn = klass.prototype.warn
    const logError = klass.prototype.error
    theLogger.debug = function () {
      tracing.debug(...arguments)
      logDebug.apply(theLogger, arguments)
    }
    theLogger.info = function () {
      tracing.info(...arguments)
      logInfo.apply(theLogger, arguments)
    }
    theLogger.warn = function () {
      tracing.warn(...arguments)
      logWarn.apply(theLogger, arguments)
    }
    theLogger.error = function () {
      tracing.error(...arguments)
      logError.apply(theLogger, arguments)
    }

    return theLogger
  }
  klass.prototype.child = function (options) {
    const childLogger = childProto.apply(this, options)
    const logDebug = bunyan.prototype.debug
    const logInfo = bunyan.prototype.info
    const logWarn = bunyan.prototype.warn
    const logError = bunyan.prototype.error
    childLogger.debug = function () {
      tracing.debug(...arguments)
      logDebug.apply(childLogger, arguments)
    }
    childLogger.info = function () {
      tracing.info(...arguments)
      logInfo.apply(childLogger, arguments)
    }
    childLogger.warn = function () {
      tracing.warn(...arguments)
      logWarn.apply(childLogger, arguments)
    }
    childLogger.error = function () {
      tracing.error(...arguments)
      logError.apply(childLogger, arguments)
    }

    return childLogger
  }
}

tracerMixin(bunyan)
const logLevel = config.get('logLevel') || 'info'
const logger = bunyan.createLogger({
  name: 'audius_creator_node',
  streams: [
    {
      level: logLevel,
      stream: RawStdOutWithLevelName(),
      type: 'raw'
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
  '/content',
  '/tracks/download_status',
  '/db_check',
  '/version',
  '/disk_check',
  '/sync_status'
]
function requestNotExcludedFromLogging(url) {
  return (
    excludedRoutes.filter((excludedRoute) => url.includes(excludedRoute))
      .length === 0
  )
}

/**
 * @notice request headers are case-insensitive
 */
function getRequestLoggingContext(req, requestID) {
  req.startTime = getStartTime()
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

/**
 * Gets the start time
 * @returns the start time
 */
function getStartTime() {
  return process.hrtime()
}

function loggingMiddleware(req, res, next) {
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

/**
 * Creates and returns a child logger for provided logger
 * @param {Object} logger bunyan parent logger instance
 * @param {Object} options optional object to define child logger properties. adds to JSON fields, allowing for better log filtering/querying
 * @returns {Object} child logger instance with defined options
 */
function createChildLogger(logger, options = {}) {
  return logger.child(options)
}

/**
 * Pulls the start time of the req object to calculate the duration of the fn
 * @param {number} startTime the start time
 * @returns the duration of the fn call in ms
 */
function getDuration({ startTime }) {
  let durationMs
  if (startTime) {
    const endTime = process.hrtime(startTime)
    durationMs = Math.round(endTime[0] * 1e3 + endTime[1] * 1e-6)
  }

  return durationMs
}

/**
 * Prints the log message with the duration
 * @param {Object} logger
 * @param {number} startTime the start time
 * @param {string} msg the message to print
 */
function logInfoWithDuration({ logger, startTime }, msg) {
  const durationMs = getDuration({ startTime })

  if (durationMs) {
    logger.info({ duration: durationMs }, msg)
  } else {
    logger.info(msg)
  }
}

/**
 * Prints the log message with the duration
 * @param {Object} logger
 * @param {number} startTime the start time
 * @param {string} msg the message to print
 */
function logErrorWithDuration({ logger, startTime }, msg) {
  const durationMs = getDuration({ startTime })

  if (durationMs) {
    logger.error({ duration: durationMs }, msg)
  } else {
    logger.error(msg)
  }
}

module.exports = {
  logger,
  loggingMiddleware,
  requestNotExcludedFromLogging,
  getRequestLoggingContext,
  getStartTime,
  getDuration,
  createChildLogger,
  logInfoWithDuration,
  logErrorWithDuration
}
