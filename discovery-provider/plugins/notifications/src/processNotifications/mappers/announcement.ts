import { Knex } from 'knex'
import { NotificationRow, TrackRow, UserRow } from '../../types/dn'
import { AnnouncementNotification } from '../../types/notifications'
import { BaseNotification, Device, NotificationSettings } from './base'
import { sendPushNotification } from '../../sns'
import { ResourceIds, Resources } from '../../email/notifications/renderEmail'

type AnnouncementNotificationRow = Omit<NotificationRow, 'data'> & { data: AnnouncementNotification }
export class Announcement extends BaseNotification<AnnouncementNotificationRow> {

  receiverUserIds: number[]

  constructor(dnDB: Knex, identityDB: Knex, notification: AnnouncementNotificationRow) {
    super(dnDB, identityDB, notification)
    this.receiverUserIds = this.notification.user_ids!
  }

  async pushNotification() {

    const res: Array<{ user_id: number, name: string, is_deactivated: boolean }> = await this.dnDB.select('user_id', 'name', 'is_deactivated')
      .from<UserRow>('users')
      .where('is_current', true)
      .whereIn('user_id', this.receiverUserIds)

    const users = res.reduce((acc, user) => {
      acc[user.user_id] = { name: user.name, isDeactivated: user.is_deactivated }
      return acc
    }, {} as Record<number, { name: string, isDeactivated: boolean }>)


    // TODO: Batch send out notifications

    const validReceiverUserIds = this.receiverUserIds.filter(userId => !(users?.[userId]?.isDeactivated ?? true))
    for (let userId of validReceiverUserIds) {
      const userNotifications = await super.getShouldSendNotification(userId)

      // If the user has devices to the notification to, proceed
      if ((userNotifications.mobile?.[userId]?.devices ?? []).length > 0) {
        const devices: Device[] = userNotifications.mobile?.[userId].devices
        // If the user's settings for the follow notification is set to true, proceed

        await Promise.all(devices.map(device => {
          return sendPushNotification({
            type: device.type,
            badgeCount: userNotifications.mobile[userId].badgeCount,
            targetARN: device.awsARN
          }, {
            title: this.notification.data.title,
            body: this.notification.data.short_description,
            data: {}
          })
        }))
        // TODO: increment badge count
      }
      if (userNotifications.browser) {
        // TODO: Send out browser

      }
      if (userNotifications.email) {
        // TODO: Send out email
      }

    }

  }

  getResourcesForEmail(): ResourceIds {
    return {}
  }

  formatEmailProps(resources: Resources) {
    return { type: this.notification.type }
  }

}
