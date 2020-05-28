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

// the aws sdk doesn't like when you set the function equal to a variable and try to call it
// eg. const func = sns.<functionname>; func() returns an error, so util.promisify doesn't work
function _promisifySNS (functionName) {
  return function (...args) {
    return new Promise(function (resolve, reject) {
      if (!accessKeyId || !secretAccessKey) {
        reject(new Error('Missing SNS config'))
      }
      sns[functionName](...args, function (err, data) {
        if (err) {
          logger.debug(`Error sending to SNS: ${err}`)
          reject(err)
        } else resolve(data)
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
function _formatIOSMessage (message, targetARN, badgeCount, playSound = true, title = null) {
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
        'sound': playSound && 'default',
        'badge': badgeCount
        // TODO: Enable title/body for iOS, makes a much better notification
        // keeping these properties here so we can use them if we want to
        // "alert": {
        //   "title" : `${title}`,
        //   "body" : `${body}`
        // },
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

/**
 * Formats a push notification in a way that's compatible with SNS for android
 * @param {String} title title of push notification
 * @param {String} message message of push notification
 * @param {String} targetARN aws arn address for device
 *                           `arn:aws:sns:us-west-1:<id>:endpoint/APNS/<namespace>/<uuid>`
 * @param {Boolean=True} playSound should play a sound when it's sent
 * NOTE: For reference on https://firebase.google.com/docs/cloud-messaging/http-server-ref
 */
function _formatAndroidMessage (message, targetARN, playSound = true, title = null) {
  let type = 'GCM'

  const jsonMessage = {
    'default': 'You have new notifications in Audius!'
  }

  if (type) {
    let messageData = {
      'notification': {
        ...(title ? { title } : {}),
        'body': message,
        'sound': playSound && 'default'
      }
    }
    jsonMessage[type] = JSON.stringify(messageData)
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

// Actually send the messages from the buffer to SNS
// If a device token is invalid attempt to remove it
//
// DON'T throw errors in this function because it stops execution,
// we want it to continue
async function drainMessageObject (bufferObj) {
  const { userId } = bufferObj
  const { message, title, playSound } = bufferObj.notificationParams

  // Ensure badge count entry exists for user
  await models.PushNotificationBadgeCounts.findOrCreate({
    where: {
      userId
    }
  })

  // Increment entry
  const incrementBadgeQuery = await models.PushNotificationBadgeCounts.increment('iosBadgeCount', { where: { userId } })

  // Parse the updated value returned from increment
  const newBadgeCount = incrementBadgeQuery[0][0][0].iosBadgeCount
  const devices = await models.NotificationDeviceToken.findAll({ where: { userId } })
  // If no devices found, short-circuit
  if (devices.length === 0) return
  // Dispatch to all devices
  await Promise.all(devices.map(async (device) => {
    const { deviceType, awsARN, deviceToken } = device
    try {
      let formattedMessage = null
      if (deviceType === 'ios') {
        formattedMessage = _formatIOSMessage(message, awsARN, newBadgeCount, playSound, title)
      }
      if (deviceType === 'android') {
        formattedMessage = _formatAndroidMessage(message, awsARN, playSound, title)
      }

      if (formattedMessage) {
        logger.debug(`Publishing SNS message: ${JSON.stringify(formattedMessage)}`)
        await publishPromisified(formattedMessage)
      }
    } catch (e) {
      if (e && e.code && (e.code === 'EndpointDisabled' || e.code === 'InvalidParameter')) {
        try {
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
  }))
}

module.exports = {
  listEndpointsByPlatformApplication,
  createPlatformEndpoint,
  drainMessageObject,
  deleteEndpoint,
  publishPromisified
}
