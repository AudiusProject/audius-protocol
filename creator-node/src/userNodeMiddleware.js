const axios = require('axios')

const { sendResponse, errorResponseUnauthorized, errorResponseServerError } = require('./apiHelpers')
const config = require('./config')

async function userNodeMiddleware (req, res, next) {
  let isUserMetadataNode = config.get('isUserMetadataNode')
  let userNodeRegex = new RegExp(/(users|version|health_check|image_upload|ipfs|export)/gm)
  if (isUserMetadataNode) {
    let isValidUrl = userNodeRegex.test(req.url)
    if (!isValidUrl) {
      return sendResponse(req, res, errorResponseUnauthorized('Invalid route for user metadata node'))
    }
    next()
  } else {
    next()
  }
}

module.exports = { userNodeMiddleware }
