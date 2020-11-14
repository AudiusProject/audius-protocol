const config = require('./config')

const { requestNotExcludedFromLogging } = require('./logging')
const versionInfo = require('../.version.json')
const { generateTimestampAndSignature } = require('./apiSigning')

module.exports.handleResponse = (func) => {
  return async function (req, res, next) {
    try {
      const resp = await func(req, res, next)

      if (!isValidResponse(resp)) {
        throw new Error('Invalid response returned by function')
      }

      sendResponse(req, res, resp)
      next()
    } catch (error) {
      console.error('HandleResponse', error)
      next(error)
    }
  }
}

/**
 * Like `handleResponse` but on an interval sends a heartbeat back through
 * `res.write` as a piece of the JSON result
 * @param {() => void} func returns the response JSON
 */
module.exports.handleResponseWithHeartbeat = (func) => {
  return async function (req, res, next) {
    try {
      // First declare our content type since we will be sending heartbeats back
      // in JSON
      res.set('Content-Type', 'application/json; charset=utf-8')

      // set custom CORS headers that's required if you want to response
      // headers through axios
      // what is this for?
      res.set('Access-Control-Expose-Headers', 'CN-Request-ID')

      // Write a key for the heartbeat
      res.write('{"_h":"')

      // Fire up an interval that will append a single char to the res
      const heartbeatInterval = setInterval(() => {
        if (!res.finished) {
          res.write('1')
        }
      }, 5000)

      // Await the work of the endpoint
      const resp = await func(req, res, next)

      clearInterval(heartbeatInterval)

      sendResponseWithHeartbeatTerminator(req, res, resp)
      next()
    } catch (error) {
      sendResponseWithHeartbeatTerminator(
        req,
        res,
        errorResponse(500, error)
      )
    }
  }
}

const sendResponse = module.exports.sendResponse = (req, res, resp) => {
  const endTime = process.hrtime(req.startTime)
  const duration = Math.round(endTime[0] * 1e3 + endTime[1] * 1e-6)
  let logger = req.logger.child({
    statusCode: resp.statusCode,
    duration
  })
  if (resp.statusCode === 200) {
    if (requestNotExcludedFromLogging(req.originalUrl)) {
      logger.info('Success')
    }
  } else {
    logger = logger.child({
      errorMessage: resp.object.error
    })
    if (req && req.body) {
      logger.info('Error processing request:', resp.object.error, '|| Request Body:', req.body)
    } else {
      logger.info('Error processing request:', resp.object.error)
    }
  }

  // set custom CORS headers that's required if you want to response
  // headers through axios
  res.set('Access-Control-Expose-Headers', 'CN-Request-ID')

  res.status(resp.statusCode).send(resp.object)
}

const sendResponseWithHeartbeatTerminator =
  module.exports.sendResponseWithHeartbeatTerminator = (req, res, resp) => {
    const endTime = process.hrtime(req.startTime)
    const duration = Math.round(endTime[0] * 1e3 + endTime[1] * 1e-6)
    let logger = req.logger.child({
      statusCode: resp.statusCode,
      duration
    })
    if (resp.statusCode === 200) {
      if (requestNotExcludedFromLogging(req.originalUrl)) {
        logger.info('Success')
      }
    } else {
      logger = logger.child({
        errorMessage: resp.object.error
      })
      if (req && req.body) {
        logger.info('Error processing request:', resp.object.error, '|| Request Body:', req.body)
      } else {
        logger.info('Error processing request:', resp.object.error)
      }
    }

    // Construct the remainder of the JSON response
    let response = '",'
    // Replace the first '{' since we already have that
    response += JSON.stringify(resp.object).replace('{', '')

    // Terminate the response
    res.end(response)
  }

const isValidResponse = module.exports.isValidResponse = (resp) => {
  if (!resp || !resp.statusCode || !resp.object) {
    return false
  }

  return true
}

module.exports.successResponse = (obj = {}) => {
  const toSignData = {
    data: {
      ...obj
    },
    // TODO: remove duplication of obj -- kept for backwards compatibility
    ...obj,
    signer: config.get('delegateOwnerWallet'),
    ...versionInfo
  }

  const { timestamp, signature } = generateTimestampAndSignature(toSignData, config.get('delegatePrivateKey'))

  return {
    statusCode: 200,
    object: {
      ...toSignData,
      timestamp,
      signature
    }
  }
}

const errorResponse = module.exports.errorResponse = (statusCode, message) => {
  return {
    statusCode: statusCode,
    object: { error: message }
  }
}

module.exports.errorResponseUnauthorized = (message) => {
  return errorResponse(401, message)
}

module.exports.errorResponseForbidden = (message) => {
  return errorResponse(403, message)
}

module.exports.errorResponseBadRequest = (message) => {
  return errorResponse(400, message)
}

module.exports.errorResponseRangeNotSatisfiable = (message) => {
  return errorResponse(416, message)
}

module.exports.errorResponseServerError = (message) => {
  return errorResponse(500, message)
}

module.exports.errorResponseNotFound = (message) => {
  return errorResponse(404, message)
}

module.exports.errorResponseSocketTimeout = (socketTimeout) => {
  return errorResponse(500, `${socketTimeout} socket timeout exceeded for request`)
}
