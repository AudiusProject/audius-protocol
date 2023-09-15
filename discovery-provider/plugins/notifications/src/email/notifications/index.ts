import { Knex } from 'knex'
import moment, { Moment } from 'moment-timezone'
import { config } from '../../config'
import {
  DMEmailNotification,
  EmailNotification
} from '../../types/notifications'
import { DMEntityType } from './types'

import { logger } from '../../logger'
import { sendNotificationEmail } from './sendEmail'
import {
  EmailFrequency,
  buildUserNotificationSettings
} from '../../processNotifications/mappers/userNotificationSettings'
import {
  MappingFeatureName,
  NotificationsScheduledEmails,
  RemoteConfig,
  ScheduledEmailPluginMappings
} from '../../remoteConfig'
import { notificationTypeMapping } from '../../processNotifications/indexAppNotifications'

// blockchainUserId => email
export type EmailUsers = {
  [blockchainUserId: number]: string
}

type UserEmailNotification = {
  user: {
    blockchainUserId: number
    email: string
  }
  notifications: EmailNotification[]
}

const Results = Object.freeze({
  USER_TURNED_OFF: 'USER_TURNED_OFF',
  USER_BLOCKED: 'USER_BLOCKED',
  SHOULD_SKIP: 'SHOULD_SKIP',
  ERROR: 'ERROR',
  SENT: 'SENT'
})

export const getUsersCanNotifyQuery = async (
  identityDb: Knex,
  startOffset: moment.Moment,
  frequency: EmailFrequency,
  pageCount: number,
  lastUser: number
) =>
  await identityDb
    .with(
      'lastEmailSentAt',
      identityDb.raw(`
        SELECT DISTINCT ON ("userId")
          "userId",
          "timestamp"
        FROM "NotificationEmails"
        ORDER BY "userId", "timestamp" DESC
      `)
    )
    .select('Users.blockchainUserId', 'Users.email')
    .from('Users')
    .join(
      'UserNotificationSettings',
      'UserNotificationSettings.userId',
      'Users.blockchainUserId'
    )
    .leftJoin(
      'lastEmailSentAt',
      'lastEmailSentAt.userId',
      'Users.blockchainUserId'
    )
    .where('Users.isEmailDeliverable', true)
    .where(function () {
      this.where('lastEmailSentAt.timestamp', null).orWhere(
        'lastEmailSentAt.timestamp',
        '<',
        startOffset
      )
    })
    .modify(function (queryBuilder: Knex.QueryBuilder) {
      // This logic is to handle a 'live' frequency exception for message notifications so as to not spam users with
      // live email notifications for every new message action.
      // New messages/reactions do not trigger live email notifications but are included in existing live emails scheduled to go out.
      // If a user with frequency='live' receives messages but no other notifications to trigger a live email since validLastEmailOffset,
      // they'll receive a daily email with the message notifications.
      // No other notification types for the live users since validLastEmailOffset should be included in the daily
      // email because they would have triggered an email notification immediately.
      if (frequency == 'daily') {
        queryBuilder.where(function () {
          this.where(
            'UserNotificationSettings.emailFrequency',
            frequency
          ).orWhere('UserNotificationSettings.emailFrequency', 'live')
        })
      } else {
        queryBuilder.where('UserNotificationSettings.emailFrequency', frequency)
      }
    })
    .where('Users.blockchainUserId', '>', lastUser)
    .limit(pageCount)
    .orderBy('Users.blockchainUserId')

