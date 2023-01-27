import { Knex } from 'knex'
import moment from 'moment-timezone'
import { EmailFrequency } from '../../appNotifications/mappers/base'

import { logger } from '../../logger'
import { sendNotificationEmail } from './sendEmail'

const DEFAULT_TIMEZONE = 'America/Los_Angeles'

const Results = Object.freeze({
  USER_TURNED_OFF: 'USER_TURNED_OFF',
  USER_BLOCKED: 'USER_BLOCKED',
  SHOULD_SKIP: 'SHOULD_SKIP',
  ERROR: 'ERROR',
  SENT: 'SENT'
})


const user_ids_with_notifications_sql = `
WITH latest_user_seen as (
  SELECT
    DISTINCT ON(user_id),
    seen_at
  FROM
    notification_seen
  ORDER BY
    seen_at desc
)
with user_notification as (
  SELECT
    unnest(n.user_ids)
  FROM
      notification n
  WHERE
    n.timestamp > :start_offset AND
    n.user_ids && (:user_ids)
)
SELECT
  distinct(user_notification.user_id)
WHERE
  latest_user_seen is NULL OR
  latest_user_seen.seen_at < user_notification.timestamp
`

const getUsersToNotify = async (dnDb: Knex, identityDb: Knex, frequency: EmailFrequency) => {
  const now = moment()
  const days = 1
  const startOffset = now.clone().subtract(days, 'days').subtract(1, 'hour')
  const validLastEmailOffset = startOffset.subtract(2, 'hour')

  const emailUserIds: {
    blockchainUserId: number,
    email: string
  }[] = await identityDb
    .select(
      'Users.blockchainUserId',
      'Users.email'
    )
    .from('Users')
    .join('UserNotificationSettings', 'UserNotificationSettings.userId', 'Users.blockchainUserId')
    .join('NotificationEmail', 'NotificationEmail.userId', 'Users.blockchainUserId')
    .where('Users.isEmailDeliverable', true)
    .where(function () {
      this.where('NotificationEmail', null).orWhere('NotificationEmail.timestamp', '<', validLastEmailOffset)
    })
    .where('UserNotificationSettings.frequency', frequency)

  // Get All users ids what have notifications 
  const userIds = await dnDb.raw(user_ids_with_notifications_sql, {
    start_offset: startOffset,
    user_ids: [[emailUserIds]]
  })
  const validUserIds = userIds.reduce((acc, user) => {
    acc.add(user[0])
  }, new Set())
  return emailUserIds.filter(user => !validUserIds.has(user.blockchainUserId))
}

const getUserEmailNotifications = async ({
  userId,
  frequency
}: {
  userId: number
  frequency: EmailFrequency
}) => {
  // Make some query for user notifications
  return []
}


async function processEmailNotifications(dnDb: Knex, identityDb: Knex, frequency: EmailFrequency) {
  try {
    const users = await getUsersToNotify(dnDb, identityDb, frequency)
    // Validate their timezones to send at the right time!



    const currentUtcTime = moment.utc()
    const chuckSize = 20
    const results = []
    for (let chunk = 0; chunk * chuckSize < users.length; chunk += 1) {
      const start = chunk * chuckSize
      const end = (chunk + 1) * chuckSize
      const chunkResults = await Promise.all(
        users.slice(start, end).map(async (user) => {
          try {
            const userNotifications = await getUserEmailNotifications({
              userId: user.blockchainUserId,
              frequency,
            })
            const sent = await sendNotificationEmail({
              userId: user.blockchainUserId,
              email: user.email,
              frequency,
              notifications: userNotifications
            })
            if (!sent) {
              // sent could be undefined, in which case there was no email sending failure, rather the user had 0 email notifications to be sent
              if (sent === false) {
                return { result: Results.ERROR, error: 'Unable to send email' }
              }
              return {
                result: Results.SHOULD_SKIP,
                error: 'No notifications to send in email'
              }
            }
            await identityDb.insert([{
              userId: user.blockchainUserId,
              emailFrequency: frequency,
              timestamp: currentUtcTime
            }]).into('NotificationEmail')
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
      `processEmailNotifications | time after looping over users to send notification email`
    )
  } catch (e) {
    logger.error(
      'processEmailNotifications | Error processing email notifications'
    )
    logger.error(e)
  }
}
