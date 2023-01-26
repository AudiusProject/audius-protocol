import { Knex } from 'knex'
import { BaseNotification, Device } from './base'
import { UserRow } from '../../types/dn'
import { DMNotification } from '../../types/notifications'
import { sendPushNotification } from '../../sns'

export class MessageNotification extends BaseNotification {

  receiverUserId: number
  senderUserId: number

  constructor(dnDB: Knex, identityDB: Knex, notification: DMNotification) {
    super(dnDB, identityDB, notification)
    this.receiverUserId = this.notification.receiver_user_id
    this.senderUserId = this.notification.sender_user_id
  }

  async pushNotification() {

    const res: Array<{ user_id: number, name: string, is_deactivated: boolean }> = await this.dnDB.select('user_id', 'name', 'is_deactivated')
      .from<UserRow>('users')
      .where('is_current', true)
      .whereIn('user_id', [this.receiverUserId, this.senderUserId])
    const users = res.reduce((acc, user) => {
      acc[user.user_id] = { name: user.name, isDeactivated: user.is_deactivated }
      return acc
    }, {} as Record<number, { name: string, isDeactivated: boolean }>)

    if (users?.[this.receiverUserId]?.isDeactivated) {
      return
    }

    // Get the user's notification setting from identity service
    const userNotifications = await super.getShouldSendNotification(this.receiverUserId)

    // If the user has devices to the notification to, proceed
    if ((userNotifications.mobile?.[this.receiverUserId]?.devices ?? []).length > 0) {
      // const userMobileSettings: NotificationSettings = userNotifications.mobile?.[this.receiverUserId].settings
      const devices: Device[] = userNotifications.mobile?.[this.receiverUserId].devices
      // TODO If the user's settings for the DM notification is set to true, proceed
      // if (userMobileSettings['messages']) {
      await Promise.all(devices.map(device => {
        return sendPushNotification({
          type: device.type,
          badgeCount: userNotifications.mobile[this.receiverUserId].badgeCount,
          targetARN: device.awsARN
        }, {
          title: 'Message',
          body: `${users[this.senderUserId].name}: ${this.notification.message}`,
          data: {}
        })
      }))
        // TODO: increment badge count
      // }
    }

    if (userNotifications.browser) {
      // TODO: Send out browser

    }
    if (userNotifications.email) {
      // TODO: Send out email
    }

  }

}
