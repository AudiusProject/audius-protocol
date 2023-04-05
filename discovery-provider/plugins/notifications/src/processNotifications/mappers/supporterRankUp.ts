import { Knex } from 'knex'
import { NotificationRow, UserRow } from '../../types/dn'
import { SupporterRankUpNotification } from '../../types/notifications'
import { BaseNotification, Device, NotificationSettings } from './base'
import { sendPushNotification } from '../../sns'
import { ResourceIds, Resources } from '../../email/notifications/renderEmail'
import { capitalize } from '../../email/notifications/components/utils'

type SupporterRankUpNotificationRow = Omit<NotificationRow, 'data'> & {
  data: SupporterRankUpNotification
}
export class SupporterRankUp extends BaseNotification<SupporterRankUpNotificationRow> {
  senderUserId: number
  receiverUserId: number
  rank: number

  constructor(
    dnDB: Knex,
    identityDB: Knex,
    notification: SupporterRankUpNotificationRow
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

    if (users?.[this.receiverUserId]?.isDeactivated) {
      return
    }

    // Get the user's notification setting from identity service
    const userNotifications = await super.getUserNotificationSettings(
      this.receiverUserId
    )

    const sendingUserName = users[this.senderUserId]?.name

    // If the user has devices to the notification to, proceed
    if (
      (userNotifications.mobile?.[this.receiverUserId]?.devices ?? []).length >
      0
    ) {
      const userMobileSettings: NotificationSettings =
        userNotifications.mobile?.[this.receiverUserId].settings
      const devices: Device[] =
        userNotifications.mobile?.[this.receiverUserId].devices
      // If the user's settings for the follow notification is set to true, proceed
      await Promise.all(
        devices.map((device) => {
          return sendPushNotification(
            {
              type: device.type,
              badgeCount:
                userNotifications.mobile[this.receiverUserId].badgeCount + 1,
              targetARN: device.awsARN
            },
            {
              title: `#${this.rank} Top Supporter`,
              body: `${capitalize(sendingUserName)} became your #${this.rank
                } Top Supporter!`,
              data: {
                id: `timestamp:${this.getNotificationTimestamp()}:group_id:${this.notification.group_id}`,
                type: 'SupporterRankUp',
                entityId: this.senderUserId
              }
            }
          )
        })
      )
      await this.incrementBadgeCount(this.receiverUserId)
    }
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
    const sendingUser = resources.users[this.senderUserId]
    return {
      type: this.notification.type,
      sendingUser: sendingUser,
      rank: this.rank
    }
  }
}
