const { sendResponse, errorResponseServerError } = require('../../apiHelpers')
const config = require('../../config')

const exclusionsRegex = new RegExp(/(vector_clock)/)
/**
 * Middleware to block all non-GET api calls if the server should be in "read-only" mode
 */
function readOnlyMiddleware (req, res, next) {
  const isReadOnlyMode = config.get('isReadOnlyMode')
  const method = req.method
  const url = req.url
  const canProceed = readOnlyMiddlewareHelper(isReadOnlyMode, method, url)

  if (!canProceed) return sendResponse(req, res, errorResponseServerError('Server is in read-only mode at the moment'))
  next()
}

/**
 * @param {Boolean} isReadOnlyMode From config.get('isReadOnlyMode')
 * @param {String} method REST method for this request eg. POST, GET
 * @returns {Boolean} returns true if the request can proceed. eg GET in read only or any request in non read-only mode
 */
function readOnlyMiddlewareHelper (isReadOnlyMode, method, url) {
  // is an excluded route...let it pass through
  if (exclusionsRegex.test(url)) {
    return true
  }

  if (isReadOnlyMode && method !== 'GET' && method !== 'HEAD') {
    return false
  }

  return true
}

module.exports = { readOnlyMiddleware, readOnlyMiddlewareHelper }
