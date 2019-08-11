const { handleResponse, successResponse, errorResponseBadRequest } = require('../apiHelpers')
const models = require('../models')

function validateEmail (email) {
  const re = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
  return re.test(String(email).toLowerCase())
}

module.exports = function (app) {
  /**
   * given a valid email, will add email to waitlist table
   */
  app.post('/waitlist', handleResponse(async (req, res, next) => {
    let { email } = req.body

    if (!email || !validateEmail(email)) {
      return errorResponseBadRequest('Please provide valid email')
    }
    await models.Waitlist.findOrCreate({ where: { email } })
    return successResponse({ status: true })
  }))
}
