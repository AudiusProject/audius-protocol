const config = require('./config')

const { requestNotExcludedFromLogging } = require('./logging')
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
      logger.info('Error processing request:', resp.object.error, '|| Request Body:', req.body, '|| Request Query Params:', req.query)
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
    signer: config.get('delegateOwnerWallet')
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

/**
 * Define custom api error subclasses to be thrown in components and handled in route controllers
 */

class ErrorBadRequest extends Error {}
Object.defineProperty(ErrorBadRequest.prototype, 'name', {
  value: 'ErrorBadRequest'
})
class ErrorServerError extends Error {}
Object.defineProperty(ErrorServerError.prototype, 'name', {
  value: 'ErrorServerError'
})

module.exports.ErrorBadRequest = ErrorBadRequest
module.exports.ErrorServerError = ErrorServerError

/**
 * Given an error instance, returns the corresponding error response to request
 * @param {Error} error instance of error class or subclass
 */
module.exports.handleApiError = (error) => {
  switch (error) {
    case ErrorBadRequest:
      return this.errorResponseBadRequest(error.message)
    case ErrorServerError:
      return this.errorResponseServerError(error.message)
    default:
      return this.errorResponseServerError(error.message)
  }
}

/**
 * Helper function to parse responses from axios requests to other Content Nodes.
 *    Given a response object and required fields, errors if any required fields missing.
 *    Also errors if any signature fields missing.
 *    Unnests response data.data and returns formatted data, along with raw response object.
 *    Uses response schema defined above in successResponse()
 * @param {Object} respObj original response object from axios request to content node
 * @param {string[]} requiredFields
 */
module.exports.parseCNodeResponse = (respObj, requiredFields = []) => {
  if (!respObj.data || !respObj.data.data) {
    throw new Error('Unexpected respObj format')
  }

  requiredFields.map(requiredField => {
    if (!respObj.data.data[requiredField]) {
      throw new Error(`CNodeResponse missing required data field: ${requiredField}`)
    }
  })

  const signatureFields = ['signer', 'timestamp', 'signature']
  signatureFields.map(signatureField => {
    if (!respObj.data[signatureField]) {
      throw new Error(`CNodeResponse missing required signature field: ${signatureField}`)
    }
  })

  return {
    responseData: respObj.data.data,
    signatureData: {
      signer: respObj.data.signer,
      timestamp: respObj.data.timestamp,
      signature: respObj.data.signature
    }
  }
}
