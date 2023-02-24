import { Knex } from 'knex'
import { NotificationRow, UserRow } from '../../types/dn'
import { SupporterDethronedNotification } from '../../types/notifications'
import { BaseNotification, Device } from './base'
import { sendPushNotification } from '../../sns'
import { ResourceIds, Resources } from '../../email/notifications/renderEmail'
import { capitalize } from '../../email/notifications/components/utils'

type SupporterDethronedNotificationRow = Omit<NotificationRow, 'data'> & { data: SupporterDethronedNotification }
export class SupporterDethroned extends BaseNotification<SupporterDethronedNotificationRow> {

  senderUserId: number
  receiverUserId: number
  dethronedUserId: number

  constructor(dnDB: Knex, identityDB: Knex, notification: SupporterDethronedNotificationRow) {
    super(dnDB, identityDB, notification)
    const userIds: number[] = this.notification.user_ids!
    this.receiverUserId = this.notification.data.receiver_user_id
    this.senderUserId = this.notification.data.sender_user_id
    this.dethronedUserId = this.notification.data.dethroned_user_id
  }

  async pushNotification() {
    console.log('mde to push')

    const res: Array<{ user_id: number, name: string, handle: string, is_deactivated: boolean }> = await this.dnDB.select('user_id', 'name', 'handle', 'is_deactivated')
      .from<UserRow>('users')
      .where('is_current', true)
      .whereIn('user_id', [this.receiverUserId, this.senderUserId, this.dethronedUserId])
    const users = res.reduce((acc, user) => {
      acc[user.user_id] = { name: user.name, handle: user.handle, isDeactivated: user.is_deactivated }
      return acc
    }, {} as Record<number, { name: string, handle: string, isDeactivated: boolean }>)


    if (users?.[this.dethronedUserId]?.isDeactivated) {
      return
    }

    const userNotifications = await super.getShouldSendNotification(this.dethronedUserId)
    const newTopSupporterHandle = users[this.senderUserId]?.handle
    const supportedUserName = users[this.receiverUserId]?.name
    // If the user has devices to the notification to, proceed
    if ((userNotifications.mobile?.[this.dethronedUserId]?.devices ?? []).length > 0) {
      const devices: Device[] = userNotifications.mobile?.[this.dethronedUserId].devices
      await Promise.all(devices.map(device => {
        return sendPushNotification({
          type: device.type,
          badgeCount: userNotifications.mobile[this.dethronedUserId].badgeCount,
          targetARN: device.awsARN
        }, {
          title: "👑 You've Been Dethroned!",
          body: `${capitalize(
            newTopSupporterHandle
          )} dethroned you as ${supportedUserName}'s #1 Top Supporter! Tip to reclaim your spot?`
          ,
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
    }
  }

}
