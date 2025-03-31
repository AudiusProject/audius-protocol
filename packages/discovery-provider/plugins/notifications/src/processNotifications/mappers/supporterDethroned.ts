import { Knex } from 'knex'
import { NotificationRow, UserRow } from '../../types/dn'
import {
  AppEmailNotification,
  SupporterDethronedNotification
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

type SupporterDethronedNotificationRow = Omit<NotificationRow, 'data'> & {
  data: SupporterDethronedNotification
}
export class SupporterDethroned extends BaseNotification<SupporterDethronedNotificationRow> {
  tipSenderUserId: number
  tipReceiverUserId: number
  receiverUserId: number

  constructor(
    dnDB: Knex,
    identityDB: Knex,
    notification: SupporterDethronedNotificationRow
  ) {
    super(dnDB, identityDB, notification)
    const userIds: number[] = this.notification.user_ids!
    this.tipReceiverUserId = this.notification.data.receiver_user_id
    this.tipSenderUserId = this.notification.data.sender_user_id
    this.receiverUserId = this.notification.data.dethroned_user_id
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
      handle: string
      is_deactivated: boolean
    }> = await this.dnDB
      .select('user_id', 'name', 'handle', 'is_deactivated')
      .from<UserRow>('users')
      .where('is_current', true)
      .whereIn('user_id', [
        this.tipReceiverUserId,
        this.tipSenderUserId,
        this.receiverUserId
      ])
    const users = res.reduce(
      (acc, user) => {
        acc[user.user_id] = {
          name: user.name,
          handle: user.handle,
          isDeactivated: user.is_deactivated
        }
        return acc
      },
      {} as Record<
        number,
        { name: string; handle: string; isDeactivated: boolean }
      >
    )

    if (users?.[this.receiverUserId]?.isDeactivated) {
      return
    }

    const userNotificationSettings = await buildUserNotificationSettings(
      this.identityDB,
      [this.tipSenderUserId, this.receiverUserId]
    )
    const newTopSupporterHandle = users[this.tipSenderUserId]?.handle
    const supportedUserName = users[this.tipReceiverUserId]?.name

    const title = "👑 You've Been Dethroned!"
    const body = `${capitalize(
      newTopSupporterHandle
    )} dethroned you as ${supportedUserName}'s #1 Top Supporter! Tip to reclaim your spot?`
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
        initiatorUserId: this.tipSenderUserId,
        receiverUserId: this.receiverUserId
      })
    ) {
      const devices: Device[] = userNotificationSettings.getDevices(
        this.receiverUserId
      )
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
                type: 'SupporterDethroned',
                entityId: this.tipReceiverUserId,
                supportedUserId: this.tipReceiverUserId
              }
            }
          )
        })
      )
      await disableDeviceArns(this.identityDB, pushes)
      await this.incrementBadgeCount(this.receiverUserId)
    }
  }

  getResourcesForEmail(): ResourceIds {
    return {
      users: new Set([this.tipSenderUserId, this.receiverUserId])
    }
  }

  formatEmailProps(resources: Resources) {
    const receiverUser = resources.users[this.receiverUserId]
    return {
      type: this.notification.type,
      receiverUser: receiverUser
    }
  }
}
