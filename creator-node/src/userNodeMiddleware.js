const { sendResponse, errorResponseUnauthorized } = require('./apiHelpers')
const config = require('./config')

async function userNodeMiddleware (req, res, next) {
  // Disable all UM specific filtering
  return next()
}

module.exports = { userNodeMiddleware }
