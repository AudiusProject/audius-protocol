import { Knex } from 'knex'
import { NotificationRow, UserRow } from '../../types/dn'
import { TipSendNotification } from '../../types/notifications'
import { BaseNotification, Device } from './base'
import { sendPushNotification } from '../../sns'
import { ResourceIds, Resources } from '../../email/appNotifications/renderEmail'

type TipSendNotificationRow = Omit<NotificationRow, 'data'> & { data: TipSendNotification }
export class TipSend extends BaseNotification<TipSendNotificationRow> {

  senderUserId: number
  receiverUserId: number
  amount: number

  constructor(dnDB: Knex, identityDB: Knex, notification: TipSendNotificationRow) {
    super(dnDB, identityDB, notification)
    const userIds: number[] = this.notification.user_ids!
    this.amount = this.notification.data.amount
    this.receiverUserId = this.notification.data.receiver_user_id
    this.senderUserId = this.notification.data.receiver_user_id
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


    if (users?.[this.senderUserId]?.isDeactivated) {
      return
    }

    // Get the user's notification setting from identity service
    const userNotifications = await super.getShouldSendNotification(this.senderUserId)

    // If the user has devices to the notification to, proceed
    if ((userNotifications.mobile?.[this.senderUserId]?.devices ?? []).length > 0) {
      const devices: Device[] = userNotifications.mobile?.[this.senderUserId].devices
      await Promise.all(devices.map(device => {
        return sendPushNotification({
          type: device.type,
          badgeCount: userNotifications.mobile[this.senderUserId].badgeCount,
          targetARN: device.awsARN
        }, {
          title: 'Favorite',
          body: ``,
          data: {}
        })
      }))
      // TODO: increment badge count

    }
    // 

    if (userNotifications.browser) {
      // TODO: Send out browser

    }
    if (userNotifications.email) {
      // TODO: Send out email
    }

  }

  getResourcesForEmail(): ResourceIds {
    return {
      users: new Set([this.senderUserId, this.receiverUserId]),
    }
  }

  formatEmailProps(resources: Resources) {
    const receiverUserId = resources.users[this.receiverUserId]
    return {
      type: this.notification.type,
      receiverUserId: { name: receiverUserId.name },
      amount: this.amount
    }
  }

}
