const path = require('path')
const uuidv4 = require('uuid/v4')
const moment = require('moment-timezone')
const models = require('../models')
const { logger } = require('../logging')
const fs = require('fs')

const renderEmail = require('./renderEmail')
const getEmailNotifications = require('./fetchNotificationMetadata')
const emailCachePath = './emailCache'
const notificationUtils = require('./utils')
const {
  notificationTypes,
  dayInHours,
  weekInHours
} = require('./constants')

// Mailgun object
let mg
const EmailFrequency = notificationUtils.EmailFrequency

const loggingContext = {
  job: 'processEmailNotifications'
}

const getUserIdsWithUnseenNotifications = async ({ userIds, gtTimeStamp }) => {
  const [notificationUserIds, solanaNotificationUserIds] = await Promise.all([
    models.Notification.findAll({
      attributes: ['userId'],
      where: {
        isViewed: false,
        userId: { [ models.Sequelize.Op.in ]: userIds },
        timestamp: { [models.Sequelize.Op.gt]: gtTimeStamp }
      },
      group: ['userId']
    }),
    models.SolanaNotification.findAll({
      attributes: ['userId'],
      where: {
        isViewed: false,
        userId: { [ models.Sequelize.Op.in ]: userIds },
        createdAt: { [models.Sequelize.Op.gt]: gtTimeStamp }
      },
      group: ['userId']
    })
  ])

  return notificationUserIds.concat(solanaNotificationUserIds).map(x => x.userId)
}

const DEFAULT_TIMEZONE = 'America/Los_Angeles'
const DEFAULT_EMAIL_FREQUENCY = EmailFrequency.LIVE

const Results = Object.freeze({
  USER_TURNED_OFF: 'USER_TURNED_OFF',
  SHOULD_SKIP: 'SHOULD_SKIP',
  ERROR: 'ERROR',
  SENT: 'SENT'
})

