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

const getDryRun = (envVar: string | undefined): boolean => {
  if (envVar === undefined) return true
  return envVar.toLowerCase() === "true"
}

export const configureAnnouncmentDryRun = () => {
  const dryRun = getDryRun(process.env.ANNOUNCEMENTS_DRY_RUN)
  logger.info(`announcements configured ${dryRun ? "" : "not"} for dry run`)
  globalThis.announcementDryRun = dryRun
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
    isLiveEmailEnabled
  }: {
    isLiveEmailEnabled: boolean
  }) {
    const isDryRun: boolean = globalThis.announcementDryRun
    const res_count = await this.dnDB('users')
      .count('user_id')
      .where('is_current', true)
      //.where('is_deactivated', false)
      .first()

    // this isn't good if the res is a string
    const count = res_count.count as number
    let offset = 0 // let binding because we re-assign
    const page_count = 1000 // only pull this many users into mem at a time

    const total_start = new Date().getTime()

    // naive but it works
    // adds extra page to total count so we get the last page of trailing users
    while (offset < (count + page_count)) {
      const start = new Date().getTime()
      // query next page
      const res = await fetchUsersPage(this.dnDB, offset, page_count)
      const elapsed = new Date().getTime() - start
      logger.info(
        `count: ${count} offset: ${offset} from: [${res[0].user_id}:${res[res.length - 1].user_id}] queried in ${elapsed} ms`
      )

      offset = res[res.length - 1].user_id + 1
      const validReceiverUserIds = res.map((user) => user.user_id)
      if (!isDryRun) {
        await this.broadcastAnnouncement(validReceiverUserIds, isLiveEmailEnabled)
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
      })
    ) {
      const notification: AppEmailNotification = {
        receiver_user_id: userId,
        ...this.notification
      }
      await sendNotificationEmail({
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
export const fetchUsersPage = async (dnDb: Knex, offset: number, page_count: number): Promise<{ user_id: number; name: string; is_deactivated: boolean }[]> =>
  {
    return await dnDb
        .select('user_id', 'name', 'is_deactivated')
        .from<UserRow>('users')
        // query by last id seen
        .where('user_id', '>', offset)
        .andWhere('is_current', true)
        // .andWhere('is_deactivated', false)
        .orWhere((inner) =>
          inner.where('user_id', '=', offset)
            .andWhere('is_current', true)
        )
        .andWhere('is_deactivated', false)
        // order by established index, this keeps perf constant
        // .orderBy(['user_id', 'is_current', 'txhash'])
        .limit(page_count)
  }
