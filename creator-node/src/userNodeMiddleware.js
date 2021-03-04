const { sendResponse, errorResponseUnauthorized } = require('./apiHelpers')
const config = require('./config')

async function userNodeMiddleware (req, res, next) {
  next()

  const isUserMetadataNode = config.get('isUserMetadataNode')
  const userNodeRegex = new RegExp(/(users|version|db_check|health_check|image_upload|ipfs|export)/gm)
  if (isUserMetadataNode) {
    const isValidUrl = userNodeRegex.test(req.url)
    if (!isValidUrl) {
      return sendResponse(req, res, errorResponseUnauthorized('Invalid route for user metadata node'))
    }
    next()
  } else {
    next()
  }
}

module.exports = { userNodeMiddleware }