async function processEmailNotifications (expressApp, audiusLibs) {
  try {
    logger.info(loggingContext, `${new Date()} - processEmailNotifications`)

    mg = expressApp.get('mailgun')
    if (mg === null) {
      logger.error('processEmailNotifications - Mailgun not configured')
      return
    }

    let liveEmailUsers = await models.UserNotificationSettings.findAll({
      attributes: ['userId'],
      where: { emailFrequency: EmailFrequency.LIVE }
    }).map(x => x.userId)

    let dailyEmailUsers = await models.UserNotificationSettings.findAll({
      attributes: ['userId'],
      where: { emailFrequency: EmailFrequency.DAILY }
    }).map(x => x.userId)

    let weeklyEmailUsers = await models.UserNotificationSettings.findAll({
      attributes: ['userId'],
      where: { emailFrequency: EmailFrequency.WEEKLY }
    }).map(x => x.userId)

    logger.info({ ...loggingContext, liveEmailUsers: liveEmailUsers.length }, `processEmailNotifications - ${liveEmailUsers.length} live users`)
    logger.info({ ...loggingContext, dailyEmailUsers: dailyEmailUsers.length }, `processEmailNotifications - ${dailyEmailUsers.length} daily users`)
    logger.info({ ...loggingContext, weeklyEmailUsers: weeklyEmailUsers.length }, `processEmailNotifications - ${weeklyEmailUsers.length} weekly users`)
    let currentTime = moment.utc()
    let now = moment()
    let dayAgo = now.clone().subtract(1, 'days')
    let weekAgo = now.clone().subtract(7, 'days')

    let appAnnouncements = expressApp.get('announcements').filter(a => {
      let announcementDate = moment(a['datePublished'])
      let timeSinceAnnouncement = moment.duration(currentTime.diff(announcementDate)).asHours()
      // If the announcement is too old filter it out, it's not necessary to process.
      return timeSinceAnnouncement < (weekInHours * 1.5)
    })

    // For each announcement, we generate a list of valid users
    // Based on the user's email frequency
    let liveUsersWithPendingAnnouncements = []
    let dailyUsersWithPendingAnnouncements = []
    let weeklyUsersWithPendingAnnouncements = []

    const timeBeforeAnnouncementsLoop = Date.now()
    logger.info(loggingContext, `processEmailNotifications | time before looping over announcements | ${timeBeforeAnnouncementsLoop} | ${appAnnouncements.length} announcements`)
    for (var announcement of appAnnouncements) {
      let announcementDate = moment(announcement['datePublished'])
      let timeSinceAnnouncement = moment.duration(currentTime.diff(announcementDate)).asHours()
      let announcementEntityId = announcement['entityId']
      let id = announcement['id']
      let usersCreatedBeforeAnnouncement = await models.User.findAll({
        attributes: ['blockchainUserId'],
        where: {
          createdAt: { [models.Sequelize.Op.lt]: moment(announcementDate) }
        }
      }).map(x => x.blockchainUserId)

      const userIdsToExcludeForAnnouncement = await models.Notification.findAll({
        attributes: ['userId'],
        where: {
          isViewed: true,
          userId: { [models.Sequelize.Op.in]: usersCreatedBeforeAnnouncement },
          type: notificationTypes.Announcement,
          entityId: announcementEntityId
        }
      })
      const userIdSetToExcludeForAnnouncement = new Set(userIdsToExcludeForAnnouncement.map(u => u.userId))
      const relevantUserIdsForAnnouncement = usersCreatedBeforeAnnouncement.filter(userId => !userIdSetToExcludeForAnnouncement.has(userId))

      const timeBeforeUserAnnouncementsLoop = Date.now()
      logger.info(loggingContext, `processEmailNotifications | time before looping over users for announcement id ${id}, entity id ${announcementEntityId} | ${timeBeforeUserAnnouncementsLoop} | ${usersCreatedBeforeAnnouncement.length} users`)
      for (var user of relevantUserIdsForAnnouncement) {
        if (liveEmailUsers.includes(user)) {
          // As an added safety check, only process if the announcement was made in the last hour
          if (timeSinceAnnouncement < 1) {
            logger.info(`processEmailNotifications | Announcements - ${id} | Live user ${user}`)
            liveUsersWithPendingAnnouncements.push(user)
          }
        } else if (dailyEmailUsers.includes(user)) {
          if (timeSinceAnnouncement < (dayInHours * 1.5)) {
            logger.info(`processEmailNotifications | Announcements - ${id} | Daily user ${user}, <1 day`)
            dailyUsersWithPendingAnnouncements.push(user)
          }
        } else if (weeklyEmailUsers.includes(user)) {
          if (timeSinceAnnouncement < (weekInHours * 1.5)) {
            logger.info(`processEmailNotifications | Announcements - ${id} | Weekly user ${user}, <1 week`)
            weeklyUsersWithPendingAnnouncements.push(user)
          }
        }
      }
      const timeAfterUserAnnouncementsLoop = Date.now()
      logger.info(loggingContext, `processEmailNotifications | time after looping over users for announcement id ${id}, entity id ${announcementEntityId} | ${timeAfterUserAnnouncementsLoop} | time elapsed is ${timeAfterUserAnnouncementsLoop - timeBeforeUserAnnouncementsLoop} | ${usersCreatedBeforeAnnouncement.length} users`)
    }
    const timeAfterAnnouncementsLoop = Date.now()
    const announcementDurationSec = (timeAfterAnnouncementsLoop - timeBeforeAnnouncementsLoop) / 1000
    logger.info({ ...loggingContext, announcementDuration: announcementDurationSec }, `processEmailNotifications | time after looping over announcements | ${timeAfterAnnouncementsLoop} | time elapsed is ${announcementDurationSec} | ${appAnnouncements.length} announcements`)

    let pendingNotificationUsers = new Set()
    // Add users with pending announcement notifications
    liveUsersWithPendingAnnouncements.forEach(
      item => pendingNotificationUsers.add(item))
    dailyUsersWithPendingAnnouncements.forEach(
      item => pendingNotificationUsers.add(item))
    weeklyUsersWithPendingAnnouncements.forEach(
      item => pendingNotificationUsers.add(item))

    // Query users with pending notifications grouped by frequency

    // Over fetch users here, they will get dropped later on if they have 0 notifications
    // to process.
    // We could be more precise here by looking at the last sent email for each user
    // but that query would be more expensive than just finding extra users here and then
    // dropping them.
    const liveEmailUsersWithUnseenNotifications = await getUserIdsWithUnseenNotifications({
      userIds: liveEmailUsers,
      gtTimeStamp: dayAgo
    })
    liveEmailUsersWithUnseenNotifications.forEach(item => pendingNotificationUsers.add(item))

    const dailyEmailUsersWithUnseeenNotifications = await getUserIdsWithUnseenNotifications({
      userIds: dailyEmailUsers,
      gtTimeStamp: dayAgo
    })
    dailyEmailUsersWithUnseeenNotifications.forEach(item => pendingNotificationUsers.add(item))

    const weeklyEmailUsersWithUnseeenNotifications = await getUserIdsWithUnseenNotifications({
      userIds: weeklyEmailUsers,
      gtTimeStamp: weekAgo
    })
    weeklyEmailUsersWithUnseeenNotifications.forEach(item => pendingNotificationUsers.add(item))

    logger.info(loggingContext, `processEmailNotifications - Live Email Users: ${
      liveEmailUsersWithUnseenNotifications
    }, Daily Email Users: ${
      dailyEmailUsersWithUnseeenNotifications
    }, Weekly Email Users: ${weeklyEmailUsersWithUnseeenNotifications}`)

    // All users with notifications, including announcements
    let allUsersWithUnseenNotifications = [...pendingNotificationUsers]

    const userInfo = await models.User.findAll({
      where: {
        blockchainUserId: {
          [models.Sequelize.Op.in]: allUsersWithUnseenNotifications
        }
      }
    })

    const userNotificationSettings = await models.UserNotificationSettings.findAll({
      where: {
        userId: {
          [models.Sequelize.Op.in]: allUsersWithUnseenNotifications
        }
      }
    })

    const userFrequencyMapping = userNotificationSettings.reduce((acc, setting) => {
      acc[setting.userId] = setting.emailFrequency
      return acc
    }, {})

    const timeBeforeUserEmailLoop = Date.now()
    logger.info(loggingContext, `processEmailNotifications | time before looping over users to send notification email | ${timeBeforeUserEmailLoop} | ${userInfo.length} users`)

    const currentUtcTime = moment.utc()
    const chuckSize = 20
    const results = []
    for (let chunk = 0; chunk * chuckSize < userInfo.length; chunk += 1) {
      let start = chunk * chuckSize
      let end = (chunk + 1) * chuckSize
      const chunkResults = await Promise.all(userInfo.slice(start, end).map(async (user) => {
        try {
          let { email: userEmail, blockchainUserId: userId, timezone } = user
          if (timezone === null) { timezone = DEFAULT_TIMEZONE }
          const frequency = userFrequencyMapping[userId] || DEFAULT_EMAIL_FREQUENCY
          if (frequency === EmailFrequency.OFF) {
            logger.info(`processEmailNotifications | Bypassing email for user ${userId}`)
            return { result: Results.USER_TURNED_OFF }
          }
          const userTime = currentUtcTime.tz(timezone)

          const startOfUserDay = userTime.clone().startOf('day')
          const hrsSinceStartOfDay = moment.duration(userTime.diff(startOfUserDay)).asHours()
          const latestUserEmail = await models.NotificationEmail.findOne({
            where: {
              userId
            },
            order: [['timestamp', 'DESC']]
          })
          let lastSentTimestamp
          if (latestUserEmail) {
            lastSentTimestamp = moment(latestUserEmail.timestamp)
          } else {
            lastSentTimestamp = moment(0) // EPOCH
          }
          const shouldSend = notificationUtils.shouldSendEmail(frequency, currentUtcTime, lastSentTimestamp, hrsSinceStartOfDay)
          if (!shouldSend) {
            logger.info(`processEmailNotifications | Bypassing email for user ${userId}`)
            return { result: Results.NOT_SENT }
          }
          let startTime
          if (frequency === EmailFrequency.LIVE) {
            startTime = lastSentTimestamp
          } else if (frequency === EmailFrequency.DAILY) {
            startTime = dayAgo
          } else if (frequency === EmailFrequency.WEEKLY) {
            startTime = weekAgo
          } else {
            return { result: Results.ERROR, error: `Frequency is not valid ${frequency}` }
          }

          let sent = await renderAndSendNotificationEmail(
            userId,
            userEmail,
            appAnnouncements,
            frequency,
            startTime,
            audiusLibs
          )
          if (!sent) {
            // sent could be undefined, in which case there was no email sending failure, rather the user had 0 email notifications to be sent
            if (sent === false) {
              return { result: Results.ERROR, error: 'Unable to send email' }
            }
            return { result: Results.ERROR, error: 'No notifications to send in email' }
          }
          await models.NotificationEmail.create({
            userId,
            emailFrequency: frequency,
            timestamp: currentUtcTime
          })
          return { result: Results.SENT }
        } catch (e) {
          return { result: Results.ERROR, error: e.toString() }
        }
      }))
      results.push(...chunkResults)
    }

    const aggregatedResults = results.reduce((acc, response) => {
      if (response.result in acc) {
        acc[response.result] += 1
      } else {
        acc[response.result] = 1
      }
      if (response.result === Results.ERROR) {
        logger.info({ job: processEmailNotifications }, response.error.toString())
      }
      return acc
    }, {})
    const timeAfterUserEmailLoop = Date.now()
    const totalDuration = (timeAfterUserEmailLoop - timeBeforeUserEmailLoop) / 1000
    logger.info({ job: processEmailNotifications, duration: totalDuration, ...aggregatedResults }, `processEmailNotifications | time after looping over users to send notification email | ${timeAfterUserEmailLoop} | time elapsed is ${totalDuration} | ${userInfo.length} users`)
  } catch (e) {
    logger.error('processEmailNotifications | Error processing email notifications')
    logger.error(e)
  }
}

