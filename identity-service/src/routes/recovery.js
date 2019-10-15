const { handleResponse, successResponse, errorResponseBadRequest } = require('../apiHelpers')
const { recoverPersonalSignature } = require('eth-sig-util')
const models = require('../models')

const toQueryStr = (obj) => {
  return '?' +
    Object.keys(obj).map((key) => {
      return key + '=' + obj[key]
    }).join('&')
}

module.exports = function (app) {
  /**
   * Send recovery information to the requested account
   */
  app.post('/recovery', handleResponse(async (req, res, next) => {
    let mg = req.app.get('mailgun')
    if (!mg) {
      req.logger.error('Missing api key')
      // Short-circuit if no api key provided, but do not error
      return successResponse({ msg: 'No mailgun API Key found', status: true })
    }

    let { host, login, data, signature } = req.body

    if (!login) {
      return errorResponseBadRequest('Please provide valid login information')
    }
    if (!host) {
      return errorResponseBadRequest('Please provide valid host')
    }
    if (!data || !signature) {
      return errorResponseBadRequest('Please provide data and signature')
    }

    let walletFromSignature = recoverPersonalSignature({ data: data, sig: signature })
    const existingUser = await models.User.findOne({
      where: {
        walletAddress: walletFromSignature
      }
    })

    if (!existingUser) {
      return errorResponseBadRequest('Invalid signature provided, no user found')
    }

    const email = existingUser.email
    let recoveryParams = {
      warning: 'RECOVERY_DO_NOT_SHARE',
      login: login,
      email: email
    }
    let recoveryLink = host + toQueryStr(recoveryParams)

    const emailParams = {
      from: 'Audius Recovery <postmaster@mail.audius.co>',
      to: email,
      subject: 'IMPORTANT: RECOVERY INFORMATION',
      text: `${recoveryLink}`
    }
    await new Promise((resolve, reject) => {
      mg.messages().send(emailParams, function (error, body) {
        if (error) {
          reject(error)
        }
        resolve(body)
      })
    })
    return successResponse({ status: true })
  }))
}
