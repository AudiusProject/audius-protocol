import { Knex } from 'knex'
import { NotificationRow, UserRow } from '../../types/dn'
import { SupportingRankUpNotification } from '../../types/notifications'
import { BaseNotification, Device, NotificationSettings } from './base'
import { sendPushNotification } from '../../sns'
import { ResourceIds, Resources } from '../../email/notifications/renderEmail'

type SupportingRankUpNotificationRow = Omit<NotificationRow, 'data'> & {
  data: SupportingRankUpNotification
}
export class SupportingRankUp extends BaseNotification<SupportingRankUpNotificationRow> {
  senderUserId: number
  receiverUserId: number
  rank: number

  constructor(
    dnDB: Knex,
    identityDB: Knex,
    notification: SupportingRankUpNotificationRow
  ) {
    super(dnDB, identityDB, notification)
    const userIds: number[] = this.notification.user_ids!
    this.rank = this.notification.data.rank
    this.receiverUserId = this.notification.data.receiver_user_id
    this.senderUserId = this.notification.data.sender_user_id
  }

  async pushNotification() {
    const res: Array<{
      user_id: number
      name: string
      is_deactivated: boolean
    }> = await this.dnDB
      .select('user_id', 'name', 'is_deactivated')
      .from<UserRow>('users')
      .where('is_current', true)
      .whereIn('user_id', [this.receiverUserId, this.senderUserId])
    const users = res.reduce((acc, user) => {
      acc[user.user_id] = {
        name: user.name,
        isDeactivated: user.is_deactivated
      }
      return acc
    }, {} as Record<number, { name: string; isDeactivated: boolean }>)

    if (users?.[this.senderUserId]?.isDeactivated) {
      return
    }

    // Get the user's notification setting from identity service
    const userNotifications = await super.getShouldSendNotification(
      this.senderUserId
    )

    const receivingUserName = users[this.receiverUserId]?.name

    // If the user has devices to the notification to, proceed
    if (
      (userNotifications.mobile?.[this.senderUserId]?.devices ?? []).length > 0
    ) {
      const userMobileSettings: NotificationSettings =
        userNotifications.mobile?.[this.senderUserId].settings
      const devices: Device[] =
        userNotifications.mobile?.[this.senderUserId].devices
      // If the user's settings for the follow notification is set to true, proceed
      if (userMobileSettings['favorites']) {
        await Promise.all(
          devices.map((device) => {
            return sendPushNotification(
              {
                type: device.type,
                badgeCount:
                  userNotifications.mobile[this.senderUserId].badgeCount + 1,
                targetARN: device.awsARN
              },
              {
                title: `#${this.rank} Top Supporter`,
                body: `You're now ${receivingUserName}'s #${this.rank} Top Supporter!`,
                data: {}
              }
            )
          })
        )
        await this.incrementBadgeCount(this.senderUserId)
      }
    }
    //

    if (userNotifications.email) {
      // TODO: Send out email
    }
  }

  getResourcesForEmail(): ResourceIds {
    return {
      users: new Set([this.senderUserId, this.receiverUserId])
    }
  }

  formatEmailProps(resources: Resources) {
    const receivingUser = resources.users[this.receiverUserId]
    return {
      type: this.notification.type,
      receivingUser: receivingUser,
      rank: this.rank
    }
  }
}
