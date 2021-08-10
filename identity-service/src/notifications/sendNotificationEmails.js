const path = require('path')
const uuidv4 = require('uuid/v4')
const moment = require('moment-timezone')
const models = require('../models')
const { logger } = require('../logging')
const fs = require('fs')

const renderEmail = require('./renderEmail')
const getEmailNotifications = require('./fetchNotificationMetadata')
const emailCachePath = './emailCache'

const {
  notificationTypes,
  dayInHours,
  weekInHours
} = require('./constants')

// Mailgun object
let mg

async function processEmailNotifications (expressApp, audiusLibs) {
  try {
    logger.info(`${new Date()} - processEmailNotifications`)

    mg = expressApp.get('mailgun')
    if (mg === null) {
      logger.error('processEmailNotifications - Mailgun not configured')
      return
    }

    let liveEmailUsers = await models.UserNotificationSettings.findAll({
      attributes: ['userId'],
      where: { emailFrequency: 'live' }
    }).map(x => x.userId)

    let dailyEmailUsers = await models.UserNotificationSettings.findAll({
      attributes: ['userId'],
      where: { emailFrequency: 'daily' }
    }).map(x => x.userId)

    let weeklyEmailUsers = await models.UserNotificationSettings.findAll({
      attributes: ['userId'],
      where: { emailFrequency: 'weekly' }
    }).map(x => x.userId)

    logger.info(`processEmailNotifications - ${liveEmailUsers.length} live users`)
    logger.info(`processEmailNotifications - ${dailyEmailUsers.length} daily users`)
    logger.info(`processEmailNotifications - ${weeklyEmailUsers.length} weekly users`)
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
    logger.info(`processEmailNotifications | time before looping over announcements | ${timeBeforeAnnouncementsLoop} | ${appAnnouncements.length} announcements`)
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
      logger.info(`processEmailNotifications | time before looping over users for announcement id ${id}, entity id ${announcementEntityId} | ${timeBeforeUserAnnouncementsLoop} | ${usersCreatedBeforeAnnouncement.length} users`)
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
      logger.info(`processEmailNotifications | time after looping over users for announcement id ${id}, entity id ${announcementEntityId} | ${timeAfterUserAnnouncementsLoop} | time elapsed is ${timeAfterUserAnnouncementsLoop - timeBeforeUserAnnouncementsLoop} | ${usersCreatedBeforeAnnouncement.length} users`)
    }
    const timeAfterAnnouncementsLoop = Date.now()
    logger.info(`processEmailNotifications | time after looping over announcements | ${timeAfterAnnouncementsLoop} | time elapsed is ${timeAfterAnnouncementsLoop - timeBeforeAnnouncementsLoop} | ${appAnnouncements.length} announcements`)

    let pendingNotificationUsers = new Set()
    // Add users with pending announcement notifications
    liveUsersWithPendingAnnouncements.forEach(
      item => pendingNotificationUsers.add(item))
    dailyUsersWithPendingAnnouncements.forEach(
      item => pendingNotificationUsers.add(item))
    weeklyUsersWithPendingAnnouncements.forEach(
      item => pendingNotificationUsers.add(item))

    // Query users with pending notifications grouped by frequency
    let liveEmailUsersWithUnseenNotifications = await models.Notification.findAll({
      attributes: ['userId'],
      where: {
        isViewed: false,
        userId: { [ models.Sequelize.Op.in ]: liveEmailUsers },
        // Over fetch users here, they will get dropped later on if they have 0 notifications
        // to process.
        // We could be more precise here by looking at the last sent email for each user
        // but that query would be more expensive than just finding extra users here and then
        // dropping them.
        timestamp: { [models.Sequelize.Op.gt]: dayAgo }
      },
      group: ['userId']
    }).map(x => x.userId)
    liveEmailUsersWithUnseenNotifications.forEach(item => pendingNotificationUsers.add(item))

    let dailyEmailUsersWithUnseeenNotifications = await models.Notification.findAll({
      attributes: ['userId'],
      where: {
        isViewed: false,
        userId: { [models.Sequelize.Op.in]: dailyEmailUsers },
        timestamp: { [models.Sequelize.Op.gt]: dayAgo }
      },
      group: ['userId']
    }).map(x => x.userId)
    dailyEmailUsersWithUnseeenNotifications.forEach(item => pendingNotificationUsers.add(item))

    let weeklyEmailUsersWithUnseeenNotifications = await models.Notification.findAll({
      attributes: ['userId'],
      where: {
        isViewed: false,
        userId: { [models.Sequelize.Op.in]: weeklyEmailUsers },
        timestamp: { [models.Sequelize.Op.gt]: weekAgo }
      },
      group: ['userId']
    }).map(x => x.userId)
    weeklyEmailUsersWithUnseeenNotifications.forEach(item => pendingNotificationUsers.add(item))

    logger.info(`processEmailNotifications - Live Email Users: ${liveEmailUsersWithUnseenNotifications}`)
    logger.info(`processEmailNotifications - Daily Email Users: ${dailyEmailUsersWithUnseeenNotifications}`)
    logger.info(`processEmailNotifications - Weekly Email Users: ${weeklyEmailUsersWithUnseeenNotifications}`)

    // All users with notifications, including announcements
    let allUsersWithUnseenNotifications = [...pendingNotificationUsers]
    logger.info(`All Pending Email Users: ${allUsersWithUnseenNotifications}`)

    let userInfo = await models.User.findAll({
      where: {
        blockchainUserId: {
          [models.Sequelize.Op.in]: allUsersWithUnseenNotifications
        }
      }
    })

    const timeBeforeUserEmailLoop = Date.now()
    logger.info(`processEmailNotifications | time before looping over users to send notification email | ${timeBeforeUserEmailLoop} | ${userInfo.length} users`)
    // For every user with pending notifications, check if they are in the right timezone
    for (let userToEmail of userInfo) {
      let userEmail = userToEmail.email
      let userId = userToEmail.blockchainUserId
      let timezone = userToEmail.timezone
      if (!timezone) {
        timezone = 'America/Los_Angeles'
      }
      let userSettings = await models.UserNotificationSettings.findOrCreate(
        { where: { userId } }
      )
      let frequency = userSettings[0].emailFrequency
      if (frequency === 'off') {
        logger.info(`processEmailNotifications | Bypassing email for user ${userId}`)
        continue
      }
      let currentUtcTime = moment.utc()
      let userTime = currentUtcTime.tz(timezone)
      let startOfUserDay = userTime.clone().startOf('day')
      let difference = moment.duration(userTime.diff(startOfUserDay)).asHours()

      let latestUserEmail = await models.NotificationEmail.findOne({
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

      // If the user is in live email mode, just send them right away
      if (frequency === 'live') {
        let sent = await renderAndSendNotificationEmail(
          userId,
          userEmail,
          appAnnouncements,
          frequency,
          lastSentTimestamp, // use lastSentTimestamp to get all new notifs
          audiusLibs
        )
        if (!sent) {
          logger.info(`processEmailNotifications | Failed to send live email to ${userId}`)
          continue
        }
        logger.info(`processEmailNotifications | Live email to ${userId}, last email from ${lastSentTimestamp}`)
        await models.NotificationEmail.create({
          userId,
          emailFrequency: frequency,
          timestamp: currentUtcTime
        })
        continue
      }

      // Based on this difference, schedule email for users
      // In prod, this difference must be <1 hour or between midnight - 1am
      let maxHourDifference = 2 // 1.5
      // Valid time found
      if (difference < maxHourDifference) {
        logger.info(`Valid email period for user ${userId}, ${timezone}, ${difference} hrs since startOfDay`)
        // if email was never sent to user, or ~1 day has passed for daily frequency, or ~1 week has passed for weekly frequency, then send email
        const isValidFrequency = ['daily', 'weekly'].includes(frequency)
        const timeSinceEmail = moment.duration(currentUtcTime.diff(lastSentTimestamp)).asHours()
        const timeThreshold = (frequency === 'daily' ? dayInHours : weekInHours) - 1
        const shouldRenderAndSend = !latestUserEmail || (isValidFrequency && timeSinceEmail >= timeThreshold)
        if (shouldRenderAndSend) {
          if (latestUserEmail) {
            logger.info(`processEmailNotifications | ${frequency === 'daily' ? 'Daily' : 'Weekly'} email to ${userId}, last email from ${lastSentTimestamp}`)
          }
          const startTime = frequency === 'daily' ? dayAgo : weekAgo
          const sent = await renderAndSendNotificationEmail(
            userId,
            userEmail,
            appAnnouncements,
            frequency,
            startTime,
            audiusLibs
          )
          if (!sent) {
            const emailType = latestUserEmail ? frequency : 'first'
            logger.info(`processEmailNotifications | Failed to send ${emailType} email to ${userId}`)
            continue
          }
          if (!latestUserEmail) {
            logger.info(`First email for ${userId}, ${frequency}, ${currentUtcTime}`)
          }
          await models.NotificationEmail.create({
            userId,
            emailFrequency: frequency,
            timestamp: currentUtcTime
          })
        }
      }
    }
    const timeAfterUserEmailLoop = Date.now()
    logger.info(`processEmailNotifications | time after looping over users to send notification email | ${timeAfterUserEmailLoop} | time elapsed is ${timeAfterUserEmailLoop - timeBeforeUserEmailLoop} | ${userInfo.length} users`)
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
    logger.info(`renderAndSendNotificationEmail | time before getEmailNotifications | ${timeBeforeEmailNotifications}`)
    const [notificationProps, notificationCount] = await getEmailNotifications(
      audiusLibs,
      userId,
      announcements,
      startTime,
      5)
    const timeAfterEmailNotifications = Date.now()
    logger.info(`renderAndSendNotificationEmail | time after getEmailNotifications | ${timeAfterEmailNotifications} | time elapsed is ${timeAfterEmailNotifications - timeBeforeEmailNotifications} | ${notificationCount} unread notifications`)

    const emailSubject = `${notificationCount} unread notification${notificationCount > 1 ? 's' : ''} on Audius`
    if (notificationCount === 0) {
      logger.info(`renderAndSendNotificationEmail | 0 notifications detected for user ${userId}, bypassing email`)
      return
    }

    let renderProps = {}
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
    if (frequency === 'live') {
      subject = liveSubjectFormat
    } else if (frequency === 'daily') {
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

    return true
  } catch (e) {
    logger.error(`Error in renderAndSendNotificationEmail ${e}`)
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

module.exports = { processEmailNotifications }