// Master function to render and send email for a given userId
async function renderAndSendNotificationEmail (
  userId,
  userEmail,
  announcements,
  frequency,
  startTime,
  audiusLibs
) {
  try {
    logger.info(`renderAndSendNotificationEmail | ${userId}, ${userEmail}, ${frequency}, from ${startTime}`)

    const timeBeforeEmailNotifications = Date.now()
    const [notificationProps, notificationCount] = await getEmailNotifications(
      audiusLibs,
      userId,
      announcements,
      startTime,
      5)
    const timeAfterEmailNotifications = Date.now()
    const getEmailDuration = (timeAfterEmailNotifications - timeBeforeEmailNotifications) / 1000
    logger.info(`renderAndSendNotificationEmail | time after getEmailNotifications | ${timeAfterEmailNotifications} | time elapsed is ${getEmailDuration} | ${notificationCount} unread notifications`)

    const emailSubject = `${notificationCount} unread notification${notificationCount > 1 ? 's' : ''} on Audius`
    if (notificationCount === 0) {
      logger.info(`renderAndSendNotificationEmail | 0 notifications detected for user ${userId}, bypassing email`)
      return
    }

    let renderProps = {
      copyrightYear: new Date().getFullYear().toString()
    }
    renderProps['notifications'] = notificationProps
    if (frequency === 'live') {
      renderProps['title'] = `Email - ${userEmail}`
    } else if (frequency === 'daily') {
      renderProps['title'] = `Daily Email - ${userEmail}`
    } else if (frequency === 'weekly') {
      renderProps['title'] = `Weekly Email - ${userEmail}`
    }

    let now = moment()
    let dayAgo = now.clone().subtract(1, 'days')
    let weekAgo = now.clone().subtract(7, 'days')
    let formattedDayAgo = dayAgo.format('MMMM Do YYYY')
    let shortWeekAgoFormat = weekAgo.format('MMMM Do')
    let liveSubjectFormat = `${notificationCount} unread notification${notificationCount > 1 ? 's' : ''}`
    let weeklySubjectFormat = `${notificationCount} unread notification${notificationCount > 1 ? 's' : ''} from ${shortWeekAgoFormat} - ${formattedDayAgo}`
    let dailySubjectFormat = `${notificationCount} unread notification${notificationCount > 1 ? 's' : ''} from ${formattedDayAgo}`

    let subject
    if (frequency === EmailFrequency.LIVE) {
      subject = liveSubjectFormat
    } else if (frequency === EmailFrequency.DAILY) {
      subject = dailySubjectFormat
    } else {
      subject = weeklySubjectFormat
    }

    renderProps['subject'] = subject
    const notifHtml = renderEmail(renderProps)

    const emailParams = {
      from: 'Audius <notify@audius.co>',
      to: `${userEmail}`,
      bcc: 'audius-email-test@audius.co',
      html: notifHtml,
      subject: emailSubject
    }

    // Send email
    await sendEmail(emailParams)

    // Cache on file system
    await cacheEmail({ renderProps, emailParams })

    const totalDuration = (Date.now() - timeBeforeEmailNotifications) / 1000
    logger.info({ job: 'renderAndSendNotificationEmail', totalDuration, getEmailDuration }, `renderAndSendNotificationEmail | ${userId}, ${userEmail}, in ${totalDuration} sec`)
    return true
  } catch (e) {
    logger.error(`Error in renderAndSendNotificationEmail ${e.stack}`)
    return false
  }
}

async function cacheEmail (cacheParams) {
  try {
    let uuid = uuidv4()
    let timestamp = moment().valueOf()
    let fileName = `${uuid}-${timestamp.toString()}.json`
    let filePath = path.join(emailCachePath, fileName)
    await new Promise((resolve, reject) => {
      fs.writeFile(filePath, JSON.stringify(cacheParams), (error) => {
        if (error) {
          reject(error)
        }
        resolve()
      })
    })
  } catch (e) {
    logger.error(`Error in cacheEmail ${e}`)
  }
}

async function sendEmail (emailParams) {
  return new Promise((resolve, reject) => {
    if (mg === null) {
      resolve()
    }
    mg.messages().send(emailParams, (error, body) => {
      if (error) {
        reject(error)
      }
      resolve(body)
    })
  })
}

module.exports = { renderAndSendNotificationEmail, processEmailNotifications }
