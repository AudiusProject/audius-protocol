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
import { sendBrowserNotification } from '../../web'

type AnnouncementNotificationRow = Omit<NotificationRow, 'data'> & {
  data: AnnouncementNotification
}
export class Announcement extends BaseNotification<AnnouncementNotificationRow> {
  receiverUserIds: number[]

  constructor(
    dnDB: Knex,
    identityDB: Knex,
    notification: AnnouncementNotificationRow
  ) {
    super(dnDB, identityDB, notification)
    this.receiverUserIds = this.notification.user_ids!
  }

  async pushNotification({
    isLiveEmailEnabled,
    isBrowserPushEnabled
  }: {
    isLiveEmailEnabled: boolean,
    isBrowserPushEnabled: boolean
  }) {
    const res: Array<{
      user_id: number
      name: string
      is_deactivated: boolean
    }> = await this.dnDB
      .select('user_id', 'name', 'is_deactivated')
      .from<UserRow>('users')
      .where('is_current', true)
      .whereIn('user_id', this.receiverUserIds)

    const users = res.reduce((acc, user) => {
      acc[user.user_id] = {
        name: user.name,
        isDeactivated: user.is_deactivated
      }
      return acc
    }, {} as Record<number, { name: string; isDeactivated: boolean }>)

    // TODO: Batch send out notifications

    const validReceiverUserIds = this.receiverUserIds.filter(
      (userId) => !(users?.[userId]?.isDeactivated ?? true)
    )
    for (const userId of validReceiverUserIds) {
      const userNotificationSettings = await buildUserNotificationSettings(
        this.identityDB,
        [userId]
      )

      const title = this.notification.data.title
      const body = this.notification.data.short_description
      await sendBrowserNotification(isBrowserPushEnabled, userNotificationSettings, userId, title, body)

      // If the user has devices to the notification to, proceed
      if (
        userNotificationSettings.shouldSendPushNotification({
          receiverUserId: userId
        })
      ) {
        const devices: Device[] = userNotificationSettings.getDevices(userId)
        // If the user's settings for the follow notification is set to true, proceed

        await Promise.all(
          devices.map((device) => {
            return sendPushNotification(
              {
                type: device.type,
                badgeCount: userNotificationSettings.getBadgeCount(userId) + 1,
                targetARN: device.awsARN
              },
              {
                title,
                body,
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
}
