import { Knex } from 'knex'
import { NotificationRow, UserRow } from '../../types/dn'
import {
  AnnouncementNotification,
  AppEmailNotification
} from '../../types/notifications'
import { BaseNotification } from './base'
import { sendPushNotification } from '../../sns'
import { ResourceIds, Resources } from '../../email/notifications/renderEmail'
import { sendNotificationEmail } from '../../email/notifications/sendEmail'
import {
  buildUserNotificationSettings,
  Device
} from './userNotificationSettings'
import { UserNotificationSettings } from './userNotificationSettings'
import { logger } from '../../logger'

const getEnv = (envVar: string | undefined, defaultVal?: boolean): boolean => {
  if (envVar === undefined && defaultVal === undefined) return true
  if (envVar === undefined) return defaultVal
  return envVar.toLowerCase() === "true"
}

export const configureAnnouncement = () => {
  const dryRun = getEnv(process.env.ANNOUNCEMENTS_DRY_RUN)
  const announcementEmailEnabled = getEnv(process.env.ANNOUNCEMENTS_EMAIL_ENABLED, false)
  logger.info(`announcements configured ${dryRun ? "" : "not"} for dry run`)
  globalThis.announcementDryRun = dryRun
  globalThis.announcementEmailEnabled = announcementEmailEnabled
}

type AnnouncementNotificationRow = Omit<NotificationRow, 'data'> & {
  data: AnnouncementNotification
}
export class Announcement extends BaseNotification<AnnouncementNotificationRow> {

  constructor(
    dnDB: Knex,
    identityDB: Knex,
    notification: AnnouncementNotificationRow
  ) {
    super(dnDB, identityDB, notification)
  }

  async pushNotification({
    isLiveEmailEnabled,
    isBrowserPushEnabled
  }: {
    isLiveEmailEnabled: boolean,
    isBrowserPushEnabled: boolean
  }) {
    const isDryRun: boolean = globalThis.announcementDryRun
    const totalUsers = await this.dnDB('users').max('user_id').where('is_current', true).andWhere('is_deactivated', false)
    // convert to number
    const totalCurrentUsers = parseInt(totalUsers[0].count as string)
    let offset = 0 // let binding because we re-assign
    // set initial user to very far in past
    const pageCount = 1000 // only pull this many users into mem at a time

    const total_start = new Date().getTime()

    // use user_id and created_at index for perf
    let lastUser = 0
    const maxUserId = totalCurrentUsers + pageCount

    while (offset < maxUserId) {
      const start = new Date().getTime()
      // query next page
      const res = await fetchUsersPage(this.dnDB, lastUser, pageCount)
      const elapsed = new Date().getTime() - start
      logger.info(
        `offset: ${offset} to: ${maxUserId} queried in ${elapsed} ms`
      )
      offset = offset + pageCount

      const lastUserFromPage = res[res.length - 1]
      if (lastUserFromPage === undefined) {
        logger.info("no last user found")
        break
      }
      lastUser = lastUserFromPage.user_id

      const validReceiverUserIds = res.map((user) => user.user_id)

      if (!isDryRun) {
        await this.broadcastAnnouncement(validReceiverUserIds, isLiveEmailEnabled)
      }

      if (validReceiverUserIds.includes(maxUserId)) {
        logger.info(`reached highest user id ${maxUserId}`)
        break
      }
    }
    const total_elapsed = new Date().getTime() - total_start
    logger.info(`announcement complete in ${total_elapsed} ms`)
  }

  getResourcesForEmail(): ResourceIds {
    return {}
  }

  formatEmailProps(resources: Resources) {
    return {
      type: this.notification.type,
      title: this.notification.data.title,
      text: this.notification.data.short_description
    }
  }

  async broadcastAnnouncement(userIds: number[], isLiveEmailEnabled: boolean) {
    const userNotificationSettings = await buildUserNotificationSettings(this.identityDB, userIds)
    for (const userId of userIds) {
      await this.broadcastPushNotificationAnnouncements(userId, userNotificationSettings)
      await this.broadcastEmailAnnouncements(isLiveEmailEnabled, userId, userNotificationSettings)
    }
  }

  async broadcastPushNotificationAnnouncements(userId: number, userNotificationSettings: UserNotificationSettings) {
    if (
      userNotificationSettings.shouldSendPushNotification({
        receiverUserId: userId
      })
    ) {
      const devices: Device[] = userNotificationSettings.getDevices(userId)
      // If the user's settings for the follow notification is set to true, proceed
  
      await Promise.all(
        devices.map((device) => {
          // this may get rate limited by AWS
          return sendPushNotification(
            {
              type: device.type,
              badgeCount: userNotificationSettings.getBadgeCount(userId) + 1,
              targetARN: device.awsARN
            },
            {
              title: this.notification.data.title,
              body: this.notification.data.short_description,
              data: {
                id: `timestamp:${this.getNotificationTimestamp()}:group_id:${
                  this.notification.group_id
                }`,
                type: 'Announcement'
              }
            }
          )
        })
      )
      await this.incrementBadgeCount(userId)
    }
  }

  async broadcastEmailAnnouncements(isLiveEmailEnabled: boolean, userId: number, userNotificationSettings: UserNotificationSettings) {
    if (
      isLiveEmailEnabled &&
      userNotificationSettings.shouldSendEmailAtFrequency({
        receiverUserId: userId,
        frequency: 'live'
      }) &&
      globalThis.announcementEmailEnabled
    ) {
      const notification: AppEmailNotification = {
        receiver_user_id: userId,
        ...this.notification
      }
      sendNotificationEmail({
        userId: userId,
        email: userNotificationSettings.getUserEmail(userId),
        frequency: 'live',
        notifications: [notification],
        dnDb: this.dnDB,
        identityDb: this.identityDB
      })
    }
  }
}

/**
 * fetches user rows based on pagination parameters, control over which page is elevated to
 * the caller
 * @param dnDb discovery node db
 * @param offset the start of this "window" of user ids, user ids aren't created 
 * in order anymore but they're still numeric and unique and thus can be paginated through
 * in this way
 * @param page_count how many records are returned in (default) ascending order after the offset
 * @returns a minified version of UserRow for usage in announcements
 */
export const fetchUsersPage = async (dnDb: Knex, lastUser: number, pageCount: number): Promise<{ user_id: number; name: string; is_deactivated: boolean }[]> =>
    await dnDb
      .select('name', 'is_deactivated', 'user_id')
      .from<UserRow>('users')
      .where('user_id', '>', lastUser)
      .andWhere('is_current', true)
      .andWhere('is_deactivated', false)
      .limit(pageCount)
      .orderBy('user_id')