export const appNotificationsSql = `
WITH latest_user_seen AS (
  SELECT DISTINCT ON (user_id)
    user_id,
    seen_at
  FROM
    notification_seen
  WHERE
    user_id = ANY(:user_ids) AND
    (seen_at IS NULL OR seen_at <= :start_offset)
  ORDER BY
    user_id,
    seen_at desc
)
SELECT
  n.id,
  n.specifier,
  n.group_id,
  n.type,
  n.slot,
  n.blocknumber,
  n.timestamp,
  n.data,
  latest_user_seen.user_id AS receiver_user_id
FROM (
  SELECT *
  FROM notification
  WHERE
    notification.timestamp > :start_offset AND
    notification.user_ids && (:user_ids)
) AS n
LEFT JOIN latest_user_seen ON latest_user_seen.user_id = ANY(n.user_ids)
WHERE
  latest_user_seen.seen_at is NULL OR
  latest_user_seen.seen_at < n.timestamp
`
const messageNotificationsSql = `
WITH members_can_notify AS (
  SELECT user_id, chat_id
  FROM chat_member
  WHERE
    user_id = ANY(:user_ids) AND
    (last_active_at IS NULL OR last_active_at <= :start_offset)
)
SELECT
  chat_message.user_id AS sender_user_id,
  members_can_notify.user_id AS receiver_user_id
FROM chat_message
JOIN members_can_notify ON chat_message.chat_id = members_can_notify.chat_id
WHERE chat_message.created_at > :start_offset AND chat_message.created_at <= :end_offset AND chat_message.user_id != members_can_notify.user_id
`
const reactionNotificationsSql = `
WITH members_can_notify AS (
  SELECT user_id, chat_id
  FROM chat_member
  WHERE
    user_id = ANY(:user_ids) AND
    (last_active_at IS NULL OR last_active_at <= :start_offset)
)
SELECT
  chat_message_reactions.user_id AS sender_user_id,
  chat_message.user_id AS receiver_user_id
FROM chat_message_reactions
JOIN chat_message ON chat_message.message_id = chat_message_reactions.message_id
JOIN members_can_notify on members_can_notify.chat_id = chat_message.chat_id AND members_can_notify.user_id = chat_message.user_id
WHERE chat_message_reactions.updated_at > :start_offset AND chat_message_reactions.updated_at <= :end_offset AND chat_message_reactions.user_id != members_can_notify.user_id
`

const getNotifications = async (
  dnDb: Knex,
  frequency: EmailFrequency,
  startOffset: moment.Moment,
  userIds: string[],
  remoteConfig: RemoteConfig
): Promise<EmailNotification[]> => {
  // NOTE: Temp while testing DM notifs on staging
  const appNotificationsResp = await dnDb.raw(appNotificationsSql, {
    start_offset: startOffset,
    user_ids: [[userIds]]
  })
  let appNotifications: EmailNotification[] = appNotificationsResp.rows

  // filter for only enabled notifications in MappingFeatureName
  // on optimizely
  appNotifications = appNotifications.filter((notification) => {
    if (notificationTypeMapping[notification.type]) {
      const featureEnabled = remoteConfig.getFeatureVariableEnabled(
        MappingFeatureName,
        notificationTypeMapping[notification.type]
      )
      return featureEnabled
    }
    return false
  })

  // This logic is to handle a 'live' frequency exception for message notifications so as to not spam users with
  // live email notifications for every new message action.
  // New messages/reactions do not trigger live email notifications but are included in existing live emails scheduled to go out.
  // If a user with frequency='live' receives messages but no other notifications to trigger a live email in the past day,
  // they'll receive a daily email with the message notifications.
  let messageUserIds: string[] | number[] = userIds
  if (frequency == 'live') {
    // Only query for unread messages and reactions for users with app notifications scheduled to go out in this live email.
    if (appNotifications.length == 0) {
      return appNotifications
    }
    const userIdsWithAppNotifications = appNotifications.reduce(
      (acc, notification) => {
        acc.push(notification.receiver_user_id)
        return acc
      },
      [] as number[]
    )
    messageUserIds = userIdsWithAppNotifications
  }

  const messageStartOffset = new Date(
    startOffset.valueOf() - config.dmNotificationDelay
  ).toISOString()
  const messageEndOffset = new Date(
    Date.now() - config.dmNotificationDelay
  ).toISOString()
  const messagesResp = await dnDb.raw(messageNotificationsSql, {
    start_offset: messageStartOffset,
    end_offset: messageEndOffset,
    user_ids: [[messageUserIds]]
  })
  const messages: { sender_user_id: number; receiver_user_id: number }[] =
    messagesResp.rows
  const messageNotifications: DMEmailNotification[] = messages.map((n) => ({
    type: DMEntityType.Message,
    sender_user_id: n.sender_user_id,
    receiver_user_id: n.receiver_user_id
  }))
  const reactionsResp = await dnDb.raw(reactionNotificationsSql, {
    start_offset: messageStartOffset,
    end_offset: messageEndOffset,
    user_ids: [[messageUserIds]]
  })
  const reactions: { sender_user_id: number; receiver_user_id: number }[] =
    reactionsResp.rows
  const reactionNotifications: DMEmailNotification[] = reactions.map((n) => ({
    type: DMEntityType.Reaction,
    sender_user_id: n.sender_user_id,
    receiver_user_id: n.receiver_user_id
  }))

  return appNotifications
    .concat(messageNotifications)
    .concat(reactionNotifications)
}

