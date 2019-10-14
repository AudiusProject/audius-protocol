const { handleResponse, successResponse, errorResponseBadRequest } = require('../apiHelpers')
const config = require('../config.js')
const mailgun = require('mailgun-js')

function validateEmail (email) {
  const re = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
  return re.test(String(email).toLowerCase())
}

module.exports = function (app) {
  /**
   * Send recovery information to the requested account
   */
  app.post('/recovery', handleResponse(async (req, res, next) => {
    let mg = req.app.get('mg')
    if (!mg) {
      req.logger.error('Missing api key') 
      // Short-circuit if no api key provided, but do not error
      return successResponse({ msg: 'No mailgun API Key found', status: true })
    }

    let { email, recoveryLink } = req.body

    if (!email || !validateEmail(email)) {
      return errorResponseBadRequest('Please provide valid email')
    }

    if (!recoveryLink) {
      return errorResponseBadRequest('Please provide a recoveryLink')
    }

    const data = {
      from: 'Audius Recovery <postmaster@mail.audius.co>',
      to: email,
      subject: 'IMPORTANT: RECOVERY INFORMATION',
      text: `${recoveryLink}`
    }
    await new Promise((resolve, reject) => {
      mg.messages().send(data, function (error, body) {
        if (error) {
          reject(error)
        }
        console.log(body)
        resolve(body)
      })
    })
    return successResponse({ status: true })
  }))
}
