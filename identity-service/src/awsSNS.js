const config = require('./config')
const models = require('./models')
const { logger } = require('./logging')

const accessKeyId = config.get('awsAccessKeyId')
const secretAccessKey = config.get('awsSecretAccessKey')

// AWS SNS init
const AWS = require('aws-sdk')
const sns = new AWS.SNS({
  accessKeyId,
  secretAccessKey,
  region: 'us-west-1'
})

// TODO (DM) - move this into redis
let PUSH_NOTIFICATIONS_BUFFER = []

let PUSH_ANNOUNCEMENTS_BUFFER = []

// the aws sdk doesn't like when you set the function equal to a variable and try to call it
// eg. const func = sns.<functionname>; func() returns an error, so util.promisify doesn't work
function _promisifySNS (functionName) {
  return function (...args) {
    return new Promise(function (resolve, reject) {
      if (!accessKeyId || !secretAccessKey) {
        reject(new Error('Missing SNS config'))
      }
      sns[functionName](...args, function (err, data) {
        if (err) reject(err)
        else resolve(data)
      })
    })
  }
}

/**
 * Formats a push notification in a way that's compatible with SNS
 * @param {String} title title of push notification
 * @param {String} body body of push notification
 * @param {String} targetARN aws arn address for device
 *                           `arn:aws:sns:us-west-1:<id>:endpoint/APNS/<namespace>/<uuid>`
 * @param {Boolean=True} playSound should play a sound when it's sent
 */
function _formatIOSMessage (message, targetARN, playSound = true, title = null) {
  let type = null
  if (targetARN.includes('APNS_SANDBOX')) type = 'APNS_SANDBOX'
  else if (targetARN.includes('APNS')) type = 'APNS'

  const jsonMessage = {
    'default': 'You have new notifications in Audius!'
  }

  // set iphone specific properties here
  if (type) {
    let apnsConfig = {
      'aps': {
        'alert': `${message}`,
        'sound': playSound && 'default'
        // TODO: Enable title/body for iOS, makes a much better notification
        // keeping these properties here so we can use them if we want to
        // "alert": {
        //   "title" : `${title}`,
        //   "body" : `${body}`
        // },
        // "badge": 19
      }
    }

    if (title) {
      apnsConfig['aps']['alert'] = {
        'title': `${title}`,
        'body': `${message}`
      }
    }

    jsonMessage[type] = JSON.stringify(apnsConfig)
  }

  var params = {
    Message: JSON.stringify(jsonMessage), /* required */
    MessageStructure: 'json',
    TargetArn: targetARN
  }

  return params
}

const listEndpointsByPlatformApplication = _promisifySNS('listEndpointsByPlatformApplication')
const createPlatformEndpoint = _promisifySNS('createPlatformEndpoint')
const publishPromisified = _promisifySNS('publish')
const deleteEndpoint = _promisifySNS('deleteEndpoint')

async function publish (message, userId, tx, playSound = true) {
  bufferMessages(message, userId, tx, PUSH_NOTIFICATIONS_BUFFER, playSound)
}

async function publishAnnouncement (message, userId, tx, playSound = true, title = null) {
  bufferMessages(message, userId, tx, PUSH_ANNOUNCEMENTS_BUFFER, playSound, title)
}

async function bufferMessages (message, userId, tx, buffer, playSound, title) {
  const deviceInfo = await models.NotificationDeviceToken.findOne({ where: { userId }, transaction: tx })
  if (!deviceInfo) return

  let formattedMessage = null
  if (deviceInfo.deviceType === 'ios') {
    formattedMessage = _formatIOSMessage(message, deviceInfo.awsARN, playSound, title)
  }

  if (formattedMessage) {
    logger.debug('AWS SNS formattedMessage', formattedMessage)
    const bufferObj = {
      metadata: { userId, deviceToken: deviceInfo.deviceToken },
      notification: formattedMessage
    }
    buffer.push(bufferObj)
  } else return null
}

// Actually send the messages from the buffer to SNS
// If a device token is invalid attempt to remove it
//
// DON'T throw errors in this function because it stops execution,
// we want it to continue
async function drainPublishedMessages () {
  for (let bufferObj of PUSH_NOTIFICATIONS_BUFFER) {
    await drainMessageObject(bufferObj)
  }

  PUSH_NOTIFICATIONS_BUFFER = []
}

async function drainPublishedAnnouncements () {
  for (let bufferObj of PUSH_ANNOUNCEMENTS_BUFFER) {
    await drainMessageObject(bufferObj)
  }

  PUSH_ANNOUNCEMENTS_BUFFER = []
}

async function drainMessageObject (bufferObj) {
  try {
    const { notification } = bufferObj
    await publishPromisified(notification)
  } catch (e) {
    if (e && e.code && (e.code === 'EndpointDisabled' || e.code === 'InvalidParameter')) {
      try {
        const { deviceToken, userId } = bufferObj.metadata
        // this notification is not deliverable to this device
        // remove from deviceTokens table and de-register from AWS
        const tokenObj = await models.NotificationDeviceToken.findOne({
          where: {
            deviceToken,
            userId
          }
        })

        if (tokenObj) {
          // delete the endpoint from AWS SNS
          await deleteEndpoint({ EndpointArn: tokenObj.awsARN })
          await tokenObj.destroy()
        }
      } catch (e) {
        logger.error('Error removing an outdated record from the NotificationDeviceToken table', e, bufferObj.metadata)
      }
    } else {
      logger.error('Error sending push notification to device', e)
    }
  }
}

module.exports = {
  listEndpointsByPlatformApplication,
  createPlatformEndpoint,
  publish,
  publishAnnouncement,
  deleteEndpoint,
  publishPromisified,
  drainPublishedMessages,
  drainPublishedAnnouncements
}