// Group notifications by user
const groupNotifications = (
  notifications: EmailNotification[],
  users: EmailUsers
): UserEmailNotification[] => {
  const userNotifications: UserEmailNotification[] = []
  notifications.forEach((notification) => {
    const userNotificationsIndex = userNotifications.findIndex(
      ({ user }) => user.blockchainUserId == notification.receiver_user_id
    )
    if (userNotificationsIndex == -1) {
      // Add entry for user in userNotifications
      const userEmail = users[notification.receiver_user_id]
      if (userEmail) {
        userNotifications.push({
          user: {
            blockchainUserId: notification.receiver_user_id,
            email: users[notification.receiver_user_id]
          },
          notifications: [notification]
        })
      }
    } else {
      // Add to user's notification list in userNotifications
      if (
        notification.type == DMEntityType.Message ||
        notification.type == DMEntityType.Reaction
      ) {
        // Only include 1 notification row per <sender, receiver> DM pair even if there are multiple unread messages
        const existingNotificationFromSenderIndex = userNotifications[
          userNotificationsIndex
        ].notifications.findIndex(
          (processedNotification) =>
            (processedNotification.type == DMEntityType.Message ||
              processedNotification.type == DMEntityType.Reaction) &&
            (processedNotification as DMEmailNotification).sender_user_id ==
              (notification as DMEmailNotification).sender_user_id
        )
        if (existingNotificationFromSenderIndex == -1) {
          userNotifications[userNotificationsIndex].notifications.push(
            notification
          )
        } else {
          ;(
            userNotifications[userNotificationsIndex].notifications[
              existingNotificationFromSenderIndex
            ] as DMEmailNotification
          ).multiple = true
        }
      } else {
        userNotifications[userNotificationsIndex].notifications.push(
          notification
        )
      }
    }
  })
  return userNotifications
}

