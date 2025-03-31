import { Knex } from 'knex'
import { logger } from './../../logger'
import { BaseNotification } from './base'
import { UserRow } from '../../types/dn'
import { DMReactionNotification } from '../../types/notifications'
import { sendPushNotification } from '../../sns'
import {
  buildUserNotificationSettings,
  Device
} from './userNotificationSettings'
import { sendBrowserNotification } from '../../web'
import { disableDeviceArns } from '../../utils/disableArnEndpoint'

export class MessageReaction extends BaseNotification<DMReactionNotification> {
  receiverUserId: number
  senderUserId: number

  constructor(
    dnDB: Knex,
    identityDB: Knex,
    notification: DMReactionNotification
  ) {
    super(dnDB, identityDB, notification)
    this.receiverUserId = this.notification.receiver_user_id
    this.senderUserId = this.notification.sender_user_id
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
      logger.info(
        `Not sending notifications: receiver ${this.receiverUserId} is deactivated`
      )
      return
    }

    // Get the user's notification setting from identity service
    const userNotificationSettings = await buildUserNotificationSettings(
      this.identityDB,
      [this.receiverUserId, this.senderUserId]
    )

    const title = 'Reaction'
    const body = `${users[this.senderUserId].name} reacted ${
      this.notification.reaction
    }`

    if (
      userNotificationSettings.isNotificationTypeBrowserEnabled(
        this.receiverUserId,
        'messages'
      )
    ) {
      await sendBrowserNotification(
        isBrowserPushEnabled,
        userNotificationSettings,
        this.receiverUserId,
        title,
        body
      )
    } else {
      logger.info(
        `Not sending browser notification: receiver ${this.receiverUserId} does not have browser notifications enabled for messages`
      )
    }

    const pushNotificationsEnabled =
      userNotificationSettings.isNotificationTypeEnabled(
        this.receiverUserId,
        'messages'
      )
    if (!pushNotificationsEnabled) {
      logger.info(
        `Not sending push notification: receiver ${this.receiverUserId} does not have push notifications enabled for messages`
      )
    }

    // If the user has devices to the notification to, proceed
    if (
      userNotificationSettings.shouldSendPushNotification({
        initiatorUserId: this.senderUserId,
        receiverUserId: this.receiverUserId
      }) &&
      pushNotificationsEnabled
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
                type: 'MessageReaction',
                chatId: this.notification.chat_id,
                messageId: this.notification.message_id
              }
            }
          )
        })
      )
      await disableDeviceArns(this.identityDB, pushes)
      await this.incrementBadgeCount(this.receiverUserId)
    }
  }
}
