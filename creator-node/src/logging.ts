import type { Request, Response, NextFunction } from 'express'
import type { WriteFn, Stream } from 'bunyan'
import type { CustomRequest } from './utils'
import bunyan, { createLogger, nameFromLevel, safeCycles } from 'bunyan'
import shortid from 'shortid'
import config from './config'

// taken from: https://github.com/trentm/node-bunyan/issues/194#issuecomment-347801909
// since there is no official support for string-based "level" values
// response from author: https://github.com/trentm/node-bunyan/issues/194#issuecomment-70397668
function RawStdOutWithLevelName(): WriteFn {
  return {
    write: (log: Stream) => {
      // duplicate log object before sending to stdout
      const clonedLog = { ...log, logLevel: 'info' }

      // add new level (string) to level key
      clonedLog.logLevel = nameFromLevel[clonedLog.level as number]

      // stringify() uses the safeCycles() replacer, which returns '[Circular]'
      // when circular references are detected
      // related code: https://github.com/trentm/node-bunyan/blob/0ff1ae29cc9e028c6c11cd6b60e3b90217b66a10/lib/bunyan.js#L1155-L1200
      const logLine = JSON.stringify(clonedLog, safeCycles()) + '\n'
      process.stdout.write(logLine)
    }
  }
}

const logLevel = config.get('logLevel') || 'info'
export const logger = createLogger({
  name: 'audius_creator_node',
  streams: [
    {
      level: logLevel,
      stream: RawStdOutWithLevelName(),
      type: 'raw'
    }
  ]
})

/**
 * TODO make this more readable
 */
const excludedRoutes = [
  '/health_check',
  '/ipfs',
  '/content',
  '/db_check',
  '/version',
  '/disk_check',
  '/sync_status'
]
export function requestNotExcludedFromLogging(url: string) {
  return (
    excludedRoutes.filter((excludedRoute) => url.includes(excludedRoute))
      .length === 0
  )
}

/**
 * @notice request headers are case-insensitive
 */
export function getRequestLoggingContext(request: Request, requestID: string) {
  const req = request as CustomRequest
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
export function getStartTime() {
  return process.hrtime()
}

export function loggingMiddleware(
  request: Request,
  res: Response,
  next: NextFunction
) {
  const req = request as CustomRequest
  const providedRequestID = req.header('X-Request-ID')
  const requestID = providedRequestID || shortid.generate()
  res.set('CN-Request-ID', requestID)

  req.logContext = getRequestLoggingContext(req, requestID)
  req.logger = logger.child(req.logContext)

  if (requestNotExcludedFromLogging(req.originalUrl)) {
    req.logger.debug('Begin processing request')
  }
  next()
}

/**
 * Creates and returns a child logger for provided logger
 * @param {bunyan} logger bunyan parent logger instance
 * @param {Object} options optional object to define child logger properties. adds to JSON fields, allowing for better log filtering/querying
 * @returns {Object} child logger instance with defined options
 */
export function createChildLogger(logger: bunyan, options = {}) {
  return logger.child(options)
}

/**
 * Pulls the start time of the req object to calculate the duration of the fn
 * @param {Object} param
 * @param {number} param.startTime the start time
 * @returns the duration of the fn call in ms
 */
export function getDuration({ startTime }: { startTime: [number, number] }) {
  let durationMs
  if (startTime) {
    const endTime = process.hrtime(startTime)
    durationMs = Math.round(endTime[0] * 1e3 + endTime[1] * 1e-6)
  }

  return durationMs
}

/**
 * Prints the debug message with the duration
 * @param {Object} logger
 * @param {number} startTime the start time
 * @param {string} msg the message to print
 */
export function logDebugWithDuration(
  {
    logger,
    startTime
  }: {
    logger: bunyan
    startTime: [number, number]
  },
  msg: string,
  durationKey = 'duration'
) {
  const durationMs = getDuration({ startTime })

  if (durationMs) {
    logger.debug({ [durationKey]: durationMs }, msg)
  } else {
    logger.debug(msg)
  }
}

/**
 * Prints the log message with the duration
 * @param {Object} logger
 * @param {number} startTime the start time
 * @param {string} msg the message to print
 */
export function logInfoWithDuration(
  {
    logger,
    startTime
  }: {
    logger: bunyan
    startTime: [number, number]
  },
  msg: string,
  durationKey = 'duration'
) {
  const durationMs = getDuration({ startTime })

  if (durationMs) {
    logger.info({ [durationKey]: durationMs }, msg)
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
export function logErrorWithDuration(
  {
    logger,
    startTime
  }: {
    logger: bunyan
    startTime: [number, number]
  },
  msg: string
) {
  const durationMs = getDuration({ startTime })

  if (durationMs) {
    logger.error({ duration: durationMs }, msg)
  } else {
    logger.error(msg)
  }
}
