const path = require('path')
const moment = require('moment-timezone')
const handlebars = require('handlebars')
const models = require('../models')
const { logger } = require('../logging')
const fs = require('fs')

const getEmailTemplate = (path) => handlebars.compile(
  fs.readFileSync(path).toString()
)

const downloadAppTemplatePath = path.resolve(__dirname, './emails/downloadMobileApp.html')
const downloadAppTemplate = getEmailTemplate(downloadAppTemplatePath)

async function processDownloadAppEmail (expressApp, audiusLibs) {
  try {
    logger.info(`${new Date()} - processDownloadAppEmail`)

    const mg = expressApp.get('mailgun')
    if (mg === null) {
      logger.error('Mailgun not configured')
      return
    }
    // Get all users who have not signed in mobile and not been sent native mobile email within 2 days
    let now = moment()
    let twoDayAgo = now.clone().subtract(2, 'days').format()

    let emailUsersWalletAddress = await models.UserEvents.findAll({
      attributes: ['walletAddress'],
      where: {
        hasSignedInNativeMobile: false,
        hasSentDownloadAppEmail: false,
        createdAt: {
          [models.Sequelize.Op.lte]: twoDayAgo
        }
      }
    }).map(x => x.walletAddress)

    const emailUsers = await models.User.findAll({
      attributes: ['walletAddress', 'email'],
      where: { walletAddress: emailUsersWalletAddress }
    })

    logger.info(`processDownloadAppEmail - ${emailUsers.length} 2 day old users who have not signed in mobile`)

    for (let userToEmail of emailUsers) {
      let userEmail = userToEmail.email

      let sent = await renderAndSendDownloadAppEmail(
        mg,
        userEmail
      )
      if (sent) {
        await models.UserEvents.upsert({
          walletAddress: userToEmail.walletAddress,
          hasSentDownloadAppEmail: true
        })
      }
    }
  } catch (e) {
    logger.error('Error processing download app email notifications')
    logger.error(e)
  }
}

// Master function to render and send email for a given userId
async function renderAndSendDownloadAppEmail (
  mg,
  userEmail
) {
  try {
    logger.info(`render and send download app email: ${userEmail}`)

    const downloadAppHtml = downloadAppTemplate({})

    const emailParams = {
      from: 'The Audius Team <team@audius.co>',
      to: userEmail,
      bcc: 'forrest@audius.co',
      html: downloadAppHtml,
      subject: 'Audius Is Better On The Go 📱'
    }

    // Send email
    await sendEmail(mg, emailParams)

    return true
  } catch (e) {
    logger.error(`Error in renderAndSendDownloadAppEmail ${e}`)
    return false
  }
}

async function sendEmail (mg, emailParams) {
  return new Promise((resolve, reject) => {
    mg.messages().send(emailParams, (error, body) => {
      if (error) {
        reject(error)
      }
      resolve(body)
    })
  })
}

module.exports = { processDownloadAppEmail }
