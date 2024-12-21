import { Knex } from 'knex'
import { NotificationRow, UserRow } from '../../types/dn'
import {
  AppEmailNotification,
  SupporterRankUpNotification
} from '../../types/notifications'
import { BaseNotification } from './base'
import { sendPushNotification } from '../../sns'
import { ResourceIds, Resources } from '../../email/notifications/renderEmail'
import { capitalize } from '../../email/notifications/components/utils'
import { sendNotificationEmail } from '../../email/notifications/sendEmail'
import {
  buildUserNotificationSettings,
  Device
} from './userNotificationSettings'
import { sendBrowserNotification } from '../../web'
import { disableDeviceArns } from '../../utils/disableArnEndpoint'

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

  async processNotification({
    isLiveEmailEnabled,
    isBrowserPushEnabled
  }: {
    isLiveEmailEnabled: boolean
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
      .whereIn('user_id', [this.receiverUserId, this.senderUserId])
    const users = res.reduce(
      (acc, user) => {
        acc[user.user_id] = {
          name: user.name,
          isDeactivated: user.is_deactivated
        }
        return acc
      },
      {} as Record<number, { name: string; isDeactivated: boolean }>
    )

    if (users?.[this.receiverUserId]?.isDeactivated) {
      return
    }

    // Get the user's notification setting from identity service
    const userNotificationSettings = await buildUserNotificationSettings(
      this.identityDB,
      [this.receiverUserId, this.senderUserId]
    )

    const sendingUserName = users[this.senderUserId]?.name

    const title = `#${this.rank} Top Supporter`
    const body = `${capitalize(sendingUserName)} became your #${
      this.rank
    } Top Supporter!`
    await sendBrowserNotification(
      isBrowserPushEnabled,
      userNotificationSettings,
      this.receiverUserId,
      title,
      body
    )

    // If the user has devices to the notification to, proceed
    if (
      userNotificationSettings.shouldSendPushNotification({
        initiatorUserId: this.senderUserId,
        receiverUserId: this.receiverUserId
      })
    ) {
      const devices: Device[] = userNotificationSettings.getDevices(
        this.receiverUserId
      )
      // If the user's settings for the follow notification is set to true, proceed
      const pushes = await Promise.all(
        devices.map((device) => {
          return sendPushNotification(
            {
              type: device.type,
              badgeCount:
                userNotificationSettings.getBadgeCount(this.receiverUserId) + 1,
              targetARN: device.awsARN
            },
            {
              title,
              body,
              data: {
                id: `timestamp:${this.getNotificationTimestamp()}:group_id:${
                  this.notification.group_id
                }`,
                type: 'SupporterRankUp',
                entityId: this.senderUserId
              }
            }
          )
        })
      )
      await disableDeviceArns(this.identityDB, pushes)
      await this.incrementBadgeCount(this.receiverUserId)
    }

    if (
      isLiveEmailEnabled &&
      userNotificationSettings.shouldSendEmailAtFrequency({
        initiatorUserId: this.senderUserId,
        receiverUserId: this.receiverUserId,
        frequency: 'live'
      })
    ) {
      const notification: AppEmailNotification = {
        receiver_user_id: this.receiverUserId,
        ...this.notification
      }
      await sendNotificationEmail({
        userId: this.receiverUserId,
        email: userNotificationSettings.getUserEmail(this.receiverUserId),
        frequency: 'live',
        notifications: [notification],
        dnDb: this.dnDB,
        identityDb: this.identityDB
      })
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
