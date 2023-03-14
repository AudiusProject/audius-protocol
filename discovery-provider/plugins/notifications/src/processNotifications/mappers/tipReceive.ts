import { Knex } from 'knex'
import { NotificationRow, UserRow } from '../../types/dn'
import { TipReceiveNotification } from '../../types/notifications'
import { BaseNotification, Device } from './base'
import { sendPushNotification } from '../../sns'
import { ResourceIds, Resources } from '../../email/notifications/renderEmail'
import { capitalize } from 'lodash'
import { formatWei } from '../../utils/format'

type TipReceiveNotificationRow = Omit<NotificationRow, 'data'> & { data: TipReceiveNotification }
export class TipReceive extends BaseNotification<TipReceiveNotificationRow> {

  senderUserId: number
  receiverUserId: number
  amount: number

  constructor(dnDB: Knex, identityDB: Knex, notification: TipReceiveNotificationRow) {
    super(dnDB, identityDB, notification)
    const userIds: number[] = this.notification.user_ids!
    this.amount = this.notification.data.amount
    this.receiverUserId = this.notification.data.receiver_user_id
    this.senderUserId = this.notification.data.sender_user_id
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

    const sendingUserName = users[this.senderUserId]?.name
    const tipAmount = formatWei(this.amount.toString(), 'sol')

    // If the user has devices to the notification to, proceed
    if ((userNotifications.mobile?.[this.receiverUserId]?.devices ?? []).length > 0) {
      const devices: Device[] = userNotifications.mobile?.[this.receiverUserId].devices
      await Promise.all(devices.map(device => {
        return sendPushNotification({
          type: device.type,
          badgeCount: userNotifications.mobile[this.receiverUserId].badgeCount + 1,
          targetARN: device.awsARN
        }, {
          title: 'You Received a Tip!',
          body: `${capitalize(sendingUserName)} sent you a tip of ${tipAmount} $AUDIO`,
          data: {}
        })
      }))
      await this.incrementBadgeCount(this.receiverUserId)
    }
    // 

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
    const sendingUser = resources.users[this.senderUserId]
    const amount = formatWei(this.amount.toString(), 'sol')
    return {
      type: this.notification.type,
      sendingUser: sendingUser,
      amount
    }
  }

}
