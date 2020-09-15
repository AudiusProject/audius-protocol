const { sendResponse, errorResponseServerError } = require('../apiHelpers')
const config = require('../config')

async function readOnlyMiddleware (req, res, next) {
  const isReadOnlyMode = config.get('isReadOnlyMode')
  if (isReadOnlyMode) {
    if (req.method !== 'GET') {
      return sendResponse(req, res, errorResponseServerError('Server is in read-only mode at the moment'))
    }
    next()
  } else {
    next()
  }
}

module.exports = { readOnlyMiddleware }
