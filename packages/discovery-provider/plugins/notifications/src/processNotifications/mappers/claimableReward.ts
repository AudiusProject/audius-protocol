import { Knex } from 'knex'
import { NotificationRow } from '../../types/dn'
import { ClaimableRewardNotification } from '../../types/notifications'
import { BaseNotification } from './base'
import { logger } from '../../logger'
import { sendTransactionalEmail } from '../../email/notifications/sendEmail'
import {
  buildUserNotificationSettings,
  Device
} from './userNotificationSettings'
import { email } from '../../email/notifications/preRendered/claimableReward'
import { formatImageUrl, formatProfileUrl } from '../../utils/format'
import { sendBrowserNotification } from '../../web'
import { disableDeviceArns } from '../../utils/disableArnEndpoint'
import { sendPushNotification } from '../../sns'

type ClaimableRewardRow = Omit<NotificationRow, 'data'> & {
  data: ClaimableRewardNotification
}

const messages = {
  readyToClaim: 'You have $AUDIO rewards ready to claim! '
}
export class ClaimableReward extends BaseNotification<ClaimableRewardRow> {
  userId: number
  amount: string
  receiverAccount: string
  signature: string

  constructor(dnDB: Knex, identityDB: Knex, notification: ClaimableRewardRow) {
    super(dnDB, identityDB, notification)
    try {
      const userIds = this.notification.user_ids!
      this.userId = userIds[0]
      // Change is not an absolute value and for a transfer out will always be negative
    } catch (e) {
      logger.error('Unable to initialize ClaimableReward notification', e)
    }
  }

  async processNotification({ isBrowserPushEnabled }) {
    const users = await this.getUsersBasicInfo([this.userId])
    const user = users[this.userId]
    if (!user) {
      logger.error(`Could not find user for notification ${this.userId}`)
      return
    }

    // Get the user's notification setting from identity service
    const userNotificationSettings = await buildUserNotificationSettings(
      this.identityDB,
      [user.user_id]
    )
    const title = 'Claim Your Rewards!'

    await sendBrowserNotification(
      isBrowserPushEnabled,
      userNotificationSettings,
      this.userId,
      title,
      messages.readyToClaim
    )

    if (
      userNotificationSettings.shouldSendPushNotification({
        receiverUserId: this.userId
      })
    ) {
      const devices: Device[] = userNotificationSettings.getDevices(this.userId)
      const pushes = await Promise.all(
        devices.map((device) => {
          return sendPushNotification(
            {
              type: device.type,
              badgeCount:
                userNotificationSettings.getBadgeCount(this.userId) + 1,
              targetARN: device.awsARN
            },
            {
              title,
              body: messages.readyToClaim,
              data: {
                id: `timestamp:${this.getNotificationTimestamp()}:group_id:${
                  this.notification.group_id
                }`,
                type: 'ClaimableReward',
                entityId: this.userId
              }
            }
          )
        })
      )

      await disableDeviceArns(this.identityDB, pushes)
      await this.incrementBadgeCount(this.userId)
    }

    const userEmail = userNotificationSettings.getUserEmail(user.user_id)

    await sendTransactionalEmail({
      email: userEmail,
      html: email({
        email: userEmail,
        name: user.name,
        handle: user.handle,
        profilePicture: formatImageUrl(user.profile_picture_sizes, 150),
        profileLink: formatProfileUrl(user.handle)
      }),
      subject: 'Your Reward is Ready to Claim! 🎉'
    })
  }
}
