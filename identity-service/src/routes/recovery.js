const { handleResponse, successResponse, errorResponseBadRequest, errorResponseServerError } = require('../apiHelpers')
const { recoverPersonalSignature } = require('eth-sig-util')
const models = require('../models')
const handlebars = require('handlebars')
const fs = require('fs')
const path = require('path')
const config = require('../config.js')

const WEBSITE_HOST = config.get('websiteHost')

const recoveryTemplate = handlebars.compile(
  fs
    .readFileSync(path.resolve(__dirname, '../notifications/emails/recovery.html'))
    .toString()
)

const toQueryStr = (obj) => {
  return '?' +
    Object.keys(obj).map((key) => {
      return key + '=' + encodeURIComponent(obj[key])
    }).join('&')
}

module.exports = function (app) {
  /**
   * Send recovery information to the requested account
   */
  app.post('/recovery', handleResponse(async (req, res, next) => {
    let sg = req.app.get('sendgrid')
    if (!sg) {
      req.logger.error('Missing sendgrid api key')
      // Short-circuit if no api key provided, but do not error
      return successResponse({ msg: 'No sendgrid API Key found', status: true })
    }

    let { login, data, signature, handle } = req.body

    if (!login) {
      return errorResponseBadRequest('Please provide valid login information')
    }
    if (!data || !signature) {
      return errorResponseBadRequest('Please provide data and signature')
    }
    if (!handle) {
      return errorResponseBadRequest('Please provide a handle')
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
    if (!existingUser.isEmailDeliverable) {
      req.logger.info(`Unable to deliver recovery email to ${existingUser.handle} ${existingUser.email}`)
      return successResponse({ msg: 'Recovery email forbidden', status: true })
    }

    const email = existingUser.email
    const recoveryParams = {
      warning: 'RECOVERY_DO_NOT_SHARE',
      login: login,
      email: email
    }
    const recoveryLink = WEBSITE_HOST + toQueryStr(recoveryParams)
    const copyrightYear = new Date().getFullYear().toString()
    const context = {
      recovery_link: recoveryLink,
      handle: handle,
      copyright_year: copyrightYear
    }
    const recoveryHtml = recoveryTemplate(context)

    const emailParams = {
      from: 'Audius Recovery <recovery@audius.co>',
      to: `${email}`,
      subject: 'Save This Email: Audius Password Recovery',
      html: recoveryHtml
    }
    try {
      await sg.send(emailParams)
      await models.UserEvents.update(
        { needsRecoveryEmail: false },
        {
          where: {
            walletAddress: walletFromSignature
          }
        }
      )
      return successResponse({ status: true })
    } catch (e) {
      return errorResponseServerError(e)
    }
  }))
}
