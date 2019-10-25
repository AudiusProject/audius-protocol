const request = require('request')
const models = require('../models')
const { handleResponse, successResponse, errorResponseBadRequest } = require('../apiHelpers')

module.exports = function (app) {
  /**
   * This signup function writes the encryption values from the user's browser(iv, cipherText, lookupKey)
   * into the Authentications table and the email to the Users table. This is the first step in the
   * authentication process
   */

  app.get('/tmp', handleResponse(async (req, res, next) => {
    let queryParams = req.query
    let reqObj = {
    }
    return successResponse({})
  }))
}

/**
 * TODO: Eliminate this in favor of disc prov libs call
 * Since request is a callback based API, we need to wrap it in a promise to make it async/await compliant
 * @param {Object} reqObj construct request object compatible with `request` module
 */
function doRequest (reqObj) {
  return new Promise(function (resolve, reject) {
    request(reqObj, function (err, r, body) {
      if (err) reject(err)
      else resolve(body)
    })
  })
}