export async function processEmailNotifications(
  dnDb: Knex,
  identityDb: Knex,
  frequency: EmailFrequency,
  remoteConfig: RemoteConfig
) {
  try {
    const now = moment.utc()
    let days = 1
    if (frequency == 'weekly') {
      days = 7
    }
    const startOffset = now.clone().subtract(days, 'days')

    // loop settings
    const pageCount = remoteConfig.getFeatureVariableValue(
      NotificationsScheduledEmails,
      ScheduledEmailPluginMappings.PageCount,
      1000
    )
    let pageOffset = 0
    let lastUser: number = 0

    // timeout settings since we run an infinite loop
    const time = Date.now()
    const timeoutMillis = 14400000
    const timeout = time + timeoutMillis

    while (true) {
      const now = Date.now()
      if (now > timeout) return
      logger.info(
        `processEmailNotifications | gathering users for ${frequency} query ${startOffset} ${pageCount}`
      )
      const userRows: { blockchainUserId: number; email: string }[] =
        await getUsersCanNotifyQuery(
          identityDb,
          startOffset,
          frequency,
          pageCount,
          lastUser
        )
      pageOffset = pageOffset + pageCount
      if (userRows.length === 0) return // once we've reached the end of users for this query
      lastUser = userRows[userRows.length - 1].blockchainUserId
      if (lastUser === undefined) {
        logger.info('no last user found')
        return
      }
      const emailUsers = userRows.reduce((acc, user) => {
        acc[user.blockchainUserId] = user.email
        return acc
      }, {} as EmailUsers)
      if (Object.keys(emailUsers).length == 0) {
        logger.info(
          `processEmailNotifications | No users to process. Exiting...`
        )
        return
      }

      logger.info(
        `processEmailNotifications | Beginning processing ${
          Object.keys(emailUsers).length
        } users at ${frequency} frequency`
      )

      await processGroupOfEmails(
        dnDb,
        identityDb,
        emailUsers,
        frequency,
        startOffset,
        remoteConfig
      )
    }
  } catch (e) {
    logger.error(
      'processEmailNotifications | Error processing email notifications'
    )
    logger.error(e)
  }
}

const processGroupOfEmails = async (
  dnDb: Knex,
  identityDb: Knex,
  users: EmailUsers,
  frequency: EmailFrequency,
  startOffset: Moment,
  remoteConfig: RemoteConfig
) => {
  const userNotificationSettings = await buildUserNotificationSettings(
    identityDb,
    Object.keys(users).map(Number)
  )

  const notifications = await getNotifications(
    dnDb,
    frequency,
    startOffset,
    Object.keys(users),
    remoteConfig
  )
  const groupedNotifications = groupNotifications(notifications, users)

  const currentUtcTime = moment.utc()
  const chunkSize = 20
  const results = []
  let numEmailsSent = 0
  for (
    let chunk = 0;
    chunk * chunkSize < groupedNotifications.length;
    chunk += 1
  ) {
    const start = chunk * chunkSize
    const end = (chunk + 1) * chunkSize
    const chunkResults = await Promise.all(
      groupedNotifications
        .slice(start, end)
        .map(async (userNotifications: UserEmailNotification) => {
          try {
            if (
              !userNotificationSettings.shouldSendEmailAtFrequency({
                receiverUserId: userNotifications.user.blockchainUserId,
                frequency
              })
            ) {
              return {
                result: Results.SHOULD_SKIP,
                error: 'User turned off or is abusive'
              }
            }

            const user = userNotifications.user
            const notifications = userNotifications.notifications
            // Set the timezone
            const sendAt = userNotificationSettings.getUserSendAt(
              user.blockchainUserId
            )
            const sent = await sendNotificationEmail({
              userId: user.blockchainUserId,
              email: user.email,
              frequency,
              notifications,
              dnDb,
              identityDb,
              sendAt: frequency !== 'live' ? sendAt : null
            })
            if (!sent) {
              // sent could be undefined, in which case there was no email sending failure, rather the user had 0 email notifications to be sent
              if (sent === false) {
                return {
                  result: Results.ERROR,
                  error: 'Unable to send email'
                }
              }
              return {
                result: Results.SHOULD_SKIP,
                error: 'No notifications to send in email'
              }
            }
            numEmailsSent += 1
            await identityDb
              .insert([
                {
                  userId: user.blockchainUserId,
                  emailFrequency: frequency,
                  timestamp: currentUtcTime,
                  createdAt: currentUtcTime,
                  updatedAt: currentUtcTime
                }
              ])
              .into('NotificationEmails')
            return { result: Results.SENT }
          } catch (e) {
            return { result: Results.ERROR, error: e.toString() }
          }
        })
    )
    results.push(...chunkResults)
  }

  logger.info(
    {
      job: processEmailNotifications
    },
    `processEmailNotifications | finished looping over users to send notification emails, sent ${numEmailsSent} ${frequency} emails`
  )
}
